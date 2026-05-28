const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

// GET /api/ml/historique?id_etudiant=&id_specialite=
// Retourne l'historique complet (semestres + matières) d'un ou tous les étudiants
exports.getHistorique = async (req, res) => {
  try {
    const { id_etudiant, id_specialite } = req.query;

    let bindParams = [];
    let whereClauses = [];

    if (id_etudiant) {
      bindParams.push(id_etudiant);
      whereClauses.push(`ha.numero_utilisateur = $${bindParams.length}`);
    }
    if (id_specialite) {
      bindParams.push(parseInt(id_specialite));
      whereClauses.push(`ha.id_specialite = $${bindParams.length}`);
    }

    const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const semestres = await sequelize.query(
      `SELECT
         ha.numero_utilisateur,
         u.nom, u.prenom,
         sp.nom_specialite,
         ha.id_specialite,
         ha.niveau,
         ha.annee_academique,
         ha.semestre,
         ha.moyenne,
         ha.nb_absences,
         ha.nb_absences_justifiees,
         ha.nb_matieres_total,
         ha.nb_matieres_validees,
         ha.taux_reussite,
         ha.credits_valides,
         ha.rang,
         ha.mention,
         ha.statut
       FROM historique_academique ha
       JOIN utilisateur u  ON u.numero_utilisateur = ha.numero_utilisateur
       JOIN specialite  sp ON sp.id_specialite      = ha.id_specialite
       ${whereSQL}
       ORDER BY ha.numero_utilisateur, ha.semestre`,
      { bind: bindParams, type: QueryTypes.SELECT }
    );

    // Fetch matching matière notes
    let matieresBind = [...bindParams];
    const matieresWhere = whereClauses.length > 0
      ? 'WHERE ' + whereClauses.map(c => c.replace('ha.', 'hn.')).join(' AND ')
      : '';

    const matieres = await sequelize.query(
      `SELECT
         hn.numero_utilisateur,
         hn.nom_matiere,
         hn.annee_academique,
         hn.semestre,
         hn.coefficient,
         hn.note_ds,
         hn.note_tp,
         hn.note_examen,
         hn.note_finale,
         hn.nb_absences_matiere,
         hn.valide
       FROM historique_notes_matiere hn
       ${matieresWhere}
       ORDER BY hn.numero_utilisateur, hn.semestre, hn.nom_matiere`,
      { bind: matieresBind, type: QueryTypes.SELECT }
    );

    // Group matieres by etudiant + semestre
    const matiereMap = {};
    for (const m of matieres) {
      const key = `${m.numero_utilisateur}|${m.semestre}`;
      if (!matiereMap[key]) matiereMap[key] = [];
      matiereMap[key].push(m);
    }

    // Merge into semester rows
    const result = semestres.map(s => ({
      ...s,
      matieres: matiereMap[`${s.numero_utilisateur}|${s.semestre}`] || [],
    }));

    res.json({ success: true, count: result.length, data: result });
  } catch (error) {
    console.error('Erreur getHistorique:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// GET /api/ml/dataset?id_specialite=
// Retourne un dataset "flat" — une ligne par étudiant avec toutes les features ML
// Colonnes : id_etudiant, nom, prenom, specialite,
//            L1_S1_moy, L1_S1_abs, L1_S1_taux, L1_S1_credits, L1_S1_rang,
//            L1_S2_moy, ... L3_S6_moy, ...
//            label_mention_L3 (cible de prédiction)
exports.getDataset = async (req, res) => {
  try {
    const { id_specialite } = req.query;

    let bind = [];
    let whereClause = '';
    if (id_specialite) {
      bind.push(parseInt(id_specialite));
      whereClause = `WHERE ha.id_specialite = $1`;
    }

    const rows = await sequelize.query(
      `SELECT
         ha.numero_utilisateur,
         u.nom, u.prenom,
         sp.nom_specialite,
         ha.id_specialite,
         ha.niveau,
         ha.semestre,
         ha.moyenne,
         ha.nb_absences,
         ha.nb_absences_justifiees,
         ha.taux_reussite,
         ha.credits_valides,
         ha.rang,
         ha.mention,
         ha.statut
       FROM historique_academique ha
       JOIN utilisateur u  ON u.numero_utilisateur = ha.numero_utilisateur
       JOIN specialite  sp ON sp.id_specialite      = ha.id_specialite
       ${whereClause}
       ORDER BY ha.numero_utilisateur, ha.semestre`,
      { bind, type: QueryTypes.SELECT }
    );

    // Pivot: one row per student with S1-S6 features as columns
    const studentMap = {};
    for (const r of rows) {
      if (!studentMap[r.numero_utilisateur]) {
        studentMap[r.numero_utilisateur] = {
          id_etudiant:  r.numero_utilisateur,
          nom:          r.nom,
          prenom:       r.prenom,
          specialite:   r.nom_specialite,
          id_specialite: r.id_specialite,
        };
      }
      const s = r.semestre;
      const prefix = `S${s}`;
      studentMap[r.numero_utilisateur][`${prefix}_moy`]        = r.moyenne !== null ? parseFloat(r.moyenne) : null;
      studentMap[r.numero_utilisateur][`${prefix}_absences`]   = r.nb_absences;
      studentMap[r.numero_utilisateur][`${prefix}_abs_just`]   = r.nb_absences_justifiees;
      studentMap[r.numero_utilisateur][`${prefix}_taux_reuss`] = r.taux_reussite !== null ? parseFloat(r.taux_reussite) : null;
      studentMap[r.numero_utilisateur][`${prefix}_credits`]    = r.credits_valides !== null ? parseFloat(r.credits_valides) : null;
      studentMap[r.numero_utilisateur][`${prefix}_rang`]       = r.rang;
      studentMap[r.numero_utilisateur][`${prefix}_statut`]     = r.statut;
    }

    // Add aggregate features and ML label
    const dataset = Object.values(studentMap).map(stu => {
      // L1 aggregate
      const moysL1 = [stu.S1_moy, stu.S2_moy].filter(v => v !== null && v !== undefined);
      const moysL2 = [stu.S3_moy, stu.S4_moy].filter(v => v !== null && v !== undefined);
      const moysL3 = [stu.S5_moy, stu.S6_moy].filter(v => v !== null && v !== undefined);
      const avg = arr => arr.length > 0 ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : null;

      const absL1 = (stu.S1_absences || 0) + (stu.S2_absences || 0);
      const absL2 = (stu.S3_absences || 0) + (stu.S4_absences || 0);
      const absL3 = (stu.S5_absences || 0) + (stu.S6_absences || 0);

      const creditsTotal = [stu.S1_credits, stu.S2_credits, stu.S3_credits, stu.S4_credits, stu.S5_credits, stu.S6_credits]
        .filter(v => v !== null && v !== undefined)
        .reduce((a, b) => a + b, 0);

      // Label : mention finale L3 (S5 or S6 si disponible, sinon S5)
      const moyL3Final = avg(moysL3);
      let label_mention = null;
      if (moyL3Final !== null) {
        if (moyL3Final >= 16)      label_mention = 'Tres Bien';
        else if (moyL3Final >= 14) label_mention = 'Bien';
        else if (moyL3Final >= 12) label_mention = 'Assez Bien';
        else if (moyL3Final >= 10) label_mention = 'Passable';
        else                       label_mention = 'Insuffisant';
      }

      return {
        ...stu,
        // Aggregated features per year
        L1_moy_annuelle:   avg(moysL1),
        L1_absences_total: absL1,
        L2_moy_annuelle:   avg(moysL2),
        L2_absences_total: absL2,
        L3_moy_annuelle:   avg(moysL3),
        L3_absences_total: absL3,
        credits_total:     parseFloat(creditsTotal.toFixed(1)),
        // Trend features
        progression_L1_L2: avg(moysL1) !== null && avg(moysL2) !== null
          ? parseFloat((avg(moysL2) - avg(moysL1)).toFixed(2)) : null,
        progression_L2_L3: avg(moysL2) !== null && avg(moysL3) !== null
          ? parseFloat((avg(moysL3) - avg(moysL2)).toFixed(2)) : null,
        // ML label (target variable)
        label_mention,
        label_admis: moyL3Final !== null ? (moyL3Final >= 10 ? 1 : 0) : null,
      };
    });

    res.json({
      success: true,
      count: dataset.length,
      colonnes: [
        'id_etudiant','nom','prenom','specialite',
        'S1_moy','S1_absences','S1_abs_just','S1_taux_reuss','S1_credits','S1_rang','S1_statut',
        'S2_moy','S2_absences','S2_abs_just','S2_taux_reuss','S2_credits','S2_rang','S2_statut',
        'S3_moy','S3_absences','S3_abs_just','S3_taux_reuss','S3_credits','S3_rang','S3_statut',
        'S4_moy','S4_absences','S4_abs_just','S4_taux_reuss','S4_credits','S4_rang','S4_statut',
        'S5_moy','S5_absences','S5_abs_just','S5_taux_reuss','S5_credits','S5_rang','S5_statut',
        'S6_moy','S6_absences','S6_abs_just','S6_taux_reuss','S6_credits','S6_rang','S6_statut',
        'L1_moy_annuelle','L1_absences_total',
        'L2_moy_annuelle','L2_absences_total',
        'L3_moy_annuelle','L3_absences_total',
        'credits_total','progression_L1_L2','progression_L2_L3',
        'label_mention','label_admis',
      ],
      data: dataset,
    });
  } catch (error) {
    console.error('Erreur getDataset:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// GET /api/ml/etudiant/:id — profil complet d'un étudiant (pour prédiction individuelle)
exports.getEtudiantProfil = async (req, res) => {
  try {
    const { id } = req.params;

    const [semestres, matieres, absences] = await Promise.all([
      sequelize.query(
        `SELECT ha.*, u.nom, u.prenom, sp.nom_specialite
         FROM historique_academique ha
         JOIN utilisateur u  ON u.numero_utilisateur = ha.numero_utilisateur
         JOIN specialite  sp ON sp.id_specialite = ha.id_specialite
         WHERE ha.numero_utilisateur = $1
         ORDER BY ha.semestre`,
        { bind: [id], type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT * FROM historique_notes_matiere
         WHERE numero_utilisateur = $1 ORDER BY semestre, nom_matiere`,
        { bind: [id], type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT date_absence, type_seance, semestre, justifiee,
                (enseignant_id IS NULL) AS declaree_par_etudiant
         FROM absence WHERE numero_utilisateur = $1
         ORDER BY date_absence DESC`,
        { bind: [id], type: QueryTypes.SELECT }
      ),
    ]);

    if (!semestres.length) {
      return res.status(404).json({ success: false, message: 'Étudiant non trouvé' });
    }

    // Group matieres by semestre
    const matieresBySem = {};
    for (const m of matieres) {
      if (!matieresBySem[m.semestre]) matieresBySem[m.semestre] = [];
      matieresBySem[m.semestre].push(m);
    }

    const profil = semestres.map(s => ({
      ...s,
      matieres: matieresBySem[s.semestre] || [],
    }));

    res.json({
      success: true,
      etudiant: {
        id,
        nom:        semestres[0].nom,
        prenom:     semestres[0].prenom,
        specialite: semestres[0].nom_specialite,
      },
      historique: profil,
      absences_recentes: absences,
    });
  } catch (error) {
    console.error('Erreur getEtudiantProfil:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};
