const { Pool } = require('pg');
const logger = require('./logger');

const poolConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://mikeyautorino@localhost:5432/linkanalyzer',
};

// Add SSL configuration for production environments (like Vercel/Supabase)
if (process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('supabase')) {
  poolConfig.ssl = {
    rejectUnauthorized: false // Required for Supabase and other PostgreSQL providers
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
