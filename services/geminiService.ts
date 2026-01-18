import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisReport, AnalysisMode, AnalysisStyle, Language } from "../types";

/**
 * Senior Frontend Engineer Note: 
 * We use process.env.API_KEY strictly as per the architectural requirements.
 * Model 'gemini-3-flash-preview' is chosen for its superior speed and image analysis capabilities.
 */

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
    1. Görseli tarayarak şu metrikleri çıkar: Altın oran uyumu, göz mesafesi (interpupillary distance), elmacık kemiği hattı (malar line), çene yapısı (gonial angle) ve alın genişliği.
    2. Bu verileri veritabanındaki (tarihi kişilikler ve ünlüler) profiller ile eşleştir.
    3. En yüksek (%) uyum sağlayan 1 ana karakter ve 2 benzer karakter belirle.

    KRİTİK KURALLAR:
    - Asla "Sadece benziyorsun" deme. "Biyometrik verilerin şu sonuçları veriyor" diyerek teknik bir dil kullan.
    - SADECE JSON formatında cevap ver. Markdown kullanma.

    İSTENEN JSON FORMATI:
    {
      "metrics": {
        "cheekbones": "Elmacık kemiği analizi (örn: Belirgin ve Simetrik)",
        "eyes": "Göz yapısı analizi (örn: %92 derinlik uyumu)",
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
      "soulSignature": "Yüz hatlarından yola çıkarak kişinin karakteri hakkında derin yorum.",
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

export const analyzeImage = async (base64Image: string, mode: AnalysisMode, style: AnalysisStyle, lang: Language): Promise<AnalysisReport> =>