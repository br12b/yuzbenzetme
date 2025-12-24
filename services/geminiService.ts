
import { GoogleGenAI } from "@google/genai";
import { AnalysisReport, AnalysisMode, AnalysisStyle, Language } from "../types";

// Helper to safely get API key in various environments
const getApiKey = () => {
  // 1. Try Vite (most common for React SPAs created with Vite)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  // 2. Try Next.js Public (common on Vercel)
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_KEY) {
    return process.env.NEXT_PUBLIC_API_KEY;
  }
  // 3. Try standard Process Env
  if (typeof process !== 'undefined' && process.env?.API_KEY) {
    return process.env.API_KEY;
  }

  return undefined;
};

// COMPRESSION: Resize to 800px max. 
// Large images (4K/1080p) cause "Network Error" / timeouts in Vercel serverless functions.
const resizeImage = (base64Str: string, maxWidth = 800): Promise<string> => {
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
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        // Compress to 0.7 quality JPEG
        resolve(canvas.toDataURL('image/jpeg', 0.7)); 
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

// MODEL PRIORITY LIST
// 1. Pro (Best reasoning)
// 2. Flash (Fastest/Most stable)
// 3. 2.0 Flash (Experimental)
const FALLBACK_MODELS = [
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-2.0-flash-exp'
];

const getSystemInstruction = (mode: AnalysisMode, style: AnalysisStyle, lang: Language) => {
  const languageDirective = lang === 'tr' 
    ? "YANIT DİLİ: TÜRKÇE. JSON formatında yanıtla." 
    : "RESPONSE LANGUAGE: ENGLISH. Return JSON.";

  const baseJsonInstruction = `
    STRICT JSON OUTPUT ONLY. DO NOT USE MARKDOWN BLOCK.
    Structure:
    {
      "metrics": { "cheekbones": "string", "eyes": "string", "jawline": "string" },
      "mainMatch": { "name": "string", "percentage": "number(70-99)", "reason": "string" },
      "alternatives": [ { "name": "string", "percentage": "string" }, { "name": "string", "percentage": "string" } ],
      "attributes": { "intelligence": 0-100, "dominance": 0-100, "creativity": 0-100, "resilience": 0-100, "charisma": 0-100 },
      "soulSignature": "string"
    }
  `;

  const selectedTone = style === AnalysisStyle.ROAST 
    ? "ROLE: Roast Master. TONE: Savage, funny. Mock the user's facial features." 
    : "ROLE: Biometric Scientist. TONE: Clinical, precise, detailed.";

  let task = "Analyze face biometric matches.";
  if (mode === AnalysisMode.PAST_LIFE) task = "Analyze past life reincarnation.";
  if (mode === AnalysisMode.CYBER_ARCHETYPE) task = "Analyze cyberpunk character class.";

  return `${task} ${selectedTone} ${languageDirective} ${baseJsonInstruction}`;
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeImage = async (base64Image: string, mode: AnalysisMode, style: AnalysisStyle, lang: Language): Promise<AnalysisReport> => {
  const apiKey = getApiKey();

  // 1. API Key Check
  if (!apiKey) {
    throw new Error(lang === 'tr' 
        ? "API Anahtarı bulunamadı. Lütfen 'VITE_API_KEY' ayarını kontrol edin." 
        : "API Key missing. Check 'VITE_API_KEY'.");
  }

  // 2. Initialize Client
  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  // 3. Prepare Image
  const resizedBase64 = await resizeImage(base64Image);
  const cleanBase64 = resizedBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  let lastError: any = null;
  const instruction = getSystemInstruction(mode, style, lang);

  // 4. Try Models sequentially
  for (const modelName of FALLBACK_MODELS) {
    try {
        console.log(`📡 Attempting model: ${modelName}`);
        
        const response = await ai.models.generateContent({
            model: modelName,
            contents: {
                parts: [
                    { text: "Analyze the face in this image. Return valid JSON." },
                    { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } }
                ]
            },
            config: {
                systemInstruction: instruction,
                responseMimeType: "application/json",
                // AGGRESSIVE SAFETY SETTINGS
                // We must disable these because face analysis is often flagged as 'Harassment'
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                ]
            }
        });

        // 5. Parse Response
        const text = response.text;
        if (!text) throw new Error("API returned empty response.");

        // Remove markdown formatting if present
        const cleanText = text.replace(/```json|```/g, '').trim();
        const json = JSON.parse(cleanText);

        // Basic validation
        if (!json.mainMatch || !json.metrics) {
             throw new Error("Invalid JSON structure received.");
        }

        return json as AnalysisReport;

    } catch (error: any) {
        lastError = error;
        const msg = error.message || "";
        console.warn(`❌ Model ${modelName} failed:`, msg);
        
        // Logic to decide whether to retry with next model
        if (msg.includes("429") || msg.includes("503") || msg.includes("overloaded")) {
            await wait(1000); // Wait a bit before fallback
            continue; 
        }
        if (msg.includes("SAFETY") || msg.includes("blocked")) {
            // Safety block -> try next model, maybe it's less sensitive
            continue;
        }
        // 404/400 usually means model doesn't exist or bad request -> try next just in case
        if (msg.includes("404") || msg.includes("400")) {
             continue;
        }
    }
  }

  // 6. Detailed Error Reporting
  console.error("All models failed:", lastError);
  const rawMessage = lastError?.message || JSON.stringify(lastError);

  let userMessage = lang === 'tr' ? "Sistem Hatası." : "System Error.";

  // Translate technical errors to user-friendly messages
  if (rawMessage.includes("API key") || rawMessage.includes("403")) {
      userMessage = lang === 'tr' 
        ? "⚠️ API ANAHTARI GEÇERSİZ: Anahtarınız hatalı veya faturalandırma (Billing) kapalı." 
        : "⚠️ INVALID API KEY: Check billing or key validity.";
  } else if (rawMessage.includes("Failed to fetch") || rawMessage.includes("NetworkError")) {
      userMessage = lang === 'tr' 
        ? "⚠️ AĞ HATASI: VPN açıksa kapatın. Görsel sunucuya gönderilemedi." 
        : "⚠️ NETWORK ERROR: Check internet/VPN.";
  } else if (rawMessage.includes("429")) {
      userMessage = lang === 'tr' 
        ? "⚠️ KOTA DOLDU: Çok fazla istek yapıldı. 1 dakika bekleyin." 
        : "⚠️ QUOTA EXCEEDED: Try again later.";
  } else if (rawMessage.includes("SAFETY") || rawMessage.includes("candidate")) {
      userMessage = lang === 'tr'
        ? "⚠️ GÜVENLİK FİLTRESİ: Yapay zeka bu fotoğrafı analiz etmeyi reddetti (Uygunsuz içerik algısı)."
        : "⚠️ SAFETY BLOCK: AI refused to analyze this image.";
  } else {
       // Show the raw error for debugging if it's something weird
       userMessage = `⚠️ DEBUG ERROR: ${rawMessage.substring(0, 50)}...`;
  }

  throw new Error(userMessage);
};
