
import { GoogleGenAI } from "@google/genai";
import { AnalysisReport, AnalysisMode, AnalysisStyle, Language } from "../types";

// --- ROBUST MODEL STRATEGY ---
// We try these models in order. If one fails (404 Not Found, 429 Rate Limit), 
// we automatically switch to the next one.
const MODELS_TO_TRY = [
    'gemini-2.0-flash-exp',     // 1. Newest, often has separate experimental quota
    'gemini-1.5-flash',         // 2. Standard Flash
    'gemini-1.5-flash-latest',  // 3. Alias
    'gemini-1.5-flash-001',     // 4. Stable Version
    'gemini-1.5-flash-8b',      // 5. Lightweight/Fast
    'gemini-1.5-pro'            // 6. High Intelligence Fallback
];

const getApiKey = () => {
  let key = '';

  // 1. Try Vite (Client-side standard)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
    // @ts-ignore
    key = import.meta.env.VITE_API_KEY;
  }
  // 2. Try User Custom Name
  // @ts-ignore
  else if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_KEY) {
    // @ts-ignore
    key = import.meta.env.VITE_KEY;
  }
  // 3. Try Next.js Public
  else if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_KEY) {
    key = process.env.NEXT_PUBLIC_API_KEY || '';
  }
  // 4. Try Process Env
  else if (typeof process !== 'undefined' && process.env?.API_KEY) {
    key = process.env.API_KEY || '';
  }

  return key?.trim();
};

const resizeImage = (base64Str: string, maxWidth = 512): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // High contrast background helps detection
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        // Reduce quality slightly to speed up upload
        resolve(canvas.toDataURL('image/jpeg', 0.6)); 
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

const getSystemInstruction = (mode: AnalysisMode, style: AnalysisStyle, lang: Language) => {
  const langInst = lang === 'tr' ? "OUTPUT LANGUAGE: TURKISH (Türkçe)." : "OUTPUT LANGUAGE: ENGLISH.";
  
  return `
    SYSTEM ROLE: You are an advanced Biometric AI Engine.
    TASK: Analyze the facial features of the uploaded image and find a resemblance to a historical figure or celebrity.
    ${langInst}
    
    CONFIGURATION:
    - MODE: ${mode}
    - TONE: ${style === AnalysisStyle.ROAST ? 'Sarcastic, Sharp, Funny (Roast Mode)' : 'Scientific, Professional, Biometric Analysis'}
    
    INSTRUCTIONS:
    1. Identify facial landmarks (jawline, cheekbones, eye spacing).
    2. Find the closest match from history/pop-culture.
    3. Calculate match percentage (must be between 75% and 99%).
    4. Provide specific "Metrics" descriptions (e.g., "Angular", "High-set").
    5. Generate a "Soul Signature" (a deep psychological reading based on the face).
    6. Generate 5 personality attribute scores (0-100).
    
    IMPORTANT:
    - DO NOT say "I cannot identify". Make a best-effort match based on visual geometry.
    - Return ONLY valid JSON. No markdown formatting.
    
    JSON STRUCTURE:
    {
      "metrics": { "cheekbones": "string", "eyes": "string", "jawline": "string" },
      "mainMatch": { "name": "string", "percentage": "number (just the number)", "reason": "string" },
      "alternatives": [ { "name": "string", "percentage": "string" }, { "name": "string", "percentage": "string" } ],
      "attributes": { "intelligence": number, "dominance": number, "creativity": number, "resilience": number, "charisma": number },
      "soulSignature": "string"
    }
  `;
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeImage = async (base64Image: string, mode: AnalysisMode, style: AnalysisStyle, lang: Language): Promise<AnalysisReport> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(lang === 'tr' 
      ? "API Anahtarı Eksik. Lütfen .env dosyasını kontrol edin." 
      : "API Key Missing. Check configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  // Clean base64 string
  const resizedBase64 = await resizeImage(base64Image);
  const cleanBase64 = resizedBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  
  const instruction = getSystemInstruction(mode, style, lang);

  let lastError: any = null;

  // --- MULTI-MODEL CASCADE LOOP ---
  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`📡 Connecting to Neural Core: ${modelName}...`);
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            { text: "Analyze face. Return strictly JSON." },
            { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } }
          ]
        },
        config: {
          systemInstruction: instruction,
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");

      // Clean markdown if AI adds it despite instructions
      const cleanText = text.replace(/```json|```/g, '').trim();
      const json = JSON.parse(cleanText);

      console.log(`✅ Success with ${modelName}`);
      return json as AnalysisReport;

    } catch (error: any) {
      const msg = error.message || '';
      console.warn(`⚠️ Model ${modelName} Failed:`, msg);
      lastError = error;

      // Logic: If error is 404 (Not Found) or 429 (Busy) or 503 (Server Error), 
      // we CONTINUE to the next model in the list.
      if (msg.includes('404') || msg.includes('429') || msg.includes('503') || msg.includes('not found') || msg.includes('fetch')) {
         await wait(500); // Brief pause before next attempt
         continue; 
      }
      
      // If error is about API Key (400/403), no point trying other models
      if (msg.includes('API key') || msg.includes('403')) {
          break;
      }
    }
  }

  // If we reach here, ALL models failed.
  console.error("🔥 All models failed.", lastError);
  
  const errStr = lastError?.message || "Unknown Error";
  
  if (errStr.includes('SAFETY')) {
      throw new Error(lang === 'tr'
        ? "⚠️ Görsel güvenlik filtresine takıldı. Başka bir fotoğraf deneyin."
        : "⚠️ Safety Filter triggered. Try another photo.");
  }

  throw new Error(lang === 'tr' 
    ? `Bağlantı Kurulamadı: Uygun model bulunamadı. (${errStr.substring(0, 30)}...)` 
    : `Connection Failed: No available models. (${errStr.substring(0, 30)}...)`);
};
