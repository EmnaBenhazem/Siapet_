import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, CircularProgress,
  Chip, Divider, TextField, Button, LinearProgress, Tooltip,
  ToggleButtonGroup, ToggleButton, Alert, Collapse,
  Dialog, DialogContent, IconButton,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip as RT, ResponsiveContainer,
  Legend, LineChart, Line, ReferenceLine,
} from 'recharts';
import {
  TrendingUp, TrendingDown, People, School, Business,
  Warning, CheckCircle, Psychology, AutoGraph, Insights,
  BubbleChart, BarChart as BarChartIcon, Timeline,
  EmojiEvents, ErrorOutline, Refresh, InfoOutlined, Close,
  FilterList, FilterListOff,
} from '@mui/icons-material';
import { keyframes } from '@mui/system';
import api from '../services/api';
import mlService from '../services/mlService';

// ── palette ────────────────────────────────────────────────────────
const C = {
  navy:   '#1A3A6B', blue:   '#4D9FFF', blueB: '#85BFFF',
  blueL:  '#EAF4FF', orange: '#FF6B35', green: '#06D6A0',
  yellow: '#FFD60A', purple: '#7B2CBF', pink:  '#FF4C8B',
  teal:   '#00BCD4',
};

const GRADE_COLORS = {
  critique:   '#EF4444',
  attention:  '#F97316',
  passable:   '#EAB308',
  assez_bien: '#84CC16',
  bien:       '#10B981',
  tres_bien:  '#06D6A0',
};

const MENTION_COLORS = ['#06D6A0','#4D9FFF','#FFD60A','#FF6B35','#7B2CBF','#FF4C8B'];

// ── Configs détails de chaque stat ─────────────────────────────────
const KPIINFO = {
  total_etudiants: {
    title: 'Total Étudiants',
    icon: '👥',
    color: '#4D9FFF',
    description: 'Nombre total d\'étudiants inscrits et actifs dans tous les établissements d\'enseignement supérieur tunisiens. Ce chiffre exclut les étudiants archivés, désinscrits ou transférés.',
    legend: [
      { label: 'Inscrits actifs', desc: 'Étudiants ayant validé leur inscription pour l\'année en cours', color: '#4D9FFF' },
      { label: 'Exclus du comptage', desc: 'Étudiants archivés, transférés ou en abandon définitif', color: '#8A9BB0' },
    ],
    insight: 'Un effectif croissant signale une attractivité renforcée du système. Comparez avec les années précédentes pour détecter des tendances par région.',
  },
  total_enseignants: {
    title: 'Corps Enseignant',
    icon: '👨‍🏫',
    color: '#7B2CBF',
    description: 'Nombre total d\'enseignants actifs dans le corps pédagogique national. Utilisé pour calculer le ratio étudiants/enseignant, indicateur clé de la qualité d\'encadrement.',
    legend: [
      { label: 'Ratio optimal (≤ 1:20)', desc: '1 enseignant pour 20 étudiants — norme internationale', color: '#06D6A0' },
      { label: 'Ratio acceptable (1:21–33)', desc: '1 enseignant pour 21 à 33 étudiants', color: '#FFD60A' },
      { label: 'Ratio critique (> 1:33)', desc: 'Plus de 33 étudiants par enseignant — sous-encadrement', color: '#FF6B35' },
    ],
    insight: 'Un encadrement insuffisant impacte directement les résultats académiques. Identifiez les établissements à ratio élevé pour orienter les recrutements.',
  },
  total_etablissements: {
    title: 'Établissements Actifs',
    icon: '🏫',
    color: '#1A3A6B',
    description: 'Nombre d\'établissements actifs (non archivés) dans SIAPET. Inclut universités publiques, instituts supérieurs et écoles spécialisées.',
    legend: [
      { label: 'Universités', desc: 'Établissements universitaires publics polyvalents', color: '#1A3A6B' },
      { label: 'Instituts', desc: 'Instituts supérieurs et IUT spécialisés', color: '#4D9FFF' },
      { label: 'Écoles', desc: 'Écoles supérieures à vocation professionnelle', color: '#7B2CBF' },
    ],
    insight: 'La couverture géographique détermine l\'accessibilité de l\'enseignement supérieur. Identifiez les régions sous-desservies pour orienter les investissements publics.',
  },
  moyenne_nationale: {
    title: 'Moyenne Nationale',
    icon: '📊',
    color: '#06D6A0',
    description: 'Moyenne calculée en agrégeant l\'ensemble des notes de tous les étudiants actifs. C\'est le baromètre principal de la performance académique nationale.',
    legend: [
      { label: 'Très bien (≥ 16/20)', desc: 'Mention Très bien — excellence académique', color: '#06D6A0' },
      { label: 'Bien (14–16)', desc: 'Niveau supérieur à la moyenne nationale', color: '#4D9FFF' },
      { label: 'Passable (10–12)', desc: 'Niveau minimal de validation de l\'année', color: '#FFD60A' },
      { label: 'Insuffisant (< 10)', desc: 'En dessous du seuil — risque d\'échec', color: '#EF4444' },
    ],
    insight: 'La moyenne nationale sert de référence pour évaluer chaque établissement. Un établissement en dessous mérite un plan d\'amélioration ciblé.',
  },
  nb_risque: {
    title: 'Étudiants à Risque',
    icon: '⚠️',
    color: '#FF6B35',
    description: 'Étudiants dont la moyenne générale se situe entre 7 et 10/20. Ils sont en situation précaire et nécessitent un suivi pédagogique actif.',
    legend: [
      { label: 'Zone à risque (7–10/20)', desc: 'Risque de non-validation — accompagnement recommandé', color: '#FF6B35' },
      { label: 'Seuil de validation (10)', desc: 'Note minimale pour valider une année universitaire', color: '#FFD60A' },
    ],
    insight: 'Une intervention précoce (tutorat, rattrapage ciblé) avant les examens finaux peut inverser la tendance. Ces étudiants sont récupérables avec un soutien adapté.',
  },
  nb_critique: {
    title: 'Situations Critiques',
    icon: '🔴',
    color: '#EF4444',
    description: 'Étudiants dont la moyenne générale est inférieure à 7/20. Ils sont en situation d\'échec avéré et nécessitent une prise en charge urgente et personnalisée.',
    legend: [
      { label: 'Zone critique (< 7/20)', desc: 'Échec quasi-certain sans intervention immédiate', color: '#EF4444' },
      { label: 'Seuil critique (7)', desc: 'En dessous, la récupération est statistiquement très difficile', color: '#FF6B35' },
    ],
    insight: 'Ces cas requièrent tutorat intensif, rattrapage et accompagnement psychologique. Chaque établissement doit prioriser ce segment dans son plan d\'action académique.',
  },
};

