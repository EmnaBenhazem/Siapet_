import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, Button,
  TextField, MenuItem, CircularProgress, Avatar,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Collapse, IconButton, Tooltip,
  LinearProgress, Grid, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import {
  ExpandMore, ExpandLess, ArrowBack,
  TrendingUp, TrendingDown, TrendingFlat, Download, Refresh,
} from '@mui/icons-material';
import api from '../services/api';

const C = {
  primary:   '#1E3A8A',
  secondary: '#3B82F6',
  success:   '#10B981',
  warning:   '#F59E0B',
  danger:    '#EF4444',
  purple:    '#8B5CF6',
};

const NIVEAU_COLORS = {
  L1: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
  L2: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
  L3: { bg: '#FDF4FF', border: '#E9D5FF', text: '#7E22CE' },
};

const SEM_LABELS = { 1:'S1',2:'S2',3:'S3',4:'S4',5:'S5',6:'S6' };

function MoyenneChip({ moy }) {
  if (moy === null || moy === undefined) return <Chip label="—" size="small" sx={{ color: '#9CA3AF' }} />;
  const color = moy >= 16 ? C.success : moy >= 12 ? C.secondary : moy >= 10 ? C.warning : C.danger;
  return (
    <Chip label={`${parseFloat(moy).toFixed(2)}/20`} size="small"
      sx={{ fontWeight: 700, background: `${color}15`, color, border: `1px solid ${color}30`, fontSize: '0.78rem' }} />
  );
}

function TrendIcon({ val }) {
  if (val === null || val === undefined) return null;
  if (val > 0.5)  return <TrendingUp  sx={{ color: C.success, fontSize: 18 }} />;
  if (val < -0.5) return <TrendingDown sx={{ color: C.danger,  fontSize: 18 }} />;
  return <TrendingFlat sx={{ color: C.warning, fontSize: 18 }} />;
}

function SemCard({ sem }) {
  const [open, setOpen] = useState(false);
  const nc = NIVEAU_COLORS[sem.niveau] || NIVEAU_COLORS.L1;
  const moy = sem.moyenne !== null ? parseFloat(sem.moyenne) : null;
  const barColor = moy >= 10 ? C.success : C.danger;

  return (
    <Box sx={{ border: `1px solid ${nc.border}`, borderRadius: 2, overflow: 'hidden', mb: 1 }}>
      <Box onClick={() => setOpen(o => !o)} sx={{
        display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5,
        background: nc.bg, cursor: 'pointer', '&:hover': { opacity: 0.9 },
      }}>
        <Chip label={`${sem.niveau} · ${SEM_LABELS[sem.semestre]}`} size="small"
          sx={{ fontWeight: 800, background: nc.border, color: nc.text, minWidth: 64 }} />
        <Typography sx={{ fontSize: '0.8rem', color: '#6B7280', flex: 1 }}>{sem.annee_academique}</Typography>
        <MoyenneChip moy={moy} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
            {sem.nb_absences} abs · {sem.nb_matieres_validees}/{sem.nb_matieres_total} mat. validées
          </Typography>
        </Box>
        <Chip label={sem.statut} size="small"
          sx={{ fontWeight: 700, fontSize: '0.7rem',
            background: sem.statut === 'Admis' ? '#D1FAE5' : '#FEE2E2',
            color: sem.statut === 'Admis' ? '#065F46' : '#991B1B' }} />
        {open ? <ExpandLess sx={{ color: '#9CA3AF', fontSize: 18 }} /> : <ExpandMore sx={{ color: '#9CA3AF', fontSize: 18 }} />}
      </Box>

      <LinearProgress variant="determinate" value={moy !== null ? (moy / 20) * 100 : 0}
        sx={{ height: 3, backgroundColor: '#E5E7EB',
          '& .MuiLinearProgress-bar': { backgroundColor: barColor } }} />

      <Collapse in={open}>
        <Box sx={{ px: 2, py: 1.5, background: '#FAFAFA' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Matière','Coef','DS','TP','Examen','Finale','Abs','Validé'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#6B7280', py: 0.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {sem.matieres.map((m, i) => (
                  <TableRow key={i} sx={{ '&:hover': { background: '#F0F4FF' } }}>
                    <TableCell sx={{ fontSize: '0.78rem', fontWeight: 600, color: C.primary, py: 0.8 }}>
                      {m.nom_matiere}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: '#6B7280', py: 0.8 }}>{m.coefficient}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.8 }}>{m.note_ds ?? '—'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.8 }}>{m.note_tp ?? '—'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.8 }}>{m.note_examen ?? '—'}</TableCell>
                    <TableCell sx={{ py: 0.8 }}>
                      <MoyenneChip moy={m.note_finale} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.8 }}>{m.nb_absences_matiere}</TableCell>
                    <TableCell sx={{ py: 0.8 }}>
                      <Chip label={m.valide ? '✓' : '✗'} size="small"
                        sx={{ fontWeight: 700, fontSize: '0.7rem', height: 20,
                          background: m.valide ? '#D1FAE5' : '#FEE2E2',
                          color: m.valide ? '#065F46' : '#991B1B' }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Collapse>
    </Box>
  );
}

