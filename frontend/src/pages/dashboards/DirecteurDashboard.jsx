import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Button, Dialog, DialogContent, IconButton, keyframes, Tooltip,
  CircularProgress, LinearProgress, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { Close, ArrowForward, InfoOutlined, People, Domain, Timeline } from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import api from '../../services/api';
import mlService from '../../services/mlService';

// ── PALETTE ───────────────────────────────────────
const C = {
  navy:   '#1A3A6B',
  blue:   '#4D9FFF',
  blueB:  '#85BFFF',
  blueL:  '#EAF4FF',
  orange: '#FF6B35',
  green:  '#06D6A0',
  yellow: '#FFD60A',
  purple: '#7B2CBF',
};

// ── KEYFRAMES ─────────────────────────────────────
const fadeUp = keyframes`
  from { opacity:0; transform:translateY(20px); }
  to   { opacity:1; transform:translateY(0);    }
`;
const popIn = keyframes`
  from { opacity:0; transform:scale(0.88) translateY(12px); }
  to   { opacity:1; transform:scale(1)   translateY(0);     }
`;
const slideLeft = keyframes`
  from { opacity:0; transform:translateX(-16px); }
  to   { opacity:1; transform:translateX(0);     }
`;
const blinkDot = keyframes`
  0%,100% { opacity:1; } 50% { opacity:0.25; }
`;

// ── CARD ACCENT COLORS ────────────────────────────
const CARD_ACCENTS = {
  evolution:    { color: C.blue,   gradient: `linear-gradient(90deg, ${C.blue}, ${C.blueB})` },
  topDepts:     { color: C.yellow, gradient: `linear-gradient(90deg, ${C.yellow}, #FFE55A)`  },
  comparaison:  { color: C.green,  gradient: `linear-gradient(90deg, ${C.green}, #05C78D)`   },
  departements: { color: C.orange, gradient: `linear-gradient(90deg, ${C.orange}, #FF8C5A)`  },
};

// ── SECTION CARD ──────────────────────────────────
function SectionCard({ children, sx = {} }) {
  return (
    <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', ...sx }}>
      {children}
    </Card>
  );
}

