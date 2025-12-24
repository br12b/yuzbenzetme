
export enum AppStep {
  LANDING = 'LANDING',
  SCANNING = 'SCANNING',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

export enum AnalysisMode {
  HERITAGE = 'HERITAGE', // Ünlü/Genetik Benzerlik
  PAST_LIFE = 'PAST_LIFE', // Reenkarnasyon
  CYBER_ARCHETYPE = 'CYBER_ARCHETYPE' // Cyberpunk Rolü
}

export enum AnalysisStyle {
  SCIENTIFIC = 'SCIENTIFIC', // Ciddi, teknik, havalı
  ROAST = 'ROAST' // Komik, meme odaklı, hafif aşağılayıcı
}

export type Language = 'tr' | 'en';

export interface BiometricMetrics {
  cheekbones: string;
  eyes: string;
  jawline: string;
}

export interface MatchResult {
  name: string;
  percentage: string;
  reason: string;
}

export interface AlternativeMatch {
  name: string;
  percentage: string;
}

export interface PersonalityAttributes {
  intelligence: number; // Zeka / Mantık
  dominance: number;    // Liderlik / Baskınlık
  creativity: number;   // Yaratıcılık
  resilience: number;   // Dayanıklılık / İrade
  charisma: number;     // Karizma / Etkileyicilik
}

export interface AnalysisReport {
  metrics: BiometricMetrics;
  mainMatch: MatchResult;
  alternatives: AlternativeMatch[];
  soulSignature: string;
  attributes: PersonalityAttributes; // New field for Radar Chart
}

export interface ScanLog {
  id: number;
  text: string;
}
