import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Chip,
  Button, TextField, MenuItem, CircularProgress,
  Avatar, Tabs, Tab, Collapse, IconButton, Alert,
  Tooltip, Autocomplete, LinearProgress,
} from '@mui/material';
import {
  EventNote, CheckCircle, ExpandMore, ExpandLess,
  DeleteOutline, PersonSearch, Groups, ArrowBack,
} from '@mui/icons-material';
import api from '../services/api';

const C = {
  primary:   '#1E3A8A',
  secondary: '#3B82F6',
  warning:   '#F59E0B',
  success:   '#10B981',
  danger:    '#EF4444',
  purple:    '#8B5CF6',
};

export default function EnseignantAbsences() {
  const navigate = useNavigate();

  const [tab, setTab] = useState(1);
  const [matieres, setMatieres] = useState([]);

  // Tab 0 — individual marking
  const [allStudents, setAllStudents]         = useState([]);
  const [allStudentsLoading, setAllStudentsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [singleForm, setSingleForm]           = useState({ date: new Date().toISOString().slice(0, 10), type_seance: 'CM', semestre: '', justifiee: false });
  const [markingLoading, setMarkingLoading]   = useState(false);
  const [markResult, setMarkResult]           = useState(null);

  // Tab 1 — mes classes
  const [historiqueSpecialite, setHistoriqueSpecialite] = useState('');
  const [historique, setHistorique]           = useState([]);
  const [historiqueLoading, setHistoriqueLoading] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState(null);

  const loadHistorique = useCallback(async (idSpecialite) => {
    if (!idSpecialite) return;
    setHistoriqueLoading(true);
    setHistorique([]);
    try {
      const r = await api.get('/enseignant/dashboard/absences/historique', { params: { id_specialite: idSpecialite } });
      setHistorique(r.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoriqueLoading(false);
    }
  }, []);

  useEffect(() => {
    api.get('/enseignant/dashboard/filters')
      .then(r => {
        const m = r.data.data?.matieres || [];
        setMatieres(m);
        if (m.length > 0) {
          setHistoriqueSpecialite(m[0].id_specialite);
          loadHistorique(m[0].id_specialite);
        }
      })
      .catch(console.error);

    loadAllStudents();
  }, [loadHistorique]);

  const loadAllStudents = async () => {
    setAllStudentsLoading(true);
    try {
      const r = await api.get('/enseignant/dashboard/students');
      setAllStudents(r.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setAllStudentsLoading(false);
    }
  };

  const handleMarquerAbsence = async () => {
    if (!selectedStudent || !singleForm.date) return;
    setMarkingLoading(true);
    setMarkResult(null);
    try {
      const r = await api.post('/enseignant/dashboard/absences/marquer', {
        id_etudiant:   selectedStudent.id_etudiant,
        id_specialite: selectedStudent.id_specialite,
        date:          singleForm.date,
        type_seance:   singleForm.type_seance,
        semestre:      singleForm.semestre ? parseInt(singleForm.semestre) : null,
        justifiee:     singleForm.justifiee,
      });
      setMarkResult(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setMarkingLoading(false);
    }
  };

  const handleJustifier = async (idAbsence, current, idEtudiant, absIdx) => {
    try {
      await api.patch(`/enseignant/dashboard/absences/${idAbsence}/justifier`, { justifiee: !current });
      setHistorique(prev => prev.map(s => s.id_etudiant === idEtudiant
        ? { ...s, absences: s.absences.map((a, i) => i === absIdx ? { ...a, justifiee: !current } : a) }
        : s
      ));
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (idAbsence, idEtudiant, absIdx) => {
    try {
      await api.delete(`/enseignant/dashboard/absences/${idAbsence}`);
      setHistorique(prev => prev.map(s => s.id_etudiant === idEtudiant
        ? { ...s, absences: s.absences.filter((_, i) => i !== absIdx), total_absences: s.total_absences - 1 }
        : s
      ));
    } catch (e) { console.error(e); }
  };

  const totalAbsences    = historique.reduce((a, s) => a + s.total_absences, 0);
  const totalJustifiees  = historique.reduce((a, s) => a + s.absences.filter(ab => ab.justifiee).length, 0);
  const totalNonJust     = totalAbsences - totalJustifiees;

  return (
    <Box sx={{ pb: 4 }}>

      {/* ── Header ── */}
      <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: '#fff', border: '1px solid #E5E7EB',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 2, background: `${C.warning}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
            📋
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: C.primary, mb: 0.3 }}>
              Gestion des absences
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Marquer les absences individuellement et consulter l'historique par classe
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Retour au tableau de bord">
          <IconButton onClick={() => navigate('/dashboard/enseignant')}
            sx={{ width: 44, height: 44, borderRadius: '14px', background: '#F0F4FF',
              border: '2px solid #3B82F640', color: C.secondary, transition: 'all 0.3s ease',
              '&:hover': { background: '#3B82F620', transform: 'translateY(-2px)' } }}>
            <ArrowBack sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Tabs ── */}
      <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', overflow: 'visible' }}>
        <Box sx={{ borderBottom: '1px solid #F3F4F6', px: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}
            sx={{
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.92rem', minHeight: 56, gap: 0.8 },
              '& .Mui-selected': { color: C.warning },
              '& .MuiTabs-indicator': { background: C.warning, height: 3, borderRadius: 2 },
            }}>
            <Tab icon={<EventNote sx={{ fontSize: 19 }} />} iconPosition="start" label="Marquer une absence" />
            <Tab icon={<Groups sx={{ fontSize: 19 }} />} iconPosition="start" label="Mes classes" />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>

          {/* ══════════════════════════════════════════
              TAB 0 — Marquer absence individuelle
             ══════════════════════════════════════════ */}
          {tab === 0 && (
            <Box>
              <Autocomplete
                options={allStudents}
                loading={allStudentsLoading}
                getOptionLabel={s => `${s.nom} ${s.prenom} — ${s.numero_etudiant}`}
                groupBy={s => s.nom_specialite}
                value={selectedStudent}
                onChange={(_, v) => { setSelectedStudent(v); setMarkResult(null); }}
                isOptionEqualToValue={(o, v) => o.id_etudiant === v?.id_etudiant}
                renderInput={(params) => (
                  <TextField {...params} label="Rechercher un étudiant" fullWidth
                    placeholder="Tapez le nom, prénom ou numéro d'étudiant..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <PersonSearch sx={{ color: '#9CA3AF', mr: 0.5, fontSize: 22 }} />,
                    }}
                  />
                )}
                renderOption={(props, s) => (
                  <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.2 }}>
                    <Avatar sx={{ width: 36, height: 36, fontSize: '0.78rem', fontWeight: 700,
                      background: '#EFF6FF', color: C.primary, flexShrink: 0 }}>
                      {s.nom[0]}{s.prenom[0]}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: C.primary }}>
                        {s.nom} {s.prenom}
                      </Typography>
                      <Typography sx={{ fontSize: '0.74rem', color: '#6B7280' }}>
                        {s.numero_etudiant} · {s.nom_specialite}
                      </Typography>
                    </Box>
                  </Box>
                )}
                sx={{ mb: 3 }}
              />

              {!selectedStudent ? (
                <Box sx={{ py: 10, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '3.5rem', mb: 1.5 }}>🔍</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#374151', fontSize: '1.05rem' }}>
                    Sélectionnez un étudiant
                  </Typography>
                  <Typography sx={{ color: '#9CA3AF', fontSize: '0.9rem', mt: 0.5 }}>
                    Recherchez par nom, prénom ou numéro d'étudiant
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {/* Fiche étudiant */}
                  <Box sx={{ mb: 3, p: 2.5, borderRadius: 2.5, background: '#EFF6FF',
                    border: '1.5px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ background: '#DBEAFE', color: C.primary, fontWeight: 800,
                      width: 52, height: 52, fontSize: '1.05rem' }}>
                      {selectedStudent.nom[0]}{selectedStudent.prenom[0]}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: C.primary }}>
                        {selectedStudent.nom} {selectedStudent.prenom}
                      </Typography>
                      <Typography sx={{ fontSize: '0.82rem', color: '#4B5563' }}>
                        {selectedStudent.numero_etudiant}
                      </Typography>
                    </Box>
                    <Chip label={selectedStudent.nom_specialite} size="small"
                      sx={{ background: `${C.secondary}15`, color: C.secondary, fontWeight: 700, fontSize: '0.78rem' }} />
                  </Box>

                  {/* Formulaire */}
                  <Grid container spacing={2} sx={{ mb: 2.5 }}>
                    <Grid item xs={12} sm={3}>
                      <TextField fullWidth label="Date" type="date"
                        value={singleForm.date}
                        onChange={e => { setSingleForm(p => ({ ...p, date: e.target.value })); setMarkResult(null); }}
                        InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <TextField fullWidth select label="Type de séance"
                        value={singleForm.type_seance}
                        onChange={e => { setSingleForm(p => ({ ...p, type_seance: e.target.value })); setMarkResult(null); }}>
                        {['CM', 'TD', 'TP', 'Examen'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <TextField fullWidth select label="Semestre"
                        value={singleForm.semestre}
                        onChange={e => setSingleForm(p => ({ ...p, semestre: e.target.value }))}>
                        <MenuItem value="">—</MenuItem>
                        {[1, 2, 3, 4, 5, 6].map(s => <MenuItem key={s} value={s}>S{s}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField fullWidth select label="Justification"
                        value={singleForm.justifiee ? 'true' : 'false'}
                        onChange={e => setSingleForm(p => ({ ...p, justifiee: e.target.value === 'true' }))}>
                        <MenuItem value="false">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: C.danger }} />
                            Non justifiée
                          </Box>
                        </MenuItem>
                        <MenuItem value="true">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: C.success }} />
                            Justifiée
                          </Box>
                        </MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Button fullWidth variant="contained" onClick={handleMarquerAbsence}
                        disabled={markingLoading || !singleForm.date}
                        sx={{ height: 56, borderRadius: '10px', textTransform: 'none', fontWeight: 700,
                          fontSize: '0.95rem', background: C.warning, '&:hover': { background: '#D97706' } }}>
                        {markingLoading
                          ? <CircularProgress size={22} color="inherit" />
                          : 'Marquer'}
                      </Button>
                    </Grid>
                  </Grid>

                  {markResult && (
                    <Alert
                      severity={markResult.action === 'added' ? 'warning' : 'success'}
                      sx={{ borderRadius: 2, fontWeight: 600 }}
                      onClose={() => setMarkResult(null)}>
                      {markResult.action === 'added'
                        ? `✓ ${selectedStudent.nom} ${selectedStudent.prenom} — ${singleForm.type_seance} du ${new Date(singleForm.date + 'T12:00:00').toLocaleDateString('fr-FR')} · ${singleForm.justifiee ? 'Justifiée' : 'Non justifiée'}`
                        : `✓ Absence supprimée pour ${selectedStudent.nom} ${selectedStudent.prenom}`
                      }
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          )}

          {/* ══════════════════════════════════════════
              TAB 1 — Mes classes (historique)
             ══════════════════════════════════════════ */}
          {tab === 1 && (
            <Box>
              {/* Sélecteur + stats */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField select label="Classe / Spécialité" sx={{ minWidth: 300 }}
                  value={historiqueSpecialite}
                  onChange={e => {
                    setHistoriqueSpecialite(e.target.value);
                    setExpandedStudent(null);
                    loadHistorique(e.target.value);
                  }}>
                  <MenuItem value="">-- Choisir une classe --</MenuItem>
                  {matieres.map(m => (
                    <MenuItem key={m.id_specialite} value={m.id_specialite}>{m.nom_specialite}</MenuItem>
                  ))}
                </TextField>

                {historiqueLoading && <CircularProgress size={24} sx={{ color: C.warning }} />}

                {historiqueSpecialite && !historiqueLoading && (
                  <Box sx={{ display: 'flex', gap: 1.5, ml: 'auto', flexWrap: 'wrap' }}>
                    <Chip
                      label={`${historique.length} étudiant${historique.length > 1 ? 's' : ''}`}
                      sx={{ background: '#EFF6FF', color: C.primary, fontWeight: 700 }} />
                    <Chip
                      label={`${totalAbsences} absence${totalAbsences > 1 ? 's' : ''}`}
                      sx={{ background: '#FEE2E2', color: '#991B1B', fontWeight: 700 }} />
                    <Chip
                      label={`${totalJustifiees} justifiée${totalJustifiees > 1 ? 's' : ''}`}
                      sx={{ background: '#D1FAE5', color: '#065F46', fontWeight: 700 }} />
                    <Chip
                      label={`${totalNonJust} non justifiée${totalNonJust > 1 ? 's' : ''}`}
                      sx={{ background: '#FEF3C7', color: '#92400E', fontWeight: 700 }} />
                  </Box>
                )}
              </Box>

              {/* État vide — pas de spécialité choisie */}
              {!historiqueSpecialite && (
                <Box sx={{ py: 10, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '3.5rem', mb: 1.5 }}>🏫</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#374151', fontSize: '1.05rem' }}>
                    Sélectionnez une classe
                  </Typography>
                  <Typography sx={{ color: '#9CA3AF', fontSize: '0.9rem', mt: 0.5 }}>
                    Choisissez une spécialité pour voir les absences de vos étudiants
                  </Typography>
                </Box>
              )}

              {/* État vide — aucune absence */}
              {historiqueSpecialite && !historiqueLoading && historique.length === 0 && (
                <Box sx={{ py: 10, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '3.5rem', mb: 1.5 }}>✅</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#374151' }}>
                    Aucune absence enregistrée
                  </Typography>
                  <Typography sx={{ color: '#9CA3AF', fontSize: '0.9rem', mt: 0.5 }}>
                    Tous les étudiants de cette spécialité sont présents
                  </Typography>
                </Box>
              )}

              {/* Liste étudiants */}
              {historique.length > 0 && (
                <Box sx={{ border: '1px solid #E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                  {historique.map((s, i) => {
                    const isExpanded = expandedStudent === s.id_etudiant;
                    const absColor = s.total_absences === 0 ? '#065F46'
                      : s.total_absences <= 2 ? '#92400E' : '#991B1B';
                    const absBg = s.total_absences === 0 ? '#D1FAE5'
                      : s.total_absences <= 2 ? '#FEF3C7' : '#FEE2E2';

                    return (
                      <Box key={s.id_etudiant}>
                        {/* Ligne étudiant */}
                        <Box
                          onClick={() => setExpandedStudent(isExpanded ? null : s.id_etudiant)}
                          sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            px: 3, py: 2, cursor: 'pointer',
                            background: i % 2 === 0 ? '#FAFAFA' : '#fff',
                            borderBottom: i < historique.length - 1 || isExpanded ? '1px solid #F3F4F6' : 'none',
                            transition: 'background 0.15s',
                            '&:hover': { background: '#EFF6FF' },
                          }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ width: 42, height: 42, fontSize: '0.85rem', fontWeight: 700,
                              background: '#EFF6FF', color: C.primary }}>
                              {s.nom[0]}{s.prenom[0]}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: C.primary }}>
                                {s.nom} {s.prenom}
                              </Typography>
                              <Typography sx={{ fontSize: '0.76rem', color: '#6B7280' }}>
                                {s.numero_etudiant}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Chip
                              label={`${s.total_absences} absence${s.total_absences !== 1 ? 's' : ''}`}
                              size="small"
                              sx={{ fontWeight: 700, fontSize: '0.78rem', background: absBg, color: absColor }} />
                            {isExpanded
                              ? <ExpandLess sx={{ color: '#9CA3AF' }} />
                              : <ExpandMore sx={{ color: '#9CA3AF' }} />}
                          </Box>
                        </Box>

                        {/* Détail absences */}
                        <Collapse in={isExpanded}>
                          <Box sx={{ px: 3, py: 2, background: '#F8FAFF', borderBottom: '1px solid #E5E7EB' }}>
                            {s.absences.length === 0 ? (
                              <Typography sx={{ fontSize: '0.85rem', color: '#6B7280', fontStyle: 'italic' }}>
                                Aucune absence enregistrée
                              </Typography>
                            ) : (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {s.absences.map((a, ai) => (
                                  <Box key={ai} sx={{
                                    display: 'flex', alignItems: 'center', gap: 1.5,
                                    px: 2, py: 1.2, borderRadius: '10px',
                                    background: a.justifiee ? '#D1FAE5' : '#FEE2E2',
                                    border: `1px solid ${a.justifiee ? '#A7F3D0' : '#FECACA'}`,
                                  }}>
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, minWidth: 72,
                                      color: a.justifiee ? '#065F46' : '#991B1B' }}>
                                      {new Date(a.date_absence).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                    </Typography>
                                    <Chip label={a.type_seance} size="small"
                                      sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700,
                                        background: 'rgba(0,0,0,0.08)', color: 'inherit' }} />
                                    {a.declaree_par_etudiant && (
                                      <Chip label="Déclarée par l'étudiant" size="small"
                                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700,
                                          background: '#EDE9FE', color: '#6D28D9', border: '1px solid #DDD6FE' }} />
                                    )}
                                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, flex: 1,
                                      color: a.justifiee ? '#065F46' : '#991B1B' }}>
                                      {a.justifiee ? '✓ Justifiée' : '✗ Non justifiée'}
                                    </Typography>
                                    <Tooltip title={a.justifiee ? 'Annuler la justification' : 'Marquer comme justifiée'}>
                                      <Button size="small" variant="outlined"
                                        onClick={() => handleJustifier(a.id_absence, a.justifiee, s.id_etudiant, ai)}
                                        sx={{
                                          borderRadius: '8px', textTransform: 'none', fontWeight: 700,
                                          fontSize: '0.75rem', py: 0.3, px: 1.5, minWidth: 'unset',
                                          borderColor: a.justifiee ? '#6B7280' : '#065F46',
                                          color: a.justifiee ? '#6B7280' : '#065F46',
                                          '&:hover': { background: a.justifiee ? '#F3F4F6' : '#D1FAE5' },
                                        }}>
                                        {a.justifiee ? 'Annuler' : 'Justifier'}
                                      </Button>
                                    </Tooltip>
                                    <Tooltip title="Supprimer cette absence">
                                      <IconButton size="small"
                                        onClick={() => handleDelete(a.id_absence, s.id_etudiant, ai)}
                                        sx={{ borderRadius: '8px', color: '#D1D5DB',
                                          '&:hover': { color: C.danger, background: '#FEE2E2' } }}>
                                        <DeleteOutline sx={{ fontSize: 18 }} />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </Box>
                        </Collapse>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          )}

        </CardContent>
      </Card>
    </Box>
  );
}
