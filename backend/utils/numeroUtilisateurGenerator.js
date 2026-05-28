const { sequelize } = require("../models");

/**
 * Génère un numéro d'utilisateur unique selon le rôle
 * Format: ETU-001, ENS-001, ADMIN-001, etc.
 */
const generateNumeroUtilisateur = async (role) => {
  let prefix;

  switch (role) {
    case "ETUDIANT":
      prefix = "ETU";
      break;
    case "ENSEIGNANT":
      prefix = "ENS";
      break;
    case "DIRECTEUR":
      prefix = "DIR";
      break;
    case "RECTEUR":
      prefix = "RECT";
      break;
    case "ADMIN_MESRS":
      prefix = "ADMIN";
      break;
    default:
      prefix = "USER";
  }

  try {
    // Trouver le dernier numéro utilisé pour ce préfixe
    const [results] = await sequelize.query(
      `
      SELECT numero_utilisateur 
      FROM utilisateur 
      WHERE numero_utilisateur LIKE :pattern
      ORDER BY numero_utilisateur DESC 
      LIMIT 1
      `,
      {
        replacements: { pattern: `${prefix}-%` },
      },
    );

    let nextNumber = 1;

    if (results.length > 0) {
      // Extraire le numéro de la dernière entrée (ex: ETU-005 -> 5)
      const lastNumero = results[0].numero_utilisateur;
      const lastNumber = parseInt(lastNumero.split("-")[1], 10);
      nextNumber = lastNumber + 1;
    }

    // Formater avec des zéros (ex: 1 -> 001, 25 -> 025)
    const formattedNumber = String(nextNumber).padStart(3, "0");

    return `${prefix}-${formattedNumber}`;
  } catch (error) {
    console.error("Erreur génération numéro utilisateur:", error);
    // Fallback en cas d'erreur
    return `${prefix}-${Date.now()}`;
  }
};

module.exports = {
  generateNumeroUtilisateur,
};
