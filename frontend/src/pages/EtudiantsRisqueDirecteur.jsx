import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, TextField, InputAdornment, keyframes,
  Collapse, Dialog, DialogContent, Grid, Button, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import {
  ExpandMore, ExpandLess, Search, Close, ArrowForward, ArrowBack, FileDownload,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import api from '../services/api';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const C = {
  navy:    '#1A3A6B',
  blue:    '#4D9FFF',
  blueL:   '#EAF4FF',
  green:   '#06D6A0',
  greenL:  '#E6FAF5',
  orange:  '#FF6B35',
  orangeL: '#FFF4E6',
  red:     '#EF4444',
  redL:    '#FEE2E2',
  purple:  '#7B2CBF',
  purpleL: '#F3E8FF',
  slate:   '#64748B',
  border:  '#E5E7EB',
};

const riskColor = t => t > 30 ? C.red    : t > 15 ? C.orange : C.green;
const riskBg    = t => t > 30 ? C.redL   : t > 15 ? C.orangeL : C.greenL;
const riskLabel = t => t > 30 ? 'Élevé'  : t > 15 ? 'Modéré'  : 'Faible';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <Box sx={{ background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 2, p: 1.5, minWidth: 160 }}>
      <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: C.navy, mb: 0.5 }}>{d.full}</Typography>
      <Typography sx={{ fontSize: '0.78rem', color: riskColor(d.taux) }}>
        <b>{d.taux}%</b> à risque
      </Typography>
      <Typography sx={{ fontSize: '0.72rem', color: C.slate }}>{d.nb_risque} / {d.total} étudiants</Typography>
    </Box>
  );
};

