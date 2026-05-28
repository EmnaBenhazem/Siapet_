/**
 * Crée la table archive_log si elle n'existe pas (idempotent).
 * À lancer une fois pour initialiser.
 */
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'db_siapet',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function run() {
  const client = await pool.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS archive_log (
      id            SERIAL PRIMARY KEY,
      entity_type   VARCHAR(50)  NOT NULL,
      entity_id     INTEGER      NOT NULL,
      entity_name   VARCHAR(255),
      action        VARCHAR(20)  NOT NULL,
      performed_by  VARCHAR(50),
      performed_at  TIMESTAMP    DEFAULT NOW(),
      ip_address    VARCHAR(64),
      user_agent    TEXT,
      reason        TEXT,
      cascade_count INTEGER      DEFAULT 0,
      metadata      JSONB
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_archive_log_entity ON archive_log(entity_type, entity_id)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_archive_log_performed_at ON archive_log(performed_at DESC)`);
  console.log('✓ Table archive_log prête');
  client.release();
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
