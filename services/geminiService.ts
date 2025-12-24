
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisReport, AnalysisMode, AnalysisStyle, Language } from "../types";

// Helper to safely get API key in various environments
const getApiKey = () => {
  // 1. Try Vite (most common for React SPAs)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  // 2. Try Next.js Public
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_KEY) {
    return process.env.NEXT_PUBLIC_API_KEY;
  }
  // 3. Try standard Process Env (Node/Server-side only usually)
  if (typeof process !== 'undefined' && process.env?.API_KEY) {
    return process.env.API_KEY;
  }
  return undefined;
};

// Drastically reduce image size to prevent "Network Error" / "Failed to fetch"
// Previous 1024px was too heavy for some connections. Now using 800px and 0.6 quality.
const resizeImage = (base64Str: string, maxWidth = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio
      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw on white background to handle transparent PNGs
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        // Aggressive compression (0.6)
        resolve(canvas.toDataURL('image/jpeg', 0.6)); 
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

const FALLBACK_MODELS = [
    'gemini-2.5-flash-latest', // Fast and cost-effective
    'gemini-3-flash-preview', // Newer, experimental
];

// --- DYNAMIC SYSTEM INSTRUCTIONS ---
const getSystemInstruction = (mode: AnalysisMode, style: AnalysisStyle, lang: Language) => {
  const languageDirective = lang === 'tr' 
    ? "YANIT DİLİ: TÜRKÇE." 
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

  // --- STYLE MODIFIERS ---
  const scientificTone = `
    ROLE: Biometric AI Scanner.
    TONE: Cold, clinical, scientific.
    KEYWORDS: Craniofacial, Phenotype, Golden Ratio, Zygomatic.
  `;

  const roastTone = `
    ROLE: Sarcastic Roast AI.
    TONE: Funny, edgy, meme-culture.
    KEYWORDS: Skill issue, NPC energy, Main character syndrome.
  `;

  const selectedTone = style === AnalysisStyle.ROAST ? roastTone : scientificTone;

  let task = "";
  if (mode === AnalysisMode.PAST_LIFE) {
    task = "Match user to a historical figure (peasant, warrior, royalty) based on face.";
  } else if (mode === AnalysisMode.CYBER_ARCHETYPE) {
    task = "Assign a Cyberpunk 2077 style role (Netrunner, Corpo, Nomad).";
  } else {
    task = "Match user to a celebrity or historical figure.";
  }

  return `${task} ${selectedTone} ${languageDirective} ${baseJsonInstruction}`;
};


const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeImage = async (base64Image: string, mode: AnalysisMode, style: AnalysisStyle, lang: Language): Promise<AnalysisReport> => {
  const apiKey = getApiKey();

  // Explicit check for API Key
  if (!apiKey) {
    const errorMsg = lang === 'tr' 
        ? "API Anahtarı Eksik! Vercel Ayarlarında 'NEXT_PUBLIC_API_KEY' veya 'VITE_API_KEY' adıyla anahtarınızı ekleyin." 
        : "API Key Missing! Add 'NEXT_PUBLIC_API_KEY' or 'VITE_API_KEY' in Vercel Settings.";
    throw new Error(errorMsg);
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  // Resize image to prevent payload issues
  const resizedBase64 = await resizeImage(base64Image);
  const cleanBase64 = resizedBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  let lastError: any = null;
  const instruction = getSystemInstruction(mode, style, lang);

  for (const modelName of FALLBACK_MODELS) {
    try {
        console.log(`Attempting model: ${modelName}`);
        
        const response = await ai.models.generateContent({
            model: modelName,
            contents: {
                parts: [
                {
                    text: `Analyze face. Mode: ${mode}. Style: ${style}. Return JSON.`
                },
                {
                    inlineData: {
                    data: cleanBase64,
                    mimeType: 'image/jpeg' 
                    }
                }
                ]
            },
            config: {
                systemInstruction: instruction,
                responseMimeType: "application/json" 
                // Removed complex schema validation here to reduce token count and timeouts.
                // We rely on the system instruction for JSON format.
            }
        });

        const text = response.text;
        if (!text) throw new Error("Empty response");

        // Clean markdown code blocks if present
        const cleanText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanText) as AnalysisReport;

    } catch (error: any) {
        lastError = error;
        const msg = error.message || "";
        console.warn(`Model ${modelName} failed:`, msg);
        
        // Retry logic for quotas
        if (msg.includes("429") || msg.includes("503")) {
            await wait(1000);
            continue; 
        }
        // If 400 (Bad Request), it might be the model doesn't support the feature or image is bad
        if (msg.includes("400")) {
             continue;
        }
    }
  }

  // Final Error Handling with User-Friendly Messages
  console.error("All models failed:", lastError);
  let errorMessage = "System Malfunction.";
  const rawMessage = lastError?.message || JSON.stringify(lastError);

  if (rawMessage.includes("403") || rawMessage.includes("API key")) {
      errorMessage = lang === 'tr' 
        ? "⚠️ API ANAHTARI HATASI: Vercel'deki API anahtarınızın doğru olduğundan ve başında boşluk olmadığından emin olun." 
        : "⚠️ INVALID API KEY: Check your Vercel environment variables.";
  } else if (rawMessage.includes("Failed to fetch") || rawMessage.includes("NetworkError")) {
      errorMessage = lang === 'tr' 
        ? "⚠️ BAĞLANTI KOPTU: Görsel çok büyük veya internetiniz yavaş. Lütfen daha küçük bir fotoğraf deneyin." 
        : "⚠️ NETWORK ERROR: Image too large or weak connection. Try a smaller photo.";
  } else if (rawMessage.includes("429")) {
      errorMessage = lang === 'tr' 
        ? "⚠️ SİSTEM YOĞUN: Çok fazla istek gönderildi. 30 saniye bekleyin." 
        : "⚠️ SYSTEM OVERLOAD: Too many requests. Wait 30s.";
  } else if (rawMessage.includes("candidate")) {
      errorMessage = lang === 'tr'
        ? "⚠️ GÜVENLİK FİLTRESİ: Yüklenen görsel işlenemedi (NSFW veya belirsiz yüz)."
        : "⚠️ SAFETY FILTER: Image blocked by AI safety protocols.";
  } else {
       errorMessage = lang === 'tr' 
        ? `⚠️ SUNUCU HATASI: ${rawMessage.substring(0, 40)}...` 
        : `⚠️ SERVER ERROR: ${rawMessage.substring(0, 40)}...`;
  }

  throw new Error(errorMessage);
};
