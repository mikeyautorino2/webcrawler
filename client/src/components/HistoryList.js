import React from 'react';

const HistoryList = ({ history, onViewAnalysis }) => {
  if (history.length === 0) {
    return (
      <div className="history-container">
        <h2>Analysis History</h2>
        <p>No analyses yet. Enter a URL above to get started.</p>
      </div>
    );
  }

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="history-container">
      <h2>Analysis History</h2>
      <ul className="history-list">
        {history.map((item) => (
          <li key={item.id} className="history-item">
            <div className="history-info">
              <h3>{item.title || 'Untitled Page'}</h3>
              <p className="history-url">{item.url}</p>
              <p className="history-date">Analyzed: {formatDate(item.created_at)}</p>
            </div>
            <button 
              className="btn" 
              onClick={() => onViewAnalysis(item.id)}
            >
              View Results
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HistoryList;
