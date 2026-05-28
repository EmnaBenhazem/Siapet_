const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function createEnseignant() {
  const client = await pool.connect();
  try {
    const password = 'Enseignant@2024';
    const hash = await bcrypt.hash(password, 10);
    const ts = Date.now();
    const numeroUtilisateur = 'USR-ENS-' + ts;
    const numeroEnseignant = 'ENS' + ts;

    await client.query('BEGIN');

    await client.query(
      `INSERT INTO utilisateur (numero_utilisateur, nom, prenom, email, mot_de_passe, type_utilisateur, statut, date_creation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [numeroUtilisateur, 'Trabelsi', 'Ahmed', 'ahmed.trabelsi@isetrades.tn', hash, 'ENSEIGNANT', 'ACTIF']
    );

    await client.query(
      `INSERT INTO enseignant (numero_utilisateur, numero_enseignant, cin, id_etablissement_principal, specialite, grade, date_recrutement)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [numeroUtilisateur, numeroEnseignant, '98765432', 58, 'Informatique', 'Maitre Assistant']
    );

    await client.query('COMMIT');

    console.log('\nEnseignant cree avec succes!');
    console.log('Email:          ahmed.trabelsi@isetrades.tn');
    console.log('Mot de passe:   ' + password);
    console.log('Numero:         ' + numeroUtilisateur);
    console.log('Etablissement:  ISET Rades (id=58)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erreur:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

createEnseignant();
