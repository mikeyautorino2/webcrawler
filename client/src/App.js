import { useState, useEffect } from 'react';
import './App.css';
import UrlForm from './components/UrlForm';
import AnalysisResults from './components/AnalysisResults';
import BulkResults from './components/BulkResults';
import HistoryList from './components/HistoryList';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import { analyzeUrl, bulkAnalyzeUrls } from './utils/api';
import { localStorageHistory } from './utils/localStorage';

const API_ENDPOINT = '/analyze';

function App() {
  // eslint-disable-next-line no-unused-vars
  const [url, setUrl] = useState('');
  const [analysisData, setAnalysisData] = useState(null);
  const [bulkResults, setBulkResults] = useState(null);
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
      setBulkResults(null); // Clear bulk results when doing single analysis
      
      const analysisResult = await analyzeUrl(submittedUrl);
      
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
      
      if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (urls) => {
    try {
      setLoading(true);
      setError('');
      setAnalysisData(null); // Clear single analysis when doing bulk
      
      const bulkResult = await bulkAnalyzeUrls(urls, 5);
      
      // Save successful results to localStorage history
      bulkResult.results.forEach(result => {
        localStorageHistory.addAnalysis(result.data);
      });
      
      setBulkResults(bulkResult);
      
      // Refresh history display
      fetchHistory();
      setLoading(false);
    } catch (err) {
      console.error('Error in bulk analysis:', err);
      
      let errorMessage = 'Failed to analyze URLs';
      if (err.message) {
        errorMessage = err.message;
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
      
      // Re-analyze the URL using the analyzeUrl function
      const updatedAnalysisResult = await analyzeUrl(existingAnalysis.url);
      
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
      
      if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleSelectBulkResult = (analysisData) => {
    setBulkResults(null);
    setAnalysisData(analysisData);
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
          onBulkSubmit={handleBulkSubmit}
          error={error}
          isLoading={loading}
        />
        
        {bulkResults && (
          <BulkResults 
            results={bulkResults.results}
            errors={bulkResults.errors}
            summary={bulkResults.summary}
            onSelectResult={handleSelectBulkResult}
          />
        )}
        
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
