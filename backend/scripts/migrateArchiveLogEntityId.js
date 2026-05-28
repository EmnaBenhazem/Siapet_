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
  await client.query(`ALTER TABLE archive_log ALTER COLUMN entity_id TYPE VARCHAR(50) USING entity_id::VARCHAR(50)`);
  console.log('✓ archive_log.entity_id → VARCHAR(50)');
  client.release();
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
