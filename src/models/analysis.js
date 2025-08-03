const db = require('../config/db');
const logger = require('../config/logger');

const Analysis = {
  /**
   * Initialize the analyses table
   */
  async initTable() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS analyses (
          id SERIAL PRIMARY KEY,
          url TEXT UNIQUE,
          title TEXT,
          description TEXT,
          headings JSONB,
          link_counts JSONB,
          images JSONB,
          word_count INT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      logger.info('Analyses table initialized successfully');
      return true;
    } catch (err) {
      logger.error('Failed to initialize analyses table', { error: err.message });
      throw err;
    }
  },

  /**
   * Find an analysis by URL
   * @param {string} url - The URL to find
   * @returns {Promise<Object|null>} The analysis object or null if not found
   */
  async findByUrl(url) {
    try {
      const result = await db.query('SELECT * FROM analyses WHERE url = $1', [url]);
      return result.rows[0] || null;
    } catch (err) {
      logger.error('Error finding analysis by URL', { error: err.message, url });
      throw err;
    }
  },

  /**
   * Find an analysis by ID
   * @param {number} id - The analysis ID
   * @returns {Promise<Object|null>} The analysis object or null if not found
   */
  async findById(id) {
    try {
      const result = await db.query('SELECT * FROM analyses WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (err) {
      logger.error('Error finding analysis by ID', { error: err.message, id });
      throw err;
    }
  },

  /**
   * Create a new analysis record
   * @param {Object} data - The analysis data
   * @returns {Promise<Object>} The created analysis object
   */
  async create(data) {
    const { url, title, description, headings, link_counts, images, word_count } = data;
    
    try {
      const result = await db.query(
        `INSERT INTO analyses (url, title, description, headings, link_counts, images, word_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [url, title, description, JSON.stringify(headings), JSON.stringify(link_counts), JSON.stringify(images), word_count]
      );
      
      logger.info('Created new analysis', { url });
      return result.rows[0];
    } catch (err) {
      logger.error('Error creating analysis', { error: err.message, url });
      throw err;
    }
  },

  /**
   * Get all analyses
   * @param {number} limit - Max number of records to return
   * @param {number} offset - Number of records to skip
   * @returns {Promise<Array>} Array of analysis objects
   */
  async getAll(limit = 100, offset = 0) {
    try {
      const result = await db.query(
        'SELECT id, url, title, created_at FROM analyses ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      return result.rows;
    } catch (err) {
      logger.error('Error getting all analyses', { error: err.message });
      throw err;
    }
  },

  /**
   * Update an existing analysis
   * @param {number} id - The analysis ID
   * @param {Object} data - The updated analysis data
   * @returns {Promise<Object|null>} The updated analysis or null if not found
   */
  async update(id, data) {
    const { url, title, description, headings, link_counts, images, word_count } = data;
    
    try {
      const result = await db.query(
        `UPDATE analyses 
         SET url = $1, title = $2, description = $3, headings = $4, 
             link_counts = $5, images = $6, word_count = $7, updated_at = NOW()
         WHERE id = $8
         RETURNING *`,
        [url, title, description, JSON.stringify(headings), JSON.stringify(link_counts), JSON.stringify(images), word_count, id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      logger.info('Updated analysis', { id });
      return result.rows[0];
    } catch (err) {
      logger.error('Error updating analysis', { error: err.message, id });
      throw err;
    }
  },

  /**
   * Delete an analysis by ID
   * @param {number} id - The analysis ID to delete
   * @returns {Promise<boolean>} Whether the deletion was successful
   */
  async delete(id) {
    try {
      const result = await db.query('DELETE FROM analyses WHERE id = $1 RETURNING id', [id]);
      const success = result.rows.length > 0;
      
      if (success) {
        logger.info('Deleted analysis', { id });
      } else {
        logger.warn('Attempted to delete non-existent analysis', { id });
      }
      
      return success;
    } catch (err) {
      logger.error('Error deleting analysis', { error: err.message, id });
      throw err;
    }
  }
};

module.exports = Analysis;