// ── INFO POPUP MODAL ──────────────────────────────
function InfoModal({ open, onClose, config, etablissement }) {
  if (!config) return null;
  const accent = CARD_ACCENTS[config.accentKey] || CARD_ACCENTS.evolution;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          border: `1.5px solid ${C.blueL}`,
          boxShadow: `0 24px 60px rgba(26,58,107,0.18)`,
          animation: `${popIn} 0.38s cubic-bezier(0.34,1.56,0.64,1)`,
          overflow: 'hidden',
          background: '#FAFCFF',
        },
      }}
    >
      <Box sx={{
        px: 3, py: 2.5,
        background: `linear-gradient(135deg, ${accent.color}12 0%, ${C.blueL} 100%)`,
        borderBottom: `1.5px solid ${accent.color}20`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: '14px',
            background: '#fff', border: `1.5px solid ${accent.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', boxShadow: `0 4px 16px ${accent.color}18`,
          }}>
            {config.icon}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, color: C.navy, fontSize: '1.05rem', letterSpacing: '-0.3px' }}>
              {config.title}
            </Typography>
            <Typography sx={{ color: '#8A9BB0', fontSize: '0.74rem' }}>
              Analyse détaillée — {etablissement}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{
          color: C.navy, opacity: 0.5, borderRadius: '10px',
          '&:hover': { background: `${accent.color}18`, opacity: 1, transform: 'rotate(90deg)' },
          transition: 'all 0.2s',
        }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {config.kpis && (
          <Grid container spacing={1.5} sx={{ mb: 3 }}>
            {config.kpis.map((kpi, i) => (
              <Grid item xs={6} sm={3} key={i}>
                <Box sx={{
                  p: 1.8, borderRadius: '14px',
                  background: `${kpi.color}10`,
                  border: `1px solid ${kpi.color}22`,
                  textAlign: 'center',
                  animation: `${popIn} 0.4s ease-out ${i * 0.07}s both`,
                }}>
                  <Typography sx={{ fontSize: '1.5rem', mb: 0.4 }}>{kpi.icon}</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', color: kpi.color, letterSpacing: '-0.5px' }}>
                    {kpi.value}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0', fontWeight: 600 }}>{kpi.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
        <Box sx={{ mb: 2.5, p: 2.5, borderRadius: '14px', background: '#fff', border: `1px solid ${C.blueL}` }}>
          <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.88rem', mb: 1.2 }}>
            📖 Comment lire cette carte ?
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.7 }}>
            {config.description}
          </Typography>
        </Box>
        {config.legend && (
          <Box>
            <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.88rem', mb: 1.2 }}>
              🔑 Légende des indicateurs
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {config.legend.map((item, i) => (
                <Box key={i} sx={{
                  display: 'flex', alignItems: 'flex-start', gap: 1.5,
                  p: 1.5, borderRadius: '12px',
                  background: `${item.color}08`,
                  border: `1px solid ${item.color}20`,
                  animation: `${slideLeft} 0.35s ease-out ${i * 0.06}s both`,
                }}>
                  <Box sx={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: item.color, flexShrink: 0, mt: 0.5,
                    boxShadow: `0 0 6px ${item.color}60`,
                  }} />
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: C.navy, fontSize: '0.82rem' }}>
                      {item.label}
                    </Typography>
                    {item.desc && (
                      <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', mt: 0.2 }}>
                        {item.desc}
                      </Typography>
                    )}
                  </Box>
                  {item.badge && (
                    <Box sx={{ ml: 'auto', flexShrink: 0 }}>
                      <Chip label={item.badge} size="small" sx={{
                        height: 20, fontSize: '0.68rem', fontWeight: 700,
                        background: `${item.color}18`, color: item.color,
                        border: `1px solid ${item.color}30`,
                      }} />
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        )}
        {config.insight && (
          <Box sx={{
            mt: 2.5, p: 2.5, borderRadius: '14px',
            background: `linear-gradient(135deg, ${accent.color}08, ${C.blueL})`,
            border: `1px solid ${accent.color}20`,
          }}>
            <Typography sx={{ fontSize: '0.84rem', color: C.navy, fontWeight: 600, lineHeight: 1.65 }}>
              💡 <strong>Insight :</strong> {config.insight}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <Box sx={{ px: 3, py: 2, borderTop: `1px solid ${C.blueL}`, display: 'flex', justifyContent: 'flex-end', background: '#fff' }}>
        <Button onClick={onClose} variant="contained" sx={{
          borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3,
          background: accent.gradient,
          boxShadow: `0 4px 16px ${accent.color}30`,
          '&:hover': { boxShadow: `0 6px 20px ${accent.color}45`, transform: 'translateY(-1px)' },
          transition: 'all 0.2s',
        }}>
          Fermer
        </Button>
      </Box>
    </Dialog>
  );
}

// ── CARD HEADER ───────────────────────────────────
function CardHeader({ title, accentKey, onInfo, chip }) {
  const accent = CARD_ACCENTS[accentKey] || CARD_ACCENTS.evolution;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
        <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '1.05rem' }}>
          {title}
        </Typography>
        {chip}
      </Box>
      <Tooltip title="En savoir plus sur cette carte" arrow>
        <IconButton
          onClick={onInfo}
          size="small"
          sx={{
            width: 32, height: 32, borderRadius: '10px',
            background: `${accent.color}12`,
            border: `1.5px solid ${accent.color}25`,
            color: accent.color,
            transition: 'all 0.2s',
            '&:hover': {
              background: accent.color,
              color: '#fff',
              transform: 'scale(1.1)',
              boxShadow: `0 4px 14px ${accent.color}35`,
            },
          }}
        >
          <InfoOutlined sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

// ── MODAL CONFIGS ─────────────────────────────────
const MODAL_CONFIGS = {
  evolution: {
    accentKey: 'evolution',
    icon: '📊',
    title: 'Évolution des inscriptions (12 mois)',
    kpis: [
      { icon: '📈', label: 'Tendance',    value: '12 mois', color: C.blue   },
      { icon: '👥', label: 'Étudiants',  value: 'Réel',    color: C.green  },
      { icon: '📅', label: 'Période',    value: '2025',    color: C.orange },
      { icon: '🏛️', label: 'Niveau',    value: 'Étab.',   color: C.purple },
    ],
    description:
      'Ce graphique retrace l\'évolution mensuelle des nouvelles inscriptions d\'étudiants dans votre établissement. Chaque barre représente le nombre total de nouveaux inscrits enregistrés dans le mois. Une tendance haussière indique une amélioration de l\'attractivité de votre établissement.',
    legend: [
      { color: C.blue,   label: 'Nouvelles inscriptions', desc: 'Total des étudiants inscrits par mois', badge: '2024–2025' },
      { color: C.green,  label: 'Tendance positive',      desc: 'Augmentation mensuelle des effectifs'                    },
    ],
    insight: 'Suivez l\'évolution mensuelle pour anticiper les besoins en salles et en enseignants dès la prochaine rentrée.',
  },
  topDepts: {
    accentKey: 'topDepts',
    icon: '🏛️',
    title: 'Top Départements',
    kpis: [
      { icon: '🥇', label: '1er rang',  value: 'Max ét.', color: C.yellow },
      { icon: '🥈', label: '2ème rang', value: '2ème',    color: '#C0C0C0' },
      { icon: '🥉', label: '3ème rang', value: '3ème',    color: '#CD7F32' },
      { icon: '📊', label: 'Critère',   value: 'Effectif', color: C.blue  },
    ],
    description:
      'Ce classement présente vos 5 départements les plus importants en termes d\'effectifs étudiants. Les médailles 🥇🥈🥉 distinguent le podium. Cette vue permet d\'identifier rapidement les départements phares et de comparer leur taille relative.',
    legend: [
      { color: C.yellow,   label: '🥇 1ère place',  desc: 'Département avec le plus grand nombre d\'étudiants' },
      { color: '#C0C0C0',  label: '🥈 2ème place',  desc: 'Deuxième département en termes d\'effectifs'        },
      { color: '#CD7F32',  label: '🥉 3ème place',  desc: 'Troisième département en termes d\'effectifs'       },
    ],
    insight: 'Identifiez les départements à fort effectif pour prioriser les ressources pédagogiques et les espaces d\'enseignement.',
  },
  comparaison: {
    accentKey: 'comparaison',
    icon: '🏆',
    title: 'Comparaison Inter-départements',
    kpis: [
      { icon: '🏛️', label: 'Depts',      value: 'N',       color: C.green  },
      { icon: '👨‍🏫', label: 'Ratio moy', value: '1:22',    color: C.blue   },
      { icon: '🥇', label: '1er rang',   value: 'Max ét.', color: C.yellow },
      { icon: '📋', label: 'Critère',    value: 'Effectif', color: C.purple },
    ],
    description:
      'Ce tableau classe vos départements par ordre décroissant du nombre d\'étudiants. Le Ratio Enseignant/Étudiant (E/É) mesure la qualité d\'encadrement : plus il est élevé (1 enseignant pour peu d\'étudiants), meilleur est l\'accompagnement pédagogique.',
    legend: [
      { color: C.green,  label: 'Ratio Bon (1:≤20)',    desc: '1 enseignant pour 20 étudiants ou moins',  badge: '✅ Excellent' },
      { color: C.yellow, label: 'Ratio Moyen (1:21–33)', desc: '1 enseignant pour 21 à 33 étudiants',     badge: '⚠️ Moyen'    },
      { color: C.orange, label: 'Ratio Faible (1:>33)',  desc: '1 enseignant pour plus de 33 étudiants',  badge: '🔴 Critique' },
    ],
    insight: 'Un ratio d\'encadrement inférieur à 1:20 est considéré excellent. Identifiez les départements sous-dotés pour prioriser les recrutements.',
  },
  departements: {
    accentKey: 'departements',
    icon: '🏛️',
    title: 'Départements de l\'établissement',
    kpis: [
      { icon: '🏛️', label: 'Depts',       value: 'N',    color: C.orange },
      { icon: '👥', label: 'Étudiants',   value: 'Réel', color: C.blue   },
      { icon: '👨‍🏫', label: 'Enseignants', value: 'Réel', color: C.green  },
      { icon: '🎓', label: 'Spécialités', value: 'N',    color: C.purple },
    ],
    description:
      'Ce tableau récapitulatif liste l\'ensemble des départements de votre établissement avec leurs effectifs détaillés. Il permet une vue d\'ensemble complète de la structure organisationnelle et des ressources humaines de chaque département.',
    legend: [
      { color: C.blue,   label: 'Étudiants',   desc: 'Nombre total d\'étudiants inscrits dans le département'          },
      { color: C.green,  label: 'Enseignants',  desc: 'Nombre d\'enseignants affectés au département'                   },
      { color: C.orange, label: 'Niveaux',      desc: 'Nombre de niveaux d\'études proposés (L1, L2, L3, M1, M2, etc.)' },
      { color: C.purple, label: 'Spécialités',  desc: 'Nombre de filières et spécialités disponibles'                   },
    ],
    insight: 'Comparez les ratios de chaque département pour identifier ceux nécessitant un renfort en personnel ou une révision des filières.',
  },
};

// ── MAIN COMPONENT ────────────────────────────────
const DirecteurDashboard = () => {
  const navigate = useNavigate();

  const [loading,           setLoading]           = useState(true);
  const [dialogOpen,        setDialogOpen]        = useState(false);
  const [infoModal,         setInfoModal]         = useState({ open: false, key: null });
  const [hovCard,           setHovCard]           = useState(null);

  const [stats,             setStats]             = useState({ total_etudiants: 0, total_enseignants: 0, total_departements: 0, total_specialites: 0, avg_taux_reussite: null });
  const [statsLoading,      setStatsLoading]      = useState(true);
  const [etablissementInfo, setEtablissementInfo] = useState({ nom_etablissement: 'Chargement...', nom_ville: '' });
  const [evolutionData,     setEvolutionData]     = useState([]);
  const [comparaisonData,   setComparaisonData]   = useState([]);
  const [departementsData,  setDepartementsData]  = useState([]);

  const [mlDefaultData,  setMlDefaultData]  = useState({});
  const [performanceData, setPerformanceData] = useState([]);
  const [mlPred,         setMlPred]         = useState(null);
  const [mlPredLoad,     setMlPredLoad]     = useState(false);
  const [mlPerfPred,     setMlPerfPred]     = useState(null);
  const [mlPerfLoad,     setMlPerfLoad]     = useState(false);
  const [detailML,       setDetailML]       = useState(null);
  const [mlProjection,   setMlProjection]   = useState([]);
  const [mlProjLoading,  setMlProjLoading]  = useState(false);
  const [mlProjMode,     setMlProjMode]     = useState('annee');

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchEvolutionInscriptions(),
        fetchComparaisonDepartements(),
        fetchDepartements(),
        fetchMLData(),
      ]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/directeur/dashboard/stats');
      if (res.data.success) {
        setStats({
          ...res.data.stats,
          avg_taux_reussite: res.data.stats.avg_taux_reussite != null
            ? parseFloat(res.data.stats.avg_taux_reussite) : null,
        });
        if (res.data.etablissement) setEtablissementInfo(res.data.etablissement);
      }
    } catch (e) { console.error(e); }
    finally { setStatsLoading(false); }
  };

  const fetchEvolutionInscriptions = async () => {
    try {
      const res = await api.get('/directeur/dashboard/evolution-inscriptions');
      if (res.data.success && res.data.data) {
        setEvolutionData(res.data.data.map(item => ({
          mois: new Date(item.mois + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
          inscriptions: parseInt(item.nombre_inscriptions) || 0,
        })));
      }
    } catch (e) { console.error(e); }
  };

  const fetchComparaisonDepartements = async () => {
    try {
      const res = await api.get('/directeur/dashboard/comparaison-departements');
      if (res.data.success && res.data.data) setComparaisonData(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchDepartements = async () => {
    try {
      const res = await api.get('/directeur/dashboard/departements');
      if (res.data.success && res.data.data) setDepartementsData(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchMLData = async () => {
    try {
      const res = await api.get('/directeur/dashboard/ml-data');
      if (res.data.success) {
        setMlDefaultData({ m1: res.data.m1, m2: res.data.m2, m3: res.data.m3 });
        if (res.data.reussite_historique?.length) {
          setPerformanceData(res.data.reussite_historique);
        }
      }
    } catch (e) { console.error('ML data fetch error:', e); }
  };

  const m1Key = JSON.stringify(mlDefaultData.m1);
  useEffect(() => {
    if (!mlDefaultData.m1) return;
    setMlPredLoad(true);
    mlService.predireReussite(mlDefaultData.m1)
      .then(r => setMlPred(r.data))
      .catch(() => {})
      .finally(() => setMlPredLoad(false));
  }, [m1Key]);

  const m3Key = JSON.stringify(mlDefaultData.m3);
  useEffect(() => {
    if (!mlDefaultData.m3) return;
    setMlPerfLoad(true);
    mlService.predirePerformance(mlDefaultData.m3)
      .then(r => setMlPerfPred(r.data))
      .catch(() => {})
      .finally(() => setMlPerfLoad(false));
  }, [m3Key]);

  const projeterDirecteur = async () => {
    if (!mlDefaultData.m1) return;
    setMlProjLoading(true);
    setMlProjection([]);
    const results = [];
    let an1 = mlDefaultData.m1.taux_reussite_an1 ?? 76;
    let an2 = mlDefaultData.m1.taux_reussite_an2 ?? 74;
    try {
      for (let year = 2026; year <= 2030; year++) {
        const { data } = await mlService.predireReussite({ ...mlDefaultData.m1, taux_reussite_an1: an1, taux_reussite_an2: an2 });
        results.push({ annee: `${year}`, taux: data.taux_reussite_predit, couleur: data.couleur, predicted: true });
        an2 = an1;
        an1 = data.taux_reussite_predit;
      }
      setMlProjection(results);
    } catch (e) {
      console.error('Projection directeur error:', e);
    } finally {
      setMlProjLoading(false);
    }
  };

  const openInfo  = (key) => setInfoModal({ open: true, key });
  const closeInfo = () => setInfoModal({ open: false, key: null });

  // top 5 for departments podium
  const top5Depts = comparaisonData.slice(0, 5);

  const LoadingRows = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
      <Typography color="text.secondary">Chargement des données...</Typography>
    </Box>
  );

  const EmptyState = ({ icon, text, sub }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
      <Typography variant="h3" sx={{ opacity: 0.3 }}>{icon}</Typography>
      <Typography color="text.secondary" sx={{ fontWeight: 500 }}>{text}</Typography>
      {sub && <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.7 }}>{sub}</Typography>}
    </Box>
  );

  const userTypes = [
    {
      label: 'Enseignants', emoji: '👨‍🏫', color: C.blue,
      count: (stats.total_enseignants || 0).toString(),
      desc: "Dispensent les cours et suivent les performances de leurs étudiants.",
      badge: `${stats.total_enseignants || 0} inscrits`, stat: '89% actifs', statIcon: '✅',
      path: '/dashboard/directeur/users?role=enseignant',
    },
    {
      label: 'Étudiants', emoji: '👨‍🎓', color: C.green,
      count: (stats.total_etudiants || 0).toString(),
      desc: "Suivent leurs cursus et progressent grâce aux outils d'analyse IA.",
      badge: `${stats.total_etudiants || 0} inscrits`, stat: 'Taux 76.8%', statIcon: '📊',
      path: '/dashboard/directeur/users?role=etudiant',
    },
  ];

  // ─────────────────────────────────────────────
  return (
    <Box>

      {/* ══ HEADER ════════════════════════════════ */}
      <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: '#fff', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: '16px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
            🏫
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B' }}>Dashboard Directeur</Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              {etablissementInfo.nom_etablissement || 'Chargement...'}{etablissementInfo.nom_ville ? ` — ${etablissementInfo.nom_ville}` : ''}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Tooltip title="Gestion des utilisateurs">
            <IconButton onClick={() => setDialogOpen(true)}
              sx={{ width: 44, height: 44, borderRadius: '14px', background: '#8B5CF6', color: '#fff',
                transition: 'all 0.3s ease', boxShadow: '0 3px 10px rgba(139,92,246,0.4)',
                '&:hover': { background: '#7C3AED', transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(139,92,246,0.5)' } }}>
              <People sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Gestion des départements">
            <IconButton onClick={() => navigate('/dashboard/directeur/departements')}
              sx={{ width: 44, height: 44, borderRadius: '14px', background: '#3B82F6', color: '#fff',
                transition: 'all 0.3s ease', boxShadow: '0 3px 10px rgba(59,130,246,0.4)',
                '&:hover': { background: '#2563EB', transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(59,130,246,0.5)' } }}>
              <Domain sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ══ STAT CARDS ════════════════════════════ */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            icon: '👥',  label: 'Effectif total',
            value: statsLoading ? '…' : (stats.total_etudiants?.toString() || '0'),
            color: C.blue,   bg: `linear-gradient(135deg, ${C.blue}08,   #EFF6FF)`,
          },
          {
            icon: '👨‍🏫', label: 'Enseignants',
            value: statsLoading ? '…' : (stats.total_enseignants?.toString() || '0'),
            color: C.green,  bg: `linear-gradient(135deg, ${C.green}08,  #E6FBF5)`,
          },
          {
            icon: '📈', label: 'Taux de réussite',
            value: statsLoading ? '…' : (stats.avg_taux_reussite != null ? `${stats.avg_taux_reussite.toFixed(1)}%` : '—'),
            color: C.orange, bg: `linear-gradient(135deg, ${C.orange}08, #FFF1EE)`,
          },
          {
            icon: '🏛️', label: 'Départements',
            value: statsLoading ? '…' : (stats.total_departements?.toString() || '0'),
            color: '#F59E0B', bg: 'linear-gradient(135deg, #F59E0B08, #FFF7ED)',
          },
          {
            icon: '🎓',  label: 'Spécialités',
            value: statsLoading ? '…' : (stats.total_specialites?.toString() || '0'),
            color: C.purple, bg: `linear-gradient(135deg, ${C.purple}08, #F5F0FF)`,
          },
        ].map((s, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Card sx={{ borderRadius: 3, border: '1.5px solid #EAF4FF', background: s.bg, animation: `${fadeUp} 0.4s ease-out ${i * 0.07}s both` }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                    {s.icon}
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, lineHeight: 1.3 }}>{s.label}</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: C.navy }}>{s.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ══ PRÉVISIONS ML ════════════════════════════════════════════════════ */}
      <Box sx={{ mb: 4 }}>
        <Card sx={{
          borderRadius: '20px', overflow: 'hidden',
          border: `1.5px solid #C7D9F5`,
          background: '#fff',
          boxShadow: `0 4px 20px rgba(77,159,255,0.08)`,
          animation: `${fadeUp} 0.55s ease-out 0.3s both`,
        }}>
          {/* Header */}
          <Box sx={{
            px: 3, py: 2.5,
            borderBottom: `1px solid #C7D9F5`,
            background: `linear-gradient(135deg, #EAF4FF 0%, #DBEEFF 100%)`,
            display: 'flex', alignItems: 'center', gap: 2,
          }}>
            <Box sx={{
              width: 52, height: 52, borderRadius: '14px',
              background: `linear-gradient(135deg, #1A3A6B, #4D9FFF)`,
              border: `none`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', flexShrink: 0,
              boxShadow: `0 4px 14px rgba(77,159,255,0.3)`,
            }}>
              🤖
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, color: '#1A3A6B', fontSize: '1.1rem', letterSpacing: '-0.3px' }}>
                Prévisions IA · Intelligence Artificielle
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0' }}>
                Modèle M1 · Basé sur les taux de réussite et données institutionnelles de votre établissement
              </Typography>
            </Box>
            <Chip label="IA ACTIVE" size="small" sx={{
              ml: 'auto', flexShrink: 0,
              background: `linear-gradient(135deg, #1A3A6B, #4D9FFF)`,
              color: '#fff', fontWeight: 800, fontSize: '0.7rem',
              borderRadius: '8px', border: 'none',
            }} />
          </Box>

          {/* M1 Body */}
          {mlPredLoad ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6, gap: 2 }}>
              <CircularProgress size={28} sx={{ color: C.blue }} />
              <Typography sx={{ color: '#8A9BB0', fontSize: '0.85rem' }}>Calcul des prévisions en cours...</Typography>
            </Box>
          ) : mlPred ? (
            <Grid container>
              {/* Métriques */}
              <Grid item xs={12} md={5}>
                <Box sx={{ p: 3, borderRight: { md: `1px solid ${C.blueL}` }, borderBottom: { xs: `1px solid ${C.blueL}`, md: 'none' } }}>
                  {/* Taux réussite */}
                  <Box sx={{ mb: 2.5, p: 2.5, borderRadius: '16px', background: `${mlPred.couleur}0e`, border: `1.5px solid ${mlPred.couleur}28` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Taux de réussite prédit 2025-2026
                      </Typography>
                      <Tooltip title="Voir comment cette prédiction est calculée">
                        <IconButton size="small" onClick={() => setDetailML('reussite')}
                          sx={{ width: 26, height: 26, color: mlPred.couleur, background: `${mlPred.couleur}12`, border: `1px solid ${mlPred.couleur}25`, '&:hover': { background: `${mlPred.couleur}22` } }}>
                          <InfoOutlined sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.8, mb: 1.2 }}>
                      <Typography sx={{ fontWeight: 900, fontSize: '3rem', color: mlPred.couleur, lineHeight: 1, letterSpacing: '-2px' }}>
                        {mlPred.taux_reussite_predit}
                      </Typography>
                      <Typography sx={{ color: '#8A9BB0', fontWeight: 600, mb: 0.6, fontSize: '1.1rem' }}>%</Typography>
                      <Chip label={mlPred.interpretation} size="small" sx={{ ml: 0.5, mb: 0.5, background: `${mlPred.couleur}18`, color: mlPred.couleur, border: `1px solid ${mlPred.couleur}35`, fontWeight: 700, fontSize: '0.68rem' }} />
                    </Box>
                    <LinearProgress variant="determinate" value={mlPred.taux_reussite_predit}
                      sx={{ height: 7, borderRadius: 4, mb: 1, backgroundColor: `${mlPred.couleur}15`, '& .MuiLinearProgress-bar': { backgroundColor: mlPred.couleur, borderRadius: 4 } }} />
                    {(() => {
                      const ref = mlDefaultData.m1?.taux_reussite_an1 ?? 79;
                      const diff = Math.round((mlPred.taux_reussite_predit - ref) * 10) / 10;
                      return (
                        <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0' }}>
                          {diff >= 0 ? '▲ +' : '▼ '}{Math.abs(diff)} pts vs année précédente ({ref}%)
                        </Typography>
                      );
                    })()}
                  </Box>

                  {/* Taux échec */}
                  <Box sx={{ p: 2.5, borderRadius: '16px', background: '#FEF2F2', border: '1.5px solid #FECACA' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Taux d&apos;échec prédit 2025-2026
                      </Typography>
                      <Tooltip title="Voir comment cette prédiction est calculée">
                        <IconButton size="small" onClick={() => setDetailML('echec')}
                          sx={{ width: 26, height: 26, color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', '&:hover': { background: 'rgba(239,68,68,0.16)' } }}>
                          <InfoOutlined sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.8, mb: 1.2 }}>
                      <Typography sx={{ fontWeight: 900, fontSize: '3rem', color: '#EF4444', lineHeight: 1, letterSpacing: '-2px' }}>
                        {Math.round((100 - mlPred.taux_reussite_predit) * 10) / 10}
                      </Typography>
                      <Typography sx={{ color: '#8A9BB0', fontWeight: 600, mb: 0.6, fontSize: '1.1rem' }}>%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={100 - mlPred.taux_reussite_predit}
                      sx={{ height: 7, borderRadius: 4, mb: 1, backgroundColor: '#FECACA', '& .MuiLinearProgress-bar': { backgroundColor: '#EF4444', borderRadius: 4 } }} />
                    <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0' }}>
                      Estimation : ~{Math.round((100 - mlPred.taux_reussite_predit) * (stats.total_etudiants || 0) / 100).toLocaleString('fr-TN')} étudiants concernés
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Graphique */}
              <Grid item xs={12} md={7}>
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {mlProjMode === 'annee' ? 'Évolution historique + prévision 2026' : 'Projection 2026 → 2030'}
                    </Typography>
                    <ToggleButtonGroup
                      value={mlProjMode}
                      exclusive
                      onChange={(_, v) => { if (v) { setMlProjMode(v); if (v === 'projection' && !mlProjection.length) projeterDirecteur(); } }}
                      size="small"
                      sx={{ '& .MuiToggleButton-root': { borderRadius: '8px !important', textTransform: 'none', fontWeight: 600, fontSize: '0.7rem', px: 1.2, py: 0.4, border: `1.5px solid ${C.blue}30` } }}
                    >
                      <ToggleButton value="annee" sx={{ '&.Mui-selected': { background: `${C.blue}18`, color: C.blue } }}>
                        2026
                      </ToggleButton>
                      <ToggleButton value="projection" sx={{ '&.Mui-selected': { background: `${C.blue}18`, color: C.blue } }}>
                        <Timeline sx={{ fontSize: 13, mr: 0.5 }} /> → 2030
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  {mlProjMode === 'projection' && mlProjLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 1.5 }}>
                      <CircularProgress size={24} sx={{ color: C.blue }} />
                      <Typography sx={{ fontSize: '0.8rem', color: '#8A9BB0' }}>Calcul de la projection...</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={mlProjMode === 'annee'
                          ? [...performanceData, { annee: '2026 (prévu)', taux: mlPred.taux_reussite_predit, predicted: true }]
                          : [...performanceData, ...mlProjection]
                        }
                        barSize={mlProjMode === 'projection' ? 22 : 30}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis dataKey="annee" tick={{ fill: '#8A9BB0', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[60, 100]} tick={{ fill: '#8A9BB0', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                        <RechartsTooltip
                          contentStyle={{ background: '#fff', border: `1.5px solid ${C.blueL}`, borderRadius: 12, color: C.navy, fontSize: 13, boxShadow: `0 4px 20px ${C.blue}18` }}
                          formatter={v => [`${typeof v === 'number' ? v.toFixed(1) : v}%`, 'Taux de réussite']}
                        />
                        <Bar dataKey="taux" radius={[6, 6, 0, 0]}>
                          {(mlProjMode === 'annee'
                            ? [...performanceData, { annee: '2026', taux: mlPred.taux_reussite_predit, predicted: true, couleur: mlPred.couleur }]
                            : [...performanceData, ...mlProjection]
                          ).map((entry, idx) => (
                            <Cell
                              key={idx}
                              fill={entry.predicted ? (entry.couleur || mlPred.couleur) : C.blue}
                              opacity={entry.predicted ? 1 : 0.55}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  <Box sx={{ display: 'flex', gap: 3, mt: 1.5, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '3px', background: C.blue, opacity: 0.55 }} />
                      <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0' }}>Données réelles 2021-2025</Typography>
                    </Box>
                    {mlProjMode === 'annee' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '3px', background: mlPred.couleur }} />
                        <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0' }}>Prévision IA 2026</Typography>
                      </Box>
                    ) : mlProjection.length > 0 && (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '3px', background: mlProjection[0]?.couleur || C.blue }} />
                          <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0' }}>Projection IA 2026–2030</Typography>
                        </Box>
                        {(() => {
                          const first = mlProjection[0]?.taux;
                          const last  = mlProjection[mlProjection.length - 1]?.taux;
                          const diff  = last && first ? Math.round((last - first) * 10) / 10 : null;
                          if (diff === null) return null;
                          const isHausse = diff >= 0;
                          return (
                            <Box sx={{ px: 1.5, py: 0.8, borderRadius: '8px', background: isHausse ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isHausse ? '#86efac' : '#fca5a5'}` }}>
                              <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: isHausse ? '#15803d' : '#dc2626' }}>
                                {isHausse ? '📈 +' : '📉 '}{diff}% tendance 2026→2030
                              </Typography>
                            </Box>
                          );
                        })()}
                      </>
                    )}
                  </Box>

                  <Box sx={{ mt: 2.5, p: 2, borderRadius: '12px', background: C.blueL, border: `1px solid ${C.blue}20` }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: C.navy, mb: 0.5 }}>Comment est calculée cette prévision ?</Typography>
                    <Typography sx={{ fontSize: '0.71rem', color: '#64748B', lineHeight: 1.7 }}>
                      Le modèle M1 analyse les taux de réussite des 2 dernières années, le taux d&apos;absence moyen et le ratio étudiants/enseignants de votre établissement.
                      {mlProjMode === 'projection' && ' En mode projection, chaque année prédite devient la base de la suivante (enchaînement itératif jusqu\'en 2030).'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <Typography sx={{ color: '#8A9BB0', fontSize: '0.82rem' }}>
                Prévisions non disponibles — vérifiez que le serveur ML est démarré (port 5001)
              </Typography>
            </Box>
          )}

          {/* M3 Performance Future */}
          <Box sx={{ px: 3, pb: 3 }}>
            <Box sx={{ pt: 2.5, borderTop: `1px dashed ${C.blue}25` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(135deg, #7B2CBF, #4D9FFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🎯</Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.85rem' }}>Performance Future — M3</Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0' }}>Moyenne finale prédite · données de l&apos;établissement · 2025-2026</Typography>
                </Box>
                <Chip label="M3 · IA" size="small" sx={{ ml: 'auto', background: 'linear-gradient(135deg, #7B2CBF, #4D9FFF)', color: '#fff', fontWeight: 800, fontSize: '0.62rem', borderRadius: '8px', border: 'none' }} />
              </Box>

              {mlPerfLoad ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                  <CircularProgress size={18} sx={{ color: C.purple }} />
                  <Typography sx={{ color: '#8A9BB0', fontSize: '0.8rem' }}>Calcul en cours...</Typography>
                </Box>
              ) : mlPerfPred ? (
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={5}>
                    <Box sx={{ p: 2, borderRadius: '14px', background: `${mlPerfPred.couleur}0e`, border: `1.5px solid ${mlPerfPred.couleur}28`, textAlign: 'center' }}>
                      <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.8 }}>
                        Moyenne prédite
                      </Typography>
                      <Typography sx={{ fontWeight: 900, fontSize: '2.2rem', color: mlPerfPred.couleur, lineHeight: 1, letterSpacing: '-1.5px' }}>
                        {mlPerfPred.moyenne_finale_predite}
                      </Typography>
                      <Typography sx={{ fontSize: '0.78rem', color: '#8A9BB0', fontWeight: 600 }}>/20</Typography>
                      <Chip label={mlPerfPred.mention} size="small" sx={{ mt: 0.8, background: `${mlPerfPred.couleur}18`, color: mlPerfPred.couleur, border: `1px solid ${mlPerfPred.couleur}35`, fontWeight: 700, fontSize: '0.62rem' }} />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={7}>
                    <Box sx={{ p: 2, borderRadius: '14px', background: '#FAFBFF', border: '1px solid #E8EEF8', height: '100%' }}>
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: C.navy, mb: 1 }}>Grille de mentions</Typography>
                      {[
                        { label: 'Très bien',   seuil: '≥ 16', color: '#22c55e' },
                        { label: 'Bien',        seuil: '≥ 14', color: '#06D6A0' },
                        { label: 'Assez bien',  seuil: '≥ 12', color: '#4D9FFF' },
                        { label: 'Passable',    seuil: '≥ 10', color: '#F59E0B' },
                        { label: 'Insuffisant', seuil: '< 10', color: '#EF4444' },
                      ].map(m => (
                        <Box key={m.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.6 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: m.color, flexShrink: 0, opacity: mlPerfPred.mention === m.label ? 1 : 0.22 }} />
                          <Typography sx={{ fontSize: '0.68rem', flex: 1, color: mlPerfPred.mention === m.label ? m.color : '#8A9BB0', fontWeight: mlPerfPred.mention === m.label ? 800 : 500 }}>
                            {m.label}
                          </Typography>
                          <Typography sx={{ fontSize: '0.62rem', color: '#8A9BB0' }}>{m.seuil}</Typography>
                          {mlPerfPred.mention === m.label && (
                            <Chip label="✓" size="small" sx={{ height: 16, minWidth: 24, fontSize: '0.58rem', fontWeight: 800, background: `${m.color}18`, color: m.color, '& .MuiChip-label': { px: 0.6 } }} />
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, px: 1.5, borderRadius: '10px', background: '#F8FAFF', border: '1px dashed #C8D8E8' }}>
                  <Typography sx={{ fontSize: '1rem' }}>⚡</Typography>
                  <Typography sx={{ color: '#8A9BB0', fontSize: '0.78rem' }}>Service IA M3 non disponible — vérifiez que le serveur ML est démarré (port 5001)</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Card>
      </Box>

      <Grid container spacing={3}>

        {/* ══ 1. ÉVOLUTION INSCRIPTIONS ════════════ */}
        <Grid item xs={12} lg={8}>
          <SectionCard sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <CardHeader
                title="📊 Évolution des inscriptions (12 mois)"
                accentKey="evolution"
                onInfo={() => openInfo('evolution')}
              />
              {loading ? <LoadingRows /> : evolutionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="mois" stroke="#6B7280" angle={-45} textAnchor="end" height={80} tick={{ fill: '#8A9BB0', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#6B7280" tick={{ fill: '#8A9BB0', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: 12, border: `1.5px solid ${C.blueL}`, boxShadow: `0 4px 20px ${C.blue}18`, color: C.navy, fontSize: 13 }} formatter={v => [`${v} étudiants`, 'Nouvelles inscriptions']} />
                    <Legend />
                    <Bar dataKey="inscriptions" fill={C.blue} name="Nouvelles inscriptions" radius={[6, 6, 0, 0]} opacity={0.75} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon="📊" text="Aucune donnée disponible" sub="Les données apparaîtront une fois des inscriptions enregistrées" />
              )}
            </CardContent>
          </SectionCard>
        </Grid>

        {/* ══ 2. TOP DÉPARTEMENTS ══════════════════ */}
        <Grid item xs={12} lg={4}>
          <SectionCard sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <CardHeader
                title="🏛️ Top Départements"
                accentKey="topDepts"
                onInfo={() => openInfo('topDepts')}
              />
              {loading ? <LoadingRows /> : top5Depts.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {top5Depts.map((dept, index) => {
                    const medals   = ['🥇', '🥈', '🥉'];
                    const podColors= [C.yellow, '#C0C0C0', '#CD7F32'];
                    const isMedal  = index < 3;
                    return (
                      <Box key={index} sx={{
                        p: 2, borderRadius: '12px',
                        background: index === 0 ? `${C.yellow}08` : '#F9FAFB',
                        border: `1.5px solid ${isMedal ? podColors[index] + '30' : '#E5E7EB'}`,
                        animation: `${fadeUp} 0.4s ease-out ${index * 0.07}s both`,
                      }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', mb: 0.5, color: C.navy }}>
                          {isMedal ? medals[index] + ' ' : ''}{dept.nom_departement}
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: '#8A9BB0' }}>
                          {parseInt(dept.nombre_etudiants) || 0} étudiants · {parseInt(dept.nombre_enseignants) || 0} enseignants
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <EmptyState icon="🏛️" text="Aucun département" sub="Les départements apparaîtront une fois créés" />
              )}
            </CardContent>
          </SectionCard>
        </Grid>

        {/* ══ 3. COMPARAISON INTER-DEPTS ═══════════ */}
        <Grid item xs={12}>
          <SectionCard>
            <CardContent sx={{ p: 3 }}>
              <CardHeader
                title="🏆 Comparaison inter-départements"
                accentKey="comparaison"
                onInfo={() => openInfo('comparaison')}
                chip={!loading && comparaisonData.length > 0 && (
                  <Chip
                    label={`${comparaisonData.length} département${comparaisonData.length > 1 ? 's' : ''}`}
                    size="small"
                    sx={{ background: `${C.green}12`, color: C.green, fontWeight: 700, height: 22, fontSize: '0.72rem', border: `1px solid ${C.green}28` }}
                  />
                )}
              />
              {loading ? <LoadingRows /> : comparaisonData.length > 0 ? (
                <TableContainer sx={{ borderRadius: '12px', border: `1px solid ${C.blueL}`, overflow: 'hidden' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ background: C.blueL }}>
                        {['#', 'Département', 'Code', 'Étudiants', 'Enseignants', 'Ratio E/É', 'Spécialités'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#8A9BB0', py: 1.5, textAlign: h !== 'Département' && h !== 'Code' && h !== '#' ? 'center' : 'left' }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {comparaisonData.map((dept, index) => {
                        const nbEt    = parseInt(dept.nombre_etudiants)  || 0;
                        const nbEns   = parseInt(dept.nombre_enseignants) || 0;
                        const ratioVal = nbEns > 0 ? nbEt / nbEns : 999;
                        const ratioDisplay = nbEt > 0 && nbEns > 0 ? `1:${Math.round(nbEt / nbEns)}` : 'N/A';
                        const medals   = ['🥇', '🥈', '🥉'];
                        const podColors= [C.yellow, '#C0C0C0', '#CD7F32'];
                        return (
                          <TableRow key={index} sx={{
                            '&:hover': { background: `${C.green}06` },
                            background: index === 0 ? `${C.yellow}08` : 'transparent',
                            borderBottom: index < comparaisonData.length - 1 ? `1px solid ${C.blueL}` : 'none',
                            animation: `${fadeUp} 0.4s ease-out ${index * 0.05}s both`,
                          }}>
                            <TableCell sx={{ py: 2 }}>
                              {index < 3 ? (
                                <Box sx={{ width: 32, height: 32, borderRadius: '10px', background: `${podColors[index]}20`, border: `1.5px solid ${podColors[index]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                                  {medals[index]}
                                </Box>
                              ) : (
                                <Typography sx={{ fontWeight: 700, color: '#8A9BB0', fontSize: '0.85rem', pl: 1 }}>{index + 1}</Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: C.navy, fontSize: '0.88rem', py: 2 }}>{dept.nom_departement}</TableCell>
                            <TableCell sx={{ py: 2 }}>
                              <Chip label={dept.code_departement || 'N/A'} size="small" sx={{ background: '#E0F2FE', color: '#0369A1', fontWeight: 600, fontSize: '0.7rem' }} />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center', fontWeight: 600, py: 2 }}>{nbEt.toLocaleString()}</TableCell>
                            <TableCell sx={{ textAlign: 'center', fontWeight: 600, py: 2 }}>{nbEns.toLocaleString()}</TableCell>
                            <TableCell sx={{ textAlign: 'center', py: 2 }}>
                              <Chip label={ratioDisplay} size="small" sx={{
                                fontWeight: 700, fontSize: '0.72rem',
                                background: ratioVal <= 20 ? '#D1FAE5' : ratioVal <= 33 ? '#FEF3C7' : '#FEE2E2',
                                color:      ratioVal <= 20 ? '#065F46' : ratioVal <= 33 ? '#92400E' : '#991B1B',
                              }} />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center', fontWeight: 600, py: 2 }}>{parseInt(dept.nombre_specialites) || 0}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <EmptyState icon="📊" text="Aucune donnée disponible" sub="Les données apparaîtront une fois que des départements seront créés" />
              )}
            </CardContent>
          </SectionCard>
        </Grid>

        {/* ══ 4. LISTE DÉPARTEMENTS ════════════════ */}
        <Grid item xs={12}>
          <SectionCard>
            <CardContent sx={{ p: 3 }}>
              <CardHeader
                title="🏛️ Départements de l'établissement"
                accentKey="departements"
                onInfo={() => openInfo('departements')}
                chip={!loading && departementsData.length > 0 && (
                  <Chip
                    label={`${departementsData.length} département${departementsData.length > 1 ? 's' : ''}`}
                    size="small"
                    sx={{ background: `${C.orange}12`, color: C.orange, fontWeight: 600, height: 22, fontSize: '0.72rem', border: `1px solid ${C.orange}28` }}
                  />
                )}
              />
              {loading ? <LoadingRows /> : departementsData.length > 0 ? (
                <TableContainer sx={{ borderRadius: '12px', border: `1px solid ${C.blueL}`, overflow: 'hidden' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ background: C.blueL }}>
                        {['Département', 'Code', 'Étudiants', 'Enseignants', 'Niveaux', 'Spécialités'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#8A9BB0', py: 1.5 }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {departementsData.map((dept, index) => (
                        <TableRow key={index} sx={{
                          '&:hover': { background: `${C.orange}06` },
                          borderBottom: index < departementsData.length - 1 ? `1px solid ${C.blueL}` : 'none',
                          animation: `${fadeUp} 0.35s ease-out ${index * 0.04}s both`,
                        }}>
                          <TableCell sx={{ fontWeight: 600, color: C.navy }}>{dept.nom_departement}</TableCell>
                          <TableCell><Chip label={dept.code_departement || 'N/A'} size="small" sx={{ background: '#E0F2FE', color: '#0369A1', fontWeight: 600, fontSize: '0.7rem' }} /></TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{parseInt(dept.effectif_etudiants) || 0}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{parseInt(dept.effectif_enseignants) || 0}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{parseInt(dept.nombre_niveaux) || 0}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{parseInt(dept.nombre_specialites) || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <EmptyState icon="🏛️" text="Aucun département disponible" sub="Les départements apparaîtront une fois créés" />
              )}
            </CardContent>
          </SectionCard>
        </Grid>

      </Grid>


      {/* ══ INFO MODAL ═══════════════════════════════════════════════════════ */}
      <InfoModal
        open={infoModal.open}
        onClose={closeInfo}
        config={infoModal.key ? MODAL_CONFIGS[infoModal.key] : null}
        etablissement={etablissementInfo.nom_etablissement}
      />

      {/* ══ DIALOG — Gestion des utilisateurs ════════════════════════════════ */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: {
          borderRadius: '22px', overflow: 'hidden',
          boxShadow: `0 24px 60px rgba(26,58,107,0.16), 0 6px 24px ${C.blue}14`,
          border: `1.5px solid ${C.blueL}`,
          animation: `${popIn} 0.38s cubic-bezier(0.34,1.56,0.64,1)`,
          background: '#F7FBFF', maxHeight: '88vh',
        }}}
      >
        <Box sx={{
          background: `linear-gradient(135deg, #E8EAF6 0%, #E3F2FD 100%)`,
          px: 3, py: 2.5, borderBottom: `1.5px solid #C5CAE9`,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '14px', background: '#FFFFFF', border: `1.5px solid ${C.blue}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', boxShadow: `0 4px 16px rgba(77,159,255,0.22)`, color: '#5E35B1' }}>👥</Box>
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.4px', color: '#1A237E', mb: 0.2 }}>
                  Gestion des utilisateurs
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#4CAF50', animation: `${blinkDot} 2s infinite` }} />
                  <Typography sx={{ color: '#7986CB', opacity: 0.85, fontSize: '0.75rem', fontWeight: 500 }}>
                    2 types · {((stats.total_enseignants || 0) + (stats.total_etudiants || 0)).toLocaleString()} utilisateurs actifs
                  </Typography>
                </Box>
              </Box>
            </Box>
            <IconButton onClick={() => setDialogOpen(false)} sx={{ color: '#9FA8DA', opacity: 0.8, borderRadius: '10px', '&:hover': { background: `${C.blue}18`, opacity: 1, color: '#5E35B1' }, transition: 'all 0.2s' }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <DialogContent sx={{ p: 2.5, background: '#F7FBFF' }}>
          <Grid container spacing={1.8}>
            {userTypes.map((u, i) => (
              <Grid item xs={12} sm={6} key={u.label}>
                <Card elevation={0}
                  onMouseEnter={() => setHovCard(i)} onMouseLeave={() => setHovCard(null)}
                  onClick={() => { setDialogOpen(false); navigate(u.path); }}
                  sx={{
                    cursor: 'pointer', borderRadius: '20px', background: '#fff',
                    border: `1.5px solid ${hovCard === i ? u.color + '50' : C.blueL}`,
                    position: 'relative', overflow: 'hidden',
                    animation: `${popIn} 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.07}s both`,
                    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: hovCard === i ? `0 16px 48px ${u.color}22` : `0 2px 12px rgba(0,0,0,0.04)`,
                    transform: hovCard === i ? 'translateY(-6px)' : 'none',
                    '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: u.color, transform: hovCard === i ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left', transition: 'transform 0.35s ease' },
                  }}
                >
                  <CardContent sx={{ p: 2, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Box sx={{ width: 44, height: 44, borderRadius: '14px', background: `${u.color}12`, border: `1.5px solid ${u.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0, transition: 'transform 0.3s ease', transform: hovCard === i ? 'rotate(8deg) scale(1.12)' : 'none' }}>
                          {u.emoji}
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 900, color: C.navy, fontSize: '0.95rem' }}>{u.label}</Typography>
                          <Typography sx={{ fontWeight: 800, color: u.color, fontSize: '1.15rem', lineHeight: 1.1 }}>{u.count}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ width: 32, height: 32, borderRadius: '10px', background: hovCard === i ? u.color : `${u.color}12`, border: `1.5px solid ${u.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }}>
                        <ArrowForward sx={{ fontSize: 16, color: hovCard === i ? '#fff' : u.color, transition: 'color 0.3s' }} />
                      </Box>
                    </Box>
                    <Typography sx={{ color: '#6B7C93', fontSize: '0.76rem', lineHeight: 1.55, mb: 1.5, minHeight: 32 }}>{u.desc}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: `1px solid ${hovCard === i ? u.color + '18' : C.blueL}`, transition: 'border-color 0.3s' }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, background: `${u.color}10`, border: `1px solid ${u.color}28`, borderRadius: '50px', px: 1.2, py: 0.4 }}>
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: u.color }}>{u.badge}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography sx={{ fontSize: '0.75rem' }}>{u.statIcon}</Typography>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#8A9BB0' }}>{u.stat}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>

      {/* ══ DIALOG DÉTAIL ML ══════════════════════════════════════════════════ */}
      <Dialog open={!!detailML} onClose={() => setDetailML(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '22px', border: `1.5px solid ${C.blueL}`, boxShadow: `0 24px 60px rgba(26,58,107,0.16)`, animation: `${popIn} 0.35s cubic-bezier(0.34,1.56,0.64,1)`, overflow: 'hidden' } }}
      >
        {detailML && mlPred && (() => {
          const isReussite = detailML === 'reussite';
          const accent = isReussite ? mlPred.couleur : '#EF4444';
          const taux   = isReussite ? mlPred.taux_reussite_predit : Math.round((100 - mlPred.taux_reussite_predit) * 10) / 10;

          const Row = ({ label, val, note }) => (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 1.1, borderBottom: `1px solid ${C.blueL}` }}>
              <Box>
                <Typography sx={{ fontSize: '0.78rem', color: C.navy, fontWeight: 600 }}>{label}</Typography>
                {note && <Typography sx={{ fontSize: '0.68rem', color: '#8A9BB0', mt: 0.2 }}>{note}</Typography>}
              </Box>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: accent, flexShrink: 0, ml: 2 }}>{val}</Typography>
            </Box>
          );

          return (
            <>
              <Box sx={{ px: 3, py: 2.5, background: `linear-gradient(135deg, ${accent}10 0%, ${C.blueL} 100%)`, borderBottom: `1px solid ${C.blueL}` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: `${accent}15`, border: `1.5px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                      {isReussite ? '🎯' : '⚠️'}
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 900, color: C.navy, fontSize: '1rem' }}>
                        {isReussite ? 'Taux de réussite prédit' : "Taux d'échec prédit"} 2025-2026
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0' }}>
                        {isReussite ? 'Modèle M1 · Régression · explications détaillées' : "Dérivé du taux de réussite M1 · explications détaillées"}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton size="small" onClick={() => setDetailML(null)}
                    sx={{ color: '#8A9BB0', borderRadius: '10px', '&:hover': { background: C.blueL, color: C.navy } }}>
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mt: 2.5 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: '3rem', color: accent, lineHeight: 1, letterSpacing: '-2px' }}>{taux}</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#8A9BB0', mb: 0.6, fontSize: '1.2rem' }}>%</Typography>
                  <Chip label={isReussite ? mlPred.interpretation : (taux > 35 ? 'Élevé' : taux > 20 ? 'Modéré' : 'Faible')} size="small"
                    sx={{ mb: 0.5, ml: 0.5, background: `${accent}18`, color: accent, border: `1px solid ${accent}35`, fontWeight: 700 }} />
                </Box>
                <LinearProgress variant="determinate" value={taux}
                  sx={{ mt: 1.2, height: 6, borderRadius: 3, backgroundColor: `${accent}15`, '& .MuiLinearProgress-bar': { backgroundColor: accent, borderRadius: 3 } }} />
              </Box>
              <DialogContent sx={{ p: 3 }}>
                <Box sx={{ mb: 3, p: 2, borderRadius: '12px', background: C.blueL, border: `1px solid ${C.blue}20` }}>
                  <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.78rem', mb: 0.8 }}>
                    {isReussite ? 'Comment cette prédiction est-elle calculée ?' : "D'où vient ce taux d'échec ?"}
                  </Typography>
                  <Typography sx={{ fontSize: '0.77rem', color: '#64748B', lineHeight: 1.75 }}>
                    {isReussite
                      ? "Le modèle M1 a été entraîné sur des données académiques tunisiennes. Il prend en entrée les taux de réussite des 2 années précédentes ainsi que des indicateurs institutionnels de votre établissement (ratio étudiants/enseignants, absentéisme) pour estimer le taux de réussite de l'année suivante."
                      : "Le taux d'échec est le complément du taux de réussite prédit : 100% − taux_réussite_prédit. Ce chiffre permet d'anticiper les besoins en soutien pédagogique pour votre établissement."
                    }
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5 }}>
                  {isReussite ? 'Données injectées dans le modèle' : 'Calcul pas à pas'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', mb: 3 }}>
                  {isReussite ? (
                    <>
                      <Row label="Taux de réussite 2023-2024" val={`${mlDefaultData.m1?.taux_reussite_an2 ?? '—'} %`} note="Année n-2 · données réelles de l'établissement" />
                      <Row label="Taux de réussite 2024-2025" val={`${mlDefaultData.m1?.taux_reussite_an1 ?? '—'} %`} note="Année n-1 · tendance la plus récente" />
                      <Row label="Taux d'absence moyen" val={`${mlDefaultData.m1?.taux_absence_moyen ?? '—'} %`} note="Calculé depuis la base de l'établissement" />
                      <Row label="Ratio étudiants / enseignant" val={`${mlDefaultData.m1?.ratio_etud_ens ?? '—'}`} note="Calculé depuis la base de données" />
                      <Row label="Type établissement" val={`${mlDefaultData.m1?.type_etablissement ?? '—'}`} note="Type de votre établissement" />
                    </>
                  ) : (
                    <>
                      <Row label="Taux de réussite prédit (M1)" val={`${mlPred.taux_reussite_predit} %`} note="Résultat du modèle M1" />
                      <Row label="Complément (100 − réussite)" val={`${taux} %`} note="= Taux d'échec estimé" />
                      <Row label="Effectif total étudiants" val={(stats.total_etudiants || 0).toLocaleString('fr-TN')} note="Source : base de données SIAPET" />
                      <Row label="Étudiants en situation d'échec" val={`~${Math.round(taux * (stats.total_etudiants || 0) / 100).toLocaleString('fr-TN')}`} note="Estimation = taux × effectif" />
                    </>
                  )}
                </Box>
                <Box sx={{ p: 2, borderRadius: '12px', background: `${accent}0c`, border: `1px solid ${accent}25` }}>
                  <Typography sx={{ fontWeight: 800, color: accent, fontSize: '0.76rem', mb: 0.6 }}>
                    {isReussite ? 'Interprétation du résultat' : 'Ce que ce chiffre implique'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.77rem', color: '#64748B', lineHeight: 1.7 }}>
                    {isReussite
                      ? (mlPred.taux_reussite_predit >= 70
                          ? `Un taux de ${mlPred.taux_reussite_predit}% est jugé BON. Les conditions actuelles de votre établissement sont favorables à la réussite des étudiants.`
                          : mlPred.taux_reussite_predit >= 55
                          ? `Un taux de ${mlPred.taux_reussite_predit}% est MOYEN. Des actions d'amélioration sont recommandées pour votre établissement.`
                          : `Un taux de ${mlPred.taux_reussite_predit}% est FAIBLE. Des mesures urgentes sont nécessaires pour votre établissement.`)
                      : `Un taux d'échec de ${taux}% signifie qu'environ ${Math.round(taux * (stats.total_etudiants || 0) / 100).toLocaleString('fr-TN')} étudiants risquent de ne pas valider leur année dans votre établissement.`
                    }
                  </Typography>
                </Box>
              </DialogContent>
            </>
          );
        })()}
      </Dialog>

    </Box>
  );
};

export default DirecteurDashboard;
