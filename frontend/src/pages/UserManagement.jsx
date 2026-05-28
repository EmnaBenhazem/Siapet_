import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TablePagination,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Grid, Chip, IconButton, InputAdornment, CircularProgress,
  Button, Dialog, DialogContent, DialogActions, Tooltip, Alert, Snackbar,
  Avatar, Divider, keyframes,
} from '@mui/material';
import {
  Search, FilterList, Visibility, Block, CheckCircle,
  Refresh, Clear, Close, Email, Phone, LocationOn,
  School, Business, CalendarToday, AccessTime,
  Star, CreditCard, ArrowBack, Archive, Edit, History,
  Lock, Visibility as VisibilityIcon, VisibilityOff,
} from '@mui/icons-material';
import api from '../services/api';
import { ArchiveActionDialog, ConfirmWithPasswordDialog } from '../components/Archive';

// ── PALETTE ───────────────────────────────────────
const C = {
  navy:   '#1A3A6B',
  navyD:  '#0F2549',
  blue:   '#4D9FFF',
  blueB:  '#85BFFF',
  blueL:  '#EAF4FF',
  blueD:  '#1A6FD4',
  green:  '#06D6A0',
  greenD: '#04B884',
  red:    '#EF4444',
  redL:   '#FEE2E2',
  orange: '#FF6B35',
  orangeL:'#FFF3E0',
  coral:  '#D85A30',
  purple: '#7B2CBF',
  yellow: '#FFD60A',
  slate:  '#64748B',
};

// ── KEYFRAMES ─────────────────────────────────────
const fadeUp = keyframes`
  from { opacity:0; transform:translateY(24px); }
  to   { opacity:1; transform:translateY(0); }
`;
const slideLeft = keyframes`
  from { opacity:0; transform:translateX(-20px); }
  to   { opacity:1; transform:translateX(0); }
`;
const popIn = keyframes`
  from { opacity:0; transform:scale(0.88) translateY(12px); }
  to   { opacity:1; transform:scale(1) translateY(0); }
`;
const blinkDot = keyframes`
  0%,100% { opacity:1; } 50% { opacity:0.25; }
`;
const gradMove = keyframes`
  0%,100% { background-position:0% 50%; }
  50%      { background-position:100% 50%; }
`;
const shimmerLine = keyframes`
  0%   { background-position:-200% center; }
  100% { background-position: 200% center; }
`;
const spinAnim = keyframes`
  from { transform:rotate(0deg); }
  to   { transform:rotate(360deg); }
`;
const floatEmoji = keyframes`
  0%,100% { transform:translateY(0) rotate(0deg); }
  50%      { transform:translateY(-5px) rotate(6deg); }
`;
const glowGreen = keyframes`
  0%,100% { box-shadow:0 4px 14px rgba(6,214,160,0.25); }
  50%      { box-shadow:0 6px 24px rgba(6,214,160,0.50), 0 0 0 3px rgba(6,214,160,0.08); }
`;
const glowRed = keyframes`
  0%,100% { box-shadow:0 4px 14px rgba(239,68,68,0.22); }
  50%      { box-shadow:0 6px 24px rgba(239,68,68,0.45), 0 0 0 3px rgba(239,68,68,0.08); }
`;

// ── ROLE CONFIG ───────────────────────────────────
const ROLE_CFG = {
  RECTEUR:    { emoji: '👨‍💼', color: C.orange, bgColor: '#FFF4E6', label: 'Recteur'    },
  DIRECTEUR:  { emoji: '👨‍💼', color: C.purple, label: 'Directeur'  },
  ENSEIGNANT: { emoji: '👨‍🏫', color: C.blue,   label: 'Enseignant' },
  ETUDIANT:   { emoji: '👨‍🎓', color: C.green, bgColor: '#E8F8F5', label: 'Étudiant'   },
  ADMIN_MESRS:{ emoji: '👨‍💼', color: C.navy,   label: 'Admin'      },
};

const STATUS_CFG = {
  ACTIF:    { bg: `${C.green}12`,  color: C.green,  label: '● Actif',    dot: C.green  },
  INACTIF:  { bg: `${C.orange}12`, color: C.orange, label: '◐ Inactif',  dot: C.orange },
  SUSPENDU: { bg: `${C.red}10`,    color: C.red,    label: '✕ Suspendu', dot: C.red    },
};

const TYPE_TITLE = {
  recteur: 'Recteurs', directeur: 'Directeurs',
  enseignant: 'Enseignants', etudiant: 'Étudiants',
};

// ── FIELD STYLE ───────────────────────────────────
const getFieldSx = (userType) => {
  const accentColor = userType === 'directeur' ? C.purple : (userType === 'recteur' ? C.orange : (userType === 'etudiant' ? C.green : C.blue));
  return {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px', background: '#FAFCFF',
      '& fieldset': { borderColor: C.blueL, borderWidth: '1.5px' },
      '&:hover fieldset': { borderColor: `${accentColor}60` },
      '&.Mui-focused fieldset': { borderColor: accentColor, boxShadow: `0 0 0 3px ${accentColor}12` },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: accentColor },
  };
};

