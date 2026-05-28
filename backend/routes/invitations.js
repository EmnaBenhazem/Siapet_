const express = require("express");
const router = express.Router();
const invitationController = require("../controllers/invitationController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

// Route protégée - Admin uniquement
router.post("/send", authenticateToken, requireAdmin, invitationController.sendInvitations);

module.exports = router;
