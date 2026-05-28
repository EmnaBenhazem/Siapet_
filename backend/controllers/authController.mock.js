const jwt = require("jsonwebtoken");

// Mock users database
const mockUsers = [
  {
    id_utilisateur: "550e8400-e29b-41d4-a716-446655440000",
    email: "admin@siapet.tn",
    password: "admin123", // Plain text for demo
    nom: "Admin",
    prenom: "SIAPET",
    role: "administrateur",
    actif: true,
    tentatives_connexion: 0,
  },
  {
    id_utilisateur: "550e8400-e29b-41d4-a716-446655440001",
    email: "directeur@siapet.tn",
    password: "directeur123",
    nom: "Directeur",
    prenom: "Test",
    role: "directeur",
    actif: true,
    tentatives_connexion: 0,
  },
];

// M1-US01: Connexion
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = mockUsers.find((u) => u.email === email);

    if (!user) {
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    if (user.tentatives_connexion >= 5) {
      return res.status(403).json({
        message:
          "Compte bloqué après 5 tentatives. Contactez l'administrateur.",
      });
    }

    if (!user.actif) {
      return res.status(403).json({ message: "Compte désactivé" });
    }

    if (password !== user.password) {
      user.tentatives_connexion += 1;
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    user.tentatives_connexion = 0;
    user.date_derniere_connexion = new Date();

    // Générer JWT
    const token = jwt.sign(
      {
        id: user.id_utilisateur,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    res.json({
      message: "Connexion réussie (Mode Mock)",
      token,
      user: {
        id: user.id_utilisateur,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// M1-US02: Déconnexion
exports.logout = async (req, res) => {
  res.json({ message: "Déconnexion réussie" });
};
