const { Pool } = require('pg');
const logger = require('./logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/linkanalyzer',
});

// Test the connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    logger.error('Database connection error:', err);
  } else {
    logger.info('Connected to PostgreSQL database');
  }
});

module.exports = pool;
