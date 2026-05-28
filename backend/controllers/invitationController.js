const { sequelize } = require("../models");
const emailService = require("../utils/emailService");
const fs = require("fs");
const path = require("path");

// Définir les 3 utilisateurs de test avec leurs rôles
const TEST_USERS = [
  {
    email: "benhazemmemna@gmail.com",
    nom: "Ben Hazem",
    prenom: "Memna",
    role: "enseignant", // ✅ Corrigé: enseignante
  },
  {
    email: "ghofranesebteoui16@gmail.com",
    nom: "Sebteoui",
    prenom: "Ghofrane",
    role: "etudiant", // ✅ Corrigé: étudiante
  },
  {
    email: "gsebteoui@gmail.com",
    nom: "Sebteoui",
    prenom: "G",
    role: "directeur",
  },
];

// Contenu personnalisé selon le rôle
const getRoleContent = (role) => {
  const roleContent = {
    etudiant: {
      emoji: "🎓",
      title: "Espace Étudiant",
      benefits: [
        "Suivi de votre parcours académique en temps réel",
        "Consultation de vos notes et résultats",
        "Gestion de vos inscriptions",
        "Accès à vos documents administratifs",
        "Communication directe avec votre établissement",
      ],
    },
    enseignant: {
      emoji: "👨‍🏫",
      title: "Espace Enseignant",
      benefits: [
        "Gérez vos classes et étudiants efficacement",
        "Saisissez les notes et évaluations en ligne",
        "Consultez les listes de présence",
        "Analysez les performances de vos étudiants",
        "Planifiez vos cours et examens",
      ],
    },
    directeur: {
      emoji: "👔",
      title: "Espace Directeur",
      benefits: [
        "Tableau de bord complet de votre établissement",
        "Gestion des enseignants et du personnel",
        "Statistiques et rapports détaillés",
        "Suivi des performances académiques",
        "Validation des décisions administratives",
      ],
    },
    recteur: {
      emoji: "🎩",
      title: "Espace Recteur",
      benefits: [
        "Vue d'ensemble de toute l'université",
        "Analyses stratégiques et KPIs",
        "Gestion globale des établissements",
        "Rapports consolidés et tendances",
        "Pilotage de la stratégie universitaire",
      ],
    },
  };

  return roleContent[role] || roleContent.etudiant;
};

// Générer le HTML des benefits
const generateBenefitsHTML = (benefits) => {
  return benefits
    .map(
      (benefit, index) => `
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:12px;">
  <tr>
    <td class="benefit-text" style="vertical-align:middle; font-size:14px; color:#2d3436; line-height:1.6;">
      <strong style="color:#1a3a6b;">${index + 1}.</strong> ${benefit}
    </td>
  </tr>
</table>`,
    )
    .join("")
    .replace(/\s+$/, "");
};

// Obtenir le label du badge selon le rôle
const getBadgeLabel = (role) => {
  const labels = {
    etudiant: "Accès Étudiant",
    enseignant: "Accès Enseignant",
    directeur: "Accès Directeur",
    recteur: "Accès Recteur",
  };
  return labels[role] || "Accès Utilisateur";
};

// Obtenir la classe CSS du badge selon le rôle
const getBadgeClass = (role) => {
  const classes = {
    etudiant: "badge-etudiant",
    enseignant: "badge-enseignant",
    directeur: "badge-directeur",
    recteur: "badge-recteur",
  };
  return classes[role] || "badge-etudiant";
};

// Générer le HTML de l'email personnalisé avec le nouveau template
const generateEmailHTML = (user, roleContent) => {
  const demandeUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/demande-acces`;

  // Lire le template HTML
  const templatePath = path.join(
    __dirname,
    "../templates/invitation-email.html",
  );
  let template = fs.readFileSync(templatePath, "utf8");

  // Générer le HTML des benefits
  const benefitsHTML = generateBenefitsHTML(roleContent.benefits);

  // Remplacer les variables
  template = template
    .replace(/{{PRENOM}}/g, user.prenom)
    .replace(/{{NOM}}/g, user.nom)
    .replace(/{{ROLE_EMOJI}}/g, roleContent.emoji)
    .replace(/{{ROLE_TITLE}}/g, roleContent.title)
    .replace(/{{BENEFITS}}/g, benefitsHTML)
    .replace(/{{EMAIL}}/g, user.email)
    .replace(/{{DEMANDE_URL}}/g, demandeUrl)
    .replace(
      /{{FRONTEND_URL}}/g,
      process.env.FRONTEND_URL || "http://localhost:3000",
    )
    .replace(/{{BADGE_LABEL}}/g, getBadgeLabel(user.role))
    .replace(/{{BADGE_CLASS}}/g, getBadgeClass(user.role));

  return template;
};

// Envoyer les invitations aux 3 utilisateurs de test
exports.sendInvitations = async (req, res) => {
  try {
    console.log("🚀 Début de l'envoi des invitations...");

    let sent = 0;
    let failed = 0;
    const results = [];

    // Parcourir les 3 utilisateurs de test
    for (const user of TEST_USERS) {
      try {
        console.log(`📧 Envoi à ${user.email} (${user.role})...`);

        // Récupérer le contenu personnalisé selon le rôle
        const roleContent = getRoleContent(user.role);

        // Générer le HTML de l'email
        const emailHTML = generateEmailHTML(user, roleContent);

        // Envoyer l'email
        await emailService.sendEmail(
          user.email,
          `🎓 Invitation SIAPET - ${roleContent.title}`,
          emailHTML,
        );

        sent++;
        results.push({
          email: user.email,
          role: user.role,
          status: "success",
        });

        console.log(`✅ Email envoyé avec succès à ${user.email}`);
      } catch (error) {
        console.error(
          `❌ Erreur lors de l'envoi à ${user.email}:`,
          error.message,
        );
        failed++;
        results.push({
          email: user.email,
          role: user.role,
          status: "failed",
          error: error.message,
        });
      }
    }

    console.log(`\n📊 Résumé: ${sent} envoyés, ${failed} échecs`);

    res.json({
      success: true,
      message: `✅ Invitations envoyées avec succès à ${sent} destinataire(s)`,
      sent,
      failed,
      total: TEST_USERS.length,
      results,
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi des invitations:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi des invitations",
      error: error.message,
    });
  }
};

module.exports = exports;
