require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.DB_HOST||'localhost', port: process.env.DB_PORT||5432, database: process.env.DB_NAME||'db_siapet', user: process.env.DB_USER||'postgres', password: process.env.DB_PASSWORD||'' });
async function run() {
  const client = await pool.connect();
  const { rows } = await client.query(`
    SELECT table_name, column_name, character_maximum_length
    FROM information_schema.columns
    WHERE (table_name='utilisateur' AND column_name='email')
       OR (table_name='enseignant' AND column_name IN ('cin','numero_enseignant'))
  `);
  rows.forEach(r => console.log(`${r.table_name}.${r.column_name}: max ${r.character_maximum_length}`));
  client.release();
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
