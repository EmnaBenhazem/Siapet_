const express = require("express");
const router = express.Router();

// Switch between mock and real controller
const USE_DATABASE = process.env.USE_DATABASE === "true";
const userController = USE_DATABASE
  ? require("../controllers/userController")
  : require("../controllers/userController.mock");

const recteurUserController = require("../controllers/recteurUserController");
const directeurUserController = require("../controllers/directeurUserController");

const { authenticate, isAdmin, isRecteur, isDirecteur } = require("../middleware/auth");

// Routes pour la gestion des utilisateurs
router.get("/", authenticate, isAdmin, userController.getAllUsers);

router.post("/", authenticate, isAdmin, userController.createUser);

router.get(
  "/filter-options",
  authenticate,
  isAdmin,
  userController.getFilterOptions,
);

router.get("/stats", authenticate, isAdmin, userController.getUserStats);

router.post("/admin", authenticate, isAdmin, userController.createAdmin);

router.post(
  "/directeur",
  authenticate,
  isAdmin,
  userController.createDirecteur,
);

router.put("/:id", authenticate, isAdmin, userController.updateUser);

router.patch(
  "/:id/toggle-status",
  authenticate,
  isAdmin,
  userController.toggleUserStatus,
);

router.patch("/:id/archive", authenticate, isAdmin, userController.archiveUser);

router.get("/archived", authenticate, isAdmin, userController.getArchivedUsers);

router.patch("/:id/restore", authenticate, isAdmin, userController.restoreUser);

router.get("/:id/archive-log", authenticate, isAdmin, userController.getUserArchiveLog);

// Routes pour le recteur
router.get("/recteur", authenticate, isRecteur, recteurUserController.getRecteurUsers);

router.get(
  "/recteur/filter-options",
  authenticate,
  isRecteur,
  recteurUserController.getRecteurFilterOptions,
);

router.get(
  "/recteur/stats",
  authenticate,
  isRecteur,
  recteurUserController.getRecteurUserStats,
);

// Routes pour le directeur
router.get("/directeur", authenticate, isDirecteur, directeurUserController.getDirecteurUsers);

router.get(
  "/directeur/filter-options",
  authenticate,
  isDirecteur,
  directeurUserController.getDirecteurFilterOptions,
);

router.get(
  "/directeur/stats",
  authenticate,
  isDirecteur,
  directeurUserController.getDirecteurUserStats,
);

module.exports = router;
