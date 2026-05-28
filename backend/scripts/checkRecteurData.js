const { sequelize } = require('../models');

/**
 * Script pour vérifier les données du recteur
 * Affiche les statistiques et aide au diagnostic
 */

async function checkRecteurData() {
  try {
    console.log('🔍 Vérification des données du recteur...\n');

    // 1. Vérifier les recteurs
    console.log('📋 1. RECTEURS DANS LA BASE:');
    const recteurs = await sequelize.query(
      `SELECT u.numero_utilisateur, u.nom, u.prenom, u.email, r.id_rectorat, rec.nom_rectorat
       FROM utilisateur u
       JOIN recteur_universite r ON u.numero_utilisateur = r.numero_utilisateur
       LEFT JOIN rectorat rec ON r.id_rectorat = rec.id_rectorat
       WHERE u.type_utilisateur = 'RECTEUR'`,
      { type: sequelize.QueryTypes.SELECT }
    );

    if (recteurs.length === 0) {
      console.log('❌ Aucun recteur trouvé dans la base de données.\n');
      return;
    }

    recteurs.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.nom} ${r.prenom} (${r.email})`);
      console.log(`      Rectorat: ${r.nom_rectorat || 'Non défini'} (ID: ${r.id_rectorat || 'N/A'})\n`);
    });

    // Pour chaque recteur, afficher les statistiques
    for (const recteur of recteurs) {
      if (!recteur.id_rectorat) {
        console.log(`⚠️  Le recteur ${recteur.nom} ${recteur.prenom} n'a pas de rectorat associé.\n`);
        continue;
      }

      console.log(`\n${'='.repeat(80)}`);
      console.log(`📊 STATISTIQUES POUR: ${recteur.nom} ${recteur.prenom}`);
      console.log(`   Rectorat: ${recteur.nom_rectorat} (ID: ${recteur.id_rectorat})`);
      console.log('='.repeat(80));

      // 2. Établissements du rectorat
      console.log('\n🏫 2. ÉTABLISSEMENTS DU RECTORAT:');
      const etablissements = await sequelize.query(
        `SELECT id_etablissement, nom_etablissement, type
         FROM etablissement
         WHERE id_rectorat = $1
         ORDER BY nom_etablissement`,
        { 
          bind: [recteur.id_rectorat],
          type: sequelize.QueryTypes.SELECT 
        }
      );

      if (etablissements.length === 0) {
        console.log('   ❌ Aucun établissement trouvé pour ce rectorat.\n');
        continue;
      }

      console.log(`   Total: ${etablissements.length} établissement(s)\n`);
      etablissements.forEach((e, i) => {
        console.log(`   ${i + 1}. ${e.nom_etablissement} (${e.type || 'N/A'})`);
      });

      // 3. Étudiants
      console.log('\n👨‍🎓 3. ÉTUDIANTS:');
      const etudiants = await sequelize.query(
        `SELECT COUNT(DISTINCT et.numero_utilisateur) as total,
                COUNT(DISTINCT CASE WHEN u.statut = 'ACTIF' THEN et.numero_utilisateur END) as actifs,
                COUNT(DISTINCT CASE WHEN u.statut = 'INACTIF' THEN et.numero_utilisateur END) as inactifs,
                COUNT(DISTINCT CASE WHEN u.statut = 'SUSPENDU' THEN et.numero_utilisateur END) as suspendus
         FROM etudiant et
         JOIN etablissement e ON et.id_etablissement = e.id_etablissement
         JOIN utilisateur u ON et.numero_utilisateur = u.numero_utilisateur
         WHERE e.id_rectorat = $1`,
        { 
          bind: [recteur.id_rectorat],
          type: sequelize.QueryTypes.SELECT 
        }
      );

      const etudiantStats = etudiants[0];
      console.log(`   Total: ${etudiantStats.total}`);
      console.log(`   - Actifs: ${etudiantStats.actifs}`);
      console.log(`   - Inactifs: ${etudiantStats.inactifs}`);
      console.log(`   - Suspendus: ${etudiantStats.suspendus}`);

      // 4. Enseignants
      console.log('\n👨‍🏫 4. ENSEIGNANTS:');
      const enseignants = await sequelize.query(
        `SELECT COUNT(DISTINCT ens.numero_utilisateur) as total,
                COUNT(DISTINCT CASE WHEN u.statut = 'ACTIF' THEN ens.numero_utilisateur END) as actifs,
                COUNT(DISTINCT CASE WHEN u.statut = 'INACTIF' THEN ens.numero_utilisateur END) as inactifs,
                COUNT(DISTINCT CASE WHEN u.statut = 'SUSPENDU' THEN ens.numero_utilisateur END) as suspendus
         FROM enseignant ens
         JOIN etablissement e ON ens.id_etablissement_principal = e.id_etablissement
         JOIN utilisateur u ON ens.numero_utilisateur = u.numero_utilisateur
         WHERE e.id_rectorat = $1`,
        { 
          bind: [recteur.id_rectorat],
          type: sequelize.QueryTypes.SELECT 
        }
      );

      const enseignantStats = enseignants[0];
      console.log(`   Total: ${enseignantStats.total}`);
      console.log(`   - Actifs: ${enseignantStats.actifs}`);
      console.log(`   - Inactifs: ${enseignantStats.inactifs}`);
      console.log(`   - Suspendus: ${enseignantStats.suspendus}`);

      // 5. Directeurs
      console.log('\n👨‍💼 5. DIRECTEURS:');
      const directeurs = await sequelize.query(
        `SELECT COUNT(DISTINCT de.numero_utilisateur) as total,
                COUNT(DISTINCT CASE WHEN u.statut = 'ACTIF' THEN de.numero_utilisateur END) as actifs,
                COUNT(DISTINCT CASE WHEN u.statut = 'INACTIF' THEN de.numero_utilisateur END) as inactifs,
                COUNT(DISTINCT CASE WHEN u.statut = 'SUSPENDU' THEN de.numero_utilisateur END) as suspendus
         FROM directeur_etablissement de
         JOIN etablissement e ON de.id_etablissement = e.id_etablissement
         JOIN utilisateur u ON de.numero_utilisateur = u.numero_utilisateur
         WHERE e.id_rectorat = $1`,
        { 
          bind: [recteur.id_rectorat],
          type: sequelize.QueryTypes.SELECT 
        }
      );

      const directeurStats = directeurs[0];
      console.log(`   Total: ${directeurStats.total}`);
      console.log(`   - Actifs: ${directeurStats.actifs}`);
      console.log(`   - Inactifs: ${directeurStats.inactifs}`);
      console.log(`   - Suspendus: ${directeurStats.suspendus}`);

      // 6. Dates de création des étudiants
      console.log('\n📅 6. DATES DE CRÉATION DES ÉTUDIANTS:');
      const dateStats = await sequelize.query(
        `SELECT 
          MIN(u.date_creation) as premiere_inscription,
          MAX(u.date_creation) as derniere_inscription,
          COUNT(DISTINCT CASE 
            WHEN u.date_creation >= CURRENT_DATE - INTERVAL '12 months' 
            THEN et.numero_utilisateur 
          END) as inscriptions_12_mois
         FROM etudiant et
         JOIN etablissement e ON et.id_etablissement = e.id_etablissement
         JOIN utilisateur u ON et.numero_utilisateur = u.numero_utilisateur
         WHERE e.id_rectorat = $1`,
        { 
          bind: [recteur.id_rectorat],
          type: sequelize.QueryTypes.SELECT 
        }
      );

      const dates = dateStats[0];
      console.log(`   Première inscription: ${dates.premiere_inscription || 'N/A'}`);
      console.log(`   Dernière inscription: ${dates.derniere_inscription || 'N/A'}`);
      console.log(`   Inscriptions (12 derniers mois): ${dates.inscriptions_12_mois}`);

      // 7. Répartition par mois (12 derniers mois)
      console.log('\n📊 7. RÉPARTITION PAR MOIS (12 derniers mois):');
      const parMois = await sequelize.query(
        `SELECT 
          TO_CHAR(u.date_creation, 'YYYY-MM') as mois,
          TO_CHAR(u.date_creation, 'Month YYYY') as mois_nom,
          COUNT(DISTINCT et.numero_utilisateur) as nombre
         FROM etudiant et
         JOIN etablissement e ON et.id_etablissement = e.id_etablissement
         JOIN utilisateur u ON et.numero_utilisateur = u.numero_utilisateur
         WHERE e.id_rectorat = $1
           AND u.date_creation >= CURRENT_DATE - INTERVAL '12 months'
         GROUP BY TO_CHAR(u.date_creation, 'YYYY-MM'), TO_CHAR(u.date_creation, 'Month YYYY')
         ORDER BY mois ASC`,
        { 
          bind: [recteur.id_rectorat],
          type: sequelize.QueryTypes.SELECT 
        }
      );

      if (parMois.length === 0) {
        console.log('   ❌ Aucune inscription dans les 12 derniers mois.');
      } else {
        parMois.forEach(m => {
          console.log(`   ${m.mois_nom.trim()}: ${m.nombre} inscription(s)`);
        });
      }

      console.log('\n');
    }

    console.log('='.repeat(80));
    console.log('✅ Vérification terminée!\n');

    // Recommandations
    console.log('💡 RECOMMANDATIONS:');
    
    const totalEtudiants = await sequelize.query(
      `SELECT COUNT(DISTINCT et.numero_utilisateur) as total
       FROM etudiant et
       JOIN etablissement e ON et.id_etablissement = e.id_etablissement
       WHERE e.id_rectorat IN (SELECT id_rectorat FROM recteur_universite)`,
      { type: sequelize.QueryTypes.SELECT }
    );

    if (parseInt(totalEtudiants[0].total) === 0) {
      console.log('   1. Aucun étudiant trouvé. Exécutez:');
      console.log('      node backend/scripts/insertEtudiantsEPT.js');
    }

    const recentInscriptions = await sequelize.query(
      `SELECT COUNT(*) as total
       FROM utilisateur u
       WHERE u.type_utilisateur = 'ETUDIANT'
         AND u.date_creation >= CURRENT_DATE - INTERVAL '12 months'`,
      { type: sequelize.QueryTypes.SELECT }
    );

    if (parseInt(recentInscriptions[0].total) === 0) {
      console.log('   2. Aucune inscription récente. Exécutez:');
      console.log('      node backend/scripts/updateStudentCreationDates.js');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
checkRecteurData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
