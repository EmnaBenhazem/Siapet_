const express = require('express');
const axios   = require('axios');
const router  = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { sequelize } = require('../models');

const ML_API = process.env.ML_API_URL || 'http://localhost:5001';

router.use(authenticateToken);

// M1 — Taux de réussite d'un établissement
router.post('/reussite', async (req, res) => {
  try {
    const r = await axios.post(`${ML_API}/predict/reussite`, req.body, { timeout: 10000 });
    res.json(r.data);
  } catch (err) {
    const detail = err.response?.data?.detail || err.message;
    res.status(502).json({ error: 'ML API indisponible', details: detail });
  }
});

// M2 — Détection d'un étudiant à risque
router.post('/risque', async (req, res) => {
  try {
    const r = await axios.post(`${ML_API}/predict/risque`, req.body, { timeout: 10000 });
    res.json(r.data);
  } catch (err) {
    const detail = err.response?.data?.detail || err.message;
    res.status(502).json({ error: 'ML API indisponible', details: detail });
  }
});

// M3 — Performance future d'un étudiant
router.post('/performance', async (req, res) => {
  try {
    const r = await axios.post(`${ML_API}/predict/performance`, req.body, { timeout: 10000 });
    res.json(r.data);
  } catch (err) {
    const detail = err.response?.data?.detail || err.message;
    res.status(502).json({ error: 'ML API indisponible', details: detail });
  }
});

