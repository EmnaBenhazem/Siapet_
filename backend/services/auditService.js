const { sequelize } = require("../models");

/**
 * Enregistre une action dans l'historique d'audit
 * @param {string} cibleId - ID de l'utilisateur cible
 * @param {string} acteurId - ID de l'utilisateur qui effectue l'action
 * @param {string} action - Type d'action (CREATION, MODIFICATION, ARCHIVAGE, etc.)
 * @param {object} details - Détails supplémentaires de l'action
 */
const logAction = async (cibleId, acteurId, action, details = {}) => {
  try {
    await sequelize.query(
      `INSERT INTO audit_log (numero_utilisateur_cible, numero_utilisateur_acteur, action, details)
       VALUES ($1, $2, $3, $4)`,
      {
        bind: [cibleId, acteurId, action, JSON.stringify(details)],
        type: sequelize.QueryTypes.INSERT,
      },
    );
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'audit:", error);
  }
};

/**
 * Récupère l'historique d'audit pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {number} limit - Nombre maximum d'entrées à retourner
 */
const getUserAuditHistory = async (userId, limit = 50) => {
  try {
    const history = await sequelize.query(
      `SELECT 
        a.id_audit,
        a.action,
        a.details,
        a.date_action,
        u_acteur.nom as acteur_nom,
        u_acteur.prenom as acteur_prenom,
        u_acteur.email as acteur_email,
        u_cible.nom as cible_nom,
        u_cible.prenom as cible_prenom,
        u_cible.email as cible_email
       FROM audit_log a
       LEFT JOIN utilisateur u_acteur ON a.numero_utilisateur_acteur = u_acteur.numero_utilisateur
       LEFT JOIN utilisateur u_cible ON a.numero_utilisateur_cible = u_cible.numero_utilisateur
       WHERE a.numero_utilisateur_cible = $1
       ORDER BY a.date_action DESC
       LIMIT $2`,
      {
        bind: [userId, limit],
        type: sequelize.QueryTypes.SELECT,
      },
    );
    return history;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    return [];
  }
};

/**
 * Récupère tout l'historique d'audit avec pagination
 * @param {number} page - Numéro de page
 * @param {number} limit - Nombre d'entrées par page
 * @param {string} action - Filtrer par type d'action (optionnel)
 */
const getAllAuditHistory = async (
  page = 1,
  limit = 50,
  action = null,
  role = null,
) => {
  try {
    const whereClauses = [];
    const params = [];
    let paramIndex = 1;

    if (action) {
      whereClauses.push(`a.action = $${paramIndex}`);
      params.push(action);
      paramIndex++;
    }

    if (role) {
      whereClauses.push(`u_cible.type_utilisateur = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    const whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_log a
      LEFT JOIN utilisateur u_cible ON a.numero_utilisateur_cible = u_cible.numero_utilisateur
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
        a.id_audit,
        a.action,
        a.details,
        a.date_action,
        u_acteur.nom as acteur_nom,
        u_acteur.prenom as acteur_prenom,
        u_acteur.email as acteur_email,
        u_acteur.type_utilisateur as acteur_role,
        u_cible.nom as cible_nom,
        u_cible.prenom as cible_prenom,
        u_cible.email as cible_email,
        u_cible.type_utilisateur as cible_role
      FROM audit_log a
      LEFT JOIN utilisateur u_acteur ON a.numero_utilisateur_acteur = u_acteur.numero_utilisateur
      LEFT JOIN utilisateur u_cible ON a.numero_utilisateur_cible = u_cible.numero_utilisateur
      ${whereClause}
      ORDER BY a.date_action DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(parseInt(limit), offset);

    const history = await sequelize.query(query, {
      bind: params,
      type: sequelize.QueryTypes.SELECT,
    });

    return {
      history,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'historique complet:",
      error,
    );
    return {
      history: [],
      pagination: { total: 0, page: 1, limit, totalPages: 0 },
    };
  }
};

module.exports = {
  logAction,
  getUserAuditHistory,
  getAllAuditHistory,
};
