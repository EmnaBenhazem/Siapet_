const { sequelize } = require("../models");
const bcrypt = require("bcrypt");

// Générateur de matricule
function generateMatricule(annee, etablissement, numero) {
  return `${annee}${etablissement}${String(numero).padStart(4, '0')}`;
}

// Noms tunisiens
const prenomsMasculins = [
  'Mohamed', 'Ahmed', 'Ali', 'Mehdi', 'Youssef', 'Amine', 'Khalil', 'Hamza',
  'Omar', 'Aymen', 'Bilel', 'Firas', 'Karim', 'Malek', 'Nabil', 'Rami',
  'Sami', 'Tarek', 'Walid', 'Zied', 'Anis', 'Bassem', 'Chaker', 'Dhia'
];

const prenomsFeminins = [
  'Fatma', 'Amira', 'Ines', 'Mariem', 'Salma', 'Yasmine', 'Nour', 'Rahma',
  'Sarra', 'Wafa', 'Asma', 'Dorra', 'Emna', 'Hana', 'Jihen', 'Khadija',
  'Leila', 'Manel', 'Nesrine', 'Olfa', 'Rania', 'Sihem', 'Takwa', 'Zeineb'
];

const noms = [
  'Ben Ali', 'Trabelsi', 'Gharbi', 'Jebali', 'Khelifi', 'Mansouri', 'Nasri',
  'Oueslati', 'Riahi', 'Sassi', 'Touati', 'Zouari', 'Abidi', 'Bouzid',
  'Chaabane', 'Dridi', 'Essid', 'Ferjani', 'Ghanmi', 'Hamdi', 'Jlassi',
  'Karoui', 'Labidi', 'Maaloul', 'Nouri', 'Ouertani', 'Rezgui', 'Slimani'
];

