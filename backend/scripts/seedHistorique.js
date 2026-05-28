require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

// ── Matières historiques par spécialité ────────────────────────────────────
const MATIERES_1053 = {
  L1: {
    S1: [
      { nom: 'Analyse 1',           coef: 3 },
      { nom: 'Algèbre 1',            coef: 3 },
      { nom: 'Informatique Générale',coef: 2 },
      { nom: 'Algorithmique de Base',coef: 3 },
      { nom: 'Anglais 1',            coef: 1 },
      { nom: "Droit de l'Entreprise", coef: 1 },
    ],
    S2: [
      { nom: 'Analyse 2',            coef: 3 },
      { nom: 'Algèbre 2',            coef: 3 },
      { nom: 'Programmation C',      coef: 3 },
      { nom: 'Systèmes Logiques',    coef: 2 },
      { nom: 'Anglais 2',            coef: 1 },
      { nom: 'Statistiques',         coef: 2 },
    ],
  },
  L2: {
    S3: [
      { nom: 'Algorithmique Avancée',       coef: 3 },
      { nom: 'POO Java',                    coef: 3 },
      { nom: 'Bases de Données',            coef: 2 },
      { nom: "Systèmes d'Exploitation",      coef: 2 },
      { nom: 'Mathématiques Discrètes',     coef: 2 },
      { nom: 'Anglais 3',                   coef: 1 },
    ],
    S4: [
      { nom: 'Conception Logicielle (UML)', coef: 3 },
      { nom: 'Développement Web Front',     coef: 2 },
      { nom: 'BDD Avancées',                coef: 3 },
      { nom: 'Réseaux Informatiques',       coef: 2 },
      { nom: 'Probabilités',                coef: 2 },
      { nom: 'Gestion de Projet',           coef: 1 },
    ],
  },
  L3: {
    S5: [
      { nom: 'Algorithmique et Structures de Données', coef: 3 },
      { nom: 'Programmation Orientée Objet',           coef: 2.5 },
      { nom: 'Architecture Logicielle',                coef: 2 },
      { nom: 'Sécurité Informatique',                  coef: 2 },
      { nom: 'Anglais 4',                              coef: 1 },
    ],
    S6: [
      { nom: 'Base de Données Avancées',               coef: 3 },
      { nom: 'Développement Web',                      coef: 2 },
      { nom: 'Intelligence Artificielle',              coef: 2 },
      { nom: 'Cloud Computing',                        coef: 2 },
      { nom: 'Stage / PFE',                            coef: 3 },
    ],
  },
};

const MATIERES_1054 = {
  L1: {
    S1: [
      { nom: 'Analyse 1',                  coef: 3 },
      { nom: 'Algèbre 1',                   coef: 3 },
      { nom: 'Electronique de Base',        coef: 2 },
      { nom: 'Informatique Générale',       coef: 2 },
      { nom: 'Anglais 1',                   coef: 1 },
      { nom: "Droit de l'Entreprise",        coef: 1 },
    ],
    S2: [
      { nom: 'Analyse 2',                  coef: 3 },
      { nom: 'Signaux et Systèmes',         coef: 3 },
      { nom: 'Electronique Numérique',      coef: 2 },
      { nom: 'Programmation C',             coef: 2 },
      { nom: 'Anglais 2',                   coef: 1 },
      { nom: 'Physique des Ondes',          coef: 2 },
    ],
  },
  L2: {
    S3: [
      { nom: 'Réseaux de Base',             coef: 3 },
      { nom: 'OS Linux',                    coef: 2 },
      { nom: 'Télécommunications 1',        coef: 3 },
      { nom: 'Electronique HF',             coef: 2 },
      { nom: 'Probabilités et Stats',       coef: 2 },
      { nom: 'Anglais 3',                   coef: 1 },
    ],
    S4: [
      { nom: 'Réseaux Avancés (TCP/IP)',    coef: 3 },
      { nom: 'Administration Linux',        coef: 2 },
      { nom: 'Télécommunications 2',        coef: 3 },
      { nom: 'Protocoles de Routage',       coef: 2 },
      { nom: 'Sécurité Fondamentale',       coef: 2 },
      { nom: 'Gestion de Projet',           coef: 1 },
    ],
  },
  L3: {
    S5: [
      { nom: 'Réseaux Informatiques',       coef: 3 },
      { nom: 'Administration Systèmes',     coef: 2.5 },
      { nom: 'Virtualisation et Cloud',     coef: 2 },
      { nom: 'Sécurité Réseau Avancée',     coef: 2 },
      { nom: 'Anglais 4',                   coef: 1 },
    ],
    S6: [
      { nom: 'Sécurité des Réseaux',        coef: 3 },
      { nom: 'VoIP et Multimédia',          coef: 2 },
      { nom: 'SDN / NFV',                   coef: 2 },
      { nom: 'Supervision Réseau',          coef: 2 },
      { nom: 'Stage / PFE',                 coef: 3 },
    ],
  },
};

const ANNEES = {
  L1: '2022-2023',
  L2: '2023-2024',
  L3: '2024-2025',
};

