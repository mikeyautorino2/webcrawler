import React, { useState, useMemo } from 'react';

const HistoryList = ({ history, onViewAnalysis, onClearHistory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [dateFilter, setDateFilter] = useState('all');

  // Filter and sort history items
  const filteredAndSortedHistory = useMemo(() => {
    let filtered = history;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.title?.toLowerCase().includes(term) ||
        item.url?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      );
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }

      if (dateFilter !== 'all') {
        filtered = filtered.filter(item => 
          new Date(item.created_at) >= filterDate
        );
      }
    }

    // Sort results
    const sorted = [...filtered].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = (a.title || 'Untitled').toLowerCase();
          bValue = (b.title || 'Untitled').toLowerCase();
          break;
        case 'url':
          aValue = a.url.toLowerCase();
          bValue = b.url.toLowerCase();
          break;
        case 'date':
        default:
          aValue = new Date(a.updated_at || a.created_at);
          bValue = new Date(b.updated_at || b.created_at);
          break;
      }

      if (sortBy === 'date') {
        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      } else {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'desc' ? -comparison : comparison;
      }
    });

    return sorted;
  }, [history, searchTerm, sortBy, sortOrder, dateFilter]);

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
      
      {/* Search and Filter Controls */}
      <div className="history-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search by URL, title, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="clear-search-btn"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        
        <div className="filter-section">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
            <option value="url">Sort by URL</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="sort-order-btn"
            title={`Sort ${sortOrder === 'desc' ? 'ascending' : 'descending'}`}
          >
            {sortOrder === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <p>
          <small>
            Showing {filteredAndSortedHistory.length} of {history.length} analyses
            {searchTerm && ` matching "${searchTerm}"`}
            {dateFilter !== 'all' && ` from ${dateFilter}`}
          </small>
        </p>
      </div>

      <p><small>Your analysis history is stored locally in your browser and is private to you.</small></p>
      
      {filteredAndSortedHistory.length === 0 ? (
        <div className="no-results">
          <p>No analyses match your current filters.</p>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="btn btn-secondary"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <ul className="history-list">
          {filteredAndSortedHistory.map((item) => (
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
      )}
    </div>
  );
};

export default HistoryList;
