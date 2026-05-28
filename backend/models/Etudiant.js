const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Etudiant = sequelize.define(
  "Etudiant",
  {
    numero_utilisateur: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      references: {
        model: "utilisateur",
        key: "numero_utilisateur",
      },
    },
    numero_etudiant: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    cin: {
      type: DataTypes.STRING(8),
    },
    date_naissance: {
      type: DataTypes.DATE,
    },
    adresse: {
      type: DataTypes.TEXT,
    },
    code_postal: {
      type: DataTypes.STRING(10),
    },
    id_specialite: {
      type: DataTypes.INTEGER,
    },
    id_etablissement: {
      type: DataTypes.INTEGER,
    },
    moyenne_generale: {
      type: DataTypes.DECIMAL(5, 2),
    },
    id_ville: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: "etudiant",
    timestamps: false,
  },
);

module.exports = Etudiant;
