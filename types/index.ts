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

export interface LeadData {
  email: string;
  url: string;
  timestamp: string;
  analysis?: AnalysisResult;
}