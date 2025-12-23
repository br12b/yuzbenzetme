import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisReport } from "../types";

// Helper to safely get API key in various environments
const getApiKey = () => {
  // 1. Try Vite Standard (Most likely for this project)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }

  // 2. Try Next.js Standard
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_KEY) {
    return process.env.NEXT_PUBLIC_API_KEY;
  }

  // 3. Try Generic/Node
  if (typeof process !== 'undefined' && process.env?.API_KEY) {
    return process.env.API_KEY;
  }
  
  return undefined;
};

const SYSTEM_INSTRUCTION = `
Sen "Global Heritage & Biometric Matcher" isimli üst düzey biyometrik analiz sistemisin.

GÖREVİN:
Kullanıcının yüzünü analiz ederek, dünya üzerindeki **TÜM ÜNLÜ YÜZLER** (Modern Oyuncular, Şarkıcılar, Sporcular, Modeller veya Tarihi Figürler) arasından en yüksek biyometrik eşleşmeyi bulmak.

KURALLAR:
1. **KİMLİK TESPİTİ SERBEST VE ÖNCELİKLİ:** Eğer yüklenen fotoğraf günümüzün popüler bir ismine (örn: Kıvanç Tatlıtuğ, Scarlett Johansson, Ronaldo) benziyorsa, direkt olarak o ismi ver. Tarihsel zorlama yapma. En yüksek benzerlik kimse o çıkmalı.
2. **KAPSAM:** Hollywood yıldızları, Yeşilçam oyuncuları, dünya liderleri, sporcular ve tarihi şahsiyetlerin hepsi tarama havuzunda olsun.
3. **BİLİMSEL VE ETKİLEYİCİ DİL:** Sonucu sunarken "Tıpkı ona benziyorsun" gibi basit cümleler kurma. Şöyle de: "Yüz hatlarınızdaki altın oran ve orbital kemik yapısı, %96 oranında [İSİM] ile biyometrik eşleşme göstermektedir."

Analiz Sürecin:
1. Görseli tara: Göz, dudak, burun ve çene koordinatlarını çıkar.
2. Veritabanını tara: Modern ve tarihi tüm ünlüleri karşılaştır.
3. Eşleştir: En yüksek yüzdeyi vereni ana sonuç yap.

Cevap Formatın (JSON):
Yanıtın kesinlikle aşağıdaki JSON şemasına uygun olmalıdır. Başka hiçbir metin ekleme.

{
  "metrics": {
    "cheekbones": "Örn: Yüksek ve Belirgin (Model Tipi)",
    "eyes": "Örn: Badem formlu, yoğun bakışlı",
    "jawline": "Örn: Keskin ve Simetrik"
  },
  "mainMatch": {
    "name": "Eşleşen Ünlü/Kişi Adı",
    "percentage": "90-99 arası bir sayı",
    "reason": "Yüzün hangi spesifik özelliklerinin (burun kemeri, dudak yapısı vb.) bu kişiyle eşleştiğini açıklayan teknik bir cümle."
  },
  "alternatives": [
    { "name": "Alternatif Ünlü 1", "percentage": "85" },
    { "name": "Alternatif Ünlü 2", "percentage": "82" }
  ],
  "soulSignature": "Kişinin yüz hatlarından yola çıkarak karakteri (lider, sanatçı, duygusal vb.) hakkında kısa, etkileyici bir analiz."
}
`;

export const analyzeImage = async (base64Image: string): Promise<AnalysisReport> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.error("API Key Missing! Checked: VITE_API_KEY, NEXT_PUBLIC_API_KEY, API_KEY");
    throw new Error("API Anahtarı bulunamadı. Vercel ayarlarında 'VITE_API_KEY' olarak kaydettiğinizden ve REDEPLOY yaptığınızdan emin olun.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            text: "Fotoğrafı analiz et. Modern ünlü, oyuncu veya tarihi figür fark etmeksizin EN ÇOK BENZEYEN kişiyi bul ve JSON raporu oluştur."
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
        systemInstruction: SYSTEM_INSTRUCTION,
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
                soulSignature: { type: Type.STRING }
            },
            required: ["metrics", "mainMatch", "alternatives", "soulSignature"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Gemini'den boş yanıt döndü.");

    // Clean markdown code blocks if present
    const cleanText = text.replace(/```json|```/g, '').trim();

    return JSON.parse(cleanText) as AnalysisReport;

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    
    let errorMessage = "Bilinmeyen sunucu hatası.";
    const rawMessage = error.message || JSON.stringify(error);

    // Handle Rate Limits (429)
    if (rawMessage.includes("429") || rawMessage.includes("quota") || rawMessage.includes("RESOURCE_EXHAUSTED")) {
        // Try to extract wait time
        const waitMatch = rawMessage.match(/retry in ([\d\.]+)s/);
        const seconds = waitMatch ? Math.ceil(parseFloat(waitMatch[1])) : 60;
        errorMessage = `⚠️ SİSTEM AŞIRI ISINDI (RATE LIMIT). Lütfen ${seconds} saniye soğumasını bekleyip tekrar deneyin.`;
    } 
    // Handle Auth Errors (403)
    else if (rawMessage.includes("403") || rawMessage.includes("key") || rawMessage.includes("PERMISSION_DENIED")) {
        errorMessage = "⚠️ YETKİLENDİRME HATASI: API Anahtarı geçersiz. Lütfen Vercel ayarlarını kontrol edin.";
    }
    // Handle Overloaded Model (503)
    else if (rawMessage.includes("503") || rawMessage.includes("Overloaded")) {
        errorMessage = "⚠️ AI MODELİ ŞU AN ÇOK YOĞUN. Lütfen 10 saniye sonra tekrar deneyin.";
    }
    else {
        // If it's a raw JSON dump, try to make it readable or just show generic
        if (rawMessage.includes("{")) {
            errorMessage = "⚠️ AI BAĞLANTI HATASI. Lütfen tekrar deneyin.";
        } else {
            errorMessage = rawMessage;
        }
    }

    throw new Error(errorMessage);
  }
};