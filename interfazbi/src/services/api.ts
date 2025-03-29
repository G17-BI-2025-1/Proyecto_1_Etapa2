import { ApiResponse, NewsAnalysis, BatchAnalysisResult } from '../types';

// Configuración base de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Servicio para comunicarse con la API
 */
export const ApiService = {
  // Analiza un texto único
  async analyzeText(text: string): Promise<ApiResponse<NewsAnalysis>> {
    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Error al analizar el texto');
      }
      
      return { success: true, data };
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
      
      const response = await fetch(`${API_URL}/analyze/file`, {
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
  async getExamples(): Promise<ApiResponse<string[]>> {
    try {
      const response = await fetch(`${API_URL}/examples`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Error al obtener ejemplos');
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error en getExamples:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en la API',
      };
    }
  },
};