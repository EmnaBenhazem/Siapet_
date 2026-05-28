const { sequelize } = require("../models");

// Récupérer les statistiques du dashboard directeur
exports.getDashboardStats = async (req, res) => {
  try {
    const directeurId = req.user.numero_utilisateur;
    console.log('Fetching stats for directeur:', directeurId);

    // Récupérer l'établissement du directeur connecté
    const directeurInfo = await sequelize.query(
      `SELECT id_etablissement FROM directeur_etablissement WHERE numero_utilisateur = $1`,
      {
        bind: [directeurId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    console.log('Directeur info:', directeurInfo);

    if (directeurInfo.length === 0) {
      console.log('Aucun établissement trouvé pour le directeur:', directeurId);
      return res.status(404).json({
        success: false,
        message: "Établissement non trouvé pour ce directeur",
        debug: { directeurId }
      });
    }

    const idEtablissement = directeurInfo[0].id_etablissement;
    console.log('ID Etablissement:', idEtablissement);

    // Récupérer les informations de l'établissement
    const etablissementInfo = await sequelize.query(
      `SELECT e.nom_etablissement, v.nom_ville 
       FROM etablissement e
       LEFT JOIN ville v ON e.id_ville = v.id_ville
       WHERE e.id_etablissement = $1`,
      {
        bind: [idEtablissement],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Statistiques globales
    const stats = await sequelize.query(
      `
      SELECT
        (SELECT COUNT(DISTINCT et.numero_utilisateur)
         FROM etudiant et
         WHERE et.id_etablissement = $1) as total_etudiants,
        (SELECT COUNT(DISTINCT ens.numero_utilisateur)
         FROM enseignant ens
         WHERE ens.id_etablissement_principal = $1) as total_enseignants,
        (SELECT COUNT(DISTINCT d.id_departement)
         FROM departement d
         WHERE d.id_etablissement = $1 AND (d.archived IS NULL OR d.archived = false)) as total_departements,
        (SELECT COUNT(DISTINCT s.id_specialite)
         FROM specialite s
         JOIN niveau n ON s.id_niveau = n.id_niveau
         JOIN departement dep ON n.id_departement = dep.id_departement
         WHERE dep.id_etablissement = $1) as total_specialites,
        (SELECT ROUND(AVG(ha.taux_reussite)::numeric, 1)
         FROM historique_academique ha
         JOIN etudiant et ON et.numero_utilisateur = ha.numero_utilisateur
         WHERE et.id_etablissement = $1) as avg_taux_reussite
    `,
      {
        bind: [idEtablissement],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    console.log('Stats result:', stats[0]);

    res.json({
      success: true,
      stats: stats[0],
      etablissement: etablissementInfo.length > 0 ? etablissementInfo[0] : null,
      debug: {
        directeurId,
        idEtablissement
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message,
    });
  }
};

// Récupérer la répartition des étudiants par département
exports.getEtudiantsParDepartement = async (req, res) => {
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
        message: "Établissement non trouvé pour ce directeur",
      });
    }

    const idEtablissement = directeurInfo[0].id_etablissement;

    const data = await sequelize.query(
      `
      SELECT 
        d.nom_departement,
        COUNT(DISTINCT et.numero_utilisateur) as nombre_etudiants
      FROM departement d
      LEFT JOIN niveau n ON d.id_departement = n.id_departement
      LEFT JOIN specialite s ON n.id_niveau = s.id_niveau
      LEFT JOIN etudiant et ON s.id_specialite = et.id_specialite
      WHERE d.id_etablissement = $1
      GROUP BY d.id_departement, d.nom_departement
      ORDER BY nombre_etudiants DESC
    `,
      {
        bind: [idEtablissement],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des données",
      error: error.message,
    });
  }
};

// Récupérer l'évolution des inscriptions
exports.getEvolutionInscriptions = async (req, res) => {
  try {
    const directeurId = req.user.numero_utilisateur;
    console.log('Fetching evolution for directeur:', directeurId);

    const directeurInfo = await sequelize.query(
      `SELECT id_etablissement FROM directeur_etablissement WHERE numero_utilisateur = $1`,
      {
        bind: [directeurId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    console.log('Directeur info for evolution:', directeurInfo);

    if (directeurInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Établissement non trouvé pour ce directeur",
      });
    }

    const idEtablissement = directeurInfo[0].id_etablissement;
    console.log('ID Etablissement for evolution:', idEtablissement);

    const data = await sequelize.query(
      `
      SELECT 
        TO_CHAR(u.date_creation, 'YYYY-MM') as mois,
        COUNT(DISTINCT et.numero_utilisateur) as nombre_inscriptions
      FROM utilisateur u
      JOIN etudiant et ON u.numero_utilisateur = et.numero_utilisateur
      WHERE et.id_etablissement = $1 
        AND u.date_creation >= CURRENT_DATE - INTERVAL '13 months'
        AND u.date_creation <= CURRENT_DATE
      GROUP BY TO_CHAR(u.date_creation, 'YYYY-MM')
      ORDER BY mois ASC
    `,
      {
        bind: [idEtablissement],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    console.log('Evolution data:', data);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des données",
      error: error.message,
    });
  }
};

// Récupérer la répartition par niveaux
exports.getRepartitionNiveaux = async (req, res) => {
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
        message: "Établissement non trouvé pour ce directeur",
      });
    }

    const idEtablissement = directeurInfo[0].id_etablissement;

    const data = await sequelize.query(
      `
      SELECT 
        et.niveau_actuel as niveau,
        COUNT(et.numero_utilisateur) as nombre_etudiants
      FROM etudiant et
      WHERE et.id_etablissement = $1
      GROUP BY et.niveau_actuel
      ORDER BY et.niveau_actuel ASC
    `,
      {
        bind: [idEtablissement],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des données",
      error: error.message,
    });
  }
};

// Récupérer les départements avec détails
exports.getDepartements = async (req, res) => {
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
        message: "Établissement non trouvé pour ce directeur",
      });
    }

    const idEtablissement = directeurInfo[0].id_etablissement;

    const data = await sequelize.query(
      `
      SELECT 
        d.id_departement,
        d.nom_departement,
        d.code_departement,
        COUNT(DISTINCT et.numero_utilisateur) as effectif_etudiants,
        COUNT(DISTINCT ens.numero_utilisateur) as effectif_enseignants,
        COUNT(DISTINCT n.id_niveau) as nombre_niveaux,
        COUNT(DISTINCT s.id_specialite) as nombre_specialites
      FROM departement d
      LEFT JOIN niveau n ON d.id_departement = n.id_departement
      LEFT JOIN specialite s ON n.id_niveau = s.id_niveau
      LEFT JOIN etudiant et ON s.id_specialite = et.id_specialite
      LEFT JOIN enseignant ens ON d.id_etablissement = ens.id_etablissement_principal
      WHERE d.id_etablissement = $1
      GROUP BY d.id_departement, d.nom_departement, d.code_departement
      ORDER BY effectif_etudiants DESC
    `,
      {
        bind: [idEtablissement],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des départements:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des départements",
      error: error.message,
    });
  }
};

