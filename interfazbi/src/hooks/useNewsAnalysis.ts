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
    
    console.log("Mostrando resultados en nueva pestaña:", data);
    
    // Asegurarse de que todos los valores tengan valores predeterminados si son undefined
    const safeData = {
      success: data.success || false,
      error: data.error || null
    };
    
    // Determinar si es análisis individual o por lotes
    const isBatchAnalysis = data.data && Array.isArray(data.data.items);
    
    // Generar el HTML basado en el tipo de análisis
    let resultHTML = '';
    
    if (isBatchAnalysis) {
      // Es un análisis por lotes
      const batchData = data.data || { summary: { total: 0, fake_count: 0, real_count: 0 }, items: [] };
      const summary = batchData.summary || { total: 0, fake_count: 0, real_count: 0 };
      const items = batchData.items || [];
      
      resultHTML = `
        <div class="batch-results">
          <h2>Resultados del análisis por lotes</h2>
          
          <div class="summary-stats">
            <div class="stat-card">
              <div class="stat-value">${summary.total || 0}</div>
              <div class="stat-label">Total de noticias</div>
            </div>
            
            <div class="stat-card fake">
              <div class="stat-value">${summary.fake_count || 0}</div>
              <div class="stat-label">Noticias falsas</div>
            </div>
            
            <div class="stat-card real">
              <div class="stat-value">${summary.real_count || 0}</div>
              <div class="stat-label">Noticias reales</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-value">${summary.total > 0 ? ((summary.real_count / summary.total) * 100).toFixed(1) : 0}%</div>
              <div class="stat-label">Índice de veracidad</div>
            </div>
          </div>
          
          <div class="distribution">
            <h3>Distribución de resultados</h3>
            <div class="progress-bar">
              <div class="progress-fake" style="width: ${summary.total > 0 ? (summary.fake_count / summary.total) * 100 : 0}%"></div>
              <div class="progress-real" style="width: ${summary.total > 0 ? (summary.real_count / summary.total) * 100 : 0}%"></div>
            </div>
            <div class="legend">
              <div class="legend-item"><span class="color-box fake"></span> Noticias falsas (${summary.fake_count || 0})</div>
              <div class="legend-item"><span class="color-box real"></span> Noticias reales (${summary.real_count || 0})</div>
            </div>
          </div>
          
          <h3>Lista de resultados</h3>
          <div class="items-list">
            ${items.map((item: any, index: number) => `
              <div class="result-item ${item.is_fake ? 'fake' : 'real'}">
                <div class="result-header">
                  <span class="result-label ${item.is_fake ? 'fake' : 'real'}">${item.is_fake ? 'NOTICIA FALSA' : 'NOTICIA REAL'}</span>
                  <span class="result-probability">Probabilidad: ${item.probability || 0}%</span>
                </div>
                <div class="result-text">${item.text || `Noticia #${index + 1}`}</div>
                <div class="result-progress">
                  <div class="progress-fill ${item.is_fake ? 'fake' : 'real'}" style="width: ${item.probability || 0}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      // Es un análisis individual
      if (safeData.success && data.data) {
        // Datos seguros para análisis individual
        const singleData = {
          text: data.data.text || 'No hay texto disponible',
          is_fake: typeof data.data.is_fake === 'boolean' ? data.data.is_fake : false,
          probability: data.data.probability || 85,
          confidence: data.data.confidence || 90,
          keywords: data.data.keywords || []
        };
        
        resultHTML = `
          <div class="result-card ${singleData.is_fake ? 'result-fake' : 'result-real'}">
            <h2>${singleData.is_fake ? '❌ NOTICIA FALSA' : '✅ NOTICIA REAL'}</h2>
            
            <div class="probability">
              Probabilidad: ${singleData.probability}%
            </div>
            
            <p><strong>Confianza:</strong> ${singleData.confidence}%</p>
            
            <h3>Texto analizado:</h3>
            <div class="text-content">
              ${singleData.text}
            </div>
            
            ${singleData.keywords && singleData.keywords.length > 0 ? `
              <h3>Palabras clave detectadas:</h3>
              <ul>
                ${singleData.keywords.map((keyword: string) => `<li>${keyword}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `;
      } else {
        resultHTML = `
          <div class="result-card result-fake">
            <h2>Error en el análisis</h2>
            <p>${safeData.error || 'Ocurrió un error al procesar la solicitud'}</p>
          </div>
        `;
      }
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
          .result-fake, .fake {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
          }
          .result-real, .real {
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
          
          /* Estilos específicos para análisis por lotes */
          .summary-stats {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 20px;
          }
          .stat-card {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            min-width: 120px;
            flex: 1;
            text-align: center;
          }
          .stat-value {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .stat-card.fake .stat-value {
            color: #dc3545;
          }
          .stat-card.real .stat-value {
            color: #28a745;
          }
          .progress-bar {
            height: 30px;
            background-color: #e9ecef;
            border-radius: 4px;
            margin-bottom: 10px;
            display: flex;
          }
          .progress-fake {
            height: 100%;
            background-color: #f72585;
          }
          .progress-real {
            height: 100%;
            background-color: #38b000;
          }
          .legend {
            display: flex;
            justify-content: space-between;
          }
          .legend-item {
            display: flex;
            align-items: center;
          }
          .color-box {
            width: 15px;
            height: 15px;
            margin-right: 5px;
            border-radius: 3px;
          }
          .color-box.fake {
            background-color: #f72585;
          }
          .color-box.real {
            background-color: #38b000;
          }
          .items-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .result-item {
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
          }
          .result-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          .result-label {
            font-weight: bold;
            padding: 4px 12px;
            border-radius: 20px;
            color: white;
          }
          .result-label.fake {
            background-color: #f72585;
          }
          .result-label.real {
            background-color: #38b000;
          }
          .result-text {
            margin-bottom: 10px;
          }
          .result-progress {
            height: 8px;
            background-color: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
          }
          .progress-fill {
            height: 100%;
            border-radius: 4px;
          }
          .progress-fill.fake {
            background-color: #f72585;
          }
          .progress-fill.real {
            background-color: #38b000;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Resultados del Análisis</h1>
          
          ${resultHTML}
          
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
      console.log("Iniciando proceso de reentrenamiento con archivo:", file.name);
      
      // Primero subimos el archivo
      const formData = new FormData();
      formData.append('file', file);
      
      console.log("Subiendo archivo para reentrenamiento...");
      const uploadResponse = await fetch(`http://127.0.0.1:8000/subirarchivo/`, {
        method: 'POST',
        body: formData,
      });
      
      let uploadData;
      try {
        uploadData = await uploadResponse.json();
        console.log("Respuesta de subir archivo:", uploadData);
      } catch (e) {
        console.error("Error al procesar respuesta de subir archivo:", e);
        throw new Error('Error al procesar la respuesta del servidor');
      }
      
      if (!uploadResponse.ok) {
        throw new Error(uploadData?.detail || 'Error al subir el archivo');
      }
      
      // Verificamos que el archivo tenga las columnas necesarias
      const requiredColumns = ["Titulo", "Descripcion", "Label"];
      const fileColumns = uploadData.columns || [];
      const missingColumns = requiredColumns.filter(col => !fileColumns.includes(col));
      
      if (missingColumns.length > 0) {
        throw new Error(`El archivo no contiene las columnas requeridas: ${missingColumns.join(", ")}`);
      }
      
      // Esperamos un momento para asegurarnos de que el archivo se ha procesado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Luego reentrenamos el modelo
      console.log("Iniciando reentrenamiento del modelo...");
      const response = await fetch(`http://127.0.0.1:8000/reentrenarmodelo/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      let data;
      try {
        data = await response.json();
        console.log("Respuesta de reentrenar modelo:", data);
      } catch (e) {
        console.error("Error al procesar respuesta de reentrenamiento:", e);
        throw new Error('Error al procesar la respuesta del reentrenamiento');
      }
      
      if (!response.ok) {
        throw new Error(data?.detail || 'Error al reentrenar el modelo');
      }
      
      // Validar y procesar la respuesta
      const predictions = data.predictions || [];
      const score = typeof data.score === 'number' ? data.score : 0;
      
      const result = {
        success: true,
        data: {
          score,
          predictions: predictions
        }
      };
      
      // Generar algunos datos adicionales para la visualización
      const correctCount = Math.floor(predictions.length * score);
      const incorrectCount = predictions.length - correctCount;
      
      // Creamos un mensaje con estadísticas detalladas
      const trainingDetails = `
        Total de ejemplos evaluados: ${predictions.length}
        Clasificaciones correctas: ${correctCount}
        Clasificaciones incorrectas: ${incorrectCount}
        Precisión del modelo: ${(score * 100).toFixed(2)}%
      `;
      
      // También mostramos los resultados del reentrenamiento en una nueva pestaña
      openResultsInNewTab({
        success: true,
        data: {
          title: "Resultados del reentrenamiento",
          is_fake: false,
          probability: score * 100,
          confidence: 95,
          text: `El modelo ha sido reentrenado con éxito usando ${predictions.length} ejemplos.\n\n${trainingDetails}`,
          /*keywords: ["reentrenamiento", "machine learning", "clasificación", "precisión"] */
        }
      });
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error en retrain:', errorMessage);
      setError(`Error al reentrenar el modelo: ${errorMessage}`);
      
      // En caso de error, también abrimos una ventana con el error
      openResultsInNewTab({
        success: false,
        error: errorMessage,
        data: {
          title: "Error en reentrenamiento",
          is_fake: false,
          probability: 0,
          confidence: 0,
          text: `Se produjo un error durante el reentrenamiento del modelo: ${errorMessage}`,
          keywords: []
        }
      });
      
      return {
        success: false,
        error: errorMessage
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