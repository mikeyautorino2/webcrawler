const express = require('express');
const router = express.Router();
const AnalysisController = require('../controllers/analysisController');

// POST /api/analyze - Analyze a new URL
router.post('/', AnalysisController.analyzeUrl);

// GET /api/analyze - Get analysis history
router.get('/', AnalysisController.getHistory);

// GET /api/analyze/:id - Get a single analysis by ID
router.get('/:id', AnalysisController.getAnalysisById);

// POST /api/analyze/:id/reanalyze - Re-analyze a URL
router.post('/:id/reanalyze', AnalysisController.reanalyzeUrl);

module.exports = router;
