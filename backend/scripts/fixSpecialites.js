/**
 * Fix specialite names across all departments to match their domain.
 * Specialties are keyed by domain keywords found in nom_departement.
 * Each domain has a pool of realistic Tunisian higher-ed specialty names.
 * Names are deduplicated by appending a suffix derived from the dept ID.
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

// ─── Domain catalogue ────────────────────────────────────────────────────────
// Each entry: { keywords: [...], specs: [...licence/master names...] }
// Keywords are tested in ORDER — first match wins.
// specs is a flat list; we cycle through them when a dept has more specialites
// than entries. Master specialties are prefixed with "Master " already.

const DOMAINS = [
  // === ISLAMIQUE ===
  {
    keywords: ['islamique', 'islamiques', 'coran', 'hadith', 'soufisme', 'patrimoine manuscrit', 'sharia', 'fiqh'],
    specs: [
      'Études Islamiques et Jurisprudence',
      'Langue et Civilisation Arabes Classiques',
      'Histoire et Patrimoine Islamique',
      'Coran et Sciences du Coran',
      'Master Études Islamiques Avancées',
      'Hadith et Sunna Prophétique',
      'Fiqh et Usûl al-Fiqh',
      'Master Islamologie Comparée',
    ],
  },
  // === ARABE ===
  {
    keywords: ['langue arabe', 'littérature arabe', 'civilisation arabes', 'humanités arabes', 'études arabes', 'civilisation arabe'],
    specs: [
      'Langue et Littérature Arabes Classiques',
      'Langue et Littérature Arabes Modernes',
      'Linguistique Arabe et Stylistique',
      'Traduction Arabe et Communication',
      'Master Linguistique et Littérature Arabes',
      'Rhétorique et Poésie Arabe',
      'Didactique de la Langue Arabe',
    ],
  },
  // === FRANÇAIS ===
  {
    keywords: ['langue française', 'littérature française', 'français professionnel', 'études françaises', 'civilisation françaises'],
    specs: [
      'Langue et Littérature Françaises',
      'Français des Affaires et FOS',
      'Linguistique et Didactique du FLE',
      'Traduction Français-Arabe',
      'Master Études Françaises Appliquées',
      'Littérature Contemporaine Francophone',
      'Communication et Médias en Français',
    ],
  },
  // === ANGLAIS ===
  {
    keywords: ['langue anglaise', 'littérature anglaise', 'anglais professionnel', 'études anglaises', 'civilisation anglaises'],
    specs: [
      'Langue et Littérature Anglaises',
      'Anglais des Affaires et Traduction',
      'Anglais Général et Communication',
      'Linguistique Anglaise et Stylistique',
      'Master Traduction et Interprétation',
      'Littérature Britannique et Américaine',
      'Anglais pour les Sciences et les Technologies',
    ],
  },
  // === LANGUES ÉTRANGÈRES / MULTILINGUES ===
  {
    keywords: ['langues étrangères', 'langues appliquées', 'langues et informatique', 'traduction', 'multilinguisme', 'allemand', 'espagnol', 'italien', 'arabe pour non'],
    specs: [
      'Allemand Professionnel et Traduction',
      'Espagnol Professionnel et Traduction',
      'Italien des Affaires et Traduction',
      'Langues Appliquées et Informatique',
      'Master Traduction Multilingue',
      'Communication Interculturelle',
      'Interprétation de Conférence',
    ],
  },
  // === LETTRES & LANGUES (générique) ===
  {
    keywords: ['lettres et langues', 'langues et'],
    specs: [
      'Lettres Arabes pour l\'Enseignement',
      'Lettres Françaises pour l\'Enseignement',
      'Langue et Communication Professionnelle',
      'Master Sciences du Langage',
      'Traduction Spécialisée',
    ],
  },
  // === HISTOIRE ===
  {
    keywords: ['histoire et', 'histoire islamique', 'histoire politique', 'histoire culturelle'],
    specs: [
      'Histoire Ancienne et Médiévale',
      'Histoire Moderne et Contemporaine',
      'Histoire Contemporaine Tunisie',
      'Histoire et Civilisation Islamique',
      'Master Histoire et Patrimoine',
      'Archives Nationales et Mémoire',
      'Histoire Politique et Sociale',
    ],
  },
  // === HISTOIRE seul ===
  {
    keywords: ['histoire'],
    specs: [
      'Histoire Ancienne et Médiévale',
      'Histoire Contemporaine',
      'Master Histoire et Patrimoine',
    ],
  },
  // === GÉOGRAPHIE ===
  {
    keywords: ['géographie et', 'géographie humaine', 'géographie physique', 'aménagement du territoire', 'urbanisme et environnement', 'urbanisme et sig', 'urbanisme et territoire'],
    specs: [
      'Géographie Physique et Environnement',
      'Géographie Humaine et Urbaine',
      'Cartographie et SIG',
      'Aménagement du Territoire',
      'Master SIG et Développement Territorial',
      'Géographie Rurale et Développement',
      'Environnement et Risques Naturels',
    ],
  },
  // === GÉOGRAPHIE seule ===
  {
    keywords: ['géographie'],
    specs: [
      'Géographie Physique et Environnement',
      'Géographie Humaine et Aménagement',
      'Master Aménagement et SIG',
    ],
  },
  // === PHILOSOPHIE ===
  {
    keywords: ['philosophie et', 'philosophie générale', 'philosophie des sciences', 'philosophie'],
    specs: [
      'Philosophie Générale et Éthique',
      'Philosophie des Sciences et Épistémologie',
      'Logique et Philosophie du Langage',
      'Philosophie Politique et Sociale',
      'Master Philosophie et Société',
    ],
  },
  // === PSYCHOLOGIE ===
  {
    keywords: ['psychologie'],
    specs: [
      'Psychologie Clinique',
      'Psychologie Sociale et du Travail',
      'Psychologie du Développement',
      'Neuropsychologie',
      'Master Psychologie Clinique',
      'Psychologie de l\'Éducation',
    ],
  },
  // === SOCIOLOGIE ===
  {
    keywords: ['sociologie', 'sciences sociales', 'anthropologie'],
    specs: [
      'Sociologie des Organisations',
      'Sociologie Urbaine et Rurale',
      'Anthropologie et Sciences Sociales',
      'Communication et Médias',
      'Master Sciences Sociales Appliquées',
      'Études Culturelles et Genre',
    ],
  },
  // === SCIENCES DE L'ÉDUCATION ===
  {
    keywords: ['sciences de l\'éducation', 'didactique', 'formation des enseignants'],
    specs: [
      'Didactique et Formation des Enseignants',
      'Sciences de l\'Éducation',
      'Pédagogie et Ingénierie de Formation',
      'Master Sciences de l\'Éducation',
    ],
  },
  // === IA / DATA SCIENCE ===
  {
    keywords: ['intelligence artificielle', 'data science', 'ia et', 'apprentissage automatique', 'machine learning'],
    specs: [
      'Intelligence Artificielle et Machine Learning',
      'Data Science et Big Data',
      'Vision par Ordinateur et Traitement d\'Image',
      'Traitement du Langage Naturel',
      'Master IA et Big Data',
      'Deep Learning et Réseaux de Neurones',
      'IA Embarquée et Edge Computing',
      'Master IA et Cybersécurité',
    ],
  },
  // === RÉSEAUX / CYBERSÉCURITÉ ===
  {
    keywords: ['réseaux et cybersécurité', 'cybersécurité', 'télécommunications et réseaux', 'réseaux et télécoms', 'télécommunication'],
    specs: [
      'Réseaux et Télécommunications',
      'Cybersécurité et Cryptographie',
      'IoT et Réseaux Intelligents',
      'Administration des Réseaux et Cloud',
      'Master Cybersécurité Avancée',
      'Réseaux Mobiles et 5G',
      'Sécurité des Systèmes d\'Information',
    ],
  },
  // === GÉNIE LOGICIEL / SI ===
  {
    keywords: ['génie logiciel', 'systèmes d\'information', 'ingénierie logicielle'],
    specs: [
      'Génie Logiciel et Architecture SI',
      'Développement Web et Applications',
      'Ingénierie des Exigences et Tests',
      'DevOps et Intégration Continue',
      'Master Génie Logiciel Avancé',
      'Architecture Microservices et Cloud',
      'Qualité Logicielle et Méthodes Agiles',
    ],
  },
  // === INFORMATIQUE (générique) ===
  {
    keywords: ['informatique et réseaux', 'informatique fondamentale', 'informatique de gestion', 'informatique décisionnelle', 'génie informatique', 'informatique industrielle', 'technologies informatiques', 'technologies de l\'information', 'informatique'],
    specs: [
      'Informatique Générale',
      'Développement Logiciel',
      'Réseaux et Sécurité Informatique',
      'Systèmes Embarqués et IoT',
      'Master Intelligence Artificielle',
      'Développement Web et Mobile',
      'Base de Données et Data Engineering',
      'Master Génie Informatique',
    ],
  },
  // === MULTIMÉDIA / AUDIOVISUEL ===
  {
    keywords: ['multimédia', 'audiovisuel', 'cinéma', 'médias numériques', 'arts du multimédia', 'communication numérique', 'design numérique et jeux'],
    specs: [
      'Multimédia et Développement Web',
      'Production Audiovisuelle et Numérique',
      'Animation 2D/3D et Effets Spéciaux',
      'Design Numérique et Interfaces',
      'Master Médias et Création Numérique',
      'Jeux Vidéo et Réalité Virtuelle',
      'Communication Visuelle et Branding',
    ],
  },
  // === JOURNALISME / COMMUNICATION ===
  {
    keywords: ['journalisme', 'communication numérique et web', 'communication et médias', 'information et communication'],
    specs: [
      'Journalisme Écrit et Investigation',
      'Journalisme Audiovisuel et Numérique',
      'Communication Institutionnelle et RP',
      'Médias Numériques et Community Management',
      'Master Journalisme Avancé',
      'Communication Stratégique et Digitale',
    ],
  },
  // === DESIGN ===
  {
    keywords: ['design graphique', 'design industriel', 'design de mode', 'design et arts'],
    specs: [
      'Design Graphique et Communication Visuelle',
      'Design d\'Intérieur et Décoration',
      'Design Industriel et Éco-Conception',
      'Design de Mode et Textile',
      'Master Design et Innovation',
      'Design Numérique et Interactif',
      'Design Environnemental et Urbain',
    ],
  },
  // === ARTS PLASTIQUES ===
  {
    keywords: ['arts plastiques', 'arts et patrimoine', 'arts islamiques'],
    specs: [
      'Arts Plastiques et Peinture',
      'Sculpture et Céramique',
      'Design Graphique et Illustration',
      'Calligraphie et Arts Décoratifs',
      'Master Arts Créatifs et Patrimoine',
    ],
  },
  // === MUSIQUE ===
  {
    keywords: ['musique', 'musicologie'],
    specs: [
      'Musique Arabe et Maqâm',
      'Musicologie et Histoire de la Musique',
      'Composition et Arrangement',
      'Ethnomusicologie et Patrimoine Musical',
      'Master Musicologie',
    ],
  },
  // === ARCHITECTURE ===
  {
    keywords: ['architecture et projet', 'architecture et patrimoine', 'architecture'],
    specs: [
      'Architecture et Habitat',
      'Architecture Durable et Bioclimatique',
      'Architecture du Patrimoine et Restauration',
      'Urbanisme et Aménagement',
      'Master Architecture et Patrimoine',
    ],
  },
  // === MATHÉMATIQUES ===
  {
    keywords: ['mathématiques et physique', 'mathématiques-physique', 'maths-physique'],
    specs: [
      'Mathématiques-Physique (Licence)',
      'Analyse et Algèbre',
      'Mécanique Rationnelle',
      'Master Mathématiques et Physique',
    ],
  },
  {
    keywords: ['méthodes quantitatives', 'statistiques et actuariat', 'statistiques', 'statistiques de gestion'],
    specs: [
      'Statistiques et Analyse de Données',
      'Actuariat et Gestion des Risques',
      'Mathématiques Financières',
      'Master Méthodes Quantitatives',
      'Data Analytics et Modélisation',
    ],
  },
  {
    keywords: ['mathématiques'],
    specs: [
      'Mathématiques Pures',
      'Mathématiques Appliquées',
      'Algèbre et Géométrie',
      'Master Mathématiques Fondamentales',
      'Analyse Fonctionnelle',
    ],
  },
  // === PHYSIQUE-CHIMIE ===
  {
    keywords: ['physique-chimie', 'physique et chimie'],
    specs: [
      'Physique-Chimie (Licence)',
      'Physique des Matériaux',
      'Chimie Physique',
      'Master Physique-Chimie',
    ],
  },
  // === PHYSIQUE ===
  {
    keywords: ['physique'],
    specs: [
      'Physique Fondamentale',
      'Physique des Matériaux',
      'Optique et Photonique',
      'Master Physique de la Matière Condensée',
      'Physique Théorique et Modélisation',
    ],
  },
  // === CHIMIE ===
  {
    keywords: ['chimie'],
    specs: [
      'Chimie Organique',
      'Chimie Analytique et Physico-Chimie',
      'Chimie des Matériaux',
      'Chimie Médicinale et Pharmacologie',
      'Master Chimie Avancée',
    ],
  },
  // === BIOLOGIE + GÉOLOGIE ===
  {
    keywords: ['biologie et géologie', 'biologie appliquée', 'biologie'],
    specs: [
      'Biologie Cellulaire et Moléculaire',
      'Microbiologie et Immunologie',
      'Biologie Végétale et Environnement',
      'Biochimie et Biologie Structurale',
      'Master Biotechnologies',
      'Physiologie Animale',
      'Génétique et Biologie du Développement',
    ],
  },
  // === GÉOLOGIE ===
  {
    keywords: ['géologie'],
    specs: [
      'Géologie Structurale et Sédimentologie',
      'Hydrogéologie et Ressources en Eau',
      'Géologie des Ressources Minières',
      'Master Géologie Appliquée',
    ],
  },
  // === BIOTECHNOLOGIE ===
  {
    keywords: ['biotechnologie'],
    specs: [
      'Biotechnologie Moléculaire et Génomique',
      'Biotechnologie Microbienne Appliquée',
      'Biotechnologie Vétérinaire et Animale',
      'Bioremédiation et Environnement',
      'Master Biotechnologies Avancées',
      'Bioproduction et Fermentation',
    ],
  },
  // === ENVIRONNEMENT ===
  {
    keywords: ['environnement', 'écologie', 'biotechnologie environnementale'],
    specs: [
      'Sciences de l\'Environnement',
      'Gestion des Ressources Naturelles',
      'Éco-Toxicologie et Risques Environnementaux',
      'Master Gestion Environnementale',
      'Développement Durable et Énergie Renouvelable',
    ],
  },
  // === ÉNERGIE ===
  {
    keywords: ['énergie', 'énergétique'],
    specs: [
      'Énergie Solaire et Photovoltaïque',
      'Énergie Éolienne et Efficacité Énergétique',
      'Réseaux Électriques Intelligents',
      'Master Énergétique et Développement Durable',
    ],
  },
  // === GÉNIE CIVIL ===
  {
    keywords: ['génie civil et mines', 'génie civil et environnement', 'génie civil'],
    specs: [
      'Génie Civil et Structures',
      'Hydraulique et Géotechnique',
      'Béton Armé et Constructions',
      'Topographie et SIG',
      'Master Génie Civil Avancé',
      'Géotechnique et Fondations',
    ],
  },
  // === GÉNIE ÉLECTRIQUE ===
  {
    keywords: ['génie électrique et automatique', 'génie électrique et télécommunications', 'génie électrique'],
    specs: [
      'Électrotechnique et Automatique',
      'Électronique et Communications',
      'Automatisme et Robotique',
      'Systèmes Électriques Intelligents',
      'Master Génie Électrique',
      'Télécommunications et Réseaux',
    ],
  },
  // === GÉNIE MÉCANIQUE ===
  {
    keywords: ['génie mécanique', 'mécanique'],
    specs: [
      'Mécanique des Solides et Construction',
      'Énergétique et Thermique',
      'Mécatronique et Robotique',
      'Production Industrielle',
      'Master Génie Mécanique',
      'Dynamique des Fluides',
    ],
  },
  // === GÉNIE DES PROCÉDÉS ===
  {
    keywords: ['génie des procédés', 'procédés et matériaux'],
    specs: [
      'Génie Chimique et Procédés',
      'Science des Matériaux',
      'Génie de l\'Environnement et Procédés',
      'Master Génie des Procédés Avancé',
    ],
  },
  // === GÉNIE INDUSTRIEL ===
  {
    keywords: ['génie industriel', 'technologies industrielles', 'management des systèmes de production'],
    specs: [
      'Génie Industriel et Maintenance',
      'Automatisme et Systèmes de Production',
      'Lean Manufacturing et Qualité',
      'Logistique et Supply Chain',
      'Master Génie Industriel Avancé',
      'Systèmes de Production Intelligents',
    ],
  },
  // === MÉDECINE ===
  {
    keywords: ['médecine fondamentale', 'médecine clinique', 'chirurgie', 'pédiatrie', 'ophtalmologie'],
    specs: [
      'Médecine Générale',
      'Médecine Spécialisée - Résidanat',
      'Médecine de Famille et Urgences',
      'Sciences Biomédicales Fondamentales',
      'Master Sciences Médicales',
    ],
  },
  // === PHARMACIE ===
  {
    keywords: ['pharmacie', 'pharmacologie', 'pharmacognosie', 'pharmaceutiques'],
    specs: [
      'Sciences Pharmaceutiques',
      'Pharmacologie et Thérapeutique',
      'Pharmacognosie et Phytochimie',
      'Pharmacie Clinique et Hospitalière',
      'Master Pharmacie Avancée',
    ],
  },
  // === DENTAIRE ===
  {
    keywords: ['odontologie', 'dentaire', 'stomatologie', 'orthodontie'],
    specs: [
      'Odontologie Conservatrice et Endodontie',
      'Chirurgie Dentaire et Implantologie',
      'Orthodontie et Parodontologie',
      'Master Sciences Dentaires',
    ],
  },
  // === SANTÉ PUBLIQUE ===
  {
    keywords: ['santé publique', 'médecine préventive', 'épidémiologie'],
    specs: [
      'Épidémiologie et Santé Communautaire',
      'Hygiène et Santé Environnementale',
      'Master Sciences Biomédicales',
      'Médecine du Travail et Prévention',
    ],
  },
  // === PARAMÉDICAL ===
  {
    keywords: ['radiologie', 'imagerie', 'kinésithérapie', 'réadaptation', 'analyses biomédicales', 'sciences paramédicales', 'sciences de la santé', 'soins de santé', 'techniques de soins'],
    specs: [
      'Radiologie et Imagerie Diagnostique',
      'Analyses de Biologie Médicale',
      'Kinésithérapie et Réhabilitation',
      'Soins Infirmiers en Urgence',
      'Master Sciences Paramédicales',
      'Orthophonie et Audiologie',
    ],
  },
  // === SCIENCES INFIRMIÈRES ===
  {
    keywords: ['sciences infirmières', 'soins infirmiers'],
    specs: [
      'Soins Infirmiers Généraux',
      'Soins Infirmiers en Chirurgie',
      'Soins Infirmiers en Pédiatrie',
      'Master Infirmier Spécialisé',
    ],
  },
  // === OBSTÉTRIQUE ===
  {
    keywords: ['obstétrique', 'maternité', 'sage-femme'],
    specs: [
      'Sage-Femme et Soins Obstétricaux',
      'Soins Néonatals et Pédiatriques',
      'Maternité et Périnatalité',
    ],
  },
  // === VÉTÉRINAIRE ===
  {
    keywords: ['vétérinaire', 'sciences vétérinaires', 'médecine vétérinaire', 'santé animale', 'zoonoses', 'biotechnologie animale'],
    specs: [
      'Médecine Vétérinaire des Animaux de Compagnie',
      'Médecine Vétérinaire des Animaux de Rente',
      'Santé Publique Vétérinaire',
      'Biotechnologie Vétérinaire et Animale',
      'Master Sciences Vétérinaires Avancées',
      'Pathologie et Microbiologie Vétérinaires',
    ],
  },
  // === AGRONOMIE ===
  {
    keywords: ['agronomie', 'oléicole', 'huile d\'olive', 'production végétale', 'horticulture'],
    specs: [
      'Agronomie et Production Végétale',
      'Oléiculture et Agronomie Méditerranéenne',
      'Sciences et Qualité de l\'Huile d\'Olive',
      'Horticulture et Paysagisme',
      'Master Agronomie Durable',
    ],
  },
  // === SCIENCES DU SPORT ===
  {
    keywords: ['sciences du sport', 'éducation physique', 'management du sport', 'activités physiques'],
    specs: [
      'Sciences du Sport et Performance',
      'Éducation Physique Scolaire',
      'Entraînement Sportif',
      'Management Sportif',
      'Master Sport et Santé',
      'Activités Physiques Adaptées',
    ],
  },
  // === TOURISME ===
  {
    keywords: ['tourisme', 'hôtellerie'],
    specs: [
      'Guide Touristique et Patrimoine',
      'Gestion des Sites Patrimoniaux',
      'Hôtellerie et Restauration',
      'Master Patrimoine et Développement',
      'Écotourisme et Tourisme Durable',
    ],
  },
  // === SCIENCES DE L'INFORMATION ===
  {
    keywords: ['sciences de l\'information', 'bibliothèques numériques', 'bibliothéconomie', 'archivistique', 'documentation', 'knowledge management'],
    specs: [
      'Bibliothéconomie et Bibliothèques Numériques',
      'Archivistique et Gestion Documentaire',
      'Knowledge Management et Veille',
      'Data Curation et Données de Recherche',
      'Master Sciences de l\'Information',
      'Information et Numérique',
    ],
  },
  // === FINANCE / COMPTABILITÉ ===
  {
    keywords: ['finance et comptabilité', 'comptabilité et gestion', 'comptabilité et audit', 'finance et banque', 'finance et administration'],
    specs: [
      'Finance d\'Entreprise',
      'Comptabilité et Audit',
      'Banque et Marchés Financiers',
      'Fiscalité et Contrôle de Gestion',
      'Master Finance Avancée',
      'Comptabilité et Finance',
      'Audit Légal et Contrôle',
    ],
  },
  // === MANAGEMENT / GRH ===
  {
    keywords: ['management et ressources humaines', 'management et rh', 'ressources humaines', 'management et stratégie', 'management et entrepreneuriat', 'management et marketing'],
    specs: [
      'Management des Organisations',
      'GRH et Développement Organisationnel',
      'Management Stratégique et Innovation',
      'Entrepreneuriat et Création d\'Entreprise',
      'Master Management Avancé',
      'Leadership et Coaching',
    ],
  },
  // === MARKETING ===
  {
    keywords: ['marketing et commerce', 'marketing et communication', 'commerce international', 'commerce électronique', 'commerce et affaires'],
    specs: [
      'Marketing et Communication',
      'Commerce International',
      'Marketing Digital et E-Commerce',
      'Distribution et Logistique Commerciale',
      'Master Marketing Avancé',
      'Négociation et Vente',
    ],
  },
  // === ÉCONOMIE ===
  {
    keywords: ['sciences économiques', 'économie et méthodes', 'économie appliquée', 'économie'],
    specs: [
      'Économie du Développement',
      'Économie et Finance Internationale',
      'Macroéconomie et Politique Économique',
      'Microéconomie et Théorie des Marchés',
      'Master Économétrie et Modélisation',
      'Économie Régionale et Locale',
    ],
  },
  // === GESTION (générique) ===
  {
    keywords: ['gestion et finance', 'gestion des entreprises', 'administration des affaires', 'gestion'],
    specs: [
      'Gestion des Entreprises',
      'Comptabilité et Finance',
      'Ressources Humaines',
      'Marketing et Vente',
      'Master Management Stratégique',
      'Administration des Affaires',
    ],
  },
  // === ENTREPRENEURIAT ===
  {
    keywords: ['entrepreneuriat'],
    specs: [
      'Entrepreneuriat et Startups',
      'Innovation et Management de Projet',
      'Commerce Électronique et Digital',
      'Master Entrepreneuriat Avancé',
    ],
  },
  // === DROIT PRIVÉ ===
  {
    keywords: ['droit privé', 'droit civil', 'droit commercial'],
    specs: [
      'Droit Civil et Obligations',
      'Droit Commercial et des Affaires',
      'Droit de la Famille et des Personnes',
      'Droit des Contrats et Responsabilité',
      'Master Droit Privé des Affaires',
    ],
  },
  // === DROIT PUBLIC ===
  {
    keywords: ['droit public', 'sciences politiques', 'droit international'],
    specs: [
      'Droit Constitutionnel',
      'Droit Administratif',
      'Droit International Public',
      'Sciences Politiques et Relations Internationales',
      'Master Gouvernance et Droit Public',
    ],
  },
  // === DROIT (générique) ===
  {
    keywords: ['droit et administration', 'droit'],
    specs: [
      'Droit Général et Institutions',
      'Droit Commercial et Administratif',
      'Master Droit des Affaires',
    ],
  },
  // === SCIENCES NATURELLES (générique) ===
  {
    keywords: ['sciences naturelles', 'sciences de la nature'],
    specs: [
      'Biologie et Géologie',
      'Sciences de la Vie et de la Terre',
      'Environnement et Biodiversité',
    ],
  },
  // === SCIENCES ET TECHNOLOGIES (générique) ===
  {
    keywords: ['sciences et technologies', 'sciences et techniques'],
    specs: [
      'Sciences et Technologies Appliquées',
      'Physique-Chimie Appliquée',
      'Mathématiques et Informatique',
    ],
  },
  // === TECHNOLOGIES DU BÂTIMENT ===
  {
    keywords: ['bâtiment', 'construction'],
    specs: [
      'Technologies du Bâtiment',
      'Réhabilitation et Construction Durable',
      'Génie Civil et BTP',
      'Master Construction et Environnement',
    ],
  },
  // === ÉLECTRONIQUE ===
  {
    keywords: ['électronique et traitement', 'électronique'],
    specs: [
      'Électronique et Microélectronique',
      'Traitement du Signal et Image',
      'Systèmes Embarqués et Électronique',
      'Master Électronique Avancée',
    ],
  },
  // === MATHS-PHYSIQUE PRÉPA (générique) ===
  {
    keywords: ['mathématiques-physique', 'maths-physique'],
    specs: [
      'Mathématiques-Physique',
      'Analyse et Algèbre',
      'Mécanique et Thermodynamique',
    ],
  },
  // === THÉÂTRE / ART DRAMATIQUE ===
  {
    keywords: ['théâtre', 'art dramatique', 'mise en scène', 'arts du spectacle'],
    specs: [
      'Art Dramatique et Mise en Scène',
      'Théâtre et Performance',
      'Scénographie et Dramaturgie',
      'Écriture Dramatique',
      'Master Arts de la Scène',
    ],
  },
  // === PATRIMOINE / CULTURE ===
  {
    keywords: ['sciences du patrimoine', 'sciences de la culture', 'artisanat', 'patrimoine et'],
    specs: [
      'Patrimoine Culturel et Muséologie',
      'Conservation et Restauration du Patrimoine',
      'Tourisme et Patrimoine',
      'Artisanat et Métiers d\'Art',
      'Master Gestion du Patrimoine',
    ],
  },
  // === ANIMATION SOCIOCULTURELLE ===
  {
    keywords: ['animation socioculturelle', 'animation sociale'],
    specs: [
      'Animation Socioculturelle',
      'Développement Social et Communautaire',
      'Master Animation Socioculturelle',
    ],
  },
  // === BUSINESS ADMINISTRATION ===
  {
    keywords: ['business administration', 'digital business'],
    specs: [
      'Management et Administration des Affaires',
      'Finance d\'Entreprise',
      'Marketing International',
      'Entrepreneuriat et Innovation',
      'MBA Management International',
    ],
  },
  // === GÉNIE TEXTILE ===
  {
    keywords: ['génie textile', 'technologie textile', 'design de mode', 'design et mode', 'mode'],
    specs: [
      'Génie Textile et Matériaux Souples',
      'Design de Mode et Stylisme',
      'Technologie de la Confection',
      'Teinture et Finissage des Textiles',
      'Master Design Textile et Mode',
    ],
  },
  // === AGRONOMIE ÉTENDUE (productions végétales, animales, forêts) ===
  {
    keywords: ['productions végétales', 'productions animales', 'élevage', 'génie rural', 'hydraulique et génie', 'génie agro', 'sylviculture', 'forêts', 'pastoralisme', 'agropastoralisme'],
    specs: [
      'Productions Végétales et Grandes Cultures',
      'Productions Animales et Élevage',
      'Hydraulique Rurale et Génie Rural',
      'Génie Agro-Industriel',
      'Sylviculture et Gestion des Forêts',
      'Pastoralisme et Développement Agropastoral',
      'Master Agronomie et Développement Durable',
    ],
  },
  // === TECHNOLOGIES APPLIQUÉES / ISET GÉNÉRIQUE ===
  {
    keywords: ['technologies appliquées', 'technologie et sciences de l\'ingénieur'],
    specs: [
      'Technologie et Sciences de l\'Ingénieur',
      'Électronique Appliquée',
      'Mécanique Appliquée',
      'Informatique Appliquée',
      'Master Technologies Avancées',
    ],
  },
  // === SCIENCES DE LA VIE ET DE LA TERRE ===
  {
    keywords: ['sciences de la vie et de la terre'],
    specs: [
      'Biologie et Géologie',
      'Sciences de la Vie',
      'Sciences de la Terre et de l\'Environnement',
    ],
  },
  // === LANGUES DES AFFAIRES ===
  {
    keywords: ['langues des affaires', 'langues appliquées'],
    specs: [
      'Anglais des Affaires et Traduction',
      'Français des Affaires et Communication',
      'Arabe des Affaires et Rédaction',
      'Master Langues et Commerce International',
    ],
  },
  // === PARAMÉDICAL GÉNÉRIQUE ===
  {
    keywords: ['techniques paramédicales', 'paramédical'],
    specs: [
      'Techniques Médicales et Paramédicales',
      'Soins Paramédicaux Généraux',
      'Imagerie Médicale et Radiologie',
      'Master Paramédical Spécialisé',
    ],
  },
  // === FINANCE SIMPLE ===
  {
    keywords: ['finance'],
    specs: [
      'Finance d\'Entreprise',
      'Marchés Financiers',
      'Finance Internationale',
      'Master Finance Avancée',
    ],
  },
  // === FISCALITÉ ===
  {
    keywords: ['fiscalité', 'fiscalite'],
    specs: [
      'Fiscalité et Contrôle de Gestion',
      'Comptabilité et Droit Fiscal',
      'Audit et Expertise Comptable',
      'Master Comptabilité et Fiscalité',
    ],
  },
  // === TECHNOLOGIES DE COMMUNICATION ===
  {
    keywords: ['technologies de communication', 'communication numérique'],
    specs: [
      'Communication Numérique et Réseaux',
      'Technologies Multimédias',
      'E-Communication et Community Management',
      'Master Médias et Communication Digitale',
    ],
  },
  // === TRANSPORT / LOGISTIQUE ===
  {
    keywords: ['transport et logistique', 'transport', 'logistique'],
    specs: [
      'Transport et Logistique',
      'Gestion de la Chaîne Logistique',
      'Commerce et Transport International',
      'Master Supply Chain Management',
    ],
  },
  // === MARKETING DIGITAL / DIGITAL ===
  {
    keywords: ['marketing digital et commerce', 'marketing digital'],
    specs: [
      'Marketing Digital et E-Commerce',
      'Marketing des Réseaux Sociaux',
      'Data-Driven Marketing',
      'Master Marketing Digital Avancé',
    ],
  },
  // === ARTS & MÉDIAS ===
  {
    keywords: ['arts et médias', 'arts, médias'],
    specs: [
      'Arts Plastiques et Médias',
      'Production Médiatique et Audiovisuelle',
      'Photographie et Image Numérique',
      'Master Arts et Industries Culturelles',
    ],
  },
  // === DESIGN GÉNÉRIQUE ===
  {
    keywords: ['design'],
    specs: [
      'Design Graphique et Identité Visuelle',
      'Design d\'Intérieur et Architecture',
      'Design Numérique et Interactif',
      'Illustration et Arts Appliqués',
      'Master Design Créatif',
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function classifyDomain(nomDept) {
  const lower = nomDept.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const domain of DOMAINS) {
    for (const kw of domain.keywords) {
      const kwNorm = kw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      if (lower.includes(kwNorm)) return domain;
    }
  }
  return null;
}

function generateCode(name, deptId, idx) {
  const words = name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z\s]/g, '')
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean);
  const abbr = words.slice(0, 3).map(w => w[0]).join('');
  return `${abbr}-D${deptId}-${idx + 1}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const client = await pool.connect();
  try {
    // Get all departments with their speciality IDs (ordered)
    const { rows: depts } = await client.query(`
      SELECT d.id_departement, d.nom_departement,
             array_agg(s.id_specialite ORDER BY s.id_specialite) AS spec_ids
      FROM departement d
      JOIN niveau n ON n.id_departement = d.id_departement
      JOIN specialite s ON s.id_niveau = n.id_niveau
      GROUP BY d.id_departement, d.nom_departement
      ORDER BY d.id_departement
    `);

    console.log(`Found ${depts.length} departments to process.`);

    let updated = 0;
    let skipped = 0;
    const unmatched = [];

    await client.query('BEGIN');

    for (const dept of depts) {
      const domain = classifyDomain(dept.nom_departement);
      if (!domain) {
        unmatched.push(dept.nom_departement);
        skipped++;
        continue;
      }

      const specIds = dept.spec_ids;
      for (let i = 0; i < specIds.length; i++) {
        // Cycle through domain specs if more specs than pool names
        const specName = domain.specs[i % domain.specs.length];
        const suffix = specIds.length > domain.specs.length
          ? ` (${String.fromCharCode(65 + Math.floor(i / domain.specs.length))})`
          : '';
        const finalName = specName + suffix;
        const code = generateCode(finalName, dept.id_departement, i);

        await client.query(
          'UPDATE specialite SET nom_specialite = $1, code_specialite = $2 WHERE id_specialite = $3',
          [finalName, code, specIds[i]]
        );
        updated++;
      }
    }

    await client.query('COMMIT');

    console.log(`\n✓ Updated ${updated} specialties.`);
    console.log(`  Skipped ${skipped} departments (no domain match).`);
    if (unmatched.length) {
      console.log('\nUnmatched departments:');
      unmatched.forEach(n => console.log('  -', n));
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error — rolled back:', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

main();
