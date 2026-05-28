const { sequelize } = require("../models");

// Returns the data scope for the current user
async function getScope(req) {
  const { role, numero_utilisateur } = req.user;
  if (role === 'RECTEUR') {
    const rows = await sequelize.query(
      `SELECT id_rectorat FROM recteur_universite WHERE numero_utilisateur = :num`,
      { replacements: { num: numero_utilisateur }, type: sequelize.QueryTypes.SELECT }
    );
    return { type: 'rectorat', id: rows[0]?.id_rectorat ?? null };
  }
  if (role === 'DIRECTEUR') {
    const rows = await sequelize.query(
      `SELECT id_etablissement FROM directeur_etablissement WHERE numero_utilisateur = :num`,
      { replacements: { num: numero_utilisateur }, type: sequelize.QueryTypes.SELECT }
    );
    return { type: 'etablissement', id: rows[0]?.id_etablissement ?? null };
  }
  return { type: 'all', id: null };
}

exports.getNationalStats = async (req, res) => {
  try {
    let scope = await getScope(req);

    // ADMIN_MESRS peut filtrer via query params
    if (scope.type === 'all') {
      const { etablissement_id, rectorat_id } = req.query;
      if (etablissement_id) scope = { type: 'etablissement', id: parseInt(etablissement_id) };
      else if (rectorat_id) scope = { type: 'rectorat', id: parseInt(rectorat_id) };
    }

    const repl = scope.id ? { scopeId: scope.id } : {};

    // 1. Global counts
    let globalCountsSQL;
    if (scope.type === 'rectorat') {
      globalCountsSQL = `SELECT
        (SELECT COUNT(*) FROM etudiant et JOIN etablissement e ON et.id_etablissement = e.id_etablissement WHERE e.id_rectorat = :scopeId) AS total_etudiants,
        (SELECT COUNT(*) FROM enseignant en JOIN etablissement e ON en.id_etablissement_principal = e.id_etablissement WHERE e.id_rectorat = :scopeId) AS total_enseignants,
        (SELECT COUNT(*) FROM etablissement WHERE archive=false AND id_rectorat = :scopeId) AS total_etablissements,
        (SELECT COUNT(*) FROM departement d JOIN etablissement e ON d.id_etablissement = e.id_etablissement WHERE e.id_rectorat = :scopeId) AS total_departements,
        (SELECT COUNT(DISTINCT et.id_specialite) FROM etudiant et JOIN etablissement e ON et.id_etablissement = e.id_etablissement WHERE e.id_rectorat = :scopeId) AS total_specialites,
        (SELECT ROUND(AVG(et.moyenne_generale)::numeric,2) FROM etudiant et JOIN etablissement e ON et.id_etablissement = e.id_etablissement WHERE et.moyenne_generale IS NOT NULL AND e.id_rectorat = :scopeId) AS moyenne_nationale,
        (SELECT COUNT(*) FROM etudiant et JOIN etablissement e ON et.id_etablissement = e.id_etablissement WHERE et.moyenne_generale < 10 AND e.id_rectorat = :scopeId) AS nb_risque,
        (SELECT COUNT(*) FROM etudiant et JOIN etablissement e ON et.id_etablissement = e.id_etablissement WHERE et.moyenne_generale < 7  AND e.id_rectorat = :scopeId) AS nb_critique`;
    } else if (scope.type === 'etablissement') {
      globalCountsSQL = `SELECT
        (SELECT COUNT(*) FROM etudiant WHERE id_etablissement = :scopeId) AS total_etudiants,
        (SELECT COUNT(*) FROM enseignant WHERE id_etablissement_principal = :scopeId) AS total_enseignants,
        (SELECT COUNT(*) FROM etablissement WHERE archive=false AND id_etablissement = :scopeId) AS total_etablissements,
        (SELECT COUNT(*) FROM departement WHERE id_etablissement = :scopeId) AS total_departements,
        (SELECT COUNT(DISTINCT id_specialite) FROM etudiant WHERE id_etablissement = :scopeId) AS total_specialites,
        (SELECT ROUND(AVG(moyenne_generale)::numeric,2) FROM etudiant WHERE moyenne_generale IS NOT NULL AND id_etablissement = :scopeId) AS moyenne_nationale,
        (SELECT COUNT(*) FROM etudiant WHERE moyenne_generale < 10 AND id_etablissement = :scopeId) AS nb_risque,
        (SELECT COUNT(*) FROM etudiant WHERE moyenne_generale < 7  AND id_etablissement = :scopeId) AS nb_critique`;
    } else {
      globalCountsSQL = `SELECT
        (SELECT COUNT(*) FROM etudiant)                         AS total_etudiants,
        (SELECT COUNT(*) FROM enseignant)                       AS total_enseignants,
        (SELECT COUNT(*) FROM etablissement WHERE archive=false) AS total_etablissements,
        (SELECT COUNT(*) FROM departement)                      AS total_departements,
        (SELECT COUNT(*) FROM specialite)                       AS total_specialites,
        (SELECT ROUND(AVG(moyenne_generale)::numeric,2)
           FROM etudiant WHERE moyenne_generale IS NOT NULL)    AS moyenne_nationale,
        (SELECT COUNT(*) FROM etudiant WHERE moyenne_generale < 10) AS nb_risque,
        (SELECT COUNT(*) FROM etudiant WHERE moyenne_generale < 7)  AS nb_critique`;
    }
    const [globalCounts] = await sequelize.query(globalCountsSQL, { replacements: repl, type: sequelize.QueryTypes.SELECT });

    // 2. Grade distribution
    let gradeDistSQL;
    if (scope.type === 'rectorat') {
      gradeDistSQL = `SELECT
        SUM(CASE WHEN et.moyenne_generale < 7 THEN 1 ELSE 0 END) AS critique,
        SUM(CASE WHEN et.moyenne_generale >= 7  AND et.moyenne_generale < 10 THEN 1 ELSE 0 END) AS attention,
        SUM(CASE WHEN et.moyenne_generale >= 10 AND et.moyenne_generale < 12 THEN 1 ELSE 0 END) AS passable,
        SUM(CASE WHEN et.moyenne_generale >= 12 AND et.moyenne_generale < 14 THEN 1 ELSE 0 END) AS assez_bien,
        SUM(CASE WHEN et.moyenne_generale >= 14 AND et.moyenne_generale < 16 THEN 1 ELSE 0 END) AS bien,
        SUM(CASE WHEN et.moyenne_generale >= 16 THEN 1 ELSE 0 END) AS tres_bien
       FROM etudiant et
       JOIN etablissement e ON et.id_etablissement = e.id_etablissement
       WHERE et.moyenne_generale IS NOT NULL AND e.id_rectorat = :scopeId`;
    } else if (scope.type === 'etablissement') {
      gradeDistSQL = `SELECT
        SUM(CASE WHEN moyenne_generale < 7 THEN 1 ELSE 0 END) AS critique,
        SUM(CASE WHEN moyenne_generale >= 7  AND moyenne_generale < 10 THEN 1 ELSE 0 END) AS attention,
        SUM(CASE WHEN moyenne_generale >= 10 AND moyenne_generale < 12 THEN 1 ELSE 0 END) AS passable,
        SUM(CASE WHEN moyenne_generale >= 12 AND moyenne_generale < 14 THEN 1 ELSE 0 END) AS assez_bien,
        SUM(CASE WHEN moyenne_generale >= 14 AND moyenne_generale < 16 THEN 1 ELSE 0 END) AS bien,
        SUM(CASE WHEN moyenne_generale >= 16 THEN 1 ELSE 0 END) AS tres_bien
       FROM etudiant WHERE moyenne_generale IS NOT NULL AND id_etablissement = :scopeId`;
    } else {
      gradeDistSQL = `SELECT
        SUM(CASE WHEN moyenne_generale < 7                        THEN 1 ELSE 0 END) AS critique,
        SUM(CASE WHEN moyenne_generale >= 7  AND moyenne_generale < 10 THEN 1 ELSE 0 END) AS attention,
        SUM(CASE WHEN moyenne_generale >= 10 AND moyenne_generale < 12 THEN 1 ELSE 0 END) AS passable,
        SUM(CASE WHEN moyenne_generale >= 12 AND moyenne_generale < 14 THEN 1 ELSE 0 END) AS assez_bien,
        SUM(CASE WHEN moyenne_generale >= 14 AND moyenne_generale < 16 THEN 1 ELSE 0 END) AS bien,
        SUM(CASE WHEN moyenne_generale >= 16                           THEN 1 ELSE 0 END) AS tres_bien
       FROM etudiant WHERE moyenne_generale IS NOT NULL`;
    }
    const gradeDist = await sequelize.query(gradeDistSQL, { replacements: repl, type: sequelize.QueryTypes.SELECT });

    // 3. Semester progression
    let semProgSQL;
    if (scope.type === 'rectorat') {
      semProgSQL = `SELECT ha.niveau, ha.semestre,
        ROUND(AVG(ha.moyenne)::numeric, 2)       AS moy_avg,
        ROUND(AVG(ha.taux_reussite)::numeric, 2) AS taux_avg,
        ROUND(AVG(ha.nb_absences)::numeric, 1)   AS abs_avg
       FROM historique_academique ha
       JOIN etudiant et ON ha.numero_utilisateur = et.numero_utilisateur
       JOIN etablissement e ON et.id_etablissement = e.id_etablissement
       WHERE e.id_rectorat = :scopeId
       GROUP BY ha.niveau, ha.semestre
       ORDER BY CASE ha.niveau WHEN 'L1' THEN 1 WHEN 'L2' THEN 2 WHEN 'L3' THEN 3 WHEN 'M1' THEN 4 WHEN 'M2' THEN 5 ELSE 6 END, ha.semestre`;
    } else if (scope.type === 'etablissement') {
      semProgSQL = `SELECT ha.niveau, ha.semestre,
        ROUND(AVG(ha.moyenne)::numeric, 2)       AS moy_avg,
        ROUND(AVG(ha.taux_reussite)::numeric, 2) AS taux_avg,
        ROUND(AVG(ha.nb_absences)::numeric, 1)   AS abs_avg
       FROM historique_academique ha
       JOIN etudiant et ON ha.numero_utilisateur = et.numero_utilisateur
       WHERE et.id_etablissement = :scopeId
       GROUP BY ha.niveau, ha.semestre
       ORDER BY CASE ha.niveau WHEN 'L1' THEN 1 WHEN 'L2' THEN 2 WHEN 'L3' THEN 3 WHEN 'M1' THEN 4 WHEN 'M2' THEN 5 ELSE 6 END, ha.semestre`;
    } else {
      semProgSQL = `SELECT niveau, semestre,
        ROUND(AVG(moyenne)::numeric, 2)       AS moy_avg,
        ROUND(AVG(taux_reussite)::numeric, 2) AS taux_avg,
        ROUND(AVG(nb_absences)::numeric, 1)   AS abs_avg
       FROM historique_academique
       GROUP BY niveau, semestre
       ORDER BY
         CASE niveau
           WHEN 'L1' THEN 1 WHEN 'L2' THEN 2 WHEN 'L3' THEN 3
           WHEN 'M1' THEN 4 WHEN 'M2' THEN 5 ELSE 6 END,
         semestre`;
    }
    const semesterProgression = await sequelize.query(semProgSQL, { replacements: repl, type: sequelize.QueryTypes.SELECT });

    // 4. Risk by establishment type
    const riskByTypeWhere = scope.type === 'rectorat'
      ? 'e.archive = false AND et.moyenne_generale IS NOT NULL AND e.id_rectorat = :scopeId'
      : scope.type === 'etablissement'
        ? 'e.archive = false AND et.moyenne_generale IS NOT NULL AND e.id_etablissement = :scopeId'
        : 'e.archive = false AND et.moyenne_generale IS NOT NULL';
    const riskByType = await sequelize.query(
      `SELECT e.type,
         COUNT(DISTINCT et.numero_utilisateur)                         AS total,
         SUM(CASE WHEN et.moyenne_generale < 10 THEN 1 ELSE 0 END)    AS a_risque,
         SUM(CASE WHEN et.moyenne_generale < 7  THEN 1 ELSE 0 END)    AS critique,
         ROUND(AVG(et.moyenne_generale)::numeric, 2)                   AS moy
       FROM etablissement e
       JOIN etudiant et ON e.id_etablissement = et.id_etablissement
       WHERE ${riskByTypeWhere}
       GROUP BY e.type
       ORDER BY total DESC`,
      { replacements: repl, type: sequelize.QueryTypes.SELECT }
    );

    // 5. Top 10 at-risk establishments
    const topRiskWhere = scope.type === 'rectorat'
      ? 'e.archive = false AND et.moyenne_generale IS NOT NULL AND e.id_rectorat = :scopeId'
      : scope.type === 'etablissement'
        ? 'e.archive = false AND et.moyenne_generale IS NOT NULL AND e.id_etablissement = :scopeId'
        : 'e.archive = false AND et.moyenne_generale IS NOT NULL';
    const topRiskHaving = scope.type === 'etablissement' ? '' : 'HAVING COUNT(et.numero_utilisateur) >= 50';
    const topRisk = await sequelize.query(
      `SELECT e.nom_etablissement, e.type,
         v.nom_ville,
         COUNT(et.numero_utilisateur)                                  AS total,
         SUM(CASE WHEN et.moyenne_generale < 10 THEN 1 ELSE 0 END)    AS a_risque,
         ROUND(100.0*SUM(CASE WHEN et.moyenne_generale < 10 THEN 1 ELSE 0 END)
               / NULLIF(COUNT(et.numero_utilisateur),0), 1)            AS pct_risque,
         ROUND(AVG(et.moyenne_generale)::numeric, 2)                   AS moy
       FROM etablissement e
       JOIN ville v ON e.id_ville = v.id_ville
       JOIN etudiant et ON e.id_etablissement = et.id_etablissement
       WHERE ${topRiskWhere}
       GROUP BY e.id_etablissement, e.nom_etablissement, e.type, v.nom_ville
       ${topRiskHaving}
       ORDER BY pct_risque DESC
       LIMIT 10`,
      { replacements: repl, type: sequelize.QueryTypes.SELECT }
    );

    // 6. Mention distribution
    let mentionSQL;
    if (scope.type === 'rectorat') {
      mentionSQL = `SELECT ha.mention, COUNT(*) AS nb
       FROM historique_academique ha
       JOIN etudiant et ON ha.numero_utilisateur = et.numero_utilisateur
       JOIN etablissement e ON et.id_etablissement = e.id_etablissement
       WHERE ha.semestre = 6 AND ha.niveau = 'L3'
         AND ha.mention IS NOT NULL AND ha.mention != '' AND e.id_rectorat = :scopeId
       GROUP BY ha.mention ORDER BY nb DESC`;
    } else if (scope.type === 'etablissement') {
      mentionSQL = `SELECT ha.mention, COUNT(*) AS nb
       FROM historique_academique ha
       JOIN etudiant et ON ha.numero_utilisateur = et.numero_utilisateur
       WHERE ha.semestre = 6 AND ha.niveau = 'L3'
         AND ha.mention IS NOT NULL AND ha.mention != '' AND et.id_etablissement = :scopeId
       GROUP BY ha.mention ORDER BY nb DESC`;
    } else {
      mentionSQL = `SELECT mention, COUNT(*) AS nb
       FROM historique_academique
       WHERE semestre = 6 AND niveau = 'L3'
         AND mention IS NOT NULL AND mention != ''
       GROUP BY mention ORDER BY nb DESC`;
    }
    const mentionDist = await sequelize.query(mentionSQL, { replacements: repl, type: sequelize.QueryTypes.SELECT });

    // 7. Regional comparison
    const regionWhere = scope.type === 'rectorat'
      ? 'et.moyenne_generale IS NOT NULL AND e.id_rectorat = :scopeId'
      : scope.type === 'etablissement'
        ? 'et.moyenne_generale IS NOT NULL AND e.id_etablissement = :scopeId'
        : 'et.moyenne_generale IS NOT NULL';
    const regionData = await sequelize.query(
      `SELECT r.nom_region,
         COUNT(DISTINCT et.numero_utilisateur)                          AS total_etudiants,
         ROUND(AVG(et.moyenne_generale)::numeric, 2)                    AS moy,
         SUM(CASE WHEN et.moyenne_generale < 10 THEN 1 ELSE 0 END)     AS a_risque,
         COUNT(DISTINCT e.id_etablissement)                             AS nb_etabs
       FROM region r
       JOIN ville v ON r.id_region = v.id_region
       JOIN etablissement e ON v.id_ville = e.id_ville AND e.archive = false
       JOIN etudiant et ON e.id_etablissement = et.id_etablissement
       WHERE ${regionWhere}
       GROUP BY r.id_region, r.nom_region
       ORDER BY total_etudiants DESC`,
      { replacements: repl, type: sequelize.QueryTypes.SELECT }
    );

    // 8. Performance by speciality
    const specJoin = scope.type === 'rectorat'
      ? 'JOIN etablissement e ON et.id_etablissement = e.id_etablissement'
      : '';
    const specWhere = scope.type === 'rectorat'
      ? 'et.moyenne_generale IS NOT NULL AND e.id_rectorat = :scopeId'
      : scope.type === 'etablissement'
        ? 'et.moyenne_generale IS NOT NULL AND et.id_etablissement = :scopeId'
        : 'et.moyenne_generale IS NOT NULL';
    const specHaving = scope.type === 'etablissement' ? '' : 'HAVING COUNT(et.numero_utilisateur) >= 30';

    const topSpecs = await sequelize.query(
      `SELECT s.nom_specialite,
         COUNT(et.numero_utilisateur) AS effectif,
         ROUND(AVG(et.moyenne_generale)::numeric, 2) AS moy
       FROM specialite s
       JOIN etudiant et ON s.id_specialite = et.id_specialite
       ${specJoin}
       WHERE ${specWhere}
       GROUP BY s.id_specialite, s.nom_specialite
       ${specHaving}
       ORDER BY moy DESC
       LIMIT 8`,
      { replacements: repl, type: sequelize.QueryTypes.SELECT }
    );

    const bottomSpecs = await sequelize.query(
      `SELECT s.nom_specialite,
         COUNT(et.numero_utilisateur) AS effectif,
         ROUND(AVG(et.moyenne_generale)::numeric, 2) AS moy
       FROM specialite s
       JOIN etudiant et ON s.id_specialite = et.id_specialite
       ${specJoin}
       WHERE ${specWhere}
       GROUP BY s.id_specialite, s.nom_specialite
       ${specHaving}
       ORDER BY moy ASC
       LIMIT 8`,
      { replacements: repl, type: sequelize.QueryTypes.SELECT }
    );

    // 9. Absence impact
    let absenceSQL;
    if (scope.type === 'rectorat') {
      absenceSQL = `SELECT
        CASE
          WHEN ha.nb_absences = 0               THEN '0 absences'
          WHEN ha.nb_absences BETWEEN 1 AND 5   THEN '1-5 absences'
          WHEN ha.nb_absences BETWEEN 6 AND 10  THEN '6-10 absences'
          WHEN ha.nb_absences BETWEEN 11 AND 20 THEN '11-20 absences'
          ELSE '20+ absences'
        END AS tranche,
        ROUND(AVG(ha.moyenne)::numeric, 2) AS moy_avg,
        COUNT(*) AS nb_records
       FROM historique_academique ha
       JOIN etudiant et ON ha.numero_utilisateur = et.numero_utilisateur
       JOIN etablissement e ON et.id_etablissement = e.id_etablissement
       WHERE e.id_rectorat = :scopeId
       GROUP BY tranche ORDER BY moy_avg DESC`;
    } else if (scope.type === 'etablissement') {
      absenceSQL = `SELECT
        CASE
          WHEN ha.nb_absences = 0               THEN '0 absences'
          WHEN ha.nb_absences BETWEEN 1 AND 5   THEN '1-5 absences'
          WHEN ha.nb_absences BETWEEN 6 AND 10  THEN '6-10 absences'
          WHEN ha.nb_absences BETWEEN 11 AND 20 THEN '11-20 absences'
          ELSE '20+ absences'
        END AS tranche,
        ROUND(AVG(ha.moyenne)::numeric, 2) AS moy_avg,
        COUNT(*) AS nb_records
       FROM historique_academique ha
       JOIN etudiant et ON ha.numero_utilisateur = et.numero_utilisateur
       WHERE et.id_etablissement = :scopeId
       GROUP BY tranche ORDER BY moy_avg DESC`;
    } else {
      absenceSQL = `SELECT
        CASE
          WHEN nb_absences = 0               THEN '0 absences'
          WHEN nb_absences BETWEEN 1 AND 5   THEN '1-5 absences'
          WHEN nb_absences BETWEEN 6 AND 10  THEN '6-10 absences'
          WHEN nb_absences BETWEEN 11 AND 20 THEN '11-20 absences'
          ELSE '20+ absences'
        END AS tranche,
        ROUND(AVG(moyenne)::numeric, 2) AS moy_avg,
        COUNT(*) AS nb_records
       FROM historique_academique
       GROUP BY tranche ORDER BY moy_avg DESC`;
    }
    const absenceImpact = await sequelize.query(absenceSQL, { replacements: repl, type: sequelize.QueryTypes.SELECT });

    res.json({
      success: true,
      scope: scope.type,
      data: {
        globalCounts: globalCounts[0] || globalCounts,
        gradeDist: gradeDist[0] || gradeDist,
        semesterProgression,
        riskByType,
        topRisk,
        mentionDist,
        regionData,
        topSpecs,
        bottomSpecs,
        absenceImpact,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ success: false, message: "Erreur analytics", error: error.message });
  }
};

// ── Filtres disponibles pour les rapports ─────────────────────────────────
exports.getFiltresRapport = async (req, res) => {
  try {
    const scope = await getScope(req);
    const repl = scope.id ? { scopeId: scope.id } : {};

    let etablissementsSQL;
    if (scope.type === 'rectorat') {
      etablissementsSQL = `SELECT id_etablissement as id, nom_etablissement as nom, type, id_rectorat FROM etablissement WHERE archive=false AND id_rectorat = :scopeId ORDER BY nom_etablissement`;
    } else if (scope.type === 'etablissement') {
      etablissementsSQL = `SELECT id_etablissement as id, nom_etablissement as nom, type, id_rectorat FROM etablissement WHERE archive=false AND id_etablissement = :scopeId ORDER BY nom_etablissement`;
    } else {
      etablissementsSQL = `SELECT id_etablissement as id, nom_etablissement as nom, type, id_rectorat FROM etablissement WHERE archive=false ORDER BY nom_etablissement`;
    }

    const etablissements = await sequelize.query(etablissementsSQL, { replacements: repl, type: sequelize.QueryTypes.SELECT });

    let rectoratsSQL;
    if (scope.type === 'rectorat') {
      rectoratsSQL = `SELECT id_rectorat as id, nom_rectorat as nom, type FROM rectorat WHERE id_rectorat = :scopeId ORDER BY nom_rectorat`;
    } else {
      rectoratsSQL = `SELECT id_rectorat as id, nom_rectorat as nom, type FROM rectorat ORDER BY nom_rectorat`;
    }
    const rectorats = await sequelize.query(rectoratsSQL, { replacements: repl, type: sequelize.QueryTypes.SELECT });

    const regions = await sequelize.query(
      `SELECT id_region as id, nom_region as nom FROM region ORDER BY nom_region`,
      { type: sequelize.QueryTypes.SELECT }
    );
    const filieres = [];

    // Filtrer les spécialités par département si fourni
    const { departement_id } = req.query;
    let specialites;
    if (departement_id) {
      specialites = await sequelize.query(
        `SELECT id_specialite as id, nom_specialite as nom FROM specialite
         WHERE id_niveau IN (SELECT id_niveau FROM niveau WHERE id_departement = :dept_id)
         ORDER BY nom_specialite`,
        { replacements: { dept_id: parseInt(departement_id) }, type: sequelize.QueryTypes.SELECT }
      );
    } else {
      specialites = await sequelize.query(
        `SELECT id_specialite as id, nom_specialite as nom FROM specialite ORDER BY nom_specialite`,
        { type: sequelize.QueryTypes.SELECT }
      );
    }
    res.json({ success: true, data: { etablissements, rectorats, regions, filieres, specialites } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur filtres', error: error.message });
  }
};

// ── Génération de rapport avec filtres ────────────────────────────────────
exports.getRapport = async (req, res) => {
  const {
    type = 'etudiants',
    etablissement_id, filiere, mention, risque,
    niveau, semestre, type_etab, region_id,
    specialite_id, rectorat_id, departement_id, limite = 200,
  } = req.query;

  // Subquery to filter by departement (via specialite → niveau → departement)
  const deptSpecSubquery = `et.id_specialite IN (
    SELECT id_specialite FROM specialite
    WHERE id_niveau IN (SELECT id_niveau FROM niveau WHERE id_departement = :departement_id)
  )`;

  try {
    const scope = await getScope(req);
    let rows = [];
    let summary = {};

    if (type === 'etudiants') {
      const conds = ['et.moyenne_generale IS NOT NULL'];
      const repl  = { limite: parseInt(limite) };
      if (scope.type === 'rectorat' && scope.id)     { conds.push('e.id_rectorat = :scopeId');       repl.scopeId = scope.id; }
      if (scope.type === 'etablissement' && scope.id) { conds.push('et.id_etablissement = :scopeId'); repl.scopeId = scope.id; }
      if (rectorat_id && scope.type === 'all')         { conds.push('e.id_rectorat = :rectorat_id');          repl.rectorat_id = parseInt(rectorat_id); }
      if (etablissement_id && scope.type !== 'etablissement') { conds.push('et.id_etablissement = :etablissement_id'); repl.etablissement_id = parseInt(etablissement_id); }
      if (departement_id)   { conds.push(deptSpecSubquery); repl.departement_id = parseInt(departement_id); }
      if (specialite_id)    { conds.push('et.id_specialite = :specialite_id'); repl.specialite_id = parseInt(specialite_id); }
      if (mention === 'tres_bien')        conds.push('et.moyenne_generale >= 16');
      else if (mention === 'bien')        conds.push('et.moyenne_generale >= 14 AND et.moyenne_generale < 16');
      else if (mention === 'assez_bien')  conds.push('et.moyenne_generale >= 12 AND et.moyenne_generale < 14');
      else if (mention === 'passable')    conds.push('et.moyenne_generale >= 10 AND et.moyenne_generale < 12');
      else if (mention === 'insuffisant') conds.push('et.moyenne_generale < 10');

      rows = await sequelize.query(`
        SELECT u.nom, u.prenom, u.email,
               et.numero_etudiant AS matricule,
               ROUND(et.moyenne_generale::numeric, 2) AS moyenne_generale,
               e.nom_etablissement, v.nom_ville, r.nom_region,
               s.nom_specialite,
               CASE
                 WHEN et.moyenne_generale >= 16 THEN 'Très bien'
                 WHEN et.moyenne_generale >= 14 THEN 'Bien'
                 WHEN et.moyenne_generale >= 12 THEN 'Assez bien'
                 WHEN et.moyenne_generale >= 10 THEN 'Passable'
                 ELSE 'Insuffisant'
               END AS mention
        FROM etudiant et
        JOIN utilisateur u ON et.numero_utilisateur = u.numero_utilisateur
        LEFT JOIN etablissement e ON et.id_etablissement = e.id_etablissement
        LEFT JOIN ville v ON e.id_ville = v.id_ville
        LEFT JOIN region r ON v.id_region = r.id_region
        LEFT JOIN specialite s ON et.id_specialite = s.id_specialite
        WHERE ${conds.join(' AND ')}
        ORDER BY et.moyenne_generale DESC
        LIMIT :limite
      `, { replacements: repl, type: sequelize.QueryTypes.SELECT });

      const vals = rows.map(r => parseFloat(r.moyenne_generale));
      summary = {
        total:     rows.length,
        moyenne:   vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 100) / 100 : 0,
        a_risque:  rows.filter(r => parseFloat(r.moyenne_generale) < 10).length,
        critique:  rows.filter(r => parseFloat(r.moyenne_generale) < 7).length,
        tres_bien: rows.filter(r => parseFloat(r.moyenne_generale) >= 16).length,
      };

    } else if (type === 'etablissements') {
      const conds = ['e.archive = false'];
      const repl  = { limite: parseInt(limite) };
      if (scope.type === 'rectorat' && scope.id)     { conds.push('e.id_rectorat = :scopeId');      repl.scopeId = scope.id; }
      if (scope.type === 'etablissement' && scope.id) { conds.push('e.id_etablissement = :scopeId'); repl.scopeId = scope.id; }
      if (rectorat_id && scope.type === 'all')         { conds.push('e.id_rectorat = :rectorat_id');  repl.rectorat_id = parseInt(rectorat_id); }
      if (etablissement_id && scope.type === 'all')    { conds.push('e.id_etablissement = :etablissement_id'); repl.etablissement_id = parseInt(etablissement_id); }
      if (type_etab) { conds.push('e.type = :type_etab'); repl.type_etab = type_etab; }
      if (region_id && scope.type !== 'etablissement') { conds.push('r.id_region = :region_id'); repl.region_id = parseInt(region_id); }

      // Sous-requêtes pour éviter le produit cartésien (étudiants × enseignants × départements)
      rows = await sequelize.query(`
        SELECT e.id_etablissement AS id,
               e.nom_etablissement AS nom,
               e.type,
               e.code_etablissement,
               v.nom_ville,
               r.nom_region,
               COALESCE(ets.nb_etudiants,   0) AS nb_etudiants,
               COALESCE(ens.nb_enseignants, 0) AS nb_enseignants,
               COALESCE(dps.nb_departements, 0) AS nb_departements,
               COALESCE(ets.moyenne, 0)         AS moyenne,
               COALESCE(ets.nb_risque, 0)       AS nb_risque,
               CASE WHEN COALESCE(ets.nb_etudiants, 0) > 0
                    THEN ROUND(100.0 * COALESCE(ets.nb_risque, 0)::numeric / ets.nb_etudiants, 1)
                    ELSE 0 END                  AS pct_risque
        FROM etablissement e
        LEFT JOIN ville v ON e.id_ville = v.id_ville
        LEFT JOIN region r ON v.id_region = r.id_region
        LEFT JOIN (
          SELECT id_etablissement,
                 COUNT(*)                                                           AS nb_etudiants,
                 ROUND(AVG(moyenne_generale)::numeric, 2)                           AS moyenne,
                 SUM(CASE WHEN moyenne_generale < 10 THEN 1 ELSE 0 END)            AS nb_risque
          FROM etudiant
          WHERE moyenne_generale IS NOT NULL
          GROUP BY id_etablissement
        ) ets ON e.id_etablissement = ets.id_etablissement
        LEFT JOIN (
          SELECT id_etablissement_principal, COUNT(*) AS nb_enseignants
          FROM enseignant
          GROUP BY id_etablissement_principal
        ) ens ON e.id_etablissement = ens.id_etablissement_principal
        LEFT JOIN (
          SELECT id_etablissement, COUNT(*) AS nb_departements
          FROM departement
          GROUP BY id_etablissement
        ) dps ON e.id_etablissement = dps.id_etablissement
        WHERE ${conds.join(' AND ')}
        ORDER BY COALESCE(ets.nb_etudiants, 0) DESC
        LIMIT :limite
      `, { replacements: repl, type: sequelize.QueryTypes.SELECT });

      summary = {
        total:             rows.length,
        total_etudiants:   rows.reduce((a, b) => a + parseInt(b.nb_etudiants  || 0), 0),
        total_enseignants: rows.reduce((a, b) => a + parseInt(b.nb_enseignants || 0), 0),
        moyenne_globale:   rows.length
          ? Math.round(rows.reduce((a, b) => a + (parseFloat(b.moyenne) || 0), 0) / rows.length * 100) / 100
          : 0,
      };

    } else if (type === 'enseignants') {
      const conds = ['1=1'];
      const repl  = { limite: parseInt(limite) };
      if (scope.type === 'rectorat' && scope.id)     { conds.push('e.id_rectorat = :scopeId');                   repl.scopeId = scope.id; }
      if (scope.type === 'etablissement' && scope.id) { conds.push('en.id_etablissement_principal = :scopeId');   repl.scopeId = scope.id; }
      if (rectorat_id && scope.type === 'all')         { conds.push('e.id_rectorat = :rectorat_id');              repl.rectorat_id = parseInt(rectorat_id); }
      if (etablissement_id && scope.type !== 'etablissement') { conds.push('en.id_etablissement_principal = :etablissement_id'); repl.etablissement_id = parseInt(etablissement_id); }

      rows = await sequelize.query(`
        SELECT u.nom, u.prenom, u.email, u.telephone, u.sexe,
               en.specialite, en.grade, en.annees_experience,
               e.nom_etablissement, v.nom_ville
        FROM enseignant en
        JOIN utilisateur u ON en.numero_utilisateur = u.numero_utilisateur
        LEFT JOIN etablissement e ON en.id_etablissement_principal = e.id_etablissement
        LEFT JOIN ville v ON e.id_ville = v.id_ville
        WHERE ${conds.join(' AND ')}
        ORDER BY u.nom ASC
        LIMIT :limite
      `, { replacements: repl, type: sequelize.QueryTypes.SELECT });

      summary = { total: rows.length };

    } else if (type === 'academique') {
      const conds = ['ha.moyenne IS NOT NULL'];
      const repl  = { limite: parseInt(limite) };
      if (scope.type === 'rectorat' && scope.id)     { conds.push('e.id_rectorat = :scopeId');      repl.scopeId = scope.id; }
      if (scope.type === 'etablissement' && scope.id) { conds.push('et.id_etablissement = :scopeId'); repl.scopeId = scope.id; }
      if (rectorat_id && scope.type === 'all')         { conds.push('e.id_rectorat = :rectorat_id');  repl.rectorat_id = parseInt(rectorat_id); }
      if (niveau)    { conds.push('ha.niveau = :niveau');        repl.niveau = niveau; }
      if (semestre)  { conds.push('ha.semestre = :semestre');    repl.semestre = parseInt(semestre); }
      if (departement_id) {
        conds.push(`ha.id_specialite IN (SELECT id_specialite FROM specialite WHERE id_niveau IN (SELECT id_niveau FROM niveau WHERE id_departement = :departement_id))`);
        repl.departement_id = parseInt(departement_id);
      }
      if (etablissement_id && scope.type !== 'etablissement') { conds.push('et.id_etablissement = :etablissement_id'); repl.etablissement_id = parseInt(etablissement_id); }

      rows = await sequelize.query(`
        SELECT ha.niveau, ha.semestre, ha.mention,
               ROUND(ha.moyenne::numeric, 2) AS moyenne,
               ha.nb_absences, ha.taux_reussite,
               sp.nom_specialite,
               u.nom, u.prenom, e.nom_etablissement
        FROM historique_academique ha
        JOIN utilisateur u ON ha.numero_utilisateur = u.numero_utilisateur
        LEFT JOIN etudiant et ON ha.numero_utilisateur = et.numero_utilisateur
        LEFT JOIN etablissement e ON et.id_etablissement = e.id_etablissement
        LEFT JOIN specialite sp ON ha.id_specialite = sp.id_specialite
        WHERE ${conds.join(' AND ')}
        ORDER BY ha.niveau, ha.semestre, ha.moyenne DESC
        LIMIT :limite
      `, { replacements: repl, type: sequelize.QueryTypes.SELECT });

      const moyVals = rows.map(r => parseFloat(r.moyenne || 0));
      summary = {
        total:   rows.length,
        moyenne: moyVals.length ? Math.round(moyVals.reduce((a, b) => a + b, 0) / moyVals.length * 100) / 100 : 0,
        reussite: rows.filter(r => parseFloat(r.moyenne) >= 10).length,
      };

    } else if (type === 'risque') {
      const conds = ['et.moyenne_generale IS NOT NULL'];
      const repl  = { limite: parseInt(limite) };
      conds.push(risque === 'critique' ? 'et.moyenne_generale < 7' : 'et.moyenne_generale < 10');
      if (scope.type === 'rectorat' && scope.id)     { conds.push('e.id_rectorat = :scopeId');      repl.scopeId = scope.id; }
      if (scope.type === 'etablissement' && scope.id) { conds.push('et.id_etablissement = :scopeId'); repl.scopeId = scope.id; }
      if (rectorat_id && scope.type === 'all')         { conds.push('e.id_rectorat = :rectorat_id');  repl.rectorat_id = parseInt(rectorat_id); }
      if (departement_id) { conds.push(deptSpecSubquery); repl.departement_id = parseInt(departement_id); }
      if (etablissement_id && scope.type !== 'etablissement') { conds.push('et.id_etablissement = :etablissement_id'); repl.etablissement_id = parseInt(etablissement_id); }

      rows = await sequelize.query(`
        SELECT u.nom, u.prenom, u.email,
               et.numero_etudiant AS matricule,
               s.nom_specialite,
               ROUND(et.moyenne_generale::numeric, 2) AS moyenne_generale,
               COALESCE(abs.nb_absences, 0) AS nb_absences,
               e.nom_etablissement, v.nom_ville,
               CASE
                 WHEN et.moyenne_generale < 7  THEN 'Critique'
                 WHEN et.moyenne_generale < 10 THEN 'À risque'
                 ELSE 'Passable'
               END AS niveau_risque
        FROM etudiant et
        JOIN utilisateur u ON et.numero_utilisateur = u.numero_utilisateur
        LEFT JOIN etablissement e ON et.id_etablissement = e.id_etablissement
        LEFT JOIN ville v ON e.id_ville = v.id_ville
        LEFT JOIN specialite s ON et.id_specialite = s.id_specialite
        LEFT JOIN (
          SELECT numero_utilisateur, COUNT(*) AS nb_absences
          FROM absence
          GROUP BY numero_utilisateur
        ) abs ON abs.numero_utilisateur = et.numero_utilisateur
        WHERE ${conds.join(' AND ')}
        ORDER BY et.moyenne_generale ASC
        LIMIT :limite
      `, { replacements: repl, type: sequelize.QueryTypes.SELECT });

      summary = {
        total:    rows.length,
        critique: rows.filter(r => parseFloat(r.moyenne_generale) < 7).length,
        a_risque: rows.filter(r => parseFloat(r.moyenne_generale) >= 7 && parseFloat(r.moyenne_generale) < 10).length,
        moyenne:  rows.length
          ? Math.round(rows.reduce((a, b) => a + parseFloat(b.moyenne_generale || 0), 0) / rows.length * 100) / 100
          : 0,
      };
    }

    res.json({ success: true, data: rows, summary, type });
  } catch (error) {
    console.error('Rapport error [type=%s]:', type, error.message);
    console.error('SQL detail:', error.original?.message || error.parent?.message || '');
    res.status(500).json({
      success: false,
      message: 'Erreur rapport',
      error: error.message,
      detail: error.original?.message || error.parent?.message || '',
      type,
    });
  }
};
