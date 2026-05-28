const { sequelize } = require('../models');
const bcrypt = require('bcrypt');
const readline = require('readline');

/**
 * Script pour insérer des étudiants dans les établissements d'un rectorat
 */

// Interface pour lire l'entrée utilisateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction pour poser une question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Noms tunisiens réalistes
const prenomsMasculins = [
  'Mohamed', 'Ahmed', 'Ali', 'Mehdi', 'Youssef', 'Amine', 'Khalil', 'Hamza', 
  'Omar', 'Aymen', 'Bilel', 'Fares', 'Karim', 'Nabil', 'Rami', 'Sami',
  'Tarek', 'Walid', 'Zied', 'Malek', 'Anis', 'Hichem', 'Slim', 'Sofien'
];

const prenomsFeminins = [
  'Fatma', 'Amira', 'Salma', 'Ines', 'Mariem', 'Nour', 'Yasmine', 'Sarra',
  'Rahma', 'Emna', 'Hiba', 'Meriem', 'Nesrine', 'Olfa', 'Rania', 'Sihem',
  'Wafa', 'Zeineb', 'Asma', 'Dorra', 'Hela', 'Leila', 'Najoua', 'Samia'
];

const noms = [
  'Ben Ali', 'Trabelsi', 'Jebali', 'Hamdi', 'Gharbi', 'Karoui', 'Mejri', 'Nasri',
  'Oueslati', 'Riahi', 'Saidi', 'Tlili', 'Zouari', 'Abidi', 'Bouzid', 'Chaabane',
  'Dridi', 'Ferjani', 'Guesmi', 'Haddad', 'Jlassi', 'Khelifi', 'Labidi', 'Maaloul',
  'Nouri', 'Ouertani', 'Rezgui', 'Sfar', 'Touati', 'Yahyaoui'
];

// Fonction pour générer un nom aléatoire
function genererNomComplet(sexe) {
  const prenoms = sexe === 'HOMME' ? prenomsMasculins : prenomsFeminins;
  const prenom = prenoms[Math.floor(Math.random() * prenoms.length)];
  const nom = noms[Math.floor(Math.random() * noms.length)];
  return { prenom, nom };
}

// Fonction pour générer un email
function genererEmail(prenom, nom, etablissement) {
  const prenomClean = prenom.toLowerCase().replace(/\s/g, '');
  const nomClean = nom.toLowerCase().replace(/\s/g, '').replace(/\'/g, '');
  const domaine = etablissement.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 10);
  return `${prenomClean}.${nomClean}@${domaine}.tn`;
}

// Fonction pour générer un numéro étudiant
function genererNumeroEtudiant(etablissementId, index) {
  const year = new Date().getFullYear();
  return `ET${year}${String(etablissementId).padStart(3, '0')}${String(index).padStart(4, '0')}`;
}

