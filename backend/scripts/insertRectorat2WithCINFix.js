/**
 * Script pour corriger les CIN en doublon et insérer les étudiants du Rectorat 2
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

// Données des étudiants (votre script SQL)
const studentsData = [
  { usr: 'USR-2019-0001', etu: 'ETU000001', cin: '14526398', birth: '2001-07-08', addr: '150 Avenue du 7 Novembre, Tunis', cp: '1006', avg: 8.65, ville: 1, etab: 24, spec: 25 },
  { usr: 'USR-2019-0002', etu: 'ETU000002', cin: '24942603', birth: '2000-02-01', addr: '18 Cité El Khadra, Tunis', cp: '1053', avg: 9.38, ville: 1, etab: 23, spec: 22 },
  { usr: 'USR-2023-0003', etu: 'ETU000003', cin: '13356886', birth: '2004-06-29', addr: '159 Rue de la Liberté, Tunis', cp: '1068', avg: 15.56, ville: 1, etab: 24, spec: 25 },
  { usr: 'USR-2020-0004', etu: 'ETU000004', cin: '46913810', birth: '2000-12-04', addr: '184 Rue des Orangers, Tunis', cp: '1008', avg: 11.05, ville: 1, etab: 24, spec: 26 },
  { usr: 'USR-2021-0005', etu: 'ETU000005', cin: '42868828', birth: '2005-03-28', addr: '81 Rue de la Liberté, Tunis', cp: '1001', avg: 13.27, ville: 1, etab: 17, spec: 9 },
  { usr: 'USR-2022-0006', etu: 'ETU000006', cin: '39958838', birth: '1998-10-28', addr: '130 Avenue de Carthage, Tunis', cp: '1005', avg: 18.73, ville: 1, etab: 24, spec: 25 },
  { usr: 'USR-2021-0007', etu: 'ETU000007', cin: '28728463', birth: '2002-02-22', addr: '113 Rue Alain Savary, Tunis', cp: '1010', avg: 15.03, ville: 1, etab: 16, spec: 4 },
  { usr: 'USR-2024-0008', etu: 'ETU000008', cin: '23756669', birth: '2005-06-28', addr: '77 Rue de la Liberté, Tunis', cp: '1005', avg: 11.04, ville: 1, etab: 27, spec: 31 },
  { usr: 'USR-2020-0009', etu: 'ETU000009', cin: '83197857', birth: '2004-03-16', addr: '73 Boulevard du 20 Mars, Tunis', cp: '1007', avg: 16.25, ville: 1, etab: 16, spec: 6 },
  { usr: 'USR-2022-0010', etu: 'ETU000010', cin: '21668732', birth: '2003-09-02', addr: '14 Rue de la Liberté, Tunis', cp: '1068', avg: 17.54, ville: 1, etab: 18, spec: 11 }
  // ... (ajoutez toutes les 300 lignes ici)
];

// Fonction pour générer un CIN unique
function generateUniqueCIN(index, year, usedCINs) {
  let attempts = 0;
  let cin;
  
  do {
    const yearPrefix = year.toString().substring(2, 4);
    const suffix = String(index * 100 + attempts).padStart(6, '0').substring(0, 6);
    cin = yearPrefix + suffix;
    attempts++;
    
    if (attempts > 1000) {
      cin = String(10000000 + Math.floor(Math.random() * 90000000));
    }
  } while (usedCINs.has(cin) && attempts < 2000);
  
  usedCINs.add(cin);
  return cin;
}

async function insertRectorat2Students() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Analyse des CIN...\n');
    
    // Vérifier les CIN existants dans la base
    const existingCINsResult = await client.query('SELECT cin FROM etudiant');
    const usedCINs = new Set(existingCINsResult.rows.map(row => row.cin));
    
    console.log(`   CIN déjà utilisés dans la base: ${usedCINs.size}\n`);
    
    // Analyser et corriger les CIN
    const corrections = [];
    const cinMap = new Map();
    
    studentsData.forEach((student, index) => {
      const cin = student.cin;
      
      // Vérifier si le CIN est déjà utilisé
      if (usedCINs.has(cin) || cinMap.has(cin)) {
        const year = parseInt(student.birth.substring(0, 4));
        const newCIN = generateUniqueCIN(index, year, usedCINs);
        
        corrections.push({
          index: index + 1,
          old: cin,
          new: newCIN,
          usr: student.usr
        });
        
        student.cin = newCIN;
        cinMap.set(newCIN, student.usr);
      } else {
        usedCINs.add(cin);
        cinMap.set(cin, student.usr);
      }
    });
    
    if (corrections.length > 0) {
      console.log(`⚠️  ${corrections.length} CIN en doublon corrigés:\n`);
      corrections.forEach(corr => {
        console.log(`   [${corr.index}] ${corr.usr}: ${corr.old} → ${corr.new}`);
      });
      console.log('');
    } else {
      console.log('✅ Aucun CIN en doublon détecté\n');
    }
    
    // Commencer la transaction
    await client.query('BEGIN');
    
    console.log('📝 Insertion des étudiants...\n');
    
    let inserted = 0;
    let errors = 0;
    
    for (const student of studentsData) {
      try {
        await client.query(`
          INSERT INTO etudiant (
            numero_utilisateur, numero_etudiant, cin, date_naissance,
            adresse, code_postal, moyenne_generale,
            id_ville, id_etablissement, id_specialite
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          student.usr,
          student.etu,
          student.cin,
          student.birth,
          student.addr,
          student.cp,
          student.avg,
          student.ville,
          student.etab,
          student.spec
        ]);
        
        inserted++;
        
        if (inserted % 50 === 0) {
          console.log(`   ✅ ${inserted} étudiants insérés...`);
        }
      } catch (error) {
        errors++;
        console.log(`   ❌ Erreur pour ${student.usr}: ${error.message}`);
      }
    }
    
    // Valider la transaction
    await client.query('COMMIT');
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(60));
    console.log(`✅ Étudiants insérés: ${inserted}`);
    console.log(`❌ Erreurs: ${errors}`);
    console.log(`🔧 CIN corrigés: ${corrections.length}`);
    console.log('='.repeat(60) + '\n');
    
    // Vérification finale
    const finalCount = await client.query(`
      SELECT COUNT(*) as count
      FROM etudiant
      WHERE id_etablissement BETWEEN 15 AND 27
    `);
    
    console.log(`📈 Total étudiants Rectorat 2 dans la base: ${finalCount.rows[0].count}\n`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur lors de l\'insertion:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécution
insertRectorat2Students()
  .then(() => {
    console.log('✅ Insertion terminée avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
