/**
 * Script pour vérifier si les étudiants du Rectorat 2 sont déjà insérés
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkRectorat2Data() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Vérification des données du Rectorat 2...\n');
    
    // 1. Vérifier les utilisateurs USR-2021-0001 à USR-2022-0300
    console.log('📊 1. Vérification des utilisateurs (USR-2021-0001 à USR-2022-0300)');
    const usersQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN statut = 'actif' THEN 1 END) as actifs,
        COUNT(CASE WHEN statut = 'inactif' THEN 1 END) as inactifs,
        COUNT(CASE WHEN statut = 'suspendu' THEN 1 END) as suspendus
      FROM utilisateur
      WHERE numero_utilisateur BETWEEN 'USR-2019-0001' AND 'USR-2024-0300'
        AND type_utilisateur = 'etudiant';
    `;
    
    const usersResult = await client.query(usersQuery);
    const users = usersResult.rows[0];
    
    console.log(`   Total utilisateurs: ${users.total}`);
    console.log(`   - Actifs: ${users.actifs}`);
    console.log(`   - Inactifs: ${users.inactifs}`);
    console.log(`   - Suspendus: ${users.suspendus}\n`);
    
    // 2. Vérifier les étudiants du Rectorat 2 (établissements 15-27)
    console.log('📊 2. Vérification des étudiants du Rectorat 2 (établissements 15-27)');
    const studentsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT e.id_etablissement) as nb_etablissements,
        COUNT(DISTINCT e.cin) as cin_uniques,
        COUNT(*) - COUNT(DISTINCT e.cin) as cin_doublons
      FROM etudiant e
      WHERE e.id_etablissement BETWEEN 15 AND 27;
    `;
    
    const studentsResult = await client.query(studentsQuery);
    const students = studentsResult.rows[0];
    
    console.log(`   Total étudiants: ${students.total}`);
    console.log(`   Établissements: ${students.nb_etablissements}`);
    console.log(`   CIN uniques: ${students.cin_uniques}`);
    console.log(`   CIN en doublon: ${students.cin_doublons}\n`);
    
    // 3. Répartition par établissement
    console.log('📊 3. Répartition par établissement');
    const etabQuery = `
      SELECT 
        e.id_etablissement,
        COUNT(e.numero_utilisateur) as nb_etudiants
      FROM etudiant e
      WHERE e.id_etablissement BETWEEN 15 AND 27
      GROUP BY e.id_etablissement
      ORDER BY e.id_etablissement;
    `;
    
    const etabResult = await client.query(etabQuery);
    if (etabResult.rows.length > 0) {
      etabResult.rows.forEach(row => {
        console.log(`   Établissement ${row.id_etablissement}: ${row.nb_etudiants} étudiants`);
      });
    } else {
      console.log('   Aucun étudiant trouvé');
    }
    
    // 4. Vérifier les CIN en doublon
    console.log('\n📊 4. Vérification des CIN en doublon');
    const duplicatesQuery = `
      SELECT cin, COUNT(*) as count
      FROM etudiant
      WHERE id_etablissement BETWEEN 15 AND 27
      GROUP BY cin
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 10;
    `;
    
    const duplicatesResult = await client.query(duplicatesQuery);
    if (duplicatesResult.rows.length > 0) {
      console.log('   ⚠️  CIN en doublon détectés:');
      duplicatesResult.rows.forEach(row => {
        console.log(`      CIN ${row.cin}: ${row.count} occurrences`);
      });
    } else {
      console.log('   ✅ Aucun CIN en doublon');
    }
    
    // 5. Vérifier les CIN invalides
    console.log('\n📊 5. Vérification des CIN invalides');
    const invalidCINQuery = `
      SELECT 
        numero_etudiant,
        cin,
        LENGTH(cin) as longueur
      FROM etudiant
      WHERE id_etablissement BETWEEN 15 AND 27
        AND (LENGTH(cin) != 8 OR cin !~ '^[0-9]{8}$')
      LIMIT 10;
    `;
    
    const invalidCINResult = await client.query(invalidCINQuery);
    if (invalidCINResult.rows.length > 0) {
      console.log('   ⚠️  CIN invalides détectés:');
      invalidCINResult.rows.forEach(row => {
        console.log(`      ${row.numero_etudiant}: CIN="${row.cin}" (longueur: ${row.longueur})`);
      });
    } else {
      console.log('   ✅ Tous les CIN sont valides (8 chiffres)');
    }
    
    // 6. Vérifier la cohérence utilisateur ↔ étudiant
    console.log('\n📊 6. Vérification de la cohérence utilisateur ↔ étudiant');
    const coherenceQuery = `
      SELECT 
        COUNT(DISTINCT u.numero_utilisateur) as users_total,
        COUNT(DISTINCT e.numero_utilisateur) as students_total,
        COUNT(DISTINCT u.numero_utilisateur) - COUNT(DISTINCT e.numero_utilisateur) as difference
      FROM utilisateur u
      LEFT JOIN etudiant e ON e.numero_utilisateur = u.numero_utilisateur
      WHERE u.numero_utilisateur BETWEEN 'USR-2019-0001' AND 'USR-2024-0300'
        AND u.type_utilisateur = 'etudiant';
    `;
    
    const coherenceResult = await client.query(coherenceQuery);
    const coherence = coherenceResult.rows[0];
    
    console.log(`   Utilisateurs: ${coherence.users_total}`);
    console.log(`   Étudiants: ${coherence.students_total}`);
    console.log(`   Différence: ${coherence.difference}`);
    
    if (coherence.difference > 0) {
      console.log('   ⚠️  Certains utilisateurs n\'ont pas d\'entrée étudiant');
    } else {
      console.log('   ✅ Cohérence parfaite');
    }
    
    // 7. Résumé final
    console.log('\n' + '='.repeat(60));
    console.log('📋 RÉSUMÉ');
    console.log('='.repeat(60));
    
    if (students.total === 0) {
      console.log('❌ AUCUN étudiant du Rectorat 2 n\'est inséré');
      console.log('   → Vous devez exécuter le script d\'insertion');
    } else if (students.total < 300) {
      console.log(`⚠️  Insertion PARTIELLE: ${students.total}/300 étudiants`);
      console.log('   → Certains étudiants manquent');
    } else {
      console.log(`✅ Insertion COMPLÈTE: ${students.total} étudiants`);
    }
    
    if (students.cin_doublons > 0) {
      console.log(`⚠️  ${students.cin_doublons} CIN en doublon détectés`);
      console.log('   → Correction nécessaire');
    }
    
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécution
checkRectorat2Data()
  .then(() => {
    console.log('✅ Vérification terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
