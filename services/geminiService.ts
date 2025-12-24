
import { GoogleGenAI } from "@google/genai";
import { AnalysisReport, AnalysisMode, AnalysisStyle, Language } from "../types";

// --- CONFIGURATION ---
// STRICT MODE: Only use the model with the HIGHEST FREE TIER QUOTA.
// 'gemini-1.5-flash' allows ~15 RPM (Requests Per Minute) on free tier.
// Others (Pro, Exp) allow only 2 RPM, causing immediate 429 errors.
const MODEL_NAME = 'gemini-1.5-flash';

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

// --- RETRY LOGIC WRAPPER ---
// This ensures we don't give up immediately on 429/503 errors.
async function callApiWithRetry(ai: GoogleGenAI, params: any, maxRetries = 3) {
    let attempt = 0;
    
    while (attempt < maxRetries) {
        try {
            console.log(`📡 API Attempt ${attempt + 1}/${maxRetries}...`);
            const result = await ai.models.generateContent(params);
            return result;
        } catch (error: any) {
            attempt++;
            const msg = error.message || '';
            
            // Critical errors that shouldn't be retried
            if (msg.includes('API key') || msg.includes('403')) {
                throw error;
            }

            // If it's the last attempt, throw
            if (attempt >= maxRetries) {
                console.error("🔥 All retries failed.");
                throw error;
            }

            // Rate Limit (429) or Server Error (503/500) -> WAIT AND RETRY
            if (msg.includes('429') || msg.includes('503') || msg.includes('500') || msg.includes('fetch')) {
                console.warn(`⚠️ API Busy (429/503). Waiting ${attempt * 2}s before retry...`);
                await wait(2000 * attempt); // Exponential backoff: 2s, 4s, 6s...
                continue;
            }

            throw error;
        }
    }
}

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

  try {
      const response = await callApiWithRetry(ai, {
        model: MODEL_NAME,
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

      return json as AnalysisReport;

  } catch (error: any) {
      console.error("Gemini Service Error:", error);
      const errStr = error.message || "Unknown error";

      if (errStr.includes('429')) {
          throw new Error(lang === 'tr' 
            ? "⚠️ Sunucu çok yoğun. Lütfen 1 dakika bekleyip tekrar deneyin. (Quota Exceeded)" 
            : "⚠️ Server busy (Quota Exceeded). Please wait 1 min.");
      }
      if (errStr.includes('SAFETY')) {
          throw new Error(lang === 'tr'
            ? "⚠️ Görsel güvenlik filtresine takıldı. Başka bir fotoğraf deneyin."
            : "⚠️ Safety Filter triggered. Try another photo.");
      }
      
      throw new Error(lang === 'tr' ? "Bağlantı Hatası: " + errStr : "Connection Error: " + errStr);
  }
};
