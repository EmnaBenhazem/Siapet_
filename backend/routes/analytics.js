const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { authenticateToken } = require("../middleware/auth");

const canViewAnalytics = (req, res, next) => {
  const allowed = ['ADMIN_MESRS', 'ADMIN', 'RECTEUR', 'DIRECTEUR'];
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé — rôle insuffisant', userRole: req.user.role });
  }
  next();
};

router.use(authenticateToken);
router.use(canViewAnalytics);

router.get("/national",         analyticsController.getNationalStats);
router.get("/rapport/filtres",  analyticsController.getFiltresRapport);
router.get("/rapport",          analyticsController.getRapport);

module.exports = router;
