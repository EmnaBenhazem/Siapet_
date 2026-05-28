import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography,
  Chip, Button,
  Dialog, DialogContent, IconButton,
  Snackbar, Alert, CircularProgress,
  TextField, InputAdornment, Select, FormControl, MenuItem,
  LinearProgress, Tooltip, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import {
  Close, ArrowForward, TrendingUp, TrendingDown,
  Search, FilterList, Refresh,
  LocationOn, Phone, Email, Language,
  People, AccountBalance, Business, CalendarToday,
  CheckCircle, Warning, Error as ErrorIcon,
  Send, PendingActions, FileDownload, InfoOutlined, Timeline,
} from '@mui/icons-material';
import { keyframes } from '@mui/system';
import config from '../../config';
import api from '../../services/api';
import mlService from '../../services/mlService';

// ── colour tokens ─────────────────────────────────────────────────
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

// ── keyframes ─────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity:0; transform:translateY(32px); }
  to   { opacity:1; transform:translateY(0);    }
`;
const popIn = keyframes`
  from { opacity:0; transform:scale(0.6) translateY(16px); }
  to   { opacity:1; transform:scale(1)   translateY(0);    }
`;
const slideLeft = keyframes`
  from { opacity:0; transform:translateX(-24px); }
  to   { opacity:1; transform:translateX(0);     }
`;
const blinkDot = keyframes`
  0%,100% { opacity:1; } 50% { opacity:0.25; }
`;
const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

// ── shared sx helpers ─────────────────────────────────────────────
const featureCardSx = () => ({
  borderRadius: 3,
  border: '1px solid #E5E7EB',
});

const iconBgMap = {
  coral:    { bg: '#FFF1EE', color: '#FF6B35' },
  mint:     { bg: '#E6FBF5', color: '#06D6A0' },
  lavender: { bg: '#F3EEFF', color: '#7B2CBF' },
  peach:    { bg: '#FFF7ED', color: '#F59E0B' },
};

// ── helpers ───────────────────────────────────────────────────────
const statutFromTaux = (taux) => {
  const t = Number(taux) || 0;
  if (t >= 75) return 'excellent';
  if (t >= 65) return 'bon';
  return 'risque';
};

const statutConfig = (taux) => {
  const s = statutFromTaux(taux);
  return {
    excellent: { label: 'Excellent', bg: `${C.green}15`,  color: C.green,  icon: <CheckCircle sx={{ fontSize: 13 }} /> },
    bon:       { label: 'Bon',       bg: `${C.blue}15`,   color: C.blue,   icon: <TrendingUp  sx={{ fontSize: 13 }} /> },
    risque:    { label: 'À risque',  bg: `${C.orange}15`, color: C.orange, icon: <Warning     sx={{ fontSize: 13 }} /> },
  }[s];
};

const fmt      = (n)  => n != null ? Number(n).toLocaleString('fr-TN') : '—';
const fmtPct   = (n)  => n != null ? `${Number(n).toFixed(1)}%` : '—';
const fmtBudget = (n) => {
  if (!n) return '—';
  const v = Number(n);
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)} Mds DT`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)} M DT`;
  return `${v.toLocaleString('fr-TN')} DT`;
};

// ── CSV export ────────────────────────────────────────────────────
function exportToCSV(rows) {
  const header = ['Code', 'Nom', 'Type', 'Ville', 'Effectif total',
    'Taux réussite (%)', 'Taux échec (%)', 'Performance', 'Budget alloué', 'Statut'];
  const esc  = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map(r => [
    r.code_etablissement || r.code,
    r.nom_etablissement  || r.nom,
    r.type,
    r.nom_ville || '',
    r.effectif_total || r.effectif || 0,
    r.taux_reussite  || r.taux    || 0,
    r.taux_echec     || 0,
    r.performance    || 0,
    r.budget_alloue  || 0,
    statutConfig(r.taux_reussite || r.taux).label,
  ].map(esc).join(','));
  const csv  = [header.join(','), ...lines].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `etablissements_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════════════════════════════
