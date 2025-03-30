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
  const { retrain } = useNewsAnalysis();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        alert('Por favor, selecciona un archivo CSV válido.');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      setIsTraining(true);
      const result = await retrain(file);
      setIsTraining(false);
      
      if (result.success && result.data) {
        setScore(result.data.score);
        onTrainingComplete();
      }
    }
  };

  return (
    <div className="card">
      <h2 className="mb-3">Reentrenar Modelo</h2>
      <p className="mb-3">
        Sube un archivo CSV con datos etiquetados para reentrenar el modelo y mejorar su precisión.
        El archivo debe contener columnas para "Titulo", "Descripcion" y "Label" (0 para noticias reales, 1 para falsas).
      </p>
      
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
            required
          />
        </div>
        
        <div className="d-flex justify-content-between mt-3">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!file || isTraining}
          >
            {isTraining ? 'Entrenando...' : 'Reentrenar Modelo'}
          </button>
        </div>
      </form>
      
      {score !== null && (
        <div className="mt-3 p-3" style={{ backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
          <h4>Resultados del reentrenamiento:</h4>
          <p>Precisión del modelo: <strong>{(score * 100).toFixed(2)}%</strong></p>
        </div>
      )}
    </div>
  );
};

export default ModelTrainer;