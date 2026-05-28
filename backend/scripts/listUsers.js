const { User } = require("../models");

async function listUsers() {
  try {
    console.log("👥 Liste des utilisateurs dans la base de données\n");

    // Compter les utilisateurs par rôle
    const users = await User.findAll({
      attributes: [
        "numero_utilisateur",
        "email",
        "nom",
        "prenom",
        "type_utilisateur",
        "statut",
      ],
      order: [
        ["type_utilisateur", "ASC"],
        ["nom", "ASC"],
      ],
    });

    if (users.length === 0) {
      console.log("⚠️  Aucun utilisateur trouvé dans la base de données\n");
      process.exit(0);
    }

    // Grouper par rôle
    const byRole = {};
    users.forEach((user) => {
      const role = user.type_utilisateur;
      if (!byRole[role]) byRole[role] = [];
      byRole[role].push(user);
    });

    // Afficher les statistiques
    console.log("📊 Statistiques:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Object.keys(byRole)
      .sort()
      .forEach((role) => {
        console.log(
          `   ${role.padEnd(15)} : ${byRole[role].length} utilisateur(s)`,
        );
      });
    console.log(`   ${"TOTAL".padEnd(15)} : ${users.length} utilisateur(s)`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Afficher les administrateurs
    if (byRole["ADMIN_MESRS"]) {
      console.log("👑 Administrateurs (ADMIN_MESRS):");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      byRole["ADMIN_MESRS"].forEach((user) => {
        console.log(`   📧 ${user.email}`);
        console.log(`   👤 ${user.nom} ${user.prenom}`);
        console.log(`   🆔 ${user.numero_utilisateur}`);
        console.log(`   📊 Statut: ${user.statut}`);
        console.log("   ─────────────────────────────────────────");
      });
      console.log();
    } else {
      console.log("⚠️  Aucun administrateur (ADMIN_MESRS) trouvé!");
      console.log("   Exécutez: node scripts/createAdminUser.js\n");
    }

    // Afficher les autres rôles (premiers 5 de chaque)
    ["RECTEUR", "DIRECTEUR", "ENSEIGNANT", "ETUDIANT"].forEach((role) => {
      if (byRole[role] && byRole[role].length > 0) {
        console.log(
          `📋 ${role}s (${byRole[role].length} total, affichage des 5 premiers):`,
        );
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        byRole[role].slice(0, 5).forEach((user) => {
          console.log(
            `   ${user.email.padEnd(30)} | ${user.nom} ${user.prenom}`,
          );
        });
        if (byRole[role].length > 5) {
          console.log(`   ... et ${byRole[role].length - 5} autre(s)`);
        }
        console.log();
      }
    });
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

listUsers();
