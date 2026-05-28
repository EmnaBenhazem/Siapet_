const { sequelize } = require("./models");

async function testAdminEndpoint() {
  try {
    console.log(
      "🔍 Test de l'endpoint admin/dashboard/random-etablissements\n",
    );

    // Simuler la requête SQL du contrôleur
    const etablissements = await sequelize.query(
      `
      SELECT 
        e.id_etablissement,
        e.code_etablissement,
        e.nom_etablissement,
        e.type,
        v.nom_ville,
        COUNT(DISTINCT et.numero_utilisateur) as effectif_total,
        COALESCE(AVG(CASE 
          WHEN et.moyenne_generale IS NOT NULL 
          THEN et.moyenne_generale 
        END) * 5, 0) as taux_reussite,
        e.budget_alloue
      FROM etablissement e
      LEFT JOIN ville v ON e.id_ville = v.id_ville
      LEFT JOIN etudiant et ON e.id_etablissement = et.id_etablissement
      WHERE e.archive = false
      GROUP BY e.id_etablissement, e.code_etablissement, e.nom_etablissement, e.type, v.nom_ville, e.budget_alloue
      ORDER BY RANDOM()
      LIMIT 10
    `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    console.log(
      `✅ Nombre d'établissements trouvés: ${etablissements.length}\n`,
    );

    if (etablissements.length > 0) {
      console.log("📋 Exemple d'établissement:");
      console.log(JSON.stringify(etablissements[0], null, 2));
      console.log("\n📊 Liste des établissements:");
      etablissements.forEach((e, i) => {
        console.log(
          `${i + 1}. ${e.code_etablissement} - ${e.nom_etablissement} (${e.type}) - ${e.effectif_total} étudiants - Taux: ${parseFloat(e.taux_reussite).toFixed(1)}%`,
        );
      });
    } else {
      console.log("⚠️  Aucun établissement trouvé dans la base de données");
    }
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    console.error(error);
  } finally {
    process.exit();
  }
}

testAdminEndpoint();
