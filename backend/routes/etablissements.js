const express = require("express");
const router = express.Router();
const etablissementController = require("../controllers/etablissementController");
const recteurEtablissementController = require("../controllers/recteurEtablissementController");
const { authenticateToken, isAdmin, isRecteur, isDirecteur } = require("../middleware/auth");

// Routes publiques (pour les formulaires d'inscription)
// GET /api/etablissements/universites - Liste des universités
router.get("/universites", async (req, res) => {
  try {
    const sequelize = require("../config/database");

    const [universites] = await sequelize.query(`
      SELECT id_rectorat as id, nom_rectorat as nom_etablissement, code_rectorat as code, type
      FROM rectorat
      WHERE type IN ('UNIVERSITE', 'DGET')
      ORDER BY 
        CASE WHEN type = 'DGET' THEN 0 ELSE 1 END,
        nom_rectorat ASC
    `);

    res.json({
      success: true,
      data: universites,
    });
  } catch (error) {
    console.error("Erreur récupération universités:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
});

// GET /api/etablissements/public - Liste publique (pour formulaires)
router.get("/public", async (req, res) => {
  try {
    const { type, universite_id } = req.query;
    const sequelize = require("../config/database");

    let query = `
      SELECT 
        e.id_etablissement as id,
        e.nom_etablissement,
        e.code_etablissement as code,
        e.type,
        e.id_ville,
        e.id_rectorat,
        r.nom_rectorat as universite_nom
      FROM etablissement e
      LEFT JOIN rectorat r ON e.id_rectorat = r.id_rectorat
      WHERE 1=1
    `;

    if (universite_id) {
      query += ` AND e.id_rectorat = ${parseInt(universite_id)}`;
    }

    query += ` ORDER BY e.nom_etablissement ASC`;

    const [etablissements] = await sequelize.query(query);

    res.json({
      success: true,
      data: etablissements,
    });
  } catch (error) {
    console.error("Erreur récupération établissements:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
});

// Routes protégées - Admin uniquement
// IMPORTANT: Les routes spécifiques doivent être définies AVANT le middleware général

// Routes pour le recteur
router.get(
  "/recteur",
  authenticateToken,
  isRecteur,
  recteurEtablissementController.getRecteurEtablissements,
);

router.get(
  "/recteur/stats",
  authenticateToken,
  isRecteur,
  recteurEtablissementController.getRecteurEtablissementsStats,
);

router.get(
  "/recteur/export",
  authenticateToken,
  isRecteur,
  recteurEtablissementController.exportRecteurEtablissements,
);

router.get(
  "/recteur/archives",
  authenticateToken,
  isRecteur,
  recteurEtablissementController.getRecteurEtablissementsArchives,
);

// GET /api/etablissements/recteur/risque-global - Risque scoped au rectorat (Recteur)
// DOIT être avant /recteur/:id pour éviter que "risque-global" soit capturé comme id
router.get("/recteur/risque-global", authenticateToken, isRecteur, etablissementController.getRisqueGlobalRecteur);

router.delete(
  "/recteur/:id",
  authenticateToken,
  isRecteur,
  recteurEtablissementController.archiveRecteurEtablissement,
);

router.put(
  "/recteur/:id/restore",
  authenticateToken,
  isRecteur,
  recteurEtablissementController.restoreRecteurEtablissement,
);

router.get(
  "/recteur/:id",
  authenticateToken,
  isRecteur,
  recteurEtablissementController.getRecteurEtablissementDetails,
);

// Routes pour les détails d'un établissement (départements, spécialités, enseignants) - Recteur
router.get(
  "/recteur/:id/departements",
  authenticateToken,
  isRecteur,
  etablissementController.getDepartementsByEtablissement,
);

router.get(
  "/recteur/:id/specialites",
  authenticateToken,
  isRecteur,
  etablissementController.getSpecialitesByEtablissement,
);

router.get(
  "/recteur/:id/enseignants",
  authenticateToken,
  isRecteur,
  etablissementController.getEnseignantsByEtablissement,
);

router.get(
  "/recteur/:id/etudiants-risque",
  authenticateToken,
  isRecteur,
  etablissementController.getEtudiantsARisqueByEtablissement,
);

router.get(
  "/recteur/departements/:departementId/specialites",
  authenticateToken,
  isRecteur,
  etablissementController.getSpecialitesByDepartement,
);

// Détail d'un département (Recteur)
router.get("/recteur/departements/:id/detail",           authenticateToken, isRecteur, etablissementController.getDepartementDetail);
router.get("/recteur/departements/:id/specialites",      authenticateToken, isRecteur, etablissementController.getDepartementDetailSpecialites);
router.get("/recteur/departements/:id/enseignants",      authenticateToken, isRecteur, etablissementController.getDepartementDetailEnseignants);
router.get("/recteur/departements/:id/ml-data",          authenticateToken, isRecteur, etablissementController.getDepartementDetailMLData);
router.get("/recteur/departements/:id/etudiants-risque", authenticateToken, isRecteur, etablissementController.getDepartementDetailEtudiantsRisque);

// Archivage départements (Recteur)
router.get(  "/recteur/:id/departements-archives",     authenticateToken, isRecteur, etablissementController.getArchivedDepartementsByEtablissement);
router.get(  "/recteur/departements/:id/impact",       authenticateToken, isRecteur, etablissementController.getDepartementImpact);
router.put(  "/recteur/departements/:id",              authenticateToken, isRecteur, etablissementController.updateDepartement);
router.patch("/recteur/departements/:id/archive",      authenticateToken, isRecteur, etablissementController.archiveDepartement);
router.patch("/recteur/departements/:id/restore",      authenticateToken, isRecteur, etablissementController.restoreDepartement);

// Archivage spécialités (Recteur)
router.get(  "/recteur/:id/specialites-archives",      authenticateToken, isRecteur, etablissementController.getArchivedSpecialitesByEtablissement);
router.get(  "/recteur/specialites/:id/impact",        authenticateToken, isRecteur, etablissementController.getSpecialiteImpact);
router.patch("/recteur/specialites/:id/archive",       authenticateToken, isRecteur, etablissementController.archiveSpecialite);
router.patch("/recteur/specialites/:id/restore",       authenticateToken, isRecteur, etablissementController.restoreSpecialite);

// GET /api/etablissements/admin/risque-global - Risque tous établissements (Admin)
router.get("/admin/risque-global", authenticateToken, isAdmin, etablissementController.getRisqueGlobalAdmin);

// GET /api/etablissements/directeur/risque-global - Risque scoped à l'établissement (Directeur)
router.get("/directeur/risque-global", authenticateToken, isDirecteur, etablissementController.getRisqueGlobalDirecteur);

// GET /api/etablissements/stats - Statistiques
router.get(
  "/stats",
  authenticateToken,
  isAdmin,
  etablissementController.getEtablissementsStats,
);

// GET /api/etablissements/export - Exporter en CSV
router.get(
  "/export",
  authenticateToken,
  isAdmin,
  etablissementController.exportEtablissements,
);

// Appliquer le middleware pour toutes les routes suivantes
router.use(authenticateToken, isAdmin);

// GET /api/etablissements - Liste avec filtres et pagination
router.get("/", etablissementController.getEtablissements);

// GET /api/etablissements/departements/:departementId/specialites - Spécialités d'un département (AVANT /:id)
router.get(
  "/departements/:departementId/specialites",
  etablissementController.getSpecialitesByDepartement,
);

// Détail d'un département (Admin)
router.get("/departements/:id/detail",           etablissementController.getDepartementDetail);
router.get("/departements/:id/dept-specialites", etablissementController.getDepartementDetailSpecialites);
router.get("/departements/:id/enseignants",      etablissementController.getDepartementDetailEnseignants);
router.get("/departements/:id/ml-data",          etablissementController.getDepartementDetailMLData);
router.get("/departements/:id/etudiants-risque", etablissementController.getDepartementDetailEtudiantsRisque);

// Archivage départements (Admin)
router.get(  "/:id/departements-archives",       etablissementController.getArchivedDepartementsByEtablissement);
router.get(  "/departements/:id/impact",         etablissementController.getDepartementImpact);
router.put(  "/departements/:id",                etablissementController.updateDepartement);
router.patch("/departements/:id/archive",        etablissementController.archiveDepartement);
router.patch("/departements/:id/restore",        etablissementController.restoreDepartement);

// Archivage spécialités (Admin)
router.get(  "/:id/specialites-archives",        etablissementController.getArchivedSpecialitesByEtablissement);
router.get(  "/specialites/:id/impact",          etablissementController.getSpecialiteImpact);
router.patch("/specialites/:id/archive",         etablissementController.archiveSpecialite);
router.patch("/specialites/:id/restore",         etablissementController.restoreSpecialite);

// GET /api/etablissements/:id - Détail d'un établissement
router.get("/:id", etablissementController.getEtablissementById);

// GET /api/etablissements/:id/departements - Départements d'un établissement
router.get(
  "/:id/departements",
  etablissementController.getDepartementsByEtablissement,
);

// GET /api/etablissements/:id/specialites - Spécialités d'un établissement
router.get(
  "/:id/specialites",
  etablissementController.getSpecialitesByEtablissement,
);

// GET /api/etablissements/:id/enseignants - Enseignants d'un établissement
router.get(
  "/:id/enseignants",
  etablissementController.getEnseignantsByEtablissement,
);

// GET /api/etablissements/:id/etudiants-risque - Étudiants à risque par département
router.get(
  "/:id/etudiants-risque",
  etablissementController.getEtudiantsARisqueByEtablissement,
);

// POST /api/etablissements - Créer un établissement
router.post("/", authenticateToken, isAdmin, etablissementController.createEtablissement);

// PUT /api/etablissements/:id - Modifier un établissement
router.put("/:id", authenticateToken, isAdmin, etablissementController.updateEtablissement);

// PATCH /api/etablissements/:id/archive - Archiver (avec password + log)
router.patch("/:id/archive",  etablissementController.archiveEtablissement);
router.patch("/:id/restore",  etablissementController.restoreEtablissement);
router.get(  "/:id/archive-log", etablissementController.getEtablissementArchiveLog);

// LEGACY : DELETE /api/etablissements/:id (compatible ancien code)
router.delete("/:id", etablissementController.archiveEtablissement);
router.post("/:id/restore", etablissementController.restoreEtablissement);

// DELETE /api/etablissements/:id/permanent - Supprimer définitivement un établissement
router.delete(
  "/:id/permanent",
  etablissementController.deleteEtablissementPermanent,
);

module.exports = router;
