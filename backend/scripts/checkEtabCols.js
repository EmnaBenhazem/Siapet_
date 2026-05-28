require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.DB_HOST||'localhost', port: process.env.DB_PORT||5432, database: process.env.DB_NAME||'db_siapet', user: process.env.DB_USER||'postgres', password: process.env.DB_PASSWORD||'' });
async function run() {
  const client = await pool.connect();
  const { rows: etabCols } = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='etablissement' ORDER BY ordinal_position`);
  console.log('etablissement cols:', etabCols.map(c => c.column_name + '(' + c.data_type + ')').join(', '));

  const { rows: sample } = await client.query(`SELECT * FROM etablissement LIMIT 2`);
  console.log('sample:', JSON.stringify(sample, null, 2));

  // How many establishments sans enseignants
  const { rows: missing } = await client.query(`
    SELECT e.id_etablissement, e.nom_etablissement,
           COUNT(DISTINCT d.id_departement) AS nb_depts
    FROM etablissement e
    LEFT JOIN departement d ON d.id_etablissement = e.id_etablissement
    WHERE e.id_etablissement NOT IN (
      SELECT DISTINCT d2.id_etablissement
      FROM affectation a
      JOIN departement d2 ON d2.id_departement = a.id_departement
      WHERE a.statut = 'ACTIVE'
    )
    GROUP BY e.id_etablissement, e.nom_etablissement
    ORDER BY e.id_etablissement
  `);
  console.log('Etablissements sans enseignants:', missing.length);
  missing.forEach(r => console.log(`  ${r.id_etablissement} | depts:${r.nb_depts} | ${r.nom_etablissement}`));

  client.release();
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
