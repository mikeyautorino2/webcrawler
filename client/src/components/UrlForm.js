import React, { useState } from 'react';

const UrlForm = ({ onSubmit, onBulkSubmit, error, isLoading }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isBulkMode) {
      if (!bulkUrls.trim()) return;
      
      // Parse URLs from textarea (one per line)
      const urls = bulkUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);
      
      if (urls.length === 0) return;
      if (urls.length > 50) {
        alert('Maximum 50 URLs allowed for bulk analysis');
        return;
      }
      
      onBulkSubmit(urls);
    } else {
      if (!inputUrl.trim()) return;
      onSubmit(inputUrl);
    }
  };

  const toggleMode = () => {
    setIsBulkMode(!isBulkMode);
    setInputUrl('');
    setBulkUrls('');
  };

  return (
    <div className="url-form">
      <div className="form-header">
        <h2>Analyze {isBulkMode ? 'Multiple Websites' : 'Any Website'}</h2>
        <button 
          type="button" 
          className="btn-secondary"
          onClick={toggleMode}
          disabled={isLoading}
        >
          Switch to {isBulkMode ? 'Single' : 'Bulk'} Mode
        </button>
      </div>
      
      <p>
        {isBulkMode 
          ? 'Enter multiple URLs (one per line) to analyze them all at once. Maximum 50 URLs.' 
          : 'Enter a URL to extract metadata, analyze content, and gather insights.'
        }
      </p>
      
      <form onSubmit={handleSubmit}>
        {isBulkMode ? (
          <div className="input-group">
            <textarea
              className="bulk-url-input"
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              placeholder={`https://example.com\nhttps://google.com\nhttps://github.com\n...`}
              rows="8"
              aria-label="URLs to analyze (one per line)"
              disabled={isLoading}
            />
            <div className="bulk-info">
              URLs: {bulkUrls.split('\n').filter(url => url.trim().length > 0).length}/50
            </div>
            <button 
              type="submit" 
              className="btn"
              disabled={!bulkUrls.trim() || isLoading}
            >
              {isLoading ? 'Analyzing...' : 'Analyze All URLs'}
            </button>
          </div>
        ) : (
          <div className="input-group">
            <input
              type="text"
              className="url-input"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://example.com"
              aria-label="URL to analyze"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="btn"
              disabled={!inputUrl.trim() || isLoading}
            >
              {isLoading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        )}
        
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
};

export default UrlForm;
