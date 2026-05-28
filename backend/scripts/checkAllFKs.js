require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.DB_HOST||'localhost', port: process.env.DB_PORT||5432, database: process.env.DB_NAME||'db_siapet', user: process.env.DB_USER||'postgres', password: process.env.DB_PASSWORD||'' });

async function run() {
  const client = await pool.connect();
  // All FKs pointing to enseignant
  const { rows } = await client.query(`
    SELECT tc.table_name, kcu.column_name, ccu.table_name AS target_table, ccu.column_name AS target_col, tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
    WHERE tc.constraint_type='FOREIGN KEY'
      AND ccu.table_name='enseignant'
    ORDER BY tc.table_name, kcu.column_name
  `);
  console.log('FKs pointing to enseignant.*:');
  rows.forEach(r => console.log(`  ${r.table_name}.${r.column_name} → enseignant.${r.target_col} | ${r.constraint_name}`));

  // All FKs from affectation
  const { rows: affFks } = await client.query(`
    SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS target_table, ccu.column_name AS target_col
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
    WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_name='affectation'
  `);
  console.log('\nFKs from affectation:');
  affFks.forEach(r => console.log(`  affectation.${r.column_name} → ${r.target_table}.${r.target_col} | ${r.constraint_name}`));

  client.release();
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
