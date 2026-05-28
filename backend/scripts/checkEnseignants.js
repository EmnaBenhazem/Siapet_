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

  // Existing teacher example
  const { rows: ensEx } = await client.query(`
    SELECT u.numero_utilisateur, u.nom, u.prenom, u.email, ens.specialite,
           ens.grade, ens.id_etablissement_principal
    FROM utilisateur u
    JOIN enseignant ens ON ens.numero_utilisateur = u.numero_utilisateur
    LIMIT 3
  `);
  console.log('Exemple enseignants:', JSON.stringify(ensEx, null, 2));

  // Establishments without any active teacher affectation
  const { rows: etabsSansEns } = await client.query(`
    SELECT e.id_etablissement, e.nom_etablissement, e.type_etablissement,
           COUNT(DISTINCT d.id_departement) AS nb_depts
    FROM etablissement e
    LEFT JOIN departement d ON d.id_etablissement = e.id_etablissement
    WHERE e.id_etablissement NOT IN (
      SELECT DISTINCT d2.id_etablissement
      FROM affectation a
      JOIN departement d2 ON d2.id_departement = a.id_departement
      WHERE a.statut = 'ACTIVE'
    )
    GROUP BY e.id_etablissement, e.nom_etablissement, e.type_etablissement
    ORDER BY e.id_etablissement
  `);
  console.log('\nEtablissements sans enseignants:', etabsSansEns.length);
  etabsSansEns.slice(0, 10).forEach(r =>
    console.log(`  ${r.id_etablissement} | ${r.type_etablissement} | ${r.nb_depts} depts | ${r.nom_etablissement}`)
  );

  // Distribution summary
  const { rows: dist } = await client.query(`
    SELECT e.id_etablissement, e.nom_etablissement, e.type_etablissement,
           COUNT(DISTINCT d.id_departement) AS nb_depts,
           COUNT(DISTINCT a.numero_utilisateur) AS nb_ens
    FROM etablissement e
    LEFT JOIN departement d ON d.id_etablissement = e.id_etablissement
    LEFT JOIN affectation a ON a.id_departement = d.id_departement AND a.statut = 'ACTIVE'
    GROUP BY e.id_etablissement, e.nom_etablissement, e.type_etablissement
    ORDER BY nb_ens ASC
    LIMIT 20
  `);
  console.log('\nEtablissements avec le moins d\'enseignants:');
  dist.forEach(r =>
    console.log(`  ${r.id_etablissement} | ${r.nb_ens} ens / ${r.nb_depts} depts | ${r.nom_etablissement}`)
  );

  // utilisateur table columns
  const { rows: cols } = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'utilisateur'
    ORDER BY ordinal_position
  `);
  console.log('\nColonnes utilisateur:', cols.map(c => c.column_name + '(' + c.data_type + ')').join(', '));

  const { rows: ensCols } = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'enseignant'
    ORDER BY ordinal_position
  `);
  console.log('Colonnes enseignant:', ensCols.map(c => c.column_name + '(' + c.data_type + ')').join(', '));

  const { rows: affCols } = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'affectation'
    ORDER BY ordinal_position
  `);
  console.log('Colonnes affectation:', affCols.map(c => c.column_name + '(' + c.data_type + ')').join(', '));

  client.release();
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
