// src/components/ModelTrainer.tsx
import React, { useState } from 'react';
import { useNewsAnalysis } from '../hooks/useNewsAnalysis';

interface ModelTrainerProps {
  onTrainingComplete: () => void;
}

const ModelTrainer: React.FC<ModelTrainerProps> = ({ onTrainingComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [score, setScore] = useState<number | null>(null);
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const { retrain } = useNewsAnalysis();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setTrainingError(null);
    
    if (selectedFile) {
      // Validar que sea un archivo CSV
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setTrainingError('Por favor, selecciona un archivo CSV válido.');
        return;
      }
      
      // Validar tamaño del archivo (máximo 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setTrainingError('El archivo es demasiado grande. El tamaño máximo permitido es 10MB.');
        return;
      }
      
      setFile(selectedFile);
      console.log("Archivo seleccionado:", selectedFile.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrainingError(null);
    
    if (!file) {
      setTrainingError('Por favor, selecciona un archivo CSV para reentrenar el modelo.');
      return;
    }
    
    try {
      setIsTraining(true);
      console.log("Iniciando reentrenamiento con archivo:", file.name);
      
      const result = await retrain(file);
      
      if (result.success && 'data' in result) {
        const trainingScore = result.data.score || 0;
        setScore(trainingScore);
        console.log("Reentrenamiento exitoso. Score:", trainingScore);
        onTrainingComplete();
      } else {
        if ('error' in result) {
          setTrainingError(result.error || 'Error desconocido durante el reentrenamiento.');
        } else {
          setTrainingError('Error desconocido durante el reentrenamiento.');
        }
        if ('error' in result) {
          console.error("Error en reentrenamiento:", result.error);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado durante el reentrenamiento.';
      setTrainingError(errorMessage);
      console.error("Excepción durante reentrenamiento:", errorMessage);
    } finally {
      setIsTraining(false);
    }
  };
  
  // Función para formatear el archivo a un formato legible
  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} bytes`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="card">
      <h2 className="mb-3">Reentrenar Modelo</h2>
      <p className="mb-3">
        Sube un archivo CSV con datos etiquetados para reentrenar el modelo y mejorar su precisión.
        El archivo debe contener columnas para "Titulo", "Descripcion" y "Label" (0 para noticias reales, 1 para falsas).
      </p>
      
      {trainingError && (
        <div className="alert alert-danger mb-3">
          <strong>Error:</strong> {trainingError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="trainingFile" className="form-label">
            Archivo CSV de entrenamiento
          </label>
          <input
            type="file"
            id="trainingFile"
            className="form-control"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            disabled={isTraining}
            required
          />
          {file && (
            <div className="mt-2 text-muted">
              <strong>Archivo seleccionado:</strong> {file.name} ({formatFileSize(file.size)})
            </div>
          )}
          <small className="text-muted">
            Asegúrate de que el archivo esté correctamente formateado y contenga datos etiquetados.
          </small>
        </div>
        
        <div className="d-flex justify-content-between mt-3">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!file || isTraining}
          >
            {isTraining ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Entrenando modelo...
              </>
            ) : 'Reentrenar Modelo'}
          </button>
        </div>
      </form>
      
      {score !== null && (
        <div className="mt-3 p-3" style={{ backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
          <h4>Resultados del reentrenamiento:</h4>
          <p>Precisión del modelo: <strong>{(score * 100).toFixed(2)}%</strong></p>
          <p>El modelo ha sido reentrenado correctamente con los nuevos datos proporcionados.</p>
        </div>
      )}
      
      <div className="mt-4 pt-3 border-top">
        <h4>Instrucciones para la preparación del CSV:</h4>
        <ol>
          <li>El archivo debe contener las columnas <strong>Titulo</strong>, <strong>Descripcion</strong> y <strong>Label</strong>.</li>
          <li>La columna <strong>Label</strong> debe contener valores numéricos: 0 para noticias reales y 1 para noticias falsas.</li>
          <li>Utiliza un delimitador de punto y coma (;).</li>
          <li>Se recomienda incluir al menos 50 ejemplos para un reentrenamiento efectivo.</li>
          <li>Intenta mantener un balance entre ejemplos de noticias reales y falsas.</li>
        </ol>
      </div>
    </div>
  );
};

export default ModelTrainer;