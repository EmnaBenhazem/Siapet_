const { sequelize } = require("../models");
const axios = require("axios");
const ML_API = process.env.ML_API_URL || "http://localhost:5001";

// Récupérer tous les départements de l'établissement du directeur
exports.getDirecteurDepartements = async (req, res) => {
  try {
    const directeurId = req.user.numero_utilisateur;
    const { search, page = 1, limit = 12 } = req.query;

    console.log("=== DEBUT getDirecteurDepartements ===");
    console.log("Directeur ID:", directeurId);
    console.log("Filtres:", { search, page, limit });

    // Récupérer l'établissement du directeur
    const directeurInfo = await sequelize.query(
      `SELECT id_etablissement FROM directeur_etablissement WHERE numero_utilisateur = $1`,
      {
        bind: [directeurId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (directeurInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Établissement non trouvé pour ce directeur",
      });
    }

    const idEtablissement = directeurInfo[0].id_etablissement;
    console.log("ID Établissement:", idEtablissement);

    // Construction de la requête avec filtres
    let whereConditions = ["d.id_etablissement = $1"];
    let params = [idEtablissement];
    let paramIndex = 2;

    if (search && search.trim() !== "") {
      whereConditions.push(
        `(LOWER(d.nom_departement) LIKE LOWER($${paramIndex}) OR LOWER(d.code_departement) LIKE LOWER($${paramIndex}))`
      );
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(" AND ");

    // Compter le total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM departement d
      WHERE ${whereClause}
    `;

    const countResult = await sequelize.query(countQuery, {
      bind: params,
      type: sequelize.QueryTypes.SELECT,
    });

    const total = parseInt(countResult[0].total);
    const offset = (page - 1) * limit;

    // Récupérer les départements avec leurs statistiques
    const query = `
      SELECT 
        d.id_departement,
        d.nom_departement,
        d.code_departement,
        d.description,
        d.date_creation,
        COUNT(DISTINCT n.id_niveau) as nombre_niveaux,
        COUNT(DISTINCT s.id_specialite) as nombre_specialites,
        COUNT(DISTINCT et.numero_utilisateur) as nombre_etudiants,
        COUNT(DISTINCT ens.numero_utilisateur) as nombre_enseignants
      FROM departement d
      LEFT JOIN niveau n ON d.id_departement = n.id_departement
      LEFT JOIN specialite s ON n.id_niveau = s.id_niveau
      LEFT JOIN etudiant et ON s.id_specialite = et.id_specialite
      LEFT JOIN enseignant ens ON d.id_etablissement = ens.id_etablissement_principal
      WHERE ${whereClause}
      GROUP BY d.id_departement, d.nom_departement, d.code_departement, d.description, d.date_creation
      ORDER BY d.nom_departement
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(parseInt(limit), offset);

    const departements = await sequelize.query(query, {
      bind: params,
      type: sequelize.QueryTypes.SELECT,
    });

    console.log(`✅ Trouvé ${departements.length} départements sur ${total} total`);

    res.json({
      success: true,
      departements,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des départements",
      error: error.message,
    });
  }
};

// Récupérer les détails d'un département
exports.getDepartementDetails = async (req, res) => {
  try {
    const directeurId = req.user.numero_utilisateur;
    const { id } = req.params;

    // Vérifier que le département appartient à l'établissement du directeur
    const directeurInfo = await sequelize.query(
      `SELECT id_etablissement FROM directeur_etablissement WHERE numero_utilisateur = $1`,
      {
        bind: [directeurId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (directeurInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Établissement non trouvé",
      });
    }

    const idEtablissement = directeurInfo[0].id_etablissement;

    // Récupérer les détails du département
    const departement = await sequelize.query(
      `
      SELECT 
        d.*,
        e.nom_etablissement,
        COUNT(DISTINCT n.id_niveau) as nombre_niveaux,
        COUNT(DISTINCT s.id_specialite) as nombre_specialites,
        COUNT(DISTINCT et.numero_utilisateur) as nombre_etudiants,
        COUNT(DISTINCT ens.numero_utilisateur) as nombre_enseignants
      FROM departement d
      LEFT JOIN etablissement e ON d.id_etablissement = e.id_etablissement
      LEFT JOIN niveau n ON d.id_departement = n.id_departement
      LEFT JOIN specialite s ON n.id_niveau = s.id_niveau
      LEFT JOIN etudiant et ON s.id_specialite = et.id_specialite
      LEFT JOIN enseignant ens ON d.id_etablissement = ens.id_etablissement_principal
      WHERE d.id_departement = $1 AND d.id_etablissement = $2
      GROUP BY d.id_departement, e.nom_etablissement
    `,
      {
        bind: [id, idEtablissement],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (departement.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Département non trouvé",
      });
    }

    // Récupérer les niveaux du département
    const niveaux = await sequelize.query(
      `
      SELECT 
        n.*,
        COUNT(DISTINCT s.id_specialite) as nombre_specialites,
        COUNT(DISTINCT et.numero_utilisateur) as nombre_etudiants
      FROM niveau n
      LEFT JOIN specialite s ON n.id_niveau = s.id_niveau
      LEFT JOIN etudiant et ON s.id_specialite = et.id_specialite
      WHERE n.id_departement = $1
      GROUP BY n.id_niveau
      ORDER BY n.nom_niveau
    `,
      {
        bind: [id],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json({
      success: true,
      departement: departement[0],
      niveaux,
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des détails",
      error: error.message,
    });
  }
};

// Statistiques des départements
exports.getDepartementsStats = async (req, res) => {
  try {
    const directeurId = req.user.numero_utilisateur;

    const directeurInfo = await sequelize.query(
      `SELECT id_etablissement FROM directeur_etablissement WHERE numero_utilisateur = $1`,
      {
        bind: [directeurId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (directeurInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Établissement non trouvé",
      });
    }

    const idEtablissement = directeurInfo[0].id_etablissement;

    const stats = await sequelize.query(
      `
      SELECT 
        COUNT(DISTINCT d.id_departement) as total_departements,
        COUNT(DISTINCT n.id_niveau) as total_niveaux,
        COUNT(DISTINCT s.id_specialite) as total_specialites,
        COUNT(DISTINCT et.numero_utilisateur) as total_etudiants,
        COUNT(DISTINCT ens.numero_utilisateur) as total_enseignants
      FROM departement d
      LEFT JOIN niveau n ON d.id_departement = n.id_departement
      LEFT JOIN specialite s ON n.id_niveau = s.id_niveau
      LEFT JOIN etudiant et ON s.id_specialite = et.id_specialite
      LEFT JOIN enseignant ens ON d.id_etablissement = ens.id_etablissement_principal
      WHERE d.id_etablissement = $1
    `,
      {
        bind: [idEtablissement],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json({
      success: true,
      stats: stats[0],
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message,
    });
  }
};

// Récupérer les spécialités d'un département
exports.getDepartementSpecialites = async (req, res) => {
  try {
    const directeurId = req.user.numero_utilisateur;
    const { id } = req.params;

    // Vérifier que le département appartient à l'établissement du directeur
    const directeurInfo = await sequelize.query(
      `SELECT id_etablissement FROM directeur_etablissement WHERE numero_utilisateur = $1`,
      {
        bind: [directeurId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (directeurInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Établissement non trouvé",
      });
    }

    const idEtablissement = directeurInfo[0].id_etablissement;

    // Récupérer les spécialités
    const specialites = await sequelize.query(
      `
      SELECT 
        s.id_specialite,
        s.code_specialite,
        s.nom_specialite,
        n.nom_niveau,
        COUNT(DISTINCT et.numero_utilisateur) as nombre_etudiants
      FROM specialite s
      INNER JOIN niveau n ON s.id_niveau = n.id_niveau
      INNER JOIN departement d ON n.id_departement = d.id_departement
      LEFT JOIN etudiant et ON s.id_specialite = et.id_specialite
      WHERE d.id_departement = $1 AND d.id_etablissement = $2
      GROUP BY s.id_specialite, s.code_specialite, s.nom_specialite, n.nom_niveau
      ORDER BY n.nom_niveau, s.nom_specialite
    `,
      {
        bind: [id, idEtablissement],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json({
      success: true,
      specialites,
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des spécialités",
      error: error.message,
    });
  }
};

// Récupérer les enseignants d'un département
exports.getDepartementEnseignants = async (req, res) => {
  try {
    const directeurId = req.user.numero_utilisateur;
    const { id } = req.params;

    // Vérifier que le département appartient à l'établissement du directeur
    const directeurInfo = await sequelize.query(
      `SELECT id_etablissement FROM directeur_etablissement WHERE numero_utilisateur = $1`,
      {
        bind: [directeurId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (directeurInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Établissement non trouvé",
      });
    }

    const idEtablissement = directeurInfo[0].id_etablissement;

    // Récupérer les enseignants
    const enseignants = await sequelize.query(
      `
      SELECT 
        u.nom,
        u.prenom,
        u.email,
        ens.grade,
        ens.specialite
      FROM enseignant ens
      INNER JOIN utilisateur u ON ens.numero_utilisateur = u.numero_utilisateur
      INNER JOIN departement d ON ens.id_etablissement_principal = d.id_etablissement
      WHERE d.id_departement = $1 AND d.id_etablissement = $2
      ORDER BY u.nom, u.prenom
    `,
      {
        bind: [id, idEtablissement],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json({
      success: true,
      enseignants,
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des enseignants",
      error: error.message,
    });
  }
};

// Données ML pour un département (M1 taux de réussite + M3 performance)
exports.getDepartementMLData = async (req, res) => {
  try {
    const directeurId = req.user.numero_utilisateur;
    const { id } = req.params;

    const directeurInfo = await sequelize.query(
      `SELECT id_etablissement FROM directeur_etablissement WHERE numero_utilisateur = $1`,
      { bind: [directeurId], type: sequelize.QueryTypes.SELECT }
    );
    if (!directeurInfo.length) {
      return res.status(404).json({ success: false, message: "Établissement non trouvé" });
    }
    const idEtablissement = directeurInfo[0].id_etablissement;

    // Type de l'établissement (pour M1)
    const [etabInfo] = await sequelize.query(
      `SELECT e.type FROM etablissement e
       JOIN departement d ON d.id_etablissement = e.id_etablissement
       WHERE d.id_departement = $1 AND d.id_etablissement = $2`,
      { bind: [id, idEtablissement], type: sequelize.QueryTypes.SELECT }
    );

    // Ratio étudiants / enseignants du département
    const [ratioStats] = await sequelize.query(
      `SELECT
         COUNT(DISTINCT et.numero_utilisateur)::float
           / NULLIF(COUNT(DISTINCT ens.numero_utilisateur), 0) AS ratio_etud_ens
       FROM departement d
       LEFT JOIN niveau     n   ON n.id_departement          = d.id_departement
       LEFT JOIN specialite s   ON s.id_niveau               = n.id_niveau
       LEFT JOIN etudiant   et  ON et.id_specialite          = s.id_specialite
       LEFT JOIN enseignant ens ON ens.id_etablissement_principal = d.id_etablissement
       WHERE d.id_departement = $1 AND d.id_etablissement = $2`,
      { bind: [id, idEtablissement], type: sequelize.QueryTypes.SELECT }
    );

    // Taux de réussite moyen des 2 dernières années (M1)
    const reussiteData = await sequelize.query(
      `SELECT
         ha.annee_academique,
         ROUND(AVG(ha.taux_reussite)::numeric, 2)                                AS avg_taux_reussite,
         ROUND(LEAST(100, AVG(ha.nb_absences::float
               / NULLIF(ha.nb_matieres_total, 0) * 100))::numeric, 2)           AS avg_absence
       FROM historique_academique ha
       JOIN etudiant   et ON et.numero_utilisateur = ha.numero_utilisateur
       JOIN specialite s  ON et.id_specialite      = s.id_specialite
       JOIN niveau     n  ON s.id_niveau            = n.id_niveau
       WHERE n.id_departement = $1
       GROUP BY ha.annee_academique
       ORDER BY ha.annee_academique DESC
       LIMIT 2`,
      { bind: [id], type: sequelize.QueryTypes.SELECT }
    );

    // Profil moyen des étudiants — semestre courant + précédent (M3)
    const [etudiantStats] = await sequelize.query(
      `WITH sem_ranked AS (
         SELECT
           ha.numero_utilisateur,
           ha.moyenne,
           ha.nb_absences,
           ha.nb_matieres_total,
           ha.nb_matieres_validees,
           ha.niveau,
           ROW_NUMBER() OVER (
             PARTITION BY ha.numero_utilisateur
             ORDER BY ha.annee_academique DESC, ha.semestre DESC
           ) AS rn
         FROM historique_academique ha
         JOIN etudiant   et ON et.numero_utilisateur = ha.numero_utilisateur
         JOIN specialite s  ON et.id_specialite      = s.id_specialite
         JOIN niveau     n  ON s.id_niveau            = n.id_niveau
         WHERE n.id_departement = $1
       )
       SELECT
         ROUND(AVG(CASE WHEN rn = 1 THEN moyenne                         END)::numeric, 2) AS moy_actuelle,
         ROUND(AVG(CASE WHEN rn = 2 THEN moyenne                         END)::numeric, 2) AS moy_prec,
         ROUND(LEAST(100, AVG(CASE WHEN rn = 1 AND nb_matieres_total > 0
               THEN nb_absences::float / nb_matieres_total * 100 END))::numeric, 2)        AS taux_absence,
         ROUND(AVG(CASE WHEN rn = 1
               THEN (nb_matieres_total - nb_matieres_validees) END)::numeric, 1)           AS matieres_echec,
         ROUND(AVG(CASE WHEN rn = 1 AND nb_matieres_total > 0
               THEN nb_matieres_validees::float / nb_matieres_total END)::numeric, 3)      AS ratio_notes,
         MODE() WITHIN GROUP (ORDER BY CASE WHEN rn = 1 THEN niveau END)                   AS niveau_dominant
       FROM sem_ranked`,
      { bind: [id], type: sequelize.QueryTypes.SELECT }
    );

    const yr1  = reussiteData[0] || {};
    const yr2  = reussiteData[1] || {};
    const etu  = etudiantStats   || {};

    const moyAct  = Math.max(0, Math.min(20,  parseFloat(etu.moy_actuelle) || 12));
    const moyPrec = Math.max(0, Math.min(20,  parseFloat(etu.moy_prec)     || 11));
    const absence = Math.max(0, Math.min(100, parseFloat(etu.taux_absence) || 10));
    const ratioN  = Math.max(0, Math.min(1,   parseFloat(etu.ratio_notes)  || 0.85));
    const matEch  = Math.max(0, Math.round(parseFloat(etu.matieres_echec)  || 2));
    const niveau  = etu.niveau_dominant || "L2";
    const pente   = Math.round((moyAct - moyPrec) * 10) / 10;
    const cc1 = Math.round(Math.max(0, Math.min(20, moyAct - 0.5)) * 10) / 10;
    const cc2 = Math.round(Math.max(0, Math.min(20, moyAct))       * 10) / 10;
    const cc3 = Math.round(Math.max(0, Math.min(20, moyAct + 0.5)) * 10) / 10;

    res.json({
      success: true,
      m1: {
        taux_reussite_an1:  parseFloat(yr1.avg_taux_reussite) || 75,
        taux_reussite_an2:  parseFloat(yr2.avg_taux_reussite) || 72,
        taux_absence_moyen: Math.max(0, Math.min(100, parseFloat(yr1.avg_absence) || 10)),
        ratio_etud_ens:     Math.max(1, Math.round(parseFloat(ratioStats?.ratio_etud_ens) || 25)),
        budget_par_etud: 4500, nb_labos: 8, taux_rotation_ens: 8,
        region: "Tunis", type_etablissement: etabInfo?.type || "ISET",
      },
      m3: {
        moy_semestre_prec:    moyPrec,
        note_cc1: cc1, note_cc2: cc2, note_cc3: cc3,
        taux_absence_actuel:  absence,
        pente_evolution:      pente,
        nb_matieres_sous_10:  matEch,
        ratio_notes_obtenues: ratioN,
        niveau, filiere: "Informatique",
      },
      stats: {
        taux_reussite_an1: parseFloat(yr1.avg_taux_reussite) || null,
        taux_reussite_an2: parseFloat(yr2.avg_taux_reussite) || null,
        moy_actuelle:      moyAct,
        taux_absence:      absence,
      },
    });
  } catch (error) {
    console.error("Erreur getDepartementMLData:", error);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// Étudiants à risque d'un département — analyse ML M2 par étudiant
exports.getDepartementEtudiantsRisque = async (req, res) => {
  try {
    const directeurId = req.user.numero_utilisateur;
    const { id } = req.params;

    const directeurInfo = await sequelize.query(
      `SELECT id_etablissement FROM directeur_etablissement WHERE numero_utilisateur = $1`,
      { bind: [directeurId], type: sequelize.QueryTypes.SELECT }
    );

    if (!directeurInfo.length) {
      return res.status(404).json({ success: false, message: "Établissement non trouvé" });
    }

    const idEtablissement = directeurInfo[0].id_etablissement;

    // Récupère les étudiants du département avec leurs données académiques les plus récentes
    const etudiants = await sequelize.query(
      `WITH sem_ranked AS (
         SELECT
           ha.numero_utilisateur,
           ha.moyenne,
           ha.nb_absences,
           ha.nb_matieres_total,
           ha.nb_matieres_validees,
           ha.niveau,
           ROW_NUMBER() OVER (
             PARTITION BY ha.numero_utilisateur
             ORDER BY ha.annee_academique DESC, ha.semestre DESC
           ) AS rn
         FROM historique_academique ha
         JOIN etudiant et   ON et.numero_utilisateur = ha.numero_utilisateur
         JOIN specialite sp ON et.id_specialite      = sp.id_specialite
         JOIN niveau     n  ON sp.id_niveau           = n.id_niveau
         WHERE n.id_departement = $1
           AND EXISTS (
             SELECT 1 FROM departement d
             WHERE d.id_departement = n.id_departement AND d.id_etablissement = $2
           )
       )
       SELECT
         u.numero_utilisateur,
         u.nom,
         u.prenom,
         u.email,
         sp.nom_specialite,
         COALESCE(cur.niveau, 'L1')                                                       AS niveau,
         ROUND(COALESCE(cur.moyenne, 10)::numeric, 2)                                     AS moy_actuelle,
         ROUND(COALESCE(prec.moyenne, 10)::numeric, 2)                                    AS moy_prec,
         ROUND(LEAST(100, COALESCE(
           cur.nb_absences::float / NULLIF(cur.nb_matieres_total, 0) * 100, 0
         ))::numeric, 1)                                                                   AS taux_absence,
         COALESCE(cur.nb_matieres_total - cur.nb_matieres_validees, 0)                   AS nb_echecs
       FROM sem_ranked cur
       LEFT JOIN sem_ranked prec
              ON prec.numero_utilisateur = cur.numero_utilisateur AND prec.rn = 2
       JOIN etudiant   et ON et.numero_utilisateur = cur.numero_utilisateur
       JOIN utilisateur u  ON u.numero_utilisateur  = cur.numero_utilisateur
       JOIN specialite sp  ON et.id_specialite      = sp.id_specialite
       WHERE cur.rn = 1
         AND cur.moyenne < 10
       ORDER BY cur.moyenne ASC NULLS LAST, taux_absence DESC
       LIMIT 40`,
      { bind: [id, idEtablissement], type: sequelize.QueryTypes.SELECT }
    );

    if (!etudiants.length) {
      return res.json({ success: true, etudiants: [] });
    }

    // Appel ML M2 en parallèle pour chaque étudiant
    const withRisk = await Promise.all(
      etudiants.map(async (et) => {
        const moyAct  = Math.max(0, Math.min(20,  parseFloat(et.moy_actuelle) || 10));
        const moyPrec = Math.max(0, Math.min(20,  parseFloat(et.moy_prec)     || 10));
        const absence = Math.max(0, Math.min(100, parseFloat(et.taux_absence) || 0));
        const nbEch   = Math.max(0, parseInt(et.nb_echecs) || 0);
        const pente   = Math.round((moyAct - moyPrec) * 10) / 10;
        const cc1 = Math.round(Math.max(0, Math.min(20, moyAct - 0.5)) * 10) / 10;
        const cc2 = Math.round(Math.max(0, Math.min(20, moyAct))       * 10) / 10;
        const cc3 = Math.round(Math.max(0, Math.min(20, moyAct + 0.5)) * 10) / 10;

        try {
          const r = await axios.post(`${ML_API}/predict/risque`, {
            moy_semestre_prec:    moyPrec,
            note_cc1: cc1, note_cc2: cc2, note_cc3: cc3,
            taux_absence:         absence,
            nb_echecs_anterieurs: nbEch,
            evolution_notes:      pente,
            participation:        6,
            niveau:               et.niveau || "L1",
            filiere:              "Informatique",
          }, { timeout: 8000 });

          return {
            numero_utilisateur: et.numero_utilisateur,
            nom: et.nom, prenom: et.prenom, email: et.email,
            nom_specialite: et.nom_specialite, niveau: et.niveau,
            moy_actuelle: moyAct, taux_absence: absence, nb_echecs: nbEch,
            risque: r.data,
          };
        } catch {
          return {
            numero_utilisateur: et.numero_utilisateur,
            nom: et.nom, prenom: et.prenom, email: et.email,
            nom_specialite: et.nom_specialite, niveau: et.niveau,
            moy_actuelle: moyAct, taux_absence: absence, nb_echecs: nbEch,
            risque: {
              a_risque: 0, probabilite: 0,
              niveau_alerte: "VERT", couleur: "#22c55e",
              interpretation: "Non évalué",
            },
          };
        }
      })
    );

    // Trier par probabilité de risque décroissante
    withRisk.sort((a, b) => (b.risque?.probabilite || 0) - (a.risque?.probabilite || 0));

    res.json({ success: true, etudiants: withRisk });
  } catch (error) {
    console.error("Erreur getDepartementEtudiantsRisque:", error);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};
