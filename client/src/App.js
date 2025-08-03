import { useState, useEffect } from 'react';
import './App.css';
import UrlForm from './components/UrlForm';
import AnalysisResults from './components/AnalysisResults';
import HistoryList from './components/HistoryList';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import api from './utils/api';

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

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINT);
      setHistory(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching history:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (submittedUrl) => {
    try {
      setLoading(true);
      setError('');
      setUrl(submittedUrl);
      
      const response = await api.post(API_ENDPOINT, { url: submittedUrl });
      setAnalysisData(response.data);
      
      // Refresh history after new analysis
      fetchHistory();
      setLoading(false);
    } catch (err) {
      console.error('Error analyzing URL:', err);
      setError(err.response?.data?.error || 'Failed to analyze URL');
      setLoading(false);
    }
  };

  const handleViewAnalysis = async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`${API_ENDPOINT}/${id}`);
      setAnalysisData(response.data);
      setUrl(response.data.url);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching analysis:', err);
      setError('Failed to fetch analysis');
      setLoading(false);
    }
  };

  const handleReanalyze = async (id) => {
    try {
      setLoading(true);
      const response = await api.post(`${API_ENDPOINT}/${id}/reanalyze`);
      setAnalysisData(response.data);
      fetchHistory();
      setLoading(false);
    } catch (err) {
      console.error('Error reanalyzing URL:', err);
      setError('Failed to reanalyze URL');
      setLoading(false);
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
            onReanalyze={() => handleReanalyze(analysisData.id)}
          />
        )}
        
        <HistoryList 
          history={history} 
          onViewAnalysis={handleViewAnalysis}
        />
      </main>
      
      {loading && <LoadingSpinner />}
    </div>
  );
}

export default App;
