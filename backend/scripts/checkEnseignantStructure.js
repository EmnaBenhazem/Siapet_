const sequelize = require('../config/database');

async function checkStructure() {
  try {
    // Vérifier la structure de la table enseignant
    const [enseignantCols] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'enseignant' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n=== Colonnes de la table ENSEIGNANT ===');
    enseignantCols.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });

    // Vérifier la structure de la table etudiant
    const [etudiantCols] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'etudiant' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n=== Colonnes de la table ETUDIANT ===');
    etudiantCols.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });

    // Vérifier si les tables specialite et niveau existent
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('specialite', 'niveau')
    `);
    
    console.log('\n=== Tables disponibles ===');
    tables.forEach(t => {
      console.log(`  ${t.table_name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}

checkStructure();
