import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Paper,
  Dialog,
  DialogContent,
  IconButton,
  keyframes,
  Tooltip,
  CircularProgress,
  LinearProgress,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { Close, ArrowForward, InfoOutlined, People, AccountBalance, Timeline } from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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
  performance:  { color: C.blue,   gradient: `linear-gradient(90deg, ${C.blue}, ${C.blueB})` },
  budget:       { color: C.purple, gradient: `linear-gradient(90deg, ${C.purple}, #9D4EDD)`   },
  comparaison:  { color: C.green,  gradient: `linear-gradient(90deg, ${C.green}, #05C78D)`    },
  etablissement:{ color: C.orange, gradient: `linear-gradient(90deg, ${C.orange}, #FF8C5A)`   },
};

// ── SECTION CARD ──────────────────────────────────
function SectionCard({ accentKey, children, sx = {} }) {
  return (
    <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', ...sx }}>
      {children}
    </Card>
  );
}

// ── INFO POPUP MODAL ──────────────────────────────
function InfoModal({ open, onClose, config }) {
  if (!config) return null;
  const accent = CARD_ACCENTS[config.accentKey] || CARD_ACCENTS.performance;

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
      {/* Header */}
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
              Analyse détaillée — Tunisie 🇹🇳
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

      {/* Body */}
      <DialogContent sx={{ p: 3 }}>
        {/* KPI summary boxes */}
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

        {/* Description */}
        <Box sx={{ mb: 2.5, p: 2.5, borderRadius: '14px', background: '#fff', border: `1px solid ${C.blueL}` }}>
          <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.88rem', mb: 1.2 }}>
            📖 Comment lire cette carte ?
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.7 }}>
            {config.description}
          </Typography>
        </Box>

        {/* Legend items */}
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

        {/* Insight box */}
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

      {/* Footer */}
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

// ── CARD HEADER with title + info button ──────────
function CardHeader({ title, accentKey, onInfo, chip }) {
  const accent = CARD_ACCENTS[accentKey] || CARD_ACCENTS.performance;
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
  performance: {
    accentKey: 'performance',
    icon: '📈',
    title: 'Évolution du Taux de Réussite (5 ans)',
    kpis: [
      { icon: '📈', label: 'Taux actuel',   value: '79%',   color: C.blue   },
      { icon: '🚀', label: 'Progression',   value: '+11%',  color: C.green  },
      { icon: '🏆', label: 'Meilleur taux', value: '79%',   color: C.yellow },
      { icon: '📉', label: 'Taux minimal',  value: '68%',   color: C.orange },
    ],
    description:
      'Ce graphique linéaire retrace l\'évolution annuelle du taux de réussite moyen sur l\'ensemble des établissements de votre rectorat. Chaque point représente le pourcentage d\'étudiants ayant validé leur année académique. Une tendance haussière indique une amélioration de la qualité pédagogique globale.',
    legend: [
      { color: '#FF6B6B', label: 'Taux de réussite (%)',  desc: 'Pourcentage d\'étudiants ayant validé leur année', badge: '2021–2025' },
      { color: C.green,   label: 'Tendance positive',     desc: 'Axe Y entre 65% et 85% pour une meilleure lisibilité' },
      { color: C.blue,    label: 'Points de données',     desc: 'Chaque point = 1 année académique complète' },
    ],
    insight: 'Le taux de réussite a progressé de 11 points en 5 ans, passant de 68% à 79%. Cette amélioration constante reflète les efforts d\'encadrement et de modernisation pédagogique déployés depuis 2021.',
  },

  budget: {
    accentKey: 'budget',
    icon: '💰',
    title: 'Répartition du Budget Alloué',
    kpis: [
      { icon: '💼', label: 'Personnel',      value: '44%',   color: C.purple },
      { icon: '🔬', label: 'Recherche',      value: '22%',   color: C.blue   },
      { icon: '🏗️', label: 'Infrastructure', value: '14%',  color: C.orange },
      { icon: '🖥️', label: 'Équipement',    value: '11%',   color: C.green  },
    ],
    description:
      'Ce graphique en secteurs (camembert) représente la distribution du budget global alloué à votre rectorat selon les grandes catégories de dépenses. Chaque tranche correspond à un poste budgétaire exprimé en milliers de dinars tunisiens (K TND) et en pourcentage du budget total.',
    legend: [
      { color: '#FF6B6B', label: 'Recherche',      desc: 'Projets de recherche scientifique et publications',  badge: '1 200K TND' },
      { color: '#4ECDC4', label: 'Infrastructure',  desc: 'Travaux, entretien bâtiments et réseaux',             badge: '800K TND'   },
      { color: '#FFB088', label: 'Personnel',       desc: 'Salaires, primes et charges sociales',               badge: '2 500K TND' },
      { color: '#C7CEEA', label: 'Équipement',      desc: 'Matériel pédagogique et informatique',               badge: '600K TND'   },
      { color: '#95E1D3', label: 'Autres',          desc: 'Frais administratifs et imprévus',                   badge: '400K TND'   },
    ],
    insight: 'Le poste Personnel représente 44% du budget, ce qui est dans la norme pour les établissements d\'enseignement supérieur. Un rééquilibrage vers la Recherche (+5%) permettrait d\'améliorer le classement académique.',
  },

  comparaison: {
    accentKey: 'comparaison',
    icon: '🏆',
    title: 'Comparaison Inter-établissements',
    kpis: [
      { icon: '🏫', label: 'Établissements', value: 'N',     color: C.green  },
      { icon: '👨‍🏫', label: 'Ratio moyen',  value: '1:22',  color: C.blue   },
      { icon: '🥇', label: '1er rang',       value: 'Max ét.',color: C.yellow },
      { icon: '📊', label: 'Critère',        value: 'Effectif',color: C.purple },
    ],
    description:
      'Ce tableau classe vos établissements par ordre décroissant du nombre d\'étudiants. Le Ratio Enseignant/Étudiant (E/É) mesure la qualité d\'encadrement : plus il est élevé (1 enseignant pour peu d\'étudiants), meilleur est l\'accompagnement pédagogique.',
    legend: [
      { color: C.green,   label: 'Ratio Bon (1:≤20)',     desc: '1 enseignant pour 20 étudiants ou moins',    badge: '✅ Excellent' },
      { color: C.yellow,  label: 'Ratio Moyen (1:21–33)', desc: '1 enseignant pour 21 à 33 étudiants',        badge: '⚠️ Moyen'    },
      { color: C.orange,  label: 'Ratio Faible (1:>33)',  desc: '1 enseignant pour plus de 33 étudiants',     badge: '🔴 Critique' },
      { color: C.blue,    label: 'Médailles 🥇🥈🥉',     desc: 'Top 3 établissements par effectif étudiant'               },
    ],
    insight: 'Un ratio d\'encadrement inférieur à 1:20 est considéré comme excellent dans l\'enseignement supérieur. Identifiez les établissements sous-dotés pour prioriser les recrutements d\'enseignants.',
  },

  etablissement: {
    accentKey: 'etablissement',
    icon: '🏛️',
    title: 'Établissements sous Tutelle',
    kpis: [
      { icon: '🏫', label: 'Total',        value: 'N',       color: C.orange },
      { icon: '⭐', label: 'Excellents',   value: '≥3000',   color: C.green  },
      { icon: '👥', label: 'Étudiants',    value: 'Temps réel', color: C.blue },
      { icon: '📋', label: 'Statuts',      value: '4 niveaux', color: C.purple },
    ],
    description:
      'Ce tableau présente en temps réel l\'ensemble des établissements placés sous votre tutelle académique. Les données d\'effectifs (étudiants, enseignants, directeurs) sont synchronisées avec la base de données. Le statut évalue la taille de l\'établissement selon son effectif étudiant actuel.',
    legend: [
      { color: C.green,   label: 'Excellent — ≥ 3 000 étudiants', desc: 'Grand établissement à fort impact régional', badge: '⭐ Top' },
      { color: C.blue,    label: 'Bon — ≥ 1 500 étudiants',       desc: 'Établissement de taille intermédiaire solide'              },
      { color: C.yellow,  label: 'Moyen — ≥ 500 étudiants',       desc: 'Établissement en développement'                           },
      { color: C.orange,  label: 'Faible — < 500 étudiants',      desc: 'Petit établissement ou nouveau. Suivi recommandé', badge: '⚠️' },
    ],
    insight: 'Cliquez sur "Détails" pour accéder à la fiche complète d\'un établissement (taux de réussite, budget, départements). Priorisez le suivi des établissements en statut "Faible" ou "Moyen".',
  },
};

