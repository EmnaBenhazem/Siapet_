require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.DB_HOST||'localhost', port: process.env.DB_PORT||5432, database: process.env.DB_NAME||'db_siapet', user: process.env.DB_USER||'postgres', password: process.env.DB_PASSWORD||'' });
async function run() {
  const client = await pool.connect();
  const { rows } = await client.query(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name='enseignant' ORDER BY ordinal_position`);
  rows.forEach(c => console.log(c.column_name, '|', c.data_type, '| nullable:', c.is_nullable, '| default:', c.column_default));
  const { rows: sample } = await client.query(`SELECT * FROM enseignant LIMIT 2`);
  console.log('sample:', JSON.stringify(sample, null, 2));
  client.release();
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
