const jwt = require("jsonwebtoken");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🔍 Décodage de token JWT\n");
console.log("Collez le token JWT (depuis localStorage du navigateur):");
console.log("Pour obtenir le token:");
console.log("  1. Ouvrez la console du navigateur (F12)");
console.log('  2. Tapez: localStorage.getItem("token")');
console.log("  3. Copiez le token et collez-le ici\n");

rl.question("Token: ", (token) => {
  rl.close();

  if (!token || token.trim() === "") {
    console.log("❌ Aucun token fourni");
    process.exit(1);
  }

  try {
    // Décoder sans vérifier la signature (pour voir le contenu)
    const decoded = jwt.decode(token.trim());

    if (!decoded) {
      console.log("❌ Token invalide ou mal formaté");
      process.exit(1);
    }

    console.log("\n✅ Token décodé avec succès!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 Informations de l'utilisateur:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`   ID:              ${decoded.id || decoded.userId || "N/A"}`);
    console.log(`   Email:           ${decoded.email || "N/A"}`);
    console.log(
      `   Rôle:            ${decoded.role || decoded.type_utilisateur || "N/A"}`,
    );
    console.log(`   Numéro:          ${decoded.numero_utilisateur || "N/A"}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (decoded.iat) {
      const issuedAt = new Date(decoded.iat * 1000);
      console.log(`   Émis le:         ${issuedAt.toLocaleString("fr-FR")}`);
    }

    if (decoded.exp) {
      const expiresAt = new Date(decoded.exp * 1000);
      const now = new Date();
      const isExpired = now > expiresAt;

      console.log(`   Expire le:       ${expiresAt.toLocaleString("fr-FR")}`);
      console.log(
        `   Statut:          ${isExpired ? "❌ EXPIRÉ" : "✅ VALIDE"}`,
      );

      if (!isExpired) {
        const timeLeft = Math.floor((expiresAt - now) / 1000 / 60);
        console.log(`   Temps restant:   ${timeLeft} minutes`);
      }
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Vérifier si c'est un admin
    const role = decoded.role || decoded.type_utilisateur;
    if (role === "ADMIN_MESRS" || role === "ADMIN") {
      console.log("✅ Cet utilisateur est un administrateur");
    } else {
      console.log("⚠️  Cet utilisateur N'EST PAS un administrateur");
      console.log(`   Rôle actuel: ${role}`);
      console.log("\n💡 Pour accéder au dashboard admin, connectez-vous avec:");
      console.log("   Email: admin@siapet.rnu.tn");
      console.log("   (Demandez le mot de passe à l'administrateur système)");
    }

    console.log("\n📋 Contenu complet du token:");
    console.log(JSON.stringify(decoded, null, 2));
  } catch (error) {
    console.error("❌ Erreur lors du décodage:", error.message);
    process.exit(1);
  }
});