// KPI card
function StatCard({ icon, value, label, color }) {
  return (
    <Card sx={{
      borderRadius: 3, p: 2.5, textAlign: 'center',
      border: `1.5px solid ${color}25`,
      boxShadow: `0 2px 12px ${color}12`,
      background: '#fff',
    }}>
      <Typography sx={{ fontSize: '1.6rem', lineHeight: 1.2, mb: 0.5 }}>{icon}</Typography>
      <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color, lineHeight: 1.1 }}>{value}</Typography>
      <Typography sx={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 600, mt: 0.3 }}>{label}</Typography>
    </Card>
  );
}

export default function EnseignantHistorique() {
  const navigate = useNavigate();
  const [specialites, setSpecialites]   = useState([]);
  const [selectedSpec, setSelectedSpec] = useState('');
  const [students, setStudents]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [expandedStu, setExpandedStu]   = useState(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');
  const [sortBy, setSortBy]             = useState('moy');

  useEffect(() => {
    api.get('/enseignant/dashboard/filters')
      .then(r => {
        const m = r.data.data?.matieres || [];
        setSpecialites(m);
        if (m.length > 0) setSelectedSpec(m[0].id_specialite);
      })
      .catch(console.error);
  }, []);

  const loadHistorique = useCallback(async (specId) => {
    if (!specId) return;
    setLoading(true);
    setStudents([]);
    try {
      const r = await api.get(`/ml/historique?id_specialite=${specId}`);
      const rows = r.data.data || [];

      const map = {};
      for (const row of rows) {
        const key = row.numero_utilisateur;
        if (!map[key]) {
          map[key] = {
            id: key, nom: row.nom, prenom: row.prenom,
            specialite: row.nom_specialite, semestres: [],
          };
        }
        map[key].semestres.push(row);
      }

      const list = Object.values(map).map(stu => {
        const moys = stu.semestres
          .map(s => s.moyenne !== null ? parseFloat(s.moyenne) : null)
          .filter(v => v !== null);
        const avg        = moys.length > 0 ? parseFloat((moys.reduce((a, b) => a + b, 0) / moys.length).toFixed(2)) : null;
        const absTotal   = stu.semestres.reduce((a, s) => a + (s.nb_absences || 0), 0);
        const creditsTotal = stu.semestres.reduce((a, s) => a + parseFloat(s.credits_valides || 0), 0);

        const moyByNiv = { L1: [], L2: [], L3: [] };
        for (const s of stu.semestres) {
          if (s.moyenne !== null) moyByNiv[s.niveau]?.push(parseFloat(s.moyenne));
        }
        const nivAvg = niv => moyByNiv[niv].length > 0
          ? moyByNiv[niv].reduce((a, b) => a + b, 0) / moyByNiv[niv].length : null;
        const l1 = nivAvg('L1'), l2 = nivAvg('L2'), l3 = nivAvg('L3');
        const trend = l1 !== null && l3 !== null ? parseFloat((l3 - l1).toFixed(2)) : null;

        return { ...stu, moyenneGlobale: avg, absTotal, creditsTotal: parseFloat(creditsTotal.toFixed(1)), trend, l1, l2, l3 };
      });

      setStudents(list.sort((a, b) => (b.moyenneGlobale || 0) - (a.moyenneGlobale || 0)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistorique(selectedSpec); }, [selectedSpec, loadHistorique]);

  const handleExport = async () => {
    try {
      const r = await api.get(`/ml/dataset?id_specialite=${selectedSpec}`);
      const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a'); a.href = url;
      a.download = `dataset_ml_spec${selectedSpec}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
  };

  // Computed stats from full loaded data (not filtered by name/niveau)
  const stats = useMemo(() => {
    if (!students.length) return null;
    const withMoy = students.filter(s => s.moyenneGlobale !== null);
    const avg = withMoy.length
      ? withMoy.reduce((a, b) => a + b.moyenneGlobale, 0) / withMoy.length
      : 0;
    const admis   = withMoy.filter(s => s.moyenneGlobale >= 10).length;
    const risque  = withMoy.filter(s => s.moyenneGlobale < 10).length;
    const critique = withMoy.filter(s => s.moyenneGlobale < 7).length;
    const tauxReussite = withMoy.length ? Math.round(admis / withMoy.length * 100) : 0;
    const totalSem = students.reduce((a, s) => a + s.semestres.length, 0);

    return {
      total: students.length,
      moyenne: Math.round(avg * 100) / 100,
      taux_reussite: tauxReussite,
      nb_risque: risque,
      nb_critique: critique,
      total_semestres: totalSem,
    };
  }, [students]);

  // Filtered + sorted student list
  const filtered = useMemo(() => {
    let list = students.filter(s => {
      const matchSearch = `${s.nom} ${s.prenom}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchNiveau = !filterNiveau || s.semestres.some(sem => sem.niveau === filterNiveau);
      return matchSearch && matchNiveau;
    });
    switch (sortBy) {
      case 'trend': return [...list].sort((a, b) => (b.trend ?? -99) - (a.trend ?? -99));
      case 'abs':   return [...list].sort((a, b) => (b.absTotal || 0) - (a.absTotal || 0));
      case 'name':  return [...list].sort((a, b) => a.nom.localeCompare(b.nom));
      default:      return [...list].sort((a, b) => (b.moyenneGlobale || 0) - (a.moyenneGlobale || 0));
    }
  }, [students, searchTerm, sortBy, filterNiveau]);

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3, p: 3, borderRadius: 3, background: '#fff', border: '1px solid #E5E7EB',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 52, height: 52, borderRadius: 2, background: `${C.purple}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
            🎓
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: C.primary }}>
              Historique académique L1 / L2 / L3
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Notes et absences par semestre — données pour la prédiction ML
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Tooltip title="Rafraîchir les données">
            <IconButton onClick={() => loadHistorique(selectedSpec)} disabled={loading}
              sx={{ borderRadius: '14px', background: '#F0F4FF', border: '2px solid #3B82F640', color: C.secondary }}>
              <Refresh sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Exporter le dataset ML (JSON)">
            <Button variant="outlined" startIcon={<Download />} onClick={handleExport}
              disabled={!selectedSpec}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, borderColor: C.purple, color: C.purple,
                '&:hover': { background: `${C.purple}10` } }}>
              Dataset ML
            </Button>
          </Tooltip>
          <Tooltip title="Retour au tableau de bord">
            <IconButton onClick={() => navigate('/dashboard/enseignant')}
              sx={{ borderRadius: '14px', background: '#F0F4FF', border: '2px solid #3B82F640', color: C.secondary }}>
              <ArrowBack sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* KPI stats */}
      {stats && !loading && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <StatCard icon="👥" value={stats.total} label="Étudiants" color={C.secondary} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon="📊" value={`${stats.moyenne}/20`} label="Moyenne globale" color={C.primary} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon="✅" value={`${stats.taux_reussite}%`} label="Taux de réussite" color={C.success} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon="⚠️" value={stats.nb_risque} label="Étudiants à risque" color={C.danger} />
          </Grid>
        </Grid>
      )}

      {/* Filters row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Specialty */}
        <TextField select label="Spécialité" sx={{ minWidth: 260 }}
          value={selectedSpec}
          onChange={e => { setSelectedSpec(e.target.value); setExpandedStu(null); setFilterNiveau(''); }}>
          {specialites.map(m => (
            <MenuItem key={m.id_specialite} value={m.id_specialite}>{m.nom_specialite}</MenuItem>
          ))}
        </TextField>

        {/* Search */}
        <TextField label="Rechercher un étudiant" sx={{ minWidth: 220 }}
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          placeholder="Nom ou prénom..." />

        {/* Niveau toggle */}
        <ToggleButtonGroup
          value={filterNiveau} exclusive size="small"
          onChange={(_, v) => { setFilterNiveau(v ?? ''); setExpandedStu(null); }}
          sx={{ height: 40 }}>
          {[{ v: '', label: 'Tous' }, { v: 'L1', label: 'L1' }, { v: 'L2', label: 'L2' }, { v: 'L3', label: 'L3' }].map(opt => (
            <ToggleButton key={opt.v} value={opt.v}
              sx={{ fontWeight: 700, px: 1.5, textTransform: 'none', fontSize: '0.8rem',
                '&.Mui-selected': {
                  background: `${C.purple}18`, color: C.purple,
                  borderColor: `${C.purple}60`,
                } }}>
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {/* Sort */}
        <TextField select label="Trier par" value={sortBy} onChange={e => setSortBy(e.target.value)}
          sx={{ minWidth: 150 }} size="small">
          <MenuItem value="moy">Moyenne ↓</MenuItem>
          <MenuItem value="trend">Tendance ↓</MenuItem>
          <MenuItem value="abs">Absences ↓</MenuItem>
          <MenuItem value="name">Nom A→Z</MenuItem>
        </TextField>

        {loading && <CircularProgress size={24} sx={{ color: C.purple }} />}

        {!loading && students.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, ml: 'auto', flexWrap: 'wrap' }}>
            <Chip label={`${filtered.length} / ${students.length} étudiants`}
              sx={{ fontWeight: 700, background: '#EFF6FF', color: C.primary }} />
            <Chip label={`${stats?.total_semestres ?? 0} semestres`}
              sx={{ fontWeight: 700, background: `${C.purple}15`, color: C.purple }} />
            {stats?.nb_critique > 0 && (
              <Chip label={`${stats.nb_critique} critiques`}
                sx={{ fontWeight: 700, background: '#FEE2E2', color: '#991B1B' }} />
            )}
          </Box>
        )}
      </Box>

      {/* Student list */}
      {filtered.map(stu => {
        const isExpanded = expandedStu === stu.id;
        const displayedSemestres = filterNiveau
          ? stu.semestres.filter(s => s.niveau === filterNiveau)
          : stu.semestres;

        return (
          <Card key={stu.id} sx={{ mb: 2, borderRadius: 3, border: '1px solid #E5E7EB',
            boxShadow: isExpanded ? '0 4px 20px #3B82F620' : 'none', transition: 'box-shadow 0.2s' }}>
            {/* Student header row */}
            <Box onClick={() => setExpandedStu(isExpanded ? null : stu.id)}
              sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, py: 2,
                cursor: 'pointer', '&:hover': { background: '#FAFAFA' } }}>
              <Avatar sx={{ background: '#EFF6FF', color: C.primary, fontWeight: 800, width: 44, height: 44, fontSize: '0.9rem' }}>
                {stu.nom[0]}{stu.prenom[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 800, color: C.primary, fontSize: '0.95rem' }}>
                  {stu.nom} {stu.prenom}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                  {stu.semestres.length} semestre{stu.semestres.length > 1 ? 's' : ''}
                  {filterNiveau && displayedSemestres.length !== stu.semestres.length
                    ? ` · ${displayedSemestres.length} en ${filterNiveau}` : ''}
                </Typography>
              </Box>

              {/* L1 / L2 / L3 averages */}
              <Grid container spacing={1} sx={{ maxWidth: 340 }}>
                {[['L1', stu.l1], ['L2', stu.l2], ['L3', stu.l3]].map(([lbl, val]) => (
                  <Grid item xs={4} key={lbl}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700,
                        color: filterNiveau === lbl ? C.purple : '#9CA3AF', mb: 0.2 }}>{lbl}</Typography>
                      <MoyenneChip moy={val} />
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                <TrendIcon val={stu.trend} />
                {stu.trend !== null && (
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 700,
                    color: stu.trend > 0 ? C.success : stu.trend < 0 ? C.danger : C.warning }}>
                    {stu.trend > 0 ? '+' : ''}{stu.trend}
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label={`${stu.absTotal} abs`} size="small"
                  sx={{ fontWeight: 700, fontSize: '0.72rem',
                    background: stu.absTotal > 15 ? '#FEE2E2' : stu.absTotal > 8 ? '#FEF3C7' : '#D1FAE5',
                    color: stu.absTotal > 15 ? '#991B1B' : stu.absTotal > 8 ? '#92400E' : '#065F46' }} />
                <Chip label={`${stu.creditsTotal} cr.`} size="small"
                  sx={{ fontWeight: 700, fontSize: '0.72rem', background: '#EDE9FE', color: C.purple }} />
              </Box>

              {isExpanded ? <ExpandLess sx={{ color: '#9CA3AF' }} /> : <ExpandMore sx={{ color: '#9CA3AF' }} />}
            </Box>

            {/* Expanded semestres — filtered by niveau if active */}
            <Collapse in={isExpanded}>
              <CardContent sx={{ px: 3, pt: 0, pb: 2 }}>
                {filterNiveau && displayedSemestres.length === 0 ? (
                  <Typography sx={{ py: 2, color: '#9CA3AF', textAlign: 'center', fontSize: '0.85rem' }}>
                    Aucun semestre {filterNiveau} pour cet étudiant.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                    {displayedSemestres.map((sem, i) => <SemCard key={i} sem={sem} />)}
                  </Box>
                )}
              </CardContent>
            </Collapse>
          </Card>
        );
      })}

      {!loading && filtered.length === 0 && (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '3rem', mb: 1 }}>📂</Typography>
          <Typography sx={{ fontWeight: 700, color: '#374151' }}>
            {students.length === 0 ? 'Aucune donnée historique pour cette spécialité' : 'Aucun étudiant trouvé'}
          </Typography>
          {students.length === 0 && (
            <Typography sx={{ color: '#9CA3AF', mt: 1, fontSize: '0.875rem' }}>
              Vérifiez que le seed historique a été exécuté pour cette spécialité.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
