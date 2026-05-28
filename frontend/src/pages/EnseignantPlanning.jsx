import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  CircularProgress,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Grid,
  IconButton,
} from '@mui/material';
import { ArrowBack, ArrowForward, CalendarMonth, School, EventNote } from '@mui/icons-material';
import api from '../services/api';

const COLORS = {
  primary: '#1E3A8A',
  secondary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
};

const TYPE_CONFIG = {
  'Devoir Surveillé': { color: COLORS.warning,   bg: '#FFF3E0', label: 'DS' },
  'Examen Final':     { color: COLORS.danger,    bg: '#FEE2E2', label: 'EF' },
  'Séance en ligne':  { color: COLORS.secondary, bg: '#EFF6FF', label: 'SL' },
};

const NIVEAU_COLOR = {
  LICENCE:  COLORS.secondary,
  MASTER:   COLORS.purple,
  DOCTORAT: COLORS.danger,
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

const isUpcoming = (dateStr) => dateStr && new Date(dateStr) >= new Date(new Date().toDateString());
const isPast     = (dateStr) => dateStr && new Date(dateStr) <  new Date(new Date().toDateString());

// ── STAT CARD ──────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, bg }) => (
  <Card sx={{ borderRadius: 3, border: `1.5px solid ${color}20` }}>
    <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ width: 48, height: 48, borderRadius: '14px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color, lineHeight: 1 }}>{value}</Typography>
        <Typography sx={{ fontSize: '0.78rem', color: '#6B7280', mt: 0.3 }}>{label}</Typography>
      </Box>
    </CardContent>
  </Card>
);

