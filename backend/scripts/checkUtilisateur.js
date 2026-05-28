require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.DB_HOST||'localhost', port: process.env.DB_PORT||5432, database: process.env.DB_NAME||'db_siapet', user: process.env.DB_USER||'postgres', password: process.env.DB_PASSWORD||'' });
async function run() {
  const client = await pool.connect();
  const { rows: cols } = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='utilisateur' ORDER BY ordinal_position`);
  console.log('utilisateur cols:', JSON.stringify(cols));
  const { rows: sample } = await client.query(`SELECT u.*, ens.specialite, ens.grade FROM utilisateur u JOIN enseignant ens ON ens.numero_utilisateur=u.numero_utilisateur LIMIT 2`);
  console.log('sample enseignant+utilisateur:', JSON.stringify(sample, null, 2));
  // affectation sample
  const { rows: affSample } = await client.query(`SELECT * FROM affectation WHERE statut='ACTIVE' LIMIT 3`);
  console.log('affectation sample:', JSON.stringify(affSample, null, 2));
  client.release();
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
