/**
 * Corrige les incohérences en mettant à jour enseignant.specialite
 * pour qu'elle corresponde au domaine du département de son affectation active.
 *
 * On NE change PAS l'affectation (le dept reste), on change la spec de l'enseignant
 * car déplacer un enseignant entre départements casserait l'équilibre des effectifs.
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'db_siapet',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

// ─── Mapping dept name keyword -> spécialité enseignant ──────────────────────
// Plus la règle apparaît tôt, plus elle est prioritaire.
const DEPT_TO_SPEC = [
  // Islamique / Arabe / Lettres / Langues / Humanités
  { keys: ['islamique','coran','hadith','fiqh','soufisme','patrimoine manuscrit'], spec: 'Lettres' },
  { keys: ['langue arabe','littérature arabe','civilisation arabes','civilisation arabe','humanités arabes','études arabes'], spec: 'Lettres' },
  { keys: ['langue française','littérature française','civilisation françaises','études françaises','français professionnel'], spec: 'Lettres' },
  { keys: ['langue anglaise','littérature anglaise','civilisation anglaises','études anglaises','anglais professionnel'], spec: 'Lettres' },
  { keys: ['langues étrangères','langues appliquées','traduction','langues des affaires','allemand','espagnol','italien','arabe pour non','langues et informatique'], spec: 'Lettres' },
  { keys: ['lettres et langues','lettres et','langues et'], spec: 'Lettres' },
  { keys: ['philosophie','psychologie','sociologie','sciences sociales','anthropologie'], spec: 'Lettres' },
  { keys: ['sciences de l\'éducation','didactique','formation des enseignants'], spec: 'Lettres' },
  { keys: ['journalisme','communication','médias'], spec: 'Lettres' },
  { keys: ['arts plastiques','arts et patrimoine','arts islamiques','arts et médias','design','théâtre','art dramatique','musique','musicologie','animation socioculturelle','artisanat','sciences du patrimoine','sciences de la culture','cinéma','audiovisuel','multimédia islamique'], spec: 'Lettres' },
  { keys: ['tourisme','hôtellerie'], spec: 'Lettres' },
  { keys: ['sciences de l\'information','bibliothèque','archivistique','archives','mémoire nationale','documentation','knowledge management','bibliothéconomie'], spec: 'Lettres' },

  // IA / Informatique / Réseaux
  { keys: ['intelligence artificielle','data science','ia et'], spec: 'Informatique' },
  { keys: ['réseaux et cybersécurité','cybersécurité','télécommunication','télécoms','réseaux et télécoms','télécommunications et réseaux'], spec: 'Réseaux' },
  { keys: ['génie logiciel','systèmes d\'information','ingénierie logicielle'], spec: 'Informatique' },
  { keys: ['informatique','technologies informatiques','technologies de l\'information','technologies de communication','design numérique et jeux','communication numérique','multimédia','audiovisuel','cinéma','médias numériques','design numérique','jeux vidéo'], spec: 'Informatique' },

  // Sciences exactes
  { keys: ['mathématiques-physique','maths-physique'], spec: 'Mathématiques' },
  { keys: ['méthodes quantitatives','statistiques','actuariat'], spec: 'Mathématiques' },
  { keys: ['mathématiques','math '], spec: 'Mathématiques' },
  { keys: ['physique-chimie'], spec: 'Physique' },
  { keys: ['physique'], spec: 'Physique' },
  { keys: ['chimie'], spec: 'Chimie' },

  // Sciences de la vie / santé / agro
  { keys: ['biologie','biotechnologie','géologie','sciences naturelles','environnement','écologie','sciences de la vie'], spec: 'Biologie' },
  { keys: ['médecine','pharmacie','pharmaceutique','dentaire','odontologie','orthodontie','pédodontie','stomatologie','santé','paramédical','infirmier','obstétrique','kinésithérapie','réadaptation','réhabilitation','radiologie','imagerie','analyses biomédicales','éducation spécialisée'], spec: 'Biologie' },
  { keys: ['vétérinaire','sciences vétérinaires','santé animale','zoonoses'], spec: 'Biologie' },
  { keys: ['agronomie','oléicole','huile d\'olive','production végétale','productions végétales','production animale','productions animales','élevage','sylviculture','pastoralisme','agropastoralisme','génie rural','hydraulique et génie','agro-industriel','horticulture','forêts','grandes cultures'], spec: 'Agronomie' },

  // Génies
  { keys: ['architecture'], spec: 'Architecture' },
  { keys: ['urbanisme'], spec: 'Architecture' },
  { keys: ['génie civil','bâtiment','construction'], spec: 'Génie Civil' },
  { keys: ['génie mécanique','mécanique','mécatronique'], spec: 'Génie Mécanique' },
  { keys: ['génie industriel','technologies industrielles','management des systèmes de production'], spec: 'Génie Mécanique' },
  { keys: ['génie électrique','électrotechnique','automatique','automatisme','énergie','énergétique'], spec: 'Électrotechnique' },
  { keys: ['électronique','traitement du signal'], spec: 'Électronique' },
  { keys: ['génie des procédés','procédés et matériaux','génie textile','textile'], spec: 'Chimie' },

  // Sciences éco / gestion / droit
  { keys: ['économie','sciences économiques','économétrie','macroéconomie'], spec: 'Économie' },
  { keys: ['finance','comptabilité','fiscalité','banque','audit'], spec: 'Finance' },
  { keys: ['management','ressources humaines','entrepreneuriat','business','digital','administration','gestion'], spec: 'Gestion' },
  { keys: ['marketing','commerce'], spec: 'Marketing' },
  { keys: ['droit','sciences politiques'], spec: 'Droit' },
  { keys: ['transport','logistique'], spec: 'Gestion' },

  // SHS
  { keys: ['histoire','patrimoine','civilisation','archéologie'], spec: 'Histoire' },
  { keys: ['géographie','aménagement','sig'], spec: 'Géographie' },

  // Sport / autres techniques
  { keys: ['sciences du sport','éducation physique','management du sport','activités physiques','sport et'], spec: 'Sciences' },
  { keys: ['technologies appliquées','technologie et sciences de l\'ingénieur','design de mode','mode','sciences et techniques','sciences et technologies'], spec: 'Sciences' },
];

function norm(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function targetSpec(nomDept) {
  const n = norm(nomDept);
  for (const rule of DEPT_TO_SPEC) {
    for (const kw of rule.keys) {
      if (n.includes(norm(kw))) return rule.spec;
    }
  }
  return null;
}

async function main() {
  const client = await pool.connect();
  try {
    console.log('Récupération des affectations actives...');
    const { rows } = await client.query(`
      SELECT a.numero_utilisateur, ens.specialite AS spec_ens, d.nom_departement
      FROM affectation a
      JOIN enseignant ens ON ens.numero_utilisateur = a.numero_utilisateur
      JOIN departement d ON d.id_departement = a.id_departement
      WHERE a.statut = 'ACTIVE'
    `);
    console.log(`Total: ${rows.length} affectations.`);

    // Construire la liste des mises à jour (numero -> nouvelle spec)
    const updates = new Map();
    let alreadyOk = 0;
    let noMatch = 0;
    const unmatchedDepts = new Set();

    for (const r of rows) {
      const target = targetSpec(r.nom_departement);
      if (!target) {
        noMatch++;
        unmatchedDepts.add(r.nom_departement);
        continue;
      }
      if (r.spec_ens === target) {
        alreadyOk++;
        continue;
      }
      // Sinon : mettre à jour
      updates.set(r.numero_utilisateur, target);
    }

    console.log(`\nDéjà cohérent       : ${alreadyOk}`);
    console.log(`À mettre à jour     : ${updates.size}`);
    console.log(`Dept sans règle     : ${noMatch}`);

    if (unmatchedDepts.size > 0) {
      console.log('\nDépartements sans règle:');
      [...unmatchedDepts].forEach(d => console.log('  -', d));
    }

    if (updates.size === 0) {
      console.log('\nRien à faire.');
      return;
    }

    console.log('\nApplication des mises à jour...');
    await client.query('BEGIN');
    let done = 0;
    for (const [numero, spec] of updates) {
      await client.query(
        'UPDATE enseignant SET specialite = $1 WHERE numero_utilisateur = $2',
        [spec, numero]
      );
      done++;
      if (done % 200 === 0) console.log(`  ${done}/${updates.size}...`);
    }
    await client.query('COMMIT');
    console.log(`\n✓ ${done} enseignants mis à jour.`);

    // Vérif finale
    const { rows: check } = await client.query(`
      SELECT a.numero_utilisateur, ens.specialite, d.nom_departement
      FROM affectation a
      JOIN enseignant ens ON ens.numero_utilisateur = a.numero_utilisateur
      JOIN departement d ON d.id_departement = a.id_departement
      WHERE a.statut = 'ACTIVE'
    `);
    let coh = 0, incoh = 0;
    for (const r of check) {
      const tgt = targetSpec(r.nom_departement);
      if (tgt === r.specialite) coh++; else incoh++;
    }
    console.log(`\nVérification finale: ${coh} cohérents / ${incoh} incohérents (${((coh/check.length)*100).toFixed(1)}%)`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ ERREUR:', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

main();
