const express = require("express");
const router = express.Router();
const { sequelize } = require("../models");
const { authenticateToken } = require("../middleware/auth");

// GET /api/etudiant/profile - Récupérer le profil de l'étudiant connecté
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const numeroUtilisateur = req.user.numero_utilisateur;

    const [results] = await sequelize.query(
      `
      SELECT 
        u.numero_utilisateur,
        u.nom,
        u.prenom,
        u.email,
        u.telephone,
        u.sexe,
        e.numero_etudiant as matricule,
        e.cin,
        e.date_naissance,
        e.filiere,
        e.moyenne_generale,
        v.nom_ville as ville
      FROM utilisateur u
      LEFT JOIN etudiant e ON u.numero_utilisateur = e.numero_utilisateur
      LEFT JOIN ville v ON e.id_ville = v.id_ville
      WHERE u.numero_utilisateur = :numeroUtilisateur
      `,
      {
        replacements: { numeroUtilisateur },
      },
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Profil étudiant non trouvé",
      });
    }

    res.json({
      success: true,
      data: results[0],
    });
  } catch (error) {
    console.error("Erreur récupération profil étudiant:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
});

// GET /api/etudiant/cours - Cours de l'étudiant via sa spécialité
router.get("/cours", authenticateToken, async (req, res) => {
  try {
    const numeroUtilisateur = req.user.numero_utilisateur;

    // Auto-add description column if it doesn't exist yet
    await sequelize.query(
      `ALTER TABLE matiere ADD COLUMN IF NOT EXISTS description TEXT`
    ).catch(() => {});

    const [student] = await sequelize.query(
      `SELECT id_specialite FROM etudiant WHERE numero_utilisateur = :num`,
      { replacements: { num: numeroUtilisateur } }
    );

    if (!student.length || !student[0].id_specialite) {
      return res.json({ success: true, data: [] });
    }

    const idSpecialite = student[0].id_specialite;

    const [cours] = await sequelize.query(
      `SELECT
         m.id_matiere,
         m.nom_matiere,
         m.code_matiere,
         m.semestre,
         m.coefficient,
         m.description,
         s.nom_specialite,
         u.nom || ' ' || u.prenom AS enseignant
       FROM matiere m
       JOIN specialite s ON s.id_specialite = m.id_specialite
       LEFT JOIN enseignant_matiere em ON em.id_specialite = m.id_specialite
       LEFT JOIN utilisateur u ON em.numero_utilisateur = u.numero_utilisateur
       WHERE m.id_specialite = :idSpecialite
       ORDER BY m.semestre, m.nom_matiere`,
      { replacements: { idSpecialite } }
    );

    res.json({ success: true, data: cours });
  } catch (error) {
    console.error("Erreur récupération cours:", error);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
});

// GET /api/etudiant/notes - Notes de l'étudiant (synchronisées avec note_etudiant + evaluation)
router.get("/notes", authenticateToken, async (req, res) => {
  try {
    const numeroUtilisateur = req.user.numero_utilisateur;

    const notes = await sequelize.query(
      `SELECT
         m.id_matiere,
         m.nom_matiere,
         m.code_matiere,
         m.semestre,
         m.coefficient            AS coef_matiere,
         ev.id_evaluation         AS id_examen,
         ev.nom                   AS type_examen,
         ev.date                  AS date_examen,
         ev.coefficient           AS coef_examen,
         ev.type                  AS annee_universitaire,
         ne.note::float           AS note,
         ne.date_saisie
       FROM note_etudiant ne
       JOIN evaluation ev ON ev.id_evaluation = ne.id_evaluation
       JOIN matiere     m  ON m.id_matiere     = ev.id_matiere
       WHERE ne.numero_utilisateur = :num
       ORDER BY m.semestre, m.nom_matiere, ev.date NULLS LAST, ev.id_evaluation`,
      { replacements: { num: numeroUtilisateur }, type: sequelize.QueryTypes.SELECT }
    );

    res.json({ success: true, data: notes });
  } catch (error) {
    console.error("Erreur récupération notes:", error);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
});

// GET /api/etudiant/dashboard - Toutes les données pour le dashboard étudiant
router.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const num = req.user.numero_utilisateur;

    // Spécialité de l'étudiant
    const [stuRow] = await sequelize.query(
      `SELECT id_specialite FROM etudiant WHERE numero_utilisateur = :num`,
      { replacements: { num } }
    );
    const idSpecialite = stuRow[0]?.id_specialite || null;

    // ── Notes de l'étudiant (note_etudiant + evaluation + matiere) ──────
    const rawNotes = await sequelize.query(
      `SELECT m.id_matiere, m.nom_matiere, m.code_matiere, m.semestre,
              ne.note::float AS valeur,
              COALESCE(ev.coefficient::float, 1) AS coef_examen
       FROM note_etudiant ne
       JOIN evaluation ev ON ev.id_evaluation = ne.id_evaluation
       JOIN matiere    m  ON m.id_matiere     = ev.id_matiere
       WHERE ne.numero_utilisateur = :num`,
      { replacements: { num }, type: sequelize.QueryTypes.SELECT }
    );

    // ── Notes de toute la spécialité (pour moyennes de classe) ──────────
    let classNotes = [];
    if (idSpecialite) {
      classNotes = await sequelize.query(
        `SELECT m.id_matiere, ne.note::float AS valeur
         FROM note_etudiant ne
         JOIN evaluation ev ON ev.id_evaluation = ne.id_evaluation
         JOIN matiere    m  ON m.id_matiere     = ev.id_matiere
         JOIN etudiant   e  ON e.numero_utilisateur = ne.numero_utilisateur
         WHERE m.id_specialite = :sp`,
        { replacements: { sp: idSpecialite }, type: sequelize.QueryTypes.SELECT }
      );
    }

    // ── Prochaines évaluations ───────────────────────────────────────────
    let upcomingExams = [];
    if (idSpecialite) {
      upcomingExams = await sequelize.query(
        `SELECT m.nom_matiere, ev.nom AS type_examen, ev.date AS date_examen
         FROM evaluation ev
         JOIN matiere m ON m.id_matiere = ev.id_matiere
         WHERE m.id_specialite = :sp AND ev.date >= CURRENT_DATE
         ORDER BY ev.date
         LIMIT 5`,
        { replacements: { sp: idSpecialite }, type: sequelize.QueryTypes.SELECT }
      );
    }

    // ── Nombre de matières ───────────────────────────────────────────────
    let nbMatieres = 0;
    if (idSpecialite) {
      const [cnt] = await sequelize.query(
        `SELECT COUNT(*) AS nb FROM matiere WHERE id_specialite = :sp`,
        { replacements: { sp: idSpecialite } }
      );
      nbMatieres = parseInt(cnt[0]?.nb || 0);
    }

    // ── Absences de l'étudiant ───────────────────────────────────────────
    let nbAbsences = 0, nbAbsJustifiees = 0;
    const absRows = await sequelize.query(
      `SELECT justifiee FROM absence WHERE numero_utilisateur = :num`,
      { replacements: { num }, type: sequelize.QueryTypes.SELECT }
    );
    nbAbsences = absRows.length;
    nbAbsJustifiees = absRows.filter(a => a.justifiee).length;

    // ── Classement dans la spécialité ────────────────────────────────────
    let rang = null, totalEtudiants = null;
    if (idSpecialite) {
      const rankRows = await sequelize.query(
        `SELECT ne.numero_utilisateur, AVG(ne.note::float) AS moy
         FROM note_etudiant ne
         JOIN evaluation ev ON ev.id_evaluation = ne.id_evaluation
         JOIN matiere    m  ON m.id_matiere     = ev.id_matiere
         JOIN etudiant   e  ON e.numero_utilisateur = ne.numero_utilisateur
         WHERE m.id_specialite = :sp
         GROUP BY ne.numero_utilisateur
         ORDER BY moy DESC`,
        { replacements: { sp: idSpecialite }, type: sequelize.QueryTypes.SELECT }
      );
      totalEtudiants = rankRows.length;
      const myPos = rankRows.findIndex(r => r.numero_utilisateur === num);
      if (myPos >= 0) rang = myPos + 1;
    }

    // ── Calculs JS ───────────────────────────────────────────────────────

    // Moyenne pondérée par matière (étudiant)
    const matiereAcc = {};
    for (const row of rawNotes) {
      if (!matiereAcc[row.id_matiere]) {
        matiereAcc[row.id_matiere] = {
          id_matiere: row.id_matiere, nom_matiere: row.nom_matiere,
          code_matiere: row.code_matiere, semestre: row.semestre, sumV: 0, sumC: 0,
        };
      }
      const c = row.coef_examen || 1;
      matiereAcc[row.id_matiere].sumV += row.valeur * c;
      matiereAcc[row.id_matiere].sumC += c;
    }
    const notesData = Object.values(matiereAcc)
      .map(m => ({
        ...m,
        note_moyenne: m.sumC > 0 ? Math.round((m.sumV / m.sumC) * 100) / 100 : 0,
      }))
      .sort((a, b) => parseInt(a.semestre) - parseInt(b.semestre) || a.nom_matiere.localeCompare(b.nom_matiere));

    // Moyenne de classe par matière
    const classAcc = {};
    for (const row of classNotes) {
      if (!classAcc[row.id_matiere]) classAcc[row.id_matiere] = { sum: 0, count: 0 };
      classAcc[row.id_matiere].sum += row.valeur;
      classAcc[row.id_matiere].count++;
    }
    const classAvgMap = {};
    for (const [id, d] of Object.entries(classAcc)) {
      classAvgMap[id] = d.count > 0 ? Math.round((d.sum / d.count) * 100) / 100 : 0;
    }

    // Évolution par semestre
    const semAcc = {};
    for (const row of rawNotes) {
      const s = String(row.semestre);
      if (!semAcc[s]) semAcc[s] = { sum: 0, count: 0 };
      semAcc[s].sum += row.valeur;
      semAcc[s].count++;
    }
    const evolution = Object.entries(semAcc)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([s, d]) => ({ semestre: `S${s}`, moyenne: Math.round((d.sum / d.count) * 100) / 100 }));

    // Radar compétences
    const competences = notesData.map(m => ({
      matiere: m.code_matiere || m.nom_matiere.slice(0, 8),
      note: m.note_moyenne,
      moyenne: classAvgMap[m.id_matiere] || 0,
    }));

    // Tableau matières
    const matieres = notesData.map(m => {
      const note = m.note_moyenne;
      const moy  = classAvgMap[m.id_matiere] || 0;
      const diff = parseFloat((note - moy).toFixed(1));
      return {
        nom: m.nom_matiere, code: m.code_matiere, semestre: m.semestre,
        note, moyenneClasse: moy,
        ecart: moy > 0 ? (diff >= 0 ? `+${diff}` : `${diff}`) : '—',
        statut: note >= 16 ? 'excellent' : note >= 14 ? 'bon' : note >= 12 ? 'correct' : 'ameliorer',
        progression: Math.round((note / 20) * 100),
      };
    });

    // Alertes
    const alertes = [];
    for (const ex of upcomingExams) {
      const daysLeft = ex.date_examen
        ? Math.max(0, Math.ceil((new Date(ex.date_examen) - new Date()) / 86400000))
        : null;
      alertes.push({
        type: 'info',
        titre: `${ex.type_examen}${daysLeft !== null ? ` dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}` : ''}`,
        message: `${ex.nom_matiere}${ex.date_examen ? ` — ${new Date(ex.date_examen).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}` : ''}`,
      });
    }
    for (const m of matieres) {
      if (m.note > 0 && m.note < 10) {
        alertes.push({ type: 'warning', titre: m.nom, message: `Note ${m.note}/20 — en dessous de la note de passage` });
      } else if (m.note >= 16 && m.moyenneClasse > 0) {
        alertes.push({ type: 'success', titre: `Excellent en ${m.nom}`, message: `${m.ecart} pts au-dessus de la moyenne de classe` });
      }
    }
    if (nbAbsences > 5) {
      alertes.push({ type: 'warning', titre: 'Absences élevées', message: `${nbAbsences} absences enregistrées dont ${nbAbsences - nbAbsJustifiees} non justifiées` });
    }

    const semestreActuel = notesData.length > 0
      ? Math.max(...notesData.map(m => parseInt(m.semestre) || 0))
      : 1;

    res.json({
      success: true,
      data: {
        stats: {
          nb_matieres:      nbMatieres,
          semestre_actuel:  semestreActuel,
          classement:       rang && totalEtudiants ? `Top ${Math.round((rang / totalEtudiants) * 100)}%` : null,
          rang,
          total_etudiants:  totalEtudiants,
          nb_absences:      nbAbsences,
          nb_abs_justifiees: nbAbsJustifiees,
        },
        competences,
        evolution,
        matieres,
        alertes: alertes.slice(0, 5),
      },
    });
  } catch (error) {
    console.error("Erreur dashboard étudiant:", error);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
});

