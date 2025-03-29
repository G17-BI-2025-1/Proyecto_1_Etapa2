// Tipo para las respuestas de la API
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
  }
  
  // Tipo para una noticia analizada
  export interface NewsAnalysis {
    text: string;
    is_fake: boolean;
    probability: number;
    confidence: number;
    keywords?: string[];
  }
  
  // Tipo para los resultados de análisis múltiple (CSV)
  export interface BatchAnalysisResult {
    items: NewsAnalysis[];
    summary: {
      total: number;
      fake_count: number;
      real_count: number;
      average_confidence: number;
    };
  }