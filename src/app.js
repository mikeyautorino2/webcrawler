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
    
    // In production (Vercel), allow same-origin requests and Vercel preview URLs
    if (process.env.NODE_ENV === 'production') {
      // Allow same origin and Vercel domains
      if (!origin || 
          origin.includes('.vercel.app') || 
          origin === process.env.VERCEL_URL || 
          origin === `https://${process.env.VERCEL_URL}`) {
        return callback(null, true);
      }
      // Log the rejected origin for debugging
      logger.warn('CORS origin rejected in production', { origin, vercelUrl: process.env.VERCEL_URL });
      return callback(null, false);
    }
    
    // In development, check against allowed origins
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified origin.';
      logger.warn('CORS origin rejected in development', { origin, allowedOrigins });
      return callback(new Error(msg), false);
    }
    
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Parse JSON request bodies
app.use(express.json());

// API routes
app.use('/api/analyze', analysisRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const dbCheck = await require('./config/db').query('SELECT 1');
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
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
