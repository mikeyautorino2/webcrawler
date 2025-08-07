const { app } = require('./app');
const logger = require('./config/logger');
const { port, nodeEnv } = require('./config/environment');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', { reason, promise });
  process.exit(1);
});

// Start server
async function startServer() {
  try {
    // Try multiple ports starting from the configured port
    const startPort = parseInt(port, 10);
    const maxPortAttempts = 10;
    
    for (let portAttempt = 0; portAttempt < maxPortAttempts; portAttempt++) {
      const currentPort = startPort + portAttempt;
      
      try {
        const server = app.listen(currentPort, () => {
          logger.info(`Server running in ${nodeEnv} mode on port ${currentPort}`);
          
          // If we're using a different port than configured, log a warning
          if (currentPort !== startPort) {
            logger.warn(`Using port ${currentPort} instead of configured port ${startPort}`);
          }
        });
        
        // If we get here, the server started successfully
        return;
      } catch (err) {
        if (err.code === 'EADDRINUSE') {
          logger.warn(`Port ${currentPort} is in use, trying next port...`);
        } else {
          throw err;
        }
      }
    }
    
    // If we get here, we couldn't find an available port
    throw new Error(`Could not find an available port after ${maxPortAttempts} attempts`);
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

startServer();
