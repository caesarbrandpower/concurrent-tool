export interface AnalysisResult {
  samenvatting: string;
  concurrenten: Concurrent[];
  onderscheid: string[];
  implicatie: string;
}

export interface Concurrent {
  url: string;
  omschrijving: string;
  overlap: string;
}

export interface ScrapedData {
  url: string;
  content: string;
  success: boolean;
  error?: string;
}

export interface AnalysisStep {
  id: number;
  text: string;
  status: 'pending' | 'active' | 'completed';
}
