const { Pool, types } = require('pg');

// Type parser for PostgreSQL DATE (OID 1082) to prevent timezone day-shift
types.setTypeParser(1082, (val) => val);

const isProduction = process.env.NODE_ENV === 'production';
const dbUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/shipment_manager';
const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
const requiresSsl = (isProduction || dbUrl.includes('sslmode=require')) && !isLocalhost;

// Create PostgreSQL connection pool
const poolConfig = {
  connectionString: dbUrl,
  max: parseInt(process.env.DB_POOL_MAX || (isProduction ? '10' : '20'), 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

if (requiresSsl) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);

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
