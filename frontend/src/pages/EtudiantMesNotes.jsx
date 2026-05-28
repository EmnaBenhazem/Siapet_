import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip,
  CircularProgress, Tabs, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip,
} from '@mui/material';
import { TrendingUp, TrendingDown, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
} from 'recharts';
import api from '../services/api';

const C = {
  primary: '#1A3A6B',
  blue: '#4D9FFF',
  blueL: '#EAF4FF',
  green: '#06D6A0',
  orange: '#FF6B35',
  danger: '#EF4444',
  warning: '#F59E0B',
  purple: '#8B5CF6',
};

const noteColor = (n) => {
  if (n >= 16) return C.green;
  if (n >= 14) return C.blue;
  if (n >= 12) return '#06B6D4';
  if (n >= 10) return C.warning;
  return C.danger;
};

const noteLabel = (n) => {
  if (n >= 16) return 'Excellent';
  if (n >= 14) return 'Très bien';
  if (n >= 12) return 'Bien';
  if (n >= 10) return 'Passable';
  return 'Insuffisant';
};

const NoteBadge = ({ note }) => {
  const color = noteColor(note);
  return (
    <Chip
      label={`${note}/20`}
      size="small"
      sx={{
        background: `${color}18`,
        color,
        fontWeight: 700,
        fontSize: '0.8rem',
        border: `1.5px solid ${color}35`,
        minWidth: 66,
      }}
    />
  );
};