const NIVEAU_SEM = {
  L1: { S1: 1, S2: 2 },
  L2: { S3: 3, S4: 4 },
  L3: { S5: 5, S6: 6 },
};

// ── Fonctions utilitaires ──────────────────────────────────────────────────
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function round2(v) { return Math.round(v * 100) / 100; }
function noise(amplitude) { return (Math.random() - 0.5) * amplitude; }

function genNote(base, amplitude = 3) {
  return round2(clamp(base + noise(amplitude), 2, 20));
}

function genAbsences(base) {
  return Math.max(0, Math.round(base + noise(3)));
}

function mention(moy) {
  if (moy >= 16) return 'Très Bien';
  if (moy >= 14) return 'Bien';
  if (moy >= 12) return 'Assez Bien';
  if (moy >= 10) return 'Passable';
  return 'Insuffisant';
}

function statut(moy) {
  return moy >= 10 ? 'Admis' : 'Ajourné';
}

// ── Profils d'étudiants ────────────────────────────────────────────────────
// profile = { baseScore, absenceBase, trend }
// trend: score change per year (+/-)
function assignProfile(idx) {
  const r = idx % 10;
  if (r < 3) return { baseScore: 15.5, absenceBase: 1,  trend: 0.3  };  // excellent stable
  if (r < 6) return { baseScore: 12.5, absenceBase: 4,  trend: 0.2  };  // bon stable
  if (r < 8) return { baseScore: 10.5, absenceBase: 7,  trend: -0.3 };  // moyen en déclin
  if (r < 9) return { baseScore: 14.0, absenceBase: 2,  trend: -0.8 };  // bon déclinant
              return { baseScore: 8.5,  absenceBase: 12, trend: 0.5  };  // risque améliorant
}

