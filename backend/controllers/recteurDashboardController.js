const { sequelize } = require("../models");

// Récupérer les statistiques du dashboard recteur
exports.getDashboardStats = async (req, res) => {
  try {
    const recteurId = req.user.numero_utilisateur;

    // Récupérer le rectorat du recteur connecté
    const recteurInfo = await sequelize.query(
      `SELECT id_rectorat FROM recteur_universite WHERE numero_utilisateur = $1`,
      {
        bind: [recteurId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (recteurInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Rectorat non trouvé pour ce recteur",
      });
    }

    const idRectorat = recteurInfo[0].id_rectorat;

    // Statistiques globales
    const stats = await sequelize.query(
      `
      SELECT
        (SELECT COUNT(*) FROM etablissement WHERE id_rectorat = $1 AND archive = false) as total_etablissements,
        (SELECT COUNT(DISTINCT et.numero_utilisateur)
         FROM etudiant et
         JOIN etablissement e ON et.id_etablissement = e.id_etablissement
         WHERE e.id_rectorat = $1) as total_etudiants,
        (SELECT COUNT(DISTINCT ens.numero_utilisateur)
         FROM enseignant ens
         JOIN etablissement e ON ens.id_etablissement_principal = e.id_etablissement
         WHERE e.id_rectorat = $1) as total_enseignants,
        (SELECT COUNT(DISTINCT d.numero_utilisateur)
         FROM directeur_etablissement d
         JOIN etablissement e ON d.id_etablissement = e.id_etablissement
         WHERE e.id_rectorat = $1) as total_directeurs,
        (SELECT COUNT(DISTINCT s.id_specialite)
         FROM specialite s
         JOIN niveau n ON s.id_niveau = n.id_niveau
         JOIN departement dep ON n.id_departement = dep.id_departement
         JOIN etablissement e ON dep.id_etablissement = e.id_etablissement
         WHERE e.id_rectorat = $1) as total_specialites,
        (SELECT ROUND(AVG(ha.taux_reussite)::numeric, 1)
         FROM historique_academique ha
         JOIN etudiant et ON et.numero_utilisateur = ha.numero_utilisateur
         JOIN etablissement e ON e.id_etablissement = et.id_etablissement
         WHERE e.id_rectorat = $1) as avg_taux_reussite
    `,
      {
        bind: [idRectorat],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json({
      success: true,
      stats: stats[0],
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

// Récupérer la répartition des étudiants par établissement
exports.getEtudiantsParEtablissement = async (req, res) => {
  try {
    const recteurId = req.user.numero_utilisateur;

    // Récupérer le rectorat du recteur connecté
    const recteurInfo = await sequelize.query(
      `SELECT id_rectorat FROM recteur_universite WHERE numero_utilisateur = $1`,
      {
        bind: [recteurId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (recteurInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Rectorat non trouvé pour ce recteur",
      });
    }

    const idRectorat = recteurInfo[0].id_rectorat;

    const data = await sequelize.query(
      `
      SELECT 
        e.nom_etablissement,
        COUNT(et.numero_utilisateur) as nombre_etudiants
      FROM etablissement e
      LEFT JOIN etudiant et ON e.id_etablissement = et.id_etablissement
      WHERE e.id_rectorat = $1 AND e.archive = false
      GROUP BY e.id_etablissement, e.nom_etablissement
      ORDER BY nombre_etudiants DESC
      LIMIT 10
    `,
      {
        bind: [idRectorat],
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
    const recteurId = req.user.numero_utilisateur;
    console.log('Fetching evolution for recteur:', recteurId);

    // Récupérer le rectorat du recteur connecté
    const recteurInfo = await sequelize.query(
      `SELECT id_rectorat FROM recteur_universite WHERE numero_utilisateur = $1`,
      {
        bind: [recteurId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    console.log('Recteur info:', recteurInfo);

    if (recteurInfo.length === 0) {
      console.log('Aucun rectorat trouvé pour le recteur:', recteurId);
      return res.status(404).json({
        success: false,
        message: "Rectorat non trouvé pour ce recteur",
      });
    }

    const idRectorat = recteurInfo[0].id_rectorat;
    console.log('ID Rectorat:', idRectorat);

    // Vérifier d'abord combien d'étudiants existent pour ce rectorat
    const countEtudiants = await sequelize.query(
      `SELECT COUNT(DISTINCT et.numero_utilisateur) as total 
       FROM etudiant et 
       JOIN etablissement e ON et.id_etablissement = e.id_etablissement 
       WHERE e.id_rectorat = $1`,
      {
        bind: [idRectorat],
        type: sequelize.QueryTypes.SELECT,
      }
    );
    console.log('Total étudiants pour ce rectorat:', countEtudiants[0].total);

    // Générer les 12 derniers mois et compter les inscriptions
    const data = await sequelize.query(
      `
      WITH mois_series AS (
        SELECT 
          TO_CHAR(date_trunc('month', CURRENT_DATE - (n || ' months')::interval), 'YYYY-MM') as mois
        FROM generate_series(0, 11) n
      )
      SELECT 
        ms.mois,
        COALESCE(COUNT(DISTINCT et.numero_utilisateur), 0) as nombre_inscriptions
      FROM mois_series ms
      LEFT JOIN utilisateur u ON TO_CHAR(u.date_creation, 'YYYY-MM') = ms.mois 
        AND u.type_utilisateur = 'ETUDIANT'
      LEFT JOIN etudiant et ON u.numero_utilisateur = et.numero_utilisateur
      LEFT JOIN etablissement e ON et.id_etablissement = e.id_etablissement
      WHERE e.id_rectorat = $1 OR e.id_rectorat IS NULL
      GROUP BY ms.mois
      ORDER BY ms.mois ASC
    `,
      {
        bind: [idRectorat],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    console.log('Evolution data count:', data.length);
    console.log('Evolution data:', JSON.stringify(data, null, 2));

    res.json({
      success: true,
      data,
      debug: {
        recteurId,
        idRectorat,
        totalEtudiants: countEtudiants[0].total,
        resultCount: data.length
      }
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
    const recteurId = req.user.numero_utilisateur;

    // Récupérer le rectorat du recteur connecté
    const recteurInfo = await sequelize.query(
      `SELECT id_rectorat FROM recteur_universite WHERE numero_utilisateur = $1`,
      {
        bind: [recteurId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (recteurInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Rectorat non trouvé pour ce recteur",
      });
    }

    const idRectorat = recteurInfo[0].id_rectorat;

    const data = await sequelize.query(
      `
      SELECT 
        et.niveau_actuel as niveau,
        COUNT(et.numero_utilisateur) as nombre_etudiants
      FROM etudiant et
      JOIN etablissement e ON et.id_etablissement = e.id_etablissement
      WHERE e.id_rectorat = $1
      GROUP BY et.niveau_actuel
      ORDER BY et.niveau_actuel ASC
    `,
      {
        bind: [idRectorat],
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

// Récupérer les établissements sous tutelle avec détails
exports.getEtablissementsSousTutelle = async (req, res) => {
  try {
    const recteurId = req.user.numero_utilisateur;

    // Récupérer le rectorat du recteur connecté
    const recteurInfo = await sequelize.query(
      `SELECT id_rectorat FROM recteur_universite WHERE numero_utilisateur = $1`,
      {
        bind: [recteurId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (recteurInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Rectorat non trouvé pour ce recteur",
      });
    }

    const idRectorat = recteurInfo[0].id_rectorat;

    const data = await sequelize.query(
      `
      SELECT 
        e.id_etablissement,
        e.nom_etablissement,
        e.type as type_etablissement,
        e.adresse,
        e.telephone,
        COUNT(DISTINCT et.numero_utilisateur) as effectif_etudiants,
        COUNT(DISTINCT ens.numero_utilisateur) as effectif_enseignants,
        COUNT(DISTINCT d.numero_utilisateur) as nombre_directeurs,
        CASE 
          WHEN COUNT(DISTINCT et.numero_utilisateur) >= 3000 THEN 'excellent'
          WHEN COUNT(DISTINCT et.numero_utilisateur) >= 1500 THEN 'bon'
          WHEN COUNT(DISTINCT et.numero_utilisateur) >= 500 THEN 'moyen'
          ELSE 'faible'
        END as statut_effectif
      FROM etablissement e
      LEFT JOIN etudiant et ON e.id_etablissement = et.id_etablissement
      LEFT JOIN enseignant ens ON e.id_etablissement = ens.id_etablissement_principal
      LEFT JOIN directeur_etablissement d ON e.id_etablissement = d.id_etablissement
      WHERE e.id_rectorat = $1 AND e.archive = false
      GROUP BY e.id_etablissement, e.nom_etablissement, e.type, e.adresse, e.telephone
      ORDER BY effectif_etudiants DESC
    `,
      {
        bind: [idRectorat],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des établissements:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des établissements",
      error: error.message,
    });
  }
};

// Récupérer les données ML pré-calculées pour le rectorat (M1 / M2 / M3)
exports.getMLData = async (req, res) => {
  try {
    const recteurId = req.user.numero_utilisateur;

    const recteurInfo = await sequelize.query(
      `SELECT id_rectorat FROM recteur_universite WHERE numero_utilisateur = $1`,
      { bind: [recteurId], type: sequelize.QueryTypes.SELECT }
    );

    if (!recteurInfo.length) {
      return res.status(404).json({ success: false, message: 'Rectorat non trouvé' });
    }

    const idRectorat = recteurInfo[0].id_rectorat;

    // ── Ratio étudiants/enseignants + type dominant (M1) ─────────────────────
    const [etabStats] = await sequelize.query(
      `SELECT
         COUNT(DISTINCT et.numero_utilisateur)::float
           / NULLIF(COUNT(DISTINCT ens.numero_utilisateur), 0) AS ratio_etud_ens,
         MODE() WITHIN GROUP (ORDER BY e.type) AS type_etablissement
       FROM etablissement e
       LEFT JOIN etudiant   et  ON et.id_etablissement          = e.id_etablissement
       LEFT JOIN enseignant ens ON ens.id_etablissement_principal = e.id_etablissement
       WHERE e.id_rectorat = $1 AND e.archive = false`,
      { bind: [idRectorat], type: sequelize.QueryTypes.SELECT }
    );

    // ── Taux de réussite moyens des 2 dernières années (M1) ──────────────────
    const reussiteData = await sequelize.query(
      `SELECT
         ha.annee_academique,
         ROUND(AVG(ha.taux_reussite)::numeric, 2) AS avg_taux_reussite,
         ROUND(LEAST(100, AVG(ha.nb_absences::float
               / NULLIF(ha.nb_matieres_total, 0) * 100))::numeric, 2) AS avg_absence
       FROM historique_academique ha
       JOIN etudiant    et ON et.numero_utilisateur = ha.numero_utilisateur
       JOIN etablissement e  ON e.id_etablissement  = et.id_etablissement
       WHERE e.id_rectorat = $1
       GROUP BY ha.annee_academique
       ORDER BY ha.annee_academique DESC
       LIMIT 2`,
      { bind: [idRectorat], type: sequelize.QueryTypes.SELECT }
    );

    // ── Profil moyen étudiant — semestre actuel + précédent (M2 / M3) ────────
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
         JOIN etudiant    et ON et.numero_utilisateur = ha.numero_utilisateur
         JOIN etablissement e  ON e.id_etablissement  = et.id_etablissement
         WHERE e.id_rectorat = $1
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
      { bind: [idRectorat], type: sequelize.QueryTypes.SELECT }
    );

    // ── Construction des objets defaultData ──────────────────────────────────
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

    // CC dérivés de la moyenne actuelle (approximation linéaire)
    const cc1 = Math.round(Math.max(0, Math.min(20, moyAct - 0.5)) * 10) / 10;
    const cc2 = Math.round(Math.max(0, Math.min(20, moyAct))       * 10) / 10;
    const cc3 = Math.round(Math.max(0, Math.min(20, moyAct + 0.5)) * 10) / 10;

    const m1 = {
      taux_reussite_an1:  parseFloat(yr1.avg_taux_reussite)  || 75,
      taux_reussite_an2:  parseFloat(yr2.avg_taux_reussite)  || 72,
      taux_absence_moyen: Math.max(0, Math.min(100, parseFloat(yr1.avg_absence) || 10)),
      ratio_etud_ens:     Math.max(1, Math.round(parseFloat(etab.ratio_etud_ens) || 25)),
      budget_par_etud:    4500,
      nb_labos:           12,
      taux_rotation_ens:  8,
      region:             'Tunis',
      type_etablissement: etab.type_etablissement || 'ISET',
    };

    const m2 = {
      moy_semestre_prec:    moyPrec,
      note_cc1:             cc1,
      note_cc2:             cc2,
      note_cc3:             cc3,
      taux_absence:         absence,
      nb_echecs_anterieurs: matEch,
      evolution_notes:      pente,
      participation:        6,
      niveau,
      filiere: 'Informatique',
    };

    const m3 = {
      moy_semestre_prec:    moyPrec,
      note_cc1:             cc1,
      note_cc2:             cc2,
      note_cc3:             cc3,
      taux_absence_actuel:  absence,
      pente_evolution:      pente,
      nb_matieres_sous_10:  matEch,
      ratio_notes_obtenues: ratio,
      niveau,
      filiere: 'Informatique',
    };

    res.json({ success: true, m1, m2, m3 });
  } catch (error) {
    console.error('Erreur getMLData:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// Récupérer la comparaison inter-établissements
exports.getComparaisonEtablissements = async (req, res) => {
  try {
    const recteurId = req.user.numero_utilisateur;
    console.log('Fetching comparaison for recteur:', recteurId);

    // Récupérer le rectorat du recteur connecté
    const recteurInfo = await sequelize.query(
      `SELECT id_rectorat FROM recteur_universite WHERE numero_utilisateur = $1`,
      {
        bind: [recteurId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    console.log('Recteur info:', recteurInfo);

    if (recteurInfo.length === 0) {
      console.log('Aucun rectorat trouvé pour le recteur:', recteurId);
      return res.status(404).json({
        success: false,
        message: "Rectorat non trouvé pour ce recteur",
      });
    }

    const idRectorat = recteurInfo[0].id_rectorat;
    console.log('ID Rectorat:', idRectorat);

    // Vérifier d'abord combien d'établissements existent pour ce rectorat
    const countEtab = await sequelize.query(
      `SELECT COUNT(*) as total FROM etablissement WHERE id_rectorat = $1`,
      {
        bind: [idRectorat],
        type: sequelize.QueryTypes.SELECT,
      }
    );
    console.log('Total établissements pour ce rectorat:', countEtab[0].total);

    const data = await sequelize.query(
      `
      SELECT 
        e.nom_etablissement,
        e.type as type_etablissement,
        COUNT(DISTINCT et.numero_utilisateur) as nombre_etudiants,
        COUNT(DISTINCT ens.numero_utilisateur) as nombre_enseignants,
        CASE 
          WHEN COUNT(DISTINCT et.numero_utilisateur) > 0 
          THEN ROUND(COUNT(DISTINCT ens.numero_utilisateur)::numeric / COUNT(DISTINCT et.numero_utilisateur)::numeric, 2)
          ELSE 0 
        END as ratio_enseignant_etudiant,
        COUNT(DISTINCT d.numero_utilisateur) as nombre_directeurs
      FROM etablissement e
      LEFT JOIN etudiant et ON e.id_etablissement = et.id_etablissement
      LEFT JOIN enseignant ens ON e.id_etablissement = ens.id_etablissement_principal
      LEFT JOIN directeur_etablissement d ON e.id_etablissement = d.id_etablissement
      WHERE e.id_rectorat = $1 AND e.archive = false
      GROUP BY e.id_etablissement, e.nom_etablissement, e.type
      ORDER BY nombre_etudiants DESC
    `,
      {
        bind: [idRectorat],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    console.log('Comparaison data count:', data.length);
    console.log('Comparaison data:', JSON.stringify(data, null, 2));

    res.json({
      success: true,
      data,
      debug: {
        recteurId,
        idRectorat,
        totalEtablissements: countEtab[0].total,
        resultCount: data.length
      }
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
