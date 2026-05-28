const express = require("express");
const router = express.Router();
const {
  getEvaluations,
  getEtudiantsWithNotes,
  createEvaluation,
  saveNotes,
} = require("../controllers/enseignantDashboardController");
const { authenticateToken, authorize } = require("../middleware/auth");

router.use(authenticateToken);
router.use(authorize("ENSEIGNANT"));

router.get("/evaluations", getEvaluations);
router.get("/etudiants", getEtudiantsWithNotes);
router.post("/evaluation", createEvaluation);
router.post("/save", saveNotes);

module.exports = router;
