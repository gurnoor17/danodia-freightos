/**
 * Danodia FreightOS — Database Migration Runner
 * Executes versioned migrations in sequential order against PostgreSQL.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { pool } = require('../src/config/database');

const MIGRATIONS_DIR = path.resolve(__dirname, '../../database/migrations');

async function runMigrations() {
  console.log('================================================================');
  console.log('📦 RUNNING POSTGRESQL DATABASE MIGRATIONS');
  console.log('================================================================\n');

  const client = await pool.connect();

  try {
    // 1. Create migrations tracking table if not present
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Read migration files sorted alphabetically
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files in ${MIGRATIONS_DIR}.\n`);

    for (const file of files) {
      const checkRes = await client.query(
        'SELECT migration_name FROM schema_migrations WHERE migration_name = $1',
        [file]
      );

      if (checkRes.rows.length > 0) {
        console.log(`[SKIPPED] ${file} (already applied)`);
        continue;
      }

      console.log(`[APPLYING] ${file}...`);
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`[SUCCESS]  ${file} applied successfully.`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[FAILED]   Error applying ${file}:`, err.message);
        throw err;
      }
    }

    console.log('\n================================================================');
    console.log('🎉 ALL DATABASE MIGRATIONS ARE UP TO DATE!');
    console.log('================================================================');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[Migration Error]:', err);
    process.exit(1);
  });