// GET /api/etudiant/etablissement - Info sur l'établissement de l'étudiant
router.get("/etablissement", authenticateToken, async (req, res) => {
  try {
    const num = req.user.numero_utilisateur;

    const [studentRows] = await sequelize.query(
      `SELECT id_etablissement FROM etudiant WHERE numero_utilisateur = :num`,
      { replacements: { num } }
    );

    if (!studentRows.length || !studentRows[0].id_etablissement) {
      return res.status(404).json({ success: false, message: "Établissement non trouvé" });
    }

    const idEtablissement = studentRows[0].id_etablissement;

    const [etabRows] = await sequelize.query(
      `SELECT e.id_etablissement, e.nom_etablissement, e.code_etablissement, e.type,
              e.adresse, e.telephone, e.email,
              r.nom_rectorat, r.id_rectorat,
              v.nom_ville
       FROM etablissement e
       LEFT JOIN rectorat r ON e.id_rectorat = r.id_rectorat
       LEFT JOIN ville v ON e.id_ville = v.id_ville
       WHERE e.id_etablissement = :id`,
      { replacements: { id: idEtablissement } }
    );

    if (!etabRows.length) {
      return res.status(404).json({ success: false, message: "Établissement non trouvé" });
    }

    const [nbEt] = await sequelize.query(
      `SELECT COUNT(*) AS nb FROM etudiant WHERE id_etablissement = :id`,
      { replacements: { id: idEtablissement } }
    );
    const [nbEns] = await sequelize.query(
      `SELECT COUNT(*) AS nb FROM enseignant WHERE id_etablissement_principal = :id`,
      { replacements: { id: idEtablissement } }
    );

    const [specialites] = await sequelize.query(
      `SELECT s.id_specialite, s.nom_specialite, s.code_specialite,
              d.nom_departement,
              COUNT(et.numero_etudiant) AS nb_etudiants
       FROM specialite s
       JOIN niveau n ON s.id_niveau = n.id_niveau
       JOIN departement d ON n.id_departement = d.id_departement
       LEFT JOIN etudiant et ON et.id_specialite = s.id_specialite
       WHERE d.id_etablissement = :id
       GROUP BY s.id_specialite, s.nom_specialite, s.code_specialite, d.nom_departement
       ORDER BY d.nom_departement, s.nom_specialite`,
      { replacements: { id: idEtablissement } }
    );

    res.json({
      success: true,
      data: {
        etablissement: {
          ...etabRows[0],
          nb_etudiants: parseInt(nbEt[0]?.nb || 0),
          nb_enseignants: parseInt(nbEns[0]?.nb || 0),
          nb_specialites: specialites.length,
        },
        specialites: specialites.map(s => ({ ...s, nb_etudiants: parseInt(s.nb_etudiants || 0) })),
      },
    });
  } catch (error) {
    console.error("Erreur récupération établissement étudiant:", error);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
});

// POST /api/etudiant/absences - Déclarer une absence
router.post("/absences", authenticateToken, async (req, res) => {
  try {
    const num = req.user.numero_utilisateur;
    const { date, type_seance, semestre } = req.body;

    if (!date || !type_seance) {
      return res.status(400).json({ success: false, message: "date et type_seance sont requis" });
    }

    const [rows] = await sequelize.query(
      "SELECT id_specialite FROM etudiant WHERE numero_utilisateur = :num",
      { replacements: { num } }
    );

    if (!rows.length || !rows[0].id_specialite) {
      return res.status(400).json({ success: false, message: "Spécialité introuvable pour cet étudiant" });
    }

    const idSpecialite = rows[0].id_specialite;

    const [inserted] = await sequelize.query(
      `INSERT INTO absence (numero_utilisateur, id_specialite, date_absence, type_seance, semestre, justifiee)
       VALUES (:num, :idSpecialite, :date, :typeSeance, :semestre, false)
       ON CONFLICT (numero_utilisateur, id_specialite, date_absence, type_seance) DO NOTHING
       RETURNING id_absence`,
      { replacements: { num, idSpecialite, date, typeSeance: type_seance, semestre: semestre || null } }
    );

    if (!inserted.length) {
      return res.status(409).json({ success: false, message: "Une absence est déjà enregistrée pour cette date et ce type de séance." });
    }

    res.json({ success: true, message: "Absence déclarée avec succès" });
  } catch (error) {
    console.error("Erreur déclaration absence:", error);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
});

// GET /api/etudiant/absences - Absences de l'étudiant connecté
router.get("/absences", authenticateToken, async (req, res) => {
  try {
    const num = req.user.numero_utilisateur;

    // Create table if not exists (matches teacher dashboard schema)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS absence (
        id_absence         SERIAL PRIMARY KEY,
        numero_utilisateur VARCHAR REFERENCES utilisateur(numero_utilisateur) ON DELETE CASCADE,
        id_specialite      INTEGER REFERENCES specialite(id_specialite) ON DELETE CASCADE,
        enseignant_id      VARCHAR REFERENCES utilisateur(numero_utilisateur) ON DELETE SET NULL,
        date_absence       DATE NOT NULL,
        type_seance        VARCHAR(20) DEFAULT 'CM',
        semestre           INTEGER,
        justifiee          BOOLEAN DEFAULT false,
        created_at         TIMESTAMP DEFAULT NOW(),
        UNIQUE(numero_utilisateur, id_specialite, date_absence, type_seance)
      )
    `);

    const [absences] = await sequelize.query(
      `SELECT
         a.id_absence,
         a.date_absence,
         a.type_seance,
         a.semestre,
         a.justifiee,
         s.nom_specialite,
         u.nom || ' ' || u.prenom AS enseignant_nom
       FROM absence a
       JOIN specialite s ON a.id_specialite = s.id_specialite
       LEFT JOIN utilisateur u ON a.enseignant_id = u.numero_utilisateur
       WHERE a.numero_utilisateur = :num
       ORDER BY a.date_absence DESC`,
      { replacements: { num } }
    );

    const total        = absences.length;
    const justifiees   = absences.filter(a => a.justifiee).length;

    res.json({
      success: true,
      data: {
        absences,
        stats: { total, justifiees, non_justifiees: total - justifiees },
      },
    });
  } catch (error) {
    console.error("Erreur récupération absences étudiant:", error);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
});

module.exports = router;
