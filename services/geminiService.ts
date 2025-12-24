
import { AnalysisReport, AnalysisMode, AnalysisStyle, Language } from "../types";

// --- CONSTANTS ---
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// BU LISTE HAYAT KURTARIR:
// Sırayla hepsini dener. Biri mutlaka çalışacaktır.
const MODEL_PIPELINE = [
    "gemini-1.5-flash",          // 1. Tercih edilen
    "gemini-1.5-flash-latest",   // 2. Alias
    "gemini-1.5-flash-001",      // 3. Spesifik versiyon
    "gemini-1.5-pro",            // 4. Pro (Daha güçlü)
    "gemini-1.5-pro-latest",     // 5. Pro Alias
    "gemini-pro"                 // 6. Gemini 1.0 (Eski ama en güvenilir/yaygın)
];

const getApiKey = () => {
  // 1. Try Vite (Client-side standard)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  // 2. Try User Custom Name
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_KEY;
  }
  // 3. Try Next.js Public
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_KEY) {
    return process.env.NEXT_PUBLIC_API_KEY;
  }
  // 4. Try Process Env
  if (typeof process !== 'undefined' && process.env?.API_KEY) {
    return process.env.API_KEY;
  }
  return '';
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

// --- DIRECT FETCH FUNCTION ---
async function callGeminiRest(modelName: string, apiKey: string, payload: any) {
    const url = `${API_BASE_URL}/${modelName}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Hata detayını fırlat ki yakalayabilelim
        throw new Error(errorData.error?.message || `HTTP Error: ${response.status}`);
    }

    return await response.json();
}

export const analyzeImage = async (base64Image: string, mode: AnalysisMode, style: AnalysisStyle, lang: Language): Promise<AnalysisReport> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(lang === 'tr' 
      ? "API Anahtarı Eksik. Lütfen .env dosyasını kontrol edin." 
      : "API Key Missing. Check configuration.");
  }

  // Clean base64 string
  const resizedBase64 = await resizeImage(base64Image);
  const cleanBase64 = resizedBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  
  const instruction = getSystemInstruction(mode, style, lang);

  // Prepare Payload for REST API
  const payload = {
      // Not: Bazı eski modeller 'system_instruction' desteklemez, ama v1beta genelde yutar.
      // Desteklenmezse prompt içine gömmek daha garantidir ama şimdilik standart yapı kalsın.
      system_instruction: {
          parts: [{ text: instruction }]
      },
      contents: [{
          parts: [
              { text: "Analyze this face and return the JSON report." },
              { 
                  inline_data: { 
                      mime_type: "image/jpeg", 
                      data: cleanBase64 
                  } 
              }
          ]
      }],
      generationConfig: {
          response_mime_type: "application/json"
      }
  };

  let lastError: any = null;

  // --- THE LOOP OF HOPE ---
  // Modelleri sırayla dener. Çalışan ilk sonucu döndürür.
  for (const model of MODEL_PIPELINE) {
      try {
          console.log(`📡 Connecting to Neural Core: ${model}...`);
          const data = await callGeminiRest(model, apiKey, payload);
          
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) throw new Error("Empty response from AI");

          const cleanText = text.replace(/```json|```/g, '').trim();
          console.log(`✅ Success with ${model}`);
          return JSON.parse(cleanText) as AnalysisReport;

      } catch (error: any) {
          console.warn(`⚠️ Model ${model} Failed: ${error.message}`);
          lastError = error;
          
          // API Key hatalıysa (400, 403) boşa döngüye girme, dur.
          if (error.message.includes('API key') || error.message.includes('403')) {
             throw new Error(lang === 'tr' ? "API Anahtarı geçersiz veya yetkisiz." : "Invalid or unauthorized API Key.");
          }
          
          // 404 (Bulunamadı) veya 503 (Servis yok) ise devam et...
      }
  }

  // Döngü bitti ve hala buradaysak hepsi patlamış demektir.
  console.error("🔥 All models failed.", lastError);
  throw new Error(lang === 'tr' 
      ? `Bağlantı Hatası: Hiçbir model yanıt vermedi. (${lastError?.message?.substring(0, 30)}...)` 
      : `Connection Error: All models failed. (${lastError?.message?.substring(0, 30)}...)`);
};
