/**
 * Seed teachers for all departments that have fewer than TARGET_PER_DEPT teachers.
 * Creates new utilisateur + enseignant records and ACTIVE affectations.
 * Teachers are domain-matched to their department.
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'db_siapet',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const TARGET_PER_DEPT = 15;  // target teachers per department
const DEFAULT_PW_HASH = '$2b$10$defaultHashForSeededTeachers.placeholder123456'; // not valid – login blocked

// ─── Noms tunisiens ──────────────────────────────────────────────────────────
const NOMS = [
  'Ben Ali','Ben Salah','Ben Youssef','Trabelsi','Hadj','Chaabane','Ouali',
  'Mrad','Dridi','Jelassi','Bouaziz','Hamdi','Ferchichi','Khelifi','Ayari',
  'Bejaoui','Msallem','Chebbi','Dhouib','Jlassi','Hamza','Frikha','Gharbi',
  'Ezzeddine','Oueslati','Zouari','Cherif','Belhaj','Khemiri','Tounsi',
  'Guesmi','Mzoughi','Chtioui','Kraiem','Haddad','Chikhaoui','Mansour',
  'Mejri','Boussetta','Yacoub','Romdhane','Lahmar','Turki','Amor','Guedri',
  'Benzarti','Bellamine','Kasraoui','Jouini','Riahi','Hmidi','Saidani',
  'Lassoued','Sellami','Amri','Loukil','Daoud','Nouri','Messaoud','Saidi',
  'Brahmi','Aloui','Khalfallah','Bedoui','Zghal','Letaief','Rezgui','Chaari',
  'Rebai','Baccar','Nasri','Sfar','Chouchane','Baccouche','Barkallah',
];

const PRENOMS_H = [
  'Mohamed','Ahmed','Khaled','Anis','Hedi','Yassine','Maher','Sami','Tarek',
  'Walid','Slim','Hatem','Kamel','Riadh','Nizar','Habib','Jamel','Sofiane',
  'Bilel','Lotfi','Imed','Mounir','Wassim','Achref','Zied','Aymen','Nabil',
  'Ridha','Foued','Ghassen','Bassem','Wissem','Amine','Mehdi','Youssef',
  'Abderrahim','Farouk','Chokri','Mokhtar','Samir','Hamdi','Faisal','Rami',
  'Tawfik','Adel','Brahim','Mondher','Abdelhamid','Hichem','Fehmi',
];

const PRENOMS_F = [
  'Fatma','Rania','Nadia','Sonia','Rim','Amina','Meryem','Ines','Asma',
  'Olfa','Lamia','Sihem','Najla','Hajer','Leila','Yasmine','Samia','Wafa',
  'Abir','Donia','Hana','Salma','Houda','Nour','Mariem','Emna','Zeineb',
  'Radhia','Takoua','Sabrine','Ghofrane','Afef','Imen','Amal','Hanene',
  'Mouna','Sonia','Jihene','Nesrine','Ahlem','Khadija','Boutheina','Sarra',
  'Maroua','Noura','Faten','Awatef','Najet','Saida','Intissar',
];

const GRADES = ['Assistant','Maître Assistant','Maître de Conférences','Professeur'];
const GRADE_WEIGHTS = [0.3, 0.4, 0.2, 0.1]; // probability weights

// ─── Domain → specialite enseignant ─────────────────────────────────────────
const DOMAIN_SPECS = [
  { keywords: ['islamique','coran','hadith','fiqh','soufisme'], spec: 'Lettres' },
  { keywords: ['langue arabe','littérature arabe','civilisation arabe','humanités arabes','études arabes'], spec: 'Lettres' },
  { keywords: ['langue française','littérature française','études françaises'], spec: 'Lettres' },
  { keywords: ['langue anglaise','littérature anglaise','études anglaises'], spec: 'Lettres' },
  { keywords: ['langues étrangères','langues appliquées','traduction','langues des affaires'], spec: 'Lettres' },
  { keywords: ['lettres et langues','lettres'], spec: 'Lettres' },
  { keywords: ['histoire'], spec: 'Histoire' },
  { keywords: ['géographie'], spec: 'Géographie' },
  { keywords: ['philosophie','psychologie','sociologie','sciences sociales','anthropologie'], spec: 'Lettres' },
  { keywords: ['sciences de l\'éducation','didactique'], spec: 'Lettres' },
  { keywords: ['intelligence artificielle','data science'], spec: 'Informatique' },
  { keywords: ['réseaux et cybersécurité','cybersécurité','télécommunication'], spec: 'Réseaux' },
  { keywords: ['génie logiciel','systèmes d\'information','ingénierie logicielle'], spec: 'Informatique' },
  { keywords: ['informatique'], spec: 'Informatique' },
  { keywords: ['multimédia','audiovisuel','cinéma','médias numériques','design numérique et jeux'], spec: 'Informatique' },
  { keywords: ['journalisme','communication'], spec: 'Lettres' },
  { keywords: ['design','arts plastiques','arts et médias','arts islamiques','musique','théâtre','art dramatique','artisanat'], spec: 'Lettres' },
  { keywords: ['architecture'], spec: 'Génie Civil' },
  { keywords: ['mathématiques-physique','maths-physique'], spec: 'Mathématiques' },
  { keywords: ['méthodes quantitatives','statistiques'], spec: 'Mathématiques' },
  { keywords: ['mathématiques'], spec: 'Mathématiques' },
  { keywords: ['physique-chimie'], spec: 'Physique' },
  { keywords: ['physique'], spec: 'Physique' },
  { keywords: ['chimie'], spec: 'Chimie' },
  { keywords: ['biologie','biotechnologie'], spec: 'Biologie' },
  { keywords: ['géologie'], spec: 'Biologie' },
  { keywords: ['environnement','écologie'], spec: 'Biologie' },
  { keywords: ['énergie','énergétique'], spec: 'Électrotechnique' },
  { keywords: ['génie civil'], spec: 'Génie Civil' },
  { keywords: ['génie électrique','électronique'], spec: 'Électrotechnique' },
  { keywords: ['génie mécanique','mécanique'], spec: 'Génie Mécanique' },
  { keywords: ['génie des procédés','procédés et matériaux'], spec: 'Chimie' },
  { keywords: ['génie industriel','technologies industrielles'], spec: 'Génie Mécanique' },
  { keywords: ['médecine','pharmacie','dentaire','odontologie','santé','paramédical','infirmier','obstétrique','kinésithérapie'], spec: 'Biologie' },
  { keywords: ['vétérinaire','sciences vétérinaires','santé animale'], spec: 'Biologie' },
  { keywords: ['agronomie','production végétale','production animale','sylviculture','pastoralisme','génie rural'], spec: 'Agronomie' },
  { keywords: ['sciences du sport','éducation physique','management du sport'], spec: 'Sciences' },
  { keywords: ['tourisme'], spec: 'Lettres' },
  { keywords: ['sciences de l\'information','bibliothèque','archivistique','documentation'], spec: 'Lettres' },
  { keywords: ['finance','comptabilité','fiscalité'], spec: 'Finance' },
  { keywords: ['management','ressources humaines','entrepreneuriat'], spec: 'Gestion' },
  { keywords: ['marketing','commerce'], spec: 'Marketing' },
  { keywords: ['économie'], spec: 'Économie' },
  { keywords: ['gestion'], spec: 'Gestion' },
  { keywords: ['droit'], spec: 'Droit' },
  { keywords: ['transport','logistique'], spec: 'Gestion' },
  { keywords: ['business','digital'], spec: 'Gestion' },
  { keywords: ['technologies appliquées','technologie et sciences'], spec: 'Sciences' },
  { keywords: ['textile','mode'], spec: 'Sciences' },
  { keywords: ['patrimoine','culture','sciences de la vie'], spec: 'Biologie' },
];

function domainSpec(nomDept) {
  const lower = nomDept.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const d of DOMAIN_SPECS) {
    for (const kw of d.keywords) {
      const kwn = kw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      if (lower.includes(kwn)) return d.spec;
    }
  }
  return 'Sciences';
}

function pickGrade() {
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < GRADES.length; i++) {
    cum += GRADE_WEIGHTS[i];
    if (r < cum) return GRADES[i];
  }
  return GRADES[1];
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

let ensCounter = 10000; // start well above existing IDs to avoid conflicts
function nextId() { return `ENS-NEW-${String(ensCounter++).padStart(6,'0')}`; }

// Track used CINs globally in memory to reduce collision chance
const usedCins = new Set();
function genCin() {
  let cin;
  do { cin = String(Math.floor(Math.random() * 90000000) + 10000000); } while (usedCins.has(cin));
  usedCins.add(cin);
  return cin;
}

function genEmail(prenom, nom, idx) {
  const p = prenom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g,'.').replace(/[^a-z.]/g,'');
  const n = nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g,'.').replace(/[^a-z.]/g,'');
  return `${p}.${n}${idx}@univ.tn`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const client = await pool.connect();
  console.log('Connected. Analyzing current state...');

  // Pre-load existing CINs to avoid duplicates
  const { rows: existingCins } = await client.query('SELECT cin FROM enseignant WHERE cin IS NOT NULL');
  existingCins.forEach(r => usedCins.add(r.cin));
  console.log(`Loaded ${usedCins.size} existing CINs.`);

  // Find the highest existing ENS-NEW counter to avoid PK collisions
  const { rows: maxId } = await client.query(`
    SELECT numero_utilisateur FROM utilisateur
    WHERE numero_utilisateur LIKE 'ENS-NEW-%'
    ORDER BY numero_utilisateur DESC LIMIT 1
  `);
  if (maxId.length > 0) {
    const parsed = parseInt(maxId[0].numero_utilisateur.replace('ENS-NEW-', ''), 10);
    if (!isNaN(parsed) && parsed >= ensCounter) {
      ensCounter = parsed + 1;
    }
  }
  console.log(`Starting ID counter at: ${ensCounter}`);

  // Get all departments with current teacher count
  const { rows: depts } = await client.query(`
    SELECT d.id_departement, d.nom_departement, d.id_etablissement,
           e.nom_etablissement,
           COALESCE(aff.cnt, 0) AS current_ens
    FROM departement d
    JOIN etablissement e ON e.id_etablissement = d.id_etablissement
    LEFT JOIN (
      SELECT id_departement, COUNT(DISTINCT numero_utilisateur) AS cnt
      FROM affectation WHERE statut = 'ACTIVE'
      GROUP BY id_departement
    ) aff ON aff.id_departement = d.id_departement
    WHERE COALESCE(aff.cnt, 0) < $1
    ORDER BY d.id_etablissement, d.id_departement
  `, [TARGET_PER_DEPT]);

  console.log(`Departments needing teachers: ${depts.length} (target: ${TARGET_PER_DEPT} each)`);

  let totalNewEns = 0;
  let totalNewAff = 0;

  try {
    await client.query('BEGIN');

    // Pre-hash a default password once
    const pwHash = await bcrypt.hash('Enseignant@2024', 10);

    for (const dept of depts) {
      const needed = TARGET_PER_DEPT - parseInt(dept.current_ens);
      const spec = domainSpec(dept.nom_departement);

      for (let k = 0; k < needed; k++) {
        const isFemale = Math.random() < 0.45;
        const prenom = isFemale ? pick(PRENOMS_F) : pick(PRENOMS_H);
        const nom = pick(NOMS);
        const sexe = isFemale ? 'FEMME' : 'HOMME';
        const grade = pickGrade();
        const id = nextId();
        const email = genEmail(prenom, nom, ensCounter);
        const tel = `+216 ${String(Math.floor(Math.random()*90000000+10000000)).slice(0,8)}`;

        // Insert utilisateur
        await client.query(`
          INSERT INTO utilisateur
            (numero_utilisateur, nom, prenom, email, mot_de_passe, telephone, sexe, statut, date_creation, type_utilisateur)
          VALUES ($1,$2,$3,$4,$5,$6,$7,'ACTIF',NOW(),'ENSEIGNANT')
        `, [id, nom, prenom, email, pwHash, tel, sexe]);

        // Insert enseignant
        const cin = genCin();
        const yearsExp = Math.floor(Math.random() * 20) + 1;
        const recrutYear = 2024 - yearsExp;
        const recrutDate = `${recrutYear}-09-01`;
        await client.query(`
          INSERT INTO enseignant
            (numero_utilisateur, numero_enseignant, cin, grade, date_recrutement, specialite, annees_experience, id_etablissement_principal)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `, [id, id, cin, grade, recrutDate, spec, yearsExp, dept.id_etablissement]);

        // Insert affectation
        await client.query(`
          INSERT INTO affectation
            (numero_utilisateur, id_etablissement, id_departement, date_debut, date_fin,
             charge_horaire, type_affectation, statut)
          VALUES ($1,$2,$3,'2024-09-01','2027-08-31',$4,'ENSEIGNANT_PERMANENT','ACTIVE')
        `, [id, dept.id_etablissement, dept.id_departement, Math.floor(Math.random()*6)+12]);

        totalNewEns++;
        totalNewAff++;
      }
    }

    await client.query('COMMIT');
    console.log(`\n✓ Created ${totalNewEns} new teachers and ${totalNewAff} affectations.`);

    // Final stats
    const { rows: finalStats } = await client.query(`
      SELECT
        COUNT(DISTINCT d.id_departement) FILTER(WHERE COALESCE(aff.cnt,0)=0) AS still_zero,
        AVG(COALESCE(aff.cnt,0))::numeric(5,1) AS new_avg
      FROM departement d
      LEFT JOIN (
        SELECT id_departement, COUNT(DISTINCT numero_utilisateur) cnt
        FROM affectation WHERE statut='ACTIVE' GROUP BY id_departement
      ) aff ON aff.id_departement=d.id_departement
    `);
    console.log('Remaining depts with 0 teachers:', finalStats[0].still_zero);
    console.log('New average teachers/dept:', finalStats[0].new_avg);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ERROR — rolled back:', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

main();
