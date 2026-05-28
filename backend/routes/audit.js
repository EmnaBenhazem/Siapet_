const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");
const { authenticate, isAdmin } = require("../middleware/auth");

// Routes pour l'historique d'audit
router.get("/", authenticate, isAdmin, auditController.getAllAuditHistory);

router.get(
  "/user/:id",
  authenticate,
  isAdmin,
  auditController.getUserAuditHistory,
);

module.exports = router;
