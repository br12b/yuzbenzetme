
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisReport, AnalysisMode, AnalysisStyle, Language } from "../types";

// Helper to safely get API key in various environments
const getApiKey = () => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_KEY) {
    return process.env.NEXT_PUBLIC_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env?.API_KEY) {
    return process.env.API_KEY;
  }
  return undefined;
};

// Resize image to reduce payload size (prevents Network Error on large uploads)
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
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8)); // Compress
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

const FALLBACK_MODELS = [
    'gemini-3-flash-preview',
    'gemini-2.5-flash-latest', 
];

// --- DYNAMIC SYSTEM INSTRUCTIONS ---
const getSystemInstruction = (mode: AnalysisMode, style: AnalysisStyle, lang: Language) => {
  const languageDirective = lang === 'tr' 
    ? "Tüm yanıtlarını ve analizlerini TÜRKÇE olarak ver." 
    : "Provide all responses and analyses in ENGLISH.";

  const baseJsonInstruction = `
    Response Format (JSON):
    Your response must STRICTLY follow this JSON schema. Do not add any other text.
    {
      "metrics": { "cheekbones": "...", "eyes": "...", "jawline": "..." },
      "mainMatch": { "name": "...", "percentage": "90-99", "reason": "..." },
      "alternatives": [ { "name": "...", "percentage": "..." }, { "name": "...", "percentage": "..." } ],
      "attributes": { "intelligence": 0-100, "dominance": 0-100, "creativity": 0-100, "resilience": 0-100, "charisma": 0-100 },
      "soulSignature": "..."
    }
  `;

  // --- STYLE MODIFIERS ---
  const scientificTone = `
    TONE: Highly professional, biometric, scientific, cold, slightly futuristic. 
    Use terms like "craniofacial structure", "canthal tilt", "zygomatic arch", "phenotype". 
    The "Soul Signature" should read like a psychological dossier from a dystopian government.
  `;

  const roastTone = `
    TONE: Savage, funny, internet slang, "roast" style, edgy (but not bannable). 
    Use terms like "negative canthal tilt", "looks like they trade crypto", "main character energy". 
    The "Soul Signature" must be a funny, meme-worthy personality read.
  `;

  const selectedTone = style === AnalysisStyle.ROAST ? roastTone : scientificTone;

  if (mode === AnalysisMode.PAST_LIFE) {
    return `
      You are "Chrono-Metric Time Traveler" system.
      TASK: Analyze the user's facial features to find their "Past Life" (Reincarnation).
      ${selectedTone}
      ${languageDirective}
      
      RULES:
      1. Match with historical figures (kings, peasants, warriors, weird inventors).
      2. "Reason": Explain why based on facial features.
      3. "Soul Signature": Describe how they died or lived in the past life.
      
      ${baseJsonInstruction}
    `;
  }

  if (mode === AnalysisMode.CYBER_ARCHETYPE) {
    return `
      You are "Night City Neural Net".
      TASK: Scan the user's face to determine their Dystopian/Cyberpunk role.
      ${selectedTone}
      ${languageDirective}
      
      RULES:
      1. Give roles like "Corpo Rat", "Street Samurai", "Ripperdoc", "Fixer".
      2. "Metrics": Describe the face as if scanning for cyber-implants.
      3. "Soul Signature": Describe their survival rating in a cyberpunk city.
      
      ${baseJsonInstruction}
    `;
  }

  // DEFAULT: HERITAGE MODE
  return `
    You are "Global Heritage & Biometric Matcher".
    TASK: Analyze the user's face to find the best celebrity or historical match.
    ${selectedTone}
    ${languageDirective}
    
    RULES:
    1. Match with celebrities, historical figures, or meme icons.
    2. "Reason": Connect specific facial features to the match.
    3. "Soul Signature": A deep personality analysis based on physiognomy.
    
    ${baseJsonInstruction}
  `;
};


