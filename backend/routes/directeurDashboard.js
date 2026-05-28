const express = require('express');
const router = express.Router();
const directeurDashboardController = require('../controllers/directeurDashboardController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Toutes les routes nécessitent l'authentification et le rôle DIRECTEUR
router.use(authenticateToken);
router.use(authorize('DIRECTEUR'));

// Routes du dashboard directeur
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Directeur dashboard route is working',
    user: req.user
  });
});
router.get('/stats', directeurDashboardController.getDashboardStats);
router.get('/etudiants-par-departement', directeurDashboardController.getEtudiantsParDepartement);
router.get('/evolution-inscriptions', directeurDashboardController.getEvolutionInscriptions);
router.get('/repartition-niveaux', directeurDashboardController.getRepartitionNiveaux);
router.get('/departements', directeurDashboardController.getDepartements);
router.get('/comparaison-departements', directeurDashboardController.getComparaisonDepartements);
router.get('/ml-data', directeurDashboardController.getMLData);

module.exports = router;
