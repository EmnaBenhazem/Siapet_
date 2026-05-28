const sequelize = require("../config/database");
const User = require("./User");
const Etablissement = require("./Etablissement");
const Directeur = require("./Directeur");
const Enseignant = require("./Enseignant");
const Etudiant = require("./Etudiant");
const DemandeAcces = require("./DemandeAcces");

// Définir les associations bidirectionnelles
User.hasOne(Directeur, { foreignKey: "numero_utilisateur", as: "directeur" });
Directeur.belongsTo(User, {
  foreignKey: "numero_utilisateur",
  as: "utilisateur",
});

User.hasOne(Enseignant, { foreignKey: "numero_utilisateur", as: "enseignant" });
Enseignant.belongsTo(User, {
  foreignKey: "numero_utilisateur",
  as: "utilisateur",
});

User.hasOne(Etudiant, { foreignKey: "numero_utilisateur", as: "etudiant" });
Etudiant.belongsTo(User, {
  foreignKey: "numero_utilisateur",
  as: "utilisateur",
});

module.exports = {
  sequelize,
  User,
  Etablissement,
  Directeur,
  Enseignant,
  Etudiant,
  DemandeAcces,
};
