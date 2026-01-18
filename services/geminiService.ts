
import { GoogleGenAI } from "@google/genai";
import { AnalysisReport, AnalysisMode, AnalysisStyle, Language } from "../types";

// En güncel ve hızlı model
const MODEL_NAME = "gemini-3-flash-preview"; 

const getApiKey = () => {
  // @ts-ignore
  const env = typeof import.meta !== 'undefined' ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
  
  // Vercel/Vite için VITE_KEY, genel kullanım için API_KEY
  return env.VITE_KEY || env.VITE_API_KEY || env.API_KEY || env.NEXT_PUBLIC_API_KEY || '';
};

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
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8)); 
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

const getSystemInstruction = (mode: AnalysisMode, style: AnalysisStyle, lang: Language) => {
  const langInstruction = lang === 'tr' ? "CEVAP DİLİ: TÜRKÇE" : "RESPONSE LANGUAGE: ENGLISH";
  
  return `
    Sen "Global Heritage & Biometric Matcher" isimli profesyonel bir yapay zeka sistemisin. 
    Görevin, kullanıcının yüklediği yüz fotoğrafını tarihteki ikonik figürler ve dünya çapındaki ünlülerle biyometrik olarak karşılaştırmaktır.
    
    ${langInstruction}

    MOD: ${mode}
    ÜSLUP: ${style === AnalysisStyle.ROAST ? 'Mizahi, iğneleyici, hafif alaycı (Roast)' : 'Ciddi, Bilimsel, Teknik, Biyometrik'}

    ANALİZ SÜRECİN:
    1. Görseli tarayarak şu metrikleri çıkar: Altın oran uyumu, göz mesafesi, elmacık kemiği hattı, çene yapısı ve alın genişliği.
    2. Bu verileri dünya çapındaki (tarihi kişilikler ve ünlüler) veritabanı ile eşleştir.
    3. En yüksek (%) uyum sağlayan 1 ana karakter ve 2 benzer karakter belirle.

    KRİTİK KURALLAR:
    - Biyometrik verileri teknik terimlerle açıkla.
    - SADECE JSON formatında cevap ver.

    İSTENEN JSON FORMATI:
    {
      "metrics": {
        "cheekbones": "Dizilim ve simetri analizi",
        "eyes": "Göz yapısı ve derinlik analizi",
        "jawline": "Çene hattı keskinlik analizi"
      },
      "mainMatch": {
        "name": "Eşleşen Ünlü/Tarihi Kişi",
        "percentage": "95",
        "reason": "Bilimsel/Teknik eşleşme nedeni"
      },
      "alternatives": [
        { "name": "Alternatif 1", "percentage": "88" },
        { "name": "Alternatif 2", "percentage": "82" }
      ],
      "soulSignature": "Psikolojik ve ruhsal karakter analizi.",
      "attributes": {
        "intelligence": 85,
        "dominance": 70,
        "creativity": 90,
        "resilience": 60,
        "charisma": 80
      }
    }
  `;
};

export const analyzeImage = async (base64Image: string, mode: AnalysisMode, style: AnalysisStyle, lang: Language): Promise<AnalysisReport> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(lang === 'tr' 
      ? "API Anahtarı bulunamadı! Lütfen ayarlardan VITE_KEY ekleyin." 
      : "API Key not found! Please set VITE_KEY in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const resizedBase64 = await resizeImage(base64Image);
  const cleanBase64 = resizedBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  const instruction = getSystemInstruction(mode, style, lang);

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        { 
          parts: [
            { text: "Identify this person's historical/celebrity doppelganger based on the biometric rules. Return JSON only." },
            { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } }
          ] 
        }
      ],
      config: {
        systemInstruction: instruction,
        responseMimeType: "application/json",
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) throw new Error("API'den boş yanıt geldi.");

    return JSON.parse(text) as AnalysisReport;

  } catch (error: any) {
    console.error("Gemini Error:", error);
    let msg = error.message || "Bilinmeyen Hata";
    if (msg.includes("429")) msg = "API Kotası Dolu veya Hızlı İstek Gönderildi.";
    if (msg.includes("API_KEY_INVALID")) msg = "Geçersiz API Anahtarı! Lütfen VITE_KEY değerini kontrol edin.";
    throw new Error(msg);
  }
};
