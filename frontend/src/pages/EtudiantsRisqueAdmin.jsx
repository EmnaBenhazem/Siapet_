import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, TextField, InputAdornment, keyframes,
  Collapse, Dialog, DialogContent, Grid, Select, MenuItem, Button,
} from '@mui/material';
import {
  ExpandMore, ExpandLess, Search, Close, ArrowForward, ArrowBack, FileDownload,
} from '@mui/icons-material';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip,
} from 'recharts';
import api from '../services/api';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const C = {
  navy:    '#1A3A6B',
  blue:    '#4D9FFF',
  blueB:   '#85BFFF',
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
const riskLabel = t => t > 30 ? 'Élevé'  : t > 15 ? 'Modéré' : 'Faible';

const typeColors = {
  UNIVERSITE: { bg: '#F3E8FF', color: '#7B2CBF' },
  FACULTE:    { bg: '#FEF3C7', color: '#F59E0B' },
  ECOLE:      { bg: '#DBEAFE', color: '#3B82F6' },
  INSTITUT:   { bg: '#FEF3C7', color: '#F59E0B' },
  ISET:       { bg: '#F3E8FF', color: '#8B5CF6' },
};

export default function EtudiantsRisqueAdmin() {
  const navigate = useNavigate();

  const [globalData,  setGlobalData]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [page,        setPage]        = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [expandedId, setExpandedId] = useState(null);
  const [deptData,   setDeptData]   = useState({});

  const [modal,     setModal]     = useState(null);
  const [modalData, setModalData] = useState({ loading: false, etudiants: [] });

  useEffect(() => {
    const token = localStorage.getItem('token');
    api.get('/etablissements/admin/risque-global', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => setGlobalData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadDepts = async (etabId) => {
    if (deptData[etabId]) return;
    setDeptData(prev => ({ ...prev, [etabId]: { loading: true, depts: [] } }));
    try {
      const token = localStorage.getItem('token');
      const r = await api.get(`/etablissements/${etabId}/etudiants-risque`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeptData(prev => ({ ...prev, [etabId]: { loading: false, depts: r.data.departements || [] } }));
    } catch {
      setDeptData(prev => ({ ...prev, [etabId]: { loading: false, depts: [] } }));
    }
  };

  const handleExpand = (etabId) => {
    if (expandedId === etabId) { setExpandedId(null); return; }
    setExpandedId(etabId);
    loadDepts(etabId);
  };

  const openModal = (dept) => {
    setModal(dept);
    setModalData({ loading: false, etudiants: dept.etudiants || [] });
  };

  const filteredEtabs = useMemo(() => {
    setPage(0);
    if (!globalData) return [];
    return globalData.etablissements.filter(e => {
      const matchSearch = e.nom_etablissement.toLowerCase().includes(search.toLowerCase())
                       || e.code_etablissement.toLowerCase().includes(search.toLowerCase());
      const matchLevel = filterLevel === 'all'
        || (filterLevel === 'eleve'  && e.taux_risque > 30)
        || (filterLevel === 'modere' && e.taux_risque > 15 && e.taux_risque <= 30)
        || (filterLevel === 'faible' && e.taux_risque <= 15);
      return matchSearch && matchLevel;
    });
  }, [globalData, search, filterLevel]);

  const pagedEtabs = filteredEtabs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const totalPages = Math.max(1, Math.ceil(filteredEtabs.length / rowsPerPage));

  const chartData = useMemo(() => {
    if (!globalData) return [];
    return [...globalData.etablissements]
      .sort((a, b) => b.taux_risque - a.taux_risque)
      .slice(0, 10)
      .map(e => ({ name: e.code_etablissement, full: e.nom_etablissement, taux: e.taux_risque }));
  }, [globalData]);

  const exportCSV = () => {
    const headers = ['Établissement', 'Code', 'Type', 'Total étudiants', 'À risque', 'Critiques', 'Attention', 'Taux risque (%)'];
    const rows = filteredEtabs.map(e => [
      `"${e.nom_etablissement}"`, e.code_etablissement, e.type || '',
      e.total_etudiants, e.nb_risque, e.nb_critique, e.nb_attention, e.taux_risque,
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `etudiants_risque_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: C.blue }} />
      </Box>
    );
  }

  const s = globalData?.stats || {};

  const kpis = [
    { label: 'Total étudiants à risque', value: s.total_risque ?? '—',   sub: `sur ${(s.total_etudiants || 0).toLocaleString('fr-TN')} inscrits`, color: C.red,    bg: 'linear-gradient(135deg, #EF444408, #EF444415)', icon: '⚠️' },
    { label: 'Taux moyen national',      value: `${s.taux_moyen ?? 0}%`, sub: 'Étudiants avec moy < 10',            color: C.orange, bg: 'linear-gradient(135deg, #FF6B3508, #FF6B3515)', icon: '📊' },
    { label: 'Cas critiques (moy < 7)',  value: s.total_critique ?? '—', sub: 'Nécessitent intervention urgente',    color: C.red,    bg: 'linear-gradient(135deg, #EF444408, #EF444415)', icon: '🔴' },
    { label: 'Établissements en alerte', value: s.nb_alerte ?? '—',      sub: 'Taux de risque > 20%',               color: C.purple, bg: 'linear-gradient(135deg, #7B2CBF08, #7B2CBF15)', icon: '🏛️' },
  ];

  return (
    <Box sx={{ animation: `${fadeUp} 0.5s ease-out` }}>

      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: '#fff', border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 2, background: '#FFF1F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
            ⚠️
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1F2937', mb: 0.5 }}>
              Étudiants à Risque
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              {s.total_risque
                ? `${s.total_risque.toLocaleString('fr-TN')} étudiants à risque — taux moyen national ${s.taux_moyen}%`
                : 'Analyse par établissement et département'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Exporter en CSV">
            <IconButton onClick={exportCSV}
              sx={{ width: 44, height: 44, borderRadius: '14px', background: '#10B981', color: '#fff',
                transition: 'all 0.3s ease', boxShadow: '0 3px 10px rgba(16,185,129,0.4)',
                '&:hover': { background: '#059669', transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(16,185,129,0.5)' } }}>
              <FileDownload sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Retour au tableau de bord">
            <IconButton onClick={() => navigate('/dashboard/admin')}
              sx={{ width: 44, height: 44, borderRadius: '14px', background: '#F0F4FF', border: `2px solid ${C.blue}40`, color: C.blue,
                transition: 'all 0.3s ease',
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
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {k.label}
                  </Typography>
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
          <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, background: '#FFF1F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
              📊
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#1F2937' }}>Top 10 établissements par taux de risque</Typography>
              <Typography variant="body2" sx={{ color: C.slate }}>% d'étudiants avec moyenne générale &lt; 10</Typography>
            </Box>
          </Box>
          <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <Box sx={{ flexShrink: 0, position: 'relative', width: 220, height: 220 }}>
              <PieChart width={220} height={220}>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={68} outerRadius={100} paddingAngle={2} dataKey="taux">
                  {chartData.map((d, i) => <Cell key={i} fill={riskColor(d.taux)} stroke="none" />)}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 12 }}
                  formatter={(v, _, props) => [`${v}%`, props.payload.full]}
                />
              </PieChart>
              <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', color: C.navy, lineHeight: 1 }}>{chartData.length}</Typography>
                <Typography sx={{ fontSize: '0.6rem', color: C.slate, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Étab.</Typography>
              </Box>
            </Box>
            <Box sx={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
              {chartData.map((d, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <Typography sx={{ fontSize: '0.68rem', color: C.slate, fontWeight: 700, width: 16, textAlign: 'right', flexShrink: 0 }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </Typography>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: riskColor(d.taux), flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.78rem', color: '#1F2937', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.name}
                  </Typography>
                  <Box sx={{ width: 80, height: 6, borderRadius: 3, background: '#F3F4F6', flexShrink: 0, overflow: 'hidden' }}>
                    <Box sx={{ width: `${d.taux}%`, height: '100%', borderRadius: 3, background: riskColor(d.taux) }} />
                  </Box>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: riskColor(d.taux), width: 38, textAlign: 'right', flexShrink: 0 }}>
                    {d.taux}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Card>
      )}

      {/* ══ FILTRES ══════════════════════════════════════════════ */}
      <Card sx={{ borderRadius: '20px', border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', mb: 3, background: '#fff' }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth size="medium"
                placeholder="Rechercher un établissement..."
                value={search} onChange={e => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Search sx={{ color: '#06B6D4', fontSize: 24 }} /></InputAdornment>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px', background: '#F9FAFB',
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover fieldset': { borderColor: C.border },
                    '&.Mui-focused fieldset': { borderColor: '#06B6D4', borderWidth: '1px' },
                    '&.Mui-focused': { background: '#fff' },
                  },
                  '& input': { fontSize: '0.95rem', color: '#6B7280', '&::placeholder': { color: '#9CA3AF', opacity: 1 } },
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Select
                fullWidth value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
                displayEmpty
                sx={{
                  borderRadius: '12px', background: '#F9FAFB',
                  '& fieldset': { borderColor: 'transparent' },
                  '&:hover fieldset': { borderColor: C.border },
                  '&.Mui-focused fieldset': { borderColor: '#06B6D4', borderWidth: '1px' },
                  '& .MuiSelect-select': { color: filterLevel !== 'all' ? '#374151' : '#9CA3AF', fontSize: '0.95rem' },
                }}
              >
                <MenuItem value="all">Tous les niveaux</MenuItem>
                <MenuItem value="eleve">Élevé (&gt; 30%)</MenuItem>
                <MenuItem value="modere">Modéré (15 – 30%)</MenuItem>
                <MenuItem value="faible">Faible (≤ 15%)</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography sx={{ px: 1, fontSize: '0.9rem', color: C.slate }}>
                <b style={{ color: '#1F2937' }}>{filteredEtabs.length}</b> établissement{filteredEtabs.length !== 1 ? 's' : ''} trouvé{filteredEtabs.length !== 1 ? 's' : ''}
              </Typography>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button fullWidth onClick={() => { setSearch(''); setFilterLevel('all'); }}
                sx={{ height: '56px', borderRadius: '12px', textTransform: 'none', fontWeight: 500, color: '#9CA3AF', '&:hover': { background: '#F9FAFB', color: '#6B7280' } }}>
                ✕ Effacer
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ══ TABLE ════════════════════════════════════════════════ */}
      <Card sx={{ borderRadius: '20px', border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', position: 'relative', background: '#fff' }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #EF4444 0%, #FF6B35 50%, #4D9FFF 100%)' }} />
        <TableContainer sx={{ mt: '4px' }}>
          <Table>
            <TableHead>
              <TableRow>
                {['Établissement', 'Type', 'Total étudiants', 'À risque', 'Critiques', 'Attention', 'Taux risque', 'Départements'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEtabs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6, color: C.slate, fontSize: '0.9rem', borderBottom: 'none' }}>
                    Aucun établissement trouvé
                  </TableCell>
                </TableRow>
              )}
              {pagedEtabs.map((etab, index) => (
                <React.Fragment key={etab.id_etablissement}>
                  <TableRow sx={{
                    '&:hover': { background: '#F9FAFB' },
                    transition: 'background 0.2s',
                    borderBottom: index === pagedEtabs.length - 1 ? 'none' : '1px solid #F3F4F6',
                  }}>
                    {/* Nom */}
                    <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                      <Typography
                        onClick={() => navigate(`/dashboard/admin/etablissements/${etab.id_etablissement}`)}
                        sx={{ fontWeight: 700, fontSize: '0.95rem', color: C.navy, cursor: 'pointer', mb: 0.5, '&:hover': { color: C.blue, textDecoration: 'underline' } }}>
                        {etab.nom_etablissement}
                      </Typography>
                      <Chip label={etab.code_etablissement}
                        sx={{ background: C.blueL, color: C.blue, fontWeight: 700, fontSize: '0.75rem', borderRadius: '8px', height: 22 }} />
                    </TableCell>
                    {/* Type */}
                    <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                      <Chip label={etab.type || '—'} size="small"
                        sx={{ background: typeColors[etab.type]?.bg || '#FEF3C7', color: typeColors[etab.type]?.color || '#F59E0B', fontWeight: 700, fontSize: '0.75rem', borderRadius: '8px', textTransform: 'uppercase', height: 28 }} />
                    </TableCell>
                    {/* Total */}
                    <TableCell sx={{ py: 3, borderBottom: 'none', color: '#1F2937', fontWeight: 600, fontSize: '0.95rem' }}>
                      {etab.total_etudiants.toLocaleString('fr-TN')}
                    </TableCell>
                    {/* À risque */}
                    <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: etab.nb_risque > 0 ? C.red : C.green }}>
                        {etab.nb_risque}
                      </Typography>
                    </TableCell>
                    {/* Critiques */}
                    <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: etab.nb_critique > 0 ? '#DC2626' : C.slate }}>
                        {etab.nb_critique}
                      </Typography>
                    </TableCell>
                    {/* Attention */}
                    <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: etab.nb_attention > 0 ? C.orange : C.slate }}>
                        {etab.nb_attention}
                      </Typography>
                    </TableCell>
                    {/* Taux */}
                    <TableCell sx={{ py: 3, borderBottom: 'none', minWidth: 140 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Chip label={`${etab.taux_risque}%`} size="small"
                          sx={{ background: riskBg(etab.taux_risque), color: riskColor(etab.taux_risque), fontWeight: 800, fontSize: '0.75rem', borderRadius: '8px', height: 24 }} />
                        <Typography sx={{ fontSize: '0.72rem', color: riskColor(etab.taux_risque), fontWeight: 600 }}>{riskLabel(etab.taux_risque)}</Typography>
                      </Box>
                      <Box sx={{ width: 60, height: 3, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ width: `${Math.min(etab.taux_risque, 100)}%`, height: '100%', background: riskColor(etab.taux_risque), borderRadius: 2 }} />
                      </Box>
                    </TableCell>
                    {/* Expand */}
                    <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                      <Tooltip title={expandedId === etab.id_etablissement ? 'Masquer' : 'Voir par département'}>
                        <IconButton size="small" onClick={() => handleExpand(etab.id_etablissement)}
                          sx={{
                            width: 48, height: 48, borderRadius: '14px',
                            background: expandedId === etab.id_etablissement ? C.blueL : '#DBEAFE',
                            color: expandedId === etab.id_etablissement ? C.blue : '#2563EB',
                            transition: 'all 0.2s',
                            '&:hover': { background: '#BFDBFE', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' },
                          }}>
                          {expandedId === etab.id_etablissement ? <ExpandLess sx={{ fontSize: 22 }} /> : <ExpandMore sx={{ fontSize: 22 }} />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>

                  {/* ── Dept drill-down ───────────────────────── */}
                  <TableRow>
                    <TableCell colSpan={8} sx={{ p: 0, border: 'none', background: '#FAFBFF' }}>
                      <Collapse in={expandedId === etab.id_etablissement} timeout="auto" unmountOnExit>
                        <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${C.border}` }}>
                          {deptData[etab.id_etablissement]?.loading ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                              <CircularProgress size={16} sx={{ color: C.blue }} />
                              <Typography sx={{ fontSize: '0.85rem', color: C.slate }}>Chargement des départements...</Typography>
                            </Box>
                          ) : (deptData[etab.id_etablissement]?.depts || []).length === 0 ? (
                            <Typography sx={{ fontSize: '0.85rem', color: C.slate, py: 1 }}>Aucun département avec étudiants à risque.</Typography>
                          ) : (
                            <Box>
                              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.6px', mb: 1.5 }}>
                                Départements — {deptData[etab.id_etablissement].depts.length} résultat{deptData[etab.id_etablissement].depts.length !== 1 ? 's' : ''}
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {deptData[etab.id_etablissement].depts.map(dept => (
                                  <Box key={dept.id_departement} sx={{
                                    display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5,
                                    borderRadius: '12px', background: '#fff',
                                    border: `1px solid ${C.border}`, transition: 'all 0.2s',
                                    '&:hover': { border: `1px solid ${C.blue}40`, boxShadow: '0 2px 10px rgba(77,159,255,0.1)' },
                                  }}>
                                    <Box sx={{ flex: 1, minWidth: 160 }}>
                                      <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: C.navy }}>{dept.nom_departement}</Typography>
                                      <Typography sx={{ fontSize: '0.72rem', color: C.slate }}>{dept.code_departement}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                      {[{ v: dept.nb_risque, label: 'à risque', color: C.red }, { v: dept.nb_critique, label: 'critiques', color: '#DC2626' }, { v: dept.nb_attention, label: 'attention', color: C.orange }].map((st, i) => (
                                        <Box key={i} sx={{ textAlign: 'center', minWidth: 52 }}>
                                          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: st.color, lineHeight: 1 }}>{st.v}</Typography>
                                          <Typography sx={{ fontSize: '0.62rem', color: C.slate }}>{st.label}</Typography>
                                        </Box>
                                      ))}
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 100, maxWidth: 160 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography sx={{ fontSize: '0.68rem', color: C.slate }}>Taux risque</Typography>
                                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: riskColor(dept.taux_risque) }}>{dept.taux_risque}%</Typography>
                                      </Box>
                                      <Box sx={{ height: 5, borderRadius: 3, background: '#E5E7EB', overflow: 'hidden' }}>
                                        <Box sx={{ height: '100%', borderRadius: 3, width: `${dept.taux_risque}%`, background: riskColor(dept.taux_risque), transition: 'width 0.8s ease' }} />
                                      </Box>
                                    </Box>
                                    <Tooltip title="Voir la liste des étudiants à risque">
                                      <IconButton size="small" onClick={() => openModal(dept)}
                                        sx={{ width: 48, height: 48, borderRadius: '14px', background: C.blueL, color: C.blue, transition: 'all 0.2s',
                                          '&:hover': { background: C.blue, color: '#fff', transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${C.blue}40` } }}>
                                        <ArrowForward sx={{ fontSize: 20 }} />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: `1px solid ${C.blueL}`, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '0.85rem', color: C.slate }}>Lignes par page :</Typography>
            <Select size="small" value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
              sx={{ borderRadius: '8px', fontSize: '0.85rem', '.MuiOutlinedInput-notchedOutline': { borderColor: C.border } }}>
              {[5, 10, 25, 50].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </Select>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button size="small" disabled={page === 0} onClick={() => setPage(p => p - 1)}
              sx={{ borderRadius: '8px', textTransform: 'none', color: C.navy, '&:disabled': { color: C.slate } }}>
              Précédent
            </Button>
            <Typography sx={{ px: 2, color: C.slate, fontSize: '0.9rem' }}>
              Page {page + 1} sur {totalPages}
            </Typography>
            <Button size="small" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              sx={{ borderRadius: '8px', textTransform: 'none', color: C.navy, '&:disabled': { color: C.slate } }}>
              Suivant
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ══ MODAL ÉTUDIANTS ══════════════════════════════════════ */}
      <Dialog open={!!modal} onClose={() => setModal(null)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: '20px', boxShadow: `0 24px 48px ${C.blue}20`, overflow: 'hidden' } }}>
        <Box sx={{ background: '#F8FAFF', borderBottom: `1px solid ${C.border}`, px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, background: C.redL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
            ⚠️
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: C.navy }}>
              Étudiants à risque · {modal?.nom_departement}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: C.slate }}>
              {modalData.etudiants.length} étudiant{modalData.etudiants.length !== 1 ? 's' : ''} avec moyenne &lt; 10
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
          {modalData.etudiants.length === 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
              <Typography sx={{ color: C.slate, fontSize: '0.9rem' }}>Aucun étudiant à risque dans ce département.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {['#', 'N° Étudiant', 'Spécialité', 'Niveau', 'Moy. générale', 'Statut'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', py: 2, borderBottom: '1px solid #F3F4F6' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modalData.etudiants.map((et, i) => {
                    const moy    = parseFloat(et.moyenne_generale) || 0;
                    const statut = et.statut || (moy < 7 ? 'critique' : 'attention');
                    const isCrit = statut === 'critique';
                    return (
                      <TableRow key={i} sx={{
                        '&:hover': { background: '#F9FAFB' }, transition: 'background 0.2s',
                        borderBottom: i === modalData.etudiants.length - 1 ? 'none' : '1px solid #F3F4F6',
                      }}>
                        <TableCell sx={{ py: 2.5, borderBottom: 'none', color: C.slate, fontSize: '0.85rem', fontWeight: 600, width: 36 }}>{i + 1}</TableCell>
                        <TableCell sx={{ py: 2.5, borderBottom: 'none' }}>
                          <Chip label={et.numero_etudiant || '—'}
                            sx={{ background: C.blueL, color: C.blue, fontWeight: 700, fontSize: '0.8rem', borderRadius: '8px', height: 28 }} />
                        </TableCell>
                        <TableCell sx={{ py: 2.5, borderBottom: 'none' }}>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#1F2937' }}>{et.nom_specialite || '—'}</Typography>
                          {et.code_specialite && <Typography sx={{ fontSize: '0.72rem', color: C.slate }}>{et.code_specialite}</Typography>}
                        </TableCell>
                        <TableCell sx={{ py: 2.5, borderBottom: 'none' }}>
                          <Chip label={et.type_niveau || '—'} size="small"
                            sx={{ background: C.blueL, color: C.blue, fontWeight: 700, fontSize: '0.72rem', borderRadius: '8px', height: 24 }} />
                        </TableCell>
                        <TableCell sx={{ py: 2.5, borderBottom: 'none' }}>
                          <Typography sx={{ fontWeight: 900, fontSize: '1rem', color: isCrit ? '#DC2626' : C.orange, lineHeight: 1 }}>
                            {moy.toFixed(2)}
                            <Typography component="span" sx={{ fontSize: '0.72rem', fontWeight: 400, color: C.slate }}> /20</Typography>
                          </Typography>
                          <Box sx={{ width: 60, height: 3, borderRadius: 2, background: '#E5E7EB', overflow: 'hidden', mt: 0.5 }}>
                            <Box sx={{ height: '100%', borderRadius: 2, width: `${(moy / 20) * 100}%`, background: isCrit ? '#DC2626' : C.orange }} />
                          </Box>
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
