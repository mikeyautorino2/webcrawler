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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested resource at ${req.path} was not found`
  });
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
  
  // Debug logging
  logger.info('Production mode enabled', { clientBuildPath });
  
  // Check if build directory exists
  if (fs.existsSync(clientBuildPath)) {
    logger.info('Client build directory found');
    
    // Serve static files
    app.use(express.static(clientBuildPath));
    
    // Handle React routing, return all requests to React app
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return next();
      }
      
      const indexPath = path.join(clientBuildPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        logger.error('index.html not found', { indexPath });
        res.status(404).send('Frontend build not found');
      }
    });
  } else {
    logger.error('Client build directory not found', { clientBuildPath });
  }
}

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