// ── Main ───────────────────────────────────────────────────────────────────
async function run() {
  // Create tables
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS historique_academique (
      id                    SERIAL PRIMARY KEY,
      numero_utilisateur    VARCHAR(50) NOT NULL,
      id_specialite         INTEGER,
      niveau                VARCHAR(5)  NOT NULL,
      annee_academique      VARCHAR(9)  NOT NULL,
      semestre              INTEGER     NOT NULL,
      moyenne               NUMERIC(4,2),
      nb_absences           INTEGER     DEFAULT 0,
      nb_absences_justifiees INTEGER    DEFAULT 0,
      nb_matieres_total     INTEGER     DEFAULT 0,
      nb_matieres_validees  INTEGER     DEFAULT 0,
      taux_reussite         NUMERIC(5,2),
      credits_valides       NUMERIC(5,1),
      rang                  INTEGER,
      mention               VARCHAR(30),
      statut                VARCHAR(20) DEFAULT 'Admis',
      created_at            TIMESTAMP   DEFAULT NOW(),
      UNIQUE(numero_utilisateur, annee_academique, semestre)
    )
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS historique_notes_matiere (
      id                    SERIAL PRIMARY KEY,
      numero_utilisateur    VARCHAR(50) NOT NULL,
      id_specialite         INTEGER,
      nom_matiere           VARCHAR(200) NOT NULL,
      annee_academique      VARCHAR(9)   NOT NULL,
      semestre              INTEGER      NOT NULL,
      coefficient           NUMERIC(4,2) DEFAULT 1,
      note_ds               NUMERIC(4,2),
      note_tp               NUMERIC(4,2),
      note_examen           NUMERIC(4,2),
      note_finale           NUMERIC(4,2),
      nb_absences_matiere   INTEGER      DEFAULT 0,
      valide                BOOLEAN,
      created_at            TIMESTAMP    DEFAULT NOW()
    )
  `);

  // Clear old seed data
  await sequelize.query(`DELETE FROM historique_notes_matiere`);
  await sequelize.query(`DELETE FROM historique_academique`);
  console.log('Tables créées et vidées.');

  // Fetch students
  const students = await sequelize.query(
    `SELECT e.numero_utilisateur, e.id_specialite, u.nom, u.prenom
     FROM etudiant e JOIN utilisateur u ON e.numero_utilisateur = u.numero_utilisateur
     WHERE e.id_specialite IN (1053, 1054) ORDER BY e.id_specialite, u.nom`,
    { type: QueryTypes.SELECT }
  );
  console.log(`${students.length} étudiants trouvés.`);

  let semCount = 0, matiereCount = 0;

  for (let si = 0; si < students.length; si++) {
    const stu = students[si];
    const profile = assignProfile(si);
    const matieresRef = stu.id_specialite === 1053 ? MATIERES_1053 : MATIERES_1054;
    const totalCreditsPerSem = 30;

    for (const [niveau, semestres] of Object.entries(matieresRef)) {
      const yearOffset = niveau === 'L1' ? 0 : niveau === 'L2' ? 1 : 2;
      const baseThisYear = clamp(profile.baseScore + profile.trend * yearOffset, 4, 19.5);
      const absThisYear = Math.max(0, profile.absenceBase - profile.trend * yearOffset * 2);

      for (const [semKey, matieres] of Object.entries(semestres)) {
        const semNum = NIVEAU_SEM[niveau][semKey];
        const annee = ANNEES[niveau];

        // Generate per-matière notes
        let wSum = 0, wTotal = 0, validees = 0, absTotal = 0;
        const matiereRows = [];

        for (const mat of matieres) {
          const noteDS     = genNote(baseThisYear, 3.5);
          const noteTP     = genNote(baseThisYear + 0.5, 3);   // TPs slightly easier
          const noteExamen = genNote(baseThisYear - 0.5, 4);   // exams slightly harder
          const noteFinale = round2(
            clamp((noteDS * 0.3 + noteTP * 0.2 + noteExamen * 0.5), 0, 20)
          );
          const absMatiere = Math.max(0, Math.round(absThisYear / matieres.length + noise(1)));
          const isValid    = noteFinale >= 10;

          if (isValid) validees++;
          wSum   += noteFinale * mat.coef;
          wTotal += mat.coef;
          absTotal += absMatiere;

          matiereRows.push({
            numero_utilisateur: stu.numero_utilisateur,
            id_specialite:      stu.id_specialite,
            nom_matiere:        mat.nom,
            annee_academique:   annee,
            semestre:           semNum,
            coefficient:        mat.coef,
            note_ds:            noteDS,
            note_tp:            noteTP,
            note_examen:        noteExamen,
            note_finale:        noteFinale,
            nb_absences_matiere: absMatiere,
            valide:             isValid,
          });
        }

        const moyenne         = round2(wSum / wTotal);
        const tauxReussite    = round2((validees / matieres.length) * 100);
        const absJustifiees   = Math.min(absTotal, Math.max(0, Math.round(absTotal * 0.3 + noise(1))));
        const credits         = round2((validees / matieres.length) * totalCreditsPerSem);

        // Insert semester summary
        await sequelize.query(
          `INSERT INTO historique_academique
             (numero_utilisateur, id_specialite, niveau, annee_academique, semestre,
              moyenne, nb_absences, nb_absences_justifiees,
              nb_matieres_total, nb_matieres_validees, taux_reussite,
              credits_valides, mention, statut)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
           ON CONFLICT (numero_utilisateur, annee_academique, semestre) DO NOTHING`,
          {
            bind: [
              stu.numero_utilisateur, stu.id_specialite, niveau, annee, semNum,
              moyenne, absTotal, absJustifiees,
              matieres.length, validees, tauxReussite,
              credits, mention(moyenne), statut(moyenne),
            ],
            type: QueryTypes.INSERT,
          }
        );
        semCount++;

        // Insert per-matière rows
        for (const mr of matiereRows) {
          await sequelize.query(
            `INSERT INTO historique_notes_matiere
               (numero_utilisateur, id_specialite, nom_matiere, annee_academique, semestre,
                coefficient, note_ds, note_tp, note_examen, note_finale, nb_absences_matiere, valide)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            {
              bind: [
                mr.numero_utilisateur, mr.id_specialite, mr.nom_matiere, mr.annee_academique, mr.semestre,
                mr.coefficient, mr.note_ds, mr.note_tp, mr.note_examen, mr.note_finale,
                mr.nb_absences_matiere, mr.valide,
              ],
              type: QueryTypes.INSERT,
            }
          );
          matiereCount++;
        }
      }
    }
  }

  // Assign ranks per semestre per specialite
  const semestres = await sequelize.query(
    `SELECT DISTINCT id_specialite, annee_academique, semestre FROM historique_academique ORDER BY id_specialite, semestre`,
    { type: QueryTypes.SELECT }
  );
  for (const row of semestres) {
    const ranked = await sequelize.query(
      `SELECT id, numero_utilisateur, moyenne FROM historique_academique
       WHERE id_specialite = $1 AND annee_academique = $2 AND semestre = $3
       ORDER BY moyenne DESC NULLS LAST`,
      { bind: [row.id_specialite, row.annee_academique, row.semestre], type: QueryTypes.SELECT }
    );
    for (let i = 0; i < ranked.length; i++) {
      await sequelize.query(
        `UPDATE historique_academique SET rang = $1 WHERE id = $2`,
        { bind: [i + 1, ranked[i].id], type: QueryTypes.UPDATE }
      );
    }
  }

  const [ha, hn] = await Promise.all([
    sequelize.query('SELECT COUNT(*) AS cnt FROM historique_academique', { type: QueryTypes.SELECT }),
    sequelize.query('SELECT COUNT(*) AS cnt FROM historique_notes_matiere', { type: QueryTypes.SELECT }),
  ]);

  console.log(`\n✓ historique_academique : ${ha[0].cnt} lignes (${students.length} étudiants × 6 semestres)`);
  console.log(`✓ historique_notes_matiere : ${hn[0].cnt} lignes`);
  console.log(`✓ Rangs calculés pour ${semestres.length} groupes`);
  await sequelize.close();
}

run().catch(e => { console.error(e.message); process.exit(1); });
