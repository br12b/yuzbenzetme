
import { GoogleGenAI } from "@google/genai";
import { AnalysisReport, AnalysisMode, AnalysisStyle, Language } from "../types";

// Google Gemini Model
const MODEL_NAME = "gemini-2.0-flash-exp"; 

const getApiKey = () => {
  let key = '';
  // 1. VITE_KEY 
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_KEY;
    }
  } catch (e) {}

  // 2. Yedekler
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {}

  try {
    if (typeof process !== 'undefined') {
      if (process.env.NEXT_PUBLIC_API_KEY) return process.env.NEXT_PUBLIC_API_KEY;
      if (process.env.API_KEY) return process.env.API_KEY;
    }
  } catch (e) {}

  return key;
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
        // Gemini için optimize edilmiş JPEG
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
    1. Görseli tarayarak şu metrikleri çıkar: Altın oran uyumu, göz mesafesi (interpupillary distance), elmacık kemiği hattı (malar line), çene yapısı (gonial angle) ve alın genişliği.
    2. Bu verileri veritabanındaki (tarihi kişilikler ve ünlüler) binlerce profil ile eşleştir.
    3. En yüksek (%) uyum sağlayan 1 ana karakter ve 2 benzer karakter belirle.

    KRİTİK KURALLAR:
    - Asla "Sadece benziyorsun" deme. "Biyometrik verilerin şu sonuçları veriyor" diyerek teknik bir dil kullan.
    - SADECE JSON formatında cevap ver. Markdown kullanma.

    İSTENEN JSON FORMATI:
    {
      "metrics": {
        "cheekbones": "Elmacık kemiği analizi (örn: Belirgin ve Simetrik)",
        "eyes": "Göz yapısı analizi (örn: Badem formlu, %92 derinlik uyumu)",
        "jawline": "Çene hattı analizi (örn: Keskin/Kuvvetli)"
      },
      "mainMatch": {
        "name": "Eşleşen Ünlü/Tarihi Kişi",
        "percentage": "95",
        "reason": "Bilimsel/Teknik eşleşme nedeni (Zigomatik kemik ve nazal köprü uyumu vb.)"
      },
      "alternatives": [
        { "name": "Alternatif 1", "percentage": "88" },
        { "name": "Alternatif 2", "percentage": "82" }
      ],
      "soulSignature": "Yüz hatlarından yola çıkarak kişinin liderlik, sanatçılık veya savaşçı ruhu hakkında derin yorum.",
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
      ? "API Anahtarı bulunamadı. Lütfen Gemini API Key ekleyin." 
      : "API Key not found. Please add your Gemini API Key.");
  }

  // Google API Key'i doğrula (AIza ile başlamalı)
  if (!apiKey.startsWith("AIza")) {
     console.warn("⚠️ Uyarı: API Anahtarı 'AIza' ile başlamıyor. Hatalı olabilir.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  const resizedBase64 = await resizeImage(base64Image);
  // Remove header for API
  const cleanBase64 = resizedBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  const instruction = getSystemInstruction(mode, style, lang);

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { text: "Analyze this image based on the biometric protocols." },
          { 
            inlineData: { 
              mimeType: "image/jpeg", 
              data: cleanBase64 
            } 
          }
        ]
      },
      config: {
        systemInstruction: instruction,
        responseMimeType: "application/json",
        temperature: 0.7, // Biraz yaratıcılık ama tutarlı yapı
      }
    });

    const text = response.text;
    if (!text) throw new Error("Gemini boş cevap döndürdü.");

    // Temizle ve Parse et
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText) as AnalysisReport;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    let msg = error.message || "Bilinmeyen Hata";
    
    if (msg.includes("429")) msg = "Sistem yoğunluğu (Kota Aşıldı). Lütfen bekleyin veya yeni bir API anahtarı deneyin.";
    if (msg.includes("SAFETY")) msg = "Görsel güvenlik filtresine takıldı. Lütfen başka bir fotoğraf deneyin.";

    throw new Error(msg);
  }
};
