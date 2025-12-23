export enum AppStep {
  LANDING = 'LANDING',
  SCANNING = 'SCANNING',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

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

export interface AnalysisReport {
  metrics: BiometricMetrics;
  mainMatch: MatchResult;
  alternatives: AlternativeMatch[];
  soulSignature: string;
}

export interface ScanLog {
  id: number;
  text: string;
}