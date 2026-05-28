const auditService = require("../services/auditService");

// Récupérer l'historique d'audit pour un utilisateur spécifique
exports.getUserAuditHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const history = await auditService.getUserAuditHistory(id, parseInt(limit));

    res.json({
      history,
      total: history.length,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération de l'historique",
      error: error.message,
    });
  }
};

// Récupérer tout l'historique d'audit avec pagination
exports.getAllAuditHistory = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, role } = req.query;

    const result = await auditService.getAllAuditHistory(
      parseInt(page),
      parseInt(limit),
      action,
      role,
    );

    res.json(result);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'historique complet:",
      error,
    );
    res.status(500).json({
      message: "Erreur lors de la récupération de l'historique complet",
      error: error.message,
    });
  }
};
