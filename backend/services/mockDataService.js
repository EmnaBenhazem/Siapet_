const bcrypt = require("bcrypt");

// Hash du mot de passe "Test123!" (généré avec bcrypt)
const MOCK_PASSWORD_HASH = bcrypt.hashSync("Test123!", 10);

// Données mock pour les 5 acteurs
const mockUsers = [
  // 1. Administrateur MESRS
  {
    id: 1,
    nom: "Administrateur",
    prenom: "MESRS",
    email: "admin.test@mesrs.tn",
    mot_de_passe: MOCK_PASSWORD_HASH,
    telephone: "+216 71 000 001",
    sexe: "HOMME",
    status: "ACTIF",
    type_utilisateur: "ADMIN",
    ville_id: 1,
    date_creation: new Date("2024-01-01"),
    profil: {
      fonction: "Administrateur Système - Test",
      date_nomination: "2024-01-01",
      niveau_acces_securite: "NIVEAU_5",
    },
  },

  // 2. Recteur d'Université
  {
    id: 2,
    nom: "Ben Ahmed",
    prenom: "Mohamed",
    email: "recteur.test@ut.tn",
    mot_de_passe: MOCK_PASSWORD_HASH,
    telephone: "+216 71 000 002",
    sexe: "HOMME",
    status: "ACTIF",
    type_utilisateur: "RECTEUR",
    ville_id: 1,
    date_creation: new Date("2024-01-15"),
    profil: {
      numero_recteur: "REC-TEST-001",
      universite: {
        id: 263,
        nom: "Université de Tunis",
        code: "UT",
      },
    },
  },

  // 3. Directeur d'Établissement
  {
    id: 3,
    nom: "Trabelsi",
    prenom: "Fatma",
    email: "directeur.test@fshst.tn",
    mot_de_passe: MOCK_PASSWORD_HASH,
    telephone: "+216 71 000 003",
    sexe: "FEMME",
    status: "ACTIF",
    type_utilisateur: "DIRECTEUR",
    ville_id: 1,
    date_creation: new Date("2024-02-01"),
    profil: {
      numero_directeur: "DIR-TEST-001",
      etablissement: {
        id: 1,
        nom: "Faculté des Sciences Humaines et Sociales de Tunis",
        code: "FSHST",
      },
    },
  },

  // 4. Enseignant
  {
    id: 4,
    nom: "Mansouri",
    prenom: "Karim",
    email: "enseignant.test@fshst.tn",
    mot_de_passe: MOCK_PASSWORD_HASH,
    telephone: "+216 98 000 004",
    sexe: "HOMME",
    status: "ACTIF",
    type_utilisateur: "ENSEIGNANT",
    ville_id: 1,
    date_creation: new Date("2015-09-01"),
    profil: {
      numero_enseignant: "ENS-TEST-001",
      cin: "12345678",
      grade: "Maître de Conférences",
      annees_experience: 9,
    },
  },

  // 5. Étudiant
  {
    id: 5,
    nom: "Gharbi",
    prenom: "Amira",
    email: "etudiant.test@fshst.tn",
    mot_de_passe: MOCK_PASSWORD_HASH,
    telephone: "+216 20 000 005",
    sexe: "FEMME",
    status: "ACTIF",
    type_utilisateur: "ETUDIANT",
    ville_id: 1,
    date_creation: new Date("2022-09-15"),
    profil: {
      numero_etudiant: "ETU-TEST-001",
      cin: "87654321",
      date_naissance: "2003-05-15",
      niveau: "LICENCE",
      classe: "TROISIEME",
    },
  },
];

// Service de mock data
const mockDataService = {
  // Authentification
  async login(email, password) {
    console.log("🎭 MODE MOCK: Tentative de connexion avec", email);

    const user = mockUsers.find((u) => u.email === email);

    if (!user) {
      console.log("❌ MODE MOCK: Utilisateur non trouvé");
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.mot_de_passe);

    if (!isPasswordValid) {
      console.log("❌ MODE MOCK: Mot de passe incorrect");
      return null;
    }

    console.log("✅ MODE MOCK: Connexion réussie pour", user.type_utilisateur);

    // Retourner l'utilisateur sans le mot de passe
    const { mot_de_passe, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  // Récupérer un utilisateur par email
  async getUserByEmail(email) {
    const user = mockUsers.find((u) => u.email === email);
    if (user) {
      const { mot_de_passe, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  },

  // Récupérer un utilisateur par ID
  async getUserById(id) {
    const user = mockUsers.find((u) => u.id === parseInt(id));
    if (user) {
      const { mot_de_passe, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  },

  // Vérifier si un email existe
  async emailExists(email) {
    return mockUsers.some((u) => u.email === email);
  },

  // Lister tous les utilisateurs (pour admin)
  async getAllUsers() {
    return mockUsers.map((user) => {
      const { mot_de_passe, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  },
};

module.exports = mockDataService;
