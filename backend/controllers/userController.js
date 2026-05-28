const { sequelize } = require("../models");
const User = require("../models/User");
const Etudiant = require("../models/Etudiant");
const Enseignant = require("../models/Enseignant");
const auditService = require("../services/auditService");
const { secureAction } = require("../services/archiveService");
const { verifyAdminPassword } = require("../services/adminAuthService");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// Récupérer tous les utilisateurs avec filtres
exports.getAllUsers = async (req, res) => {
  try {
    const {
      role,
      statut,
      universite,
      region,
      ville,
      etablissement,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    console.log("Filtres reçus:", {
      role,
      statut,
      search,
      region,
      ville,
      etablissement,
      universite,
    });

    // Construction de la requête SQL avec filtres
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

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

    // Filtre par région (pour les étudiants)
    if (region && region !== "") {
      whereConditions.push(`v.id_region = $${paramIndex}`);
      params.push(region);
      paramIndex++;
    }

    // Filtre par ville (pour les étudiants)
    if (ville && ville !== "") {
      whereConditions.push(`et.id_ville = $${paramIndex}`);
      params.push(ville);
      paramIndex++;
    }

    // Filtre par établissement
    if (etablissement && etablissement !== "") {
      whereConditions.push(`e.id_etablissement = $${paramIndex}`);
      params.push(etablissement);
      paramIndex++;
    }

    // Filtre par université (rectorat)
    if (universite && universite !== "") {
      whereConditions.push(`rec.id_rectorat = $${paramIndex}`);
      params.push(universite);
      paramIndex++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")} AND u.statut != 'INACTIF'`
        : "WHERE u.statut != 'INACTIF'";

    // Requête pour compter le total
    const countQuery = `
      SELECT COUNT(DISTINCT u.numero_utilisateur) as total
      FROM utilisateur u
      LEFT JOIN etudiant et ON u.numero_utilisateur = et.numero_utilisateur
      LEFT JOIN enseignant ens ON u.numero_utilisateur = ens.numero_utilisateur
      LEFT JOIN directeur_etablissement de ON u.numero_utilisateur = de.numero_utilisateur
      LEFT JOIN ville v ON et.id_ville = v.id_ville
      LEFT JOIN region r ON v.id_region = r.id_region
      LEFT JOIN etablissement e ON COALESCE(de.id_etablissement, ens.id_etablissement_principal) = e.id_etablissement
      LEFT JOIN ville v_etab ON e.id_ville = v_etab.id_ville
      LEFT JOIN region r_etab ON v_etab.id_region = r_etab.id_region
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
        COALESCE(v.nom_ville, v_etab.nom_ville) as nom_ville,
        COALESCE(r.nom_region, r_etab.nom_region) as nom_region,
        e.nom_etablissement,
        rec.nom_rectorat
      FROM utilisateur u
      LEFT JOIN etudiant et ON u.numero_utilisateur = et.numero_utilisateur
      LEFT JOIN enseignant ens ON u.numero_utilisateur = ens.numero_utilisateur
      LEFT JOIN directeur_etablissement de ON u.numero_utilisateur = de.numero_utilisateur
      LEFT JOIN ville v ON et.id_ville = v.id_ville
      LEFT JOIN region r ON v.id_region = r.id_region
      LEFT JOIN etablissement e ON COALESCE(de.id_etablissement, ens.id_etablissement_principal) = e.id_etablissement
      LEFT JOIN ville v_etab ON e.id_ville = v_etab.id_ville
      LEFT JOIN region r_etab ON v_etab.id_region = r_etab.id_region
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
    console.log("Premier utilisateur:", users[0]);

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

// Récupérer les options de filtrage
exports.getFilterOptions = async (req, res) => {
  try {
    // Récupérer les régions
    const regions = await sequelize.query(
      "SELECT id_region, nom_region FROM region ORDER BY nom_region",
      { type: sequelize.QueryTypes.SELECT },
    );

    // Récupérer les villes
    const villes = await sequelize.query(
      "SELECT id_ville, nom_ville, id_region FROM ville ORDER BY nom_ville",
      { type: sequelize.QueryTypes.SELECT },
    );

    // Récupérer les universités (rectorats)
    const universites = await sequelize.query(
      "SELECT id_rectorat, nom_rectorat, type FROM rectorat ORDER BY nom_rectorat",
      { type: sequelize.QueryTypes.SELECT },
    );

    // Récupérer les établissements
    const etablissements = await sequelize.query(
      "SELECT id_etablissement, nom_etablissement, id_rectorat FROM etablissement ORDER BY nom_etablissement",
      { type: sequelize.QueryTypes.SELECT },
    );

    // Types de rôles
    const roles = [
      { value: "ADMIN_MESRS", label: "Administrateur MESRS" },
      { value: "RECTEUR", label: "Recteur" },
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
      regions,
      villes,
      universites,
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

// Statistiques des utilisateurs
exports.getUserStats = async (req, res) => {
  try {
    const stats = await sequelize.query(
      `
      SELECT 
        type_utilisateur,
        COUNT(*) as count,
        COUNT(CASE WHEN statut = 'ACTIF' THEN 1 END) as actifs,
        COUNT(CASE WHEN statut = 'INACTIF' THEN 1 END) as inactifs,
        COUNT(CASE WHEN statut = 'SUSPENDU' THEN 1 END) as suspendus
      FROM utilisateur
      GROUP BY type_utilisateur
    `,
      { type: sequelize.QueryTypes.SELECT },
    );

    const total = await sequelize.query(
      "SELECT COUNT(*) as total FROM utilisateur",
      { type: sequelize.QueryTypes.SELECT },
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

// Créer un utilisateur (générique)
exports.createUser = async (req, res) => {
  try {
    console.log("📝 Création d'utilisateur - Body reçu:", req.body);

    const {
      type_utilisateur,
      email,
      nom,
      prenom,
      telephone,
      id_etablissement,
      id_rectorat,
      adminPassword,
    } = req.body;

    try {
      await verifyAdminPassword(req.user.numero_utilisateur, adminPassword);
    } catch (authErr) {
      return res.status(authErr.status || 403).json({ message: authErr.message });
    }

    console.log("📝 Données extraites:", {
      type_utilisateur,
      email,
      nom,
      prenom,
      telephone,
      id_etablissement,
      id_rectorat,
    });

    // Vérifier si l'email existe déjà
    const existing = await sequelize.query(
      "SELECT numero_utilisateur FROM utilisateur WHERE email = $1",
      {
        bind: [email],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // Générer un mot de passe temporaire
    const tempPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Générer un numéro d'utilisateur unique
    const userNum = `USR-${type_utilisateur.substring(0, 3)}-${Date.now()}`;

    console.log("📝 Insertion de l'utilisateur dans la base...");
    console.log("📝 Numéro utilisateur généré:", userNum);

    // Insérer le nouvel utilisateur
    const result = await sequelize.query(
      `INSERT INTO utilisateur (numero_utilisateur, email, mot_de_passe, nom, prenom, telephone, type_utilisateur, statut, date_creation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIF', NOW())
       RETURNING numero_utilisateur, email, nom, prenom, telephone, type_utilisateur, statut`,
      {
        bind: [
          userNum,
          email,
          hashedPassword,
          nom,
          prenom,
          telephone,
          type_utilisateur,
        ],
        type: sequelize.QueryTypes.INSERT,
      },
    );

    console.log(
      "📝 Résultat brut de l'insertion:",
      JSON.stringify(result, null, 2),
    );

    const newUser = result[0] && result[0][0] ? result[0][0] : result[0];
    console.log("✅ Utilisateur créé:", newUser);

    if (!newUser || !newUser.numero_utilisateur) {
      throw new Error(
        "Échec de la création de l'utilisateur - pas de numero_utilisateur retourné",
      );
    }

    // Créer l'entrée spécifique selon le type
    if (type_utilisateur === "DIRECTEUR" && id_etablissement) {
      console.log("📝 Création de l'entrée directeur_etablissement...");
      const dirNum = `DIR${Date.now()}`;
      await sequelize.query(
        `INSERT INTO directeur_etablissement (numero_utilisateur, numero_directeur, id_etablissement, date_nomination, mandat_debut, mandat_fin)
         VALUES ($1, $2, $3, NOW(), NOW(), NOW() + INTERVAL '4 years')`,
        {
          bind: [newUser.numero_utilisateur, dirNum, id_etablissement],
          type: sequelize.QueryTypes.INSERT,
        },
      );
      console.log("✅ Entrée directeur_etablissement créée");
    } else if (type_utilisateur === "RECTEUR" && id_rectorat) {
      console.log("📝 Création de l'entrée recteur_universite...");
      const rectNum = `RECT${Date.now()}`;
      await sequelize.query(
        `INSERT INTO recteur_universite (numero_utilisateur, numero_recteur, id_rectorat, date_nomination, mandat_debut, mandat_fin)
         VALUES ($1, $2, $3, NOW(), NOW(), NOW() + INTERVAL '4 years')`,
        {
          bind: [newUser.numero_utilisateur, rectNum, id_rectorat],
          type: sequelize.QueryTypes.INSERT,
        },
      );
      console.log("✅ Entrée recteur_universite créée");
    }

    res.status(201).json({
      message: `Compte ${type_utilisateur.toLowerCase()} créé avec succès`,
      user: newUser,
      tempPassword,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'utilisateur:", error);
    console.error("❌ Stack:", error.stack);
    res.status(500).json({
      message: "Erreur lors de la création de l'utilisateur",
      error: error.message,
    });
  }
};

// Créer un compte Admin
exports.createAdmin = async (req, res) => {
  try {
    const { email, nom, prenom, telephone } = req.body;

    // Vérifier si l'email existe déjà
    const existing = await sequelize.query(
      "SELECT numero_utilisateur FROM utilisateur WHERE email = $1",
      {
        bind: [email],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // Générer un mot de passe temporaire
    const tempPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Insérer le nouvel admin
    const result = await sequelize.query(
      `INSERT INTO utilisateur (email, mot_de_passe, nom, prenom, telephone, type_utilisateur, statut)
       VALUES ($1, $2, $3, $4, $5, 'ADMIN_MESRS', 'ACTIF')
       RETURNING numero_utilisateur, email, nom, prenom, telephone, type_utilisateur, statut`,
      {
        bind: [email, hashedPassword, nom, prenom, telephone],
        type: sequelize.QueryTypes.INSERT,
      },
    );

    res.status(201).json({
      message: "Compte administrateur créé avec succès",
      user: result[0][0],
      tempPassword,
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'admin:", error);
    res.status(500).json({
      message: "Erreur lors de la création de l'admin",
      error: error.message,
    });
  }
};

// Créer un compte Directeur
exports.createDirecteur = async (req, res) => {
  try {
    const { email, nom, prenom, telephone, id_etablissement } = req.body;

    // Vérifier si l'email existe déjà
    const existing = await sequelize.query(
      "SELECT numero_utilisateur FROM utilisateur WHERE email = $1",
      {
        bind: [email],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // Générer un mot de passe temporaire
    const tempPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Insérer le nouveau directeur
    const result = await sequelize.query(
      `INSERT INTO utilisateur (email, mot_de_passe, nom, prenom, telephone, type_utilisateur, statut)
       VALUES ($1, $2, $3, $4, $5, 'DIRECTEUR', 'ACTIF')
       RETURNING numero_utilisateur, email, nom, prenom, telephone, type_utilisateur, statut`,
      {
        bind: [email, hashedPassword, nom, prenom, telephone],
        type: sequelize.QueryTypes.INSERT,
      },
    );

    // Créer l'entrée directeur si id_etablissement est fourni
    if (id_etablissement) {
      // Générer un numéro de directeur
      const dirNum = `DIR${Date.now()}`;

      await sequelize.query(
        `INSERT INTO directeur_etablissement (numero_utilisateur, numero_directeur, id_etablissement, date_nomination, mandat_debut, mandat_fin)
         VALUES ($1, $2, $3, NOW(), NOW(), NOW() + INTERVAL '4 years')`,
        {
          bind: [result[0][0].numero_utilisateur, dirNum, id_etablissement],
          type: sequelize.QueryTypes.INSERT,
        },
      );
    }

    res.status(201).json({
      message: "Compte directeur créé avec succès",
      user: result[0][0],
      tempPassword,
    });
  } catch (error) {
    console.error("Erreur lors de la création du directeur:", error);
    res.status(500).json({
      message: "Erreur lors de la création du directeur",
      error: error.message,
    });
  }
};

// Modifier un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, nom, prenom, telephone, id_etablissement, id_rectorat, adminPassword } =
      req.body;

    try {
      await verifyAdminPassword(req.user.numero_utilisateur, adminPassword);
    } catch (authErr) {
      return res.status(authErr.status || 403).json({ message: authErr.message });
    }

    console.log("📝 Modification utilisateur:", {
      id,
      email,
      nom,
      prenom,
      telephone,
      id_etablissement,
      id_rectorat,
    });

    // Vérifier si l'utilisateur existe et récupérer son type
    const user = await sequelize.query(
      "SELECT numero_utilisateur, email, type_utilisateur FROM utilisateur WHERE numero_utilisateur = $1",
      {
        bind: [id],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (user.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const userType = user[0].type_utilisateur;

    // Vérifier si le nouvel email est déjà utilisé
    if (email && email !== user[0].email) {
      const existing = await sequelize.query(
        "SELECT numero_utilisateur FROM utilisateur WHERE email = $1",
        {
          bind: [email],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (existing.length > 0) {
        return res.status(400).json({ message: "Email déjà utilisé" });
      }
    }

    // Mettre à jour l'utilisateur
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (email) {
      updates.push(`email = $${paramIndex}`);
      params.push(email);
      paramIndex++;
    }
    if (nom) {
      updates.push(`nom = $${paramIndex}`);
      params.push(nom);
      paramIndex++;
    }
    if (prenom) {
      updates.push(`prenom = $${paramIndex}`);
      params.push(prenom);
      paramIndex++;
    }
    if (telephone) {
      updates.push(`telephone = $${paramIndex}`);
      params.push(telephone);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "Aucune modification fournie" });
    }

    params.push(id);
    const query = `
      UPDATE utilisateur 
      SET ${updates.join(", ")}
      WHERE numero_utilisateur = $${paramIndex}
      RETURNING numero_utilisateur, email, nom, prenom, telephone, type_utilisateur, statut
    `;

    const result = await sequelize.query(query, {
      bind: params,
      type: sequelize.QueryTypes.UPDATE,
    });

    // Mettre à jour l'établissement pour les directeurs
    if (userType === "DIRECTEUR" && id_etablissement !== undefined) {
      console.log("📝 Mise à jour de l'établissement du directeur");

      const existingDir = await sequelize.query(
        "SELECT numero_utilisateur FROM directeur_etablissement WHERE numero_utilisateur = $1",
        {
          bind: [id],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (existingDir.length > 0) {
        await sequelize.query(
          "UPDATE directeur_etablissement SET id_etablissement = $1 WHERE numero_utilisateur = $2",
          {
            bind: [id_etablissement, id],
            type: sequelize.QueryTypes.UPDATE,
          },
        );
      } else if (id_etablissement) {
        const dirNum = `DIR${Date.now()}`;
        await sequelize.query(
          `INSERT INTO directeur_etablissement (numero_utilisateur, numero_directeur, id_etablissement, date_nomination, mandat_debut, mandat_fin)
           VALUES ($1, $2, $3, NOW(), NOW(), NOW() + INTERVAL '4 years')`,
          {
            bind: [id, dirNum, id_etablissement],
            type: sequelize.QueryTypes.INSERT,
          },
        );
      }
    }

    // Mettre à jour le rectorat pour les recteurs
    if (userType === "RECTEUR" && id_rectorat !== undefined) {
      console.log("📝 Mise à jour du rectorat du recteur");

      const existingRect = await sequelize.query(
        "SELECT numero_utilisateur FROM recteur_universite WHERE numero_utilisateur = $1",
        {
          bind: [id],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (existingRect.length > 0) {
        await sequelize.query(
          "UPDATE recteur_universite SET id_rectorat = $1 WHERE numero_utilisateur = $2",
          {
            bind: [id_rectorat, id],
            type: sequelize.QueryTypes.UPDATE,
          },
        );
      } else if (id_rectorat) {
        const rectNum = `RECT${Date.now()}`;
        await sequelize.query(
          `INSERT INTO recteur_universite (numero_utilisateur, numero_recteur, id_rectorat, date_nomination, mandat_debut, mandat_fin)
           VALUES ($1, $2, $3, NOW(), NOW(), NOW() + INTERVAL '4 years')`,
          {
            bind: [id, rectNum, id_rectorat],
            type: sequelize.QueryTypes.INSERT,
          },
        );
      }
    }

    // Mettre à jour l'établissement pour les enseignants
    if (userType === "ENSEIGNANT" && id_etablissement !== undefined) {
      console.log("📝 Mise à jour de l'établissement de l'enseignant");
      await sequelize.query(
        "UPDATE enseignant SET id_etablissement_principal = $1 WHERE numero_utilisateur = $2",
        {
          bind: [id_etablissement, id],
          type: sequelize.QueryTypes.UPDATE,
        },
      );
    }

    res.json({
      message: "Utilisateur modifié avec succès",
      user: result[0][0],
    });
  } catch (error) {
    console.error("Erreur lors de la modification de l'utilisateur:", error);
    res.status(500).json({
      message: "Erreur lors de la modification de l'utilisateur",
      error: error.message,
    });
  }
};

// Activer/Désactiver un utilisateur
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const acteurId = req.user.numero_utilisateur;

    // Récupérer le statut actuel
    const user = await sequelize.query(
      "SELECT numero_utilisateur, statut, nom, prenom FROM utilisateur WHERE numero_utilisateur = $1",
      {
        bind: [id],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (user.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Basculer le statut
    const newStatus = user[0].statut === "ACTIF" ? "SUSPENDU" : "ACTIF";

    // Vérification du mot de passe admin pour toute modification de statut
    const { adminPassword } = req.body;
    try {
      await verifyAdminPassword(acteurId, adminPassword);
    } catch (authErr) {
      return res.status(authErr.status || 403).json({ message: authErr.message });
    }

    await sequelize.query(
      "UPDATE utilisateur SET statut = $1 WHERE numero_utilisateur = $2",
      {
        bind: [newStatus, id],
        type: sequelize.QueryTypes.UPDATE,
      },
    );

    // Enregistrer dans l'audit
    await auditService.logAction(
      id,
      acteurId,
      newStatus === "ACTIF" ? "ACTIVATION" : "SUSPENSION",
      {
        ancien_statut: user[0].statut,
        nouveau_statut: newStatus,
        nom: user[0].nom,
        prenom: user[0].prenom,
      },
    );

    res.json({
      message: `Utilisateur ${newStatus === "ACTIF" ? "activé" : "suspendu"} avec succès`,
      user: {
        ...user[0],
        statut: newStatus,
      },
    });
  } catch (error) {
    console.error("Erreur lors du changement de statut:", error);
    res.status(500).json({
      message: "Erreur lors du changement de statut",
      error: error.message,
    });
  }
};

// Archiver un utilisateur
exports.archiveUser = async (req, res) => {
  await secureAction({
    req, res, entityType: 'utilisateur', action: 'archive',
    worker: async (t) => {
      const { id } = req.params;
      const [user] = await sequelize.query(
        `SELECT numero_utilisateur, nom, prenom, statut FROM utilisateur WHERE numero_utilisateur = :id`,
        { replacements: { id }, type: sequelize.QueryTypes.SELECT, transaction: t }
      );
      if (!user) return null;

      // Empêcher l'auto-archivage
      const actor = req.user?.numero_utilisateur;
      if (id === actor) {
        const err = new Error('Vous ne pouvez pas archiver votre propre compte');
        err.statusCode = 400;
        throw err;
      }

      await sequelize.query(
        `UPDATE utilisateur SET statut = 'INACTIF' WHERE numero_utilisateur = :id`,
        { replacements: { id }, type: sequelize.QueryTypes.UPDATE, transaction: t }
      );

      return {
        entity: { id: user.numero_utilisateur, nom: `${user.prenom} ${user.nom}`.trim() },
        message: `Utilisateur ${user.nom} ${user.prenom} archivé avec succès`,
      };
    },
  });
};

// Récupérer les utilisateurs archivés
exports.getArchivedUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;

    let whereConditions = ["u.statut = 'INACTIF'"];
    let params = [];
    let paramIndex = 1;

    // Filtre par rôle
    if (role && role !== "") {
      whereConditions.push(`u.type_utilisateur = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    if (search && search.trim() !== "") {
      whereConditions.push(
        `(LOWER(u.nom) LIKE LOWER($${paramIndex}) OR LOWER(u.prenom) LIKE LOWER($${paramIndex}) OR LOWER(u.email) LIKE LOWER($${paramIndex}) OR u.telephone LIKE $${paramIndex})`,
      );
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM utilisateur u
      ${whereClause}
    `;

    const countResult = await sequelize.query(countQuery, {
      bind: params,
      type: sequelize.QueryTypes.SELECT,
    });

    const total = parseInt(countResult[0].total);
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        u.numero_utilisateur,
        u.nom,
        u.prenom,
        u.email,
        u.telephone,
        u.type_utilisateur,
        u.date_creation
      FROM utilisateur u
      ${whereClause}
      ORDER BY u.date_creation DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(parseInt(limit), offset);

    const users = await sequelize.query(query, {
      bind: params,
      type: sequelize.QueryTypes.SELECT,
    });

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
    console.error(
      "Erreur lors de la récupération des utilisateurs archivés:",
      error,
    );
    res.status(500).json({
      message: "Erreur lors de la récupération des utilisateurs archivés",
      error: error.message,
    });
  }
};

// Restaurer un utilisateur archivé
exports.restoreUser = async (req, res) => {
  await secureAction({
    req, res, entityType: 'utilisateur', action: 'restore',
    worker: async (t) => {
      const { id } = req.params;
      const [user] = await sequelize.query(
        `SELECT numero_utilisateur, nom, prenom, statut FROM utilisateur WHERE numero_utilisateur = :id`,
        { replacements: { id }, type: sequelize.QueryTypes.SELECT, transaction: t }
      );
      if (!user) return null;

      await sequelize.query(
        `UPDATE utilisateur SET statut = 'ACTIF' WHERE numero_utilisateur = :id`,
        { replacements: { id }, type: sequelize.QueryTypes.UPDATE, transaction: t }
      );

      return {
        entity: { id: user.numero_utilisateur, nom: `${user.prenom} ${user.nom}`.trim() },
        message: `Utilisateur ${user.nom} ${user.prenom} restauré avec succès`,
      };
    },
  });
};

// GET /:id/archive-log — tracing pour un utilisateur archivé
exports.getUserArchiveLog = async (req, res) => {
  try {
    const { id } = req.params;
    const [log] = await sequelize.query(
      `SELECT al.*, u.nom AS archived_by_nom, u.prenom AS archived_by_prenom, u.email AS archived_by_email
       FROM archive_log al
       LEFT JOIN utilisateur u ON u.numero_utilisateur = al.performed_by
       WHERE al.entity_type = 'utilisateur'
         AND al.entity_id = :id
         AND al.action = 'archive'
       ORDER BY al.performed_at DESC LIMIT 1`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT }
    );
    res.json({ success: true, log: log || null });
  } catch (error) {
    console.error('Erreur getUserArchiveLog:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// Note: La fonction updateUser a été modifiée pour supporter la modification de l'établissement