const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeImage = async (base64Image: string, mode: AnalysisMode, style: AnalysisStyle, lang: Language): Promise<AnalysisReport> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(lang === 'tr' ? "API Anahtarı bulunamadı. (VITE_API_KEY veya NEXT_PUBLIC_API_KEY kontrol edin)" : "API Key not found.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  // Resize image to prevent payload issues
  const resizedBase64 = await resizeImage(base64Image);
  const cleanBase64 = resizedBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  let lastError: any = null;
  const instruction = getSystemInstruction(mode, style, lang);

  for (const modelName of FALLBACK_MODELS) {
    try {
        console.log(`Trying model: ${modelName} with mode: ${mode}, style: ${style}...`);
        
        const response = await ai.models.generateContent({
            model: modelName,
            contents: {
                parts: [
                {
                    text: `Analyze this face. Mode: ${mode}. Style: ${style}. Language: ${lang}. Return JSON.`
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
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        metrics: {
                            type: Type.OBJECT,
                            properties: {
                                cheekbones: { type: Type.STRING },
                                eyes: { type: Type.STRING },
                                jawline: { type: Type.STRING }
                            },
                            required: ["cheekbones", "eyes", "jawline"]
                        },
                        mainMatch: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                percentage: { type: Type.STRING },
                                reason: { type: Type.STRING }
                            },
                            required: ["name", "percentage", "reason"]
                        },
                        alternatives: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    percentage: { type: Type.STRING }
                                },
                                required: ["name", "percentage"]
                            }
                        },
                        attributes: {
                           type: Type.OBJECT,
                           properties: {
                               intelligence: { type: Type.NUMBER },
                               dominance: { type: Type.NUMBER },
                               creativity: { type: Type.NUMBER },
                               resilience: { type: Type.NUMBER },
                               charisma: { type: Type.NUMBER }
                           },
                           required: ["intelligence", "dominance", "creativity", "resilience", "charisma"]
                        },
                        soulSignature: { type: Type.STRING }
                    },
                    required: ["metrics", "mainMatch", "alternatives", "soulSignature", "attributes"]
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("Boş yanıt alındı.");

        const cleanText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanText) as AnalysisReport;

    } catch (error: any) {
        lastError = error;
        const msg = error.message || "";
        console.warn(`Model ${modelName} failed:`, msg);
        
        if (msg.includes("429") || msg.includes("quota") || msg.includes("503") || msg.includes("RESOURCE_EXHAUSTED")) {
            console.warn(`Model ${modelName} busy, retrying...`);
            await wait(1500);
            continue; 
        }
        // If it's a client error (400, 404), maybe try next model just in case of version mismatch
        if (msg.includes("400") || msg.includes("404")) {
             continue;
        }
        break; 
    }
  }

  console.error("All models failed:", lastError);
  let errorMessage = "Bilinmeyen sunucu hatası.";
  const rawMessage = lastError?.message || JSON.stringify(lastError);

  if (rawMessage.includes("429") || rawMessage.includes("quota")) {
      const waitMatch = rawMessage.match(/retry in ([\d\.]+)s/);
      const seconds = waitMatch ? Math.ceil(parseFloat(waitMatch[1])) : 30;
      errorMessage = lang === 'tr' 
        ? `⚠️ SİSTEM AŞIRI YOĞUN. Lütfen ${seconds} saniye bekleyip tekrar deneyin.`
        : `⚠️ SYSTEM OVERLOAD. Please wait ${seconds} seconds and retry.`;
  } else if (rawMessage.includes("403")) {
      errorMessage = lang === 'tr' ? "⚠️ YETKİLENDİRME HATASI: API Anahtarı geçersiz." : "⚠️ AUTH ERROR: Invalid API Key.";
  } else if (rawMessage.includes("Failed to fetch") || rawMessage.includes("NetworkError")) {
      errorMessage = lang === 'tr' 
        ? "⚠️ AĞ HATASI: Sunucuya ulaşılamıyor. İnternet bağlantınızı kontrol edin veya görsel boyutunu küçültün." 
        : "⚠️ NETWORK ERROR: Could not reach server.";
  } else {
       errorMessage = lang === 'tr' 
        ? `⚠️ BAĞLANTI HATASI: ${rawMessage.substring(0, 50)}...` 
        : `⚠️ CONNECTION ERROR: ${rawMessage.substring(0, 50)}...`;
  }

  throw new Error(errorMessage);
};
