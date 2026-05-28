const { sequelize } = require("../models");
const XLSX = require("xlsx");

const getEtablissement = async (numeroUtilisateur) => {
  const rows = await sequelize.query(
    `SELECT id_etablissement_principal FROM enseignant WHERE numero_utilisateur = $1`,
    { bind: [numeroUtilisateur], type: sequelize.QueryTypes.SELECT },
  );
  return rows[0]?.id_etablissement_principal ?? null;
};

// GET /api/enseignant/dashboard/filters
exports.getFilters = async (req, res) => {
  try {
    const numeroUtilisateur = req.user.numero_utilisateur;

    // Specialités assigned to this teacher
    const matieres = await sequelize.query(
      `SELECT s.id_specialite, s.nom_specialite, s.code_specialite, n.type_niveau
       FROM enseignant_matiere em
       JOIN specialite s ON em.id_specialite = s.id_specialite
       JOIN niveau     n ON s.id_niveau      = n.id_niveau
       WHERE em.numero_utilisateur = $1
         AND s.archived = false
       ORDER BY s.nom_specialite`,
      { bind: [numeroUtilisateur], type: sequelize.QueryTypes.SELECT },
    );

    // Distinct niveau types from the assigned specialites
    const groupes = [...new Set(matieres.map((m) => m.type_niveau))].sort();

    // Actual matiere rows for the séance creation form
    const matieresForm = await sequelize.query(
      `SELECT m.id_matiere, m.nom_matiere, m.code_matiere, m.semestre, m.id_specialite
       FROM matiere m
       JOIN enseignant_matiere em ON em.id_specialite = m.id_specialite
       WHERE em.numero_utilisateur = $1
       ORDER BY m.nom_matiere`,
      { bind: [numeroUtilisateur], type: sequelize.QueryTypes.SELECT },
    );

    res.json({
      success: true,
      data: { matieres, groupes, matieresForm },
    });
  } catch (error) {
    console.error("Erreur getFilters enseignant:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// GET /api/enseignant/dashboard/stats-par-matiere?type_niveau=&periode=
exports.getStatsParMatiere = async (req, res) => {
  try {
    const numeroUtilisateur = req.user.numero_utilisateur;
    const idEtablissement = await getEtablissement(numeroUtilisateur);
    if (!idEtablissement) {
      return res
        .status(404)
        .json({ success: false, message: "Enseignant non trouvé" });
    }

    const { type_niveau, periode } = req.query;
    const monthsClause = periodeToMonths(periode);

    const sql = `
      SELECT
         s.id_specialite,
         s.nom_specialite,
         s.code_specialite,
         n.type_niveau,
         COUNT(e.numero_utilisateur)                                    AS total_etudiants,
         ROUND(AVG(e.moyenne_generale)::numeric, 2)                    AS moyenne,
         COUNT(CASE WHEN e.moyenne_generale >= 10 THEN 1 END)          AS nb_reussite,
         COUNT(CASE WHEN e.moyenne_generale <  10 THEN 1 END)          AS nb_a_risque,
         COUNT(CASE WHEN e.moyenne_generale IS NOT NULL THEN 1 END)    AS nb_avec_notes
       FROM enseignant_matiere em
       JOIN specialite s  ON em.id_specialite = s.id_specialite
       JOIN niveau     n  ON s.id_niveau      = n.id_niveau
       LEFT JOIN etudiant e
         ON e.id_specialite    = s.id_specialite
        AND e.id_etablissement = $2
       LEFT JOIN utilisateur u ON e.numero_utilisateur = u.numero_utilisateur
       WHERE em.numero_utilisateur = $1
         AND s.archived = false
         AND ($3::text IS NULL OR n.type_niveau = $3)
         ${monthsClause ? `AND (e.numero_utilisateur IS NULL OR EXTRACT(MONTH FROM u.date_creation) ${monthsClause})` : ""}
       GROUP BY s.id_specialite, s.nom_specialite, s.code_specialite, n.type_niveau
       ORDER BY s.nom_specialite`;

    const rows = await sequelize.query(sql, {
      bind: [numeroUtilisateur, idEtablissement, type_niveau || null],
      type: sequelize.QueryTypes.SELECT,
    });

    const data = rows.map((r) => {
      const nbAvecNotes = parseInt(r.nb_avec_notes) || 1;
      return {
        id_specialite: r.id_specialite,
        nom_specialite: r.nom_specialite,
        code_specialite: r.code_specialite,
        type_niveau: r.type_niveau,
        total_etudiants: parseInt(r.total_etudiants) || 0,
        moyenne: parseFloat(r.moyenne) || 0,
        taux_reussite: Math.round(
          (parseInt(r.nb_reussite) / nbAvecNotes) * 100,
        ),
        nb_a_risque: parseInt(r.nb_a_risque) || 0,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error("Erreur getStatsParMatiere:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// Maps periode param to SQL month condition
const periodeToMonths = (periode) => {
  if (periode === "s1") return "IN (9,10,11,12,1)";
  if (periode === "s2") return "IN (2,3,4,5,6)";
  return null; // no filter for 'annee' or empty
};

// GET /api/enseignant/dashboard/stats?id_specialite=&type_niveau=&periode=
exports.getDashboardStats = async (req, res) => {
  try {
    const numeroUtilisateur = req.user.numero_utilisateur;
    const idEtablissement = await getEtablissement(numeroUtilisateur);

    if (!idEtablissement) {
      return res
        .status(404)
        .json({ success: false, message: "Enseignant non trouvé" });
    }

    const { id_specialite, type_niveau, periode } = req.query;
    const monthsClause = periodeToMonths(periode);

    const sql = `
      SELECT
         COUNT(*)                                                    AS total_etudiants,
         ROUND(AVG(e.moyenne_generale)::numeric, 2)                 AS moyenne_classe,
         COUNT(CASE WHEN e.moyenne_generale >= 10 THEN 1 END)       AS nb_reussite,
         COUNT(CASE WHEN e.moyenne_generale <  10 THEN 1 END)       AS nb_a_risque,
         COUNT(CASE WHEN e.moyenne_generale IS NOT NULL THEN 1 END) AS nb_avec_notes
       FROM etudiant e
       JOIN utilisateur u ON e.numero_utilisateur = u.numero_utilisateur
       JOIN specialite  s ON e.id_specialite      = s.id_specialite
       JOIN niveau      n ON s.id_niveau           = n.id_niveau
       JOIN enseignant_matiere em
         ON em.id_specialite      = e.id_specialite
        AND em.numero_utilisateur = $1
       WHERE e.id_etablissement = $2
         AND ($3::integer IS NULL OR e.id_specialite = $3)
         AND ($4::text    IS NULL OR n.type_niveau   = $4)
         ${monthsClause ? `AND EXTRACT(MONTH FROM u.date_creation) ${monthsClause}` : ""}
    `;

    const stats = await sequelize.query(sql, {
      bind: [
        numeroUtilisateur,
        idEtablissement,
        id_specialite ? parseInt(id_specialite) : null,
        type_niveau || null,
      ],
      type: sequelize.QueryTypes.SELECT,
    });

    const s = stats[0];
    const totalAvecNotes = parseInt(s.nb_avec_notes) || 1;
    const tauxReussite = Math.round(
      (parseInt(s.nb_reussite) / totalAvecNotes) * 100,
    );

    // nb_specialites — distinct classes for this teacher
    const specRows = await sequelize.query(
      `SELECT COUNT(DISTINCT id_specialite) AS nb_specialites
       FROM enseignant_matiere WHERE numero_utilisateur = $1`,
      { bind: [numeroUtilisateur], type: sequelize.QueryTypes.SELECT }
    );

    // nb_matieres — distinct subjects for this teacher
    const matRows = await sequelize.query(
      `SELECT COUNT(DISTINCT m.id_matiere) AS nb_matieres
       FROM matiere m
       JOIN enseignant_matiere em ON em.id_specialite = m.id_specialite
       WHERE em.numero_utilisateur = $1`,
      { bind: [numeroUtilisateur], type: sequelize.QueryTypes.SELECT }
    );

    // nb_absences — total absences in teacher's classes (table may not exist yet)
    let nbAbsences = 0;
    try {
      await ensureAbsenceTable();
      const absRows = await sequelize.query(
        `SELECT COUNT(*) AS nb_absences
         FROM absence a
         JOIN enseignant_matiere em ON em.id_specialite = a.id_specialite
           AND em.numero_utilisateur = $1`,
        { bind: [numeroUtilisateur], type: sequelize.QueryTypes.SELECT }
      );
      nbAbsences = parseInt(absRows[0]?.nb_absences) || 0;
    } catch (_) {}

    res.json({
      success: true,
      data: {
        total_etudiants: parseInt(s.total_etudiants) || 0,
        moyenne_classe:  parseFloat(s.moyenne_classe) || 0,
        taux_reussite:   tauxReussite,
        nb_a_risque:     parseInt(s.nb_a_risque) || 0,
        nb_specialites:  parseInt(specRows[0]?.nb_specialites) || 0,
        nb_matieres:     parseInt(matRows[0]?.nb_matieres) || 0,
        nb_absences:     nbAbsences,
      },
    });
  } catch (error) {
    console.error("Erreur getDashboardStats enseignant:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};
// GET /api/enseignant/dashboard/universite
exports.getUniversite = async (req, res) => {
  try {
    const numeroUtilisateur = req.user.numero_utilisateur;
    const idEtablissement = await getEtablissement(numeroUtilisateur);
    if (!idEtablissement) {
      return res.status(404).json({ success: false, message: 'Enseignant non trouvé' });
    }

    // Get the rectorat from the teacher's establishment
    const [rectoratRow] = await sequelize.query(
      `SELECT r.id_rectorat, r.nom_rectorat, r.code_rectorat, r.type,
              r.email, r.telephone, r.adresse
       FROM etablissement e
       JOIN rectorat r ON e.id_rectorat = r.id_rectorat
       WHERE e.id_etablissement = $1`,
      { bind: [idEtablissement], type: sequelize.QueryTypes.SELECT }
    );
    if (!rectoratRow) {
      return res.status(404).json({ success: false, message: 'Université non trouvée' });
    }

    // Get all establishments under this rectorat with counts
    const etablissements = await sequelize.query(
      `SELECT e.id_etablissement, e.nom_etablissement, e.type, e.email, e.effectif_total,
              COUNT(DISTINCT en.numero_utilisateur) AS nb_enseignants,
              COUNT(DISTINCT et.numero_utilisateur) AS nb_etudiants
       FROM etablissement e
       LEFT JOIN enseignant en ON en.id_etablissement_principal = e.id_etablissement
       LEFT JOIN etudiant   et ON et.id_etablissement            = e.id_etablissement
       WHERE e.id_rectorat = $1
       GROUP BY e.id_etablissement
       ORDER BY e.nom_etablissement`,
      { bind: [rectoratRow.id_rectorat], type: sequelize.QueryTypes.SELECT }
    );

    res.json({
      success: true,
      data: {
        rectorat: rectoratRow,
        etablissements: etablissements.map(e => ({
          ...e,
          nb_enseignants: parseInt(e.nb_enseignants) || 0,
          nb_etudiants:   parseInt(e.nb_etudiants)   || 0,
        })),
        currentEtablissementId: idEtablissement,
      },
    });
  } catch (error) {
    console.error('Erreur getUniversite:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// GET /api/enseignant/dashboard/planning?annee=
exports.getPlanning = async (req, res) => {
  try {
    const numeroUtilisateur = req.user.numero_utilisateur;
    const annee = req.query.annee || '2024-2025';

    const rows = await sequelize.query(
      `SELECT
         e.id_examen,
         e.type_examen,
         e.date_examen,
         e.semestre,
         e.coefficient,
         m.nom_matiere,
         m.code_matiere,
         s.nom_specialite,
         s.code_specialite,
         n.type_niveau
       FROM examen e
       JOIN matiere            m  ON e.id_matiere    = m.id_matiere
       JOIN specialite         s  ON m.id_specialite = s.id_specialite
       JOIN niveau             n  ON s.id_niveau     = n.id_niveau
       JOIN enseignant_matiere em ON em.id_specialite = s.id_specialite
      WHERE em.numero_utilisateur = $1
        AND e.annee_universitaire  = $2
      ORDER BY e.id_examen DESC`,
      { bind: [numeroUtilisateur, annee], type: sequelize.QueryTypes.SELECT }
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Erreur getPlanning:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// POST /api/enseignant/dashboard/planning
exports.createSeance = async (req, res) => {
  try {
    const numeroUtilisateur = req.user.numero_utilisateur;
    const { id_matiere, type_examen, date_examen, semestre, coefficient, annee_universitaire } = req.body;

    if (!id_matiere || !type_examen) {
      return res.status(400).json({ success: false, message: 'Matière et type sont obligatoires' });
    }

    // Verify the matière belongs to one of the teacher's specialities
    const check = await sequelize.query(
      `SELECT m.id_matiere FROM matiere m
       JOIN enseignant_matiere em ON em.id_specialite = m.id_specialite
       WHERE m.id_matiere = $1 AND em.numero_utilisateur = $2`,
      { bind: [id_matiere, numeroUtilisateur], type: sequelize.QueryTypes.SELECT }
    );
    if (check.length === 0) {
      return res.status(403).json({ success: false, message: 'Matière non autorisée' });
    }

    const [result] = await sequelize.query(
      `INSERT INTO examen (id_matiere, type_examen, date_examen, semestre, coefficient, annee_universitaire)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_examen`,
      {
        bind: [
          id_matiere,
          type_examen,
          date_examen || null,
          semestre || null,
          coefficient || 1.0,
          annee_universitaire || '2024-2025',
        ],
        type: sequelize.QueryTypes.INSERT,
      }
    );

    res.status(201).json({ success: true, message: 'Séance créée avec succès', data: { id_examen: result[0]?.id_examen } });
  } catch (error) {
    console.error('Erreur createSeance:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// GET /api/enseignant/dashboard/etudiants-a-risque?id_specialite=&type_niveau=
exports.getEtudiantsARisque = async (req, res) => {
  try {
    const numeroUtilisateur = req.user.numero_utilisateur;
    const idEtablissement = await getEtablissement(numeroUtilisateur);

    if (!idEtablissement) {
      return res.status(404).json({ success: false, message: "Enseignant non trouvé" });
    }

    const { id_specialite, type_niveau } = req.query;

    const sql = `
      SELECT
        u.nom,
        u.prenom,
        e.moyenne_generale,
        s.nom_specialite,
        n.type_niveau,
        CASE
          WHEN e.moyenne_generale < 8 THEN 'critique'
          ELSE 'attention'
        END AS statut
      FROM etudiant e
      JOIN utilisateur u       ON e.numero_utilisateur = u.numero_utilisateur
      JOIN specialite  s       ON e.id_specialite      = s.id_specialite
      JOIN niveau      n       ON s.id_niveau           = n.id_niveau
      JOIN enseignant_matiere em
        ON em.id_specialite      = e.id_specialite
       AND em.numero_utilisateur = $1
      WHERE e.id_etablissement = $2
        AND e.moyenne_generale < 10
        AND ($3::integer IS NULL OR e.id_specialite = $3)
        AND ($4::text    IS NULL OR n.type_niveau   = $4)
      ORDER BY e.moyenne_generale ASC
    `;

    const rows = await sequelize.query(sql, {
      bind: [
        numeroUtilisateur,
        idEtablissement,
        id_specialite ? parseInt(id_specialite) : null,
        type_niveau || null,
      ],
      type: sequelize.QueryTypes.SELECT,
    });

    const data = rows.map((r) => ({
      nom: `${r.prenom} ${r.nom}`,
      moyenne: parseFloat(r.moyenne_generale) || 0,
      statut: r.statut,
      specialite: r.nom_specialite,
      niveau: r.type_niveau,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error("Erreur getEtudiantsARisque:", error);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// GET /api/enseignant/dashboard/export-excel?id_specialite=&type_niveau=&periode=
exports.exportStudentsToExcel = async (req, res) => {
  try {
    const numeroUtilisateur = req.user.numero_utilisateur;
    const idEtablissement = await getEtablissement(numeroUtilisateur);

    if (!idEtablissement) {
      return res
        .status(404)
        .json({ success: false, message: "Enseignant non trouvé" });
    }

    const { id_specialite, type_niveau, periode } = req.query;
    const monthsClause = periodeToMonths(periode);

    // Récupérer les données des étudiants
    const sql = `
      SELECT
         e.numero_utilisateur,
         u.nom,
         u.prenom,
         u.cin,
         u.email,
         s.nom_specialite,
         s.code_specialite,
         n.type_niveau,
         e.moyenne_generale,
         e.numero_etudiant,
         u.date_creation,
         CASE 
           WHEN e.moyenne_generale >= 16 THEN 'Excellent'
           WHEN e.moyenne_generale >= 14 THEN 'Très bien'
           WHEN e.moyenne_generale >= 12 THEN 'Bien'
           WHEN e.moyenne_generale >= 10 THEN 'Passable'
           WHEN e.moyenne_generale < 10 THEN 'À risque'
           ELSE 'Non évalué'
         END as statut
       FROM etudiant e
       JOIN utilisateur u ON e.numero_utilisateur = u.numero_utilisateur
       JOIN specialite  s ON e.id_specialite      = s.id_specialite
       JOIN niveau      n ON s.id_niveau           = n.id_niveau
       JOIN enseignant_matiere em
         ON em.id_specialite      = e.id_specialite
        AND em.numero_utilisateur = $1
       WHERE e.id_etablissement = $2
         AND ($3::integer IS NULL OR e.id_specialite = $3)
         AND ($4::text    IS NULL OR n.type_niveau   = $4)
         ${monthsClause ? `AND EXTRACT(MONTH FROM u.date_creation) ${monthsClause}` : ""}
       ORDER BY u.nom, u.prenom
    `;

    const students = await sequelize.query(sql, {
      bind: [
        numeroUtilisateur,
        idEtablissement,
        id_specialite ? parseInt(id_specialite) : null,
        type_niveau || null,
      ],
      type: sequelize.QueryTypes.SELECT,
    });

    // Préparer les données pour l'export
    const exportData = students.map((student, index) => ({
      "N°": index + 1,
      Nom: student.nom,
      Prénom: student.prenom,
      CIN: student.cin,
      Email: student.email,
      "Numéro Étudiant": student.numero_etudiant,
      Spécialité: student.nom_specialite,
      "Code Spécialité": student.code_specialite,
      Niveau: student.type_niveau,
      "Moyenne Générale": student.moyenne_generale || "N/A",
      Statut: student.statut,
      "Date d'inscription": student.date_creation
        ? new Date(student.date_creation).toLocaleDateString("fr-FR")
        : "N/A",
    }));

    // Créer le workbook
    const wb = XLSX.utils.book_new();

    // Créer la feuille principale avec les données des étudiants
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Définir la largeur des colonnes
    const colWidths = [
      { wch: 5 }, // N°
      { wch: 15 }, // Nom
      { wch: 15 }, // Prénom
      { wch: 12 }, // CIN
      { wch: 25 }, // Email
      { wch: 15 }, // Numéro Étudiant
      { wch: 25 }, // Spécialité
      { wch: 15 }, // Code Spécialité
      { wch: 10 }, // Niveau
      { wch: 12 }, // Moyenne
      { wch: 12 }, // Statut
      { wch: 15 }, // Date inscription
    ];
    ws["!cols"] = colWidths;

    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(wb, ws, "Liste des Étudiants");

    // Créer une feuille de statistiques
    const stats = {
      total: students.length,
      excellent: students.filter((s) => s.statut === "Excellent").length,
      tresBien: students.filter((s) => s.statut === "Très bien").length,
      bien: students.filter((s) => s.statut === "Bien").length,
      passable: students.filter((s) => s.statut === "Passable").length,
      aRisque: students.filter((s) => s.statut === "À risque").length,
      nonEvalue: students.filter((s) => s.statut === "Non évalué").length,
      moyenneGenerale:
        students.length > 0
          ? (
              students
                .filter((s) => s.moyenne_generale)
                .reduce((acc, s) => acc + parseFloat(s.moyenne_generale), 0) /
              students.filter((s) => s.moyenne_generale).length
            ).toFixed(2)
          : "N/A",
    };

    const statsData = [
      { Statistique: "Total étudiants", Valeur: stats.total },
      {
        Statistique: "Moyenne générale",
        Valeur: `${stats.moyenneGenerale}/20`,
      },
      { Statistique: "Étudiants excellents", Valeur: stats.excellent },
      { Statistique: "Étudiants très bien", Valeur: stats.tresBien },
      { Statistique: "Étudiants bien", Valeur: stats.bien },
      { Statistique: "Étudiants passables", Valeur: stats.passable },
      { Statistique: "Étudiants à risque", Valeur: stats.aRisque },
      { Statistique: "Étudiants non évalués", Valeur: stats.nonEvalue },
      {
        Statistique: "Date d'export",
        Valeur: new Date().toLocaleString("fr-FR"),
      },
    ];

    const wsStats = XLSX.utils.json_to_sheet(statsData);
    wsStats["!cols"] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsStats, "Statistiques");

    // Générer le fichier Excel en buffer
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Générer le nom du fichier avec la date
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const fileName = `etudiants_${dateStr}.xlsx`;

    // Définir les headers pour le téléchargement
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    // Envoyer le fichier
    res.send(buffer);
  } catch (error) {
    console.error("Erreur exportStudentsToExcel:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Erreur lors de l'export Excel",
        error: error.message,
      });
  }
};

// GET /api/enseignant/students
exports.getStudents = async (req, res) => {
  try {
    const numeroUtilisateur = req.user.numero_utilisateur;
    const idEtablissement = await getEtablissement(numeroUtilisateur);
    if (!idEtablissement) {
      return res.status(404).json({ success: false, message: "Enseignant non trouvé" });
    }

    const rows = await sequelize.query(
      `SELECT
         e.numero_utilisateur AS id_etudiant,
         e.numero_etudiant,
         e.cin,
         e.moyenne_generale,
         u.nom,
         u.prenom,
         u.email,
         u.telephone,
         s.id_specialite,
         s.nom_specialite,
         s.code_specialite,
         n.type_niveau
       FROM etudiant e
       JOIN utilisateur u       ON e.numero_utilisateur = u.numero_utilisateur
       JOIN specialite  s       ON e.id_specialite      = s.id_specialite
       JOIN niveau      n       ON s.id_niveau           = n.id_niveau
       JOIN enseignant_matiere em
         ON em.id_specialite      = e.id_specialite
        AND em.numero_utilisateur = $1
       WHERE e.id_etablissement = $2
         AND s.archived = false
       ORDER BY u.nom, u.prenom`,
      { bind: [numeroUtilisateur, idEtablissement], type: sequelize.QueryTypes.SELECT }
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erreur getStudents:", error);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// GET /api/enseignant/dashboard/charts
exports.getChartsData = async (req, res) => {
  try {
    const numeroUtilisateur = req.user.numero_utilisateur;
    const idEtablissement = await getEtablissement(numeroUtilisateur);
    if (!idEtablissement) {
      return res.status(404).json({ success: false, message: "Enseignant non trouvé" });
    }

    const { id_specialite } = req.query;
    const spFilter = id_specialite ? parseInt(id_specialite) : null;

    // 1. Distribution des notes (buckets)
    const distRows = await sequelize.query(
      `SELECT
         CASE
           WHEN e.moyenne_generale < 8  THEN '<8'
           WHEN e.moyenne_generale < 10 THEN '8-10'
           WHEN e.moyenne_generale < 12 THEN '10-12'
           WHEN e.moyenne_generale < 14 THEN '12-14'
           WHEN e.moyenne_generale < 16 THEN '14-16'
           WHEN e.moyenne_generale < 18 THEN '16-18'
           ELSE '>18'
         END AS tranche,
         CASE
           WHEN e.moyenne_generale < 8  THEN 1
           WHEN e.moyenne_generale < 10 THEN 2
           WHEN e.moyenne_generale < 12 THEN 3
           WHEN e.moyenne_generale < 14 THEN 4
           WHEN e.moyenne_generale < 16 THEN 5
           WHEN e.moyenne_generale < 18 THEN 6
           ELSE 7
         END AS sort_order,
         COUNT(*) AS nombre
       FROM etudiant e
       JOIN enseignant_matiere em ON em.id_specialite = e.id_specialite AND em.numero_utilisateur = $1
       JOIN specialite s ON s.id_specialite = e.id_specialite AND s.archived = false
       WHERE e.id_etablissement = $2
         AND e.moyenne_generale IS NOT NULL
         AND ($3::integer IS NULL OR e.id_specialite = $3)
       GROUP BY tranche, sort_order
       ORDER BY sort_order`,
      { bind: [numeroUtilisateur, idEtablissement, spFilter], type: sequelize.QueryTypes.SELECT }
    );

    // 2. Répartition des statuts
    const repartRows = await sequelize.query(
      `SELECT
         CASE
           WHEN e.moyenne_generale < 8  THEN 'En échec'
           WHEN e.moyenne_generale < 10 THEN 'À risque'
           WHEN e.moyenne_generale < 12 THEN 'Passable'
           WHEN e.moyenne_generale < 15 THEN 'Bien'
           ELSE 'Excellent'
         END AS name,
         CASE
           WHEN e.moyenne_generale < 8  THEN 1
           WHEN e.moyenne_generale < 10 THEN 2
           WHEN e.moyenne_generale < 12 THEN 3
           WHEN e.moyenne_generale < 15 THEN 4
           ELSE 5
         END AS sort_order,
         COUNT(*) AS value
       FROM etudiant e
       JOIN enseignant_matiere em ON em.id_specialite = e.id_specialite AND em.numero_utilisateur = $1
       JOIN specialite s ON s.id_specialite = e.id_specialite AND s.archived = false
       WHERE e.id_etablissement = $2
         AND e.moyenne_generale IS NOT NULL
         AND ($3::integer IS NULL OR e.id_specialite = $3)
       GROUP BY name, sort_order
       ORDER BY sort_order`,
      { bind: [numeroUtilisateur, idEtablissement, spFilter], type: sequelize.QueryTypes.SELECT }
    );

    // 3. Évolution mensuelle (basée sur date_creation des étudiants)
    const evolRows = await sequelize.query(
      `SELECT
         TO_CHAR(u.date_creation, 'Mon') AS periode,
         EXTRACT(YEAR  FROM u.date_creation) * 100 +
         EXTRACT(MONTH FROM u.date_creation) AS sort_key,
         ROUND(AVG(e.moyenne_generale)::numeric, 2) AS moyenne,
         COUNT(*) AS nb_etudiants
       FROM etudiant e
       JOIN utilisateur u ON e.numero_utilisateur = u.numero_utilisateur
       JOIN enseignant_matiere em ON em.id_specialite = e.id_specialite AND em.numero_utilisateur = $1
       JOIN specialite s ON s.id_specialite = e.id_specialite AND s.archived = false
       WHERE e.id_etablissement = $2
         AND e.moyenne_generale IS NOT NULL
         AND ($3::integer IS NULL OR e.id_specialite = $3)
       GROUP BY TO_CHAR(u.date_creation, 'Mon'),
                EXTRACT(YEAR FROM u.date_creation) * 100 + EXTRACT(MONTH FROM u.date_creation)
       ORDER BY sort_key`,
      { bind: [numeroUtilisateur, idEtablissement, spFilter], type: sequelize.QueryTypes.SELECT }
    );

    // 4. Compétences par matière (mastery = taux_réussite des étudiants de la spécialité)
    const compRows = await sequelize.query(
      `SELECT
         m.nom_matiere AS competence,
         m.coefficient,
         ROUND(
           COUNT(CASE WHEN e.moyenne_generale >= 10 THEN 1 END)::numeric
           / NULLIF(COUNT(e.numero_utilisateur), 0) * 100
         , 0) AS mastery
       FROM matiere m
       JOIN specialite s ON m.id_specialite = s.id_specialite AND s.archived = false
       JOIN enseignant_matiere em ON em.id_specialite = s.id_specialite AND em.numero_utilisateur = $1
       LEFT JOIN etudiant e ON e.id_specialite = s.id_specialite AND e.id_etablissement = $2
       WHERE ($3::integer IS NULL OR s.id_specialite = $3)
       GROUP BY m.id_matiere, m.nom_matiere, m.coefficient
       ORDER BY m.id_matiere`,
      { bind: [numeroUtilisateur, idEtablissement, spFilter], type: sequelize.QueryTypes.SELECT }
    );

    // 5. Devoirs/examens planifiés
    const [examRow] = await sequelize.query(
      `SELECT COUNT(*) AS total_examens
       FROM examen ex
       JOIN matiere m ON ex.id_matiere = m.id_matiere
       JOIN enseignant_matiere em ON em.id_specialite = m.id_specialite AND em.numero_utilisateur = $1`,
      { bind: [numeroUtilisateur], type: sequelize.QueryTypes.SELECT }
    );
    const [matRow] = await sequelize.query(
      `SELECT COUNT(*) AS total_matieres
       FROM matiere m
       JOIN enseignant_matiere em ON em.id_specialite = m.id_specialite AND em.numero_utilisateur = $1`,
      { bind: [numeroUtilisateur], type: sequelize.QueryTypes.SELECT }
    );

    // Derive presences from average score (proxy: high grades → high attendance)
    const evolutionData = evolRows.map(r => {
      const moy = parseFloat(r.moyenne) || 0;
      return {
        periode: r.periode,
        moyenne: moy,
        presences: Math.min(98, Math.max(50, Math.round(moy * 4 + 30))),
      };
    });

    res.json({
      success: true,
      data: {
        distributionNotes: distRows.map(r => ({ tranche: r.tranche, nombre: parseInt(r.nombre) })),
        repartitionStatuts: repartRows.map(r => ({ name: r.name, value: parseInt(r.value) })),
        evolutionData,
        competencesData: compRows.map(r => ({
          competence: r.competence.length > 22 ? r.competence.substring(0, 20) + '…' : r.competence,
          A: parseFloat(r.mastery) || 0,
        })),
        devoir_notes: parseInt(examRow?.total_examens) || 0,
        total_matieres: parseInt(matRow?.total_matieres) || 0,
      },
    });
  } catch (error) {
    console.error("Erreur getChartsData:", error);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// GET /api/enseignant/dashboard/notes?id_specialite=X
exports.getNotes = async (req, res) => {
  try {
    const numeroUtilisateur = req.user.numero_utilisateur;
    const idEtablissement = await getEtablissement(numeroUtilisateur);
    if (!idEtablissement) return res.status(404).json({ success: false, message: "Enseignant non trouvé" });

    const { id_specialite } = req.query;
    if (!id_specialite) return res.status(400).json({ success: false, message: "id_specialite requis" });
    const spId = parseInt(id_specialite);

    // Verify teacher is assigned to this specialite
    const check = await sequelize.query(
      `SELECT 1 FROM enseignant_matiere WHERE numero_utilisateur = $1 AND id_specialite = $2`,
      { bind: [numeroUtilisateur, spId], type: sequelize.QueryTypes.SELECT }
    );
    if (check.length === 0) return res.status(403).json({ success: false, message: "Accès non autorisé" });

    // Examens for this specialite
    const examens = await sequelize.query(
      `SELECT e.id_examen, e.type_examen, e.date_examen, e.coefficient, e.semestre,
              m.nom_matiere, m.code_matiere
       FROM examen e
       JOIN matiere m ON e.id_matiere = m.id_matiere
       WHERE m.id_specialite = $1
       ORDER BY e.date_examen NULLS LAST, e.id_examen`,
      { bind: [spId], type: sequelize.QueryTypes.SELECT }
    );

    // Students in this specialite at this etablissement
    const students = await sequelize.query(
      `SELECT et.numero_utilisateur, et.numero_etudiant, et.moyenne_generale,
              u.nom, u.prenom
       FROM etudiant et
       JOIN utilisateur u ON et.numero_utilisateur = u.numero_utilisateur
       WHERE et.id_specialite = $1 AND et.id_etablissement = $2
       ORDER BY u.nom, u.prenom`,
      { bind: [spId, idEtablissement], type: sequelize.QueryTypes.SELECT }
    );

    const examIds = examens.map(e => e.id_examen);
    const studentIds = students.map(s => s.numero_utilisateur);

    let notesMap = {};
    if (examIds.length > 0 && studentIds.length > 0) {
      const noteRows = await sequelize.query(
        `SELECT numero_utilisateur, id_examen, valeur
         FROM note
         WHERE numero_utilisateur = ANY($1::text[])
           AND id_examen = ANY($2::int[])`,
        { bind: [studentIds, examIds], type: sequelize.QueryTypes.SELECT }
      );
      for (const n of noteRows) {
        if (!notesMap[n.numero_utilisateur]) notesMap[n.numero_utilisateur] = {};
        notesMap[n.numero_utilisateur][n.id_examen] = parseFloat(n.valeur);
      }
    }

    const studentsWithNotes = students.map((s, idx) => ({
      numero_utilisateur: s.numero_utilisateur,
      numero_etudiant: s.numero_etudiant,
      nom: s.nom,
      prenom: s.prenom,
      moyenne_generale: parseFloat(s.moyenne_generale) || null,
      notes: notesMap[s.numero_utilisateur] || {},
    }));

    res.json({ success: true, data: { examens, students: studentsWithNotes } });
  } catch (error) {
    console.error("Erreur getNotes:", error);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// PUT /api/enseignant/dashboard/notes
exports.saveNote = async (req, res) => {
  try {
    const { numero_utilisateur, id_examen, valeur } = req.body;
    if (!numero_utilisateur || !id_examen) {
      return res.status(400).json({ success: false, message: "Données manquantes" });
    }

    if (valeur === null || valeur === '' || valeur === undefined) {
      await sequelize.query(
        `DELETE FROM note WHERE numero_utilisateur = $1 AND id_examen = $2`,
        { bind: [numero_utilisateur, parseInt(id_examen)], type: sequelize.QueryTypes.DELETE }
      );
    } else {
      const val = parseFloat(valeur);
      if (isNaN(val) || val < 0 || val > 20) {
        return res.status(400).json({ success: false, message: "Note invalide (0–20)" });
      }
      await sequelize.query(
        `INSERT INTO note (numero_utilisateur, id_examen, valeur, date_saisie)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (numero_utilisateur, id_examen)
         DO UPDATE SET valeur = $3, date_saisie = NOW()`,
        { bind: [numero_utilisateur, parseInt(id_examen), val], type: sequelize.QueryTypes.INSERT }
      );
    }

    res.json({ success: true, message: "Note enregistrée" });
  } catch (error) {
    console.error("Erreur saveNote:", error);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// ── ABSENCES ──────────────────────────────────────────────────────────────

const ensureAbsenceTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS absence (
      id_absence    SERIAL PRIMARY KEY,
      numero_utilisateur VARCHAR REFERENCES utilisateur(numero_utilisateur) ON DELETE CASCADE,
      id_specialite INTEGER REFERENCES specialite(id_specialite) ON DELETE CASCADE,
      enseignant_id VARCHAR REFERENCES utilisateur(numero_utilisateur) ON DELETE SET NULL,
      date_absence  DATE NOT NULL,
      type_seance   VARCHAR(20) DEFAULT 'CM',
      semestre      INTEGER,
      justifiee     BOOLEAN DEFAULT false,
      created_at    TIMESTAMP DEFAULT NOW(),
      UNIQUE(numero_utilisateur, id_specialite, date_absence, type_seance)
    )
  `);
};

// GET /api/enseignant/dashboard/absences?id_specialite=X&date=Y&type_seance=Z
exports.getAbsences = async (req, res) => {
  try {
    const numeroUtilisateur = req.user.numero_utilisateur;
    const { id_specialite, date, type_seance } = req.query;
    if (!id_specialite || !date) {
      return res.status(400).json({ success: false, message: 'id_specialite et date requis' });
    }
    await ensureAbsenceTable();
    const idEtablissement = await getEtablissement(numeroUtilisateur);

    const etudiants = await sequelize.query(
      `SELECT e.numero_utilisateur AS id_etudiant, e.numero_etudiant,
              u.nom, u.prenom,
              CASE WHEN a.id_absence IS NOT NULL THEN true ELSE false END AS absent,
              a.justifiee
       FROM etudiant e
       JOIN utilisateur u ON e.numero_utilisateur = u.numero_utilisateur
       JOIN enseignant_matiere em ON em.id_specialite = e.id_specialite AND em.numero_utilisateur = $1
       LEFT JOIN absence a
         ON a.numero_utilisateur = e.numero_utilisateur
        AND a.id_specialite = $2
        AND a.date_absence = $3
        AND ($4::varchar IS NULL OR a.type_seance = $4)
       WHERE e.id_etablissement = $5 AND e.id_specialite = $2
       ORDER BY u.nom, u.prenom`,
      {
        bind: [numeroUtilisateur, parseInt(id_specialite), date, type_seance || null, idEtablissement],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json({ success: true, data: etudiants });
  } catch (error) {
    console.error('Erreur getAbsences:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// GET /api/enseignant/dashboard/absences/historique?id_specialite=X
exports.getHistoriqueAbsences = async (req, res) => {
  try {
    const numeroUtilisateur = req.user.numero_utilisateur;
    const { id_specialite } = req.query;
    if (!id_specialite) {
      return res.status(400).json({ success: false, message: 'id_specialite requis' });
    }
    await ensureAbsenceTable();
    const idEtablissement = await getEtablissement(numeroUtilisateur);

    const rows = await sequelize.query(
      `SELECT
         e.numero_utilisateur AS id_etudiant,
         e.numero_etudiant,
         u.nom, u.prenom,
         a.date_absence,
         a.type_seance,
         a.justifiee,
         a.id_absence,
         (a.enseignant_id IS NULL) AS declaree_par_etudiant
       FROM etudiant e
       JOIN utilisateur u ON e.numero_utilisateur = u.numero_utilisateur
       JOIN enseignant_matiere em ON em.id_specialite = e.id_specialite AND em.numero_utilisateur = $1
       LEFT JOIN absence a ON a.numero_utilisateur = e.numero_utilisateur AND a.id_specialite = $2
       WHERE e.id_etablissement = $3 AND e.id_specialite = $2
       ORDER BY u.nom, u.prenom, a.date_absence DESC`,
      { bind: [numeroUtilisateur, parseInt(id_specialite), idEtablissement], type: sequelize.QueryTypes.SELECT }
    );

    // Group by student
    const studentMap = {};
    for (const r of rows) {
      if (!studentMap[r.id_etudiant]) {
        studentMap[r.id_etudiant] = {
          id_etudiant: r.id_etudiant, numero_etudiant: r.numero_etudiant,
          nom: r.nom, prenom: r.prenom, absences: [],
        };
      }
      if (r.id_absence) {
        studentMap[r.id_etudiant].absences.push({
          id_absence: r.id_absence,
          date_absence: r.date_absence,
          type_seance: r.type_seance,
          justifiee: r.justifiee,
          declaree_par_etudiant: r.declaree_par_etudiant,
        });
      }
    }

    const data = Object.values(studentMap).map(s => ({
      ...s,
      total_absences: s.absences.length,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Erreur getHistoriqueAbsences:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// DELETE /api/enseignant/dashboard/absences/:id
exports.deleteAbsence = async (req, res) => {
  try {
    await ensureAbsenceTable();
    const { id } = req.params;
    await sequelize.query(
      `DELETE FROM absence WHERE id_absence = $1`,
      { bind: [parseInt(id)], type: sequelize.QueryTypes.DELETE }
    );
    res.json({ success: true, message: 'Absence supprimée' });
  } catch (error) {
    console.error('Erreur deleteAbsence:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// PATCH /api/enseignant/dashboard/absences/:id/justifier
exports.justifierAbsence = async (req, res) => {
  try {
    await ensureAbsenceTable();
    const { id } = req.params;
    const { justifiee } = req.body;
    await sequelize.query(
      `UPDATE absence SET justifiee = $1 WHERE id_absence = $2`,
      { bind: [justifiee !== false, parseInt(id)], type: sequelize.QueryTypes.UPDATE }
    );
    res.json({ success: true, message: justifiee !== false ? 'Absence justifiée' : 'Justification annulée' });
  } catch (error) {
    console.error('Erreur justifierAbsence:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// POST /api/enseignant/dashboard/absences
exports.saveAbsences = async (req, res) => {
  try {
    const numeroUtilisateur = req.user.numero_utilisateur;
    const { id_specialite, date, type_seance, semestre, absents } = req.body;
    if (!id_specialite || !date || !Array.isArray(absents)) {
      return res.status(400).json({ success: false, message: 'Données manquantes' });
    }
    await ensureAbsenceTable();

    // Remove existing absences for this session
    await sequelize.query(
      `DELETE FROM absence WHERE id_specialite = $1 AND date_absence = $2 AND type_seance = $3 AND enseignant_id = $4`,
      { bind: [parseInt(id_specialite), date, type_seance || 'CM', numeroUtilisateur], type: sequelize.QueryTypes.DELETE }
    );

    // Insert new absences
    for (const idEtudiant of absents) {
      await sequelize.query(
        `INSERT INTO absence (numero_utilisateur, id_specialite, enseignant_id, date_absence, type_seance, semestre)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (numero_utilisateur, id_specialite, date_absence, type_seance) DO NOTHING`,
        { bind: [idEtudiant, parseInt(id_specialite), numeroUtilisateur, date, type_seance || 'CM', semestre || null], type: sequelize.QueryTypes.INSERT }
      );
    }

    res.json({ success: true, message: `${absents.length} absence(s) enregistrée(s)` });
  } catch (error) {
    console.error('Erreur saveAbsences:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// POST /api/enseignant/dashboard/absences/marquer  (toggle single student)
exports.marquerAbsenceEtudiant = async (req, res) => {
  try {
    const enseignantId = req.user.numero_utilisateur;
    const { id_etudiant, id_specialite, date, type_seance, semestre, justifiee } = req.body;
    if (!id_etudiant || !id_specialite || !date) {
      return res.status(400).json({ success: false, message: 'id_etudiant, id_specialite et date requis' });
    }
    await ensureAbsenceTable();

    const existing = await sequelize.query(
      `SELECT id_absence FROM absence WHERE numero_utilisateur = $1 AND id_specialite = $2 AND date_absence = $3 AND type_seance = $4`,
      { bind: [id_etudiant, parseInt(id_specialite), date, type_seance || 'CM'], type: sequelize.QueryTypes.SELECT }
    );

    if (existing.length > 0) {
      await sequelize.query(
        `DELETE FROM absence WHERE id_absence = $1`,
        { bind: [existing[0].id_absence], type: sequelize.QueryTypes.DELETE }
      );
      return res.json({ success: true, action: 'removed', message: 'Absence supprimée' });
    }

    await sequelize.query(
      `INSERT INTO absence (numero_utilisateur, id_specialite, enseignant_id, date_absence, type_seance, semestre, justifiee)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (numero_utilisateur, id_specialite, date_absence, type_seance) DO NOTHING`,
      { bind: [id_etudiant, parseInt(id_specialite), enseignantId, date, type_seance || 'CM', semestre || null, justifiee === true || justifiee === 'true'], type: sequelize.QueryTypes.INSERT }
    );
    res.json({ success: true, action: 'added', message: 'Absence enregistrée' });
  } catch (error) {
    console.error('Erreur marquerAbsenceEtudiant:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// ── NOTES ─────────────────────────────────────────────────────────────────

const ensureNotesTables = async () => {
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
};

// GET /api/enseignant/notes/evaluations?id_matiere=
exports.getEvaluations = async (req, res) => {
  try {
    const { id_matiere } = req.query;
    if (!id_matiere) return res.status(400).json({ success: false, message: 'id_matiere requis' });
    await ensureNotesTables();
    const rows = await sequelize.query(
      `SELECT id_evaluation AS id, nom, type, date, coefficient AS coef, date_creation
       FROM evaluation WHERE id_matiere = $1 ORDER BY date_creation ASC`,
      { bind: [parseInt(id_matiere)], type: sequelize.QueryTypes.SELECT }
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Erreur getEvaluations:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// GET /api/enseignant/notes/etudiants?id_matiere=
exports.getEtudiantsWithNotes = async (req, res) => {
  try {
    const { id_matiere } = req.query;
    if (!id_matiere) return res.status(400).json({ success: false, message: 'id_matiere requis' });
    await ensureNotesTables();

    const matiereRows = await sequelize.query(
      `SELECT id_specialite FROM matiere WHERE id_matiere = $1`,
      { bind: [parseInt(id_matiere)], type: sequelize.QueryTypes.SELECT }
    );
    if (!matiereRows.length) return res.json({ success: true, data: [] });
    const idSpecialite = matiereRows[0].id_specialite;

    const students = await sequelize.query(
      `SELECT e.numero_utilisateur, u.nom, u.prenom, e.numero_etudiant AS matricule
       FROM etudiant e
       JOIN utilisateur u ON e.numero_utilisateur = u.numero_utilisateur
       WHERE e.id_specialite = $1
       ORDER BY u.nom, u.prenom`,
      { bind: [idSpecialite], type: sequelize.QueryTypes.SELECT }
    );
    if (!students.length) return res.json({ success: true, data: [] });

    const [notesRows, evalCoefs] = await Promise.all([
      sequelize.query(
        `SELECT n.id_evaluation, n.numero_utilisateur, n.note::float AS note
         FROM note_etudiant n
         JOIN evaluation ev ON n.id_evaluation = ev.id_evaluation
         JOIN etudiant   e  ON e.numero_utilisateur = n.numero_utilisateur
         WHERE ev.id_matiere = $1 AND e.id_specialite = $2`,
        { bind: [parseInt(id_matiere), idSpecialite], type: sequelize.QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT id_evaluation, coefficient::float AS coefficient
         FROM evaluation WHERE id_matiere = $1`,
        { bind: [parseInt(id_matiere)], type: sequelize.QueryTypes.SELECT }
      ),
    ]);

    const notesMap = {};
    for (const n of notesRows) {
      if (!notesMap[n.numero_utilisateur]) notesMap[n.numero_utilisateur] = {};
      notesMap[n.numero_utilisateur][n.id_evaluation] = n.note;
    }

    const studentsWithData = students.map(s => {
      const sNotes = notesMap[s.numero_utilisateur] || {};
      let wSum = 0, wTotal = 0;
      for (const ev of evalCoefs) {
        const note = sNotes[ev.id_evaluation];
        if (note !== undefined && note !== null) {
          wSum += note * (ev.coefficient || 1);
          wTotal += (ev.coefficient || 1);
        }
      }
      const moyenne = wTotal > 0 ? Math.round((wSum / wTotal) * 100) / 100 : null;
      const statut = moyenne === null ? 'absent'
        : moyenne >= 16 ? 'excellent'
        : moyenne >= 12 ? 'bien'
        : moyenne >= 10 ? 'passable'
        : 'risque';
      return { id: s.numero_utilisateur, nom: s.nom, prenom: s.prenom, matricule: s.matricule, notes: sNotes, moyenne, rang: 0, statut };
    });

    const ranked = [...studentsWithData].filter(s => s.moyenne !== null).sort((a, b) => b.moyenne - a.moyenne);
    ranked.forEach((s, i) => { const f = studentsWithData.find(x => x.id === s.id); if (f) f.rang = i + 1; });
    let tail = ranked.length + 1;
    studentsWithData.filter(s => s.moyenne === null).forEach(s => { s.rang = tail++; });

    res.json({ success: true, data: studentsWithData });
  } catch (error) {
    console.error('Erreur getEtudiantsWithNotes:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// POST /api/enseignant/notes/evaluation
exports.createEvaluation = async (req, res) => {
  try {
    const { id_matiere, nom, type, date, coefficient } = req.body;
    if (!id_matiere || !nom) return res.status(400).json({ success: false, message: 'id_matiere et nom requis' });
    await ensureNotesTables();
    const rows = await sequelize.query(
      `INSERT INTO evaluation (id_matiere, nom, type, date, coefficient)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_evaluation AS id, nom, type, date, coefficient AS coef, date_creation`,
      { bind: [parseInt(id_matiere), nom.trim(), type || 'Devoir Surveillé', date || null, parseFloat(coefficient) || 1],
        type: sequelize.QueryTypes.SELECT }
    );
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Erreur createEvaluation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// POST /api/enseignant/notes/save
exports.saveNotes = async (req, res) => {
  try {
    const { notes } = req.body;
    if (!Array.isArray(notes)) return res.status(400).json({ success: false, message: 'notes requis' });
    await ensureNotesTables();
    for (const n of notes) {
      const { id_etudiant, id_evaluation, note } = n;
      const noteVal = parseFloat(note);
      if (note === null || note === undefined || isNaN(noteVal)) {
        await sequelize.query(
          `DELETE FROM note_etudiant WHERE id_evaluation = $1 AND numero_utilisateur = $2`,
          { bind: [parseInt(id_evaluation), String(id_etudiant)], type: sequelize.QueryTypes.DELETE }
        );
      } else {
        await sequelize.query(
          `INSERT INTO note_etudiant (id_evaluation, numero_utilisateur, note)
           VALUES ($1, $2, $3)
           ON CONFLICT (id_evaluation, numero_utilisateur)
           DO UPDATE SET note = EXCLUDED.note, date_saisie = NOW()`,
          { bind: [parseInt(id_evaluation), String(id_etudiant), noteVal], type: sequelize.QueryTypes.INSERT }
        );
      }
    }
    res.json({ success: true, message: 'Notes enregistrées' });
  } catch (error) {
    console.error('Erreur saveNotes:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};
