const express = require("express");
const router = express.Router();
const demandeAccesController = require("../controllers/demandeAccesController");
const { authenticateToken, isAdmin } = require("../middleware/auth");

// Route publique - Soumettre une demande d'accès
router.post("/soumettre", demandeAccesController.soumettreDemande);

// Routes protégées - Admin uniquement
router.get(
  "/",
  authenticateToken,
  isAdmin,
  demandeAccesController.getAllDemandes
);

router.get(
  "/statistiques",
  authenticateToken,
  isAdmin,
  demandeAccesController.getStatistiquesDemandes
);

router.get(
  "/:id",
  authenticateToken,
  isAdmin,
  demandeAccesController.getDemandeById
);

router.put(
  "/:id/accepter",
  authenticateToken,
  isAdmin,
  demandeAccesController.accepterDemande
);

router.put(
  "/:id/refuser",
  authenticateToken,
  isAdmin,
  demandeAccesController.refuserDemande
);

module.exports = router;