// Fonction pour générer un CIN
function genererCIN() {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

async function insertEtudiantsRectorat() {
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  Insertion d\'étudiants pour un rectorat                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // 1. Lister les rectorats disponibles
    console.log('📋 Rectorats disponibles:\n');
    const rectorats = await sequelize.query(
      `SELECT id_rectorat, nom_rectorat 
       FROM rectorat 
       ORDER BY nom_rectorat`,
      { type: sequelize.QueryTypes.SELECT }
    );

    if (rectorats.length === 0) {
      console.log('❌ Aucun rectorat trouvé dans la base de données.');
      rl.close();
      return;
    }

    rectorats.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.nom_rectorat} (ID: ${r.id_rectorat})`);
    });

    // 2. Demander quel rectorat
    console.log('');
    const choix = await question('Choisissez un rectorat (numéro) : ');
    const index = parseInt(choix) - 1;

    if (index < 0 || index >= rectorats.length) {
      console.log('❌ Choix invalide.');
      rl.close();
      return;
    }

    const rectoratChoisi = rectorats[index];
    console.log(`\n✅ Rectorat sélectionné: ${rectoratChoisi.nom_rectorat}\n`);

    // 3. Récupérer les établissements du rectorat
    const etablissements = await sequelize.query(
      `SELECT id_etablissement, nom_etablissement, type
       FROM etablissement
       WHERE id_rectorat = $1
       ORDER BY nom_etablissement`,
      { 
        bind: [rectoratChoisi.id_rectorat],
        type: sequelize.QueryTypes.SELECT 
      }
    );

    if (etablissements.length === 0) {
      console.log('❌ Aucun établissement trouvé pour ce rectorat.');
      rl.close();
      return;
    }

    console.log(`📊 ${etablissements.length} établissement(s) trouvé(s):\n`);
    etablissements.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.nom_etablissement}`);
    });

    // 4. Demander combien d'étudiants par établissement
    console.log('');
    const nbEtudiants = await question('Combien d\'étudiants par établissement ? (défaut: 50) : ');
    const nombreParEtablissement = parseInt(nbEtudiants) || 50;

    console.log(`\n🔄 Insertion de ${nombreParEtablissement} étudiants par établissement...\n`);

    // 5. Insérer les étudiants
    let totalInsere = 0;
    const motDePasseHash = await bcrypt.hash('password123', 10);

    for (const etablissement of etablissements) {
      console.log(`\n📝 Traitement: ${etablissement.nom_etablissement}`);
      
      // Vérifier combien d'étudiants existent déjà
      const existants = await sequelize.query(
        `SELECT COUNT(*) as count
         FROM etudiant
         WHERE id_etablissement = $1`,
        { 
          bind: [etablissement.id_etablissement],
          type: sequelize.QueryTypes.SELECT 
        }
      );

      const nbExistants = parseInt(existants[0].count);
      console.log(`   Étudiants existants: ${nbExistants}`);

      // Insérer les nouveaux étudiants
      for (let i = 0; i < nombreParEtablissement; i++) {
        const sexe = Math.random() > 0.5 ? 'HOMME' : 'FEMME';
        const { prenom, nom } = genererNomComplet(sexe);
        const email = genererEmail(prenom, nom, etablissement.nom_etablissement);
        const numeroEtudiant = genererNumeroEtudiant(etablissement.id_etablissement, nbExistants + i + 1);
        const cin = genererCIN();
        
        // Générer une date de naissance (18-25 ans)
        const age = 18 + Math.floor(Math.random() * 8);
        const dateNaissance = new Date();
        dateNaissance.setFullYear(dateNaissance.getFullYear() - age);
        dateNaissance.setMonth(Math.floor(Math.random() * 12));
        dateNaissance.setDate(Math.floor(Math.random() * 28) + 1);

        // Générer une date de création dans les 12 derniers mois
        const dateCreation = new Date();
        const monthsAgo = Math.floor(Math.random() * 12);
        dateCreation.setMonth(dateCreation.getMonth() - monthsAgo);
        dateCreation.setDate(Math.floor(Math.random() * 28) + 1);
        dateCreation.setHours(Math.floor(Math.random() * 24));
        dateCreation.setMinutes(Math.floor(Math.random() * 60));

        try {
          // Générer un numéro utilisateur unique
          const numeroUtilisateur = `U${Date.now()}${Math.floor(Math.random() * 1000)}`;

          // Insérer dans utilisateur
          await sequelize.query(
            `INSERT INTO utilisateur (numero_utilisateur, nom, prenom, email, mot_de_passe, sexe, statut, type_utilisateur, date_creation)
             VALUES ($1, $2, $3, $4, $5, $6, 'ACTIF', 'ETUDIANT', $7)`,
            {
              bind: [numeroUtilisateur, nom, prenom, email, motDePasseHash, sexe, dateCreation],
              type: sequelize.QueryTypes.INSERT
            }
          );

          // Insérer dans etudiant
          await sequelize.query(
            `INSERT INTO etudiant (numero_utilisateur, numero_etudiant, cin, date_naissance, id_etablissement)
             VALUES ($1, $2, $3, $4, $5)`,
            {
              bind: [numeroUtilisateur, numeroEtudiant, cin, dateNaissance, etablissement.id_etablissement],
              type: sequelize.QueryTypes.INSERT
            }
          );

          totalInsere++;
          
          // Afficher la progression
          if ((i + 1) % 10 === 0) {
            process.stdout.write(`   Progression: ${i + 1}/${nombreParEtablissement}\r`);
          }
        } catch (error) {
          console.error(`   ❌ Erreur pour ${prenom} ${nom}:`, error.message);
        }
      }
      
      console.log(`   ✅ ${nombreParEtablissement} étudiants insérés`);
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log(`║  ✅ Insertion terminée avec succès!                       ║`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`📊 Résumé:`);
    console.log(`   - Rectorat: ${rectoratChoisi.nom_rectorat}`);
    console.log(`   - Établissements traités: ${etablissements.length}`);
    console.log(`   - Étudiants insérés: ${totalInsere}`);
    console.log(`   - Mot de passe par défaut: password123\n`);

    console.log('💡 Prochaines étapes:');
    console.log('   1. Redémarrez le serveur backend si nécessaire');
    console.log('   2. Actualisez le dashboard recteur (Ctrl+F5)');
    console.log('   3. Les statistiques devraient maintenant s\'afficher\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion:', error);
    throw error;
  } finally {
    rl.close();
    await sequelize.close();
  }
}

// Exécuter le script
insertEtudiantsRectorat()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
