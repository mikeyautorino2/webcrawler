const logger = require('../config/logger');

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  logger.error('Unhandled error', {
    error: message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(statusCode).json({
    error: message,
    path: req.path,
    timestamp: new Date().toISOString(),
  });
}

module.exports = errorHandler;
