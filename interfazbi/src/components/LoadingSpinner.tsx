import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Cargando...' 
}) => {
  return (
    <div className="loading-spinner">
      <div className="loading-spinner__spinner"></div>
      <div className="loading-spinner__text">{message}</div>
    </div>
  );
};

export default LoadingSpinner;