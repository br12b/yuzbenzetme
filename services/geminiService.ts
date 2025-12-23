import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisReport } from "../types";

// Helper to safely get API key in various environments (Vite, Next.js, Standard)
const getApiKey = () => {
  try {
    // @ts-ignore - Vite specific
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
        // @ts-ignore
        return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {}

  try {
     // Next.js specific
     if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_KEY) {
        return process.env.NEXT_PUBLIC_API_KEY;
     }
     // Standard Node/Fallback
     if (typeof process !== 'undefined' && process.env?.API_KEY) {
        return process.env.API_KEY;
     }
  } catch(e) {}
  
  return undefined;
};

const apiKey = getApiKey();

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
  if (!apiKey) {
    throw new Error("API Anahtarı bulunamadı. Lütfen Vercel ayarlarında 'VITE_API_KEY' tanımlayın.");
  }

  // Initialize Gemini Client inside the function to prevent crash on app load if key is missing
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
    if (!text) throw new Error("No response from Gemini");

    // Clean markdown code blocks if present
    const cleanText = text.replace(/```json|```/g, '').trim();

    return JSON.parse(cleanText) as AnalysisReport;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};