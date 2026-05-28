/**
 * Script pour générer le fichier SQL corrigé avec des CIN uniques
 * Analyse les CIN existants et les corrige si nécessaire
 */

const fs = require('fs');
const path = require('path');

// Fonction pour générer un CIN unique à 8 chiffres
function generateUniqueCIN(index, year, usedCINs) {
  let attempts = 0;
  let cin;
  
  do {
    // Format: YY + 6 chiffres basés sur l'index
    const yearPrefix = year.toString().substring(2, 4);
    const suffix = String(index * 100 + attempts).padStart(6, '0').substring(0, 6);
    cin = yearPrefix + suffix;
    attempts++;
    
    if (attempts > 1000) {
      // Fallback: génération complètement aléatoire
      cin = String(10000000 + Math.floor(Math.random() * 90000000));
    }
  } while (usedCINs.has(cin) && attempts < 2000);
  
  usedCINs.add(cin);
  return cin;
}

// Extraire l'année de naissance depuis la date
function extractYear(dateStr) {
  const match = dateStr.match(/(\d{4})-/);
  return match ? parseInt(match[1]) : 2000;
}

// Données des étudiants (à partir de votre script)
const studentsData = [
  { usr: 'USR-2021-0001', etu: 'ETU-2023-R2-0001', cin: '28728463', birth: '1999-02-24', addr: '76 Cité Universitaire, Tunis', cp: '1002', avg: 10.28, ville: 1, etab: 18, spec: 10 },
  { usr: 'USR-2023-0002', etu: 'ETU-2023-R2-0002', cin: '85329037', birth: '2000-03-25', addr: '29 Avenue du 7 Novembre, Tunis', cp: '1100', avg: 12.64, ville: 1, etab: 24, spec: 25 },
  { usr: 'USR-2024-0003', etu: 'ETU-2024-R2-0003', cin: '30868105', birth: '2000-05-31', addr: '49 Avenue Habib Bourguiba, Tunis', cp: '1082', avg: 18.05, ville: 1, etab: 20, spec: 16 },
  // ... (300 entrées au total)
];

console.log('🔍 Analyse des CIN...\n');

const usedCINs = new Set();
const corrections = [];
let duplicateCount = 0;
let invalidCount = 0;

// Première passe : identifier les problèmes
studentsData.forEach((student, index) => {
  const cin = student.cin;
  const isValid = /^\d{8}$/.test(cin);
  const isDuplicate = usedCINs.has(cin);
  
  if (!isValid) {
    invalidCount++;
    console.log(`❌ CIN invalide [${index + 1}]: ${cin} (${student.usr})`);
    corrections.push({ index, reason: 'invalid', old: cin });
  } else if (isDuplicate) {
    duplicateCount++;
    console.log(`⚠️  CIN en doublon [${index + 1}]: ${cin} (${student.usr})`);
    corrections.push({ index, reason: 'duplicate', old: cin });
  } else {
    usedCINs.add(cin);
  }
});

console.log(`\n📊 Résumé de l'analyse:`);
console.log(`   Total étudiants: ${studentsData.length}`);
console.log(`   CIN invalides: ${invalidCount}`);
console.log(`   CIN en doublon: ${duplicateCount}`);
console.log(`   CIN à corriger: ${corrections.length}\n`);

// Deuxième passe : corriger les CIN
corrections.forEach(correction => {
  const student = studentsData[correction.index];
  const year = extractYear(student.birth);
  const newCIN = generateUniqueCIN(correction.index, year, usedCINs);
  
  student.cin = newCIN;
  console.log(`✅ Corrigé [${correction.index + 1}]: ${correction.old} → ${newCIN}`);
});

console.log(`\n✨ Génération du fichier SQL corrigé...\n`);

// Générer le fichier SQL
let sqlContent = `-- ============================================================
-- 300 étudiants — Rectorat 2 (Université de Tunis El Manar)
-- Établissements : id 15 à 27
-- CIN CORRIGÉS ET VÉRIFIÉS - ${new Date().toISOString()}
-- ============================================================

INSERT INTO etudiant (numero_utilisateur, numero_etudiant, cin, date_naissance, adresse, code_postal, moyenne_generale, id_ville, id_etablissement, id_specialite) VALUES\n`;

studentsData.forEach((student, index) => {
  const comma = index < studentsData.length - 1 ? ',' : ';';
  sqlContent += `('${student.usr}', '${student.etu}', '${student.cin}', '${student.birth}', '${student.addr}', '${student.cp}', ${student.avg}, ${student.ville}, ${student.etab}, ${student.spec})${comma}\n`;
});

sqlContent += `\n-- ============================================================
-- VÉRIFICATION
-- SELECT cin, COUNT(*) as count FROM etudiant 
-- WHERE id_etablissement BETWEEN 15 AND 27
-- GROUP BY cin HAVING COUNT(*) > 1;
-- ============================================================\n`;

// Sauvegarder le fichier
const outputPath = path.join(__dirname, 'insertEtudiantsRectorat2SQL_CORRECTED.sql');
fs.writeFileSync(outputPath, sqlContent, 'utf8');

console.log(`✅ Fichier généré: ${outputPath}`);
console.log(`\n🎉 Correction terminée avec succès!`);
console.log(`   ${corrections.length} CIN ont été corrigés`);
console.log(`   ${usedCINs.size} CIN uniques au total\n`);
