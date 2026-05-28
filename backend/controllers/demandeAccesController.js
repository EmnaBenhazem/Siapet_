const DemandeAcces = require("../models/DemandeAcces");
const User = require("../models/User");
const Etudiant = require("../models/Etudiant");
const Enseignant = require("../models/Enseignant");
const { sequelize } = require("../models");
const bcrypt = require("bcrypt");
const emailService = require("../utils/emailService");
const matriculeGenerator = require("../utils/matriculeGenerator");
const numeroUtilisateurGenerator = require("../utils/numeroUtilisateurGenerator");

// Soumettre une nouvelle demande d'accès
exports.soumettreDemande = async (req, res) => {
  try {
    console.log("📥 Nouvelle demande reçue:", req.body);

    const { type_acteur, nom, prenom, cin, email } = req.body;

    // Validation des champs obligatoires
    if (!type_acteur || !nom || !prenom || !cin || !email) {
      console.log("❌ Champs manquants:", {
        type_acteur,
        nom,
        prenom,
        cin,
        email,
      });
      return res.status(400).json({
        message:
          "Tous les champs obligatoires doivent être remplis (type_acteur, nom, prenom, cin, email)",
        champs_recus: {
          type_acteur: !!type_acteur,
          nom: !!nom,
          prenom: !!prenom,
          cin: !!cin,
          email: !!email,
        },
      });
    }

    // Validation du type_acteur
    const typesValides = ["etudiant", "enseignant", "directeur", "recteur"];
    if (!typesValides.includes(type_acteur)) {
      console.log("❌ Type acteur invalide:", type_acteur);
      return res.status(400).json({
        message: `Type d'acteur invalide. Valeurs acceptées: ${typesValides.join(", ")}`,
        type_recu: type_acteur,
      });
    }

    // Vérifier si l'email existe déjà dans les demandes
    const demandeExistante = await DemandeAcces.findOne({ where: { email } });
    if (demandeExistante) {
      // Si la demande existante est refusée, on peut en créer une nouvelle
      if (demandeExistante.statut === "refuse") {
        console.log(
          "ℹ️ Demande précédente refusée trouvée, autorisation de nouvelle demande",
        );
        // Supprimer l'ancienne demande refusée pour permettre la nouvelle
        await demandeExistante.destroy();
        console.log("🗑️ Ancienne demande refusée supprimée");
      } else {
        // Si la demande est en attente ou acceptée, on bloque
        console.log(
          "❌ Email déjà utilisé dans demandes:",
          email,
          "Statut:",
          demandeExistante.statut,
        );
        return res.status(400).json({
          message:
            demandeExistante.statut === "en_attente"
              ? "Une demande avec cet email est déjà en cours de traitement"
              : "Cet email est déjà associé à un compte accepté",
          statut_demande: demandeExistante.statut,
        });
      }
    }

    // NOTE: On ne vérifie PAS la table users car elle contient les acteurs du ministère
    // (qui ne sont pas encore des utilisateurs de l'application)
    // Un acteur peut faire une demande même s'il existe dans la table users

    console.log("✅ Validation OK, création de la demande...");

    // Créer la demande avec tous les champs requis
    const demande = await DemandeAcces.create({
      type_acteur,
      nom,
      prenom,
      cin,
      email,
    });

    console.log("✅ Demande créée:", demande.id_demande);

    // 🔔 Émettre une notification Socket.IO aux admins
    if (global.io) {
      global.io.to("ADMIN_MESRS").emit("nouvelle-demande", {
        id: demande.id_demande,
        type_acteur: demande.type_acteur,
        nom: demande.nom,
        prenom: demande.prenom,
        cin: demande.cin,
        email: demande.email,
        date_demande: demande.date_demande,
        message: `Nouvelle demande d'accès ${type_acteur}`,
      });
      console.log("🔔 Notification envoyée aux admins (room: ADMIN_MESRS)");
    }

    res.status(201).json({
      message: "Votre demande d'accès a été soumise avec succès",
      demande: {
        id_demande: demande.id_demande,
        type_acteur: demande.type_acteur,
        nom: demande.nom,
        prenom: demande.prenom,
        cin: demande.cin,
        email: demande.email,
        statut: demande.statut,
      },
    });
  } catch (error) {
    console.error("❌ Erreur lors de la soumission de la demande:", error);
    console.error("Stack:", error.stack);

    // Erreur de validation Sequelize
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: "Erreur de validation des données",
        erreurs: error.errors.map((e) => ({
          champ: e.path,
          message: e.message,
        })),
      });
    }

    // Erreur de contrainte unique
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Cette adresse email est déjà utilisée",
        champ: error.errors[0]?.path,
      });
    }

    res.status(500).json({
      message: "Erreur lors de la soumission de la demande",
      error: error.message,
      type: error.name,
    });
  }
};

// Récupérer toutes les demandes (admin)
exports.getAllDemandes = async (req, res) => {
  try {
    const { statut, type_acteur } = req.query;
    const where = {};

    if (statut) where.statut = statut;
    if (type_acteur) where.type_acteur = type_acteur;

    const demandes = await DemandeAcces.findAll({
      where,
      order: [["date_demande", "DESC"]],
    });

    // Ajouter un alias 'id' pour compatibilité frontend
    const demandesWithId = demandes.map((d) => ({
      ...d.toJSON(),
      id: d.id_demande,
    }));

    res.json(demandesWithId);
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des demandes",
      error: error.message,
    });
  }
};

// Récupérer une demande par ID (admin)
exports.getDemandeById = async (req, res) => {
  try {
    const { id } = req.params;
    const demande = await DemandeAcces.findByPk(id);

    if (!demande) {
      return res.status(404).json({ message: "Demande non trouvée" });
    }

    // Ajouter un alias 'id' pour compatibilité frontend
    const demandeWithId = {
      ...demande.toJSON(),
      id: demande.id_demande,
    };

    res.json(demandeWithId);
  } catch (error) {
    console.error("Erreur lors de la récupération de la demande:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération de la demande:",
      error: error.message,
    });
  }
};

// Accepter une demande (admin)
exports.accepterDemande = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.numero_utilisateur;

    console.log("🔍 Acceptation demande - ID:", id);
    console.log("🔍 Admin:", adminId);

    const demande = await DemandeAcces.findByPk(id);

    if (!demande) {
      return res.status(404).json({ message: "Demande non trouvée" });
    }

    if (demande.statut !== "en_attente") {
      return res.status(400).json({
        message: "Cette demande a déjà été traitée",
      });
    }

    // Générer un mot de passe temporaire
    const motDePasseTemporaire = Math.random().toString(36).slice(-8);

    // Extraire nom et prénom de l'email si non fournis
    let nom = demande.nom;
    let prenom = demande.prenom;

    if (!nom || !prenom) {
      // Extraire de l'email (ex: john.doe@example.com -> John Doe)
      const emailPart = demande.email.split("@")[0];
      const parts = emailPart.split(/[._-]/);

      if (parts.length >= 2) {
        prenom =
          parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
        nom =
          parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
      } else if (parts.length === 1 && parts[0].length > 0) {
        prenom =
          parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
        nom = "Utilisateur";
      } else {
        // Fallback si l'extraction échoue
        prenom = "Nouvel";
        nom = "Utilisateur";
      }
    }

    // Générer le numéro utilisateur selon le type
    let typeUtilisateur;
    let numeroUtilisateur;

    switch (demande.type_acteur) {
      case "etudiant":
        typeUtilisateur = "ETUDIANT";
        numeroUtilisateur =
          await numeroUtilisateurGenerator.generateNumeroUtilisateur(
            "ETUDIANT",
          );
        break;
      case "enseignant":
        typeUtilisateur = "ENSEIGNANT";
        numeroUtilisateur =
          await numeroUtilisateurGenerator.generateNumeroUtilisateur(
            "ENSEIGNANT",
          );
        break;
      case "directeur":
        typeUtilisateur = "DIRECTEUR";
        numeroUtilisateur =
          await numeroUtilisateurGenerator.generateNumeroUtilisateur(
            "DIRECTEUR",
          );
        break;
      case "recteur":
        typeUtilisateur = "RECTEUR";
        numeroUtilisateur =
          await numeroUtilisateurGenerator.generateNumeroUtilisateur("RECTEUR");
        break;
      default:
        console.error("❌ Type acteur invalide:", demande.type_acteur);
        return res.status(400).json({
          message: "Type d'acteur invalide",
        });
    }

    // Vérifier si un utilisateur avec cet email existe déjà et le supprimer
    // (c'était juste une entrée de référence pour les invitations, pas un compte actif)
    const userExistant = await User.findOne({
      where: { email: demande.email },
    });
    if (userExistant) {
      console.log("🗑️  Suppression de l'ancienne entrée de référence...");
      await userExistant.destroy();
    }

    // Créer l'utilisateur avec le numero_utilisateur généré
    console.log("➕ Création du compte utilisateur...");
    const user = await User.create({
      numero_utilisateur: numeroUtilisateur,
      nom: nom,
      prenom: prenom,
      email: demande.email,
      mot_de_passe: motDePasseTemporaire,
      telephone: demande.telephone,
      type_utilisateur: typeUtilisateur,
      statut: "ACTIF",
    });

    // Créer l'entrée spécifique selon le type
    let matricule = null;
    if (demande.type_acteur === "etudiant") {
      matricule = await matriculeGenerator.generateMatriculeEtudiant();
      await Etudiant.create({
        numero_utilisateur: numeroUtilisateur,
        numero_etudiant: matricule,
        date_naissance: demande.date_naissance,
        cin: demande.cin,
        niveau_etude: demande.niveau_etude || "Non spécifié",
        specialite: demande.specialite || "Non spécifié",
        annee_universitaire:
          demande.annee_universitaire || new Date().getFullYear().toString(),
      });
    } else if (demande.type_acteur === "enseignant") {
      matricule = await matriculeGenerator.generateMatriculeEnseignant();
      await Enseignant.create({
        numero_utilisateur: numeroUtilisateur,
        numero_enseignant: matricule,
        grade: demande.grade || "Non spécifié",
        specialite: demande.specialite_enseignement || "Non spécifié",
        date_naissance: demande.date_naissance,
        cin: demande.cin,
      });
    }

    // Mettre à jour la demande
    await demande.update({
      statut: "accepte",
      date_traitement: new Date(),
      traite_par: adminId,
      numero_utilisateur: numeroUtilisateur,
    });

    // Envoyer l'email avec les identifiants
    try {
      await emailService.sendAccessGrantedEmail({
        email: demande.email,
        nom: nom,
        prenom: prenom,
        numeroUtilisateur: numeroUtilisateur,
        motDePasse: motDePasseTemporaire,
        matricule: matricule,
        typeActeur: demande.type_acteur,
      });
      console.log("✅ Email envoyé avec succès à:", demande.email);
    } catch (emailError) {
      console.error("❌ Erreur lors de l'envoi de l'email:", emailError);

      // Rollback: supprimer l'utilisateur créé
      console.log("🔄 Rollback: Suppression de l'utilisateur créé");
      try {
        await user.destroy();
      } catch (destroyError) {
        console.error("❌ Erreur lors du rollback user:", destroyError);
      }

      // Supprimer les entrées spécifiques créées
      if (matricule) {
        try {
          if (demande.type_acteur === "etudiant") {
            await Etudiant.destroy({
              where: { numero_utilisateur: numeroUtilisateur },
            });
          } else if (demande.type_acteur === "enseignant") {
            await Enseignant.destroy({
              where: { numero_utilisateur: numeroUtilisateur },
            });
          }
        } catch (destroyError) {
          console.error(
            "❌ Erreur lors du rollback etudiant/enseignant:",
            destroyError,
          );
        }
      }

      // Remettre la demande en attente
      await demande.update({ statut: "en_attente" });

      return res.status(500).json({
        message:
          "Erreur lors de l'envoi de l'email. La demande reste en attente.",
        error: emailError.message,
      });
    }

    console.log("✅ Demande acceptée avec succès:", demande.id_demande);

    res.json({
      message: "Demande acceptée avec succès",
      user: {
        numero_utilisateur: numeroUtilisateur,
        email: user.email,
        type_utilisateur: typeUtilisateur,
        matricule: matricule,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'acceptation de la demande:", error);
    res.status(500).json({
      message: "Erreur lors de l'acceptation de la demande",
      error: error.message,
    });
  }
};

// Refuser une demande (admin)
exports.refuserDemande = async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaire_admin } = req.body;
    const adminId = req.user.numero_utilisateur;

    console.log("🔍 Refus demande - ID:", id);
    console.log("🔍 Commentaire:", commentaire_admin);

    const demande = await DemandeAcces.findByPk(id);

    if (!demande) {
      console.log("❌ Demande non trouvée:", id);
      return res.status(404).json({ message: "Demande non trouvée" });
    }

    if (demande.statut !== "en_attente") {
      console.log("❌ Demande déjà traitée:", demande.statut);
      return res.status(400).json({
        message: "Cette demande a déjà été traitée",
      });
    }

    await demande.update({
      statut: "refuse",
      date_traitement: new Date(),
      traite_par: adminId,
      commentaire_admin: commentaire_admin || "Demande refusée",
    });

    // Envoyer un email de notification au demandeur
    try {
      await emailService.sendAccessRejectedEmail({
        email: demande.email,
        nom: demande.nom || "Utilisateur",
        prenom: demande.prenom || "",
        typeActeur: demande.type_acteur,
        motif:
          commentaire_admin ||
          "Votre demande ne répond pas aux critères requis.",
      });
      console.log("✅ Email de refus envoyé à:", demande.email);
    } catch (emailError) {
      console.error(
        "❌ Erreur lors de l'envoi de l'email de refus:",
        emailError,
      );
      // Continue même si l'email échoue
    }

    console.log("✅ Demande refusée avec succès:", demande.id_demande);

    res.json({
      message: "Demande refusée",
      demande: {
        id_demande: demande.id_demande,
        statut: demande.statut,
      },
    });
  } catch (error) {
    console.error("Erreur lors du refus de la demande:", error);
    res.status(500).json({
      message: "Erreur lors du refus de la demande",
      error: error.message,
    });
  }
};

// Statistiques des demandes (admin)
exports.getStatistiquesDemandes = async (req, res) => {
  try {
    const total = await DemandeAcces.count();
    const enAttente = await DemandeAcces.count({
      where: { statut: "en_attente" },
    });
    const acceptees = await DemandeAcces.count({
      where: { statut: "accepte" },
    });
    const refusees = await DemandeAcces.count({ where: { statut: "refuse" } });

    const parType = await DemandeAcces.findAll({
      attributes: [
        "type_acteur",
        [sequelize.fn("COUNT", sequelize.col("id_demande")), "count"],
      ],
      group: ["type_acteur"],
    });

    res.json({
      total,
      enAttente,
      acceptees,
      refusees,
      parType,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des statistiques",
      error: error.message,
    });
  }
};
