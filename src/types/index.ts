export interface AnalysisResult {
  intro: string;
  jouwSite: {
    naam: string;
    watGoedGaat: string[];
    samenvatting: string;
  };
  concurrenten: {
    url: string;
    naam: string;
    omschrijving: string;
    overlap: string;
    reden: string;
  }[];
  vergelijking: string;
  watBeterKan: string[];
  kans: string;
  implicatie: string;
}

export interface ScrapedData {
  url: string;
  content: string;
  wordCount: number;
}

export interface AnalysisState {
  step: 'input' | 'loading' | 'fallback' | 'layer1' | 'layer2' | 'complete';
  loadingStep: number;
  userUrl: string;
  userContent: string;
  industry: string;
  competitors: ScrapedData[];
  result: AnalysisResult | null;
  email: string;
  error: string | null;
}
