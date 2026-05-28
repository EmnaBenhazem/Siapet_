/**
 * Seed enseignants ISET Radès
 * - Crée des affectations pour les enseignants existants
 * - Crée de nouveaux enseignants dédiés par spécialité
 * - Lie chaque enseignant à sa spécialité via enseignant_matiere
 *
 * Usage: node backend/scripts/seedEnseignantsISETRades.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'db_siapet',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const ID_ETAB = 58;

// Mapping enseignant email → département + spécialités
const EXISTING_ASSIGNMENTS = [
  { email: 'sami.riahi598@univ.tn',       idDept: 169, specialites: [306, 1053] }, // TI → DSI + INFO-APP
  { email: 'slim.kraiem596@univ.tn',       idDept: 169, specialites: [306, 1053] }, // TI → DSI + INFO-APP
  { email: 'mohamed.cherif602@univ.tn',    idDept: 169, specialites: [307, 1054] }, // TI → RIS + RT-ISET
  { email: 'ahmed.trabelsi@isetrades.tn',  idDept: 169, specialites: [1053, 1054] }, // TI → INFO-APP + RT-ISET
  { email: 'khaled.drissi@isetrades.rnu.tn', idDept: 170, specialites: [308] },     // GE → EAI
  { email: 'sonia.mzoughi600@univ.tn',     idDept: 170, specialites: [308] },       // GE → EAI
  { email: 'slim.jebali599@univ.tn',       idDept: 171, specialites: [309] },       // GM → MI
  { email: 'yosra.mansouri601@univ.tn',    idDept: 171, specialites: [309] },       // GM → MI
  { email: 'bassem.fakhfakh604@univ.tn',   idDept: 172, specialites: [310] },       // GST → GE2
  { email: 'tarek.mestiri603@univ.tn',     idDept: 172, specialites: [310] },       // GST → GE2
  { email: 'fathi.selmi597@univ.tn',       idDept: 172, specialites: [310] },       // GST → GE2
  { email: 'nabil.fakhfakh595@univ.tn',    idDept: 172, specialites: [310] },       // GST → GE2
];

// Nouveaux enseignants à créer (un par spécialité clé)
const NEW_TEACHERS = [
  {
    nom: 'Ben Ali',    prenom: 'Karim',    email: 'karim.benali@isetrades.tn',
    cin: '12345601', specialite: 'Informatique', grade: 'Maître Assistant',
    idDept: 169, specialites: [306, 1053],
    password: 'Enseignant2024',
  },
  {
    nom: 'Gharbi',     prenom: 'Ines',     email: 'ines.gharbi@isetrades.tn',
    cin: '12345602', specialite: 'Réseaux', grade: 'Assistant',
    idDept: 169, specialites: [307, 1054],
    password: 'Enseignant2024',
  },
  {
    nom: 'Hamdi',      prenom: 'Riadh',    email: 'riadh.hamdi@isetrades.tn',
    cin: '12345603', specialite: 'Électrotechnique', grade: 'Maître de Conférences',
    idDept: 170, specialites: [308],
    password: 'Enseignant2024',
  },
  {
    nom: 'Marzouki',   prenom: 'Sirine',   email: 'sirine.marzouki@isetrades.tn',
    cin: '12345604', specialite: 'Génie Mécanique', grade: 'Assistant',
    idDept: 171, specialites: [309],
    password: 'Enseignant2024',
  },
  {
    nom: 'Dridi',      prenom: 'Walid',    email: 'walid.dridi@isetrades.tn',
    cin: '12345605', specialite: 'Gestion', grade: 'Maître Assistant',
    idDept: 172, specialites: [310],
    password: 'Enseignant2024',
  },
];

async function ensureAffectation(client, numeroUtilisateur, idDept) {
  const exists = await client.query(
    `SELECT 1 FROM affectation WHERE numero_utilisateur = $1 AND id_etablissement = $2`,
    [numeroUtilisateur, ID_ETAB]
  );
  if (exists.rows.length > 0) {
    console.log(`    ↳ Affectation déjà existante pour ${numeroUtilisateur}`);
    return;
  }
  await client.query(
    `INSERT INTO affectation (numero_utilisateur, id_etablissement, id_departement, date_debut, statut, type_affectation, charge_horaire)
     VALUES ($1, $2, $3, '2024-09-01', 'ACTIVE', 'ENSEIGNANT_PERMANENT', 18)`,
    [numeroUtilisateur, ID_ETAB, idDept]
  );
  console.log(`    ↳ Affectation créée`);
}

async function ensureEnseignantMatiere(client, numeroUtilisateur, idSpecialite) {
  const exists = await client.query(
    `SELECT 1 FROM enseignant_matiere WHERE numero_utilisateur = $1 AND id_specialite = $2`,
    [numeroUtilisateur, idSpecialite]
  );
  if (exists.rows.length > 0) return;
  await client.query(
    `INSERT INTO enseignant_matiere (numero_utilisateur, id_specialite) VALUES ($1, $2)`,
    [numeroUtilisateur, idSpecialite]
  );
  console.log(`    ↳ Lien enseignant_matiere spécialité ${idSpecialite} créé`);
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('\n🎓 SEED ENSEIGNANTS ISET RADÈS (id=58)\n');

    // ── 1. Affectations pour les enseignants existants ─────────────────────
    console.log('── 1. Affectations pour enseignants existants');
    for (const assign of EXISTING_ASSIGNMENTS) {
      const row = await client.query(
        `SELECT u.numero_utilisateur FROM utilisateur u WHERE u.email = $1 LIMIT 1`,
        [assign.email]
      );
      if (!row.rows.length) {
        console.log(`  ⚠ Enseignant non trouvé: ${assign.email}`);
        continue;
      }
      const num = row.rows[0].numero_utilisateur;
      console.log(`  • ${assign.email} (${num})`);
      await ensureAffectation(client, num, assign.idDept);
      for (const sp of assign.specialites) {
        await ensureEnseignantMatiere(client, num, sp);
      }
    }

    // ── 2. Nouveaux enseignants ────────────────────────────────────────────
    console.log('\n── 2. Nouveaux enseignants par spécialité');
    for (const t of NEW_TEACHERS) {
      const existing = await client.query(
        `SELECT numero_utilisateur FROM utilisateur WHERE email = $1`,
        [t.email]
      );
      let num;
      if (existing.rows.length > 0) {
        num = existing.rows[0].numero_utilisateur;
        console.log(`  ✓ ${t.prenom} ${t.nom} existe déjà: ${num}`);
      } else {
        const hash = await bcrypt.hash(t.password, 10);
        const ts = Date.now() + Math.floor(Math.random() * 1000);
        num = `USR-ENS-${ts}`;
        const numE = `ENS-RAD-${ts}`;

        await client.query(
          `INSERT INTO utilisateur (numero_utilisateur, nom, prenom, email, mot_de_passe, type_utilisateur, statut, date_creation)
           VALUES ($1, $2, $3, $4, $5, 'ENSEIGNANT', 'ACTIF', NOW())`,
          [num, t.nom, t.prenom, t.email, hash]
        );
        await client.query(
          `INSERT INTO enseignant (numero_utilisateur, numero_enseignant, cin, id_etablissement_principal, specialite, grade, date_recrutement)
           VALUES ($1, $2, $3, $4, $5, $6, '2020-09-01')`,
          [num, numE, t.cin, ID_ETAB, t.specialite, t.grade]
        );
        console.log(`  + ${t.prenom} ${t.nom} créé: ${num} — ${t.email} / ${t.password}`);
      }

      await ensureAffectation(client, num, t.idDept);
      for (const sp of t.specialites) {
        await ensureEnseignantMatiere(client, num, sp);
      }
    }

    await client.query('COMMIT');

    // ── Résumé ─────────────────────────────────────────────────────────────
    console.log('\n── Résumé final');
    const total = await client.query(
      `SELECT COUNT(*) AS nb FROM affectation WHERE id_etablissement = $1 AND statut = 'ACTIVE'`,
      [ID_ETAB]
    );
    console.log(`  Total enseignants actifs dans affectation: ${total.rows[0].nb}`);

    const perSpec = await client.query(
      `SELECT s.nom_specialite, COUNT(em.numero_utilisateur) AS nb_ens
       FROM specialite s
       LEFT JOIN enseignant_matiere em ON em.id_specialite = s.id_specialite
       WHERE s.id_specialite IN (306, 307, 308, 309, 310, 1053, 1054)
       GROUP BY s.nom_specialite ORDER BY s.nom_specialite`
    );
    console.log('\n  Enseignants par spécialité:');
    for (const r of perSpec.rows) {
      console.log(`    ${r.nom_specialite}: ${r.nb_ens} enseignant(s)`);
    }

    console.log('\n✅ Seed terminé avec succès!\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
