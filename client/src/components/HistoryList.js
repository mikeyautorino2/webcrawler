import React from 'react';

const HistoryList = ({ history, onViewAnalysis, onClearHistory }) => {
  if (history.length === 0) {
    return (
      <div className="history-container">
        <h2>Analysis History</h2>
        <p>No analyses yet. Enter a URL above to get started.</p>
        <p><small>Your analysis history is stored locally in your browser.</small></p>
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
      <div className="history-header">
        <h2>Analysis History ({history.length})</h2>
        <button 
          className="btn btn-secondary" 
          onClick={onClearHistory}
          title="Clear all local history"
        >
          Clear History
        </button>
      </div>
      <p><small>Your analysis history is stored locally in your browser and is private to you.</small></p>
      <ul className="history-list">
        {history.map((item) => (
          <li key={item.id} className="history-item">
            <div className="history-info">
              <h3>{item.title || 'Untitled Page'}</h3>
              <p className="history-url">{item.url}</p>
              <p className="history-date">
                Analyzed: {formatDate(item.created_at)}
                {item.updated_at && ` (Updated: ${formatDate(item.updated_at)})`}
              </p>
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
