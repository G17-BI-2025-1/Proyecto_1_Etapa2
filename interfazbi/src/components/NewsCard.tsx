import React from 'react';
import { NewsAnalysis } from '../types';

interface NewsCardProps {
  news: NewsAnalysis;
}

const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  return (
    <div className={`card news-card ${news.is_fake ? 'news-card--fake' : 'news-card--real'}`}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className={`news-card__tag ${news.is_fake ? 'news-card__tag--fake' : 'news-card__tag--real'}`}>
          {news.is_fake ? 'NOTICIA FALSA' : 'NOTICIA REAL'}
        </span>
        <span>{news.probability.toFixed(2)}% de probabilidad</span>
      </div>
      
      <p className="mb-3">{news.text}</p>
      
      <div className="news-card__probability-bar">
        <div 
          className={`news-card__probability-bar-fill ${news.is_fake ? 'news-card__probability-bar-fill--fake' : 'news-card__probability-bar-fill--real'}`}
          style={{ width: `${news.probability}%` }}
        ></div>
      </div>
      
      {news.keywords && news.keywords.length > 0 && (
        <div className="mt-3">
          <p className="text-muted mb-1">Palabras clave:</p>
          <div>
            {news.keywords.map((keyword, index) => (
              <span key={index} style={{ 
                backgroundColor: '#f0f0f0', 
                padding: '2px 8px', 
                borderRadius: '4px', 
                marginRight: '5px', 
                fontSize: '0.8rem' 
              }}>
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsCard;