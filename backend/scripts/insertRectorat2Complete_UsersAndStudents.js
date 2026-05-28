/**
 * Script complet pour insérer les utilisateurs ET les étudiants du Rectorat 2
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

// Données des utilisateurs (extrait de votre script - 50 premiers pour test)
const usersSQL = `INSERT INTO utilisateur (numero_utilisateur, nom, prenom, email,mot_de_passe, telephone, sexe, statut,date_creation, derniere_connexion,type_utilisateur, reset_token, reset_token_expiry) VALUES
('USR-2021-0001', 'Khelifi', 'Mohamed', 'mohamed.khelifi1@etu.utm.tn', '$2b$12$a66fc7efef36cae6bad698eac5b8f918cff695b630658c3e82db0', '+216 37 854 204', 'Masculin', 'actif', '2024-09-14 08:01:00', '2024-11-01 08:01:00', 'etudiant', NULL, NULL),
('USR-2023-0002', 'Ayachi', 'Karim', 'karim.ayachi2@etu.utm.tn', '$2b$12$259667d51886d94ad1a8d368ca1d105c3f1660cbb254744c4e601', '+216 91 303 833', 'Masculin', 'actif', '2022-09-19 12:51:00', '2022-09-23 12:51:00', 'etudiant', NULL, NULL),
('USR-2021-0003', 'Cherif', 'Tarek', 'tarek.cherif3@etu.utm.tn', '$2b$12$f856aefff3b9e9174b3c1d0f77cd6f2780a7f795ace9699c22696', '+216 47 881 444', 'Masculin', 'actif', '2022-09-12 17:16:00', '2022-10-05 17:16:00', 'etudiant', NULL, NULL),
('USR-2024-0004', 'Hamdi', 'Asma', 'asma.hamdi4@etu.utm.tn', '$2b$12$5dbdca205729482e4a9520f1f994d935fb1c9884e31f5eedae587', '+216 68 180 665', 'Féminin', 'actif', '2023-07-12 17:12:00', '2024-07-07 17:12:00', 'etudiant', NULL, NULL),
('USR-2023-0005', 'Jlassi', 'Ahmed', 'ahmed.jlassi5@etu.utm.tn', '$2b$12$e97a2b6acfc9edf269f64a0a1809548ad958c13177af41f2093b8', '+216 30 975 338', 'Masculin', 'inactif', '2022-10-27 13:10:00', '2023-05-05 13:10:00', 'etudiant', NULL, NULL)`;

// Données des étudiants (extrait de votre script - 5 premiers pour test)
const studentsSQL = `INSERT INTO etudiant (numero_utilisateur, numero_etudiant, cin, date_naissance,adresse, code_postal, moyenne_generale,id_ville, id_etablissement, id_specialite) VALUES
('USR-2021-0001', 'ETU-R2-0001', '14526398', '2001-07-08', '150 Avenue du 7 Novembre, Tunis', '1006', 8.65, 1, 24, 25),
('USR-2023-0002', 'ETU-R2-0002', '24942603', '2000-02-01', '18 Cité El Khadra, Tunis', '1053', 9.38, 1, 23, 22),
('USR-2021-0003', 'ETU-R2-0003', '13356886', '2004-06-29', '159 Rue de la Liberté, Tunis', '1068', 15.56, 1, 24, 25),
('USR-2024-0004', 'ETU-R2-0004', '46913810', '2000-12-04', '184 Rue des Orangers, Tunis', '1008', 11.05, 1, 24, 26),
('USR-2023-0005', 'ETU-R2-0005', '42868828', '2005-03-28', '81 Rue de la Liberté, Tunis', '1001', 13.27, 1, 17, 9)`;

async function insertData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('📝 Insertion des utilisateurs...\n');
    
    // Parser et insérer les utilisateurs
    const userRegex = /\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*([^,]+),\s*([^)]+)\)/g;
    
    let userMatch;
    let usersInserted = 0;
    
    while ((userMatch = userRegex.exec(usersSQL)) !== null) {
      try {
        await client.query(`
          INSERT INTO utilisateur (
            numero_utilisateur, nom, prenom, email, mot_de_passe,
            telephone, sexe, statut, date_creation, derniere_connexion,
            type_utilisateur, reset_token, reset_token_expiry
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          userMatch[1], userMatch[2], userMatch[3], userMatch[4], userMatch[5],
          userMatch[6], userMatch[7], userMatch[8], userMatch[9], userMatch[10],
          userMatch[11], userMatch[12] === 'NULL' ? null : userMatch[12],
          userMatch[13] === 'NULL' ? null : userMatch[13]
        ]);
        usersInserted++;
      } catch (error) {
        if (!error.message.includes('duplicate key')) {
          console.log(`   ⚠️  ${userMatch[1]}: ${error.message}`);
        }
      }
    }
    
    console.log(`   ✅ ${usersInserted} utilisateurs insérés\n`);
    
    console.log('📝 Insertion des étudiants...\n');
    
    // Parser et insérer les étudiants
    const studentRegex = /\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*([\d.]+),\s*(\d+),\s*(\d+),\s*(\d+)\)/g;
    
    let studentMatch;
    let studentsInserted = 0;
    
    while ((studentMatch = studentRegex.exec(studentsSQL)) !== null) {
      try {
        await client.query(`
          INSERT INTO etudiant (
            numero_utilisateur, numero_etudiant, cin, date_naissance,
            adresse, code_postal, moyenne_generale,
            id_ville, id_etablissement, id_specialite
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          studentMatch[1], studentMatch[2], studentMatch[3], studentMatch[4],
          studentMatch[5], studentMatch[6], parseFloat(studentMatch[7]),
          parseInt(studentMatch[8]), parseInt(studentMatch[9]), parseInt(studentMatch[10])
        ]);
        studentsInserted++;
      } catch (error) {
        console.log(`   ❌ ${studentMatch[1]}: ${error.message}`);
      }
    }
    
    console.log(`   ✅ ${studentsInserted} étudiants insérés\n`);
    
    await client.query('COMMIT');
    
    console.log('='.repeat(60));
    console.log('✅ Insertion terminée avec succès');
    console.log(`   Utilisateurs: ${usersInserted}`);
    console.log(`   Étudiants: ${studentsInserted}`);
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

insertData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
