const { sequelize } = require("../models");

// RÃ©cupÃ©rer tous les Ã©tablissements du rectorat du recteur connectÃ©
exports.getRecteurEtablissements = async (req, res) => {
  try {
    const recteurId = req.user.numero_utilisateur;
    const {
      search,
      type,
      page = 1,
      limit = 10,
      archived = "false",
    } = req.query;

    // RÃ©cupÃ©rer le rectorat du recteur connectÃ©
    const recteurInfo = await sequelize.query(
      `SELECT id_rectorat FROM recteur_universite WHERE numero_utilisateur = $1`,
      {
        bind: [recteurId],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (recteurInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Rectorat non trouvÃ© pour ce recteur",
      });
    }

    const idRectorat = recteurInfo[0].id_rectorat;

    // Construction de la requÃªte avec filtres
    let whereConditions = [`e.id_rectorat = $1`];
    let params = [idRectorat];
    let paramIndex = 2;

    // Filtrer par statut archivÃ©
    if (archived === "true") {
      whereConditions.push(`e.archive = true`);
    } else {
      whereConditions.push(`(e.archive IS NULL OR e.archive = false)`);
    }

    if (search && search.trim() !== "") {
      whereConditions.push(
        `(LOWER(e.nom_etablissement) LIKE LOWER($${paramIndex}) OR LOWER(e.code_etablissement) LIKE LOWER($${paramIndex}))`,
      );
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (type && type !== "") {
      whereConditions.push(`e.type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    // Compter le total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM etablissement e
      ${whereClause}
    `;

    const countResult = await sequelize.query(countQuery, {
      bind: params,
      type: sequelize.QueryTypes.SELECT,
    });

    const total = parseInt(countResult[0].total);
    const offset = (page - 1) * limit;

    // RÃ©cupÃ©rer les Ã©tablissements
    const query = `
      SELECT 
        e.id_etablissement,
        e.code_etablissement,
        e.nom_etablissement,
        e.type,
        e.adresse,
        e.telephone,
        e.email,
        e.site_web,
        e.budget_alloue,
        e.capacite_maximale,
        e.date_creation,
        e.effectif_total,
        v.nom_ville,
        r.nom_region,
        rec.nom_rectorat
      FROM etablissement e
      LEFT JOIN ville v ON e.id_ville = v.id_ville
      LEFT JOIN region r ON v.id_region = r.id_region
      LEFT JOIN rectorat rec ON e.id_rectorat = rec.id_rectorat
      ${whereClause}
      ORDER BY e.nom_etablissement ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(parseInt(limit), offset);

    const etablissements = await sequelize.query(query, {
      bind: params,
      type: sequelize.QueryTypes.SELECT,
    });

    console.log("âœ… Ã‰tablissements rÃ©cupÃ©rÃ©s:", etablissements.length);
    if (etablissements.length > 0) {
      console.log(
        "ðŸ“Š Premier Ã©tablissement - effectif_total:",
        etablissements[0].effectif_total,
      );
    }

    res.json({
      success: true,
      etablissements,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error(
      "Erreur lors de la rÃ©cupÃ©ration des Ã©tablissements:",
      error,
    );
    res.status(500).json({
      success: false,
      message: "Erreur lors de la rÃ©cupÃ©ration des Ã©tablissements",
      error: error.message,
    });
  }
};

// RÃ©cupÃ©rer les statistiques des Ã©tablissements du recteur
exports.getRecteurEtablissementsStats = async (req, res) => {
  try {
    const recteurId = req.user.numero_utilisateur;

    // RÃ©cupÃ©rer le rectorat du recteur connectÃ©
    const recteurInfo = await sequelize.query(
      `SELECT id_rectorat FROM recteur_universite WHERE numero_utilisateur = $1`,
      {
        bind: [recteurId],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (recteurInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Rectorat non trouvÃ© pour ce recteur",
      });
    }

    const idRectorat = recteurInfo[0].id_rectorat;

    const stats = await sequelize.query(
      `
      SELECT 
        COUNT(*) as total_etablissements,
        COUNT(CASE WHEN type = 'FACULTE' THEN 1 END) as total_facultes,
        COUNT(CASE WHEN type = 'ECOLE' THEN 1 END) as total_ecoles,
        COUNT(CASE WHEN type = 'INSTITUT' THEN 1 END) as total_instituts,
        COUNT(CASE WHEN type = 'ISET' THEN 1 END) as total_isets,
        SUM(budget_alloue) as budget_total,
        SUM(capacite_maximale) as capacite_totale
      FROM etablissement
      WHERE id_rectorat = $1
    `,
      {
        bind: [idRectorat],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    // RÃ©cupÃ©rer l'effectif total
    const effectifResult = await sequelize.query(
      `
      SELECT COUNT(*) as effectif_total
      FROM etudiant et
      JOIN etablissement e ON et.id_etablissement = e.id_etablissement
      WHERE e.id_rectorat = $1
    `,
      {
        bind: [idRectorat],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    res.json({
      success: true,
      stats: {
        ...stats[0],
        effectif_total: parseInt(effectifResult[0].effectif_total),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la rÃ©cupÃ©ration des statistiques:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la rÃ©cupÃ©ration des statistiques",
      error: error.message,
    });
  }
};

// RÃ©cupÃ©rer les dÃ©tails d'un Ã©tablissement
exports.getRecteurEtablissementDetails = async (req, res) => {
  try {
    const recteurId = req.user.numero_utilisateur;
    const { id } = req.params;

    // RÃ©cupÃ©rer le rectorat du recteur connectÃ©
    const recteurInfo = await sequelize.query(
      `SELECT id_rectorat FROM recteur_universite WHERE numero_utilisateur = $1`,
      {
        bind: [recteurId],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (recteurInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Rectorat non trouvÃ© pour ce recteur",
      });
    }

    const idRectorat = recteurInfo[0].id_rectorat;

    // RÃ©cupÃ©rer l'Ã©tablissement
    const etablissement = await sequelize.query(
      `
      SELECT 
        e.*,
        v.nom_ville,
        r.nom_region,
        rec.nom_rectorat,
        rec.nom_rectorat as universite_nom,
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
      LEFT JOIN ville v ON e.id_ville = v.id_ville
      LEFT JOIN region r ON v.id_region = r.id_region
      LEFT JOIN rectorat rec ON e.id_rectorat = rec.id_rectorat
      WHERE e.id_etablissement = $1 AND e.id_rectorat = $2
    `,
      {
        bind: [id, idRectorat],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (etablissement.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ã‰tablissement non trouvÃ© ou non autorisÃ©",
      });
    }

    res.json({
      success: true,
      etablissement: etablissement[0],
    });
  } catch (error) {
    console.error("Erreur lors de la rÃ©cupÃ©ration des dÃ©tails:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la rÃ©cupÃ©ration des dÃ©tails",
      error: error.message,
    });
  }
};

// Exporter les Ã©tablissements en CSV
exports.exportRecteurEtablissements = async (req, res) => {
  try {
    const recteurId = req.user.numero_utilisateur;
    const { type, id } = req.query;

    // RÃ©cupÃ©rer le rectorat du recteur connectÃ©
    const recteurInfo = await sequelize.query(
      `SELECT id_rectorat FROM recteur_universite WHERE numero_utilisateur = $1`,
      {
        bind: [recteurId],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (recteurInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Rectorat non trouvÃ© pour ce recteur",
      });
    }

    const idRectorat = recteurInfo[0].id_rectorat;

    // Construction de la requÃªte avec filtres
    let whereConditions = [`e.id_rectorat = $1`];
    let params = [idRectorat];
    let paramIndex = 2;

    if (type && type !== "") {
      whereConditions.push(`e.type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    // Si un ID sp�cifique est fourni, exporter uniquement cet �tablissement
    if (id) {
      whereConditions.push(`e.id_etablissement = $${paramIndex}`);
      params.push(id);
      paramIndex++;
    }
    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    // Récupérer tous les établissements
    const query = `
      SELECT 
        e.code_etablissement as "Code",
        e.nom_etablissement as "Nom",
        e.type as "Type",
        e.adresse as "Adresse",
        e.telephone as "Téléphone",
        e.email as "Email",
        e.site_web as "Site Web",
        e.budget_alloue as "Budget Alloué",
        e.capacite_maximale as "Capacité Maximale",
        v.nom_ville as "Ville",
        r.nom_region as "Région",
        e.effectif_total as "Effectif Total",
        TO_CHAR(e.date_creation, 'DD/MM/YYYY') as "Date de Création"
      FROM etablissement e
      LEFT JOIN ville v ON e.id_ville = v.id_ville
      LEFT JOIN region r ON v.id_region = r.id_region
      ${whereClause}
      ORDER BY e.nom_etablissement ASC
    `;

    const etablissements = await sequelize.query(query, {
      bind: params,
      type: sequelize.QueryTypes.SELECT,
    });

    // CrÃ©er le CSV
    if (etablissements.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucun Ã©tablissement Ã  exporter",
      });
    }

    // En-tÃªtes CSV
    const headers = Object.keys(etablissements[0]);
    let csv = headers.join(";") + "\n";

    // DonnÃ©es
    etablissements.forEach((etab) => {
      const row = headers.map((header) => {
        const value = etab[header];
        // Ã‰chapper les guillemets et entourer de guillemets si nÃ©cessaire
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        if (
          stringValue.includes(";") ||
          stringValue.includes('"') ||
          stringValue.includes("\n")
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csv += row.join(";") + "\n";
    });

    // Envoyer le fichier
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=etablissements_${Date.now()}.csv`,
    );
    res.send("\uFEFF" + csv); // BOM pour UTF-8
  } catch (error) {
    console.error("Erreur lors de l'export:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'export",
      error: error.message,
    });
  }
};

// Archiver un Ã©tablissement
exports.archiveRecteurEtablissement = async (req, res) => {
  try {
    const recteurId = req.user.numero_utilisateur;
    const { id } = req.params;

    // RÃ©cupÃ©rer le rectorat du recteur connectÃ©
    const recteurInfo = await sequelize.query(
      `SELECT id_rectorat FROM recteur_universite WHERE numero_utilisateur = $1`,
      {
        bind: [recteurId],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (recteurInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Rectorat non trouvÃ© pour ce recteur",
      });
    }

    const idRectorat = recteurInfo[0].id_rectorat;

    // VÃ©rifier que l'Ã©tablissement appartient au rectorat du recteur
    const etablissement = await sequelize.query(
      `SELECT * FROM etablissement WHERE id_etablissement = $1 AND id_rectorat = $2`,
      {
        bind: [id, idRectorat],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (etablissement.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ã‰tablissement non trouvÃ© ou non autorisÃ©",
      });
    }

    // Archiver l'Ã©tablissement (soft delete)
    await sequelize.query(
      `UPDATE etablissement SET archive = true WHERE id_etablissement = $1`,
      {
        bind: [id],
        type: sequelize.QueryTypes.UPDATE,
      },
    );

    res.json({
      success: true,
      message: "Ã‰tablissement archivÃ© avec succÃ¨s",
    });
  } catch (error) {
    console.error("Erreur lors de l'archivage:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'archivage",
      error: error.message,
    });
  }
};

// RÃ©cupÃ©rer les Ã©tablissements archivÃ©s
exports.getRecteurEtablissementsArchives = async (req, res) => {
  try {
    const recteurId = req.user.numero_utilisateur;
    const { search, type, page = 1, limit = 10 } = req.query;

    // RÃ©cupÃ©rer le rectorat du recteur connectÃ©
    const recteurInfo = await sequelize.query(
      `SELECT id_rectorat FROM recteur_universite WHERE numero_utilisateur = $1`,
      {
        bind: [recteurId],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (recteurInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Rectorat non trouvÃ© pour ce recteur",
      });
    }

    const idRectorat = recteurInfo[0].id_rectorat;

    // Construction de la requÃªte avec filtres
    let whereConditions = [`e.id_rectorat = $1`, `e.archive = true`];
    let params = [idRectorat];
    let paramIndex = 2;

    if (search && search.trim() !== "") {
      whereConditions.push(
        `(LOWER(e.nom_etablissement) LIKE LOWER($${paramIndex}) OR LOWER(e.code_etablissement) LIKE LOWER($${paramIndex}))`,
      );
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (type && type !== "") {
      whereConditions.push(`e.type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    // Compter le total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM etablissement e
      ${whereClause}
    `;

    const countResult = await sequelize.query(countQuery, {
      bind: params,
      type: sequelize.QueryTypes.SELECT,
    });

    const total = parseInt(countResult[0].total);
    const offset = (page - 1) * limit;

    // RÃ©cupÃ©rer les Ã©tablissements archivÃ©s
    const query = `
      SELECT 
        e.id_etablissement,
        e.code_etablissement,
        e.nom_etablissement,
        e.type,
        e.adresse,
        e.telephone,
        e.email,
        e.date_creation,
        v.nom_ville,
        r.nom_region
      FROM etablissement e
      LEFT JOIN ville v ON e.id_ville = v.id_ville
      LEFT JOIN region r ON v.id_region = r.id_region
      ${whereClause}
      ORDER BY e.date_creation DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(parseInt(limit), offset);

    const etablissements = await sequelize.query(query, {
      bind: params,
      type: sequelize.QueryTypes.SELECT,
    });

    res.json({
      success: true,
      etablissements,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Erreur lors de la rÃ©cupÃ©ration des archives:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la rÃ©cupÃ©ration des archives",
      error: error.message,
    });
  }
};

// Restaurer un Ã©tablissement archivÃ©
exports.restoreRecteurEtablissement = async (req, res) => {
  try {
    const recteurId = req.user.numero_utilisateur;
    const { id } = req.params;

    // RÃ©cupÃ©rer le rectorat du recteur connectÃ©
    const recteurInfo = await sequelize.query(
      `SELECT id_rectorat FROM recteur_universite WHERE numero_utilisateur = $1`,
      {
        bind: [recteurId],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (recteurInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Rectorat non trouvÃ© pour ce recteur",
      });
    }

    const idRectorat = recteurInfo[0].id_rectorat;

    // VÃ©rifier que l'Ã©tablissement appartient au rectorat du recteur
    const etablissement = await sequelize.query(
      `SELECT * FROM etablissement WHERE id_etablissement = $1 AND id_rectorat = $2 AND archive = true`,
      {
        bind: [id, idRectorat],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (etablissement.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ã‰tablissement archivÃ© non trouvÃ© ou non autorisÃ©",
      });
    }

    // Restaurer l'Ã©tablissement
    await sequelize.query(
      `UPDATE etablissement SET archive = false WHERE id_etablissement = $1`,
      {
        bind: [id],
        type: sequelize.QueryTypes.UPDATE,
      },
    );

    res.json({
      success: true,
      message: "Ã‰tablissement restaurÃ© avec succÃ¨s",
    });
  } catch (error) {
    console.error("Erreur lors de la restauration:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la restauration",
      error: error.message,
    });
  }
};
