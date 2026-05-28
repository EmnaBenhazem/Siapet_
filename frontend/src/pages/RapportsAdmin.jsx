import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Chip, CircularProgress, Alert,
  Select, MenuItem, FormControl, InputLabel, Button, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Tooltip,
} from '@mui/material';
import {
  Assessment, FileDownload, Print, Refresh, PictureAsPdf,
  TableChart, Visibility, GetApp, OpenInNew,
} from '@mui/icons-material';
import { keyframes } from '@mui/system';
import api from '../services/api';

const fadeUp = keyframes`
  from { opacity:0; transform:translateY(16px); }
  to   { opacity:1; transform:translateY(0);    }
`;

const C = {
  navy:   '#1A3A6B', blue:   '#4D9FFF', blueL:  '#EAF4FF',
  green:  '#06D6A0', orange: '#FF6B35', purple: '#7B2CBF',
  yellow: '#FFD60A', red:    '#EF4444', teal:   '#0E6678',
};

const REPORT_TYPES = [
  { key: 'etudiants',      label: 'Rapport Étudiants',        color: C.blue,   donnees: 'Effectifs, Moyennes, Mentions, Spécialités',               pages: 18 },
  { key: 'etablissements', label: 'Rapport Établissements',   color: C.navy,   donnees: 'Effectifs, Taux de réussite, Encadrement, Régions',         pages: 12 },
  { key: 'enseignants',    label: 'Rapport Enseignants',      color: C.purple, donnees: 'Corps pédagogique, Grades, Expérience, Établissements',      pages: 10 },
  { key: 'academique',     label: 'Rapport Académique',       color: C.green,  donnees: 'Niveaux, Semestres, Moyennes, Absences, Mentions',           pages: 24 },
  { key: 'risque',         label: 'Rapport Risque Académique',color: C.orange, donnees: 'Étudiants à risque, Absences, Alertes, Spécialités',         pages: 8  },
];

const PERIODES = [
  { value: 'mois',      label: 'Dernier mois',     limite: 50  },
  { value: 'trimestre', label: 'Dernier trimestre', limite: 100 },
  { value: 'annee',     label: 'Dernière année',    limite: 200 },
  { value: 'tout',      label: 'Tout',              limite: 500 },
];

const MENTION_OPTS = [
  { value: '', label: 'Toutes les mentions' },
  { value: 'tres_bien',   label: 'Très bien (≥ 16)' },
  { value: 'bien',        label: 'Bien (14–16)' },
  { value: 'assez_bien',  label: 'Assez bien (12–14)' },
  { value: 'passable',    label: 'Passable (10–12)' },
  { value: 'insuffisant', label: 'Insuffisant (< 10)' },
];

const RISQUE_OPTS = [
  { value: 'risque',   label: 'Tous à risque (< 10)' },
  { value: 'critique', label: 'Critique seulement (< 7)' },
];

const NIVEAUX   = ['L1','L2','L3','M1','M2'];
const SEMESTRES = [1,2,3,4,5,6];
const TYPES_ETAB = ['FACULTE','INSTITUT','ECOLE','ISET','CPGE'];

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const MOCK_HISTORY = [
  { id:1, date:'08/02/2026', type:'Mensuel',      typeColor:'#10B981', periode:'Janvier 2026',   etablissement:'Tous',      genere_par:'Admin Principal',   format:'PDF'       },
  { id:2, date:'01/02/2026', type:'Hebdomadaire', typeColor:'#4D9FFF', periode:'Sem. 4 - 2026',  etablissement:'ISET Rades',genere_par:'Dir. Établissement', format:'Excel'     },
  { id:3, date:'25/01/2026', type:'Personnalisé', typeColor:'#F59E0B', periode:'Q4 2025',         etablissement:'Informatique',genere_par:'Chef Départ.',    format:'PDF'       },
  { id:4, date:'15/01/2026', type:'Trimestriel',  typeColor:'#06D6A0', periode:'Q4 2025',         etablissement:'Tous',      genere_par:'Admin Principal',   format:'PDF + Excel'},
  { id:5, date:'01/01/2026', type:'Annuel',        typeColor:'#EC4899', periode:'Année 2025',      etablissement:'Tous',      genere_par:'Admin Principal',   format:'PDF'       },
];

