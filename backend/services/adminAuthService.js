const bcrypt = require("bcrypt");
const sequelize = require("../config/database");

/**
 * Vérifie que le mot de passe fourni correspond au compte admin (acteur de la requête).
 * Lève une Error avec un message lisible en cas d'échec.
 *
 * @param {string} adminId       - numero_utilisateur de l'admin connecté (req.user.numero_utilisateur)
 * @param {string} candidatePassword - mot de passe saisi dans le dialog frontend
 */
async function verifyAdminPassword(adminId, candidatePassword) {
  if (!candidatePassword) {
    const err = new Error("Le mot de passe administrateur est requis pour cette action.");
    err.status = 400;
    throw err;
  }

  const rows = await sequelize.query(
    "SELECT mot_de_passe FROM utilisateur WHERE numero_utilisateur = $1",
    { bind: [adminId], type: sequelize.QueryTypes.SELECT },
  );

  if (rows.length === 0) {
    const err = new Error("Administrateur introuvable.");
    err.status = 403;
    throw err;
  }

  const valid = await bcrypt.compare(candidatePassword, rows[0].mot_de_passe);
  if (!valid) {
    const err = new Error("Mot de passe administrateur incorrect.");
    err.status = 403;
    throw err;
  }
}

module.exports = { verifyAdminPassword };
