require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.DB_HOST||'localhost', port: process.env.DB_PORT||5432, database: process.env.DB_NAME||'db_siapet', user: process.env.DB_USER||'postgres', password: process.env.DB_PASSWORD||'' });
async function run() {
  const client = await pool.connect();
  const { rows } = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='specialite' ORDER BY ordinal_position`);
  rows.forEach(c => console.log('  ' + c.column_name + ' | ' + c.data_type));
  client.release();
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
