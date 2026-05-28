const { Etablissement } = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const { logAction } = require("../services/auditService");
const { secureAction } = require("../services/archiveService");
const { verifyAdminPassword } = require("../services/adminAuthService");

// Lister les établissements avec filtres et pagination
exports.getEtablissements = async (req, res) => {
  try {
    const {
      search,
      type,
      id_rectorat,
      page = 1,
      limit = 10,
      archived = false,
    } = req.query;

    const where = {};

    // Filtrer par statut archivé
    if (archived === "true") {
      where.archive = true;
    } else {
      where.archive = false;
    }

    if (type) where.type = type;
    if (id_rectorat) where.id_rectorat = id_rectorat;

    if (search) {
      where[Op.or] = [
        { nom_etablissement: { [Op.iLike]: `%${search}%` } },
        { code_etablissement: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const etablissements = await Etablissement.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [["nom_etablissement", "ASC"]],
    });

    res.json({
      success: true,
      etablissements: etablissements.rows,
      total: etablissements.count,
      page: parseInt(page),
      totalPages: Math.ceil(etablissements.count / limit),
    });
  } catch (error) {
    console.error("Erreur getEtablissements:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// Obtenir le détail d'un établissement
exports.getEtablissementById = async (req, res) => {
  try {
    const { id } = req.params;

    const [etablissement] = await sequelize.query(
      `
      SELECT 
        e.*,
        r.nom_rectorat as universite_nom,
        v.nom_ville,
        (SELECT COUNT(DISTINCT a.numero_utilisateur) 
         FROM affectation a 
         WHERE a.id_etablissement = e.id_etablissement AND a.statut = 'ACTIVE') as nombre_enseignants,
        (SELECT COUNT(DISTINCT d.id_departement) 
         FROM departement d 
         WHERE d.id_etablissement = e.id_etablissement) as nombre_departements,
        (SELECT COUNT(DISTINCT s.id_specialite) 
         FROM specialite s 
         INNER JOIN niveau n ON s.id_niveau = n.id_niveau 
         INNER JOIN departement d ON n.id_departement = d.id_departement 
         WHERE d.id_etablissement = e.id_etablissement) as nombre_specialites
      FROM etablissement e
      LEFT JOIN rectorat r ON e.id_rectorat = r.id_rectorat
      LEFT JOIN ville v ON e.id_ville = v.id_ville
      WHERE e.id_etablissement = :id
    `,
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (!etablissement) {
      return res
        .status(404)
        .json({ success: false, message: "Établissement non trouvé" });
    }

    res.json({ success: true, etablissement });
  } catch (error) {
    console.error("Erreur getEtablissementById:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// Créer un établissement
exports.createEtablissement = async (req, res) => {
  try {
    const {
      code_etablissement,
      nom_etablissement,
      type,
      id_rectorat,
      id_ville,
      adresse,
      telephone,
      email,
      site_web,
      budget_alloue,
      capacite_maximale,
      date_creation,
      annee_creation,
      effectif_total,
      adminPassword,
    } = req.body;

    try {
      await verifyAdminPassword(req.user.numero_utilisateur, adminPassword);
    } catch (authErr) {
      return res.status(authErr.status || 403).json({ success: false, message: authErr.message });
    }

    // Vérifier si le code existe déjà
    const existing = await Etablissement.findOne({
      where: { code_etablissement },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Un établissement avec ce code existe déjà",
      });
    }

    const resolvedDate = date_creation
      || (annee_creation ? `${annee_creation}-01-01` : null)
      || new Date();

    const effectif = Number(effectif_total) || 0;
    const capacite = Number(capacite_maximale) || 0;

    const etablissement = await Etablissement.create({
      code_etablissement,
      nom_etablissement,
      type,
      id_rectorat: id_rectorat || null,
      id_ville: id_ville || null,
      adresse,
      telephone,
      email,
      site_web,
      budget_alloue,
      capacite_maximale: capacite,
      date_creation: resolvedDate,
      effectif_total: effectif,
      taux_occupation: capacite > 0 ? Math.round((effectif / capacite) * 10000) / 100 : 0,
    });

    // Log de l'action
    await logAction(
      req.user.id,
      "CREATE_ETABLISSEMENT",
      "Etablissement",
      etablissement.id_etablissement,
      { nom: nom_etablissement, code: code_etablissement },
    );

    res.status(201).json({
      success: true,
      message: "Établissement créé avec succès",
      etablissement,
    });
  } catch (error) {
    console.error("Erreur createEtablissement:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// Modifier un établissement
exports.updateEtablissement = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nom_etablissement,
      type,
      id_rectorat,
      id_ville,
      adresse,
      telephone,
      email,
      site_web,
      budget_alloue,
      capacite_maximale,
      effectif_total,
      annee_creation,
      date_creation,
      adminPassword,
    } = req.body;

    try {
      await verifyAdminPassword(req.user.numero_utilisateur, adminPassword);
    } catch (authErr) {
      return res.status(authErr.status || 403).json({ success: false, message: authErr.message });
    }

    const etablissement = await Etablissement.findByPk(id);
    if (!etablissement) {
      return res
        .status(404)
        .json({ success: false, message: "Établissement non trouvé" });
    }

    const oldData = { ...etablissement.toJSON() };

    // On ne met à jour que les champs explicitement fournis (autorise mise à jour partielle)
    const patch = {};
    if (nom_etablissement !== undefined) patch.nom_etablissement = nom_etablissement;
    if (type !== undefined)              patch.type = type;
    if (id_rectorat !== undefined && id_rectorat !== '') patch.id_rectorat = id_rectorat;
    if (id_ville !== undefined && id_ville !== '')       patch.id_ville = id_ville;
    if (adresse !== undefined)           patch.adresse = adresse;
    if (telephone !== undefined)         patch.telephone = telephone;
    if (email !== undefined)             patch.email = email;
    if (site_web !== undefined)          patch.site_web = site_web;
    if (budget_alloue !== undefined)     patch.budget_alloue = budget_alloue;
    if (capacite_maximale !== undefined) patch.capacite_maximale = Number(capacite_maximale) || 0;
    if (effectif_total !== undefined)    patch.effectif_total = Number(effectif_total) || 0;
    if (date_creation)                   patch.date_creation = date_creation;
    else if (annee_creation)             patch.date_creation = `${annee_creation}-01-01`;

    // Recalcul du taux d'occupation si capacité ou effectif fournis
    const newCap = patch.capacite_maximale ?? etablissement.capacite_maximale ?? 0;
    const newEff = patch.effectif_total    ?? etablissement.effectif_total    ?? 0;
    if (newCap > 0) patch.taux_occupation = Math.round((newEff / newCap) * 10000) / 100;

    await etablissement.update(patch);

    // Log de l'action
    await logAction(
      req.user.id,
      "UPDATE_ETABLISSEMENT",
      "Etablissement",
      etablissement.id_etablissement,
      { old: oldData, new: etablissement.toJSON() },
    );

    res.json({
      success: true,
      message: "Établissement modifié avec succès",
      etablissement,
    });
  } catch (error) {
    console.error("Erreur updateEtablissement:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// Archiver un établissement (soft delete) — password + log
exports.archiveEtablissement = async (req, res) => {
  await secureAction({
    req, res, entityType: 'etablissement', action: 'archive',
    worker: async (t) => {
      const { id } = req.params;
      const etab = await Etablissement.findByPk(id, { transaction: t });
      if (!etab) return null;
      await etab.update({ archive: true }, { transaction: t });
      return {
        entity: { id: etab.id_etablissement, nom: etab.nom_etablissement },
        message: 'Établissement archivé avec succès',
      };
    },
  });
};

// Restaurer un établissement archivé — password + log
exports.restoreEtablissement = async (req, res) => {
  await secureAction({
    req, res, entityType: 'etablissement', action: 'restore',
    worker: async (t) => {
      const { id } = req.params;
      const etab = await Etablissement.findByPk(id, { transaction: t });
      if (!etab) return null;
      await etab.update({ archive: false }, { transaction: t });
      return {
        entity: { id: etab.id_etablissement, nom: etab.nom_etablissement },
        message: 'Établissement restauré avec succès',
      };
    },
  });
};

// Récupère le dernier log d'archivage pour un établissement (pour tracing)
exports.getEtablissementArchiveLog = async (req, res) => {
  try {
    const { id } = req.params;
    const [log] = await sequelize.query(
      `SELECT al.*, u.nom AS archived_by_nom, u.prenom AS archived_by_prenom, u.email AS archived_by_email
       FROM archive_log al
       LEFT JOIN utilisateur u ON u.numero_utilisateur = al.performed_by
       WHERE al.entity_type = 'etablissement'
         AND al.entity_id = :id
         AND al.action = 'archive'
       ORDER BY al.performed_at DESC LIMIT 1`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT }
    );
    res.json({ success: true, log: log || null });
  } catch (error) {
    console.error('Erreur getEtablissementArchiveLog:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// Supprimer définitivement un établissement
exports.deleteEtablissementPermanent = async (req, res) => {
  try {
    const { id } = req.params;

    const etablissement = await Etablissement.findByPk(id);
    if (!etablissement) {
      return res
        .status(404)
        .json({ success: false, message: "Établissement non trouvé" });
    }

    const etablissementData = {
      nom: etablissement.nom_etablissement,
      code: etablissement.code_etablissement,
    };

    // Supprimer définitivement
    await etablissement.destroy();

    await logAction(
      req.user.id,
      "DELETE_ETABLISSEMENT_PERMANENT",
      "Etablissement",
      id,
      etablissementData,
    );

    res.json({
      success: true,
      message: "Établissement supprimé définitivement",
    });
  } catch (error) {
    console.error("Erreur deleteEtablissementPermanent:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// Exporter la liste des établissements (CSV)
exports.exportEtablissements = async (req, res) => {
  try {
    const { type, id_rectorat, id } = req.query;

    const where = {};

    // Si un ID spécifique est fourni, exporter uniquement cet établissement
    if (id) {
      where.id_etablissement = id;
    } else {
      // Sinon, appliquer les filtres normaux
      if (type) where.type = type;
      if (id_rectorat) where.id_rectorat = id_rectorat;
    }

    const etablissements = await Etablissement.findAll({
      where,
      order: [["nom_etablissement", "ASC"]],
    });

    if (etablissements.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucun établissement trouvé",
      });
    }

    // Créer le CSV
    const headers = [
      "Code",
      "Nom",
      "Type",
      "Adresse",
      "Téléphone",
      "Email",
      "Site Web",
      "Effectif Total",
      "Capacité Maximale",
      "Budget Alloué",
      "Taux Occupation",
    ];

    const rows = etablissements.map((e) => [
      e.code_etablissement,
      e.nom_etablissement,
      e.type,
      e.adresse || "",
      e.telephone || "",
      e.email || "",
      e.site_web || "",
      e.effectif_total || 0,
      e.capacite_maximale || 0,
      e.budget_alloue || 0,
      e.taux_occupation || 0,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Log de l'action
    await logAction(
      req.user.id,
      id ? "EXPORT_ETABLISSEMENT" : "EXPORT_ETABLISSEMENTS",
      "Etablissement",
      id || null,
      { count: etablissements.length },
    );

    const filename = id
      ? `etablissement_${etablissements[0].code_etablissement}_${Date.now()}.csv`
      : `etablissements_${Date.now()}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.send("\uFEFF" + csv); // BOM pour Excel
  } catch (error) {
    console.error("Erreur exportEtablissements:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// Obtenir les statistiques des établissements
exports.getEtablissementsStats = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    const [[etabStats], [rectoratCount], [etudiantCount], [reussiteStats], [newEtablissements]] =
      await Promise.all([
        sequelize.query(`
          SELECT
            COUNT(*) as total,
            COUNT(CASE WHEN type = 'FACULTE' THEN 1 END) as facultes,
            COUNT(CASE WHEN type = 'ECOLE' THEN 1 END) as ecoles,
            COUNT(CASE WHEN type = 'INSTITUT' THEN 1 END) as instituts,
            COUNT(CASE WHEN type = 'ISET' THEN 1 END) as isets,
            SUM(effectif_total) as effectif_total,
            SUM(capacite_maximale) as capacite_totale,
            AVG(taux_occupation) as taux_occupation_moyen,
            AVG(taux_reussite) as taux_reussite_moyen,
            AVG(taux_echec) as taux_echec_moyen,
            AVG(performance) as performance_moyenne,
            SUM(budget_alloue) as budget_total
          FROM etablissement
          WHERE archive = false
        `),
        sequelize.query(`SELECT COUNT(*) as total_universites FROM rectorat`),
        sequelize.query(`SELECT COUNT(DISTINCT numero_utilisateur) as total_etudiants FROM etudiant`),
        sequelize.query(`
          SELECT ROUND(AVG(taux_reussite)::numeric, 1) as avg_taux_reussite
          FROM historique_academique
        `),
        sequelize.query(
          `SELECT COUNT(*) as count FROM etablissement
           WHERE EXTRACT(YEAR FROM date_creation) = :currentYear AND archive = false`,
          { replacements: { currentYear }, type: sequelize.QueryTypes.SELECT },
        ),
      ]);

    const total_etudiants_inscrits = parseInt(etudiantCount[0]?.total_etudiants) || 0;
    const taux_reussite_reel = parseFloat(reussiteStats[0]?.avg_taux_reussite) || 0;

    res.json({
      success: true,
      stats: {
        ...etabStats[0],
        total_universites: parseInt(rectoratCount[0].total_universites) || 0,
        total_etudiants_inscrits,
        taux_reussite_reel,
        evolution_etablissements: parseInt(newEtablissements?.count) || 0,
        evolution_etudiants: 6.3,
        evolution_taux: 2.1,
        evolution_budget: 5.8,
      },
    });
  } catch (error) {
    console.error("Erreur getEtablissementsStats:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// Obtenir les départements d'un établissement
exports.getDepartementsByEtablissement = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("getDepartementsByEtablissement - ID:", id);

    const departements = await sequelize.query(
      `
      SELECT 
        d.id_departement,
        d.code_departement,
        d.nom_departement,
        d.chef_departement,
        (SELECT COUNT(DISTINCT s.id_specialite) 
         FROM specialite s 
         INNER JOIN niveau n ON s.id_niveau = n.id_niveau 
         WHERE n.id_departement = d.id_departement) as nombre_specialites,
        (SELECT COUNT(DISTINCT a.numero_utilisateur) 
         FROM affectation a 
         WHERE a.id_departement = d.id_departement 
         AND a.id_etablissement = :id 
         AND a.statut = 'ACTIVE') as nombre_enseignants
      FROM departement d
      WHERE d.id_etablissement = :id
        AND (d.archived IS NULL OR d.archived = false)
      ORDER BY d.nom_departement ASC
      `,
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    res.json({ success: true, departements });
  } catch (error) {
    console.error("Erreur getDepartementsByEtablissement:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// Obtenir les spécialités d'un département
exports.getSpecialitesByDepartement = async (req, res) => {
  try {
    const { departementId } = req.params;

    const specialites = await sequelize.query(
      `
      SELECT 
        s.id_specialite,
        s.code_specialite,
        s.nom_specialite,
        n.nom_niveau as niveau,
        0 as nombre_etudiants,
        100 as capacite_max,
        0 as taux_remplissage
      FROM specialite s
      LEFT JOIN niveau n ON s.id_niveau = n.id_niveau
      ORDER BY s.nom_specialite ASC
      LIMIT 10
      `,
      {
        replacements: { departementId },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    res.json({ success: true, specialites });
  } catch (error) {
    console.error("Erreur getSpecialitesByDepartement:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// Obtenir toutes les spécialités d'un établissement
exports.getSpecialitesByEtablissement = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 5 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    console.log("getSpecialitesByEtablissement - ID:", id, "Page:", page);

    // Compter le total des spécialités (non archivées) via la relation niveau -> departement -> etablissement
    const [countResult] = await sequelize.query(
      `
      SELECT COUNT(DISTINCT s.id_specialite) as total
      FROM specialite s
      INNER JOIN niveau n ON s.id_niveau = n.id_niveau
      INNER JOIN departement d ON n.id_departement = d.id_departement
      WHERE d.id_etablissement = :id
        AND (s.archived IS NULL OR s.archived = false)
        AND (d.archived IS NULL OR d.archived = false)
      `,
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const total = parseInt(countResult.total) || 0;
    console.log("Total specialites pour etablissement", id, ":", total);

    const specialites = await sequelize.query(
      `
      SELECT 
        s.id_specialite,
        s.code_specialite,
        s.nom_specialite,
        COALESCE(n.nom_niveau, 'Non défini') as niveau,
        d.nom_departement,
        d.code_departement,
        (SELECT COUNT(*) FROM etudiant e WHERE e.id_specialite = s.id_specialite) AS nombre_etudiants,
        LEAST(100, ROUND(
          (SELECT COUNT(*) FROM etudiant e WHERE e.id_specialite = s.id_specialite)::numeric / 100 * 100
        ))::integer AS taux_remplissage
      FROM specialite s
      INNER JOIN niveau n ON s.id_niveau = n.id_niveau
      INNER JOIN departement d ON n.id_departement = d.id_departement
      WHERE d.id_etablissement = :id
        AND (s.archived IS NULL OR s.archived = false)
        AND (d.archived IS NULL OR d.archived = false)
      ORDER BY s.nom_specialite ASC
      LIMIT :limit OFFSET :offset
      `,
      {
        replacements: { id, limit: parseInt(limit), offset },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    console.log("Specialites found:", specialites.length);
    if (specialites.length > 0) {
      console.log("Sample specialite:", specialites[0]);
    }

    res.json({
      success: true,
      specialites,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Erreur getSpecialitesByEtablissement:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// Obtenir les enseignants d'un établissement
exports.getEnseignantsByEtablissement = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 5 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Compter le total via la table affectation
    const [countResult] = await sequelize.query(
      `
      SELECT COUNT(DISTINCT a.numero_utilisateur) as total
      FROM affectation a
      WHERE a.id_etablissement = :id AND a.statut = 'ACTIVE'
      `,
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const total = parseInt(countResult.total) || 0;

    const enseignants = await sequelize.query(
      `
      SELECT 
        u.numero_utilisateur,
        e.numero_enseignant as matricule,
        u.nom,
        u.prenom,
        u.email,
        u.telephone,
        e.grade,
        e.specialite,
        d.nom_departement,
        d.code_departement
      FROM affectation a
      INNER JOIN utilisateur u ON a.numero_utilisateur = u.numero_utilisateur
      INNER JOIN enseignant e ON a.numero_utilisateur = e.numero_utilisateur
      LEFT JOIN departement d ON a.id_departement = d.id_departement
      WHERE a.id_etablissement = :id AND a.statut = 'ACTIVE'
      ORDER BY u.nom, u.prenom ASC
      LIMIT :limit OFFSET :offset
      `,
      {
        replacements: { id, limit: parseInt(limit), offset },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    res.json({
      success: true,
      enseignants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Erreur getEnseignantsByEtablissement:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// Étudiants à risque d'un établissement, groupés par département
exports.getEtudiantsARisqueByEtablissement = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await sequelize.query(
      `SELECT
         u.nom,
         u.prenom,
         e.numero_etudiant,
         e.numero_utilisateur,
         ROUND(e.moyenne_generale::numeric, 2) AS moyenne_generale,
         s.nom_specialite,
         s.code_specialite,
         n.type_niveau,
         d.id_departement,
         d.nom_departement,
         d.code_departement,
         CASE WHEN e.moyenne_generale < 7 THEN 'critique' ELSE 'attention' END AS statut
       FROM etudiant e
       JOIN utilisateur u  ON e.numero_utilisateur = u.numero_utilisateur
       JOIN specialite  s  ON e.id_specialite       = s.id_specialite
       JOIN niveau      n  ON s.id_niveau            = n.id_niveau
       JOIN departement d  ON n.id_departement       = d.id_departement
       WHERE d.id_etablissement = :id
         AND e.moyenne_generale IS NOT NULL
         AND e.moyenne_generale < 10
       ORDER BY d.nom_departement ASC, e.moyenne_generale ASC`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT }
    );

    // Total d'étudiants par département (pour calcul du % par dept)
    const totauxRows = await sequelize.query(
      `SELECT d.id_departement, COUNT(DISTINCT e.numero_utilisateur) AS total_etudiants
       FROM departement d
       LEFT JOIN niveau     n  ON n.id_departement = d.id_departement
       LEFT JOIN specialite s  ON s.id_niveau      = n.id_niveau
       LEFT JOIN etudiant   e  ON e.id_specialite  = s.id_specialite
       WHERE d.id_etablissement = :id
       GROUP BY d.id_departement`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT }
    );
    const totauxMap = Object.fromEntries(
      totauxRows.map(r => [r.id_departement, parseInt(r.total_etudiants) || 0])
    );

    // Total GLOBAL d'étudiants de l'établissement via la chaîne dept (source d'autorité)
    const [{ total_etablissement }] = await sequelize.query(
      `SELECT COUNT(DISTINCT e.numero_utilisateur) AS total_etablissement
       FROM departement d
       JOIN niveau     n ON n.id_departement = d.id_departement
       JOIN specialite s ON s.id_niveau      = n.id_niveau
       JOIN etudiant   e ON e.id_specialite  = s.id_specialite
       WHERE d.id_etablissement = :id
         AND (d.archived IS NULL OR d.archived = false)`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT }
    );
    const totalEtablissement = parseInt(total_etablissement) || 0;

    const deptMap = {};
    for (const r of rows) {
      const key = r.id_departement;
      if (!deptMap[key]) {
        deptMap[key] = {
          id_departement:   r.id_departement,
          nom_departement:  r.nom_departement,
          code_departement: r.code_departement,
          etudiants:        [],
          nb_critique:      0,
          nb_attention:     0,
          total_etudiants:  totauxMap[r.id_departement] || 0,
        };
      }
      deptMap[key].etudiants.push({
        nom:              r.nom,
        prenom:           r.prenom,
        numero_etudiant:  r.numero_etudiant,
        moyenne_generale: parseFloat(r.moyenne_generale),
        nom_specialite:   r.nom_specialite,
        code_specialite:  r.code_specialite,
        type_niveau:      r.type_niveau,
        statut:           r.statut,
      });
      if (r.statut === 'critique') deptMap[key].nb_critique++;
      else                         deptMap[key].nb_attention++;
    }

    // Calcul du % de risque par dept
    const departements = Object.values(deptMap).map(d => ({
      ...d,
      nb_risque:    d.nb_critique + d.nb_attention,
      taux_risque:  d.total_etudiants > 0
        ? Math.round(((d.nb_critique + d.nb_attention) / d.total_etudiants) * 1000) / 10
        : 0,
    }));

    res.json({
      success: true,
      total:                 rows.length,
      nb_critique:           rows.filter(r => r.statut === 'critique').length,
      nb_attention:          rows.filter(r => r.statut === 'attention').length,
      total_etudiants:       totalEtablissement,   // tous les étudiants de l'établissement
      taux_risque_global:    totalEtablissement > 0
        ? Math.round((rows.length / totalEtablissement) * 1000) / 10
        : 0,
      departements,
    });
  } catch (error) {
    console.error('Erreur getEtudiantsARisqueByEtablissement:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// ─── Department Detail (Admin & Recteur) ─────────────────────────────────────
const _axios = require('axios');
const _ML    = process.env.ML_API_URL || 'http://localhost:5001';

exports.getDepartementDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const [dept] = await sequelize.query(
      `SELECT d.*, e.nom_etablissement,
              COUNT(DISTINCT n.id_niveau)           AS nombre_niveaux,
              COUNT(DISTINCT s.id_specialite)        AS nombre_specialites,
              COUNT(DISTINCT et.numero_utilisateur)  AS nombre_etudiants,
              COUNT(DISTINCT a.numero_utilisateur)   AS nombre_enseignants
       FROM departement d
       LEFT JOIN etablissement e   ON d.id_etablissement = e.id_etablissement
       LEFT JOIN niveau        n   ON d.id_departement   = n.id_departement
       LEFT JOIN specialite    s   ON n.id_niveau        = s.id_niveau
       LEFT JOIN etudiant      et  ON s.id_specialite    = et.id_specialite
       LEFT JOIN affectation   a   ON a.id_departement   = d.id_departement AND a.statut = 'ACTIVE'
       WHERE d.id_departement = :id
       GROUP BY d.id_departement, e.nom_etablissement`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT },
    );
    if (!dept) return res.status(404).json({ success: false, message: 'Département non trouvé' });

    const niveaux = await sequelize.query(
      `SELECT n.*,
              COUNT(DISTINCT s.id_specialite)       AS nombre_specialites,
              COUNT(DISTINCT et.numero_utilisateur) AS nombre_etudiants
       FROM niveau     n
       LEFT JOIN specialite s  ON n.id_niveau     = s.id_niveau
       LEFT JOIN etudiant   et ON s.id_specialite = et.id_specialite
       WHERE n.id_departement = :id
       GROUP BY n.id_niveau ORDER BY n.nom_niveau`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT },
    );
    res.json({ success: true, departement: dept, niveaux });
  } catch (e) {
    console.error('Erreur getDepartementDetail:', e);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: e.message });
  }
};

exports.getDepartementDetailSpecialites = async (req, res) => {
  try {
    const { id } = req.params;
    const specialites = await sequelize.query(
      `SELECT s.id_specialite, s.code_specialite, s.nom_specialite, n.nom_niveau,
              COUNT(DISTINCT et.numero_utilisateur) AS nombre_etudiants
       FROM specialite s
       INNER JOIN niveau   n  ON s.id_niveau     = n.id_niveau
       LEFT JOIN  etudiant et ON s.id_specialite = et.id_specialite
       WHERE n.id_departement = :id
       GROUP BY s.id_specialite, s.code_specialite, s.nom_specialite, n.nom_niveau
       ORDER BY n.nom_niveau, s.nom_specialite`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT },
    );
    res.json({ success: true, specialites });
  } catch (e) {
    console.error('Erreur getDepartementDetailSpecialites:', e);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: e.message });
  }
};

exports.getDepartementDetailEnseignants = async (req, res) => {
  try {
    const { id } = req.params;
    const enseignants = await sequelize.query(
      `SELECT u.nom, u.prenom, u.email, ens.grade, ens.specialite
       FROM affectation a
       JOIN enseignant  ens ON a.numero_utilisateur = ens.numero_utilisateur
       JOIN utilisateur u   ON u.numero_utilisateur  = ens.numero_utilisateur
       WHERE a.id_departement = :id AND a.statut = 'ACTIVE'
       ORDER BY u.nom, u.prenom`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT },
    );
    res.json({ success: true, enseignants });
  } catch (e) {
    console.error('Erreur getDepartementDetailEnseignants:', e);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: e.message });
  }
};

exports.getDepartementDetailMLData = async (req, res) => {
  try {
    const { id } = req.params;

    const [etabInfo] = await sequelize.query(
      `SELECT e.type FROM etablissement e JOIN departement d ON d.id_etablissement = e.id_etablissement WHERE d.id_departement = :id`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT },
    );
    const [ratio] = await sequelize.query(
      `SELECT COUNT(DISTINCT et.numero_utilisateur)::float / NULLIF(COUNT(DISTINCT a.numero_utilisateur),0) AS ratio_etud_ens
       FROM departement d
       LEFT JOIN niveau      n  ON n.id_departement = d.id_departement
       LEFT JOIN specialite  s  ON s.id_niveau       = n.id_niveau
       LEFT JOIN etudiant    et ON et.id_specialite  = s.id_specialite
       LEFT JOIN affectation a  ON a.id_departement  = d.id_departement AND a.statut = 'ACTIVE'
       WHERE d.id_departement = :id`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT },
    );
    const reussiteData = await sequelize.query(
      `SELECT ha.annee_academique,
              ROUND(AVG(ha.taux_reussite)::numeric,2) AS avg_taux_reussite,
              ROUND(LEAST(100,AVG(ha.nb_absences::float/NULLIF(ha.nb_matieres_total,0)*100))::numeric,2) AS avg_absence
       FROM historique_academique ha
       JOIN etudiant   et ON et.numero_utilisateur = ha.numero_utilisateur
       JOIN specialite s  ON et.id_specialite      = s.id_specialite
       JOIN niveau     n  ON s.id_niveau           = n.id_niveau
       WHERE n.id_departement = :id
       GROUP BY ha.annee_academique ORDER BY ha.annee_academique DESC LIMIT 2`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT },
    );
    const [etu] = await sequelize.query(
      `WITH sem_ranked AS (
         SELECT ha.numero_utilisateur, ha.moyenne, ha.nb_absences, ha.nb_matieres_total,
                ha.nb_matieres_validees, ha.niveau,
                ROW_NUMBER() OVER (PARTITION BY ha.numero_utilisateur ORDER BY ha.annee_academique DESC, ha.semestre DESC) AS rn
         FROM historique_academique ha
         JOIN etudiant   et ON et.numero_utilisateur = ha.numero_utilisateur
         JOIN specialite s  ON et.id_specialite      = s.id_specialite
         JOIN niveau     n  ON s.id_niveau           = n.id_niveau
         WHERE n.id_departement = :id
       )
       SELECT ROUND(AVG(CASE WHEN rn=1 THEN moyenne END)::numeric,2) AS moy_actuelle,
              ROUND(AVG(CASE WHEN rn=2 THEN moyenne END)::numeric,2) AS moy_prec,
              ROUND(LEAST(100,AVG(CASE WHEN rn=1 AND nb_matieres_total>0 THEN nb_absences::float/nb_matieres_total*100 END))::numeric,2) AS taux_absence,
              ROUND(AVG(CASE WHEN rn=1 THEN (nb_matieres_total-nb_matieres_validees) END)::numeric,1) AS matieres_echec,
              ROUND(AVG(CASE WHEN rn=1 AND nb_matieres_total>0 THEN nb_matieres_validees::float/nb_matieres_total END)::numeric,3) AS ratio_notes,
              MODE() WITHIN GROUP (ORDER BY CASE WHEN rn=1 THEN niveau END) AS niveau_dominant
       FROM sem_ranked`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT },
    );

    const yr1 = reussiteData[0] || {}, yr2 = reussiteData[1] || {};
    const moyAct  = Math.max(0, Math.min(20,  parseFloat(etu?.moy_actuelle) || 12));
    const moyPrec = Math.max(0, Math.min(20,  parseFloat(etu?.moy_prec)     || 11));
    const absence = Math.max(0, Math.min(100, parseFloat(etu?.taux_absence) || 10));
    const ratioN  = Math.max(0, Math.min(1,   parseFloat(etu?.ratio_notes)  || 0.85));
    const matEch  = Math.max(0, Math.round(parseFloat(etu?.matieres_echec)  || 2));
    const niveau  = etu?.niveau_dominant || 'L2';
    const pente   = Math.round((moyAct - moyPrec) * 10) / 10;
    const cc1 = Math.round(Math.max(0, Math.min(20, moyAct - 0.5)) * 10) / 10;
    const cc2 = Math.round(Math.max(0, Math.min(20, moyAct))        * 10) / 10;
    const cc3 = Math.round(Math.max(0, Math.min(20, moyAct + 0.5))  * 10) / 10;

    res.json({
      success: true,
      m1: {
        taux_reussite_an1: parseFloat(yr1.avg_taux_reussite) || 75,
        taux_reussite_an2: parseFloat(yr2.avg_taux_reussite) || 72,
        taux_absence_moyen: Math.max(0, Math.min(100, parseFloat(yr1.avg_absence) || 10)),
        ratio_etud_ens: Math.max(1, Math.round(parseFloat(ratio?.ratio_etud_ens) || 25)),
        budget_par_etud: 4500, nb_labos: 8, taux_rotation_ens: 8,
        region: 'Tunis', type_etablissement: etabInfo?.type || 'ISET',
      },
      m3: {
        moy_semestre_prec: moyPrec, note_cc1: cc1, note_cc2: cc2, note_cc3: cc3,
        taux_absence_actuel: absence, pente_evolution: pente,
        nb_matieres_sous_10: matEch, ratio_notes_obtenues: ratioN,
        niveau, filiere: 'Informatique',
      },
      stats: {
        taux_reussite_an1: parseFloat(yr1.avg_taux_reussite) || null,
        taux_reussite_an2: parseFloat(yr2.avg_taux_reussite) || null,
        moy_actuelle: moyAct, taux_absence: absence,
      },
    });
  } catch (e) {
    console.error('Erreur getDepartementDetailMLData:', e);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: e.message });
  }
};

exports.getDepartementDetailEtudiantsRisque = async (req, res) => {
  try {
    const { id } = req.params;
    const etudiants = await sequelize.query(
      `WITH sem_ranked AS (
         SELECT ha.numero_utilisateur, ha.moyenne, ha.nb_absences, ha.nb_matieres_total,
                ha.nb_matieres_validees, ha.niveau,
                ROW_NUMBER() OVER (PARTITION BY ha.numero_utilisateur ORDER BY ha.annee_academique DESC, ha.semestre DESC) AS rn
         FROM historique_academique ha
         JOIN etudiant   et ON et.numero_utilisateur = ha.numero_utilisateur
         JOIN specialite sp ON et.id_specialite      = sp.id_specialite
         JOIN niveau     n  ON sp.id_niveau          = n.id_niveau
         WHERE n.id_departement = :id
       )
       SELECT u.numero_utilisateur, u.nom, u.prenom, u.email, sp.nom_specialite,
              COALESCE(cur.niveau,'L1') AS niveau,
              ROUND(COALESCE(cur.moyenne,10)::numeric,2) AS moy_actuelle,
              ROUND(COALESCE(prec.moyenne,10)::numeric,2) AS moy_prec,
              ROUND(LEAST(100,COALESCE(cur.nb_absences::float/NULLIF(cur.nb_matieres_total,0)*100,0))::numeric,1) AS taux_absence,
              COALESCE(cur.nb_matieres_total-cur.nb_matieres_validees,0) AS nb_echecs
       FROM sem_ranked cur
       LEFT JOIN sem_ranked prec ON prec.numero_utilisateur = cur.numero_utilisateur AND prec.rn = 2
       JOIN etudiant   et ON et.numero_utilisateur = cur.numero_utilisateur
       JOIN utilisateur u  ON u.numero_utilisateur  = cur.numero_utilisateur
       JOIN specialite sp  ON et.id_specialite      = sp.id_specialite
       WHERE cur.rn = 1 AND cur.moyenne < 10
       ORDER BY cur.moyenne ASC NULLS LAST, taux_absence DESC
       LIMIT 40`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT },
    );
    if (!etudiants.length) return res.json({ success: true, etudiants: [] });

    const withRisk = await Promise.all(etudiants.map(async (et) => {
      const moyAct  = Math.max(0, Math.min(20,  parseFloat(et.moy_actuelle) || 10));
      const moyPrec = Math.max(0, Math.min(20,  parseFloat(et.moy_prec)     || 10));
      const absence = Math.max(0, Math.min(100, parseFloat(et.taux_absence) || 0));
      const nbEch   = Math.max(0, parseInt(et.nb_echecs) || 0);
      const pente   = Math.round((moyAct - moyPrec) * 10) / 10;
      const cc1 = Math.round(Math.max(0, Math.min(20, moyAct - 0.5)) * 10) / 10;
      const cc2 = Math.round(Math.max(0, Math.min(20, moyAct))        * 10) / 10;
      const cc3 = Math.round(Math.max(0, Math.min(20, moyAct + 0.5))  * 10) / 10;
      try {
        const r = await _axios.post(`${_ML}/predict/risque`, {
          moy_semestre_prec: moyPrec, note_cc1: cc1, note_cc2: cc2, note_cc3: cc3,
          taux_absence: absence, nb_echecs_anterieurs: nbEch, evolution_notes: pente,
          participation: 6, niveau: et.niveau || 'L1', filiere: 'Informatique',
        }, { timeout: 8000 });
        return { ...et, moy_actuelle: moyAct, taux_absence: absence, nb_echecs: nbEch, risque: r.data };
      } catch {
        return { ...et, moy_actuelle: moyAct, taux_absence: absence, nb_echecs: nbEch,
                 risque: { a_risque: 0, probabilite: 0, niveau_alerte: 'VERT', couleur: '#22c55e', interpretation: 'Non évalué' } };
      }
    }));
    withRisk.sort((a, b) => (b.risque?.probabilite || 0) - (a.risque?.probabilite || 0));
    res.json({ success: true, etudiants: withRisk });
  } catch (e) {
    console.error('Erreur getDepartementDetailEtudiantsRisque:', e);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: e.message });
  }
};

// ─── Archivage Départements (Admin & Recteur) ────────────────────────────────

// GET /:id/departements-archives
exports.getArchivedDepartementsByEtablissement = async (req, res) => {
  try {
    const { id } = req.params;
    const departements = await sequelize.query(
      `SELECT
         d.id_departement,
         d.code_departement,
         d.nom_departement,
         d.chef_departement,
         d.archived_at,
         d.archived_by,
         u.nom         AS archived_by_nom,
         u.prenom      AS archived_by_prenom,
         u.email       AS archived_by_email,
         log.ip_address,
         log.user_agent,
         log.reason,
         log.cascade_count,
         log.performed_at AS log_performed_at,
         (SELECT COUNT(DISTINCT s.id_specialite)
            FROM specialite s
            INNER JOIN niveau n ON s.id_niveau = n.id_niveau
            WHERE n.id_departement = d.id_departement) AS nombre_specialites,
         (SELECT COUNT(DISTINCT a.numero_utilisateur)
            FROM affectation a
            WHERE a.id_departement = d.id_departement
              AND a.id_etablissement = :id
              AND a.statut = 'ACTIVE') AS nombre_enseignants
       FROM departement d
       LEFT JOIN utilisateur u ON u.numero_utilisateur = d.archived_by
       LEFT JOIN LATERAL (
         SELECT ip_address, user_agent, reason, cascade_count, performed_at
         FROM archive_log
         WHERE entity_type = 'departement'
           AND entity_id = d.id_departement
           AND action = 'archive'
         ORDER BY performed_at DESC
         LIMIT 1
       ) log ON true
       WHERE d.id_etablissement = :id
         AND d.archived = true
       ORDER BY d.archived_at DESC NULLS LAST, d.nom_departement ASC`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT }
    );
    res.json({ success: true, departements });
  } catch (error) {
    console.error('Erreur getArchivedDepartementsByEtablissement:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// GET /departements/:id/impact — analyse l'impact avant archivage
exports.getDepartementImpact = async (req, res) => {
  try {
    const { id } = req.params;

    const [dept] = await sequelize.query(
      `SELECT id_departement, nom_departement, code_departement, id_etablissement
       FROM departement WHERE id_departement = :id`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT }
    );
    if (!dept) return res.status(404).json({ success: false, message: 'Département non trouvé' });

    const specialites = await sequelize.query(
      `SELECT s.id_specialite, s.nom_specialite, s.code_specialite,
              (SELECT COUNT(*) FROM etudiant e WHERE e.id_specialite = s.id_specialite) AS nombre_etudiants
       FROM specialite s
       INNER JOIN niveau n ON s.id_niveau = n.id_niveau
       WHERE n.id_departement = :id
         AND (s.archived IS NULL OR s.archived = false)`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT }
    );

    const [{ nombre_enseignants }] = await sequelize.query(
      `SELECT COUNT(DISTINCT numero_utilisateur) AS nombre_enseignants
       FROM affectation WHERE id_departement = :id AND statut = 'ACTIVE'`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT }
    );

    const nombre_etudiants = specialites.reduce((s, x) => s + parseInt(x.nombre_etudiants || 0), 0);

    res.json({
      success: true,
      departement: { id: dept.id_departement, nom: dept.nom_departement, code: dept.code_departement },
      nombre_specialites_actives: specialites.length,
      nombre_enseignants_actifs:  parseInt(nombre_enseignants) || 0,
      nombre_etudiants_inscrits:  nombre_etudiants,
      specialites,
    });
  } catch (error) {
    console.error('Erreur getDepartementImpact:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// GET /admin/risque-global — résumé risque pour TOUS les établissements
exports.getRisqueGlobalAdmin = async (req, res) => {
  try {
    const rows = await sequelize.query(
      `SELECT
         et.id_etablissement,
         et.nom_etablissement,
         et.code_etablissement,
         et.type,
         COUNT(DISTINCT e.numero_utilisateur)                                                                        AS total_etudiants,
         COUNT(DISTINCT CASE WHEN e.moyenne_generale IS NOT NULL AND e.moyenne_generale < 10 THEN e.numero_utilisateur END) AS nb_risque,
         COUNT(DISTINCT CASE WHEN e.moyenne_generale IS NOT NULL AND e.moyenne_generale < 7  THEN e.numero_utilisateur END) AS nb_critique,
         COUNT(DISTINCT CASE WHEN e.moyenne_generale IS NOT NULL AND e.moyenne_generale >= 7 AND e.moyenne_generale < 10 THEN e.numero_utilisateur END) AS nb_attention
       FROM etablissement et
       LEFT JOIN departement  d  ON d.id_etablissement = et.id_etablissement AND (d.archived IS NULL OR d.archived = false)
       LEFT JOIN niveau       n  ON n.id_departement   = d.id_departement
       LEFT JOIN specialite   s  ON s.id_niveau        = n.id_niveau
       LEFT JOIN etudiant     e  ON e.id_specialite    = s.id_specialite
       WHERE (et.archive IS NULL OR et.archive = false)
       GROUP BY et.id_etablissement, et.nom_etablissement, et.code_etablissement, et.type
       ORDER BY nb_risque DESC NULLS LAST`,
      { type: sequelize.QueryTypes.SELECT }
    );

    const etablissements = rows.map(r => {
      const total    = parseInt(r.total_etudiants) || 0;
      const nbRisque = parseInt(r.nb_risque)       || 0;
      return {
        id_etablissement:   r.id_etablissement,
        nom_etablissement:  r.nom_etablissement,
        code_etablissement: r.code_etablissement,
        type:               r.type,
        total_etudiants:    total,
        nb_risque:          nbRisque,
        nb_critique:        parseInt(r.nb_critique)  || 0,
        nb_attention:       parseInt(r.nb_attention) || 0,
        taux_risque: total > 0 ? Math.round((nbRisque / total) * 1000) / 10 : 0,
      };
    });

    const totalGlobal   = etablissements.reduce((s, e) => s + e.total_etudiants, 0);
    const totalRisque   = etablissements.reduce((s, e) => s + e.nb_risque,       0);
    const totalCritique = etablissements.reduce((s, e) => s + e.nb_critique,     0);
    const nbAlerte      = etablissements.filter(e => e.taux_risque > 20).length;

    res.json({
      success: true,
      stats: {
        total_etudiants:  totalGlobal,
        total_risque:     totalRisque,
        total_critique:   totalCritique,
        total_attention:  totalRisque - totalCritique,
        nb_alerte:        nbAlerte,
        taux_moyen: totalGlobal > 0 ? Math.round((totalRisque / totalGlobal) * 1000) / 10 : 0,
      },
      etablissements,
    });
  } catch (error) {
    console.error('Erreur getRisqueGlobalAdmin:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// GET /recteur/risque-global — résumé risque scoped au rectorat du recteur connecté
exports.getRisqueGlobalRecteur = async (req, res) => {
  try {
    const [recteurInfo] = await sequelize.query(
      `SELECT id_rectorat FROM recteur_universite WHERE numero_utilisateur = $1`,
      { bind: [req.user.numero_utilisateur], type: sequelize.QueryTypes.SELECT }
    );
    if (!recteurInfo) return res.status(404).json({ success: false, message: 'Recteur introuvable' });
    const idRectorat = recteurInfo.id_rectorat;

    const rows = await sequelize.query(
      `SELECT
         et.id_etablissement,
         et.nom_etablissement,
         et.code_etablissement,
         et.type,
         COUNT(DISTINCT e.numero_utilisateur)                                                                        AS total_etudiants,
         COUNT(DISTINCT CASE WHEN e.moyenne_generale IS NOT NULL AND e.moyenne_generale < 10 THEN e.numero_utilisateur END) AS nb_risque,
         COUNT(DISTINCT CASE WHEN e.moyenne_generale IS NOT NULL AND e.moyenne_generale < 7  THEN e.numero_utilisateur END) AS nb_critique,
         COUNT(DISTINCT CASE WHEN e.moyenne_generale IS NOT NULL AND e.moyenne_generale >= 7 AND e.moyenne_generale < 10 THEN e.numero_utilisateur END) AS nb_attention
       FROM etablissement et
       LEFT JOIN departement  d  ON d.id_etablissement = et.id_etablissement AND (d.archived IS NULL OR d.archived = false)
       LEFT JOIN niveau       n  ON n.id_departement   = d.id_departement
       LEFT JOIN specialite   s  ON s.id_niveau        = n.id_niveau
       LEFT JOIN etudiant     e  ON e.id_specialite    = s.id_specialite
       WHERE et.id_rectorat = $1 AND (et.archive IS NULL OR et.archive = false)
       GROUP BY et.id_etablissement, et.nom_etablissement, et.code_etablissement, et.type
       ORDER BY nb_risque DESC NULLS LAST`,
      { bind: [idRectorat], type: sequelize.QueryTypes.SELECT }
    );

    const etablissements = rows.map(r => {
      const total    = parseInt(r.total_etudiants) || 0;
      const nbRisque = parseInt(r.nb_risque)       || 0;
      return {
        id_etablissement:   r.id_etablissement,
        nom_etablissement:  r.nom_etablissement,
        code_etablissement: r.code_etablissement,
        type:               r.type,
        total_etudiants:    total,
        nb_risque:          nbRisque,
        nb_critique:        parseInt(r.nb_critique)  || 0,
        nb_attention:       parseInt(r.nb_attention) || 0,
        taux_risque: total > 0 ? Math.round((nbRisque / total) * 1000) / 10 : 0,
      };
    });

    const totalGlobal   = etablissements.reduce((s, e) => s + e.total_etudiants, 0);
    const totalRisque   = etablissements.reduce((s, e) => s + e.nb_risque,       0);
    const totalCritique = etablissements.reduce((s, e) => s + e.nb_critique,     0);
    const nbAlerte      = etablissements.filter(e => e.taux_risque > 20).length;

    res.json({
      success: true,
      stats: {
        total_etudiants:  totalGlobal,
        total_risque:     totalRisque,
        total_critique:   totalCritique,
        total_attention:  totalRisque - totalCritique,
        nb_alerte:        nbAlerte,
        taux_moyen: totalGlobal > 0 ? Math.round((totalRisque / totalGlobal) * 1000) / 10 : 0,
      },
      etablissements,
    });
  } catch (error) {
    console.error('Erreur getRisqueGlobalRecteur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// GET /directeur/risque-global — résumé risque scoped à l'établissement du directeur connecté
exports.getRisqueGlobalDirecteur = async (req, res) => {
  try {
    const [directeurInfo] = await sequelize.query(
      `SELECT id_etablissement FROM directeur_etablissement WHERE numero_utilisateur = $1`,
      { bind: [req.user.numero_utilisateur], type: sequelize.QueryTypes.SELECT }
    );
    if (!directeurInfo) return res.status(404).json({ success: false, message: 'Directeur introuvable' });
    const idEtablissement = directeurInfo.id_etablissement;

    const [etab] = await sequelize.query(
      `SELECT
         et.id_etablissement,
         et.nom_etablissement,
         et.code_etablissement,
         et.type,
         COUNT(DISTINCT e.numero_utilisateur)                                                                        AS total_etudiants,
         COUNT(DISTINCT CASE WHEN e.moyenne_generale IS NOT NULL AND e.moyenne_generale < 10 THEN e.numero_utilisateur END) AS nb_risque,
         COUNT(DISTINCT CASE WHEN e.moyenne_generale IS NOT NULL AND e.moyenne_generale < 7  THEN e.numero_utilisateur END) AS nb_critique,
         COUNT(DISTINCT CASE WHEN e.moyenne_generale IS NOT NULL AND e.moyenne_generale >= 7 AND e.moyenne_generale < 10 THEN e.numero_utilisateur END) AS nb_attention
       FROM etablissement et
       LEFT JOIN departement  d  ON d.id_etablissement = et.id_etablissement AND (d.archived IS NULL OR d.archived = false)
       LEFT JOIN niveau       n  ON n.id_departement   = d.id_departement
       LEFT JOIN specialite   s  ON s.id_niveau        = n.id_niveau
       LEFT JOIN etudiant     e  ON e.id_specialite    = s.id_specialite
       WHERE et.id_etablissement = $1
       GROUP BY et.id_etablissement, et.nom_etablissement, et.code_etablissement, et.type`,
      { bind: [idEtablissement], type: sequelize.QueryTypes.SELECT }
    );

    const departements = await sequelize.query(
      `SELECT
         d.id_departement,
         d.nom_departement,
         d.code_departement,
         COUNT(DISTINCT e.numero_utilisateur)                                                                        AS total_etudiants,
         COUNT(DISTINCT CASE WHEN e.moyenne_generale IS NOT NULL AND e.moyenne_generale < 10 THEN e.numero_utilisateur END) AS nb_risque,
         COUNT(DISTINCT CASE WHEN e.moyenne_generale IS NOT NULL AND e.moyenne_generale < 7  THEN e.numero_utilisateur END) AS nb_critique,
         COUNT(DISTINCT CASE WHEN e.moyenne_generale IS NOT NULL AND e.moyenne_generale >= 7 AND e.moyenne_generale < 10 THEN e.numero_utilisateur END) AS nb_attention
       FROM departement d
       LEFT JOIN niveau     n  ON n.id_departement = d.id_departement
       LEFT JOIN specialite s  ON s.id_niveau      = n.id_niveau
       LEFT JOIN etudiant   e  ON e.id_specialite  = s.id_specialite
       WHERE d.id_etablissement = $1 AND (d.archived IS NULL OR d.archived = false)
       GROUP BY d.id_departement, d.nom_departement, d.code_departement
       ORDER BY nb_risque DESC NULLS LAST`,
      { bind: [idEtablissement], type: sequelize.QueryTypes.SELECT }
    );

    const depts = departements.map(r => {
      const total    = parseInt(r.total_etudiants) || 0;
      const nbRisque = parseInt(r.nb_risque)       || 0;
      return {
        id_departement:   r.id_departement,
        nom_departement:  r.nom_departement,
        code_departement: r.code_departement,
        total_etudiants: total,
        nb_risque:       nbRisque,
        nb_critique:     parseInt(r.nb_critique)  || 0,
        nb_attention:    parseInt(r.nb_attention) || 0,
        taux_risque: total > 0 ? Math.round((nbRisque / total) * 1000) / 10 : 0,
      };
    });

    const specialitesRaw = await sequelize.query(
      `SELECT
         s.id_specialite,
         s.nom_specialite,
         s.code_specialite,
         d.id_departement,
         d.nom_departement,
         d.code_departement,
         COUNT(DISTINCT e.numero_utilisateur)                                                                        AS total_etudiants,
         COUNT(DISTINCT CASE WHEN e.moyenne_generale IS NOT NULL AND e.moyenne_generale < 10 THEN e.numero_utilisateur END) AS nb_risque,
         COUNT(DISTINCT CASE WHEN e.moyenne_generale IS NOT NULL AND e.moyenne_generale < 7  THEN e.numero_utilisateur END) AS nb_critique,
         COUNT(DISTINCT CASE WHEN e.moyenne_generale IS NOT NULL AND e.moyenne_generale >= 7 AND e.moyenne_generale < 10 THEN e.numero_utilisateur END) AS nb_attention
       FROM specialite s
       JOIN niveau      n  ON n.id_niveau      = s.id_niveau
       JOIN departement d  ON d.id_departement = n.id_departement
       LEFT JOIN etudiant e ON e.id_specialite = s.id_specialite
       WHERE d.id_etablissement = $1 AND (d.archived IS NULL OR d.archived = false)
       GROUP BY s.id_specialite, s.nom_specialite, s.code_specialite, d.id_departement, d.nom_departement, d.code_departement
       ORDER BY nb_risque DESC NULLS LAST`,
      { bind: [idEtablissement], type: sequelize.QueryTypes.SELECT }
    );

    const specialites = specialitesRaw.map(r => {
      const total    = parseInt(r.total_etudiants) || 0;
      const nbRisque = parseInt(r.nb_risque)       || 0;
      return {
        id_specialite:    r.id_specialite,
        nom_specialite:   r.nom_specialite,
        code_specialite:  r.code_specialite,
        id_departement:   r.id_departement,
        nom_departement:  r.nom_departement,
        code_departement: r.code_departement,
        total_etudiants:  total,
        nb_risque:        nbRisque,
        nb_critique:      parseInt(r.nb_critique)  || 0,
        nb_attention:     parseInt(r.nb_attention) || 0,
        taux_risque: total > 0 ? Math.round((nbRisque / total) * 1000) / 10 : 0,
      };
    });

    const total    = parseInt(etab?.total_etudiants) || 0;
    const nbRisque = parseInt(etab?.nb_risque)       || 0;

    res.json({
      success: true,
      etablissement: {
        id_etablissement:   idEtablissement,
        nom_etablissement:  etab?.nom_etablissement || '',
        code_etablissement: etab?.code_etablissement || '',
        type:               etab?.type || '',
        total_etudiants:    total,
        nb_risque:          nbRisque,
        nb_critique:        parseInt(etab?.nb_critique) || 0,
        nb_attention:       parseInt(etab?.nb_attention) || 0,
        taux_risque: total > 0 ? Math.round((nbRisque / total) * 1000) / 10 : 0,
      },
      departements: depts,
      specialites,
      stats: {
        total_etudiants:  total,
        total_risque:     nbRisque,
        total_critique:   parseInt(etab?.nb_critique) || 0,
        total_attention:  (parseInt(etab?.nb_attention) || 0),
        nb_alerte:        depts.filter(d => d.taux_risque > 20).length,
        taux_moyen: total > 0 ? Math.round((nbRisque / total) * 1000) / 10 : 0,
      },
    });
  } catch (error) {
    console.error('Erreur getRisqueGlobalDirecteur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// PUT /departements/:id — modifier nom et code d'un département
exports.updateDepartement = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_departement, code_departement } = req.body || {};

    if (!nom_departement && !code_departement) {
      return res.status(400).json({ success: false, message: 'Aucun champ à modifier' });
    }

    const [dept] = await sequelize.query(
      `SELECT id_departement FROM departement WHERE id_departement = :id`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT }
    );
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Département non trouvé' });
    }

    const fields = [];
    const replacements = { id };
    if (nom_departement)  { fields.push('nom_departement = :nom');   replacements.nom  = nom_departement.trim(); }
    if (code_departement) { fields.push('code_departement = :code'); replacements.code = code_departement.trim().toUpperCase(); }

    await sequelize.query(
      `UPDATE departement SET ${fields.join(', ')} WHERE id_departement = :id`,
      { replacements, type: sequelize.QueryTypes.UPDATE }
    );

    const [updated] = await sequelize.query(
      `SELECT id_departement, nom_departement, code_departement FROM departement WHERE id_departement = :id`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT }
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Erreur updateDepartement:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// PATCH /departements/:id/archive — avec password + cascade + log
exports.archiveDepartement = async (req, res) => {
  const bcrypt = require('bcrypt');
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { password, reason = '', cascade = true } = req.body || {};
    const actor = req.user?.numero_utilisateur || req.user?.id || null;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Mot de passe requis' });
    }

    // 1) Vérifier le mot de passe de l'utilisateur connecté
    const [user] = await sequelize.query(
      `SELECT numero_utilisateur, mot_de_passe FROM utilisateur WHERE numero_utilisateur = :actor`,
      { replacements: { actor }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );
    if (!user || !user.mot_de_passe) {
      await t.rollback();
      return res.status(401).json({ success: false, message: 'Utilisateur introuvable' });
    }

    const isValid = await bcrypt.compare(password, user.mot_de_passe);
    if (!isValid) {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'Mot de passe incorrect' });
    }

    // 2) Récupérer le département
    const [dept] = await sequelize.query(
      `SELECT id_departement, nom_departement FROM departement WHERE id_departement = :id`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );
    if (!dept) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Département non trouvé' });
    }

    // 3) Cascade : archiver les spécialités actives du dept
    let cascadeCount = 0;
    if (cascade) {
      const [_, affected] = await sequelize.query(
        `UPDATE specialite s
         SET archived = true,
             archived_at = NOW(),
             archived_by = :actor
         FROM niveau n
         WHERE s.id_niveau = n.id_niveau
           AND n.id_departement = :id
           AND (s.archived IS NULL OR s.archived = false)`,
        { replacements: { id, actor }, type: sequelize.QueryTypes.UPDATE, transaction: t }
      );
      cascadeCount = affected || 0;
    }

    // 4) Archiver le département
    await sequelize.query(
      `UPDATE departement
       SET archived = true, archived_at = NOW(), archived_by = :actor
       WHERE id_departement = :id`,
      { replacements: { id, actor }, type: sequelize.QueryTypes.UPDATE, transaction: t }
    );

    // 5) Capturer le contexte (IP, user-agent, etc.)
    const ip = (req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || '').toString().split(',')[0].trim();
    const ua = req.headers['user-agent'] || '';

    await sequelize.query(
      `INSERT INTO archive_log
         (entity_type, entity_id, entity_name, action, performed_by, ip_address, user_agent, reason, cascade_count, metadata)
       VALUES ('departement', :id, :name, 'archive', :actor, :ip, :ua, :reason, :cnt, :meta)`,
      {
        replacements: {
          id, name: dept.nom_departement, actor, ip, ua,
          reason: reason || null,
          cnt: cascadeCount,
          meta: JSON.stringify({ cascaded_specialites: cascadeCount }),
        },
        type: sequelize.QueryTypes.INSERT,
        transaction: t,
      }
    );

    await t.commit();
    res.json({
      success: true,
      message: 'Département archivé avec succès',
      cascade_count: cascadeCount,
      departement: dept,
    });
  } catch (error) {
    await t.rollback();
    console.error('Erreur archiveDepartement:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// PATCH /departements/:id/restore — password + log + cascade option
exports.restoreDepartement = async (req, res) => {
  const bcrypt = require('bcrypt');
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { password, reason = '', cascade = true } = req.body || {};
    const actor = req.user?.numero_utilisateur || req.user?.id || null;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Mot de passe requis' });
    }

    // Vérifier mot de passe
    const [user] = await sequelize.query(
      `SELECT mot_de_passe FROM utilisateur WHERE numero_utilisateur = :actor`,
      { replacements: { actor }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );
    if (!user || !user.mot_de_passe) {
      await t.rollback();
      return res.status(401).json({ success: false, message: 'Utilisateur introuvable' });
    }
    const isValid = await bcrypt.compare(password, user.mot_de_passe);
    if (!isValid) {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'Mot de passe incorrect' });
    }

    // Récupérer le département
    const [dept] = await sequelize.query(
      `SELECT id_departement, nom_departement FROM departement WHERE id_departement = :id`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );
    if (!dept) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Département non trouvé' });
    }

    // Cascade : restaurer les spécialités archivées de ce dept
    let cascadeCount = 0;
    if (cascade) {
      const [_, affected] = await sequelize.query(
        `UPDATE specialite s
         SET archived = false, archived_at = NULL, archived_by = NULL
         FROM niveau n
         WHERE s.id_niveau = n.id_niveau
           AND n.id_departement = :id
           AND s.archived = true`,
        { replacements: { id }, type: sequelize.QueryTypes.UPDATE, transaction: t }
      );
      cascadeCount = affected || 0;
    }

    // Restaurer le département
    await sequelize.query(
      `UPDATE departement
       SET archived = false, archived_at = NULL, archived_by = NULL
       WHERE id_departement = :id`,
      { replacements: { id }, type: sequelize.QueryTypes.UPDATE, transaction: t }
    );

    // Log
    const ip = (req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || '').toString().split(',')[0].trim();
    const ua = req.headers['user-agent'] || '';
    await sequelize.query(
      `INSERT INTO archive_log
         (entity_type, entity_id, entity_name, action, performed_by, ip_address, user_agent, reason, cascade_count, metadata)
       VALUES ('departement', :id, :name, 'restore', :actor, :ip, :ua, :reason, :cnt, :meta)`,
      {
        replacements: {
          id, name: dept.nom_departement, actor, ip, ua,
          reason: reason || null, cnt: cascadeCount,
          meta: JSON.stringify({ cascaded_specialites: cascadeCount }),
        },
        type: sequelize.QueryTypes.INSERT,
        transaction: t,
      }
    );

    await t.commit();
    res.json({
      success: true,
      message: 'Département restauré avec succès',
      cascade_count: cascadeCount,
      departement: dept,
    });
  } catch (error) {
    await t.rollback();
    console.error('Erreur restoreDepartement:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// ─── Archivage Spécialités (Admin & Recteur) ────────────────────────────────

// GET /:id/specialites-archives
exports.getArchivedSpecialitesByEtablissement = async (req, res) => {
  try {
    const { id } = req.params;
    const specialites = await sequelize.query(
      `SELECT
         s.id_specialite,
         s.code_specialite,
         s.nom_specialite,
         s.archived_at,
         s.archived_by,
         u.nom         AS archived_by_nom,
         u.prenom      AS archived_by_prenom,
         u.email       AS archived_by_email,
         log.ip_address,
         log.user_agent,
         log.reason,
         log.performed_at AS log_performed_at,
         COALESCE(n.nom_niveau, 'Non défini') AS niveau,
         d.nom_departement,
         d.code_departement,
         (SELECT COUNT(*) FROM etudiant e WHERE e.id_specialite = s.id_specialite) AS nombre_etudiants
       FROM specialite s
       INNER JOIN niveau     n ON s.id_niveau      = n.id_niveau
       INNER JOIN departement d ON n.id_departement = d.id_departement
       LEFT JOIN utilisateur u ON u.numero_utilisateur = s.archived_by
       LEFT JOIN LATERAL (
         SELECT ip_address, user_agent, reason, performed_at
         FROM archive_log
         WHERE entity_type = 'specialite'
           AND entity_id = s.id_specialite
           AND action = 'archive'
         ORDER BY performed_at DESC
         LIMIT 1
       ) log ON true
       WHERE d.id_etablissement = :id
         AND s.archived = true
       ORDER BY s.archived_at DESC NULLS LAST, s.nom_specialite ASC`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT }
    );
    res.json({ success: true, specialites });
  } catch (error) {
    console.error('Erreur getArchivedSpecialitesByEtablissement:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// GET /specialites/:id/impact
exports.getSpecialiteImpact = async (req, res) => {
  try {
    const { id } = req.params;
    const [spec] = await sequelize.query(
      `SELECT s.id_specialite, s.nom_specialite, s.code_specialite,
              n.nom_niveau, d.nom_departement, d.code_departement,
              (SELECT COUNT(*) FROM etudiant e WHERE e.id_specialite = s.id_specialite) AS nombre_etudiants
       FROM specialite s
       LEFT JOIN niveau     n ON s.id_niveau      = n.id_niveau
       LEFT JOIN departement d ON n.id_departement = d.id_departement
       WHERE s.id_specialite = :id`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT }
    );
    if (!spec) return res.status(404).json({ success: false, message: 'Spécialité non trouvée' });

    res.json({
      success: true,
      specialite: spec,
      nombre_etudiants_inscrits: parseInt(spec.nombre_etudiants) || 0,
    });
  } catch (error) {
    console.error('Erreur getSpecialiteImpact:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// PATCH /specialites/:id/archive — avec password + log
exports.archiveSpecialite = async (req, res) => {
  const bcrypt = require('bcrypt');
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { password, reason = '' } = req.body || {};
    const actor = req.user?.numero_utilisateur || req.user?.id || null;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Mot de passe requis' });
    }

    // Vérifier le mot de passe
    const [user] = await sequelize.query(
      `SELECT numero_utilisateur, mot_de_passe FROM utilisateur WHERE numero_utilisateur = :actor`,
      { replacements: { actor }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );
    if (!user || !user.mot_de_passe) {
      await t.rollback();
      return res.status(401).json({ success: false, message: 'Utilisateur introuvable' });
    }
    const isValid = await bcrypt.compare(password, user.mot_de_passe);
    if (!isValid) {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'Mot de passe incorrect' });
    }

    // Récupérer la spécialité
    const [spec] = await sequelize.query(
      `SELECT id_specialite, nom_specialite FROM specialite WHERE id_specialite = :id`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );
    if (!spec) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Spécialité non trouvée' });
    }

    // Archiver
    await sequelize.query(
      `UPDATE specialite
       SET archived = true, archived_at = NOW(), archived_by = :actor
       WHERE id_specialite = :id`,
      { replacements: { id, actor }, type: sequelize.QueryTypes.UPDATE, transaction: t }
    );

    // Log
    const ip = (req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || '').toString().split(',')[0].trim();
    const ua = req.headers['user-agent'] || '';
    await sequelize.query(
      `INSERT INTO archive_log
         (entity_type, entity_id, entity_name, action, performed_by, ip_address, user_agent, reason, cascade_count, metadata)
       VALUES ('specialite', :id, :name, 'archive', :actor, :ip, :ua, :reason, 0, NULL)`,
      {
        replacements: {
          id, name: spec.nom_specialite, actor, ip, ua,
          reason: reason || null,
        },
        type: sequelize.QueryTypes.INSERT,
        transaction: t,
      }
    );

    await t.commit();
    res.json({ success: true, message: 'Spécialité archivée avec succès', specialite: spec });
  } catch (error) {
    await t.rollback();
    console.error('Erreur archiveSpecialite:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// PATCH /specialites/:id/restore — password + log
exports.restoreSpecialite = async (req, res) => {
  const bcrypt = require('bcrypt');
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { password, reason = '' } = req.body || {};
    const actor = req.user?.numero_utilisateur || req.user?.id || null;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Mot de passe requis' });
    }

    // Vérifier mot de passe
    const [user] = await sequelize.query(
      `SELECT mot_de_passe FROM utilisateur WHERE numero_utilisateur = :actor`,
      { replacements: { actor }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );
    if (!user || !user.mot_de_passe) {
      await t.rollback();
      return res.status(401).json({ success: false, message: 'Utilisateur introuvable' });
    }
    const isValid = await bcrypt.compare(password, user.mot_de_passe);
    if (!isValid) {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'Mot de passe incorrect' });
    }

    // Récupérer la spécialité
    const [spec] = await sequelize.query(
      `SELECT s.id_specialite, s.nom_specialite,
              n.id_departement, d.archived AS dept_archived, d.nom_departement
       FROM specialite s
       INNER JOIN niveau     n ON s.id_niveau      = n.id_niveau
       INNER JOIN departement d ON n.id_departement = d.id_departement
       WHERE s.id_specialite = :id`,
      { replacements: { id }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );
    if (!spec) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Spécialité non trouvée' });
    }

    // Garde-fou : on ne peut pas restaurer une spec si son dept est archivé
    if (spec.dept_archived) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: `Impossible de restaurer : le département parent "${spec.nom_departement}" est archivé. Restaurez-le d'abord.`,
      });
    }

    // Restaurer
    await sequelize.query(
      `UPDATE specialite
       SET archived = false, archived_at = NULL, archived_by = NULL
       WHERE id_specialite = :id`,
      { replacements: { id }, type: sequelize.QueryTypes.UPDATE, transaction: t }
    );

    // Log
    const ip = (req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || '').toString().split(',')[0].trim();
    const ua = req.headers['user-agent'] || '';
    await sequelize.query(
      `INSERT INTO archive_log
         (entity_type, entity_id, entity_name, action, performed_by, ip_address, user_agent, reason, cascade_count, metadata)
       VALUES ('specialite', :id, :name, 'restore', :actor, :ip, :ua, :reason, 0, NULL)`,
      {
        replacements: {
          id, name: spec.nom_specialite, actor, ip, ua,
          reason: reason || null,
        },
        type: sequelize.QueryTypes.INSERT,
        transaction: t,
      }
    );

    await t.commit();
    res.json({ success: true, message: 'Spécialité restaurée avec succès', specialite: spec });
  } catch (error) {
    await t.rollback();
    console.error('Erreur restoreSpecialite:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};
