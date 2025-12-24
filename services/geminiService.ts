
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisReport, AnalysisMode, AnalysisStyle, Language } from "../types";

// Helper to safely get API key in various environments
const getApiKey = () => {
  let key = '';

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

// Resize image ensures the payload isn't too large for the browser to handle,
// but keeps quality high enough for the Pro model to analyze features.
const resizeImage = (base64Str: string, maxWidth = 1024): Promise<string> => {
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
        // Quality 0.8 is good balance for Pro model
        resolve(canvas.toDataURL('image/jpeg', 0.8)); 
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

// --- HIGH QUALITY MODEL PRIORITY ---
// We prioritize Pro for better reasoning on "Soul Signature" and facial features.
const FALLBACK_MODELS = [
    'gemini-1.5-pro',           // Best Quality / Reasoning
    'gemini-1.5-flash',         // Faster Fallback
    'gemini-2.0-flash-exp'      // Experimental / Bleeding Edge
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
    : "ROLE: Biometric Scientist. TONE: Clinical, cold, precise, futuristic, detailed.";

  let task = "Match face to historical figure.";
  if (mode === AnalysisMode.PAST_LIFE) task = "Match face to a past life persona (peasant, warrior, etc).";
  if (mode === AnalysisMode.CYBER_ARCHETYPE) task = "Assign a cyberpunk class (Netrunner, Fixer, etc).";

  return `${task} ${selectedTone} ${languageDirective} ${baseJsonInstruction}`;
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeImage = async (base64Image: string, mode: AnalysisMode, style: AnalysisStyle, lang: Language): Promise<AnalysisReport> => {
  const apiKey = getApiKey();

  // Debug Log to console to verify Key
  console.log("API Key Status:", apiKey ? `Present (Starts with ${apiKey.substring(0,5)}...)` : "MISSING");

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
        console.log(`📡 Connecting to high-performance model: ${modelName}...`);
        
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
                responseMimeType: "application/json",
                // CRITICAL: Disable safety settings to prevent "Network Error" on face analysis
                // Face analysis often triggers false positives in "Harassment" filters.
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                ]
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
        
        // If 404/400, try next. If 429/503, wait and retry.
        if (msg.includes("429") || msg.includes("503")) {
            await wait(1500);
            continue; 
        }
        if (msg.includes("404") || msg.includes("not found") || msg.includes("400")) {
             continue;
        }
        // If it's a candidate safety block (finishReason: SAFETY), try next model
        if (msg.includes("candidate")) continue;
    }
  }

  // Final Error Handling
  console.error("All models failed:", lastError);
  const rawMessage = lastError?.message || JSON.stringify(lastError);

  let errorMessage = lang === 'tr' ? "Bağlantı hatası." : "Connection error.";

  if (rawMessage.includes("403") || rawMessage.includes("API key")) {
      errorMessage = lang === 'tr' 
        ? `⚠️ API ANAHTARI GEÇERSİZ: Anahtarınızın (${apiKey?.substring(0,5)}...) geçerli olduğundan ve Google AI Studio'da faturalandırmanın (Billing) açık olduğundan emin olun.` 
        : "⚠️ INVALID API KEY. Check billing.";
  } else if (rawMessage.includes("Failed to fetch") || rawMessage.includes("NetworkError")) {
      errorMessage = lang === 'tr' 
        ? "⚠️ AĞ ENGELİ: Tarayıcınız veya İnternetiniz Google API'ye büyük veri göndermeyi engelliyor. VPN deneyin veya fotoğraf boyutunu küçültün." 
        : "⚠️ NETWORK ERROR: Request blocked by browser/network.";
  } else if (rawMessage.includes("429")) {
      errorMessage = lang === 'tr' 
        ? "⚠️ SİSTEM YOĞUNLUĞU: Kota aşıldı. 30 saniye bekleyin." 
        : "⚠️ QUOTA EXCEEDED: Try again later.";
  } else if (rawMessage.includes("candidate") || rawMessage.includes("SAFETY")) {
      errorMessage = lang === 'tr'
        ? "⚠️ GÜVENLİK PROTOKOLÜ: Yüz hatları analiz edilemedi (AI Filtresi)."
        : "⚠️ SAFETY FILTER: Analysis blocked.";
  } else {
       errorMessage = lang === 'tr' 
        ? `⚠️ SİSTEM HATASI: ${rawMessage.substring(0, 60)}...` 
        : `⚠️ ERROR: ${rawMessage.substring(0, 60)}...`;
  }

  throw new Error(errorMessage);
};
