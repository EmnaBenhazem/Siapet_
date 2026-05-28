const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Etablissement = sequelize.define(
  "Etablissement",
  {
    id_etablissement: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nom_etablissement: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    code_etablissement: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM(
        "UNIVERSITE",
        "FACULTE",
        "ECOLE",
        "INSTITUT",
        "ISET",
      ),
      allowNull: false,
    },
    adresse: {
      type: DataTypes.TEXT,
    },
    telephone: {
      type: DataTypes.STRING(20),
    },
    email: {
      type: DataTypes.STRING(150),
    },
    site_web: {
      type: DataTypes.STRING(200),
    },
    effectif_total: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    capacite_maximale: {
      type: DataTypes.INTEGER,
    },
    budget_alloue: {
      type: DataTypes.DECIMAL(15, 2),
    },
    taux_occupation: {
      type: DataTypes.DECIMAL(5, 2),
    },
    taux_reussite: {
      type: DataTypes.DECIMAL(5, 2),
    },
    taux_echec: {
      type: DataTypes.DECIMAL(5, 2),
    },
    performance: {
      type: DataTypes.DECIMAL(5, 2),
    },
    date_creation: {
      type: DataTypes.DATE,
    },
    id_rectorat: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_ville: {
      type: DataTypes.INTEGER,
    },
    archive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "etablissement",
    timestamps: false,
  },
);

module.exports = Etablissement;
