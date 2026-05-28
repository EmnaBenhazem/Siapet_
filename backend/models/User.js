const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcrypt");

const User = sequelize.define(
  "User",
  {
    numero_utilisateur: {
      type: DataTypes.STRING(50),
      primaryKey: true,
    },
    nom: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    prenom: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    mot_de_passe: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    telephone: {
      type: DataTypes.STRING(20),
    },
    sexe: {
      type: DataTypes.ENUM("HOMME", "FEMME"),
    },
    statut: {
      type: DataTypes.ENUM("ACTIF", "INACTIF", "SUSPENDU"),
      defaultValue: "ACTIF",
    },
    type_utilisateur: {
      type: DataTypes.ENUM(
        "ADMIN_MESRS",
        "RECTEUR",
        "DIRECTEUR",
        "ENSEIGNANT",
        "ETUDIANT",
      ),
      allowNull: false,
    },
    date_creation: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    derniere_connexion: {
      type: DataTypes.DATE,
    },
    reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    reset_token_expiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "utilisateur",
    timestamps: false,
    hooks: {
      beforeCreate: async (user) => {
        if (user.mot_de_passe) {
          user.mot_de_passe = await bcrypt.hash(user.mot_de_passe, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("mot_de_passe")) {
          user.mot_de_passe = await bcrypt.hash(user.mot_de_passe, 10);
        }
      },
    },
  },
);

User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.mot_de_passe);
};

module.exports = User;
