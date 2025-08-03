const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const { allowedOrigins } = require('./config/environment');
const analysisRoutes = require('./routes/analysis');
const AnalysisModel = require('./models/analysis');

// Create Express app
const app = express();

// Set up request logging
if (process.env.NODE_ENV === 'production') {
  // In production, log to console with combined format
  // This works with Vercel's serverless environment
  app.use(morgan('combined'));
} else {
  // Log to console in development
  app.use(morgan('dev'));
}

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // In production (Vercel), allow same-origin requests
    if (process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }
    
    // In development, check against allowed origins
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified origin.';
      return callback(new Error(msg), false);
    }
    
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json());

// API routes
app.use('/api/analyze', analysisRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Note: Static file serving is handled by Vercel's routing configuration
// Only include 404 handler for API routes

// Global error handler
app.use(errorHandler);

// Initialize database table
async function initializeDatabase() {
  try {
    await AnalysisModel.initTable();
  } catch (err) {
    logger.error('Failed to initialize database', { error: err.message });
    process.exit(1);
  }
}

module.exports = { app, initializeDatabase };
