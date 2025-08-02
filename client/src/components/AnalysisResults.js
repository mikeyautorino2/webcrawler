import React from 'react';
import StatsGrid from './StatsGrid';

const AnalysisResults = ({ data, onReanalyze }) => {
  if (!data) return null;
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="results-container">
      <div className="results-header">
        <h2 className="results-title">{data.title || 'Untitled Page'}</h2>
        <p className="results-description">{data.description || 'No description available'}</p>
        <p className="history-url">{data.url}</p>
        <p className="history-date">Analyzed: {formatDate(data.created_at)}</p>
        <button className="btn" onClick={onReanalyze} style={{ marginTop: '10px' }}>
          Re-analyze
        </button>
      </div>
      
      <div className="results-content">
        <StatsGrid data={data} />
        
        {/* Headings Section */}
        <div className="section">
          <h3 className="section-title">Headings</h3>
          
          <div className="headings-list">
            {data.headings?.h1?.length > 0 && (
              <>
                <h4>H1 Tags ({data.headings.h1.length})</h4>
                <ul>
                  {data.headings.h1.map((heading, index) => (
                    <li key={`h1-${index}`}>{heading}</li>
                  ))}
                </ul>
              </>
            )}
            
            {data.headings?.h2?.length > 0 && (
              <>
                <h4>H2 Tags ({data.headings.h2.length})</h4>
                <ul>
                  {data.headings.h2.slice(0, 10).map((heading, index) => (
                    <li key={`h2-${index}`}>{heading}</li>
                  ))}
                  {data.headings.h2.length > 10 && (
                    <li>...and {data.headings.h2.length - 10} more</li>
                  )}
                </ul>
              </>
            )}
            
            {data.headings?.h3?.length > 0 && (
              <>
                <h4>H3 Tags ({data.headings.h3.length})</h4>
                <ul>
                  {data.headings.h3.slice(0, 10).map((heading, index) => (
                    <li key={`h3-${index}`}>{heading}</li>
                  ))}
                  {data.headings.h3.length > 10 && (
                    <li>...and {data.headings.h3.length - 10} more</li>
                  )}
                </ul>
              </>
            )}
          </div>
        </div>
        
        {/* Images Section */}
        {data.images?.length > 0 && (
          <div className="section">
            <h3 className="section-title">Images ({data.images.length})</h3>
            
            <div className="image-grid">
              {data.images.slice(0, 12).map((src, index) => (
                <div className="image-item" key={`img-${index}`}>
                  <img 
                    src={src} 
                    alt={`From ${data.url}`} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/150x150?text=Failed+to+Load";
                    }}
                  />
                </div>
              ))}
              
              {data.images.length > 12 && (
                <div className="image-item" style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  backgroundColor: 'var(--gray-light)',
                  fontWeight: 'bold'
                }}>
                  +{data.images.length - 12} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisResults;
