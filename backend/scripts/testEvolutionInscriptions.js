const { sequelize } = require("../models");

async function testEvolutionInscriptions() {
  try {
    console.log("=== Test de la requête d'évolution des inscriptions ===\n");

    // 1. Récupérer un recteur de test
    const recteurs = await sequelize.query(
      `SELECT r.numero_utilisateur, r.id_rectorat, u.nom, u.prenom
       FROM recteur_universite r
       JOIN utilisateur u ON r.numero_utilisateur = u.numero_utilisateur
       LIMIT 1`,
      { type: sequelize.QueryTypes.SELECT }
    );

    if (recteurs.length === 0) {
      console.log("❌ Aucun recteur trouvé dans la base de données");
      return;
    }

    const recteur = recteurs[0];
    console.log(`✅ Recteur trouvé: ${recteur.prenom} ${recteur.nom}`);
    console.log(`   ID Rectorat: ${recteur.id_rectorat}\n`);

    // 2. Vérifier le nombre total d'étudiants pour ce rectorat
    const countEtudiants = await sequelize.query(
      `SELECT COUNT(DISTINCT et.numero_utilisateur) as total 
       FROM etudiant et 
       JOIN etablissement e ON et.id_etablissement = e.id_etablissement 
       WHERE e.id_rectorat = $1`,
      {
        bind: [recteur.id_rectorat],
        type: sequelize.QueryTypes.SELECT,
      }
    );
    console.log(`📊 Total étudiants pour ce rectorat: ${countEtudiants[0].total}\n`);

    // 3. Vérifier la distribution des dates de création
    const dateDistribution = await sequelize.query(
      `SELECT 
        TO_CHAR(u.date_creation, 'YYYY-MM') as mois,
        COUNT(DISTINCT et.numero_utilisateur) as nombre
       FROM etudiant et
       JOIN etablissement e ON et.id_etablissement = e.id_etablissement
       JOIN utilisateur u ON et.numero_utilisateur = u.numero_utilisateur
       WHERE e.id_rectorat = $1
       GROUP BY TO_CHAR(u.date_creation, 'YYYY-MM')
       ORDER BY mois DESC
       LIMIT 15`,
      {
        bind: [recteur.id_rectorat],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    console.log("📅 Distribution des inscriptions par mois (15 derniers mois):");
    dateDistribution.forEach(row => {
      console.log(`   ${row.mois}: ${row.nombre} étudiants`);
    });
    console.log();

    // 4. Tester la requête d'évolution (12 derniers mois)
    const evolutionData = await sequelize.query(
      `
      WITH mois_series AS (
        SELECT 
          TO_CHAR(date_trunc('month', CURRENT_DATE - (n || ' months')::interval), 'YYYY-MM') as mois
        FROM generate_series(0, 11) n
      )
      SELECT 
        ms.mois,
        COALESCE(COUNT(DISTINCT et.numero_utilisateur), 0) as nombre_inscriptions
      FROM mois_series ms
      LEFT JOIN utilisateur u ON TO_CHAR(u.date_creation, 'YYYY-MM') = ms.mois 
        AND u.type_utilisateur = 'ETUDIANT'
      LEFT JOIN etudiant et ON u.numero_utilisateur = et.numero_utilisateur
      LEFT JOIN etablissement e ON et.id_etablissement = e.id_etablissement
      WHERE e.id_rectorat = $1 OR e.id_rectorat IS NULL
      GROUP BY ms.mois
      ORDER BY ms.mois ASC
    `,
      {
        bind: [recteur.id_rectorat],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    console.log("📈 Évolution des inscriptions (12 derniers mois):");
    evolutionData.forEach(row => {
      console.log(`   ${row.mois}: ${row.nombre_inscriptions} inscriptions`);
    });
    console.log();

    const totalInscriptions = evolutionData.reduce((sum, row) => sum + parseInt(row.nombre_inscriptions), 0);
    console.log(`✅ Total inscriptions sur 12 mois: ${totalInscriptions}`);

    if (totalInscriptions === 0) {
      console.log("\n⚠️  ATTENTION: Aucune inscription trouvée sur les 12 derniers mois!");
      console.log("   Vérifiez que les dates de création des étudiants sont bien dans cette période.");
    }

  } catch (error) {
    console.error("❌ Erreur:", error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

testEvolutionInscriptions();
