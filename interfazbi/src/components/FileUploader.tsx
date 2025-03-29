import React, { useState, useRef } from 'react';
import { useNewsAnalysis } from '../hooks/useNewsAnalysis';

interface FileUploaderProps {
  onAnalysisComplete: () => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onAnalysisComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { analyzeFile, isLoading } = useNewsAnalysis();

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

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      await analyzeFile(file);
      onAnalysisComplete();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div>
      <h2 className="mb-3">Analizar Archivo CSV</h2>
      
      <form onSubmit={handleSubmit}>
        <div 
          style={{
            border: '2px dashed #dee2e6',
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center',
            cursor: 'pointer',
            marginBottom: '1.5rem'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={{ fontSize: '3rem', color: '#4361ee', marginBottom: '1rem' }}>📄</div>
          <h3 style={{ marginBottom: '0.5rem' }}>
            {file ? 'Cambiar archivo' : 'Arrastra aquí tu archivo CSV o haz clic para seleccionarlo'}
          </h3>
          <p className="text-muted">
            El archivo debe estar en formato CSV con una columna de texto para analizar
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,text/csv"
            style={{ display: 'none' }}
          />
        </div>

        {file && (
          <div 
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(67, 97, 238, 0.1)',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📊</span>
              <div>
                <div style={{ fontWeight: 500 }}>{file.name}</div>
                <div className="text-muted" style={{ fontSize: '0.875rem' }}>{formatFileSize(file.size)}</div>
              </div>
            </div>
            <button
              type="button"
              style={{
                color: '#e63946',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                fontSize: '1.25rem'
              }}
              onClick={handleRemoveFile}
            >
              ✕
            </button>
          </div>
        )}

        <div className="d-flex justify-content-between mt-3">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!file || isLoading}
          >
            {isLoading ? 'Analizando...' : 'Analizar CSV'}
          </button>
        </div>
      </form>

      <div 
        className="mt-3" 
        style={{ 
          padding: '1rem', 
          backgroundColor: 'rgba(76, 201, 240, 0.1)', 
          borderRadius: '8px',
          fontSize: '0.875rem'
        }}
      >
        <h4 style={{ fontSize: '1rem', color: '#4cc9f0', marginBottom: '0.25rem' }}>Formato esperado del CSV:</h4>
        <p>
          El archivo CSV debe contener al menos una columna con el texto a analizar.
          Idealmente, debe tener una cabecera con los nombres de las columnas.
        </p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
          <li>Separado por comas (,)</li>
          <li>Codificación UTF-8</li>
          <li>Máximo 100 filas para un mejor rendimiento</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUploader;