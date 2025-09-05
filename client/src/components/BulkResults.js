import React, { useState } from 'react';
import { exportResults } from '../utils/api';

const BulkResults = ({ results, errors, summary, onSelectResult, onExport }) => {
  const [sortBy, setSortBy] = useState('index');
  const [filterBy, setFilterBy] = useState('all');
  const [showErrors, setShowErrors] = useState(false);

  if (!results && !errors) return null;

  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return (a.data.title || '').localeCompare(b.data.title || '');
      case 'seo':
        return (b.data.seo_analysis?.score || 0) - (a.data.seo_analysis?.score || 0);
      case 'wordCount':
        return (b.data.word_count || 0) - (a.data.word_count || 0);
      case 'links':
        return (b.data.link_counts?.total || 0) - (a.data.link_counts?.total || 0);
      default:
        return a.index - b.index;
    }
  });

  const filteredResults = sortedResults.filter(result => {
    if (filterBy === 'all') return true;
    if (filterBy === 'high-seo') return result.data.seo_analysis?.score >= 80;
    if (filterBy === 'low-seo') return result.data.seo_analysis?.score < 60;
    return true;
  });

  const handleExport = async () => {
    try {
      const dataToExport = results.map(r => r.data);
      await exportResults(dataToExport, 'json');
    } catch (error) {
      alert('Failed to export results: ' + error.message);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="bulk-results">
      <div className="bulk-results-header">
        <h2>Bulk Analysis Results</h2>
        <div className="summary-stats">
          <span className="stat success">✓ {summary.successful} successful</span>
          <span className="stat error">✗ {summary.failed} failed</span>
          <span className="stat total">Total: {summary.total}</span>
        </div>
      </div>

      <div className="results-controls">
        <div className="controls-row">
          <div className="sort-filter-controls">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="index">Sort by Order</option>
              <option value="title">Sort by Title</option>
              <option value="seo">Sort by SEO Score</option>
              <option value="wordCount">Sort by Word Count</option>
              <option value="links">Sort by Link Count</option>
            </select>

            <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
              <option value="all">All Results</option>
              <option value="high-seo">High SEO (80+)</option>
              <option value="low-seo">Low SEO (&lt;60)</option>
            </select>
          </div>

          <div className="action-controls">
            <button className="btn-secondary" onClick={handleExport}>
              Export JSON
            </button>
            {errors.length > 0 && (
              <button 
                className="btn-secondary" 
                onClick={() => setShowErrors(!showErrors)}
              >
                {showErrors ? 'Hide' : 'Show'} Errors ({errors.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {showErrors && errors.length > 0 && (
        <div className="error-section">
          <h3>Failed Analyses</h3>
          <div className="error-list">
            {errors.map((error, index) => (
              <div key={index} className="error-item">
                <strong>{error.url}</strong>
                <span className="error-message">{error.error}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="results-grid">
        {filteredResults.map((result) => (
          <div 
            key={result.index} 
            className="result-card"
            onClick={() => onSelectResult(result.data)}
          >
            <div className="result-header">
              <h3 className="result-title">
                {result.data.title || 'Untitled Page'}
              </h3>
              <div 
                className="seo-score"
                style={{ backgroundColor: getScoreColor(result.data.seo_analysis?.score || 0) }}
              >
                {result.data.seo_analysis?.score || 0}
              </div>
            </div>
            
            <p className="result-url">{result.url}</p>
            
            <div className="result-stats">
              <div className="stat-item">
                <span className="stat-label">Words:</span>
                <span className="stat-value">{result.data.word_count || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Links:</span>
                <span className="stat-value">{result.data.link_counts?.total || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Images:</span>
                <span className="stat-value">{result.data.images?.length || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">H1s:</span>
                <span className="stat-value">{result.data.headings?.h1?.length || 0}</span>
              </div>
            </div>

            {result.data.performance_metrics && (
              <div className="performance-info">
                <span>Load: {result.data.performance_metrics.response_time_ms}ms</span>
                <span>Size: {Math.round(result.data.performance_metrics.content_size_bytes / 1024)}KB</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredResults.length === 0 && (
        <div className="no-results">
          <p>No results match your current filters.</p>
        </div>
      )}
    </div>
  );
};

export default BulkResults;