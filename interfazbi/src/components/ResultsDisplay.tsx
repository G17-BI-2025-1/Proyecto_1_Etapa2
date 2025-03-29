import React from 'react';
import { NewsAnalysis, BatchAnalysisResult } from '../types';
import NewsCard from './NewsCard';

interface ResultsDisplayProps {
  singleAnalysis: NewsAnalysis | null;
  batchAnalysis: BatchAnalysisResult | null;
  onBack: () => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  singleAnalysis,
  batchAnalysis,
  onBack
}) => {
  if (!singleAnalysis && !batchAnalysis) {
    return (
      <div className="card text-center" style={{ padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
        <h3 className="mb-2">No hay resultados para mostrar</h3>
        <p className="text-muted mb-3">Analiza un texto o sube un archivo CSV para ver resultados.</p>
        <button className="btn btn-primary" onClick={onBack}>
          Volver al análisis
        </button>
      </div>
    );
  }

  // Si tenemos un único análisis
  if (singleAnalysis) {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Resultado del análisis</h2>
          <button className="btn btn-outline" onClick={onBack}>
            Nuevo análisis
          </button>
        </div>
        
        <NewsCard news={singleAnalysis} />
      </div>
    );
  }

  // Si tenemos análisis por lotes (CSV)
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Resultados del análisis por lotes</h2>
        <button className="btn btn-outline" onClick={onBack}>
          Nuevo análisis
        </button>
      </div>
      
      {batchAnalysis && (
        <div className="card mb-4">
          <h3 className="mb-3">Resumen</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4361ee', marginBottom: '0.25rem' }}>
                {batchAnalysis.summary.total}
              </div>
              <div className="text-muted">Total de noticias</div>
            </div>
            
            <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f72585', marginBottom: '0.25rem' }}>
                {batchAnalysis.summary.fake_count}
              </div>
              <div className="text-muted">Noticias falsas</div>
            </div>
            
            <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#38b000', marginBottom: '0.25rem' }}>
                {batchAnalysis.summary.real_count}
              </div>
              <div className="text-muted">Noticias reales</div>
            </div>
            
            <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                {batchAnalysis.summary.average_confidence.toFixed(2)}%
              </div>
              <div className="text-muted">Confianza promedio</div>
            </div>
          </div>
        </div>
      )}
      
      <h3 className="mb-3">Todos los resultados</h3>
      <div>
        {batchAnalysis?.items.map((news, index) => (
          <NewsCard key={index} news={news} />
        ))}
      </div>
    </div>
  );
};

export default ResultsDisplay;