const villes = [
  'Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Gabès', 'Ariana',
  'Gafsa', 'Monastir', 'Ben Arous', 'Kasserine', 'Médenine', 'Nabeul',
  'Tataouine', 'Béja', 'Jendouba', 'Mahdia', 'Siliana', 'Kébili', 'Zaghouan'
];

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function insertEtudiantsEPT() {
  try {
    console.log("=== INSERTION D'ÉTUDIANTS À L'EPT ===\n");

    // 1. Récupérer l'établissement
    const etab = await sequelize.query(
      `SELECT * FROM etablissement WHERE code_etablissement = 'EPT'`,
      { type: sequelize.QueryTypes.SELECT }
    );

    if (etab.length === 0) {
      console.log('❌ EPT non trouvé');
      return;
    }

    console.log('✅ Établissement:', etab[0].nom_etablissement);
    const idEtablissement = etab[0].id_etablissement;

    // 2. Récupérer les spécialités
    const specialites = await sequelize.query(
      `
      SELECT 
        s.id_specialite,
        s.nom_specialite,
        s.code_specialite,
        n.nom_niveau,
        d.nom_departement
      FROM specialite s
      INNER JOIN niveau n ON s.id_niveau = n.id_niveau
      INNER JOIN departement d ON n.id_departement = d.id_departement
      WHERE d.id_etablissement = $1
      `,
      { bind: [idEtablissement], type: sequelize.QueryTypes.SELECT }
    );

    console.log(`\n📚 ${specialites.length} spécialités trouvées:`);
    specialites.forEach(spec => {
      console.log(`   - ${spec.nom_specialite} (${spec.nom_departement})`);
    });

    // 3. Nombre d'étudiants à créer par spécialité
    const etudiantsParSpecialite = 25;
    const totalEtudiants = specialites.length * etudiantsParSpecialite;

    console.log(`\n🎯 Création de ${totalEtudiants} étudiants (${etudiantsParSpecialite} par spécialité)...\n`);

    // 4. Récupérer le dernier numéro utilisateur
    const lastUser = await sequelize.query(
      `SELECT numero_utilisateur FROM utilisateur 
       WHERE numero_utilisateur LIKE 'ETU-%' 
       ORDER BY numero_utilisateur DESC LIMIT 1`,
      { type: sequelize.QueryTypes.SELECT }
    );

    let userCounter = 1;
    if (lastUser.length > 0) {
      const lastNum = parseInt(lastUser[0].numero_utilisateur.split('-')[1]);
      userCounter = lastNum + 1;
    }

    // 5. Récupérer le dernier numero_etudiant
    const lastNumero = await sequelize.query(
      `SELECT numero_etudiant FROM etudiant 
       WHERE numero_etudiant IS NOT NULL 
       ORDER BY numero_etudiant DESC LIMIT 1`,
      { type: sequelize.QueryTypes.SELECT }
    );

    let numeroCounter = 1;
    if (lastNumero.length > 0 && lastNumero[0].numero_etudiant) {
      const lastNum = parseInt(lastNumero[0].numero_etudiant.slice(-4));
      numeroCounter = lastNum + 1;
    }

    const hashedPassword = await bcrypt.hash('password123', 10);
    let insertedCount = 0;

    // 6. Insérer les étudiants
    for (const spec of specialites) {
      console.log(`\n📝 Insertion pour ${spec.nom_specialite}...`);

      for (let i = 0; i < etudiantsParSpecialite; i++) {
        const isFemme = Math.random() > 0.5;
        const prenom = randomElement(isFemme ? prenomsFeminins : prenomsMasculins);
        const nom = randomElement(noms);
        const numeroUtilisateur = `ETU-${userCounter}`;
        const email = `${prenom.toLowerCase()}.${nom.toLowerCase().replace(' ', '')}${userCounter}@ept.tn`;
        const numeroEtudiant = generateMatricule('2024', 'EPT', numeroCounter);
        
        // Date de naissance (entre 18 et 25 ans)
        const dateNaissance = randomDate(
          new Date(1999, 0, 1),
          new Date(2006, 11, 31)
        );

        // Date d'inscription (entre septembre 2023 et septembre 2024)
        const dateInscription = randomDate(
          new Date(2023, 8, 1),
          new Date(2024, 8, 30)
        );

        try {
          // Insérer dans utilisateur
          await sequelize.query(
            `INSERT INTO utilisateur (
              numero_utilisateur, nom, prenom, email, mot_de_passe,
              sexe, telephone, statut, date_creation, type_utilisateur
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)`,
            {
              bind: [
                numeroUtilisateur,
                nom,
                prenom,
                email,
                hashedPassword,
                isFemme ? 'FEMME' : 'HOMME',
                `+216 ${20 + Math.floor(Math.random() * 80)} ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 900 + 100)}`,
                'ACTIF',
                'ETUDIANT'
              ],
              type: sequelize.QueryTypes.INSERT
            }
          );

          // Insérer dans etudiant
          await sequelize.query(
            `INSERT INTO etudiant (
              numero_utilisateur, numero_etudiant, id_etablissement, id_specialite,
              date_naissance, adresse
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            {
              bind: [
                numeroUtilisateur,
                numeroEtudiant,
                idEtablissement,
                spec.id_specialite,
                dateNaissance,
                `${Math.floor(Math.random() * 200 + 1)} Avenue ${randomElement(['Habib Bourguiba', 'de la Liberté', 'de la République'])}, ${randomElement(villes)}`
              ],
              type: sequelize.QueryTypes.INSERT
            }
          );

          insertedCount++;
          userCounter++;
          numeroCounter++;

          if (insertedCount % 10 === 0) {
            process.stdout.write(`   ${insertedCount}/${totalEtudiants} étudiants créés...\r`);
          }
        } catch (error) {
          console.error(`\n❌ Erreur pour ${prenom} ${nom}:`, error.message);
        }
      }
    }

    console.log(`\n\n✅ ${insertedCount} étudiants insérés avec succès!`);

    // 7. Vérification finale
    const verification = await sequelize.query(
      `SELECT 
        s.nom_specialite,
        COUNT(e.numero_utilisateur) as nombre_etudiants
       FROM specialite s
       INNER JOIN niveau n ON s.id_niveau = n.id_niveau
       INNER JOIN departement d ON n.id_departement = d.id_departement
       LEFT JOIN etudiant e ON s.id_specialite = e.id_specialite
       WHERE d.id_etablissement = $1
       GROUP BY s.id_specialite, s.nom_specialite
       ORDER BY s.nom_specialite`,
      { bind: [idEtablissement], type: sequelize.QueryTypes.SELECT }
    );

    console.log('\n📊 Répartition finale:');
    verification.forEach(v => {
      console.log(`   ${v.nom_specialite}: ${v.nombre_etudiants} étudiants`);
    });

    console.log('\n=== INSERTION TERMINÉE ===');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

insertEtudiantsEPT();
