require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
});

const ENSEIGNANT_ID = 'USR-ENS-1777928650061';
const ISET_RADES_ID = 58;
const DEPT_INFO = 169;

// Deterministic variation per exam index so grades look realistic but are reproducible
const EXAM_OFFSETS = [1.2, -0.8, 0.5, -1.5, 2.0, -0.3, 0.7];

function clampGrade(g) {
  return Math.round(Math.max(0, Math.min(20, g)) * 4) / 4; // round to nearest 0.25
}

async function enrich() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── 1. Resolve specialite IDs ────────────────────────────────────────
    const spRes = await client.query(
      `SELECT id_specialite, code_specialite FROM specialite WHERE code_specialite IN ('INFO-APP','RT-ISET')`
    );
    const spMap = {};
    for (const row of spRes.rows) spMap[row.code_specialite] = row.id_specialite;
    const sp1 = spMap['INFO-APP'];
    const sp2 = spMap['RT-ISET'];
    if (!sp1 || !sp2) throw new Error(`Specialites not found: INFO-APP=${sp1}, RT-ISET=${sp2}`);
    console.log(`Specialites: INFO-APP=${sp1}, RT-ISET=${sp2}`);

    // ── 2. Resolve matiere IDs ────────────────────────────────────────────
    const matRes = await client.query(
      `SELECT id_matiere, code_matiere, id_specialite
       FROM matiere
       WHERE code_matiere IN ('ASD-301','POO-302','BDA-303','DEV-304','RES-201','SYS-202','SEC-301')
         AND annee_universitaire = '2025-2026'`
    );
    const matieres = matRes.rows;
    if (matieres.length === 0) throw new Error('No matieres found for 2025-2026');
    console.log(`Matieres found: ${matieres.length}`);

    // ── 3. Resolve examen IDs ─────────────────────────────────────────────
    const examRes = await client.query(
      `SELECT e.id_examen, e.id_matiere, m.id_specialite, m.code_matiere
       FROM examen e
       JOIN matiere m ON e.id_matiere = m.id_matiere
       WHERE m.annee_universitaire = '2025-2026'
         AND m.code_matiere IN ('ASD-301','POO-302','BDA-303','DEV-304','RES-201','SYS-202','SEC-301')`
    );
    const examens = examRes.rows;
    console.log(`Examens found: ${examens.length}`);

    // ── 4. Get students with their specialite and moyenne ─────────────────
    const studRes = await client.query(
      `SELECT e.numero_utilisateur, e.moyenne_generale, e.id_specialite
       FROM etudiant e
       WHERE e.id_specialite IN ($1, $2)`,
      [sp1, sp2]
    );
    const students = studRes.rows;
    console.log(`Students found: ${students.length}`);

    // ── 5. Insert notes (skip if already exists) ──────────────────────────
    let noteCount = 0;
    for (const st of students) {
      const myExams = examens.filter(ex => ex.id_specialite == st.id_specialite);
      let examIdx = 0;
      for (const ex of myExams) {
        const offset = EXAM_OFFSETS[examIdx % EXAM_OFFSETS.length];
        const grade = clampGrade(parseFloat(st.moyenne_generale) + offset);

        const exists = await client.query(
          `SELECT 1 FROM note WHERE numero_utilisateur = $1 AND id_examen = $2`,
          [st.numero_utilisateur, ex.id_examen]
        );
        if (exists.rowCount === 0) {
          await client.query(
            `INSERT INTO note (numero_utilisateur, id_examen, valeur, date_saisie)
             VALUES ($1, $2, $3, NOW())`,
            [st.numero_utilisateur, ex.id_examen, grade]
          );
          noteCount++;
        }
        examIdx++;
      }
    }
    console.log(`Notes inserted: ${noteCount}`);

    // ── 6. Affectation ───────────────────────────────────────────────────
    const affExists = await client.query(
      `SELECT 1 FROM affectation WHERE numero_utilisateur = $1 AND id_etablissement = $2`,
      [ENSEIGNANT_ID, ISET_RADES_ID]
    );
    if (affExists.rowCount === 0) {
      await client.query(
        `INSERT INTO affectation (numero_utilisateur, id_etablissement, id_departement,
                                  date_debut, date_fin, charge_horaire, type_affectation, statut)
         VALUES ($1, $2, $3, '2024-09-01', '2025-08-31', 18, 'ENSEIGNANT_PERMANENT', 'ACTIVE')`,
        [ENSEIGNANT_ID, ISET_RADES_ID, DEPT_INFO]
      );
      console.log('Affectation created');
    } else {
      console.log('Affectation already exists');
    }

    // ── 7. Enseignant_cours ──────────────────────────────────────────────
    let coursCount = 0;
    for (const mat of matieres) {
      const exists = await client.query(
        `SELECT 1 FROM enseignant_cours WHERE numero_utilisateur = $1 AND id_matiere = $2 AND annee_universitaire = '2025-2026'`,
        [ENSEIGNANT_ID, mat.id_matiere]
      );
      if (exists.rowCount === 0) {
        await client.query(
          `INSERT INTO enseignant_cours (numero_utilisateur, id_matiere, annee_universitaire)
           VALUES ($1, $2, '2025-2026')`,
          [ENSEIGNANT_ID, mat.id_matiere]
        );
        coursCount++;
      }
    }
    console.log(`Enseignant_cours inserted: ${coursCount}`);

    await client.query('COMMIT');
    console.log('\nEnrichment complete:');
    console.log(`  - ${noteCount} notes inserted across ${students.length} students and ${examens.length} examens`);
    console.log(`  - Affectation: ISET Rades, dept ${DEPT_INFO}, 18h/week PERMANENT`);
    console.log(`  - ${coursCount} enseignant_cours entries for 2025-2026`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error:', err.message);
    console.error(err.stack);
  } finally {
    client.release();
    pool.end();
  }
}

enrich();
