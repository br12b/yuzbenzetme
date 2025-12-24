
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

// COMPRESSION: 
// Resize to 512px. This is the sweet spot. 
// 1024px causes timeouts on Vercel Free Tier. 512px is sufficient for biometric analysis.
const resizeImage = (base64Str: string, maxWidth = 512): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Keep aspect ratio
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
        // Quality 0.6 is optimal for face detection without artifacts vs file size
        resolve(canvas.toDataURL('image/jpeg', 0.6)); 
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

// --- SMART MODEL STRATEGY ---
// 1. We try 'gemini-1.5-pro' first (Best Quality).
// 2. If it hits Rate Limit (429) or Network Error, we instantly swap to 'gemini-1.5-flash'.
// 3. 'gemini-1.5-flash' has much higher limits and speed, ensuring the user gets a result.
const FALLBACK_MODELS = [
    'gemini-1.5-pro',        // PRIMARY: High Intelligence / Low Quota
    'gemini-1.5-flash',      // FALLBACK: High Speed / High Quota (Rescue Model)
    'gemini-2.0-flash-exp'   // EXPERIMENTAL: Last resort
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

  if (!apiKey) {
    throw new Error(lang === 'tr' 
        ? "API Anahtarı bulunamadı. Lütfen 'VITE_API_KEY' ayarını kontrol edin." 
        : "API Key missing. Check 'VITE_API_KEY'.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  // 1. Aggressive Compression to prevent Network Errors
  const resizedBase64 = await resizeImage(base64Image);
  const cleanBase64 = resizedBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  let lastError: any = null;
  const instruction = getSystemInstruction(mode, style, lang);

  // 2. Loop through models with Smart Fallback
  for (const modelName of FALLBACK_MODELS) {
    try {
        console.log(`📡 Connecting to Neural Net: ${modelName}`);
        
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
                // Disable safety filters to avoid false positives on faces
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                ]
            }
        });

        const text = response.text;
        if (!text) throw new Error("API returned empty response.");

        const cleanText = text.replace(/```json|```/g, '').trim();
        const json = JSON.parse(cleanText);

        if (!json.mainMatch || !json.metrics) {
             throw new Error("Invalid JSON structure.");
        }

        return json as AnalysisReport;

    } catch (error: any) {
        lastError = error;
        const msg = error.message || "";
        console.warn(`❌ Model ${modelName} failed:`, msg);
        
        // CRITICAL FALLBACK LOGIC
        // If Pro fails due to Quota (429) or Network (Timeout), we assume Pro is overloaded/restricted.
        // We immediately try the next model (Flash) which is faster.
        
        if (msg.includes("429") || msg.includes("503") || msg.includes("overloaded")) {
            // Rate limit hit. Wait briefly then try Flash.
            await wait(200);
            continue; 
        }
        
        // 404 means model not found or API key doesn't support it -> Next model
        if (msg.includes("404") || msg.includes("not found")) {
             continue;
        }

        // Network Error usually means CORS or Timeout. 
        // Switching to a lighter model (Flash) often fixes this as it responds faster.
        if (msg.includes("NetworkError") || msg.includes("Failed to fetch")) {
            await wait(200);
            continue;
        }

        // Safety Block -> Try next model
        if (msg.includes("SAFETY") || msg.includes("candidate")) {
            continue;
        }
    }
  }

  // 3. Final User-Friendly Error Messages
  console.error("All models failed:", lastError);
  const rawMessage = lastError?.message || JSON.stringify(lastError);

  let userMessage = lang === 'tr' ? "Sistem Hatası." : "System Error.";

  if (rawMessage.includes("API key") || rawMessage.includes("403")) {
      userMessage = lang === 'tr' 
        ? "⚠️ API ANAHTARI HATASI: Google AI Studio'da bu domain için izin verdiğinize emin olun (Client-side restriction)." 
        : "⚠️ INVALID API KEY: Check domain restrictions in Google AI Studio.";
  } else if (rawMessage.includes("429")) {
      userMessage = lang === 'tr' 
        ? "⚠️ SİSTEM YOĞUNLUĞU: Şu an çok fazla analiz yapılıyor. 1 dakika bekleyip tekrar deneyin." 
        : "⚠️ TRAFFIC OVERLOAD: Please wait 1 minute.";
  } else if (rawMessage.includes("Failed to fetch") || rawMessage.includes("NetworkError")) {
      userMessage = lang === 'tr' 
        ? "⚠️ AĞ HATASI: İnternet bağlantınızı kontrol edin veya Google AI Studio'da 'API Key Restrictions' ayarını kontrol edin." 
        : "⚠️ NETWORK ERROR: Check internet or API Key Domain Restrictions.";
  } else if (rawMessage.includes("SAFETY")) {
      userMessage = lang === 'tr'
        ? "⚠️ GÖRSEL REDDEDİLDİ: AI güvenlik protokolü bu görseli uygunsuz buldu."
        : "⚠️ IMAGE REJECTED: Safety filter triggered.";
  } else {
       userMessage = `⚠️ SYSTEM ERROR: ${rawMessage.substring(0, 40)}...`;
  }

  throw new Error(userMessage);
};
