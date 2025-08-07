import { useState, useEffect } from 'react';
import './App.css';
import UrlForm from './components/UrlForm';
import AnalysisResults from './components/AnalysisResults';
import HistoryList from './components/HistoryList';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import api from './utils/api';
import { localStorageHistory } from './utils/localStorage';

const API_ENDPOINT = '/analyze';

function App() {
  // eslint-disable-next-line no-unused-vars
  const [url, setUrl] = useState('');
  const [analysisData, setAnalysisData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    try {
      const localHistory = localStorageHistory.getHistory();
      setHistory(localHistory);
    } catch (err) {
      console.error('Error fetching history from localStorage:', err);
    }
  };

  const handleSubmit = async (submittedUrl) => {
    try {
      setLoading(true);
      setError('');
      setUrl(submittedUrl);
      
      const response = await api.post(API_ENDPOINT, { url: submittedUrl });
      const analysisResult = response.data;
      
      // Save to localStorage history and get the history item with local ID
      const historyItem = localStorageHistory.addAnalysis(analysisResult);
      
      // Set analysis data for display with local ID attached
      const analysisWithLocalId = {
        ...analysisResult,
        localId: historyItem.id
      };
      setAnalysisData(analysisWithLocalId);
      
      // Refresh history display
      fetchHistory();
      setLoading(false);
    } catch (err) {
      console.error('Error analyzing URL:', err);
      
      // Enhanced error message with debugging info
      let errorMessage = 'Failed to analyze URL';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Add debug info for 404 errors
      if (err.status === 404 || err.response?.status === 404) {
        errorMessage += ' (API endpoint not found - please check deployment)';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleViewAnalysis = (id) => {
    try {
      setLoading(true);
      const analysisData = localStorageHistory.getAnalysisById(id);
      
      if (analysisData) {
        // Add local ID to the analysis data for reanalyze functionality
        const analysisWithLocalId = {
          ...analysisData,
          localId: id
        };
        setAnalysisData(analysisWithLocalId);
        setUrl(analysisData.url);
      } else {
        setError('Analysis not found in local history');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching analysis from localStorage:', err);
      setError('Failed to fetch analysis');
      setLoading(false);
    }
  };

  const handleReanalyze = async (localId) => {
    try {
      setLoading(true);
      setError('');
      
      // Get the existing analysis from localStorage to get the URL
      const existingAnalysis = localStorageHistory.getAnalysisById(localId);
      
      if (!existingAnalysis) {
        setError('Analysis not found in local history');
        setLoading(false);
        return;
      }
      
      // Re-analyze the URL using the same endpoint as initial analysis
      const response = await api.post(API_ENDPOINT, { url: existingAnalysis.url });
      const updatedAnalysisResult = response.data;
      
      // Update the analysis data for display with local ID
      const updatedAnalysisWithLocalId = {
        ...updatedAnalysisResult,
        localId: localId
      };
      setAnalysisData(updatedAnalysisWithLocalId);
      
      // Update the localStorage entry with new analysis data
      localStorageHistory.updateAnalysis(localId, updatedAnalysisResult);
      
      // Refresh history display
      fetchHistory();
      setLoading(false);
    } catch (err) {
      console.error('Error reanalyzing URL:', err);
      
      let errorMessage = 'Failed to reanalyze URL';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all analysis history? This action cannot be undone.')) {
      localStorageHistory.clearHistory();
      fetchHistory();
      setAnalysisData(null); // Clear current analysis if it was from history
    }
  };

  return (
    <div className="App">
      <Header />
      
      <main className="container">
        <UrlForm 
          onSubmit={handleSubmit} 
          error={error}
        />
        
        {analysisData && (
          <AnalysisResults 
            data={analysisData} 
            onReanalyze={() => handleReanalyze(analysisData.localId)}
          />
        )}
        
        <HistoryList 
          history={history} 
          onViewAnalysis={handleViewAnalysis}
          onClearHistory={handleClearHistory}
        />
      </main>
      
      {loading && <LoadingSpinner />}
    </div>
  );
}

export default App;