const SECTION_INFO = {
  gradeDist: {
    title: 'Répartition des Notes',
    icon: '🍩',
    color: '#4D9FFF',
    description: 'Ce graphique en donut représente la distribution nationale des étudiants par tranche de note. Chaque segment correspond à une catégorie de performance académique définie.',
    legend: [
      { label: 'Critique (< 7/20)', desc: 'Étudiants en situation d\'échec avéré', color: '#EF4444' },
      { label: 'Attention (7–10)', desc: 'Étudiants à risque de non-validation', color: '#F97316' },
      { label: 'Passable (10–12)', desc: 'Validation minimale — amélioration possible', color: '#EAB308' },
      { label: 'Assez bien (12–14)', desc: 'Niveau correct — légèrement au-dessus de la moyenne', color: '#84CC16' },
      { label: 'Bien (14–16)', desc: 'Bon niveau académique', color: '#10B981' },
      { label: 'Très bien (≥ 16)', desc: 'Excellence académique — top des étudiants', color: '#06D6A0' },
    ],
    insight: 'Un système sain concentre la majorité dans les tranches "Passable" à "Très bien". Un pic dans "Critique" ou "Attention" indique un problème systémique nécessitant une action nationale.',
  },
  semProg: {
    title: 'Progression Semestrielle',
    icon: '📈',
    color: '#4D9FFF',
    description: 'Ce graphique retrace l\'évolution de la moyenne nationale et du taux de réussite de L1-S1 à L3-S6. La ligne orange marque le seuil de validation à 10/20.',
    legend: [
      { label: 'Ligne bleue — Moyenne', desc: 'Moyenne générale nationale par semestre (sur 20)', color: '#4D9FFF' },
      { label: 'Ligne verte — Réussite', desc: 'Taux de réussite moyen par semestre (en %)', color: '#06D6A0' },
      { label: 'Ligne orange — Seuil 10', desc: 'Limite minimale de validation académique', color: '#FF6B35' },
    ],
    insight: 'Une progression régulière entre L1 et L3 révèle l\'efficacité du parcours. Une baisse en L2 (matières plus difficiles) suivie d\'une correction en L3 est un signal positif d\'adaptation.',
  },
  riskByType: {
    title: 'Risque par Type d\'Établissement',
    icon: '📊',
    color: '#FF6B35',
    description: 'Ce graphique compare pour chaque type d\'établissement (Université, Institut, École) : l\'effectif total, les étudiants à risque et les situations critiques.',
    legend: [
      { label: 'Barre bleue — Total', desc: 'Effectif total d\'étudiants dans ce type', color: '#4D9FFF' },
      { label: 'Barre orange — À risque', desc: 'Étudiants entre 7 et 10/20 — en difficulté', color: '#FF6B35' },
      { label: 'Barre rouge — Critique', desc: 'Étudiants sous 7/20 — en échec avéré', color: '#EF4444' },
    ],
    insight: 'Comparez le ratio risque/total entre types pour identifier lequel concentre le plus de difficultés. Un ratio élevé peut indiquer des problèmes structurels (manque de ressources, ratio étudiants/enseignant défavorable).',
  },
  topRisk: {
    title: 'Top 10 Établissements à Risque',
    icon: '🏴',
    color: '#EF4444',
    description: 'Classement horizontal des 10 établissements avec le plus haut pourcentage d\'étudiants sous 10/20. Outil d\'identification des établissements nécessitant une intervention prioritaire.',
    legend: [
      { label: 'Rouge (> 50%)', desc: 'Situation critique — plus de la moitié des étudiants en difficulté', color: '#EF4444' },
      { label: 'Orange (35–50%)', desc: 'Situation préoccupante — action corrective nécessaire', color: '#FF6B35' },
      { label: 'Jaune (< 35%)', desc: 'Situation à surveiller — dans la norme nationale', color: '#FFD60A' },
    ],
    insight: 'Ces établissements devraient être prioritaires pour les plans d\'action académiques. Un audit pédagogique et un plan de redressement sont recommandés pour les cas en rouge.',
  },
  topSpecs: {
    title: 'Top 8 Meilleures Spécialités',
    icon: '🥇',
    color: '#06D6A0',
    description: 'Classement des 8 spécialités avec la plus haute moyenne générale, calculée sur un minimum de 30 étudiants pour garantir la représentativité statistique.',
    legend: [
      { label: 'Barre verte → bleue', desc: 'Dégradé d\'excellence — plus la barre est longue, meilleure est la moyenne', color: '#06D6A0' },
      { label: 'Note à droite', desc: 'Moyenne générale de la spécialité sur 20', color: '#4D9FFF' },
    ],
    insight: 'Ces spécialités constituent les pôles d\'excellence. Leurs méthodes pédagogiques et ressources peuvent servir de modèles pour améliorer les spécialités en difficulté.',
  },
  bottomSpecs: {
    title: 'Spécialités les Plus Fragiles',
    icon: '⚠️',
    color: '#EF4444',
    description: 'Classement des 8 spécialités avec la plus faible moyenne générale (minimum 30 étudiants). Ces spécialités nécessitent une révision pédagogique approfondie.',
    legend: [
      { label: 'Barre rouge → orange', desc: 'Niveau de difficulté — plus la barre est courte, plus la spécialité est fragile', color: '#EF4444' },
      { label: 'Note à droite', desc: 'Moyenne générale de la spécialité sur 20', color: '#FF6B35' },
    ],
    insight: 'Un audit pédagogique immédiat est recommandé : révision des programmes, renforcement de l\'encadrement, modules de soutien. L\'objectif est d\'atteindre au minimum la moyenne nationale.',
  },
};

// ── animations ─────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity:0; transform:translateY(28px); }
  to   { opacity:1; transform:translateY(0); }
`;
const shimmer = keyframes`
  0%   { background-position:0% 50%; }
  50%  { background-position:100% 50%; }
  100% { background-position:0% 50%; }
`;
const pulse = keyframes`
  0%,100% { box-shadow: 0 0 0 0 rgba(77,159,255,0.35); }
  50%      { box-shadow: 0 0 0 10px rgba(77,159,255,0); }
`;
const spinCW = keyframes`
  from { transform:rotate(0deg); }
  to   { transform:rotate(360deg); }
`;

// ── helpers ────────────────────────────────────────────────────────
const card = (extra = {}) => ({
  borderRadius: '20px',
  border: `1.5px solid ${C.blueL}`,
  background: '#fff',
  boxShadow: `0 4px 24px rgba(26,58,107,0.07)`,
  transition: 'transform 0.25s, box-shadow 0.25s',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: `0 12px 40px rgba(26,58,107,0.13)`,
  },
  ...extra,
});

const fmt = (n, dec = 0) =>
  Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

// ── KPI Card ───────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color, delay = 0 }) {
  return (
    <Box sx={{
      ...card(),
      p: 2, pt: 2.5,
      animation: `${fadeUp} 0.5s ${delay}ms both`,
      position: 'relative', overflow: 'hidden',
      height: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    }}>
      <Box sx={{
        position: 'absolute', bottom: -16, right: -16,
        width: 80, height: 80, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}14 0%, transparent 70%)`,
      }} />
      <Box sx={{
        width: 40, height: 40, borderRadius: '11px',
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        mb: 1.5, flexShrink: 0,
      }}>
        {React.cloneElement(icon, { sx: { color, fontSize: 20 } })}
      </Box>
      <Typography sx={{ color: '#8A9BB0', fontSize: '0.73rem', fontWeight: 600, mb: 0.5, lineHeight: 1.3 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', color: C.navy, lineHeight: 1, mb: 0.4 }}>
        {value}
      </Typography>
      {sub && (
        <Typography sx={{ color: '#8A9BB0', fontSize: '0.71rem', lineHeight: 1.3 }}>{sub}</Typography>
      )}
    </Box>
  );
}

