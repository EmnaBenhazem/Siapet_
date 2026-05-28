const { sequelize } = require("../models");
require("dotenv").config();

// Récupérer le profil de l'utilisateur connecté
const getProfile = async (req, res) => {
  try {
    console.log("🔍 getProfile - req.user:", req.user);
    const userEmail = req.user?.email;

    if (!userEmail) {
      console.error("❌ getProfile - Email manquant dans req.user");
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    console.log("✅ getProfile - Email trouvé:", userEmail);

    // Récupérer les informations de base de l'utilisateur
    const userResult = await sequelize.query(
      `SELECT 
        numero_utilisateur,
        nom,
        prenom,
        email,
        telephone,
        sexe,
        type_utilisateur,
        statut,
        date_creation
      FROM utilisateur 
      WHERE email = $1`,
      {
        bind: [userEmail],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    console.log("📊 getProfile - Résultat requête utilisateur:", userResult);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    const user = userResult[0];
    let profileData = { ...user };

    // Récupérer les informations spécifiques selon le type d'utilisateur
    if (user.type_utilisateur === "ENSEIGNANT") {
      const enseignantResult = await sequelize.query(
        `SELECT
          e.numero_enseignant,
          e.cin,
          e.grade,
          e.specialite,
          e.annees_experience,
          e.date_recrutement,
          d.nom_departement as departement_nom,
          d.id_departement as departement_id,
          etab.nom_etablissement as etablissement_nom,
          etab.id_etablissement as etablissement_id,
          r.nom_rectorat as universite_nom
        FROM enseignant e
        LEFT JOIN etablissement etab ON e.id_etablissement_principal = etab.id_etablissement
        LEFT JOIN rectorat r ON etab.id_rectorat = r.id_rectorat
        LEFT JOIN affectation a ON e.numero_utilisateur = a.numero_utilisateur
        LEFT JOIN departement d ON a.id_departement = d.id_departement
        WHERE e.numero_utilisateur = $1`,
        {
          bind: [user.numero_utilisateur],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (enseignantResult.length > 0) {
        profileData.enseignant = enseignantResult[0];
      }
    } else if (user.type_utilisateur === "ETUDIANT") {
      const etudiantResult = await sequelize.query(
        `SELECT 
          e.numero_etudiant,
          e.cin,
          e.date_naissance,
          e.id_specialite,
          e.adresse,
          e.code_postal,
          e.moyenne_generale,
          e.id_etablissement,
          v.nom_ville as ville_nom,
          v.id_ville,
          s.nom_specialite as specialite_nom,
          etab.nom_etablissement as etablissement_nom
        FROM etudiant e
        LEFT JOIN ville v ON e.id_ville = v.id_ville
        LEFT JOIN specialite s ON e.id_specialite = s.id_specialite
        LEFT JOIN etablissement etab ON e.id_etablissement = etab.id_etablissement
        WHERE e.numero_utilisateur = $1`,
        {
          bind: [user.numero_utilisateur],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (etudiantResult.length > 0) {
        profileData.etudiant = etudiantResult[0];
      }
    }

    console.log("✅ getProfile - Profil complet:", profileData);

    res.json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    console.error("❌ Erreur getProfile:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du profil",
      error: error.message,
    });
  }
};

// Mettre à jour le profil
const updateProfile = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const { nom, prenom, email, telephone, sexe } = req.body;

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    // Vérifier si le nouvel email existe déjà (si changé)
    if (email !== userEmail) {
      const emailCheck = await sequelize.query(
        "SELECT numero_utilisateur FROM utilisateur WHERE email = $1",
        {
          bind: [email],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (emailCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Cet email est déjà utilisé",
        });
      }
    }

    // Mettre à jour les informations de base
    const updateResult = await sequelize.query(
      `UPDATE utilisateur 
       SET nom = $1, prenom = $2, email = $3, telephone = $4, sexe = $5
       WHERE email = $6
       RETURNING numero_utilisateur, nom, prenom, email, telephone, sexe, type_utilisateur, statut`,
      {
        bind: [nom, prenom, email, telephone, sexe, userEmail],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (updateResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    res.json({
      success: true,
      message: "Profil mis à jour avec succès",
      data: updateResult[0],
    });
  } catch (error) {
    console.error("Erreur updateProfile:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du profil",
      error: error.message,
    });
  }
};

// Mettre à jour les informations spécifiques (enseignant/étudiant)
const updateSpecificProfile = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const updates = req.body;

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    // Récupérer le numéro utilisateur et le type
    const userResult = await sequelize.query(
      "SELECT numero_utilisateur, type_utilisateur FROM utilisateur WHERE email = $1",
      {
        bind: [userEmail],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    const { numero_utilisateur, type_utilisateur } = userResult[0];

    if (type_utilisateur === "ENSEIGNANT" && updates.enseignant) {
      const { grade, specialite, annees_experience } = updates.enseignant;

      await sequelize.query(
        `UPDATE enseignant 
         SET grade = COALESCE($1, grade),
             specialite = COALESCE($2, specialite),
             annees_experience = COALESCE($3, annees_experience)
         WHERE numero_utilisateur = $4`,
        {
          bind: [grade, specialite, annees_experience, numero_utilisateur],
          type: sequelize.QueryTypes.UPDATE,
        },
      );
    } else if (type_utilisateur === "ETUDIANT" && updates.etudiant) {
      const { id_specialite, id_ville, id_etablissement } = updates.etudiant;

      await sequelize.query(
        `UPDATE etudiant 
         SET id_specialite = COALESCE($1, id_specialite),
             id_ville = COALESCE($2, id_ville),
             id_etablissement = COALESCE($3, id_etablissement)
         WHERE numero_utilisateur = $4`,
        {
          bind: [id_specialite, id_ville, id_etablissement, numero_utilisateur],
          type: sequelize.QueryTypes.UPDATE,
        },
      );
    }

    res.json({
      success: true,
      message: "Informations spécifiques mises à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur updateSpecificProfile:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour",
      error: error.message,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateSpecificProfile,
};
