const express = require("express");
const router = express.Router();
const directeurDepartementController = require("../controllers/directeurDepartementController");
const { authenticate, isDirecteur } = require("../middleware/auth");

// Routes pour la gestion des départements du directeur
router.get(
  "/",
  authenticate,
  isDirecteur,
  directeurDepartementController.getDirecteurDepartements
);

router.get(
  "/stats",
  authenticate,
  isDirecteur,
  directeurDepartementController.getDepartementsStats
);

router.get(
  "/:id",
  authenticate,
  isDirecteur,
  directeurDepartementController.getDepartementDetails
);

router.get(
  "/:id/specialites",
  authenticate,
  isDirecteur,
  directeurDepartementController.getDepartementSpecialites
);

router.get(
  "/:id/enseignants",
  authenticate,
  isDirecteur,
  directeurDepartementController.getDepartementEnseignants
);

router.get(
  "/:id/ml-data",
  authenticate,
  isDirecteur,
  directeurDepartementController.getDepartementMLData
);

router.get(
  "/:id/etudiants-risque",
  authenticate,
  isDirecteur,
  directeurDepartementController.getDepartementEtudiantsRisque
);

module.exports = router;