const getMentionColor = m => {
  const map = { 'Très bien':'#22c55e', 'Bien':'#06D6A0', 'Assez bien':'#4D9FFF', 'Passable':'#F59E0B', 'Insuffisant':'#EF4444' };
  return map[m] || '#8A9BB0';
};

const getRisqueColor = v => {
  if (v === 'Critique') return C.red;
  if (v === 'À risque') return C.orange;
  return C.green;
};

function StyledSelect({ label, value, onChange, options, disabled }) {
  return (
    <FormControl fullWidth size="small" disabled={disabled}>
      <InputLabel sx={{ fontSize: '0.83rem', color: '#374151', '&.Mui-focused': { color: C.teal } }}>{label}</InputLabel>
      <Select
        value={value} onChange={e => onChange(e.target.value)} label={label}
        sx={{
          borderRadius: '10px', fontSize: '0.83rem', background: '#fff',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: C.teal },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.teal },
        }}
      >
        {options.map(o => (
          <MenuItem key={o.value ?? o} value={o.value ?? o} sx={{ fontSize: '0.83rem' }}>
            {o.label ?? o}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function exportCSV(rows, type) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(';'),
    ...rows.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(';')),
  ].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `rapport_${type}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

function exportExcel(rows, type) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const tsv = [headers.join('\t'), ...rows.map(r => headers.map(h => r[h] ?? '').join('\t'))].join('\n');
  const blob = new Blob([tsv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `rapport_${type}_${new Date().toISOString().slice(0,10)}.xls`;
  a.click(); URL.revokeObjectURL(url);
}

const COLMAP = {
  etudiants: [
    { key:'matricule',         label:'Matricule' },
    { key:'nom',               label:'Nom' },
    { key:'prenom',            label:'Prénom' },
    { key:'nom_specialite',    label:'Spécialité' },
    { key:'nom_etablissement', label:'Établissement' },
    { key:'nom_ville',         label:'Ville' },
    { key:'nom_region',        label:'Région' },
    { key:'moyenne_generale',  label:'Moyenne' },
    { key:'mention',           label:'Mention' },
  ],
  etablissements: [
    { key:'nom',             label:'Établissement' },
    { key:'type',            label:'Type' },
    { key:'nom_region',      label:'Région' },
    { key:'nom_ville',       label:'Ville' },
    { key:'nb_etudiants',    label:'Étudiants' },
    { key:'nb_enseignants',  label:'Enseignants' },
    { key:'nb_departements', label:'Dépts' },
    { key:'moyenne',         label:'Moy.' },
    { key:'nb_risque',       label:'À risque' },
    { key:'pct_risque',      label:'% risque' },
  ],
  enseignants: [
    { key:'nom',               label:'Nom' },
    { key:'prenom',            label:'Prénom' },
    { key:'email',             label:'Email' },
    { key:'grade',             label:'Grade' },
    { key:'specialite',        label:'Spécialité' },
    { key:'annees_experience', label:'Expérience' },
    { key:'nom_etablissement', label:'Établissement' },
    { key:'nom_ville',         label:'Ville' },
  ],
  academique: [
    { key:'nom',               label:'Nom' },
    { key:'prenom',            label:'Prénom' },
    { key:'niveau',            label:'Niveau' },
    { key:'semestre',          label:'Sem.' },
    { key:'nom_specialite',    label:'Spécialité' },
    { key:'moyenne',           label:'Moyenne' },
    { key:'mention',           label:'Mention' },
    { key:'nb_absences',       label:'Absences' },
    { key:'taux_reussite',     label:'Taux réus.' },
    { key:'nom_etablissement', label:'Établissement' },
  ],
  risque: [
    { key:'matricule',         label:'Matricule' },
    { key:'nom',               label:'Nom' },
    { key:'prenom',            label:'Prénom' },
    { key:'nom_specialite',    label:'Spécialité' },
    { key:'moyenne_generale',  label:'Moyenne' },
    { key:'nb_absences',       label:'Absences' },
    { key:'niveau_risque',     label:'Niveau risque' },
    { key:'nom_etablissement', label:'Établissement' },
    { key:'nom_ville',         label:'Ville' },
  ],
};

export default function RapportsAdmin() {
  const [reportType,   setReportType]   = useState('etudiants');
  const [periode,      setPeriode]      = useState('trimestre');
  const [filtres,      setFiltres]      = useState({ etablissements: [], rectorats: [], regions: [], filieres: [], specialites: [] });
  const [allSpecialites, setAllSpecialites] = useState([]);
  const [filters,      setFilters]      = useState({ rectorat_id:'', etablissement_id:'', departement_id:'', mention:'', risque:'risque', niveau:'', semestre:'', type_etab:'', region_id:'', specialite_id:'' });
  const [departements, setDepartements] = useState([]);
  const [deptLoading,  setDeptLoading]  = useState(false);
  const [rows,         setRows]         = useState([]);
  const [summary,      setSummary]      = useState({});
  const [loading,      setLoading]      = useState(false);
  const [generated,    setGenerated]    = useState(false);
  const [error,        setError]        = useState(null);
  const [history,      setHistory]      = useState(MOCK_HISTORY);

  const setF = (k, v) => setFilters(p => ({ ...p, [k]: v }));
  const currentType = REPORT_TYPES.find(t => t.key === reportType);
  const currentPeriode = PERIODES.find(p => p.value === periode);

  useEffect(() => {
    api.get('/analytics/rapport/filtres').then(r => {
      const d = r.data.data || {};
      setFiltres(d);
      setAllSpecialites(d.specialites || []);
    }).catch(() => {});
  }, []);

  // When rectorat changes → reset établissement + département + spécialités
  const handleRectoratChange = (val) => {
    setFilters(p => ({ ...p, rectorat_id: val, etablissement_id: '', departement_id: '', specialite_id: '' }));
    setDepartements([]);
    setFiltres(p => ({ ...p, specialites: allSpecialites }));
  };

  // When établissement changes → fetch its départements + reset dept & spec
  const handleEtabChange = async (val) => {
    setFilters(p => ({ ...p, etablissement_id: val, departement_id: '', specialite_id: '' }));
    setDepartements([]);
    setFiltres(p => ({ ...p, specialites: allSpecialites }));
    if (!val) return;
    setDeptLoading(true);
    try {
      const r = await api.get(`/departements?etablissement_id=${val}`);
      setDepartements(r.data.data || []);
    } catch { setDepartements([]); }
    setDeptLoading(false);
  };

  // When département changes → fetch specialties for that dept
  const handleDeptChange = async (val) => {
    setFilters(p => ({ ...p, departement_id: val, specialite_id: '' }));
    if (!val) {
      setFiltres(p => ({ ...p, specialites: allSpecialites }));
      return;
    }
    try {
      const r = await api.get(`/analytics/rapport/filtres?departement_id=${val}`);
      setFiltres(p => ({ ...p, specialites: r.data.data?.specialites || allSpecialites }));
    } catch {
      setFiltres(p => ({ ...p, specialites: allSpecialites }));
    }
  };

  // Établissements filtered by selected rectorat (client-side)
  const etablissementsFiltres = filters.rectorat_id
    ? filtres.etablissements.filter(e => String(e.id_rectorat) === String(filters.rectorat_id))
    : filtres.etablissements;

  // Ouvrir la page d'impression du rapport
  const openPrintReport = () => {
    if (!rows.length) return;
    const reportData = {
      rows,
      summary,
      reportType,
      apercu: getApercu(),
      cols: COLMAP[reportType] || Object.keys(rows[0]).map(k => ({ key: k, label: k })),
      currentType,
      generatedAt: new Date().toLocaleString('fr-FR'),
      filters,
      filtres: { rectorats: filtres.rectorats, etablissements: filtres.etablissements, regions: filtres.regions },
    };
    sessionStorage.setItem('rapport_impression', JSON.stringify(reportData));
    window.open('/rapport/impression', '_blank');
  };

  const getApercu = () => {
    const d = new Date();
    const monthYear = `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
    const rectoratLabel = filters.rectorat_id
      ? filtres.rectorats?.find(r => String(r.id) === String(filters.rectorat_id))?.nom || 'Rectorat sélectionné'
      : null;
    const etabLabel = filters.etablissement_id
      ? filtres.etablissements.find(e => String(e.id) === String(filters.etablissement_id))?.nom || 'Établissement sélectionné'
      : rectoratLabel ? `Tous les étabs. (${rectoratLabel})` : 'Tous les établissements';
    const deptLabel = filters.departement_id
      ? departements.find(d => String(d.id) === String(filters.departement_id))?.nom_departement || 'Département sélectionné'
      : 'Tous les départements';
    const specLabel = filters.specialite_id
      ? filtres.specialites.find(s => String(s.id) === String(filters.specialite_id))?.nom || 'Spécialité sélectionnée'
      : 'Toutes les spécialités';
    return {
      titre:  `${currentType?.label} - ${monthYear}`,
      portee: `${etabLabel}, ${deptLabel}, ${specLabel}`,
      donnees: currentType?.donnees || '',
      pages:  currentType?.pages || 15,
    };
  };

  const apercu = getApercu();

  const generate = useCallback(async () => {
    setLoading(true); setError(null); setRows([]); setSummary({});
    const limite = currentPeriode?.limite || 100;
    const params = { type: reportType, limite };
    if (filters.rectorat_id)      params.rectorat_id      = filters.rectorat_id;
    if (filters.etablissement_id) params.etablissement_id = filters.etablissement_id;
    if (filters.departement_id)   params.departement_id   = filters.departement_id;
    if (filters.mention)          params.mention          = filters.mention;
    if (filters.risque && reportType === 'risque') params.risque = filters.risque;
    if (filters.niveau)           params.niveau           = filters.niveau;
    if (filters.semestre)         params.semestre         = filters.semestre;
    if (filters.type_etab)        params.type_etab        = filters.type_etab;
    if (filters.region_id)        params.region_id        = filters.region_id;
    if (filters.specialite_id)    params.specialite_id    = filters.specialite_id;
    try {
      const r = await api.get('/analytics/rapport', { params });
      const data = r.data.data || [];
      setRows(data);
      setSummary(r.data.summary || {});
      setGenerated(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const d = new Date();
      const dateStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      const etabLabel = filters.etablissement_id
        ? filtres.etablissements.find(e => String(e.id) === String(filters.etablissement_id))?.nom || 'Sélectionné'
        : filters.rectorat_id
          ? filtres.rectorats?.find(r => String(r.id) === String(filters.rectorat_id))?.nom || 'Rectorat'
          : 'Tous';
      setHistory(prev => [{
        id: Date.now(),
        date: dateStr,
        type: currentType?.label?.replace('Rapport ','') || 'Personnalisé',
        typeColor: currentType?.color || C.blue,
        periode: `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`,
        etablissement: etabLabel,
        genere_par: `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Utilisateur',
        format: 'PDF',
      }, ...prev]);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    }
    setLoading(false);
  }, [reportType, filters, periode, currentType, currentPeriode, filtres]);

  const resetFilters = () => {
    setFilters({ rectorat_id:'', etablissement_id:'', departement_id:'', mention:'', risque:'risque', niveau:'', semestre:'', type_etab:'', region_id:'', specialite_id:'' });
    setDepartements([]);
    setFiltres(p => ({ ...p, specialites: allSpecialites }));
    setPeriode('trimestre');
    setRows([]); setSummary({}); setGenerated(false); setError(null);
  };

  const renderTable = () => {
    if (!generated) return null;
    if (!rows.length) return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>📭</Typography>
        <Typography sx={{ color: '#8A9BB0' }}>Aucun résultat pour ces filtres.</Typography>
      </Box>
    );
    const cols = COLMAP[reportType] || Object.keys(rows[0]).map(k => ({ key: k, label: k }));
    return (
      <TableContainer sx={{ borderRadius: '12px', border: '1px solid #E5E7EB', maxHeight: 500, overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ background: '#F0F7FF', fontWeight: 800, color: C.navy, fontSize: '0.73rem', py: 1.5, width: 40 }}>#</TableCell>
              {cols.map(c => (
                <TableCell key={c.key} sx={{ background: '#F0F7FF', fontWeight: 800, color: C.navy, fontSize: '0.73rem', py: 1.5, whiteSpace: 'nowrap' }}>
                  {c.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i} hover sx={{ '&:hover': { background: `${currentType.color}06` } }}>
                <TableCell sx={{ color: '#8A9BB0', fontSize: '0.72rem', py: 1.2 }}>{i + 1}</TableCell>
                {cols.map(c => {
                  const val = row[c.key];
                  if (c.key === 'mention' && reportType === 'etudiants') return (
                    <TableCell key={c.key} sx={{ py: 1.2 }}>
                      <Chip label={val || '—'} size="small" sx={{ background: `${getMentionColor(val)}18`, color: getMentionColor(val), fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
                    </TableCell>
                  );
                  if (c.key === 'niveau_risque') return (
                    <TableCell key={c.key} sx={{ py: 1.2 }}>
                      <Chip label={val || '—'} size="small" sx={{ background: `${getRisqueColor(val)}18`, color: getRisqueColor(val), fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
                    </TableCell>
                  );
                  if (c.key === 'moyenne_generale' || c.key === 'moyenne') {
                    const num = parseFloat(val);
                    const col = num >= 14 ? '#22c55e' : num >= 10 ? C.blue : num >= 7 ? C.orange : C.red;
                    return <TableCell key={c.key} sx={{ py: 1.2, fontWeight: 800, color: col, fontSize: '0.82rem' }}>{val ?? '—'}</TableCell>;
                  }
                  return (
                    <TableCell key={c.key} sx={{ py: 1.2, fontSize: '0.78rem', color: '#374151', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {val ?? '—'}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ pb: 6, animation: `${fadeUp} 0.4s ease-out` }}>

      {/* ── Header ── */}
      <Box sx={{
        mb: 4, p: 3, borderRadius: 3, background: '#fff',
        border: '1px solid #E5E7EB',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: '16px', background: `linear-gradient(135deg, ${C.teal}18, ${C.blue}18)`, border: `1.5px solid ${C.teal}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Assessment sx={{ color: C.teal, fontSize: 28 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, color: '#1F2937', fontSize: '1.35rem', lineHeight: 1.2 }}>Rapports & Exports</Typography>
            <Typography sx={{ color: '#6B7280', fontSize: '0.85rem', mt: 0.3 }}>
              Générez des rapports avec filtres sur toutes les données de la plateforme
            </Typography>
          </Box>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={resetFilters}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, borderColor: '#D1D5DB', color: '#6B7280', '&:hover': { borderColor: C.teal, color: C.teal } }}>
          Réinitialiser
        </Button>
      </Box>

      {/* ── Générer un nouveau rapport ── */}
      <Card sx={{ mb: 4, borderRadius: '16px', border: '1.5px solid #E0EAF6', boxShadow: '0 2px 12px rgba(14,102,120,0.06)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '1.05rem', mb: 3 }}>
            Générer un nouveau rapport
          </Typography>

          {/* Row 1: Type + Rectorat */}
          <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
            <Grid item xs={12} md={6}>
              <StyledSelect
                label="Type de rapport"
                value={reportType}
                onChange={v => { setReportType(v); resetFilters(); }}
                options={REPORT_TYPES.map(t => ({ value: t.key, label: t.label }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <StyledSelect
                label="Rectorat"
                value={filters.rectorat_id}
                onChange={handleRectoratChange}
                options={[{ value: '', label: 'Tous les rectorats' }, ...(filtres.rectorats || []).map(r => ({ value: r.id, label: r.nom }))]}
              />
            </Grid>
          </Grid>

          {/* Row 2: Établissement + Département */}
          <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
            <Grid item xs={12} md={6}>
              <StyledSelect
                label="Établissement"
                value={filters.etablissement_id}
                onChange={handleEtabChange}
                options={[
                  { value: '', label: filters.rectorat_id ? 'Tous les étabs. du rectorat' : 'Tous les établissements' },
                  ...etablissementsFiltres.map(e => ({ value: e.id, label: e.nom })),
                ]}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <StyledSelect
                label={deptLoading ? 'Chargement départements…' : 'Département'}
                value={filters.departement_id}
                onChange={handleDeptChange}
                disabled={!filters.etablissement_id || deptLoading}
                options={[
                  { value: '', label: filters.etablissement_id ? 'Tous les départements' : 'Sélectionnez un établissement d\'abord' },
                  ...departements.map(d => ({ value: d.id, label: d.nom_departement })),
                ]}
              />
            </Grid>
          </Grid>

          {/* Row 3: Période + contextual filters */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <StyledSelect
                label="Période"
                value={periode}
                onChange={setPeriode}
                options={PERIODES.map(p => ({ value: p.value, label: p.label }))}
              />
            </Grid>

            {(reportType === 'etudiants' || reportType === 'academique' || reportType === 'risque') && (
              <Grid item xs={12} md={3}>
                <StyledSelect
                  label="Spécialité"
                  value={filters.specialite_id}
                  onChange={v => setF('specialite_id', v)}
                  options={[{ value: '', label: 'Toutes les spécialités' }, ...filtres.specialites.map(s => ({ value: s.id, label: s.nom }))]}
                />
              </Grid>
            )}
            {reportType === 'etudiants' && (
              <Grid item xs={12} md={3}>
                <StyledSelect label="Mention" value={filters.mention} onChange={v => setF('mention', v)} options={MENTION_OPTS} />
              </Grid>
            )}
            {reportType === 'risque' && (
              <Grid item xs={12} md={3}>
                <StyledSelect label="Niveau de risque" value={filters.risque} onChange={v => setF('risque', v)} options={RISQUE_OPTS} />
              </Grid>
            )}
            {reportType === 'academique' && (
              <>
                <Grid item xs={12} md={3}>
                  <StyledSelect label="Niveau" value={filters.niveau} onChange={v => setF('niveau', v)}
                    options={[{ value: '', label: 'Tous les niveaux' }, ...NIVEAUX.map(n => ({ value: n, label: n }))]} />
                </Grid>
                <Grid item xs={12} md={2}>
                  <StyledSelect label="Semestre" value={filters.semestre} onChange={v => setF('semestre', v)}
                    options={[{ value: '', label: 'Tous' }, ...SEMESTRES.map(s => ({ value: s, label: `S${s}` }))]} />
                </Grid>
              </>
            )}
            {reportType === 'etablissements' && (
              <>
                <Grid item xs={12} md={3}>
                  <StyledSelect
                    label="Type d'établissement"
                    value={filters.type_etab}
                    onChange={v => setF('type_etab', v)}
                    options={[{ value: '', label: 'Tous les types' }, ...TYPES_ETAB.map(t => ({ value: t, label: t }))]}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <StyledSelect label="Région" value={filters.region_id} onChange={v => setF('region_id', v)}
                    options={[{ value: '', label: 'Toutes les régions' }, ...filtres.regions.map(r => ({ value: r.id, label: r.nom }))]} />
                </Grid>
              </>
            )}
          </Grid>

          {/* Aperçu du rapport */}
          <Box sx={{ p: 2.5, borderRadius: '12px', background: '#F4F8FC', border: '1px solid #E0EAF6', mb: 3 }}>
            <Typography sx={{ fontWeight: 700, color: C.teal, mb: 1.5, fontSize: '0.92rem' }}>
              Aperçu du rapport
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.7 }}>
              <Typography sx={{ fontSize: '0.85rem', color: '#374151' }}>
                <strong>Titre:</strong>{' '}
                <span style={{ color: C.teal }}>{apercu.titre}</span>
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#374151' }}>
                <strong>Portée:</strong> {apercu.portee}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#374151' }}>
                <strong>Données incluses:</strong> {apercu.donnees}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#374151' }}>
                <strong>Nombre de pages estimé:</strong> {apercu.pages} pages
              </Typography>
            </Box>
          </Box>

          {/* Error */}
          {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px' }}>{error}</Alert>}

          {/* Primary button */}
          <Button
            fullWidth variant="contained" onClick={generate} disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Assessment />}
            sx={{
              background: loading ? '#8A9BB0' : C.teal,
              borderRadius: '12px', textTransform: 'none', fontWeight: 700,
              fontSize: '0.95rem', py: 1.4, mb: 2,
              boxShadow: `0 4px 16px ${C.teal}40`,
              '&:hover': { background: '#0a5463' },
            }}
          >
            {loading ? 'Génération en cours…' : 'Générer le rapport'}
          </Button>

          {/* Export buttons */}
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6} md={3}>
              <Tooltip title="Ouvrir une page d'impression professionnelle avec le style SIAPET" arrow>
                <span style={{ display: 'block' }}>
                  <Button
                    fullWidth variant="contained" disabled={!generated || !rows.length}
                    onClick={openPrintReport}
                    startIcon={<PictureAsPdf />}
                    endIcon={<OpenInNew sx={{ fontSize: '0.85rem !important' }} />}
                    sx={{
                      background: generated && rows.length ? 'linear-gradient(135deg, #C62828, #EF5350)' : undefined,
                      borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem',
                      boxShadow: generated && rows.length ? '0 4px 14px rgba(198,40,40,0.3)' : undefined,
                      '&:hover': { background: '#b71c1c' },
                      '&.Mui-disabled': { background: '#f3f4f6', color: '#9CA3AF' },
                    }}
                  >
                    Imprimer / PDF
                  </Button>
                </span>
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth variant="outlined" disabled={!generated || !rows.length}
                onClick={() => exportExcel(rows, reportType)}
                startIcon={<TableChart />}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', borderColor: C.teal, color: C.teal, '&:hover': { background: `${C.teal}08` }, '&.Mui-disabled': { borderColor: '#D1D5DB', color: '#9CA3AF' } }}
              >
                Exporter Excel
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth variant="outlined" disabled={!generated || !rows.length}
                onClick={() => exportCSV(rows, reportType)}
                startIcon={<FileDownload />}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', borderColor: C.teal, color: C.teal, '&:hover': { background: `${C.teal}08` }, '&.Mui-disabled': { borderColor: '#D1D5DB', color: '#9CA3AF' } }}
              >
                Exporter CSV
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth variant="outlined" disabled={!generated || !rows.length}
                onClick={() => window.print()}
                startIcon={<Print />}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', borderColor: '#9CA3AF', color: '#6B7280', '&:hover': { background: '#f9fafb', borderColor: '#6B7280' }, '&.Mui-disabled': { borderColor: '#D1D5DB', color: '#9CA3AF' } }}
              >
                Impression rapide
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ── Results table ── */}
      {generated && (
        <Card sx={{ mb: 4, borderRadius: '16px', border: '1.5px solid #E0EAF6', boxShadow: '0 2px 12px rgba(14,102,120,0.06)', animation: `${fadeUp} 0.4s ease-out` }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '1rem' }}>
                Résultats du rapport
              </Typography>
              {rows.length > 0 && (
                <Chip label={`${rows.length} enregistrement${rows.length > 1 ? 's' : ''}`} size="small"
                  sx={{ background: `${currentType.color}14`, color: currentType.color, fontWeight: 700, fontSize: '0.72rem' }} />
              )}
            </Box>

            {/* Summary chips */}
            {Object.keys(summary).length > 0 && (
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2.5 }}>
                {summary.total       != null && <Chip icon={<span style={{ fontSize: '0.9rem', paddingLeft: 6 }}>📊</span>} label={`Total: ${summary.total}`}       sx={{ background: `${currentType.color}12`, color: currentType.color, fontWeight: 700, fontSize: '0.75rem' }} />}
                {summary.moyenne     != null && <Chip icon={<span style={{ fontSize: '0.9rem', paddingLeft: 6 }}>⭐</span>} label={`Moy: ${summary.moyenne}/20`}     sx={{ background: '#4D9FFF12', color: C.blue,   fontWeight: 700, fontSize: '0.75rem' }} />}
                {summary.a_risque    != null && <Chip icon={<span style={{ fontSize: '0.9rem', paddingLeft: 6 }}>⚠️</span>} label={`À risque: ${summary.a_risque}`}  sx={{ background: '#FF6B3512', color: C.orange, fontWeight: 700, fontSize: '0.75rem' }} />}
                {summary.critique    != null && <Chip icon={<span style={{ fontSize: '0.9rem', paddingLeft: 6 }}>🚨</span>} label={`Critique: ${summary.critique}`}  sx={{ background: '#EF444412', color: C.red,    fontWeight: 700, fontSize: '0.75rem' }} />}
                {summary.tres_bien   != null && <Chip icon={<span style={{ fontSize: '0.9rem', paddingLeft: 6 }}>🏆</span>} label={`Très bien: ${summary.tres_bien}`} sx={{ background: '#22c55e12', color: '#22c55e', fontWeight: 700, fontSize: '0.75rem' }} />}
                {summary.reussite    != null && <Chip icon={<span style={{ fontSize: '0.9rem', paddingLeft: 6 }}>✅</span>} label={`Réussite: ${summary.reussite}`}   sx={{ background: '#06D6A012', color: C.green,  fontWeight: 700, fontSize: '0.75rem' }} />}
              </Box>
            )}

            {renderTable()}
          </CardContent>
        </Card>
      )}

      {/* ── Historique ── */}
      <Card sx={{ borderRadius: '16px', border: '1.5px solid #E0EAF6', boxShadow: '0 2px 12px rgba(14,102,120,0.06)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '1rem' }}>
              Historique des rapports générés
            </Typography>
            <Chip
              label={`${history.length} rapport${history.length > 1 ? 's' : ''}`}
              sx={{ background: '#E6FBF5', color: C.green, fontWeight: 800, fontSize: '0.78rem', border: `1.5px solid ${C.green}40` }}
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ borderBottom: '2px solid #E5E7EB' }}>
                  {['Date de génération','Type','Période','Établissement','Généré par','Format','Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 800, color: C.navy, fontSize: '0.78rem', py: 1.5, borderBottom: 'none', whiteSpace: 'nowrap' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((row) => (
                  <TableRow key={row.id} sx={{ borderBottom: '1px solid #F3F4F6', '&:last-child': { borderBottom: 'none' } }}>
                    <TableCell sx={{ py: 2, fontSize: '0.83rem', color: '#374151', fontWeight: 600 }}>{row.date}</TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Chip
                        label={row.type}
                        size="small"
                        sx={{
                          background: `${row.typeColor}18`,
                          color: row.typeColor,
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          border: `1px solid ${row.typeColor}30`,
                          borderRadius: '8px',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 2, fontSize: '0.83rem', color: '#6B7280' }}>{row.periode}</TableCell>
                    <TableCell sx={{ py: 2, fontSize: '0.83rem', color: '#374151' }}>{row.etablissement}</TableCell>
                    <TableCell sx={{ py: 2, fontSize: '0.83rem', color: C.teal, fontWeight: 600 }}>{row.genere_par}</TableCell>
                    <TableCell sx={{ py: 2, fontSize: '0.83rem', color: '#374151' }}>{row.format}</TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Button
                        variant="outlined" size="small"
                        startIcon={<GetApp sx={{ fontSize: '0.9rem' }} />}
                        sx={{
                          borderRadius: '8px', textTransform: 'none', fontWeight: 700,
                          fontSize: '0.75rem', borderColor: C.navy, color: C.navy,
                          '&:hover': { background: `${C.navy}08`, borderColor: C.navy },
                        }}
                      >
                        Télécharger
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
