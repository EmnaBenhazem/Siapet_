const { sequelize } = require('../models');
const bcrypt = require('bcrypt');

/**
 * Script pour insérer des étudiants dans le rectorat ID 2 (Université de Tunis El Manar)
 * avec des données complètes (spécialités, adresses, villes, etc.)
 */

// Données réalistes
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
  'Dridi', 'Ferjani', 'Guesmi', 'Haddad', 'Jlassi', 'Khelifi', 'Labidi', 'Maaloul'
];

const rues = [
  'Rue de Carthage', 'Avenue de la Liberté', 'Rue Ibn Khaldoun', 'Cité Universitaire',
  'Rue des Orangers', 'Cité El Khadra', 'Route de Soukra', 'Rue Abou El Kacem Chebbi',
  'Cité Riadh', 'Rue Hedi Chaker', 'Avenue de Tunis', 'Avenue Ibn Sina',
  'Rue de Monastir', 'Zone Techno', 'Rue du Sahel', 'Boulevard 7 Novembre',
  'Rue de la République', 'Avenue Habib Bourguiba', 'Cité Ennasr', 'Rue de Palestine'
];

function genererNomComplet(sexe) {
  const prenoms = sexe === 'HOMME' ? prenomsMasculins : prenomsFeminins;
  const prenom = prenoms[Math.floor(Math.random() * prenoms.length)];
  const nom = noms[Math.floor(Math.random() * noms.length)];
  return { prenom, nom };
}

function genererEmail(prenom, nom, domaine) {
  const prenomClean = prenom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s/g, '');
  const nomClean = nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s/g, '').replace(/\'/g, '');
  return `${prenomClean}.${nomClean}@${domaine}`;
}

function genererAdresse(ville) {
  const numero = Math.floor(Math.random() * 100) + 1;
  const rue = rues[Math.floor(Math.random() * rues.length)];
  return `${numero} ${rue}, ${ville}`;
}

function genererCodePostal(villeId) {
  const codes = {
    1: ['1000', '1001', '1002', '1003', '1004', '1005', '1006'], // Tunis
    2: ['3000', '3001', '3002', '3003', '3004'], // Sfax
    3: ['4000', '4001', '4002', '4003'], // Sousse
    4: ['2000', '2001', '2002'], // Ariana
    5: ['1100', '1101', '1102'], // Manouba
  };
  const codesVille = codes[villeId] || ['1000'];
  return codesVille[Math.floor(Math.random() * codesVille.length)];
}