const StatCard = ({ icon, label, value, sub, color }) => (
  <Card sx={{
    borderRadius: 3,
    border: `1.5px solid ${color}30`,
    background: `linear-gradient(135deg, ${color}08, ${color}18)`,
    transition: 'all 0.3s',
    '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${color}20` },
  }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 48, height: 48, borderRadius: 2, background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', flexShrink: 0,
        }}>
          {icon}
        </Box>
        <Box>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem', fontWeight: 600 }}>{label}</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: '1.55rem', color: C.primary, lineHeight: 1.1 }}>
            {value}
          </Typography>
          {sub && <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>{sub}</Typography>}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default function EtudiantMesNotes() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabSemestre, setTabSemestre] = useState(0);
  const [tabView, setTabView] = useState(0);

  useEffect(() => {
    api.get('/etudiant/notes')
      .then(r => setNotes(r.data.data || []))
      .catch(err => console.error('Erreur chargement notes:', err))
      .finally(() => setLoading(false));
  }, []);

  const semestres = useMemo(
    () => [...new Set(notes.map(n => n.semestre).filter(Boolean))].sort((a, b) => a - b),
    [notes]
  );

  const filtered = useMemo(() => {
    if (tabSemestre === 0) return notes;
    return notes.filter(n => n.semestre === semestres[tabSemestre - 1]);
  }, [notes, tabSemestre, semestres]);

  // Group by subject
  const bySubject = useMemo(() => {
    const map = {};
    filtered.forEach(n => {
      if (!map[n.id_matiere]) {
        map[n.id_matiere] = {
          id_matiere: n.id_matiere,
          nom_matiere: n.nom_matiere,
          code_matiere: n.code_matiere,
          semestre: n.semestre,
          coef_matiere: parseFloat(n.coef_matiere) || 1,
          evaluations: [],
        };
      }
      map[n.id_matiere].evaluations.push({
        id_examen: n.id_examen,
        type_examen: n.type_examen,
        date_examen: n.date_examen,
        coef_examen: parseFloat(n.coef_examen) || 1,
        annee_universitaire: n.annee_universitaire,
        note: parseFloat(n.note),
      });
    });
    return Object.values(map);
  }, [filtered]);

  // Weighted average per subject
  const subjectAverages = useMemo(() => bySubject.map(s => {
    const evals = s.evaluations.filter(e => !isNaN(e.note));
    if (!evals.length) return { ...s, moyenne: null };
    const totalCoef = evals.reduce((acc, e) => acc + e.coef_examen, 0);
    const weighted = evals.reduce((acc, e) => acc + e.note * e.coef_examen, 0);
    return { ...s, moyenne: parseFloat((weighted / totalCoef).toFixed(2)) };
  }), [bySubject]);

  // Global stats
  const allNotes = filtered.map(n => parseFloat(n.note)).filter(n => !isNaN(n));
  const moyenne = allNotes.length
    ? parseFloat((allNotes.reduce((a, b) => a + b, 0) / allNotes.length).toFixed(2))
    : null;
  const tauxReussite = allNotes.length
    ? Math.round((allNotes.filter(n => n >= 10).length / allNotes.length) * 100)
    : null;
  const bestSubject = subjectAverages.reduce(
    (best, s) => (s.moyenne !== null && (best === null || s.moyenne > best.moyenne) ? s : best),
    null
  );

  // Chart data
  const chartData = subjectAverages
    .filter(s => s.moyenne !== null)
    .map(s => ({ name: s.code_matiere || s.nom_matiere.slice(0, 8), moyenne: s.moyenne }));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{
        mb: 4, p: 3, borderRadius: 3, background: '#fff',
        border: '1px solid #E5E7EB',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{
          width: 56, height: 56, borderRadius: 2, background: `${C.purple}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
        }}>
          📝
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: C.primary, mb: 0.4 }}>
            Mes Notes
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>
            Suivi de vos résultats académiques
          </Typography>
        </Box>
        </Box>
        <Tooltip title="Retour au tableau de bord">
          <IconButton onClick={() => navigate('/dashboard/etudiant')}
            sx={{ width: 44, height: 44, borderRadius: '14px', background: '#F0F4FF', border: '2px solid #3B82F640', color: '#3B82F6',
              transition: 'all 0.3s ease',
              '&:hover': { background: '#3B82F620', transform: 'translateY(-2px)', boxShadow: '0 4px 12px #3B82F625' } }}>
            <ArrowBack sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stats */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon="📊"
            label="Moyenne générale"
            value={moyenne !== null ? `${moyenne}/20` : '—'}
            sub={moyenne !== null ? noteLabel(moyenne) : 'Aucune note'}
            color={C.blue}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon="✅"
            label="Taux de réussite"
            value={tauxReussite !== null ? `${tauxReussite}%` : '—'}
            sub="≥ 10/20"
            color={C.green}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon="📋"
            label="Notes enregistrées"
            value={allNotes.length}
            sub={`${bySubject.length} matière${bySubject.length > 1 ? 's' : ''}`}
            color={C.purple}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon="🏆"
            label="Meilleure matière"
            value={bestSubject ? `${bestSubject.moyenne}/20` : '—'}
            sub={bestSubject?.nom_matiere || 'Aucune'}
            color={C.orange}
          />
        </Grid>
      </Grid>

      {/* Semester filter */}
      {semestres.length > 0 && (
        <Card sx={{ borderRadius: 3, border: '1.5px solid #EAF4FF', mb: 3 }}>
          <Tabs
            value={tabSemestre}
            onChange={(_, v) => setTabSemestre(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 1,
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.88rem', minHeight: 48 },
              '& .Mui-selected': { color: C.blue },
              '& .MuiTabs-indicator': { background: C.blue, height: 3, borderRadius: 2 },
            }}
          >
            <Tab label={`Tous les semestres`} />
            {semestres.map(s => (
              <Tab key={s} label={`Semestre ${s}`} />
            ))}
          </Tabs>
        </Card>
      )}

      {/* Empty state */}
      {filtered.length === 0 ? (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '3rem', mb: 2 }}>📭</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: C.primary, mb: 1 }}>
            Aucune note disponible
          </Typography>
          <Typography color="text.secondary">
            Vos notes apparaîtront ici dès qu'elles seront saisies par vos enseignants.
          </Typography>
        </Box>
      ) : (
        <>
          {/* View tabs */}
          <Card sx={{ borderRadius: 3, border: '1.5px solid #EAF4FF', mb: 3 }}>
            <Tabs
              value={tabView}
              onChange={(_, v) => setTabView(v)}
              sx={{
                borderBottom: '1px solid #EAF4FF', px: 2,
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.9rem' },
              }}
            >
              <Tab label="📋 Détail par matière" />
              <Tab label="📊 Résumé & Graphique" />
            </Tabs>

            {/* TAB 0 – Detailed table by subject */}
            {tabView === 0 && (
              <Box sx={{ p: 0 }}>
                {subjectAverages.map((subject, si) => (
                  <Box key={subject.id_matiere} sx={{ borderBottom: si < subjectAverages.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    {/* Subject header */}
                    <Box sx={{
                      px: 3, py: 1.8, display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', background: '#F8FAFC',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography sx={{ fontWeight: 800, color: C.primary, fontSize: '0.95rem' }}>
                          {subject.nom_matiere}
                        </Typography>
                        <Chip
                          label={subject.code_matiere}
                          size="small"
                          sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.7rem', height: 20, background: '#E0E7FF', color: C.primary }}
                        />
                        <Chip
                          label={`S${subject.semestre}`}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: '0.7rem', height: 20, background: `${C.blue}15`, color: C.blue }}
                        />
                      </Box>
                      {subject.moyenne !== null && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', fontWeight: 600 }}>Moyenne:</Typography>
                          <NoteBadge note={subject.moyenne} />
                        </Box>
                      )}
                    </Box>

                    {/* Evaluations table */}
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ background: '#FAFBFC' }}>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#6B7280', pl: 4 }}>Type d'évaluation</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#6B7280' }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#6B7280' }}>Année univ.</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#6B7280' }}>Coefficient</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#6B7280' }}>Note</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#6B7280' }}>Appréciation</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {subject.evaluations.map((ev, i) => (
                            <TableRow key={ev.id_examen} sx={{
                              '&:hover': { background: '#F8FAFC' },
                              background: i % 2 === 0 ? '#fff' : '#FAFBFC',
                            }}>
                              <TableCell sx={{ pl: 4, fontSize: '0.85rem', fontWeight: 600 }}>
                                {ev.type_examen || '—'}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.82rem', color: '#6B7280' }}>
                                {ev.date_examen
                                  ? new Date(ev.date_examen).toLocaleDateString('fr-FR')
                                  : '—'}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.82rem', color: '#6B7280' }}>
                                {ev.annee_universitaire || '—'}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={ev.coef_examen}
                                  size="small"
                                  sx={{ background: '#F0F4FF', color: C.primary, fontWeight: 700, fontSize: '0.75rem' }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                {!isNaN(ev.note) ? <NoteBadge note={ev.note} /> : (
                                  <Chip label="—" size="small" sx={{ background: '#F3F4F6', color: '#9CA3AF', fontWeight: 600 }} />
                                )}
                              </TableCell>
                              <TableCell>
                                {!isNaN(ev.note) ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    {ev.note >= 10
                                      ? <TrendingUp sx={{ fontSize: 16, color: C.green }} />
                                      : <TrendingDown sx={{ fontSize: 16, color: C.danger }} />}
                                    <Typography sx={{ fontSize: '0.78rem', color: ev.note >= 10 ? C.green : C.danger, fontWeight: 700 }}>
                                      {noteLabel(ev.note)}
                                    </Typography>
                                  </Box>
                                ) : <Typography sx={{ fontSize: '0.78rem', color: '#9CA3AF' }}>—</Typography>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ))}
              </Box>
            )}

            {/* TAB 1 – Summary & Chart */}
            {tabView === 1 && (
              <CardContent sx={{ p: 3 }}>
                {/* Summary table */}
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: C.primary }}>
                  📋 Récapitulatif par matière
                </Typography>
                <TableContainer sx={{ mb: 4 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ background: '#F8FAFC' }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Matière</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Semestre</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Évaluations</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Moyenne</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Statut</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {subjectAverages.map((s, i) => (
                        <TableRow key={s.id_matiere} sx={{
                          '&:hover': { background: '#F9FAFB' },
                          background: i % 2 === 0 ? '#fff' : '#FAFBFC',
                        }}>
                          <TableCell>
                            <Box>
                              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: C.primary }}>
                                {s.nom_matiere}
                              </Typography>
                              <Typography sx={{ fontSize: '0.72rem', color: '#9CA3AF', fontFamily: 'monospace' }}>
                                {s.code_matiere}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={`S${s.semestre}`} size="small"
                              sx={{ background: `${C.blue}15`, color: C.blue, fontWeight: 700, fontSize: '0.72rem' }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography sx={{ fontWeight: 700, color: C.primary }}>
                              {s.evaluations.filter(e => !isNaN(e.note)).length}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {s.moyenne !== null
                              ? <NoteBadge note={s.moyenne} />
                              : <Chip label="—" size="small" sx={{ background: '#F3F4F6', color: '#9CA3AF', fontWeight: 600 }} />
                            }
                          </TableCell>
                          <TableCell align="center">
                            {s.moyenne !== null ? (
                              <Chip
                                label={s.moyenne >= 10 ? 'Validé' : 'À repasser'}
                                size="small"
                                sx={{
                                  background: s.moyenne >= 10 ? `${C.green}15` : `${C.danger}15`,
                                  color: s.moyenne >= 10 ? C.green : C.danger,
                                  fontWeight: 700, fontSize: '0.72rem',
                                  border: `1.5px solid ${s.moyenne >= 10 ? C.green : C.danger}30`,
                                }}
                              />
                            ) : <Typography sx={{ fontSize: '0.78rem', color: '#9CA3AF' }}>—</Typography>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Bar chart */}
                {chartData.length > 0 && (
                  <>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: C.primary }}>
                      📈 Moyennes par matière
                    </Typography>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={chartData} barSize={38}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#6B7280" />
                        <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} stroke="#6B7280" />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                          formatter={v => [`${v}/20`]}
                        />
                        <Bar dataKey="moyenne" name="Moyenne" radius={[6, 6, 0, 0]}>
                          {chartData.map((entry, i) => (
                            <Cell key={i} fill={noteColor(entry.moyenne)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}
              </CardContent>
            )}
          </Card>
        </>
      )}
    </Box>
  );
}
