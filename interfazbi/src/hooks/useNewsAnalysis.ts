import { useState } from 'react';
import { ApiService } from '../services/api';
import { NewsAnalysis, BatchAnalysisResult } from '../types';

/**
 * Hook personalizado para gestionar el análisis de noticias
 */
export const useNewsAnalysis = () => {
  const [singleAnalysis, setSingleAnalysis] = useState<NewsAnalysis | null>(null);
  const [batchAnalysis, setBatchAnalysis] = useState<BatchAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [examples, setExamples] = useState<string[]>([]);

  // Analiza un texto único
  const analyzeText = async (text: string) => {
    if (!text.trim()) {
      setError('Por favor, ingresa un texto para analizar');
      return;
    }

    setIsLoading(true);
    setError(null);
    setBatchAnalysis(null);

    try {
      const response = await ApiService.analyzeText(text);

      if (response.success && response.data) {
        setSingleAnalysis(response.data);
      } else {
        setError(response.error || 'Error al analizar el texto');
        setSingleAnalysis(null);
      }
    } catch (err) {
      setError('Error inesperado al analizar el texto');
      setSingleAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Analiza un archivo CSV
  const analyzeFile = async (file: File) => {
    if (!file) {
      setError('Por favor, selecciona un archivo para analizar');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSingleAnalysis(null);

    try {
      const response = await ApiService.analyzeFile(file);

      if (response.success && response.data) {
        setBatchAnalysis(response.data);
      } else {
        setError(response.error || 'Error al analizar el archivo');
        setBatchAnalysis(null);
      }
    } catch (err) {
      setError('Error inesperado al analizar el archivo');
      setBatchAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Carga ejemplos de textos
  const loadExamples = async () => {
    try {
      const response = await ApiService.getExamples();
      if (response.success && response.data) {
        setExamples(response.data);
      }
    } catch (err) {
      console.error('Error al cargar ejemplos:', err);
    }
  };

  // Reinicia el estado
  const resetAnalysis = () => {
    setSingleAnalysis(null);
    setBatchAnalysis(null);
    setError(null);
  };

  return {
    singleAnalysis,
    batchAnalysis,
    isLoading,
    error,
    examples,
    analyzeText,
    analyzeFile,
    loadExamples,
    resetAnalysis,
  };
};