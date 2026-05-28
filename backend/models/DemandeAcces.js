const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DemandeAcces = sequelize.define(
  "DemandeAcces",
  {
    id_demande: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type_acteur: {
      type: DataTypes.ENUM("etudiant", "enseignant", "directeur", "recteur"),
      allowNull: false,
    },
    cin: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    nom: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    prenom: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    telephone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    date_naissance: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    niveau_etude: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    specialite: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    annee_universitaire: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    grade: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    specialite_enseignement: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    etablissement_souhaite: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    statut: {
      type: DataTypes.ENUM("en_attente", "accepte", "refuse"),
      defaultValue: "en_attente",
    },
    date_demande: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    date_traitement: {
      type: DataTypes.DATE,
    },
    traite_par: {
      type: DataTypes.STRING(50),
    },
    commentaire_admin: {
      type: DataTypes.TEXT,
    },
    numero_utilisateur: {
      type: DataTypes.STRING(50),
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "demandes_acces",
    timestamps: false,
  }
);

module.exports = DemandeAcces;