// Données ML pour un établissement donné — endpoint partagé (admin / recteur / directeur)
// Utilise les mêmes requêtes SQL que le directeur pour garantir la cohérence des prédictions
router.get('/etablissement-data/:id', async (req, res) => {
  try {
    const idEtablissement = parseInt(req.params.id, 10);
    if (isNaN(idEtablissement)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const [etabStats] = await sequelize.query(
      `SELECT
         COUNT(DISTINCT et.numero_utilisateur)::float
           / NULLIF(COUNT(DISTINCT ens.numero_utilisateur), 0) AS ratio_etud_ens,
         e.type AS type_etablissement
       FROM etablissement e
       LEFT JOIN etudiant   et  ON et.id_etablissement           = e.id_etablissement
       LEFT JOIN enseignant ens ON ens.id_etablissement_principal = e.id_etablissement
       WHERE e.id_etablissement = $1
       GROUP BY e.type`,
      { bind: [idEtablissement], type: sequelize.QueryTypes.SELECT }
    );

    const reussiteData = await sequelize.query(
      `SELECT
         ha.annee_academique,
         ROUND(AVG(ha.taux_reussite)::numeric, 2)                                    AS avg_taux_reussite,
         ROUND(LEAST(100, AVG(ha.nb_absences::float
               / NULLIF(ha.nb_matieres_total, 0) * 100))::numeric, 2)               AS avg_absence
       FROM historique_academique ha
       JOIN etudiant et ON et.numero_utilisateur = ha.numero_utilisateur
       WHERE et.id_etablissement = $1
       GROUP BY ha.annee_academique
       ORDER BY ha.annee_academique DESC
       LIMIT 2`,
      { bind: [idEtablissement], type: sequelize.QueryTypes.SELECT }
    );

    const [etudiantStats] = await sequelize.query(
      `WITH sem_ranked AS (
         SELECT
           ha.numero_utilisateur,
           ha.moyenne,
           ha.nb_absences,
           ha.nb_matieres_total,
           ha.nb_matieres_validees,
           ha.niveau,
           ROW_NUMBER() OVER (
             PARTITION BY ha.numero_utilisateur
             ORDER BY ha.annee_academique DESC, ha.semestre DESC
           ) AS rn
         FROM historique_academique ha
         JOIN etudiant et ON et.numero_utilisateur = ha.numero_utilisateur
         WHERE et.id_etablissement = $1
       )
       SELECT
         ROUND(AVG(CASE WHEN rn = 1 THEN moyenne          END)::numeric, 2) AS moy_actuelle,
         ROUND(AVG(CASE WHEN rn = 2 THEN moyenne          END)::numeric, 2) AS moy_prec,
         ROUND(LEAST(100, AVG(CASE WHEN rn = 1 AND nb_matieres_total > 0
               THEN nb_absences::float / nb_matieres_total * 100 END))::numeric, 2) AS taux_absence,
         ROUND(AVG(CASE WHEN rn = 1
               THEN (nb_matieres_total - nb_matieres_validees) END)::numeric, 1)    AS matieres_echec,
         ROUND(AVG(CASE WHEN rn = 1 AND nb_matieres_total > 0
               THEN nb_matieres_validees::float / nb_matieres_total END)::numeric, 3) AS ratio_notes,
         MODE() WITHIN GROUP (ORDER BY CASE WHEN rn = 1 THEN niveau END)            AS niveau_dominant
       FROM sem_ranked`,
      { bind: [idEtablissement], type: sequelize.QueryTypes.SELECT }
    );

    const yr1  = reussiteData[0] || {};
    const yr2  = reussiteData[1] || {};
    const etu  = etudiantStats   || {};
    const etab = etabStats       || {};

    const moyAct  = Math.max(0, Math.min(20,  parseFloat(etu.moy_actuelle)  || 12));
    const moyPrec = Math.max(0, Math.min(20,  parseFloat(etu.moy_prec)      || 11));
    const absence = Math.max(0, Math.min(100, parseFloat(etu.taux_absence)  || 10));
    const ratio   = Math.max(0, Math.min(1,   parseFloat(etu.ratio_notes)   || 0.85));
    const matEch  = Math.max(0, Math.round(parseFloat(etu.matieres_echec)   || 2));
    const niveau  = etu.niveau_dominant || 'L2';
    const pente   = Math.round((moyAct - moyPrec) * 10) / 10;

    const cc1 = Math.round(Math.max(0, Math.min(20, moyAct - 0.5)) * 10) / 10;
    const cc2 = Math.round(Math.max(0, Math.min(20, moyAct))       * 10) / 10;
    const cc3 = Math.round(Math.max(0, Math.min(20, moyAct + 0.5)) * 10) / 10;

    res.json({
      success: true,
      m1: {
        taux_reussite_an1:  parseFloat(yr1.avg_taux_reussite) || 75,
        taux_reussite_an2:  parseFloat(yr2.avg_taux_reussite) || 72,
        taux_absence_moyen: Math.max(0, Math.min(100, parseFloat(yr1.avg_absence) || 10)),
        ratio_etud_ens:     Math.max(1, Math.round(parseFloat(etab.ratio_etud_ens) || 25)),
        budget_par_etud: 4500, nb_labos: 8, taux_rotation_ens: 8,
        region: 'Tunis', type_etablissement: etab.type_etablissement || 'ISET',
      },
      m2: {
        moy_semestre_prec: moyPrec, note_cc1: cc1, note_cc2: cc2, note_cc3: cc3,
        taux_absence: absence, nb_echecs_anterieurs: matEch, evolution_notes: pente,
        participation: 6, niveau, filiere: 'Informatique',
      },
      m3: {
        moy_semestre_prec: moyPrec, note_cc1: cc1, note_cc2: cc2, note_cc3: cc3,
        taux_absence_actuel: absence, pente_evolution: pente,
        nb_matieres_sous_10: matEch, ratio_notes_obtenues: ratio,
        niveau, filiere: 'Informatique',
      },
    });
  } catch (error) {
    console.error('Erreur etablissement-data ML:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// Statut de l'API ML
router.get('/status', async (req, res) => {
  try {
    const r = await axios.get(`${ML_API}/`, { timeout: 5000 });
    res.json({ online: true, ...r.data });
  } catch {
    res.json({ online: false, message: 'FastAPI ML non démarrée' });
  }
});

module.exports = router;
