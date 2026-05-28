/**
 * Script pour corriger les numéros de CIN du Rectorat 2
 * Génère des CIN uniques à 8 chiffres
 */

const fs = require('fs');
const path = require('path');

// Données des utilisateurs (extrait de votre script)
const usersData = `('USR-2021-0001', 'Khelifi', 'Mohamed', 'mohamed.khelifi1@etu.utm.tn', '$2b$12$a66fc7efef36cae6bad698eac5b8f918cff695b630658c3e82db0', '+216 37 854 204', 'Masculin', 'actif', '2024-09-14 08:01:00', '2024-11-01 08:01:00', 'etudiant', NULL, NULL),
('USR-2023-0002', 'Ayachi', 'Karim', 'karim.ayachi2@etu.utm.tn', '$2b$12$259667d51886d94ad1a8d368ca1d105c3f1660cbb254744c4e601', '+216 91 303 833', 'Masculin', 'actif', '2022-09-19 12:51:00', '2022-09-23 12:51:00', 'etudiant', NULL, NULL)`;

// Fonction pour générer un CIN unique à 8 chiffres
function generateUniqueCIN(index, usedCINs) {
  let cin;
  do {
    // Génère un CIN basé sur l'index + un nombre aléatoire
    const base = 10000000 + (index * 1000) + Math.floor(Math.random() * 1000);
    cin = base.toString().substring(0, 8);
  } while (usedCINs.has(cin));
  
  usedCINs.add(cin);
  return cin;
}

// Lire les données originales depuis votre message
const originalCINs = [
  '28728463', '85329037', '30868105', '60806024', '23556182',
  '81691040', '63843426', '43101783', '24716857', '25374874'
  // ... (liste complète à extraire)
];

// Corriger les CIN en doublon
const usedCINs = new Set();
const correctedCINs = [];

originalCINs.forEach((cin, index) => {
  // Vérifier si le CIN est valide (8 chiffres)
  if (cin.length !== 8 || !/^\d{8}$/.test(cin)) {
    console.log(`CIN invalide détecté à l'index ${index}: ${cin}`);
    const newCIN = generateUniqueCIN(index, usedCINs);
    correctedCINs.push(newCIN);
    console.log(`  → Corrigé en: ${newCIN}`);
  } else if (usedCINs.has(cin)) {
    console.log(`CIN en doublon détecté à l'index ${index}: ${cin}`);
    const newCIN = generateUniqueCIN(index, usedCINs);
    correctedCINs.push(newCIN);
    console.log(`  → Corrigé en: ${newCIN}`);
  } else {
    usedCINs.add(cin);
    correctedCINs.push(cin);
  }
});

console.log(`\nTotal CIN traités: ${correctedCINs.length}`);
console.log(`CIN uniques: ${usedCINs.size}`);
console.log(`\nCIN corrigés générés avec succès!`);

// Exporter les CIN corrigés
module.exports = { correctedCINs, generateUniqueCIN };
