import { useState, useEffect, useMemo } from 'react';
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
  Chip,
  Button,
  MenuItem,
  TextField,
  CircularProgress,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tabs,
  Tab,
  Collapse,
  Badge,
  IconButton,
  Alert,
  Snackbar,
  Tooltip,
  Autocomplete,
} from '@mui/material';
import { Close, InfoOutlined, Groups, Download, Add, EventNote, CheckCircle, RadioButtonUnchecked, ExpandMore, ExpandLess, History, DeleteOutline, PersonSearch } from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../../services/api';
import { MLSection } from '../../components/ML/MLPredictions';

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

const PIE_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

// ── INFO MODAL CONFIGS ─────────────────────────────────────────────────
const CARD_INFO_CONFIGS = {
  distributionNotes: {
    title: 'Distribution des Notes',
    icon: '📊',
    color: '#3B82F6',
    description: 'Ce graphique en barres montre la répartition des étudiants selon leurs tranches de notes. Il permet d\'identifier rapidement les groupes de niveau.',
    legend: [
      { label: 'En échec (<10/20)', desc: 'Nécessitent un rattrapage urgent', color: '#EF4444' },
      { label: 'Passable (10-12/20)', desc: 'Niveau juste suffisant', color: '#F59E0B' },
      { label: 'Bien (12-16/20)', desc: 'Bonne maîtrise des concepts', color: '#10B981' },
      { label: 'Excellent (>16/20)', desc: 'Excellente performance', color: '#3B82F6' },
    ],
    insight: 'Une distribution normale (courbe en cloche) indique un enseignement adapté. Si trop d\'étudiants sont en échec, ajustez la difficulté ou le rythme.',
  },
  repartitionStatuts: {
    title: 'Répartition des Statuts',
    icon: '🎯',
    color: '#8B5CF6',
    description: 'Ce graphique circulaire montre la proportion d\'étudiants dans chaque catégorie de performance. Utile pour évaluer la santé globale de la classe.',
    legend: [
      { label: 'En échec', desc: 'Moyenne < 8/20', color: '#EF4444' },
      { label: 'À risque', desc: 'Moyenne 8-10/20', color: '#F59E0B' },
      { label: 'Passable', desc: 'Moyenne 10-12/20', color: '#FCD34D' },
      { label: 'Bien', desc: 'Moyenne 12-15/20', color: '#10B981' },
      { label: 'Excellent', desc: 'Moyenne ≥ 15/20', color: '#3B82F6' },
    ],
    insight: 'Idéalement, moins de 15% des étudiants devraient être en échec ou à risque. Plus de 50% en "Bien" ou "Excellent" indique une classe performante.',
  },
  evolutionMoyenne: {
    title: 'Évolution Moyenne & Présences',
    icon: '📈',
    color: '#10B981',
    description: 'Ce graphique linéaire suit l\'évolution de la moyenne de classe et du taux de présence au fil du semestre. Permet de détecter les tendances.',
    legend: [
      { label: 'Moyenne /20', desc: 'Ligne bleue - Performance académique', color: '#3B82F6' },
      { label: 'Présences %', desc: 'Ligne verte pointillée - Assiduité', color: '#10B981' },
      { label: 'Tendance positive', desc: 'Courbe ascendante', color: '#10B981' },
      { label: 'Tendance négative', desc: 'Courbe descendante', color: '#EF4444' },
    ],
    insight: 'Une baisse simultanée de la moyenne et des présences signale un problème. Intervenez rapidement avec des séances de soutien.',
  },
  competences: {
    title: 'Maîtrise par Compétence',
    icon: '🕸️',
    color: '#8B5CF6',
    description: 'Ce graphique radar visualise le niveau de maîtrise moyen de la classe pour chaque compétence clé du cours. Identifie les points forts et faibles.',
    legend: [
      { label: 'Excellent (≥80%)', desc: 'Compétence bien maîtrisée', color: '#10B981' },
      { label: 'Bon (60-80%)', desc: 'Niveau satisfaisant', color: '#3B82F6' },
      { label: 'Moyen (40-60%)', desc: 'Nécessite renforcement', color: '#F59E0B' },
      { label: 'Faible (<40%)', desc: 'Lacune importante', color: '#EF4444' },
    ],
    insight: 'Concentrez vos efforts pédagogiques sur les compétences avec un score <60%. Proposez des exercices ciblés et du tutorat.',
  },
};