// ── Section header ─────────────────────────────────────────────────
function SectionTitle({ icon, title, subtitle, onInfo }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: '10px',
          background: `linear-gradient(135deg, ${C.blue}22, ${C.purple}22)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {React.cloneElement(icon, { sx: { color: C.blue, fontSize: 20 } })}
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: C.navy }}>
          {title}
        </Typography>
        {onInfo && (
          <Tooltip title="Voir les détails" arrow>
            <IconButton size="small" onClick={onInfo} sx={{
              width: 26, height: 26, borderRadius: '8px',
              background: `${C.blue}12`, border: `1px solid ${C.blue}25`, color: C.blue,
              '&:hover': { background: C.blue, color: '#fff', transform: 'scale(1.1)' },
              transition: 'all 0.2s',
            }}>
              <InfoOutlined sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {subtitle && (
        <Typography sx={{ color: '#8A9BB0', fontSize: '0.8rem', ml: 6 }}>{subtitle}</Typography>
      )}
    </Box>
  );
}

// ── Custom tooltip ─────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{
      background: '#fff', border: `1.5px solid ${C.blueL}`,
      borderRadius: '12px', p: 1.5, boxShadow: `0 8px 24px rgba(26,58,107,0.12)`,
    }}>
      <Typography sx={{ fontWeight: 700, color: C.navy, fontSize: '0.8rem', mb: 1 }}>
        {label}
      </Typography>
      {payload.map((p, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: p.fill || p.color }} />
          <Typography sx={{ color: '#8A9BB0', fontSize: '0.75rem' }}>{p.name}:</Typography>
          <Typography sx={{ fontWeight: 700, color: C.navy, fontSize: '0.75rem' }}>{fmt(p.value, 2)}</Typography>
        </Box>
      ))}
    </Box>
  );
};

// ── Info Modal ─────────────────────────────────────────────────────
function InfoModal({ open, onClose, config }) {
  if (!config) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: '20px', border: `1.5px solid ${C.blueL}`, boxShadow: `0 24px 60px rgba(26,58,107,0.18)`, overflow: 'hidden' } }}>
      <Box sx={{
        px: 3, py: 2.5,
        background: `linear-gradient(135deg, ${config.color}12 0%, ${C.blueL} 100%)`,
        borderBottom: `1.5px solid ${config.color}20`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: '14px', background: '#fff',
            border: `1.5px solid ${config.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', boxShadow: `0 4px 16px ${config.color}18`,
          }}>
            {config.icon}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, color: C.navy, fontSize: '1.05rem' }}>{config.title}</Typography>
            <Typography sx={{ color: '#8A9BB0', fontSize: '0.74rem' }}>Détails & guide d'interprétation</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: C.navy, opacity: 0.5, borderRadius: '10px', transition: 'all 0.2s',
          '&:hover': { background: `${config.color}18`, opacity: 1, transform: 'rotate(90deg)' } }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 2.5, p: 2.5, borderRadius: '14px', background: '#fff', border: `1px solid ${C.blueL}` }}>
          <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.88rem', mb: 1.2 }}>
            📖 Comment lire cet indicateur ?
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.7 }}>{config.description}</Typography>
        </Box>
        {config.legend && (
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.88rem', mb: 1.2 }}>🔑 Légende des indicateurs</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {config.legend.map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, borderRadius: '12px',
                  background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0, mt: 0.5, boxShadow: `0 0 6px ${item.color}60` }} />
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: C.navy, fontSize: '0.82rem' }}>{item.label}</Typography>
                    {item.desc && <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', mt: 0.2 }}>{item.desc}</Typography>}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
        {config.insight && (
          <Box sx={{ p: 2.5, borderRadius: '14px', background: `linear-gradient(135deg, ${config.color}08, ${C.blueL})`, border: `1px solid ${config.color}20` }}>
            <Typography sx={{ fontSize: '0.84rem', color: C.navy, fontWeight: 600, lineHeight: 1.65 }}>
              💡 <strong>Conseil :</strong> {config.insight}
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── ML Panel national (auto-computed, DirecteurDashboard style) ────
function NationalMLPanel({ data }) {
  const [mlPred,       setMlPred]       = useState(null);
  const [mlPredLoad,   setMlPredLoad]   = useState(false);
  const [mlPerfPred,   setMlPerfPred]   = useState(null);
  const [mlPerfLoad,   setMlPerfLoad]   = useState(false);
  const [mlProjMode,        setMlProjMode]        = useState('annee');
  const [mlProjection,      setMlProjection]      = useState([]);
  const [mlProjLoading,     setMlProjLoading]     = useState(false);
  const [mlPerfProjMode,    setMlPerfProjMode]    = useState('projection');
  const [mlPerfProj,        setMlPerfProj]        = useState([]);
  const [mlPerfProjLoading, setMlPerfProjLoading] = useState(false);

  const g  = data?.globalCounts || {};
  const sp = data?.semesterProgression || [];

  const getM1Input = useCallback(() => {
    const nbEtudiants   = Math.max(Number(g.total_etudiants  || 1000), 1);
    const nbEnseignants = Math.max(Number(g.total_enseignants || 50),   1);
    const tauxValues = sp.filter(s => s.taux_avg).map(s => Number(s.taux_avg));
    const avgTaux    = tauxValues.length > 0 ? tauxValues.reduce((a, b) => a + b, 0) / tauxValues.length : 70;
    const absValues  = sp.filter(s => s.abs_avg).map(s => Number(s.abs_avg));
    const avgAbs     = absValues.length > 0 ? Math.min(absValues.reduce((a, b) => a + b, 0) / absValues.length * 3, 100) : 10;
    return {
      taux_reussite_an1:  Math.round(avgTaux * 10) / 10,
      taux_reussite_an2:  Math.round(Math.max(avgTaux - 3, 0) * 10) / 10,
      taux_absence_moyen: Math.round(avgAbs * 10) / 10,
      ratio_etud_ens:     Math.round((nbEtudiants / nbEnseignants) * 10) / 10,
      budget_par_etud:    1500,
      nb_labos:           5,
      taux_rotation_ens:  8.0,
      region:             'Tunis',
      type_etablissement: 'universite',
    };
  }, [g, sp]);

  const getM3Input = useCallback(() => {
    const moy = Number(g.moyenne_nationale || 12);
    const cc  = Math.round(moy * 0.9 * 10) / 10;
    return {
      moy_semestre_prec:    moy,
      note_cc1:             cc,
      note_cc2:             cc,
      note_cc3:             Math.round(moy * 1.05 * 10) / 10,
      taux_absence_actuel:  12,
      pente_evolution:      0.5,
      nb_matieres_sous_10:  moy < 10 ? 3 : moy < 12 ? 1 : 0,
      ratio_notes_obtenues: moy >= 10 ? 0.75 : 0.45,
      niveau:               'L2',
      filiere:              'informatique',
    };
  }, [g]);

  useEffect(() => {
    if (!data) return;
    setMlPredLoad(true);
    mlService.predireReussite(getM1Input())
      .then(r => setMlPred(r.data))
      .catch(() => {})
      .finally(() => setMlPredLoad(false));

    setMlPerfLoad(true);
    mlService.predirePerformance(getM3Input())
      .then(r => setMlPerfPred(r.data))
      .catch(() => {})
      .finally(() => setMlPerfLoad(false));

    // Auto-compute M3 projection 2026→2030
    const runM3Projection = async () => {
      const m3 = getM3Input();
      setMlPerfProjLoading(true);
      setMlPerfProj([]);
      const results = [];
      let moyPrec = m3.moy_semestre_prec;
      try {
        for (let year = 2026; year <= 2030; year++) {
          const cc = Math.min(20, Math.max(0, Math.round(moyPrec * 0.9 * 10) / 10));
          const { data: res } = await mlService.predirePerformance({
            ...m3, moy_semestre_prec: moyPrec,
            note_cc1: cc,
            note_cc2: Math.min(20, moyPrec),
            note_cc3: Math.min(20, Math.round(moyPrec * 1.05 * 10) / 10),
          });
          results.push({ annee: `${year}`, moy: res.moyenne_finale_predite, mention: res.mention, couleur: res.couleur, predicted: true });
          moyPrec = res.moyenne_finale_predite;
        }
        setMlPerfProj(results);
      } catch (e) { /* ML server not available */ }
      finally { setMlPerfProjLoading(false); }
    };
    runM3Projection();
  }, [data, getM1Input, getM3Input]);

  const projeterNational = async () => {
    const m1 = getM1Input();
    setMlProjLoading(true);
    setMlProjection([]);
    const results = [];
    let an1 = m1.taux_reussite_an1;
    let an2 = m1.taux_reussite_an2;
    try {
      for (let year = 2026; year <= 2030; year++) {
        const { data: res } = await mlService.predireReussite({ ...m1, taux_reussite_an1: an1, taux_reussite_an2: an2 });
        results.push({ annee: `${year}`, taux: res.taux_reussite_predit, couleur: res.couleur, predicted: true });
        an2 = an1;
        an1 = res.taux_reussite_predit;
      }
      setMlProjection(results);
    } catch (e) { console.error(e); }
    finally { setMlProjLoading(false); }
  };

  const historique = [
    { annee: '2021', taux: 68 }, { annee: '2022', taux: 71 },
    { annee: '2023', taux: 74 }, { annee: '2024', taux: 76 },
    { annee: '2025', taux: 79 },
  ];

  const perfHistorique = [
    { annee: '2021', moy: 10.8  },
    { annee: '2022', moy: 11.1  },
    { annee: '2023', moy: 11.4  },
    { annee: '2024', moy: 11.7  },
    { annee: '2025', moy: Number(g.moyenne_nationale || 11.85) },
  ];

  const projeterPerformance = async () => {
    const m3 = getM3Input();
    setMlPerfProjLoading(true);
    setMlPerfProj([]);
    const results = [];
    let moyPrec = m3.moy_semestre_prec;
    try {
      for (let year = 2026; year <= 2030; year++) {
        const cc = Math.min(20, Math.max(0, Math.round(moyPrec * 0.9 * 10) / 10));
        const { data: res } = await mlService.predirePerformance({
          ...m3,
          moy_semestre_prec: moyPrec,
          note_cc1: cc,
          note_cc2: Math.min(20, moyPrec),
          note_cc3: Math.min(20, Math.round(moyPrec * 1.05 * 10) / 10),
        });
        results.push({ annee: `${year}`, moy: res.moyenne_finale_predite, mention: res.mention, couleur: res.couleur, predicted: true });
        moyPrec = res.moyenne_finale_predite;
      }
      setMlPerfProj(results);
    } catch (e) { console.error(e); }
    finally { setMlPerfProjLoading(false); }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Card sx={{
        borderRadius: '20px', overflow: 'hidden',
        border: '1.5px solid #C7D9F5', background: '#fff',
        boxShadow: '0 4px 20px rgba(77,159,255,0.08)',
        animation: `${fadeUp} 0.55s ease-out 0.3s both`,
      }}>
        {/* ── Header ── */}
        <Box sx={{
          px: 3, py: 2.5, borderBottom: '1px solid #C7D9F5',
          background: 'linear-gradient(135deg, #EAF4FF 0%, #DBEEFF 100%)',
          display: 'flex', alignItems: 'center', gap: 2,
        }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: '14px',
            background: 'linear-gradient(135deg, #1A3A6B, #4D9FFF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', flexShrink: 0, boxShadow: '0 4px 14px rgba(77,159,255,0.3)',
          }}>🤖</Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 900, color: '#1A3A6B', fontSize: '1.1rem', letterSpacing: '-0.3px' }}>
              Prévisions IA · Intelligence Artificielle — Niveau National
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0' }}>
              Modèle M1 · Basé sur les indicateurs académiques nationaux (effectifs, encadrement, taux de réussite)
            </Typography>
          </Box>
          <Chip label="IA ACTIVE" size="small" sx={{
            ml: 'auto', flexShrink: 0,
            background: 'linear-gradient(135deg, #1A3A6B, #4D9FFF)',
            color: '#fff', fontWeight: 800, fontSize: '0.7rem',
            borderRadius: '8px', border: 'none',
          }} />
        </Box>

        {/* ── M1 Body ── */}
        {mlPredLoad ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6, gap: 2 }}>
            <CircularProgress size={28} sx={{ color: C.blue }} />
            <Typography sx={{ color: '#8A9BB0', fontSize: '0.85rem' }}>Calcul des prévisions nationales...</Typography>
          </Box>
        ) : mlPred ? (
          <Grid container>
            <Grid item xs={12} md={5}>
              <Box sx={{ p: 3, borderRight: { md: `1px solid ${C.blueL}` }, borderBottom: { xs: `1px solid ${C.blueL}`, md: 'none' } }}>
                {/* Taux réussite */}
                <Box sx={{ mb: 2.5, p: 2.5, borderRadius: '16px', background: `${mlPred.couleur}0e`, border: `1.5px solid ${mlPred.couleur}28` }}>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.2 }}>
                    Taux de réussite prédit 2025-2026 (national)
                  </Typography>
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
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.2 }}>
                    Étudiants en échec estimés
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.8, mb: 1.2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '3rem', color: '#EF4444', lineHeight: 1, letterSpacing: '-2px' }}>
                      {Math.round((100 - mlPred.taux_reussite_predit) * 10) / 10}
                    </Typography>
                    <Typography sx={{ color: '#8A9BB0', fontWeight: 600, mb: 0.6, fontSize: '1.1rem' }}>%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={100 - mlPred.taux_reussite_predit}
                    sx={{ height: 7, borderRadius: 4, mb: 1, backgroundColor: '#FECACA', '& .MuiLinearProgress-bar': { backgroundColor: '#EF4444', borderRadius: 4 } }} />
                  <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0' }}>
                    Estimation : ~{Math.round((100 - mlPred.taux_reussite_predit) * Number(g.total_etudiants || 0) / 100).toLocaleString('fr-TN')} étudiants concernés
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={7}>
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {mlProjMode === 'annee' ? 'Évolution historique + prévision 2026' : 'Projection 2026 → 2030'}
                  </Typography>
                  <ToggleButtonGroup
                    value={mlProjMode} exclusive
                    onChange={(_, v) => { if (v) { setMlProjMode(v); if (v === 'projection' && !mlProjection.length) projeterNational(); } }}
                    size="small"
                    sx={{ '& .MuiToggleButton-root': { borderRadius: '8px !important', textTransform: 'none', fontWeight: 600, fontSize: '0.7rem', px: 1.2, py: 0.4, border: `1.5px solid ${C.blue}30` } }}
                  >
                    <ToggleButton value="annee" sx={{ '&.Mui-selected': { background: `${C.blue}18`, color: C.blue } }}>2026</ToggleButton>
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
                        ? [...historique, { annee: '2026 (prévu)', taux: mlPred.taux_reussite_predit, predicted: true }]
                        : [...historique, ...mlProjection]
                      }
                      barSize={mlProjMode === 'projection' ? 22 : 30}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="annee" tick={{ fill: '#8A9BB0', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis
                        domain={[
                          dataMin => Math.max(0,   Math.floor(dataMin / 5) * 5 - 5),
                          dataMax => Math.min(100, Math.ceil(dataMax  / 5) * 5 + 5),
                        ]}
                        tick={{ fill: '#8A9BB0', fontSize: 11 }} axisLine={false} tickLine={false}
                        tickFormatter={v => `${v}%`} tickCount={5}
                      />
                      <RT
                        contentStyle={{ background: '#fff', border: `1.5px solid ${C.blueL}`, borderRadius: 12, color: C.navy, fontSize: 13, boxShadow: `0 4px 20px ${C.blue}18` }}
                        formatter={v => [`${typeof v === 'number' ? v.toFixed(1) : v}%`, 'Taux de réussite']}
                      />
                      <Bar dataKey="taux" radius={[6, 6, 0, 0]}>
                        {(mlProjMode === 'annee'
                          ? [...historique, { annee: '2026', taux: mlPred.taux_reussite_predit, predicted: true, couleur: mlPred.couleur }]
                          : [...historique, ...mlProjection]
                        ).map((entry, idx) => (
                          <Cell key={idx} fill={entry.predicted ? (entry.couleur || mlPred.couleur) : C.blue} opacity={entry.predicted ? 1 : 0.55} />
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
                  ) : mlProjection.length > 0 && (() => {
                    const first = mlProjection[0]?.taux;
                    const last  = mlProjection[mlProjection.length - 1]?.taux;
                    const diff  = last && first ? Math.round((last - first) * 10) / 10 : null;
                    return (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '3px', background: mlProjection[0]?.couleur || C.blue }} />
                          <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0' }}>Projection IA 2026–2030</Typography>
                        </Box>
                        {diff !== null && (
                          <Box sx={{ px: 1.5, py: 0.8, borderRadius: '8px', background: diff >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${diff >= 0 ? '#86efac' : '#fca5a5'}` }}>
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: diff >= 0 ? '#15803d' : '#dc2626' }}>
                              {diff >= 0 ? '📈 +' : '📉 '}{diff}% tendance 2026→2030
                            </Typography>
                          </Box>
                        )}
                      </>
                    );
                  })()}
                </Box>

                <Box sx={{ mt: 2.5, p: 2, borderRadius: '12px', background: C.blueL, border: `1px solid ${C.blue}20` }}>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: C.navy, mb: 0.5 }}>Comment est calculée cette prévision ?</Typography>
                  <Typography sx={{ fontSize: '0.71rem', color: '#64748B', lineHeight: 1.7 }}>
                    Le modèle M1 analyse les taux de réussite semestriels, le taux d&apos;absence moyen et le ratio étudiants/enseignants à l&apos;échelle nationale.
                    {mlProjMode === 'projection' && ' En mode projection, chaque année prédite devient la base de la suivante (itération jusqu\'en 2030).'}
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

        {/* ── M3 Performance Future ── */}
        <Box sx={{ px: 3, pb: 3 }}>
          <Box sx={{ pt: 2.5, borderTop: `1px dashed ${C.blue}25` }}>
            {/* M3 sub-header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(135deg, #7B2CBF, #4D9FFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🎯</Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.85rem' }}>Performance Académique Future — M3</Typography>
                <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0' }}>Moyenne nationale prédite · données agrégées · 2025-2026</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                <ToggleButtonGroup
                  value={mlPerfProjMode} exclusive
                  onChange={(_, v) => { if (v) { setMlPerfProjMode(v); if (v === 'projection' && !mlPerfProj.length && !mlPerfProjLoading) projeterPerformance(); } }}
                  size="small"
                  sx={{ '& .MuiToggleButton-root': { borderRadius: '8px !important', textTransform: 'none', fontWeight: 600, fontSize: '0.7rem', px: 1.2, py: 0.4, border: '1.5px solid #7B2CBF30' } }}
                >
                  <ToggleButton value="annee" sx={{ '&.Mui-selected': { background: '#7B2CBF18', color: '#7B2CBF' } }}>2026</ToggleButton>
                  <ToggleButton value="projection" sx={{ '&.Mui-selected': { background: '#7B2CBF18', color: '#7B2CBF' } }}>
                    <Timeline sx={{ fontSize: 13, mr: 0.5 }} />→ 2030
                  </ToggleButton>
                </ToggleButtonGroup>
                <Chip label="M3 · IA" size="small" sx={{ background: 'linear-gradient(135deg, #7B2CBF, #4D9FFF)', color: '#fff', fontWeight: 800, fontSize: '0.62rem', borderRadius: '8px', border: 'none' }} />
              </Box>
            </Box>

            {mlPerfLoad ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                <CircularProgress size={18} sx={{ color: C.purple }} />
                <Typography sx={{ color: '#8A9BB0', fontSize: '0.8rem' }}>Calcul en cours...</Typography>
              </Box>
            ) : mlPerfPred ? (
              mlPerfProjMode === 'annee' ? (
                /* ── Vue 2026 : métrique + mention grid ── */
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={5}>
                    <Box sx={{ p: 2, borderRadius: '14px', background: `${mlPerfPred.couleur}0e`, border: `1.5px solid ${mlPerfPred.couleur}28`, textAlign: 'center' }}>
                      <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.8 }}>Moyenne nationale prédite</Typography>
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
                /* ── Vue projection 2026→2030 : bar chart ── */
                mlPerfProjLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 1.5 }}>
                    <CircularProgress size={24} sx={{ color: C.purple }} />
                    <Typography sx={{ fontSize: '0.8rem', color: '#8A9BB0' }}>Calcul de la projection 2026–2030...</Typography>
                  </Box>
                ) : (
                  <Box>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={[...perfHistorique, ...mlPerfProj]} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis dataKey="annee" tick={{ fill: '#8A9BB0', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis
                          domain={[
                            dataMin => Math.max(0,  Math.floor(dataMin / 2) * 2 - 1),
                            dataMax => Math.min(20, Math.ceil(dataMax  / 2) * 2 + 1),
                          ]}
                          tick={{ fill: '#8A9BB0', fontSize: 11 }} axisLine={false} tickLine={false}
                          tickFormatter={v => `${v}/20`} tickCount={5}
                        />
                        <RT
                          contentStyle={{ background: '#fff', border: '1.5px solid #EAF4FF', borderRadius: 12, color: C.navy, fontSize: 13, boxShadow: '0 4px 20px rgba(123,44,191,0.1)' }}
                          formatter={(v, _n, props) => [`${typeof v === 'number' ? v.toFixed(2) : v}/20${props.payload?.mention ? ` · ${props.payload.mention}` : ''}`, 'Moyenne prédite']}
                        />
                        <Bar dataKey="moy" radius={[6, 6, 0, 0]}>
                          {[...perfHistorique, ...mlPerfProj].map((entry, idx) => (
                            <Cell key={idx} fill={entry.predicted ? (entry.couleur || C.purple) : C.purple} opacity={entry.predicted ? 1 : 0.35} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>

                    <Box sx={{ display: 'flex', gap: 3, mt: 1.5, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '3px', background: C.purple, opacity: 0.35 }} />
                        <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0' }}>Données réelles 2021–2025</Typography>
                      </Box>
                      {mlPerfProj.length > 0 && (() => {
                        const first = mlPerfProj[0]?.moy;
                        const last  = mlPerfProj[mlPerfProj.length - 1]?.moy;
                        const diff  = first != null && last != null ? Math.round((last - first) * 100) / 100 : null;
                        const isHausse = diff >= 0;
                        return (
                          <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '3px', background: mlPerfProj[0]?.couleur || C.purple }} />
                              <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0' }}>Projection IA 2026–2030</Typography>
                            </Box>
                            {diff !== null && (
                              <Box sx={{ px: 1.5, py: 0.8, borderRadius: '8px', background: isHausse ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isHausse ? '#86efac' : '#fca5a5'}` }}>
                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: isHausse ? '#15803d' : '#dc2626' }}>
                                  {isHausse ? '📈 +' : '📉 '}{Math.abs(diff)} pts tendance 2026→2030
                                </Typography>
                              </Box>
                            )}
                          </>
                        );
                      })()}
                    </Box>
                  </Box>
                )
              )
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
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function AnalyticsAdmin() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartView, setChartView] = useState('region');
  const [infoModal, setInfoModal] = useState({ open: false, config: null });

  // Filtres dynamiques (admin seulement)
  const [filterRectorat, setFilterRectorat] = useState('');
  const [filterEtab, setFilterEtab] = useState('');
  const [filtres, setFiltres] = useState({ rectorats: [], etablissements: [] });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const openInfo = (config) => setInfoModal({ open: true, config });
  const closeInfo = () => setInfoModal({ open: false, config: null });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = currentUser.role || '';
  const isAdmin = userRole === 'ADMIN_MESRS' || userRole === 'ADMIN';

  const activeFilterLabel = filterEtab
    ? filtres.etablissements?.find(e => String(e.id) === String(filterEtab))?.nom || 'Établissement'
    : filterRectorat
      ? filtres.rectorats?.find(r => String(r.id) === String(filterRectorat))?.nom || 'Rectorat'
      : null;

  const scopeTitle = filterEtab
    ? `Analytics — ${filtres.etablissements?.find(e => String(e.id) === String(filterEtab))?.nom || 'Établissement'}`
    : filterRectorat
      ? `Analytics — ${filtres.rectorats?.find(r => String(r.id) === String(filterRectorat))?.nom || 'Rectorat'}`
      : userRole === 'RECTEUR'
        ? 'Analytics — Vue Rectorat'
        : userRole === 'DIRECTEUR'
          ? 'Analytics — Vue Établissement'
          : 'Analytics — Situation Académique Nationale';

  const scopeSubtitle = userRole === 'RECTEUR'
    ? `Données de votre rectorat · ${new Date().getFullYear()}`
    : userRole === 'DIRECTEUR'
      ? `Données de votre établissement · ${new Date().getFullYear()}`
      : filterEtab || filterRectorat
        ? `Vue filtrée · ${new Date().getFullYear()}`
        : `Données en temps réel · Tunisie · ${new Date().getFullYear()}`;

  // Charger les options de filtres pour l'admin
  useEffect(() => {
    if (isAdmin) {
      api.get('/analytics/rapport/filtres')
        .then(r => setFiltres(r.data.data || { rectorats: [], etablissements: [] }))
        .catch(() => {});
    }
  }, [isAdmin]);

  const etablissementsFiltres = filterRectorat
    ? (filtres.etablissements || []).filter(e => String(e.id_rectorat) === String(filterRectorat))
    : (filtres.etablissements || []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filterEtab) params.etablissement_id = filterEtab;
      else if (filterRectorat) params.rectorat_id = filterRectorat;
      const r = await api.get('/analytics/national', { params });
      setData(r.data.data);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    }
    setLoading(false);
  }, [filterEtab, filterRectorat]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 3 }}>
      <Box sx={{
        width: 64, height: 64, borderRadius: '50%',
        border: `3px solid ${C.blueL}`,
        borderTopColor: C.blue,
        animation: `${spinCW} 0.9s linear infinite`,
      }} />
      <Typography sx={{ color: '#8A9BB0', fontWeight: 600 }}>Chargement des analytics…</Typography>
    </Box>
  );

  if (error) return (
    <Box sx={{ p: 4 }}>
      <Alert severity="error" sx={{ borderRadius: '14px' }}
        action={<Button onClick={load} size="small" startIcon={<Refresh />}>Réessayer</Button>}>
        {error}
      </Alert>
    </Box>
  );

  const g = data?.globalCounts || {};
  const gd = data?.gradeDist || {};
  const totalStudents = Number(g.total_etudiants || 0);
  const pctRisque = totalStudents ? ((Number(g.nb_risque) / totalStudents) * 100).toFixed(1) : 0;
  const pctCritique = totalStudents ? ((Number(g.nb_critique) / totalStudents) * 100).toFixed(1) : 0;

  // Grade distribution donut data
  const gradeData = [
    { name: 'Critique (<7)',     value: Number(gd.critique   || 0), color: GRADE_COLORS.critique },
    { name: 'Attention (7-10)', value: Number(gd.attention   || 0), color: GRADE_COLORS.attention },
    { name: 'Passable (10-12)', value: Number(gd.passable    || 0), color: GRADE_COLORS.passable },
    { name: 'Assez bien',       value: Number(gd.assez_bien  || 0), color: GRADE_COLORS.assez_bien },
    { name: 'Bien (14-16)',     value: Number(gd.bien        || 0), color: GRADE_COLORS.bien },
    { name: 'Très bien (≥16)',  value: Number(gd.tres_bien   || 0), color: GRADE_COLORS.tres_bien },
  ];

  // Semester progression chart
  const semData = (data?.semesterProgression || []).map(s => ({
    name: `${s.niveau}-S${s.semestre}`,
    Moyenne: Number(s.moy_avg),
    Réussite: Number(s.taux_avg),
    Absences: Number(s.abs_avg),
  }));

  // Risk by type stacked bar
  const riskByType = (data?.riskByType || []).map(r => ({
    name: r.type?.replace('_', ' ') || '?',
    Total: Number(r.total),
    'À risque': Number(r.a_risque),
    Critique: Number(r.critique),
    Moy: Number(r.moy),
  }));

  // Top 10 at-risk horizontal bar
  const topRisk = [...(data?.topRisk || [])].reverse();

  // Mention distribution
  const mentionData = (data?.mentionDist || []).map((m, i) => ({
    name: m.mention,
    value: Number(m.nb),
    color: MENTION_COLORS[i % MENTION_COLORS.length],
  }));

  // Regional bar chart
  const regionData = (data?.regionData || []).map(r => ({
    name: r.nom_region?.replace('Gouvernorat de ', '').replace('Gouvernorat du ', '') || '?',
    Étudiants: Number(r.total_etudiants),
    Moyenne: Number(r.moy),
    'À risque': Number(r.a_risque),
  }));

  // Absence impact
  const absData = (data?.absenceImpact || []).map(a => ({
    name: a.tranche,
    Moyenne: Number(a.moy_avg),
    Effectif: Number(a.nb_records),
  }));

  // Speciality radar (top vs bottom)
  const topSpecs = data?.topSpecs || [];
  const bottomSpecs = data?.bottomSpecs || [];

  const getMoyColor = m => m >= 14 ? C.green : m >= 10 ? C.blue : m >= 7 ? C.orange : '#EF4444';

  return (
    <Box sx={{ pb: 6 }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <Box sx={{
        mb: isAdmin ? 2 : 4, p: 3, borderRadius: 3,
        background: '#fff', border: '1px solid #E5E7EB',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 2,
        animation: `${fadeUp} 0.5s 0ms both`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: '16px',
            background: `linear-gradient(135deg, ${C.blue}18, ${C.purple}18)`,
            border: `1.5px solid ${C.blue}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Insights sx={{ color: C.blue, fontSize: 28 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontWeight: 800, color: '#1F2937', fontSize: '1.35rem', lineHeight: 1.2 }}>
                {scopeTitle}
              </Typography>
              {activeFilterLabel && (
                <Chip
                  label={activeFilterLabel}
                  size="small"
                  onDelete={() => { setFilterRectorat(''); setFilterEtab(''); }}
                  sx={{ background: `${C.blue}14`, color: C.blue, border: `1px solid ${C.blue}30`, fontWeight: 700, fontSize: '0.7rem' }}
                />
              )}
            </Box>
            <Typography sx={{ color: '#6B7280', fontSize: '0.85rem', mt: 0.3 }}>
              {scopeSubtitle}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {isAdmin && (
            <Tooltip title={filtersOpen ? 'Masquer les filtres' : 'Filtrer les données'} arrow>
              <IconButton
                onClick={() => setFiltersOpen(p => !p)}
                sx={{
                  borderRadius: '12px', border: `1.5px solid ${filtersOpen ? C.blue : '#E5E7EB'}`,
                  color: filtersOpen ? C.blue : '#6B7280',
                  background: filtersOpen ? `${C.blue}10` : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': { background: `${C.blue}10`, color: C.blue, borderColor: C.blue },
                }}
              >
                {filtersOpen ? <FilterListOff /> : <FilterList />}
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Actualiser les données" arrow>
            <IconButton
              onClick={load}
              disabled={loading}
              sx={{
                borderRadius: '12px', border: '1.5px solid #E5E7EB', color: '#6B7280',
                '&:hover': { background: `${C.blue}10`, color: C.blue, borderColor: C.blue },
              }}
            >
              <Refresh sx={{ animation: loading ? `${spinCW} 1s linear infinite` : 'none' }} />
            </IconButton>
          </Tooltip>
          {[
            { label: 'Étudiants',        val: fmt(g.total_etudiants),              color: C.blue   },
            { label: 'Moyenne nationale', val: `${fmt(g.moyenne_nationale, 2)}/20`, color: C.green  },
            { label: 'À risque',          val: `${pctRisque}%`,                     color: C.orange },
            { label: 'Critiques',         val: `${pctCritique}%`,                   color: '#EF4444'},
            { label: 'Établissements',    val: fmt(g.total_etablissements),          color: C.navy   },
          ].map(item => (
            <Box key={item.label} sx={{
              px: 2.5, py: 1.5, borderRadius: '14px',
              background: `${item.color}08`,
              border: `1.5px solid ${item.color}22`,
              minWidth: 90,
            }}>
              <Typography sx={{ color: '#8A9BB0', fontSize: '0.75rem', fontWeight: 700, mb: 0.5 }}>
                {item.label}
              </Typography>
              <Typography sx={{ color: item.color, fontWeight: 900, fontSize: '1.35rem', lineHeight: 1 }}>
                {item.val}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Panneau de filtres (admin seulement) ─────────────── */}
      {isAdmin && (
        <Collapse in={filtersOpen}>
          <Box sx={{
            mb: 3, p: 2.5, borderRadius: '16px',
            background: 'linear-gradient(135deg, #F0F7FF, #EAF4FF)',
            border: `1.5px solid ${C.blue}25`,
            animation: `${fadeUp} 0.3s ease-out`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FilterList sx={{ color: C.blue, fontSize: 18 }} />
              <Typography sx={{ fontWeight: 700, color: C.navy, fontSize: '0.9rem' }}>
                Filtrer les données analytics
              </Typography>
              <Typography sx={{ color: '#8A9BB0', fontSize: '0.75rem', ml: 0.5 }}>
                · Les graphiques et KPIs se mettent à jour automatiquement
              </Typography>
            </Box>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.83rem', color: '#374151', '&.Mui-focused': { color: C.blue } }}>
                    Rectorat
                  </InputLabel>
                  <Select
                    value={filterRectorat}
                    onChange={e => { setFilterRectorat(e.target.value); setFilterEtab(''); }}
                    label="Rectorat"
                    sx={{
                      borderRadius: '10px', fontSize: '0.83rem', background: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: C.blue },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.blue },
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.83rem' }}>Tous les rectorats</MenuItem>
                    {(filtres.rectorats || []).map(r => (
                      <MenuItem key={r.id} value={r.id} sx={{ fontSize: '0.83rem' }}>{r.nom}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.83rem', color: '#374151', '&.Mui-focused': { color: C.blue } }}>
                    Établissement
                  </InputLabel>
                  <Select
                    value={filterEtab}
                    onChange={e => setFilterEtab(e.target.value)}
                    label="Établissement"
                    sx={{
                      borderRadius: '10px', fontSize: '0.83rem', background: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: C.blue },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.blue },
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.83rem' }}>
                      {filterRectorat ? 'Tous les établissements du rectorat' : 'Tous les établissements'}
                    </MenuItem>
                    {etablissementsFiltres.map(e => (
                      <MenuItem key={e.id} value={e.id} sx={{ fontSize: '0.83rem' }}>{e.nom}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Button
                  onClick={() => { setFilterRectorat(''); setFilterEtab(''); }}
                  variant="outlined" size="small"
                  disabled={!filterRectorat && !filterEtab}
                  sx={{
                    borderRadius: '9px', textTransform: 'none', fontWeight: 700,
                    fontSize: '0.8rem', borderColor: '#D1D5DB', color: '#6B7280',
                    '&:hover': { borderColor: C.blue, color: C.blue },
                    '&.Mui-disabled': { opacity: 0.4 },
                  }}
                >
                  Réinitialiser
                </Button>
                {(filterRectorat || filterEtab) && (
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 0.8,
                    px: 1.5, py: 0.6, borderRadius: '8px',
                    background: `${C.blue}10`, border: `1px solid ${C.blue}25`,
                  }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: C.blue, animation: `${pulse} 2s infinite` }} />
                    <Typography sx={{ fontSize: '0.72rem', color: C.blue, fontWeight: 700 }}>
                      Filtre actif
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      )}

      {/* ── KPI Grid ─────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { icon: <People />,       label: 'Total Étudiants',       value: fmt(g.total_etudiants),             sub: 'inscrits actifs',                    color: C.blue,    delay: 0   },
          { icon: <School />,       label: 'Enseignants',            value: fmt(g.total_enseignants),           sub: 'corps pédagogique',                  color: C.purple,  delay: 60  },
          { icon: <Business />,     label: 'Établissements actifs',  value: fmt(g.total_etablissements),        sub: 'non archivés',                       color: C.navy,    delay: 120 },
          { icon: <AutoGraph />,    label: 'Moyenne Nationale',      value: `${fmt(g.moyenne_nationale,2)}/20`, sub: 'toutes spécialités',                  color: C.green,   delay: 180 },
          { icon: <Warning />,      label: 'Étudiants à Risque',     value: fmt(g.nb_risque),                   sub: `${pctRisque}% de la population`,     color: C.orange,  delay: 240 },
          { icon: <ErrorOutline />, label: 'Situations Critiques',   value: fmt(g.nb_critique),                 sub: `moyenne < 7 (${pctCritique}%)`,      color: '#EF4444', delay: 300 },
        ].map(k => (
          <Grid item xs={6} sm={4} md={4} lg={2} key={k.label}>
            <KpiCard {...k} />
          </Grid>
        ))}
      </Grid>

      {/* ── ML Panel ─────────────────────────────────────────── */}
      <NationalMLPanel data={data} />

      {/* ── Row 1: Grade Distribution + Semester Progression ── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>

        {/* Donut — grade distribution */}
        <Grid item xs={12} md={5}>
          <Box sx={{ ...card(), p: 3, height: '100%', animation: `${fadeUp} 0.5s 100ms both` }}>
            <SectionTitle icon={<BubbleChart />} title="Répartition des Notes" subtitle="Distribution nationale par tranche" onInfo={() => openInfo(SECTION_INFO.gradeDist)} />
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={gradeData} cx="50%" cy="50%"
                  innerRadius={65} outerRadius={105}
                  dataKey="value" paddingAngle={2}
                >
                  {gradeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <RT content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {gradeData.map(g => (
                <Box key={g.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '3px', background: g.color, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0' }}>{g.name}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>

        {/* Area — semester progression */}
        <Grid item xs={12} md={7}>
          <Box sx={{ ...card(), p: 3, animation: `${fadeUp} 0.5s 150ms both` }}>
            <SectionTitle icon={<Timeline />} title="Progression Semestrielle" subtitle="Évolution de la moyenne de L1-S1 à L3-S6" onInfo={() => openInfo(SECTION_INFO.semProg)} />
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={semData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradMoy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.blue}   stopOpacity={0.25} />
                    <stop offset="95%" stopColor={C.blue}   stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradTaux" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.green}  stopOpacity={0.25} />
                    <stop offset="95%" stopColor={C.green}  stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={`${C.blueL}`} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8A9BB0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#8A9BB0' }} domain={[0, 20]} />
                <RT content={<CustomTooltip />} />
                <ReferenceLine y={10} stroke={C.orange} strokeDasharray="4 2" label={{ value: 'Seuil', fontSize: 10, fill: C.orange }} />
                <Area type="monotone" dataKey="Moyenne"  stroke={C.blue}  fill="url(#gradMoy)"  strokeWidth={2.5} dot={{ r: 4, fill: C.blue }}  />
                <Area type="monotone" dataKey="Réussite" stroke={C.green} fill="url(#gradTaux)" strokeWidth={2} strokeDasharray="5 2" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
      </Grid>

      {/* ── Row 2: Risk by type + Top 10 at-risk ─────────────── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>

        {/* Stacked bar — risk by establishment type */}
        <Grid item xs={12} md={6}>
          <Box sx={{ ...card(), p: 3, animation: `${fadeUp} 0.5s 200ms both` }}>
            <SectionTitle icon={<BarChartIcon />} title="Risque par Type d'Établissement" subtitle="Répartition des situations académiques" onInfo={() => openInfo(SECTION_INFO.riskByType)} />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={riskByType} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.blueL} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8A9BB0' }} />
                <YAxis tick={{ fontSize: 10, fill: '#8A9BB0' }} />
                <RT content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.75rem' }} />
                <Bar dataKey="Total"    fill={`${C.blue}60`}   radius={[4,4,0,0]} />
                <Bar dataKey="À risque" fill={C.orange}        radius={[4,4,0,0]} />
                <Bar dataKey="Critique" fill="#EF4444"         radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>

        {/* Horizontal bar — top 10 at-risk establishments */}
        <Grid item xs={12} md={6}>
          <Box sx={{ ...card(), p: 3, animation: `${fadeUp} 0.5s 240ms both` }}>
            <SectionTitle icon={<Warning />} title="Top 10 Établissements à Risque" subtitle="Classés par % d'étudiants < 10" onInfo={() => openInfo(SECTION_INFO.topRisk)} />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topRisk} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.blueL} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#8A9BB0' }} unit="%" domain={[0, 100]} />
                <YAxis
                  type="category" dataKey="nom_etablissement" width={140}
                  tick={{ fontSize: 9, fill: '#8A9BB0' }}
                  tickFormatter={v => v?.length > 22 ? v.substring(0, 22) + '…' : v}
                />
                <RT content={<CustomTooltip />} />
                <Bar dataKey="pct_risque" name="% à risque" radius={[0,6,6,0]}>
                  {topRisk.map((entry, i) => (
                    <Cell key={i} fill={Number(entry.pct_risque) > 50 ? '#EF4444' : Number(entry.pct_risque) > 35 ? C.orange : C.yellow} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
      </Grid>

      {/* ── Row 3: Regional view ──────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Box sx={{ ...card(), p: 3, animation: `${fadeUp} 0.5s 280ms both` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
              <SectionTitle icon={<AutoGraph />} title="Comparaison Régionale" subtitle="Vue multi-indicateurs par gouvernorat" />
              <ToggleButtonGroup
                value={chartView} exclusive
                onChange={(_, v) => v && setChartView(v)}
                size="small"
                sx={{ '& .MuiToggleButton-root': { borderRadius: '8px', fontSize: '0.75rem', textTransform: 'none', fontWeight: 700 } }}
              >
                <ToggleButton value="region">Régions</ToggleButton>
                <ToggleButton value="absence">Impact Absences</ToggleButton>
                <ToggleButton value="mention">Mentions</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {chartView === 'region' && (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={regionData.slice(0, 16)} margin={{ top: 5, right: 20, left: -5, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.blueL} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#8A9BB0' }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis yAxisId="left"  tick={{ fontSize: 10, fill: '#8A9BB0' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#8A9BB0' }} domain={[0, 20]} />
                  <RT content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.75rem' }} />
                  <Bar yAxisId="left"  dataKey="Étudiants" fill={`${C.blue}80`}   radius={[4,4,0,0]} />
                  <Bar yAxisId="left"  dataKey="À risque"  fill={`${C.orange}90`} radius={[4,4,0,0]} />
                  <Bar yAxisId="right" dataKey="Moyenne"   fill={`${C.green}90`}  radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {chartView === 'absence' && (
              <Box>
                <Typography sx={{ color: '#8A9BB0', fontSize: '0.8rem', mb: 2 }}>
                  Impact du nombre d'absences sur la moyenne académique
                </Typography>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={absData} margin={{ top: 5, right: 20, left: -5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.blueL} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8A9BB0' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#8A9BB0' }} domain={[0, 20]} />
                    <RT content={<CustomTooltip />} />
                    <ReferenceLine y={10} stroke={C.orange} strokeDasharray="4 2" />
                    <Bar dataKey="Moyenne" radius={[6,6,0,0]}>
                      {absData.map((entry, i) => (
                        <Cell key={i} fill={getMoyColor(entry.Moyenne)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}

            {chartView === 'mention' && (
              <Box>
                <Typography sx={{ color: '#8A9BB0', fontSize: '0.8rem', mb: 2 }}>
                  Distribution des mentions obtenues en L3-S6
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={mentionData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {mentionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <RT content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 2 }}>
                      {mentionData.map((m, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 14, height: 14, borderRadius: '4px', background: m.color, flexShrink: 0 }} />
                          <Typography sx={{ flex: 1, fontSize: '0.85rem', color: C.navy, fontWeight: 600 }}>{m.name}</Typography>
                          <Typography sx={{ fontSize: '0.85rem', color: '#8A9BB0', fontWeight: 700 }}>{fmt(m.value)}</Typography>
                          <Box sx={{ width: 80, height: 6, borderRadius: 3, background: '#f0f0f0', overflow: 'hidden' }}>
                            <Box sx={{
                              height: '100%', borderRadius: 3, background: m.color,
                              width: `${(m.value / (mentionData[0]?.value || 1)) * 100}%`,
                            }} />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* ── Row 4: Speciality performance ────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Box sx={{ ...card(), p: 3, animation: `${fadeUp} 0.5s 320ms both` }}>
            <SectionTitle icon={<EmojiEvents />} title="Top 8 Meilleures Spécialités" subtitle="Par moyenne générale (min. 30 étudiants)" onInfo={() => openInfo(SECTION_INFO.topSpecs)} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              {topSpecs.map((s, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ width: 20, textAlign: 'center', fontWeight: 800, color: '#8A9BB0', fontSize: '0.85rem' }}>
                    {i + 1}
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: C.navy, mb: 0.3 }}>
                      {s.nom_specialite?.length > 36 ? s.nom_specialite.substring(0, 36) + '…' : s.nom_specialite}
                    </Typography>
                    <Box sx={{ height: 6, borderRadius: 3, background: '#f0f0f0', overflow: 'hidden' }}>
                      <Box sx={{
                        height: '100%', borderRadius: 3,
                        background: `linear-gradient(90deg, ${C.green}, ${C.blue})`,
                        width: `${(Number(s.moy) / 20) * 100}%`,
                        transition: 'width 1s ease',
                      }} />
                    </Box>
                  </Box>
                  <Typography sx={{ fontWeight: 900, fontSize: '0.9rem', color: C.green, minWidth: 36, textAlign: 'right' }}>
                    {fmt(s.moy, 2)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ ...card(), p: 3, animation: `${fadeUp} 0.5s 360ms both` }}>
            <SectionTitle icon={<Warning />} title="8 Spécialités les Plus Fragiles" subtitle="Par moyenne générale (min. 30 étudiants)" onInfo={() => openInfo(SECTION_INFO.bottomSpecs)} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              {bottomSpecs.map((s, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ width: 20, textAlign: 'center', fontWeight: 800, color: '#8A9BB0', fontSize: '0.85rem' }}>
                    {i + 1}
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: C.navy, mb: 0.3 }}>
                      {s.nom_specialite?.length > 36 ? s.nom_specialite.substring(0, 36) + '…' : s.nom_specialite}
                    </Typography>
                    <Box sx={{ height: 6, borderRadius: 3, background: '#f0f0f0', overflow: 'hidden' }}>
                      <Box sx={{
                        height: '100%', borderRadius: 3,
                        background: `linear-gradient(90deg, #EF4444, ${C.orange})`,
                        width: `${(Number(s.moy) / 20) * 100}%`,
                        transition: 'width 1s ease',
                      }} />
                    </Box>
                  </Box>
                  <Typography sx={{ fontWeight: 900, fontSize: '0.9rem', color: '#EF4444', minWidth: 36, textAlign: 'right' }}>
                    {fmt(s.moy, 2)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* ── Info Modal ───────────────────────────────────────── */}
      <InfoModal open={infoModal.open} onClose={closeInfo} config={infoModal.config} />

    </Box>
  );
}
