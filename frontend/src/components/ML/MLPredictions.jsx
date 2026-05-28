import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button,
  TextField, MenuItem, CircularProgress, Chip, Divider,
  Collapse, IconButton, Tooltip, LinearProgress,
  Dialog, DialogContent, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import {
  Psychology, ExpandMore, ExpandLess, Refresh,
  TrendingUp, TrendingDown, Warning, CheckCircle, Close,
  Timeline, BarChart,
} from '@mui/icons-material';
import mlService from '../../services/mlService';

const CURRENT_YEAR = new Date().getFullYear();
const HORIZON_YEARS = Array.from({ length: 2030 - CURRENT_YEAR + 1 }, (_, i) => CURRENT_YEAR + i);

// ── Palette partagée ────────────────────────────────────────────────────────
const ML_COLORS = {
  m1: '#1e40af',
  m2: '#15803d',
  m3: '#b45309',
  rouge:  '#ef4444',
  orange: '#f59e0b',
  vert:   '#22c55e',
  bg:     '#f8fafc',
};

// ── Jauge circulaire ────────────────────────────────────────────────────────
function Jauge({ value, max = 100, color, label, size = 90 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <svg width={size} height={size}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={10} />
          <circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={10}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <Box sx={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Typography sx={{ fontWeight: 900, fontSize: '0.95rem', color, lineHeight: 1 }}>
            {typeof value === 'number' ? (max === 100 ? `${value.toFixed(1)}%` : value.toFixed(1)) : value}
          </Typography>
        </Box>
      </Box>
      <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, mt: 0.5 }}>
        {label}
      </Typography>
    </Box>
  );
}

// ── Badge résultat ──────────────────────────────────────────────────────────
function ResultBadge({ texte, couleur }) {
  return (
    <Chip
      label={texte}
      size="small"
      sx={{
        fontWeight: 800, fontSize: '0.78rem',
        background: `${couleur}18`,
        color: couleur,
        border: `1.5px solid ${couleur}40`,
        borderRadius: '8px',
      }}
    />
  );
}

