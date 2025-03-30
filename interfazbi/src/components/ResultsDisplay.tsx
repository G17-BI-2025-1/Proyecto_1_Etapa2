// src/components/ResultsDisplay.tsx
import React from 'react';
import { NewsAnalysis, BatchAnalysisResult } from '../types';

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
        
        <div className={`card ${singleAnalysis.is_fake ? 'border-danger' : 'border-success'}`} 
             style={{ borderLeft: `4px solid ${singleAnalysis.is_fake ? '#f72585' : '#38b000'}` }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span 
              style={{ 
                background: singleAnalysis.is_fake ? '#f72585' : '#38b000',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontWeight: 'bold',
                fontSize: '0.875rem'
              }}
            >
              {singleAnalysis.is_fake ? 'NOTICIA FALSA' : 'NOTICIA REAL'}
            </span>
            <span>Confianza: {singleAnalysis.probability}%</span>
          </div>
          
          <p className="mb-3">{singleAnalysis.text}</p>
          
          <div style={{ 
            height: '8px', 
            width: '100%', 
            backgroundColor: '#e9ecef', 
            borderRadius: '4px', 
            overflow: 'hidden' 
          }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${singleAnalysis.probability}%`, 
                backgroundColor: singleAnalysis.is_fake ? '#f72585' : '#38b000', 
                borderRadius: '4px' 
              }}
            ></div>
          </div>
        </div>
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
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
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
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3a86ff', marginBottom: '0.25rem' }}>
                {((batchAnalysis.summary.real_count / batchAnalysis.summary.total) * 100).toFixed(1)}%
              </div>
              <div className="text-muted">Índice de veracidad</div>
            </div>
          </div>

          {/* Gráfico de distribución */}
          <div className="mt-4">
            <h4>Distribución de noticias</h4>
            <div style={{ 
              height: '30px', 
              width: '100%', 
              backgroundColor: '#e9ecef', 
              borderRadius: '4px', 
              overflow: 'hidden',
              display: 'flex'
            }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${(batchAnalysis.summary.fake_count / batchAnalysis.summary.total) * 100}%`, 
                  backgroundColor: '#f72585'
                }}
                title={`Noticias falsas: ${batchAnalysis.summary.fake_count}`}
              ></div>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${(batchAnalysis.summary.real_count / batchAnalysis.summary.total) * 100}%`, 
                  backgroundColor: '#38b000'
                }}
                title={`Noticias reales: ${batchAnalysis.summary.real_count}`}
              ></div>
            </div>
            <div className="d-flex justify-content-between mt-2">
              <div><span style={{ color: '#f72585', fontWeight: 'bold' }}>■</span> Noticias falsas</div>
              <div><span style={{ color: '#38b000', fontWeight: 'bold' }}>■</span> Noticias reales</div>
            </div>
          </div>
        </div>
      )}
      
      <h3 className="mb-3">Todos los resultados</h3>
      <div>
        {batchAnalysis?.items.map((news, index) => (
          <div key={index} 
               className={`card mb-3 ${news.is_fake ? 'border-danger' : 'border-success'}`}
               style={{ borderLeft: `4px solid ${news.is_fake ? '#f72585' : '#38b000'}` }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span 
                style={{ 
                  background: news.is_fake ? '#f72585' : '#38b000',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontWeight: 'bold',
                  fontSize: '0.875rem'
                }}
              >
                {news.is_fake ? 'NOTICIA FALSA' : 'NOTICIA REAL'}
              </span>
              <span>Confianza: {news.probability}%</span>
            </div>
            
            <p className="mb-2">{news.text}</p>
            
            <div style={{ 
              height: '8px', 
              width: '100%', 
              backgroundColor: '#e9ecef', 
              borderRadius: '4px', 
              overflow: 'hidden' 
            }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${news.probability}%`, 
                  backgroundColor: news.is_fake ? '#f72585' : '#38b000', 
                  borderRadius: '4px' 
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsDisplay;