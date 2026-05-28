const { sequelize, User, Etudiant, Enseignant, Directeur } = require("../models");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendVerificationEmail } = require("../utils/emailService");
const {
  generateNumeroUtilisateur,
} = require("../utils/numeroUtilisateurGenerator");

// Parser et valider le CSV
exports.validateCSV = async (req, res) => {
  try {
    const { csvData } = req.body;

    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Données CSV invalides ou vides",
      });
    }

    const validationResults = [];
    const errors = [];
    const warnings = [];

    // Champs requis par type d'utilisateur
    const requiredFields = {
      ENSEIGNANT: ["nom", "prenom", "email", "cin", "id_etablissement"],
      ETUDIANT: ["nom", "prenom", "email", "cin", "id_etablissement", "id_specialite"],
      DIRECTEUR: ["nom", "prenom", "email", "id_etablissement"],
      RECTEUR: ["nom", "prenom", "email", "id_rectorat"],
    };

    // Vérifier les doublons d'email dans le CSV
    const emailsInCSV = new Set();
    const duplicateEmails = new Set();

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const lineNumber = i + 2; // +2 car ligne 1 = header, index 0 = ligne 2

      const validation = {
        lineNumber,
        data: row,
        isValid: true,
        errors: [],
        warnings: [],
      };

      // Vérifier le type d'utilisateur
      if (!row.type_utilisateur) {
        validation.isValid = false;
        validation.errors.push("Type d'utilisateur manquant");
      } else if (!["ENSEIGNANT", "ETUDIANT", "DIRECTEUR", "RECTEUR"].includes(row.type_utilisateur)) {
        validation.isValid = false;
        validation.errors.push(`Type d'utilisateur invalide: ${row.type_utilisateur}`);
      }

      // Vérifier les champs requis
      if (row.type_utilisateur && requiredFields[row.type_utilisateur]) {
        for (const field of requiredFields[row.type_utilisateur]) {
          if (!row[field] || row[field].trim() === "") {
            validation.isValid = false;
            validation.errors.push(`Champ requis manquant: ${field}`);
          }
        }
      }

      // Valider l'email
      if (row.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          validation.isValid = false;
          validation.errors.push("Format d'email invalide");
        }

        // Vérifier les doublons dans le CSV
        if (emailsInCSV.has(row.email.toLowerCase())) {
          duplicateEmails.add(row.email.toLowerCase());
          validation.isValid = false;
          validation.errors.push("Email en double dans le CSV");
        } else {
          emailsInCSV.add(row.email.toLowerCase());
        }

        // Vérifier si l'email existe déjà en base
        const existingUser = await User.findOne({
          where: { email: row.email },
        });
        if (existingUser) {
          validation.isValid = false;
          validation.errors.push("Email déjà utilisé dans la base de données");
        }
      }

      // Valider le téléphone
      if (row.telephone && row.telephone.trim() !== "") {
        const phoneRegex = /^\+?[0-9]{8,15}$/;
        if (!phoneRegex.test(row.telephone.replace(/\s/g, ""))) {
          validation.warnings.push("Format de téléphone potentiellement invalide");
        }
      }

      // Valider le sexe
      if (row.sexe && !["HOMME", "FEMME"].includes(row.sexe.toUpperCase())) {
        validation.isValid = false;
        validation.errors.push("Sexe invalide (doit être HOMME ou FEMME)");
      }

      // Valider le CIN (8 chiffres pour la Tunisie)
      if (row.cin && row.cin.trim() !== "") {
        if (!/^\d{8}$/.test(row.cin)) {
          validation.warnings.push("Format de CIN invalide (doit être 8 chiffres)");
        }
      }

      // Vérifier que l'établissement existe
      if (row.id_etablissement) {
        const etablissement = await sequelize.query(
          "SELECT id_etablissement FROM etablissement WHERE id_etablissement = $1",
          {
            bind: [row.id_etablissement],
            type: sequelize.QueryTypes.SELECT,
          }
        );
        if (etablissement.length === 0) {
          validation.isValid = false;
          validation.errors.push(`Établissement ${row.id_etablissement} introuvable`);
        }
      }

      // Vérifier que le rectorat existe (pour les recteurs)
      if (row.type_utilisateur === "RECTEUR" && row.id_rectorat) {
        const rectorat = await sequelize.query(
          "SELECT id_rectorat FROM rectorat WHERE id_rectorat = $1",
          {
            bind: [row.id_rectorat],
            type: sequelize.QueryTypes.SELECT,
          }
        );
        if (rectorat.length === 0) {
          validation.isValid = false;
          validation.errors.push(`Rectorat ${row.id_rectorat} introuvable`);
        }
      }

      // Vérifier que la spécialité existe (pour les étudiants)
      if (row.type_utilisateur === "ETUDIANT" && row.id_specialite) {
        const specialite = await sequelize.query(
          "SELECT id_specialite FROM specialite WHERE id_specialite = $1",
          {
            bind: [row.id_specialite],
            type: sequelize.QueryTypes.SELECT,
          }
        );
        if (specialite.length === 0) {
          validation.isValid = false;
          validation.errors.push(`Spécialité ${row.id_specialite} introuvable`);
        }
      }

      validationResults.push(validation);

      if (!validation.isValid) {
        errors.push(...validation.errors.map(err => `Ligne ${lineNumber}: ${err}`));
      }
      if (validation.warnings.length > 0) {
        warnings.push(...validation.warnings.map(warn => `Ligne ${lineNumber}: ${warn}`));
      }
    }

    const validCount = validationResults.filter(v => v.isValid).length;
    const invalidCount = validationResults.filter(v => !v.isValid).length;

    res.json({
      success: true,
      summary: {
        total: csvData.length,
        valid: validCount,
        invalid: invalidCount,
        hasErrors: invalidCount > 0,
        hasWarnings: warnings.length > 0,
      },
      validationResults,
      errors,
      warnings,
    });
  } catch (error) {
    console.error("Erreur lors de la validation du CSV:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la validation du CSV",
      error: error.message,
    });
  }
};

