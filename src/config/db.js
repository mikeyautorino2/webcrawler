const { Pool } = require('pg');
const logger = require('./logger');

const poolConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/linkanalyzer',
};

// Add SSL configuration for production environments (like Vercel)
if (process.env.NODE_ENV === 'production') {
  poolConfig.ssl = {
    rejectUnauthorized: false // Required for some PostgreSQL providers
  };
}

const pool = new Pool(poolConfig);

pool.query('SELECT NOW()', (err) => {
  if (err) {
    logger.error('Database connection error:', err);
  } else {
    logger.info('Connected to PostgreSQL database');
  }
});

module.exports = pool;
