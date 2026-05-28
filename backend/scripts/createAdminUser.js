const bcrypt = require("bcrypt");
const { User } = require("../models");

async function createAdminUser() {
  try {
    console.log("🔧 Création d'un utilisateur administrateur...\n");

    // Vérifier si un admin existe déjà
    const existingAdmin = await User.findOne({
      where: { type_utilisateur: "ADMIN_MESRS" },
    });

    if (existingAdmin) {
      console.log("✅ Un administrateur existe déjà:");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nom: ${existingAdmin.nom} ${existingAdmin.prenom}`);
      console.log(`   Numéro: ${existingAdmin.numero_utilisateur}`);
      console.log(`   Rôle: ${existingAdmin.type_utilisateur}\n`);

      const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      readline.question(
        "Voulez-vous créer un nouvel administrateur? (o/n): ",
        async (answer) => {
          readline.close();
          if (answer.toLowerCase() !== "o") {
            console.log("❌ Opération annulée");
            process.exit(0);
          }
          await createNewAdmin();
        },
      );
    } else {
      await createNewAdmin();
    }
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  }
}

async function createNewAdmin() {
  try {
    // Données de l'administrateur
    const adminData = {
      numero_utilisateur: "ADMIN-" + Date.now(),
      email: "admin@mesrs.tn",
      mot_de_passe: await bcrypt.hash("Admin@2024", 10),
      nom: "Administrateur",
      prenom: "Système",
      type_utilisateur: "ADMIN_MESRS",
      cin: "ADMIN001",
      date_naissance: new Date("1980-01-01"),
      telephone: "+216 71 000 000",
      adresse: "Ministère de l'Enseignement Supérieur",
      statut: "actif",
      date_creation: new Date(),
    };

    const admin = await User.create(adminData);

    console.log("\n✅ Administrateur créé avec succès!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email:        admin@mesrs.tn");
    console.log("🔑 Mot de passe: Admin@2024");
    console.log("👤 Numéro:       " + admin.numero_utilisateur);
    console.log("🎭 Rôle:         ADMIN_MESRS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(
      "\n⚠️  IMPORTANT: Changez le mot de passe après la première connexion!\n",
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de la création:", error.message);
    process.exit(1);
  }
}

createAdminUser();
