const express = require('express');
const router = express.Router();
const AnalysisController = require('../controllers/analysisController');

// POST /api/analyze - Analyze a new URL
router.post('/', AnalysisController.analyzeUrl);

module.exports = router;
