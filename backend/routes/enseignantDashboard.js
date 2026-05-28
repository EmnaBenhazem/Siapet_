const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getFilters,
  getStatsParMatiere,
  exportStudentsToExcel,
  getEtudiantsARisque,
  getUniversite,
  getPlanning,
  createSeance,
  getChartsData,
  getStudents,
  getAbsences,
  saveAbsences,
  getHistoriqueAbsences,
  justifierAbsence,
  deleteAbsence,
  marquerAbsenceEtudiant,
} = require("../controllers/enseignantDashboardController");
const { authenticateToken, authorize } = require("../middleware/auth");

router.use(authenticateToken);
router.use(authorize("ENSEIGNANT"));

router.get("/filters", getFilters);
router.get("/stats-par-matiere", getStatsParMatiere);
router.get("/stats", getDashboardStats);
router.get("/universite", getUniversite);
router.get("/planning", getPlanning);
router.post("/planning", createSeance);
router.get("/etudiants-a-risque", getEtudiantsARisque);
router.get("/charts", getChartsData);
router.get("/students", getStudents);
router.get("/export-excel", exportStudentsToExcel);
router.get("/absences", getAbsences);
router.post("/absences", saveAbsences);
router.post("/absences/marquer", marquerAbsenceEtudiant);
router.get("/absences/historique", getHistoriqueAbsences);
router.patch("/absences/:id/justifier", justifierAbsence);
router.delete("/absences/:id", deleteAbsence);

module.exports = router;
