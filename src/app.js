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

// Debug endpoint for troubleshooting
app.get('/api/debug', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      origin: req.get('Origin'),
    },
    server: {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    storage: 'localStorage (client-side)'
  };

  logger.info('Health check passed', healthCheck);
  res.status(200).json(healthCheck);
});

// Note: Static file serving is handled by Vercel's routing configuration
// Only include 404 handler for API routes

// Global error handler
app.use(errorHandler);

module.exports = { app };
