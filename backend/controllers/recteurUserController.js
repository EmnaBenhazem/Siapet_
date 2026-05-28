const { sequelize } = require("../models");

// Récupérer tous les utilisateurs du rectorat du recteur connecté
exports.getRecteurUsers = async (req, res) => {
  try {
    const recteurId = req.user.numero_utilisateur;
    const {
      role,
      statut,
      etablissement,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    console.log("Recteur ID:", recteurId);
    console.log("Filtres reçus:", { role, statut, search, etablissement });

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
        message: "Rectorat non trouvé pour ce recteur",
      });
    }

    const idRectorat = recteurInfo[0].id_rectorat;
    console.log("ID Rectorat:", idRectorat);

    // Construction de la requête SQL avec filtres
    let whereConditions = [`rec.id_rectorat = $1`];
    let params = [idRectorat];
    let paramIndex = 2;

    // Exclure les recteurs et admins de la liste
    whereConditions.push(`u.type_utilisateur IN ('DIRECTEUR', 'ENSEIGNANT', 'ETUDIANT')`);

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

    // Filtre par établissement
    if (etablissement && etablissement !== "") {
      whereConditions.push(`e.id_etablissement = $${paramIndex}`);
      params.push(etablissement);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    // Requête pour compter le total
    const countQuery = `
      SELECT COUNT(DISTINCT u.numero_utilisateur) as total
      FROM utilisateur u
      LEFT JOIN etudiant et ON u.numero_utilisateur = et.numero_utilisateur
      LEFT JOIN enseignant ens ON u.numero_utilisateur = ens.numero_utilisateur
      LEFT JOIN directeur_etablissement de ON u.numero_utilisateur = de.numero_utilisateur
      LEFT JOIN etablissement e ON COALESCE(de.id_etablissement, ens.id_etablissement_principal, et.id_etablissement) = e.id_etablissement
      LEFT JOIN rectorat rec ON e.id_rectorat = rec.id_rectorat
      ${whereClause}
    `;

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
      LEFT JOIN directeur_etablissement de ON u.numero_utilisateur = de.numero_utilisateur
      LEFT JOIN etablissement e ON COALESCE(de.id_etablissement, ens.id_etablissement_principal, et.id_etablissement) = e.id_etablissement
      LEFT JOIN ville v ON e.id_ville = v.id_ville
      LEFT JOIN region r ON v.id_region = r.id_region
      LEFT JOIN rectorat rec ON e.id_rectorat = rec.id_rectorat
      ${whereClause}
      ORDER BY u.date_creation DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(parseInt(limit), offset);

    const users = await sequelize.query(query, {
      bind: params,
      type: sequelize.QueryTypes.SELECT,
    });

    console.log(`Trouvé ${users.length} utilisateurs sur ${total} total`);

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
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des utilisateurs",
      error: error.message,
    });
  }
};

