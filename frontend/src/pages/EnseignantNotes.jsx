import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  InputAdornment,
  Tooltip,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Add,
  Download,
  Upload,
  Search,
  FilterList,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  ArrowForward,
} from '@mui/icons-material';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts';
import api from '../services/api';

// ── PALETTE ────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#1E3A8A',
  secondary: '#3B82F6',
  accent: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  bg: '#F0F4FF',
};

// ── STAT CARD ──────────────────────────────────────────────────────────
const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
  <Card
    sx={{
      borderRadius: 3,
      border: '1.5px solid #EAF4FF',
      background: `linear-gradient(135deg, ${color}08, ${color}15)`,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 24px ${color}20`,
      },
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem',
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.8rem' }}>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.primary }}>
              {value}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {trend > 0 ? (
                  <TrendingUp sx={{ fontSize: 16, color: COLORS.success }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 16, color: COLORS.danger }} />
                )}
                <Typography variant="caption" sx={{ color: trend > 0 ? COLORS.success : COLORS.danger, fontWeight: 700 }}>
                  {Math.abs(trend)}%
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      {subtitle && (
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// ── NOTE BADGE ─────────────────────────────────────────────────────────
const NoteBadge = ({ note }) => {
  const getColor = () => {
    if (note >= 16) return COLORS.success;
    if (note >= 14) return COLORS.secondary;
    if (note >= 12) return COLORS.accent;
    if (note >= 10) return COLORS.warning;
    return COLORS.danger;
  };

  const getLabel = () => {
    if (note >= 16) return 'Excellent';
    if (note >= 14) return 'Très bien';
    if (note >= 12) return 'Bien';
    if (note >= 10) return 'Passable';
    return 'Insuffisant';
  };

  return (
    <Chip
      label={`${note}/20`}
      size="small"
      sx={{
        background: `${getColor()}15`,
        color: getColor(),
        fontWeight: 700,
        fontSize: '0.8rem',
        border: `1.5px solid ${getColor()}30`,
      }}
    />
  );
};

// ── MAIN COMPONENT ─────────────────────────────────────────────────────
const EnseignantNotes = () => {
  const navigate = useNavigate();
  const [selectedClasse, setSelectedClasse] = useState('');
  const [selectedEvaluation, setSelectedEvaluation] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editedNotes, setEditedNotes] = useState({});
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [newEvalForm, setNewEvalForm] = useState({ nom: '', type: 'Devoir Surveillé', date: '', coef: 1 });

  // Data from API
  const [classes, setClasses] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [stats, setStats] = useState({
    moyenne_classe: 0,
    taux_reussite: 0,
    notes_saisies: 0,
    notes_manquantes: 0,
  });

  // Initial load: fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get('/enseignant/dashboard/filters');
        const matieresForm = response.data.data.matieresForm || [];
        
        // Transform matieresForm to classes format
        const classesData = matieresForm.map((m) => ({
          id: m.id_matiere,
          nom: `${m.nom_matiere} - S${m.semestre || 1}`,
          nb_etudiants: 0, // Will be updated when class is selected
          id_matiere: m.id_matiere,
          semestre: m.semestre,
        }));
        
        setClasses(classesData);
        
        // Auto-select first class if available
        if (classesData.length > 0) {
          setSelectedClasse(classesData[0].id);
        }
      } catch (error) {
        console.error('Erreur chargement classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Fetch data when selectedClasse changes
  useEffect(() => {
    if (!selectedClasse) return;

    const fetchClasseData = async () => {
      setDataLoading(true);
      try {
        // Fetch evaluations and students for the selected class
        const [evalResponse, studentsResponse] = await Promise.all([
          api.get(`/enseignant/notes/evaluations?id_matiere=${selectedClasse}`),
          api.get(`/enseignant/notes/etudiants?id_matiere=${selectedClasse}`),
        ]);

        const evalData = evalResponse.data.data || [];
        const studentsData = studentsResponse.data.data || [];

        setEvaluations(evalData);
        setEtudiants(studentsData);

        // Calculate stats
        const allNotes = studentsData.flatMap(e => 
          evalData.map(ev => e.notes?.[ev.id]).filter(n => n !== null && n !== undefined)
        );
        
        const totalPossibleNotes = studentsData.length * evalData.length;
        const notesSaisies = allNotes.length;
        const notesManquantes = totalPossibleNotes - notesSaisies;
        
        const moyenneClasse = allNotes.length > 0 
          ? (allNotes.reduce((sum, n) => sum + n, 0) / allNotes.length).toFixed(1)
          : 0;
        
        const tauxReussite = allNotes.length > 0
          ? Math.round((allNotes.filter(n => n >= 10).length / allNotes.length) * 100)
          : 0;

        setStats({
          moyenne_classe: parseFloat(moyenneClasse),
          taux_reussite: tauxReussite,
          notes_saisies: notesSaisies,
          notes_manquantes: notesManquantes,
        });

        // Update class student count
        setClasses(prev => prev.map(c => 
          c.id === selectedClasse 
            ? { ...c, nb_etudiants: studentsData.length }
            : c
        ));

      } catch (error) {
        console.error('Erreur chargement données classe:', error);
        // Set empty data on error
        setEvaluations([]);
        setEtudiants([]);
        setStats({
          moyenne_classe: 0,
          taux_reussite: 0,
          notes_saisies: 0,
          notes_manquantes: 0,
        });
      } finally {
        setDataLoading(false);
      }
    };

    fetchClasseData();
  }, [selectedClasse]);

  const handleEditNote = (etudiantId, evaluationId, value) => {
    setEditedNotes({
      ...editedNotes,
      [`${etudiantId}|${evaluationId}`]: value,
    });
  };

  const handleSaveNotes = async () => {
    try {
      // Prepare notes data for API
      const notesToSave = Object.entries(editedNotes).map(([key, value]) => {
        const sep = key.indexOf('|');
        const etudiantId = key.substring(0, sep);
        const evaluationId = key.substring(sep + 1);
        return {
          id_etudiant: etudiantId,
          id_evaluation: evaluationId,
          note: parseFloat(value) || null,
        };
      });

      // Save notes via API
      await api.post('/enseignant/notes/save', {
        id_matiere: selectedClasse,
        notes: notesToSave,
      });

      // Update local state
      setEtudiants(
        etudiants.map((etudiant) => {
          const updatedNotes = { ...etudiant.notes };
          evaluations.forEach((evaluation) => {
            const key = `${etudiant.id}-${evaluation.id}`;
            if (editedNotes[key] !== undefined) {
              updatedNotes[evaluation.id] = parseFloat(editedNotes[key]) || null;
            }
          });
          return { ...etudiant, notes: updatedNotes };
        })
      );

      setEditedNotes({});
      setEditMode(false);

      // Refresh data to get updated stats
      const studentsResponse = await api.get(`/enseignant/notes/etudiants?id_matiere=${selectedClasse}`);
      setEtudiants(studentsResponse.data.data || []);
    } catch (error) {
      console.error('Erreur sauvegarde notes:', error);
      alert('Erreur lors de la sauvegarde des notes');
    }
  };

  const handleCancelEdit = () => {
    setEditedNotes({});
    setEditMode(false);
  };

  const handleAddEvaluation = async () => {
    if (!newEvalForm.nom.trim()) return;
    
    try {
      const response = await api.post('/enseignant/notes/evaluation', {
        id_matiere: selectedClasse,
        nom: newEvalForm.nom.trim(),
        type: newEvalForm.type,
        date: newEvalForm.date || null,
        coefficient: Number(newEvalForm.coef) || 1,
      });

      const newEval = response.data.data;
      
      // Update local state
      setEvaluations(prev => [newEval, ...prev]);
      setEtudiants(prev => prev.map(e => ({ 
        ...e, 
        notes: { ...e.notes, [newEval.id]: null } 
      })));
      
      setNewEvalForm({ nom: '', type: 'Devoir Surveillé', date: '', coef: 1 });
      setOpenAddDialog(false);
    } catch (error) {
      console.error('Erreur création évaluation:', error);
      alert('Erreur lors de la création de l\'évaluation');
    }
  };

  const filteredEtudiants = etudiants.filter((etudiant) => {
    const matchSearch =
      etudiant.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      etudiant.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      etudiant.matricule.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const getStatutIcon = (statut) => {
    switch (statut) {
      case 'excellent':
        return <CheckCircle sx={{ fontSize: 18, color: COLORS.success }} />;
      case 'bien':
        return <CheckCircle sx={{ fontSize: 18, color: COLORS.secondary }} />;
      case 'passable':
        return <Warning sx={{ fontSize: 18, color: COLORS.warning }} />;
      case 'risque':
        return <ErrorIcon sx={{ fontSize: 18, color: COLORS.danger }} />;
      default:
        return null;
    }
  };

  const selectedClasseData = classes.find((c) => c.id === selectedClasse);

  const displayedEvaluations = selectedEvaluation === 'all'
    ? evaluations
    : evaluations.filter(ev => ev.id === selectedEvaluation);

  // ── Computed stats for Statistiques & Évolution tabs ──────────────
  const evalStats = useMemo(() => evaluations.map(ev => {
    const notes = etudiants.map(e => e.notes[ev.id]).filter(n => n !== null && n !== undefined);
    const avg = notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : null;
    return {
      ...ev,
      count:    notes.length,
      moyenne:  avg !== null ? parseFloat(avg.toFixed(1)) : null,
      min:      notes.length > 0 ? Math.min(...notes) : null,
      max:      notes.length > 0 ? Math.max(...notes) : null,
      reussite: notes.length > 0 ? Math.round((notes.filter(n => n >= 10).length / notes.length) * 100) : 0,
    };
  }), [evaluations, etudiants]);

  const evolutionData = useMemo(() => [...evaluations]
    .filter(ev => ev.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(ev => {
      const notes = etudiants.map(e => e.notes[ev.id]).filter(n => n !== null && n !== undefined);
      return {
        name: ev.nom,
        moyenne: notes.length > 0 ? parseFloat((notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(1)) : null,
        reussite: notes.length > 0 ? Math.round((notes.filter(n => n >= 10).length / notes.length) * 100) : null,
      };
    }), [evaluations, etudiants]);

  const distributionData = useMemo(() => {
    const all = etudiants.flatMap(e => evaluations.map(ev => e.notes[ev.id]).filter(n => n !== null && n !== undefined));
    const tranches = [
      { label: '< 8',  min: 0,  max: 8  },
      { label: '8–10', min: 8,  max: 10 },
      { label: '10–12',min: 10, max: 12 },
      { label: '12–14',min: 12, max: 14 },
      { label: '14–16',min: 14, max: 16 },
      { label: '16–18',min: 16, max: 18 },
      { label: '> 18', min: 18, max: 21 },
    ];
    return tranches.map(t => ({ name: t.label, count: all.filter(n => n >= t.min && n < t.max).length }));
  }, [evaluations, etudiants]);

  // Show loading state
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
      <Box 
        sx={{ 
          mb: 4,
          p: 3,
          borderRadius: 3,
          background: '#fff',
          border: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              background: '#FEF3F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
            }}
          >
            📝
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: '#1F2937',
                mb: 0.5,
              }}
            >
              Gestion des Notes
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Saisissez et gérez les notes de vos étudiants
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Retour au dashboard">
            <IconButton
              onClick={() => navigate('/dashboard/enseignant')}
              sx={{
                width: 44,
                height: 44,
                borderRadius: '14px',
                background: COLORS.bg,
                border: `2px solid ${COLORS.secondary}40`,
                color: COLORS.secondary,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: `${COLORS.secondary}20`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${COLORS.secondary}25`,
                },
              }}
            >
              <ArrowForward sx={{ fontSize: 20, transform: 'rotate(180deg)' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Nouvelle évaluation">
            <IconButton
              onClick={() => setOpenAddDialog(true)}
              sx={{
                width: 44,
                height: 44,
                borderRadius: '14px',
                background: '#2563EB',
                color: '#fff',
                transition: 'all 0.3s ease',
                boxShadow: '0 3px 10px rgba(37, 99, 235, 0.4)',
                '&:hover': {
                  background: '#1D4ED8',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 5px 16px rgba(37, 99, 235, 0.5)',
                },
              }}
            >
              <Add sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── FILTERS ────────────────────────────────────────────────── */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          select
          value={selectedClasse}
          onChange={(e) => setSelectedClasse(e.target.value)}
          label="Classe"
          sx={{ minWidth: 320 }}
          size="small"
          disabled={dataLoading}
        >
          {classes.map((classe) => (
            <MenuItem key={classe.id} value={classe.id}>
              {classe.nom} {classe.nb_etudiants > 0 && `(${classe.nb_etudiants} étudiants)`}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          value={selectedEvaluation}
          onChange={(e) => setSelectedEvaluation(e.target.value)}
          label="Évaluation"
          sx={{ minWidth: 200 }}
          size="small"
          disabled={dataLoading || evaluations.length === 0}
        >
          <MenuItem value="all">Toutes les évaluations</MenuItem>
          {evaluations.map((evaluation) => (
            <MenuItem key={evaluation.id} value={evaluation.id}>
              {evaluation.nom} (Coef. {evaluation.coef || evaluation.coefficient || 1})
            </MenuItem>
          ))}
        </TextField>

        <TextField
          placeholder="Rechercher un étudiant..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ minWidth: 250 }}
          disabled={dataLoading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 20, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ flex: 1 }} />

        {dataLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Chargement...
            </Typography>
          </Box>
        )}

        {!editMode ? (
          <Tooltip title="Modifier les notes">
            <IconButton
              onClick={() => setEditMode(true)}
              disabled={dataLoading || etudiants.length === 0}
              sx={{
                width: 44, height: 44, borderRadius: '14px',
                background: COLORS.purple,
                color: '#fff',
                transition: 'all 0.3s ease',
                boxShadow: '0 3px 10px rgba(139,92,246,0.4)',
                '&:hover': { background: '#7C3AED', transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(139,92,246,0.5)' },
                '&:disabled': { background: '#E5E7EB', color: '#9CA3AF' },
              }}
            >
              <Edit sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Annuler">
              <IconButton
                onClick={handleCancelEdit}
                sx={{
                  width: 44, height: 44, borderRadius: '14px',
                  background: `${COLORS.danger}15`,
                  border: `2px solid ${COLORS.danger}40`,
                  color: COLORS.danger,
                  transition: 'all 0.3s ease',
                  '&:hover': { background: `${COLORS.danger}25`, transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${COLORS.danger}25` },
                }}
              >
                <Cancel sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Enregistrer les notes">
              <IconButton
                onClick={handleSaveNotes}
                sx={{
                  width: 44, height: 44, borderRadius: '14px',
                  background: COLORS.success,
                  color: '#fff',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 3px 10px rgba(16,185,129,0.4)',
                  '&:hover': { background: '#059669', transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(16,185,129,0.5)' },
                }}
              >
                <Save sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* ── STATS CARDS ────────────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Moyenne de classe"
            value={`${stats.moyenne_classe}/20`}
            subtitle="Toutes évaluations"
            icon="📊"
            color={COLORS.secondary}
            trend={2.3}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Taux de réussite"
            value={`${stats.taux_reussite}%`}
            subtitle="≥ 10/20"
            icon="✅"
            color={COLORS.success}
            trend={5.2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Notes saisies"
            value={stats.notes_saisies}
            subtitle={`${selectedClasseData?.nb_etudiants || 0} étudiants`}
            icon="📝"
            color={COLORS.purple}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Notes manquantes"
            value={stats.notes_manquantes}
            subtitle="À compléter"
            icon="⚠️"
            color={COLORS.warning}
          />
        </Grid>
      </Grid>

      {/* ── TABS ───────────────────────────────────────────────────── */}
      <Card sx={{ borderRadius: 3, border: '1.5px solid #EAF4FF', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{
            borderBottom: '1px solid #EAF4FF',
            px: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
            },
          }}
        >
          <Tab label="📋 Saisie des notes" />
          <Tab label="📊 Statistiques" />
          <Tab label="📈 Évolution" />
        </Tabs>

        {/* ── TAB 0: SAISIE DES NOTES ──────────────────────────────── */}
        {tabValue === 0 && (
          <CardContent sx={{ p: 0 }}>
            {dataLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : etudiants.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '2.5rem', mb: 2 }}>📚</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.primary, mb: 1 }}>
                  Aucun étudiant trouvé
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Aucun étudiant n'est inscrit dans cette classe pour le moment.
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          background: '#F8FAFC',
                          borderBottom: '2px solid #EAF4FF',
                          minWidth: 200,
                        }}
                      >
                        Étudiant
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 700, background: '#F8FAFC', borderBottom: '2px solid #EAF4FF' }}
                      >
                        Matricule
                      </TableCell>
                      {displayedEvaluations.map((evaluation) => (
                        <TableCell
                          key={evaluation.id}
                          align="center"
                          sx={{ fontWeight: 700, background: '#F8FAFC', borderBottom: '2px solid #EAF4FF' }}
                        >
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {evaluation.nom}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Coef. {evaluation.coef || evaluation.coefficient || 1}
                            </Typography>
                          </Box>
                        </TableCell>
                      ))}
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 700, background: '#F8FAFC', borderBottom: '2px solid #EAF4FF' }}
                      >
                        Moyenne
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 700, background: '#F8FAFC', borderBottom: '2px solid #EAF4FF' }}
                      >
                        Rang
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 700, background: '#F8FAFC', borderBottom: '2px solid #EAF4FF' }}
                      >
                        Statut
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredEtudiants.map((etudiant, index) => (
                      <TableRow
                        key={etudiant.id}
                        sx={{
                          '&:hover': { background: '#F8FAFC' },
                          background: index % 2 === 0 ? '#fff' : '#FAFBFC',
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                background: `linear-gradient(135deg, ${COLORS.secondary}40, ${COLORS.accent}40)`,
                                color: COLORS.primary,
                                fontWeight: 700,
                                fontSize: '0.85rem',
                              }}
                            >
                              {etudiant.prenom[0]}
                              {etudiant.nom[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {etudiant.prenom} {etudiant.nom}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                            {etudiant.matricule}
                          </Typography>
                        </TableCell>
                        {displayedEvaluations.map((evaluation) => {
                          const note = etudiant.notes[evaluation.id];
                          const editKey = `${etudiant.id}|${evaluation.id}`;
                          const editedValue = editedNotes[editKey];

                          return (
                            <TableCell key={evaluation.id} align="center">
                              {editMode ? (
                                <TextField
                                  type="number"
                                  size="small"
                                  value={editedValue !== undefined ? editedValue : note || ''}
                                  onChange={(e) => handleEditNote(etudiant.id, evaluation.id, e.target.value)}
                                  inputProps={{ min: 0, max: 20, step: 0.5 }}
                                  sx={{
                                    width: 80,
                                    '& input': { textAlign: 'center', fontWeight: 600 },
                                  }}
                                />
                              ) : note !== null && note !== undefined ? (
                                <NoteBadge note={note} />
                              ) : (
                                <Chip
                                  label="—"
                                  size="small"
                                  sx={{
                                    background: '#F3F4F6',
                                    color: '#9CA3AF',
                                    fontWeight: 600,
                                  }}
                                />
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 800, color: COLORS.primary }}>
                            {etudiant.moyenne ? `${etudiant.moyenne}/20` : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`#${etudiant.rang}`}
                            size="small"
                            sx={{
                              background: etudiant.rang <= 10 ? `${COLORS.success}15` : '#F3F4F6',
                              color: etudiant.rang <= 10 ? COLORS.success : '#6B7280',
                              fontWeight: 700,
                              border: etudiant.rang <= 10 ? `1.5px solid ${COLORS.success}30` : 'none',
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={etudiant.statut}>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              {getStatutIcon(etudiant.statut)}
                            </Box>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        )}

        {/* ── TAB 1: STATISTIQUES ───────────────────────────────────── */}
        {tabValue === 1 && (
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>📊 Statistiques par évaluation</Typography>

            {/* Per-evaluation stat cards */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {evalStats.map(ev => {
                const color = ev.moyenne === null ? COLORS.warning
                  : ev.moyenne >= 14 ? COLORS.success
                  : ev.moyenne >= 10 ? COLORS.secondary
                  : COLORS.danger;
                return (
                  <Grid item xs={12} sm={6} md={3} key={ev.id}>
                    <Box sx={{ p: 2, borderRadius: 2, border: `1.5px solid ${color}20`, background: `${color}08` }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1F2937', mb: 1 }}>{ev.nom}</Typography>
                      <Chip label={ev.type} size="small" sx={{ fontSize: '0.65rem', height: 20, mb: 1.5, background: `${color}18`, color }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Moyenne</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 800, color }}>{ev.moyenne !== null ? `${ev.moyenne}/20` : '—'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Min / Max</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>{ev.min !== null ? `${ev.min} / ${ev.max}` : '—'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Taux réussite</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: ev.reussite >= 60 ? COLORS.success : COLORS.danger }}>{ev.count > 0 ? `${ev.reussite}%` : '—'}</Typography>
                      </Box>
                      <Box sx={{ height: 6, borderRadius: 3, background: '#E5E7EB' }}>
                        <Box sx={{ height: 6, borderRadius: 3, background: color, width: `${ev.reussite}%` }} />
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            {/* Grade distribution bar chart */}
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>📈 Distribution des notes</Typography>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={distributionData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6B7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                <RechartsTooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} formatter={v => [`${v} note(s)`]} />
                <Bar dataKey="count" name="Étudiants" radius={[6, 6, 0, 0]}>
                  {distributionData.map((entry, i) => (
                    <Cell key={i} fill={
                      entry.name === '< 8' || entry.name === '8–10' ? COLORS.danger
                      : entry.name === '10–12' ? COLORS.warning
                      : entry.name === '12–14' || entry.name === '14–16' ? COLORS.success
                      : COLORS.secondary
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        )}

        {/* ── TAB 2: ÉVOLUTION ──────────────────────────────────────── */}
        {tabValue === 2 && (
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>📈 Évolution des performances</Typography>

            {evolutionData.length < 2 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '2rem', mb: 1 }}>📅</Typography>
                <Typography color="text.secondary">Ajoutez au moins 2 évaluations avec des dates pour voir l'évolution.</Typography>
              </Box>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6B7280" />
                    <YAxis yAxisId="left" domain={[0, 20]} tick={{ fontSize: 12 }} stroke="#6B7280" label={{ value: '/20', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#6B7280" unit="%" />
                    <RechartsTooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="moyenne" name="Moyenne /20" stroke={COLORS.secondary} strokeWidth={3} dot={{ r: 5, fill: COLORS.secondary }} connectNulls />
                    <Line yAxisId="right" type="monotone" dataKey="reussite" name="Taux réussite %" stroke={COLORS.success} strokeWidth={3} strokeDasharray="5 5" dot={{ r: 5, fill: COLORS.success }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>

                {/* Summary table */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1F2937' }}>Récapitulatif</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: '#F8FAFC' }}>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Évaluation</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Moyenne</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Taux réussite</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Tendance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {evolutionData.map((row, i) => {
                          const prev = i > 0 ? evolutionData[i - 1].moyenne : null;
                          const trend = prev !== null && row.moyenne !== null ? row.moyenne - prev : null;
                          return (
                            <TableRow key={row.name} sx={{ '&:hover': { background: '#F9FAFB' } }}>
                              <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{row.name}</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700, color: row.moyenne >= 10 ? COLORS.success : COLORS.danger, fontSize: '0.85rem' }}>
                                {row.moyenne !== null ? `${row.moyenne}/20` : '—'}
                              </TableCell>
                              <TableCell align="center" sx={{ fontSize: '0.82rem' }}>{row.reussite !== null ? `${row.reussite}%` : '—'}</TableCell>
                              <TableCell align="center">
                                {trend !== null ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                    {trend > 0 ? <TrendingUp sx={{ fontSize: 16, color: COLORS.success }} /> : trend < 0 ? <TrendingDown sx={{ fontSize: 16, color: COLORS.danger }} /> : <span style={{ fontSize: '0.75rem' }}>→</span>}
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: trend > 0 ? COLORS.success : trend < 0 ? COLORS.danger : '#6B7280' }}>
                                      {trend !== 0 ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)}` : 'stable'}
                                    </Typography>
                                  </Box>
                                ) : <Typography variant="caption" sx={{ color: '#9CA3AF' }}>—</Typography>}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── ADD EVALUATION DIALOG ──────────────────────────────────── */}
      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>➕ Nouvelle évaluation</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Nom de l'évaluation"
              fullWidth size="small"
              value={newEvalForm.nom}
              onChange={e => setNewEvalForm(f => ({ ...f, nom: e.target.value }))}
            />
            <TextField
              select label="Type" fullWidth size="small"
              value={newEvalForm.type}
              onChange={e => setNewEvalForm(f => ({ ...f, type: e.target.value }))}
            >
              <MenuItem value="Devoir Surveillé">📝 Devoir Surveillé</MenuItem>
              <MenuItem value="Travaux Pratiques">🔬 Travaux Pratiques</MenuItem>
              <MenuItem value="Projet">🗂️ Projet</MenuItem>
              <MenuItem value="Examen Final">🎯 Examen Final</MenuItem>
              <MenuItem value="Séance en ligne">💻 Séance en ligne</MenuItem>
            </TextField>
            <TextField
              label="Date" type="date" fullWidth size="small"
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: `${new Date().getFullYear()}-01-01` }}
              value={newEvalForm.date}
              onChange={e => setNewEvalForm(f => ({ ...f, date: e.target.value }))}
            />
            <TextField
              label="Coefficient" type="number" fullWidth size="small"
              inputProps={{ min: 1, max: 10 }}
              value={newEvalForm.coef}
              onChange={e => setNewEvalForm(f => ({ ...f, coef: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setOpenAddDialog(false)} sx={{ textTransform: 'none' }}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleAddEvaluation}
            disabled={!newEvalForm.nom.trim()}
            sx={{
              textTransform: 'none',
              background: 'linear-gradient(135deg, #06D6A0 0%, #04B884 100%)',
              fontWeight: 700,
            }}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnseignantNotes;
