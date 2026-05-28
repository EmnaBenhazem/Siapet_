const express = require("express");
const router = express.Router();
const { sequelize } = require("../models");

// GET /api/departements?etablissement_id=X - Liste des départements d'un établissement
router.get("/", async (req, res) => {
  try {
    const { etablissement_id } = req.query;

    if (!etablissement_id) {
      return res.status(400).json({
        success: false,
        message: "etablissement_id requis",
      });
    }

    const [departements] = await sequelize.query(
      `SELECT id_departement as id, nom_departement, code_departement as code, id_etablissement as etablissement_id
       FROM departement
       WHERE id_etablissement = :etablissement_id
       ORDER BY nom_departement ASC`,
      {
        replacements: { etablissement_id },
      },
    );

    res.json({
      success: true,
      data: departements,
    });
  } catch (error) {
    console.error("Erreur récupération départements:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
});

// GET /api/departements/:id/specialites - Liste des spécialités d'un département
router.get("/:id/specialites", async (req, res) => {
  try {
    const { id } = req.params;

    const [specialites] = await sequelize.query(
      `SELECT id_specialite as id, nom_specialite, id_niveau as niveau_id
       FROM specialite
       WHERE id_niveau IN (
         SELECT id_niveau FROM niveau WHERE id_departement = :departement_id
       )
       ORDER BY nom_specialite ASC`,
      {
        replacements: { departement_id: id },
      },
    );

    res.json({
      success: true,
      data: specialites,
    });
  } catch (error) {
    console.error("Erreur récupération spécialités:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
});

module.exports = router;