// Importer les utilisateurs depuis le CSV
exports.importCSV = async (req, res) => {
  try {
    const { csvData } = req.body;

    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Données CSV invalides ou vides",
      });
    }

    const results = {
      total: csvData.length,
      success: 0,
      failed: 0,
      details: [],
    };

    // Traiter chaque ligne
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const lineNumber = i + 2;

      try {
        // Générer un mot de passe temporaire
        const tempPassword = crypto.randomBytes(8).toString("hex");
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Générer un numéro d'utilisateur unique
        const numeroUtilisateur = generateNumeroUtilisateur(row.type_utilisateur);

        // Créer l'utilisateur
        const userResult = await sequelize.query(
          `INSERT INTO utilisateur (numero_utilisateur, email, mot_de_passe, nom, prenom, telephone, sexe, type_utilisateur, statut, date_creation)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIF', NOW())
           RETURNING numero_utilisateur, email, nom, prenom, type_utilisateur`,
          {
            bind: [
              numeroUtilisateur,
              row.email,
              hashedPassword,
              row.nom,
              row.prenom,
              row.telephone || null,
              row.sexe ? row.sexe.toUpperCase() : null,
              row.type_utilisateur,
            ],
            type: sequelize.QueryTypes.INSERT,
          }
        );

        const newUser = userResult[0][0];

        // Créer l'entrée spécifique selon le type
        if (row.type_utilisateur === "ENSEIGNANT") {
          const numeroEnseignant = `ENS${Date.now()}${i}`;
          await sequelize.query(
            `INSERT INTO enseignant (numero_utilisateur, numero_enseignant, cin, id_etablissement_principal, specialite, grade, date_recrutement)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            {
              bind: [
                newUser.numero_utilisateur,
                numeroEnseignant,
                row.cin || null,
                row.id_etablissement || null,
                row.specialite || null,
                row.grade || null,
              ],
              type: sequelize.QueryTypes.INSERT,
            }
          );
        } else if (row.type_utilisateur === "ETUDIANT") {
          const numeroEtudiant = `ETU${Date.now()}${i}`;
          await sequelize.query(
            `INSERT INTO etudiant (numero_utilisateur, numero_etudiant, cin, id_etablissement, id_specialite, niveau_actuel, date_naissance, adresse, id_ville)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            {
              bind: [
                newUser.numero_utilisateur,
                numeroEtudiant,
                row.cin || null,
                row.id_etablissement || null,
                row.id_specialite || null,
                row.niveau_actuel || 1,
                row.date_naissance || null,
                row.adresse || null,
                row.id_ville || null,
              ],
              type: sequelize.QueryTypes.INSERT,
            }
          );
        } else if (row.type_utilisateur === "DIRECTEUR") {
          const numeroDirecteur = `DIR${Date.now()}${i}`;
          await sequelize.query(
            `INSERT INTO directeur_etablissement (numero_utilisateur, numero_directeur, id_etablissement, date_nomination, mandat_debut, mandat_fin)
             VALUES ($1, $2, $3, NOW(), NOW(), NOW() + INTERVAL '4 years')`,
            {
              bind: [
                newUser.numero_utilisateur,
                numeroDirecteur,
                row.id_etablissement || null,
              ],
              type: sequelize.QueryTypes.INSERT,
            }
          );
        } else if (row.type_utilisateur === "RECTEUR") {
          const numeroRecteur = `RECT${Date.now()}${i}`;
          await sequelize.query(
            `INSERT INTO recteur_universite (numero_utilisateur, numero_recteur, id_rectorat, date_nomination, mandat_debut, mandat_fin)
             VALUES ($1, $2, $3, NOW(), NOW(), NOW() + INTERVAL '4 years')`,
            {
              bind: [
                newUser.numero_utilisateur,
                numeroRecteur,
                row.id_rectorat || null,
              ],
              type: sequelize.QueryTypes.INSERT,
            }
          );
        }

        // Envoyer l'email d'invitation
        try {
          await sendVerificationEmail(
            row.email,
            row.nom,
            row.prenom,
            tempPassword
          );
        } catch (emailError) {
          console.error(`Erreur envoi email pour ${row.email}:`, emailError);
        }

        results.success++;
        results.details.push({
          lineNumber,
          status: "success",
          email: row.email,
          nom: `${row.prenom} ${row.nom}`,
          tempPassword,
        });
      } catch (error) {
        console.error(`Erreur ligne ${lineNumber}:`, error);
        results.failed++;
        results.details.push({
          lineNumber,
          status: "error",
          email: row.email,
          nom: `${row.prenom} ${row.nom}`,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Import terminé: ${results.success} succès, ${results.failed} échecs`,
      results,
    });
  } catch (error) {
    console.error("Erreur lors de l'import CSV:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'import CSV",
      error: error.message,
    });
  }
};

// Télécharger le template CSV
exports.downloadTemplate = async (req, res) => {
  try {
    const { type } = req.query;

    let template = "";

    if (type === "ENSEIGNANT") {
      template = `type_utilisateur,nom,prenom,email,telephone,sexe,cin,id_etablissement,specialite,grade
ENSEIGNANT,Trabelsi,Ahmed,ahmed.trabelsi@example.tn,+21612345678,HOMME,12345678,1,Informatique,Maître Assistant
ENSEIGNANT,Ben Ali,Fatma,fatma.benali@example.tn,+21698765432,FEMME,87654321,1,Mathématiques,Professeur`;
    } else if (type === "ETUDIANT") {
      template = `type_utilisateur,nom,prenom,email,telephone,sexe,cin,id_etablissement,id_specialite,niveau_actuel,date_naissance,adresse,id_ville
ETUDIANT,Gharbi,Mohamed,mohamed.gharbi@example.tn,+21623456789,HOMME,23456789,1,1,3,1995-05-15,Rue de la République,1
ETUDIANT,Mansour,Salma,salma.mansour@example.tn,+21634567890,FEMME,34567890,1,1,2,1998-08-22,Avenue Habib Bourguiba,1`;
    } else if (type === "DIRECTEUR") {
      template = `type_utilisateur,nom,prenom,email,telephone,sexe,id_etablissement
DIRECTEUR,Kacem,Nabil,nabil.kacem@example.tn,+21645678901,HOMME,1
DIRECTEUR,Jebali,Leila,leila.jebali@example.tn,+21656789012,FEMME,2`;
    } else {
      template = `type_utilisateur,nom,prenom,email,telephone,sexe,cin,id_etablissement,id_specialite,specialite,grade,niveau_actuel
ENSEIGNANT,Trabelsi,Ahmed,ahmed.trabelsi@example.tn,+21612345678,HOMME,12345678,1,,Informatique,Maître Assistant,
ETUDIANT,Gharbi,Mohamed,mohamed.gharbi@example.tn,+21623456789,HOMME,23456789,1,1,,,3`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=template_${type || "all"}.csv`
    );
    res.send(template);
  } catch (error) {
    console.error("Erreur lors du téléchargement du template:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du téléchargement du template",
      error: error.message,
    });
  }
};
