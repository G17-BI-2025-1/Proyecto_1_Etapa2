import React, { useState, useEffect } from 'react';
import { useNewsAnalysis } from '../hooks/useNewsAnalysis';

interface TextAnalyzerProps {
  onAnalysisComplete: () => void;
}

const TextAnalyzer: React.FC<TextAnalyzerProps> = ({ onAnalysisComplete }) => {
  const [text, setText] = useState<string>('');
  const { analyzeText, loadExamples, examples, isLoading } = useNewsAnalysis();

  // Cargar ejemplos al montar el componente
  useEffect(() => {
    loadExamples();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await analyzeText(text);
    onAnalysisComplete();
  };

  const handleExampleClick = (exampleText: string) => {
    setText(exampleText);
  };

  return (
    <div>
      <h2 className="mb-3">Analizar Texto</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="newsText" className="form-label">
            Ingresa el texto de la noticia que deseas analizar
          </label>
          <textarea
            id="newsText"
            className="form-control textarea"
            placeholder="Pega o escribe aquí el contenido de la noticia..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
          <small className="text-muted">
            Ingresa noticias o contenido político para obtener mejores resultados
          </small>
        </div>
        
        <div className="d-flex justify-content-between mt-3">
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={() => setText('')}
          >
            Limpiar
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading || !text.trim()}
          >
            {isLoading ? 'Analizando...' : 'Analizar Texto'}
          </button>
        </div>
      </form>
      
      {examples.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2">Ejemplos de textos</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {examples.map((example, index) => (
              <div 
                key={index}
                style={{ 
                  backgroundColor: 'rgba(67, 97, 238, 0.1)',
                  borderRadius: '20px', 
                  padding: '4px 12px',
                  cursor: 'pointer'
                }}
                onClick={() => handleExampleClick(example)}
              >
                Ejemplo {index + 1}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextAnalyzer;