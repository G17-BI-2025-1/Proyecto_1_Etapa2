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

  // Función para abrir resultados en nueva pestaña
  const openResultsInNewTab = (data: any) => {
    // Crear una nueva ventana/pestaña
    const newWindow = window.open('', '_blank');
    
    if (!newWindow) {
      alert('Por favor, permite las ventanas emergentes para ver los resultados.');
      return;
    }
    
    // Formatear el contenido HTML para la nueva pestaña
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resultados del Análisis - Detector de Noticias Falsas</title>
        <style>
          body {
            font-family: 'Roboto', Arial, sans-serif;
            background-color: #f8f9fa;
            color: #333333;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          h1, h2, h3 {
            color: #1a73e8;
          }
          .result-card {
            margin-top: 20px;
            padding: 15px;
            border-radius: 8px;
          }
          .result-fake {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
          }
          .result-real {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
          }
          .probability {
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0;
          }
          .text-content {
            margin-top: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 4px;
            border: 1px solid #dee2e6;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #6c757d;
          }
          .json-data {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            font-family: monospace;
            white-space: pre-wrap;
            overflow-x: auto;
            margin-top: 20px;
          }
          .btn {
            display: inline-block;
            font-weight: 500;
            text-align: center;
            padding: 10px 20px;
            font-size: 1rem;
            border-radius: 4px;
            background-color: #1a73e8;
            color: white;
            text-decoration: none;
            border: none;
            cursor: pointer;
            margin-top: 20px;
          }
          .btn:hover {
            background-color: #0d62d0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Resultados del Análisis</h1>
          
          ${data.success && data.data ? `
            <div class="result-card ${data.data.is_fake ? 'result-fake' : 'result-real'}">
              <h2>${data.data.is_fake ? '❌ NOTICIA FALSA' : '✅ NOTICIA REAL'}</h2>
              
              <div class="probability">
                Probabilidad: ${data.data.probability}%
              </div>
              
              <p><strong>Confianza:</strong> ${data.data.confidence}%</p>
              
              <h3>Texto analizado:</h3>
              <div class="text-content">
                ${data.data.text}
              </div>
              
              ${data.data.keywords && data.data.keywords.length > 0 ? `
                <h3>Palabras clave detectadas:</h3>
                <ul>
                  ${data.data.keywords.map((keyword: string) => `<li>${keyword}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          ` : `
            <div class="result-card result-fake">
              <h2>Error en el análisis</h2>
              <p>${data.error || 'Ocurrió un error al procesar la solicitud'}</p>
            </div>
          `}
          
          <h3>Respuesta completa de la API:</h3>
          <div class="json-data">
            ${JSON.stringify(data, null, 2)}
          </div>
          
          <button class="btn" onclick="window.print()">Imprimir resultados</button>
          <button class="btn" onclick="window.close()" style="margin-left: 10px;">Cerrar ventana</button>
          
          <div class="footer">
            <p>Detector de Noticias Falsas &copy; ${new Date().getFullYear()}</p>
            <p>Una aplicación para combatir la desinformación en política</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Escribir el contenido en la nueva pestaña
    newWindow.document.open();
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  };

  // Analiza un texto único
  const analyzeText = async ({ title, body }: { title: string, body: string }) => {
    if (!title.trim() || !body.trim()) {
      setError('Por favor, ingresa tanto el título como el cuerpo de la noticia');
      return;
    }

    setIsLoading(true);
    setError(null);
    setBatchAnalysis(null);

    try {
      const response = await ApiService.analyzeText(title, body);
      
      if (response.success && response.data) {
        setSingleAnalysis(response.data);
        console.log(response, "respuesta api");
        
        // Abrir resultados en nueva pestaña
        openResultsInNewTab(response);
        
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
        
        // Abrir resultados en nueva pestaña
        openResultsInNewTab(response);
        
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
    // Implementación futura
  };

  // Reentrenar el modelo con nuevos datos
  const retrain = async (file: File) => {
    if (!file) {
      setError('Por favor, selecciona un archivo para reentrenar el modelo');
      return { success: false, error: 'No file selected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Primero subimos el archivo
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch(`http://127.0.0.1:8000/subirarchivo/`, {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.detail || 'Error al subir el archivo');
      }
      
      // Luego reentrenamos el modelo
      const response = await fetch(`http://127.0.0.1:8000/reentrenarmodelo/`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Error al reentrenar el modelo');
      }
      
      const result = {
        success: true,
        data: {
          score: data.score,
          predictions: data.predictions
        }
      };
      
      // También mostramos los resultados del reentrenamiento en una nueva pestaña
      openResultsInNewTab({
        success: true,
        data: {
          title: "Resultados del reentrenamiento",
          is_fake: false,
          probability: data.score * 100,
          confidence: 100,
          text: `El modelo ha sido reentrenado con éxito. Precisión del modelo: ${(data.score * 100).toFixed(2)}%`,
          keywords: []
        }
      });
      
      return result;
    } catch (err) {
      setError('Error al reentrenar el modelo');
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error desconocido'
      };
    } finally {
      setIsLoading(false);
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
    retrain
  };
};