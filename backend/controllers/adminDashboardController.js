const { sequelize } = require("../models");

// Récupérer les données par région pour la carte interactive
exports.getRegionData = async (req, res) => {
  try {
    const { id_region } = req.params;

    // Si id_region est fourni, retourner les détails de cette région
    if (id_region) {
      // Statistiques de la région
      const regionStats = await sequelize.query(
        `
        SELECT 
          r.id_region,
          r.nom_region,
          COUNT(DISTINCT e.id_etablissement) as total_etablissements,
          COUNT(DISTINCT et.numero_utilisateur) as total_etudiants,
          COUNT(DISTINCT ens.numero_utilisateur) as total_enseignants,
          COALESCE(AVG(CASE 
            WHEN et.moyenne_generale IS NOT NULL 
            THEN et.moyenne_generale 
          END), 0) as taux_reussite_moyen,
          COALESCE(SUM(e.budget_alloue), 0) as budget_total
        FROM region r
        LEFT JOIN ville v ON r.id_region = v.id_region
        LEFT JOIN etablissement e ON v.id_ville = e.id_ville AND e.archive = false
        LEFT JOIN etudiant et ON e.id_etablissement = et.id_etablissement
        LEFT JOIN enseignant ens ON e.id_etablissement = ens.id_etablissement_principal
        WHERE r.id_region = $1
        GROUP BY r.id_region, r.nom_region
      `,
        {
          bind: [id_region],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      // Liste des établissements de la région
      const etablissements = await sequelize.query(
        `
        SELECT 
          e.id_etablissement,
          e.nom_etablissement,
          e.type,
          e.adresse,
          e.telephone,
          v.nom_ville,
          COUNT(DISTINCT et.numero_utilisateur) as effectif_etudiants,
          COUNT(DISTINCT ens.numero_utilisateur) as effectif_enseignants,
          COALESCE(AVG(CASE 
            WHEN et.moyenne_generale IS NOT NULL 
            THEN et.moyenne_generale 
          END), 0) as taux_reussite,
          e.budget_alloue
        FROM etablissement e
        LEFT JOIN ville v ON e.id_ville = v.id_ville
        LEFT JOIN etudiant et ON e.id_etablissement = et.id_etablissement
        LEFT JOIN enseignant ens ON e.id_etablissement = ens.id_etablissement_principal
        WHERE v.id_region = $1 AND e.archive = false
        GROUP BY e.id_etablissement, e.nom_etablissement, e.type, e.adresse, e.telephone, v.nom_ville, e.budget_alloue
        ORDER BY effectif_etudiants DESC
      `,
        {
          bind: [id_region],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      // Répartition par type d'établissement
      const repartitionTypes = await sequelize.query(
        `
        SELECT 
          e.type,
          COUNT(DISTINCT e.id_etablissement) as nombre,
          COUNT(DISTINCT et.numero_utilisateur) as total_etudiants
        FROM etablissement e
        LEFT JOIN ville v ON e.id_ville = v.id_ville
        LEFT JOIN etudiant et ON e.id_etablissement = et.id_etablissement
        WHERE v.id_region = $1 AND e.archive = false
        GROUP BY e.type
        ORDER BY nombre DESC
      `,
        {
          bind: [id_region],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      return res.json({
        success: true,
        data: {
          stats: regionStats[0] || {},
          etablissements,
          repartitionTypes,
        },
      });
    }

    // Sinon, retourner toutes les régions avec leurs statistiques
    const regions = await sequelize.query(
      `
      SELECT 
        r.id_region,
        r.nom_region,
        COUNT(DISTINCT e.id_etablissement) as total_etablissements,
        COUNT(DISTINCT et.numero_utilisateur) as total_etudiants,
        COUNT(DISTINCT ens.numero_utilisateur) as total_enseignants,
        COALESCE(AVG(CASE 
          WHEN et.moyenne_generale IS NOT NULL 
          THEN et.moyenne_generale 
        END), 0) as taux_reussite_moyen,
        COALESCE(SUM(e.budget_alloue), 0) as budget_total,
        CASE 
          WHEN AVG(CASE WHEN et.moyenne_generale IS NOT NULL THEN et.moyenne_generale END) >= 14 THEN 'excellent'
          WHEN AVG(CASE WHEN et.moyenne_generale IS NOT NULL THEN et.moyenne_generale END) >= 12 THEN 'bon'
          ELSE 'risque'
        END as statut
      FROM region r
      LEFT JOIN ville v ON r.id_region = v.id_region
      LEFT JOIN etablissement e ON v.id_ville = e.id_ville AND e.archive = false
      LEFT JOIN etudiant et ON e.id_etablissement = et.id_etablissement
      LEFT JOIN enseignant ens ON e.id_etablissement = ens.id_etablissement_principal
      GROUP BY r.id_region, r.nom_region
      ORDER BY total_etudiants DESC
    `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    res.json({
      success: true,
      data: regions,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données régionales:",
      error,
    );
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des données régionales",
      error: error.message,
    });
  }
};

// Comparaison inter-régions
exports.compareRegions = async (req, res) => {
  try {
    const data = await sequelize.query(
      `
      SELECT 
        r.nom_region,
        COUNT(DISTINCT e.id_etablissement) as nombre_etablissements,
        COUNT(DISTINCT et.numero_utilisateur) as nombre_etudiants,
        COUNT(DISTINCT ens.numero_utilisateur) as nombre_enseignants,
        COALESCE(AVG(CASE 
          WHEN et.moyenne_generale IS NOT NULL 
          THEN et.moyenne_generale 
        END), 0) as taux_reussite_moyen,
        CASE 
          WHEN COUNT(DISTINCT et.numero_utilisateur) > 0 
          THEN ROUND(COUNT(DISTINCT ens.numero_utilisateur)::numeric / COUNT(DISTINCT et.numero_utilisateur)::numeric, 3)
          ELSE 0 
        END as ratio_enseignant_etudiant,
        COALESCE(SUM(e.budget_alloue), 0) as budget_total
      FROM region r
      LEFT JOIN ville v ON r.id_region = v.id_region
      LEFT JOIN etablissement e ON v.id_ville = e.id_ville AND e.archive = false
      LEFT JOIN etudiant et ON e.id_etablissement = et.id_etablissement
      LEFT JOIN enseignant ens ON e.id_etablissement = ens.id_etablissement_principal
      GROUP BY r.id_region, r.nom_region
      HAVING COUNT(DISTINCT e.id_etablissement) > 0
      ORDER BY nombre_etudiants DESC
    `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Erreur lors de la comparaison des régions:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la comparaison des régions",
      error: error.message,
    });
  }
};

// Récupérer 10 établissements aléatoires avec leurs statistiques
exports.getRandomEtablissements = async (req, res) => {
  try {
    const etablissements = await sequelize.query(
      `
      SELECT 
        e.id_etablissement,
        e.code_etablissement,
        e.nom_etablissement,
        e.type,
        v.nom_ville,
        COUNT(DISTINCT et.numero_utilisateur) as effectif_total,
        COALESCE(AVG(CASE 
          WHEN et.moyenne_generale IS NOT NULL 
          THEN et.moyenne_generale 
        END) * 5, 0) as taux_reussite,
        e.budget_alloue
      FROM etablissement e
      LEFT JOIN ville v ON e.id_ville = v.id_ville
      LEFT JOIN etudiant et ON e.id_etablissement = et.id_etablissement
      WHERE e.archive = false
      GROUP BY e.id_etablissement, e.code_etablissement, e.nom_etablissement, e.type, v.nom_ville, e.budget_alloue
      ORDER BY RANDOM()
      LIMIT 10
    `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    res.json({
      success: true,
      data: etablissements,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des établissements aléatoires:",
      error,
    );
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des établissements aléatoires",
      error: error.message,
    });
  }
};
