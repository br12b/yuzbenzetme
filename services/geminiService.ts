
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisReport, AnalysisMode, AnalysisStyle, Language } from "../types";

// Helper to safely get API key in various environments
const getApiKey = () => {
  let key = '';

  // 1. Try Vite (most common for React SPAs created with Vite)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
    // @ts-ignore
    key = import.meta.env.VITE_API_KEY;
  }
  // 2. Try Next.js Public (common on Vercel)
  else if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_KEY) {
    key = process.env.NEXT_PUBLIC_API_KEY;
  }
  // 3. Try standard Process Env
  else if (typeof process !== 'undefined' && process.env?.API_KEY) {
    key = process.env.API_KEY;
  }

  // Debug logging (will show in browser console F12)
  if (key) {
    console.log(`API Key detected: ${key.substring(0, 4)}...${key.substring(key.length - 4)}`);
  } else {
    console.error("API Key not found in any environment variable (VITE_API_KEY, NEXT_PUBLIC_API_KEY, API_KEY)");
  }

  return key;
};

// Drastically reduce image size to prevent "Network Error" / "Failed to fetch"
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
        resolve(canvas.toDataURL('image/jpeg', 0.6)); 
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

// Updated Model List - using exact names from documentation
const FALLBACK_MODELS = [
    'gemini-2.5-flash',         // Stable 2.5
    'gemini-flash-latest',      // Alias for latest flash
    'gemini-3-flash-preview',   // Experimental 3.0
];

const getSystemInstruction = (mode: AnalysisMode, style: AnalysisStyle, lang: Language) => {
  const languageDirective = lang === 'tr' 
    ? "YANIT DİLİ: TÜRKÇE. Tüm analizleri Türkçe yap." 
    : "RESPONSE LANGUAGE: ENGLISH.";

  const baseJsonInstruction = `
    RETURN JSON ONLY. NO MARKDOWN.
    Schema:
    {
      "metrics": { "cheekbones": "string", "eyes": "string", "jawline": "string" },
      "mainMatch": { "name": "string", "percentage": "number(70-99)", "reason": "string" },
      "alternatives": [ { "name": "string", "percentage": "string" }, { "name": "string", "percentage": "string" } ],
      "attributes": { "intelligence": 0-100, "dominance": 0-100, "creativity": 0-100, "resilience": 0-100, "charisma": 0-100 },
      "soulSignature": "string"
    }
  `;

  const selectedTone = style === AnalysisStyle.ROAST 
    ? "ROLE: Roast Master. TONE: Savage, funny, rude but clever. Make fun of the user's face structure." 
    : "ROLE: Biometric Scientist. TONE: Clinical, cold, precise, futuristic.";

  let task = "Match face to historical figure.";
  if (mode === AnalysisMode.PAST_LIFE) task = "Match face to a past life persona (peasant, warrior, etc).";
  if (mode === AnalysisMode.CYBER_ARCHETYPE) task = "Assign a cyberpunk class (Netrunner, Fixer, etc).";

  return `${task} ${selectedTone} ${languageDirective} ${baseJsonInstruction}`;
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeImage = async (base64Image: string, mode: AnalysisMode, style: AnalysisStyle, lang: Language): Promise<AnalysisReport> => {
  const apiKey = getApiKey();

  // Explicit check for API Key
  if (!apiKey) {
    const errorMsg = lang === 'tr' 
        ? "⚠️ API ANAHTARI BULUNAMADI! Lütfen Vercel ayarlarında 'VITE_API_KEY' değişkenini tanımladığınızdan ve PROJEYİ YENİDEN DAĞITTIĞINIZDAN (Redeploy) emin olun." 
        : "⚠️ API KEY MISSING! Check Vercel 'VITE_API_KEY' and REDEPLOY.";
    throw new Error(errorMsg);
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  // Resize image
  const resizedBase64 = await resizeImage(base64Image);
  const cleanBase64 = resizedBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  let lastError: any = null;
  const instruction = getSystemInstruction(mode, style, lang);

  for (const modelName of FALLBACK_MODELS) {
    try {
        console.log(`📡 Connecting to model: ${modelName}...`);
        
        const response = await ai.models.generateContent({
            model: modelName,
            contents: {
                parts: [
                { text: `Analyze this image. Mode: ${mode}. Style: ${style}. Return JSON.` },
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

        const cleanText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanText) as AnalysisReport;

    } catch (error: any) {
        lastError = error;
        const msg = error.message || JSON.stringify(error);
        console.warn(`❌ Model ${modelName} failed:`, msg);
        
        // If 404 (Not Found), try next model
        if (msg.includes("404") || msg.includes("not found")) continue;
        
        // If 503 (Overloaded) or 429 (Quota), wait and try next
        if (msg.includes("429") || msg.includes("503")) {
            await wait(1000);
            continue; 
        }
        
        // If 400 (Bad Request), usually image or key issue, try next just in case
        if (msg.includes("400")) continue;
    }
  }

  // Final Error Handling
  console.error("All models failed:", lastError);
  const rawMessage = lastError?.message || JSON.stringify(lastError);

  let errorMessage = lang === 'tr' ? "Bağlantı hatası." : "Connection error.";

  if (rawMessage.includes("403") || rawMessage.includes("API key")) {
      errorMessage = lang === 'tr' 
        ? "⚠️ API ANAHTARI GEÇERSİZ: Vercel'deki anahtarınızın doğru olduğundan emin olun." 
        : "⚠️ INVALID API KEY.";
  } else if (rawMessage.includes("Failed to fetch") || rawMessage.includes("NetworkError")) {
      errorMessage = lang === 'tr' 
        ? "⚠️ AĞ HATASI: Google sunucularına erişilemiyor. VPN kullanıyor olabilirsiniz veya API anahtarı 'Browser' kısıtlamasına takılıyor olabilir." 
        : "⚠️ NETWORK ERROR: Check CORS or API Key restrictions.";
  } else if (rawMessage.includes("429")) {
      errorMessage = lang === 'tr' 
        ? "⚠️ KOTA AŞIMI: Sistem şu an çok yoğun. Lütfen 1 dakika sonra tekrar deneyin." 
        : "⚠️ QUOTA EXCEEDED: Try again later.";
  } else if (rawMessage.includes("candidate")) {
      errorMessage = lang === 'tr'
        ? "⚠️ GÜVENLİK: Görsel AI tarafından işlenemedi (Yüz net değil veya politika ihlali)."
        : "⚠️ SAFETY FILTER: Image rejected.";
  } else {
       errorMessage = lang === 'tr' 
        ? `⚠️ BEKLENMEYEN HATA: ${rawMessage.substring(0, 50)}...` 
        : `⚠️ ERROR: ${rawMessage.substring(0, 50)}...`;
  }

  throw new Error(errorMessage);
};
