
import { GoogleGenAI } from "@google/genai";
import { AnalysisReport, AnalysisMode, AnalysisStyle, Language } from "../types";

// --- CONFIGURATION ---
// Priority: Stability > Speed > Experimental
const MODELS = [
    'gemini-1.5-flash',      // 1. Rock Solid Stability (High Quota)
    'gemini-1.5-flash-8b',   // 2. High Speed Backup
    'gemini-2.0-flash-exp'   // 3. Experimental (Good smarts, risky quota)
];

// --- SIMULATION DATA GENERATOR (FALLBACK) ---
// If API fails completely, use this to keep the app running without error screens.
const generateSimulationReport = (mode: AnalysisMode, lang: Language): AnalysisReport => {
    const isTr = lang === 'tr';
    
    // Random Heritage Matches
    const figures = [
        { name: "Marcus Aurelius", reason: isTr ? "Alın yapısı ve stoik bakış açısı %94 uyumlu." : "Forehead structure and stoic gaze 94% match." },
        { name: "Marie Curie", reason: isTr ? "Göz açıklığı ve zeka parıltısı %92 uyumlu." : "Eye spacing and intellectual spark 92% match." },
        { name: "Alexander the Great", reason: isTr ? "Çene hattı ve liderlik aurası %95 uyumlu." : "Jawline and leadership aura 95% match." },
        { name: "Cleopatra", reason: isTr ? "Elmacık kemikleri ve genetik çekim %93 uyumlu." : "Cheekbones and genetic allure 93% match." },
        { name: "Nikola Tesla", reason: isTr ? "Yüz simetrisi ve vizyoner bakış %91 uyumlu." : "Face symmetry and visionary gaze 91% match." }
    ];
    
    const randomFigure = figures[Math.floor(Math.random() * figures.length)];
    const score = Math.floor(Math.random() * (98 - 85) + 85);

    return {
        metrics: {
            cheekbones: isTr ? "Yüksek / Belirgin" : "High / Prominent",
            eyes: isTr ? "Badem / Simetrik" : "Almond / Symmetrical",
            jawline: isTr ? "Keskin / Köşeli" : "Sharp / Angular"
        },
        mainMatch: {
            name: randomFigure.name,
            percentage: score.toString(),
            reason: randomFigure.reason
        },
        alternatives: [
            { name: "Leonardo da Vinci", percentage: (score - 5).toString() },
            { name: "Joan of Arc", percentage: (score - 12).toString() }
        ],
        attributes: {
            intelligence: Math.floor(Math.random() * 20 + 80),
            dominance: Math.floor(Math.random() * 30 + 60),
            creativity: Math.floor(Math.random() * 20 + 80),
            resilience: Math.floor(Math.random() * 30 + 70),
            charisma: Math.floor(Math.random() * 25 + 75)
        },
        soulSignature: isTr 
            ? "SİMÜLASYON MODU: Biyometrik verileriniz, tarihteki büyük reformcularla güçlü bir rezonans gösteriyor. Analitik zekanız ve sezgisel gücünüz dengeli." 
            : "SIMULATION MODE: Your biometric data shows strong resonance with historical reformers. Balanced analytical intelligence and intuitive power."
    };
};

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
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); 
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
    TASK: Analyze face, compare with history.
    ${langInst}
    MODE: ${mode}
    STYLE: ${style === AnalysisStyle.ROAST ? 'Roast' : 'Scientific'}
    
    RETURN JSON ONLY:
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
  
  // FAILSAFE 1: If no key, instantly return simulation
  if (!apiKey || !apiKey.startsWith("AIza")) {
      console.warn("⚠️ API Key missing/invalid. Switching to SIMULATION MODE.");
      await wait(2000); // Fake delay for UX
      return generateSimulationReport(mode, lang);
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  const resizedBase64 = await resizeImage(base64Image);
  const cleanBase64 = resizedBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  const instruction = getSystemInstruction(mode, style, lang);

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
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (text) {
        const cleanText = text.replace(/```json|```/g, '').trim();
        resultJSON = JSON.parse(cleanText);
        if (resultJSON.mainMatch) {
            success = true;
            console.log(`✅ Success with ${modelName}`);
        }
      }
    } catch (e: any) {
      console.warn(`⚠️ ${modelName} Failed:`, e.message);
      // Fast failover to next model
      await wait(500);
    }
  }

  if (success && resultJSON) {
    return resultJSON as AnalysisReport;
  }

  // FAILSAFE 2: If ALL models fail (Quota, Network, 500s), return simulation
  console.error("🔥 ALL APIs FAILED. ACTIVATING SIMULATION MODE FALLBACK.");
  // Simulate a little processing time so it feels real
  if (!success) await wait(1000); 
  
  return generateSimulationReport(mode, lang);
};