// Récupérer les données ML pré-calculées pour l'établissement (M1 / M2 / M3)
exports.getMLData = async (req, res) => {
  try {
    const directeurId = req.user.numero_utilisateur;

    const directeurInfo = await sequelize.query(
      `SELECT id_etablissement FROM directeur_etablissement WHERE numero_utilisateur = $1`,
      { bind: [directeurId], type: sequelize.QueryTypes.SELECT }
    );

    if (!directeurInfo.length) {
      return res.status(404).json({ success: false, message: 'Établissement non trouvé' });
    }

    const idEtablissement = directeurInfo[0].id_etablissement;

    const [etabStats] = await sequelize.query(
      `SELECT
         COUNT(DISTINCT et.numero_utilisateur)::float
           / NULLIF(COUNT(DISTINCT ens.numero_utilisateur), 0) AS ratio_etud_ens,
         e.type AS type_etablissement
       FROM etablissement e
       LEFT JOIN etudiant   et  ON et.id_etablissement           = e.id_etablissement
       LEFT JOIN enseignant ens ON ens.id_etablissement_principal = e.id_etablissement
       WHERE e.id_etablissement = $1
       GROUP BY e.type`,
      { bind: [idEtablissement], type: sequelize.QueryTypes.SELECT }
    );

    const reussiteData = await sequelize.query(
      `SELECT
         ha.annee_academique,
         ROUND(AVG(ha.taux_reussite)::numeric, 2) AS avg_taux_reussite,
         ROUND(LEAST(100, AVG(ha.nb_absences::float
               / NULLIF(ha.nb_matieres_total, 0) * 100))::numeric, 2) AS avg_absence
       FROM historique_academique ha
       JOIN etudiant et ON et.numero_utilisateur = ha.numero_utilisateur
       WHERE et.id_etablissement = $1
       GROUP BY ha.annee_academique
       ORDER BY ha.annee_academique DESC
       LIMIT 5`,
      { bind: [idEtablissement], type: sequelize.QueryTypes.SELECT }
    );

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
         JOIN etudiant et ON et.numero_utilisateur = ha.numero_utilisateur
         WHERE et.id_etablissement = $1
       )
       SELECT
         ROUND(AVG(CASE WHEN rn = 1 THEN moyenne END)::numeric, 2) AS moy_actuelle,
         ROUND(AVG(CASE WHEN rn = 2 THEN moyenne END)::numeric, 2) AS moy_prec,
         ROUND(LEAST(100, AVG(CASE WHEN rn = 1 AND nb_matieres_total > 0
               THEN nb_absences::float / nb_matieres_total * 100 END))::numeric, 2) AS taux_absence,
         ROUND(AVG(CASE WHEN rn = 1
               THEN (nb_matieres_total - nb_matieres_validees) END)::numeric, 1) AS matieres_echec,
         ROUND(AVG(CASE WHEN rn = 1 AND nb_matieres_total > 0
               THEN nb_matieres_validees::float / nb_matieres_total END)::numeric, 3) AS ratio_notes,
         MODE() WITHIN GROUP (ORDER BY CASE WHEN rn = 1 THEN niveau END) AS niveau_dominant
       FROM sem_ranked`,
      { bind: [idEtablissement], type: sequelize.QueryTypes.SELECT }
    );

    const yr1  = reussiteData[0] || {};
    const yr2  = reussiteData[1] || {};
    const etu  = etudiantStats   || {};
    const etab = etabStats       || {};

    const moyAct  = Math.max(0, Math.min(20, parseFloat(etu.moy_actuelle) || 12));
    const moyPrec = Math.max(0, Math.min(20, parseFloat(etu.moy_prec)     || 11));
    const absence = Math.max(0, Math.min(100, parseFloat(etu.taux_absence) || 10));
    const ratio   = Math.max(0, Math.min(1,   parseFloat(etu.ratio_notes)  || 0.85));
    const matEch  = Math.max(0, Math.round(parseFloat(etu.matieres_echec)  || 2));
    const niveau  = etu.niveau_dominant || 'L2';
    const pente   = Math.round((moyAct - moyPrec) * 10) / 10;

    const cc1 = Math.round(Math.max(0, Math.min(20, moyAct - 0.5)) * 10) / 10;
    const cc2 = Math.round(Math.max(0, Math.min(20, moyAct))       * 10) / 10;
    const cc3 = Math.round(Math.max(0, Math.min(20, moyAct + 0.5)) * 10) / 10;

    const m1 = {
      taux_reussite_an1:  parseFloat(yr1.avg_taux_reussite) || 75,
      taux_reussite_an2:  parseFloat(yr2.avg_taux_reussite) || 72,
      taux_absence_moyen: Math.max(0, Math.min(100, parseFloat(yr1.avg_absence) || 10)),
      ratio_etud_ens:     Math.max(1, Math.round(parseFloat(etab.ratio_etud_ens) || 25)),
      budget_par_etud: 4500, nb_labos: 8, taux_rotation_ens: 8,
      region: 'Tunis', type_etablissement: etab.type_etablissement || 'ISET',
    };

    const m2 = {
      moy_semestre_prec: moyPrec, note_cc1: cc1, note_cc2: cc2, note_cc3: cc3,
      taux_absence: absence, nb_echecs_anterieurs: matEch, evolution_notes: pente,
      participation: 6, niveau, filiere: 'Informatique',
    };

    const m3 = {
      moy_semestre_prec: moyPrec, note_cc1: cc1, note_cc2: cc2, note_cc3: cc3,
      taux_absence_actuel: absence, pente_evolution: pente,
      nb_matieres_sous_10: matEch, ratio_notes_obtenues: ratio,
      niveau, filiere: 'Informatique',
    };

    const reussite_historique = [...reussiteData]
      .reverse()
      .map(r => ({
        annee: r.annee_academique,
        taux: parseFloat(r.avg_taux_reussite) || 0,
      }));

    res.json({ success: true, m1, m2, m3, reussite_historique });
  } catch (error) {
    console.error('Erreur getMLData directeur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// Récupérer la comparaison inter-départements
exports.getComparaisonDepartements = async (req, res) => {
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
        message: "Établissement non trouvé pour ce directeur",
      });
    }

    const idEtablissement = directeurInfo[0].id_etablissement;

    const data = await sequelize.query(
      `
      SELECT 
        d.nom_departement,
        d.code_departement,
        COUNT(DISTINCT et.numero_utilisateur) as nombre_etudiants,
        COUNT(DISTINCT ens.numero_utilisateur) as nombre_enseignants,
        CASE 
          WHEN COUNT(DISTINCT et.numero_utilisateur) > 0 
          THEN ROUND(COUNT(DISTINCT ens.numero_utilisateur)::numeric / COUNT(DISTINCT et.numero_utilisateur)::numeric, 2)
          ELSE 0 
        END as ratio_enseignant_etudiant,
        COUNT(DISTINCT s.id_specialite) as nombre_specialites
      FROM departement d
      LEFT JOIN niveau n ON d.id_departement = n.id_departement
      LEFT JOIN specialite s ON n.id_niveau = s.id_niveau
      LEFT JOIN etudiant et ON s.id_specialite = et.id_specialite
      LEFT JOIN enseignant ens ON d.id_etablissement = ens.id_etablissement_principal
      WHERE d.id_etablissement = $1
      GROUP BY d.id_departement, d.nom_departement, d.code_departement
      ORDER BY nombre_etudiants DESC
    `,
      {
        bind: [idEtablissement],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des données",
      error: error.message,
    });
  }
};
