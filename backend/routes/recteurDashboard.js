const express = require("express");
const router = express.Router();
const recteurDashboardController = require("../controllers/recteurDashboardController");
const { authenticateToken, isRecteur } = require("../middleware/auth");

// Routes pour le dashboard recteur
router.get(
  "/stats",
  authenticateToken,
  isRecteur,
  recteurDashboardController.getDashboardStats
);

router.get(
  "/etudiants-par-etablissement",
  authenticateToken,
  isRecteur,
  recteurDashboardController.getEtudiantsParEtablissement
);

router.get(
  "/evolution-inscriptions",
  authenticateToken,
  isRecteur,
  recteurDashboardController.getEvolutionInscriptions
);

router.get(
  "/repartition-niveaux",
  authenticateToken,
  isRecteur,
  recteurDashboardController.getRepartitionNiveaux
);

router.get(
  "/comparaison-etablissements",
  authenticateToken,
  isRecteur,
  recteurDashboardController.getComparaisonEtablissements
);

router.get(
  "/etablissements-sous-tutelle",
  authenticateToken,
  isRecteur,
  recteurDashboardController.getEtablissementsSousTutelle
);

router.get(
  "/ml-data",
  authenticateToken,
  isRecteur,
  recteurDashboardController.getMLData
);

module.exports = router;
