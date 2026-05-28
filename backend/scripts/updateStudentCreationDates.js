const { sequelize } = require('../models');

/**
 * Script pour mettre à jour les dates de création des étudiants
 * avec des dates réalistes réparties sur les 12 derniers mois
 */

async function updateStudentCreationDates() {
  try {
    console.log('🔄 Mise à jour des dates de création des étudiants...\n');

    // Récupérer tous les étudiants
    const etudiants = await sequelize.query(
      `SELECT u.numero_utilisateur, u.nom, u.prenom, u.date_creation
       FROM utilisateur u
       WHERE u.type_utilisateur = 'ETUDIANT'
       ORDER BY u.numero_utilisateur`,
      { type: sequelize.QueryTypes.SELECT }
    );

    if (etudiants.length === 0) {
      console.log('❌ Aucun étudiant trouvé dans la base de données.');
      return;
    }

    console.log(`📊 ${etudiants.length} étudiants trouvés.\n`);

    // Générer des dates réparties sur les 12 derniers mois
    const now = new Date();
    const updates = [];

    for (let i = 0; i < etudiants.length; i++) {
      const etudiant = etudiants[i];
      
      // Répartir les étudiants sur 12 mois avec une distribution réaliste
      // Plus d'inscriptions en septembre/octobre (rentrée) et janvier/février (2ème semestre)
      const monthWeights = [
        { month: 0, weight: 0.05 },  // Janvier
        { month: 1, weight: 0.08 },  // Février
        { month: 2, weight: 0.05 },  // Mars
        { month: 3, weight: 0.03 },  // Avril
        { month: 4, weight: 0.02 },  // Mai
        { month: 5, weight: 0.02 },  // Juin
        { month: 6, weight: 0.05 },  // Juillet
        { month: 7, weight: 0.08 },  // Août
        { month: 8, weight: 0.25 },  // Septembre (pic de rentrée)
        { month: 9, weight: 0.20 },  // Octobre
        { month: 10, weight: 0.10 }, // Novembre
        { month: 11, weight: 0.07 }  // Décembre
      ];

      // Sélectionner un mois basé sur les poids
      const random = Math.random();
      let cumulativeWeight = 0;
      let selectedMonth = 0;

      for (const { month, weight } of monthWeights) {
        cumulativeWeight += weight;
        if (random <= cumulativeWeight) {
          selectedMonth = month;
          break;
        }
      }

      // Calculer la date (12 mois en arrière + le mois sélectionné)
      const monthsAgo = 11 - selectedMonth;
      const inscriptionDate = new Date(now);
      inscriptionDate.setMonth(inscriptionDate.getMonth() - monthsAgo);
      
      // Ajouter un jour aléatoire dans le mois
      const daysInMonth = new Date(inscriptionDate.getFullYear(), inscriptionDate.getMonth() + 1, 0).getDate();
      inscriptionDate.setDate(Math.floor(Math.random() * daysInMonth) + 1);
      
      // Ajouter une heure aléatoire
      inscriptionDate.setHours(Math.floor(Math.random() * 24));
      inscriptionDate.setMinutes(Math.floor(Math.random() * 60));
      inscriptionDate.setSeconds(Math.floor(Math.random() * 60));

      updates.push({
        numero_utilisateur: etudiant.numero_utilisateur,
        date_creation: inscriptionDate,
        nom: etudiant.nom,
        prenom: etudiant.prenom
      });
    }

    // Mettre à jour les dates en batch
    console.log('📝 Mise à jour des dates de création...\n');
    
    for (const update of updates) {
      await sequelize.query(
        `UPDATE utilisateur 
         SET date_creation = $1 
         WHERE numero_utilisateur = $2`,
        {
          bind: [update.date_creation, update.numero_utilisateur],
          type: sequelize.QueryTypes.UPDATE
        }
      );
    }

    console.log('✅ Dates de création mises à jour avec succès!\n');

    // Afficher un résumé par mois
    console.log('📊 Répartition des inscriptions par mois:\n');
    
    const summary = await sequelize.query(
      `SELECT 
        TO_CHAR(date_creation, 'YYYY-MM') as mois,
        TO_CHAR(date_creation, 'Month YYYY') as mois_nom,
        COUNT(*) as nombre_inscriptions
       FROM utilisateur
       WHERE type_utilisateur = 'ETUDIANT'
         AND date_creation >= CURRENT_DATE - INTERVAL '12 months'
       GROUP BY TO_CHAR(date_creation, 'YYYY-MM'), TO_CHAR(date_creation, 'Month YYYY')
       ORDER BY mois ASC`,
      { type: sequelize.QueryTypes.SELECT }
    );

    summary.forEach(row => {
      console.log(`  ${row.mois_nom.trim()}: ${row.nombre_inscriptions} inscriptions`);
    });

    console.log('\n✨ Script terminé avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des dates:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
updateStudentCreationDates()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
