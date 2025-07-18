import React, { useState } from 'react';

const UrlForm = ({ onSubmit, error }) => {
  const [inputUrl, setInputUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!inputUrl.trim()) {
      return;
    }
    
    // Call the parent component's submit handler
    onSubmit(inputUrl);
  };

  return (
    <div className="url-form">
      <h2>Analyze Any Website</h2>
      <p>Enter a URL to extract metadata, analyze content, and gather insights.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="text"
            className="url-input"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="https://example.com"
            aria-label="URL to analyze"
          />
          <button 
            type="submit" 
            className="btn"
            disabled={!inputUrl.trim()}
          >
            Analyze
          </button>
        </div>
        
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
};

export default UrlForm;
