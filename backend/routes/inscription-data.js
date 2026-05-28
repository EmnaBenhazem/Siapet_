/**
 * Routes API pour les données d'inscription
 * Permet de récupérer la hiérarchie universitaire pour le formulaire d'inscription
 */

const express = require("express");
const router = express.Router();
const pool = require("../config/database");

/**
 * GET /api/inscription-data/rectorats
 * Récupérer tous les rectorats (universités)
 */
router.get("/rectorats", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id_rectorat,
        nom_rectorat,
        code_rectorat,
        type,
        nombre_etablissements
      FROM rectorat 
      ORDER BY nom_rectorat
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des rectorats:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des rectorats",
    });
  }
});

/**
 * GET /api/inscription-data/etablissements/:id_rectorat
 * Récupérer les établissements d'un rectorat
 */
router.get("/etablissements/:id_rectorat", async (req, res) => {
  try {
    const { id_rectorat } = req.params;

    const result = await pool.query(
      `
      SELECT 
        id_etablissement,
        nom_etablissement,
        code_etablissement,
        type,
        adresse,
        telephone,
        email
      FROM etablissement 
      WHERE id_rectorat = $1
      ORDER BY nom_etablissement
    `,
      [id_rectorat],
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des établissements:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des établissements",
    });
  }
});

/**
 * GET /api/inscription-data/departements/:id_etablissement
 * Récupérer les départements d'un établissement
 */
router.get("/departements/:id_etablissement", async (req, res) => {
  try {
    const { id_etablissement } = req.params;

    const result = await pool.query(
      `
      SELECT 
        id_departement,
        nom_departement,
        code_departement,
        description,
        nombre_enseignants,
        nombre_etudiants
      FROM departement 
      WHERE id_etablissement = $1
      ORDER BY nom_departement
    `,
      [id_etablissement],
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des départements:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des départements",
    });
  }
});

/**
 * GET /api/inscription-data/niveaux/:id_departement
 * Récupérer les niveaux d'un département
 */
router.get("/niveaux/:id_departement", async (req, res) => {
  try {
    const { id_departement } = req.params;

    const result = await pool.query(
      `
      SELECT 
        id_niveau,
        type_niveau,
        nom_niveau,
        duree_annees,
        description
      FROM niveau 
      WHERE id_departement = $1
      ORDER BY 
        CASE type_niveau
          WHEN 'LICENCE' THEN 1
          WHEN 'LICENCE_APPLIQUEE' THEN 2
          WHEN 'MASTER' THEN 3
          WHEN 'MASTER_PROFESSIONNEL' THEN 4
          WHEN 'INGENIEUR' THEN 5
          WHEN 'DOCTORAT' THEN 6
          WHEN 'MBA' THEN 7
          WHEN 'RESIDANAT' THEN 8
          WHEN 'AGREGATION' THEN 9
          WHEN 'CYCLE_PREPARATOIRE' THEN 10
          ELSE 11
        END
    `,
      [id_departement],
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des niveaux:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des niveaux",
    });
  }
});

/**
 * GET /api/inscription-data/specialites/:id_niveau
 * Récupérer les spécialités d'un niveau
 */
router.get("/specialites/:id_niveau", async (req, res) => {
  try {
    const { id_niveau } = req.params;

    const result = await pool.query(
      `
      SELECT 
        id_specialite,
        nom_specialite,
        code_specialite,
        description,
        nombre_credits,
        duree_formation
      FROM specialite 
      WHERE id_niveau = $1
      ORDER BY nom_specialite
    `,
      [id_niveau],
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des spécialités:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des spécialités",
    });
  }
});

/**
 * GET /api/inscription-data/hierarchie/:id_specialite
 * Récupérer la hiérarchie complète pour une spécialité
 */
router.get("/hierarchie/:id_specialite", async (req, res) => {
  try {
    const { id_specialite } = req.params;

    const result = await pool.query(
      `
      SELECT 
        r.id_rectorat,
        r.nom_rectorat,
        r.code_rectorat,
        e.id_etablissement,
        e.nom_etablissement,
        e.code_etablissement,
        e.type as type_etablissement,
        d.id_departement,
        d.nom_departement,
        d.code_departement,
        n.id_niveau,
        n.type_niveau,
        n.nom_niveau,
        n.duree_annees,
        s.id_specialite,
        s.nom_specialite,
        s.code_specialite,
        s.description,
        s.nombre_credits
      FROM specialite s
      JOIN niveau n ON s.id_niveau = n.id_niveau
      JOIN departement d ON n.id_departement = d.id_departement
      JOIN etablissement e ON d.id_etablissement = e.id_etablissement
      JOIN rectorat r ON e.id_rectorat = r.id_rectorat
      WHERE s.id_specialite = $1
    `,
      [id_specialite],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Spécialité non trouvée",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de la hiérarchie:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la hiérarchie",
    });
  }
});

/**
 * GET /api/inscription-data/search
 * Rechercher des spécialités par mot-clé
 */
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Le terme de recherche doit contenir au moins 2 caractères",
      });
    }

    const searchTerm = `%${q.trim()}%`;

    const result = await pool.query(
      `
      SELECT 
        r.nom_rectorat,
        e.nom_etablissement,
        d.nom_departement,
        n.type_niveau,
        s.id_specialite,
        s.nom_specialite,
        s.code_specialite
      FROM specialite s
      JOIN niveau n ON s.id_niveau = n.id_niveau
      JOIN departement d ON n.id_departement = d.id_departement
      JOIN etablissement e ON d.id_etablissement = e.id_etablissement
      JOIN rectorat r ON e.id_rectorat = r.id_rectorat
      WHERE 
        s.nom_specialite ILIKE $1 OR
        d.nom_departement ILIKE $1 OR
        e.nom_etablissement ILIKE $1
      ORDER BY r.nom_rectorat, e.nom_etablissement, s.nom_specialite
      LIMIT 50
    `,
      [searchTerm],
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Erreur lors de la recherche:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la recherche",
    });
  }
});

/**
 * GET /api/inscription-data/stats
 * Récupérer les statistiques globales
 */
router.get("/stats", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM rectorat) as nb_rectorats,
        (SELECT COUNT(*) FROM etablissement) as nb_etablissements,
        (SELECT COUNT(*) FROM departement) as nb_departements,
        (SELECT COUNT(*) FROM niveau) as nb_niveaux,
        (SELECT COUNT(*) FROM specialite) as nb_specialites
    `);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
    });
  }
});

module.exports = router;
