const { sequelize } = require("../models");

async function redistributeEPTDates() {
  try {
    console.log("=== REDISTRIBUTION DES DATES D'INSCRIPTION EPT ===\n");

    // 1. Récupérer l'EPT
    const etab = await sequelize.query(
      `SELECT id_etablissement FROM etablissement WHERE code_etablissement = 'EPT'`,
      { type: sequelize.QueryTypes.SELECT }
    );

    if (etab.length === 0) {
      console.log('❌ EPT non trouvé');
      return;
    }

    const idEtablissement = etab[0].id_etablissement;
    console.log('✅ Établissement EPT trouvé (ID:', idEtablissement, ')');

    // 2. Récupérer tous les étudiants de l'EPT
    const etudiants = await sequelize.query(
      `SELECT et.numero_utilisateur 
       FROM etudiant et
       WHERE et.id_etablissement = $1`,
      { bind: [idEtablissement], type: sequelize.QueryTypes.SELECT }
    );

    console.log(`\n📊 ${etudiants.length} étudiants trouvés`);

    if (etudiants.length === 0) {
      console.log('❌ Aucun étudiant trouvé');
      return;
    }

    // 3. Définir les mois avec des poids (plus d'inscriptions en septembre/octobre)
    const moisDistribution = [
      { mois: 0, poids: 5 },   // Janvier
      { mois: 1, poids: 3 },   // Février
      { mois: 2, poids: 2 },   // Mars
      { mois: 3, poids: 2 },   // Avril
      { mois: 4, poids: 2 },   // Mai
      { mois: 5, poids: 1 },   // Juin
      { mois: 6, poids: 1 },   // Juillet
      { mois: 7, poids: 2 },   // Août
      { mois: 8, poids: 25 },  // Septembre (pic d'inscriptions)
      { mois: 9, poids: 20 },  // Octobre
      { mois: 10, poids: 8 },  // Novembre
      { mois: 11, poids: 4 },  // Décembre
    ];

    // Calculer le total des poids
    const totalPoids = moisDistribution.reduce((sum, m) => sum + m.poids, 0);

    // 4. Distribuer les étudiants selon les poids
    let etudiantsParMois = [];
    let index = 0;

    for (const dist of moisDistribution) {
      const nombreEtudiants = Math.round((dist.poids / totalPoids) * etudiants.length);
      const etudiantsMois = etudiants.slice(index, index + nombreEtudiants);
      
      if (etudiantsMois.length > 0) {
        etudiantsParMois.push({
          mois: dist.mois,
          etudiants: etudiantsMois
        });
      }
      
      index += nombreEtudiants;
    }

    // Ajouter les étudiants restants au dernier mois
    if (index < etudiants.length) {
      const dernierMois = etudiantsParMois[etudiantsParMois.length - 1];
      dernierMois.etudiants.push(...etudiants.slice(index));
    }

    console.log('\n📅 Distribution par mois:');
    
    // 5. Mettre à jour les dates
    let updated = 0;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    for (const moisData of etudiantsParMois) {
      // Calculer l'année (si le mois est dans le futur, utiliser l'année précédente)
      let year = currentYear;
      if (moisData.mois > currentMonth) {
        year = currentYear - 1;
      }

      const nomMois = new Date(year, moisData.mois, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      console.log(`   ${nomMois}: ${moisData.etudiants.length} étudiants`);

      for (const etudiant of moisData.etudiants) {
        // Générer une date aléatoire dans le mois
        const jour = Math.floor(Math.random() * 28) + 1; // 1-28 pour éviter les problèmes de fin de mois
        const heure = Math.floor(Math.random() * 24);
        const minute = Math.floor(Math.random() * 60);
        const seconde = Math.floor(Math.random() * 60);

        const dateInscription = new Date(year, moisData.mois, jour, heure, minute, seconde);

        try {
          await sequelize.query(
            `UPDATE utilisateur 
             SET date_creation = $1 
             WHERE numero_utilisateur = $2`,
            {
              bind: [dateInscription, etudiant.numero_utilisateur],
              type: sequelize.QueryTypes.UPDATE
            }
          );
          updated++;
        } catch (error) {
          console.error(`❌ Erreur pour ${etudiant.numero_utilisateur}:`, error.message);
        }
      }
    }

    console.log(`\n✅ ${updated} dates mises à jour avec succès!`);

    // 6. Vérification
    console.log('\n📊 Vérification de la distribution:');
    const verification = await sequelize.query(
      `SELECT 
        TO_CHAR(u.date_creation, 'YYYY-MM') as mois,
        TO_CHAR(u.date_creation, 'Month YYYY') as mois_nom,
        COUNT(*) as nombre
       FROM utilisateur u
       JOIN etudiant et ON u.numero_utilisateur = et.numero_utilisateur
       WHERE et.id_etablissement = $1
       GROUP BY TO_CHAR(u.date_creation, 'YYYY-MM'), TO_CHAR(u.date_creation, 'Month YYYY')
       ORDER BY mois DESC`,
      { bind: [idEtablissement], type: sequelize.QueryTypes.SELECT }
    );

    verification.forEach(v => {
      console.log(`   ${v.mois_nom.trim()}: ${v.nombre} étudiants`);
    });

    console.log('\n=== REDISTRIBUTION TERMINÉE ===');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

redistributeEPTDates();