export default function EtudiantsRisqueDirecteur() {
  const navigate = useNavigate();

  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [view,       setView]       = useState('departement');
  const [search,     setSearch]     = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [modal,      setModal]      = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    api.get('/etablissements/directeur/risque-global', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const depts = data?.departements || [];
  const specs  = data?.specialites  || [];

  const filteredDepts = useMemo(() =>
    depts.filter(d => d.nom_departement.toLowerCase().includes(search.toLowerCase())
                   || d.code_departement.toLowerCase().includes(search.toLowerCase())),
    [depts, search]);

  const filteredSpecs = useMemo(() =>
    specs.filter(s => s.nom_specialite.toLowerCase().includes(search.toLowerCase())
                   || s.code_specialite?.toLowerCase().includes(search.toLowerCase())
                   || s.nom_departement?.toLowerCase().includes(search.toLowerCase())),
    [specs, search]);

  const specsByDept = useMemo(() => {
    const map = {};
    specs.forEach(s => {
      if (!map[s.id_departement]) map[s.id_departement] = [];
      map[s.id_departement].push(s);
    });
    return map;
  }, [specs]);

  const chartData = useMemo(() => {
    const source = view === 'departement' ? depts : specs;
    return [...source]
      .sort((a, b) => b.taux_risque - a.taux_risque)
      .slice(0, 10)
      .map(r => ({
        name: r.code_departement || r.code_specialite || '',
        full: r.nom_departement  || r.nom_specialite  || '',
        taux: r.taux_risque,
        nb_risque: r.nb_risque,
        total: r.total_etudiants,
      }));
  }, [view, depts, specs]);

  const exportCSV = () => {
    if (view === 'departement') {
      const h = ['Département', 'Code', 'Total', 'À risque', 'Critiques', 'Attention', 'Taux (%)'];
      const rows = filteredDepts.map(d => [`"${d.nom_departement}"`, d.code_departement, d.total_etudiants, d.nb_risque, d.nb_critique, d.nb_attention, d.taux_risque]);
      download(h, rows, `risque_dept_${data?.etablissement?.code_etablissement || ''}`);
    } else {
      const h = ['Spécialité', 'Code', 'Département', 'Total', 'À risque', 'Critiques', 'Attention', 'Taux (%)'];
      const rows = filteredSpecs.map(s => [`"${s.nom_specialite}"`, s.code_specialite, `"${s.nom_departement}"`, s.total_etudiants, s.nb_risque, s.nb_critique, s.nb_attention, s.taux_risque]);
      download(h, rows, `risque_spec_${data?.etablissement?.code_etablissement || ''}`);
    }
  };

  const download = (headers, rows, name) => {
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${name}_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: C.blue }} /></Box>;
  }

  const s    = data?.stats         || {};
  const etab = data?.etablissement || {};

  const kpis = [
    { label: 'Étudiants à risque',       value: s.total_risque   ?? '—', sub: `sur ${(s.total_etudiants || 0).toLocaleString('fr-TN')} inscrits`, color: C.red,    bg: 'linear-gradient(135deg,#EF444408,#EF444415)', icon: '⚠️' },
    { label: 'Taux de risque',            value: `${s.taux_moyen ?? 0}%`, sub: 'Étudiants avec moy. < 10',               color: C.orange, bg: 'linear-gradient(135deg,#FF6B3508,#FF6B3515)', icon: '📊' },
    { label: 'Cas critiques (moy < 7)',   value: s.total_critique ?? '—', sub: 'Nécessitent intervention urgente',        color: C.red,    bg: 'linear-gradient(135deg,#EF444408,#EF444415)', icon: '🔴' },
    { label: 'Départements en alerte',    value: s.nb_alerte      ?? '—', sub: 'Taux risque > 20%',                      color: C.purple, bg: 'linear-gradient(135deg,#7B2CBF08,#7B2CBF15)', icon: '🏢' },
  ];

  return (
    <Box sx={{ animation: `${fadeUp} 0.5s ease-out` }}>

      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: '#fff', border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 2, background: '#FFF1F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>
            ⚠️
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1F2937', mb: 0.5 }}>
              Étudiants à Risque — {etab.nom_etablissement || 'Mon Établissement'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {etab.code_etablissement && (
                <Chip label={etab.code_etablissement}
                  sx={{ background: C.blueL, color: C.blue, fontWeight: 700, fontSize: '0.75rem', borderRadius: '8px', height: 22 }} />
              )}
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                {s.total_risque
                  ? `${s.total_risque.toLocaleString('fr-TN')} étudiants à risque · taux ${s.taux_moyen}%`
                  : 'Analyse par département et spécialité'}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Exporter en CSV">
            <IconButton onClick={exportCSV}
              sx={{ width: 44, height: 44, borderRadius: '14px', background: '#10B981', color: '#fff',
                '&:hover': { background: '#059669', transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(16,185,129,0.5)' } }}>
              <FileDownload sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Retour au tableau de bord">
            <IconButton onClick={() => navigate('/dashboard/directeur')}
              sx={{ width: 44, height: 44, borderRadius: '14px', background: '#F0F4FF', border: `2px solid ${C.blue}40`, color: C.blue,
                '&:hover': { background: `${C.blue}20`, transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${C.blue}25` } }}>
              <ArrowBack sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ══ KPI CARDS ═══════════════════════════════════════════ */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpis.map((k, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ borderRadius: 3, border: '1.5px solid #EAF4FF', background: k.bg }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, background: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                    {k.icon}
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>{k.label}</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E3A8A' }}>
                  {typeof k.value === 'number' ? k.value.toLocaleString('fr-TN') : k.value}
                </Typography>
                <Typography variant="caption" sx={{ color: C.slate }}>{k.sub}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ══ CHART ════════════════════════════════════════════════ */}
      {chartData.length > 0 && (
        <Card sx={{ borderRadius: '20px', border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', mb: 3, overflow: 'hidden', background: '#fff' }}>
          <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, background: '#FFF1F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                📊
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#1F2937' }}>
                  Top {chartData.length} — taux de risque par {view === 'departement' ? 'département' : 'spécialité'}
                </Typography>
                <Typography variant="body2" sx={{ color: C.slate }}>% d'étudiants avec moyenne générale &lt; 10</Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ px: 3, py: 2 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.slate }} />
                <YAxis tick={{ fontSize: 11, fill: C.slate }} unit="%" domain={[0, 100]} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="taux" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {chartData.map((d, i) => <Cell key={i} fill={riskColor(d.taux)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Card>
      )}

      {/* ══ TOGGLE + SEARCH ══════════════════════════════════════ */}
      <Card sx={{ borderRadius: '20px', border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', mb: 3, background: '#fff' }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md="auto">
              <ToggleButtonGroup
                value={view} exclusive
                onChange={(_, v) => { if (v) { setView(v); setSearch(''); setExpandedId(null); } }}
                sx={{ background: '#F9FAFB', borderRadius: '12px', p: 0.5, border: `1px solid ${C.border}` }}
              >
                {[
                  { v: 'departement', label: '🏢 Départements',  count: depts.length },
                  { v: 'specialite',  label: '📚 Spécialités',   count: specs.length },
                ].map(opt => (
                  <ToggleButton key={opt.v} value={opt.v} disableRipple
                    sx={{
                      border: 'none', borderRadius: '10px !important', px: 2.5, py: 1, fontSize: '0.88rem', fontWeight: 600,
                      color: C.slate, textTransform: 'none', gap: 1,
                      '&.Mui-selected': { background: '#fff', color: C.navy, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
                      '&:hover:not(.Mui-selected)': { background: '#fff8' },
                    }}>
                    {opt.label}
                    <Chip label={opt.count} size="small"
                      sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, background: C.blueL, color: C.blue, pointerEvents: 'none' }} />
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth size="medium"
                placeholder={view === 'departement' ? 'Rechercher un département...' : 'Rechercher une spécialité ou département...'}
                value={search} onChange={e => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#06B6D4', fontSize: 24 }} /></InputAdornment> }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px', background: '#F9FAFB',
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover fieldset': { borderColor: C.border },
                    '&.Mui-focused fieldset': { borderColor: '#06B6D4', borderWidth: '1px' },
                  },
                  '& input': { fontSize: '0.95rem', color: '#6B7280' },
                }}
              />
            </Grid>
            <Grid item xs={12} md="auto">
              <Typography sx={{ px: 1, fontSize: '0.9rem', color: C.slate }}>
                <b style={{ color: '#1F2937' }}>
                  {view === 'departement' ? filteredDepts.length : filteredSpecs.length}
                </b> résultat{(view === 'departement' ? filteredDepts.length : filteredSpecs.length) !== 1 ? 's' : ''}
              </Typography>
            </Grid>
            {search && (
              <Grid item xs={12} md="auto">
                <Button onClick={() => setSearch('')}
                  sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 500, color: '#9CA3AF', '&:hover': { background: '#F9FAFB' } }}>
                  ✕ Effacer
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* ══ TABLE ════════════════════════════════════════════════ */}
      <Card sx={{ borderRadius: '20px', border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', position: 'relative', background: '#fff' }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg,#EF4444 0%,#FF6B35 50%,#4D9FFF 100%)' }} />
        <TableContainer sx={{ mt: '4px' }}>
          <Table>
            {view === 'departement' ? (
              <>
                <TableHead>
                  <TableRow>
                    {['Département', 'Total étudiants', 'À risque', 'Critiques', 'Attention', 'Taux risque', 'Spécialités'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDepts.length === 0 && (
                    <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: C.slate, borderBottom: 'none' }}>Aucun département trouvé</TableCell></TableRow>
                  )}
                  {filteredDepts.map((dept, idx) => (
                    <React.Fragment key={dept.id_departement}>
                      <TableRow sx={{ '&:hover': { background: '#F9FAFB' }, transition: 'background 0.2s', borderBottom: idx === filteredDepts.length - 1 ? 'none' : '1px solid #F3F4F6' }}>
                        <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: C.navy, mb: 0.5 }}>{dept.nom_departement}</Typography>
                          <Chip label={dept.code_departement} sx={{ background: C.blueL, color: C.blue, fontWeight: 700, fontSize: '0.72rem', borderRadius: '8px', height: 20 }} />
                        </TableCell>
                        <TableCell sx={{ py: 3, borderBottom: 'none', color: '#1F2937', fontWeight: 600 }}>{dept.total_etudiants.toLocaleString('fr-TN')}</TableCell>
                        <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                          <Typography sx={{ fontWeight: 800, color: dept.nb_risque > 0 ? C.red : C.green }}>{dept.nb_risque}</Typography>
                        </TableCell>
                        <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                          <Typography sx={{ fontWeight: 700, color: dept.nb_critique > 0 ? '#DC2626' : C.slate }}>{dept.nb_critique}</Typography>
                        </TableCell>
                        <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                          <Typography sx={{ fontWeight: 700, color: dept.nb_attention > 0 ? C.orange : C.slate }}>{dept.nb_attention}</Typography>
                        </TableCell>
                        <TableCell sx={{ py: 3, borderBottom: 'none', minWidth: 140 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Chip label={`${dept.taux_risque}%`} size="small"
                              sx={{ background: riskBg(dept.taux_risque), color: riskColor(dept.taux_risque), fontWeight: 800, fontSize: '0.75rem', borderRadius: '8px', height: 24 }} />
                            <Typography sx={{ fontSize: '0.72rem', color: riskColor(dept.taux_risque), fontWeight: 600 }}>{riskLabel(dept.taux_risque)}</Typography>
                          </Box>
                          <Box sx={{ width: 80, height: 4, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ width: `${Math.min(dept.taux_risque, 100)}%`, height: '100%', background: riskColor(dept.taux_risque), borderRadius: 2 }} />
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                          {(specsByDept[dept.id_departement] || []).length > 0 ? (
                            <Tooltip title={expandedId === dept.id_departement ? 'Masquer' : 'Voir les spécialités'}>
                              <IconButton size="small" onClick={() => setExpandedId(expandedId === dept.id_departement ? null : dept.id_departement)}
                                sx={{ width: 48, height: 48, borderRadius: '14px', background: expandedId === dept.id_departement ? C.blueL : '#DBEAFE', color: C.blue, transition: 'all 0.2s', '&:hover': { background: '#BFDBFE' } }}>
                                {expandedId === dept.id_departement ? <ExpandLess sx={{ fontSize: 22 }} /> : <ExpandMore sx={{ fontSize: 22 }} />}
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Typography sx={{ fontSize: '0.8rem', color: C.slate }}>—</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                      {/* Spécialités expand */}
                      <TableRow>
                        <TableCell colSpan={7} sx={{ p: 0, border: 'none', background: '#FAFBFF' }}>
                          <Collapse in={expandedId === dept.id_departement} timeout="auto" unmountOnExit>
                            <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${C.border}` }}>
                              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.6px', mb: 1.5 }}>
                                Spécialités — {(specsByDept[dept.id_departement] || []).length} résultat{(specsByDept[dept.id_departement] || []).length !== 1 ? 's' : ''}
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {(specsByDept[dept.id_departement] || []).map(spec => (
                                  <Box key={spec.id_specialite} sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5, borderRadius: '12px', background: '#fff', border: `1px solid ${C.border}`, transition: 'all 0.2s', '&:hover': { border: `1px solid ${C.blue}40`, boxShadow: '0 2px 10px rgba(77,159,255,0.1)' } }}>
                                    <Box sx={{ flex: 1, minWidth: 140 }}>
                                      <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: C.navy }}>{spec.nom_specialite}</Typography>
                                      <Typography sx={{ fontSize: '0.7rem', color: C.slate }}>{spec.code_specialite}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                      {[{ v: spec.nb_risque, label: 'à risque', color: C.red }, { v: spec.nb_critique, label: 'critiques', color: '#DC2626' }, { v: spec.nb_attention, label: 'attention', color: C.orange }].map((st, i) => (
                                        <Box key={i} sx={{ textAlign: 'center', minWidth: 50 }}>
                                          <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: st.color, lineHeight: 1 }}>{st.v}</Typography>
                                          <Typography sx={{ fontSize: '0.6rem', color: C.slate }}>{st.label}</Typography>
                                        </Box>
                                      ))}
                                    </Box>
                                    <Box sx={{ minWidth: 120 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography sx={{ fontSize: '0.65rem', color: C.slate }}>Taux</Typography>
                                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: riskColor(spec.taux_risque) }}>{spec.taux_risque}%</Typography>
                                      </Box>
                                      <Box sx={{ height: 5, borderRadius: 3, background: '#E5E7EB', overflow: 'hidden' }}>
                                        <Box sx={{ height: '100%', borderRadius: 3, width: `${spec.taux_risque}%`, background: riskColor(spec.taux_risque), transition: 'width 0.8s ease' }} />
                                      </Box>
                                    </Box>
                                    <Box sx={{ minWidth: 60, textAlign: 'right' }}>
                                      <Typography sx={{ fontSize: '0.72rem', color: C.slate }}>{spec.total_etudiants} inscrits</Typography>
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </>
            ) : (
              /* ── VUE SPÉCIALITÉS ─────────────────────────── */
              <>
                <TableHead>
                  <TableRow>
                    {['Spécialité', 'Département', 'Total étudiants', 'À risque', 'Critiques', 'Attention', 'Taux risque'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSpecs.length === 0 && (
                    <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: C.slate, borderBottom: 'none' }}>Aucune spécialité trouvée</TableCell></TableRow>
                  )}
                  {filteredSpecs.map((spec, idx) => (
                    <TableRow key={spec.id_specialite} sx={{ '&:hover': { background: '#F9FAFB' }, transition: 'background 0.2s', borderBottom: idx === filteredSpecs.length - 1 ? 'none' : '1px solid #F3F4F6' }}>
                      <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: C.navy, mb: 0.5 }}>{spec.nom_specialite}</Typography>
                        <Chip label={spec.code_specialite || '—'} sx={{ background: C.blueL, color: C.blue, fontWeight: 700, fontSize: '0.72rem', borderRadius: '8px', height: 20 }} />
                      </TableCell>
                      <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#374151' }}>{spec.nom_departement}</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: C.slate }}>{spec.code_departement}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 3, borderBottom: 'none', color: '#1F2937', fontWeight: 600 }}>{spec.total_etudiants.toLocaleString('fr-TN')}</TableCell>
                      <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                        <Typography sx={{ fontWeight: 800, color: spec.nb_risque > 0 ? C.red : C.green }}>{spec.nb_risque}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                        <Typography sx={{ fontWeight: 700, color: spec.nb_critique > 0 ? '#DC2626' : C.slate }}>{spec.nb_critique}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                        <Typography sx={{ fontWeight: 700, color: spec.nb_attention > 0 ? C.orange : C.slate }}>{spec.nb_attention}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 3, borderBottom: 'none', minWidth: 160 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Chip label={`${spec.taux_risque}%`} size="small"
                            sx={{ background: riskBg(spec.taux_risque), color: riskColor(spec.taux_risque), fontWeight: 800, fontSize: '0.75rem', borderRadius: '8px', height: 24 }} />
                          <Typography sx={{ fontSize: '0.72rem', color: riskColor(spec.taux_risque), fontWeight: 600 }}>{riskLabel(spec.taux_risque)}</Typography>
                        </Box>
                        <Box sx={{ width: 80, height: 4, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                          <Box sx={{ width: `${Math.min(spec.taux_risque, 100)}%`, height: '100%', background: riskColor(spec.taux_risque), borderRadius: 2 }} />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </>
            )}
          </Table>
        </TableContainer>
      </Card>

      {/* ══ MODAL ════════════════════════════════════════════════ */}
      <Dialog open={!!modal} onClose={() => setModal(null)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden' } }}>
        <Box sx={{ background: '#F8FAFF', borderBottom: `1px solid ${C.border}`, px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, background: C.redL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
            ⚠️
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: C.navy }}>
              Étudiants à risque · {modal?.nom_departement || modal?.nom_specialite}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: C.slate }}>
              {(modal?.etudiants || []).length} étudiant{(modal?.etudiants || []).length !== 1 ? 's' : ''} avec moyenne &lt; 10
              &nbsp;·&nbsp;
              <Typography component="span" sx={{ color: C.red, fontWeight: 700, fontSize: '0.78rem' }}>
                {modal?.nb_critique ?? 0} critique{(modal?.nb_critique ?? 0) !== 1 ? 's' : ''}
              </Typography> (moy &lt; 7)
            </Typography>
          </Box>
          <IconButton onClick={() => setModal(null)} sx={{ color: C.slate, '&:hover': { background: '#F3F4F6', color: C.navy } }}>
            <Close />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          {(modal?.etudiants || []).length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <Typography sx={{ color: C.slate }}>Aucun étudiant à risque.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>{['#', 'N° Étudiant', 'Spécialité', 'Niveau', 'Moy.', 'Statut'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#9CA3AF', textTransform: 'uppercase', py: 2, borderBottom: '1px solid #F3F4F6' }}>{h}</TableCell>
                  ))}</TableRow>
                </TableHead>
                <TableBody>
                  {(modal?.etudiants || []).map((et, i) => {
                    const moy = parseFloat(et.moyenne_generale) || 0;
                    const isCrit = moy < 7;
                    return (
                      <TableRow key={i} sx={{ '&:hover': { background: '#F9FAFB' }, borderBottom: i === (modal?.etudiants || []).length - 1 ? 'none' : '1px solid #F3F4F6' }}>
                        <TableCell sx={{ py: 2.5, borderBottom: 'none', color: C.slate, fontWeight: 600 }}>{i + 1}</TableCell>
                        <TableCell sx={{ py: 2.5, borderBottom: 'none' }}>
                          <Chip label={et.numero_etudiant || '—'} sx={{ background: C.blueL, color: C.blue, fontWeight: 700, fontSize: '0.8rem', borderRadius: '8px', height: 28 }} />
                        </TableCell>
                        <TableCell sx={{ py: 2.5, borderBottom: 'none' }}>
                          <Typography sx={{ fontWeight: 600, color: '#1F2937' }}>{et.nom_specialite || '—'}</Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2.5, borderBottom: 'none' }}>
                          <Chip label={et.type_niveau || '—'} size="small" sx={{ background: C.blueL, color: C.blue, fontWeight: 700, fontSize: '0.72rem', borderRadius: '8px', height: 24 }} />
                        </TableCell>
                        <TableCell sx={{ py: 2.5, borderBottom: 'none' }}>
                          <Typography sx={{ fontWeight: 900, color: isCrit ? '#DC2626' : C.orange }}>
                            {moy.toFixed(2)}<Typography component="span" sx={{ fontSize: '0.72rem', color: C.slate }}> /20</Typography>
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2.5, borderBottom: 'none' }}>
                          <Chip label={isCrit ? '🔴 Critique' : '🟠 Attention'} size="small"
                            sx={{ background: isCrit ? C.redL : C.orangeL, color: isCrit ? '#DC2626' : '#92400E', fontWeight: 700, fontSize: '0.75rem', borderRadius: '8px', height: 26 }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

    </Box>
  );
}