// ── Card wrapper ML ─────────────────────────────────────────────────────────
function MLCard({ title, subtitle, icon, color, children }) {
  const [open, setOpen] = useState(true);

  return (
    <Card sx={{
      borderRadius: '16px',
      border: `1.5px solid ${color}25`,
      boxShadow: `0 4px 24px ${color}12`,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <Box sx={{
        px: 2.5, py: 1.8,
        background: `linear-gradient(135deg, ${color}14 0%, #f8fafc 100%)`,
        borderBottom: `1px solid ${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '12px',
            background: `${color}15`, border: `1.5px solid ${color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem',
          }}>
            {icon}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
              {title}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>{subtitle}</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={() => setOpen(o => !o)}
          sx={{ color: '#94a3b8', '&:hover': { background: `${color}10` } }}>
          {open ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={open}>
        <CardContent sx={{ p: 2.5 }}>{children}</CardContent>
      </Collapse>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// M1 — Taux de réussite
// ═══════════════════════════════════════════════════════════════════════════
export function MLReussite({ defaultData = {} }) {
  const [form, setForm] = useState({
    taux_reussite_an1:  defaultData.taux_reussite_an1  ?? 78,
    taux_reussite_an2:  defaultData.taux_reussite_an2  ?? 75,
    taux_absence_moyen: defaultData.taux_absence_moyen ?? 8,
    ratio_etud_ens:     defaultData.ratio_etud_ens     ?? 25,
    budget_par_etud:    defaultData.budget_par_etud    ?? 4500,
    nb_labos:           defaultData.nb_labos           ?? 12,
    taux_rotation_ens:  defaultData.taux_rotation_ens  ?? 8,
    region:             defaultData.region             ?? 'Tunis',
    type_etablissement: defaultData.type_etablissement ?? 'ISET',
  });
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [mode,       setMode]       = useState('annee'); // 'annee' | 'projection'
  const [horizon,    setHorizon]    = useState(2030);
  const [projection, setProjection] = useState([]); // [{annee, taux, couleur}]
  const [projecting, setProjecting] = useState(false);
  const [projError,  setProjError]  = useState('');

  const REGIONS = ['Tunis','Sfax','Sousse','Kairouan','Bizerte','Gabes','Ariana','Monastir','Nabeul'];
  const TYPES   = ['Faculté','École','Institut','ISET'];

  const predict = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const { data } = await mlService.predireReussite(form);
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.details || 'API ML non disponible. Démarrez FastAPI (port 5001).');
    } finally { setLoading(false); }
  };

  const projeter = async () => {
    setProjecting(true); setProjError(''); setProjection([]);
    const results = [];
    let an1 = form.taux_reussite_an1;
    let an2 = form.taux_reussite_an2;
    try {
      for (let annee = CURRENT_YEAR; annee <= horizon; annee++) {
        const { data } = await mlService.predireReussite({ ...form, taux_reussite_an1: an1, taux_reussite_an2: an2 });
        results.push({ annee, taux: data.taux_reussite_predit, couleur: data.couleur, interpretation: data.interpretation });
        an2 = an1;
        an1 = data.taux_reussite_predit;
      }
      setProjection(results);
    } catch (e) {
      setProjError(e.response?.data?.details || 'API ML non disponible.');
    } finally { setProjecting(false); }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: isNaN(e.target.value) ? e.target.value : Number(e.target.value) }));

  const projMax = projection.length ? Math.max(...projection.map(p => p.taux)) : 100;

  return (
    <MLCard title="Prédiction — Taux de Réussite" subtitle="Modèle M1 · Régression Linéaire · R²=86%"
            icon="🎓" color={ML_COLORS.m1}>

      {/* ── Sélecteur de mode ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => v && setMode(v)}
          size="small"
          sx={{ '& .MuiToggleButton-root': { borderRadius: '10px !important', textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', px: 1.8, py: 0.6, border: `1.5px solid ${ML_COLORS.m1}30` } }}
        >
          <ToggleButton value="annee" sx={{ '&.Mui-selected': { background: `${ML_COLORS.m1}18`, color: ML_COLORS.m1 } }}>
            <BarChart sx={{ fontSize: 15, mr: 0.6 }} /> Année en cours
          </ToggleButton>
          <ToggleButton value="projection" sx={{ '&.Mui-selected': { background: `${ML_COLORS.m1}18`, color: ML_COLORS.m1 } }}>
            <Timeline sx={{ fontSize: 15, mr: 0.6 }} /> Projection jusqu'à 2030
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={2}>
        {/* ── Inputs (communs aux deux modes) ── */}
        <Grid item xs={12} md={7}>
          <Grid container spacing={1.5}>
            {[
              { k: 'taux_reussite_an1',  label: 'Taux réussite N-1 (%)', type: 'number' },
              { k: 'taux_reussite_an2',  label: 'Taux réussite N-2 (%)', type: 'number' },
              { k: 'taux_absence_moyen', label: 'Taux absence moyen (%)', type: 'number' },
              { k: 'ratio_etud_ens',     label: 'Ratio étudiants/ens.',   type: 'number' },
              { k: 'budget_par_etud',    label: 'Budget / étudiant (DT)', type: 'number' },
              { k: 'nb_labos',           label: 'Nb laboratoires',        type: 'number' },
              { k: 'taux_rotation_ens',  label: 'Rotation enseignants (%)', type: 'number' },
            ].map(({ k, label, type }) => (
              <Grid item xs={6} key={k}>
                <TextField size="small" fullWidth label={label} type={type}
                  value={form[k]} onChange={f(k)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.85rem' } }} />
              </Grid>
            ))}
            <Grid item xs={6}>
              <TextField select size="small" fullWidth label="Région" value={form.region} onChange={f('region')}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.85rem' } }}>
                {REGIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select size="small" fullWidth label="Type" value={form.type_etablissement} onChange={f('type_etablissement')}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.85rem' } }}>
                {TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>

          {/* Bouton selon le mode */}
          {mode === 'annee' ? (
            <Button onClick={predict} disabled={loading} fullWidth variant="contained"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Psychology />}
              sx={{
                mt: 2, borderRadius: '12px', textTransform: 'none', fontWeight: 700,
                background: `linear-gradient(135deg, ${ML_COLORS.m1} 0%, #3b82f6 100%)`,
                boxShadow: `0 4px 16px ${ML_COLORS.m1}40`,
                '&:hover': { transform: 'translateY(-1px)', boxShadow: `0 6px 20px ${ML_COLORS.m1}50` },
              }}>
              {loading ? 'Calcul en cours...' : 'Lancer la prédiction'}
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <TextField
                select size="small" label="Horizon"
                value={horizon}
                onChange={e => setHorizon(Number(e.target.value))}
                sx={{ minWidth: 110, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.85rem' } }}
              >
                {HORIZON_YEARS.filter(y => y > CURRENT_YEAR).map(y =>
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                )}
              </TextField>
              <Button onClick={projeter} disabled={projecting} fullWidth variant="contained"
                startIcon={projecting ? <CircularProgress size={16} color="inherit" /> : <Timeline />}
                sx={{
                  borderRadius: '12px', textTransform: 'none', fontWeight: 700,
                  background: `linear-gradient(135deg, ${ML_COLORS.m1} 0%, #3b82f6 100%)`,
                  '&:hover': { transform: 'translateY(-1px)' },
                }}>
                {projecting ? 'Projection...' : `Projeter jusqu'à ${horizon}`}
              </Button>
            </Box>
          )}
        </Grid>

        {/* ── Résultat ── */}
        <Grid item xs={12} md={5}>
          {mode === 'annee' ? (
            <Box sx={{
              height: '100%', borderRadius: '14px', border: `1.5px dashed ${ML_COLORS.m1}30`,
              background: `${ML_COLORS.m1}05`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              p: 2, minHeight: 180,
            }}>
              {error && (
                <Typography sx={{ fontSize: '0.8rem', color: ML_COLORS.rouge, textAlign: 'center', p: 1 }}>
                  ⚠️ {error}
                </Typography>
              )}
              {!result && !error && !loading && (
                <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center' }}>
                  Remplissez les données et cliquez sur <b>Lancer la prédiction</b>
                </Typography>
              )}
              {result && (
                <Box sx={{ textAlign: 'center', width: '100%' }}>
                  <Jauge value={result.taux_reussite_predit} max={100} color={result.couleur} label="Taux prédit" size={100} />
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                    <ResultBadge texte={result.interpretation} couleur={result.couleur} />
                    <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Taux prédit : <b>{result.taux_reussite_predit}%</b>
                    </Typography>
                    <LinearProgress variant="determinate" value={result.taux_reussite_predit}
                      sx={{
                        width: '100%', height: 8, borderRadius: 4, mt: 1,
                        backgroundColor: '#e2e8f0',
                        '& .MuiLinearProgress-bar': { backgroundColor: result.couleur, borderRadius: 4 },
                      }} />
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            /* ── Zone projection ── */
            <Box sx={{
              height: '100%', borderRadius: '14px', border: `1.5px dashed ${ML_COLORS.m1}30`,
              background: `${ML_COLORS.m1}05`, p: 2, minHeight: 200,
            }}>
              {projError && (
                <Typography sx={{ fontSize: '0.8rem', color: ML_COLORS.rouge, textAlign: 'center', p: 1 }}>
                  ⚠️ {projError}
                </Typography>
              )}
              {!projection.length && !projError && !projecting && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1 }}>
                  <Timeline sx={{ color: `${ML_COLORS.m1}60`, fontSize: 38 }} />
                  <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center' }}>
                    Sélectionnez l'horizon et cliquez sur <b>Projeter</b>
                  </Typography>
                </Box>
              )}
              {projecting && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1.5 }}>
                  <CircularProgress size={28} sx={{ color: ML_COLORS.m1 }} />
                  <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>Calcul de la projection…</Typography>
                </Box>
              )}
              {projection.length > 0 && (
                <Box>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: ML_COLORS.m1, mb: 1.5 }}>
                    Évolution prédite {CURRENT_YEAR} → {horizon}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                    {projection.map((p, i) => {
                      const barW = projMax > 0 ? (p.taux / projMax) * 100 : 0;
                      const isFirst = i === 0;
                      const prev = i > 0 ? projection[i - 1].taux : null;
                      const delta = prev !== null ? Math.round((p.taux - prev) * 10) / 10 : null;
                      return (
                        <Box key={p.annee}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', minWidth: 36 }}>
                                {p.annee}
                              </Typography>
                              {isFirst && (
                                <Chip label="base" size="small" sx={{ height: 16, fontSize: '0.6rem', background: `${ML_COLORS.m1}15`, color: ML_COLORS.m1, fontWeight: 700 }} />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                              {delta !== null && (
                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: delta >= 0 ? '#22c55e' : '#ef4444' }}>
                                  {delta >= 0 ? '+' : ''}{delta}%
                                </Typography>
                              )}
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: p.couleur }}>
                                {p.taux.toFixed(1)}%
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ position: 'relative', height: 8, borderRadius: 4, background: '#e2e8f0', overflow: 'hidden' }}>
                            <Box sx={{
                              position: 'absolute', left: 0, top: 0, bottom: 0,
                              width: `${barW}%`, borderRadius: 4,
                              background: p.couleur,
                              transition: 'width 0.6s ease',
                            }} />
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                  {/* Résumé tendance */}
                  {projection.length >= 2 && (() => {
                    const first = projection[0].taux;
                    const last  = projection[projection.length - 1].taux;
                    const diff  = Math.round((last - first) * 10) / 10;
                    const isHausse = diff >= 0;
                    return (
                      <Box sx={{ mt: 1.5, p: 1.2, borderRadius: '10px', background: isHausse ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isHausse ? '#86efac' : '#fca5a5'}` }}>
                        <Typography sx={{ fontSize: '0.73rem', fontWeight: 700, color: isHausse ? '#15803d' : '#dc2626' }}>
                          {isHausse ? '📈 Tendance haussière' : '📉 Tendance baissière'} — {isHausse ? '+' : ''}{diff}% sur {horizon - CURRENT_YEAR} an{horizon - CURRENT_YEAR > 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    );
                  })()}
                </Box>
              )}
            </Box>
          )}
        </Grid>
      </Grid>
    </MLCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// M2 — Étudiant à risque
// ═══════════════════════════════════════════════════════════════════════════
export function MLRisque({ defaultData = {} }) {
  const [form, setForm] = useState({
    moy_semestre_prec:    defaultData.moy_semestre_prec    ?? 14,
    note_cc1:             defaultData.note_cc1             ?? 13,
    note_cc2:             defaultData.note_cc2             ?? 14,
    note_cc3:             defaultData.note_cc3             ?? 15,
    taux_absence:         defaultData.taux_absence         ?? 8,
    nb_echecs_anterieurs: defaultData.nb_echecs_anterieurs ?? 0,
    evolution_notes:      defaultData.evolution_notes      ?? 2,
    participation:        defaultData.participation        ?? 7,
    niveau:               defaultData.niveau               ?? 'L2',
    filiere:              defaultData.filiere              ?? 'Informatique',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [mode,       setMode]       = useState('annee');
  const [horizon,    setHorizon]    = useState(2030);
  const [projection, setProjection] = useState([]);
  const [projecting, setProjecting] = useState(false);
  const [projError,  setProjError]  = useState('');

  const NIVEAUX  = ['L1','L2','L3','M1','M2'];
  const FILIERES = ['Informatique','Gestion','Droit','Médecine','Ingénierie'];

  const predict = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const { data } = await mlService.predireRisque(form);
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.details || 'API ML non disponible.');
    } finally { setLoading(false); }
  };

  const projeter = async () => {
    setProjecting(true); setProjError(''); setProjection([]);
    const results = [];
    let moy = form.moy_semestre_prec;
    let echecs = form.nb_echecs_anterieurs;
    try {
      for (let annee = CURRENT_YEAR; annee <= horizon; annee++) {
        const { data } = await mlService.predireRisque({ ...form, moy_semestre_prec: moy, nb_echecs_anterieurs: echecs });
        results.push({ annee, probabilite: data.probabilite, couleur: data.couleur, niveau_alerte: data.niveau_alerte, a_risque: data.a_risque });
        if (data.a_risque) { moy = Math.max(5, moy - 1); echecs = echecs + 1; }
        else { moy = Math.min(20, moy + 0.3); }
      }
      setProjection(results);
    } catch (e) {
      setProjError(e.response?.data?.details || 'API ML non disponible.');
    } finally { setProjecting(false); }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: isNaN(e.target.value) ? e.target.value : Number(e.target.value) }));

  const alertConfig = result ? {
    ROUGE:  { icon: '🔴', label: 'Risque élevé',  bg: '#fef2f2', border: ML_COLORS.rouge },
    ORANGE: { icon: '🟠', label: 'Risque modéré', bg: '#fffbeb', border: ML_COLORS.orange },
    VERT:   { icon: '🟢', label: 'Pas à risque',  bg: '#f0fdf4', border: ML_COLORS.vert },
  }[result.niveau_alerte] : null;

  return (
    <MLCard title="Détection — Étudiant à Risque" subtitle="Modèle M2 · Régression Logistique · Recall=94.7%"
            icon="⚠️" color={ML_COLORS.m2}>

      {/* ── Sélecteur de mode ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => v && setMode(v)}
          size="small"
          sx={{ '& .MuiToggleButton-root': { borderRadius: '10px !important', textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', px: 1.8, py: 0.6, border: `1.5px solid ${ML_COLORS.m2}30` } }}
        >
          <ToggleButton value="annee" sx={{ '&.Mui-selected': { background: `${ML_COLORS.m2}18`, color: ML_COLORS.m2 } }}>
            <BarChart sx={{ fontSize: 15, mr: 0.6 }} /> Année en cours
          </ToggleButton>
          <ToggleButton value="projection" sx={{ '&.Mui-selected': { background: `${ML_COLORS.m2}18`, color: ML_COLORS.m2 } }}>
            <Timeline sx={{ fontSize: 15, mr: 0.6 }} /> Projection jusqu'à 2030
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Grid container spacing={1.5}>
            {[
              { k: 'moy_semestre_prec',    label: 'Moyenne sem. précédent (/20)', type: 'number' },
              { k: 'note_cc1',             label: 'Note CC1 (/20)',               type: 'number' },
              { k: 'note_cc2',             label: 'Note CC2 (/20)',               type: 'number' },
              { k: 'note_cc3',             label: 'Note CC3 (/20)',               type: 'number' },
              { k: 'taux_absence',         label: 'Taux d\'absence (%)',          type: 'number' },
              { k: 'nb_echecs_anterieurs', label: 'Échecs antérieurs',            type: 'number' },
              { k: 'evolution_notes',      label: 'Évolution notes (CC1→CC3)',    type: 'number' },
              { k: 'participation',        label: 'Participation (0–10)',         type: 'number' },
            ].map(({ k, label, type }) => (
              <Grid item xs={6} key={k}>
                <TextField size="small" fullWidth label={label} type={type}
                  value={form[k]} onChange={f(k)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.85rem' } }} />
              </Grid>
            ))}
            <Grid item xs={6}>
              <TextField select size="small" fullWidth label="Niveau" value={form.niveau} onChange={f('niveau')}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.85rem' } }}>
                {NIVEAUX.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select size="small" fullWidth label="Filière" value={form.filiere} onChange={f('filiere')}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.85rem' } }}>
                {FILIERES.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
          {mode === 'annee' ? (
            <Button onClick={predict} disabled={loading} fullWidth variant="contained"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Psychology />}
              sx={{
                mt: 2, borderRadius: '12px', textTransform: 'none', fontWeight: 700,
                background: `linear-gradient(135deg, ${ML_COLORS.m2} 0%, #22c55e 100%)`,
                boxShadow: `0 4px 16px ${ML_COLORS.m2}40`,
                '&:hover': { transform: 'translateY(-1px)' },
              }}>
              {loading ? 'Analyse en cours...' : 'Analyser le risque'}
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <TextField
                select size="small" label="Horizon"
                value={horizon}
                onChange={e => setHorizon(Number(e.target.value))}
                sx={{ minWidth: 110, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.85rem' } }}
              >
                {HORIZON_YEARS.filter(y => y > CURRENT_YEAR).map(y =>
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                )}
              </TextField>
              <Button onClick={projeter} disabled={projecting} fullWidth variant="contained"
                startIcon={projecting ? <CircularProgress size={16} color="inherit" /> : <Timeline />}
                sx={{
                  borderRadius: '12px', textTransform: 'none', fontWeight: 700,
                  background: `linear-gradient(135deg, ${ML_COLORS.m2} 0%, #22c55e 100%)`,
                  '&:hover': { transform: 'translateY(-1px)' },
                }}>
                {projecting ? 'Projection...' : `Projeter jusqu'à ${horizon}`}
              </Button>
            </Box>
          )}
        </Grid>

        <Grid item xs={12} md={5}>
          {mode === 'annee' ? (
            <Box sx={{
              height: '100%', borderRadius: '14px',
              border: `1.5px dashed ${alertConfig ? alertConfig.border : ML_COLORS.m2}40`,
              background: alertConfig ? alertConfig.bg : `${ML_COLORS.m2}05`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              p: 2, minHeight: 200, transition: 'all 0.4s ease',
            }}>
              {error && (
                <Typography sx={{ fontSize: '0.8rem', color: ML_COLORS.rouge, textAlign: 'center' }}>
                  ⚠️ {error}
                </Typography>
              )}
              {!result && !error && (
                <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center' }}>
                  Saisissez les données de l'étudiant et analysez son niveau de risque
                </Typography>
              )}
              {result && alertConfig && (
                <Box sx={{ textAlign: 'center', width: '100%' }}>
                  <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>{alertConfig.icon}</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', color: result.couleur, mb: 0.5 }}>
                    {result.interpretation}
                  </Typography>
                  <Chip label={`Alerte ${result.niveau_alerte}`} size="small"
                    sx={{ fontWeight: 800, background: `${result.couleur}18`, color: result.couleur,
                          border: `1.5px solid ${result.couleur}40`, mb: 1.5 }} />
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                    <Box>
                      <Typography sx={{ fontWeight: 900, fontSize: '1.4rem', color: result.couleur }}>
                        {(result.probabilite * 100).toFixed(1)}%
                      </Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>Probabilité de risque</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 900, fontSize: '1.4rem', color: result.a_risque ? ML_COLORS.rouge : ML_COLORS.vert }}>
                        {result.a_risque ? 'OUI' : 'NON'}
                      </Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>À risque ?</Typography>
                    </Box>
                  </Box>
                  <LinearProgress variant="determinate" value={result.probabilite * 100}
                    sx={{
                      mt: 2, height: 8, borderRadius: 4,
                      backgroundColor: '#e2e8f0',
                      '& .MuiLinearProgress-bar': { backgroundColor: result.couleur, borderRadius: 4 },
                    }} />
                </Box>
              )}
            </Box>
          ) : (
            /* ── Zone projection risque ── */
            <Box sx={{
              height: '100%', borderRadius: '14px', border: `1.5px dashed ${ML_COLORS.m2}30`,
              background: `${ML_COLORS.m2}05`, p: 2, minHeight: 200,
            }}>
              {projError && (
                <Typography sx={{ fontSize: '0.8rem', color: ML_COLORS.rouge, textAlign: 'center', p: 1 }}>
                  ⚠️ {projError}
                </Typography>
              )}
              {!projection.length && !projError && !projecting && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1 }}>
                  <Timeline sx={{ color: `${ML_COLORS.m2}60`, fontSize: 38 }} />
                  <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center' }}>
                    Sélectionnez l'horizon et cliquez sur <b>Projeter</b>
                  </Typography>
                </Box>
              )}
              {projecting && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1.5 }}>
                  <CircularProgress size={28} sx={{ color: ML_COLORS.m2 }} />
                  <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>Calcul de la projection…</Typography>
                </Box>
              )}
              {projection.length > 0 && (
                <Box>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: ML_COLORS.m2, mb: 1.5 }}>
                    Évolution du risque {CURRENT_YEAR} → {horizon}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                    {projection.map((p, i) => {
                      const barW = p.probabilite * 100;
                      const isFirst = i === 0;
                      const prev = i > 0 ? projection[i - 1].probabilite : null;
                      const delta = prev !== null ? Math.round((p.probabilite - prev) * 1000) / 10 : null;
                      return (
                        <Box key={p.annee}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', minWidth: 36 }}>
                                {p.annee}
                              </Typography>
                              {isFirst && (
                                <Chip label="base" size="small" sx={{ height: 16, fontSize: '0.6rem', background: `${ML_COLORS.m2}15`, color: ML_COLORS.m2, fontWeight: 700 }} />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                              {delta !== null && (
                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: delta <= 0 ? '#22c55e' : '#ef4444' }}>
                                  {delta >= 0 ? '+' : ''}{delta}%
                                </Typography>
                              )}
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: p.couleur }}>
                                {(p.probabilite * 100).toFixed(1)}%
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ position: 'relative', height: 8, borderRadius: 4, background: '#e2e8f0', overflow: 'hidden' }}>
                            <Box sx={{
                              position: 'absolute', left: 0, top: 0, bottom: 0,
                              width: `${barW}%`, borderRadius: 4,
                              background: p.couleur,
                              transition: 'width 0.6s ease',
                            }} />
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                  {projection.length >= 2 && (() => {
                    const first = projection[0].probabilite;
                    const last  = projection[projection.length - 1].probabilite;
                    const diff  = Math.round((last - first) * 1000) / 10;
                    const isBaisse = diff <= 0;
                    return (
                      <Box sx={{ mt: 1.5, p: 1.2, borderRadius: '10px', background: isBaisse ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isBaisse ? '#86efac' : '#fca5a5'}` }}>
                        <Typography sx={{ fontSize: '0.73rem', fontWeight: 700, color: isBaisse ? '#15803d' : '#dc2626' }}>
                          {isBaisse ? '📉 Risque en baisse' : '📈 Risque en hausse'} — {diff >= 0 ? '+' : ''}{diff}% sur {horizon - CURRENT_YEAR} an{horizon - CURRENT_YEAR > 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    );
                  })()}
                </Box>
              )}
            </Box>
          )}
        </Grid>
      </Grid>
    </MLCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// M3 — Performance future
// ═══════════════════════════════════════════════════════════════════════════
export function MLPerformance({ defaultData = {} }) {
  const [form, setForm] = useState({
    moy_semestre_prec:    defaultData.moy_semestre_prec    ?? 15,
    note_cc1:             defaultData.note_cc1             ?? 14,
    note_cc2:             defaultData.note_cc2             ?? 15,
    note_cc3:             defaultData.note_cc3             ?? 16,
    taux_absence_actuel:  defaultData.taux_absence_actuel  ?? 5,
    pente_evolution:      defaultData.pente_evolution      ?? 2,
    nb_matieres_sous_10:  defaultData.nb_matieres_sous_10  ?? 0,
    ratio_notes_obtenues: defaultData.ratio_notes_obtenues ?? 0.95,
    niveau:               defaultData.niveau               ?? 'L2',
    filiere:              defaultData.filiere              ?? 'Informatique',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [mode,       setMode]       = useState('annee');
  const [horizon,    setHorizon]    = useState(2030);
  const [projection, setProjection] = useState([]);
  const [projecting, setProjecting] = useState(false);
  const [projError,  setProjError]  = useState('');

  const NIVEAUX  = ['L1','L2','L3','M1','M2'];
  const FILIERES = ['Informatique','Gestion','Droit','Médecine','Ingénierie'];

  const MENTIONS = {
    'Très bien':  { color: '#22c55e', emoji: '🌟' },
    'Bien':       { color: '#3b82f6', emoji: '✅' },
    'Assez bien': { color: '#f59e0b', emoji: '👍' },
    'Passable':   { color: '#f97316', emoji: '⚠️' },
    'Insuffisant':{ color: '#ef4444', emoji: '❌' },
  };

  const predict = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const { data } = await mlService.predirePerformance(form);
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.details || 'API ML non disponible.');
    } finally { setLoading(false); }
  };

  const projeter = async () => {
    setProjecting(true); setProjError(''); setProjection([]);
    const results = [];
    let moy = form.moy_semestre_prec;
    try {
      for (let annee = CURRENT_YEAR; annee <= horizon; annee++) {
        const { data } = await mlService.predirePerformance({ ...form, moy_semestre_prec: moy });
        const mentCfg = MENTIONS[data.mention] || MENTIONS['Passable'];
        results.push({ annee, moyenne: data.moyenne_finale_predite, mention: data.mention, couleur: mentCfg.color });
        moy = data.moyenne_finale_predite;
      }
      setProjection(results);
    } catch (e) {
      setProjError(e.response?.data?.details || 'API ML non disponible.');
    } finally { setProjecting(false); }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: isNaN(e.target.value) ? e.target.value : Number(e.target.value) }));
  const mentionCfg = result ? (MENTIONS[result.mention] || MENTIONS['Passable']) : null;

  return (
    <MLCard title="Prédiction — Performance Future" subtitle="Modèle M3 · Régression Linéaire · R²=74.5%"
            icon="📈" color={ML_COLORS.m3}>

      {/* ── Sélecteur de mode ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => v && setMode(v)}
          size="small"
          sx={{ '& .MuiToggleButton-root': { borderRadius: '10px !important', textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', px: 1.8, py: 0.6, border: `1.5px solid ${ML_COLORS.m3}30` } }}
        >
          <ToggleButton value="annee" sx={{ '&.Mui-selected': { background: `${ML_COLORS.m3}18`, color: ML_COLORS.m3 } }}>
            <BarChart sx={{ fontSize: 15, mr: 0.6 }} /> Année en cours
          </ToggleButton>
          <ToggleButton value="projection" sx={{ '&.Mui-selected': { background: `${ML_COLORS.m3}18`, color: ML_COLORS.m3 } }}>
            <Timeline sx={{ fontSize: 15, mr: 0.6 }} /> Projection jusqu'à 2030
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Grid container spacing={1.5}>
            {[
              { k: 'moy_semestre_prec',    label: 'Moyenne sem. précédent (/20)', type: 'number' },
              { k: 'note_cc1',             label: 'Note CC1 (/20)',               type: 'number' },
              { k: 'note_cc2',             label: 'Note CC2 (/20)',               type: 'number' },
              { k: 'note_cc3',             label: 'Note CC3 (/20)',               type: 'number' },
              { k: 'taux_absence_actuel',  label: 'Taux d\'absence actuel (%)',   type: 'number' },
              { k: 'pente_evolution',      label: 'Évolution CC1→CC3',            type: 'number' },
              { k: 'nb_matieres_sous_10',  label: 'Matières sous la moyenne',     type: 'number' },
              { k: 'ratio_notes_obtenues', label: 'Ratio notes obtenues (0-1)',   type: 'number' },
            ].map(({ k, label, type }) => (
              <Grid item xs={6} key={k}>
                <TextField size="small" fullWidth label={label} type={type}
                  value={form[k]} onChange={f(k)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.85rem' } }} />
              </Grid>
            ))}
            <Grid item xs={6}>
              <TextField select size="small" fullWidth label="Niveau" value={form.niveau} onChange={f('niveau')}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.85rem' } }}>
                {NIVEAUX.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select size="small" fullWidth label="Filière" value={form.filiere} onChange={f('filiere')}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.85rem' } }}>
                {FILIERES.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
          {mode === 'annee' ? (
            <Button onClick={predict} disabled={loading} fullWidth variant="contained"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <TrendingUp />}
              sx={{
                mt: 2, borderRadius: '12px', textTransform: 'none', fontWeight: 700,
                background: `linear-gradient(135deg, ${ML_COLORS.m3} 0%, #f59e0b 100%)`,
                boxShadow: `0 4px 16px ${ML_COLORS.m3}40`,
                '&:hover': { transform: 'translateY(-1px)' },
              }}>
              {loading ? 'Prédiction en cours...' : 'Prédire la performance'}
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <TextField
                select size="small" label="Horizon"
                value={horizon}
                onChange={e => setHorizon(Number(e.target.value))}
                sx={{ minWidth: 110, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.85rem' } }}
              >
                {HORIZON_YEARS.filter(y => y > CURRENT_YEAR).map(y =>
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                )}
              </TextField>
              <Button onClick={projeter} disabled={projecting} fullWidth variant="contained"
                startIcon={projecting ? <CircularProgress size={16} color="inherit" /> : <Timeline />}
                sx={{
                  borderRadius: '12px', textTransform: 'none', fontWeight: 700,
                  background: `linear-gradient(135deg, ${ML_COLORS.m3} 0%, #f59e0b 100%)`,
                  '&:hover': { transform: 'translateY(-1px)' },
                }}>
                {projecting ? 'Projection...' : `Projeter jusqu'à ${horizon}`}
              </Button>
            </Box>
          )}
        </Grid>

        <Grid item xs={12} md={5}>
          {mode === 'annee' ? (
            <Box sx={{
              height: '100%', borderRadius: '14px',
              border: `1.5px dashed ${mentionCfg ? mentionCfg.color : ML_COLORS.m3}40`,
              background: mentionCfg ? `${mentionCfg.color}08` : `${ML_COLORS.m3}05`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              p: 2, minHeight: 200, transition: 'all 0.4s ease',
            }}>
              {error && (
                <Typography sx={{ fontSize: '0.8rem', color: ML_COLORS.rouge, textAlign: 'center' }}>
                  ⚠️ {error}
                </Typography>
              )}
              {!result && !error && (
                <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center' }}>
                  Saisissez les notes actuelles pour prédire la performance finale
                </Typography>
              )}
              {result && mentionCfg && (
              <Box sx={{ textAlign: 'center', width: '100%' }}>
                <Typography sx={{ fontSize: '2.8rem', mb: 0.5 }}>{mentionCfg.emoji}</Typography>
                <Jauge value={result.moyenne_finale_predite} max={20} color={mentionCfg.color} label="/ 20" size={100} />
                <Box sx={{ mt: 1.5 }}>
                  <Chip label={result.mention} size="small"
                    sx={{ fontWeight: 800, fontSize: '0.85rem',
                          background: `${mentionCfg.color}18`, color: mentionCfg.color,
                          border: `1.5px solid ${mentionCfg.color}40`, mb: 1 }} />
                </Box>
                <Divider sx={{ my: 1 }} />
                <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Moyenne finale estimée :{' '}
                  <b style={{ color: mentionCfg.color }}>{result.moyenne_finale_predite} / 20</b>
                </Typography>
                <LinearProgress variant="determinate" value={(result.moyenne_finale_predite / 20) * 100}
                  sx={{
                    mt: 1.5, height: 8, borderRadius: 4,
                    backgroundColor: '#e2e8f0',
                    '& .MuiLinearProgress-bar': { backgroundColor: mentionCfg.color, borderRadius: 4 },
                  }} />
                {/* Tendance + Fiabilité */}
                <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {result.tendance === 'hausse'
                      ? <TrendingUp sx={{ fontSize: '1rem', color: '#22c55e' }} />
                      : result.tendance === 'baisse'
                      ? <TrendingDown sx={{ fontSize: '1rem', color: '#ef4444' }} />
                      : <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>→</Typography>}
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700,
                      color: result.tendance === 'hausse' ? '#22c55e' : result.tendance === 'baisse' ? '#ef4444' : '#64748b' }}>
                      {result.tendance === 'hausse' ? 'En hausse' : result.tendance === 'baisse' ? 'En baisse' : 'Stable'}
                    </Typography>
                  </Box>
                  {result.fiabilite && (
                    <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      Fiabilité : <b style={{ color: mentionCfg.color }}>{result.fiabilite}%</b>
                    </Typography>
                  )}
                </Box>
                {/* Intervalle de confiance */}
                {result.intervalle && (
                  <Box sx={{ mt: 0.8, p: 1, borderRadius: '8px', background: `${mentionCfg.color}08`, border: `1px solid ${mentionCfg.color}20` }}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'center' }}>
                      Fourchette estimée : <b style={{ color: mentionCfg.color }}>{result.intervalle.min} — {result.intervalle.max} / 20</b>
                      <span style={{ color: '#94a3b8' }}> (±{result.intervalle.marge})</span>
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            </Box>
          ) : (
            /* ── Zone projection performance ── */
            <Box sx={{
              height: '100%', borderRadius: '14px', border: `1.5px dashed ${ML_COLORS.m3}30`,
              background: `${ML_COLORS.m3}05`, p: 2, minHeight: 200,
            }}>
              {projError && (
                <Typography sx={{ fontSize: '0.8rem', color: ML_COLORS.rouge, textAlign: 'center', p: 1 }}>
                  ⚠️ {projError}
                </Typography>
              )}
              {!projection.length && !projError && !projecting && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1 }}>
                  <Timeline sx={{ color: `${ML_COLORS.m3}60`, fontSize: 38 }} />
                  <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center' }}>
                    Sélectionnez l'horizon et cliquez sur <b>Projeter</b>
                  </Typography>
                </Box>
              )}
              {projecting && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1.5 }}>
                  <CircularProgress size={28} sx={{ color: ML_COLORS.m3 }} />
                  <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>Calcul de la projection…</Typography>
                </Box>
              )}
              {projection.length > 0 && (
                <Box>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: ML_COLORS.m3, mb: 1.5 }}>
                    Évolution des performances {CURRENT_YEAR} → {horizon}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                    {projection.map((p, i) => {
                      const barW = (p.moyenne / 20) * 100;
                      const isFirst = i === 0;
                      const prev = i > 0 ? projection[i - 1].moyenne : null;
                      const delta = prev !== null ? Math.round((p.moyenne - prev) * 10) / 10 : null;
                      return (
                        <Box key={p.annee}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', minWidth: 36 }}>
                                {p.annee}
                              </Typography>
                              {isFirst && (
                                <Chip label="base" size="small" sx={{ height: 16, fontSize: '0.6rem', background: `${ML_COLORS.m3}15`, color: ML_COLORS.m3, fontWeight: 700 }} />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                              {delta !== null && (
                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: delta >= 0 ? '#22c55e' : '#ef4444' }}>
                                  {delta >= 0 ? '+' : ''}{delta}
                                </Typography>
                              )}
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: p.couleur }}>
                                {p.moyenne.toFixed(1)}/20
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ position: 'relative', height: 8, borderRadius: 4, background: '#e2e8f0', overflow: 'hidden' }}>
                            <Box sx={{
                              position: 'absolute', left: 0, top: 0, bottom: 0,
                              width: `${barW}%`, borderRadius: 4,
                              background: p.couleur,
                              transition: 'width 0.6s ease',
                            }} />
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                  {projection.length >= 2 && (() => {
                    const first = projection[0].moyenne;
                    const last  = projection[projection.length - 1].moyenne;
                    const diff  = Math.round((last - first) * 10) / 10;
                    const isHausse = diff >= 0;
                    return (
                      <Box sx={{ mt: 1.5, p: 1.2, borderRadius: '10px', background: isHausse ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isHausse ? '#86efac' : '#fca5a5'}` }}>
                        <Typography sx={{ fontSize: '0.73rem', fontWeight: 700, color: isHausse ? '#15803d' : '#dc2626' }}>
                          {isHausse ? '📈 Tendance haussière' : '📉 Tendance baissière'} — {isHausse ? '+' : ''}{diff} pts sur {horizon - CURRENT_YEAR} an{horizon - CURRENT_YEAR > 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    );
                  })()}
                </Box>
              )}
            </Box>
          )}
        </Grid>

        {/* Détails complets — facteurs d'influence + conseil */}
        {mode === 'annee' && result && mentionCfg && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.5 }}>
              {/* Facteurs d'influence */}
              {result.facteurs?.length > 0 && (
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.84rem', color: '#334155', mb: 1.2 }}>
                    Facteurs d'influence sur la prédiction
                  </Typography>
                  <Grid container spacing={1}>
                    {result.facteurs.map((fac, i) => {
                      const impactColor = fac.impact === 'positif' ? '#15803d' : fac.impact === 'negatif' ? '#dc2626' : '#475569';
                      const impactBg    = fac.impact === 'positif' ? '#f0fdf4' : fac.impact === 'negatif' ? '#fef2f2' : '#f8fafc';
                      const impactBord  = fac.impact === 'positif' ? '#bbf7d0' : fac.impact === 'negatif' ? '#fecaca' : '#e2e8f0';
                      const impactIcon  = fac.impact === 'positif' ? '✅' : fac.impact === 'negatif' ? '❌' : '➡️';
                      return (
                        <Grid item xs={12} sm={6} key={i}>
                          <Box sx={{ p: 1.5, borderRadius: '10px', background: impactBg, border: `1px solid ${impactBord}` }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                              <Typography sx={{ fontSize: '0.88rem', lineHeight: 1, mt: 0.1 }}>{impactIcon}</Typography>
                              <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: impactColor }}>
                                  {fac.label}
                                </Typography>
                                <Typography sx={{ fontSize: '0.72rem', color: '#64748b', mt: 0.2, lineHeight: 1.5 }}>
                                  {fac.detail}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}
              {/* Conseil personnalisé */}
              {result.conseil && (
                <Box sx={{
                  p: 2, borderRadius: '12px',
                  background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                  border: '1px solid #fde68a',
                }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#92400e', mb: 0.5 }}>
                    💡 Conseil personnalisé
                  </Typography>
                  <Typography sx={{ fontSize: '0.79rem', color: '#78350f', lineHeight: 1.65 }}>
                    {result.conseil}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        )}
      </Grid>
    </MLCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// M2 — Vue étudiant : suis-je en risque ce semestre ? (auto-prédiction)
// prefilledData est calculé par le dashboard depuis les vraies données DB
// ═══════════════════════════════════════════════════════════════════════════
export function MLRisqueEtudiant({ prefilledData = null }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const GRAVITE = {
    haute:   { icon: '🔴', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
    moyenne: { icon: '🟠', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
    faible:  { icon: '🟡', color: '#eab308', bg: '#fefce8', border: '#fef08a' },
  };

  const ALERTE = {
    ROUGE:  { banner: '#fef2f2', bannerBorder: '#ef4444', titre: 'Vous êtes identifié(e) à risque ce semestre', icon: '⚠️' },
    ORANGE: { banner: '#fffbeb', bannerBorder: '#f59e0b', titre: 'Risque modéré détecté pour ce semestre',      icon: '⚡' },
    VERT:   { banner: '#f0fdf4', bannerBorder: '#22c55e', titre: 'Aucun risque détecté pour ce semestre',       icon: '✅' },
  };

  const runPrediction = (data) => {
    setLoading(true); setError(''); setResult(null);
    mlService.predireRisque(data)
      .then(r => setResult(r.data))
      .catch(e => setError(e.response?.data?.details || 'API ML non disponible. Vérifiez que le serveur FastAPI est démarré (port 5001).'))
      .finally(() => setLoading(false));
  };

  // Lancer la prédiction automatiquement dès que les données réelles arrivent
  const dataKey = JSON.stringify(prefilledData);
  useEffect(() => { if (prefilledData) runPrediction(prefilledData); }, [dataKey]);

  const alerteCfg = result ? ALERTE[result.niveau_alerte] : null;

  return (
    <MLCard
      title="Mon évaluation de risque — Ce semestre"
      subtitle="Modèle M2 · Régression Logistique · Recall=94.7% · Basé sur vos données académiques réelles"
      icon="🎯" color={ML_COLORS.m2}
    >
      {/* Chargement données DB */}
      {!prefilledData && !error && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5, gap: 2 }}>
          <CircularProgress sx={{ color: ML_COLORS.m2 }} size={40} />
          <Typography sx={{ fontSize: '0.86rem', color: '#94a3b8' }}>
            Chargement de vos données académiques...
          </Typography>
        </Box>
      )}

      {/* Prédiction en cours */}
      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5, gap: 2 }}>
          <CircularProgress sx={{ color: ML_COLORS.m2 }} size={48} />
          <Typography sx={{ fontSize: '0.88rem', color: '#64748b' }}>
            Analyse de votre situation académique en cours...
          </Typography>
        </Box>
      )}

      {/* Erreur */}
      {!loading && error && (
        <Box sx={{ p: 2.5, borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca',
                   display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <Typography sx={{ fontSize: '1.3rem' }}>⚠️</Typography>
          <Box>
            <Typography sx={{ fontSize: '0.85rem', color: ML_COLORS.rouge, fontWeight: 700 }}>
              Analyse temporairement indisponible
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#b91c1c', mt: 0.3 }}>{error}</Typography>
          </Box>
        </Box>
      )}

      {/* Résultat */}
      {!loading && result && alerteCfg && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* Bannière verdict */}
          <Box sx={{
            p: 3, borderRadius: '16px',
            background: alerteCfg.banner,
            border: `2.5px solid ${alerteCfg.bannerBorder}`,
            display: 'flex', alignItems: 'center', gap: 2.5,
          }}>
            <Typography sx={{ fontSize: '3rem', lineHeight: 1 }}>{alerteCfg.icon}</Typography>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, fontSize: '1.05rem', color: result.couleur, lineHeight: 1.3 }}>
                {alerteCfg.titre}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.2 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>Probabilité de risque :</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: '1rem', color: result.couleur }}>
                  {(result.probabilite * 100).toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate" value={result.probabilite * 100}
                sx={{
                  mt: 0.8, height: 9, borderRadius: 4,
                  backgroundColor: '#e2e8f0',
                  '& .MuiLinearProgress-bar': { backgroundColor: result.couleur, borderRadius: 4 },
                }}
              />
            </Box>
          </Box>

          {/* Pourquoi ce résultat */}
          {result.facteurs_risque?.length > 0 && (
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#334155', mb: 1.5 }}>
                Pourquoi ce résultat ?
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {result.facteurs_risque.map((fac, i) => {
                  const cfg = GRAVITE[fac.gravite] || GRAVITE.faible;
                  return (
                    <Box key={i} sx={{
                      p: 1.8, borderRadius: '12px',
                      background: cfg.bg, border: `1px solid ${cfg.border}`,
                      display: 'flex', gap: 1.5, alignItems: 'flex-start',
                    }}>
                      <Typography sx={{ fontSize: '1.1rem', lineHeight: 1, mt: 0.15 }}>{cfg.icon}</Typography>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: cfg.color }}>
                          {fac.facteur}
                        </Typography>
                        <Typography sx={{ fontSize: '0.76rem', color: '#64748b', mt: 0.3, lineHeight: 1.5 }}>
                          {fac.detail}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Aucun facteur = bonne nouvelle */}
          {result.facteurs_risque?.length === 0 && (
            <Box sx={{ p: 2, borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <Typography sx={{ fontSize: '0.84rem', color: '#166534', fontWeight: 600 }}>
                ✅ Aucun facteur de risque significatif détecté. Continuez sur cette lancée !
              </Typography>
            </Box>
          )}

          {/* Conseil personnalisé */}
          {result.conseil && (
            <Box sx={{
              p: 2.2, borderRadius: '12px',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              border: '1px solid #bae6fd',
            }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#0369a1', mb: 0.6 }}>
                💡 Conseil personnalisé
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: '#0c4a6e', lineHeight: 1.65 }}>
                {result.conseil}
              </Typography>
            </Box>
          )}

          {/* Bouton actualiser */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button size="small" startIcon={<Refresh />}
              onClick={() => prefilledData && runPrediction(prefilledData)}
              sx={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'none',
                   '&:hover': { color: ML_COLORS.m2 } }}>
              Actualiser l'analyse
            </Button>
          </Box>
        </Box>
      )}
    </MLCard>
  );
}
// ═══════════════════════════════════════════════════════════════════════════
// Vue étudiant — M3 performance + M2 risque + boutons detail + alertes
// prefilledData = { m2: {...}, m3: {...} }   alertes = dashData.alertes
// ═══════════════════════════════════════════════════════════════════════════
export function MLPredictionsEtudiant({ prefilledData = null, alertes = [] }) {
  const [risque,  setRisque]  = useState(null);
  const [perf,    setPerf]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [detail,  setDetail]  = useState(null);
  const dataKey = JSON.stringify(prefilledData);

  useEffect(() => {
    if (!prefilledData?.m2 || !prefilledData?.m3) return;
    setLoading(true); setError('');
    Promise.all([
      mlService.predireRisque(prefilledData.m2),
      mlService.predirePerformance(prefilledData.m3),
    ])
      .then(([r2, r3]) => {
        const r2d = { ...r2.data };
        const r3d = r3.data;
        // Coherence: predicted avg < 10 => risk must be at least ORANGE
        if (r3d.moyenne_finale_predite < 10 && r2d.probabilite < 0.55) {
          r2d.a_risque    = 1;
          r2d.probabilite = 0.62;
          r2d.niveau_alerte  = 'ORANGE';
          r2d.couleur        = '#f59e0b';
          r2d.interpretation = 'A risque';
          if (!r2d.conseil)
            r2d.conseil = "Ta moyenne predite est inferieure a 10/20. Consulte ton enseignant ou tuteur des maintenant pour etablir un plan de rattrapage.";
          if (!r2d.facteurs_risque?.length)
            r2d.facteurs_risque = [{
              facteur: 'Moyenne predite insuffisante',
              detail:  `Le modele predit une note finale de ${r3d.moyenne_finale_predite}/20 — en dessous de la barre de validation (10/20)`,
              gravite: 'haute',
            }];
        }
        setRisque(r2d);
        setPerf(r3d);
      })
      .catch(() => setError('Predictions indisponibles — verifiez que FastAPI est demarree (port 5001)'))
      .finally(() => setLoading(false));
  }, [dataKey]);

  const progression = perf && prefilledData?.m3
    ? Math.round((perf.moyenne_finale_predite - prefilledData.m3.moy_semestre_prec) * 10) / 10
    : null;

  const mainFactor = risque?.facteurs_risque?.[0];

  const MENTION_C = {
    'Tres bien': '#22c55e', 'Bien': '#3b82f6', 'Assez bien': '#22c55e',
    'Passable': '#f59e0b', 'Insuffisant': '#ef4444',
  };
  const getMC = (mention) => MENTION_C[mention] || '#22c55e';

  const GRAVITE_CFG = {
    haute:   { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.22)',  icon: 'circle-red' },
    moyenne: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)', icon: 'circle-orange' },
    faible:  { color: '#eab308', bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.22)',  icon: 'circle-yellow' },
  };
  const getGIcon = (g) => g === 'haute' ? '🔴' : g === 'moyenne' ? '🟠' : '🟡';

  const BG     = '#0c1220';
  const BORDER = '#1e2d45';
  const mc     = perf ? getMC(perf.mention) : '#22c55e';
  const rc     = risque?.couleur || '#ef4444';

  const DlgPaper = {
    PaperProps: {
      sx: { borderRadius: '20px', background: '#0d1117', border: '1px solid #1e293b',
            boxShadow: '0 32px 80px rgba(0,0,0,0.9)' },
    },
  };

  const DataRow = ({ label, val }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between',
               px: 1.5, py: 0.9, borderRadius: '8px', background: '#161f30' }}>
      <Typography sx={{ fontSize: '0.76rem', color: '#64748b' }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.76rem', color: '#e2e8f0', fontWeight: 600 }}>{val}</Typography>
    </Box>
  );

  const DlgLabel = ({ children }) => (
    <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569',
                      textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.2 }}>
      {children}
    </Typography>
  );

  return (
    <>
      {/* CARTE PRINCIPALE */}
      <Box sx={{
        borderRadius: '22px', overflow: 'hidden',
        background: BG, border: `1px solid ${BORDER}`,
        boxShadow: '0 12px 48px rgba(0,0,0,0.55)',
      }}>
        {/* Header */}
        <Box sx={{
          px: 2.5, py: 1.8,
          background: 'linear-gradient(135deg, rgba(30,58,138,0.35) 0%, transparent 70%)',
          borderBottom: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
          <Box sx={{ width: 34, height: 34, borderRadius: '10px',
                     background: 'rgba(59,130,246,0.14)', border: '1px solid rgba(59,130,246,0.22)',
                     display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Psychology sx={{ color: '#93c5fd', fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.88rem' }}>
              Tes predictions personnelles
            </Typography>
            <Typography sx={{ fontSize: '0.63rem', color: '#334155' }}>
              Intelligence artificielle · donnees academiques reelles
            </Typography>
          </Box>
          <Chip label="IA" size="small" sx={{
            ml: 'auto', background: 'rgba(59,130,246,0.18)',
            color: '#60a5fa', fontWeight: 800, fontSize: '0.6rem',
            border: '1px solid rgba(59,130,246,0.28)', borderRadius: '6px', height: 20,
          }} />
        </Box>

        {/* Loading */}
        {(loading || (!prefilledData && !error)) && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 2 }}>
            <CircularProgress size={34} sx={{ color: '#3b82f6' }} />
            <Typography sx={{ fontSize: '0.8rem', color: '#334155' }}>
              {!prefilledData ? 'Chargement des donnees academiques...' : 'Calcul des predictions...'}
            </Typography>
          </Box>
        )}

        {/* Erreur */}
        {!loading && error && (
          <Box sx={{ m: 2.5, p: 2, borderRadius: '12px',
                     background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <Typography sx={{ fontSize: '0.78rem', color: '#fca5a5' }}>⚠️ {error}</Typography>
          </Box>
        )}

        {/* Resultats */}
        {!loading && perf && risque && (
          <>
            <Grid container>
              {/* Carte M3 Performance */}
              <Grid item xs={12} sm={6}>
                <Box sx={{
                  p: 2.5,
                  borderRight: { sm: `1px solid ${BORDER}` },
                  borderBottom: { xs: `1px solid ${BORDER}`, sm: 'none' },
                  position: 'relative', overflow: 'hidden',
                }}>
                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                             background: `linear-gradient(90deg, ${mc} 0%, transparent 80%)` }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2.2, mt: 0.5 }}>
                    <Box sx={{ width: 38, height: 38, borderRadius: '50%',
                               background: `${mc}18`, border: `1.5px solid ${mc}35`,
                               display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUp sx={{ color: mc, fontSize: 19 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.85rem', lineHeight: 1.2 }}>
                        Ta note finale predite
                      </Typography>
                      <Typography sx={{ fontSize: '0.63rem', color: '#334155', mt: 0.2 }}>
                        Estimation IA · basee sur tes controles
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.6, mb: 1.4 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '3.2rem', lineHeight: 1, color: mc, letterSpacing: '-1px' }}>
                      {perf.moyenne_finale_predite}
                    </Typography>
                    <Typography sx={{ fontSize: '0.88rem', color: '#334155', fontWeight: 600, mb: 0.5 }}>/ 20</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={(perf.moyenne_finale_predite / 20) * 100}
                    sx={{ height: 5, borderRadius: 3, mb: 0.9, backgroundColor: `${mc}14`,
                         '& .MuiLinearProgress-bar': { backgroundColor: mc, borderRadius: 3 } }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                    <Chip label={perf.mention} size="small" sx={{
                      background: `${mc}18`, color: mc,
                      border: `1px solid ${mc}35`, fontWeight: 700, fontSize: '0.68rem', height: 22,
                    }} />
                    {progression !== null && Math.abs(progression) > 0 && (
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700,
                                       color: progression >= 0 ? '#4ade80' : '#f87171' }}>
                        {progression >= 0 ? '▲ +' : '▼ '}{progression} pts vs moy. actuelle
                      </Typography>
                    )}
                  </Box>
                  <Button fullWidth size="small" variant="outlined" onClick={() => setDetail('m3')}
                    sx={{
                      borderColor: `${mc}40`, color: mc, borderRadius: '12px',
                      textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, py: 0.8,
                      '&:hover': { background: `${mc}10`, borderColor: mc, transform: 'translateY(-1px)' },
                      transition: 'all 0.2s',
                    }}>
                    Voir l&apos;analyse detaillee →
                  </Button>
                </Box>
              </Grid>

              {/* Carte M2 Risque */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2.5, position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                             background: `linear-gradient(90deg, ${rc} 0%, transparent 80%)` }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2.2, mt: 0.5 }}>
                    <Box sx={{ width: 38, height: 38, borderRadius: '50%',
                               background: `${rc}18`, border: `1.5px solid ${rc}35`,
                               display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {risque.a_risque
                        ? <Warning sx={{ color: rc, fontSize: 19 }} />
                        : <CheckCircle sx={{ color: rc, fontSize: 19 }} />}
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.85rem', lineHeight: 1.2 }}>
                        {risque.a_risque ? "Risque d'echec" : 'Aucun risque'}
                      </Typography>
                      <Typography sx={{ fontSize: '0.63rem', color: '#334155', mt: 0.2 }}>
                        Analyse de ton parcours academique
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.6, mb: 1.4 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '3.2rem', lineHeight: 1, color: rc, letterSpacing: '-1px' }}>
                      {(risque.probabilite * 100).toFixed(0)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.88rem', color: '#334155', fontWeight: 600, mb: 0.5 }}>%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={risque.probabilite * 100}
                    sx={{ height: 5, borderRadius: 3, mb: 0.9, backgroundColor: `${rc}14`,
                         '& .MuiLinearProgress-bar': { backgroundColor: rc, borderRadius: 3 } }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                    <Chip label={`Alerte ${risque.niveau_alerte}`} size="small" sx={{
                      background: `${rc}18`, color: rc,
                      border: `1px solid ${rc}35`, fontWeight: 700, fontSize: '0.68rem', height: 22,
                    }} />
                    {mainFactor && (
                      <Typography sx={{ fontSize: '0.63rem', color: '#475569', maxWidth: 108, textAlign: 'right', lineHeight: 1.3 }}>
                        {mainFactor.facteur}
                      </Typography>
                    )}
                  </Box>
                  <Button fullWidth size="small" variant="outlined" onClick={() => setDetail('m2')}
                    sx={{
                      borderColor: `${rc}40`, color: rc, borderRadius: '12px',
                      textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, py: 0.8,
                      '&:hover': { background: `${rc}10`, borderColor: rc, transform: 'translateY(-1px)' },
                      transition: 'all 0.2s',
                    }}>
                    Voir l&apos;analyse detaillee →
                  </Button>
                </Box>
              </Grid>
            </Grid>

            {/* Alertes */}
            {alertes.length > 0 && (
              <Box sx={{ px: 2, pb: 2, pt: 0.5, borderTop: `1px solid ${BORDER}` }}>
                <Typography sx={{ fontSize: '0.6rem', color: '#2d3f55', fontWeight: 700,
                                  textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.8, mt: 1 }}>
                  Alertes
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {alertes.slice(0, 3).map((a, i) => {
                    const c = a.type === 'warning' ? '#fb923c' : a.type === 'success' ? '#4ade80' : '#93c5fd';
                    return (
                      <Box key={i} sx={{
                        px: 1.5, py: 0.9, borderRadius: '9px',
                        background: `${c}07`, border: `1px solid ${c}1e`,
                        display: 'flex', alignItems: 'flex-start', gap: 1,
                      }}>
                        <Typography sx={{ fontSize: '0.8rem', lineHeight: 1, mt: 0.05 }}>
                          {a.type === 'warning' ? '🔔' : a.type === 'success' ? '✓' : 'ℹ️'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, lineHeight: 1.4, color: c }}>
                          {a.message || a.titre}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* DIALOGUE M3 Performance */}
      <Dialog open={detail === 'm3'} onClose={() => setDetail(null)} maxWidth="sm" fullWidth {...DlgPaper}>
        <Box sx={{ p: 3, borderBottom: '1px solid #1e293b', background: `linear-gradient(135deg, ${mc}12 0%, transparent 60%)` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Box sx={{ width: 42, height: 42, borderRadius: '12px', background: `${mc}18`, border: `1.5px solid ${mc}35`,
                         display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp sx={{ color: mc, fontSize: 21 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 900, color: '#f1f5f9', fontSize: '1rem' }}>Analyse de ta performance</Typography>
                <Typography sx={{ fontSize: '0.7rem', color: '#475569' }}>Estimation de ta note finale de semestre</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setDetail(null)}
              sx={{ color: '#475569', '&:hover': { color: '#f1f5f9', background: '#1e293b' } }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mt: 2.5 }}>
            <Typography sx={{ fontWeight: 900, fontSize: '2.8rem', color: mc, lineHeight: 1, letterSpacing: '-1px' }}>
              {perf?.moyenne_finale_predite}
            </Typography>
            <Box>
              <Typography sx={{ fontSize: '0.78rem', color: '#475569' }}>/ 20 · Moyenne finale predite</Typography>
              <Chip label={perf?.mention} size="small" sx={{
                mt: 0.5, background: `${mc}20`, color: mc, border: `1px solid ${mc}40`, fontWeight: 700, fontSize: '0.7rem',
              }} />
            </Box>
            {progression !== null && (
              <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                <Typography sx={{ fontSize: '0.65rem', color: '#475569' }}>vs ta moyenne actuelle</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: '1.15rem', color: progression >= 0 ? '#4ade80' : '#f87171' }}>
                  {progression >= 0 ? '+' : ''}{progression} pts
                </Typography>
              </Box>
            )}
          </Box>
          <LinearProgress variant="determinate" value={perf ? (perf.moyenne_finale_predite / 20) * 100 : 0}
            sx={{ mt: 1.5, height: 6, borderRadius: 3, backgroundColor: `${mc}15`,
                 '& .MuiLinearProgress-bar': { backgroundColor: mc, borderRadius: 3 } }} />
        </Box>
        <DialogContent sx={{ p: 3 }}>
          {/* Explication en langage simple */}
          <Box sx={{ mb: 2.5, p: 2, borderRadius: '12px', background: 'rgba(147,197,253,0.07)', border: '1px solid rgba(147,197,253,0.18)' }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#60a5fa', mb: 0.5 }}>Comment cette prediction est calculee ?</Typography>
            <Typography sx={{ fontSize: '0.77rem', color: '#93c5fd', lineHeight: 1.7 }}>
              Notre modele analyse tes notes CC1, CC2 et CC3 ainsi que ta moyenne du semestre precedent pour estimer ta note finale. Plus tes controles sont bons, plus la prediction sera elevee. Cette estimation est mise a jour a chaque fois que tu reviens sur cette page.
            </Typography>
          </Box>
          {prefilledData?.m3 && (
            <Box sx={{ mb: 3 }}>
              <DlgLabel>Tes controles continus (donnees utilisees)</DlgLabel>
              <Grid container spacing={1.2}>
                {[
                  { label: 'CC1', val: prefilledData.m3.note_cc1 },
                  { label: 'CC2', val: prefilledData.m3.note_cc2 },
                  { label: 'CC3', val: prefilledData.m3.note_cc3 },
                ].map(({ label, val }) => {
                  const c = val >= 14 ? '#4ade80' : val >= 10 ? '#fb923c' : '#f87171';
                  return (
                    <Grid item xs={4} key={label}>
                      <Box sx={{ p: 1.8, borderRadius: '12px', background: `${c}10`, border: `1px solid ${c}28`, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.65rem', color: '#475569', mb: 0.4 }}>{label}</Typography>
                        <Typography sx={{ fontWeight: 900, fontSize: '1.6rem', color: c, lineHeight: 1 }}>{val}</Typography>
                        <Typography sx={{ fontSize: '0.58rem', color: '#334155', mt: 0.2 }}>/ 20</Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
              {(() => {
                const trend = prefilledData.m3.note_cc3 - prefilledData.m3.note_cc1;
                const tc = trend >= 0 ? '#4ade80' : '#f87171';
                return (
                  <Box sx={{ mt: 1.2, px: 2, py: 1.1, borderRadius: '10px', background: `${tc}08`, border: `1px solid ${tc}20` }}>
                    <Typography sx={{ fontSize: '0.76rem', color: tc, fontWeight: 600 }}>
                      {trend >= 0 ? 'Tendance positive' : 'Tendance en baisse'} — {trend >= 0 ? '+' : ''}{Math.round(trend * 10) / 10} pts entre CC1 et CC3
                    </Typography>
                  </Box>
                );
              })()}
            </Box>
          )}
          <Divider sx={{ borderColor: '#1e293b', mb: 3 }} />
          <Box>
            <DlgLabel>Donnees analysees par le modele</DlgLabel>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {prefilledData?.m3 && [
                { label: 'Moyenne semestre precedent', val: `${prefilledData.m3.moy_semestre_prec} / 20` },
                { label: "Taux d'absence actuel", val: `${prefilledData.m3.taux_absence_actuel}%` },
                { label: 'Matieres sous la moyenne', val: `${prefilledData.m3.nb_matieres_sous_10}` },
                { label: 'Evolution CC1 -> CC3', val: `${prefilledData.m3.pente_evolution >= 0 ? '+' : ''}${prefilledData.m3.pente_evolution} pts` },
                { label: 'Niveau / Filiere', val: `${prefilledData.m3.niveau} · ${prefilledData.m3.filiere}` },
              ].map(r => <DataRow key={r.label} {...r} />)}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* DIALOGUE M2 Risque */}
      <Dialog open={detail === 'm2'} onClose={() => setDetail(null)} maxWidth="sm" fullWidth {...DlgPaper}>
        <Box sx={{ p: 3, borderBottom: '1px solid #1e293b', background: `linear-gradient(135deg, ${rc}10 0%, transparent 60%)` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Box sx={{ width: 42, height: 42, borderRadius: '12px', background: `${rc}18`, border: `1.5px solid ${rc}35`,
                         display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {risque?.a_risque ? <Warning sx={{ color: rc, fontSize: 21 }} /> : <CheckCircle sx={{ color: rc, fontSize: 21 }} />}
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 900, color: '#f1f5f9', fontSize: '1rem' }}>
                  {risque?.a_risque ? "Analyse du risque d'echec" : 'Analyse de ta situation'}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: '#475569' }}>Identification des facteurs de risque dans ton parcours</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setDetail(null)}
              sx={{ color: '#475569', '&:hover': { color: '#f1f5f9', background: '#1e293b' } }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mt: 2.5 }}>
            <Typography sx={{ fontWeight: 900, fontSize: '2.8rem', color: rc, lineHeight: 1, letterSpacing: '-1px' }}>
              {risque ? (risque.probabilite * 100).toFixed(0) : 0}%
            </Typography>
            <Box>
              <Typography sx={{ fontSize: '0.78rem', color: '#475569' }}>de probabilite de risque</Typography>
              <Chip label={`Alerte ${risque?.niveau_alerte}`} size="small" sx={{
                mt: 0.5, background: `${rc}20`, color: rc, border: `1px solid ${rc}40`, fontWeight: 700, fontSize: '0.7rem',
              }} />
            </Box>
          </Box>
          <LinearProgress variant="determinate" value={risque ? risque.probabilite * 100 : 0}
            sx={{ mt: 1.5, height: 6, borderRadius: 3, backgroundColor: `${rc}15`,
                 '& .MuiLinearProgress-bar': { backgroundColor: rc, borderRadius: 3 } }} />
        </Box>
        <DialogContent sx={{ p: 3 }}>
          {/* Explication en langage simple */}
          <Box sx={{ mb: 2.5, p: 2, borderRadius: '12px', background: 'rgba(147,197,253,0.07)', border: '1px solid rgba(147,197,253,0.18)' }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#60a5fa', mb: 0.5 }}>Qu&apos;est-ce que ce score signifie ?</Typography>
            <Typography sx={{ fontSize: '0.77rem', color: '#93c5fd', lineHeight: 1.7 }}>
              Ce pourcentage represente la probabilite que tu sois en difficulte academique. 0% = aucun risque detecte, 100% = situation tres preoccupante. Les facteurs ci-dessous expliquent pourquoi ce score a ete calcule et ce que tu peux faire pour l&apos;ameliorer.
            </Typography>
          </Box>
          <Box sx={{ mb: 3 }}>
            <DlgLabel>Facteurs identifies dans ton parcours</DlgLabel>
            {risque?.facteurs_risque?.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {risque.facteurs_risque.map((fac, i) => {
                  const cfg = GRAVITE_CFG[fac.gravite] || GRAVITE_CFG.faible;
                  return (
                    <Box key={i} sx={{ p: 1.8, borderRadius: '12px', background: cfg.bg, border: `1px solid ${cfg.border}`,
                                       display: 'flex', gap: 1.3, alignItems: 'flex-start' }}>
                      <Typography sx={{ fontSize: '1.05rem', lineHeight: 1, mt: 0.1 }}>{getGIcon(fac.gravite)}</Typography>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: cfg.color }}>{fac.facteur}</Typography>
                        <Typography sx={{ fontSize: '0.74rem', color: '#64748b', mt: 0.3, lineHeight: 1.55 }}>{fac.detail}</Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ p: 2, borderRadius: '12px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
                <Typography sx={{ fontSize: '0.82rem', color: '#4ade80', fontWeight: 600 }}>
                  Aucun facteur de risque significatif detecte. Continue comme ca !
                </Typography>
              </Box>
            )}
          </Box>
          {risque?.conseil && (
            <Box sx={{ mb: 3, p: 2.2, borderRadius: '12px', background: 'rgba(147,197,253,0.07)', border: '1px solid rgba(147,197,253,0.18)' }}>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#60a5fa', mb: 0.6 }}>Conseil personnalise</Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#93c5fd', lineHeight: 1.65 }}>{risque.conseil}</Typography>
            </Box>
          )}
          <Divider sx={{ borderColor: '#1e293b', mb: 3 }} />
          <Box>
            <DlgLabel>Donnees analysees par le modele</DlgLabel>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {prefilledData?.m2 && [
                { label: 'Moyenne semestre precedent', val: `${prefilledData.m2.moy_semestre_prec} / 20` },
                { label: 'CC1 / CC2 / CC3', val: `${prefilledData.m2.note_cc1} · ${prefilledData.m2.note_cc2} · ${prefilledData.m2.note_cc3}` },
                { label: "Taux d'absence", val: `${prefilledData.m2.taux_absence}%` },
                { label: 'Echecs anterieurs', val: `${prefilledData.m2.nb_echecs_anterieurs} matiere(s)` },
                { label: 'Participation', val: `${prefilledData.m2.participation} / 10` },
                { label: 'Evolution CC1 -> CC3', val: `${prefilledData.m2.evolution_notes >= 0 ? '+' : ''}${prefilledData.m2.evolution_notes} pts` },
                { label: 'Niveau / Filiere', val: `${prefilledData.m2.niveau} · ${prefilledData.m2.filiere}` },
              ].map(r => <DataRow key={r.label} {...r} />)}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Section ML complète — header + sélection des modèles
// ═══════════════════════════════════════════════════════════════════════════
export function MLSection({ modeles = ['m1', 'm2', 'm3'], defaultData = {} }) {
  return (
    <Box sx={{ mt: 4 }}>
      {/* Header section */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5, mb: 3,
        px: 2, py: 1.5,
        borderRadius: '14px',
        background: 'linear-gradient(135deg, #1e3a8a12 0%, #3b82f610 100%)',
        border: '1.5px solid #1e3a8a18',
      }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: '12px',
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Psychology sx={{ color: '#fff', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 900, color: '#0f172a', fontSize: '1.05rem' }}>
            Prédictions Machine Learning
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
            Modèles entraînés sur les données académiques tunisiennes · FastAPI port 5001
          </Typography>
        </Box>
        <Chip label="IA" size="small"
          sx={{ ml: 'auto', fontWeight: 800, background: '#1e40af', color: '#fff',
                fontSize: '0.7rem', borderRadius: '8px' }} />
      </Box>

      {/* Modèles */}
      <Grid container spacing={3}>
        {modeles.includes('m1') && (
          <Grid item xs={12}>
            <MLReussite defaultData={defaultData.m1 || {}} />
          </Grid>
        )}
        {modeles.includes('m2') && (
          <Grid item xs={12}>
            <MLRisque defaultData={defaultData.m2 || {}} />
          </Grid>
        )}
        {modeles.includes('m3') && (
          <Grid item xs={12}>
            <MLPerformance defaultData={defaultData.m3 || {}} />
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
