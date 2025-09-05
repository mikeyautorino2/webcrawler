const CrawlerService = require('../services/crawler');
const logger = require('../config/logger');
const { normalizeUrl } = require('../utils/url');

const AnalysisController = {
  /**
   * Analyze a URL and return the results
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async analyzeUrl(req, res) {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }
      
      const normalizedUrl = normalizeUrl(url);
      logger.info('Analyzing URL', { url: normalizedUrl });
      
      // Crawl and analyze the URL
      const analysisData = await CrawlerService.crawlUrl(normalizedUrl);
      
      // Return the analysis data (frontend will handle localStorage)
      res.status(200).json(analysisData);
    } catch (error) {
      logger.error('Error in analyzeUrl controller', { 
        error: error.message,
        url: req.body.url,
        stack: error.stack 
      });
      
      if (error.message === 'Invalid URL format') {
        return res.status(400).json({ error: 'Invalid URL format' });
      }
      
      if (error.code === 'ECONNREFUSED') {
        return res.status(400).json({ error: 'Could not connect to the website. Please check if the URL is accessible.' });
      }
      
      if (error.code === 'ENOTFOUND') {
        return res.status(400).json({ error: 'Website not found. Please check if the URL is correct.' });
      }

      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        return res.status(400).json({ error: 'Request timed out. The website took too long to respond.' });
      }

      if (error.response) {
        const status = error.response.status;
        const errorMessage = error.response.data?.error || error.response.statusText;
        
        switch (status) {
          case 403:
            return res.status(400).json({ error: 'Access forbidden. The website blocked our request.' });
          case 404:
            return res.status(400).json({ error: 'Page not found (404). Please check if the URL is correct.' });
          case 429:
            return res.status(400).json({ error: 'Too many requests. Please try again later.' });
          case 500:
            return res.status(400).json({ error: 'Website server error. Please try again later.' });
          default:
            return res.status(400).json({ error: `Website error (${status}): ${errorMessage}` });
        }
      }
      
      res.status(500).json({ error: 'Failed to analyze URL. Please try again or contact support if the issue persists.' });
    }
  },

  /**
   * Analyze multiple URLs in bulk
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async bulkAnalyze(req, res) {
    try {
      const { urls, maxConcurrent = 5 } = req.body;
      
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ error: 'URLs array is required' });
      }

      if (urls.length > 50) {
        return res.status(400).json({ error: 'Maximum 50 URLs allowed per bulk analysis' });
      }

      logger.info('Starting bulk analysis', { urlCount: urls.length });

      const results = [];
      const errors = [];
      
      // Process URLs in batches to avoid overwhelming the system
      for (let i = 0; i < urls.length; i += maxConcurrent) {
        const batch = urls.slice(i, i + maxConcurrent);
        const batchPromises = batch.map(async (url, index) => {
          try {
            const normalizedUrl = normalizeUrl(url);
            const analysisData = await CrawlerService.crawlUrl(normalizedUrl);
            return { index: i + index, url, data: analysisData, success: true };
          } catch (error) {
            logger.warn('Error analyzing URL in bulk', { url, error: error.message });
            return { 
              index: i + index, 
              url, 
              error: this.getErrorMessage(error), 
              success: false 
            };
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            if (result.value.success) {
              results.push(result.value);
            } else {
              errors.push(result.value);
            }
          } else {
            errors.push({
              url: batch[results.length + errors.length - i],
              error: 'Unknown error occurred',
              success: false
            });
          }
        });
      }

      logger.info('Bulk analysis completed', { 
        successful: results.length, 
        failed: errors.length 
      });

      res.status(200).json({
        results: results.sort((a, b) => a.index - b.index),
        errors: errors.sort((a, b) => a.index - b.index),
        summary: {
          total: urls.length,
          successful: results.length,
          failed: errors.length
        }
      });

    } catch (error) {
      logger.error('Error in bulkAnalyze controller', { 
        error: error.message,
        stack: error.stack 
      });
      
      res.status(500).json({ error: 'Failed to process bulk analysis. Please try again.' });
    }
  },

  /**
   * Get user-friendly error message from error object
   * @param {Error} error - The error object
   * @returns {string} User-friendly error message
   */
  getErrorMessage(error) {
    if (error.message === 'Invalid URL format') {
      return 'Invalid URL format';
    }
    
    if (error.code === 'ECONNREFUSED') {
      return 'Could not connect to the website';
    }
    
    if (error.code === 'ENOTFOUND') {
      return 'Website not found';
    }

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return 'Request timed out';
    }

    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 403: return 'Access forbidden';
        case 404: return 'Page not found';
        case 429: return 'Too many requests';
        case 500: return 'Website server error';
        default: return `Website error (${status})`;
      }
    }
    
    return 'Analysis failed';
  },

  /**
   * Export analysis results as JSON
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async exportResults(req, res) {
    try {
      const { data } = req.body;
      
      if (!data) {
        return res.status(400).json({ error: 'Analysis data is required' });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const jsonData = JSON.stringify(data, null, 2);
      const filename = `web-analysis-${timestamp}.json`;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(jsonData);

      logger.info('Export completed', { format: 'json', timestamp });

    } catch (error) {
      logger.error('Error in exportResults controller', { 
        error: error.message,
        stack: error.stack 
      });
      
      // In test environment, provide more detailed error info
      if (process.env.NODE_ENV === 'test') {
        res.status(500).json({ 
          error: 'Failed to export results. Please try again.',
          details: error.message,
          stack: error.stack
        });
      } else {
        res.status(500).json({ error: 'Failed to export results. Please try again.' });
      }
    }
  }
};

module.exports = AnalysisController;
