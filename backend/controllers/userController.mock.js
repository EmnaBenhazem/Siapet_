const crypto = require("crypto");

// Mock users database
let mockUsers = [
  {
    numero_utilisateur: "550e8400-e29b-41d4-a716-446655440000",
    email: "admin@siapet.tn",
    nom: "Admin",
    prenom: "SIAPET",
    telephone: "21612345678",
    sexe: "M",
    type_utilisateur: "ADMIN_MESRS",
    statut: "ACTIF",
    date_creation: new Date("2024-01-15"),
    derniere_connexion: new Date("2024-03-05"),
  },
  {
    numero_utilisateur: "550e8400-e29b-41d4-a716-446655440001",
    email: "directeur@siapet.tn",
    nom: "Ben Ali",
    prenom: "Mohamed",
    telephone: "21698765432",
    sexe: "M",
    type_utilisateur: "DIRECTEUR",
    statut: "ACTIF",
    date_creation: new Date("2024-02-10"),
    derniere_connexion: new Date("2024-03-04"),
  },
  {
    numero_utilisateur: "550e8400-e29b-41d4-a716-446655440002",
    email: "enseignant@siapet.tn",
    nom: "Trabelsi",
    prenom: "Fatma",
    telephone: "21655443322",
    sexe: "F",
    type_utilisateur: "ENSEIGNANT",
    statut: "ACTIF",
    date_creation: new Date("2024-02-20"),
    derniere_connexion: new Date("2024-03-03"),
  },
  {
    numero_utilisateur: "550e8400-e29b-41d4-a716-446655440003",
    email: "etudiant@siapet.tn",
    nom: "Gharbi",
    prenom: "Ahmed",
    telephone: "21622334455",
    sexe: "M",
    type_utilisateur: "ETUDIANT",
    statut: "ACTIF",
    date_creation: new Date("2024-03-01"),
    derniere_connexion: new Date("2024-03-05"),
    etudiant_matricule: "ETU2024001",
    etudiant_filiere: "Informatique",
  },
  {
    numero_utilisateur: "550e8400-e29b-41d4-a716-446655440004",
    email: "recteur@siapet.tn",
    nom: "Mansour",
    prenom: "Karim",
    telephone: "21677889900",
    sexe: "M",
    type_utilisateur: "RECTEUR",
    statut: "ACTIF",
    date_creation: new Date("2024-01-20"),
    derniere_connexion: new Date("2024-03-04"),
  },
  {
    numero_utilisateur: "550e8400-e29b-41d4-a716-446655440005",
    email: "suspendu@siapet.tn",
    nom: "Bouazizi",
    prenom: "Sami",
    telephone: "21633221100",
    sexe: "M",
    type_utilisateur: "ETUDIANT",
    statut: "SUSPENDU",
    date_creation: new Date("2024-02-15"),
    derniere_connexion: new Date("2024-02-28"),
  },
];

