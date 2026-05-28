const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updateSpecificProfile,
} = require("../controllers/profileController");
const { authenticate } = require("../middleware/auth");

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// GET /api/profile - Récupérer le profil
router.get("/", getProfile);

// PUT /api/profile - Mettre à jour le profil de base
router.put("/", updateProfile);

// PUT /api/profile/specific - Mettre à jour les infos spécifiques
router.put("/specific", updateSpecificProfile);

// GET /api/profile/activity - Historique d'activité de l'utilisateur connecté
router.get("/activity", async (req, res) => {
  try {
    const sequelize = require("../config/database");
    const id = req.user.numero_utilisateur;
    const { limit = 20 } = req.query;
    const rows = await sequelize.query(
      `SELECT action, details, date_action
       FROM audit_log
       WHERE numero_utilisateur_acteur = $1 OR numero_utilisateur_cible = $1
       ORDER BY date_action DESC
       LIMIT $2`,
      { bind: [id, parseInt(limit)], type: sequelize.QueryTypes.SELECT }
    );
    res.json({ success: true, history: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
});

module.exports = router;
