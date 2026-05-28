const { sequelize } = require("../models");

async function generateBeautifulEvolutionData() {
  try {
    console.log("=== Génération de belles données pour le graphique d'évolution ===\n");

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

    // 2. Définir une belle distribution avec pics de rentrée
    // Cette distribution crée une courbe attrayante avec:
    // - Pic majeur en septembre (rentrée principale)
    // - Pic secondaire en octobre (inscriptions tardives)
    // - Pic tertiaire en janvier/février (rentrée 2ème semestre)
    // - Creux en été (juillet-août)
    const distribution = [
      { mois: 0,  nom: 'Avril 2026',     poids: 0.06, emoji: '🌸' },  // Mois actuel
      { mois: 1,  nom: 'Mars 2026',      poids: 0.05, emoji: '🌼' },
      { mois: 2,  nom: 'Février 2026',   poids: 0.09, emoji: '❄️' },  // Rentrée 2ème semestre
      { mois: 3,  nom: 'Janvier 2026',   poids: 0.10, emoji: '🎊' },  // Rentrée 2ème semestre
      { mois: 4,  nom: 'Décembre 2025',  poids: 0.04, emoji: '🎄' },
      { mois: 5,  nom: 'Novembre 2025',  poids: 0.07, emoji: '🍂' },
      { mois: 6,  nom: 'Octobre 2025',   poids: 0.18, emoji: '🍁' },  // Inscriptions tardives
      { mois: 7,  nom: 'Septembre 2025', poids: 0.28, emoji: '📚' },  // PIC PRINCIPAL - Rentrée
      { mois: 8,  nom: 'Août 2025',      poids: 0.03, emoji: '☀️' },  // Creux été
      { mois: 9,  nom: 'Juillet 2025',   poids: 0.03, emoji: '🏖️' },  // Creux été
      { mois: 10, nom: 'Juin 2025',      poids: 0.04, emoji: '🌞' },
      { mois: 11, nom: 'Mai 2025',       poids: 0.03, emoji: '🌺' }
    ];

    // 3. Calculer le nombre d'étudiants par mois
    const repartition = distribution.map(d => ({
      ...d,
      nombre: Math.round(etudiants.length * d.poids)
    }));

    // Ajuster pour avoir exactement le bon nombre total
    const total = repartition.reduce((sum, r) => sum + r.nombre, 0);
    const diff = etudiants.length - total;
    if (diff !== 0) {
      // Ajouter/retirer la différence au mois le plus important (septembre)
      repartition[7].nombre += diff;
    }

    console.log("📅 Distribution prévue (belle courbe) :");
    console.log("   " + "─".repeat(60));
    repartition.forEach((r) => {
      const pourcentage = ((r.nombre / etudiants.length) * 100).toFixed(1);
      const barLength = Math.round((r.nombre / etudiants.length) * 50);
      const bar = "█".repeat(barLength);
      console.log(`   ${r.emoji} ${r.nom.padEnd(18)} │ ${bar} ${r.nombre} (${pourcentage}%)`);
    });
    console.log("   " + "─".repeat(60));
    console.log();

    // 4. Mélanger les étudiants pour une distribution aléatoire
    const shuffled = [...etudiants].sort(() => Math.random() - 0.5);

    // 5. Assigner les dates avec variation réaliste dans chaque mois
    let updated = 0;
    let currentIndex = 0;

    console.log("🔄 Mise à jour des dates de création...\n");

    for (const rep of repartition) {
      const now = new Date();
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - rep.mois, 1);
      const daysInMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();

      for (let i = 0; i < rep.nombre && currentIndex < shuffled.length; i++) {
        const etudiant = shuffled[currentIndex++];
        
        // Générer une date aléatoire dans le mois avec distribution réaliste
        // Plus d'inscriptions en début de mois pour les mois de rentrée
        let randomDay;
        if (rep.mois === 7 || rep.mois === 6) { // Septembre/Octobre
          // 60% dans les 10 premiers jours
          randomDay = Math.random() < 0.6 
            ? Math.floor(Math.random() * 10) + 1
            : Math.floor(Math.random() * daysInMonth) + 1;
        } else if (rep.mois === 3 || rep.mois === 2) { // Janvier/Février
          // 50% dans les 15 premiers jours
          randomDay = Math.random() < 0.5 
            ? Math.floor(Math.random() * 15) + 1
            : Math.floor(Math.random() * daysInMonth) + 1;
        } else {
          // Distribution uniforme pour les autres mois
          randomDay = Math.floor(Math.random() * daysInMonth) + 1;
        }
        
        // Heures de bureau (8h-18h) pour plus de réalisme
        const randomHour = Math.floor(Math.random() * 10) + 8;
        const randomMinute = Math.floor(Math.random() * 60);
        const randomSecond = Math.floor(Math.random() * 60);
        
        const inscriptionDate = new Date(
          targetMonth.getFullYear(),
          targetMonth.getMonth(),
          randomDay,
          randomHour,
          randomMinute,
          randomSecond
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
        if (updated % 50 === 0) {
          const progress = ((updated / etudiants.length) * 100).toFixed(1);
          const progressBar = "█".repeat(Math.round(progress / 2));
          console.log(`   [${progressBar.padEnd(50)}] ${progress}% (${updated}/${etudiants.length})`);
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
    console.log("   " + "─".repeat(60));
    verification.forEach(row => {
      const nombre = parseInt(row.nombre);
      const pourcentage = ((nombre / etudiants.length) * 100).toFixed(1);
      const barLength = Math.round((nombre / etudiants.length) * 50);
      const bar = "█".repeat(barLength);
      console.log(`   ${row.mois_nom.trim().padEnd(20)} │ ${bar} ${nombre} (${pourcentage}%)`);
    });
    console.log("   " + "─".repeat(60));

    const totalFinal = verification.reduce((sum, row) => sum + parseInt(row.nombre), 0);
    console.log(`\n✅ Total: ${totalFinal} étudiants dans les 12 derniers mois`);
    console.log(`✅ Pourcentage couvert: ${((totalFinal / etudiants.length) * 100).toFixed(1)}%`);

    // 7. Statistiques supplémentaires
    console.log("\n📊 Statistiques de la distribution :");
    const max = Math.max(...verification.map(r => parseInt(r.nombre)));
    const min = Math.min(...verification.map(r => parseInt(r.nombre)));
    const avg = totalFinal / verification.length;
    console.log(`   Maximum: ${max} étudiants`);
    console.log(`   Minimum: ${min} étudiants`);
    console.log(`   Moyenne: ${avg.toFixed(0)} étudiants par mois`);
    console.log(`   Ratio max/min: ${(max/min).toFixed(2)}x`);

    console.log("\n🎉 Génération terminée avec succès !");
    console.log("   📌 Prochaines étapes :");
    console.log("      1. Redémarrez le backend : npm run dev");
    console.log("      2. Rechargez le dashboard recteur");
    console.log("      3. Admirez votre belle courbe d'évolution ! 📈");

  } catch (error) {
    console.error("❌ Erreur:", error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

generateBeautifulEvolutionData();
