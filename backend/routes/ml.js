const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const { getHistorique, getDataset, getEtudiantProfil } = require('../controllers/mlController');

router.use(authenticateToken);

// Accessible à tous les rôles authentifiés (enseignant, directeur, admin)
router.get('/historique',       getHistorique);
router.get('/dataset',          getDataset);
router.get('/etudiant/:id',     getEtudiantProfil);

module.exports = router;
