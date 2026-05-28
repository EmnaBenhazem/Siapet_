const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User, Etudiant, Enseignant } = require("../models");
const {
  generateMatriculeEtudiant,
  generateMatriculeEnseignant,
  generateTemporaryPassword,
} = require("../utils/matriculeGenerator");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../utils/emailService");
const {
  generateNumeroUtilisateur,
} = require("../utils/numeroUtilisateurGenerator");
const mockDataService = require("../services/mockDataService");

// Vérifier si on utilise la base de données ou les mock data
const USE_DATABASE = process.env.USE_DATABASE === "true";

// Connexion
const login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis",
      });
    }

    // MODE MOCK DATA
    if (!USE_DATABASE) {
      console.log("🎭 MODE MOCK ACTIVÉ - Utilisation des données de test");

      const user = await mockDataService.login(email, mot_de_passe);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Email ou mot de passe incorrect",
        });
      }

      // Générer le token JWT
      const token = jwt.sign(
        {
          numero_utilisateur: user.numero_utilisateur,
          email: user.email,
          role: user.type_utilisateur,
        },
        process.env.JWT_SECRET || "votre_secret_jwt_super_securise",
        { expiresIn: "24h" },
      );

      return res.json({
        success: true,
        message: "Connexion réussie (MODE MOCK)",
        data: {
          token,
          user: {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            role: user.type_utilisateur,
            profil: user.profil,
          },
        },
      });
    }

    // MODE BASE DE DONNÉES (code original)
    // Trouver l'utilisateur
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(mot_de_passe);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      {
        numero_utilisateur: user.numero_utilisateur,
        email: user.email,
        role: user.type_utilisateur,
      },
      process.env.JWT_SECRET || "votre_secret_jwt_super_securise",
      { expiresIn: "24h" },
    );

    res.json({
      success: true,
      message: "Connexion réussie",
      data: {
        token,
        user: {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: user.type_utilisateur,
        },
      },
    });
  } catch (error) {
    console.error("Erreur login:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// Demande de réinitialisation de mot de passe
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requis",
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe
      return res.json({
        success: true,
        message:
          "Si cet email existe, un lien de réinitialisation a été envoyé",
      });
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Calculer la date d'expiration
    const expiryDate = new Date(Date.now() + 3600000); // 1 heure

    console.log("🔍 Création token reset:");
    console.log("  - Date actuelle:", new Date());
    console.log("  - Date.now():", Date.now());
    console.log("  - Date expiration calculée:", expiryDate);
    console.log("  - Timestamp expiration:", expiryDate.getTime());

    // Stocker le token
    user.reset_token = resetTokenHash;
    user.reset_token_expiry = expiryDate;
    await user.save();

    console.log("  - Date expiration après save:", user.reset_token_expiry);

    // Envoyer l'email
    await sendPasswordResetEmail(email, user.nom, user.prenom, resetToken);

    res.json({
      success: true,
      message: "Si cet email existe, un lien de réinitialisation a été envoyé",
    });
  } catch (error) {
    console.error("Erreur requestPasswordReset:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// Réinitialiser le mot de passe
const resetPassword = async (req, res) => {
  try {
    const { token, nouveau_mot_de_passe } = req.body;

    console.log("🔍 Reset password - Token reçu:", token);

    if (!token || !nouveau_mot_de_passe) {
      return res.status(400).json({
        success: false,
        message: "Token et nouveau mot de passe requis",
      });
    }

    // Hasher le token pour le comparer
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    console.log("🔍 Token hashé:", resetTokenHash);

    // Trouver l'utilisateur avec ce token valide
    const user = await User.findOne({
      where: {
        reset_token: resetTokenHash,
      },
    });

    console.log("🔍 Utilisateur trouvé:", user ? `${user.email}` : "Aucun");
    if (user) {
      console.log("🔍 Token expiry:", user.reset_token_expiry);
      console.log("🔍 Date actuelle:", new Date());
      console.log(
        "🔍 Token expiré?",
        new Date() > new Date(user.reset_token_expiry),
      );
    }

    if (!user || new Date() > new Date(user.reset_token_expiry)) {
      const errorMessage = !user
        ? "Token invalide"
        : "Token expiré. Veuillez demander un nouveau lien de réinitialisation.";

      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    // Mettre à jour le mot de passe
    user.mot_de_passe = nouveau_mot_de_passe;
    user.reset_token = null;
    user.reset_token_expiry = null;
    await user.save();

    res.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès",
    });
  } catch (error) {
    console.error("Erreur resetPassword:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// Changer le mot de passe (pour utilisateur connecté)
const changePassword = async (req, res) => {
  try {
    const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;
    const userId = req.user.id; // Depuis le middleware d'authentification

    if (!ancien_mot_de_passe || !nouveau_mot_de_passe) {
      return res.status(400).json({
        success: false,
        message: "Ancien et nouveau mot de passe requis",
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await user.comparePassword(ancien_mot_de_passe);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Ancien mot de passe incorrect",
      });
    }

    // Mettre à jour le mot de passe
    user.mot_de_passe = nouveau_mot_de_passe;
    await user.save();

    res.json({
      success: true,
      message: "Mot de passe changé avec succès",
    });
  } catch (error) {
    console.error("Erreur changePassword:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

module.exports = {
  login,
  requestPasswordReset,
  resetPassword,
  changePassword,
};
