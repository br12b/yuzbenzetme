import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisReport } from "../types";

// Helper to safely get API key in various environments
const getApiKey = () => {
  // 1. Try Vite Standard
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

// Modeller listesi (Sırayla denenecek)
// Birinin kotası dolarsa diğerine geçer.
const FALLBACK_MODELS = [
    'gemini-3-flash-preview',
    'gemini-2.5-flash-latest', 
];

const SYSTEM_INSTRUCTION = `
Sen "Global Heritage & Biometric Matcher" isimli üst düzey biyometrik analiz sistemisin.

GÖREVİN:
Kullanıcının yüzünü analiz ederek, dünya üzerindeki **TÜM ÜNLÜ YÜZLER** (Modern Oyuncular, Şarkıcılar, Sporcular, Modeller veya Tarihi Figürler) arasından en yüksek biyometrik eşleşmeyi bulmak.

KURALLAR:
1. **KİMLİK TESPİTİ SERBEST VE ÖNCELİKLİ:** Eğer yüklenen fotoğraf günümüzün popüler bir ismine (örn: Kıvanç Tatlıtuğ, Scarlett Johansson, Ronaldo) benziyorsa, direkt olarak o ismi ver. Tarihsel zorlama yapma. En yüksek benzerlik kimse o çıkmalı.
2. **KAPSAM:** Hollywood yıldızları, Yeşilçam oyuncuları, dünya liderleri, sporcular ve tarihi şahsiyetlerin hepsi tarama havuzunda olsun.
3. **BİLİMSEL VE ETKİLEYİCİ DİL:** Sonucu sunarken "Tıpkı ona benziyorsun" gibi basit cümleler kurma. Şöyle de: "Yüz hatlarınızdaki altın oran ve orbital kemik yapısı, %96 oranında [İSİM] ile biyometrik eşleşme göstermektedir."

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

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeImage = async (base64Image: string): Promise<AnalysisReport> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.error("API Key Missing! Checked: VITE_API_KEY, NEXT_PUBLIC_API_KEY, API_KEY");
    throw new Error("API Anahtarı bulunamadı. Vercel ayarlarında 'VITE_API_KEY' girildiğinden emin olun.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  let lastError: any = null;

  // Akıllı Model Deneme Döngüsü
  for (const modelName of FALLBACK_MODELS) {
    try {
        console.log(`Trying model: ${modelName}...`);
        
        const response = await ai.models.generateContent({
            model: modelName,
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
        if (!text) throw new Error("Boş yanıt alındı.");

        const cleanText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanText) as AnalysisReport;

    } catch (error: any) {
        lastError = error;
        const msg = error.message || "";
        
        // Eğer hata 429 (Rate Limit) veya 503 (Overloaded) ise diğer modele geç
        if (msg.includes("429") || msg.includes("quota") || msg.includes("503") || msg.includes("RESOURCE_EXHAUSTED")) {
            console.warn(`Model ${modelName} dolu, sıradaki modele geçiliyor...`);
            await wait(1500); // Kısa bir bekleme
            continue; // Döngüye devam et (sonraki model)
        }
        
        // Başka bir hataysa (örn: API Key hatalı), döngüyü kır ve hatayı fırlat
        break; 
    }
  }

  // Eğer tüm modeller başarısız olursa buraya düşer
  console.error("All models failed:", lastError);
  
  let errorMessage = "Bilinmeyen sunucu hatası.";
  const rawMessage = lastError?.message || JSON.stringify(lastError);

  if (rawMessage.includes("429") || rawMessage.includes("quota")) {
      const waitMatch = rawMessage.match(/retry in ([\d\.]+)s/);
      const seconds = waitMatch ? Math.ceil(parseFloat(waitMatch[1])) : 30;
      errorMessage = `⚠️ SİSTEM AŞIRI YOĞUN. Lütfen ${seconds} saniye bekleyip tekrar deneyin.`;
  } else if (rawMessage.includes("403") || rawMessage.includes("key")) {
      errorMessage = "⚠️ YETKİLENDİRME HATASI: API Anahtarı geçersiz.";
  } else {
      errorMessage = "⚠️ BAĞLANTI HATASI: Lütfen tekrar deneyin.";
  }

  throw new Error(errorMessage);
};