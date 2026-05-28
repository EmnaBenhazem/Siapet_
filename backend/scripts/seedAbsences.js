require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

// absence columns: numero_utilisateur, id_specialite, enseignant_id, date_absence, type_seance, semestre, justifiee
// unique: (numero_utilisateur, id_specialite, date_absence, type_seance)

const TEACHER = 'USR-ENS-1777928650061';
const TYPES = ['CM', 'TD', 'TP', 'Examen'];
const SEMESTRES = [1, 2, 3];

const DATES = [
  '2025-09-15', '2025-09-22', '2025-10-01', '2025-10-14',
  '2025-10-28', '2025-11-05', '2025-11-18', '2025-11-25',
  '2025-12-03', '2025-12-10', '2025-12-17',
  '2026-01-08', '2026-01-15', '2026-01-22',
  '2026-02-04', '2026-02-11', '2026-02-18', '2026-02-25',
  '2026-03-05', '2026-03-12', '2026-03-19',
  '2026-04-02', '2026-04-16', '2026-04-23',
  '2026-05-05', '2026-05-08',
];

function pick(arr, i) { return arr[i % arr.length]; }

async function run() {
  // Delete all non-seed absences to start fresh
  await sequelize.query(`DELETE FROM absence WHERE id_absence > 1`, { type: QueryTypes.DELETE });
  console.log('Cleared old absence data.');

  const students = await sequelize.query(
    `SELECT e.numero_utilisateur, e.id_specialite, u.nom, u.prenom
     FROM etudiant e JOIN utilisateur u ON u.numero_utilisateur = e.numero_utilisateur
     WHERE e.id_specialite IN (1053, 1054)
     ORDER BY e.id_specialite, u.nom`,
    { type: QueryTypes.SELECT }
  );
  console.log(`Found ${students.length} students.`);

  const records = [];
  students.forEach((stu, idx) => {
    // Each student gets 3-5 absence records on different date+type combos
    const count = 3 + (idx % 3); // 3, 4, or 5
    const usedKeys = new Set();

    for (let k = 0; k < count; k++) {
      // pick unique (date, type) combo per student
      let d, t, key;
      let attempts = 0;
      do {
        d = pick(DATES, idx * 7 + k + attempts);
        t = pick(TYPES, idx + k + attempts);
        key = `${d}|${t}`;
        attempts++;
      } while (usedKeys.has(key) && attempts < 50);
      usedKeys.add(key);

      const semestre = pick(SEMESTRES, k);
      const justifiee = (idx + k) % 4 === 0; // ~25% justified
      // Every 5th record is student-declared (enseignant_id = null)
      const parEtudiant = (idx + k) % 5 === 0;

      records.push({
        numero_utilisateur: stu.numero_utilisateur,
        id_specialite: stu.id_specialite,
        enseignant_id: parEtudiant ? null : TEACHER,
        date_absence: d,
        type_seance: t,
        semestre,
        justifiee,
      });
    }
  });

  console.log(`Inserting ${records.length} absence records...`);

  let inserted = 0;
  let skipped = 0;
  for (const r of records) {
    try {
      const result = await sequelize.query(
        `INSERT INTO absence (numero_utilisateur, id_specialite, enseignant_id, date_absence, type_seance, semestre, justifiee)
         VALUES (:numero_utilisateur, :id_specialite, :enseignant_id, :date_absence, :type_seance, :semestre, :justifiee)
         ON CONFLICT (numero_utilisateur, id_specialite, date_absence, type_seance) DO NOTHING`,
        { type: QueryTypes.INSERT, replacements: r }
      );
      inserted++;
    } catch (e) {
      console.warn(`  Skip (${r.numero_utilisateur}, ${r.date_absence}, ${r.type_seance}): ${e.message}`);
      skipped++;
    }
  }

  const total = await sequelize.query(`SELECT COUNT(*) AS cnt FROM absence`, { type: QueryTypes.SELECT });
  console.log(`Done. Inserted: ${inserted}, Skipped: ${skipped}. Total in DB: ${total[0].cnt}`);
  await sequelize.close();
}

run().catch(e => { console.error(e.message); process.exit(1); });
