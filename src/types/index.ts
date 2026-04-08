export interface Inzicht {
  titel: string;
  tekst: string;
  actie: string;
}

export interface AnalysisResult {
  conclusie: string;
  inzicht1: Inzicht;
  inzicht2: Inzicht;
  inzicht3: Inzicht;
}

export interface ScrapedData {
  url: string;
  content: string;
  wordCount: number;
}

export interface AnalysisState {
  step: 'input' | 'loading' | 'fallback' | 'complete';
  loadingStep: number;
  userUrl: string;
  userContent: string;
  industry: string;
  competitors: ScrapedData[];
  result: AnalysisResult | null;
  email: string;
  error: string | null;
}
