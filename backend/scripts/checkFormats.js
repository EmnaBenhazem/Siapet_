require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.DB_HOST||'localhost', port: process.env.DB_PORT||5432, database: process.env.DB_NAME||'db_siapet', user: process.env.DB_USER||'postgres', password: process.env.DB_PASSWORD||'' });

async function run() {
  const client = await pool.connect();

  // Distinct length distribution for non-NEW ENS
  const { rows: lengths } = await client.query(`
    SELECT LENGTH(numero_utilisateur) AS len, COUNT(*) AS cnt,
           MIN(numero_utilisateur) AS min_id, MAX(numero_utilisateur) AS max_id
    FROM utilisateur
    WHERE numero_utilisateur LIKE 'ENS-%' AND numero_utilisateur NOT LIKE 'ENS-NEW-%'
    GROUP BY LENGTH(numero_utilisateur)
    ORDER BY len
  `);
  console.log('Length distribution (non-NEW ENS):');
  lengths.forEach(r => console.log(`  len ${r.len}: ${r.cnt} | ${r.min_id} → ${r.max_id}`));

  // Test if there's any ID matching ENS-NNNNNN (6 digits) starting with 01
  const { rows: collisions } = await client.query(`
    SELECT COUNT(*) cnt FROM utilisateur
    WHERE numero_utilisateur ~ '^ENS-(01|02|03|04|05|06|07|08|09|1)[0-9]{4,5}$'
  `);
  console.log('\nIDs that would collide with ENS-01XXXX..ENS-1XXXXX format:', collisions[0].cnt);

  // Check NEW range
  const { rows: newRange } = await client.query(`
    SELECT MIN(numero_utilisateur) min, MAX(numero_utilisateur) max FROM utilisateur WHERE numero_utilisateur LIKE 'ENS-NEW-%'
  `);
  console.log('\nNEW range:', JSON.stringify(newRange[0]));

  client.release();
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
