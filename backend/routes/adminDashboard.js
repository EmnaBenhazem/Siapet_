const express = require("express");
const router = express.Router();
const adminDashboardController = require("../controllers/adminDashboardController");
const { authenticateToken, isAdmin } = require("../middleware/auth");

// Toutes les routes nécessitent une authentification Admin (ADMIN ou ADMIN_MESRS)
router.use(authenticateToken);
router.use(isAdmin);

// Récupérer les données par région
router.get("/regions", adminDashboardController.getRegionData);
router.get("/regions/:id_region", adminDashboardController.getRegionData);

// Comparaison inter-régions
router.get("/regions-comparison", adminDashboardController.compareRegions);

// Récupérer 10 établissements aléatoires
router.get(
  "/random-etablissements",
  adminDashboardController.getRandomEtablissements,
);

module.exports = router;
