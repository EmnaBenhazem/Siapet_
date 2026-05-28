const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Directeur = sequelize.define(
  "Directeur",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    utilisateur_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: "utilisateurs",
        key: "id",
      },
    },
    numero_directeur: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "directeur_etablissement",
    timestamps: false,
  },
);

module.exports = Directeur;