// ── MAIN ───────────────────────────────────────────────────────────────
const EnseignantPlanning = () => {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(true);
  const [seances, setSeances]   = useState([]);
  const [annee, setAnnee]       = useState('2025-2026');
  const [semestre, setSemestre] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [view, setView]         = useState('timeline'); // 'timeline' | 'table'

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/enseignant/dashboard/planning?annee=${annee}`);
        setSeances(res.data.data || []);
      } catch (err) {
        console.error('Erreur chargement planning:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [annee]);

  const filtered = useMemo(() => seances.filter(s => {
    if (semestre !== 'all' && String(s.semestre) !== semestre) return false;
    if (typeFilter !== 'all' && s.type_examen !== typeFilter) return false;
    return true;
  }), [seances, semestre, typeFilter]);

  // Group by date for timeline view
  const byDate = useMemo(() => {
    const map = {};
    filtered.forEach(s => {
      const key = s.date_examen || 'Sans date';
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return Object.entries(map).sort(([a], [b]) => {
      if (a === 'Sans date') return 1;
      if (b === 'Sans date') return -1;
      return b.localeCompare(a);
    });
  }, [filtered]);

  const stats = useMemo(() => ({
    total:     seances.length,
    upcoming:  seances.filter(s => isUpcoming(s.date_examen)).length,
    past:      seances.filter(s => isPast(s.date_examen)).length,
    ds:        seances.filter(s => s.type_examen === 'Devoir Surveillé').length,
    ef:        seances.filter(s => s.type_examen === 'Examen Final').length,
    sl:        seances.filter(s => s.type_examen === 'Séance en ligne').length,
  }), [seances]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: '#fff', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 2, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>
            📅
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1F2937', mb: 0.5 }}>
              Planning des examens
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Année universitaire {annee}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0, mr: -1 }}>
          <Button
            variant={view === 'timeline' ? 'contained' : 'outlined'}
            onClick={() => setView('timeline')}
            sx={{ px: 1.5, py: 1.2, borderRadius: '14px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem' }}
          >
            🗓 Timeline
          </Button>
          <Button
            variant={view === 'table' ? 'contained' : 'outlined'}
            onClick={() => setView('table')}
            sx={{ px: 1.5, py: 1.2, borderRadius: '14px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem' }}
          >
            📋 Tableau
          </Button>
          <IconButton
            onClick={() => navigate('/dashboard/enseignant')}
            sx={{
              width: 44, height: 44, borderRadius: '14px',
              background: COLORS.bg,
              border: `2px solid ${COLORS.secondary}40`,
              color: COLORS.secondary,
              transition: 'all 0.3s ease',
              '&:hover': { background: `${COLORS.secondary}20`, transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${COLORS.secondary}25` },
            }}
          >
            <ArrowForward sx={{ fontSize: 20, transform: 'rotate(180deg)' }} />
          </IconButton>
        </Box>
      </Box>

      {/* ── STAT CARDS ─────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3} md>
          <StatCard icon="📋" label="Total épreuves"    value={stats.total}    color={COLORS.primary}   bg="#EFF6FF" />
        </Grid>
        <Grid item xs={6} sm={3} md>
          <StatCard icon="🔜" label="À venir"           value={stats.upcoming} color={COLORS.success}   bg="#ECFDF5" />
        </Grid>
        <Grid item xs={6} sm={3} md>
          <StatCard icon="📝" label="Devoirs surveillés" value={stats.ds}      color={COLORS.warning}   bg="#FFF3E0" />
        </Grid>
        <Grid item xs={6} sm={3} md>
          <StatCard icon="🎯" label="Examens finaux"    value={stats.ef}       color={COLORS.danger}    bg="#FEE2E2" />
        </Grid>
        <Grid item xs={6} sm={3} md>
          <StatCard icon="💻" label="Séances en ligne"  value={stats.sl}       color={COLORS.secondary} bg="#DBEAFE" />
        </Grid>
      </Grid>

      {/* ── FILTERS ────────────────────────────────────────────────── */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          select size="small" label="Année" value={annee}
          onChange={e => setAnnee(e.target.value)} sx={{ minWidth: 140 }}
        >
          <MenuItem value="2025-2026">2025-2026</MenuItem>
        </TextField>
        <TextField
          select size="small" label="Semestre" value={semestre}
          onChange={e => setSemestre(e.target.value)} sx={{ minWidth: 140 }}
        >
          <MenuItem value="all">Tous</MenuItem>
          <MenuItem value="1">Semestre 1</MenuItem>
          <MenuItem value="2">Semestre 2</MenuItem>
        </TextField>
        <TextField
          select size="small" label="Type" value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)} sx={{ minWidth: 180 }}
        >
          <MenuItem value="all">Tous les types</MenuItem>
          <MenuItem value="Devoir Surveillé">📝 Devoir Surveillé</MenuItem>
          <MenuItem value="Examen Final">🎯 Examen Final</MenuItem>
          <MenuItem value="Séance en ligne">💻 Séance en ligne</MenuItem>
        </TextField>
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {filtered.length} épreuve{filtered.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* ── CONTENT ────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <Typography fontSize="2.5rem">📭</Typography>
            <Typography sx={{ mt: 1, color: 'text.secondary' }}>Aucune épreuve pour ces critères</Typography>
          </CardContent>
        </Card>
      ) : view === 'timeline' ? (
        // ── TIMELINE VIEW ──────────────────────────────────────────
        <Box>
          {byDate.map(([date, items]) => {
            const past = isPast(date);
            const today = new Date(date).toDateString() === new Date().toDateString();
            return (
              <Box key={date} sx={{ mb: 3, display: 'flex', gap: 2 }}>
                {/* Date label */}
                <Box sx={{ width: 90, flexShrink: 0, textAlign: 'center', pt: 0.5 }}>
                  <Box
                    sx={{
                      borderRadius: '14px',
                      p: 1.5,
                      background: today ? COLORS.primary : past ? '#F3F4F6' : '#EFF6FF',
                      border: today ? 'none' : `1.5px solid ${past ? '#E5E7EB' : '#BFDBFE'}`,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: today ? '#93C5FD' : past ? '#9CA3AF' : COLORS.secondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {date !== 'Sans date' ? new Date(date).toLocaleDateString('fr-FR', { month: 'short' }) : '—'}
                    </Typography>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: today ? '#fff' : past ? '#6B7280' : COLORS.primary, lineHeight: 1.1 }}>
                      {date !== 'Sans date' ? new Date(date).getDate() : '?'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: today ? '#93C5FD' : past ? '#9CA3AF' : '#6B7280' }}>
                      {date !== 'Sans date' ? new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' }) : ''}
                    </Typography>
                  </Box>
                  {today && (
                    <Chip label="Auj." size="small" sx={{ mt: 0.5, fontSize: '0.6rem', height: 18, background: COLORS.primary, color: '#fff', fontWeight: 700 }} />
                  )}
                </Box>

                {/* Cards for this date */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {items.map((s, i) => {
                    const cfg = TYPE_CONFIG[s.type_examen] || { color: COLORS.secondary, bg: '#EFF6FF', label: s.type_examen };
                    const niveauColor = NIVEAU_COLOR[s.type_niveau] || COLORS.secondary;
                    return (
                      <Card
                        key={i}
                        sx={{
                          borderRadius: '14px',
                          border: `1.5px solid ${past ? '#E5E7EB' : cfg.color + '30'}`,
                          opacity: past ? 0.65 : 1,
                          transition: 'all 0.2s',
                          '&:hover': { boxShadow: `0 4px 20px ${cfg.color}18`, transform: past ? 'none' : 'translateY(-1px)' },
                        }}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 42, height: 42, borderRadius: '12px', background: cfg.bg, color: cfg.color, fontWeight: 900, fontSize: '0.75rem', flexShrink: 0 }}>
                            {cfg.label}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.3 }}>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#1A3A6B' }}>{s.nom_matiere}</Typography>
                              <Typography sx={{ fontSize: '0.72rem', color: '#9CA3AF' }}>· {s.code_matiere}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography sx={{ fontSize: '0.75rem', color: '#6B7280' }}>{s.nom_specialite}</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, flexShrink: 0 }}>
                            <Chip label={s.type_examen} size="small" sx={{ fontSize: '0.68rem', height: 20, background: cfg.bg, color: cfg.color, fontWeight: 700 }} />
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Chip label={`S${s.semestre}`} size="small" sx={{ fontSize: '0.65rem', height: 18, background: '#F3F4F6', color: '#6B7280' }} />
                              <Chip label={s.type_niveau} size="small" sx={{ fontSize: '0.65rem', height: 18, background: `${niveauColor}15`, color: niveauColor, fontWeight: 700 }} />
                              <Chip label={`coef. ${s.coefficient}`} size="small" sx={{ fontSize: '0.65rem', height: 18, background: '#F3F4F6', color: '#6B7280' }} />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </Box>
      ) : (
        // ── TABLE VIEW ─────────────────────────────────────────────
        <Card sx={{ borderRadius: 3 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: '#F9FAFB' }}>
                  {['Date', 'Matière', 'Spécialité', 'Type', 'Semestre', 'Niveau', 'Coef.'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((s, i) => {
                  const cfg = TYPE_CONFIG[s.type_examen] || { color: COLORS.secondary, bg: '#EFF6FF' };
                  const past = isPast(s.date_examen);
                  const niveauColor = NIVEAU_COLOR[s.type_niveau] || COLORS.secondary;
                  return (
                    <TableRow key={i} sx={{ opacity: past ? 0.6 : 1, '&:hover': { background: '#F9FAFB' } }}>
                      <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: past ? '#9CA3AF' : COLORS.primary }}>
                            {formatDateShort(s.date_examen)}
                          </Typography>
                          <Typography sx={{ fontSize: '0.68rem', color: '#9CA3AF' }}>
                            {s.date_examen ? new Date(s.date_examen).toLocaleDateString('fr-FR', { weekday: 'short' }) : ''}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{s.nom_matiere}</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#9CA3AF' }}>{s.code_matiere}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', color: '#4B5563', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.nom_specialite}
                      </TableCell>
                      <TableCell>
                        <Chip label={s.type_examen} size="small" sx={{ fontSize: '0.68rem', height: 20, background: cfg.bg, color: cfg.color, fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={`S${s.semestre}`} size="small" sx={{ fontSize: '0.68rem', height: 20, background: '#F3F4F6', color: '#6B7280' }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={s.type_niveau} size="small" sx={{ fontSize: '0.68rem', height: 20, background: `${niveauColor}15`, color: niveauColor, fontWeight: 700 }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#1A3A6B' }}>{s.coefficient}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
};

export default EnseignantPlanning;
