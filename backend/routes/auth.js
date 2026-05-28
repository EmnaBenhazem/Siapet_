const express = require("express");
const router = express.Router();
const {
  login,
  requestPasswordReset,
  resetPassword,
  changePassword,
} = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");

// Routes publiques
router.post("/login", login);
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Déconnexion réussie" });
});
router.post("/password-reset/request", requestPasswordReset);
router.post("/password-reset/confirm", resetPassword);

// Routes protégées
router.post("/password/change", authenticateToken, changePassword);

module.exports = router;