// ── INFO MODAL COMPONENT ───────────────────────────────────────────────
const InfoModal = ({ open, onClose, config }) => {
  if (!config) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          border: `1.5px solid #EAF4FF`,
          boxShadow: `0 24px 60px rgba(26,58,107,0.18)`,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          background: `linear-gradient(135deg, ${config.color}12 0%, #EAF4FF 100%)`,
          borderBottom: `1.5px solid ${config.color}20`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '14px',
              background: '#fff',
              border: `1.5px solid ${config.color}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: `0 4px 16px ${config.color}18`,
            }}
          >
            {config.icon}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, color: '#1A3A6B', fontSize: '1.05rem', letterSpacing: '-0.3px' }}>
              {config.title}
            </Typography>
            <Typography sx={{ color: '#8A9BB0', fontSize: '0.74rem' }}>Analyse détaillée</Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: '#1A3A6B',
            opacity: 0.5,
            borderRadius: '10px',
            '&:hover': { background: `${config.color}18`, opacity: 1, transform: 'rotate(90deg)' },
            transition: 'all 0.2s',
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </Box>

      {/* Body */}
      <DialogContent sx={{ p: 3 }}>
        {/* Description */}
        <Box sx={{ mb: 2.5, p: 2.5, borderRadius: '14px', background: '#fff', border: `1px solid #EAF4FF` }}>
          <Typography sx={{ fontWeight: 800, color: '#1A3A6B', fontSize: '0.88rem', mb: 1.2 }}>
            📖 Comment lire cette carte ?
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.7 }}>
            {config.description}
          </Typography>
        </Box>

        {/* Legend items */}
        {config.legend && (
          <Box>
            <Typography sx={{ fontWeight: 800, color: '#1A3A6B', fontSize: '0.88rem', mb: 1.2 }}>
              🔑 Légende des indicateurs
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {config.legend.map((item, i) => (
                <Box
                  key={i}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: '12px',
                    background: `${item.color}08`,
                    border: `1px solid ${item.color}20`,
                  }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: item.color,
                      flexShrink: 0,
                      mt: 0.5,
                      boxShadow: `0 0 6px ${item.color}60`,
                    }}
                  />
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: '#1A3A6B', fontSize: '0.82rem' }}>
                      {item.label}
                    </Typography>
                    {item.desc && (
                      <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', mt: 0.2 }}>{item.desc}</Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Insight box */}
        {config.insight && (
          <Box
            sx={{
              mt: 2.5,
              p: 2.5,
              borderRadius: '14px',
              background: `linear-gradient(135deg, ${config.color}08, #EAF4FF)`,
              border: `1px solid ${config.color}20`,
            }}
          >
            <Typography sx={{ fontSize: '0.84rem', color: '#1A3A6B', fontWeight: 600, lineHeight: 1.65 }}>
              💡 <strong>Insight :</strong> {config.insight}
            </Typography>
          </Box>
        )}
      </DialogContent>

      {/* Footer */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderTop: `1px solid #EAF4FF`,
          display: 'flex',
          justifyContent: 'flex-end',
          background: '#fff',
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
            background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}DD 100%)`,
            boxShadow: `0 4px 16px ${config.color}30`,
            '&:hover': { boxShadow: `0 6px 20px ${config.color}45`, transform: 'translateY(-1px)' },
            transition: 'all 0.2s',
          }}
        >
          Fermer
        </Button>
      </Box>
    </Dialog>
  );
};

// ── MINI PROGRESS BAR ─────────────────────────────────────────────────
const MiniProgress = ({ label, value, max, color }) => (
  <Box sx={{ mb: 1.5 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="caption" sx={{ fontWeight: 700, color }}>{value}/{max}</Typography>
    </Box>
    <LinearProgress
      variant="determinate"
      value={(value / max) * 100}
      sx={{
        height: 6,
        borderRadius: 3,
        background: '#E5E7EB',
        '& .MuiLinearProgress-bar': { background: color, borderRadius: 3 },
      }}
    />
  </Box>
);

// ── MAIN COMPONENT ─────────────────────────────────────────────────────
const EnseignantDashboard = () => {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [selectedGroupe, setSelectedGroupe] = useState('');
  const [selectedPeriode, setSelectedPeriode] = useState('annee');
  const [loading, setLoading] = useState(true);
  const [enseignantData, setEnseignantData] = useState(null);
  const [matieres, setMatieres] = useState([]);
  const [matieresForm, setMatieresForm] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [stats, setStats] = useState(null);
  const [statsParMatiere, setStatsParMatiere] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [etudiantsARisque, setEtudiantsARisque] = useState([]);
  const [risqueDialogOpen, setRisqueDialogOpen] = useState(false);
  const [seanceDialogOpen, setSeanceDialogOpen] = useState(false);
  const [seanceForm, setSeanceForm] = useState({ id_matiere: '', type_examen: '', date_examen: '', semestre: '', coefficient: '1.00', annee_universitaire: '2025-2026' });
  const [seanceSubmitting, setSeanceSubmitting] = useState(false);
  const [seanceError, setSeanceError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [seancesProchaines, setSeancesProchaines] = useState([]);
  const [infoModal, setInfoModal] = useState({ open: false, key: null });
  const [chartsData, setChartsData] = useState(null);

  // ── Absences ─────────────────────────────────────────────────────────
  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false);
  const [absenceForm, setAbsenceForm] = useState({ id_specialite: '', date: new Date().toISOString().slice(0, 10), type_seance: 'CM', semestre: '' });
  const [absenceStudents, setAbsenceStudents] = useState([]);
  const [absentIds, setAbsentIds] = useState(new Set());
  const [absenceLoading, setAbsenceLoading] = useState(false);
  const [absenceSaving, setAbsenceSaving] = useState(false);
  const [absenceLoaded, setAbsenceLoaded] = useState(false);
  const [absenceTab, setAbsenceTab] = useState(0);
  const [historique, setHistorique] = useState([]);
  const [historiqueLoading, setHistoriqueLoading] = useState(false);
  const [historiqueSpecialite, setHistoriqueSpecialite] = useState('');
  const [expandedStudent, setExpandedStudent] = useState(null);
  // individual absence marking
  const [allStudents, setAllStudents] = useState([]);
  const [allStudentsLoading, setAllStudentsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [singleForm, setSingleForm] = useState({ date: new Date().toISOString().slice(0, 10), type_seance: 'CM', semestre: '' });
  const [markingLoading, setMarkingLoading] = useState(false);
  const [markResult, setMarkResult] = useState(null);

  const loadAbsenceStudents = async () => {
    if (!absenceForm.id_specialite || !absenceForm.date) return;
    setAbsenceLoading(true);
    setAbsenceLoaded(false);
    try {
      const r = await api.get('/enseignant/dashboard/absences', {
        params: { id_specialite: absenceForm.id_specialite, date: absenceForm.date, type_seance: absenceForm.type_seance },
      });
      const students = r.data.data || [];
      setAbsenceStudents(students);
      setAbsentIds(new Set(students.filter(s => s.absent).map(s => s.id_etudiant)));
      setAbsenceLoaded(true);
    } catch (e) {
      console.error('Erreur chargement absences:', e);
    } finally {
      setAbsenceLoading(false);
    }
  };

  const toggleAbsent = (id) => setAbsentIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const loadHistorique = async (idSpecialite) => {
    if (!idSpecialite) return;
    setHistoriqueLoading(true);
    try {
      const r = await api.get('/enseignant/dashboard/absences/historique', { params: { id_specialite: idSpecialite } });
      setHistorique(r.data.data || []);
    } catch (e) {
      console.error('Erreur historique:', e);
    } finally {
      setHistoriqueLoading(false);
    }
  };

  const handleSaveAbsences = async () => {
    setAbsenceSaving(true);
    try {
      await api.post('/enseignant/dashboard/absences', {
        id_specialite: parseInt(absenceForm.id_specialite),
        date: absenceForm.date,
        type_seance: absenceForm.type_seance,
        semestre: absenceForm.semestre ? parseInt(absenceForm.semestre) : null,
        absents: [...absentIds],
      });
      setSnackbar({ open: true, message: `${absentIds.size} absence(s) enregistrée(s) avec succès`, severity: 'success' });
      setAbsenceDialogOpen(false);
    } catch (e) {
      setSnackbar({ open: true, message: 'Erreur lors de la sauvegarde', severity: 'error' });
    } finally {
      setAbsenceSaving(false);
    }
  };

  const loadAllStudents = async () => {
    if (allStudents.length > 0) return;
    setAllStudentsLoading(true);
    try {
      const r = await api.get('/enseignant/dashboard/students');
      setAllStudents(r.data.data || []);
    } catch (e) {
      console.error('Erreur chargement étudiants:', e);
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
        id_etudiant: selectedStudent.id_etudiant,
        id_specialite: selectedStudent.id_specialite,
        date: singleForm.date,
        type_seance: singleForm.type_seance,
        semestre: singleForm.semestre ? parseInt(singleForm.semestre) : null,
      });
      setMarkResult(r.data);
    } catch (e) {
      console.error('Erreur marquage absence:', e);
    } finally {
      setMarkingLoading(false);
    }
  };

  const openInfo = (key) => setInfoModal({ open: true, key });
  const closeInfo = () => setInfoModal({ open: false, key: null });

  const openSeanceDialog = () => {
    setSeanceForm({ id_matiere: '', type_examen: '', date_examen: '', semestre: '', coefficient: '1.00', annee_universitaire: '2025-2026' });
    setSeanceError('');
    setSeanceDialogOpen(true);
  };

  const handleSeanceFieldChange = (field, value) => {
    setSeanceForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'id_matiere' && value) {
        const mat = matieresForm.find(m => String(m.id_matiere) === String(value));
        if (mat?.semestre) updated.semestre = String(mat.semestre);
      }
      return updated;
    });
  };

  const handleSeanceSubmit = async () => {
    if (!seanceForm.id_matiere || !seanceForm.type_examen) {
      setSeanceError('Matière et type sont obligatoires.');
      return;
    }
    setSeanceSubmitting(true);
    setSeanceError('');
    try {
      await api.post('/enseignant/dashboard/planning', {
        id_matiere: parseInt(seanceForm.id_matiere),
        type_examen: seanceForm.type_examen,
        date_examen: seanceForm.date_examen || null,
        semestre: seanceForm.semestre ? parseInt(seanceForm.semestre) : null,
        coefficient: parseFloat(seanceForm.coefficient) || 1.0,
        annee_universitaire: seanceForm.annee_universitaire,
      });
      setSeanceDialogOpen(false);
      setSnackbar({ open: true, message: 'Séance créée avec succès !', severity: 'success' });
    } catch (err) {
      setSeanceError(err.response?.data?.message || 'Erreur lors de la création.');
    } finally {
      setSeanceSubmitting(false);
    }
  };

  // Matieres filtered by selected groupe
  const filteredMatieres = selectedGroupe
    ? matieres.filter((m) => m.type_niveau === selectedGroupe)
    : matieres;

  const handleMatiereChange = (idSpecialite) => {
    setSelectedCourse(idSpecialite);
    if (!idSpecialite) return;
    const matiere = matieres.find((m) => String(m.id_specialite) === String(idSpecialite));
    if (matiere) setSelectedGroupe(matiere.type_niveau);
  };

  const handleGroupeChange = (typeNiveau) => {
    setSelectedGroupe(typeNiveau);
    if (!typeNiveau) return;
    // Clear matière if it doesn't belong to the newly selected groupe
    const current = matieres.find((m) => String(m.id_specialite) === String(selectedCourse));
    if (current && current.type_niveau !== typeNiveau) setSelectedCourse('');
  };

  // Initial load: profile + filters + stats
  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Critical: profile + filters in parallel
        const [profileRes, filtersRes] = await Promise.all([
          api.get('/profile'),
          api.get('/enseignant/dashboard/filters'),
        ]);

        const data = profileRes.data.data;
        setEnseignantData({
          nom: data.nom,
          prenom: data.prenom,
          grade: data.enseignant?.grade || '',
          specialite: data.enseignant?.specialite || '',
          departement: data.enseignant?.departement_nom || '',
          etablissement: data.enseignant?.etablissement_nom || '',
          etablissementId: data.enseignant?.etablissement_id || null,
          universite: data.enseignant?.universite_nom || '',
        });
        setMatieres(filtersRes.data.data.matieres);
        setGroupes(filtersRes.data.data.groupes);
        setMatieresForm(filtersRes.data.data.matieresForm || []);

        // All dashboard data in parallel — failures are isolated
        const [statsRes, parMatiereRes, risqueRes, chartsRes, planningRes] = await Promise.allSettled([
          api.get('/enseignant/dashboard/stats'),
          api.get('/enseignant/dashboard/stats-par-matiere'),
          api.get('/enseignant/dashboard/etudiants-a-risque'),
          api.get('/enseignant/dashboard/charts'),
          api.get('/enseignant/dashboard/planning?annee=2025-2026'),
        ]);

        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data);
        if (parMatiereRes.status === 'fulfilled') setStatsParMatiere(parMatiereRes.value.data.data);
        if (risqueRes.status === 'fulfilled') setEtudiantsARisque(risqueRes.value.data.data);
        if (chartsRes.status === 'fulfilled') setChartsData(chartsRes.value.data.data);

        if (planningRes.status === 'fulfilled') {
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const upcoming = (planningRes.value.data.data || [])
            .filter(s => s.date_examen && new Date(s.date_examen) >= today)
            .sort((a, b) => new Date(a.date_examen) - new Date(b.date_examen))
            .slice(0, 3);
          setSeancesProchaines(upcoming);
        }

      } catch (error) {
        console.error('Erreur chargement dashboard enseignant:', error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Re-fetch stats + statsParMatiere when filters change
  useEffect(() => {
    if (loading) return;
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCourse) params.append('id_specialite', selectedCourse);
        if (selectedGroupe) params.append('type_niveau', selectedGroupe);
        if (selectedPeriode && selectedPeriode !== 'annee') params.append('periode', selectedPeriode);

        // Stats cards + Synthèse par matière both re-fetch with same filters
        const parMatiereParams = new URLSearchParams();
        if (selectedGroupe) parMatiereParams.append('type_niveau', selectedGroupe);
        if (selectedPeriode && selectedPeriode !== 'annee') parMatiereParams.append('periode', selectedPeriode);

        const risqueParams = new URLSearchParams();
        if (selectedCourse) risqueParams.append('id_specialite', selectedCourse);
        if (selectedGroupe) risqueParams.append('type_niveau', selectedGroupe);

        const chartsParams = new URLSearchParams();
        if (selectedCourse) chartsParams.append('id_specialite', selectedCourse);

        const [statsRes, parMatiereRes, risqueRes, chartsRes] = await Promise.allSettled([
          api.get(`/enseignant/dashboard/stats?${params.toString()}`),
          api.get(`/enseignant/dashboard/stats-par-matiere?${parMatiereParams.toString()}`),
          api.get(`/enseignant/dashboard/etudiants-a-risque?${risqueParams.toString()}`),
          api.get(`/enseignant/dashboard/charts?${chartsParams.toString()}`),
        ]);

        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data);
        if (parMatiereRes.status === 'fulfilled') setStatsParMatiere(parMatiereRes.value.data.data);
        if (risqueRes.status === 'fulfilled') setEtudiantsARisque(risqueRes.value.data.data);
        if (chartsRes.status === 'fulfilled') setChartsData(chartsRes.value.data.data);
      } catch (error) {
        console.error('Erreur rechargement stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [selectedCourse, selectedGroupe, selectedPeriode]);

  // ── DATA (from API) ────────────────────────────────────────────────────
  const distributionNotes = chartsData?.distributionNotes ?? [];
  const evolutionData     = chartsData?.evolutionData     ?? [];
  const competencesData   = chartsData?.competencesData   ?? [];
  const repartitionStatut = chartsData?.repartitionStatuts ?? [];


  const recommandations = useMemo(() => {
    const nbRisque = stats?.nb_a_risque ?? 0;
    const tauxReussite = stats?.taux_reussite ?? 100;
    const moyenneClasse = stats?.moyenne_classe ?? 20;
    const weakCompetences = (competencesData || []).filter(c => c.A < 60).map(c => c.competence);
    const weakSubjects = (statsParMatiere || []).filter(m => m.taux_reussite < 60 && m.total_etudiants > 0);

    const ressourceItems = [];
    if (weakCompetences.length > 0) {
      const names = weakCompetences.slice(0, 2).join(', ');
      const extra = weakCompetences.length > 2 ? ` (+${weakCompetences.length - 2} autre${weakCompetences.length - 2 > 1 ? 's' : ''})` : '';
      ressourceItems.push(`Module de révision : ${names}${extra}`);
    }
    if (nbRisque > 0) {
      ressourceItems.push(`Exercices de soutien ciblés pour ${nbRisque} étudiant${nbRisque > 1 ? 's' : ''} à risque`);
    }
    if (weakSubjects.length > 0) {
      ressourceItems.push(`Ressources complémentaires pour : ${weakSubjects[0].nom_specialite ?? 'matière concernée'}`);
    }
    if (moyenneClasse < 10) {
      ressourceItems.push('Quiz de consolidation des notions fondamentales');
    }
    if (ressourceItems.length === 0) {
      ressourceItems.push('Niveau général satisfaisant — maintenir le rythme actuel');
    }

    const actionItems = [];
    if (nbRisque > 0) {
      actionItems.push(`Organiser une séance de rattrapage pour les ${nbRisque} étudiant${nbRisque > 1 ? 's' : ''} à risque`);
    }
    if (nbRisque >= 3) {
      actionItems.push('Proposer un tutorat entre pairs pour les étudiants en difficulté');
    }
    if (tauxReussite < 70) {
      actionItems.push(`Revoir le rythme d'enseignement (taux de réussite actuel : ${tauxReussite}%)`);
    }
    if (weakSubjects.length > 0) {
      actionItems.push(`Ajuster le contenu des matières à faible réussite (${weakSubjects.length} matière${weakSubjects.length > 1 ? 's' : ''})`);
    }
    if (actionItems.length === 0) {
      actionItems.push('Continuer le suivi régulier de la progression des étudiants');
    }

    return [
      {
        titre: '📚 Ressources suggérées',
        color: '#10B981',
        bg: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
        border: '#A7F3D0',
        items: ressourceItems,
      },
      {
        titre: '🎯 Actions recommandées',
        color: '#8B5CF6',
        bg: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
        border: '#DDD6FE',
        items: actionItems,
      },
    ];
  }, [stats, competencesData, statsParMatiere]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const selectedMatiereInfo = enseignantData?.matieres?.find((m) => m.id === selectedCourse);

  return (
    <Box sx={{ pb: 4 }}>
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: '#fff', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 2, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>
            🎓
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1F2937', mb: 0.5 }}>
              Dashboard Enseignant
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Prof. {enseignantData?.prenom} {enseignantData?.nom}
              {enseignantData?.grade && ` · ${enseignantData.grade}`}
              {enseignantData?.departement && ` — ${enseignantData.departement}`}
            </Typography>
            {enseignantData?.etablissement && (
              <Box
                onClick={() => navigate('/dashboard/enseignant/etudiants')}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, cursor: 'pointer', width: 'fit-content' }}
              >
                <span style={{ fontSize: '0.85rem' }}>🏫</span>
                <Typography
                  variant="caption"
                  sx={{
                    color: COLORS.secondary, fontWeight: 700,
                    textDecoration: 'underline', textDecorationColor: `${COLORS.secondary}50`,
                    textUnderlineOffset: '3px', transition: 'all 0.2s',
                    '&:hover': { color: COLORS.primary, textDecorationColor: COLORS.primary },
                  }}
                >
                  {enseignantData.etablissement}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, mr: -1 }}>
          <Tooltip title="Gestion des absences">
            <IconButton
              onClick={() => navigate('/dashboard/enseignant/absences')}
              sx={{
                width: 44, height: 44, borderRadius: '14px',
                background: COLORS.warning, color: '#fff',
                transition: 'all 0.3s ease', boxShadow: `0 3px 10px ${COLORS.warning}40`,
                '&:hover': { background: '#D97706', transform: 'translateY(-2px)', boxShadow: `0 5px 16px ${COLORS.warning}50` },
              }}
            >
              <EventNote sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Gestion des étudiants">
            <IconButton
              onClick={() => navigate('/dashboard/enseignant/etudiants')}
              sx={{
                width: 44, height: 44, borderRadius: '14px',
                background: COLORS.purple,
                color: '#fff',
                transition: 'all 0.3s ease',
                boxShadow: '0 3px 10px rgba(139,92,246,0.4)',
                '&:hover': { background: '#7C3AED', transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(139,92,246,0.5)' },
              }}
            >
              <Groups sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Exporter rapport">
            <IconButton
              sx={{
                width: 44, height: 44, borderRadius: '14px',
                background: COLORS.secondary,
                color: '#fff',
                transition: 'all 0.3s ease',
                boxShadow: '0 3px 10px rgba(59,130,246,0.4)',
                '&:hover': { background: '#2563EB', transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(59,130,246,0.5)' },
              }}
            >
              <Download sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Nouvelle séance">
            <IconButton
              onClick={openSeanceDialog}
              sx={{
                width: 44, height: 44, borderRadius: '14px',
                background: COLORS.success,
                color: '#fff',
                transition: 'all 0.3s ease',
                boxShadow: '0 3px 10px rgba(16,185,129,0.4)',
                '&:hover': { background: '#059669', transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(16,185,129,0.5)' },
              }}
            >
              <Add sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Prédictions ML ── */}
      <Box sx={{ mb: 3 }}>
        <MLSection modeles={['m2', 'm3']} />
      </Box>

      {/* ── Recommandations IA ── */}
      <Box sx={{ mb: 3 }}>
        <Card sx={{ borderRadius: '20px', overflow: 'hidden', border: '1.5px solid #C7D9F5', boxShadow: '0 4px 20px rgba(77,159,255,0.08)' }}>
          <Box sx={{
            px: 3, py: 2.5,
            borderBottom: `1px solid #C7D9F5`,
            background: `linear-gradient(135deg, #EAF4FF 0%, #DBEEFF 100%)`,
            display: 'flex', alignItems: 'center', gap: 2,
          }}>
            <Box sx={{ width: 52, height: 52, borderRadius: '14px', background: 'linear-gradient(135deg, #1A3A6B, #4D9FFF)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0, boxShadow: '0 4px 14px rgba(77,159,255,0.3)' }}>
              🤖
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, color: '#1A3A6B', fontSize: '1.1rem', letterSpacing: '-0.3px' }}>
                Recommandations IA
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0' }}>
                Analyse intelligente de vos données pédagogiques
              </Typography>
            </Box>
            <Chip label="IA ACTIVE" size="small" sx={{ background: 'linear-gradient(135deg, #1A3A6B, #4D9FFF)', color: '#fff', fontWeight: 800, fontSize: '0.7rem', borderRadius: '8px', border: 'none' }} />
          </Box>
          <CardContent sx={{ p: 3 }}>
            {recommandations.map((rec, index) => (
              <Box
                key={index}
                sx={{
                  mb: index < recommandations.length - 1 ? 2 : 0,
                  p: 2,
                  background: rec.bg,
                  borderRadius: 2,
                  border: `1px solid ${rec.border}`,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: rec.color }}>
                  {rec.titre}
                </Typography>
                {rec.items.map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>•</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>{item}</Typography>
                  </Box>
                ))}
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>



      {/* ── FILTERS ────────────────────────────────────────────────── */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Spécialité / Classe */}
        <TextField
          select
          value={selectedCourse}
          onChange={(e) => {
            setSelectedMatiere(''); // reset matière when class changes
            handleMatiereChange(e.target.value);
          }}
          label="Spécialité / Classe"
          sx={{ minWidth: 240 }}
          size="small"
        >
          <MenuItem value="">Toutes les spécialités</MenuItem>
          {matieres.map((m) => (
            <MenuItem key={m.id_specialite} value={m.id_specialite}>
              {m.nom_specialite}
            </MenuItem>
          ))}
        </TextField>

        {/* Matière — 7 sujets réels, filtrés par la spécialité choisie */}
        <TextField
          select
          value={selectedMatiere}
          onChange={(e) => {
            const id = e.target.value;
            setSelectedMatiere(id);
            if (id) {
              const mat = matieresForm.find(m => String(m.id_matiere) === String(id));
              if (mat) {
                setSelectedCourse(String(mat.id_specialite));
                const spec = matieres.find(s => String(s.id_specialite) === String(mat.id_specialite));
                if (spec) setSelectedGroupe(spec.type_niveau);
              }
            } else {
              setSelectedCourse('');
              setSelectedGroupe('');
            }
          }}
          label="Matière"
          sx={{ minWidth: 220 }}
          size="small"
        >
          <MenuItem value="">Toutes les matières</MenuItem>
          {(selectedCourse
            ? matieresForm.filter(m => String(m.id_specialite) === String(selectedCourse))
            : matieresForm
          ).map((m) => (
            <MenuItem key={m.id_matiere} value={m.id_matiere}>
              {m.nom_matiere}{m.semestre ? ` — S${m.semestre}` : ''}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          value={selectedPeriode}
          onChange={(e) => setSelectedPeriode(e.target.value)}
          label="Période"
          sx={{ minWidth: 140 }}
          size="small"
        >
          <MenuItem value="annee">Année complète</MenuItem>
          <MenuItem value="s1">Semestre 1</MenuItem>
          <MenuItem value="s2">Semestre 2</MenuItem>
        </TextField>
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {statsLoading ? '🔄 Mise à jour...' : `🕒 Mis à jour: ${new Date().toLocaleDateString('fr-FR')}`}
        </Typography>
      </Box>

      {/* ── STATS CARDS ────────────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { icon: '👥', label: 'Étudiants',      value: stats?.total_etudiants   ?? (statsLoading ? '…' : '—'), color: COLORS.secondary, bg: `linear-gradient(135deg, ${COLORS.secondary}08, ${COLORS.accent}08)` },
          { icon: '🎓', label: 'Spécialités',     value: stats?.nb_specialites    ?? (statsLoading ? '…' : '—'), color: COLORS.purple,    bg: `linear-gradient(135deg, ${COLORS.purple}08, ${COLORS.purple}15)` },
          { icon: '📚', label: 'Matières',        value: stats?.nb_matieres       ?? (statsLoading ? '…' : '—'), color: COLORS.accent,    bg: `linear-gradient(135deg, ${COLORS.accent}08, ${COLORS.accent}15)` },
          { icon: '📊', label: 'Moyenne classe',  value: stats ? `${stats.moyenne_classe}/20` : (statsLoading ? '…' : '—'), color: COLORS.success, bg: `linear-gradient(135deg, ${COLORS.success}08, ${COLORS.success}15)` },
          { icon: '✅', label: 'Taux réussite',   value: stats ? `${stats.taux_reussite}%`    : (statsLoading ? '…' : '—'), color: COLORS.warning, bg: `linear-gradient(135deg, ${COLORS.warning}08, ${COLORS.warning}15)` },
          { icon: '⚠️', label: 'À risque',        value: stats?.nb_a_risque       ?? (statsLoading ? '…' : '—'), color: COLORS.danger,    bg: `linear-gradient(135deg, ${COLORS.danger}08, ${COLORS.danger}15)` },
          { icon: '📋', label: 'Absences',        value: stats?.nb_absences       ?? (statsLoading ? '…' : '—'), color: '#F59E0B',        bg: `linear-gradient(135deg, #F59E0B08, #F59E0B15)` },
        ].map((s) => (
          <Grid item xs={6} sm={4} md key={s.label}>
            <Card
              sx={{
                borderRadius: 3,
                border: '1.5px solid #EAF4FF',
                background: s.bg,
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      background: s.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                    }}
                  >
                    {s.icon}
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {s.label}
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.primary }}>
                  {s.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── SYNTHÈSE PAR MATIÈRE ───────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>📚 Synthèse par matière</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Cliquez sur une carte pour filtrer le dashboard
                </Typography>
              </Box>
              {statsParMatiere.length === 0 && (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                  Aucune matière assignée ou données non disponibles.
                </Typography>
              )}
              <Grid container spacing={2.5}>
                {statsParMatiere.map((m) => {
                  const isSelected = String(selectedCourse) === String(m.id_specialite);
                  const niveauColor = m.type_niveau === 'MASTER' ? COLORS.purple : m.type_niveau === 'DOCTORAT' ? COLORS.danger : COLORS.secondary;
                  const moyenneColor = m.moyenne >= 14 ? COLORS.success : m.moyenne >= 10 ? COLORS.warning : COLORS.danger;
                  const reussiteColor = m.taux_reussite >= 80 ? COLORS.success : m.taux_reussite >= 60 ? COLORS.warning : COLORS.danger;

                  return (
                    <Grid item xs={12} sm={6} md={3} key={m.id_specialite}>
                      <Box
                        onClick={() => handleMatiereChange(isSelected ? '' : m.id_specialite)}
                        sx={{
                          p: 2.5,
                          borderRadius: '16px',
                          border: isSelected ? `2px solid ${niveauColor}` : '1.5px solid #E5E7EB',
                          background: isSelected
                            ? `linear-gradient(135deg, ${niveauColor}10 0%, ${niveauColor}05 100%)`
                            : '#FAFAFA',
                          cursor: 'pointer',
                          transition: 'all 0.22s ease',
                          boxShadow: isSelected ? `0 4px 20px ${niveauColor}22` : 'none',
                          '&:hover': {
                            border: `2px solid ${niveauColor}80`,
                            background: `linear-gradient(135deg, ${niveauColor}08 0%, ${niveauColor}03 100%)`,
                            transform: 'translateY(-2px)',
                            boxShadow: `0 6px 24px ${niveauColor}18`,
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ flex: 1, mr: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1A3A6B', fontSize: '0.85rem', lineHeight: 1.3, mb: 0.5 }}>
                              {m.nom_specialite}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#8A9BB0', fontWeight: 500 }}>
                              {m.code_specialite}
                            </Typography>
                          </Box>
                          <Chip
                            label={m.type_niveau}
                            size="small"
                            sx={{ background: `${niveauColor}18`, color: niveauColor, fontWeight: 700, fontSize: '0.65rem', height: 20, flexShrink: 0 }}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                          <Box sx={{ textAlign: 'center', flex: 1 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#1A3A6B' }}>{m.total_etudiants}</Typography>
                            <Typography variant="caption" sx={{ color: '#8A9BB0', fontSize: '0.68rem' }}>étudiants</Typography>
                          </Box>
                          <Box sx={{ width: '1px', background: '#E5E7EB' }} />
                          <Box sx={{ textAlign: 'center', flex: 1 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: moyenneColor }}>
                              {m.moyenne > 0 ? `${m.moyenne}/20` : '—'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#8A9BB0', fontSize: '0.68rem' }}>moyenne</Typography>
                          </Box>
                          <Box sx={{ width: '1px', background: '#E5E7EB' }} />
                          <Box sx={{ textAlign: 'center', flex: 1 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: COLORS.danger }}>{m.nb_a_risque}</Typography>
                            <Typography variant="caption" sx={{ color: '#8A9BB0', fontSize: '0.68rem' }}>à risque</Typography>
                          </Box>
                        </Box>

                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, fontSize: '0.72rem' }}>Taux de réussite</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: reussiteColor, fontSize: '0.72rem' }}>
                              {m.total_etudiants > 0 ? `${m.taux_reussite}%` : '—'}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={m.taux_reussite}
                            sx={{
                              height: 7,
                              borderRadius: 4,
                              background: '#E5E7EB',
                              '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, ${reussiteColor}CC, ${reussiteColor})`, borderRadius: 4 },
                            }}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── ROW 1 ──────────────────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>

        {/* Distribution notes */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>📊 Distribution des notes</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={`${stats?.total_etudiants ?? 0} étudiants`} size="small" sx={{ background: '#EFF6FF', color: '#1E40AF', fontWeight: 600 }} />
                  <IconButton
                    size="small"
                    onClick={() => openInfo('distributionNotes')}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '10px',
                      background: '#3B82F612',
                      border: '1.5px solid #3B82F625',
                      color: '#3B82F6',
                      '&:hover': {
                        background: '#3B82F6',
                        color: '#fff',
                        transform: 'scale(1.1)',
                      },
                      transition: 'all 0.2s',
                    }}
                  >
                    <InfoOutlined sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Box>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={distributionNotes} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="tranche" stroke="#6B7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(v) => [`${v} étudiants`]}
                  />
                  <Bar
                    dataKey="nombre"
                    name="Étudiants"
                    radius={[8, 8, 0, 0]}
                    fill="#3B82F6"
                  >
                    {distributionNotes.map((item, index) => (
                      <Cell
                        key={index}
                        fill={item.tranche === '<8' || item.tranche === '8-10' ? '#EF4444'
                          : item.tranche === '10-12' ? '#F59E0B'
                          : item.tranche === '12-14' || item.tranche === '14-16' ? '#10B981'
                          : '#3B82F6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                {[
                  { label: 'En échec (<10)',  color: '#EF4444', tranches: ['<8','8-10'] },
                  { label: 'Passable (10–12)',color: '#F59E0B', tranches: ['10-12'] },
                  { label: 'Bien (12–16)',    color: '#10B981', tranches: ['12-14','14-16'] },
                  { label: 'Excellent (>16)', color: '#3B82F6', tranches: ['16-18','>18'] },
                ].map((item) => {
                  const count = distributionNotes.filter(d => item.tranches.includes(d.tranche)).reduce((s,d) => s + d.nombre, 0);
                  return (
                    <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{item.label} ({count})</Typography>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Répartition statut - Pie */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>🎯 Répartition des statuts</Typography>
                <IconButton
                  size="small"
                  onClick={() => openInfo('repartitionStatuts')}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '10px',
                    background: '#8B5CF612',
                    border: '1.5px solid #8B5CF625',
                    color: '#8B5CF6',
                    '&:hover': {
                      background: '#8B5CF6',
                      color: '#fff',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <InfoOutlined sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={repartitionStatut}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {repartitionStatut.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(v) => [`${v} étudiants`]} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 1 }}>
                {repartitionStatut.map((item, i) => {
                  const total = repartitionStatut.reduce((s, d) => s + d.value, 0);
                  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  return (
                    <Box key={item.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[i] }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{item.name}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{item.value} ({pct}%)</Typography>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── ROW 2 ──────────────────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>

        {/* Évolution + présences */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>📈 Évolution moyenne & présences</Typography>
                <IconButton
                  size="small"
                  onClick={() => openInfo('evolutionMoyenne')}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '10px',
                    background: '#10B98112',
                    border: '1.5px solid #10B98125',
                    color: '#10B981',
                    '&:hover': {
                      background: '#10B981',
                      color: '#fff',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <InfoOutlined sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="periode" stroke="#6B7280" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" stroke="#6B7280" tick={{ fontSize: 12 }} domain={[0, 20]} />
                  <YAxis yAxisId="right" orientation="right" stroke="#6B7280" tick={{ fontSize: 12 }} domain={[40, 100]} unit="%" />
                  <RechartsTooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="moyenne" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 5 }} name="Moyenne /20" />
                  <Line yAxisId="right" type="monotone" dataKey="presences" stroke="#10B981" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#10B981', r: 5 }} name="Présences %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Radar compétences */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>🕸️ Maîtrise par compétence</Typography>
                <IconButton
                  size="small"
                  onClick={() => openInfo('competences')}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '10px',
                    background: '#8B5CF612',
                    border: '1.5px solid #8B5CF625',
                    color: '#8B5CF6',
                    '&:hover': {
                      background: '#8B5CF6',
                      color: '#fff',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <InfoOutlined sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={competencesData}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="competence" tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Maîtrise %" dataKey="A" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.25} strokeWidth={2} />
                  <Legend />
                  <RechartsTooltip formatter={(v) => [`${v}%`, 'Maîtrise']} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── ROW 3 ──────────────────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>

        {/* Étudiants à risque */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>🔴 Étudiants à risque</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: 2, fontSize: '0.75rem' }}
                  onClick={() => setRisqueDialogOpen(true)}
                >
                  Voir tous →
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: '#F9FAFB' }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Étudiant</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Moy.</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Spécialité</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {etudiantsARisque.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.8rem', py: 3 }}>
                          Aucun étudiant à risque
                        </TableCell>
                      </TableRow>
                    ) : (
                      etudiantsARisque.map((etudiant, index) => (
                        <TableRow key={index} sx={{ '&:hover': { background: '#F9FAFB' } }}>
                          <TableCell sx={{ fontSize: '0.8rem' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', background: etudiant.statut === 'critique' ? '#FEE2E2' : '#FFF3E0', color: etudiant.statut === 'critique' ? '#991B1B' : '#E65100' }}>
                                {etudiant.nom.split(' ').map(n => n[0]).join('')}
                              </Avatar>
                              {etudiant.nom}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: etudiant.moyenne < 8 ? '#EF4444' : '#F59E0B', fontSize: '0.8rem' }}>
                            {etudiant.moyenne}/20
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {etudiant.specialite}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={etudiant.statut === 'critique' ? 'Critique' : 'Attention'}
                              size="small"
                              sx={{
                                background: etudiant.statut === 'critique' ? '#FEE2E2' : '#FFF3E0',
                                color: etudiant.statut === 'critique' ? '#991B1B' : '#E65100',
                                fontWeight: 700,
                                fontSize: '0.7rem',
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Séances à venir */}
        <Grid item xs={12} lg={3}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>📅 Prochaines séances</Typography>
              {seancesProchaines.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Aucune séance à venir</Typography>
                </Box>
              ) : seancesProchaines.map((s, i) => {
                const typeColors = {
                  'Devoir Surveillé': { bg: '#FFF3E0', border: '#FED7AA', color: '#92400E', label: 'DS' },
                  'Examen Final':     { bg: '#FEE2E2', border: '#FECACA', color: '#991B1B', label: 'EF' },
                  'Séance en ligne':  { bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF', label: 'SL' },
                };
                const tc = typeColors[s.type_examen] || { bg: '#F9FAFB', border: '#E5E7EB', color: '#374151', label: '—' };
                const dateFormatted = new Date(s.date_examen).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
                return (
                  <Box
                    key={s.id_examen}
                    sx={{
                      mb: 1.5, p: 1.5, borderRadius: 2,
                      background: i === 0 ? 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' : '#F9FAFB',
                      border: i === 0 ? '1px solid #BFDBFE' : '1px solid #E5E7EB',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.primary }}>
                        {dateFormatted}
                      </Typography>
                      <Chip
                        label={tc.label}
                        size="small"
                        sx={{ fontSize: '0.62rem', height: 18, background: tc.bg, color: tc.color, fontWeight: 700, border: `1px solid ${tc.border}` }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1F2937' }}>{s.nom_matiere}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{s.nom_specialite}</Typography>
                  </Box>
                );
              })}
              <Button
                fullWidth
                variant="outlined"
                size="small"
                sx={{ borderRadius: 2, mt: 1 }}
                onClick={() => navigate('/dashboard/enseignant/planning')}
              >
                Voir planning complet
              </Button>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* Info Modal */}
      <InfoModal open={infoModal.open} onClose={closeInfo} config={CARD_INFO_CONFIGS[infoModal.key]} />

      {/* ── Nouvelle séance dialog ─────────────────────────────────── */}
      <Dialog
        open={seanceDialogOpen}
        onClose={() => !seanceSubmitting && setSeanceDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', boxShadow: '0 24px 60px rgba(26,58,107,0.18)' } }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3, py: 2.5,
            background: 'linear-gradient(135deg, #06D6A010 0%, #ECFDF5 100%)',
            borderBottom: '1.5px solid #A7F3D0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: '#ECFDF5', border: '1.5px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
              ➕
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, color: '#1A3A6B', fontSize: '1.05rem' }}>Nouvelle séance</Typography>
              <Typography sx={{ color: '#8A9BB0', fontSize: '0.74rem' }}>Planifier un examen ou devoir</Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setSeanceDialogOpen(false)}
            disabled={seanceSubmitting}
            sx={{ borderRadius: '10px', color: '#1A3A6B', opacity: 0.5, '&:hover': { background: '#ECFDF5', opacity: 1, transform: 'rotate(90deg)' }, transition: 'all 0.2s' }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>

        {/* Body */}
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {seanceError && <Alert severity="error" sx={{ borderRadius: '12px' }}>{seanceError}</Alert>}

            {/* Matière */}
            <TextField
              select
              label="Matière *"
              value={seanceForm.id_matiere}
              onChange={e => handleSeanceFieldChange('id_matiere', e.target.value)}
              fullWidth
              size="small"
              disabled={seanceSubmitting}
            >
              <MenuItem value="">— Choisir une matière —</MenuItem>
              {matieresForm.map(m => (
                <MenuItem key={m.id_matiere} value={m.id_matiere}>
                  {m.nom_matiere} <Typography component="span" sx={{ color: '#9CA3AF', fontSize: '0.78rem', ml: 1 }}>({m.code_matiere})</Typography>
                </MenuItem>
              ))}
            </TextField>

            {/* Type */}
            <TextField
              select
              label="Type d'épreuve *"
              value={seanceForm.type_examen}
              onChange={e => handleSeanceFieldChange('type_examen', e.target.value)}
              fullWidth
              size="small"
              disabled={seanceSubmitting}
            >
              <MenuItem value="">— Choisir un type —</MenuItem>
              <MenuItem value="Devoir Surveillé">📝 Devoir Surveillé</MenuItem>
              <MenuItem value="Examen Final">🎯 Examen Final</MenuItem>
              <MenuItem value="Séance en ligne">💻 Séance en ligne</MenuItem>
            </TextField>

            {/* Date + Semestre row */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Date"
                type="date"
                value={seanceForm.date_examen}
                onChange={e => handleSeanceFieldChange('date_examen', e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: `${new Date().getFullYear()}-01-01` }}
                fullWidth
                size="small"
                disabled={seanceSubmitting}
              />
              <TextField
                select
                label="Semestre"
                value={seanceForm.semestre}
                onChange={e => handleSeanceFieldChange('semestre', e.target.value)}
                sx={{ minWidth: 130 }}
                size="small"
                disabled={seanceSubmitting}
              >
                <MenuItem value="">—</MenuItem>
                <MenuItem value="1">Semestre 1</MenuItem>
                <MenuItem value="2">Semestre 2</MenuItem>
              </TextField>
            </Box>

            {/* Coefficient + Année row */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Coefficient"
                type="number"
                inputProps={{ min: 0.1, max: 5, step: 0.1 }}
                value={seanceForm.coefficient}
                onChange={e => handleSeanceFieldChange('coefficient', e.target.value)}
                sx={{ minWidth: 140 }}
                size="small"
                disabled={seanceSubmitting}
              />
              <TextField
                select
                label="Année universitaire"
                value={seanceForm.annee_universitaire}
                onChange={e => handleSeanceFieldChange('annee_universitaire', e.target.value)}
                fullWidth
                size="small"
                disabled={seanceSubmitting}
              >
                <MenuItem value="2025-2026">2025-2026</MenuItem>
              </TextField>
            </Box>
          </Box>
        </DialogContent>

        {/* Footer */}
        <Box sx={{ px: 3, py: 2, borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button
            onClick={() => setSeanceDialogOpen(false)}
            disabled={seanceSubmitting}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, color: '#6B7280' }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSeanceSubmit}
            variant="contained"
            disabled={seanceSubmitting}
            sx={{
              borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3,
              background: 'linear-gradient(135deg, #06D6A0 0%, #04B884 100%)',
              boxShadow: '0 4px 16px rgba(6,214,160,0.3)',
              '&:hover': { boxShadow: '0 6px 20px rgba(6,214,160,0.45)', transform: 'translateY(-1px)' },
              transition: 'all 0.2s',
            }}
          >
            {seanceSubmitting ? 'Création...' : 'Créer la séance'}
          </Button>
        </Box>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px', fontWeight: 600 }} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Étudiants à risque — Dialog */}
      <Dialog
        open={risqueDialogOpen}
        onClose={() => setRisqueDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', boxShadow: '0 24px 60px rgba(26,58,107,0.18)' } }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            background: 'linear-gradient(135deg, #FEE2E210 0%, #FFF3E010 100%)',
            borderBottom: '1.5px solid #FEE2E2',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
              }}
            >
              🔴
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, color: '#1A3A6B', fontSize: '1.05rem' }}>
                Étudiants à risque
              </Typography>
              <Typography sx={{ color: '#8A9BB0', fontSize: '0.74rem' }}>
                {etudiantsARisque.length} étudiant{etudiantsARisque.length !== 1 ? 's' : ''} · moyenne &lt; 10/20
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setRisqueDialogOpen(false)}
            sx={{
              borderRadius: '10px',
              color: '#1A3A6B',
              opacity: 0.5,
              '&:hover': { background: '#FEE2E2', opacity: 1, transform: 'rotate(90deg)' },
              transition: 'all 0.2s',
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>

        {/* Body */}
        <DialogContent sx={{ p: 0 }}>
          {etudiantsARisque.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
              <Typography fontSize="2rem">✅</Typography>
              <Typography sx={{ mt: 1 }}>Aucun étudiant à risque</Typography>
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 420 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, background: '#F9FAFB', fontSize: '0.78rem' }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700, background: '#F9FAFB', fontSize: '0.78rem' }}>Étudiant</TableCell>
                    <TableCell sx={{ fontWeight: 700, background: '#F9FAFB', fontSize: '0.78rem' }}>Moyenne</TableCell>
                    <TableCell sx={{ fontWeight: 700, background: '#F9FAFB', fontSize: '0.78rem' }}>Spécialité</TableCell>
                    <TableCell sx={{ fontWeight: 700, background: '#F9FAFB', fontSize: '0.78rem' }}>Niveau</TableCell>
                    <TableCell sx={{ fontWeight: 700, background: '#F9FAFB', fontSize: '0.78rem' }}>Statut</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {etudiantsARisque.map((e, i) => (
                    <TableRow key={i} sx={{ '&:hover': { background: '#FFF9F9' } }}>
                      <TableCell sx={{ color: '#9CA3AF', fontSize: '0.78rem' }}>{i + 1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            sx={{
                              width: 30,
                              height: 30,
                              fontSize: '0.7rem',
                              background: e.statut === 'critique' ? '#FEE2E2' : '#FFF3E0',
                              color: e.statut === 'critique' ? '#991B1B' : '#E65100',
                            }}
                          >
                            {e.nom.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </Avatar>
                          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{e.nom}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            color: e.moyenne < 8 ? '#EF4444' : '#F59E0B',
                          }}
                        >
                          {e.moyenne}/20
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', color: '#4B5563', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.specialite}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={e.niveau}
                          size="small"
                          sx={{ fontSize: '0.65rem', height: 20, background: '#EFF6FF', color: '#1E40AF', fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={e.statut === 'critique' ? 'Critique' : 'Attention'}
                          size="small"
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: e.statut === 'critique' ? '#FEE2E2' : '#FFF3E0',
                            color: e.statut === 'critique' ? '#991B1B' : '#E65100',
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        {/* Footer */}
        <Box sx={{ px: 3, py: 2, borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '0.78rem', color: '#6B7280' }}>
            {etudiantsARisque.filter(e => e.statut === 'critique').length} critique(s) · {etudiantsARisque.filter(e => e.statut === 'attention').length} attention
          </Typography>
          <Button
            onClick={() => setRisqueDialogOpen(false)}
            variant="contained"
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
              '&:hover': { boxShadow: '0 6px 20px rgba(239,68,68,0.45)', transform: 'translateY(-1px)' },
              transition: 'all 0.2s',
            }}
          >
            Fermer
          </Button>
        </Box>
      </Dialog>

      {/* absence dialog intentionally removed — see /dashboard/enseignant/absences */}
      {false && <Dialog open={false} onClose={() => {}} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '12px', background: `${COLORS.warning}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EventNote sx={{ color: COLORS.warning, fontSize: 22 }} />
              </Box>
              <Typography sx={{ fontWeight: 800, color: COLORS.primary, fontSize: '1.05rem' }}>
                Gestion des absences
              </Typography>
            </Box>
            <IconButton onClick={() => setAbsenceDialogOpen(false)} size="small"
              sx={{ color: '#6B7280', '&:hover': { background: '#F3F4F6' } }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
          <Tabs value={absenceTab} onChange={(_, v) => setAbsenceTab(v)}
            sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.88rem' },
              '& .Mui-selected': { color: COLORS.warning },
              '& .MuiTabs-indicator': { background: COLORS.warning } }}>
            <Tab icon={<EventNote sx={{ fontSize: 16 }} />} iconPosition="start" label="Marquer une absence" />
            <Tab icon={<Groups sx={{ fontSize: 16 }} />} iconPosition="start" label="Mes classes" />
          </Tabs>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 2.5 }}>
          {/* ── Onglet 1 : Marquer absence individuelle ── */}
          {absenceTab === 0 && <>
            {/* Recherche étudiant */}
            <Autocomplete
              options={allStudents}
              loading={allStudentsLoading}
              getOptionLabel={s => `${s.nom} ${s.prenom} — ${s.numero_etudiant}`}
              groupBy={s => s.nom_specialite}
              value={selectedStudent}
              onChange={(_, v) => { setSelectedStudent(v); setMarkResult(null); }}
              isOptionEqualToValue={(o, v) => o.id_etudiant === v?.id_etudiant}
              renderInput={(params) => (
                <TextField {...params} label="Rechercher un étudiant" size="small" fullWidth
                  placeholder="Tapez le nom, prénom ou numéro..."
                  InputProps={{ ...params.InputProps, startAdornment: <PersonSearch sx={{ color: '#9CA3AF', mr: 0.5, fontSize: 20 }} /> }} />
              )}
              renderOption={(props, s) => (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700, background: '#EFF6FF', color: COLORS.primary, flexShrink: 0 }}>
                    {s.nom[0]}{s.prenom[0]}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: COLORS.primary }}>{s.nom} {s.prenom}</Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#6B7280' }}>{s.numero_etudiant} · {s.nom_specialite}</Typography>
                  </Box>
                </Box>
              )}
              sx={{ mb: 3 }}
            />

            {!selectedStudent && (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>🔍</Typography>
                <Typography color="text.secondary" sx={{ fontWeight: 600 }}>Sélectionnez un étudiant pour marquer son absence</Typography>
              </Box>
            )}

            {selectedStudent && (
              <>
                {/* Étudiant sélectionné */}
                <Box sx={{ mb: 2.5, p: 2, borderRadius: 2, background: '#EFF6FF', border: '1px solid #BFDBFE',
                  display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ background: '#DBEAFE', color: COLORS.primary, fontWeight: 800, width: 44, height: 44, fontSize: '0.9rem' }}>
                    {selectedStudent.nom[0]}{selectedStudent.prenom[0]}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: COLORS.primary }}>
                      {selectedStudent.nom} {selectedStudent.prenom}
                    </Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: '#4B5563' }}>
                      {selectedStudent.numero_etudiant} · {selectedStudent.nom_specialite}
                    </Typography>
                  </Box>
                </Box>

                {/* Champs date / type / semestre / bouton */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" label="Date" type="date"
                      value={singleForm.date}
                      onChange={e => { setSingleForm(p => ({ ...p, date: e.target.value })); setMarkResult(null); }}
                      InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField fullWidth select size="small" label="Type de séance"
                      value={singleForm.type_seance}
                      onChange={e => { setSingleForm(p => ({ ...p, type_seance: e.target.value })); setMarkResult(null); }}>
                      {['CM', 'TD', 'TP', 'Examen'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField fullWidth select size="small" label="Semestre"
                      value={singleForm.semestre}
                      onChange={e => setSingleForm(p => ({ ...p, semestre: e.target.value }))}>
                      <MenuItem value="">—</MenuItem>
                      {[1, 2, 3, 4, 5, 6].map(s => <MenuItem key={s} value={s}>S{s}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Button fullWidth variant="contained" onClick={handleMarquerAbsence}
                      disabled={markingLoading || !singleForm.date}
                      sx={{ height: 40, borderRadius: '10px', textTransform: 'none', fontWeight: 700,
                        background: COLORS.warning, '&:hover': { background: '#D97706' } }}>
                      {markingLoading ? <CircularProgress size={18} color="inherit" /> : 'Marquer'}
                    </Button>
                  </Grid>
                </Grid>

                {/* Résultat */}
                {markResult && (
                  <Alert
                    severity={markResult.action === 'added' ? 'warning' : 'success'}
                    sx={{ borderRadius: 2, fontWeight: 600 }}
                    onClose={() => setMarkResult(null)}>
                    {markResult.action === 'added'
                      ? `${selectedStudent.nom} ${selectedStudent.prenom} marqué(e) absent(e) — ${singleForm.type_seance} du ${new Date(singleForm.date + 'T12:00:00').toLocaleDateString('fr-FR')}`
                      : `Absence supprimée pour ${selectedStudent.nom} ${selectedStudent.prenom}`
                    }
                  </Alert>
                )}
              </>
            )}
          </> }

          {/* ── Onglet 2 : Historique ── */}
          {absenceTab === 1 && <>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-end' }}>
              <TextField select size="small" label="Spécialité" sx={{ minWidth: 260 }}
                value={historiqueSpecialite}
                onChange={e => { setHistoriqueSpecialite(e.target.value); loadHistorique(e.target.value); }}>
                <MenuItem value="">-- Choisir --</MenuItem>
                {matieres.map(m => <MenuItem key={m.id_specialite} value={m.id_specialite}>{m.nom_specialite}</MenuItem>)}
              </TextField>
              {historiqueLoading && <CircularProgress size={22} />}
            </Box>

            {!historiqueSpecialite && (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '2rem', mb: 1 }}>📋</Typography>
                <Typography color="text.secondary">Sélectionnez une spécialité pour voir l'historique</Typography>
              </Box>
            )}

            {historiqueSpecialite && !historiqueLoading && historique.length === 0 && (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '2rem', mb: 1 }}>✅</Typography>
                <Typography color="text.secondary">Aucune absence enregistrée pour cette spécialité</Typography>
              </Box>
            )}

            {historique.length > 0 && (
              <Box sx={{ maxHeight: 440, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 2 }}>
                {historique.map((s, i) => {
                  const isExpanded = expandedStudent === s.id_etudiant;
                  const absColor = s.total_absences === 0 ? '#065F46' : s.total_absences <= 2 ? '#92400E' : '#991B1B';
                  const absBg = s.total_absences === 0 ? '#D1FAE5' : s.total_absences <= 2 ? '#FEF3C7' : '#FEE2E2';
                  return (
                    <Box key={s.id_etudiant}>
                      <Box onClick={() => setExpandedStudent(isExpanded ? null : s.id_etudiant)}
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          px: 2, py: 1.5, cursor: 'pointer',
                          background: i % 2 === 0 ? '#FAFAFA' : '#fff',
                          borderBottom: '1px solid #F3F4F6',
                          '&:hover': { background: '#EFF6FF' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 34, height: 34, fontSize: '0.8rem', fontWeight: 700,
                            background: '#EFF6FF', color: COLORS.secondary }}>
                            {s.nom[0]}{s.prenom[0]}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: COLORS.primary }}>
                              {s.nom} {s.prenom}
                            </Typography>
                            <Typography sx={{ fontSize: '0.74rem', color: '#6B7280' }}>{s.numero_etudiant}</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Badge badgeContent={s.total_absences} color="error" showZero
                            sx={{ '& .MuiBadge-badge': { fontWeight: 700 } }}>
                            <Chip label={`${s.total_absences} absence${s.total_absences > 1 ? 's' : ''}`}
                              size="small" sx={{ fontWeight: 700, fontSize: '0.75rem', background: absBg, color: absColor }} />
                          </Badge>
                          {isExpanded ? <ExpandLess sx={{ color: '#9CA3AF' }} /> : <ExpandMore sx={{ color: '#9CA3AF' }} />}
                        </Box>
                      </Box>
                      <Collapse in={isExpanded}>
                        <Box sx={{ px: 3, py: 1.5, background: '#F8FAFF', borderBottom: '1px solid #E5E7EB' }}>
                          {s.absences.length === 0 ? (
                            <Typography sx={{ fontSize: '0.82rem', color: '#6B7280', fontStyle: 'italic' }}>
                              Aucune absence enregistrée
                            </Typography>
                          ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                              {s.absences.map((a, ai) => (
                                <Box key={ai} sx={{ display: 'flex', alignItems: 'center', gap: 1,
                                  px: 1.5, py: 0.8, borderRadius: '10px',
                                  background: a.justifiee ? '#D1FAE5' : '#FEE2E2',
                                  border: `1px solid ${a.justifiee ? '#A7F3D0' : '#FECACA'}` }}>
                                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, minWidth: 60,
                                    color: a.justifiee ? '#065F46' : '#991B1B' }}>
                                    {new Date(a.date_absence).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                  </Typography>
                                  <Chip label={a.type_seance} size="small"
                                    sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700,
                                      background: 'rgba(0,0,0,0.08)', color: 'inherit' }} />
                                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, flex: 1,
                                    color: a.justifiee ? '#065F46' : '#991B1B' }}>
                                    {a.justifiee ? '✓ Justifiée' : '✗ Non justifiée'}
                                  </Typography>
                                  <Tooltip title={a.justifiee ? 'Annuler la justification' : 'Marquer comme justifiée'}>
                                    <Button size="small" variant="outlined"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          await api.patch(`/enseignant/dashboard/absences/${a.id_absence}/justifier`, { justifiee: !a.justifiee });
                                          setHistorique(prev => prev.map(st => st.id_etudiant === s.id_etudiant
                                            ? { ...st, absences: st.absences.map((ab, idx) => idx === ai ? { ...ab, justifiee: !ab.justifiee } : ab) }
                                            : st
                                          ));
                                        } catch (err) { console.error(err); }
                                      }}
                                      sx={{
                                        borderRadius: '8px', textTransform: 'none', fontWeight: 700,
                                        fontSize: '0.72rem', py: 0.3, px: 1, minWidth: 'unset',
                                        borderColor: a.justifiee ? '#6B7280' : '#065F46',
                                        color: a.justifiee ? '#6B7280' : '#065F46',
                                        '&:hover': { background: a.justifiee ? '#F3F4F6' : '#D1FAE5', borderColor: a.justifiee ? '#4B5563' : '#047857' },
                                      }}>
                                      {a.justifiee ? 'Annuler' : 'Justifier'}
                                    </Button>
                                  </Tooltip>
                                  <Tooltip title="Supprimer cette absence">
                                    <IconButton size="small"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          await api.delete(`/enseignant/dashboard/absences/${a.id_absence}`);
                                          setHistorique(prev => prev.map(st => st.id_etudiant === s.id_etudiant
                                            ? { ...st, absences: st.absences.filter((_, idx) => idx !== ai), total_absences: st.total_absences - 1 }
                                            : st
                                          ));
                                        } catch (err) { console.error(err); }
                                      }}
                                      sx={{ color: '#D1D5DB', '&:hover': { color: COLORS.danger, background: '#FEE2E2' }, borderRadius: '8px' }}>
                                      <DeleteOutline sx={{ fontSize: 16 }} />
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
          </> }
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button onClick={() => setAbsenceDialogOpen(false)}
            sx={{ borderRadius: '10px', textTransform: 'none', color: '#6B7280' }}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>}

    </Box>
  );
};

export default EnseignantDashboard;