function genererCIN() {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

function genererMoyenne() {
  return (10 + Math.random() * 10).toFixed(2);
}

function genererDateNaissance() {
  const age = 18 + Math.floor(Math.random() * 8);
  const date = new Date();
  date.setFullYear(date.getFullYear() - age);
  date.setMonth(Math.floor(Math.random() * 12));
  date.setDate(Math.floor(Math.random() * 28) + 1);
  return date;
}

function genererDateCreation() {
  const date = new Date();
  const monthsAgo = Math.floor(Math.random() * 12);
  date.setMonth(date.getMonth() - monthsAgo);
  date.setDate(Math.floor(Math.random() * 28) + 1);
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

async function insertEtudiantsRectorat2() {
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  Insertion d\'étudiants - Rectorat ID 2                   ║');
    console.log('║  Université de Tunis El Manar                             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const ID_RECTORAT = 2;
    const NOMBRE_ETUDIANTS_PAR_ETABLISSEMENT = 50;

    // 1. Récupérer les établissements du rectorat 2
    console.log('📋 Récupération des établissements...\n');
    const etablissements = await sequelize.query(
      `SELECT e.id_etablissement, e.nom_etablissement, e.type, e.id_ville, v.nom_ville
       FROM etablissement e
       LEFT JOIN ville v ON e.id_ville = v.id_ville
       WHERE e.id_rectorat = $1
       ORDER BY e.nom_etablissement`,
      { 
        bind: [ID_RECTORAT],
        type: sequelize.QueryTypes.SELECT 
      }
    );

    if (etablissements.length === 0) {
      console.log('❌ Aucun établissement trouvé pour le rectorat ID 2.');
      return;
    }

    console.log(`✅ ${etablissements.length} établissement(s) trouvé(s):\n`);
    etablissements.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.nom_etablissement} (${e.nom_ville || 'Ville non définie'})`);
    });

    // 2. Pour chaque établissement, récupérer les spécialités
    console.log('\n📚 Récupération des spécialités...\n');
    
    const motDePasseHash = await bcrypt.hash('password123', 10);
    let totalInsere = 0;

    for (const etablissement of etablissements) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📝 Traitement: ${etablissement.nom_etablissement}`);
      console.log('='.repeat(70));

      // Récupérer les spécialités de cet établissement
      const specialites = await sequelize.query(
        `SELECT s.id_specialite, s.nom_specialite, s.diplome
         FROM specialite s
         JOIN niveau n ON s.id_niveau = n.id_niveau
         JOIN departement d ON n.id_departement = d.id_departement
         WHERE d.id_etablissement = $1
         LIMIT 10`,
        { 
          bind: [etablissement.id_etablissement],
          type: sequelize.QueryTypes.SELECT 
        }
      );

      if (specialites.length === 0) {
        console.log('   ⚠️  Aucune spécialité trouvée, insertion sans spécialité...');
      } else {
        console.log(`   ✅ ${specialites.length} spécialité(s) disponible(s)`);
      }

      // Vérifier combien d'étudiants existent déjà
      const existants = await sequelize.query(
        `SELECT COUNT(*) as count FROM etudiant WHERE id_etablissement = $1`,
        { 
          bind: [etablissement.id_etablissement],
          type: sequelize.QueryTypes.SELECT 
        }
      );

      const nbExistants = parseInt(existants[0].count);
      console.log(`   📊 Étudiants existants: ${nbExistants}`);
      console.log(`   🔄 Insertion de ${NOMBRE_ETUDIANTS_PAR_ETABLISSEMENT} nouveaux étudiants...\n`);

      // Insérer les étudiants
      for (let i = 0; i < NOMBRE_ETUDIANTS_PAR_ETABLISSEMENT; i++) {
        const sexe = Math.random() > 0.5 ? 'HOMME' : 'FEMME';
        const { prenom, nom } = genererNomComplet(sexe);
        
        // Générer un domaine email basé sur l'établissement
        const domaine = etablissement.nom_etablissement
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .substring(0, 15) + '.tn';
        
        const email = genererEmail(prenom, nom, domaine);
        const numeroEtudiant = `ET${new Date().getFullYear()}${String(etablissement.id_etablissement).padStart(3, '0')}${String(nbExistants + i + 1).padStart(4, '0')}`;
        const cin = genererCIN();
        const dateNaissance = genererDateNaissance();
        const dateCreation = genererDateCreation();
        const moyenne = genererMoyenne();
        
        // Ville et adresse
        const idVille = etablissement.id_ville || 1;
        const nomVille = etablissement.nom_ville || 'Tunis';
        const adresse = genererAdresse(nomVille);
        const codePostal = genererCodePostal(idVille);
        
        // Spécialité aléatoire si disponible
        const idSpecialite = specialites.length > 0 
          ? specialites[Math.floor(Math.random() * specialites.length)].id_specialite 
          : null;

        try {
          // Générer un numéro utilisateur unique
          const numeroUtilisateur = `U${Date.now()}${Math.floor(Math.random() * 10000)}`;

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
            `INSERT INTO etudiant (numero_utilisateur, numero_etudiant, cin, date_naissance, adresse, code_postal, moyenne_generale, id_ville, id_etablissement, id_specialite)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            {
              bind: [
                numeroUtilisateur, 
                numeroEtudiant, 
                cin, 
                dateNaissance, 
                adresse, 
                codePostal, 
                moyenne, 
                idVille, 
                etablissement.id_etablissement, 
                idSpecialite
              ],
              type: sequelize.QueryTypes.INSERT
            }
          );

          totalInsere++;
          
          // Afficher la progression
          if ((i + 1) % 10 === 0) {
            process.stdout.write(`   Progression: ${i + 1}/${NOMBRE_ETUDIANTS_PAR_ETABLISSEMENT}\r`);
          }
        } catch (error) {
          if (error.message.includes('duplicate key')) {
            // Ignorer les doublons et continuer
            continue;
          }
          console.error(`   ❌ Erreur pour ${prenom} ${nom}:`, error.message);
        }
      }
      
      console.log(`   ✅ ${NOMBRE_ETUDIANTS_PAR_ETABLISSEMENT} étudiants insérés`);
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ Insertion terminée avec succès!                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('📊 Résumé:');
    console.log(`   - Rectorat: Université de Tunis El Manar (ID: 2)`);
    console.log(`   - Établissements traités: ${etablissements.length}`);
    console.log(`   - Étudiants insérés: ${totalInsere}`);
    console.log(`   - Mot de passe par défaut: password123\n`);

    console.log('💡 Prochaines étapes:');
    console.log('   1. Redémarrez le serveur backend si nécessaire');
    console.log('   2. Connectez-vous avec un recteur du rectorat ID 2');
    console.log('   3. Actualisez le dashboard recteur (Ctrl+F5)');
    console.log('   4. Les statistiques devraient maintenant s\'afficher\n');

    // Afficher quelques exemples d'étudiants créés
    console.log('📋 Exemples d\'étudiants créés:');
    const exemples = await sequelize.query(
      `SELECT u.nom, u.prenom, u.email, et.numero_etudiant, e.nom_etablissement
       FROM utilisateur u
       JOIN etudiant et ON u.numero_utilisateur = et.numero_utilisateur
       JOIN etablissement e ON et.id_etablissement = e.id_etablissement
       WHERE e.id_rectorat = $1
       ORDER BY u.date_creation DESC
       LIMIT 5`,
      { 
        bind: [ID_RECTORAT],
        type: sequelize.QueryTypes.SELECT 
      }
    );

    exemples.forEach((ex, i) => {
      console.log(`   ${i + 1}. ${ex.prenom} ${ex.nom} (${ex.numero_etudiant})`);
      console.log(`      Email: ${ex.email}`);
      console.log(`      Établissement: ${ex.nom_etablissement}\n`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
insertEtudiantsRectorat2()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
