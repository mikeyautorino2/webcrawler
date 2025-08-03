const { app, initializeDatabase } = require('../src/app');

// Initialize database once during cold start
let dbInitialized = false;

module.exports = async (req, res) => {
  // Initialize database if not already done
  if (!dbInitialized) {
    try {
      await initializeDatabase();
      dbInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      return res.status(500).json({ error: 'Database initialization failed' });
    }
  }

  // Handle the request with the Express app
  return app(req, res);
};