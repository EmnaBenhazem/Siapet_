require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
});

const ENSEIGNANT_ID = 'USR-ENS-1777928650061'; // Ahmed Trabelsi
const ISET_RADES_ID = 58;

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── 1. NIVEAUX ───────────────────────────────────────────────────────
    const n1 = await client.query(
      `INSERT INTO niveau (nom_niveau, type_niveau, description, duree_annees, id_departement, archived)
       VALUES ('Licence Informatique Appliquee', 'LICENCE', 'Licence en Informatique Appliquee - ISET Rades', 3, 169, false)
       RETURNING id_niveau`
    );
    const n2 = await client.query(
      `INSERT INTO niveau (nom_niveau, type_niveau, description, duree_annees, id_departement, archived)
       VALUES ('Licence Reseaux et Telecoms', 'LICENCE', 'Licence en Reseaux et Telecommunications - ISET Rades', 3, 169, false)
       RETURNING id_niveau`
    );
    const niv1 = n1.rows[0].id_niveau;
    const niv2 = n2.rows[0].id_niveau;
    console.log(`Niveaux: ${niv1}, ${niv2}`);

    // ── 2. SPECIALITES ───────────────────────────────────────────────────
    const s1 = await client.query(
      `INSERT INTO specialite (nom_specialite, code_specialite, description, nombre_credits, duree_formation, id_niveau, archived)
       VALUES ('Informatique Appliquee', 'INFO-APP', 'Licence en informatique appliquee et developpement', 180, 3, $1, false)
       RETURNING id_specialite`, [niv1]
    );
    const s2 = await client.query(
      `INSERT INTO specialite (nom_specialite, code_specialite, description, nombre_credits, duree_formation, id_niveau, archived)
       VALUES ('Reseaux et Telecommunications', 'RT-ISET', 'Licence en reseaux informatiques et telecoms', 180, 3, $1, false)
       RETURNING id_specialite`, [niv2]
    );
    const sp1 = s1.rows[0].id_specialite;
    const sp2 = s2.rows[0].id_specialite;
    console.log(`Specialites: ${sp1}, ${sp2}`);

    // ── 3. ENSEIGNANT_MATIERE (link teacher to both specialites) ─────────
    await client.query(
      `INSERT INTO enseignant_matiere (numero_utilisateur, id_specialite) VALUES ($1, $2), ($1, $3)`,
      [ENSEIGNANT_ID, sp1, sp2]
    );
    console.log('Enseignant lie aux specialites');

    // ── 4. MATIERES ──────────────────────────────────────────────────────
    const matieres1 = [
      ['Algorithmique et Structures de Donnees', 'ASD-301', 1, 3.0],
      ['Programmation Orientee Objet', 'POO-302', 1, 2.5],
      ['Base de Donnees Avancees', 'BDA-303', 2, 3.0],
      ['Developpement Web', 'DEV-304', 2, 2.0],
    ];
    const matieres2 = [
      ['Reseaux Informatiques', 'RES-201', 1, 3.0],
      ['Administration Systemes', 'SYS-202', 1, 2.5],
      ['Securite des Reseaux', 'SEC-301', 2, 3.0],
    ];

    const matIds = [];
    for (const [nom, code, sem, coef] of matieres1) {
      const r = await client.query(
        `INSERT INTO matiere (nom_matiere, code_matiere, coefficient, id_specialite, semestre, annee_universitaire)
         VALUES ($1, $2, $3, $4, $5, '2025-2026') RETURNING id_matiere`,
        [nom, code, coef, sp1, sem]
      );
      matIds.push(r.rows[0].id_matiere);
    }
    for (const [nom, code, sem, coef] of matieres2) {
      const r = await client.query(
        `INSERT INTO matiere (nom_matiere, code_matiere, coefficient, id_specialite, semestre, annee_universitaire)
         VALUES ($1, $2, $3, $4, $5, '2025-2026') RETURNING id_matiere`,
        [nom, code, coef, sp2, sem]
      );
      matIds.push(r.rows[0].id_matiere);
    }
    console.log('Matieres creees:', matIds.length);

    // ── 5. ETUDIANTS ─────────────────────────────────────────────────────
    const students = [
      // Specialite 1 - INFO-APP (25 students, mix of grades)
      { nom:'Ayari',    prenom:'Sami',    email:'sami.ayari@etud.isetrades.tn',      moyenne: 16.5, sp: sp1 },
      { nom:'Gharbi',   prenom:'Amira',   email:'amira.gharbi@etud.isetrades.tn',     moyenne: 15.2, sp: sp1 },
      { nom:'Jebali',   prenom:'Karim',   email:'karim.jebali@etud.isetrades.tn',     moyenne: 14.8, sp: sp1 },
      { nom:'Oueslati', prenom:'Nadia',   email:'nadia.oueslati@etud.isetrades.tn',   moyenne: 13.9, sp: sp1 },
      { nom:'Dridi',    prenom:'Youssef', email:'youssef.dridi@etud.isetrades.tn',    moyenne: 13.1, sp: sp1 },
      { nom:'Mansour',  prenom:'Houda',   email:'houda.mansour@etud.isetrades.tn',    moyenne: 12.7, sp: sp1 },
      { nom:'Karray',   prenom:'Fares',   email:'fares.karray@etud.isetrades.tn',     moyenne: 12.3, sp: sp1 },
      { nom:'Chaabane', prenom:'Ines',    email:'ines.chaabane@etud.isetrades.tn',    moyenne: 11.8, sp: sp1 },
      { nom:'Mzoughi',  prenom:'Bilel',   email:'bilel.mzoughi@etud.isetrades.tn',    moyenne: 11.5, sp: sp1 },
      { nom:'Hamdi',    prenom:'Sara',    email:'sara.hamdi@etud.isetrades.tn',        moyenne: 11.0, sp: sp1 },
      { nom:'Bouzid',   prenom:'Hatem',   email:'hatem.bouzid@etud.isetrades.tn',     moyenne: 10.8, sp: sp1 },
      { nom:'Ferchichi',prenom:'Mariem',  email:'mariem.ferchichi@etud.isetrades.tn', moyenne: 10.5, sp: sp1 },
      { nom:'Smida',    prenom:'Rami',    email:'rami.smida@etud.isetrades.tn',        moyenne: 10.2, sp: sp1 },
      { nom:'Trabelsi', prenom:'Khaled',  email:'khaled.trabelsi@etud.isetrades.tn',  moyenne:  9.5, sp: sp1 },
      { nom:'Ben Salem','prenom':'Asma',  email:'asma.bensalem@etud.isetrades.tn',    moyenne:  9.1, sp: sp1 },
      { nom:'Zidi',     prenom:'Omar',    email:'omar.zidi@etud.isetrades.tn',         moyenne:  8.7, sp: sp1 },
      { nom:'Guizani',  prenom:'Fatma',   email:'fatma.guizani@etud.isetrades.tn',    moyenne:  7.9, sp: sp1 },
      { nom:'Mahjoub',  prenom:'Tarek',   email:'tarek.mahjoub@etud.isetrades.tn',    moyenne:  7.2, sp: sp1 },
      // Specialite 2 - RT (18 students)
      { nom:'Ben Amor', prenom:'Zied',    email:'zied.benamor@etud.isetrades.tn',     moyenne: 17.0, sp: sp2 },
      { nom:'Sfaxi',    prenom:'Rim',     email:'rim.sfaxi@etud.isetrades.tn',         moyenne: 15.8, sp: sp2 },
      { nom:'Lazrag',   prenom:'Anis',    email:'anis.lazrag@etud.isetrades.tn',       moyenne: 14.3, sp: sp2 },
      { nom:'Marzouki', prenom:'Donia',   email:'donia.marzouki@etud.isetrades.tn',   moyenne: 13.6, sp: sp2 },
      { nom:'Ghribi',   prenom:'Wassim',  email:'wassim.ghribi@etud.isetrades.tn',    moyenne: 12.9, sp: sp2 },
      { nom:'Jouini',   prenom:'Olfa',    email:'olfa.jouini@etud.isetrades.tn',       moyenne: 12.1, sp: sp2 },
      { nom:'Gaidi',    prenom:'Amine',   email:'amine.gaidi@etud.isetrades.tn',       moyenne: 11.7, sp: sp2 },
      { nom:'Rekik',    prenom:'Sirine',  email:'sirine.rekik@etud.isetrades.tn',     moyenne: 11.2, sp: sp2 },
      { nom:'Mejri',    prenom:'Wael',    email:'wael.mejri@etud.isetrades.tn',        moyenne: 10.6, sp: sp2 },
      { nom:'Khalfallah',prenom:'Nesrine',email:'nesrine.khalfallah@etud.isetrades.tn',moyenne: 10.1, sp: sp2 },
      { nom:'Ksouri',   prenom:'Moez',    email:'moez.ksouri@etud.isetrades.tn',       moyenne:  9.3, sp: sp2 },
      { nom:'Selmi',    prenom:'Hana',    email:'hana.selmi@etud.isetrades.tn',        moyenne:  8.5, sp: sp2 },
      { nom:'Boughzala',prenom:'Slim',    email:'slim.boughzala@etud.isetrades.tn',   moyenne:  7.8, sp: sp2 },
      { nom:'Amri',     prenom:'Cyrine',  email:'cyrine.amri@etud.isetrades.tn',       moyenne:  6.9, sp: sp2 },
    ];

    const hash = await bcrypt.hash('Etudiant2024', 10);
    let i = 0;
    for (const st of students) {
      const ts = Date.now() + i++;
      const numU = `USR-ETU-${ts}`;
      const numE = `ETU${ts}`;
      const cin = String(10000000 + parseInt(ts.toString().slice(-7))).slice(0, 8);

      await client.query(
        `INSERT INTO utilisateur (numero_utilisateur, nom, prenom, email, mot_de_passe, type_utilisateur, statut, date_creation)
         VALUES ($1, $2, $3, $4, $5, 'ETUDIANT', 'ACTIF', NOW())`,
        [numU, st.nom, st.prenom, st.email, hash]
      );

      await client.query(
        `INSERT INTO etudiant (numero_utilisateur, numero_etudiant, cin, moyenne_generale, id_etablissement, id_specialite)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [numU, numE, cin, st.moyenne, ISET_RADES_ID, st.sp]
      );
    }
    console.log(`${students.length} etudiants crees`);

    // ── 6. EXAMENS (planning) ────────────────────────────────────────────
    const examens = [
      [matIds[0], 'Devoir Surveille',  '2026-05-15', 1, 1.0],
      [matIds[1], 'Devoir Surveille',  '2026-05-20', 1, 1.0],
      [matIds[2], 'Examen Final',      '2026-06-10', 2, 2.0],
      [matIds[3], 'Examen Final',      '2026-06-14', 2, 2.0],
      [matIds[4], 'Devoir Surveille',  '2026-05-22', 1, 1.0],
      [matIds[5], 'Examen Final',      '2026-06-05', 2, 2.0],
    ];
    for (const [idM, type, date, sem, coef] of examens) {
      await client.query(
        `INSERT INTO examen (id_matiere, type_examen, date_examen, semestre, coefficient, annee_universitaire)
         VALUES ($1, $2, $3, $4, $5, '2025-2026')`,
        [idM, type, date, sem, coef]
      );
    }
    console.log('Examens planifies');

    await client.query('COMMIT');
    console.log('\nDone! Dashboard will now show:');
    console.log('  - 2 specialites: INFO-APP (18 students) + RT-ISET (14 students)');
    console.log('  - 7 matieres + 6 examens planifies');
    console.log('  - Students with mix of grades (some at risk <10)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
