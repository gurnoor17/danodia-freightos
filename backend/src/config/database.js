const { Pool, types } = require('pg');

// Type parser for PostgreSQL DATE (OID 1082) to prevent timezone day-shift
types.setTypeParser(1082, (val) => val);

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/shipment_manager',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[Database Pool Error]: Unexpected error on idle client', err);
});

/**
 * Executes a SQL query with parameters.
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

/**
 * Tests database connectivity using SELECT NOW().
 * @returns {Promise<{ success: boolean, timestamp: string }>}
 */
const testConnection = async () => {
  const result = await pool.query('SELECT NOW() as current_time');
  return {
    success: true,
    timestamp: result.rows[0].current_time,
  };
};

module.exports = {
  pool,
  query,
  testConnection,
};
