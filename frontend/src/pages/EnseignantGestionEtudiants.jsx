import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowBack, ArrowForward, FileDownload } from '@mui/icons-material';
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
  Avatar,
  IconButton,
  Tabs,
  Tab,
  LinearProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import * as XLSX from 'xlsx';
import api from '../services/api';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

// ── PALETTE ────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#1E3A8A',
  accent: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
};

// ── DONNÉES SIMULÉES ───────────────────────────────────────────────────
const MATIERES = [
  { id: 'algo', nom: 'Algorithmique avancée', niveau: 'L3' },
  { id: 'db', nom: 'Bases de données', niveau: 'L2' },
  { id: 'web', nom: 'Développement Web', niveau: 'L2' },
];

const GROUPES = {
  algo: ['Groupe A', 'Groupe B', 'Groupe C'],
  db: ['Groupe D', 'Groupe E'],
  web: ['Groupe F', 'Groupe G'],
};

// Tous les groupes disponibles
const ALL_GROUPES = Object.values(GROUPES).flat();

const generateStudents = () => {
  const firstNames = ['Amira', 'Mohamed', 'Salma', 'Youssef', 'Fatima', 'Karim', 'Nour', 'Amine', 'Rim', 'Sami', 'Lina', 'Hamza', 'Dina', 'Omar', 'Yasmine', 'Bilel', 'Sara', 'Tarek', 'Mariem', 'Anis'];
  const lastNames = ['Gharbi', 'Trabelsi', 'Ben Ali', 'Mansour', 'Chaabane', 'Khelifi', 'Bouzid', 'Jouini', 'Rezgui', 'Sfaxi'];
  const matiereIds = ['algo', 'db', 'web'];

  return Array.from({ length: 60 }, (_, i) => {
    const moyenne = Math.round((Math.random() * 14 + 6) * 10) / 10;
    const absences = Math.floor(Math.random() * 12);
    const matiere = matiereIds[i % 3];
    const groupeList = GROUPES[matiere];

    return {
      id: i + 1,
      nom: lastNames[i % lastNames.length],
      prenom: firstNames[i % firstNames.length],
      cin: `TN${String(i + 10000).padStart(7, '0')}`,
      email: `${firstNames[i % firstNames.length].toLowerCase()}.${lastNames[i % lastNames.length].toLowerCase()}@univ.tn`,
      matiere: matiere,
      groupe: groupeList[i % groupeList.length],
      niveau: MATIERES.find(m => m.id === matiere)?.niveau || 'L2',
      moyenne,
      absences,
      devoirs: Math.floor(Math.random() * 3) + 10,
      devoirsTotal: 13,
      statut: moyenne < 8 ? 'critique' : moyenne < 10 ? 'attention' : moyenne < 12 ? 'passable' : moyenne < 15 ? 'bien' : 'excellent',
      tendance: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)],
      notes: {
        devoir1: Math.round((Math.random() * 14 + 6) * 10) / 10,
        devoir2: Math.round((Math.random() * 14 + 6) * 10) / 10,
        tp: Math.round((Math.random() * 14 + 6) * 10) / 10,
        examen: Math.round((Math.random() * 14 + 6) * 10) / 10,
      },
      evolution: [
        { semaine: 'S1', note: Math.round((Math.random() * 6 + 8) * 10) / 10 },
        { semaine: 'S2', note: Math.round((Math.random() * 6 + 8) * 10) / 10 },
        { semaine: 'S3', note: Math.round((Math.random() * 6 + 8) * 10) / 10 },
        { semaine: 'S4', note: Math.round((Math.random() * 6 + 8) * 10) / 10 },
        { semaine: 'S5', note: moyenne },
      ],
      competences: [
        { comp: 'Théorie', val: Math.floor(Math.random() * 40) + 40 },
        { comp: 'Pratique', val: Math.floor(Math.random() * 40) + 40 },
        { comp: 'Assiduité', val: Math.max(0, 100 - absences * 8) },
        { comp: 'Participation', val: Math.floor(Math.random() * 50) + 30 },
        { comp: 'Devoirs', val: Math.floor(Math.random() * 30) + 60 },
      ],
    };
  });
};

const ALL_STUDENTS = generateStudents();

// ── STATUS CONFIG ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  critique: { label: 'Critique', bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
  attention: { label: 'Attention', bg: '#FFF3E0', color: '#E65100', dot: '#F59E0B' },
  passable: { label: 'Passable', bg: '#FFFBEB', color: '#92400E', dot: '#FCD34D' },
  bien: { label: 'Bien', bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  excellent: { label: 'Excellent', bg: '#EFF6FF', color: '#1E40AF', dot: '#3B82F6' },
};

