const AnalysisModel = require('../models/analysis');
const CrawlerService = require('../services/crawler');
const logger = require('../config/logger');
const { normalizeUrl } = require('../utils/url');

const AnalysisController = {
  /**
   * Analyze a URL and save the results
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
      
      // Check if URL was already analyzed
      const existingAnalysis = await AnalysisModel.findByUrl(normalizedUrl);
      
      if (existingAnalysis) {
        logger.info('Returning existing analysis', { url: normalizedUrl });
        return res.json(existingAnalysis);
      }
      
      // Crawl and analyze the URL
      const analysisData = await CrawlerService.crawlUrl(normalizedUrl);
      
      // Save analysis to database
      const savedAnalysis = await AnalysisModel.create(analysisData);
      
      res.status(201).json(savedAnalysis);
    } catch (error) {
      logger.error('Error in analyzeUrl controller', { error: error.message });
      
      if (error.message === 'Invalid URL format') {
        return res.status(400).json({ error: 'Invalid URL format' });
      }
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return res.status(400).json({ error: 'Could not connect to the website' });
      }
      
      if (error.response) {
        const status = error.response.status;
        if (status === 404) {
          return res.status(400).json({ error: 'Page not found (404)' });
        } else if (status >= 400) {
          return res.status(400).json({ error: `Website returned error: ${status}` });
        }
      }
      
      res.status(500).json({ error: 'Failed to analyze URL' });
    }
  },

  /**
   * Get analysis history
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getHistory(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;
      
      const analyses = await AnalysisModel.getAll(limit, offset);
      res.json(analyses);
    } catch (error) {
      logger.error('Error in getHistory controller', { error: error.message });
      res.status(500).json({ error: 'Failed to fetch analysis history' });
    }
  },

  /**
   * Get a single analysis by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAnalysisById(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }
      
      const analysis = await AnalysisModel.findById(id);
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }
      
      res.json(analysis);
    } catch (error) {
      logger.error('Error in getAnalysisById controller', { error: error.message });
      res.status(500).json({ error: 'Failed to fetch analysis' });
    }
  },

  /**
   * Re-analyze a URL by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async reanalyzeUrl(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }
      
      const analysis = await AnalysisModel.findById(id);
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }
      
      // Re-crawl the URL
      const analysisData = await CrawlerService.crawlUrl(analysis.url);
      
      // Update the analysis record
      const updatedAnalysis = await AnalysisModel.update(id, analysisData);
      
      res.json(updatedAnalysis);
    } catch (error) {
      logger.error('Error in reanalyzeUrl controller', { error: error.message });
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return res.status(400).json({ error: 'Could not connect to the website' });
      }
      
      if (error.response) {
        const status = error.response.status;
        if (status === 404) {
          return res.status(400).json({ error: 'Page not found (404)' });
        } else if (status >= 400) {
          return res.status(400).json({ error: `Website returned error: ${status}` });
        }
      }
      
      res.status(500).json({ error: 'Failed to re-analyze URL' });
    }
  }
};

module.exports = AnalysisController;
