import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="container header__container">
        <div className="header__logo">
          <span className="header__logo-icon">📰</span>
          <h1 className="header__logo-text">
            News<span>Detective</span>
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;