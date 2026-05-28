import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip,
  CircularProgress, Grid, IconButton, Tooltip,
  TextField, MenuItem, LinearProgress,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert,
} from '@mui/material';
import { ArrowBack, EventNote, CheckCircle, Cancel, FilterList, Add } from '@mui/icons-material';
import axios from 'axios';
import config from '../config';

const C = {
  primary:   '#1E3A8A',
  secondary: '#3B82F6',
  success:   '#10B981',
  warning:   '#F59E0B',
  danger:    '#EF4444',
  purple:    '#8B5CF6',
};

const StatBox = ({ icon, label, value, color, sub }) => (
  <Card sx={{ borderRadius: 2.5, border: `1.5px solid ${color}20`,
    background: `linear-gradient(135deg, ${color}08, ${color}15)`,
    transition: 'all 0.25s', '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 24px ${color}18` } }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
          {icon}
        </Box>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#6B7280' }}>{label}</Typography>
      </Box>
      <Typography sx={{ fontWeight: 800, fontSize: '1.8rem', color: C.primary, lineHeight: 1 }}>{value}</Typography>
      {sub && <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF', mt: 0.5, fontWeight: 600 }}>{sub}</Typography>}
    </CardContent>
  </Card>
);

export default function EtudiantAbsences() {
  const navigate = useNavigate();

  const [loading, setLoading]   = useState(true);
  const [data, setData]         = useState({ absences: [], stats: { total: 0, justifiees: 0, non_justifiees: 0 } });

  // Filtres
  const [filterSemestre, setFilterSemestre] = useState('');
  const [filterType, setFilterType]         = useState('');
  const [filterStatut, setFilterStatut]     = useState('');

  // Déclaration d'absence
  const [declareOpen, setDeclareOpen]     = useState(false);
  const [declareForm, setDeclareForm]     = useState({ date: new Date().toISOString().slice(0, 10), type_seance: 'CM', semestre: '' });
  const [declareLoading, setDeclareLoading] = useState(false);
  const [declareError, setDeclareError]   = useState('');
  const [declareSuccess, setDeclareSuccess] = useState(false);

  const fetchAbsences = () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    axios.get(`${config.apiUrl}/etudiant/absences`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => setData(r.data.data || { absences: [], stats: { total: 0, justifiees: 0, non_justifiees: 0 } }))
      .catch(err => console.error('Erreur absences:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAbsences(); }, []);

  const handleDeclare = async () => {
    if (!declareForm.date || !declareForm.type_seance) return;
    setDeclareLoading(true);
    setDeclareError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${config.apiUrl}/etudiant/absences`, declareForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeclareOpen(false);
      setDeclareForm({ date: new Date().toISOString().slice(0, 10), type_seance: 'CM', semestre: '' });
      setDeclareSuccess(true);
      setTimeout(() => setDeclareSuccess(false), 4000);
      fetchAbsences();
    } catch (err) {
      setDeclareError(err.response?.data?.message || 'Erreur lors de la déclaration.');
    } finally {
      setDeclareLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const { absences, stats } = data;

  // Semestres distincts
  const semestres = [...new Set(absences.map(a => a.semestre).filter(Boolean))].sort((a, b) => a - b);
  const types     = [...new Set(absences.map(a => a.type_seance).filter(Boolean))].sort();

  // Filtrage
  const filtered = absences.filter(a => {
    if (filterSemestre && String(a.semestre) !== String(filterSemestre)) return false;
    if (filterType && a.type_seance !== filterType) return false;
    if (filterStatut === 'justifiee' && !a.justifiee) return false;
    if (filterStatut === 'non_justifiee' && a.justifiee) return false;
    return true;
  });

  // Regrouper par mois pour l'affichage
  const byMonth = filtered.reduce((acc, a) => {
    const d   = new Date(a.date_absence);
    const key = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const tauxJust = stats.total > 0 ? Math.round((stats.justifiees / stats.total) * 100) : 0;

  return (
    <Box sx={{ pb: 4 }}>

      {/* ── Header ── */}
      <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: '#fff', border: '1px solid #E5E7EB',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 2, background: `${C.danger}12`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
            📋
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: C.primary, mb: 0.3 }}>
              Mes Absences
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Historique complet de vos absences et leur statut de justification
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => { setDeclareError(''); setDeclareOpen(true); }}
            sx={{
              borderRadius: '12px', textTransform: 'none', fontWeight: 700,
              background: C.danger, fontSize: '0.88rem', px: 2,
              '&:hover': { background: '#DC2626' },
            }}
          >
            Déclarer une absence
          </Button>
          <Tooltip title="Retour au tableau de bord">
            <IconButton onClick={() => navigate('/dashboard/etudiant')}
              sx={{ width: 44, height: 44, borderRadius: '14px', background: '#F0F4FF',
                border: '2px solid #3B82F640', color: C.secondary, transition: 'all 0.3s ease',
                '&:hover': { background: '#3B82F620', transform: 'translateY(-2px)' } }}>
              <ArrowBack sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Confirmation */}
      {declareSuccess && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2, fontWeight: 600 }}
          onClose={() => setDeclareSuccess(false)}>
          ✓ Votre absence a été déclarée avec succès et transmise à votre enseignant.
        </Alert>
      )}

      {/* ── Stat cards ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <StatBox icon="📋" label="Total absences" value={stats.total} color={C.danger}
            sub={stats.total === 0 ? 'Aucune absence' : undefined} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatBox icon="✅" label="Justifiées" value={stats.justifiees} color={C.success}
            sub={stats.total > 0 ? `${tauxJust}% du total` : undefined} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatBox icon="⚠️" label="Non justifiées" value={stats.non_justifiees} color={C.warning}
            sub={stats.total > 0 ? `${100 - tauxJust}% du total` : undefined} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 2.5, border: `1.5px solid ${C.secondary}20`,
            background: `linear-gradient(135deg, ${C.secondary}08, ${C.secondary}15)` }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, background: C.secondary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  📊
                </Box>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#6B7280' }}>
                  Taux de justification
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.8rem', color: C.primary, lineHeight: 1, mb: 1 }}>
                {tauxJust}%
              </Typography>
              <LinearProgress variant="determinate" value={tauxJust}
                sx={{ height: 6, borderRadius: 3, background: '#E5E7EB',
                  '& .MuiLinearProgress-bar': {
                    background: tauxJust >= 80 ? C.success : tauxJust >= 50 ? C.warning : C.danger,
                    borderRadius: 3,
                  } }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Contenu principal ── */}
      <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB' }}>
        <CardContent sx={{ p: 3 }}>

          {stats.total === 0 ? (
            /* ── Aucune absence ── */
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '4rem', mb: 2 }}>🎉</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: C.primary, mb: 1 }}>
                Félicitations ! Aucune absence enregistrée
              </Typography>
              <Typography sx={{ color: '#6B7280', fontSize: '0.95rem' }}>
                Votre assiduité est exemplaire. Continuez comme ça !
              </Typography>
            </Box>
          ) : (
            <>
              {/* ── Filtres ── */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <FilterList sx={{ fontSize: 18, color: '#9CA3AF' }} />
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#6B7280' }}>Filtrer :</Typography>
                </Box>

                {semestres.length > 1 && (
                  <TextField select size="small" label="Semestre" sx={{ minWidth: 130 }}
                    value={filterSemestre}
                    onChange={e => setFilterSemestre(e.target.value)}>
                    <MenuItem value="">Tous</MenuItem>
                    {semestres.map(s => <MenuItem key={s} value={s}>S{s}</MenuItem>)}
                  </TextField>
                )}

                {types.length > 1 && (
                  <TextField select size="small" label="Type de séance" sx={{ minWidth: 150 }}
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}>
                    <MenuItem value="">Tous</MenuItem>
                    {types.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                )}

                <TextField select size="small" label="Statut" sx={{ minWidth: 160 }}
                  value={filterStatut}
                  onChange={e => setFilterStatut(e.target.value)}>
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="justifiee">Justifiées</MenuItem>
                  <MenuItem value="non_justifiee">Non justifiées</MenuItem>
                </TextField>

                {(filterSemestre || filterType || filterStatut) && (
                  <Chip label="Réinitialiser" size="small" variant="outlined"
                    onClick={() => { setFilterSemestre(''); setFilterType(''); setFilterStatut(''); }}
                    sx={{ fontWeight: 700, cursor: 'pointer' }} />
                )}

                <Typography sx={{ ml: 'auto', fontSize: '0.82rem', color: '#9CA3AF', fontWeight: 600 }}>
                  {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
                </Typography>
              </Box>

              {/* ── Résultat vide après filtrage ── */}
              {filtered.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>🔍</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#374151' }}>Aucun résultat</Typography>
                  <Typography sx={{ color: '#9CA3AF', fontSize: '0.88rem', mt: 0.5 }}>
                    Modifiez vos filtres pour voir plus de résultats
                  </Typography>
                </Box>
              ) : (
                /* ── Liste groupée par mois ── */
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {Object.entries(byMonth).map(([month, items]) => (
                    <Box key={month}>
                      {/* En-tête du mois */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: C.primary,
                          textTransform: 'capitalize' }}>
                          📅 {month}
                        </Typography>
                        <Chip label={`${items.length} absence${items.length > 1 ? 's' : ''}`}
                          size="small" sx={{ fontWeight: 700, fontSize: '0.72rem',
                            background: '#EFF6FF', color: C.secondary }} />
                      </Box>

                      {/* Absences du mois */}
                      <Box sx={{ border: '1px solid #E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                        {items.map((a, i) => {
                          const dateStr = new Date(a.date_absence).toLocaleDateString('fr-FR', {
                            weekday: 'long', day: '2-digit', month: 'long',
                          });
                          return (
                            <Box key={a.id_absence} sx={{
                              display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
                              px: 2.5, py: 2,
                              borderLeft: `4px solid ${a.justifiee ? C.success : C.danger}`,
                              background: a.justifiee
                                ? (i % 2 === 0 ? '#F0FDF4' : '#FAFFF9')
                                : (i % 2 === 0 ? '#FFF5F5' : '#FFFAFA'),
                              borderBottom: i < items.length - 1 ? '1px solid #F3F4F6' : 'none',
                              transition: 'background 0.15s',
                              '&:hover': { background: a.justifiee ? '#DCFCE7' : '#FEE2E2' },
                            }}>
                              {/* Icône statut */}
                              {a.justifiee
                                ? <CheckCircle sx={{ color: C.success, fontSize: 20, flexShrink: 0 }} />
                                : <Cancel sx={{ color: C.danger, fontSize: 20, flexShrink: 0 }} />
                              }

                              {/* Date */}
                              <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, minWidth: 160,
                                color: a.justifiee ? '#065F46' : '#991B1B', textTransform: 'capitalize' }}>
                                {dateStr}
                              </Typography>

                              {/* Type de séance */}
                              <Chip label={a.type_seance} size="small"
                                sx={{ fontWeight: 700, fontSize: '0.75rem', minWidth: 48, textAlign: 'center',
                                  background: a.justifiee ? '#D1FAE5' : '#FEE2E2',
                                  color: a.justifiee ? '#065F46' : '#991B1B' }} />

                              {/* Spécialité + semestre */}
                              <Typography sx={{ fontSize: '0.88rem', color: '#374151', fontWeight: 600, flex: 1 }}>
                                {a.nom_specialite}
                                {a.semestre ? (
                                  <Chip label={`S${a.semestre}`} size="small"
                                    sx={{ ml: 1, fontWeight: 700, fontSize: '0.7rem',
                                      background: '#EFF6FF', color: C.primary }} />
                                ) : null}
                              </Typography>

                              {/* Enseignant */}
                              {a.enseignant_nom && (
                                <Typography sx={{ fontSize: '0.78rem', color: '#6B7280', flexShrink: 0 }}>
                                  👤 {a.enseignant_nom}
                                </Typography>
                              )}

                              {/* Badge statut */}
                              <Chip
                                icon={a.justifiee
                                  ? <CheckCircle sx={{ fontSize: '14px !important' }} />
                                  : <Cancel sx={{ fontSize: '14px !important' }} />
                                }
                                label={a.justifiee ? 'Justifiée' : 'Non justifiée'}
                                size="small"
                                sx={{
                                  fontWeight: 700, fontSize: '0.75rem', flexShrink: 0,
                                  background: a.justifiee ? '#D1FAE5' : '#FEF3C7',
                                  color: a.justifiee ? '#065F46' : '#92400E',
                                  '& .MuiChip-icon': { color: 'inherit' },
                                }}
                              />
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
      {/* ── Dialog : Déclarer une absence ── */}
      <Dialog open={declareOpen} onClose={() => setDeclareOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: C.primary, pb: 1 }}>
          📋 Déclarer une absence
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.85rem', color: '#6B7280', mb: 2 }}>
            Signalez votre absence. Votre enseignant sera informé et pourra la valider ou la justifier.
          </Typography>
          {declareError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.85rem' }}>
              {declareError}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Date de l'absence" type="date" fullWidth
              InputLabelProps={{ shrink: true }}
              value={declareForm.date}
              onChange={e => setDeclareForm(p => ({ ...p, date: e.target.value }))}
            />
            <TextField
              select label="Type de séance" fullWidth
              value={declareForm.type_seance}
              onChange={e => setDeclareForm(p => ({ ...p, type_seance: e.target.value }))}
            >
              {['CM', 'TD', 'TP', 'Examen'].map(t => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
            <TextField
              select label="Semestre (optionnel)" fullWidth
              value={declareForm.semestre}
              onChange={e => setDeclareForm(p => ({ ...p, semestre: e.target.value }))}
            >
              <MenuItem value="">— Non précisé —</MenuItem>
              {[1, 2, 3, 4, 5, 6].map(s => (
                <MenuItem key={s} value={s}>Semestre {s}</MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeclareOpen(false)}
            sx={{ textTransform: 'none', fontWeight: 700, color: '#6B7280' }}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleDeclare}
            disabled={declareLoading || !declareForm.date || !declareForm.type_seance}
            sx={{
              textTransform: 'none', fontWeight: 700, borderRadius: '10px',
              background: C.danger, '&:hover': { background: '#DC2626' },
            }}
          >
            {declareLoading ? <CircularProgress size={20} color="inherit" /> : 'Déclarer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
