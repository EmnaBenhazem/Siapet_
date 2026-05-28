require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.DB_HOST||'localhost', port: process.env.DB_PORT||5432, database: process.env.DB_NAME||'db_siapet', user: process.env.DB_USER||'postgres', password: process.env.DB_PASSWORD||'' });
async function run() {
  const client = await pool.connect();

  const { rows: stats } = await client.query(`
    SELECT
      COUNT(DISTINCT d.id_departement) FILTER(WHERE aff.cnt IS NULL OR aff.cnt=0) AS depts_sans_ens,
      COUNT(DISTINCT d.id_departement) FILTER(WHERE aff.cnt >= 1) AS depts_avec_ens,
      AVG(COALESCE(aff.cnt,0))::numeric(5,1) AS moy_ens_par_dept,
      MIN(COALESCE(aff.cnt,0)) AS min_ens,
      MAX(COALESCE(aff.cnt,0)) AS max_ens
    FROM departement d
    LEFT JOIN (
      SELECT id_departement, COUNT(DISTINCT numero_utilisateur) AS cnt
      FROM affectation WHERE statut='ACTIVE'
      GROUP BY id_departement
    ) aff ON aff.id_departement = d.id_departement
  `);
  console.log('Stats departements:', JSON.stringify(stats[0]));

  // departments with 0 teachers (sample)
  const { rows: zeroDepts } = await client.query(`
    SELECT d.id_departement, d.nom_departement, e.nom_etablissement, e.id_etablissement
    FROM departement d
    JOIN etablissement e ON e.id_etablissement = d.id_etablissement
    LEFT JOIN (
      SELECT id_departement, COUNT(DISTINCT numero_utilisateur) AS cnt
      FROM affectation WHERE statut='ACTIVE'
      GROUP BY id_departement
    ) aff ON aff.id_departement = d.id_departement
    WHERE COALESCE(aff.cnt,0)=0
    ORDER BY e.id_etablissement, d.id_departement
  `);
  console.log('\nDepts sans enseignants:', zeroDepts.length);
  zeroDepts.slice(0,20).forEach(r => console.log(`  dept:${r.id_departement} | etab:${r.id_etablissement} | ${r.nom_departement} @ ${r.nom_etablissement}`));

  // show distinct specialites in enseignant table
  const { rows: specialites } = await client.query(`SELECT DISTINCT specialite FROM enseignant ORDER BY specialite`);
  console.log('\nSpecialites distinctes enseignant:', specialites.map(r=>r.specialite).join(', '));

  // show distinct grades
  const { rows: grades } = await client.query(`SELECT DISTINCT grade FROM enseignant ORDER BY grade`);
  console.log('Grades:', grades.map(r=>r.grade).join(', '));

  // show utilisateur role_utilisateur for teachers
  const { rows: roles } = await client.query(`SELECT DISTINCT u.role_utilisateur FROM utilisateur u JOIN enseignant e ON e.numero_utilisateur=u.numero_utilisateur`);
  console.log('Roles utilisateur enseignant:', roles.map(r=>r.role_utilisateur).join(', '));

  // password hash sample
  const { rows: pw } = await client.query(`SELECT mot_de_passe FROM utilisateur WHERE numero_utilisateur=(SELECT numero_utilisateur FROM enseignant LIMIT 1)`);
  console.log('Mot de passe (hash sample):', pw[0]?.mot_de_passe?.slice(0,20));

  client.release();
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
