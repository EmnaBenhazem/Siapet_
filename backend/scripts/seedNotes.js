require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

// Matieres: 25,26,27,28 (spec 1053) / 29,30,31 (spec 1054)
const MATIERES = [
  { id: 25, spec: 1053 }, { id: 26, spec: 1053 },
  { id: 27, spec: 1053 }, { id: 28, spec: 1053 },
  { id: 29, spec: 1054 }, { id: 30, spec: 1054 },
  { id: 31, spec: 1054 },
];

const EVAL_TYPES = ['Devoir Surveillé', 'Examen', 'TP Noté', 'Quiz'];
const EVAL_DEFS = [
  { nom: 'DS1',       type: 'Devoir Surveillé', date: '2025-11-10', coef: 1 },
  { nom: 'DS2',       type: 'Devoir Surveillé', date: '2026-01-15', coef: 1 },
  { nom: 'Examen S1', type: 'Examen',           date: '2026-01-25', coef: 2 },
];

function rand(min, max) { return Math.round((Math.random() * (max - min) + min) * 100) / 100; }

async function run() {
  // ensure tables
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS evaluation (
      id_evaluation SERIAL PRIMARY KEY,
      id_matiere    INTEGER NOT NULL,
      nom           VARCHAR(200) NOT NULL,
      type          VARCHAR(100) DEFAULT 'Devoir Surveillé',
      date          DATE,
      coefficient   NUMERIC(4,2) DEFAULT 1,
      date_creation TIMESTAMP DEFAULT NOW()
    )
  `);
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS note_etudiant (
      id_note            SERIAL PRIMARY KEY,
      id_evaluation      INTEGER NOT NULL REFERENCES evaluation(id_evaluation) ON DELETE CASCADE,
      numero_utilisateur VARCHAR(50) NOT NULL,
      note               NUMERIC(4,2),
      date_saisie        TIMESTAMP DEFAULT NOW(),
      UNIQUE(id_evaluation, numero_utilisateur)
    )
  `);

  // clear old seed data
  await sequelize.query(`DELETE FROM note_etudiant`);
  await sequelize.query(`DELETE FROM evaluation`);
  console.log('Cleared evaluation and note_etudiant tables.');

  // fetch students per specialite
  const students = await sequelize.query(
    `SELECT e.numero_utilisateur, e.id_specialite FROM etudiant e WHERE e.id_specialite IN (1053, 1054)`,
    { type: QueryTypes.SELECT }
  );

  let evalCount = 0, noteCount = 0;

  for (const m of MATIERES) {
    for (const ev of EVAL_DEFS) {
      // insert evaluation
      const inserted = await sequelize.query(
        `INSERT INTO evaluation (id_matiere, nom, type, date, coefficient)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id_evaluation`,
        { bind: [m.id, ev.nom, ev.type, ev.date, ev.coef], type: QueryTypes.SELECT }
      );
      const idEval = inserted[0].id_evaluation;
      evalCount++;

      // insert notes for students in this specialite
      const specStudents = students.filter(s => s.id_specialite === m.spec);
      for (const stu of specStudents) {
        // ~10% chance of missing note
        if (Math.random() < 0.10) continue;
        const note = rand(4, 20);
        await sequelize.query(
          `INSERT INTO note_etudiant (id_evaluation, numero_utilisateur, note)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          { bind: [idEval, stu.numero_utilisateur, note], type: QueryTypes.INSERT }
        );
        noteCount++;
      }
    }
  }

  const [ev, nt] = await Promise.all([
    sequelize.query('SELECT COUNT(*) AS cnt FROM evaluation', { type: QueryTypes.SELECT }),
    sequelize.query('SELECT COUNT(*) AS cnt FROM note_etudiant', { type: QueryTypes.SELECT }),
  ]);
  console.log(`Done. evaluations: ${ev[0].cnt}, notes: ${nt[0].cnt}`);
  await sequelize.close();
}

run().catch(e => { console.error(e.message); process.exit(1); });
