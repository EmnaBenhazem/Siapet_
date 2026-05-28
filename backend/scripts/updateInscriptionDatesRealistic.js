const { sequelize } = require("../models");

/**
 * Script pour répartir les dates d'inscription des utilisateurs
 * avec une distribution réaliste (pics en septembre et février)
 */

async function updateInscriptionDatesRealistic() {
  try {
    console.log("🔄 Début de la mise à jour des dates d'inscription (mode réaliste)...");

    // Récupérer tous les utilisateurs étudiants
    const users = await sequelize.query(
      `SELECT numero_utilisateur, type_utilisateur 
       FROM utilisateur 
       WHERE type_utilisateur IN ('ETUDIANT', 'ENSEIGNANT', 'DIRECTEUR')
       ORDER BY numero_utilisateur`,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    console.log(`📊 ${users.length} utilisateurs trouvés`);

    if (users.length === 0) {
      console.log("⚠️  Aucun utilisateur à mettre à jour");
      return;
    }

    // Distribution réaliste des inscriptions (en pourcentage)
    // Pics en septembre (rentrée) et février (2ème semestre)
    const monthDistribution = {
      0: 3,   // Janvier
      1: 12,  // Février (pic 2ème semestre)
      2: 5,   // Mars
      3: 4,   // Avril
      4: 3,   // Mai
      5: 2,   // Juin
      6: 2,   // Juillet
      7: 4,   // Août
      8: 35,  // Septembre (pic rentrée)
      9: 15,  // Octobre
      10: 8,  // Novembre
      11: 7,  // Décembre
    };

    const now = new Date();
    const updates = [];
    let userIndex = 0;

    // Générer les dates pour chaque mois selon la distribution
    for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
      const targetDate = new Date(now);
      targetDate.setMonth(targetDate.getMonth() - monthOffset);
      
      const monthKey = targetDate.getMonth();
      const percentage = monthDistribution[monthKey];
      const usersForMonth = Math.round((users.length * percentage) / 100);

      console.log(`📅 Mois ${targetDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}: ${usersForMonth} inscriptions`);

      for (let i = 0; i < usersForMonth && userIndex < users.length; i++, userIndex++) {
        const inscriptionDate = new Date(targetDate);
        inscriptionDate.setDate(Math.floor(Math.random() * 28) + 1);
        inscriptionDate.setHours(Math.floor(Math.random() * 24));
        inscriptionDate.setMinutes(Math.floor(Math.random() * 60));

        updates.push({
          numero: users[userIndex].numero_utilisateur,
          date: inscriptionDate.toISOString(),
        });
      }
    }

    // Mettre à jour par batch
    console.log("\n💾 Mise à jour des dates...");
    
    for (const update of updates) {
      await sequelize.query(
        `UPDATE utilisateur 
         SET date_creation = $1 
         WHERE numero_utilisateur = $2`,
        {
          bind: [update.date, update.numero],
          type: sequelize.QueryTypes.UPDATE,
        }
      );
    }

    console.log("✅ Mise à jour terminée avec succès!");
    
    // Afficher un résumé par mois
    const summary = await sequelize.query(
      `SELECT 
        TO_CHAR(date_creation, 'YYYY-MM') as mois,
        TO_CHAR(date_creation, 'Month YYYY') as mois_nom,
        COUNT(*) as nombre
       FROM utilisateur
       WHERE type_utilisateur IN ('ETUDIANT', 'ENSEIGNANT', 'DIRECTEUR')
         AND date_creation >= NOW() - INTERVAL '12 months'
       GROUP BY TO_CHAR(date_creation, 'YYYY-MM'), TO_CHAR(date_creation, 'Month YYYY')
       ORDER BY mois DESC`,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    console.log("\n📈 Répartition finale par mois:");
    summary.forEach((row) => {
      const bar = '█'.repeat(Math.floor(row.nombre / 2));
      console.log(`   ${row.mois}: ${row.nombre.toString().padStart(3)} ${bar}`);
    });

  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
updateInscriptionDatesRealistic()
  .then(() => {
    console.log("\n🎉 Script terminé");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erreur fatale:", error);
    process.exit(1);
  });
