const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function redistributeDates() {
  try {
    console.log('🔄 Début de la redistribution des dates d\'inscription...');

    // 1. Récupérer tous les étudiants
    const { rows: students } = await pool.query(`
      SELECT numero_utilisateur 
      FROM utilisateur 
      WHERE type_utilisateur = 'ETUDIANT'
    `);

    console.log(`📊 ${students.length} étudiants trouvés`);

    if (students.length === 0) {
      console.log('⚠️  Aucun étudiant à mettre à jour');
      return;
    }

    // 2. Redistribuer les dates sur 12 mois aléatoirement
    let updated = 0;
    for (const student of students) {
      // Générer un nombre de jours aléatoire entre 0 et 365 (12 mois)
      const daysAgo = Math.floor(Math.random() * 365);
      
      await pool.query(`
        UPDATE utilisateur 
        SET date_creation = NOW() - ($1 || ' days')::interval
        WHERE numero_utilisateur = $2
      `, [daysAgo, student.numero_utilisateur]);
      
      updated++;
      
      // Afficher la progression tous les 50 utilisateurs
      if (updated % 50 === 0) {
        console.log(`   ⏳ ${updated}/${students.length} étudiants mis à jour...`);
      }
    }

    console.log(`✅ ${updated} dates mises à jour avec succès`);

    // 3. Afficher un résumé de la distribution
    const { rows: summary } = await pool.query(`
      SELECT 
        TO_CHAR(date_creation, 'YYYY-MM') as mois,
        COUNT(*) as nombre
      FROM utilisateur
      WHERE type_utilisateur = 'ETUDIANT'
        AND date_creation >= NOW() - INTERVAL '13 months'
      GROUP BY TO_CHAR(date_creation, 'YYYY-MM')
      ORDER BY mois ASC
    `);

    console.log('\n📈 Répartition par mois:');
    let total = 0;
    summary.forEach((row) => {
      const bar = '█'.repeat(Math.floor(row.nombre / 5));
      console.log(`   ${row.mois}: ${row.nombre.toString().padStart(3)} ${bar}`);
      total += parseInt(row.nombre);
    });
    console.log(`\n   TOTAL: ${total} étudiants`);

  } catch (error) {
    console.error('❌ Erreur lors de la redistribution:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Exécuter le script
redistributeDates()
  .then(() => {
    console.log('\n🎉 Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });
