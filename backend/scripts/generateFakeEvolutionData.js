const { sequelize } = require("../models");

async function generateFakeEvolutionData() {
  try {
    console.log("=== Génération de fausses données pour le graphique d'évolution ===\n");

    // 1. Récupérer tous les étudiants
    const etudiants = await sequelize.query(
      `SELECT u.numero_utilisateur, et.id_etablissement
       FROM utilisateur u
       JOIN etudiant et ON u.numero_utilisateur = et.numero_utilisateur
       WHERE u.type_utilisateur = 'ETUDIANT'
       ORDER BY u.numero_utilisateur`,
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log(`📊 ${etudiants.length} étudiants trouvés\n`);

    if (etudiants.length === 0) {
      console.log("❌ Aucun étudiant trouvé. Impossible de générer des données.");
      return;
    }

    // 2. Définir une distribution réaliste sur 12 mois
    // Plus d'inscriptions en septembre/octobre (rentrée) et janvier/février (2ème semestre)
    const distribution = [
      { mois: 0, poids: 0.05 },  // Avril (mois actuel)
      { mois: 1, poids: 0.04 },  // Mars
      { mois: 2, poids: 0.06 },  // Février (rentrée 2ème semestre)
      { mois: 3, poids: 0.08 },  // Janvier (rentrée 2ème semestre)
      { mois: 4, poids: 0.04 },  // Décembre
      { mois: 5, poids: 0.05 },  // Novembre
      { mois: 6, poids: 0.25 },  // Octobre (pic rentrée)
      { mois: 7, poids: 0.30 },  // Septembre (pic rentrée)
      { mois: 8, poids: 0.05 },  // Août
      { mois: 9, poids: 0.03 },  // Juillet
      { mois: 10, poids: 0.03 }, // Juin
      { mois: 11, poids: 0.02 }  // Mai
    ];

    // 3. Calculer le nombre d'étudiants par mois
    const repartition = distribution.map(d => ({
      mois: d.mois,
      nombre: Math.round(etudiants.length * d.poids)
    }));

    // Ajuster pour avoir exactement le bon nombre total
    const total = repartition.reduce((sum, r) => sum + r.nombre, 0);
    const diff = etudiants.length - total;
    if (diff !== 0) {
      // Ajouter/retirer la différence au mois le plus important (septembre)
      repartition[7].nombre += diff;
    }

    console.log("📅 Distribution prévue :");
    const moisNoms = ['Avril', 'Mars', 'Février', 'Janvier', 'Décembre', 'Novembre', 
                      'Octobre', 'Septembre', 'Août', 'Juillet', 'Juin', 'Mai'];
    repartition.forEach((r, index) => {
      const pourcentage = ((r.nombre / etudiants.length) * 100).toFixed(1);
      console.log(`   ${moisNoms[index]}: ${r.nombre} étudiants (${pourcentage}%)`);
    });
    console.log();

    // 4. Mélanger les étudiants pour une distribution aléatoire
    const shuffled = [...etudiants].sort(() => Math.random() - 0.5);

    // 5. Assigner les dates
    let updated = 0;
    let currentIndex = 0;

    for (const rep of repartition) {
      const now = new Date();
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - rep.mois, 1);
      const daysInMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();

      for (let i = 0; i < rep.nombre && currentIndex < shuffled.length; i++) {
        const etudiant = shuffled[currentIndex++];
        
        // Générer une date aléatoire dans le mois
        const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
        const randomHour = Math.floor(Math.random() * 24);
        const randomMinute = Math.floor(Math.random() * 60);
        
        const inscriptionDate = new Date(
          targetMonth.getFullYear(),
          targetMonth.getMonth(),
          randomDay,
          randomHour,
          randomMinute
        );

        await sequelize.query(
          `UPDATE utilisateur 
           SET date_creation = $1 
           WHERE numero_utilisateur = $2`,
          {
            bind: [inscriptionDate, etudiant.numero_utilisateur],
            type: sequelize.QueryTypes.UPDATE
          }
        );

        updated++;
        if (updated % 100 === 0) {
          console.log(`   Progression: ${updated}/${etudiants.length} étudiants mis à jour`);
        }
      }
    }

    console.log(`\n✅ ${updated} étudiants mis à jour avec succès\n`);

    // 6. Vérifier la distribution finale
    const verification = await sequelize.query(
      `SELECT 
        TO_CHAR(u.date_creation, 'YYYY-MM') as mois,
        TO_CHAR(u.date_creation, 'Month YYYY') as mois_nom,
        COUNT(*) as nombre
       FROM utilisateur u
       WHERE u.type_utilisateur = 'ETUDIANT'
         AND u.date_creation >= CURRENT_DATE - INTERVAL '12 months'
       GROUP BY TO_CHAR(u.date_creation, 'YYYY-MM'), TO_CHAR(u.date_creation, 'Month YYYY')
       ORDER BY mois DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log("📈 Distribution finale (vérification) :");
    verification.forEach(row => {
      const pourcentage = ((parseInt(row.nombre) / etudiants.length) * 100).toFixed(1);
      console.log(`   ${row.mois_nom.trim()}: ${row.nombre} étudiants (${pourcentage}%)`);
    });

    const totalFinal = verification.reduce((sum, row) => sum + parseInt(row.nombre), 0);
    console.log(`\n✅ Total: ${totalFinal} étudiants dans les 12 derniers mois`);
    console.log(`✅ Pourcentage couvert: ${((totalFinal / etudiants.length) * 100).toFixed(1)}%`);

    console.log("\n🎉 Génération terminée avec succès !");
    console.log("   Redémarrez le backend et rechargez le dashboard recteur pour voir les changements.");

  } catch (error) {
    console.error("❌ Erreur:", error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

generateFakeEvolutionData();
