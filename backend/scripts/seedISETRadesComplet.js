/**
 * Seed idempotent pour ISET Rades
 * Crée toute la structure académique + étudiants + notes si absent
 * Peut être relancé sans duplication (vérifie l'existence avant chaque insertion)
 *
 * Usage: node backend/scripts/seedISETRadesComplet.js
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

// ─── helpers ────────────────────────────────────────────────────────────────

async function findOrCreate(client, table, whereClause, insertClause, whereValues, insertValues, pkCol) {
  const row = await client.query(
    `SELECT ${pkCol} FROM ${table} WHERE ${whereClause} LIMIT 1`,
    whereValues
  );
  if (row.rows.length > 0) {
    console.log(`  ✓ ${table} existe déjà: id=${row.rows[0][pkCol]}`);
    return row.rows[0][pkCol];
  }
  const res = await client.query(
    `INSERT INTO ${table} ${insertClause} RETURNING ${pkCol}`,
    insertValues
  );
  console.log(`  + ${table} créé: id=${res.rows[0][pkCol]}`);
  return res.rows[0][pkCol];
}

function randNote(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(1));
}

// ─── main ────────────────────────────────────────────────────────────────────

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('\n🌱 SEED ISET RADES — démarrage\n');

    // ── 1. ÉTABLISSEMENT ─────────────────────────────────────────────────────
    console.log('── 1. Établissement ISET Rades');
    const etabRow = await client.query(
      `SELECT id_etablissement FROM etablissement WHERE nom_etablissement ILIKE '%ISET%Rad%' LIMIT 1`
    );
    let idEtab;
    if (etabRow.rows.length > 0) {
      idEtab = etabRow.rows[0].id_etablissement;
      console.log(`  ✓ ISET Rades trouvé: id=${idEtab}`);
    } else {
      // Chercher ou créer un rectorat
      let idRecto;
      const rectoRow = await client.query(
        `SELECT id_rectorat FROM rectorat WHERE nom_rectorat ILIKE '%Tunis%' LIMIT 1`
      );
      if (rectoRow.rows.length > 0) {
        idRecto = rectoRow.rows[0].id_rectorat;
      } else {
        const r = await client.query(
          `INSERT INTO rectorat (nom_rectorat, code_rectorat, type) VALUES ('Université de Tunis', 'UT', 'UNIVERSITE') RETURNING id_rectorat`
        );
        idRecto = r.rows[0].id_rectorat;
      }
      // Chercher ou créer une ville
      let idVille;
      const villeRow = await client.query(`SELECT id_ville FROM ville WHERE nom_ville ILIKE '%Rades%' LIMIT 1`);
      if (villeRow.rows.length > 0) {
        idVille = villeRow.rows[0].id_ville;
      } else {
        const v = await client.query(
          `INSERT INTO ville (nom_ville) VALUES ('Rades') RETURNING id_ville`
        );
        idVille = v.rows[0].id_ville;
      }

      const eRes = await client.query(
        `INSERT INTO etablissement
           (nom_etablissement, code_etablissement, type, adresse, email, id_rectorat, id_ville,
            effectif_total, taux_reussite, archive)
         VALUES ('ISET Rades', 'ISET-RADES', 'ISET', 'Route de Raoued, Rades', 'contact@isetrades.tn',
                 $1, $2, 500, 78, false)
         RETURNING id_etablissement`,
        [idRecto, idVille]
      );
      idEtab = eRes.rows[0].id_etablissement;
      console.log(`  + ISET Rades créé: id=${idEtab}`);
    }

    // ── 2. DÉPARTEMENT ───────────────────────────────────────────────────────
    console.log('── 2. Département Informatique');
    const deptRow = await client.query(
      `SELECT id_departement FROM departement WHERE id_etablissement = $1 AND nom_departement ILIKE '%Info%' LIMIT 1`,
      [idEtab]
    );
    let idDept;
    if (deptRow.rows.length > 0) {
      idDept = deptRow.rows[0].id_departement;
      console.log(`  ✓ Département existe: id=${idDept}`);
    } else {
      const dRes = await client.query(
        `INSERT INTO departement (nom_departement, code_departement, id_etablissement, description, nombre_enseignants, nombre_etudiants)
         VALUES ('Informatique', 'DEPT-INFO', $1, 'Département Informatique - ISET Rades', 15, 200)
         RETURNING id_departement`,
        [idEtab]
      );
      idDept = dRes.rows[0].id_departement;
      console.log(`  + Département créé: id=${idDept}`);
    }

    // ── 3. NIVEAUX ───────────────────────────────────────────────────────────
    console.log('── 3. Niveaux');
    const niv1Row = await client.query(
      `SELECT id_niveau FROM niveau WHERE id_departement = $1 AND nom_niveau ILIKE '%Informatique%Appl%' LIMIT 1`,
      [idDept]
    );
    let niv1;
    if (niv1Row.rows.length > 0) {
      niv1 = niv1Row.rows[0].id_niveau;
      console.log(`  ✓ Niveau INFO-APP: id=${niv1}`);
    } else {
      const r = await client.query(
        `INSERT INTO niveau (nom_niveau, type_niveau, description, duree_annees, id_departement, archived)
         VALUES ('Licence Informatique Appliquée', 'LICENCE', 'Licence en Informatique Appliquée - ISET Rades', 3, $1, false)
         RETURNING id_niveau`, [idDept]
      );
      niv1 = r.rows[0].id_niveau;
      console.log(`  + Niveau INFO-APP créé: id=${niv1}`);
    }

    const niv2Row = await client.query(
      `SELECT id_niveau FROM niveau WHERE id_departement = $1 AND nom_niveau ILIKE '%Réseaux%' LIMIT 1`,
      [idDept]
    );
    let niv2;
    if (niv2Row.rows.length > 0) {
      niv2 = niv2Row.rows[0].id_niveau;
      console.log(`  ✓ Niveau RT: id=${niv2}`);
    } else {
      const r = await client.query(
        `INSERT INTO niveau (nom_niveau, type_niveau, description, duree_annees, id_departement, archived)
         VALUES ('Licence Réseaux et Télécoms', 'LICENCE', 'Licence en Réseaux et Télécommunications - ISET Rades', 3, $1, false)
         RETURNING id_niveau`, [idDept]
      );
      niv2 = r.rows[0].id_niveau;
      console.log(`  + Niveau RT créé: id=${niv2}`);
    }

    // ── 4. SPÉCIALITÉS ────────────────────────────────────────────────────────
    console.log('── 4. Spécialités');
    const sp1Row = await client.query(
      `SELECT id_specialite FROM specialite WHERE code_specialite = 'INFO-APP' AND archived = false LIMIT 1`
    );
    let sp1;
    if (sp1Row.rows.length > 0) {
      sp1 = sp1Row.rows[0].id_specialite;
      console.log(`  ✓ Spécialité INFO-APP: id=${sp1}`);
    } else {
      const r = await client.query(
        `INSERT INTO specialite (nom_specialite, code_specialite, description, nombre_credits, duree_formation, id_niveau, archived)
         VALUES ('Informatique Appliquée', 'INFO-APP', 'Licence en informatique appliquée et développement logiciel', 180, 3, $1, false)
         RETURNING id_specialite`, [niv1]
      );
      sp1 = r.rows[0].id_specialite;
      console.log(`  + Spécialité INFO-APP créée: id=${sp1}`);
    }

    const sp2Row = await client.query(
      `SELECT id_specialite FROM specialite WHERE code_specialite = 'RT-ISET' AND archived = false LIMIT 1`
    );
    let sp2;
    if (sp2Row.rows.length > 0) {
      sp2 = sp2Row.rows[0].id_specialite;
      console.log(`  ✓ Spécialité RT-ISET: id=${sp2}`);
    } else {
      const r = await client.query(
        `INSERT INTO specialite (nom_specialite, code_specialite, description, nombre_credits, duree_formation, id_niveau, archived)
         VALUES ('Réseaux et Télécommunications', 'RT-ISET', 'Licence en réseaux informatiques et télécommunications', 180, 3, $1, false)
         RETURNING id_specialite`, [niv2]
      );
      sp2 = r.rows[0].id_specialite;
      console.log(`  + Spécialité RT-ISET créée: id=${sp2}`);
    }

    // ── 5. MATIÈRES ──────────────────────────────────────────────────────────
    console.log('── 5. Matières');
    const matDefs = [
      // INFO-APP
      { code: 'ASD-301', nom: 'Algorithmique et Structures de Données', sem: 1, coef: 3.0, sp: sp1 },
      { code: 'POO-302', nom: 'Programmation Orientée Objet',            sem: 1, coef: 2.5, sp: sp1 },
      { code: 'BDA-303', nom: 'Base de Données Avancées',                sem: 2, coef: 3.0, sp: sp1 },
      { code: 'DEV-304', nom: 'Développement Web',                       sem: 2, coef: 2.0, sp: sp1 },
      { code: 'SYS-305', nom: "Systèmes d'Exploitation",                 sem: 1, coef: 2.0, sp: sp1 },
      { code: 'MAT-306', nom: 'Mathématiques Discrètes',                  sem: 1, coef: 2.0, sp: sp1 },
      // RT-ISET
      { code: 'RES-201', nom: 'Réseaux Informatiques',                   sem: 1, coef: 3.0, sp: sp2 },
      { code: 'SYS-202', nom: 'Administration Systèmes',                  sem: 1, coef: 2.5, sp: sp2 },
      { code: 'SEC-301', nom: 'Sécurité des Réseaux',                    sem: 2, coef: 3.0, sp: sp2 },
      { code: 'VOS-302', nom: 'Virtualisation et Cloud',                  sem: 2, coef: 2.5, sp: sp2 },
    ];

    const matIds = {};
    for (const m of matDefs) {
      const existing = await client.query(
        `SELECT id_matiere FROM matiere WHERE code_matiere = $1 AND id_specialite = $2 LIMIT 1`,
        [m.code, m.sp]
      );
      if (existing.rows.length > 0) {
        matIds[m.code] = existing.rows[0].id_matiere;
        console.log(`  ✓ Matière ${m.code}: id=${matIds[m.code]}`);
      } else {
        const r = await client.query(
          `INSERT INTO matiere (nom_matiere, code_matiere, coefficient, id_specialite, semestre, annee_universitaire)
           VALUES ($1, $2, $3, $4, $5, '2025-2026') RETURNING id_matiere`,
          [m.nom, m.code, m.coef, m.sp, m.sem]
        );
        matIds[m.code] = r.rows[0].id_matiere;
        console.log(`  + Matière ${m.code} créée: id=${matIds[m.code]}`);
      }
    }

    // ── 6. ENSEIGNANT ────────────────────────────────────────────────────────
    console.log('── 6. Enseignant Ahmed Trabelsi');
    let idEns;
    const ensRow = await client.query(
      `SELECT numero_utilisateur FROM utilisateur WHERE email = 'ahmed.trabelsi@isetrades.tn' LIMIT 1`
    );
    if (ensRow.rows.length > 0) {
      idEns = ensRow.rows[0].numero_utilisateur;
      console.log(`  ✓ Enseignant existe: id=${idEns}`);
    } else {
      const hash = await bcrypt.hash('Enseignant@2024', 10);
      const ts = Date.now();
      idEns = `USR-ENS-${ts}`;
      const numE = `ENS${ts}`;
      await client.query(
        `INSERT INTO utilisateur (numero_utilisateur, nom, prenom, email, mot_de_passe, type_utilisateur, statut, date_creation)
         VALUES ($1, 'Trabelsi', 'Ahmed', 'ahmed.trabelsi@isetrades.tn', $2, 'ENSEIGNANT', 'ACTIF', NOW())`,
        [idEns, hash]
      );
      await client.query(
        `INSERT INTO enseignant (numero_utilisateur, numero_enseignant, cin, id_etablissement_principal, specialite, grade, date_recrutement)
         VALUES ($1, $2, '98765432', $3, 'Informatique', 'Maître Assistant', NOW())`,
        [idEns, numE, idEtab]
      );
      console.log(`  + Enseignant créé: id=${idEns}`);
    }

    // Lier l'enseignant aux spécialités
    for (const sp of [sp1, sp2]) {
      const link = await client.query(
        `SELECT 1 FROM enseignant_matiere WHERE numero_utilisateur = $1 AND id_specialite = $2`,
        [idEns, sp]
      );
      if (link.rows.length === 0) {
        await client.query(
          `INSERT INTO enseignant_matiere (numero_utilisateur, id_specialite) VALUES ($1, $2)`,
          [idEns, sp]
        );
        console.log(`  + Lien enseignant-spécialité ${sp} créé`);
      }
    }

    // ── 7. EXAMENS ───────────────────────────────────────────────────────────
    console.log('── 7. Examens');
    const examDefs = [
      { code: 'ASD-301', type: 'Devoir Surveillé',  date: '2025-11-15', sem: 1, coef: 1.0 },
      { code: 'ASD-301', type: 'Examen Final',       date: '2026-01-20', sem: 1, coef: 2.0 },
      { code: 'POO-302', type: 'Devoir Surveillé',   date: '2025-11-20', sem: 1, coef: 1.0 },
      { code: 'POO-302', type: 'Examen Final',        date: '2026-01-25', sem: 1, coef: 2.0 },
      { code: 'SYS-305', type: 'Devoir Surveillé',   date: '2025-11-18', sem: 1, coef: 1.0 },
      { code: 'SYS-305', type: 'Examen Final',        date: '2026-01-22', sem: 1, coef: 2.0 },
      { code: 'MAT-306', type: 'Devoir Surveillé',   date: '2025-11-25', sem: 1, coef: 1.0 },
      { code: 'MAT-306', type: 'Examen Final',        date: '2026-01-28', sem: 1, coef: 2.0 },
      { code: 'BDA-303', type: 'Examen Final',        date: '2026-06-10', sem: 2, coef: 2.0 },
      { code: 'DEV-304', type: 'Examen Final',        date: '2026-06-14', sem: 2, coef: 2.0 },
      { code: 'RES-201', type: 'Devoir Surveillé',   date: '2025-11-17', sem: 1, coef: 1.0 },
      { code: 'RES-201', type: 'Examen Final',        date: '2026-01-21', sem: 1, coef: 2.0 },
      { code: 'SYS-202', type: 'Examen Final',        date: '2026-01-24', sem: 1, coef: 2.0 },
      { code: 'SEC-301', type: 'Examen Final',        date: '2026-06-12', sem: 2, coef: 2.0 },
      { code: 'VOS-302', type: 'Examen Final',        date: '2026-06-16', sem: 2, coef: 2.0 },
    ];

    const examIds = {}; // code -> [ { type, id } ]
    for (const ex of examDefs) {
      const idM = matIds[ex.code];
      if (!idM) continue;
      const existing = await client.query(
        `SELECT id_examen FROM examen WHERE id_matiere = $1 AND type_examen = $2 AND annee_universitaire = '2025-2026' LIMIT 1`,
        [idM, ex.type]
      );
      let idEx;
      if (existing.rows.length > 0) {
        idEx = existing.rows[0].id_examen;
        console.log(`  ✓ Examen ${ex.code} ${ex.type}: id=${idEx}`);
      } else {
        const r = await client.query(
          `INSERT INTO examen (id_matiere, type_examen, date_examen, semestre, coefficient, annee_universitaire)
           VALUES ($1, $2, $3, $4, $5, '2025-2026') RETURNING id_examen`,
          [idM, ex.type, ex.date, ex.sem, ex.coef]
        );
        idEx = r.rows[0].id_examen;
        console.log(`  + Examen ${ex.code} ${ex.type} créé: id=${idEx}`);
      }
      if (!examIds[ex.code]) examIds[ex.code] = [];
      examIds[ex.code].push({ type: ex.type, id: idEx, coef: ex.coef });
    }

    // ── 8. ÉTUDIANTS + NOTES ─────────────────────────────────────────────────
    console.log('── 8. Étudiants INFO-APP avec notes');

    const hash = await bcrypt.hash('Etudiant2024!', 10);
    const demoHash = await bcrypt.hash('Demo@2024', 10);

    // Liste d'étudiants INFO-APP avec notes par matière
    // Chaque étudiant a un tableau de notes correspondant à: ASD-301 DS, ASD-301 EF, POO-302 DS, POO-302 EF, SYS-305 DS, SYS-305 EF, MAT-306 DS, MAT-306 EF, BDA-303 EF, DEV-304 EF
    const infoAppStudents = [
      { nom: 'Ayari',     prenom: 'Sami',    email: 'sami.ayari@etud.isetrades.tn',      notes: [17, 16, 16, 17, 15, 16, 15, 16, 17, 16] },
      { nom: 'Gharbi',    prenom: 'Amira',   email: 'amira.gharbi@etud.isetrades.tn',     notes: [15, 15, 16, 15, 14, 15, 14, 15, 15, 16] },
      { nom: 'Jebali',    prenom: 'Karim',   email: 'karim.jebali@etud.isetrades.tn',     notes: [14, 15, 15, 14, 14, 14, 13, 14, 15, 14] },
      { nom: 'Oueslati',  prenom: 'Nadia',   email: 'nadia.oueslati@etud.isetrades.tn',   notes: [13, 14, 14, 13, 13, 14, 12, 13, 14, 14] },
      { nom: 'Dridi',     prenom: 'Youssef', email: 'youssef.dridi@etud.isetrades.tn',    notes: [13, 13, 13, 12, 12, 13, 11, 12, 13, 13] },
      { nom: 'Mansour',   prenom: 'Houda',   email: 'houda.mansour@etud.isetrades.tn',    notes: [12, 12, 13, 12, 11, 12, 11, 12, 13, 12] },
      { nom: 'Karray',    prenom: 'Fares',   email: 'fares.karray@etud.isetrades.tn',     notes: [12, 11, 12, 11, 11, 12, 10, 11, 12, 12] },
      { nom: 'Chaabane',  prenom: 'Ines',    email: 'ines.chaabane@etud.isetrades.tn',    notes: [11, 12, 11, 11, 10, 11, 10, 11, 11, 12] },
      { nom: 'Mzoughi',   prenom: 'Bilel',   email: 'bilel.mzoughi@etud.isetrades.tn',    notes: [10, 11, 11, 10, 10, 11, 9,  10, 11, 11] },
      { nom: 'Hamdi',     prenom: 'Sara',    email: 'sara.hamdi@etud.isetrades.tn',        notes: [10, 10, 10, 10, 9,  10, 9,  10, 10, 11] },
      { nom: 'Bouzid',    prenom: 'Hatem',   email: 'hatem.bouzid@etud.isetrades.tn',     notes: [9,  10, 10, 9,  9,  10, 8,  9,  10, 10] },
      { nom: 'Ferchichi', prenom: 'Mariem',  email: 'mariem.ferchichi@etud.isetrades.tn', notes: [9,  9,  9,  9,  8,  9,  8,  9,  9,  10] },
      { nom: 'Zidi',      prenom: 'Omar',    email: 'omar.zidi@etud.isetrades.tn',         notes: [8,  8,  9,  8,  7,  8,  7,  8,  8,  9] },
      // Étudiant démo — login: demo.etudiant@isetrades.tn / Demo@2024
      {
        nom: 'Sebteoui', prenom: 'Ghofrane', email: 'demo.etudiant@isetrades.tn',
        notes: [15, 16, 17, 16, 14, 15, 13, 14, 16, 15],
        isDemo: true,
      },
    ];

    // Séquence des examens INFO-APP dans le même ordre que .notes[]
    const infoAppExamSeq = [
      { code: 'ASD-301', type: 'Devoir Surveillé' },
      { code: 'ASD-301', type: 'Examen Final' },
      { code: 'POO-302', type: 'Devoir Surveillé' },
      { code: 'POO-302', type: 'Examen Final' },
      { code: 'SYS-305', type: 'Devoir Surveillé' },
      { code: 'SYS-305', type: 'Examen Final' },
      { code: 'MAT-306', type: 'Devoir Surveillé' },
      { code: 'MAT-306', type: 'Examen Final' },
      { code: 'BDA-303', type: 'Examen Final' },
      { code: 'DEV-304', type: 'Examen Final' },
    ];

    for (const st of infoAppStudents) {
      let numU;
      const existing = await client.query(
        `SELECT numero_utilisateur FROM utilisateur WHERE email = $1`, [st.email]
      );
      if (existing.rows.length > 0) {
        numU = existing.rows[0].numero_utilisateur;
        console.log(`  ✓ Étudiant ${st.prenom} ${st.nom}: existe`);
      } else {
        const ts = Date.now() + Math.floor(Math.random() * 10000);
        numU = `USR-ETU-${ts}`;
        const numE = `ETU${ts}`;
        const cin = String(10000000 + (ts % 9000000)).slice(0, 8);
        const moyNotes = st.notes.reduce((a, b) => a + b, 0) / st.notes.length;
        await client.query(
          `INSERT INTO utilisateur (numero_utilisateur, nom, prenom, email, mot_de_passe, type_utilisateur, statut, date_creation)
           VALUES ($1, $2, $3, $4, $5, 'ETUDIANT', 'ACTIF', NOW())`,
          [numU, st.nom, st.prenom, st.email, st.isDemo ? demoHash : hash]
        );
        await client.query(
          `INSERT INTO etudiant (numero_utilisateur, numero_etudiant, cin, moyenne_generale, id_etablissement, id_specialite)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [numU, numE, cin, moyNotes.toFixed(2), idEtab, sp1]
        );
        console.log(`  + Étudiant ${st.prenom} ${st.nom} créé${st.isDemo ? ' (DÉMO)' : ''}: ${numU}`);
      }

      // Insérer les notes
      for (let i = 0; i < infoAppExamSeq.length; i++) {
        const seq = infoAppExamSeq[i];
        const codeMatiere = seq.code;
        const typeExam = seq.type;
        const exEntry = examIds[codeMatiere]?.find(e => e.type === typeExam);
        if (!exEntry) continue;

        const noteVal = st.notes[i];
        const noteExists = await client.query(
          `SELECT 1 FROM note WHERE numero_utilisateur = $1 AND id_examen = $2`,
          [numU, exEntry.id]
        );
        if (noteExists.rows.length === 0) {
          await client.query(
            `INSERT INTO note (numero_utilisateur, id_examen, valeur, date_saisie)
             VALUES ($1, $2, $3, NOW())`,
            [numU, exEntry.id, noteVal]
          );
        }
      }
    }

    // ── 9. ÉTUDIANTS RT-ISET ─────────────────────────────────────────────────
    console.log('── 9. Étudiants RT-ISET avec notes');

    const rtStudents = [
      { nom: 'Ben Amor',   prenom: 'Zied',    email: 'zied.benamor@etud.isetrades.tn',      notes: [17, 17, 16, 17, 17, 16] },
      { nom: 'Sfaxi',      prenom: 'Rim',     email: 'rim.sfaxi@etud.isetrades.tn',           notes: [16, 15, 15, 16, 15, 15] },
      { nom: 'Lazrag',     prenom: 'Anis',    email: 'anis.lazrag@etud.isetrades.tn',         notes: [14, 14, 15, 14, 13, 14] },
      { nom: 'Marzouki',   prenom: 'Donia',   email: 'donia.marzouki@etud.isetrades.tn',     notes: [13, 14, 13, 13, 13, 13] },
      { nom: 'Ghribi',     prenom: 'Wassim',  email: 'wassim.ghribi@etud.isetrades.tn',      notes: [12, 13, 13, 12, 12, 12] },
      { nom: 'Jouini',     prenom: 'Olfa',    email: 'olfa.jouini@etud.isetrades.tn',         notes: [11, 12, 12, 11, 11, 11] },
      { nom: 'Gaidi',      prenom: 'Amine',   email: 'amine.gaidi@etud.isetrades.tn',         notes: [10, 11, 11, 10, 10, 11] },
      { nom: 'Rekik',      prenom: 'Sirine',  email: 'sirine.rekik@etud.isetrades.tn',       notes: [10, 10, 11, 10, 9,  10] },
      { nom: 'Mejri',      prenom: 'Wael',    email: 'wael.mejri@etud.isetrades.tn',          notes: [9,  10, 10, 9,  9,  10] },
      { nom: 'Khalfallah', prenom: 'Nesrine', email: 'nesrine.khalfallah@etud.isetrades.tn', notes: [9,  9,  9,  9,  8,  9] },
      { nom: 'Ksouri',     prenom: 'Moez',    email: 'moez.ksouri@etud.isetrades.tn',         notes: [8,  8,  9,  8,  7,  8] },
      { nom: 'Selmi',      prenom: 'Hana',    email: 'hana.selmi@etud.isetrades.tn',          notes: [7,  8,  8,  7,  7,  8] },
    ];

    const rtExamSeq = [
      { code: 'RES-201', type: 'Devoir Surveillé' },
      { code: 'RES-201', type: 'Examen Final' },
      { code: 'SYS-202', type: 'Examen Final' },
      { code: 'SEC-301', type: 'Examen Final' },
      { code: 'VOS-302', type: 'Examen Final' },
    ];

    for (const st of rtStudents) {
      let numU;
      const existing = await client.query(
        `SELECT numero_utilisateur FROM utilisateur WHERE email = $1`, [st.email]
      );
      if (existing.rows.length > 0) {
        numU = existing.rows[0].numero_utilisateur;
        console.log(`  ✓ Étudiant ${st.prenom} ${st.nom}: existe`);
      } else {
        const ts = Date.now() + Math.floor(Math.random() * 10000);
        numU = `USR-ETU-RT-${ts}`;
        const numE = `ETU-RT-${ts}`;
        const cin = String(10000000 + (ts % 9000000)).slice(0, 8);
        const moyNotes = st.notes.reduce((a, b) => a + b, 0) / st.notes.length;
        await client.query(
          `INSERT INTO utilisateur (numero_utilisateur, nom, prenom, email, mot_de_passe, type_utilisateur, statut, date_creation)
           VALUES ($1, $2, $3, $4, $5, 'ETUDIANT', 'ACTIF', NOW())`,
          [numU, st.nom, st.prenom, st.email, hash]
        );
        await client.query(
          `INSERT INTO etudiant (numero_utilisateur, numero_etudiant, cin, moyenne_generale, id_etablissement, id_specialite)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [numU, numE, cin, moyNotes.toFixed(2), idEtab, sp2]
        );
        console.log(`  + Étudiant RT ${st.prenom} ${st.nom} créé: ${numU}`);
      }

      // Insérer les notes (on prend max min(notes.length, examSeq.length))
      for (let i = 0; i < Math.min(st.notes.length, rtExamSeq.length); i++) {
        const seq = rtExamSeq[i];
        const exEntry = examIds[seq.code]?.find(e => e.type === seq.type);
        if (!exEntry) continue;
        const noteExists = await client.query(
          `SELECT 1 FROM note WHERE numero_utilisateur = $1 AND id_examen = $2`,
          [numU, exEntry.id]
        );
        if (noteExists.rows.length === 0) {
          await client.query(
            `INSERT INTO note (numero_utilisateur, id_examen, valeur, date_saisie)
             VALUES ($1, $2, $3, NOW())`,
            [numU, exEntry.id, st.notes[i]]
          );
        }
      }
    }

    await client.query('COMMIT');

    console.log('\n✅ SEED TERMINÉ avec succès!\n');
    console.log('═══════════════════════════════════════════════');
    console.log('  COMPTE DÉMO ÉTUDIANT (INFO-APP)');
    console.log('  Email    : demo.etudiant@isetrades.tn');
    console.log('  Mot de passe: Demo@2024');
    console.log('───────────────────────────────────────────────');
    console.log('  COMPTE ENSEIGNANT');
    console.log('  Email    : ahmed.trabelsi@isetrades.tn');
    console.log('  Mot de passe: Enseignant@2024');
    console.log('═══════════════════════════════════════════════\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Erreur seed:', err.message);
    console.error(err.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
