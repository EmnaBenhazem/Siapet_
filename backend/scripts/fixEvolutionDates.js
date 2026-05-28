const { sequelize } = require("../models");

async function fixEvolutionDates() {
  try {
    console.log("=== Correction des dates pour le graphique d'évolution ===\n");

    // 1. Vérifier combien d'étudiants ont des dates hors des 12 derniers mois
    const statsAvant = await sequelize.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN u.date_creation >= CURRENT_DATE - INTERVAL '12 months' THEN 1 END) as dans_12_mois,
        COUNT(CASE WHEN u.date_creation < CURRENT_DATE - INTERVAL '12 months' THEN 1 END) as hors_12_mois
       FROM utilisateur u
       WHERE u.type_utilisateur = 'ETUDIANT'`,
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log("📊 Statistiques avant correction:");
    console.log(`   Total étudiants: ${statsAvant[0].total}`);
    console.log(`   Dans les 12 derniers mois: ${statsAvant[0].dans_12_mois}`);
    console.log(`   Hors des 12 derniers mois: ${statsAvant[0].hors_12_mois}\n`);

    if (parseInt(statsAvant[0].dans_12_mois) > 0) {
      console.log("✅ Des étudiants ont déjà des dates dans les 12 derniers mois.");
      console.log("   Aucune correction nécessaire.\n");
      return;
    }

    console.log("⚠️  Aucun étudiant n'a de date dans les 12 derniers mois.");
    console.log("   Redistribution des dates...\n");

    // 2. Récupérer tous les étudiants
    const etudiants = await sequelize.query(
      `SELECT u.numero_utilisateur
       FROM utilisateur u
       WHERE u.type_utilisateur = 'ETUDIANT'
       ORDER BY u.date_creation ASC`,
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log(`📝 ${etudiants.length} étudiants à traiter\n`);

    // 3. Redistribuer les dates sur les 12 derniers mois
    let updated = 0;
    for (let i = 0; i < etudiants.length; i++) {
      const etudiant = etudiants[i];
      
      // Générer une date aléatoire dans les 12 derniers mois
      const daysAgo = Math.floor(Math.random() * 365); // 0 à 365 jours
      const newDate = new Date();
      newDate.setDate(newDate.getDate() - daysAgo);

      await sequelize.query(
        `UPDATE utilisateur 
         SET date_creation = $1 
         WHERE numero_utilisateur = $2`,
        {
          bind: [newDate, etudiant.numero_utilisateur],
          type: sequelize.QueryTypes.UPDATE
        }
      );

      updated++;
      if (updated % 100 === 0) {
        console.log(`   Progression: ${updated}/${etudiants.length} étudiants mis à jour`);
      }
    }

    console.log(`\n✅ ${updated} étudiants mis à jour\n`);

    // 4. Vérifier la distribution après correction
    const statsApres = await sequelize.query(
      `SELECT 
        TO_CHAR(u.date_creation, 'YYYY-MM') as mois,
        COUNT(*) as nombre
       FROM utilisateur u
       WHERE u.type_utilisateur = 'ETUDIANT'
         AND u.date_creation >= CURRENT_DATE - INTERVAL '12 months'
       GROUP BY TO_CHAR(u.date_creation, 'YYYY-MM')
       ORDER BY mois ASC`,
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log("📈 Distribution après correction:");
    statsApres.forEach(row => {
      console.log(`   ${row.mois}: ${row.nombre} étudiants`);
    });

    const totalApres = statsApres.reduce((sum, row) => sum + parseInt(row.nombre), 0);
    console.log(`\n✅ Total: ${totalApres} étudiants dans les 12 derniers mois`);

  } catch (error) {
    console.error("❌ Erreur:", error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

fixEvolutionDates();
