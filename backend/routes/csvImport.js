const express = require("express");
const router = express.Router();
const csvImportController = require("../controllers/csvImportController");
const { authenticate, authorize } = require("../middleware/auth");

// Toutes les routes nécessitent une authentification Admin
router.use(authenticate);
router.use(authorize(["ADMIN_MESRS"]));

// Valider le CSV avant import
router.post("/validate", csvImportController.validateCSV);

// Importer les utilisateurs depuis le CSV
router.post("/import", csvImportController.importCSV);

// Télécharger le template CSV
router.get("/template", csvImportController.downloadTemplate);

module.exports = router;
