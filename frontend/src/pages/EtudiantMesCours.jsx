import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip,
  CircularProgress, Tabs, Tab, Avatar, IconButton, Tooltip,
} from '@mui/material';
import { School, MenuBook, Person, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const C = {
  primary: '#1A3A6B',
  blue: '#4D9FFF',
  blueL: '#EAF4FF',
  green: '#06D6A0',
  orange: '#FF6B35',
  yellow: '#FFD60A',
  purple: '#8B5CF6',
};

const SEMESTER_COLORS = ['#4D9FFF', '#06D6A0', '#FF6B35', '#FFD60A', '#8B5CF6', '#EC4899'];

const StatCard = ({ icon, label, value, color }) => (
  <Card sx={{
    borderRadius: 3,
    border: `1.5px solid ${color}30`,
    background: `linear-gradient(135deg, ${color}08, ${color}18)`,
    transition: 'all 0.3s',
    '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${color}20` },
  }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 48, height: 48, borderRadius: 2,
          background: color, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0,
        }}>
          {icon}
        </Box>
        <Box>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem', fontWeight: 600 }}>{label}</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: '1.6rem', color: C.primary, lineHeight: 1.1 }}>
            {value}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const SUBJECT_MAP = [
  { keys: ['mathématique', 'math', 'analyse', 'algèbre', 'calcul'],   emoji: '📐', desc: "Exploration des structures mathématiques fondamentales : algèbre linéaire, analyse réelle et méthodes numériques appliquées à l'ingénierie et aux sciences." },
  { keys: ['algorithmique', 'algo', 'programmation', 'program'],       emoji: '⚙️', desc: "Conception et analyse d'algorithmes efficaces : complexité, récursivité, structures de données et résolution systématique de problèmes." },
  { keys: ['informatique', 'info', 'système', 'os', 'exploitation'],  emoji: '💻', desc: "Fondements de l'informatique : systèmes d'exploitation, gestion de la mémoire, processus et interaction entre le matériel et le logiciel." },
  { keys: ['réseau', 'réseau', 'tcp', 'ip', 'communication'],         emoji: '🌐', desc: "Architecture des réseaux informatiques : protocoles TCP/IP, routage, sécurité des communications et conception d'infrastructures réseau." },
  { keys: ['base de données', 'bdd', 'sql', 'données', 'sgbd'],       emoji: '🗄️', desc: "Conception et gestion des bases de données relationnelles : modélisation, requêtes SQL, transactions, optimisation et sécurité des données." },
  { keys: ['web', 'html', 'css', 'javascript', 'front', 'back'],      emoji: '🌍', desc: "Développement d'applications web modernes : technologies front-end et back-end, frameworks, APIs RESTful et bonnes pratiques du web." },
  { keys: ['anglais', 'english', 'langue'],                            emoji: '🇬🇧', desc: "Renforcement des compétences en anglais technique et professionnel : rédaction, communication orale et vocabulaire spécialisé dans le domaine des sciences et de l'ingénierie." },
  { keys: ['français', 'communication', 'expression', 'rédaction'],   emoji: '📖', desc: "Développement des aptitudes en communication écrite et orale en français : argumentation, rédaction de rapports et expression professionnelle." },
  { keys: ['physique'],                                                  emoji: '⚡', desc: "Étude des lois fondamentales de la physique : mécanique, électromagnétisme, thermodynamique et optique avec leurs applications en ingénierie." },
  { keys: ['chimie'],                                                    emoji: '🧪', desc: "Introduction aux réactions chimiques, liaisons moléculaires, thermochimie et chimie organique avec des applications pratiques en laboratoire." },
  { keys: ['biologie', 'bio'],                                           emoji: '🧬', desc: "Exploration des mécanismes du vivant : génétique, biologie cellulaire, biochimie et biotechnologies appliquées." },
  { keys: ['gestion', 'management', 'entreprise', 'organisation'],    emoji: '📊', desc: "Principes de gestion et management d'entreprise : planification stratégique, organisation, ressources humaines et prise de décision." },
  { keys: ['droit', 'juridique', 'légal', 'loi'],                     emoji: '⚖️', desc: "Fondements du droit applicable aux activités professionnelles : droit du travail, droit des contrats et réglementations spécifiques au secteur." },
  { keys: ['économie', 'eco', 'finance', 'comptabilité'],             emoji: '💹', desc: "Analyse des mécanismes économiques et financiers : micro et macroéconomie, comptabilité, budgets et gestion financière d'entreprise." },
  { keys: ['statistique', 'stat', 'probabilité', 'proba'],            emoji: '📉', desc: "Théorie des probabilités et statistiques appliquées : distributions, tests d'hypothèses, régression et analyse de données." },
  { keys: ['signal', 'traitement', 'image', 'son'],                   emoji: '📡', desc: "Traitement et analyse des signaux numériques et analogiques : transformée de Fourier, filtrage, compression et applications multimédias." },
  { keys: ['électronique', 'électro', 'circuit'],                     emoji: '🔌', desc: "Conception et analyse de circuits électroniques : composants passifs et actifs, amplificateurs, oscillateurs et systèmes embarqués." },
  { keys: ['mécanique', 'méca', 'structure', 'résistance'],           emoji: '🔧', desc: "Étude des systèmes mécaniques : statique, dynamique, résistance des matériaux et conception de structures soumises à des contraintes." },
  { keys: ['génie logiciel', 'software', 'architecture logiciel'],    emoji: '🏗️', desc: "Méthodologies de développement logiciel : UML, design patterns, tests, versioning et gestion de projets en équipe." },
  { keys: ['intelligence artificielle', 'ia', 'machine learning', 'ml'], emoji: '🤖', desc: "Introduction à l'intelligence artificielle et au machine learning : réseaux de neurones, apprentissage supervisé et non supervisé, et applications pratiques." },
  { keys: ['sécurité', 'cybersécurité', 'cryptographie'],             emoji: '🔐', desc: "Principes de sécurité informatique : cryptographie, authentification, protection des systèmes, détection d'intrusions et bonnes pratiques." },
  { keys: ['projet', 'stage', 'mémoire', 'pfe'],                      emoji: '🎓', desc: "Module d'intégration professionnelle : application concrète des compétences acquises à travers un projet de fin d'études ou un stage en entreprise." },
];

const getSubjectInfo = (name = '') => {
  const n = name.toLowerCase();
  for (const entry of SUBJECT_MAP) {
    if (entry.keys.some(k => n.includes(k))) return entry;
  }
  return { emoji: '📚', desc: "Module fondamental de votre formation. Consultez votre enseignant ou le syllabus officiel pour obtenir le programme détaillé et les objectifs pédagogiques." };
};

const CourseCard = ({ cours, color }) => {
  const [flipped, setFlipped] = useState(false);
  const { emoji, desc: autoDesc } = getSubjectInfo(cours.nom_matiere);
  const description = cours.description || autoDesc;

  return (
    <Box
      onClick={() => setFlipped(f => !f)}
      sx={{ height: 230, perspective: '1000px', cursor: 'pointer' }}
    >
      <Box sx={{
        position: 'relative', width: '100%', height: '100%',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>

        {/* ── FACE AVANT ── */}
        <Box sx={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          borderRadius: 3, border: `1.5px solid ${color}25`,
          background: '#fff', overflow: 'hidden', p: 2.5,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
          '&:hover': { boxShadow: `0 8px 28px ${color}22`, borderColor: `${color}50` },
          transition: 'box-shadow 0.25s, border-color 0.25s',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: C.primary, mb: 0.5, lineHeight: 1.3 }}>
                {cours.nom_matiere}
              </Typography>
              <Chip
                label={cours.code_matiere || 'N/A'}
                size="small"
                sx={{ background: `${color}15`, color, fontWeight: 700, fontSize: '0.7rem', height: 20, fontFamily: 'monospace' }}
              />
            </Box>
            <Box sx={{
              width: 48, height: 48, borderRadius: 2, ml: 1, flexShrink: 0,
              background: `linear-gradient(135deg, ${color}20, ${color}38)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
            }}>
              {emoji}
            </Box>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              <Chip label={`Coef. ${cours.coefficient ?? 1}`} size="small"
                sx={{ background: '#F0F4FF', color: C.primary, fontWeight: 700, fontSize: '0.7rem' }} />
              <Chip label={`S${cours.semestre}`} size="small"
                sx={{ background: `${color}18`, color, fontWeight: 700, fontSize: '0.7rem' }} />
            </Box>
            {cours.enseignant && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Avatar sx={{ width: 20, height: 20, background: `${color}20`, color, fontSize: '0.55rem' }}>
                  <Person sx={{ fontSize: 12 }} />
                </Avatar>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>
                  {cours.enseignant}
                </Typography>
              </Box>
            )}
          </Box>

          {/* hint */}
          <Typography sx={{ fontSize: '0.65rem', color: '#CBD5E1', textAlign: 'right', mt: 0.5 }}>
            Cliquer pour plus d'infos →
          </Typography>
        </Box>

        {/* ── FACE ARRIÈRE ── */}
        <Box sx={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: 3, overflow: 'hidden', p: 2.5,
          background: `linear-gradient(145deg, ${color}18 0%, ${color}30 100%)`,
          border: `1.5px solid ${color}45`,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          boxShadow: `0 6px 24px ${color}22`,
        }}>
          {/* titre dos */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
              background: color, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '1.1rem',
            }}>
              {emoji}
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: C.primary, lineHeight: 1.2 }}>
              {cours.nom_matiere}
            </Typography>
          </Box>

          {/* description */}
          <Typography sx={{
            fontSize: '0.78rem', color: '#374151', lineHeight: 1.55,
            flex: 1, overflow: 'hidden',
            display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
          }}>
            {description}
          </Typography>

          {/* meta chips */}
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mt: 1 }}>
            <Chip label={`S${cours.semestre}`} size="small"
              sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, background: `${color}30`, color }} />
            <Chip label={`Coef. ${cours.coefficient ?? 1}`} size="small"
              sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, background: 'rgba(255,255,255,0.6)', color: C.primary }} />
            {cours.enseignant && (
              <Chip label={cours.enseignant} size="small"
                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600, background: 'rgba(255,255,255,0.6)', color: '#374151', maxWidth: 140 }} />
            )}
          </Box>

          <Typography sx={{ fontSize: '0.65rem', color: `${color}99`, textAlign: 'right' }}>
            ← Cliquer pour retourner
          </Typography>
        </Box>

      </Box>
    </Box>
  );
};

export default function EtudiantMesCours() {
  const navigate = useNavigate();
  const [cours, setCours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semestre, setSemestre] = useState(0);

  useEffect(() => {
    api.get('/etudiant/cours')
      .then(r => setCours(r.data.data || []))
      .catch(err => console.error('Erreur chargement cours:', err))
      .finally(() => setLoading(false));
  }, []);

  const semestres = [...new Set(cours.map(c => c.semestre).filter(Boolean))].sort((a, b) => a - b);
  const semestresDisplay = [null, ...semestres];

  const filtered = semestre === 0
    ? cours
    : cours.filter(c => c.semestre === semestres[semestre - 1]);

  const totalCoefs = cours.reduce((s, c) => s + (parseFloat(c.coefficient) || 1), 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{
        mb: 4, p: 3, borderRadius: 3, background: '#fff',
        border: '1px solid #E5E7EB',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{
          width: 56, height: 56, borderRadius: 2,
          background: `${C.blue}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
        }}>
          📚
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: C.primary, mb: 0.4 }}>
            Mes Cours
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>
            Toutes les matières de votre formation
          </Typography>
        </Box>
        </Box>
        <Tooltip title="Retour au tableau de bord">
          <IconButton onClick={() => navigate('/dashboard/etudiant')}
            sx={{ width: 44, height: 44, borderRadius: '14px', background: '#F0F4FF', border: '2px solid #3B82F640', color: '#3B82F6',
              transition: 'all 0.3s ease',
              '&:hover': { background: '#3B82F620', transform: 'translateY(-2px)', boxShadow: '0 4px 12px #3B82F625' } }}>
            <ArrowBack sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stats */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard icon="📚" label="Total des matières" value={cours.length} color={C.blue} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard icon="📅" label="Semestres" value={semestres.length} color={C.green} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard icon="⭐" label="Total coefficients" value={totalCoefs} color={C.orange} />
        </Grid>
      </Grid>

      {/* Semester tabs */}
      {semestres.length > 0 && (
        <Card sx={{ borderRadius: 3, border: '1.5px solid #EAF4FF', mb: 3 }}>
          <Tabs
            value={semestre}
            onChange={(_, v) => setSemestre(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 1,
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.88rem', minHeight: 48 },
              '& .Mui-selected': { color: C.blue },
              '& .MuiTabs-indicator': { background: C.blue, height: 3, borderRadius: 2 },
            }}
          >
            <Tab label={`Tous (${cours.length})`} />
            {semestres.map((s, i) => (
              <Tab
                key={s}
                label={`Semestre ${s} (${cours.filter(c => c.semestre === s).length})`}
              />
            ))}
          </Tabs>
        </Card>
      )}

      {/* Course grid */}
      {filtered.length === 0 ? (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '3rem', mb: 2 }}>📭</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: C.primary, mb: 1 }}>
            Aucun cours trouvé
          </Typography>
          <Typography color="text.secondary">
            Aucune matière n'est associée à votre spécialité pour le moment.
          </Typography>
        </Box>
      ) : (
        <>
          {semestre === 0 ? (
            semestres.map((s, si) => {
              const semCours = filtered.filter(c => c.semestre === s);
              const color = SEMESTER_COLORS[si % SEMESTER_COLORS.length];
              return (
                <Box key={s} sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{
                      width: 36, height: 36, borderRadius: '10px',
                      background: `${color}20`, display: 'flex', alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <MenuBook sx={{ color, fontSize: 20 }} />
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: C.primary }}>
                      Semestre {s}
                    </Typography>
                    <Chip
                      label={`${semCours.length} matière${semCours.length > 1 ? 's' : ''}`}
                      size="small"
                      sx={{ background: `${color}15`, color, fontWeight: 700 }}
                    />
                  </Box>
                  <Grid container spacing={2.5}>
                    {semCours.map(c => (
                      <Grid item xs={12} sm={6} md={4} key={c.id_matiere}>
                        <CourseCard cours={c} color={color} />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              );
            })
          ) : (
            <Grid container spacing={2.5}>
              {filtered.map((c, i) => (
                <Grid item xs={12} sm={6} md={4} key={c.id_matiere}>
                  <CourseCard cours={c} color={SEMESTER_COLORS[(semestre - 1) % SEMESTER_COLORS.length]} />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
}
