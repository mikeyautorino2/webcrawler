// localStorage utility for managing analysis history
const HISTORY_KEY = 'webcrawler_analysis_history';
const MAX_HISTORY_ITEMS = 50; // Limit to prevent localStorage from getting too large

export const localStorageHistory = {
  // Get all history items from localStorage
  getHistory: () => {
    try {
      const history = localStorage.getItem(HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error reading history from localStorage:', error);
      return [];
    }
  },

  // Add a new analysis to history
  addAnalysis: (analysisData) => {
    try {
      const history = localStorageHistory.getHistory();
      
      // Create a standardized history item with unique ID
      const historyItem = {
        id: Date.now().toString(), // Simple timestamp-based ID
        url: analysisData.url,
        title: analysisData.title,
        description: analysisData.description,
        created_at: new Date().toISOString(),
        data: analysisData // Store full analysis data
      };

      // Check if URL already exists in history
      const existingIndex = history.findIndex(item => item.url === analysisData.url);
      
      if (existingIndex !== -1) {
        // Update existing entry instead of adding duplicate
        history[existingIndex] = historyItem;
      } else {
        // Add new entry at the beginning
        history.unshift(historyItem);
        
        // Limit history size
        if (history.length > MAX_HISTORY_ITEMS) {
          history.splice(MAX_HISTORY_ITEMS);
        }
      }

      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      return historyItem;
    } catch (error) {
      console.error('Error saving analysis to localStorage:', error);
      return null;
    }
  },

  // Get a specific analysis by ID
  getAnalysisById: (id) => {
    try {
      const history = localStorageHistory.getHistory();
      const item = history.find(item => item.id === id);
      return item ? item.data : null;
    } catch (error) {
      console.error('Error retrieving analysis from localStorage:', error);
      return null;
    }
  },

  // Remove an analysis from history
  removeAnalysis: (id) => {
    try {
      const history = localStorageHistory.getHistory();
      const filteredHistory = history.filter(item => item.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
      return true;
    } catch (error) {
      console.error('Error removing analysis from localStorage:', error);
      return false;
    }
  },

  // Clear all history
  clearHistory: () => {
    try {
      localStorage.removeItem(HISTORY_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing history from localStorage:', error);
      return false;
    }
  },

  // Update existing analysis data (for re-analysis)
  updateAnalysis: (id, newAnalysisData) => {
    try {
      const history = localStorageHistory.getHistory();
      const existingIndex = history.findIndex(item => item.id === id);
      
      if (existingIndex !== -1) {
        // Update existing entry with new data but keep original ID and update timestamp
        history[existingIndex] = {
          ...history[existingIndex],
          data: newAnalysisData,
          title: newAnalysisData.title,
          description: newAnalysisData.description,
          updated_at: new Date().toISOString()
        };
        
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        return history[existingIndex];
      }
      
      return null;
    } catch (error) {
      console.error('Error updating analysis in localStorage:', error);
      return null;
    }
  }
};