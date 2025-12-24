
import { GoogleGenAI } from "@google/genai";
import { AnalysisReport, AnalysisMode, AnalysisStyle, Language } from "../types";

// --- CONFIGURATION ---
// STRATEGY CHANGE: 
// Gemini 3.0 Preview models have very low rate limits (RPM) causing 429 errors.
// Gemini 2.0 Flash Experimental has much higher quotas and is stable enough for production.
const MODELS = [
    'gemini-2.0-flash-exp',        // 1. BEST QUOTA & SPEED (Experimental but stable)
    'gemini-2.0-pro-exp-02-05',    // 2. HIGH INTELLIGENCE FALLBACK
    'gemini-1.5-flash-8b',         // 3. ULTRA LIGHTWEIGHT (Emergency Backup)
    'gemini-3-flash-preview'       // 4. ORIGINAL (Keep as last resort)
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

  // VALIDATION
  if (!key) return undefined;
  
  // Trim whitespace
  key = key.trim();

  return key;
};

// Image optimization for API payload
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

const getSystemInstruction = (mode: AnalysisMode, style: AnalysisStyle, lang: Language) => {
  const langInst = lang === 'tr' ? "OUTPUT: TURKISH LANGUAGE." : "OUTPUT: ENGLISH LANGUAGE.";
  
  return `
    ROLE: Advanced Biometric AI.
    TASK: Analyze the face and compare with historical/celebrity database.
    ${langInst}
    MODE: ${mode}
    STYLE: ${style === AnalysisStyle.ROAST ? 'Roast/Funny/Savage' : 'Scientific/Professional'}
    
    RETURN JSON ONLY. NO MARKDOWN.
    Format:
    {
      "metrics": { "cheekbones": "string", "eyes": "string", "jawline": "string" },
      "mainMatch": { "name": "string", "percentage": "number", "reason": "string" },
      "alternatives": [ { "name": "string", "percentage": "string" }, { "name": "string", "percentage": "string" } ],
      "attributes": { "intelligence": 0-100, "dominance": 0-100, "creativity": 0-100, "resilience": 0-100, "charisma": 0-100 },
      "soulSignature": "string"
    }
  `;
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeImage = async (base64Image: string, mode: AnalysisMode, style: AnalysisStyle, lang: Language): Promise<AnalysisReport> => {
  const apiKey = getApiKey();

  // 1. Check Key Existence
  if (!apiKey) {
    console.error("❌ API Key is missing completely.");
    throw new Error(lang === 'tr' 
      ? "API Anahtarı Bulunamadı. Vercel ayarlarında VITE_API_KEY tanımlı değil." 
      : "API Key Not Found. Check Vercel Environment Variables.");
  }

  // 2. Check Key Format (Google keys start with AIza)
  if (!apiKey.startsWith("AIza")) {
    console.error("❌ API Key seems invalid (Does not start with AIza).");
    throw new Error(lang === 'tr'
      ? `Geçersiz API Anahtarı Formatı. Anahtar '${apiKey.substring(0, 4)}...' ile başlıyor. 'AIza' ile başlamalı.`
      : "Invalid API Key format. Must start with AIza.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  const resizedBase64 = await resizeImage(base64Image);
  const cleanBase64 = resizedBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  const instruction = getSystemInstruction(mode, style, lang);

  let lastError: any = null;
  let success = false;
  let resultJSON: any = null;

  // 3. Attempt Models Sequence
  for (const modelName of MODELS) {
    if (success) break;
    
    try {
      console.log(`📡 Connecting to: ${modelName}`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            { text: "Analyze this face. Return strictly JSON." },
            { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } }
          ]
        },
        config: {
          systemInstruction: instruction,
          responseMimeType: "application/json",
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ]
        }
      });

      const text = response.text;
      if (text) {
        // Clean markdown code blocks if present
        const cleanText = text.replace(/```json|```/g, '').trim();
        resultJSON = JSON.parse(cleanText);
        
        // Validate basic structure
        if (resultJSON.mainMatch) {
            success = true;
            console.log(`✅ Success with ${modelName}`);
        }
      }
    } catch (e: any) {
      const msg = e.message || "Unknown error";
      console.warn(`⚠️ ${modelName} Failed:`, msg);
      lastError = e;
      
      // If error is 429 (Quota), wait 1.5s before trying next model
      if (msg.includes('429')) {
        await wait(1500);
      }
    }
  }

  if (success && resultJSON) {
    return resultJSON as AnalysisReport;
  }

  // 4. Error Translation
  const errStr = lastError?.message || JSON.stringify(lastError);
  console.error("🔥 FATAL ERROR:", errStr);

  if (errStr.includes('404')) {
    throw new Error(lang === 'tr'
      ? "⚠️ MODEL BULUNAMADI (404): Eski model adı kullanılıyor olabilir veya API anahtarı bu modele erişemiyor. Yeni bir API anahtarı deneyin."
      : "⚠️ MODEL NOT FOUND (404): Check API Key or Model Access.");
  }

  if (errStr.includes('403') || errStr.includes('API key not valid')) {
      throw new Error(lang === 'tr' 
        ? "⚠️ ERİŞİM REDDEDİLDİ (403): API Anahtarı hatalı veya Vercel domainine (referrer) izin verilmemiş. Google AI Studio'da 'API Key Restrictions' ayarını kontrol et." 
        : "⚠️ ACCESS DENIED (403): Check Domain Restrictions in Google AI Studio.");
  }
  
  if (errStr.includes('429')) {
      throw new Error(lang === 'tr'
        ? "⚠️ KOTA DOLDU (429): Tüm modeller meşgul. Lütfen 30 saniye bekleyip tekrar deneyin."
        : "⚠️ RATE LIMIT (429): All models busy. Wait 30s.");
  }

  if (errStr.includes('SAFETY') || errStr.includes('candidate')) {
       throw new Error(lang === 'tr'
        ? "⚠️ GÜVENLİK PROTOKOLÜ: Bu görsel analiz edilemedi (Safety Filter)."
        : "⚠️ SAFETY BLOCK: Image rejected by AI filter.");
  }

  // Generic Fallback
  throw new Error(`SYSTEM FAILURE: ${errStr.substring(0, 50)}...`);
};
