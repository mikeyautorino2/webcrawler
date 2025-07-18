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
  // Log to file in production
  const accessLogStream = fs.createWriteStream(
    path.join(__dirname, '../logs/access.log'), 
    { flags: 'a' }
  );
  app.use(morgan('combined', { stream: accessLogStream }));
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
