
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
// Resize to 512px. This is crucial for Vercel timeouts.
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
        // Quality 0.6 is optimal 
        resolve(canvas.toDataURL('image/jpeg', 0.6)); 
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

// --- BATTLE-TESTED MODEL STRATEGY ---
const FALLBACK_MODELS = [
    'gemini-1.5-pro',        // 1. BEST QUALITY (Often hits limits on Free Tier)
    'gemini-1.5-flash',      // 2. STANDARD FALLBACK (Faster, reliable)
    'gemini-1.5-flash-8b',   // 3. ULTIMATE SAFETY NET (Highest limits, almost never fails)
    'gemini-2.0-flash-exp'   // 4. EXPERIMENTAL (Good if others fail completely)
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
        ? "API Anahtarı bulunamadı. Vercel Env Variables kontrol edin." 
        : "API Key missing. Check Vercel Env Variables.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  // 1. Aggressive Compression
  const resizedBase64 = await resizeImage(base64Image);
  const cleanBase64 = resizedBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  let lastError: any = null;
  const instruction = getSystemInstruction(mode, style, lang);

  // 2. Loop through models with increasing desperation
  for (const modelName of FALLBACK_MODELS) {
    try {
        console.log(`📡 Trying Model: ${modelName}`);
        
        const response = await ai.models.generateContent({
            model: modelName,
            contents: {
                parts: [
                    { text: "Analyze face. JSON only." },
                    { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } }
                ]
            },
            config: {
                systemInstruction: instruction,
                responseMimeType: "application/json",
                // Disable safety filters
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                ]
            }
        });

        const text = response.text;
        if (!text) throw new Error("Empty response");

        const cleanText = text.replace(/```json|```/g, '').trim();
        const json = JSON.parse(cleanText);

        if (!json.mainMatch) throw new Error("Invalid JSON");

        return json as AnalysisReport;

    } catch (error: any) {
        lastError = error;
        const msg = error.message || "";
        console.warn(`❌ ${modelName} Failed:`, msg);
        
        // INTELLIGENT RETRY LOGIC
        if (msg.includes("429") || msg.includes("503") || msg.includes("overloaded")) {
            // If Pro fails, Flash-8b usually works immediately. 
            // We wait 1 second to clear the socket.
            await wait(1000);
            continue; 
        }
        
        // Network errors or 404s -> Try next immediately
        if (msg.includes("NetworkError") || msg.includes("fetch") || msg.includes("404")) {
            continue;
        }

        // Safety blocks -> Try next
        if (msg.includes("SAFETY") || msg.includes("candidate")) {
            continue;
        }
    }
  }

  // 3. Final Error Handling
  console.error("Fatal Error:", lastError);
  const rawMessage = lastError?.message || JSON.stringify(lastError);

  let userMessage = "";

  if (rawMessage.includes("API key") || rawMessage.includes("403")) {
      userMessage = lang === 'tr' 
        ? "⚠️ API ANAHTARI GEÇERSİZ: Yeni bir API Key oluşturup Vercel ayarlarına ekleyin." 
        : "⚠️ INVALID API KEY: Create a new key.";
  } else if (rawMessage.includes("429")) {
      // If even Flash-8b fails with 429, the IP is truly cooked.
      userMessage = lang === 'tr' 
        ? "⚠️ TRAFİK ÇOK YOĞUN: Google sunucuları şu an yanıt vermiyor. Lütfen 2 dakika sonra tekrar deneyin." 
        : "⚠️ TRAFFIC OVERLOAD: Please wait 2 minutes.";
  } else if (rawMessage.includes("SAFETY")) {
      userMessage = lang === 'tr'
        ? "⚠️ GÜVENLİK FİLTRESİ: Fotoğraf analiz edilemedi."
        : "⚠️ SAFETY BLOCK: Image rejected.";
  } else {
       userMessage = lang === 'tr' 
        ? "⚠️ BAĞLANTI HATASI: VPN açıksa kapatın." 
        : "⚠️ CONNECTION ERROR: Check VPN/Internet.";
  }

  throw new Error(userMessage);
};
