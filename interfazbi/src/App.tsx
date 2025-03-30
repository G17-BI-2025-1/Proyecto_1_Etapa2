// Actualizar en src/App.tsx
import React, { useState } from 'react';
import Header from './components/Header';
import TextAnalyzer from './components/TextAnalyzer';
import FileUploader from './components/FileUploader';
import ResultsDisplay from './components/ResultsDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import ModelTrainer from './components/ModelTrainer';  // Importar el nuevo componente
import { useNewsAnalysis } from './hooks/useNewsAnalysis';
import './styles/main.scss';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'text' | 'file' | 'train'>('text');  // Añadir 'train'
  const [showResults, setShowResults] = useState<boolean>(false);
  const { singleAnalysis, batchAnalysis, isLoading, error, resetAnalysis } = useNewsAnalysis();

  const handleAnalysisComplete = () => {
    setShowResults(true);
  };

  const handleTrainingComplete = () => {
    // Puedes mostrar un mensaje o actualizar algún estado aquí
    console.log('Entrenamiento completado');
  };

  const handleBack = () => {
    resetAnalysis();
    setShowResults(false);
  };

  return (
    <div className="App">
      <Header />
      
      <main className="container mt-4">
        {/* Mensaje explicativo al inicio */}
        <div className="card mb-4">
          <h3 className="mb-3">¿Cómo funciona esta aplicación?</h3>
          <p>
            Esta aplicación utiliza inteligencia artificial para analizar y detectar noticias falsas sobre temas políticos. 
            El sistema examina patrones lingüísticos, fuentes y contenido para determinar la probabilidad de que una noticia sea falsa.
          </p>
          
          <h4 className="mt-3 mb-2">Instrucciones de uso:</h4>
          <ol>
            <li><strong>Análisis de texto:</strong> Ingresa el texto completo de una noticia en el campo de texto y haz clic en "Analizar Texto".</li>
            <li><strong>Análisis de archivo CSV:</strong> Sube un archivo CSV que contenga múltiples textos para analizarlos en lote.</li>
            <li><strong>Reentrenamiento:</strong> Sube un archivo CSV con datos etiquetados para mejorar la precisión del modelo.</li>
            <li><strong>Resultados:</strong> El sistema mostrará una puntuación de probabilidad indicando si la noticia es falsa o real.</li>
            <li><strong>Palabras clave:</strong> Se resaltarán términos clave que el algoritmo utiliza para tomar su decisión.</li>
          </ol>
          
          <h4 className="mt-3 mb-2">Interpretación de resultados:</h4>
          <ul>
            <li><strong>Noticia Falsa (rojo):</strong> El texto muestra características de desinformación.</li>
            <li><strong>Noticia Real (verde):</strong> El texto presenta indicadores de información verificable.</li>
            <li><strong>Porcentaje:</strong> Representa la probabilidad de que la clasificación sea correcta.</li>
          </ul>
          
          <p className="mt-3">
            <strong>Importante:</strong> Esta herramienta es un apoyo para el análisis crítico de noticias, pero no reemplaza la verificación humana.
            Siempre contrasta la información con fuentes confiables.
          </p>
        </div>

        {error && (
          <div className="card mb-3" style={{ borderLeft: '4px solid #e63946', padding: '1rem' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {isLoading && <LoadingSpinner message="Procesando solicitud..." />}
        
        {!isLoading && !showResults && (
          <div className="card">
            <div className="tabs">
              <div 
                className={`tab ${activeTab === 'text' ? 'active' : ''}`}
                onClick={() => setActiveTab('text')}
              >
                Analizar Texto
              </div>
              <div 
                className={`tab ${activeTab === 'file' ? 'active' : ''}`}
                onClick={() => setActiveTab('file')}
              >
                Analizar CSV
              </div>
              <div 
                className={`tab ${activeTab === 'train' ? 'active' : ''}`}
                onClick={() => setActiveTab('train')}
              >
                Reentrenar Modelo
              </div>
            </div>
            
            {activeTab === 'text' ? (
              <TextAnalyzer onAnalysisComplete={handleAnalysisComplete} />
            ) : activeTab === 'file' ? (
              <FileUploader onAnalysisComplete={handleAnalysisComplete} />
            ) : (
              <ModelTrainer onTrainingComplete={handleTrainingComplete} />
            )}
          </div>
        )}
        
        {!isLoading && showResults && (
          <ResultsDisplay 
            singleAnalysis={singleAnalysis} 
            batchAnalysis={batchAnalysis} 
            onBack={handleBack} 
          />
        )}
      </main>
      
      <footer className="text-center mt-4 mb-4 text-muted">
        <div className="container">
          <p>Detector de Noticias Falsas &copy; {new Date().getFullYear()}</p>
          <p>Una aplicación para combatir la desinformación en política</p>
        </div>
      </footer>
    </div>
  );
};

export default App;