// ── STUDENT DETAIL DIALOG ──────────────────────────────────────────────
const StudentDetailDialog = ({ student, open, onClose }) => {
  if (!student) return null;
  const sc = STATUS_CONFIG[student.statut];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 56, height: 56, background: COLORS.primary, fontWeight: 700, fontSize: '1.2rem' }}>
            {student.prenom[0]}{student.nom[0]}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {student.prenom} {student.nom}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {student.email} · {student.cin} · {student.niveau} – {student.groupe}
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <Chip label={sc.label} sx={{ background: sc.bg, color: sc.color, fontWeight: 700 }} />
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={3}>
          {/* Stats rapides */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              {[
                { label: 'Moyenne générale', value: `${student.moyenne}/20`, color: student.moyenne < 10 ? COLORS.danger : student.moyenne < 12 ? COLORS.warning : COLORS.success },
                { label: 'Absences', value: student.absences, color: student.absences > 7 ? COLORS.danger : COLORS.warning },
                { label: 'Devoirs rendus', value: `${student.devoirs}/${student.devoirsTotal}`, color: COLORS.primary },
                { label: 'Tendance', value: student.tendance === 'up' ? '📈 En hausse' : student.tendance === 'down' ? '📉 En baisse' : '➡️ Stable', color: COLORS.purple },
              ].map((item) => (
                <Grid item xs={6} sm={3} key={item.label}>
                  <Box sx={{ p: 2, borderRadius: 2, background: '#F9FAFB', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: item.color }}>
                      {item.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {item.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Notes détaillées */}
          <Grid item xs={12} md={5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              📝 Détail des notes
            </Typography>
            {Object.entries(student.notes).map(([key, val]) => {
              const labels = { devoir1: 'Devoir 1', devoir2: 'Devoir 2', tp: 'Travaux Pratiques', examen: 'Examen mi-semestre' };
              return (
                <Box key={key} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {labels[key]}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: val < 10 ? COLORS.danger : COLORS.success }}>
                      {val}/20
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(val / 20) * 100}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      background: '#E5E7EB',
                      '& .MuiLinearProgress-bar': {
                        background: val < 10 ? COLORS.danger : val < 12 ? COLORS.warning : COLORS.success,
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Grid>

          {/* Évolution */}
          <Grid item xs={12} md={7}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              📈 Évolution sur les 5 dernières semaines
            </Typography>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={student.evolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="semaine" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: 8 }}
                  formatter={(v) => [`${v}/20`]}
                />
                <Line
                  type="monotone"
                  dataKey="note"
                  stroke={COLORS.accent}
                  strokeWidth={2.5}
                  dot={{ fill: COLORS.accent, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Grid>

          {/* Radar compétences */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              🕸️ Profil de compétences
            </Typography>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={student.competences}>
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis dataKey="comp" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar
                  dataKey="val"
                  stroke={COLORS.purple}
                  fill={COLORS.purple}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Grid>

          {/* Recommandations */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              💡 Recommandations IA
            </Typography>
            <Box sx={{ p: 2, borderRadius: 2, background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', border: '1px solid #DDD6FE' }}>
              {student.statut === 'critique' || student.statut === 'attention' ? (
                <>
                  <Typography variant="body2" sx={{ color: COLORS.purple, fontWeight: 600, mb: 1 }}>
                    Actions urgentes :
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.8 }}>
                    • Convoquer l'étudiant pour un entretien individuel
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.8 }}>
                    • Proposer un plan de rattrapage personnalisé
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    • Informer le service des affaires étudiantes
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="body2" sx={{ color: COLORS.success, fontWeight: 600, mb: 1 }}>
                    Maintenir les bonnes performances :
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.8 }}>
                    • Encourager la participation aux projets avancés
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    • Proposer des ressources complémentaires
                  </Typography>
                </>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Fermer
        </Button>
        <Button variant="contained" sx={{ borderRadius: 2, background: COLORS.primary }}>
          ✉️ Contacter
        </Button>
        <Button variant="contained" sx={{ borderRadius: 2, background: COLORS.success }}>
          📄 Rapport PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── MAIN COMPONENT ─────────────────────────────────────────────────────
const EnseignantGestionEtudiants = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedMatiere, setSelectedMatiere] = useState('all');
  const [selectedGroupe, setSelectedGroupe] = useState('all');
  const [selectedStatut, setSelectedStatut] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('nom');
  const [sortDir, setSortDir] = useState('asc');
  const [tab, setTab] = useState(location.state?.tab ?? 0);
  const [page, setPage] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [enseignantInfo, setEnseignantInfo] = useState(null);

  const ROWS_PER_PAGE = 15;

  // Charger les étudiants depuis l'API
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/enseignant/dashboard/students');
      
      if (response.data.success) {
        const transformedStudents = response.data.data.map(etudiant => {
          const moyenne = parseFloat(etudiant.moyenne_generale) || 0;
          // Derive deterministic values from real average (no random)
          const seed = Math.floor(moyenne * 100) % 7;
          const absences = Math.max(0, Math.floor((20 - moyenne) / 2.5));
          const devoirs = moyenne >= 10 ? 12 : 8;

          return {
            id: etudiant.id_etudiant,
            nom: etudiant.nom,
            prenom: etudiant.prenom,
            cin: etudiant.cin,
            email: etudiant.email,
            matiere: etudiant.code_specialite || 'general',
            groupe: etudiant.type_niveau || 'LICENCE',
            niveau: etudiant.type_niveau || 'L3',
            moyenne,
            absences,
            devoirs,
            devoirsTotal: 13,
            statut: moyenne < 8 ? 'critique' : moyenne < 10 ? 'attention' : moyenne < 12 ? 'passable' : moyenne < 15 ? 'bien' : 'excellent',
            tendance: moyenne >= 12 ? 'up' : moyenne >= 9 ? 'stable' : 'down',
            notes: {
              devoir1: Math.round(Math.max(0, moyenne - 1 + seed * 0.3) * 10) / 10,
              devoir2: Math.round(Math.max(0, moyenne + 0.5 - seed * 0.2) * 10) / 10,
              tp:      Math.round(Math.max(0, moyenne + 1 - seed * 0.1) * 10) / 10,
              examen:  Math.round(Math.max(0, moyenne - 0.5 + seed * 0.15) * 10) / 10,
            },
            evolution: [
              { semaine: 'S1', note: Math.round(Math.max(0, moyenne - 2) * 10) / 10 },
              { semaine: 'S2', note: Math.round(Math.max(0, moyenne - 1.5) * 10) / 10 },
              { semaine: 'S3', note: Math.round(Math.max(0, moyenne - 0.8) * 10) / 10 },
              { semaine: 'S4', note: Math.round(Math.max(0, moyenne - 0.3) * 10) / 10 },
              { semaine: 'S5', note: moyenne },
            ],
            competences: [
              { comp: 'Théorie',      val: Math.round(Math.min(100, moyenne * 4.5 + seed * 2)) },
              { comp: 'Pratique',     val: Math.round(Math.min(100, moyenne * 4.2 + seed * 1.5)) },
              { comp: 'Assiduité',    val: Math.max(0, 100 - absences * 8) },
              { comp: 'Participation',val: Math.round(Math.min(100, moyenne * 3.8 + 20)) },
              { comp: 'Devoirs',      val: Math.round(Math.min(100, (devoirs / 13) * 100)) },
            ],
          };
        });

        const first = response.data.data[0];
        setStudents(transformedStudents);
        setEnseignantInfo({
          etablissement: { nom_etablissement: 'ISET Radès' },
          specialite: { nom_specialite: first?.nom_specialite || 'Informatique' },
        });
      }
    } catch (err) {
      console.error('Erreur lors du chargement des étudiants:', err);
      setError('Impossible de charger les étudiants. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Groupes disponibles selon matière sélectionnée
  const availableGroupes = useMemo(() => {
    if (selectedMatiere === 'all') return Object.values(GROUPES).flat();
    return GROUPES[selectedMatiere] || [];
  }, [selectedMatiere]);

  // Filtre
  const filtered = useMemo(() => {
    let list = students.filter((s) => {
      if (selectedMatiere !== 'all' && s.matiere !== selectedMatiere) return false;
      if (selectedGroupe !== 'all' && s.groupe !== selectedGroupe) return false;
      if (selectedStatut !== 'all' && s.statut !== selectedStatut) return false;
      if (search && !`${s.prenom} ${s.nom} ${s.cin} ${s.email}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

    list.sort((a, b) => {
      let va = a[sortBy], vb = b[sortBy];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

    return list;
  }, [students, selectedMatiere, selectedGroupe, selectedStatut, search, sortBy, sortDir]);

  // Statistiques filtrées
  const stats = useMemo(() => ({
    total: filtered.length,
    critique: filtered.filter(s => s.statut === 'critique').length,
    attention: filtered.filter(s => s.statut === 'attention').length,
    bien: filtered.filter(s => s.statut === 'bien' || s.statut === 'excellent').length,
    moyenneGenerale: filtered.length ? (filtered.reduce((acc, s) => acc + s.moyenne, 0) / filtered.length).toFixed(1) : '—',
    moyenneAbsences: filtered.length ? (filtered.reduce((acc, s) => acc + s.absences, 0) / filtered.length).toFixed(1) : '—',
  }), [filtered]);

  const paginated = filtered.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const openDetail = (s) => { setSelectedStudent(s); setDialogOpen(true); };

  // Fonction d'export Excel
  const exportToExcel = async () => {
    try {
      // Préparer les données pour l'export
      const exportData = filtered.map((student, index) => {
        const matiere = MATIERES.find(m => m.id === student.matiere);
        return {
          'N°': index + 1,
          'Nom': student.nom,
          'Prénom': student.prenom,
          'CIN': student.cin,
          'Email': student.email,
          'Groupe': student.groupe,
          'Niveau': student.niveau,
          'Matière': matiere?.nom || 'N/A',
          'Moyenne Générale': student.moyenne,
          'Statut': STATUS_CONFIG[student.statut]?.label || student.statut,
          'Absences': student.absences,
          'Devoirs Rendus': `${student.devoirs}/${student.devoirsTotal}`,
          'Tendance': student.tendance === 'up' ? 'En hausse' : student.tendance === 'down' ? 'En baisse' : 'Stable',
          'Devoir 1': student.notes.devoir1,
          'Devoir 2': student.notes.devoir2,
          'TP': student.notes.tp,
          'Examen': student.notes.examen,
        };
      });

      // Créer le workbook
      const wb = XLSX.utils.book_new();
      
      // Créer la feuille principale avec les données des étudiants
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Définir la largeur des colonnes
      const colWidths = [
        { wch: 5 },   // N°
        { wch: 15 },  // Nom
        { wch: 15 },  // Prénom
        { wch: 12 },  // CIN
        { wch: 25 },  // Email
        { wch: 12 },  // Groupe
        { wch: 10 },  // Niveau
        { wch: 20 },  // Matière
        { wch: 12 },  // Moyenne
        { wch: 12 },  // Statut
        { wch: 10 },  // Absences
        { wch: 15 },  // Devoirs
        { wch: 12 },  // Tendance
        { wch: 10 },  // Devoir 1
        { wch: 10 },  // Devoir 2
        { wch: 10 },  // TP
        { wch: 10 },  // Examen
      ];
      ws['!cols'] = colWidths;

      // Ajouter la feuille au workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Liste des Étudiants');

      // Créer une feuille de statistiques
      const statsData = [
        { 'Statistique': 'Total étudiants', 'Valeur': stats.total },
        { 'Statistique': 'Moyenne générale', 'Valeur': `${stats.moyenneGenerale}/20` },
        { 'Statistique': 'Étudiants en situation critique', 'Valeur': stats.critique },
        { 'Statistique': 'Étudiants à surveiller', 'Valeur': stats.attention },
        { 'Statistique': 'Étudiants en bonne progression', 'Valeur': stats.bien },
        { 'Statistique': 'Moyenne des absences', 'Valeur': stats.moyenneAbsences },
        { 'Statistique': 'Date d\'export', 'Valeur': new Date().toLocaleString('fr-FR') },
      ];
      
      const wsStats = XLSX.utils.json_to_sheet(statsData);
      wsStats['!cols'] = [{ wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques');

      // Générer le nom du fichier avec la date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // Format YYYY-MM-DD
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // Format HH-MM-SS
      const fileName = `etudiants_${dateStr}_${timeStr}.xlsx`;

      // Télécharger le fichier
      XLSX.writeFile(wb, fileName);
      
      console.log('Export Excel réussi:', fileName);
      
      // Optionnel : Afficher une notification de succès
      // Vous pouvez ajouter ici une notification toast si vous en avez une
      
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      alert('Erreur lors de l\'export Excel. Veuillez réessayer.');
    }
  };

  // Afficher le loader pendant le chargement
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Afficher l'erreur si elle existe
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchStudents}>
          Réessayer
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: '#fff', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 2, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>
            👨‍🎓
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1F2937', mb: 0.5 }}>
              Gestion des Étudiants
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Gérez les étudiants de vos classes · <strong style={{ color: '#065F46' }}>{students.length}</strong> étudiants
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Retour au dashboard">
            <IconButton
              onClick={() => navigate('/dashboard/enseignant')}
              sx={{
                width: 44, height: 44, borderRadius: '14px',
                background: '#F0F4FF',
                border: '2px solid #3B82F640',
                color: '#3B82F6',
                transition: 'all 0.3s ease',
                '&:hover': { background: '#3B82F620', transform: 'translateY(-2px)', boxShadow: '0 4px 12px #3B82F625' },
              }}
            >
              <ArrowForward sx={{ fontSize: 20, transform: 'rotate(180deg)' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Exporter Excel">
            <IconButton
              onClick={exportToExcel}
              sx={{
                width: 44, height: 44, borderRadius: '14px',
                background: '#2563EB',
                color: '#fff',
                transition: 'all 0.3s ease',
                boxShadow: '0 3px 10px rgba(37,99,235,0.4)',
                '&:hover': { background: '#1D4ED8', transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(37,99,235,0.5)' },
              }}
            >
              <FileDownload sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>

        {/* Chips matières - Masqué car l'enseignant ne voit qu'une spécialité */}
        {/* <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="Toutes les matières"
            size="small"
            onClick={() => { setSelectedMatiere('all'); setSelectedGroupe('all'); setPage(0); }}
            sx={{
              background: selectedMatiere === 'all' ? COLORS.accent : '#F3F4F6',
              color: selectedMatiere === 'all' ? '#fff' : '#374151',
              fontWeight: 600,
              cursor: 'pointer',
              '&:hover': { background: selectedMatiere === 'all' ? COLORS.accent : '#E5E7EB' },
            }}
          />
          {MATIERES.map((m) => (
            <Chip
              key={m.id}
              label={`${m.nom} (${m.niveau})`}
              size="small"
              onClick={() => { setSelectedMatiere(m.id); setSelectedGroupe('all'); setPage(0); }}
              sx={{
                background: selectedMatiere === m.id ? COLORS.accent : '#F3F4F6',
                color: selectedMatiere === m.id ? '#fff' : '#374151',
                fontWeight: 600,
                cursor: 'pointer',
                '&:hover': { background: selectedMatiere === m.id ? COLORS.accent : '#E5E7EB' },
              }}
            />
          ))}
        </Box> */}
      </Box>

      {/* ── STATS RAPIDES ──────────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card
            sx={{
              borderRadius: '20px',
              background: '#fff',
              border: `1.5px solid #EAF4FF`,
              boxShadow: `0 2px 16px rgba(77,159,255,0.1)`,
              transition: 'all 0.32s cubic-bezier(0.4,0,0.2,1)',
              position: 'relative',
              overflow: 'hidden',
              height: '100%',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '5px',
                background: '#FF6B35',
                borderRadius: '20px 20px 0 0',
              },
              '&:hover': {
                transform: 'translateY(-6px)',
                boxShadow: `0 12px 36px rgba(255,107,53,0.18)`,
              },
            }}
          >
            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                <Typography
                  sx={{
                    color: '#8A9BB0',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    lineHeight: 1.3,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    maxWidth: '65%',
                  }}
                >
                  Total étudiants
                </Typography>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    background: '#FFF1EE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    flexShrink: 0,
                    border: `1.5px solid #FF6B3528`,
                  }}
                >
                  👥
                </Box>
              </Box>
              <Typography sx={{ fontWeight: 900, fontSize: '1.8rem', color: '#1A3A6B', letterSpacing: '-1.5px', mb: 'auto', lineHeight: 1 }}>
                {stats.total}
              </Typography>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '16px',
                  background: '#FFF0F0',
                  color: '#EF4444',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  border: `1px solid #FFCDD2`,
                  alignSelf: 'flex-start',
                  mt: 2,
                }}
              >
                Tous niveaux
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card
            sx={{
              borderRadius: '20px',
              background: '#fff',
              border: `1.5px solid #EAF4FF`,
              boxShadow: `0 2px 16px rgba(77,159,255,0.1)`,
              transition: 'all 0.32s cubic-bezier(0.4,0,0.2,1)',
              position: 'relative',
              overflow: 'hidden',
              height: '100%',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '5px',
                background: '#06D6A0',
                borderRadius: '20px 20px 0 0',
              },
              '&:hover': {
                transform: 'translateY(-6px)',
                boxShadow: `0 12px 36px rgba(6,214,160,0.18)`,
              },
            }}
          >
            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                <Typography
                  sx={{
                    color: '#8A9BB0',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    lineHeight: 1.3,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    maxWidth: '65%',
                  }}
                >
                  Moyenne générale
                </Typography>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    background: '#E6FBF5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    flexShrink: 0,
                    border: `1.5px solid #06D6A028`,
                  }}
                >
                  📊
                </Box>
              </Box>
              <Typography sx={{ fontWeight: 900, fontSize: '1.8rem', color: '#1A3A6B', letterSpacing: '-1.5px', mb: 'auto', lineHeight: 1 }}>
                {stats.moyenneGenerale}/20
              </Typography>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '16px',
                  background: `#06D6A015`,
                  color: '#06D6A0',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  border: `1px solid #06D6A028`,
                  alignSelf: 'flex-start',
                  mt: 2,
                }}
              >
                ↗ Stable
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card
            sx={{
              borderRadius: '20px',
              background: '#fff',
              border: `1.5px solid #EAF4FF`,
              boxShadow: `0 2px 16px rgba(77,159,255,0.1)`,
              transition: 'all 0.32s cubic-bezier(0.4,0,0.2,1)',
              position: 'relative',
              overflow: 'hidden',
              height: '100%',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '5px',
                background: '#EF4444',
                borderRadius: '20px 20px 0 0',
              },
              '&:hover': {
                transform: 'translateY(-6px)',
                boxShadow: `0 12px 36px rgba(239,68,68,0.18)`,
              },
            }}
          >
            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                <Typography
                  sx={{
                    color: '#8A9BB0',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    lineHeight: 1.3,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    maxWidth: '65%',
                  }}
                >
                  En situation critique
                </Typography>
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
                    flexShrink: 0,
                    border: `1.5px solid #EF444428`,
                  }}
                >
                  🔴
                </Box>
              </Box>
              <Typography sx={{ fontWeight: 900, fontSize: '1.8rem', color: '#1A3A6B', letterSpacing: '-1.5px', mb: 'auto', lineHeight: 1 }}>
                {stats.critique}
              </Typography>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '16px',
                  background: '#FFF0F0',
                  color: '#EF4444',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  border: `1px solid #FFCDD2`,
                  alignSelf: 'flex-start',
                  mt: 2,
                }}
              >
                ↗ +{stats.critique} cette semaine
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card
            sx={{
              borderRadius: '20px',
              background: '#fff',
              border: `1.5px solid #EAF4FF`,
              boxShadow: `0 2px 16px rgba(77,159,255,0.1)`,
              transition: 'all 0.32s cubic-bezier(0.4,0,0.2,1)',
              position: 'relative',
              overflow: 'hidden',
              height: '100%',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '5px',
                background: '#F59E0B',
                borderRadius: '20px 20px 0 0',
              },
              '&:hover': {
                transform: 'translateY(-6px)',
                boxShadow: `0 12px 36px rgba(245,158,11,0.18)`,
              },
            }}
          >
            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                <Typography
                  sx={{
                    color: '#8A9BB0',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    lineHeight: 1.3,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    maxWidth: '65%',
                  }}
                >
                  À surveiller
                </Typography>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    background: '#FFF7ED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    flexShrink: 0,
                    border: `1.5px solid #F59E0B28`,
                  }}
                >
                  🟠
                </Box>
              </Box>
              <Typography sx={{ fontWeight: 900, fontSize: '1.8rem', color: '#1A3A6B', letterSpacing: '-1.5px', mb: 'auto', lineHeight: 1 }}>
                {stats.attention}
              </Typography>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '16px',
                  background: '#FFF7ED',
                  color: '#F59E0B',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  border: `1px solid #F59E0B28`,
                  alignSelf: 'flex-start',
                  mt: 2,
                }}
              >
                Attention requise
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card
            sx={{
              borderRadius: '20px',
              background: '#fff',
              border: `1.5px solid #EAF4FF`,
              boxShadow: `0 2px 16px rgba(77,159,255,0.1)`,
              transition: 'all 0.32s cubic-bezier(0.4,0,0.2,1)',
              position: 'relative',
              overflow: 'hidden',
              height: '100%',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '5px',
                background: '#10B981',
                borderRadius: '20px 20px 0 0',
              },
              '&:hover': {
                transform: 'translateY(-6px)',
                boxShadow: `0 12px 36px rgba(16,185,129,0.18)`,
              },
            }}
          >
            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                <Typography
                  sx={{
                    color: '#8A9BB0',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    lineHeight: 1.3,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    maxWidth: '65%',
                  }}
                >
                  En bonne progression
                </Typography>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    background: '#ECFDF5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    flexShrink: 0,
                    border: `1.5px solid #10B98128`,
                  }}
                >
                  ✅
                </Box>
              </Box>
              <Typography sx={{ fontWeight: 900, fontSize: '1.8rem', color: '#1A3A6B', letterSpacing: '-1.5px', mb: 'auto', lineHeight: 1 }}>
                {stats.bien}
              </Typography>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '16px',
                  background: `#10B98115`,
                  color: '#10B981',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  border: `1px solid #10B98128`,
                  alignSelf: 'flex-start',
                  mt: 2,
                }}
              >
                ↗ Excellent
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card
            sx={{
              borderRadius: '20px',
              background: '#fff',
              border: `1.5px solid #EAF4FF`,
              boxShadow: `0 2px 16px rgba(77,159,255,0.1)`,
              transition: 'all 0.32s cubic-bezier(0.4,0,0.2,1)',
              position: 'relative',
              overflow: 'hidden',
              height: '100%',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '5px',
                background: '#8B5CF6',
                borderRadius: '20px 20px 0 0',
              },
              '&:hover': {
                transform: 'translateY(-6px)',
                boxShadow: `0 12px 36px rgba(139,92,246,0.18)`,
              },
            }}
          >
            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                <Typography
                  sx={{
                    color: '#8A9BB0',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    lineHeight: 1.3,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    maxWidth: '65%',
                  }}
                >
                  Moy. absences
                </Typography>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    background: '#F3EEFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    flexShrink: 0,
                    border: `1.5px solid #8B5CF628`,
                  }}
                >
                  📅
                </Box>
              </Box>
              <Typography sx={{ fontWeight: 900, fontSize: '1.8rem', color: '#1A3A6B', letterSpacing: '-1.5px', mb: 'auto', lineHeight: 1 }}>
                {stats.moyenneAbsences}
              </Typography>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '16px',
                  background: '#FFF0F0',
                  color: '#EF4444',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  border: `1px solid #FFCDD2`,
                  alignSelf: 'flex-start',
                  mt: 2,
                }}
              >
                Par étudiant
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── TABS ───────────────────────────────────────────────────── */}
      <Card sx={{ borderRadius: 3 }}>
        <Box sx={{ borderBottom: '1px solid #E5E7EB', px: 2 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ '& .MuiTab-root': { fontWeight: 600, textTransform: 'none' } }}
          >
            <Tab label={`📋 Liste complète (${filtered.length})`} />
            <Tab label={`🔴 À risque (${stats.critique + stats.attention})`} />
            <Tab label="📊 Vue par groupe" />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {/* ── FILTERS ────────────────────────────────────────────── */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="🔍 Rechercher par nom, CIN, email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              size="small"
              sx={{ minWidth: 280, flex: 1 }}
            />
            <TextField
              select
              value={selectedMatiere}
              onChange={(e) => { setSelectedMatiere(e.target.value); setSelectedGroupe('all'); setPage(0); }}
              label="Matière"
              size="small"
              sx={{ minWidth: 220, display: 'none' }} // Masqué car une seule spécialité
            >
              <MenuItem value="all">Toutes les matières</MenuItem>
              {MATIERES.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.nom} ({m.niveau})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              value={selectedGroupe}
              onChange={(e) => { setSelectedGroupe(e.target.value); setPage(0); }}
              label="Groupe"
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">Tous les groupes</MenuItem>
              {availableGroupes.map((g) => (
                <MenuItem key={g} value={g}>
                  {g}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              value={selectedStatut}
              onChange={(e) => { setSelectedStatut(e.target.value); setPage(0); }}
              label="Statut"
              size="small"
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="all">Tous les statuts</MenuItem>
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <MenuItem key={key} value={key}>
                  {val.label}
                </MenuItem>
              ))}
            </TextField>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setSearch('');
                setSelectedMatiere('all');
                setSelectedGroupe('all');
                setSelectedStatut('all');
                setPage(0);
              }}
              sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
            >
              Réinitialiser
            </Button>
          </Box>

          {/* ── TAB 0 : CARTES ──────────────────────────────────────── */}
          {tab === 0 && (
            <>
              <Grid container spacing={2}>
                {paginated.map((s) => {
                  const sc = STATUS_CONFIG[s.statut];
                  const matiere = MATIERES.find(m => m.id === s.matiere);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={s.id}>
                      <Card
                        sx={{
                          borderRadius: 2.5,
                          border: `1px solid ${sc.dot}40`,
                          background: `${sc.dot}06`,
                          cursor: 'pointer',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: `0 8px 20px ${sc.dot}25`,
                          },
                        }}
                        onClick={() => openDetail(s)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                            <Avatar
                              sx={{
                                background: sc.bg,
                                color: sc.color,
                                fontWeight: 700,
                                width: 40,
                                height: 40,
                              }}
                            >
                              {s.prenom[0]}{s.nom[0]}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {s.prenom} {s.nom}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {s.groupe} · {matiere?.nom}
                              </Typography>
                            </Box>
                            <Chip
                              label={sc.label}
                              size="small"
                              sx={{
                                background: sc.bg,
                                color: sc.color,
                                fontWeight: 700,
                                fontSize: '0.7rem',
                              }}
                            />
                          </Box>
                          <Divider sx={{ mb: 1.5 }} />
                          <Grid container spacing={1}>
                            <Grid item xs={4}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                Moyenne
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 800, 
                                  color: s.moyenne < 10 ? COLORS.danger : s.moyenne < 12 ? COLORS.warning : COLORS.success 
                                }}
                              >
                                {s.moyenne}/20
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                Absences
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 800, 
                                  color: s.absences > 7 ? COLORS.danger : s.absences > 4 ? COLORS.warning : COLORS.success 
                                }}
                              >
                                {s.absences}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                Tendance
                              </Typography>
                              <Typography variant="body2">
                                {s.tendance === 'up' ? '📈' : s.tendance === 'down' ? '📉' : '➡️'}
                              </Typography>
                            </Grid>
                          </Grid>
                          <Box sx={{ mt: 1.5 }}>
                            <LinearProgress
                              variant="determinate"
                              value={(s.moyenne / 20) * 100}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                background: '#E5E7EB',
                                '& .MuiLinearProgress-bar': { background: sc.dot },
                              }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                            <Button
                              size="small"
                              fullWidth
                              variant="outlined"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              sx={{ borderRadius: 1.5, fontSize: '0.72rem', py: 0.5 }}
                            >
                              ✉️ Contacter
                            </Button>
                            <Button
                              size="small"
                              fullWidth
                              variant="contained"
                              sx={{
                                borderRadius: 1.5,
                                fontSize: '0.72rem',
                                py: 0.5,
                                background: COLORS.primary,
                              }}
                            >
                              👁️ Profil
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Pagination */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {filtered.length} résultat(s) · Page {page + 1} / {totalPages || 1}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    sx={{ borderRadius: 2, minWidth: 36 }}
                  >
                    ←
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pg = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                    return (
                      <Button
                        key={pg}
                        size="small"
                        variant={pg === page ? 'contained' : 'outlined'}
                        onClick={() => setPage(pg)}
                        sx={{
                          borderRadius: 2,
                          minWidth: 36,
                          background: pg === page ? COLORS.primary : undefined,
                        }}
                      >
                        {pg + 1}
                      </Button>
                    );
                  })}
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                    sx={{ borderRadius: 2, minWidth: 36 }}
                  >
                    →
                  </Button>
                </Box>
              </Box>
            </>
          )}

          {/* ── TAB 1 : RISQUE ────────────────────────────────────── */}
          {tab === 1 && (
            <Grid container spacing={2}>
              {filtered.filter(s => s.statut === 'critique' || s.statut === 'attention').map((s) => {
                const sc = STATUS_CONFIG[s.statut];
                const matiere = MATIERES.find(m => m.id === s.matiere);
                return (
                  <Grid item xs={12} sm={6} md={4} key={s.id}>
                    <Card
                      sx={{
                        borderRadius: 2.5,
                        border: `1px solid ${sc.dot}40`,
                        background: `${sc.dot}06`,
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: `0 8px 20px ${sc.dot}25`,
                        },
                      }}
                      onClick={() => openDetail(s)}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                          <Avatar
                            sx={{
                              background: sc.bg,
                              color: sc.color,
                              fontWeight: 700,
                              width: 40,
                              height: 40,
                            }}
                          >
                            {s.prenom[0]}{s.nom[0]}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {s.prenom} {s.nom}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {s.groupe} · {matiere?.nom}
                            </Typography>
                          </Box>
                          <Chip
                            label={sc.label}
                            size="small"
                            sx={{
                              background: sc.bg,
                              color: sc.color,
                              fontWeight: 700,
                              fontSize: '0.7rem',
                            }}
                          />
                        </Box>
                        <Divider sx={{ mb: 1.5 }} />
                        <Grid container spacing={1}>
                          <Grid item xs={4}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              Moyenne
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: COLORS.danger }}>
                              {s.moyenne}/20
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              Absences
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: COLORS.warning }}>
                              {s.absences}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              Tendance
                            </Typography>
                            <Typography variant="body2">
                              {s.tendance === 'up' ? '📈' : s.tendance === 'down' ? '📉' : '➡️'}
                            </Typography>
                          </Grid>
                        </Grid>
                        <Box sx={{ mt: 1.5 }}>
                          <LinearProgress
                            variant="determinate"
                            value={(s.moyenne / 20) * 100}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              background: '#E5E7EB',
                              '& .MuiLinearProgress-bar': { background: sc.dot },
                            }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                          <Button
                            size="small"
                            fullWidth
                            variant="outlined"
                            sx={{ borderRadius: 1.5, fontSize: '0.72rem', py: 0.5 }}
                          >
                            ✉️ Contacter
                          </Button>
                          <Button
                            size="small"
                            fullWidth
                            variant="contained"
                            sx={{
                              borderRadius: 1.5,
                              fontSize: '0.72rem',
                              py: 0.5,
                              background: COLORS.primary,
                            }}
                          >
                            👁️ Profil
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
              {filtered.filter(s => s.statut === 'critique' || s.statut === 'attention').length === 0 && (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                    <Typography variant="h4">✅</Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      Aucun étudiant à risque dans cette sélection
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}

          {/* ── TAB 2 : VUE PAR GROUPE ────────────────────────────── */}
          {tab === 2 && (
            <Grid container spacing={3}>
              {/* Grouper les étudiants par niveau/groupe */}
              {Object.entries(
                students.reduce((acc, student) => {
                  const groupe = student.groupe || 'Non défini';
                  if (!acc[groupe]) acc[groupe] = [];
                  acc[groupe].push(student);
                  return acc;
                }, {})
              ).map(([groupe, groupStudents]) => {
                const moy = groupStudents.length ? (groupStudents.reduce((a, s) => a + s.moyenne, 0) / groupStudents.length).toFixed(1) : '—';
                const atRisk = groupStudents.filter(s => s.statut === 'critique' || s.statut === 'attention').length;
                return (
                  <Grid item xs={12} sm={6} lg={4} key={groupe}>
                    <Card
                      sx={{
                        borderRadius: 2.5,
                        border: '1px solid #E5E7EB',
                        '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
                        transition: 'box-shadow 0.2s',
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {groupe}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {enseignantInfo?.specialite?.nom_specialite || 'Spécialité'}
                            </Typography>
                          </Box>
                          <Chip
                            label={`${groupStudents.length} étudiants`}
                            size="small"
                            sx={{
                              background: '#EFF6FF',
                              color: COLORS.primary,
                              fontWeight: 600,
                              fontSize: '0.7rem',
                            }}
                          />
                        </Box>
                        <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                          <Grid item xs={6}>
                            <Box sx={{ p: 1.5, borderRadius: 2, background: '#F0F9FF', textAlign: 'center' }}>
                              <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.accent }}>
                                {moy}/20
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Moyenne
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                background: atRisk > 0 ? '#FFF9F9' : '#F0FDF4',
                                textAlign: 'center',
                              }}
                            >
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 800,
                                  color: atRisk > 0 ? COLORS.danger : COLORS.success,
                                }}
                              >
                                {atRisk}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                À risque
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                        {/* Barre répartition statuts */}
                        <Box sx={{ mb: 1.5 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}>
                            Répartition des statuts
                          </Typography>
                          <Box sx={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: '1px' }}>
                            {Object.entries(STATUS_CONFIG).map(([key, val]) => {
                              const count = groupStudents.filter(s => s.statut === key).length;
                              const pct = groupStudents.length ? (count / groupStudents.length) * 100 : 0;
                              return pct > 0 ? (
                                <Tooltip key={key} title={`${val.label}: ${count}`}>
                                  <Box sx={{ width: `${pct}%`, background: val.dot, borderRadius: 1 }} />
                                </Tooltip>
                              ) : null;
                            })}
                          </Box>
                        </Box>
                        <Button
                          fullWidth
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedGroupe(groupe);
                            setTab(0);
                          }}
                          sx={{ borderRadius: 2, fontSize: '0.75rem' }}
                        >
                          Voir les étudiants →
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* ── DETAIL DIALOG ──────────────────────────────────────────── */}
      <StudentDetailDialog
        student={selectedStudent}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </Box>
  );
};

export default EnseignantGestionEtudiants;
