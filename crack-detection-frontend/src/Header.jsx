import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <div className="title-section-left">
            <h1 className="app-title">Crack Detection System</h1>
            <span className="app-subtitle">AI-Powered Structural Analysis</span>
          </div>
        </div>
        
        <div className="header-right">
          <div className="user-section">
            <div className="user-info">
              <span className="user-name">User</span>
              <span className="user-role">Analyst</span>
            </div>
            <div className="user-avatar">
              <span>U</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
