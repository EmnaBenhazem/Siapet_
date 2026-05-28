const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Enseignant = sequelize.define(
  "Enseignant",
  {
    numero_utilisateur: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      references: {
        model: "utilisateur",
        key: "numero_utilisateur",
      },
    },
    numero_enseignant: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    cin: {
      type: DataTypes.STRING(8),
      allowNull: false,
    },
    grade: {
      type: DataTypes.STRING(100),
    },
    date_recrutement: {
      type: DataTypes.DATE,
    },
    specialite: {
      type: DataTypes.STRING(200),
    },
    annees_experience: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "enseignant",
    timestamps: false,
  },
);

module.exports = Enseignant;
