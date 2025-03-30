import { ApiResponse, NewsAnalysis, BatchAnalysisResult } from '../types';

// Configuración base de la API
const API_URL =  'http://127.0.0.1:8000';

/**
 * Servicio para comunicarse con la API
 */
export const ApiService = {
  // Analiza un texto único
  // Actualizar dentro de ApiService en api.ts
async analyzeText(title: string, body: string): Promise<ApiResponse<NewsAnalysis>> {
  try {
    console.log(JSON.stringify([{ 
      "Titulo": title,
      "Descripcion": body
    }]))
    const response = await fetch(`${API_URL}/predictjson/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ 
        "Titulo": title,
        "Descripcion": body
      }]),
    });
    
    const data = await response.json();
    console.log("Respuesta de la API:", data);
    
    if (!response.ok) {
      throw new Error(data.detail || 'Error al analizar el texto');
    }
    
    // Adaptamos la respuesta al formato que espera nuestro frontend
    const isFake = data.predictions && data.predictions[0] === 1;
    
    return { 
      success: true, 
      data: {
        text: `${title} - ${body}`,
        is_fake: isFake,
        probability: isFake ? 85 : 15, // Valores aproximados ya que la API no devuelve probabilidad
        confidence: 90,
        keywords: []
      } 
    };
  } catch (error) {
    console.error('Error en analyzeText:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido en la API',
    };
  }
},
  
  // Analiza múltiples textos desde un archivo CSV
  async analyzeFile(file: File): Promise<ApiResponse<BatchAnalysisResult>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`http://127.0.0.1:8000/predictarchivo/`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Error al analizar el archivo');
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error en analyzeFile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en la API',
      };
    }
  },
  
  // Obtiene ejemplos de textos para analizar
  async getExamples(): Promise<void> {
  },
};