// ── INFO ROW (dialog) ─────────────────────────────
const InfoRow = ({ icon, label, value, accent = C.blue }) => {
  if (!value) return null;
  return (
    <Box sx={{
      display: 'flex', alignItems: 'flex-start', gap: 1.5,
      p: 1.2, borderRadius: '10px', transition: 'background 0.2s',
      '&:hover': { background: `${accent}08` },
    }}>
      <Box sx={{ width: 30, height: 30, borderRadius: '8px', background: `${accent}12`, border: `1px solid ${accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.1 }}>
        {React.cloneElement(icon, { sx: { fontSize: 15, color: accent } })}
      </Box>
      <Box>
        <Typography sx={{ fontSize: '0.63rem', color: '#9BAAB8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: C.navy }}>{value}</Typography>
      </Box>
    </Box>
  );
};

// ── MAIN COMPONENT ────────────────────────────────
const UserManagement = () => {
  const { userType } = useParams();
  const navigate = useNavigate();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [total, setTotal]           = useState(0);
  const [filters, setFilters]       = useState({
    search: '', role: userType ? userType.toUpperCase() : '',
    statut: '', region: '', ville: '', etablissement: '', universite: '',
  });
  const [filterOptions, setFilterOptions] = useState({ roles: [], statuts: [], regions: [], villes: [], etablissements: [], universites: [] });
  const [selectedUser, setSelectedUser]   = useState(null);
  const [detailsOpen, setDetailsOpen]     = useState(false);
  const [hovCard, setHovCard]             = useState(null);
  const [snackbar, setSnackbar]           = useState({ open: false, message: '', severity: 'success' });
  const [archiveDlg, setArchiveDlg]       = useState({ open: false, entity: null });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser]     = useState(null);
  const [editFormData, setEditFormData]   = useState({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newUser, setNewUser]             = useState({
    nom: '', prenom: '', email: '', telephone: '',
    id_rectorat: '', id_etablissement: '',
    grade: '', specialite: '', filiere: ''
  });
  const [suspendDialog, setSuspendDialog] = useState({ open: false, user: null, password: '', showPassword: false, loading: false });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, onConfirm: null, title: '', subtitle: '', icon: null, gradient: ['#4D9FFF','#1A6FD4'], warning: '', actionLabel: '' });

  useEffect(() => { fetchFilterOptions(); }, []);
  useEffect(() => { if (userType) setFilters(p => ({ ...p, role: userType.toUpperCase() })); }, [userType]);
  useEffect(() => { fetchUsers(); }, [page, rowsPerPage, filters]);

  const fetchFilterOptions = async () => {
    try {
      const res = await api.get('/users/filter-options');
      setFilterOptions({
        roles: res.data.roles || [], statuts: res.data.statuts || [],
        regions: res.data.regions || [], villes: res.data.villes || [],
        etablissements: res.data.etablissements || [], universites: res.data.universites || [],
      });
    } catch {}
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const clean = Object.entries(filters).reduce((acc, [k, v]) => { if (v !== '' && v != null) acc[k] = typeof v === 'string' ? v.trim() : v; return acc; }, {});
      const res = await api.get('/users', { params: { page: page + 1, limit: rowsPerPage, ...clean } });
      setUsers(res.data.users || []);
      setTotal(res.data.pagination?.total || 0);
    } catch {
      setSnackbar({ open: true, message: 'Erreur lors du chargement des utilisateurs', severity: 'error' });
    } finally { setLoading(false); }
  };

  const handleToggleStatus = (user) => {
    if (user.statut === 'ACTIF') {
      // Suspension → demander le mot de passe admin
      setSuspendDialog({ open: true, user, password: '', showPassword: false, loading: false });
    } else {
      // Réactivation → pas de mot de passe requis
      activateUser(user);
    }
  };

  const activateUser = (user) => {
    setConfirmDialog({
      open: true,
      title: 'Réactiver le profil',
      subtitle: `${user.nom} ${user.prenom}`,
      icon: <CheckCircle />,
      gradient: ['#10B981', '#059669'],
      warning: "L'utilisateur retrouvera immédiatement l'accès à son compte. Confirmez avec votre mot de passe.",
      actionLabel: 'Confirmer la réactivation',
      onConfirm: async (password) => {
        await api.patch(`/users/${user.numero_utilisateur}/toggle-status`, { adminPassword: password });
        setSnackbar({ open: true, message: `${user.nom} ${user.prenom} a été réactivé avec succès`, severity: 'success' });
        if (detailsOpen) setDetailsOpen(false);
        fetchUsers();
      },
    });
  };

  const handleConfirmSuspend = async () => {
    const { user, password } = suspendDialog;
    if (!password.trim()) {
      setSnackbar({ open: true, message: 'Veuillez saisir votre mot de passe', severity: 'warning' });
      return;
    }
    setSuspendDialog(p => ({ ...p, loading: true }));
    try {
      await api.patch(`/users/${user.numero_utilisateur}/toggle-status`, { adminPassword: password });
      setSuspendDialog({ open: false, user: null, password: '', showPassword: false, loading: false });
      setSnackbar({ open: true, message: `${user.nom} ${user.prenom} a été suspendu avec succès`, severity: 'success' });
      if (detailsOpen) setDetailsOpen(false);
      fetchUsers();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Mot de passe incorrect ou erreur serveur';
      setSuspendDialog(p => ({ ...p, loading: false }));
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  const handleArchiveUser = (user) => {
    setArchiveDlg({
      open: true,
      entity: { id: user.numero_utilisateur, nom: `${user.prenom} ${user.nom}`.trim() },
    });
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFormData({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      id_rectorat: '',
      id_etablissement: '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    setConfirmDialog({
      open: true,
      title: 'Modifier les informations',
      subtitle: editingUser ? `${editingUser.nom} ${editingUser.prenom}` : '',
      icon: <Edit />,
      gradient: ['#F59E0B', '#D97706'],
      warning: 'Cette action va modifier les informations personnelles de cet utilisateur en base de données.',
      actionLabel: 'Confirmer la modification',
      onConfirm: async (password) => {
        await api.put(`/users/${editingUser.numero_utilisateur}`, { ...editFormData, adminPassword: password });
        setSnackbar({ open: true, message: 'Utilisateur modifié avec succès', severity: 'success' });
        setEditDialogOpen(false);
        fetchUsers();
      },
    });
  };

  const handleAddUser = () => {
    const userLabel = TYPE_TITLE[userType?.toLowerCase()]?.slice(0, -1) || 'utilisateur';
    setConfirmDialog({
      open: true,
      title: `Créer un ${userLabel}`,
      subtitle: `${newUser.prenom} ${newUser.nom}`.trim(),
      icon: <CheckCircle />,
      gradient: ['#1A3A6B', '#0F2549'],
      warning: `Un nouveau compte ${userLabel} sera créé. Un mot de passe temporaire sera envoyé par email.`,
      actionLabel: 'Confirmer la création',
      onConfirm: async (password) => {
        await api.post('/users', { ...newUser, type_utilisateur: userType.toUpperCase(), adminPassword: password });
        setSnackbar({ open: true, message: `${userLabel} ajouté avec succès`, severity: 'success' });
        setAddDialogOpen(false);
        setNewUser({ nom: '', prenom: '', email: '', telephone: '', id_rectorat: '', id_etablissement: '', grade: '', specialite: '', filiere: '' });
        fetchUsers();
      },
    });
  };

  const handleResetFilters = () => {
    setFilters({ search: '', role: '', statut: '', region: '', ville: '', etablissement: '', universite: '' });
    setPage(0);
  };

  const roleKey  = userType?.toLowerCase();
  const roleCfg  = ROLE_CFG[userType?.toUpperCase()] || {};
  const accentColor = roleCfg.color || C.blue;
  const fieldSx = getFieldSx(userType);

  return (
    <Box>

      {/* ══ HEADER ════════════════════════════════ */}
      <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: '#fff', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: 2,
            background: userType === 'directeur' ? '#F3E8FF' : (userType === 'recteur' ? '#FFF4E6' : (userType === 'etudiant' ? '#E8F8F5' : (userType === 'enseignant' ? '#DBEAFE' : '#F0F4FF'))),
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
          }}>
            {userType ? (roleCfg.emoji || '👥') : '👥'}
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1F2937', mb: 0.5 }}>
              {userType ? `Gestion des ${TYPE_TITLE[roleKey] || 'Utilisateurs'}` : 'Tous les utilisateurs'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              {userType === 'recteur'   && `Gérez les comptes recteurs des universités${total > 0 ? ` — ${total} recteurs` : ''}`}
              {userType === 'directeur' && `Gérez les comptes directeurs des établissements${total > 0 ? ` — ${total} directeurs` : ''}`}
              {userType === 'enseignant'&& `Gérez les comptes enseignants${total > 0 ? ` — ${total} enseignants` : ''}`}
              {userType === 'etudiant'  && `Gérez les comptes étudiants${total > 0 ? ` — ${total} étudiants` : ''}`}
              {!userType && (total > 0 ? `${total} utilisateur${total > 1 ? 's' : ''} trouvé${total > 1 ? 's' : ''} — gérez et filtrez les comptes` : 'Gérez et filtrez tous les comptes utilisateurs')}
            </Typography>
          </Box>
        </Box>

        {userType && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={`Ajouter un ${TYPE_TITLE[roleKey]?.slice(0, -1) || 'utilisateur'}`}>
              <IconButton onClick={() => setAddDialogOpen(true)}
                sx={{ width: 44, height: 44, borderRadius: '14px', background: '#10B981', color: '#fff',
                  transition: 'all 0.3s ease', boxShadow: '0 3px 10px rgba(16,185,129,0.4)',
                  '&:hover': { background: '#059669', transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(16,185,129,0.5)' } }}>
                <Typography sx={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: '#fff' }}>+</Typography>
              </IconButton>
            </Tooltip>
            <Tooltip title="Historique d'audit">
              <IconButton onClick={() => navigate(`/dashboard/admin/audit-history?type=${userType}`)}
                sx={{ width: 44, height: 44, borderRadius: '14px', background: '#8B5CF6', color: '#fff',
                  transition: 'all 0.3s ease', boxShadow: '0 3px 10px rgba(139,92,246,0.4)',
                  '&:hover': { background: '#7C3AED', transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(139,92,246,0.5)' } }}>
                <History sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Utilisateurs archivés">
              <IconButton onClick={() => navigate(`/dashboard/admin/archived-users?type=${userType}`)}
                sx={{ width: 44, height: 44, borderRadius: '14px', background: '#F59E0B', color: '#fff',
                  transition: 'all 0.3s ease', boxShadow: '0 3px 10px rgba(245,158,11,0.4)',
                  '&:hover': { background: '#D97706', transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(245,158,11,0.5)' } }}>
                <Archive sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Retour au tableau de bord">
              <IconButton onClick={() => navigate('/dashboard/admin')}
                sx={{ width: 44, height: 44, borderRadius: '14px', background: '#F0F4FF', border: '2px solid #3B82F640', color: '#3B82F6',
                  transition: 'all 0.3s ease',
                  '&:hover': { background: '#3B82F620', transform: 'translateY(-2px)', boxShadow: '0 4px 12px #3B82F625' } }}>
                <ArrowBack sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        {!userType && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Historique d'audit">
              <IconButton onClick={() => navigate('/dashboard/admin/audit-history')}
                sx={{ width: 44, height: 44, borderRadius: '14px', background: '#8B5CF6', color: '#fff',
                  transition: 'all 0.3s ease', boxShadow: '0 3px 10px rgba(139,92,246,0.4)',
                  '&:hover': { background: '#7C3AED', transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(139,92,246,0.5)' } }}>
                <History sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Utilisateurs archivés">
              <IconButton onClick={() => navigate('/dashboard/admin/archived-users')}
                sx={{ width: 44, height: 44, borderRadius: '14px', background: '#F59E0B', color: '#fff',
                  transition: 'all 0.3s ease', boxShadow: '0 3px 10px rgba(245,158,11,0.4)',
                  '&:hover': { background: '#D97706', transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(245,158,11,0.5)' } }}>
                <Archive sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Actualiser">
              <IconButton onClick={fetchUsers}
                sx={{ width: 44, height: 44, borderRadius: '14px', background: '#3B82F6', color: '#fff',
                  transition: 'all 0.3s ease', boxShadow: '0 3px 10px rgba(59,130,246,0.4)',
                  '&:hover': { background: '#2563EB', transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(59,130,246,0.5)' } }}>
                <Refresh sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* ══ FILTRES ═══════════════════════════════ */}
      <Card sx={{
        borderRadius: '22px', mb: 3, overflow: 'hidden',
        border: `1.5px solid ${C.blueL}`,
        boxShadow: `0 4px 24px rgba(26,58,107,0.07)`,
      }}>
        <Box sx={{ 
          height: 3, 
          background: userType === 'directeur' 
            ? `linear-gradient(90deg, ${C.purple}, #9D4EDD, ${C.purple})` 
            : userType === 'recteur'
            ? `linear-gradient(90deg, ${C.orange}, #FF8C5A, ${C.orange})`
            : userType === 'etudiant'
            ? `linear-gradient(90deg, ${C.green}, #05C78D, ${C.green})`
            : `linear-gradient(90deg, ${C.blue}, ${C.blueB}, ${C.blue})`, 
          backgroundSize: '300% auto' 
        }} />
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box sx={{ 
                width: 32, height: 32, borderRadius: '9px', 
                background: userType === 'directeur' ? '#F5F3FF' : (userType === 'recteur' ? '#FFF7ED' : (userType === 'etudiant' ? '#ECFDF5' : '#F0F7FF')), 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                boxShadow: userType === 'directeur' ? `0 3px 10px ${C.purple}30` : (userType === 'recteur' ? `0 3px 10px ${C.orange}30` : (userType === 'etudiant' ? `0 3px 10px ${C.green}30` : `0 3px 10px ${C.blue}30`))
              }}>
                <FilterList sx={{ color: userType === 'directeur' ? C.purple : (userType === 'recteur' ? C.orange : (userType === 'etudiant' ? C.green : C.blueD)), fontSize: 16 }} />
              </Box>
              <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.95rem' }}>Filtres de recherche</Typography>
            </Box>
          </Box>

          <Grid container spacing={2}>
            {/* Search */}
            <Grid item xs={12} md={userType === 'recteur' ? 6 : (userType ? 6 : 4)}>
              <TextField
                fullWidth size="small"
                placeholder="Rechercher par nom, email, téléphone..."
                value={filters.search}
                onChange={(e) => { setFilters(p => ({ ...p, search: e.target.value })); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 17, color: '#B8C8D8' }} /></InputAdornment> }}
                sx={fieldSx}
              />
            </Grid>

            {!userType && (
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small" sx={fieldSx}>
                  <InputLabel>Rôle</InputLabel>
                  <Select value={filters.role} label="Rôle" onChange={(e) => { setFilters(p => ({ ...p, role: e.target.value })); setPage(0); }}>
                    <MenuItem value="">Tous les rôles</MenuItem>
                    {filterOptions.roles.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {userType === 'recteur' ? (
              <>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small" sx={fieldSx}>
                    <InputLabel>Statut</InputLabel>
                    <Select value={filters.statut} label="Statut" onChange={(e) => { setFilters(p => ({ ...p, statut: e.target.value })); setPage(0); }}>
                      <MenuItem value="">Tous les statuts</MenuItem>
                      {filterOptions.statuts.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small" sx={fieldSx}>
                    <InputLabel>Université</InputLabel>
                    <Select value={filters.universite} label="Université" onChange={(e) => { setFilters(p => ({ ...p, universite: e.target.value })); setPage(0); }}>
                      <MenuItem value="">Toutes les universités</MenuItem>
                      {filterOptions.universites.map(u => <MenuItem key={u.id_rectorat} value={u.id_rectorat}>{u.nom_rectorat}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            ) : (
              <Grid item xs={12} md={userType ? 6 : 4}>
                <FormControl fullWidth size="small" sx={fieldSx}>
                  <InputLabel>Statut</InputLabel>
                  <Select value={filters.statut} label="Statut" onChange={(e) => { setFilters(p => ({ ...p, statut: e.target.value })); setPage(0); }}>
                    <MenuItem value="">Tous les statuts</MenuItem>
                    {filterOptions.statuts.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {userType !== 'recteur' && (
              <>
                {userType !== 'directeur' && userType !== 'enseignant' && (
                  <>
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth size="small" sx={fieldSx}>
                        <InputLabel>Région</InputLabel>
                        <Select value={filters.region} label="Région" onChange={(e) => { setFilters(p => ({ ...p, region: e.target.value, ville: '' })); setPage(0); }}>
                          <MenuItem value="">Toutes les régions</MenuItem>
                          {filterOptions.regions.map(r => <MenuItem key={r.id_region} value={r.id_region}>{r.nom_region}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth size="small" sx={fieldSx} disabled={!filters.region}>
                        <InputLabel>Ville</InputLabel>
                        <Select value={filters.ville} label="Ville" onChange={(e) => { setFilters(p => ({ ...p, ville: e.target.value })); setPage(0); }}>
                          <MenuItem value="">Toutes les villes</MenuItem>
                          {filterOptions.villes.filter(v => !filters.region || v.id_region == filters.region).map(v => <MenuItem key={v.id_ville} value={v.id_ville}>{v.nom_ville}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}

                <Grid item xs={12} md={userType === 'enseignant' ? 6 : 3}>
                  <FormControl fullWidth size="small" sx={fieldSx}>
                    <InputLabel>Université</InputLabel>
                    <Select value={filters.universite} label="Université" onChange={(e) => { setFilters(p => ({ ...p, universite: e.target.value, etablissement: '' })); setPage(0); }}>
                      <MenuItem value="">Toutes les universités</MenuItem>
                      {filterOptions.universites.map(u => <MenuItem key={u.id_rectorat} value={u.id_rectorat}>{u.nom_rectorat}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={userType === 'enseignant' ? 6 : 3}>
                  <FormControl fullWidth size="small" sx={fieldSx} disabled={!filters.universite}>
                    <InputLabel>Établissement</InputLabel>
                    <Select value={filters.etablissement} label="Établissement" onChange={(e) => { setFilters(p => ({ ...p, etablissement: e.target.value })); setPage(0); }}>
                      <MenuItem value="">Tous les établissements</MenuItem>
                      {filterOptions.etablissements.filter(e => !filters.universite || e.id_rectorat == filters.universite).map(e => <MenuItem key={e.id_etablissement} value={e.id_etablissement}>{e.nom_etablissement}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* ══ CARDS LIST ════════════════════════════ */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Typography sx={{ fontWeight: 900, color: C.navy, fontSize: '1.5rem', letterSpacing: '-0.5px' }}>
            Liste des utilisateurs
          </Typography>
          <Box sx={{
            background: '#E0E7FF',
            borderRadius: '20px',
            px: 2.5,
            py: 0.5,
            display: 'inline-flex',
            alignItems: 'center',
          }}>
            <Typography sx={{ color: '#4F46E5', fontSize: '1rem', fontWeight: 700 }}>
              {total}
            </Typography>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
            <Box sx={{ position: 'relative', width: 52, height: 52 }}>
              <CircularProgress size={52} thickness={3} sx={{ color: C.blue }} />
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                {roleCfg.emoji || '👥'}
              </Box>
            </Box>
            <Typography sx={{ color: C.slate, fontSize: '0.88rem' }}>Chargement en cours...</Typography>
          </Box>
        ) : users.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Box sx={{
              width: 88, height: 88, borderRadius: '50%',
              background: C.blueL, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', mx: 'auto', mb: 2,
            }}>🔍</Box>
            <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '1.1rem', mb: 0.5 }}>
              Aucun utilisateur trouvé
            </Typography>
            <Typography sx={{ color: C.slate, fontSize: '0.85rem' }}>
              Essayez de modifier vos critères de recherche
            </Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={2.5}>
                {users.map((user, idx) => {
                  const rc = ROLE_CFG[user.type_utilisateur] || { emoji: '👤', color: C.blue, label: user.type_utilisateur };
                  const sc = STATUS_CFG[user.statut] || STATUS_CFG.INACTIF;
                  const isHov = hovCard === idx;

                  return (
                    <Grid item xs={12} sm={6} md={4} key={user.numero_utilisateur}>
                      <Card
                        onMouseEnter={() => setHovCard(idx)}
                        onMouseLeave={() => setHovCard(null)}
                        elevation={0}
                        sx={{
                          borderRadius: '18px', overflow: 'hidden',
                          border: `1.5px solid ${isHov ? rc.color + '50' : C.blueL}`,
                          boxShadow: isHov ? `0 16px 48px ${rc.color}18` : `0 2px 12px rgba(0,0,0,0.04)`,
                          transform: isHov ? 'translateY(-6px)' : 'none',
                          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                          position: 'relative',
                          // top accent bar always visible
                          '&::before': {
                            content: '""', position: 'absolute',
                            top: 0, left: 0, right: 0, height: '3px',
                            background: userType === 'directeur' 
                              ? `linear-gradient(90deg, ${C.purple}, #9D4EDD)` 
                              : userType === 'recteur'
                              ? `linear-gradient(90deg, ${C.orange}, #FF8C5A)`
                              : userType === 'etudiant'
                              ? `linear-gradient(90deg, ${C.green}, #05C78D)`
                              : `linear-gradient(90deg, ${C.blue}, ${C.blueB})`,
                          },
                        }}
                      >
                        <CardContent sx={{ p: 2.5 }}>

                          {/* Avatar + name */}
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                            <Box sx={{ position: 'relative', flexShrink: 0 }}>
                              <Box sx={{
                                width: 52, height: 52, fontSize: '1.4rem',
                                borderRadius: '12px',
                                background: userType === 'recteur' ? '#FFE5CC' : (userType === 'directeur' ? '#E9D5FF' : (userType === 'etudiant' ? '#D1FAE5' : (userType === 'enseignant' ? '#BFDBFE' : `linear-gradient(135deg, ${rc.color}CC, ${rc.color})`))),
                                boxShadow: `0 4px 14px ${rc.color}30`,
                                transition: 'transform 0.3s ease',
                                transform: isHov ? 'scale(1.08) rotate(5deg)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                {rc.emoji}
                              </Box>
                              {/* status dot */}
                              <Box sx={{
                                position: 'absolute', bottom: 1, right: 1,
                                width: 11, height: 11, borderRadius: '50%',
                                background: sc.dot, border: '2px solid #fff',
                              }} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.95rem', mb: 0.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user.nom} {user.prenom}
                              </Typography>
                              <Chip label={rc.label} size="small" sx={{ background: `${rc.color}12`, color: rc.color, fontWeight: 700, fontSize: '0.68rem', border: `1px solid ${rc.color}28`, borderRadius: '7px', height: 20 }} />
                            </Box>
                          </Box>

                          {/* Info lines */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, mb: 2 }}>
                            {[
                              { icon: '📧', val: user.email },
                              { icon: '📱', val: user.telephone },
                              { icon: '📍', val: user.nom_ville ? `${user.nom_ville}${user.nom_region ? ` · ${user.nom_region}` : ''}` : null },
                              { icon: '🏫', val: user.nom_etablissement },
                            ].filter(r => r.val).map((row, i) => (
                              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <Typography sx={{ fontSize: '0.78rem', lineHeight: 1, flexShrink: 0 }}>{row.icon}</Typography>
                                <Typography sx={{ fontSize: '0.78rem', color: C.slate, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {row.val}
                                </Typography>
                              </Box>
                            ))}
                          </Box>

                          {/* Footer */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: `1px solid ${C.blueL}` }}>
                            <Chip label={sc.label} size="small" sx={{ background: sc.bg, color: sc.color, fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${sc.color}25`, borderRadius: '7px', height: 22 }} />
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Voir détails">
                                <IconButton size="small" onClick={() => { setSelectedUser(user); setDetailsOpen(true); }} sx={{
                                  width: 30, height: 30, borderRadius: '8px',
                                  background: C.blueL, color: C.blueD,
                                  transition: 'all 0.2s',
                                  '&:hover': { background: `${C.blue}22`, transform: 'scale(1.12)' },
                                }}>
                                  <Visibility sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Modifier">
                                <IconButton size="small" onClick={() => handleEditUser(user)} sx={{
                                  width: 30, height: 30, borderRadius: '8px',
                                  background: `${C.orange}10`, color: C.orange,
                                  transition: 'all 0.2s',
                                  '&:hover': { background: `${C.orange}20`, transform: 'scale(1.12)' },
                                }}>
                                  <Edit sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Archiver">
                                <IconButton size="small" onClick={() => handleArchiveUser(user)} sx={{
                                  width: 30, height: 30, borderRadius: '8px',
                                  background: `${C.purple}10`, color: C.purple,
                                  transition: 'all 0.2s',
                                  '&:hover': { background: `${C.purple}20`, transform: 'scale(1.12)' },
                                }}>
                                  <Archive sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={user.statut === 'ACTIF' ? 'Suspendre' : 'Activer'}>
                                <IconButton size="small" onClick={() => handleToggleStatus(user)} sx={{
                                  width: 30, height: 30, borderRadius: '8px',
                                  background: user.statut === 'ACTIF' ? `${C.red}10` : `${C.green}10`,
                                  color: user.statut === 'ACTIF' ? C.red : C.green,
                                  transition: 'all 0.2s',
                                  '&:hover': { background: user.statut === 'ACTIF' ? `${C.red}20` : `${C.green}20`, transform: 'scale(1.12)' },
                                }}>
                                  {user.statut === 'ACTIF' ? <Block sx={{ fontSize: 14 }} /> : <CheckCircle sx={{ fontSize: 14 }} />}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Pagination */}
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <TablePagination
                  component="div" count={total} page={page}
                  onPageChange={(e, p) => setPage(p)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                  rowsPerPageOptions={[6, 12, 24, 48]}
                  labelRowsPerPage="Par page :"
                  labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
                  sx={{
                    '& .MuiTablePagination-toolbar': { background: C.blueL, borderRadius: '14px', px: 2 },
                    '& .MuiTablePagination-select': { fontWeight: 700, color: C.navy },
                    '& .MuiTablePagination-displayedRows': { fontWeight: 600, color: C.navy },
                  }}
                />
              </Box>
            </>
          )}
      </Box>

      {/* ══ DIALOG DÉTAILS ════════════════════════ */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: {
          borderRadius: '24px', overflow: 'hidden',
          boxShadow: `0 24px 64px rgba(26,58,107,0.18)`,
          border: `1.5px solid ${C.blueL}`,
        }}}
      >
        {selectedUser && (() => {
          const rc = ROLE_CFG[selectedUser.type_utilisateur] || { emoji: '👤', color: C.blue, label: selectedUser.type_utilisateur };
          const sc = STATUS_CFG[selectedUser.statut] || STATUS_CFG.INACTIF;
          const detailAccent = userType === 'recteur' ? C.orange : (userType === 'directeur' ? C.purple : (userType === 'etudiant' ? C.green : C.blue));
          const detailBgLight = userType === 'recteur' ? '#FFF7ED' : (userType === 'directeur' ? '#F5F3FF' : (userType === 'etudiant' ? '#ECFDF5' : C.blueL));
          const detailBgGrad = userType === 'recteur' ? 'linear-gradient(135deg, #EAF4FF 0%, #D6EEFF 100%)' : (userType === 'directeur' ? 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)' : `linear-gradient(135deg, ${C.blueL} 0%, #D6EEFF 100%)`);
          
          return (
            <>
              {/* Dialog header */}
              <Box sx={{
                background: detailBgGrad,
                px: 3, py: 2.5, borderBottom: `1.5px solid ${detailAccent}20`,
                position: 'relative',
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                    <Box sx={{
                      width: 52, height: 52, fontSize: '1.4rem',
                      borderRadius: '12px',
                      background: '#E3F2FD',
                      boxShadow: `0 4px 16px ${rc.color}35`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {rc.emoji}
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 900, color: C.navy, fontSize: '1.05rem', letterSpacing: '-0.3px' }}>
                        {selectedUser.nom} {selectedUser.prenom}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.8, mt: 0.5 }}>
                        <Chip label={rc.label} size="small" sx={{ background: `${rc.color}14`, color: rc.color, fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${rc.color}28`, borderRadius: '7px', height: 20 }} />
                        <Chip label={sc.label} size="small" sx={{ background: sc.bg, color: sc.color, fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${sc.color}25`, borderRadius: '7px', height: 20 }} />
                      </Box>
                    </Box>
                  </Box>
                  <IconButton onClick={() => setDetailsOpen(false)} sx={{ color: C.slate, borderRadius: '10px', transition: 'all 0.2s', '&:hover': { background: `${detailAccent}14`, color: C.navy, transform: 'rotate(90deg)' } }}>
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <DialogContent sx={{ p: 3, background: '#FAFCFF' }}>
                {/* Matricule badge */}
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8, mb: 2.5, background: detailBgLight, border: `1px solid ${detailAccent}22`, borderRadius: '8px', px: 1.5, py: 0.5 }}>
                  <Typography sx={{ fontSize: '0.65rem', color: '#9BAAB8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Matricule</Typography>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: detailAccent, fontFamily: 'monospace' }}>#{selectedUser.numero_utilisateur}</Typography>
                </Box>

                <Grid container spacing={0.5}>
                  <Grid item xs={12} sm={6}>
                    <InfoRow icon={<Email />}      label="Email"          value={selectedUser.email} accent={detailAccent} />
                    <InfoRow icon={<Phone />}       label="Téléphone"      value={selectedUser.telephone} accent={detailAccent} />
                    <InfoRow icon={<LocationOn />}  label="Ville"          value={selectedUser.nom_ville} accent={detailAccent} />
                    <InfoRow icon={<LocationOn />}  label="Région"         value={selectedUser.nom_region} accent={detailAccent} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow icon={<Business />}    label="Établissement"  value={selectedUser.nom_etablissement} accent={detailAccent} />
                    <InfoRow icon={<School />}      label="Université"     value={selectedUser.nom_rectorat} accent={detailAccent} />
                    <InfoRow icon={<CalendarToday />} label="Création"     value={selectedUser.date_creation ? new Date(selectedUser.date_creation).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : null} accent={detailAccent} />
                    <InfoRow icon={<AccessTime />}  label="Dernière connexion" value={selectedUser.derniere_connexion ? new Date(selectedUser.derniere_connexion).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null} accent={detailAccent} />
                  </Grid>
                </Grid>

                {/* Champs spécifiques */}
                {(selectedUser.etudiant_filiere || selectedUser.etudiant_matricule || selectedUser.enseignant_grade || selectedUser.enseignant_specialite) && (
                  <>
                    <Divider sx={{ my: 2 }}>
                      <Chip label={`Infos ${rc.label}`} size="small" sx={{ background: `${rc.color}10`, color: rc.color, fontWeight: 700, border: `1px solid ${rc.color}22`, borderRadius: '7px', fontSize: '0.72rem' }} />
                    </Divider>
                    <Grid container spacing={0.5}>
                      {selectedUser.etudiant_matricule && <Grid item xs={12} sm={6}><InfoRow icon={<CreditCard />} label="Matricule étudiant" value={selectedUser.etudiant_matricule} accent={detailAccent} /></Grid>}
                      {selectedUser.etudiant_filiere   && <Grid item xs={12} sm={6}><InfoRow icon={<School />} label="Filière" value={selectedUser.etudiant_filiere} accent={detailAccent} /></Grid>}
                      {selectedUser.enseignant_grade   && <Grid item xs={12} sm={6}><InfoRow icon={<Star />} label="Grade" value={selectedUser.enseignant_grade} accent={detailAccent} /></Grid>}
                      {selectedUser.enseignant_specialite && <Grid item xs={12} sm={6}><InfoRow icon={<School />} label="Spécialité" value={selectedUser.enseignant_specialite} accent={detailAccent} /></Grid>}
                    </Grid>
                  </>
                )}

                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 1.5, mt: 3, pt: 2.5, borderTop: `1px solid ${C.blueL}` }}>
                  <Button fullWidth onClick={() => setDetailsOpen(false)} sx={{
                    borderRadius: '12px', textTransform: 'none', fontWeight: 700, color: C.navy, border: `1.5px solid ${C.blueL}`,
                    '&:hover': { background: C.blueL, borderColor: `${C.blue}50` },
                  }}>Fermer</Button>
                  <Button
                    fullWidth
                    onClick={() => { handleToggleStatus(selectedUser); setDetailsOpen(false); }}
                    sx={{
                      borderRadius: '12px', textTransform: 'none', fontWeight: 700, color: '#fff', border: 'none',
                      background: selectedUser.statut === 'ACTIF' ? C.red : C.green,
                      transition: 'all 0.2s',
                      '&:hover': { 
                        transform: 'translateY(-2px)', 
                        boxShadow: selectedUser.statut === 'ACTIF' ? `0 6px 20px ${C.red}40` : `0 6px 20px ${C.green}40`,
                        background: selectedUser.statut === 'ACTIF' ? '#DC2626' : '#05C78D',
                      },
                    }}
                  >
                    {selectedUser.statut === 'ACTIF' ? '🚫 Suspendre' : '✅ Activer'}
                  </Button>
                </Box>
              </DialogContent>
            </>
          );
        })()}
      </Dialog>

      {/* ══ SNACKBAR ══════════════════════════════ */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ borderRadius: '12px', boxShadow: `0 4px 20px rgba(0,0,0,0.12)` }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* ══ DIALOG MODIFICATION ═══════════════════ */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md" fullWidth
        PaperProps={{ sx: {
          borderRadius: '24px', overflow: 'hidden',
          boxShadow: `0 24px 64px rgba(26,58,107,0.18)`,
          border: `1.5px solid ${C.blueL}`,
        }}}
      >
        {editingUser && (() => {
          const editAccent = C.orange;
          const editBgLight = '#FFF7ED';
          const editBgGrad = 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)';
          const editFieldSx = getFieldSx('recteur');
          
          return (
          <>
            <Box sx={{
              background: editBgGrad,
              px: 3, py: 2.5, borderBottom: `1.5px solid ${editAccent}20`,
              position: 'relative',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: `${editAccent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Edit sx={{ color: editAccent, fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 900, color: C.navy, fontSize: '1.05rem', letterSpacing: '-0.3px' }}>
                      Modifier l'utilisateur
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: C.slate }}>
                      {editingUser.nom} {editingUser.prenom}
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => setEditDialogOpen(false)} sx={{ color: C.slate, borderRadius: '10px', transition: 'all 0.2s', '&:hover': { background: `${editAccent}14`, color: C.navy } }}>
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <DialogContent sx={{ p: 3, background: '#FAFCFF' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    size="small" 
                    label="Nom" 
                    value={editFormData.nom || ''}
                    onChange={(e) => setEditFormData({...editFormData, nom: e.target.value})}
                    sx={editFieldSx} 
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    size="small" 
                    label="Prénom" 
                    value={editFormData.prenom || ''}
                    onChange={(e) => setEditFormData({...editFormData, prenom: e.target.value})}
                    sx={editFieldSx} 
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    size="small" 
                    label="Email" 
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    sx={editFieldSx} 
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    size="small" 
                    label="Téléphone" 
                    value={editFormData.telephone || ''}
                    onChange={(e) => setEditFormData({...editFormData, telephone: e.target.value})}
                    sx={editFieldSx} 
                  />
                </Grid>

                {/* Champs université et établissement pour directeurs et enseignants */}
                {(editingUser.type_utilisateur === 'DIRECTEUR' || editingUser.type_utilisateur === 'ENSEIGNANT') && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small" sx={editFieldSx}>
                        <InputLabel>Université</InputLabel>
                        <Select 
                          value={editFormData.id_rectorat || ''} 
                          label="Université" 
                          onChange={(e) => setEditFormData({...editFormData, id_rectorat: e.target.value, id_etablissement: ''})}
                        >
                          <MenuItem value="">Sélectionnez une université</MenuItem>
                          {filterOptions.universites.map(u => (
                            <MenuItem key={u.id_rectorat} value={u.id_rectorat}>{u.nom_rectorat}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small" sx={editFieldSx} disabled={!editFormData.id_rectorat}>
                        <InputLabel>Établissement</InputLabel>
                        <Select 
                          value={editFormData.id_etablissement || ''} 
                          label="Établissement" 
                          onChange={(e) => setEditFormData({...editFormData, id_etablissement: e.target.value})}
                        >
                          <MenuItem value="">Sélectionnez un établissement</MenuItem>
                          {filterOptions.etablissements
                            .filter(e => !editFormData.id_rectorat || e.id_rectorat == editFormData.id_rectorat)
                            .map(e => (
                              <MenuItem key={e.id_etablissement} value={e.id_etablissement}>{e.nom_etablissement}</MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}
              </Grid>

              <Box sx={{ display: 'flex', gap: 1.5, mt: 3, pt: 2.5, borderTop: `1px solid ${C.blueL}` }}>
                <Button fullWidth onClick={() => setEditDialogOpen(false)} sx={{
                  borderRadius: '12px', textTransform: 'none', fontWeight: 700, color: C.navy, border: `1.5px solid ${C.blueL}`,
                  '&:hover': { background: editBgLight, borderColor: `${editAccent}50` },
                }}>Annuler</Button>
                <Button fullWidth onClick={handleSaveEdit} sx={{
                  borderRadius: '12px', textTransform: 'none', fontWeight: 700, color: '#fff',
                  background: `linear-gradient(135deg, ${editAccent}, #FF8C5A)`,
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 6px 20px ${editAccent}40` },
                }}>
                  Enregistrer
                </Button>
              </Box>
            </DialogContent>
          </>
        );
        })()}
      </Dialog>

      {/* ══ DIALOG AJOUT ══════════════════════════ */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="md" fullWidth
        PaperProps={{ sx: {
          borderRadius: '24px', overflow: 'hidden',
          boxShadow: `0 24px 64px rgba(26,58,107,0.18)`,
          border: `1.5px solid ${C.blueL}`,
        }}}
      >
        {(() => {
          const addAccent = userType === 'recteur' ? C.orange : (userType === 'directeur' ? C.purple : C.blue);
          const addBgGrad = userType === 'recteur' ? 'linear-gradient(135deg, #EAF4FF 0%, #D6EEFF 100%)' : (userType === 'directeur' ? 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)' : `linear-gradient(135deg, ${C.blueL} 0%, #D6EEFF 100%)`);
          const addBgLight = userType === 'recteur' ? '#FFF7ED' : (userType === 'directeur' ? '#F5F3FF' : C.blueL);
          
          return (
          <>
            <Box sx={{
              background: addBgGrad,
              px: 3, py: 2.5, borderBottom: `1.5px solid ${addAccent}20`,
              position: 'relative',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: `${C.green}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ color: C.green, fontSize: 24, fontWeight: 700 }}>+</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 900, color: C.navy, fontSize: '1.05rem', letterSpacing: '-0.3px' }}>
                      Ajouter un {TYPE_TITLE[roleKey]?.slice(0, -1) || 'utilisateur'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: C.slate }}>
                      Remplissez les informations ci-dessous
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => setAddDialogOpen(false)} sx={{ color: C.slate, borderRadius: '10px', transition: 'all 0.2s', '&:hover': { background: `${addAccent}14`, color: C.navy } }}>
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <DialogContent sx={{ p: 3, background: '#FAFCFF' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    size="small" 
                    label="Nom" 
                    value={newUser.nom}
                    onChange={(e) => setNewUser({...newUser, nom: e.target.value})}
                    sx={fieldSx} 
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    size="small" 
                    label="Prénom" 
                    value={newUser.prenom}
                    onChange={(e) => setNewUser({...newUser, prenom: e.target.value})}
                    sx={fieldSx} 
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    size="small" 
                    label="Email" 
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    sx={fieldSx} 
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    size="small" 
                    label="Téléphone" 
                    value={newUser.telephone}
                    onChange={(e) => setNewUser({...newUser, telephone: e.target.value})}
                    sx={fieldSx} 
                  />
                </Grid>

                {/* Champs spécifiques selon le type d'utilisateur */}
                {userType === 'recteur' && (
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small" sx={fieldSx} required>
                      <InputLabel>Université</InputLabel>
                      <Select 
                        value={newUser.id_rectorat} 
                        label="Université" 
                        onChange={(e) => setNewUser({...newUser, id_rectorat: e.target.value})}
                      >
                        <MenuItem value="">Sélectionnez une université</MenuItem>
                        {filterOptions.universites.map(u => (
                          <MenuItem key={u.id_rectorat} value={u.id_rectorat}>{u.nom_rectorat}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {(userType === 'directeur' || userType === 'enseignant' || userType === 'etudiant') && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small" sx={fieldSx} required>
                        <InputLabel>Université</InputLabel>
                        <Select 
                          value={newUser.id_rectorat} 
                          label="Université" 
                          onChange={(e) => setNewUser({...newUser, id_rectorat: e.target.value, id_etablissement: ''})}
                        >
                          <MenuItem value="">Sélectionnez une université</MenuItem>
                          {filterOptions.universites.map(u => (
                            <MenuItem key={u.id_rectorat} value={u.id_rectorat}>{u.nom_rectorat}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small" sx={fieldSx} required disabled={!newUser.id_rectorat}>
                        <InputLabel>Établissement</InputLabel>
                        <Select 
                          value={newUser.id_etablissement || ''} 
                          label="Établissement" 
                          onChange={(e) => setNewUser({...newUser, id_etablissement: e.target.value})}
                        >
                          <MenuItem value="">Sélectionnez un établissement</MenuItem>
                          {filterOptions.etablissements
                            .filter(e => !newUser.id_rectorat || e.id_rectorat == newUser.id_rectorat)
                            .map(e => (
                              <MenuItem key={e.id_etablissement} value={e.id_etablissement}>{e.nom_etablissement}</MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}

                {userType === 'enseignant' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField 
                        fullWidth 
                        size="small" 
                        label="Grade" 
                        value={newUser.grade || ''}
                        onChange={(e) => setNewUser({...newUser, grade: e.target.value})}
                        sx={fieldSx} 
                        placeholder="Ex: Professeur, Maître de conférences..."
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField 
                        fullWidth 
                        size="small" 
                        label="Spécialité" 
                        value={newUser.specialite || ''}
                        onChange={(e) => setNewUser({...newUser, specialite: e.target.value})}
                        sx={fieldSx} 
                        placeholder="Ex: Informatique, Mathématiques..."
                      />
                    </Grid>
                  </>
                )}

                {userType === 'etudiant' && (
                  <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      size="small" 
                      label="Filière" 
                      value={newUser.filiere || ''}
                      onChange={(e) => setNewUser({...newUser, filiere: e.target.value})}
                      sx={fieldSx} 
                      placeholder="Ex: Informatique, Génie Civil..."
                    />
                  </Grid>
                )}
              </Grid>

              <Box sx={{ display: 'flex', gap: 1.5, mt: 3, pt: 2.5, borderTop: `1px solid ${C.blueL}` }}>
                <Button fullWidth onClick={() => setAddDialogOpen(false)} sx={{
                  borderRadius: '12px', textTransform: 'none', fontWeight: 700, color: C.navy, border: `1.5px solid ${C.blueL}`,
                  '&:hover': { background: addBgLight, borderColor: `${addAccent}50` },
                }}>Annuler</Button>
                <Button 
                  fullWidth 
                  onClick={handleAddUser}
                  disabled={
                    !newUser.nom || !newUser.prenom || !newUser.email || 
                    (userType === 'recteur' && !newUser.id_rectorat) ||
                    ((userType === 'directeur' || userType === 'enseignant' || userType === 'etudiant') && (!newUser.id_rectorat || !newUser.id_etablissement))
                  }
                  sx={{
                    borderRadius: '12px', textTransform: 'none', fontWeight: 700, color: '#fff',
                    background: `linear-gradient(135deg, ${C.green}, #05C78D)`,
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 6px 20px ${C.green}40` },
                    '&:disabled': { background: `linear-gradient(135deg, ${C.green}, #05C78D)`, opacity: 0.4, color: '#fff' },
                  }}
                >
                  Ajouter
                </Button>
              </Box>
            </DialogContent>
          </>
        );
        })()}
      </Dialog>

      <ArchiveActionDialog
        open={archiveDlg.open}
        onClose={() => setArchiveDlg({ open: false, entity: null })}
        onSuccess={() => {
          setSnackbar({ open: true, message: `${archiveDlg.entity.nom} archivé avec succès`, severity: 'success' });
          fetchUsers();
        }}
        entityType="utilisateur"
        entityLabel="utilisateur"
        entity={archiveDlg.entity}
        archiveEndpoint={archiveDlg.entity ? `/users/${archiveDlg.entity.id}/archive` : ''}
        warning={<><b>Désactivation du compte.</b> L'utilisateur ne pourra plus se connecter mais ses données restent en base. Vous pourrez le restaurer depuis la page Archives.</>}
      />

      {/* ── DIALOG GÉNÉRIQUE confirmation avec mot de passe ── */}
      <ConfirmWithPasswordDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(p => ({ ...p, open: false }))}
        onConfirm={confirmDialog.onConfirm || (() => {})}
        title={confirmDialog.title}
        subtitle={confirmDialog.subtitle}
        icon={confirmDialog.icon}
        gradient={confirmDialog.gradient}
        warning={confirmDialog.warning}
        actionLabel={confirmDialog.actionLabel}
      />

      {/* ── DIALOG SUSPENSION avec mot de passe admin ── */}
      <Dialog
        open={suspendDialog.open}
        onClose={() => !suspendDialog.loading && setSuspendDialog({ open: false, user: null, password: '', showPassword: false, loading: false })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
      >
        <Box sx={{ background: `linear-gradient(135deg, ${C.red} 0%, ${C.coral} 100%)`, p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Block sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>Suspendre le profil</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem' }}>
              {suspendDialog.user ? `${suspendDialog.user.nom} ${suspendDialog.user.prenom}` : ''}
            </Typography>
          </Box>
        </Box>

        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <Alert severity="warning" sx={{ mb: 2.5, borderRadius: '10px', fontSize: '0.82rem' }}>
            Cette action bloquera immédiatement l'accès de cet utilisateur. Confirmez avec votre mot de passe administrateur.
          </Alert>

          <Typography sx={{ fontSize: '0.82rem', color: C.slate, mb: 1, fontWeight: 600 }}>
            Mot de passe administrateur
          </Typography>
          <TextField
            fullWidth
            size="small"
            type={suspendDialog.showPassword ? 'text' : 'password'}
            placeholder="Entrez votre mot de passe"
            value={suspendDialog.password}
            onChange={e => setSuspendDialog(p => ({ ...p, password: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleConfirmSuspend()}
            disabled={suspendDialog.loading}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ fontSize: 18, color: C.slate }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSuspendDialog(p => ({ ...p, showPassword: !p.showPassword }))}>
                    {suspendDialog.showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                '&.Mui-focused fieldset': { borderColor: C.red },
              },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => setSuspendDialog({ open: false, user: null, password: '', showPassword: false, loading: false })}
            disabled={suspendDialog.loading}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, color: C.slate, borderColor: '#E2E8F0' }}
          >
            Annuler
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleConfirmSuspend}
            disabled={suspendDialog.loading || !suspendDialog.password.trim()}
            sx={{
              borderRadius: '10px', textTransform: 'none', fontWeight: 700,
              background: `linear-gradient(135deg, ${C.red} 0%, ${C.coral} 100%)`,
              '&:hover': { background: `linear-gradient(135deg, ${C.coral} 0%, ${C.red} 100%)` },
              '&:disabled': { opacity: 0.5 },
            }}
          >
            {suspendDialog.loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Confirmer la suspension'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;