//  STAT CARD
// ══════════════════════════════════════════════════════════════════
function StatCard({ title, value, change, changeType, icon, iconBg, delay }) {
  const palette = iconBgMap[iconBg] || { bg: C.blueL, color: C.blue };
  return (
    <Card sx={{
      borderRadius: '20px', background: '#fff',
      border: `1.5px solid ${C.blueL}`,
      boxShadow: `0 2px 16px ${C.blue}0A`,
      animation: `${fadeUp} 0.55s ease-out ${delay}s both`,
      transition: 'all 0.32s cubic-bezier(0.4,0,0.2,1)',
      position: 'relative', overflow: 'hidden',
      '&::before': {
        content: '""', position: 'absolute',
        top: 0, left: 0, right: 0, height: '5px',
        background: palette.color,
        borderRadius: '20px 20px 0 0',
      },
      '&:hover': { transform: 'translateY(-6px)', boxShadow: `0 12px 36px ${palette.color}18` },
    }}>
      <CardContent sx={{ p: 3, minHeight: '190px', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
          <Typography sx={{
            color: '#8A9BB0', fontSize: '0.75rem', fontWeight: 700,
            lineHeight: 1.4, textTransform: 'uppercase', letterSpacing: '1.4px',
            maxWidth: '65%',
          }}>
            {title}
          </Typography>
          <Box sx={{
            width: 52, height: 52, borderRadius: '14px',
            background: palette.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', flexShrink: 0,
            border: `1.5px solid ${palette.color}28`,
          }}>
            {icon}
          </Box>
        </Box>
        <Typography sx={{ fontWeight: 900, fontSize: '2.4rem', color: C.navy, letterSpacing: '-2px', mb: 2.5, lineHeight: 1 }}>
          {value}
        </Typography>
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.5,
          px: 2, py: 0.6, borderRadius: '20px',
          background: changeType === 'positive' ? `${C.green}15` : '#FFF0F0',
          color: changeType === 'positive' ? C.green : '#EF4444',
          fontSize: '0.76rem', fontWeight: 700,
          border: `1px solid ${changeType === 'positive' ? C.green + '28' : '#FFCDD2'}`,
          mt: 'auto', alignSelf: 'flex-start',
        }}>
          {change}
        </Box>
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
//  CUSTOM RECHARTS TOOLTIP
// ══════════════════════════════════════════════════════════════════
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{
      background: '#fff', border: `1.5px solid ${C.blueL}`,
      borderRadius: '14px', px: 2.5, py: 1.5,
      boxShadow: `0 8px 32px ${C.blue}18`,
    }}>
      <Typography sx={{ fontSize: '0.75rem', color: '#8A9BB0', mb: 0.3 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 900, color: C.blue, fontSize: '1.1rem', letterSpacing: '-0.5px' }}>
        {payload[0].value}%
      </Typography>
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ML INFO POPUP — composant réutilisable (M1 ou M3)
// ══════════════════════════════════════════════════════════════════
function MLInfoPopup({ open, model, onClose }) {
  if (!open) return null;
  const isM1 = model === 'm1';

  const SectionHeader = ({ emoji, bg, title }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
      <Box sx={{ width: 24, height: 24, borderRadius: '6px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>{emoji}</Box>
      <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{title}</Typography>
    </Box>
  );

  const VarRow = ({ sym, name, unit }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, px: 1.2, py: 0.65, borderRadius: '8px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
      <Typography sx={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 800, color: '#7c3aed', minWidth: 24 }}>{sym}</Typography>
      <Typography sx={{ fontSize: '12px', color: '#475569', flex: 1 }}>{name}</Typography>
      <Chip label={unit} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, background: '#ede9fe', color: '#7c3aed', '& .MuiChip-label': { px: 0.8 } }} />
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(15,23,42,0.2)' } }}>

      {/* Header */}
      <Box sx={{
        px: 3, py: 2.5,
        background: isM1
          ? 'linear-gradient(135deg, #eef4ff 0%, #e0f2fe 100%)'
          : 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
        borderBottom: `1px solid ${isM1 ? '#dbeafe' : '#e9d5ff'}`,
        display: 'flex', alignItems: 'center', gap: 1.5,
      }}>
        <Box sx={{
          width: 42, height: 42, borderRadius: '12px', flexShrink: 0,
          background: isM1 ? 'linear-gradient(135deg, #0c1e3e, #1e6ef5)' : 'linear-gradient(135deg, #7c3aed, #1e6ef5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
        }}>
          {isM1 ? '🤖' : '🎯'}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
            {isM1 ? 'Comment fonctionne la Prévision IA — M1 ?' : 'Comment fonctionne la Performance Future — M3 ?'}
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#64748b', mt: 0.3 }}>
            {isM1 ? 'Modèle M1 · Régression Linéaire · R²=86%' : 'Modèle M3 · Régression Linéaire · R²=74.5%'}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#94a3b8', '&:hover': { color: '#0f172a', background: '#f1f5f9' } }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {/* C'est quoi ? */}
        <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #f1f5f9' }}>
          <SectionHeader emoji="💡" bg="#eff6ff" title="C'est quoi ?" />
          <Typography sx={{ fontSize: '13px', color: '#475569', lineHeight: 1.75 }}>
            {isM1
              ? "Estimation du taux de réussite attendu pour l'année académique 2025-2026, calculée par un algorithme d'intelligence artificielle entraîné sur des données réelles d'établissements tunisiens."
              : "Estimation de la moyenne finale que les étudiants devraient obtenir en 2025-2026, produite par un algorithme qui analyse les tendances académiques actuelles de l'établissement."}
          </Typography>
        </Box>

        {/* Formule mathématique */}
        <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #f1f5f9' }}>
          <SectionHeader emoji="🧮" bg="#fdf4ff" title="Formule mathématique appliquée" />
          <Box sx={{ mb: 1.5, p: 1.5, borderRadius: '10px', background: '#0f172a', border: '1px solid #1e293b' }}>
            <Typography sx={{ fontSize: '11px', color: '#94a3b8', mb: 0.6, fontWeight: 600, letterSpacing: '0.05em' }}>
              Régression Linéaire Multiple
            </Typography>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '12.5px', color: '#7dd3fc', lineHeight: 2, whiteSpace: 'pre-wrap' }}>
              {isM1
                ? 'ŷ = β₀ + β₁·x₁ + β₂·x₂ + β₃·x₃\n   + β₄·x₄ + β₅·x₅ + β₆·x₆ + β₇·x₇'
                : 'ŷ = β₀ + β₁·x₁ + β₂·x₂ + β₃·x₃\n   + β₄·x₄ + β₅·x₅ + β₆·x₆\n   + β₇·x₇ + β₈·x₈'}
            </Typography>
            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #1e293b' }}>
              <Typography sx={{ fontFamily: 'monospace', fontSize: '11px', color: '#4ade80' }}>
                {isM1 ? 'ŷ = Taux de réussite prédit (%)' : 'ŷ = Moyenne finale prédite (/20)'}
              </Typography>
              <Typography sx={{ fontFamily: 'monospace', fontSize: '11px', color: '#f59e0b', mt: 0.3 }}>
                β₀…βₙ = coefficients appris par le modèle
              </Typography>
            </Box>
          </Box>
          <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', mb: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Correspondance des variables
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {(isM1 ? [
              { sym: 'x₁', name: 'Taux de réussite N-1',         unit: '%'   },
              { sym: 'x₂', name: 'Taux de réussite N-2',         unit: '%'   },
              { sym: 'x₃', name: "Taux d'absence moyen",         unit: '%'   },
              { sym: 'x₄', name: 'Ratio étudiants / enseignant', unit: 'nb'  },
              { sym: 'x₅', name: 'Budget par étudiant',          unit: 'DT'  },
              { sym: 'x₆', name: 'Nombre de laboratoires',       unit: 'nb'  },
              { sym: 'x₇', name: 'Taux de rotation enseignants', unit: '%'   },
            ] : [
              { sym: 'x₁', name: 'Moyenne semestre précédent',   unit: '/20' },
              { sym: 'x₂', name: 'Note CC1',                     unit: '/20' },
              { sym: 'x₃', name: 'Note CC2',                     unit: '/20' },
              { sym: 'x₄', name: 'Note CC3',                     unit: '/20' },
              { sym: 'x₅', name: "Taux d'absence actuel",        unit: '%'   },
              { sym: 'x₆', name: "Pente d'évolution CC1→CC3",    unit: 'pts' },
              { sym: 'x₇', name: 'Matières sous la moyenne',     unit: 'nb'  },
              { sym: 'x₈', name: 'Ratio de notes obtenues',      unit: '0–1' },
            ]).map(v => <VarRow key={v.sym} {...v} />)}
          </Box>
          <Box sx={{ mt: 1.5, p: 1.5, borderRadius: '10px', background: 'linear-gradient(135deg, #fffbeb, #fef9c3)', border: '1px solid #fde68a' }}>
            <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#92400e', mb: 0.5 }}>📐 Estimation des entrées</Typography>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '11px', color: '#78350f', lineHeight: 2, whiteSpace: 'pre-wrap' }}>
              {isM1
                ? 'x₁ = max(0, taux_réussite − 1.8)\nx₂ = taux_réussite  (valeur réelle DB)\nx₅ = budget_alloué ÷ effectif_total'
                : 'x₁ = min(16, max(5, 5 + taux_réussite × 0.1))\nx₇ = max(0, round((1 − taux_réussite) × 6))\nx₂₋₄ = estimés à partir de x₁ ± 0.5 pts'}
            </Typography>
          </Box>
        </Box>

        {/* Comment lire */}
        <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #f1f5f9' }}>
          <SectionHeader emoji="🔍" bg="#fef3c7" title="Comment lire le résultat ?" />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
            {(isM1 ? [
              { range: '≥ 70%',     label: 'Bon',        color: '#22c55e', bg: '#f0fdf4' },
              { range: '55% – 69%', label: 'Moyen',      color: '#f59e0b', bg: '#fffbeb' },
              { range: '< 55%',     label: 'Faible',     color: '#ef4444', bg: '#fef2f2' },
            ] : [
              { range: '≥ 16/20',   label: 'Très bien',  color: '#22c55e', bg: '#f0fdf4' },
              { range: '≥ 14/20',   label: 'Bien',       color: '#06D6A0', bg: '#ecfdf5' },
              { range: '≥ 12/20',   label: 'Assez bien', color: '#4D9FFF', bg: '#eff6ff' },
              { range: '≥ 10/20',   label: 'Passable',   color: '#f59e0b', bg: '#fffbeb' },
              { range: '< 10/20',   label: 'Insuffisant',color: '#ef4444', bg: '#fef2f2' },
            ]).map(m => (
              <Box key={m.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 0.9, borderRadius: '9px', background: m.bg, border: `1px solid ${m.color}25` }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                <Typography sx={{ fontSize: '12.5px', color: m.color, fontWeight: 700, minWidth: 78 }}>{m.range}</Typography>
                <Typography sx={{ fontSize: '12.5px', color: '#475569' }}>→ {isM1 ? m.label : `Mention ${m.label}`}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Fiabilité */}
        <Box sx={{ px: 3, py: 2.5 }}>
          <Box sx={{ p: 2, borderRadius: '12px', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', border: '1px solid #bae6fd' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '12.5px', color: '#0369a1', mb: 0.5 }}>
              ⚡ Précision du modèle : {isM1 ? 'R² = 86%' : 'R² = 74,5%'}
            </Typography>
            <Typography sx={{ fontSize: '12px', color: '#0c4a6e', lineHeight: 1.7 }}>
              {isM1
                ? "Le modèle explique 86% de la variation des taux de réussite observés. La valeur reste une estimation — les résultats réels peuvent varier selon des facteurs imprévisibles."
                : "Le modèle explique 74,5% de la variation des moyennes finales. Les résultats réels peuvent différer selon l'effort individuel des étudiants et d'autres facteurs."}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ETAB DETAILS MODAL  (replaces static "Détails →" action)
// ══════════════════════════════════════════════════════════════════
function EtabDetailsModal({ etab, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mlPred,  setMlPred]  = useState(null);
  const [mlLoad,  setMlLoad]  = useState(false);

  useEffect(() => {
    if (!etab) return;
    setLoading(true);
    setDetails(null);
    setMlPred(null);
    Promise.all([
      api.get(`/etablissements/${etab.id || etab.id_etablissement}`).catch(() => ({ data: {} })),
      api.get(`/etablissements/${etab.id || etab.id_etablissement}/departements`).catch(() => ({ data: [] })),
    ]).then(([etabRes, deptRes]) => {
      const info = etabRes.data?.etablissement || etabRes.data || etab;
      setDetails({
        info,
        departements: Array.isArray(deptRes.data)
          ? deptRes.data
          : deptRes.data?.departements || [],
      });
      // Fetch ML inputs from shared backend endpoint (same data source as directeur)
      const etabId = etab.id || etab.id_etablissement;
      setMlLoad(true);
      api.get(`/predictions/etablissement-data/${etabId}`)
        .then(mlRes => {
          if (mlRes.data.success) {
            return mlService.predireReussite(mlRes.data.m1);
          }
          throw new Error('ML data non disponible');
        })
        .then(r => setMlPred(r.data))
        .catch(() => {})
        .finally(() => setMlLoad(false));
    }).finally(() => setLoading(false));
  }, [etab]);

  if (!etab) return null;

  const sc   = statutConfig(etab.taux_reussite || etab.taux || 0);
  const info = details?.info  || etab;
  const depts = details?.departements || [];

  const KpiBox = ({ icon, label, value, color = C.blue, delay = 0 }) => (
    <Box sx={{
      p: 2, borderRadius: '14px', background: `${color}09`,
      border: `1px solid ${color}20`, textAlign: 'center',
      animation: `${popIn} 0.4s ease-out ${delay}s both`,
    }}>
      <Box sx={{ color, mb: 0.5 }}>{icon}</Box>
      <Typography sx={{ fontWeight: 900, color, fontSize: '1.1rem', letterSpacing: '-0.4px' }}>{value}</Typography>
      <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0', fontWeight: 600, mt: 0.2 }}>{label}</Typography>
    </Box>
  );

  const InfoRow = ({ icon, label, value }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.2, borderBottom: `1px solid ${C.blueL}` }}>
      <Box sx={{ color: C.blue, mt: 0.2, flexShrink: 0 }}>{icon}</Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '0.87rem', color: C.navy, fontWeight: 600, mt: 0.15 }}>{value || '—'}</Typography>
      </Box>
    </Box>
  );

  return (
    <Dialog
      open={!!etab}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          border: `1.5px solid ${C.blueL}`,
          boxShadow: `0 24px 60px rgba(26,58,107,0.16)`,
          animation: `${popIn} 0.38s cubic-bezier(0.34,1.56,0.64,1)`,
          overflow: 'hidden',
          background: '#FAFCFF',
        },
      }}
    >
      {/* Header */}
      <Box sx={{
        px: 3, py: 2.5,
        background: `linear-gradient(135deg, ${sc.color}12 0%, ${C.blueL} 100%)`,
        borderBottom: `1.5px solid ${sc.color}20`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 50, height: 50, borderRadius: '15px',
            background: '#fff', border: `1.5px solid ${sc.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', boxShadow: `0 4px 16px ${sc.color}18`,
          }}>
            🏫
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, color: C.navy, fontSize: '1.05rem', letterSpacing: '-0.3px', maxWidth: 420 }}>
              {etab.nom_etablissement || etab.nom}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
              <Chip label={etab.code_etablissement || etab.code} size="small"
                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, background: `${C.blue}12`, color: C.blue }} />
              <Chip label={etab.type} size="small"
                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, background: `${C.purple}12`, color: C.purple }} />
              <Chip icon={sc.icon} label={sc.label} size="small"
                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, background: sc.bg, color: sc.color, '& .MuiChip-icon': { color: sc.color } }} />
            </Box>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{
          color: C.navy, opacity: 0.5, borderRadius: '10px',
          '&:hover': { background: `${C.blue}18`, opacity: 1, transform: 'rotate(90deg)' },
          transition: 'all 0.2s',
        }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>

      {/* Body */}
      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6, gap: 2 }}>
            <CircularProgress size={28} sx={{ color: C.blue }} />
            <Typography sx={{ color: '#8A9BB0', fontWeight: 600 }}>Chargement des données...</Typography>
          </Box>
        ) : (
          <>
            {/* KPIs */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <KpiBox icon={<People />}          label="Effectif total"   value={fmt(info.effectif_total  || info.effectif)}   color={C.blue}   delay={0}    />
              </Grid>
              <Grid item xs={6} sm={3}>
                <KpiBox icon={<TrendingUp />}       label="Taux de réussite" value={fmtPct(info.taux_reussite || info.taux)}      color={C.green}  delay={0.06} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <KpiBox icon={<ErrorIcon />}        label="Taux d'échec"     value={fmtPct(info.taux_echec)}                      color={C.orange} delay={0.12} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <KpiBox icon={<AccountBalance />}   label="Budget alloué"    value={fmtBudget(info.budget_alloue)}                color={C.purple} delay={0.18} />
              </Grid>
            </Grid>

            {/* Progress bars */}
            <Box sx={{ mb: 3, p: 2.5, borderRadius: '16px', background: '#fff', border: `1px solid ${C.blueL}` }}>
              <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.88rem', mb: 2 }}>
                📊 Indicateurs de performance
              </Typography>
              {[
                { label: 'Taux de réussite',     value: Number(info.taux_reussite  || info.taux  || 0), color: C.green  },
                { label: "Taux d'occupation",    value: Number(info.taux_occupation || 0),               color: C.blue   },
                { label: 'Score de performance', value: Number(info.performance    || 0),               color: C.purple },
              ].map((bar) => (
                <Box key={bar.label} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.78rem', color: '#8A9BB0', fontWeight: 600 }}>{bar.label}</Typography>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: bar.color }}>{bar.value.toFixed(1)}%</Typography>
                  </Box>
                  <Box sx={{ height: 8, borderRadius: 4, background: `${bar.color}15`, overflow: 'hidden' }}>
                    <Box sx={{
                      height: '100%', borderRadius: 4,
                      width: `${Math.min(100, bar.value)}%`,
                      background: `linear-gradient(90deg, ${bar.color}, ${bar.color}AA)`,
                      transition: 'width 0.8s ease',
                    }} />
                  </Box>
                </Box>
              ))}
            </Box>

            <Grid container spacing={2.5}>
              {/* Infos générales */}
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2.5, borderRadius: '16px', background: '#fff', border: `1px solid ${C.blueL}`, height: '100%' }}>
                  <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.88rem', mb: 1.5 }}>
                    📋 Informations générales
                  </Typography>
                  <InfoRow icon={<Business sx={{ fontSize: 17 }} />}       label="Type"          value={info.type} />
                  <InfoRow icon={<LocationOn sx={{ fontSize: 17 }} />}     label="Ville"         value={info.nom_ville} />
                  <InfoRow icon={<Phone sx={{ fontSize: 17 }} />}          label="Téléphone"     value={info.telephone} />
                  <InfoRow icon={<Email sx={{ fontSize: 17 }} />}          label="Email"         value={info.email} />
                  <InfoRow icon={<Language sx={{ fontSize: 17 }} />}       label="Site web"      value={info.site_web} />
                  <InfoRow icon={<CalendarToday sx={{ fontSize: 17 }} />}  label="Date création" value={info.date_creation ? new Date(info.date_creation).toLocaleDateString('fr-TN') : null} />
                  <InfoRow icon={<People sx={{ fontSize: 17 }} />}         label="Capacité max"  value={fmt(info.capacite_maximale)} />
                </Box>
              </Grid>

              {/* Départements */}
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2.5, borderRadius: '16px', background: '#fff', border: `1px solid ${C.blueL}`, height: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.88rem' }}>🏢 Départements</Typography>
                    <Chip label={`${depts.length} dept.`} size="small"
                      sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, background: `${C.blue}12`, color: C.blue }} />
                  </Box>
                  {depts.length === 0 ? (
                    <Box sx={{ py: 3, textAlign: 'center' }}>
                      <Typography sx={{ color: '#8A9BB0', fontSize: '0.82rem' }}>Aucun département enregistré</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 240, overflowY: 'auto', pr: 0.5 }}>
                      {depts.map((d, i) => (
                        <Box key={d.id_departement || i} sx={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          p: 1.2, borderRadius: '10px',
                          background: i % 2 === 0 ? C.blueL : '#fff',
                          animation: `${slideLeft} 0.3s ease-out ${i * 0.05}s both`,
                        }}>
                          <Box>
                            <Typography sx={{ fontWeight: 700, color: C.navy, fontSize: '0.8rem', lineHeight: 1.3 }}>
                              {d.nom_departement}
                            </Typography>
                            {d.chef_departement && (
                              <Typography sx={{ fontSize: '0.68rem', color: '#8A9BB0' }}>Chef: {d.chef_departement}</Typography>
                            )}
                          </Box>
                          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                            {d.nombre_enseignants != null && (
                              <Typography sx={{ fontSize: '0.7rem', color: C.blue, fontWeight: 700 }}>{d.nombre_enseignants} ens.</Typography>
                            )}
                            {d.nombre_etudiants != null && (
                              <Typography sx={{ fontSize: '0.7rem', color: C.green, fontWeight: 700 }}>{d.nombre_etudiants} ét.</Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>

            {info.adresse && (
              <Box sx={{ mt: 2.5, p: 2, borderRadius: '14px', background: `${C.blue}06`, border: `1px solid ${C.blue}18`, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <LocationOn sx={{ color: C.blue, mt: 0.2, flexShrink: 0 }} />
                <Typography sx={{ fontSize: '0.85rem', color: C.navy, fontWeight: 500 }}>{info.adresse}</Typography>
              </Box>
            )}

            {/* ── Prévision IA ── */}
            {(mlLoad || mlPred) && (
              <Box sx={{ mt: 2.5, p: 2.5, borderRadius: '16px', background: `linear-gradient(135deg, ${C.blueL} 0%, #f0f9ff 100%)`, border: `1.5px solid ${C.blue}20` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🤖</Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.88rem' }}>Prévision IA 2025-2026</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0' }}>Modèle M1 · données spécifiques à cet établissement</Typography>
                  </Box>
                  <Chip label="IA" size="small" sx={{ ml: 'auto', background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`, color: '#fff', fontWeight: 800, fontSize: '0.68rem', borderRadius: '8px', border: 'none' }} />
                </Box>
                {mlLoad ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
                    <CircularProgress size={20} sx={{ color: C.blue }} />
                    <Typography sx={{ color: '#8A9BB0', fontSize: '0.82rem' }}>Calcul de la prévision en cours...</Typography>
                  </Box>
                ) : mlPred ? (
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ p: 2, borderRadius: '12px', background: `${mlPred.couleur}0e`, border: `1.5px solid ${mlPred.couleur}28` }}>
                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.8 }}>Réussite prédit 2025-2026</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, mb: 0.8 }}>
                          <Typography sx={{ fontWeight: 900, fontSize: '2rem', color: mlPred.couleur, lineHeight: 1, letterSpacing: '-1px' }}>{mlPred.taux_reussite_predit}</Typography>
                          <Typography sx={{ color: '#8A9BB0', fontWeight: 600, mb: 0.2, fontSize: '0.9rem' }}>%</Typography>
                          <Chip label={mlPred.interpretation} size="small" sx={{ ml: 0.5, mb: 0.2, background: `${mlPred.couleur}18`, color: mlPred.couleur, border: `1px solid ${mlPred.couleur}35`, fontWeight: 700, fontSize: '0.62rem' }} />
                        </Box>
                        <LinearProgress variant="determinate" value={mlPred.taux_reussite_predit}
                          sx={{ height: 5, borderRadius: 3, backgroundColor: `${mlPred.couleur}15`, '& .MuiLinearProgress-bar': { backgroundColor: mlPred.couleur, borderRadius: 3 } }} />
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ p: 2, borderRadius: '12px', background: '#FEF2F2', border: '1.5px solid #FECACA' }}>
                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.8 }}>Échec prédit 2025-2026</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, mb: 0.8 }}>
                          <Typography sx={{ fontWeight: 900, fontSize: '2rem', color: '#EF4444', lineHeight: 1, letterSpacing: '-1px' }}>
                            {Math.round((100 - mlPred.taux_reussite_predit) * 10) / 10}
                          </Typography>
                          <Typography sx={{ color: '#8A9BB0', fontWeight: 600, mb: 0.2, fontSize: '0.9rem' }}>%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={100 - mlPred.taux_reussite_predit}
                          sx={{ height: 5, borderRadius: 3, backgroundColor: '#FECACA', '& .MuiLinearProgress-bar': { backgroundColor: '#EF4444', borderRadius: 3 } }} />
                      </Box>
                    </Grid>
                  </Grid>
                ) : null}
              </Box>
            )}
          </>
        )}
      </DialogContent>

      {/* Footer */}
      <Box sx={{ px: 3, py: 2, borderTop: `1px solid ${C.blueL}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
        <Typography sx={{ fontSize: '0.75rem', color: '#8A9BB0' }}>
          ID: {etab.id || etab.id_etablissement} · {new Date().toLocaleDateString('fr-TN')}
        </Typography>
        <Button onClick={onClose} variant="contained" sx={{
          borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3,
          background: `linear-gradient(135deg, ${C.blue} 0%, ${C.blueB} 100%)`,
          boxShadow: `0 4px 16px ${C.blue}30`,
          '&:hover': { boxShadow: `0 6px 20px ${C.blue}45`, transform: 'translateY(-1px)' },
          transition: 'all 0.2s',
        }}>
          Fermer
        </Button>
      </Box>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════
//  RICH DETAILS MODAL  (evolution / alertes / top)
// ══════════════════════════════════════════════════════════════════
function DetailsModal({ open, onClose, type, data, title, accentColor }) {
  if (!open) return null;
  const accent = accentColor || C.blue;

  const EvolutionContent = () => {
    const min    = Math.min(...data.map(d => d.taux));
    const max    = Math.max(...data.map(d => d.taux));
    const latest = data[data.length - 1];
    const prev   = data[data.length - 2];
    const diff   = (latest.taux - prev.taux).toFixed(1);
    return (
      <Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Taux actuel',   value: `${latest.taux}%`, icon: '📈', color: C.blue,   bg: `${C.blue}10`   },
            { label: 'Progression',   value: `+${diff}%`,       icon: '🚀', color: C.green,  bg: `${C.green}10`  },
            { label: 'Meilleur taux', value: `${max}%`,         icon: '🏆', color: C.yellow, bg: `${C.yellow}10` },
            { label: 'Taux minimal',  value: `${min}%`,         icon: '📉', color: C.orange, bg: `${C.orange}10` },
          ].map((kpi, i) => (
            <Grid item xs={6} sm={3} key={i}>
              <Box sx={{ p: 2, borderRadius: '16px', background: kpi.bg, border: `1px solid ${kpi.color}20`, textAlign: 'center', animation: `${popIn} 0.4s ease-out ${i * 0.07}s both` }}>
                <Typography sx={{ fontSize: '1.6rem', mb: 0.5 }}>{kpi.icon}</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: '1.3rem', color: kpi.color, letterSpacing: '-0.5px' }}>{kpi.value}</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0', fontWeight: 600 }}>{kpi.label}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.9rem', mb: 1.5 }}>📊 Progression année par année</Typography>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.blueL} />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#8A9BB0' }} stroke="#C8D8E8" />
              <YAxis domain={[70, 80]} tick={{ fontSize: 11, fill: '#8A9BB0' }} stroke="#C8D8E8" />
              <RechartsTooltip content={<CustomTooltip />} />
              <Bar dataKey="taux" radius={[8, 8, 0, 0]}>
                {data.map((_, index) => (
                  <Cell key={index} fill={index === data.length - 1 ? C.blue : `${C.blue}55`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
        <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.9rem', mb: 1.5 }}>📋 Détail par année</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[...data].reverse().map((item, i) => {
            const prevItem = [...data].reverse()[i + 1];
            const delta = prevItem ? (item.taux - prevItem.taux).toFixed(1) : null;
            const isUp  = delta > 0;
            return (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: '12px', background: i === 0 ? `${C.blue}08` : 'transparent', border: i === 0 ? `1px solid ${C.blue}20` : '1px solid transparent', animation: `${slideLeft} 0.35s ease-out ${i * 0.06}s both` }}>
                <Typography sx={{ fontWeight: 700, color: i === 0 ? C.blue : '#8A9BB0', fontSize: '0.9rem', minWidth: 45 }}>{item.year}</Typography>
                <Box sx={{ flex: 1, height: 8, borderRadius: 4, background: `${C.blue}12`, overflow: 'hidden' }}>
                  <Box sx={{ height: '100%', borderRadius: 4, width: `${((item.taux - 70) / 10) * 100}%`, background: i === 0 ? `linear-gradient(90deg, ${C.blue}, ${C.blueB})` : `${C.blue}50`, transition: 'width 0.6s ease' }} />
                </Box>
                <Typography sx={{ fontWeight: 900, color: C.navy, minWidth: 48, fontSize: '0.95rem' }}>{item.taux}%</Typography>
                {delta !== null && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, px: 1, py: 0.3, borderRadius: '8px', background: isUp ? `${C.green}12` : `${C.orange}12`, minWidth: 56 }}>
                    {isUp ? <TrendingUp sx={{ fontSize: 14, color: C.green }} /> : <TrendingDown sx={{ fontSize: 14, color: C.orange }} />}
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: isUp ? C.green : C.orange }}>{isUp ? '+' : ''}{delta}%</Typography>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
        <Box sx={{ mt: 3, p: 2.5, borderRadius: '16px', background: `linear-gradient(135deg, ${C.blue}08, ${C.blueL})`, border: `1px solid ${C.blue}20` }}>
          <Typography sx={{ fontSize: '0.85rem', color: C.navy, fontWeight: 600, lineHeight: 1.6 }}>
            💡 <strong>Analyse :</strong> Le taux de réussite national affiche une progression constante de{' '}
            <strong style={{ color: C.blue }}>+{(data[data.length - 1].taux - data[0].taux).toFixed(1)} points</strong> sur 5 ans,
            reflétant les efforts de modernisation pédagogique engagés par le MESRS depuis 2021.
          </Typography>
        </Box>
      </Box>
    );
  };

  const AlertesContent = () => (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Alertes critiques', value: '1',  icon: '🚨', color: '#EF4444', bg: '#FEF2F2'      },
          { label: 'Alertes élevées',   value: '2',  icon: '⚠️', color: C.orange,  bg: '#FFF7ED'      },
          { label: 'Alertes modérées',  value: '2',  icon: '📉', color: C.yellow,  bg: '#FEFCE8'      },
          { label: 'Établissements OK', value: '13', icon: '✅', color: C.green,   bg: `${C.green}10` },
        ].map((kpi, i) => (
          <Grid item xs={6} sm={3} key={i}>
            <Box sx={{ p: 2, borderRadius: '16px', background: kpi.bg, border: `1px solid ${kpi.color}25`, textAlign: 'center', animation: `${popIn} 0.4s ease-out ${i * 0.07}s both` }}>
              <Typography sx={{ fontSize: '1.5rem', mb: 0.4 }}>{kpi.icon}</Typography>
              <Typography sx={{ fontWeight: 900, fontSize: '1.4rem', color: kpi.color }}>{kpi.value}</Typography>
              <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0', fontWeight: 600 }}>{kpi.label}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
      <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.9rem', mb: 1.5 }}>🔍 Détail des alertes actives</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {data.map((a, i) => {
          const sevLabels = { '#EF4444': 'Critique', '#FF6B35': 'Élevée', '#FFD60A': 'Modérée' };
          const sev = sevLabels[a.color] || 'Info';
          const actions = [
            "Mise en place d'un programme de soutien pédagogique urgent et révision du cursus.",
            "Renforcement du suivi des présences et entretiens individuels avec les étudiants.",
            "Analyse comparative avec les années précédentes et réunion pédagogique.",
          ];
          return (
            <Box key={i} sx={{ p: 2.5, borderRadius: '16px', background: a.bgColor, border: `1.5px solid ${a.color}25`, position: 'relative', overflow: 'hidden', animation: `${slideLeft} 0.4s ease-out ${i * 0.1}s both`, '&::before': { content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: a.color, borderRadius: '16px 0 0 16px' } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography sx={{ fontSize: '1.6rem' }}>{a.icon}</Typography>
                  <Box>
                    <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.9rem', lineHeight: 1.3 }}>{a.etablissement}</Typography>
                    <Chip label={sev} size="small" sx={{ mt: 0.5, height: 20, fontSize: '0.65rem', fontWeight: 700, background: `${a.color}18`, color: a.color, border: `1px solid ${a.color}30` }} />
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderRadius: '10px', background: '#fff', border: `1px solid ${a.color}20`, mb: 1.5 }}>
                <Typography sx={{ fontWeight: 900, color: a.color, fontSize: '1.1rem' }}>{a.message.split(':')[1]?.trim() || a.message}</Typography>
                {a.detail && <Typography sx={{ fontSize: '0.78rem', color: '#8A9BB0', fontWeight: 600 }}>{a.detail}</Typography>}
              </Box>
              <Box sx={{ p: 1.5, borderRadius: '10px', background: `${a.color}08`, border: `1px dashed ${a.color}30` }}>
                <Typography sx={{ fontSize: '0.78rem', color: C.navy, fontWeight: 600 }}>💬 <strong>Action recommandée :</strong> {actions[i]}</Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ mt: 3, p: 2.5, borderRadius: '16px', background: `linear-gradient(135deg, ${C.orange}08, #FFF7ED)`, border: `1px solid ${C.orange}20` }}>
        <Typography sx={{ fontSize: '0.85rem', color: C.navy, fontWeight: 600, lineHeight: 1.6 }}>
          ⚡ <strong>Résumé :</strong> Sur 17 établissements surveillés,{' '}
          <strong style={{ color: C.orange }}>3 nécessitent une intervention immédiate</strong>.
          Un comité de suivi est recommandé avant la fin du mois.
        </Typography>
      </Box>
    </Box>
  );

  const TopEtabContent = () => {
    const rankData     = data || [];
    const medals       = ['🥇', '🥈', '🥉', '4️⃣'];
    const podiumColors = ['#C0C0C0', C.yellow, '#CD7F32'];
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 1.5, mb: 4, mt: 1 }}>
          {[rankData[1], rankData[0], rankData[2]].map((etab, idx) => {
            const realRank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
            const heights  = [90, 120, 70];
            return (
              <Box key={idx} sx={{ flex: 1, maxWidth: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: `${fadeUp} 0.5s ease-out ${idx * 0.1}s both` }}>
                <Typography sx={{ fontSize: '2rem', mb: 0.5 }}>{medals[realRank - 1]}</Typography>
                <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.7rem', textAlign: 'center', mb: 1, lineHeight: 1.3, maxWidth: 100 }}>{etab?.nom}</Typography>
                <Typography sx={{ fontWeight: 900, color: podiumColors[idx], fontSize: '1.1rem', mb: 0.5 }}>{etab?.taux}%</Typography>
                <Box sx={{ width: '100%', height: heights[idx], background: `linear-gradient(180deg, ${podiumColors[idx]}80, ${podiumColors[idx]}30)`, borderRadius: '10px 10px 0 0', border: `2px solid ${podiumColors[idx]}50`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontWeight: 900, color: podiumColors[idx], fontSize: '1.4rem' }}>{realRank}</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
        <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.9rem', mb: 1.5 }}>📋 Classement complet</Typography>
        {rankData.map((etab, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '14px', mb: 1, background: i === 0 ? `${C.yellow}08` : '#FAFBFC', border: `1px solid ${i === 0 ? C.yellow + '30' : C.blueL}`, animation: `${slideLeft} 0.4s ease-out ${i * 0.08}s both` }}>
            <Typography sx={{ fontSize: '1.4rem', minWidth: 32 }}>{medals[i]}</Typography>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 700, color: C.navy, fontSize: '0.88rem' }}>{etab.nom}</Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0' }}>
                {etab.region} · {etab.etudiants?.toLocaleString()} étudiants · {etab.enseignants?.toLocaleString()} enseignants
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontWeight: 900, color: [C.yellow, '#C0C0C0', '#CD7F32', C.blue][i], fontSize: '1.1rem' }}>{etab.taux}%</Typography>
              <Chip label={etab.statut === 'excellent' ? 'Excellent' : 'Bon'} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, background: etab.statut === 'excellent' ? `${C.green}15` : `${C.blue}15`, color: etab.statut === 'excellent' ? C.green : C.blue }} />
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  const renderContent = () => {
    switch (type) {
      case 'evolution': return <EvolutionContent />;
      case 'alertes':   return <AlertesContent />;
      case 'top':       return <TopEtabContent />;
      default:          return <Typography>Aucune information disponible</Typography>;
    }
  };

  const headerGradients = {
    evolution: `linear-gradient(135deg, ${C.blue}18 0%, ${C.blueL} 100%)`,
    alertes:   `linear-gradient(135deg, ${C.orange}15 0%, #FFF7ED 100%)`,
    top:       `linear-gradient(135deg, ${C.yellow}18 0%, #FFFBEB 100%)`,
  };
  const headerIcons = { evolution: '📈', alertes: '⚠️', top: '🏆' };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: '24px', border: `1.5px solid ${C.blueL}`, boxShadow: `0 24px 60px rgba(26,58,107,0.14)`, animation: `${popIn} 0.38s cubic-bezier(0.34,1.56,0.64,1)`, overflow: 'hidden' } }}
    >
      <Box sx={{ px: 3, py: 2.5, background: headerGradients[type] || `linear-gradient(135deg, ${C.blueL}, #D6EEFF)`, borderBottom: `1.5px solid ${accent}18`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 46, height: 46, borderRadius: '14px', background: '#fff', border: `1.5px solid ${accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', boxShadow: `0 4px 16px ${accent}18` }}>
            {headerIcons[type] || '📊'}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, color: C.navy, fontSize: '1.05rem', letterSpacing: '-0.3px' }}>{title}</Typography>
            <Typography sx={{ color: '#8A9BB0', fontSize: '0.75rem' }}>Analyse détaillée — Tunisie 🇹🇳</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: C.navy, opacity: 0.5, borderRadius: '10px', '&:hover': { background: `${accent}18`, opacity: 1, transform: 'rotate(90deg)' }, transition: 'all 0.2s' }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ p: 3, background: '#FAFCFF' }}>{renderContent()}</DialogContent>
      <Box sx={{ px: 3, py: 2, borderTop: `1px solid ${C.blueL}`, display: 'flex', justifyContent: 'flex-end', background: '#fff' }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3, background: `linear-gradient(135deg, ${accent} 0%, ${accent}CC 100%)`, boxShadow: `0 4px 16px ${accent}30`, '&:hover': { boxShadow: `0 6px 20px ${accent}45`, transform: 'translateY(-1px)' }, transition: 'all 0.2s' }}>
          Fermer
        </Button>
      </Box>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════
//  GEOGRAPHY MAP
// ══════════════════════════════════════════════════════════════════
function TunisiaMap() {
  const regions = [
    { nom: 'Tunis',     taux: 78, x: '50%', y: '20%', color: C.green  },
    { nom: 'Ariana',    taux: 76, x: '55%', y: '18%', color: C.green  },
    { nom: 'Ben Arous', taux: 75, x: '52%', y: '25%', color: C.blue   },
    { nom: 'Manouba',   taux: 74, x: '45%', y: '22%', color: C.blue   },
    { nom: 'Nabeul',    taux: 73, x: '65%', y: '28%', color: C.blue   },
    { nom: 'Sousse',    taux: 72, x: '60%', y: '45%', color: C.blue   },
    { nom: 'Monastir',  taux: 71, x: '62%', y: '50%', color: C.blue   },
    { nom: 'Sfax',      taux: 68, x: '58%', y: '65%', color: C.orange },
    { nom: 'Kairouan',  taux: 67, x: '48%', y: '48%', color: C.orange },
    { nom: 'Gabès',     taux: 65, x: '55%', y: '80%', color: C.orange },
  ];
  return (
    <Box sx={{ position: 'relative', height: 300, background: `linear-gradient(135deg, ${C.blueL} 0%, #F0F9FF 100%)`, borderRadius: '16px', border: `1.5px solid ${C.blue}20`, overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${C.blue}08 1px, transparent 1px), linear-gradient(90deg, ${C.blue}08 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      {regions.map((region, i) => (
        <Box key={i} sx={{ position: 'absolute', left: region.x, top: region.y, transform: 'translate(-50%, -50%)', animation: `${popIn} 0.5s ease-out ${0.3 + i * 0.05}s both`, zIndex: 1, '&:hover .region-tooltip': { opacity: 1, visibility: 'visible' } }}>
          <Box sx={{ width: 16, height: 16, borderRadius: '50%', background: region.color, border: '3px solid #fff', boxShadow: `0 4px 12px ${region.color}40`, cursor: 'pointer', transition: 'all 0.3s ease', '&:hover': { transform: 'scale(1.5)', boxShadow: `0 6px 20px ${region.color}60` } }} />
          <Box className="region-tooltip" sx={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', mb: 1, background: '#fff', border: `1.5px solid ${C.blueL}`, borderRadius: '12px', px: 2, py: 1.5, boxShadow: `0 8px 24px ${C.blue}18`, opacity: 0, visibility: 'hidden', transition: 'all 0.3s ease', whiteSpace: 'nowrap', zIndex: 10 }}>
            <Typography sx={{ fontWeight: 700, color: C.navy, fontSize: '0.85rem', mb: 0.3 }}>{region.nom}</Typography>
            <Typography sx={{ color: '#8A9BB0', fontSize: '0.75rem' }}>Taux: <Box component="span" sx={{ fontWeight: 700, color: region.color }}>{region.taux}%</Box></Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════════
//  REGION DETAIL MODAL
// ══════════════════════════════════════════════════════════════════
function RegionDetailModal({ region, onClose }) {
  const [mlPred, setMlPred] = useState(null);
  const [mlLoad, setMlLoad] = useState(false);

  useEffect(() => {
    if (!region) { setMlPred(null); return; }
    setMlLoad(true);
    setMlPred(null);
    const taux2 = parseFloat(region.taux_reussite_moyen || region.taux || 70);
    const taux1 = Math.max(0, Math.round((taux2 - 1.8) * 10) / 10);
    const effectif = parseInt(region.total_etudiants || 1000);
    const budget   = parseFloat(region.budget_total || 0);
    const nbEns    = parseInt(region.total_enseignants || 50);
    const ratio    = nbEns > 0 ? Math.max(1, Math.round((effectif / nbEns) * 10) / 10) : 18;
    const budgetParEtud = effectif > 0 ? Math.round(budget / effectif) : 5000;
    mlService.predireReussite({
      taux_reussite_an1:  taux1,
      taux_reussite_an2:  taux2,
      taux_absence_moyen: 15.0,
      ratio_etud_ens:     ratio,
      budget_par_etud:    Math.max(0, budgetParEtud),
      nb_labos:           5,
      taux_rotation_ens:  8.0,
      region:             region.nom_region || region.nom || 'Grand Tunis',
      type_etablissement: 'Université',
    })
      .then(r => setMlPred(r.data))
      .catch(() => {})
      .finally(() => setMlLoad(false));
  }, [region]);

  if (!region) return null;

  const kpis = [
    { label: 'Établissements', value: region.total_etablissements ?? '—', icon: '🏫', color: C.blue   },
    { label: 'Étudiants',      value: (region.total_etudiants    || 0).toLocaleString('fr-TN'), icon: '👥', color: C.purple },
    { label: 'Enseignants',    value: (region.total_enseignants  || 0).toLocaleString('fr-TN'), icon: '👨‍🏫', color: C.green  },
    { label: 'Taux actuel',    value: `${parseFloat(region.taux_reussite_moyen || region.taux || 0).toFixed(1)}%`, icon: '📊', color: C.orange },
  ];

  return (
    <Dialog open={!!region} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: '24px', border: `1.5px solid ${C.blueL}`, boxShadow: `0 24px 60px rgba(26,58,107,0.16)`, animation: `${popIn} 0.38s cubic-bezier(0.34,1.56,0.64,1)`, overflow: 'hidden', background: '#FAFCFF' } }}
    >
      {/* Header */}
      <Box sx={{ px: 3, py: 2.5, background: `linear-gradient(135deg, ${C.blueL} 0%, #D6EEFF 100%)`, borderBottom: `1.5px solid ${C.blue}20`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 50, height: 50, borderRadius: '15px', background: '#fff', border: `1.5px solid ${C.blue}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', boxShadow: `0 4px 16px ${C.blue}18` }}>🗺️</Box>
          <Box>
            <Typography sx={{ fontWeight: 900, color: C.navy, fontSize: '1.05rem', letterSpacing: '-0.3px' }}>{region.nom_region || region.nom}</Typography>
            <Typography sx={{ color: '#8A9BB0', fontSize: '0.74rem' }}>Rectorat · Région académique · Tunisie 🇹🇳</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: C.navy, opacity: 0.5, borderRadius: '10px', '&:hover': { background: `${C.blue}18`, opacity: 1, transform: 'rotate(90deg)' }, transition: 'all 0.2s' }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {/* KPIs */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {kpis.map((kpi, i) => (
            <Grid item xs={6} sm={3} key={kpi.label}>
              <Box sx={{ p: 1.8, borderRadius: '14px', background: `${kpi.color}09`, border: `1px solid ${kpi.color}20`, textAlign: 'center', animation: `${popIn} 0.4s ease-out ${i * 0.06}s both` }}>
                <Typography sx={{ fontSize: '1.3rem', mb: 0.4 }}>{kpi.icon}</Typography>
                <Typography sx={{ fontWeight: 900, color: kpi.color, fontSize: '1.05rem', letterSpacing: '-0.3px' }}>{kpi.value}</Typography>
                <Typography sx={{ fontSize: '0.68rem', color: '#8A9BB0', fontWeight: 600 }}>{kpi.label}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* ML Prediction */}
        <Box sx={{ p: 2.5, borderRadius: '16px', background: `linear-gradient(135deg, ${C.blueL} 0%, #f0f9ff 100%)`, border: `1.5px solid ${C.blue}20` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🤖</Box>
            <Box>
              <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.88rem' }}>Prévision IA 2025-2026</Typography>
              <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0' }}>Modèle M1 · données spécifiques à cette région</Typography>
            </Box>
            <Chip label="IA" size="small" sx={{ ml: 'auto', background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`, color: '#fff', fontWeight: 800, fontSize: '0.68rem', borderRadius: '8px', border: 'none' }} />
          </Box>
          {mlLoad ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
              <CircularProgress size={22} sx={{ color: C.blue }} />
              <Typography sx={{ color: '#8A9BB0', fontSize: '0.82rem' }}>Calcul de la prévision en cours...</Typography>
            </Box>
          ) : mlPred ? (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ p: 2, borderRadius: '12px', background: `${mlPred.couleur}0e`, border: `1.5px solid ${mlPred.couleur}28` }}>
                  <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.8 }}>Réussite prédit 2025-2026</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, mb: 0.8 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '2rem', color: mlPred.couleur, lineHeight: 1, letterSpacing: '-1px' }}>{mlPred.taux_reussite_predit}</Typography>
                    <Typography sx={{ color: '#8A9BB0', fontWeight: 600, mb: 0.2, fontSize: '0.9rem' }}>%</Typography>
                    <Chip label={mlPred.interpretation} size="small" sx={{ ml: 0.5, mb: 0.2, background: `${mlPred.couleur}18`, color: mlPred.couleur, border: `1px solid ${mlPred.couleur}35`, fontWeight: 700, fontSize: '0.62rem' }} />
                  </Box>
                  <LinearProgress variant="determinate" value={mlPred.taux_reussite_predit}
                    sx={{ height: 5, borderRadius: 3, backgroundColor: `${mlPred.couleur}15`, '& .MuiLinearProgress-bar': { backgroundColor: mlPred.couleur, borderRadius: 3 } }} />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 2, borderRadius: '12px', background: '#FEF2F2', border: '1.5px solid #FECACA' }}>
                  <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.8 }}>Échec prédit 2025-2026</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, mb: 0.8 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '2rem', color: '#EF4444', lineHeight: 1, letterSpacing: '-1px' }}>
                      {Math.round((100 - mlPred.taux_reussite_predit) * 10) / 10}
                    </Typography>
                    <Typography sx={{ color: '#8A9BB0', fontWeight: 600, mb: 0.2, fontSize: '0.9rem' }}>%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={100 - mlPred.taux_reussite_predit}
                    sx={{ height: 5, borderRadius: 3, backgroundColor: '#FECACA', '& .MuiLinearProgress-bar': { backgroundColor: '#EF4444', borderRadius: 3 } }} />
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Typography sx={{ color: '#8A9BB0', fontSize: '0.82rem' }}>
              Prévision non disponible — vérifiez que le serveur ML est démarré (port 5001)
            </Typography>
          )}
        </Box>
      </DialogContent>

      {/* Footer */}
      <Box sx={{ px: 3, py: 2, borderTop: `1px solid ${C.blueL}`, display: 'flex', justifyContent: 'flex-end', background: '#fff' }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3, background: `linear-gradient(135deg, ${C.blue} 0%, ${C.blueB} 100%)`, boxShadow: `0 4px 16px ${C.blue}30`, '&:hover': { boxShadow: `0 6px 20px ${C.blue}45`, transform: 'translateY(-1px)' }, transition: 'all 0.2s' }}>
          Fermer
        </Button>
      </Box>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════
//  INFO CONFIGS
// ══════════════════════════════════════════════════════════════════
const CARD_INFO_CONFIGS = {
  tauxReussite: {
    title: 'Taux de Réussite National', icon: '📊', color: C.orange,
    description:
      'Cet indicateur représente la moyenne nationale pondérée du taux de réussite académique de l\'ensemble des établissements d\'enseignement supérieur publics tunisiens. Il est calculé chaque année à partir du nombre d\'étudiants ayant validé leur année divisé par le total des inscrits. Un taux élevé traduit la qualité de l\'encadrement pédagogique, la pertinence des programmes et l\'efficacité des réformes engagées par le MESRS.',
    legend: [
      { label: 'Excellent — ≥ 75 %',  desc: 'Le système fonctionne bien : les étudiants valident en majorité leurs années. C\'est la cible nationale fixée par le MESRS.', color: C.green  },
      { label: 'Satisfaisant — 65–74 %', desc: 'Niveau acceptable mais des marges de progression existent. Des actions ciblées sur les filières en difficulté sont recommandées.', color: C.blue   },
      { label: 'Préoccupant — 55–64 %',  desc: 'Taux en-dessous de la moyenne attendue. Un plan de redressement pédagogique devrait être envisagé à l\'échelle nationale.', color: C.yellow },
      { label: 'Critique — < 55 %',      desc: 'Situation alarmante nécessitant des mesures correctives urgentes : renforcement de l\'encadrement, révision des programmes, soutien financier.', color: C.orange },
    ],
    insight: 'Pour évaluer l\'impact réel des politiques éducatives, comparez ce taux d\'une année à l\'autre dans le graphique d\'évolution. Une hausse régulière sur 3 ans ou plus est le signe que les réformes engagées produisent des effets durables.',
  },
  universites: {
    title: 'Établissements Publics', icon: '🏫', color: C.green,
    description:
      'Ce compteur affiche le nombre total d\'établissements d\'enseignement supérieur publics placés sous la tutelle directe du Ministère de l\'Enseignement Supérieur et de la Recherche Scientifique (MESRS). Il comprend différentes catégories d\'établissements, chacune ayant un rôle distinct dans le paysage académique tunisien. La Tunisie dispose de l\'un des réseaux d\'enseignement supérieur les plus denses du Maghreb avec une couverture géographique nationale.',
    legend: [
      { label: 'Universités',       desc: 'Institutions fédératrices qui regroupent plusieurs facultés et instituts sous une même tutelle administrative. Elles délivrent des diplômes nationaux de Licence, Master et Doctorat (système LMD).', color: C.green  },
      { label: 'Facultés & Écoles', desc: 'Composantes spécialisées rattachées aux universités (ex : Faculté de Médecine, École Nationale d\'Ingénieurs). Elles forment des professionnels dans des domaines précis et ont leur propre direction pédagogique.', color: C.blue   },
      { label: 'ISET & Instituts',  desc: 'Instituts Supérieurs d\'Enseignement Technologique et instituts professionnels. Orientés vers l\'insertion rapide dans le marché du travail, ils délivrent des diplômes de technicien supérieur (BTS/DUT).', color: C.purple },
    ],
    insight: 'La répartition géographique des établissements est un facteur clé d\'équité. Un déséquilibre entre les régions côtières et l\'intérieur du pays peut creuser les inégalités d\'accès à l\'enseignement supérieur. Ce tableau de bord vous permet de surveiller cette répartition en temps réel.',
  },
  etudiants: {
    title: 'Étudiants Inscrits', icon: '👥', color: C.purple,
    description:
      'Cet indicateur représente l\'effectif total des étudiants officiellement inscrits dans l\'enseignement supérieur public tunisien pour l\'année académique en cours. Il est exprimé en milliers (K) pour faciliter la lecture. Ce chiffre est un indicateur central de la capacité d\'accueil du système, de son attractivité et de la démocratisation de l\'accès aux études supérieures en Tunisie.',
    legend: [
      { label: 'Licence (L) — cycle 1', desc: 'Formation de 3 ans après le baccalauréat. Représente environ 70 % des inscrits. Objectif : acquérir une base académique solide dans une discipline donnée.', color: C.blue   },
      { label: 'Master (M) — cycle 2',  desc: 'Formation de 2 ans après la Licence. Représente environ 20 % des inscrits. Spécialisation avancée orientée vers la recherche ou le monde professionnel.', color: C.purple },
      { label: 'Doctorat (D) — cycle 3', desc: 'Formation de 3 ans minimum après le Master. Représente environ 10 % des inscrits. Contribue directement à la production de recherche scientifique nationale.', color: C.orange },
    ],
    insight: 'Une hausse régulière des inscriptions est un signal positif, mais elle doit être accompagnée d\'une augmentation proportionnelle des ressources (enseignants, locaux, budget) pour maintenir la qualité. Comparez cet effectif à la capacité maximale des établissements pour détecter les risques de surcharge.',
  },
  budget: {
    title: 'Budget MESRS', icon: '💰', color: '#F59E0B',
    description:
      'Ce chiffre représente l\'enveloppe budgétaire totale allouée par l\'État tunisien au Ministère de l\'Enseignement Supérieur et de la Recherche Scientifique pour l\'année fiscale en cours, exprimée en milliards de dinars tunisiens (Mds DT). Ce budget finance l\'ensemble des universités, facultés, ISET et instituts publics du pays. La répartition interne entre fonctionnement, investissement et recherche reflète les priorités stratégiques de l\'État en matière d\'éducation.',
    legend: [
      { label: 'Fonctionnement — ~75 % du budget', desc: 'Recouvre les salaires des enseignants-chercheurs et du personnel administratif, les charges d\'exploitation (eau, électricité, maintenance) et les dépenses courantes des établissements.', color: '#F59E0B' },
      { label: 'Investissement — ~20 % du budget', desc: 'Finance la construction et la rénovation des bâtiments universitaires, l\'achat d\'équipements pédagogiques et scientifiques, et le déploiement des infrastructures numériques.', color: C.blue   },
      { label: 'Recherche — ~5 % du budget',       desc: 'Soutient les projets de recherche scientifique nationaux, les laboratoires spécialisés, les publications académiques et les partenariats internationaux de recherche.', color: C.green  },
    ],
    insight: 'Le ratio budget / étudiant est un indicateur clé de la qualité des conditions d\'études. Une augmentation du budget d\'investissement ciblée sur les régions sous-dotées permet de réduire les inégalités d\'accès aux ressources pédagogiques entre le nord et le sud du pays.',
  },
  evolution: {
    title: 'Évolution du Taux de Réussite', icon: '📈', color: C.blue,
    description:
      'Ce graphique en aires représente la trajectoire du taux de réussite national sur les 5 dernières années académiques. Il permet d\'identifier des tendances à long terme, de détecter des ruptures (baisse soudaine liée à une réforme ou un contexte exceptionnel) et d\'évaluer l\'efficacité des politiques éducatives mises en place par le MESRS. Chaque point sur la courbe correspond à une année académique complète, intégrant les résultats de toutes les sessions d\'examens.',
    legend: [
      { label: 'Courbe bleue — taux annuel',    desc: 'Représente le taux de réussite moyen national pour chaque année académique. Survolez un point pour afficher la valeur exacte.', color: C.blue   },
      { label: 'Zone ombrée — amplitude',       desc: 'La surface colorée sous la courbe visualise l\'écart cumulé entre les années. Plus la zone est large, plus la progression (ou la régression) est marquée.', color: C.blueL  },
      { label: 'Tendance haussière ↗',          desc: 'Une courbe qui monte régulièrement indique que les réformes pédagogiques et les investissements dans l\'encadrement produisent des résultats positifs et durables.', color: C.green  },
      { label: 'Rupture de tendance ↘',         desc: 'Une chute soudaine signale un événement perturbateur (crise sanitaire, réforme mal préparée, manque de ressources). Elle nécessite une analyse approfondie des causes.', color: C.orange },
    ],
    insight: 'Analysez les points de rupture dans la courbe : une baisse brutale suivie d\'une remontée rapide témoigne de la capacité de résilience du système. À l\'inverse, une baisse persistante sur plus de 2 ans consécutifs doit déclencher une révision des politiques éducatives nationales.',
  },
  carte: {
    title: 'Carte des Performances par Région', icon: '🗺️', color: C.green,
    description:
      'Cette carte géographique représente la distribution spatiale des performances académiques à travers les gouvernorats de Tunisie. Chaque point ou zone colorée correspond à un groupe d\'établissements dans une région donnée, coloré selon leur niveau moyen de réussite. Cet outil permet d\'identifier rapidement les disparités régionales et de cibler les interventions prioritaires du MESRS vers les zones les plus en difficulté.',
    legend: [
      { label: 'Vert — Performances excellentes (≥ 75 %)', desc: 'Régions où les établissements atteignent ou dépassent la cible nationale. Souvent corrélées à une forte densité d\'encadrement et à des équipements modernes.', color: C.green  },
      { label: 'Bleu — Bonnes performances (65–74 %)',      desc: 'Régions avec de bons résultats mais un potentiel d\'amélioration. Un soutien ciblé peut les faire passer dans la catégorie excellente.', color: C.blue   },
      { label: 'Orange — Performances à risque (< 65 %)',   desc: 'Régions nécessitant une attention prioritaire : recrutement d\'enseignants supplémentaires, rénovation des infrastructures ou programmes de soutien aux étudiants.', color: C.orange },
    ],
    insight: 'Les régions côtières (Grand Tunis, Sousse, Sfax) concentrent historiquement les meilleures performances en raison d\'une plus grande densité d\'établissements et de ressources. Réduire ce fossé avec les régions intérieures (Kasserine, Siliana, Tataouine) est un enjeu stratégique national d\'équité éducative.',
  },
  alertes: {
    title: 'Alertes Établissements', icon: '⚠️', color: C.orange,
    description:
      'Ce panneau liste en temps réel les établissements dont les indicateurs clés de performance sont passés en-dessous des seuils d\'acceptabilité définis par le MESRS. Les alertes sont générées automatiquement par le système SIAPET à partir des données remontées par les établissements. Chaque alerte décrit précisément le problème détecté, son niveau de gravité et l\'établissement concerné afin de permettre une réaction rapide des équipes de supervision.',
    legend: [
      { label: 'Critique 🚨 — Intervention immédiate', desc: 'Taux de réussite inférieur à 55 %, taux d\'absentéisme supérieur à 30 %, ou incident grave signalé. Le responsable régional doit être contacté sous 48h.', color: '#EF4444' },
      { label: 'Élevée ⚡ — Action rapide requise',    desc: 'Baisse de performance de plus de 10 points par rapport à l\'année précédente, ou dépassement de la capacité maximale d\'accueil. Un plan correctif doit être soumis sous 2 semaines.', color: C.orange  },
      { label: 'Modérée 📉 — Surveillance renforcée', desc: 'Tendance négative sur 2 trimestres consécutifs ou taux d\'occupation anormalement bas. Aucune action immédiate requise mais un suivi mensuel est recommandé.', color: C.yellow  },
    ],
    insight: 'Une alerte n\'indique pas nécessairement une défaillance de l\'établissement : des facteurs externes (travaux, grèves, événements exceptionnels) peuvent temporairement impacter les indicateurs. Croisez toujours l\'alerte avec l\'historique de l\'établissement et son contexte local avant de déclencher une procédure formelle.',
  },
  topEtab: {
    title: 'Classement des Établissements', icon: '🏆', color: C.yellow,
    description:
      'Ce tableau présente le classement des établissements d\'enseignement supérieur publics tunisiens selon leur taux de réussite moyen annuel. Le classement est calculé automatiquement à partir des données consolidées de la base SIAPET et mis à jour à chaque synchronisation. Il constitue un outil de référence pour identifier les établissements d\'excellence qui peuvent servir de modèles et partager leurs bonnes pratiques avec les autres institutions.',
    legend: [
      { label: '🥇 1er rang — Établissement de référence',  desc: 'L\'établissement le plus performant du réseau national. Son modèle pédagogique, ses méthodes d\'encadrement et son organisation peuvent être dupliqués dans d\'autres établissements.', color: C.yellow  },
      { label: '🥈 2ème rang — Excellence académique',       desc: 'Établissement avec des performances remarquables et constantes. Généralement caractérisé par une forte implication des enseignants et un bon taux d\'encadrement.', color: '#C0C0C0' },
      { label: '🥉 3ème rang — Très bon niveau',             desc: 'Établissement avec un très bon taux de réussite, légèrement en-dessous du podium. Souvent spécialisé dans des filières sélectives à fort taux de réussite intrinsèque.', color: '#CD7F32' },
      { label: 'Statut "Excellent"',                         desc: 'Badge attribué aux établissements dont le taux de réussite dépasse 75 % sur l\'ensemble de l\'année académique.', color: C.green   },
    ],
    insight: 'Attention aux biais de comparaison : un établissement spécialisé dans des filières sélectives (médecine, ingénierie) aura mécaniquement un taux de réussite plus élevé qu\'un établissement généraliste à accès ouvert. Pour une comparaison équitable, filtrez par type d\'établissement.',
  },
  table: {
    title: 'Répertoire des Établissements', icon: '🏫', color: C.purple,
    description:
      'Ce tableau interactif donne accès à l\'ensemble des établissements d\'enseignement supérieur publics enregistrés dans la base SIAPET. Pour ne pas surcharger l\'affichage, 10 établissements sont tirés aléatoirement à chaque chargement depuis la base complète. Vous pouvez utiliser les outils de filtrage et de recherche pour retrouver un établissement précis, ou cliquer sur "Actualiser" pour obtenir un nouveau tirage aléatoire.',
    legend: [
      { label: 'Bouton Actualiser 🔄',   desc: 'Tire aléatoirement 10 nouveaux établissements depuis la base complète. Utile pour explorer l\'ensemble du réseau sans se limiter aux 10 premiers affichés.', color: C.blue   },
      { label: 'Filtre par type 📂',     desc: 'Permet de restreindre l\'affichage à un type d\'établissement précis : Université, Faculté, École, Institut ou ISET. Le filtre s\'applique sur la totalité de la base.', color: C.purple },
      { label: 'Barre de recherche 🔍',  desc: 'Recherche en temps réel par nom ou code de l\'établissement. La recherche est insensible à la casse et s\'applique sur l\'ensemble de la base, pas seulement les 10 affichés.', color: C.navy   },
      { label: 'Barre de progression 📊', desc: 'Visualisation graphique du taux de réussite. Verte ≥ 75 % (excellent), bleue 65–74 % (bon), orange < 65 % (à risque). La valeur numérique est affichée à côté.', color: C.green  },
    ],
    insight: 'Pour une vue exhaustive d\'un type d\'établissement (ex : tous les ISET), sélectionnez le type dans le filtre puis cliquez sur Actualiser — l\'affichage se limitera automatiquement aux établissements correspondant à votre filtre sur l\'ensemble de la base.',
  },
};

// ══════════════════════════════════════════════════════════════════
//  INFO MODAL
// ══════════════════════════════════════════════════════════════════
function AdminInfoModal({ open, onClose, config }) {
  if (!config) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: '24px', border: '1.5px solid #EAF4FF', boxShadow: '0 24px 60px rgba(26,58,107,0.18)' } }}>
      <Box sx={{ px: 3, py: 2.5, background: `linear-gradient(135deg, ${config.color}12 0%, #EAF4FF 100%)`, borderBottom: `1.5px solid ${config.color}20`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: '14px', background: '#fff', border: `1.5px solid ${config.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: `0 4px 16px ${config.color}18` }}>
            {config.icon}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, color: C.navy, fontSize: '1.05rem', letterSpacing: '-0.3px' }}>{config.title}</Typography>
            <Typography sx={{ color: '#8A9BB0', fontSize: '0.74rem' }}>Analyse détaillée</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: C.navy, opacity: 0.5, borderRadius: '10px', '&:hover': { background: `${config.color}18`, opacity: 1, transform: 'rotate(90deg)' }, transition: 'all 0.2s' }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 2.5, p: 2.5, borderRadius: '14px', background: '#fff', border: '1px solid #EAF4FF' }}>
          <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.88rem', mb: 1.2 }}>📖 Comment lire cette carte ?</Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.7 }}>{config.description}</Typography>
        </Box>
        {config.legend && (
          <Box>
            <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.88rem', mb: 1.2 }}>🔑 Légende des indicateurs</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {config.legend.map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, borderRadius: '12px', background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
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
          <Box sx={{ mt: 2.5, p: 2.5, borderRadius: '14px', background: `linear-gradient(135deg, ${config.color}08, #EAF4FF)`, border: `1px solid ${config.color}20` }}>
            <Typography sx={{ fontSize: '0.84rem', color: C.navy, fontWeight: 600, lineHeight: 1.65 }}>
              💡 <strong>Insight :</strong> {config.insight}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <Box sx={{ px: 3, py: 2, borderTop: '1px solid #EAF4FF', display: 'flex', justifyContent: 'flex-end', background: '#fff' }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3, background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}CC 100%)`, boxShadow: `0 4px 16px ${config.color}30`, '&:hover': { boxShadow: `0 6px 20px ${config.color}45`, transform: 'translateY(-1px)' }, transition: 'all 0.2s' }}>
          Fermer
        </Button>
      </Box>
    </Dialog>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [infoModal, setInfoModal] = useState({ open: false, cardKey: null });
  const openInfo  = (key) => setInfoModal({ open: true, cardKey: key });
  const closeInfo = ()    => setInfoModal({ open: false, cardKey: null });

  // ── state ──
  const [dialogOpen,   setDialogOpen]   = useState(false);
  const [hovCard,      setHovCard]      = useState(null);
  const [hovRow,       setHovRow]       = useState(null);
  const [sending,      setSending]      = useState(false);
  const [exporting,    setExporting]    = useState(false);
  const [snackbar,     setSnackbar]     = useState({ open: false, message: '', severity: 'success' });
  const [detailsModal, setDetailsModal] = useState({ open: false, type: '', data: null, title: '', accentColor: C.blue });
  const [selectedEtab, setSelectedEtab] = useState(null);

  // ML prediction — nationale
  const [mlPred,        setMlPred]        = useState(null);
  const [mlLoading,     setMlLoading]     = useState(false);
  const [detailML,      setDetailML]      = useState(null); // 'reussite' | 'echec' | null
  const [mlProjection,  setMlProjection]  = useState([]);
  const [mlProjLoading, setMlProjLoading] = useState(false);
  const [mlProjMode,    setMlProjMode]    = useState('annee'); // 'annee' | 'projection'

  // ML M3 — Performance Future nationale
  const [mlPerfPred,    setMlPerfPred]    = useState(null);
  const [mlPerfLoading, setMlPerfLoading] = useState(true);

  const [regionsList,    setRegionsList]    = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);

  // table state
  const allEtabsRef = React.useRef([]);           // garde tous les établissements en mémoire
  const [etablissements,    setEtablissements]    = useState([]);
  const [tableLoading,      setTableLoading]      = useState(true);
  const [tableError,        setTableError]        = useState(null);
  const [search,            setSearch]            = useState('');
  const [typeFilter,        setTypeFilter]        = useState('');

  // stats state
  const [userStats, setUserStats] = useState({ RECTEUR: 0, DIRECTEUR: 0, ENSEIGNANT: 0, ETUDIANT: 0, total: 0 });
  const [etablissementStats, setEtablissementStats] = useState({
    total_universites: 0, effectif_total: 0, taux_reussite_moyen: 0, budget_total: 0,
    total_etudiants_inscrits: 0, taux_reussite_reel: 0,
    evolution_etablissements: 0, evolution_etudiants: 0, evolution_taux: 0, evolution_budget: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // ── fetchers ──
  const fetchUserStats = async () => {
    try {
      const res = await api.get('/users/stats');
      const stats = { RECTEUR: 0, DIRECTEUR: 0, ENSEIGNANT: 0, ETUDIANT: 0, total: res.data.total || 0 };
      if (res.data.byRole) res.data.byRole.forEach(r => { stats[r.type_utilisateur] = parseInt(r.count) || 0; });
      setUserStats(stats);
    } catch (e) { console.error(e); }
  };

  const fetchEtablissementStats = async () => {
    try {
      const res = await api.get('/etablissements/stats');
      if (res.data.success) {
        setEtablissementStats({
          total_universites:        parseInt(res.data.stats.total_universites)      || 0,
          effectif_total:           parseInt(res.data.stats.effectif_total)         || 0,
          taux_reussite_moyen:      parseFloat(res.data.stats.taux_reussite_moyen)  || 0,
          budget_total:             parseFloat(res.data.stats.budget_total)         || 0,
          total_etudiants_inscrits: parseInt(res.data.stats.total_etudiants_inscrits) || 0,
          taux_reussite_reel:       parseFloat(res.data.stats.taux_reussite_reel)   || 0,
          evolution_etablissements: parseFloat(res.data.stats.evolution_etablissements) || 0,
          evolution_etudiants:      parseFloat(res.data.stats.evolution_etudiants)  || 0,
          evolution_taux:           parseFloat(res.data.stats.evolution_taux)       || 0,
          evolution_budget:         parseFloat(res.data.stats.evolution_budget)     || 0,
        });
        setStatsLoading(false);
      }
    } catch (e) { console.error(e); setStatsLoading(false); }
  };

  // Re-mélange tous les établissements et les réaffiche dans un ordre différent
  const shuffleDisplay = useCallback(() => {
    const pool = allEtabsRef.current;
    if (!pool.length) return;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setEtablissements(shuffled.slice(0, 10));
    setSearch('');
    setTypeFilter('');
  }, []);

  const fetchEtablissements = useCallback(async () => {
    setTableLoading(true);
    setTableError(null);
    try {
      const res  = await api.get('/etablissements', { params: { archived: false, limit: 1000 } });
      const raw  = res.data?.etablissements || res.data || [];
      const data = Array.isArray(raw) ? raw : [];

      // Normalise les noms de champs
      const normalised = data.map(e => {
        // Couvre tous les noms possibles que le backend peut renvoyer
        const rawTaux = parseFloat(
          e.taux_reussite     ??  // champ exact BDD  ex: 86.28
          e.tauxReussite      ??  // camelCase éventuel
          e.taux_de_reussite  ??  // variante
          e.taux              ??  // alias générique
          0
        );
        const tauxFinal = isNaN(rawTaux) ? 0 : rawTaux;

        return {
          ...e,
          id:            e.id_etablissement   || e.id,
          code:          e.code_etablissement || e.code,
          nom:           e.nom_etablissement  || e.nom,
          type:          e.type_etablissement || e.type  || e.type_etablissement,
          effectif:      parseInt(e.effectif_total || e.effectif || 0),
          // taux est la SEULE source dans le rendu — on écrase tout
          taux:          tauxFinal,
          taux_reussite: tauxFinal,
          taux_echec:    parseFloat(e.taux_echec   || 0),
          performance:   parseFloat(e.performance  || 0),
          taux_occupation: parseFloat(e.taux_occupation || 0),
          statut:        statutFromTaux(tauxFinal),
        };
      }).filter(e => !e.archive && !e.archived);

      // Garde tout en mémoire, affiche 10 en ordre aléatoire
      allEtabsRef.current = normalised;
      const shuffled = [...normalised].sort(() => Math.random() - 0.5);
      setEtablissements(shuffled.slice(0, 10));
    } catch (e) {
      console.error(e);
      setTableError('Impossible de charger les établissements.');
      // Fallback statique (données réelles de la BDD)
      const fallback = [
        { id: 48, code: 'ENIB',    nom: 'École Nationale d\'Ingénieurs de Bizerte',      type: 'ECOLE',    effectif: 2500,  taux: 92.98, statut: 'excellent' },
        { id: 19, code: 'ENIT',    nom: 'École Nationale d\'Ingénieurs de Tunis',         type: 'ECOLE',    effectif: 4500,  taux: 90.16, statut: 'excellent' },
        { id: 16, code: 'FSEGT',   nom: 'Faculté des Sciences Économiques de Gestion',    type: 'FACULTE',  effectif: 6500,  taux: 94.35, statut: 'excellent' },
        { id: 29, code: 'FSB',     nom: 'Faculté des Sciences de Bizerte',                type: 'FACULTE',  effectif: 5000,  taux: 91.15, statut: 'excellent' },
        { id: 58, code: 'ISET-RAD', nom: 'ISET de Radès',                                type: 'ISET',     effectif: 3500,  taux: 80.56, statut: 'excellent' },
        { id:  2, code: 'ESSECT',  nom: 'École Supérieure des Sciences Économiques',      type: 'ECOLE',    effectif: 4500,  taux: 94.26, statut: 'excellent' },
        { id: 28, code: 'FSJPST',  nom: 'Faculté des Sciences Juridiques et Sociales',    type: 'FACULTE',  effectif: 6000,  taux: 65.48, statut: 'bon'       },
        { id: 17, code: 'FST',     nom: 'Faculté des Sciences de Tunis',                  type: 'FACULTE',  effectif: 8000,  taux: 71.58, statut: 'bon'       },
        { id: 30, code: 'FSEGN',   nom: 'Faculté des Sciences Économiques de Nabeul',     type: 'FACULTE',  effectif: 4500,  taux: 94.67, statut: 'excellent' },
        { id: 34, code: 'ESSAIT',  nom: 'École Sup. des Statistiques et Analyse Info.',   type: 'ECOLE',    effectif: 1200,  taux: 92.24, statut: 'excellent' },
      ];
      allEtabsRef.current = fallback;
      setEtablissements(fallback);
    } finally { setTableLoading(false); }
  }, []);

  useEffect(() => {
    fetchUserStats();
    fetchEtablissementStats();
    fetchEtablissements();
  }, [fetchEtablissements]);

  // Charge la liste des régions/rectorats depuis l'API
  useEffect(() => {
    api.get('/admin/dashboard/regions')
      .then(r => {
        const list = r.data?.data || r.data || [];
        setRegionsList(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, []);

  // Prévision ML M1 — se déclenche quand les stats établissements arrivent
  useEffect(() => {
    if (!etablissementStats.effectif_total && !etablissementStats.taux_reussite_moyen) return;
    setMlLoading(true);
    const nbEns = userStats.ENSEIGNANT || 1;
    const ratio = Math.max(1, Math.round((etablissementStats.effectif_total / nbEns) * 10) / 10);
    const budgetParEtud = etablissementStats.effectif_total > 0
      ? Math.round(etablissementStats.budget_total / etablissementStats.effectif_total)
      : 5000;
    mlService.predireReussite({
      taux_reussite_an1:  76.8,
      taux_reussite_an2:  78.5,
      taux_absence_moyen: 15.0,
      ratio_etud_ens:     ratio,
      budget_par_etud:    Math.max(0, budgetParEtud),
      nb_labos:           5,
      taux_rotation_ens:  8.0,
      region:             'Grand Tunis',
      type_etablissement: 'Université',
    })
      .then(r => setMlPred(r.data))
      .catch(() => {})
      .finally(() => setMlLoading(false));
  }, [etablissementStats.effectif_total, etablissementStats.taux_reussite_moyen, userStats.ENSEIGNANT]);

  // Projection multi-annuelle M1 jusqu'à 2030
  const projeterNationale = async () => {
    setMlProjLoading(true);
    setMlProjection([]);
    const nbEns = userStats.ENSEIGNANT || 1;
    const ratio = Math.max(1, Math.round((etablissementStats.effectif_total / nbEns) * 10) / 10);
    const budgetParEtud = etablissementStats.effectif_total > 0
      ? Math.round(etablissementStats.budget_total / etablissementStats.effectif_total) : 5000;
    const results = [];
    let an1 = 76.8; // taux 2024
    let an2 = 78.5; // taux 2025
    try {
      for (let year = 2026; year <= 2030; year++) {
        const { data } = await mlService.predireReussite({
          taux_reussite_an1:  an1,
          taux_reussite_an2:  an2,
          taux_absence_moyen: 15.0,
          ratio_etud_ens:     ratio,
          budget_par_etud:    Math.max(0, budgetParEtud),
          nb_labos:           5,
          taux_rotation_ens:  8.0,
          region:             'Grand Tunis',
          type_etablissement: 'Université',
        });
        results.push({ year: `${year}`, taux: data.taux_reussite_predit, couleur: data.couleur, predicted: true });
        an2 = an1;
        an1 = data.taux_reussite_predit;
      }
      setMlProjection(results);
    } catch (e) {
      console.error('Projection nationale error:', e);
    } finally {
      setMlProjLoading(false);
    }
  };

  // Prévision ML M3 — Performance Future nationale
  useEffect(() => {
    setMlPerfLoading(true);
    const taux  = etablissementStats.taux_reussite_moyen || 75;
    const moy   = Math.round(Math.min(16, Math.max(5, 5 + (taux / 100) * 10)) * 10) / 10;
    const nSous = Math.max(0, Math.round((1 - taux / 100) * 6));
    const pente = (etablissementStats.evolution_taux || 0) >= 0 ? 0.5 : -0.3;
    mlService.predirePerformance({
      moy_semestre_prec:    moy,
      note_cc1:             Math.round(Math.min(20, moy + 0.3) * 10) / 10,
      note_cc2:             moy,
      note_cc3:             Math.round(Math.min(20, moy + pente * 0.5) * 10) / 10,
      taux_absence_actuel:  15.0,
      pente_evolution:      pente,
      nb_matieres_sous_10:  nSous,
      ratio_notes_obtenues: Math.min(1, Math.max(0, taux / 100)),
      niveau:               'L3',
      filiere:              'Ingénierie',
    })
      .then(r => setMlPerfPred(r.data))
      .catch(() => {})
      .finally(() => setMlPerfLoading(false));
  }, [etablissementStats.taux_reussite_moyen, etablissementStats.evolution_taux]);

  // ── derived table data ──
  const filteredEtabs = etablissements.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.nom?.toLowerCase().includes(q) || r.code?.toLowerCase().includes(q);
    const matchType   = !typeFilter || r.type === typeFilter;
    return matchSearch && matchType;
  });
  const tableTypes = [...new Set(allEtabsRef.current.map(r => r.type).filter(Boolean))].sort();

  // ── handlers ──
  const handleExport = async () => {
    setExporting(true);
    try {
      exportToCSV(filteredEtabs);
      setSnackbar({ open: true, message: `✅ Export réussi — ${filteredEtabs.length} établissements exportés`, severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: "❌ Erreur lors de l'export", severity: 'error' });
    } finally { setTimeout(() => setExporting(false), 800); }
  };

  const handleSendInvitations = async () => {
    setSending(true);
    try {
      const token    = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/invitations/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setSnackbar({
        open: true,
        message: data.success ? `✅ ${data.message} (${data.sent}/${data.total})` : `❌ ${data.message}`,
        severity: data.success ? 'success' : 'error',
      });
    } catch {
      setSnackbar({ open: true, message: "❌ Erreur lors de l'envoi des invitations", severity: 'error' });
    } finally { setSending(false); }
  };

  const openModal  = (type, data, title, accentColor) => setDetailsModal({ open: true, type, data, title, accentColor });
  const closeModal = () => setDetailsModal({ open: false, type: '', data: null, title: '', accentColor: C.blue });

  // ── static data ──
  const performanceData = [
    { year: '2021', taux: 72   },
    { year: '2022', taux: 74.5 },
    { year: '2023', taux: 76   },
    { year: '2024', taux: 76.8 },
    { year: '2025', taux: 78.5 },
  ];

  const alertesData = [
    { etablissement: 'Université de Sfax - Filière Informatique', message: 'Taux de réussite: 52%', detail: '(-12% vs moyenne)', color: '#EF4444', icon: '⚠️', bgColor: '#FEF2F2' },
    { etablissement: 'ISET de Sousse - DUT Génie Civil',          message: "Taux d'absentéisme: 31%", detail: '',              color: C.orange,  icon: '⚡', bgColor: '#FFF7ED' },
    { etablissement: 'Faculté de Droit de Tunis - L1',            message: 'Baisse de performance:',  detail: '-7%',           color: C.yellow,  icon: '📉', bgColor: '#FEFCE8' },
  ];

  const topEtabData = [
    { nom: 'Univ. Tunis El Manar', taux: 82, statut: 'excellent', etudiants: 38500, enseignants: 2100, region: 'Grand Tunis' },
    { nom: 'Univ. de Carthage',    taux: 79, statut: 'bon',       etudiants: 32100, enseignants: 1850, region: 'Grand Tunis' },
    { nom: 'Univ. de Sfax',        taux: 77, statut: 'bon',       etudiants: 28900, enseignants: 1620, region: 'Sud'        },
    { nom: 'Univ. de la Manouba',  taux: 74, statut: 'bon',       etudiants: 24600, enseignants: 1390, region: 'Grand Tunis' },
  ];

  const userTypes = [
    { role: 'RECTEUR',    label: 'Recteurs',    emoji: '👨‍💼', color: C.orange, count: userStats.RECTEUR.toString(),    desc: "Supervisent les universités et pilotent la stratégie académique nationale.",  badge: `${userStats.RECTEUR} actifs`,      stat: '98% connexion', statIcon: '📶' },
    { role: 'DIRECTEUR',  label: 'Directeurs',  emoji: '👨‍💼', color: C.purple, count: userStats.DIRECTEUR.toString(),  desc: "Gèrent les établissements et coordonnent les équipes pédagogiques.",         badge: `${userStats.DIRECTEUR} actifs`,    stat: '94% connexion', statIcon: '📶' },
    { role: 'ENSEIGNANT', label: 'Enseignants', emoji: '👨‍🏫', color: C.blue,   count: userStats.ENSEIGNANT.toString(), desc: "Dispensent les cours et suivent les performances de leurs étudiants.",      badge: `${userStats.ENSEIGNANT} inscrits`, stat: '89% actifs',    statIcon: '✅' },
    { role: 'ETUDIANT',   label: 'Étudiants',   emoji: '👨‍🎓', color: C.green,  count: userStats.ETUDIANT.toString(),   desc: "Suivent leurs cursus et progressent grâce aux outils d'analyse IA.",       badge: `${userStats.ETUDIANT} inscrits`,   stat: 'Taux 76.8%',    statIcon: '📊' },
  ];

  const statutColor = (s) => ({
    excellent: { label: 'Excellent', bg: `${C.green}15`,  color: C.green  },
    bon:       { label: 'Bon',       bg: `${C.blue}15`,   color: C.blue   },
    risque:    { label: 'À risque',  bg: `${C.orange}15`, color: C.orange },
  }[s] || { label: s, bg: C.blueL, color: C.navy });

  const linkSx = (color) => ({
    color, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
    transition: 'opacity 0.2s', userSelect: 'none',
    '&:hover': { opacity: 0.7 },
  });

  const tableCols = '110px 1fr 120px 100px 160px 130px 110px';

  // ══════════════════════════════════════════════════════════════
  return (
    <Box>
      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: '#fff', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: '16px', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
            🛡️
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B' }}>Vue d'ensemble nationale</Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>Ministère de l'Enseignement Supérieur — Tunisie 🇹🇳</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, mr: -1 }}>
          <Tooltip title="Gestion utilisateurs">
            <IconButton onClick={() => setDialogOpen(true)}
              sx={{ width: 44, height: 44, borderRadius: '14px', background: '#8B5CF6', color: '#fff',
                transition: 'all 0.3s ease', boxShadow: '0 3px 10px rgba(139,92,246,0.4)',
                '&:hover': { background: '#7C3AED', transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(139,92,246,0.5)' } }}>
              <People sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Établissements">
            <IconButton onClick={() => navigate('/dashboard/admin/etablissements')}
              sx={{ width: 44, height: 44, borderRadius: '14px', background: '#3B82F6', color: '#fff',
                transition: 'all 0.3s ease', boxShadow: '0 3px 10px rgba(59,130,246,0.4)',
                '&:hover': { background: '#2563EB', transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(59,130,246,0.5)' } }}>
              <AccountBalance sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Envoyer Invitations">
            <span>
              <IconButton onClick={handleSendInvitations} disabled={sending}
                sx={{ width: 44, height: 44, borderRadius: '14px', background: '#10B981', color: '#fff',
                  transition: 'all 0.3s ease', boxShadow: '0 3px 10px rgba(16,185,129,0.4)',
                  '&:hover': { background: '#059669', transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(16,185,129,0.5)' },
                  '&:disabled': { opacity: 0.6, boxShadow: 'none' } }}>
                {sending ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <Send sx={{ fontSize: 20 }} />}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Demandes d'accès">
            <IconButton onClick={() => navigate('/dashboard/admin/demandes-acces')}
              sx={{ width: 44, height: 44, borderRadius: '14px', background: '#F59E0B', color: '#fff',
                transition: 'all 0.3s ease', boxShadow: '0 3px 10px rgba(245,158,11,0.4)',
                '&:hover': { background: '#D97706', transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(245,158,11,0.5)' } }}>
              <PendingActions sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>



      {/* ══ STAT CARDS ══════════════════════════════════════════ */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          {
            icon: '📊', label: 'Taux de réussite national',
            value: statsLoading ? '…' : (etablissementStats.taux_reussite_reel > 0
              ? `${etablissementStats.taux_reussite_reel.toFixed(1)}%`
              : (etablissementStats.taux_reussite_moyen > 0 ? `${etablissementStats.taux_reussite_moyen.toFixed(1)}%` : '—')),
            color: C.orange, bg: `linear-gradient(135deg, ${C.orange}08, #FFF1EE)`,
          },
          {
            icon: '🏫', label: 'Universités publiques',
            value: statsLoading ? '…' : etablissementStats.total_universites.toString(),
            color: C.green, bg: `linear-gradient(135deg, ${C.green}08, #E6FBF5)`,
          },
          {
            icon: '👥', label: 'Étudiants inscrits',
            value: statsLoading ? '…' : (() => {
              const n = etablissementStats.total_etudiants_inscrits || etablissementStats.effectif_total;
              return n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toString();
            })(),
            color: C.purple, bg: `linear-gradient(135deg, ${C.purple}08, #F3EEFF)`,
          },
          {
            icon: '💰', label: 'Budget MESRS',
            value: statsLoading ? '…' : (etablissementStats.budget_total > 0
              ? `${(etablissementStats.budget_total / 1e9).toFixed(1)} Mds`
              : '—'),
            color: '#F59E0B', bg: 'linear-gradient(135deg, #F59E0B08, #FFF7ED)',
          },
        ].map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.label}>
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

      {/* ══ PRÉVISIONS ML ════════════════════════════════════════ */}
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
                Prévisions IA · Année Académique 2025-2026
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0' }}>
                Modèle M1 · Basé sur les taux de réussite 2021-2025 et les données institutionnelles nationales
              </Typography>
            </Box>
            <Chip label="IA ACTIVE" size="small" sx={{
              ml: 'auto', flexShrink: 0,
              background: `linear-gradient(135deg, #1A3A6B, #4D9FFF)`,
              color: '#fff', fontWeight: 800, fontSize: '0.7rem',
              borderRadius: '8px', border: 'none',
            }} />
          </Box>

          {/* Body */}
          {mlLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6, gap: 2 }}>
              <CircularProgress size={28} sx={{ color: C.blue }} />
              <Typography sx={{ color: '#8A9BB0', fontSize: '0.85rem' }}>Calcul des previsions en cours...</Typography>
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
                        Taux de reussite predit 2025-2026
                      </Typography>
                      <Tooltip title="Voir comment cette prediction est calculee">
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
                      {mlPred.taux_reussite_predit >= 78.5 ? '▲ +' : '▼ '}
                      {Math.abs(Math.round((mlPred.taux_reussite_predit - 78.5) * 10) / 10)} pts
                      {' '}vs annee 2024-2025 (78.5%)
                    </Typography>
                  </Box>

                  {/* Taux échec */}
                  <Box sx={{ p: 2.5, borderRadius: '16px', background: '#FEF2F2', border: '1.5px solid #FECACA' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Taux d&apos;echec predit 2025-2026
                      </Typography>
                      <Tooltip title="Voir comment cette prediction est calculee">
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
                      Estimation : ~{Math.round((100 - mlPred.taux_reussite_predit) * (userStats.ETUDIANT || 0) / 100).toLocaleString('fr-TN')} etudiants concernes
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Graphique historique + prévision */}
              <Grid item xs={12} md={7}>
                <Box sx={{ p: 3 }}>
                  {/* Sélecteur de mode */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {mlProjMode === 'annee' ? 'Evolution historique + prevision 2026' : 'Projection 2026 → 2030'}
                    </Typography>
                    <ToggleButtonGroup
                      value={mlProjMode}
                      exclusive
                      onChange={(_, v) => { if (v) { setMlProjMode(v); if (v === 'projection' && !mlProjection.length) projeterNationale(); } }}
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
                          ? [...performanceData, { year: '2026 (prévu)', taux: mlPred.taux_reussite_predit, predicted: true }]
                          : [...performanceData, ...mlProjection]
                        }
                        barSize={mlProjMode === 'projection' ? 22 : 30}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis dataKey="year" tick={{ fill: '#8A9BB0', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[60, 100]} tick={{ fill: '#8A9BB0', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                        <RechartsTooltip
                          contentStyle={{ background: '#fff', border: `1.5px solid ${C.blueL}`, borderRadius: 12, color: C.navy, fontSize: 13, boxShadow: `0 4px 20px ${C.blue}18` }}
                          formatter={v => [`${typeof v === 'number' ? v.toFixed(1) : v}%`, 'Taux de reussite']}
                        />
                        <Bar dataKey="taux" radius={[6, 6, 0, 0]}>
                          {(mlProjMode === 'annee'
                            ? [...performanceData, { year: '2026', taux: mlPred.taux_reussite_predit, predicted: true, couleur: mlPred.couleur }]
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

                  {/* Légende */}
                  <Box sx={{ display: 'flex', gap: 3, mt: 1.5, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '3px', background: C.blue, opacity: 0.55 }} />
                      <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0' }}>Donnees reelles 2021-2025</Typography>
                    </Box>
                    {mlProjMode === 'annee' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '3px', background: mlPred.couleur }} />
                        <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0' }}>Prevision IA 2026</Typography>
                      </Box>
                    ) : mlProjection.length > 0 && (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '3px', background: mlProjection[0]?.couleur || C.blue }} />
                          <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0' }}>Projection IA 2026–2030</Typography>
                        </Box>
                        {/* Résumé tendance */}
                        {(() => {
                          const first = mlProjection[0]?.taux;
                          const last  = mlProjection[mlProjection.length - 1]?.taux;
                          const diff  = last && first ? Math.round((last - first) * 10) / 10 : null;
                          if (diff === null) return null;
                          const isHausse = diff >= 0;
                          return (
                            <Box sx={{ mt: 0.5, px: 1.5, py: 0.8, borderRadius: '8px', background: isHausse ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isHausse ? '#86efac' : '#fca5a5'}`, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: isHausse ? '#15803d' : '#dc2626' }}>
                                {isHausse ? '📈 +' : '📉 '}{diff}% tendance 2026→2030
                              </Typography>
                            </Box>
                          );
                        })()}
                      </>
                    )}
                  </Box>

                  {/* Note méthodologique */}
                  <Box sx={{ mt: 2.5, p: 2, borderRadius: '12px', background: C.blueL, border: `1px solid ${C.blue}20` }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: C.navy, mb: 0.5 }}>Comment est calculee cette prevision ?</Typography>
                    <Typography sx={{ fontSize: '0.71rem', color: '#64748B', lineHeight: 1.7 }}>
                      Le modele M1 analyse les taux de reussite des 2 dernieres annees, le taux d&apos;absence moyen, le ratio etudiants/enseignants et le budget alloue par etudiant.
                      {mlProjMode === 'projection' && ' En mode projection, chaque annee predite devient la base de la suivante (enchainement iteratif jusqu\'en 2030).'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <Typography sx={{ color: '#8A9BB0', fontSize: '0.82rem' }}>
                Previsions non disponibles — verifiez que le serveur ML est demarre (port 5001)
              </Typography>
            </Box>
          )}
        </Card>
      </Box>

      {/* ══ GRAPH + MAP ═════════════════════════════════════════ */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={6}>
          <Card sx={{ ...featureCardSx(0.1, C.blue), height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '1rem', mb: 0.2 }}>
                    📈 Évolution du taux de réussite national
                  </Typography>
                  <Typography sx={{ color: '#8A9BB0', fontSize: '0.78rem' }}>Sur les 5 dernières années</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton size="small" onClick={() => openInfo('evolution')}
                    sx={{ width: 32, height: 32, borderRadius: '10px', background: `${C.blue}12`, border: `1.5px solid ${C.blue}25`, color: C.blue,
                      '&:hover': { background: C.blue, color: '#fff', transform: 'scale(1.1)' }, transition: 'all 0.2s' }}>
                    <InfoOutlined sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Box>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={C.blue} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={C.blue} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.blueL} />
                  <XAxis dataKey="year" stroke="#C8D8E8" tick={{ fontSize: 12, fill: '#8A9BB0' }} />
                  <YAxis stroke="#C8D8E8" domain={[70, 80]} tick={{ fontSize: 12, fill: '#8A9BB0' }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="taux" stroke={C.blue} strokeWidth={2.5} fill="url(#areaGrad)"
                    dot={{ fill: '#fff', stroke: C.blue, strokeWidth: 2.5, r: 5 }}
                    activeDot={{ r: 7, fill: C.blue, stroke: '#fff', strokeWidth: 2.5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card sx={{ ...featureCardSx(0.12, C.green), height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '1rem', mb: 0.2 }}>
                    🗺️ Carte géographique des performances
                  </Typography>
                  <Typography sx={{ color: '#8A9BB0', fontSize: '0.78rem' }}>Répartition par région</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <IconButton size="small" onClick={() => openInfo('carte')}
                    sx={{ width: 32, height: 32, borderRadius: '10px', background: `${C.green}12`, border: `1.5px solid ${C.green}25`, color: C.green,
                      '&:hover': { background: C.green, color: '#fff', transform: 'scale(1.1)' }, transition: 'all 0.2s' }}>
                    <InfoOutlined sx={{ fontSize: 16 }} />
                  </IconButton>
                 
                </Box>
              </Box>
              <TunisiaMap />
              {regionsList.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                    Cliquer sur un rectorat pour voir ses prévisions IA
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                    {regionsList.map(r => (
                      <Chip key={r.id_region}
                        label={r.nom_region}
                        onClick={() => setSelectedRegion(r)}
                        size="small"
                        sx={{
                          cursor: 'pointer', fontWeight: 600, fontSize: '0.72rem',
                          background: C.blueL, color: C.navy, border: `1px solid ${C.blue}25`,
                          '&:hover': { background: `${C.blue}18`, borderColor: C.blue, color: C.blue },
                          transition: 'all 0.2s',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* ── M3 Performance Future ──────────────────────────── */}
              <Box sx={{ mt: 2.5, pt: 2.5, borderTop: `1px dashed ${C.blue}25` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(135deg, #7B2CBF, #4D9FFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🎯</Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.85rem' }}>Performance Future — M3</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0' }}>Moyenne finale prédite · niveau national · 2025-2026</Typography>
                  </Box>
                  <Chip label="M3 · IA" size="small" sx={{ ml: 'auto', background: 'linear-gradient(135deg, #7B2CBF, #4D9FFF)', color: '#fff', fontWeight: 800, fontSize: '0.62rem', borderRadius: '8px', border: 'none' }} />
                </Box>
                {mlPerfLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                    <CircularProgress size={18} sx={{ color: C.purple }} />
                    <Typography sx={{ color: '#8A9BB0', fontSize: '0.8rem' }}>Calcul en cours...</Typography>
                  </Box>
                ) : mlPerfPred ? (
                  <Grid container spacing={1.5}>
                    <Grid item xs={5}>
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
                    <Grid item xs={7}>
                      <Box sx={{ p: 2, borderRadius: '14px', background: '#FAFBFF', border: '1px solid #E8EEF8', height: '100%' }}>
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: C.navy, mb: 1 }}>Grille de mentions</Typography>
                        {[
                          { label: 'Très bien',   seuil: '≥ 16', color: '#22c55e' },
                          { label: 'Bien',         seuil: '≥ 14', color: '#06D6A0' },
                          { label: 'Assez bien',   seuil: '≥ 12', color: '#4D9FFF' },
                          { label: 'Passable',     seuil: '≥ 10', color: '#F59E0B' },
                          { label: 'Insuffisant',  seuil: '< 10', color: '#EF4444' },
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
                    <Typography sx={{ color: '#8A9BB0', fontSize: '0.78rem' }}>Service IA M3 non disponible — vérifiez que le serveur ML est démarré</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* ══ ALERTES ═════════════════════════════════════════ */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ ...featureCardSx(0.15, C.orange), height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontSize: '1.3rem' }}>⚠️</Typography>
                    <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '1.1rem' }}>Alertes établissements</Typography>
                  </Box>
                  <Typography sx={{ color: '#A0B0C0', fontSize: '0.8rem', fontWeight: 500 }}>Nécessitent une attention immédiate</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <IconButton size="small" onClick={() => openInfo('alertes')}
                    sx={{ width: 32, height: 32, borderRadius: '10px', background: `${C.orange}12`, border: `1.5px solid ${C.orange}25`, color: C.orange,
                      '&:hover': { background: C.orange, color: '#fff', transform: 'scale(1.1)' }, transition: 'all 0.2s' }}>
                    <InfoOutlined sx={{ fontSize: 16 }} />
                  </IconButton>
                  <Chip label="5 alertes" size="small" sx={{ background: `${C.orange}15`, color: C.orange, fontWeight: 700, fontSize: '0.72rem', border: `1px solid ${C.orange}28`, borderRadius: '10px' }} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {alertesData.map((a, i) => (
                  <Box key={i} sx={{ position: 'relative', background: a.bgColor, borderRadius: '16px', p: 2.5, pl: 3, animation: `${slideLeft} 0.45s ease-out ${0.2 + i * 0.1}s both`, transition: 'all 0.25s ease', cursor: 'pointer', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: a.color, borderRadius: '16px 0 0 16px' }, '&:hover': { transform: 'translateX(5px)', boxShadow: `0 4px 18px ${a.color}22` } }}
                    onClick={() => openModal('alertes', alertesData, 'Alertes Établissements', C.orange)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box sx={{ width: 48, height: 48, borderRadius: '12px', background: `${a.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>{a.icon}</Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, color: C.navy, fontSize: '0.95rem', mb: 0.5, lineHeight: 1.3 }}>{a.etablissement}</Typography>
                        <Typography sx={{ color: '#8A9BB0', fontSize: '0.85rem', lineHeight: 1.5 }}>
                          {a.message}{' '}{a.detail && <Box component="span" sx={{ color: '#6B7280', fontWeight: 600 }}>{a.detail}</Box>}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ══ TOP ÉTABLISSEMENTS ══════════════════════════════ */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ ...featureCardSx(0.2, C.green), height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontSize: '1.3rem' }}>🏆</Typography>
                    <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '1.1rem' }}>Top établissements</Typography>
                  </Box>
                  <Typography sx={{ color: '#A0B0C0', fontSize: '0.8rem', fontWeight: 500 }}>Meilleurs taux de réussite</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton size="small" onClick={() => openInfo('topEtab')}
                    sx={{ width: 32, height: 32, borderRadius: '10px', background: `${C.yellow}12`, border: `1.5px solid ${C.yellow}25`, color: C.yellow,
                      '&:hover': { background: C.yellow, color: '#fff', transform: 'scale(1.1)' }, transition: 'all 0.2s' }}>
                    <InfoOutlined sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 140px', gap: 2, pb: 1.5, mb: 1.5, borderBottom: `1px solid ${C.blueL}` }}>
                {['#', 'Établissement', 'Taux', 'Statut'].map(h => (
                  <Typography key={h} sx={{ color: '#A0B0C0', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1.2px' }}>{h}</Typography>
                ))}
              </Box>
              {topEtabData.map((row, i) => {
                const s = statutColor(row.statut);
                return (
                  <Box key={row.nom} sx={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 140px', gap: 2, alignItems: 'center', py: 2, borderBottom: i < 3 ? `1px solid ${C.blueL}` : 'none', animation: `${fadeUp} 0.4s ease-out ${0.25 + i * 0.07}s both`, transition: 'background 0.2s', borderRadius: '8px', cursor: 'pointer', '&:hover': { background: C.blueL } }}
                    onClick={() => openModal('top', topEtabData, 'Classement des Établissements', C.yellow)}
                  >
                    <Box sx={{ width: 40, height: 40, borderRadius: '12px', background: i === 0 ? `${C.yellow}20` : C.blueL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: i === 0 ? C.yellow : '#A0B0C0' }}>{i + 1}</Box>
                    <Typography sx={{ fontWeight: 600, color: C.navy, fontSize: '0.9rem' }}>{row.nom}</Typography>
                    <Typography sx={{ fontWeight: 900, color: C.navy, fontSize: '1rem' }}>{row.taux}%</Typography>
                    <Chip label={s.label} size="small" sx={{ background: s.bg, color: s.color, fontWeight: 700, fontSize: '0.75rem', border: `1px solid ${s.color}28`, borderRadius: '10px' }} />
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>

        {/* ══ TABLE DYNAMIQUE ═════════════════════════════════ */}
        <Grid item xs={12}>
          <Card sx={featureCardSx(0.25, C.purple)}>
            <CardContent sx={{ p: 3 }}>

              {/* Top bar */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '1.3rem' }}>🏫</Typography>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '1.1rem' }}>Tous les établissements</Typography>
                      <IconButton size="small" onClick={() => openInfo('table')}
                        sx={{ width: 32, height: 32, borderRadius: '10px', background: `${C.purple}12`, border: `1.5px solid ${C.purple}25`, color: C.purple,
                          '&:hover': { background: C.purple, color: '#fff', transform: 'scale(1.1)' }, transition: 'all 0.2s' }}>
                        <InfoOutlined sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                    <Typography sx={{ color: '#8A9BB0', fontSize: '0.75rem' }}>
                      {tableLoading
                        ? 'Chargement...'
                        : `${filteredEtabs.length} établissements${allEtabsRef.current.length ? ` sur ${allEtabsRef.current.length}` : ''} — ordre aléatoire`}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Search */}
                  <TextField
                    size="small"
                    placeholder="Rechercher..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 17, color: '#8A9BB0' }} /></InputAdornment>,
                    }}
                    sx={{
                      width: 200,
                      '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.82rem', background: '#FAFBFC' },
                    }}
                  />

                  {/* Type filter */}
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select
                      displayEmpty
                      value={typeFilter}
                      onChange={e => setTypeFilter(e.target.value)}
                      startAdornment={<FilterList sx={{ fontSize: 16, color: '#8A9BB0', mr: 0.5 }} />}
                      sx={{ borderRadius: '10px', fontSize: '0.82rem', background: '#FAFBFC' }}
                    >
                      <MenuItem value=""><em>Tous les types</em></MenuItem>
                      {tableTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                  </FormControl>

                  {/* Refresh */}
                  <Tooltip title="Mélanger l'ordre d'affichage">
                    <span>
                      <IconButton
                        onClick={shuffleDisplay}
                        disabled={tableLoading || allEtabsRef.current.length === 0}
                        sx={{ width: 44, height: 44, borderRadius: '14px', background: C.blue, color: '#fff', transition: 'all 0.2s',
                          '&:hover': { background: '#357ABD', transform: 'translateY(-2px)', boxShadow: `0 6px 20px ${C.blue}50` },
                          '&:disabled': { opacity: 0.45 } }}
                      >
                        <Refresh sx={{ fontSize: 20, animation: tableLoading ? `${spin} 1s linear infinite` : 'none' }} />
                      </IconButton>
                    </span>
                  </Tooltip>

                  {/* Export */}
                  <Tooltip title={filteredEtabs.length === 0 ? 'Aucune donnée à exporter' : 'Télécharger en CSV'}>
                    <span>
                      <IconButton
                        onClick={handleExport}
                        disabled={exporting || filteredEtabs.length === 0}
                        sx={{ width: 44, height: 44, borderRadius: '14px', background: C.green, color: '#fff', transition: 'all 0.2s',
                          '&:hover': { background: '#059669', transform: 'translateY(-2px)', boxShadow: `0 6px 20px ${C.green}50` },
                          '&:disabled': { opacity: 0.45 } }}
                      >
                        {exporting ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <FileDownload sx={{ fontSize: 20 }} />}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>

              {/* Table */}
              <Box sx={{ background: '#FAFBFC', borderRadius: '16px', border: `1px solid ${C.blueL}`, overflow: 'hidden' }}>

                {/* Header row */}
                <Box sx={{ display: 'grid', gridTemplateColumns: tableCols, gap: 2, px: 3, py: 2, background: C.blueL, borderBottom: `1px solid ${C.blue}20` }}>
                  {['Code', 'Nom', 'Type', 'Effectif', 'Taux réussite', 'Statut', 'Actions'].map(h => (
                    <Typography key={h} sx={{ color: '#8A9BB0', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1.2px' }}>{h}</Typography>
                  ))}
                </Box>

                {/* Loading skeleton */}
                {tableLoading && (
                  <Box>
                    <LinearProgress sx={{ height: 2, background: C.blueL, '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, ${C.blue}, ${C.blueB})` } }} />
                    {[...Array(4)].map((_, i) => (
                      <Box key={i} sx={{ display: 'grid', gridTemplateColumns: tableCols, gap: 2, px: 3, py: 3, borderBottom: `1px solid ${C.blueL}` }}>
                        {[...Array(7)].map((_, j) => (
                          <Box key={j} sx={{ height: 16, borderRadius: 8, background: C.blueL, width: j === 1 ? '80%' : '65%', opacity: 0.6 + i * 0.1 }} />
                        ))}
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Error */}
                {!tableLoading && tableError && (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>⚠️</Typography>
                    <Typography sx={{ color: C.orange, fontWeight: 700, fontSize: '0.9rem', mb: 1 }}>{tableError}</Typography>
                    <Button size="small" onClick={fetchEtablissements} sx={{ color: C.blue, fontWeight: 700, textTransform: 'none' }}>Réessayer</Button>
                  </Box>
                )}

                {/* Empty */}
                {!tableLoading && !tableError && filteredEtabs.length === 0 && (
                  <Box sx={{ py: 5, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '2rem', mb: 1 }}>🔍</Typography>
                    <Typography sx={{ color: '#8A9BB0', fontWeight: 600, fontSize: '0.88rem' }}>Aucun établissement trouvé</Typography>
                  </Box>
                )}

                {/* Data rows */}
                {!tableLoading && filteredEtabs.map((etab, i) => {
                  // etab.taux est garanti par la normalisation (parseFloat de taux_reussite BDD)
                  const taux          = etab.taux || 0;
                  const sc            = statutConfig(taux);
                  const progressColor = taux >= 75 ? C.green : taux >= 65 ? C.blue : C.orange;
                  const progressW     = Math.min(100, Math.max(0, taux));

                  return (
                    <Box
                      key={etab.id || etab.code || i}
                      onMouseEnter={() => setHovRow(i)}
                      onMouseLeave={() => setHovRow(null)}
                      sx={{
                        display: 'grid', gridTemplateColumns: tableCols,
                        gap: 2, alignItems: 'center', px: 3, py: 2.5,
                        background: hovRow === i ? '#fff' : 'transparent',
                        borderBottom: i < filteredEtabs.length - 1 ? `1px solid ${C.blueL}` : 'none',
                        transition: 'all 0.2s ease',
                        animation: `${fadeUp} 0.4s ease-out ${0.05 + i * 0.04}s both`,
                        cursor: 'pointer',
                        '&:hover': { boxShadow: `inset 3px 0 0 ${sc.color}` },
                      }}
                      onClick={() => setSelectedEtab(etab)}
                    >
                      {/* Code */}
                      <Box sx={{ background: `${C.blue}10`, color: C.blue, fontWeight: 700, fontSize: '0.72rem', px: 1.2, py: 0.5, borderRadius: '8px', display: 'inline-block', width: 'fit-content', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                        {etab.code}
                      </Box>

                      {/* Nom */}
                      <Box>
                        <Typography sx={{ fontWeight: 600, color: C.navy, fontSize: '0.88rem', lineHeight: 1.3 }}>{etab.nom}</Typography>
                        {etab.nom_ville && (
                          <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0', mt: 0.2 }}>📍 {etab.nom_ville}</Typography>
                        )}
                      </Box>

                      {/* Type */}
                      <Typography sx={{ color: '#A0B0C0', fontSize: '0.82rem' }}>{etab.type}</Typography>

                      {/* Effectif */}
                      <Typography sx={{ fontSize: '0.85rem', color: C.navy, fontWeight: 600 }}>
                        {Number(etab.effectif).toLocaleString('fr-TN')}
                      </Typography>

                      {/* Taux réussite */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ flex: 1, height: 6, borderRadius: 3, background: `${progressColor}18`, overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', borderRadius: 3, width: `${progressW}%`, background: `linear-gradient(90deg, ${progressColor}, ${progressColor}AA)`, transition: 'width 0.6s ease' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 900, color: progressColor, fontSize: '0.9rem', minWidth: 40 }}>{taux.toFixed(1)}%</Typography>
                      </Box>

                      {/* Statut */}
                      <Chip
                        icon={sc.icon}
                        label={sc.label} size="small"
                        sx={{ background: sc.bg, color: sc.color, fontWeight: 700, fontSize: '0.72rem', border: `1px solid ${sc.color}28`, borderRadius: '10px', '& .MuiChip-icon': { color: sc.color, fontSize: 13 } }}
                      />

                      {/* Actions */}
                      <Button size="small"
                        onClick={(e) => { e.stopPropagation(); setSelectedEtab(etab); }}
                        sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', color: C.blue, px: 1.8, py: 0.6, border: `1.5px solid ${hovRow === i ? C.blue + '40' : 'transparent'}`, '&:hover': { background: C.blueL, borderColor: `${C.blue}40` }, transition: 'all 0.2s' }}
                      >
                        Détails →
                      </Button>
                    </Box>
                  );
                })}
              </Box>

              {/* Footer legend */}
              {!tableLoading && filteredEtabs.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0.5 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: '#8A9BB0' }}>
                    {filteredEtabs.length} établissement{filteredEtabs.length > 1 ? 's' : ''}
                    {typeFilter && ` · Type: ${typeFilter}`}
                    {search && ` · "${search}"`}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {[
                      { label: 'Excellent (≥75%)', color: C.green  },
                      { label: 'Bon (65–74%)',     color: C.blue   },
                      { label: 'À risque (<65%)',  color: C.orange },
                    ].map(item => (
                      <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                        <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0', fontWeight: 600 }}>{item.label}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>


      {/* ══ DIALOG DETAIL ML ════════════════════════════════════ */}
      <Dialog open={!!detailML} onClose={() => setDetailML(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '22px', border: `1.5px solid ${C.blueL}`, boxShadow: `0 24px 60px rgba(26,58,107,0.16)`, animation: `${popIn} 0.35s cubic-bezier(0.34,1.56,0.64,1)`, overflow: 'hidden' } }}
      >
        {detailML && mlPred && (() => {
          const isReussite = detailML === 'reussite';
          const accent = isReussite ? mlPred.couleur : '#EF4444';
          const taux   = isReussite ? mlPred.taux_reussite_predit : Math.round((100 - mlPred.taux_reussite_predit) * 10) / 10;
          const nbEns  = userStats.ENSEIGNANT || 1;
          const ratio  = Math.max(1, Math.round((etablissementStats.effectif_total / nbEns) * 10) / 10);
          const budget = etablissementStats.effectif_total > 0
            ? Math.round(etablissementStats.budget_total / etablissementStats.effectif_total)
            : 5000;

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
              {/* Header */}
              <Box sx={{ px: 3, py: 2.5, background: `linear-gradient(135deg, ${accent}10 0%, ${C.blueL} 100%)`, borderBottom: `1px solid ${C.blueL}` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: `${accent}15`, border: `1.5px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                      {isReussite ? '🎯' : '⚠️'}
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 900, color: C.navy, fontSize: '1rem' }}>
                        {isReussite ? 'Taux de reussite predit' : "Taux d'echec predit"} 2025-2026
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0' }}>
                        {isReussite ? 'Modele M1 · Regression · explications detaillees' : 'Derive du taux de reussite M1 · explications detaillees'}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton size="small" onClick={() => setDetailML(null)}
                    sx={{ color: '#8A9BB0', borderRadius: '10px', '&:hover': { background: C.blueL, color: C.navy } }}>
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
                {/* Big number */}
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mt: 2.5 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: '3rem', color: accent, lineHeight: 1, letterSpacing: '-2px' }}>{taux}</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#8A9BB0', mb: 0.6, fontSize: '1.2rem' }}>%</Typography>
                  <Chip label={isReussite ? mlPred.interpretation : (taux > 35 ? 'Eleve' : taux > 20 ? 'Modere' : 'Faible')} size="small"
                    sx={{ mb: 0.5, ml: 0.5, background: `${accent}18`, color: accent, border: `1px solid ${accent}35`, fontWeight: 700 }} />
                </Box>
                <LinearProgress variant="determinate" value={taux}
                  sx={{ mt: 1.2, height: 6, borderRadius: 3, backgroundColor: `${accent}15`, '& .MuiLinearProgress-bar': { backgroundColor: accent, borderRadius: 3 } }} />
              </Box>

              <DialogContent sx={{ p: 3 }}>
                {/* Explication générale */}
                <Box sx={{ mb: 3, p: 2, borderRadius: '12px', background: C.blueL, border: `1px solid ${C.blue}20` }}>
                  <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.78rem', mb: 0.8 }}>
                    {isReussite ? 'Comment cette prediction est-elle calculee ?' : "D'ou vient ce taux d'echec ?"}
                  </Typography>
                  <Typography sx={{ fontSize: '0.77rem', color: '#64748B', lineHeight: 1.75 }}>
                    {isReussite
                      ? "Notre modele M1 (regression supervisee) a ete entraine sur des donnees academiques tunisiennes. Il prend en entree les taux de reussite des 2 annees precedentes ainsi que des indicateurs institutionnels (ratio etudiants/enseignants, budget, absenteisme, etc.) pour estimer le taux de reussite de l'annee suivante."
                      : "Le taux d'echec est simplement le complement du taux de reussite predit : 100% - taux_reussite_predit. Si le modele M1 predit 78.5% de reussite, alors 21.5% des etudiants sont estimes en situation d'echec. Ce chiffre permet d'anticiper les besoins en soutien pedagogique."
                    }
                  </Typography>
                </Box>

                {/* Données utilisées */}
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5 }}>
                  {isReussite ? 'Donnees injectees dans le modele' : 'Calcul pas a pas'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', mb: 3 }}>
                  {isReussite ? (
                    <>
                      <Row label="Taux de reussite 2023-2024" val="76.8 %" note="Annee n-2 · donnee historique reelle" />
                      <Row label="Taux de reussite 2024-2025" val="78.5 %" note="Annee n-1 · tendance la plus recente" />
                      <Row label="Taux d'absence moyen" val="15.0 %" note="Estimation nationale — impact negatif sur la reussite" />
                      <Row label="Ratio etudiants / enseignant" val={`${ratio}`} note="Calcule depuis la base de donnees" />
                      <Row label="Budget alloue par etudiant" val={`${budget.toLocaleString('fr-TN')} DT`} note="Budget total divise par l'effectif" />
                      <Row label="Nombre de laboratoires" val="5" note="Parametre institutionnel moyen" />
                      <Row label="Taux de rotation des enseignants" val="8.0 %" note="Turnover annuel estime" />
                      <Row label="Region / Type" val="Grand Tunis · Universite" note="Contexte geographique et institutionnel" />
                    </>
                  ) : (
                    <>
                      <Row label="Taux de reussite predit (M1)" val={`${mlPred.taux_reussite_predit} %`} note="Resultat du modele M1" />
                      <Row label="Complement (100 - reussite)" val={`${taux} %`} note="= Taux d'echec estime" />
                      <Row label="Effectif total etudiants" val={(userStats.ETUDIANT || 0).toLocaleString('fr-TN')} note="Source : base de donnees SIAPET" />
                      <Row label="Etudiants en situation d'echec" val={`~${Math.round(taux * (userStats.ETUDIANT || 0) / 100).toLocaleString('fr-TN')}`} note="Estimation = taux × effectif" />
                    </>
                  )}
                </Box>

                {/* Interprétation */}
                <Box sx={{ p: 2, borderRadius: '12px', background: `${accent}0c`, border: `1px solid ${accent}25` }}>
                  <Typography sx={{ fontWeight: 800, color: accent, fontSize: '0.76rem', mb: 0.6 }}>
                    {isReussite ? 'Interpretation du resultat' : 'Ce que ce chiffre implique'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.77rem', color: '#64748B', lineHeight: 1.7 }}>
                    {isReussite
                      ? (mlPred.taux_reussite_predit >= 70
                          ? `Un taux de ${mlPred.taux_reussite_predit}% est juge BON. La tendance est positive par rapport aux annees precedentes. Les conditions actuelles (budget, encadrement, presence) sont favorables a la reussite des etudiants.`
                          : mlPred.taux_reussite_predit >= 55
                          ? `Un taux de ${mlPred.taux_reussite_predit}% est MOYEN. Des actions d'amelioration sont recommandees : reduire l'absenteisme, renforcer l'encadrement ou augmenter le budget pedagogique.`
                          : `Un taux de ${mlPred.taux_reussite_predit}% est FAIBLE. Des mesures urgentes sont necessaires pour eviter une degradation des resultats academiques.`)
                      : `Un taux d'echec de ${taux}% signifie qu'environ ${Math.round(taux * (userStats.ETUDIANT || 0) / 100).toLocaleString('fr-TN')} etudiants risquent de ne pas valider leur annee. Il est recommande de renforcer les dispositifs de soutien (tutorat, sessions de rattrapage) des le debut du semestre.`
                    }
                  </Typography>
                </Box>
              </DialogContent>
            </>
          );
        })()}
      </Dialog>

      {/* ══ DIALOG USERS ════════════════════════════════════════ */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '22px', overflow: 'hidden', boxShadow: `0 24px 60px rgba(26,58,107,0.16), 0 6px 24px ${C.blue}14`, border: `1.5px solid ${C.blueL}`, animation: `${popIn} 0.38s cubic-bezier(0.34,1.56,0.64,1)`, background: '#F7FBFF', maxHeight: '88vh' } }}
      >
        <Box sx={{ background: `linear-gradient(135deg, ${C.blueL} 0%, #D6EEFF 60%, #EAF4FF 100%)`, px: 3, py: 2.5, borderBottom: `1.5px solid ${C.blue}20` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '14px', background: C.blueL, border: `1.5px solid ${C.blue}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', boxShadow: `0 4px 16px rgba(26,58,107,0.22)` }}>👥</Box>
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.4px', color: C.navy, mb: 0.2 }}>Gestion des utilisateurs</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: C.green, animation: `${blinkDot} 2s infinite` }} />
                  <Typography sx={{ color: C.navy, opacity: 0.55, fontSize: '0.75rem' }}>4 types · {userStats.total.toLocaleString()} utilisateurs actifs</Typography>
                </Box>
              </Box>
            </Box>
            <IconButton onClick={() => setDialogOpen(false)} sx={{ color: C.navy, opacity: 0.5, borderRadius: '10px', '&:hover': { background: `${C.blue}18`, opacity: 1, transform: 'rotate(90deg)' }, transition: 'all 0.2s' }}>
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
                  onClick={() => { setDialogOpen(false); navigate(`/dashboard/admin/users/${u.role.toLowerCase()}`); }}
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
                        <Box sx={{ width: 44, height: 44, borderRadius: '14px', background: `${u.color}12`, border: `1.5px solid ${u.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0, transition: 'transform 0.3s ease', transform: hovCard === i ? 'rotate(8deg) scale(1.12)' : 'none' }}>{u.emoji}</Box>
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
                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', background: u.color, animation: `${blinkDot} 2s infinite` }} />
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
          <Box sx={{ mt: 2.5, display: 'flex', gap: 1.5 }}>
            {[
              { label: 'Utilisateurs archivés', icon: '📦', path: '/dashboard/admin/archived-users' },
              { label: "Historique d'audit",    icon: '📋', path: '/dashboard/admin/audit-history'  },
            ].map(({ label, icon, path }) => (
              <Button key={label} fullWidth variant="outlined"
                startIcon={<span>{icon}</span>}
                onClick={() => { setDialogOpen(false); navigate(path); }}
                sx={{ py: 1.5, borderRadius: '14px', fontWeight: 700, fontSize: '0.85rem', textTransform: 'none', border: `1.5px solid ${C.blueL}`, color: C.navy, '&:hover': { background: C.blueL, borderColor: `${C.blue}50` } }}
              >
                {label}
              </Button>
            ))}
          </Box>
        </DialogContent>
      </Dialog>

      {/* ══ SNACKBAR ════════════════════════════════════════════ */}
      <Snackbar open={snackbar.open} autoHideDuration={6000}
        onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar(p => ({ ...p, open: false }))} severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: '12px', boxShadow: `0 4px 20px ${C.blue}20` }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* ══ DETAILS MODAL (evolution / alertes / top) ══════════ */}
      <DetailsModal
        open={detailsModal.open}
        onClose={closeModal}
        type={detailsModal.type}
        data={detailsModal.data}
        title={detailsModal.title}
        accentColor={detailsModal.accentColor}
      />

      {/* ══ REGION DETAIL MODAL ═════════════════════════════════ */}
      <RegionDetailModal
        region={selectedRegion}
        onClose={() => setSelectedRegion(null)}
      />

      {/* ══ ETAB DETAILS MODAL ══════════════════════════════════ */}
      <EtabDetailsModal
        etab={selectedEtab}
        onClose={() => setSelectedEtab(null)}
      />

      <AdminInfoModal
        open={infoModal.open}
        onClose={closeInfo}
        config={CARD_INFO_CONFIGS[infoModal.cardKey]}
      />
    </Box>
  );
}
