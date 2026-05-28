const { Etudiant, Enseignant } = require("../models");

// Générer un matricule unique pour étudiant
const generateMatriculeEtudiant = async () => {
  const year = new Date().getFullYear();
  let numero = 1;
  let matricule;
  let exists = true;

  while (exists) {
    // Format: année + numéro sur 5 chiffres (ex: 2026000001)
    matricule = `${year}${numero.toString().padStart(5, "0")}`;

    const etudiant = await Etudiant.findOne({
      where: { numero_etudiant: matricule },
    });

    if (!etudiant) {
      exists = false;
    } else {
      numero++;
    }
  }

  return matricule;
};

// Générer un matricule unique pour enseignant
const generateMatriculeEnseignant = async () => {
  let numero = 1;
  let matricule;
  let exists = true;

  while (exists) {
    // Format: ENS + numéro sur 4 chiffres (ex: ENS0001)
    matricule = `ENS${numero.toString().padStart(4, "0")}`;

    const enseignant = await Enseignant.findOne({
      where: { numero_enseignant: matricule },
    });

    if (!enseignant) {
      exists = false;
    } else {
      numero++;
    }
  }

  return matricule;
};

// Générer un mot de passe temporaire aléatoire
const generateTemporaryPassword = () => {
  const length = 12;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";

  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  return password;
};

module.exports = {
  generateMatriculeEtudiant,
  generateMatriculeEnseignant,
  generateTemporaryPassword,
};
