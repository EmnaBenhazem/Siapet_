const { sequelize } = require("../models");

// Récupérer tous les utilisateurs de l'établissement du directeur connecté
exports.getDirecteurUsers = async (req, res) => {
  try {
    const directeurId = req.user.numero_utilisateur;
    const {
      role,
      statut,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    console.log("=== DEBUT getDirecteurUsers ===");
    console.log("Directeur ID:", directeurId);
    console.log("Filtres reçus:", { role, statut, search, page, limit });

    // Récupérer l'établissement du directeur connecté
    const directeurInfo = await sequelize.query(
      `SELECT id_etablissement FROM directeur_etablissement WHERE numero_utilisateur = $1`,
      {
        bind: [directeurId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    console.log("Résultat directeurInfo:", directeurInfo);

    if (directeurInfo.length === 0) {
      console.log("❌ Aucun établissement trouvé pour ce directeur");
      return res.status(404).json({
        message: "Établissement non trouvé pour ce directeur",
      });
    }

    const idEtablissement = directeurInfo[0].id_etablissement;
    console.log("✅ ID Établissement:", idEtablissement);

    // Construction de la requête SQL avec filtres
    let whereConditions = [];
    let params = [idEtablissement];
    let paramIndex = 2;

    // Seuls les enseignants et étudiants de l'établissement
    whereConditions.push(`u.type_utilisateur IN ('ENSEIGNANT', 'ETUDIANT')`);

    // Filtre par rôle
    if (role && role !== "") {
      whereConditions.push(`u.type_utilisateur = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    // Filtre par statut
    if (statut && statut !== "") {
      whereConditions.push(`u.statut = $${paramIndex}`);
      params.push(statut);
      paramIndex++;
    }

    // Filtre par recherche (nom, prénom, email, téléphone)
    if (search && search.trim() !== "") {
      whereConditions.push(
        `(LOWER(u.nom) LIKE LOWER($${paramIndex}) OR LOWER(u.prenom) LIKE LOWER($${paramIndex}) OR LOWER(u.email) LIKE LOWER($${paramIndex}) OR u.telephone LIKE $${paramIndex})`,
      );
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `AND ${whereConditions.join(" AND ")}` : '';

    console.log("Where clause:", whereClause);
    console.log("Params:", params);

    // Requête pour compter le total
    const countQuery = `
      SELECT COUNT(DISTINCT u.numero_utilisateur) as total
      FROM utilisateur u
      LEFT JOIN etudiant et ON u.numero_utilisateur = et.numero_utilisateur
      LEFT JOIN enseignant ens ON u.numero_utilisateur = ens.numero_utilisateur
      WHERE (et.id_etablissement = $1 OR ens.id_etablissement_principal = $1)
      ${whereClause}
    `;

    console.log("Count query:", countQuery);

    const countResult = await sequelize.query(countQuery, {
      bind: params,
      type: sequelize.QueryTypes.SELECT,
    });

    const total = parseInt(countResult[0].total);
    const offset = (page - 1) * limit;

    console.log(
      `Total trouvé: ${total}, Page: ${page}, Limit: ${limit}, Offset: ${offset}`,
    );

    // Requête pour récupérer les utilisateurs
    const query = `
      SELECT DISTINCT
        u.numero_utilisateur,
        u.nom,
        u.prenom,
        u.email,
        u.telephone,
        u.sexe,
        u.statut,
        u.type_utilisateur,
        u.date_creation,
        u.derniere_connexion,
        et.numero_etudiant as etudiant_matricule,
        et.moyenne_generale as etudiant_moyenne,
        ens.numero_enseignant,
        ens.grade as enseignant_grade,
        ens.specialite as enseignant_specialite,
        e.nom_etablissement,
        v.nom_ville as nom_ville,
        r.nom_region as nom_region,
        rec.nom_rectorat
      FROM utilisateur u
      LEFT JOIN etudiant et ON u.numero_utilisateur = et.numero_utilisateur
      LEFT JOIN enseignant ens ON u.numero_utilisateur = ens.numero_utilisateur
      LEFT JOIN etablissement e ON COALESCE(ens.id_etablissement_principal, et.id_etablissement) = e.id_etablissement
      LEFT JOIN ville v ON e.id_ville = v.id_ville
      LEFT JOIN region r ON v.id_region = r.id_region
      LEFT JOIN rectorat rec ON e.id_rectorat = rec.id_rectorat
      WHERE (et.id_etablissement = $1 OR ens.id_etablissement_principal = $1)
      ${whereClause}
      ORDER BY u.date_creation DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(parseInt(limit), offset);

    console.log("Main query:", query);
    console.log("Final params:", params);

    const users = await sequelize.query(query, {
      bind: params,
      type: sequelize.QueryTypes.SELECT,
    });

    console.log(`✅ Trouvé ${users.length} utilisateurs sur ${total} total`);
    console.log("=== FIN getDirecteurUsers ===");

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des utilisateurs:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      message: "Erreur lors de la récupération des utilisateurs",
      error: error.message,
    });
  }
};

// Récupérer les options de filtrage pour le directeur
exports.getDirecteurFilterOptions = async (req, res) => {
  try {
    const directeurId = req.user.numero_utilisateur;

    // Récupérer l'établissement du directeur connecté
    const directeurInfo = await sequelize.query(
      `SELECT id_etablissement FROM directeur_etablissement WHERE numero_utilisateur = $1`,
      {
        bind: [directeurId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (directeurInfo.length === 0) {
      return res.status(404).json({
        message: "Établissement non trouvé pour ce directeur",
      });
    }

    const idEtablissement = directeurInfo[0].id_etablissement;

    // Types de rôles (seulement enseignants et étudiants)
    const roles = [
      { value: "ENSEIGNANT", label: "Enseignant" },
      { value: "ETUDIANT", label: "Étudiant" },
    ];

    // Statuts
    const statuts = [
      { value: "ACTIF", label: "Actif" },
      { value: "INACTIF", label: "Inactif" },
      { value: "SUSPENDU", label: "Suspendu" },
    ];

    res.json({
      roles,
      statuts,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des options:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des options",
      error: error.message,
    });
  }
};

// Statistiques des utilisateurs du directeur
exports.getDirecteurUserStats = async (req, res) => {
  try {
    const directeurId = req.user.numero_utilisateur;

    // Récupérer l'établissement du directeur connecté
    const directeurInfo = await sequelize.query(
      `SELECT id_etablissement FROM directeur_etablissement WHERE numero_utilisateur = $1`,
      {
        bind: [directeurId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (directeurInfo.length === 0) {
      return res.status(404).json({
        message: "Établissement non trouvé pour ce directeur",
      });
    }

    const idEtablissement = directeurInfo[0].id_etablissement;

    const stats = await sequelize.query(
      `
      SELECT 
        u.type_utilisateur,
        COUNT(*) as count,
        COUNT(CASE WHEN u.statut = 'ACTIF' THEN 1 END) as actifs,
        COUNT(CASE WHEN u.statut = 'INACTIF' THEN 1 END) as inactifs,
        COUNT(CASE WHEN u.statut = 'SUSPENDU' THEN 1 END) as suspendus
      FROM utilisateur u
      LEFT JOIN etudiant et ON u.numero_utilisateur = et.numero_utilisateur
      LEFT JOIN enseignant ens ON u.numero_utilisateur = ens.numero_utilisateur
      WHERE (et.id_etablissement = $1 OR ens.id_etablissement_principal = $1)
        AND u.type_utilisateur IN ('ENSEIGNANT', 'ETUDIANT')
        AND u.statut != 'INACTIF'
      GROUP BY u.type_utilisateur
    `,
      { 
        bind: [idEtablissement],
        type: sequelize.QueryTypes.SELECT 
      },
    );

    const total = await sequelize.query(
      `
      SELECT COUNT(DISTINCT u.numero_utilisateur) as total 
      FROM utilisateur u
      LEFT JOIN etudiant et ON u.numero_utilisateur = et.numero_utilisateur
      LEFT JOIN enseignant ens ON u.numero_utilisateur = ens.numero_utilisateur
      WHERE (et.id_etablissement = $1 OR ens.id_etablissement_principal = $1)
        AND u.type_utilisateur IN ('ENSEIGNANT', 'ETUDIANT')
        AND u.statut != 'INACTIF'
      `,
      { 
        bind: [idEtablissement],
        type: sequelize.QueryTypes.SELECT 
      },
    );

    res.json({
      total: parseInt(total[0].total),
      byRole: stats,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des statistiques",
      error: error.message,
    });
  }
};
