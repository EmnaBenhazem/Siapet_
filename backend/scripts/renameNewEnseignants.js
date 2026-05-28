/**
 * Renomme tous les ENS-NEW-XXXXXX en ENS-XXXXXX
 * Approche: DROP FK -> UPDATE en place -> RECREATE FK
 * Tout en une seule transaction.
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'db_siapet',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('Démarrage de la transaction...');
    await client.query('BEGIN');

    // 1) Vérifier le compte initial
    const { rows: before } = await client.query(`SELECT COUNT(*) FROM utilisateur WHERE numero_utilisateur LIKE 'ENS-NEW-%'`);
    console.log(`Enseignants ENS-NEW-* à renommer: ${before[0].count}`);
    if (before[0].count === '0') {
      console.log('Rien à faire.');
      await client.query('ROLLBACK');
      return;
    }

    // 2) Vérifier qu'il n'y a pas de collision avec des IDs cibles existants
    const { rows: collisions } = await client.query(`
      SELECT u.numero_utilisateur
      FROM utilisateur u
      WHERE u.numero_utilisateur IN (
        SELECT replace(numero_utilisateur, 'ENS-NEW-', 'ENS-')
        FROM utilisateur WHERE numero_utilisateur LIKE 'ENS-NEW-%'
      )
    `);
    if (collisions.length > 0) {
      throw new Error(`Collision: ${collisions.length} IDs cibles déjà présents. Ex: ${collisions[0].numero_utilisateur}`);
    }
    console.log('Aucune collision détectée.');

    // 3) Récupérer le nom exact de la contrainte FK enseignant -> utilisateur
    const { rows: fkName } = await client.query(`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
      WHERE tc.constraint_type='FOREIGN KEY'
        AND tc.table_name='enseignant'
        AND kcu.column_name='numero_utilisateur'
        AND ccu.table_name='utilisateur'
    `);
    if (fkName.length === 0) throw new Error('FK enseignant→utilisateur introuvable');
    const fkConstraintName = fkName[0].constraint_name;
    console.log(`FK contrainte: ${fkConstraintName}`);

    // 4) DROP les FKs (enseignant→utilisateur ET affectation→enseignant)
    console.log('\n[1/5] DROP FKs...');
    await client.query(`ALTER TABLE enseignant DROP CONSTRAINT ${fkConstraintName}`);
    await client.query(`ALTER TABLE affectation DROP CONSTRAINT affectation_numero_utilisateur_fkey`);

    // 5) UPDATE utilisateur (PK update)
    console.log('[2/5] UPDATE utilisateur (PK)...');
    const r1 = await client.query(`
      UPDATE utilisateur
      SET numero_utilisateur = replace(numero_utilisateur, 'ENS-NEW-', 'ENS-')
      WHERE numero_utilisateur LIKE 'ENS-NEW-%'
    `);
    console.log(`  ${r1.rowCount} lignes utilisateur mises à jour`);

    // 6) UPDATE enseignant (PK + numero_enseignant)
    console.log('[3/5] UPDATE enseignant (PK + numero_enseignant)...');
    const r2 = await client.query(`
      UPDATE enseignant
      SET numero_utilisateur = replace(numero_utilisateur, 'ENS-NEW-', 'ENS-'),
          numero_enseignant  = replace(numero_enseignant,  'ENS-NEW-', 'ENS-')
      WHERE numero_utilisateur LIKE 'ENS-NEW-%' OR numero_enseignant LIKE 'ENS-NEW-%'
    `);
    console.log(`  ${r2.rowCount} lignes enseignant mises à jour`);

    // 7) UPDATE affectation (pas de FK contrainte)
    console.log('[4/5] UPDATE affectation...');
    const r3 = await client.query(`
      UPDATE affectation
      SET numero_utilisateur = replace(numero_utilisateur, 'ENS-NEW-', 'ENS-')
      WHERE numero_utilisateur LIKE 'ENS-NEW-%'
    `);
    console.log(`  ${r3.rowCount} affectations mises à jour`);

    // 8) Mettre à jour les autres tables référençant numero_utilisateur (au cas où)
    const otherTables = [
      { table: 'absence',            col: 'numero_utilisateur' },
      { table: 'absence',            col: 'enseignant_id'       },
      { table: 'enseignant_cours',   col: 'numero_utilisateur' },
      { table: 'enseignant_matiere', col: 'numero_utilisateur' },
      { table: 'note',               col: 'numero_utilisateur' },
      { table: 'audit_log',          col: 'numero_utilisateur_cible'  },
      { table: 'audit_log',          col: 'numero_utilisateur_acteur' },
    ];
    let otherTotal = 0;
    for (const { table, col } of otherTables) {
      const r = await client.query(
        `UPDATE ${table} SET ${col} = replace(${col}, 'ENS-NEW-', 'ENS-') WHERE ${col} LIKE 'ENS-NEW-%'`
      );
      if (r.rowCount > 0) {
        console.log(`  ${table}.${col}: ${r.rowCount} lignes`);
        otherTotal += r.rowCount;
      }
    }
    if (otherTotal === 0) console.log('  Aucune autre table avec références ENS-NEW-* (normal).');

    // 9) RECREATE les FKs
    console.log('[5/5] RECREATE FKs...');
    await client.query(`
      ALTER TABLE enseignant
      ADD CONSTRAINT ${fkConstraintName}
      FOREIGN KEY (numero_utilisateur) REFERENCES utilisateur(numero_utilisateur)
    `);
    await client.query(`
      ALTER TABLE affectation
      ADD CONSTRAINT affectation_numero_utilisateur_fkey
      FOREIGN KEY (numero_utilisateur) REFERENCES enseignant(numero_utilisateur)
    `);

    await client.query('COMMIT');
    console.log('\n✓ Transaction validée.');

    // 10) Vérification
    const { rows: after } = await client.query(`SELECT COUNT(*) FROM utilisateur WHERE numero_utilisateur LIKE 'ENS-NEW-%'`);
    const { rows: newCnt } = await client.query(`SELECT COUNT(*) FROM utilisateur WHERE numero_utilisateur LIKE 'ENS-01%' OR numero_utilisateur LIKE 'ENS-1%'`);
    console.log(`\nReste ENS-NEW-*: ${after[0].count} (devrait être 0)`);
    console.log(`Total enseignants au format ENS-01XXXX/ENS-1XXXX: ${newCnt[0].count}`);

    const { rows: sample } = await client.query(`
      SELECT numero_utilisateur FROM utilisateur
      WHERE numero_utilisateur LIKE 'ENS-01%'
      ORDER BY numero_utilisateur LIMIT 5
    `);
    console.log('Échantillon:', sample.map(r => r.numero_utilisateur).join(', '));

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ ERREUR — rollback effectué:', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

main();
