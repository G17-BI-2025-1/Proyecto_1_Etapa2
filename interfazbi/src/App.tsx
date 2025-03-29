import React, { useState } from 'react';
import Header from './components/Header';
import TextAnalyzer from './components/TextAnalyzer';
import FileUploader from './components/FileUploader';
import ResultsDisplay from './components/ResultsDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import { useNewsAnalysis } from './hooks/useNewsAnalysis';
import './styles/main.scss';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [showResults, setShowResults] = useState<boolean>(false);
  const { singleAnalysis, batchAnalysis, isLoading, error, resetAnalysis } = useNewsAnalysis();

  const handleAnalysisComplete = () => {
    setShowResults(true);
  };

  const handleBack = () => {
    resetAnalysis();
    setShowResults(false);
  };

  return (
    <div className="App">
      <Header />
      
      <main className="container mt-4">
        {error && (
          <div className="card mb-3" style={{ borderLeft: '4px solid #e63946', padding: '1rem' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {isLoading && <LoadingSpinner message="Analizando contenido..." />}
        
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
            </div>
            
            {activeTab === 'text' ? (
              <TextAnalyzer onAnalysisComplete={handleAnalysisComplete} />
            ) : (
              <FileUploader onAnalysisComplete={handleAnalysisComplete} />
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