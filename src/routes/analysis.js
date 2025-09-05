const express = require('express');
const router = express.Router();
const AnalysisController = require('../controllers/analysisController');

// POST /api/analyze - Analyze a new URL
router.post('/', AnalysisController.analyzeUrl);

// POST /api/analyze/bulk - Analyze multiple URLs
router.post('/bulk', AnalysisController.bulkAnalyze);

// POST /api/analyze/export - Export analysis results
router.post('/export', AnalysisController.exportResults);

module.exports = router;