// Récupérer les options de filtrage pour le recteur
exports.getRecteurFilterOptions = async (req, res) => {
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
        message: "Rectorat non trouvé pour ce recteur",
      });
    }

    const idRectorat = recteurInfo[0].id_rectorat;

    // Récupérer les établissements du rectorat
    const etablissements = await sequelize.query(
      "SELECT id_etablissement, nom_etablissement FROM etablissement WHERE id_rectorat = $1 ORDER BY nom_etablissement",
      { 
        bind: [idRectorat],
        type: sequelize.QueryTypes.SELECT 
      },
    );

    // Types de rôles (sans RECTEUR et ADMIN_MESRS)
    const roles = [
      { value: "DIRECTEUR", label: "Directeur" },
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
      etablissements,
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

// Statistiques des utilisateurs du recteur
exports.getRecteurUserStats = async (req, res) => {
  try {
    const recteurId = req.user.numero_utilisateur;
    console.log('Getting stats for recteur:', recteurId);

    // Récupérer le rectorat du recteur connecté
    const recteurInfo = await sequelize.query(
      `SELECT r.id_rectorat, rec.nom_rectorat 
       FROM recteur_universite r
       LEFT JOIN rectorat rec ON r.id_rectorat = rec.id_rectorat
       WHERE r.numero_utilisateur = $1`,
      {
        bind: [recteurId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (recteurInfo.length === 0) {
      console.log('No rectorat found for recteur:', recteurId);
      return res.status(404).json({
        message: "Rectorat non trouvé pour ce recteur",
      });
    }

    const idRectorat = recteurInfo[0].id_rectorat;
    const nomRectorat = recteurInfo[0].nom_rectorat;
    console.log('Rectorat ID:', idRectorat, 'Nom:', nomRectorat);

    // Statistiques par type d'utilisateur
    // Utilisation de JOIN direct avec etablissement pour plus d'efficacité
    const stats = await sequelize.query(
      `
      -- Étudiants
      SELECT 
        'ETUDIANT' as type_utilisateur,
        COUNT(DISTINCT u.numero_utilisateur) as count,
        COUNT(DISTINCT CASE WHEN u.statut = 'ACTIF' THEN u.numero_utilisateur END) as actifs,
        COUNT(DISTINCT CASE WHEN u.statut = 'INACTIF' THEN u.numero_utilisateur END) as inactifs,
        COUNT(DISTINCT CASE WHEN u.statut = 'SUSPENDU' THEN u.numero_utilisateur END) as suspendus
      FROM utilisateur u
      INNER JOIN etudiant et ON u.numero_utilisateur = et.numero_utilisateur
      INNER JOIN etablissement e ON et.id_etablissement = e.id_etablissement
      WHERE e.id_rectorat = $1
        AND u.type_utilisateur = 'ETUDIANT'
      
      UNION ALL
      
      -- Enseignants
      SELECT 
        'ENSEIGNANT' as type_utilisateur,
        COUNT(DISTINCT u.numero_utilisateur) as count,
        COUNT(DISTINCT CASE WHEN u.statut = 'ACTIF' THEN u.numero_utilisateur END) as actifs,
        COUNT(DISTINCT CASE WHEN u.statut = 'INACTIF' THEN u.numero_utilisateur END) as inactifs,
        COUNT(DISTINCT CASE WHEN u.statut = 'SUSPENDU' THEN u.numero_utilisateur END) as suspendus
      FROM utilisateur u
      INNER JOIN enseignant ens ON u.numero_utilisateur = ens.numero_utilisateur
      INNER JOIN etablissement e ON ens.id_etablissement_principal = e.id_etablissement
      WHERE e.id_rectorat = $1
        AND u.type_utilisateur = 'ENSEIGNANT'
      
      UNION ALL
      
      -- Directeurs
      SELECT 
        'DIRECTEUR' as type_utilisateur,
        COUNT(DISTINCT u.numero_utilisateur) as count,
        COUNT(DISTINCT CASE WHEN u.statut = 'ACTIF' THEN u.numero_utilisateur END) as actifs,
        COUNT(DISTINCT CASE WHEN u.statut = 'INACTIF' THEN u.numero_utilisateur END) as inactifs,
        COUNT(DISTINCT CASE WHEN u.statut = 'SUSPENDU' THEN u.numero_utilisateur END) as suspendus
      FROM utilisateur u
      INNER JOIN directeur_etablissement de ON u.numero_utilisateur = de.numero_utilisateur
      INNER JOIN etablissement e ON de.id_etablissement = e.id_etablissement
      WHERE e.id_rectorat = $1
        AND u.type_utilisateur = 'DIRECTEUR'
    `,
      { 
        bind: [idRectorat],
        type: sequelize.QueryTypes.SELECT 
      },
    );

    console.log('Stats by role:', stats);

    // Total des utilisateurs (tous types confondus)
    const total = await sequelize.query(
      `
      SELECT COUNT(DISTINCT u.numero_utilisateur) as total
      FROM utilisateur u
      WHERE u.numero_utilisateur IN (
        -- Étudiants du rectorat
        SELECT et.numero_utilisateur 
        FROM etudiant et 
        INNER JOIN etablissement e ON et.id_etablissement = e.id_etablissement 
        WHERE e.id_rectorat = $1
        
        UNION
        
        -- Enseignants du rectorat
        SELECT ens.numero_utilisateur 
        FROM enseignant ens 
        INNER JOIN etablissement e ON ens.id_etablissement_principal = e.id_etablissement 
        WHERE e.id_rectorat = $1
        
        UNION
        
        -- Directeurs du rectorat
        SELECT de.numero_utilisateur 
        FROM directeur_etablissement de 
        INNER JOIN etablissement e ON de.id_etablissement = e.id_etablissement 
        WHERE e.id_rectorat = $1
      )
      `,
      { 
        bind: [idRectorat],
        type: sequelize.QueryTypes.SELECT 
      },
    );

    console.log('Total users:', total[0].total);

    res.json({
      total: parseInt(total[0].total) || 0,
      byRole: stats,
      rectorat: {
        id: idRectorat,
        nom: nomRectorat
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des statistiques",
      error: error.message,
    });
  }
};