// Créer un utilisateur (générique)
exports.createUser = async (req, res) => {
  try {
    const {
      type_utilisateur,
      email,
      nom,
      prenom,
      telephone,
      id_etablissement,
      id_rectorat,
    } = req.body;

    const existing = mockUsers.find((u) => u.email === email);
    if (existing) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const tempPassword = crypto.randomBytes(8).toString("hex");

    const user = {
      numero_utilisateur: crypto.randomUUID(),
      email,
      nom,
      prenom,
      telephone,
      sexe: "M",
      type_utilisateur,
      statut: "ACTIF",
      date_creation: new Date(),
      derniere_connexion: null,
    };

    if (type_utilisateur === "DIRECTEUR" && id_etablissement) {
      user.id_etablissement = id_etablissement;
    }

    if (type_utilisateur === "RECTEUR" && id_rectorat) {
      user.id_rectorat = id_rectorat;
    }

    mockUsers.push(user);

    res.status(201).json({
      message: `Compte ${type_utilisateur.toLowerCase()} créé avec succès (Mock)`,
      user,
      tempPassword,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// M2-US01: Créer un compte Admin
exports.createAdmin = async (req, res) => {
  try {
    const { email, nom, prenom, telephone } = req.body;

    const existing = mockUsers.find((u) => u.email === email);
    if (existing) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const tempPassword = crypto.randomBytes(8).toString("hex");

    const user = {
      numero_utilisateur: crypto.randomUUID(),
      email,
      nom,
      prenom,
      telephone,
      sexe: "M",
      type_utilisateur: "ADMIN_MESRS",
      statut: "ACTIF",
      date_creation: new Date(),
      derniere_connexion: null,
    };

    mockUsers.push(user);

    res.status(201).json({
      message: "Compte administrateur créé (Mock)",
      user,
      tempPassword,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// M2-US04: Créer un compte Directeur
exports.createDirecteur = async (req, res) => {
  try {
    const { email, nom, prenom, telephone, id_etablissement } = req.body;

    const existing = mockUsers.find((u) => u.email === email);
    if (existing) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const tempPassword = crypto.randomBytes(8).toString("hex");

    const user = {
      numero_utilisateur: crypto.randomUUID(),
      email,
      nom,
      prenom,
      telephone,
      sexe: "M",
      type_utilisateur: "DIRECTEUR",
      statut: "ACTIF",
      id_etablissement,
      date_creation: new Date(),
      derniere_connexion: null,
    };

    mockUsers.push(user);

    res.status(201).json({
      message: "Compte directeur créé (Mock)",
      user,
      tempPassword,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Récupérer tous les utilisateurs avec filtres
exports.getAllUsers = async (req, res) => {
  try {
    const { role, statut, search, page = 1, limit = 10 } = req.query;

    let filtered = [...mockUsers];

    // Filtre par rôle
    if (role) {
      filtered = filtered.filter((u) => u.type_utilisateur === role);
    }

    // Filtre par statut
    if (statut) {
      filtered = filtered.filter((u) => u.statut === statut);
    }

    // Filtre par recherche
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.nom.toLowerCase().includes(searchLower) ||
          u.prenom.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower),
      );
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginated = filtered.slice(start, end);

    res.json({
      users: paginated,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Récupérer les options de filtrage
exports.getFilterOptions = async (req, res) => {
  try {
    const roles = [
      { value: "ADMIN_MESRS", label: "Administrateur MESRS" },
      { value: "RECTEUR", label: "Recteur" },
      { value: "DIRECTEUR", label: "Directeur" },
      { value: "ENSEIGNANT", label: "Enseignant" },
      { value: "ETUDIANT", label: "Étudiant" },
    ];

    const statuts = [
      { value: "ACTIF", label: "Actif" },
      { value: "INACTIF", label: "Inactif" },
      { value: "SUSPENDU", label: "Suspendu" },
    ];

    res.json({
      roles,
      statuts,
      regions: [],
      villes: [],
      universites: [],
      etablissements: [],
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Statistiques des utilisateurs
exports.getUserStats = async (req, res) => {
  try {
    const stats = {};
    mockUsers.forEach((user) => {
      if (!stats[user.type_utilisateur]) {
        stats[user.type_utilisateur] = {
          type_utilisateur: user.type_utilisateur,
          count: 0,
          actifs: 0,
          inactifs: 0,
          suspendus: 0,
        };
      }
      stats[user.type_utilisateur].count++;
      if (user.statut === "ACTIF") stats[user.type_utilisateur].actifs++;
      if (user.statut === "INACTIF") stats[user.type_utilisateur].inactifs++;
      if (user.statut === "SUSPENDU") stats[user.type_utilisateur].suspendus++;
    });

    res.json({
      total: mockUsers.length,
      byRole: Object.values(stats),
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// M2-US04: Consulter les utilisateurs
exports.getUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;

    let filtered = mockUsers;
    if (role) {
      filtered = mockUsers.filter((u) => u.type_utilisateur === role);
    }

    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginated = filtered.slice(start, end);

    res.json({
      users: paginated,
      total: filtered.length,
      page: parseInt(page),
      totalPages: Math.ceil(filtered.length / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// M2-US02: Modifier un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, nom, prenom, telephone } = req.body;

    const userIndex = mockUsers.findIndex((u) => u.numero_utilisateur === id);
    if (userIndex === -1) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    if (email && email !== mockUsers[userIndex].email) {
      const existing = mockUsers.find((u) => u.email === email);
      if (existing) {
        return res.status(400).json({ message: "Email déjà utilisé" });
      }
    }

    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      email: email || mockUsers[userIndex].email,
      nom: nom || mockUsers[userIndex].nom,
      prenom: prenom || mockUsers[userIndex].prenom,
      telephone: telephone || mockUsers[userIndex].telephone,
    };

    res.json({
      message: "Utilisateur modifié (Mock)",
      user: mockUsers[userIndex],
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// M2-US05: Activer/Désactiver un utilisateur
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const userIndex = mockUsers.findIndex((u) => u.numero_utilisateur === id);
    if (userIndex === -1) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    mockUsers[userIndex].statut =
      mockUsers[userIndex].statut === "ACTIF" ? "SUSPENDU" : "ACTIF";

    res.json({
      message: `Utilisateur ${mockUsers[userIndex].statut === "ACTIF" ? "activé" : "suspendu"} (Mock)`,
      user: mockUsers[userIndex],
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Archiver un utilisateur
exports.archiveUser = async (req, res) => {
  try {
    const { id } = req.params;

    const userIndex = mockUsers.findIndex((u) => u.numero_utilisateur === id);
    if (userIndex === -1) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    mockUsers[userIndex].statut = "INACTIF";

    res.json({
      message: `Utilisateur ${mockUsers[userIndex].nom} ${mockUsers[userIndex].prenom} archivé avec succès (Mock)`,
      user: mockUsers[userIndex],
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Récupérer les utilisateurs archivés
exports.getArchivedUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;

    let filtered = mockUsers.filter((u) => u.statut === "INACTIF");

    if (role) {
      filtered = filtered.filter((u) => u.type_utilisateur === role);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.nom.toLowerCase().includes(searchLower) ||
          u.prenom.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower),
      );
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginated = filtered.slice(start, end);

    res.json({
      users: paginated,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Restaurer un utilisateur archivé
exports.restoreUser = async (req, res) => {
  try {
    const { id } = req.params;

    const userIndex = mockUsers.findIndex((u) => u.numero_utilisateur === id);
    if (userIndex === -1) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    mockUsers[userIndex].statut = "ACTIF";

    res.json({
      message: `Utilisateur ${mockUsers[userIndex].nom} ${mockUsers[userIndex].prenom} restauré avec succès (Mock)`,
      user: mockUsers[userIndex],
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
