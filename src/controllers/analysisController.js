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
  }
};

module.exports = AnalysisController;
