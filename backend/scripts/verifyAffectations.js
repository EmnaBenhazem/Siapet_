/**
 * Vérifie pour chaque affectation ACTIVE que la spécialité de l'enseignant
 * correspond au domaine du département. Reporte les incohérences.
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

// Mapping: spécialité enseignant -> mots-clés acceptés dans nom_departement
// Une spécialité peut couvrir plusieurs domaines de département.
const SPEC_DOMAINS = {
  'Informatique': [
    'informatique','génie logiciel','systèmes d\'information','intelligence artificielle',
    'data science','multimédia','audiovisuel','cinéma','médias numériques','technologies informatiques',
    'design numérique','communication numérique','technologies de l\'information','technologies de communication',
  ],
  'Réseaux': [
    'réseaux','cybersécurité','télécommunication','télécoms','informatique',
  ],
  'Mathématiques': [
    'mathématiques','maths-physique','méthodes quantitatives','statistiques','actuariat',
  ],
  'Mathematiques': [
    'mathématiques','maths-physique','méthodes quantitatives','statistiques','actuariat',
  ],
  'Physique': [
    'physique','maths-physique','physique-chimie',
  ],
  'Chimie': [
    'chimie','physique-chimie','génie des procédés','procédés et matériaux',
  ],
  'Biologie': [
    'biologie','biotechnologie','géologie','sciences naturelles','environnement','écologie',
    'médecine','pharmacie','dentaire','odontologie','santé','paramédical','infirmier','obstétrique',
    'kinésithérapie','vétérinaire','santé animale','sciences de la vie','patrimoine','culture',
  ],
  'Agronomie': [
    'agronomie','production végétale','production animale','sylviculture','pastoralisme',
    'génie rural','agro-industriel','élevage','oléicole','huile d\'olive','horticulture',
  ],
  'Architecture': [
    'architecture','urbanisme',
  ],
  'Génie Civil': [
    'génie civil','architecture','bâtiment','construction','hydraulique','géotechnique',
  ],
  'Génie Mécanique': [
    'génie mécanique','mécanique','mécatronique','génie industriel','technologies industrielles',
    'maintenance industrielle','production industrielle',
  ],
  'Électronique': [
    'électronique','génie électrique','électrotechnique','automatique','automatisme',
    'télécommunication','signal','traitement du signal','électricité',
  ],
  'Électrotechnique': [
    'électrotechnique','électronique','génie électrique','automatique','énergie','énergétique',
  ],
  'Économie': [
    'économie','sciences économiques','économétrie','macroéconomie','microéconomie',
  ],
  'Economie': [
    'économie','sciences économiques','économétrie','macroéconomie','microéconomie',
  ],
  'Finance': [
    'finance','comptabilité','fiscalité','banque','audit','gestion','administration',
  ],
  'Gestion': [
    'gestion','management','administration','ressources humaines','entrepreneuriat',
    'business','digital','transport','logistique',
  ],
  'Marketing': [
    'marketing','commerce','communication',
  ],
  'Droit': [
    'droit','sciences politiques','administration',
  ],
  'Histoire': [
    'histoire','patrimoine','civilisation','archéologie','archives',
  ],
  'Géographie': [
    'géographie','aménagement','urbanisme','sig','environnement',
  ],
  'Lettres': [
    'lettres','langue','littérature','civilisation','linguistique','traduction','français',
    'arabe','anglais','allemand','espagnol','italien','philosophie','psychologie','sociologie',
    'sciences sociales','anthropologie','sciences de l\'éducation','didactique','journalisme',
    'communication','arts','musique','théâtre','art dramatique','design','animation socioculturelle',
    'islamique','tourisme','bibliothèque','archivistique','documentation','médias','patrimoine',
    'études','humanités',
  ],
  'Sciences': [
    'sciences','technologies appliquées','technologie','ingénieur','sport','éducation physique',
    'textile','mode','culture','sciences de la vie',
  ],
};

function norm(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function isCoherent(specialiteEns, nomDept) {
  if (!specialiteEns) return false;
  const keywords = SPEC_DOMAINS[specialiteEns];
  if (!keywords) return false; // spec inconnue
  const deptN = norm(nomDept);
  for (const kw of keywords) {
    if (deptN.includes(norm(kw))) return true;
  }
  return false;
}

async function main() {
  const client = await pool.connect();

  console.log('Récupération de toutes les affectations actives...');
  const { rows } = await client.query(`
    SELECT a.id_affectation, a.numero_utilisateur, a.id_departement,
           ens.specialite AS spec_ens,
           d.nom_departement
    FROM affectation a
    JOIN enseignant ens ON ens.numero_utilisateur = a.numero_utilisateur
    JOIN departement d ON d.id_departement = a.id_departement
    WHERE a.statut = 'ACTIVE'
    ORDER BY a.id_departement
  `);

  console.log(`Total: ${rows.length} affectations à analyser.\n`);

  let coherent = 0;
  let incoherent = 0;
  let unknownSpec = 0;
  const mismatchesByDept = new Map();
  const unknownSpecs = new Set();

  for (const r of rows) {
    if (!SPEC_DOMAINS[r.spec_ens]) {
      unknownSpec++;
      unknownSpecs.add(r.spec_ens || '(NULL)');
      continue;
    }
    if (isCoherent(r.spec_ens, r.nom_departement)) {
      coherent++;
    } else {
      incoherent++;
      const key = `${r.id_departement}|${r.nom_departement}`;
      if (!mismatchesByDept.has(key)) mismatchesByDept.set(key, []);
      mismatchesByDept.get(key).push({ ens: r.numero_utilisateur, spec: r.spec_ens });
    }
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('RÉSULTATS');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`✓ Cohérent       : ${coherent}`);
  console.log(`✗ Incohérent     : ${incoherent}`);
  console.log(`? Spec inconnue  : ${unknownSpec}`);
  console.log(`Taux cohérence   : ${((coherent / rows.length) * 100).toFixed(1)}%`);

  if (unknownSpecs.size > 0) {
    console.log('\nSpécialités inconnues du mapping:');
    [...unknownSpecs].forEach(s => console.log(`  - "${s}"`));
  }

  if (mismatchesByDept.size > 0) {
    console.log(`\nDépartements avec enseignants mal affectés: ${mismatchesByDept.size}`);
    console.log('(15 premiers exemples)\n');
    let i = 0;
    for (const [key, list] of mismatchesByDept) {
      if (i++ >= 15) break;
      const [id, name] = key.split('|');
      console.log(`  Dept ${id} - ${name}:`);
      list.slice(0, 3).forEach(e => console.log(`    ${e.ens} - spec: ${e.spec}`));
      if (list.length > 3) console.log(`    ... +${list.length - 3} autre(s)`);
    }
  }

  client.release();
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
