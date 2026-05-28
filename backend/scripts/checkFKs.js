require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.DB_HOST||'localhost', port: process.env.DB_PORT||5432, database: process.env.DB_NAME||'db_siapet', user: process.env.DB_USER||'postgres', password: process.env.DB_PASSWORD||'' });

async function run() {
  const client = await pool.connect();

  // All FKs that reference utilisateur.numero_utilisateur
  const { rows: fks } = await client.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      rc.update_rule,
      rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON rc.unique_constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'utilisateur'
      AND ccu.column_name = 'numero_utilisateur'
    ORDER BY tc.table_name
  `);
  console.log('FKs pointing to utilisateur.numero_utilisateur:');
  fks.forEach(fk => console.log(`  ${fk.table_name}.${fk.column_name} | UPDATE: ${fk.update_rule} | DELETE: ${fk.delete_rule}`));

  // Count current NEW teachers
  const { rows: cnt } = await client.query(`SELECT COUNT(*) FROM utilisateur WHERE numero_utilisateur LIKE 'ENS-NEW-%'`);
  console.log('\nNombre d\'enseignants ENS-NEW-*:', cnt[0].count);

  // Range of existing non-NEW ENS IDs
  const { rows: range } = await client.query(`
    SELECT
      MIN(numero_utilisateur) AS min,
      MAX(numero_utilisateur) AS max,
      COUNT(*) AS total
    FROM utilisateur
    WHERE numero_utilisateur LIKE 'ENS-%' AND numero_utilisateur NOT LIKE 'ENS-NEW-%'
  `);
  console.log('Non-NEW ENS IDs:', JSON.stringify(range[0]));

  // Sample non-NEW IDs (to understand the numbering scheme)
  const { rows: samples } = await client.query(`
    SELECT numero_utilisateur
    FROM utilisateur
    WHERE numero_utilisateur LIKE 'ENS-%' AND numero_utilisateur NOT LIKE 'ENS-NEW-%'
    ORDER BY numero_utilisateur DESC
    LIMIT 10
  `);
  console.log('\nTop 10 non-NEW ENS IDs (desc):');
  samples.forEach(s => console.log('  ' + s.numero_utilisateur));

  client.release();
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