// ─────────────────────────────────────────────────
const RecteurDashboard = () => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [infoModal, setInfoModal]   = useState({ open: false, key: null });
  const [hovCard,   setHovCard]     = useState(null);

  const [userStats, setUserStats] = useState({ DIRECTEUR: 0, ENSEIGNANT: 0, ETUDIANT: 0, total: 0 });
  const [rectoratInfo, setRectoratInfo] = useState({ nom: 'Chargement...' });
  const [dashboardStats, setDashboardStats] = useState(null);
  const [comparaisonData,  setComparaisonData]  = useState([]);
  const [etablissementsData, setEtablissementsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mlDefaultData, setMlDefaultData] = useState({});

  // ML states — style admin
  const [mlPred,        setMlPred]        = useState(null);
  const [mlPredLoad,    setMlPredLoad]    = useState(false);
  const [mlPerfPred,    setMlPerfPred]    = useState(null);
  const [mlPerfLoad,    setMlPerfLoad]    = useState(false);
  const [detailML,      setDetailML]      = useState(null); // 'reussite' | 'echec' | null
  const [mlProjection,  setMlProjection]  = useState([]);
  const [mlProjLoading, setMlProjLoading] = useState(false);
  const [mlProjMode,    setMlProjMode]    = useState('annee');

  // M3 projection to 2030
  const [mlPerfProjection,  setMlPerfProjection]  = useState([]);
  const [mlPerfProjLoading, setMlPerfProjLoading] = useState(false);
  const [mlPerfProjMode,    setMlPerfProjMode]    = useState('annee');

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserStats(),
        fetchDashboardStats(),
        fetchComparaisonEtablissements(),
        fetchEtablissementsSousTutelle(),
        fetchMLData(),
      ]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await api.get('/recteur/dashboard/stats');
      if (res.data.success) setDashboardStats(res.data.stats);
    } catch (e) { console.error('Dashboard stats error:', e); }
  };

  const fetchMLData = async () => {
    try {
      const res = await api.get('/recteur/dashboard/ml-data');
      if (res.data.success) {
        setMlDefaultData({ m1: res.data.m1, m2: res.data.m2, m3: res.data.m3 });
      }
    } catch (e) { console.error('ML data fetch error:', e); }
  };

  // M1 — se déclenche dès que les données du rectorat arrivent
  const m1Key = JSON.stringify(mlDefaultData.m1);
  useEffect(() => {
    if (!mlDefaultData.m1) return;
    setMlPredLoad(true);
    mlService.predireReussite(mlDefaultData.m1)
      .then(r => setMlPred(r.data))
      .catch(() => {})
      .finally(() => setMlPredLoad(false));
  }, [m1Key]);

  // Projection multi-annuelle M1 jusqu'à 2030
  const projeterRecteur = async () => {
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
      console.error('Projection recteur error:', e);
    } finally {
      setMlProjLoading(false);
    }
  };

  // M3 projection 2026 → 2030 (itératif)
  const projeterPerformanceRecteur = async () => {
    if (!mlDefaultData.m3 || !mlPerfPred) return;
    setMlPerfProjLoading(true);
    setMlPerfProjection([]);
    const results = [];
    let moyPrec = parseFloat(mlDefaultData.m3.moy_semestre_prec) || 11;
    let moyAct  = parseFloat(mlPerfPred.moyenne_finale_predite)   || 12;
    try {
      for (let year = 2026; year <= 2030; year++) {
        const pente = Math.round((moyAct - moyPrec) * 10) / 10;
        const { data } = await mlService.predirePerformance({
          ...mlDefaultData.m3,
          moy_semestre_prec:   Math.round(moyPrec * 100) / 100,
          note_cc1:            Math.min(20, Math.max(0, Math.round((moyAct - 0.5) * 10) / 10)),
          note_cc2:            Math.min(20, Math.max(0, Math.round(moyAct * 10) / 10)),
          note_cc3:            Math.min(20, Math.max(0, Math.round((moyAct + 0.5) * 10) / 10)),
          pente_evolution:     pente,
        });
        const moy = parseFloat(data.moyenne_finale_predite);
        results.push({ annee: `${year}`, moyenne: moy, mention: data.mention, couleur: data.couleur, predicted: true });
        moyPrec = moyAct;
        moyAct  = moy;
      }
      setMlPerfProjection(results);
    } catch (e) {
      console.error('Projection M3 erreur:', e);
    } finally {
      setMlPerfProjLoading(false);
    }
  };

  // M3 — se déclenche dès que les données du rectorat arrivent
  const m3Key = JSON.stringify(mlDefaultData.m3);
  useEffect(() => {
    if (!mlDefaultData.m3) return;
    setMlPerfLoad(true);
    mlService.predirePerformance(mlDefaultData.m3)
      .then(r => setMlPerfPred(r.data))
      .catch(() => {})
      .finally(() => setMlPerfLoad(false));
  }, [m3Key]);

  const fetchUserStats = async () => {
    try {
      const res = await api.get('/users/recteur/stats');
      const stats = { DIRECTEUR: 0, ENSEIGNANT: 0, ETUDIANT: 0, total: res.data.total || 0 };
      if (res.data.byRole) res.data.byRole.forEach(r => { stats[r.type_utilisateur] = parseInt(r.count) || 0; });
      if (res.data.rectorat) setRectoratInfo({ nom: res.data.rectorat.nom || 'Rectorat' });
      setUserStats(stats);
    } catch (e) { console.error(e); }
  };

  const fetchComparaisonEtablissements = async () => {
    try {
      const res = await api.get('/recteur/dashboard/comparaison-etablissements');
      if (res.data.success && res.data.data) setComparaisonData(res.data.data);
      else setComparaisonData([]);
    } catch (e) { console.error(e); setComparaisonData([]); }
  };

  const fetchEtablissementsSousTutelle = async () => {
    try {
      const res = await api.get('/recteur/dashboard/etablissements-sous-tutelle');
      if (res.data.success && res.data.data) setEtablissementsData(res.data.data);
      else setEtablissementsData([]);
    } catch (e) { console.error(e); setEtablissementsData([]); }
  };

  const openInfo = (key) => setInfoModal({ open: true, key });
  const closeInfo = () => setInfoModal({ open: false, key: null });

  // pagination pour établissements sous tutelle
  const ETAB_PER_PAGE = 4;
  const [etabPage, setEtabPage] = useState(1);
  const etabTotalPages = Math.ceil(etablissementsData.length / ETAB_PER_PAGE);
  const etabPageData   = etablissementsData.slice((etabPage - 1) * ETAB_PER_PAGE, etabPage * ETAB_PER_PAGE);

  // top 3 uniquement pour la comparaison
  const top3Comparaison = comparaisonData.slice(0, 3);

  // ── static chart data ──
  const performanceData = [
    { annee: '2021', taux: 68 },
    { annee: '2022', taux: 71 },
    { annee: '2023', taux: 74 },
    { annee: '2024', taux: 76 },
    { annee: '2025', taux: 79 },
  ];

  const budgetData = [
    { categorie: 'Recherche',      montant: 1200 },
    { categorie: 'Infrastructure', montant: 800  },
    { categorie: 'Personnel',      montant: 2500 },
    { categorie: 'Équipement',     montant: 600  },
    { categorie: 'Autres',         montant: 400  },
  ];
  const budgetTotal = budgetData.reduce((s, d) => s + d.montant, 0);
  const COLORS = ['#FF6B6B', '#4ECDC4', '#FFB088', '#C7CEEA', '#95E1D3'];

  // ── user types for dialog ──
  const userTypes = [
    { role: 'DIRECTEUR',  label: 'Directeurs',  emoji: '👨‍💼', color: C.purple,
      count: userStats.DIRECTEUR.toString(),
      desc: "Gèrent les établissements et coordonnent les équipes pédagogiques.",
      badge: `${userStats.DIRECTEUR} actifs`, stat: '94% connexion', statIcon: '📶' },
    { role: 'ENSEIGNANT', label: 'Enseignants', emoji: '👨‍🏫', color: C.blue,
      count: userStats.ENSEIGNANT.toString(),
      desc: "Dispensent les cours et suivent les performances de leurs étudiants.",
      badge: `${userStats.ENSEIGNANT} inscrits`, stat: '89% actifs', statIcon: '✅' },
    { role: 'ETUDIANT',   label: 'Étudiants',   emoji: '👨‍🎓', color: C.green,
      count: userStats.ETUDIANT.toString(),
      desc: "Suivent leurs cursus et progressent grâce aux outils d'analyse IA.",
      badge: `${userStats.ETUDIANT} inscrits`, stat: 'Taux 76.8%', statIcon: '📊' },
  ];

  // ── Loading skeleton row ──
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

  // ─────────────────────────────────────────────
  return (
    <Box>
      {/* ══ HEADER ════════════════════════════════ */}
      <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: '#fff', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: '16px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
            🏛️
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B' }}>Vue d'ensemble du Rectorat</Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>{rectoratInfo.nom} — Tunisie 🇹🇳</Typography>
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
          <Tooltip title="Établissements">
            <IconButton onClick={() => navigate('/dashboard/recteur/etablissements')}
              sx={{ width: 44, height: 44, borderRadius: '14px', background: '#3B82F6', color: '#fff',
                transition: 'all 0.3s ease', boxShadow: '0 3px 10px rgba(59,130,246,0.4)',
                '&:hover': { background: '#2563EB', transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(59,130,246,0.5)' } }}>
              <AccountBalance sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ══ STAT CARDS ════════════════════════════ */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            icon: '🏫', label: 'Établissements',
            value: dashboardStats ? (parseInt(dashboardStats.total_etablissements) || 0).toString() : (loading ? '…' : '—'),
            color: C.orange, bg: `linear-gradient(135deg, ${C.orange}08, #FFF1EE)`,
          },
          {
            icon: '👥', label: 'Étudiants totaux',
            value: dashboardStats
              ? (parseInt(dashboardStats.total_etudiants) >= 1000
                  ? `${(parseInt(dashboardStats.total_etudiants) / 1000).toFixed(1)}K`
                  : (parseInt(dashboardStats.total_etudiants) || 0).toString())
              : (loading ? '…' : '—'),
            color: C.blue, bg: `linear-gradient(135deg, ${C.blue}08, #EFF6FF)`,
          },
          {
            icon: '📈', label: 'Taux de réussite',
            value: dashboardStats?.avg_taux_reussite != null
              ? `${parseFloat(dashboardStats.avg_taux_reussite).toFixed(1)}%`
              : (loading ? '…' : '—'),
            color: C.green, bg: `linear-gradient(135deg, ${C.green}08, #E6FBF5)`,
          },
          {
            icon: '💰', label: 'Budget global',
            value: '5.5M TND',
            color: '#F59E0B', bg: 'linear-gradient(135deg, #F59E0B08, #FFF7ED)',
          },
        ].map((s, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ borderRadius: 3, border: '1.5px solid #EAF4FF', background: s.bg }}>
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

      {/* ══ PRÉVISIONS ML ══════════════════════════════════════════════════════ */}
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
                Modèle M1 · Basé sur les taux de réussite et données institutionnelles du rectorat
              </Typography>
            </Box>
            <Chip label="IA ACTIVE" size="small" sx={{
              ml: 'auto', flexShrink: 0,
              background: `linear-gradient(135deg, #1A3A6B, #4D9FFF)`,
              color: '#fff', fontWeight: 800, fontSize: '0.7rem',
              borderRadius: '8px', border: 'none',
            }} />
          </Box>

          {/* Body M1 */}
          {mlPredLoad ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6, gap: 2 }}>
              <CircularProgress size={28} sx={{ color: C.blue }} />
              <Typography sx={{ color: '#8A9BB0', fontSize: '0.85rem' }}>Calcul des prévisions en cours...</Typography>
            </Box>
          ) : mlPred ? (
            <Grid container>
              {/* Colonne gauche — métriques */}
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
                    <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0' }}>
                      {mlPred.taux_reussite_predit >= 79 ? '▲ +' : '▼ '}
                      {Math.abs(Math.round((mlPred.taux_reussite_predit - 79) * 10) / 10)} pts vs année 2024-2025 (79%)
                    </Typography>
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
                      Estimation : ~{Math.round((100 - mlPred.taux_reussite_predit) * (userStats.ETUDIANT || 0) / 100).toLocaleString('fr-TN')} étudiants concernés
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Colonne droite — graphique */}
              <Grid item xs={12} md={7}>
                <Box sx={{ p: 3 }}>
                  {/* Sélecteur de mode */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {mlProjMode === 'annee' ? 'Évolution historique + prévision 2026' : 'Projection 2026 → 2030'}
                    </Typography>
                    <ToggleButtonGroup
                      value={mlProjMode}
                      exclusive
                      onChange={(_, v) => { if (v) { setMlProjMode(v); if (v === 'projection' && !mlProjection.length) projeterRecteur(); } }}
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
                      Le modèle M1 analyse les taux de réussite des 2 dernières années, le taux d&apos;absence moyen et le ratio étudiants/enseignants du rectorat.
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

          {/* ── M3 Performance Future ─────────────────────────────────────────── */}
          <Box sx={{ px: 3, pb: 3 }}>
            <Box sx={{ pt: 2.5, borderTop: `1px dashed ${C.blue}25` }}>

              {/* M3 Header row */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(135deg, #7B2CBF, #4D9FFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🎯</Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.85rem' }}>Performance Future — M3</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0' }}>
                      {mlPerfProjMode === 'annee'
                        ? 'Moyenne finale prédite · données du rectorat · 2025-2026'
                        : 'Projection M3 · moyenne prédite 2026 → 2030'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {mlPerfPred && (
                    <ToggleButtonGroup
                      value={mlPerfProjMode} exclusive size="small"
                      onChange={(_, v) => {
                        if (!v) return;
                        setMlPerfProjMode(v);
                        if (v === 'projection' && !mlPerfProjection.length) projeterPerformanceRecteur();
                      }}
                      sx={{ '& .MuiToggleButton-root': { borderRadius: '8px !important', textTransform: 'none', fontWeight: 600, fontSize: '0.7rem', px: 1.2, py: 0.4, border: `1.5px solid ${C.purple}30` } }}
                    >
                      <ToggleButton value="annee" sx={{ '&.Mui-selected': { background: `${C.purple}18`, color: C.purple } }}>
                        2026
                      </ToggleButton>
                      <ToggleButton value="projection" sx={{ '&.Mui-selected': { background: `${C.purple}18`, color: C.purple } }}>
                        <Timeline sx={{ fontSize: 13, mr: 0.5 }} /> → 2030
                      </ToggleButton>
                    </ToggleButtonGroup>
                  )}
                  <Chip label="M3 · IA" size="small" sx={{ background: 'linear-gradient(135deg, #7B2CBF, #4D9FFF)', color: '#fff', fontWeight: 800, fontSize: '0.62rem', borderRadius: '8px', border: 'none' }} />
                </Box>
              </Box>

              {mlPerfLoad ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                  <CircularProgress size={18} sx={{ color: C.purple }} />
                  <Typography sx={{ color: '#8A9BB0', fontSize: '0.8rem' }}>Calcul en cours...</Typography>
                </Box>
              ) : mlPerfPred ? (
                <>
                  {/* ── Mode "annee": prédiction 2025-2026 ── */}
                  {mlPerfProjMode === 'annee' && (
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
                            { label: 'Très bien',  seuil: '≥ 16', color: '#22c55e' },
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
                  )}

                  {/* ── Mode "projection": graphique + tableau 2026–2030 ── */}
                  {mlPerfProjMode === 'projection' && (
                    mlPerfProjLoading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, gap: 1.5 }}>
                        <CircularProgress size={24} sx={{ color: C.purple }} />
                        <Typography sx={{ fontSize: '0.8rem', color: '#8A9BB0' }}>Calcul de la projection 2026–2030...</Typography>
                      </Box>
                    ) : mlPerfProjection.length > 0 ? (
                      <Box>
                        {/* Chart */}
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={mlPerfProjection} barSize={28}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                            <XAxis dataKey="annee" tick={{ fill: '#8A9BB0', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 20]} tick={{ fill: '#8A9BB0', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}/20`} />
                            <RechartsTooltip
                              contentStyle={{ background: '#fff', border: `1.5px solid ${C.blueL}`, borderRadius: 12, fontSize: 13, boxShadow: `0 4px 20px ${C.purple}18` }}
                              formatter={(v, _, p) => [`${typeof v === 'number' ? v.toFixed(2) : v}/20 · ${p.payload.mention}`, 'Moyenne prédite']}
                            />
                            <Bar dataKey="moyenne" radius={[6, 6, 0, 0]}>
                              {mlPerfProjection.map((entry, idx) => (
                                <Cell key={idx} fill={entry.couleur || C.purple} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>

                        {/* Cards: one per year */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, mt: 2 }}>
                          {mlPerfProjection.map(p => (
                            <Box key={p.annee} sx={{ textAlign: 'center', p: 1.5, borderRadius: '12px', background: `${p.couleur}0e`, border: `1.5px solid ${p.couleur}28` }}>
                              <Typography sx={{ fontSize: '0.65rem', color: '#8A9BB0', fontWeight: 700, mb: 0.4 }}>{p.annee}</Typography>
                              <Typography sx={{ fontWeight: 900, fontSize: '1.25rem', color: p.couleur, lineHeight: 1, letterSpacing: '-0.8px' }}>
                                {typeof p.moyenne === 'number' ? p.moyenne.toFixed(2) : p.moyenne}
                              </Typography>
                              <Typography sx={{ fontSize: '0.58rem', color: '#8A9BB0' }}>/20</Typography>
                              <Chip label={p.mention} size="small" sx={{ mt: 0.5, height: 18, fontSize: '0.56rem', fontWeight: 800, background: `${p.couleur}18`, color: p.couleur, border: `1px solid ${p.couleur}35`, '& .MuiChip-label': { px: 0.8 } }} />
                            </Box>
                          ))}
                        </Box>

                        {/* Trend summary */}
                        {(() => {
                          const first = mlPerfProjection[0]?.moyenne;
                          const last  = mlPerfProjection[mlPerfProjection.length - 1]?.moyenne;
                          const diff  = first && last ? Math.round((last - first) * 100) / 100 : null;
                          if (diff === null) return null;
                          const isHausse = diff >= 0;
                          return (
                            <Box sx={{ mt: 1.5, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <Box sx={{ width: 10, height: 10, borderRadius: '3px', background: mlPerfProjection[0]?.couleur || C.purple }} />
                                <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0' }}>Projection IA M3 2026–2030</Typography>
                              </Box>
                              <Box sx={{ px: 1.5, py: 0.8, borderRadius: '8px', background: isHausse ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isHausse ? '#86efac' : '#fca5a5'}` }}>
                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: isHausse ? '#15803d' : '#dc2626' }}>
                                  {isHausse ? '📈 +' : '📉 '}{diff} pts tendance 2026→2030
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })()}

                        <Box sx={{ mt: 2, p: 2, borderRadius: '12px', background: `${C.purple}08`, border: `1px solid ${C.purple}20` }}>
                          <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: C.navy, mb: 0.5 }}>Comment est calculée cette projection ?</Typography>
                          <Typography sx={{ fontSize: '0.71rem', color: '#64748B', lineHeight: 1.7 }}>
                            Le modèle M3 est appliqué de façon itérative : chaque moyenne prédite devient la base de l&apos;année suivante (enchaînement jusqu&apos;en 2030). La pente d&apos;évolution est recalculée à chaque itération.
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ py: 3, textAlign: 'center' }}>
                        <Typography sx={{ color: '#8A9BB0', fontSize: '0.8rem' }}>Erreur lors du calcul de la projection.</Typography>
                      </Box>
                    )
                  )}
                </>
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

        {/* ══ 1. PERFORMANCE CHART ══════════════════ */}
        <Grid item xs={12} lg={8}>
          <SectionCard accentKey="performance" sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <CardHeader
                title="📈 Évolution du taux de réussite (5 ans)"
                accentKey="performance"
                onInfo={() => openInfo('performance')}
              />
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="annee" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" domain={[65, 82]} />
                  <RechartsTooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="taux" stroke="#FF6B6B" strokeWidth={3}
                    dot={{ fill: '#FF6B6B', r: 6 }} name="Taux de réussite (%)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </SectionCard>
        </Grid>

        {/* ══ 2. BUDGET PIE ═════════════════════════ */}
        <Grid item xs={12} lg={4}>
          <SectionCard accentKey="budget" sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <CardHeader
                title="💰 Répartition du Budget"
                accentKey="budget"
                onInfo={() => openInfo('budget')}
              />
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={budgetData} cx="50%" cy="50%" labelLine={false} label={false}
                    outerRadius={85} fill="#8884d8" dataKey="montant">
                    {budgetData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value, name, props) => [
                      `${value}K TND (${((value / budgetTotal) * 100).toFixed(0)}%)`,
                      props.payload.categorie,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.8, justifyContent: 'center' }}>
                {budgetData.map((item, index) => (
                  <Box key={item.categorie} sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5,
                    px: 1.2, py: 0.4, borderRadius: '8px',
                    background: `${COLORS[index]}18`,
                    border: `1.5px solid ${COLORS[index]}40`,
                  }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[index] }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.72rem' }}>
                      {item.categorie}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS[index], fontSize: '0.72rem' }}>
                      {((item.montant / budgetTotal) * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </SectionCard>
        </Grid>

        {/* ══ 3. COMPARAISON ════════════════════════ */}
        <Grid item xs={12}>
          <SectionCard accentKey="comparaison">
            <CardContent sx={{ p: 3 }}>
              <CardHeader
                title="🏆 Comparaison inter-établissements"
                accentKey="comparaison"
                onInfo={() => openInfo('comparaison')}
                chip={!loading && comparaisonData.length > 0 && (
                  <Chip
                    label="Top 3"
                    size="small"
                    sx={{ background: `${C.green}12`, color: C.green, fontWeight: 700, height: 22, fontSize: '0.72rem', border: `1px solid ${C.green}28` }}
                  />
                )}
              />

              {loading ? <LoadingRows /> : top3Comparaison.length > 0 ? (
                <>
                  {/* ── Podium ── */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 2, mb: 3, mt: 1 }}>
                    {[top3Comparaison[1], top3Comparaison[0], top3Comparaison[2]].map((etab, idx) => {
                      if (!etab) return null;
                      const realRank   = idx === 0 ? 2 : idx === 1 ? 1 : 3;
                      const heights    = [90, 120, 70];
                      const medals     = ['🥇','🥈','🥉'];
                      const podColors  = [C.yellow, '#C0C0C0', '#CD7F32'];
                      const podColor   = podColors[realRank - 1];
                      const nbEt       = parseInt(etab.nombre_etudiants) || 0;
                      return (
                        <Box key={idx} sx={{
                          flex: 1, maxWidth: 200,
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          animation: `${fadeUp} 0.5s ease-out ${idx * 0.1}s both`,
                        }}>
                          <Typography sx={{ fontSize: '1.8rem', mb: 0.5 }}>{medals[realRank - 1]}</Typography>
                          <Typography sx={{
                            fontWeight: 800, color: C.navy, fontSize: '0.72rem',
                            textAlign: 'center', mb: 0.5, lineHeight: 1.3,
                            maxWidth: 160, px: 1,
                          }}>
                            {etab.nom_etablissement}
                          </Typography>
                          <Typography sx={{ fontWeight: 700, color: '#8A9BB0', fontSize: '0.7rem', mb: 1 }}>
                            {nbEt.toLocaleString()} étudiants
                          </Typography>
                          <Box sx={{
                            width: '100%', height: heights[idx],
                            background: `linear-gradient(180deg, ${podColor}80, ${podColor}28)`,
                            borderRadius: '10px 10px 0 0',
                            border: `2px solid ${podColor}50`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Typography sx={{ fontWeight: 900, color: podColor, fontSize: '1.5rem' }}>
                              {realRank}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>

                  {/* ── Table top 3 ── */}
                  <TableContainer sx={{ borderRadius: '12px', border: `1px solid ${C.blueL}`, overflow: 'hidden' }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ background: C.blueL }}>
                          {['#', 'Établissement', 'Type', 'Étudiants', 'Enseignants', 'Ratio E/É', 'Directeurs'].map(h => (
                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#8A9BB0', textAlign: h !== 'Établissement' && h !== 'Type' && h !== '#' ? 'center' : 'left', py: 1.5 }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {top3Comparaison.map((etab, index) => {
                          const nbEt  = parseInt(etab.nombre_etudiants)  || 0;
                          const nbEns = parseInt(etab.nombre_enseignants) || 0;
                          const ratioDisplay = nbEt > 0 && nbEns > 0 ? `1:${Math.round(nbEt / nbEns)}` : 'N/A';
                          const ratioVal = nbEns > 0 ? nbEt / nbEns : 999;
                          const podColors = [C.yellow, '#C0C0C0', '#CD7F32'];
                          const medals    = ['🥇','🥈','🥉'];
                          return (
                            <TableRow key={index} sx={{
                              '&:hover': { background: `${C.green}06` },
                              background: index === 0 ? `${C.yellow}08` : 'transparent',
                              borderBottom: index < 2 ? `1px solid ${C.blueL}` : 'none',
                              animation: `${fadeUp} 0.4s ease-out ${index * 0.07}s both`,
                            }}>
                              <TableCell sx={{ py: 2 }}>
                                <Box sx={{
                                  width: 32, height: 32, borderRadius: '10px',
                                  background: `${podColors[index]}20`,
                                  border: `1.5px solid ${podColors[index]}40`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '1rem',
                                }}>
                                  {medals[index]}
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700, color: C.navy, fontSize: '0.88rem', py: 2 }}>
                                {etab.nom_etablissement}
                              </TableCell>
                              <TableCell sx={{ py: 2 }}>
                                <Chip label={etab.type_etablissement || 'N/A'} size="small"
                                  sx={{ background: '#E0F2FE', color: '#0369A1', fontWeight: 600, fontSize: '0.7rem' }} />
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
                              <TableCell sx={{ textAlign: 'center', fontWeight: 600, py: 2 }}>
                                {parseInt(etab.nombre_directeurs) || 0}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                <EmptyState icon="📊" text="Aucune donnée disponible" sub="Les données apparaîtront une fois que des établissements seront créés" />
              )}
            </CardContent>
          </SectionCard>
        </Grid>

        {/* ══ 4. ÉTABLISSEMENTS SOUS TUTELLE ════════ */}
        <Grid item xs={12}>
          <SectionCard accentKey="etablissement">
            <CardContent sx={{ p: 3 }}>
              <CardHeader
                title="🏛️ Établissements sous tutelle"
                accentKey="etablissement"
                onInfo={() => openInfo('etablissement')}
                chip={!loading && etablissementsData.length > 0 && (
                  <Chip
                    label={`${etablissementsData.length} établissement${etablissementsData.length > 1 ? 's' : ''}`}
                    size="small"
                    sx={{ background: `${C.orange}12`, color: C.orange, fontWeight: 600, height: 22, fontSize: '0.72rem', border: `1px solid ${C.orange}28` }}
                  />
                )}
              />

              {loading ? <LoadingRows /> : etablissementsData.length > 0 ? (
                <>
                  <TableContainer sx={{ borderRadius: '12px', border: `1px solid ${C.blueL}`, overflow: 'hidden' }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ background: C.blueL }}>
                          {['Nom', 'Type', 'Étudiants', 'Enseignants', 'Directeurs', 'Statut', 'Actions'].map(h => (
                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#8A9BB0', textAlign: h !== 'Nom' && h !== 'Type' ? 'center' : 'left', py: 1.5 }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {etabPageData.map((etab, index) => {
                          const effectif    = parseInt(etab.effectif_etudiants)  || 0;
                          const enseignants = parseInt(etab.effectif_enseignants) || 0;
                          const directeurs  = parseInt(etab.nombre_directeurs)   || 0;
                          const statutCfg = {
                            excellent: { label: 'Excellent', bg: '#D1FAE5', color: '#065F46' },
                            bon:       { label: 'Bon',       bg: '#DBEAFE', color: '#1E40AF' },
                            moyen:     { label: 'Moyen',     bg: '#FEF3C7', color: '#92400E' },
                          }[etab.statut_effectif] || { label: 'Faible', bg: '#FEE2E2', color: '#991B1B' };

                          return (
                            <TableRow key={etab.id_etablissement} sx={{
                              '&:hover': { background: `${C.orange}06` },
                              borderBottom: index < etabPageData.length - 1 ? `1px solid ${C.blueL}` : 'none',
                              animation: `${fadeUp} 0.35s ease-out ${index * 0.05}s both`,
                            }}>
                              <TableCell sx={{ fontWeight: 600, color: C.navy, py: 2.2 }}>{etab.nom_etablissement}</TableCell>
                              <TableCell sx={{ py: 2.2 }}>
                                <Chip label={etab.type_etablissement || 'N/A'} size="small"
                                  sx={{ background: '#E0F2FE', color: '#0369A1', fontWeight: 600, fontSize: '0.7rem' }} />
                              </TableCell>
                              <TableCell sx={{ textAlign: 'center', fontWeight: 600, py: 2.2 }}>{effectif.toLocaleString()}</TableCell>
                              <TableCell sx={{ textAlign: 'center', fontWeight: 600, py: 2.2 }}>{enseignants.toLocaleString()}</TableCell>
                              <TableCell sx={{ textAlign: 'center', fontWeight: 600, py: 2.2 }}>{directeurs}</TableCell>
                              <TableCell sx={{ textAlign: 'center', py: 2.2 }}>
                                <Chip label={statutCfg.label} size="small"
                                  sx={{ background: statutCfg.bg, color: statutCfg.color, fontWeight: 600, fontSize: '0.72rem' }} />
                              </TableCell>
                              <TableCell sx={{ textAlign: 'center', py: 2.2 }}>
                                <Button variant="outlined" size="small"
                                  onClick={() => navigate(`/dashboard/recteur/etablissements/${etab.id_etablissement}`)}
                                  sx={{
                                    borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem',
                                    color: C.orange, borderColor: `${C.orange}40`,
                                    '&:hover': { background: `${C.orange}08`, borderColor: C.orange },
                                  }}
                                >
                                  Détails →
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* ── Pagination ── */}
                  {etabTotalPages > 1 && (
                    <Box sx={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      mt: 2.5, px: 0.5,
                    }}>
                      {/* Info */}
                      <Typography sx={{ fontSize: '0.78rem', color: '#8A9BB0', fontWeight: 600 }}>
                        Page {etabPage} / {etabTotalPages} — {etablissementsData.length} établissements
                      </Typography>

                      {/* Boutons */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        {/* Précédent */}
                        <Button
                          size="small"
                          onClick={() => setEtabPage(p => Math.max(1, p - 1))}
                          disabled={etabPage === 1}
                          sx={{
                            minWidth: 36, height: 36, borderRadius: '10px', p: 0,
                            border: `1.5px solid ${etabPage === 1 ? C.blueL : `${C.orange}40`}`,
                            color: etabPage === 1 ? '#C0CBD8' : C.orange,
                            fontSize: '1rem',
                            '&:hover': { background: `${C.orange}08`, borderColor: C.orange },
                            transition: 'all 0.2s',
                          }}
                        >
                          ‹
                        </Button>

                        {/* Numéros de page */}
                        {Array.from({ length: etabTotalPages }, (_, i) => i + 1).map(page => (
                          <Button
                            key={page}
                            size="small"
                            onClick={() => setEtabPage(page)}
                            sx={{
                              minWidth: 36, height: 36, borderRadius: '10px', p: 0,
                              fontWeight: 700, fontSize: '0.85rem',
                              background: etabPage === page
                                ? `linear-gradient(135deg, ${C.orange}, #FF8C5A)`
                                : 'transparent',
                              color: etabPage === page ? '#fff' : '#8A9BB0',
                              border: `1.5px solid ${etabPage === page ? 'transparent' : C.blueL}`,
                              boxShadow: etabPage === page ? `0 4px 12px ${C.orange}35` : 'none',
                              '&:hover': {
                                background: etabPage === page
                                  ? `linear-gradient(135deg, ${C.orange}, #FF8C5A)`
                                  : `${C.orange}08`,
                                borderColor: etabPage === page ? 'transparent' : `${C.orange}40`,
                                color: etabPage === page ? '#fff' : C.orange,
                              },
                              transition: 'all 0.2s',
                            }}
                          >
                            {page}
                          </Button>
                        ))}

                        {/* Suivant */}
                        <Button
                          size="small"
                          onClick={() => setEtabPage(p => Math.min(etabTotalPages, p + 1))}
                          disabled={etabPage === etabTotalPages}
                          sx={{
                            minWidth: 36, height: 36, borderRadius: '10px', p: 0,
                            border: `1.5px solid ${etabPage === etabTotalPages ? C.blueL : `${C.orange}40`}`,
                            color: etabPage === etabTotalPages ? '#C0CBD8' : C.orange,
                            fontSize: '1rem',
                            '&:hover': { background: `${C.orange}08`, borderColor: C.orange },
                            transition: 'all 0.2s',
                          }}
                        >
                          ›
                        </Button>
                      </Box>
                    </Box>
                  )}
                </>
              ) : (
                <EmptyState icon="🏛️" text="Aucun établissement trouvé" sub="Les établissements apparaîtront une fois créés" />
              )}
            </CardContent>
          </SectionCard>
        </Grid>

      </Grid>

      {/* ══ INFO MODAL ══════════════════════════════ */}
      <InfoModal
        open={infoModal.open}
        onClose={closeInfo}
        config={infoModal.key ? MODAL_CONFIGS[infoModal.key] : null}
      />

      {/* ══ DIALOG — Gestion des utilisateurs ═══════ */}
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
                    3 types · {userStats.total.toLocaleString()} utilisateurs actifs
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
              <Grid item xs={12} sm={6} key={u.role}>
                <Card elevation={0}
                  onMouseEnter={() => setHovCard(i)} onMouseLeave={() => setHovCard(null)}
                  onClick={() => { setDialogOpen(false); navigate(`/dashboard/recteur/users?role=${u.role.toLowerCase()}`); }}
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


      {/* ══ DIALOG DÉTAIL ML ════════════════════════════════════════════════════ */}
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
                      ? "Le modèle M1 a été entraîné sur des données académiques tunisiennes. Il prend en entrée les taux de réussite des 2 années précédentes ainsi que des indicateurs institutionnels du rectorat (ratio étudiants/enseignants, absentéisme) pour estimer le taux de réussite de l'année suivante."
                      : "Le taux d'échec est le complément du taux de réussite prédit : 100% − taux_réussite_prédit. Ce chiffre permet d'anticiper les besoins en soutien pédagogique pour le rectorat."
                    }
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5 }}>
                  {isReussite ? 'Données injectées dans le modèle' : 'Calcul pas à pas'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', mb: 3 }}>
                  {isReussite ? (
                    <>
                      <Row label="Taux de réussite 2023-2024" val={`${mlDefaultData.m1?.taux_reussite_an2 ?? '—'} %`} note="Année n-2 · données réelles du rectorat" />
                      <Row label="Taux de réussite 2024-2025" val={`${mlDefaultData.m1?.taux_reussite_an1 ?? '—'} %`} note="Année n-1 · tendance la plus récente" />
                      <Row label="Taux d'absence moyen" val={`${mlDefaultData.m1?.taux_absence_moyen ?? '—'} %`} note="Calculé depuis la base du rectorat" />
                      <Row label="Ratio étudiants / enseignant" val={`${mlDefaultData.m1?.ratio_etud_ens ?? '—'}`} note="Calculé depuis la base de données" />
                      <Row label="Type établissement" val={`${mlDefaultData.m1?.type_etablissement ?? '—'}`} note="Type dominant du rectorat" />
                    </>
                  ) : (
                    <>
                      <Row label="Taux de réussite prédit (M1)" val={`${mlPred.taux_reussite_predit} %`} note="Résultat du modèle M1" />
                      <Row label="Complément (100 − réussite)" val={`${taux} %`} note="= Taux d'échec estimé" />
                      <Row label="Effectif total étudiants" val={(userStats.ETUDIANT || 0).toLocaleString('fr-TN')} note="Source : base de données SIAPET" />
                      <Row label="Étudiants en situation d'échec" val={`~${Math.round(taux * (userStats.ETUDIANT || 0) / 100).toLocaleString('fr-TN')}`} note="Estimation = taux × effectif" />
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
                          ? `Un taux de ${mlPred.taux_reussite_predit}% est jugé BON. Les conditions actuelles du rectorat sont favorables à la réussite des étudiants.`
                          : mlPred.taux_reussite_predit >= 55
                          ? `Un taux de ${mlPred.taux_reussite_predit}% est MOYEN. Des actions d'amélioration sont recommandées pour le rectorat.`
                          : `Un taux de ${mlPred.taux_reussite_predit}% est FAIBLE. Des mesures urgentes sont nécessaires pour le rectorat.`)
                      : `Un taux d'échec de ${taux}% signifie qu'environ ${Math.round(taux * (userStats.ETUDIANT || 0) / 100).toLocaleString('fr-TN')} étudiants risquent de ne pas valider leur année dans ce rectorat.`
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

export default RecteurDashboard;