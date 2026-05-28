const jwt = require("jsonwebtoken");

exports.authenticateToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalide" });
  }
};

exports.authenticate = exports.authenticateToken; // Alias pour compatibilité

exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log("🔍 authorize middleware - Rôles autorisés:", roles);
    console.log("🔍 authorize middleware - Rôle utilisateur:", req.user.role);
    console.log("🔍 authorize middleware - User complet:", req.user);

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Accès refusé",
        userRole: req.user.role,
        requiredRoles: roles,
      });
    }
    next();
  };
};

// Middleware pour vérifier si l'utilisateur est admin
exports.isAdmin = (req, res, next) => {
  console.log("🔍 isAdmin middleware - User role:", req.user.role);
  console.log("🔍 isAdmin middleware - Full user:", req.user);

  // Accepter ADMIN_MESRS ou ADMIN
  if (req.user.role !== "ADMIN_MESRS" && req.user.role !== "ADMIN") {
    return res.status(403).json({
      message:
        "Accès refusé. Seuls les administrateurs peuvent effectuer cette action.",
      userRole: req.user.role, // Pour debug
    });
  }
  next();
};

// Alias pour requireAdmin
exports.requireAdmin = exports.isAdmin;

// Middleware pour vérifier si l'utilisateur est recteur
exports.isRecteur = (req, res, next) => {
  console.log("🔍 isRecteur middleware - User role:", req.user.role);
  console.log("🔍 isRecteur middleware - Full user:", req.user);

  if (req.user.role !== "RECTEUR") {
    return res.status(403).json({
      message:
        "Accès refusé. Seuls les recteurs peuvent effectuer cette action.",
      userRole: req.user.role,
    });
  }
  next();
};

// Middleware pour vérifier si l'utilisateur est directeur
exports.isDirecteur = (req, res, next) => {
  console.log("🔍 isDirecteur middleware - User role:", req.user.role);
  console.log("🔍 isDirecteur middleware - Full user:", req.user);

  if (req.user.role !== "DIRECTEUR") {
    return res.status(403).json({
      message:
        "Accès refusé. Seuls les directeurs peuvent effectuer cette action.",
      userRole: req.user.role,
    });
  }
  next();
};
