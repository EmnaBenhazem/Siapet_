require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.DB_HOST||'localhost', port: process.env.DB_PORT||5432, database: process.env.DB_NAME||'db_siapet', user: process.env.DB_USER||'postgres', password: process.env.DB_PASSWORD||'' });

async function run() {
  const client = await pool.connect();
  const { rows } = await client.query(`
    SELECT tc.table_name, tc.constraint_type, kcu.column_name, tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name IN ('utilisateur', 'enseignant')
      AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
    ORDER BY tc.table_name, tc.constraint_type, kcu.column_name
  `);
  rows.forEach(r => console.log(`${r.table_name} | ${r.constraint_type} | ${r.column_name} | ${r.constraint_name}`));
  client.release();
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
