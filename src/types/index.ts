export interface Inzicht {
  titel: string;
  tekst: string;
  actie: string;
}

export interface Concurrent {
  naam: string;
  url: string;
  omschrijving: string;
  reden: string;
}

export interface AnalysisResult {
  merknaam: string;
  conclusie: string;
  concurrenten: Concurrent[];
  inzicht1: Inzicht;
  inzicht2: Inzicht;
  inzicht3: Inzicht;
  actieplan: string[];
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
