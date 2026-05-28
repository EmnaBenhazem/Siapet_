/**
 * Script simple pour insérer les étudiants du Rectorat 2
 * Lit les données depuis rectorat2_data.txt
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Lire le fichier SQL
const sqlFile = path.join(__dirname, 'rectorat2_data.txt');
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

// Fonction pour parser les données SQL
function parseStudentData(sqlInsert) {
  const students = [];
  const regex = /\('(USR-\d{4}-\d{4})',\s*'(ETU\d{6})',\s*'(\d{8})',\s*'([\d-]+)',\s*'([^']+)',\s*'(\d+)',\s*([\d.]+),\s*(\d+),\s*(\d+),\s*(\d+)\)/g;
  
  let match;
  while ((match = regex.exec(sqlInsert)) !== null) {
    students.push({
      usr: match[1],
      etu: match[2],
      cin: match[3],
      birth: match[4],
      addr: match[5],
      cp: match[6],
      avg: parseFloat(match[7]),
      ville: parseInt(match[8]),
      etab: parseInt(match[9]),
      spec: parseInt(match[10])
    });
  }
  
  return students;
}

// Fonction pour générer un CIN unique
function generateUniqueCIN(index, year, usedCINs) {
  let attempts = 0;
  let cin;
  
  do {
    const yearPrefix = year.toString().substring(2, 4);
    const suffix = String(10000 + index * 10 + attempts).padStart(6, '0').substring(0, 6);
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
    console.log('📝 Parsing des données SQL...\n');
    const studentsData = parseStudentData(sqlContent);
    console.log(`   ${studentsData.length} étudiants trouvés\n`);
    
    if (studentsData.length === 0) {
      throw new Error('Aucune donnée trouvée');
    }
    
    // Trouver le prochain numéro d'étudiant disponible
    console.log('🔍 Recherche du prochain numéro disponible...\n');
    const maxEtuResult = await client.query(`
      SELECT numero_etudiant 
      FROM etudiant 
      WHERE numero_etudiant ~ '^ETU-R2-\\d{4}$'
      ORDER BY numero_etudiant DESC 
      LIMIT 1
    `);
    
    let nextEtuNumber = 1;
    if (maxEtuResult.rows.length > 0) {
      const lastNumber = maxEtuResult.rows[0].numero_etudiant;
      const match = lastNumber.match(/ETU-R2-(\d{4})/);
      if (match) {
        nextEtuNumber = parseInt(match[1]) + 1;
      }
    }
    
    console.log(`   Prochain numéro: ETU-R2-${String(nextEtuNumber).padStart(4, '0')}\n`);
    
    // Vérifier les CIN existants
    console.log('🔍 Analyse des CIN...\n');
    const existingCINsResult = await client.query('SELECT cin FROM etudiant');
    const usedCINs = new Set(existingCINsResult.rows.map(row => row.cin));
    
    console.log(`   CIN déjà utilisés: ${usedCINs.size}\n`);
    
    // Corriger les données
    const corrections = [];
    const cinMap = new Map();
    
    studentsData.forEach((student, index) => {
      // Nouveau numéro d'étudiant
      student.etu = `ETU-R2-${String(nextEtuNumber + index).padStart(4, '0')}`;
      
      const cin = student.cin;
      
      // Vérifier CIN
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
      console.log(`⚠️  ${corrections.length} CIN corrigés\n`);
    } else {
      console.log('✅ Aucun CIN en doublon\n');
    }
    
    // Insertion
    await client.query('BEGIN');
    
    console.log('📝 Insertion...\n');
    
    let inserted = 0;
    
    for (const student of studentsData) {
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
      
      if (inserted % 10 === 0) {
        console.log(`   ✅ ${inserted} insérés...`);
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ ${inserted} étudiants insérés avec succès`);
    console.log(`🔧 ${corrections.length} CIN corrigés`);
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

insertRectorat2Students()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
