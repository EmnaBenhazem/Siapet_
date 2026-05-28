/**
 * seedRealisticComplete.js
 * Phase 1 — Redistribution des moyennes (taux réaliste tunisien)
 * Phase 2 — Historique académique pour TOUS les étudiants (active le ML)
 * Phase 3 — Ajout d'étudiants aux spécialités sous-peuplées
 * Phase 4 — Normalisation des grades enseignants
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'db_siapet',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const TARGET_PER_SPEC = 100; // min étudiants par spécialité
const HIST_BATCH      = 400; // étudiants par batch historique (400×6=2400 enreg.)
const INS_BATCH       = 80;  // nouveaux étudiants par INSERT

// ── Helpers ──────────────────────────────────────────────────────────────────
const clamp  = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round2 = v => Math.round(v * 100) / 100;
const rand   = (lo, hi) => lo + Math.random() * (hi - lo);
const pick   = arr => arr[Math.floor(Math.random() * arr.length)];
const randInt= (lo, hi) => Math.floor(rand(lo, hi + 1));

function mention(m) {
  if (m >= 16) return 'Très Bien';
  if (m >= 14) return 'Bien';
  if (m >= 12) return 'Assez Bien';
  if (m >= 10) return 'Passable';
  return 'Insuffisant';
}

// Distribution réaliste tunisienne :
// 8% critique | 18% attention | 25% passable | 24% assez bien | 15% bien | 10% très bien
function realisticMoy() {
  const r = Math.random();
  if (r < 0.08) return round2(rand(4.0,  6.9));
  if (r < 0.26) return round2(rand(7.0,  9.9));
  if (r < 0.51) return round2(rand(10.0, 11.9));
  if (r < 0.75) return round2(rand(12.0, 13.9));
  if (r < 0.90) return round2(rand(14.0, 15.9));
  return round2(rand(16.0, 19.5));
}

// Génère 6 semestres cohérents basés sur la moyenne finale de l'étudiant
function genSemestres(userId, specId, M) {
  const p =
    M < 7  ? { L1b: rand(9.0,11.5), L2b: rand(7.5,9.5),  ab: 20, as_: 6, vp: 0.30 } :
    M < 10 ? { L1b: rand(10.0,12.0),L2b: rand(9.0,11.0), ab: 13, as_: 5, vp: 0.50 } :
    M < 12 ? { L1b: M+rand(-1,1),   L2b: M+rand(-.5,.5), ab: 7,  as_: 3, vp: 0.72 } :
    M < 14 ? { L1b: M-rand(1,2.5),  L2b: M-rand(.5,1.5), ab: 4,  as_: 2, vp: 0.85 } :
    M < 16 ? { L1b: M-rand(2,3.5),  L2b: M-rand(1,2),    ab: 2,  as_: 2, vp: 0.92 } :
             { L1b: M-rand(2.5,4),  L2b: M-rand(1.5,2.5),ab: 1,  as_: 1, vp: 0.97 };

  const SEMS = [
    ['L1','2022-2023',1, clamp(p.L1b+rand(-.4,.4),2,19.5)],
    ['L1','2022-2023',2, clamp(p.L1b+rand(-.5,.5),2,19.5)],
    ['L2','2023-2024',3, clamp(p.L2b+rand(-.4,.4),2,19.5)],
    ['L2','2023-2024',4, clamp(p.L2b+rand(-.5,.5),2,19.5)],
    ['L3','2024-2025',5, clamp(M+rand(-.4,.4),    2,19.5)],
    ['L3','2024-2025',6, clamp(M+rand(-.1,.1),    2,19.5)],
  ];

  return SEMS.map(([niv,an,sem,base]) => {
    const moy = round2(clamp(base + rand(-.3,.3), 2, 20));
    const NB  = 6;
    const eff = moy >= 10 ? Math.min(1.0, p.vp+0.1) : Math.max(0, p.vp-0.25);
    const val = clamp(Math.round(NB*eff + rand(-.5,.5)), 0, NB);
    const abs = Math.max(0, Math.round(p.ab + rand(-p.as_, p.as_)));
    return [
      userId, specId, niv, an, sem,
      moy, abs, Math.round(abs*rand(.2,.4)),
      NB, val, round2(val/NB*100), round2(val/NB*30),
      mention(moy), moy >= 10 ? 'Admis' : 'Ajourné',
    ];
  });
}

// Construction générique de batch INSERT
function buildBatch(cols, rows) {
  const vals = [], params = [];
  rows.forEach((row, i) => {
    const base = i * cols.length;
    vals.push(`(${cols.map((_,j) => `$${base+j+1}`).join(',')})`);
    params.push(...row);
  });
  return { vals: vals.join(','), params };
}

const HIST_COLS = [
  'numero_utilisateur','id_specialite','niveau','annee_academique','semestre',
  'moyenne','nb_absences','nb_absences_justifiees','nb_matieres_total',
  'nb_matieres_validees','taux_reussite','credits_valides','mention','statut',
];
async function insertHistBatch(client, recs) {
  if (!recs.length) return;
  const { vals, params } = buildBatch(HIST_COLS, recs);
  await client.query(
    `INSERT INTO historique_academique (${HIST_COLS.join(',')}) VALUES ${vals} ON CONFLICT DO NOTHING`,
    params
  );
}

// ── Données tunisiennes ───────────────────────────────────────────────────────
const NOMS = [
  'Ben Ali','Ben Salah','Ben Youssef','Trabelsi','Chaabane','Ouali','Dridi',
  'Jelassi','Bouaziz','Hamdi','Ferchichi','Khelifi','Bejaoui','Chebbi','Dhouib',
  'Hamza','Frikha','Gharbi','Oueslati','Zouari','Cherif','Belhaj','Khemiri',
  'Tounsi','Mzoughi','Kraiem','Haddad','Mansour','Mejri','Romdhane','Lahmar',
  'Turki','Amor','Benzarti','Kasraoui','Jouini','Riahi','Lassoued','Sellami',
  'Amri','Daoud','Nouri','Saidi','Brahmi','Aloui','Khalfallah','Bedoui',
  'Letaief','Rezgui','Chaari','Baccar','Nasri','Sfar','Chouchane','Baccouche',
  'Guesmi','Hmidi','Saidani','Loukil','Ezzeddine','Mrad','Jlassi','Ben Romdhane',
];
const PH = [
  'Mohamed','Ahmed','Khaled','Anis','Hedi','Yassine','Maher','Sami','Tarek',
  'Walid','Slim','Hatem','Kamel','Riadh','Nizar','Habib','Jamel','Sofiane',
  'Bilel','Lotfi','Imed','Mounir','Wassim','Achref','Zied','Aymen','Nabil',
  'Ghassen','Bassem','Amine','Mehdi','Youssef','Farouk','Chokri','Samir',
];
const PF = [
  'Fatma','Rania','Nadia','Sonia','Rim','Amina','Meryem','Ines','Asma','Olfa',
  'Lamia','Sihem','Najla','Hajer','Leila','Yasmine','Samia','Wafa','Abir','Donia',
  'Hana','Salma','Houda','Nour','Mariem','Emna','Zeineb','Radhia','Takoua',
  'Sabrine','Ghofrane','Afef','Imen','Amal','Hanene',
];
const RUES = [
  'Rue Habib Bourguiba','Avenue de la République','Rue Ibn Khaldoun',
  'Rue Farhat Hached','Rue de France','Boulevard du 7 Novembre',
  'Avenue Mongi Slim','Rue de la Liberté','Avenue Hédi Nouira',
  'Rue Mohamed Ali','Rue du Lac Windermere','Avenue Kheireddine Pacha',
  'Impasse des Jasmins','Cité des Pins','Rue de Marseille',
];
const CPS = [
  '1000','1001','2000','2010','3000','3018','4000','4002',
  '5000','5100','6000','7000','7100','8000','9000','1053',
];

// Placeholder mot_de_passe bloquant la connexion (non-bcrypt intentionnel)
const SEED_PW = 'SEED_BLOCKED_LOGIN_2024';

let idBase = 2100000000001;

// CINs tunisiens : 8 chiffres random, ON CONFLICT DO NOTHING gère les rares doublons
function nextIds() {
  const t = idBase++;
  return { usr: `USR-ETU-${t}`, etu: `ETU${t}` };
}
function nextCin() { return String(Math.floor(Math.random() * 90000000) + 10000000); }
function normS(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z]/g,'');
}
function genEmail(p, n, etu) { return `${normS(p)}.${normS(n)}.${etu}@etudiant.tn`; }
function genTel() {
  return pick(['20','21','22','25','50','52','55','90','92','93','94','95','96','97','98','99'])
       + String(randInt(100000, 999999));
}
function genBirth() {
  return `${randInt(1999,2005)}-${String(randInt(1,12)).padStart(2,'0')}-${String(randInt(1,28)).padStart(2,'0')}`;
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const client = await pool.connect();
  try {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  SIAPET — Seed données réalistes Tunisie');
    console.log('═══════════════════════════════════════════════════\n');

    // ━━━ PHASE 1 : Redistribution des moyennes ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('PHASE 1 — Redistribution des moyennes générales...');
    await client.query(`
      WITH rn AS (
        SELECT numero_utilisateur,
               NTILE(100) OVER (ORDER BY random()) AS pct
        FROM etudiant
      )
      UPDATE etudiant e
      SET moyenne_generale = CASE
        WHEN pct <=  8 THEN ROUND((4.0  + random()*2.89)::numeric, 2)
        WHEN pct <= 26 THEN ROUND((7.0  + random()*2.99)::numeric, 2)
        WHEN pct <= 51 THEN ROUND((10.0 + random()*1.99)::numeric, 2)
        WHEN pct <= 75 THEN ROUND((12.0 + random()*1.99)::numeric, 2)
        WHEN pct <= 90 THEN ROUND((14.0 + random()*1.99)::numeric, 2)
        ELSE                ROUND((16.0 + random()*3.49)::numeric, 2)
      END
      FROM rn WHERE rn.numero_utilisateur = e.numero_utilisateur
    `);

    const { rows: [d] } = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE moyenne_generale < 7)                              AS critique,
        COUNT(*) FILTER (WHERE moyenne_generale >= 7  AND moyenne_generale < 10)  AS attention,
        COUNT(*) FILTER (WHERE moyenne_generale >= 10 AND moyenne_generale < 12)  AS passable,
        COUNT(*) FILTER (WHERE moyenne_generale >= 12 AND moyenne_generale < 14)  AS assez_bien,
        COUNT(*) FILTER (WHERE moyenne_generale >= 14 AND moyenne_generale < 16)  AS bien,
        COUNT(*) FILTER (WHERE moyenne_generale >= 16)                            AS tres_bien,
        COUNT(*)                                                                   AS total,
        ROUND(AVG(moyenne_generale)::numeric, 2)                                  AS moy_nat
      FROM etudiant
    `);
    const tot = parseInt(d.total);
    const pct = n => (parseInt(n)/tot*100).toFixed(1) + '%';
    console.log(`  Critique   (< 7)    : ${d.critique.toString().padStart(6)}  (${pct(d.critique)})`);
    console.log(`  Attention  (7-10)   : ${d.attention.toString().padStart(6)}  (${pct(d.attention)})`);
    console.log(`  Passable   (10-12)  : ${d.passable.toString().padStart(6)}  (${pct(d.passable)})`);
    console.log(`  Assez Bien (12-14)  : ${d.assez_bien.toString().padStart(6)}  (${pct(d.assez_bien)})`);
    console.log(`  Bien       (14-16)  : ${d.bien.toString().padStart(6)}  (${pct(d.bien)})`);
    console.log(`  Très Bien  (≥ 16)   : ${d.tres_bien.toString().padStart(6)}  (${pct(d.tres_bien)})`);
    console.log(`  Moyenne nationale   : ${d.moy_nat}/20\n`);

    // ━━━ PHASE 2 : Historique académique ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('PHASE 2 — Génération historique académique (6 sem./étudiant)...');
    await client.query('DELETE FROM historique_notes_matiere');
    await client.query('DELETE FROM historique_academique');
    console.log('  Tables historique vidées');

    const { rows: students } = await client.query(
      `SELECT numero_utilisateur AS nu, id_specialite AS sp,
              moyenne_generale::float AS moy
       FROM etudiant ORDER BY numero_utilisateur`
    );
    console.log(`  ${students.length.toLocaleString('fr')} étudiants chargés`);

    let histTotal = 0;
    const t0 = Date.now();

    for (let i = 0; i < students.length; i += HIST_BATCH) {
      const batch = students.slice(i, i + HIST_BATCH);
      const recs  = batch.flatMap(s => genSemestres(s.nu, s.sp, s.moy || 10));
      await insertHistBatch(client, recs);
      histTotal += recs.length;
      const pct2 = Math.round(i / students.length * 100);
      process.stdout.write(`  ${String(pct2).padStart(3)}% — ${histTotal.toLocaleString('fr')} enreg.\r`);
    }

    console.log(`\n  ✓ ${histTotal.toLocaleString('fr')} enreg. créés en ${((Date.now()-t0)/1000).toFixed(1)}s\n`);

    // ━━━ PHASE 3 : Ajout d'étudiants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log(`PHASE 3 — Ajout d'étudiants (objectif ${TARGET_PER_SPEC}/spécialité)...`);

    const { rows: villes } = await client.query('SELECT id_ville FROM ville');
    const villeIds = villes.map(v => v.id_ville);

    // Détecter le max ID existant pour éviter les collisions
    const { rows: [{ mx }] } = await client.query(`
      SELECT COALESCE(
        MAX(CAST(REGEXP_REPLACE(numero_utilisateur, '[^0-9]', '', 'g') AS BIGINT)),
        2100000000000
      ) AS mx
      FROM utilisateur WHERE numero_utilisateur LIKE 'USR-ETU-%'
    `);
    idBase = Math.max(idBase, parseInt(mx) + 100);

    // Spécialités sous-peuplées avec leur établissement
    const { rows: thinSpecs } = await client.query(`
      SELECT s.id_specialite, d.id_etablissement,
             COUNT(e.numero_utilisateur)::int AS cnt
      FROM specialite s
      JOIN niveau     n ON s.id_niveau       = n.id_niveau
      JOIN departement d ON n.id_departement = d.id_departement
      LEFT JOIN etudiant e ON e.id_specialite = s.id_specialite
      WHERE (s.archived IS NULL OR s.archived = false)
        AND (d.archived IS NULL OR d.archived = false)
      GROUP BY s.id_specialite, d.id_etablissement
      HAVING COUNT(e.numero_utilisateur) < $1
      ORDER BY s.id_specialite
    `, [TARGET_PER_SPEC]);

    console.log(`  ${thinSpecs.length} spécialités à compléter`);

    const UCOLS = [
      'numero_utilisateur','nom','prenom','email','mot_de_passe',
      'telephone','sexe','statut','date_creation','type_utilisateur',
    ];
    const ECOLS = [
      'numero_utilisateur','numero_etudiant','cin','date_naissance',
      'adresse','code_postal','moyenne_generale','id_ville',
      'id_etablissement','id_specialite',
    ];

    let newStudents = 0;

    for (const spec of thinSpecs) {
      const toAdd = TARGET_PER_SPEC - spec.cnt;
      if (toAdd <= 0) continue;

      const uRows = [], eRows = [], hRecs = [];

      for (let j = 0; j < toAdd; j++) {
        const fem    = Math.random() > 0.48;
        const prenom = fem ? pick(PF) : pick(PH);
        const nom    = pick(NOMS);
        const ids    = nextIds();
        const moy    = realisticMoy();

        uRows.push([
          ids.usr, nom, prenom,
          genEmail(prenom, nom, ids.etu),
          SEED_PW, genTel(), fem ? 'FEMME' : 'HOMME',
          'ACTIF', new Date(), 'ETUDIANT',
        ]);
        eRows.push([
          ids.usr, ids.etu, nextCin(), genBirth(),
          `${randInt(1,99)} ${pick(RUES)}`, pick(CPS),
          moy, pick(villeIds), spec.id_etablissement, spec.id_specialite,
        ]);
        hRecs.push(...genSemestres(ids.usr, spec.id_specialite, moy));
      }

      // Insérer utilisateurs
      for (let k = 0; k < uRows.length; k += INS_BATCH) {
        const slice = uRows.slice(k, k + INS_BATCH);
        const { vals, params } = buildBatch(UCOLS, slice);
        await client.query(
          `INSERT INTO utilisateur (${UCOLS.join(',')}) VALUES ${vals} ON CONFLICT DO NOTHING`,
          params
        );
      }
      // Insérer étudiants
      for (let k = 0; k < eRows.length; k += INS_BATCH) {
        const slice = eRows.slice(k, k + INS_BATCH);
        const { vals, params } = buildBatch(ECOLS, slice);
        await client.query(
          `INSERT INTO etudiant (${ECOLS.join(',')}) VALUES ${vals} ON CONFLICT DO NOTHING`,
          params
        );
      }
      // Insérer historique des nouveaux
      for (let k = 0; k < hRecs.length; k += HIST_BATCH * 6) {
        await insertHistBatch(client, hRecs.slice(k, k + HIST_BATCH * 6));
      }

      newStudents += toAdd;
      if (newStudents % 1000 < toAdd) {
        process.stdout.write(`  ${newStudents.toLocaleString('fr')} nouveaux étudiants...\r`);
      }
    }

    console.log(`\n  ✓ ${newStudents.toLocaleString('fr')} nouveaux étudiants ajoutés\n`);

    // ━━━ PHASE 4 : Normalisation grades ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('PHASE 4 — Normalisation des grades enseignants...');
    const { rowCount: g1 } = await client.query(`
      UPDATE enseignant SET grade = 'Maître de Conférences'
      WHERE grade IN ('Maitre de Conferences','Maitre de conférences','Maitre de Conférences')
    `);
    const { rowCount: g2 } = await client.query(`
      UPDATE enseignant SET grade = 'Maître Assistant'
      WHERE grade = 'Maitre Assistant'
    `);
    console.log(`  ✓ ${g1 + g2} grades normalisés\n`);

    // ━━━ Résumé final ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const { rows: [st] } = await client.query(`
      SELECT
        (SELECT COUNT(*)                               FROM etudiant)              AS total_etu,
        (SELECT COUNT(*)                               FROM historique_academique) AS total_hist,
        (SELECT COUNT(DISTINCT numero_utilisateur)     FROM historique_academique) AS etu_hist,
        (SELECT ROUND(AVG(moyenne_generale)::numeric,2)FROM etudiant)              AS moy_nat,
        (SELECT COUNT(*) FILTER(WHERE moyenne_generale < 10) FROM etudiant)        AS nb_risque,
        (SELECT COUNT(*) FILTER(WHERE moyenne_generale < 7)  FROM etudiant)        AS nb_critique,
        (SELECT COUNT(*)                               FROM enseignant)             AS total_ens
    `);

    console.log('═══════════════════════════════════════════════════');
    console.log('  RÉSUMÉ FINAL');
    console.log('═══════════════════════════════════════════════════');
    console.log(` Étudiants total         : ${parseInt(st.total_etu).toLocaleString('fr')}`);
    console.log(` Étudiants à risque (<10): ${parseInt(st.nb_risque).toLocaleString('fr')} (${(st.nb_risque/st.total_etu*100).toFixed(1)}%)`);
    console.log(` Dont critiques (< 7)    : ${parseInt(st.nb_critique).toLocaleString('fr')} (${(st.nb_critique/st.total_etu*100).toFixed(1)}%)`);
    console.log(` Moyenne nationale       : ${st.moy_nat}/20`);
    console.log(` Historique total        : ${parseInt(st.total_hist).toLocaleString('fr')} enreg.`);
    console.log(` Couverture historique   : ${parseInt(st.etu_hist).toLocaleString('fr')}/${parseInt(st.total_etu).toLocaleString('fr')} étudiants`);
    console.log(` Enseignants total       : ${parseInt(st.total_ens).toLocaleString('fr')}`);
    console.log('═══════════════════════════════════════════════════');

  } catch (err) {
    console.error('\n❌ ERREUR:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
