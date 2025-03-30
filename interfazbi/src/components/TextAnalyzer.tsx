// src/components/TextAnalyzer.tsx
import React, { useState, useEffect } from 'react';
import { useNewsAnalysis } from '../hooks/useNewsAnalysis';

interface TextAnalyzerProps {
  onAnalysisComplete: () => void;
}

const TextAnalyzer: React.FC<TextAnalyzerProps> = ({ onAnalysisComplete }) => {
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const { analyzeText, loadExamples, examples, isLoading } = useNewsAnalysis();

  // Cargar ejemplos al montar el componente
  useEffect(() => {
    loadExamples();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Modificar para enviar tanto el título como el cuerpo
    await analyzeText({ title, body });
    onAnalysisComplete();
  };

  const handleExampleClick = (exampleText: string) => {
    // Para simplificar, usamos el ejemplo completo como cuerpo
    // y generamos un título basado en las primeras palabras
    const words = exampleText.split(' ');
    const exampleTitle = words.slice(0, 5).join(' ') + '...';
    setTitle(exampleTitle);
    setBody(exampleText);
  };

  return (
    <div>
      <h2 className="mb-3">Analizar Texto</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Campo para el título de la noticia */}
        <div className="form-group">
          <label htmlFor="newsTitle" className="form-label">
            Título de la noticia
          </label>
          <input
            id="newsTitle"
            className="form-control"
            type="text"
            placeholder="Ingresa el título de la noticia..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        {/* Campo para el cuerpo de la noticia */}
        <div className="form-group mt-3">
          <label htmlFor="newsBody" className="form-label">
            Cuerpo de la noticia
          </label>
          <textarea
            id="newsBody"
            className="form-control textarea"
            placeholder="Ingresa el contenido completo de la noticia..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
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
            onClick={() => {
              setTitle('');
              setBody('');
            }}
          >
            Limpiar
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading || !title.trim() || !body.trim()}
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