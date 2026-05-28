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
  const { rows } = await client.query(`
    SELECT d.id_departement, d.nom_departement,
           array_agg(s.id_specialite ORDER BY s.id_specialite) AS spec_ids,
           array_agg(s.nom_specialite ORDER BY s.id_specialite) AS spec_names
    FROM departement d
    JOIN niveau n ON n.id_departement = d.id_departement
    JOIN specialite s ON s.id_niveau = n.id_niveau
    GROUP BY d.id_departement, d.nom_departement
    ORDER BY d.id_departement
  `);
  console.log(JSON.stringify(rows, null, 2));
  client.release();
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
