import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import { useNotifications } from '../contexts/NotificationContext';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid,
  Avatar, Divider, Alert, CircularProgress, IconButton,
  InputAdornment, Chip, Badge, List, ListItem, ListItemText,
  ListItemAvatar, Switch,
} from '@mui/material';
import {
  Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon,
  Visibility, VisibilityOff, PhotoCamera, ArrowBack,
  CheckCircle, Person, Email, Phone, CreditCard, Work,
  Delete as DeleteIcon, MarkEmailRead as MarkEmailReadIcon,
} from '@mui/icons-material';

const C = {
  navy: '#1A3A6B', blue: '#4D9FFF', blueB: '#85BFFF', blueL: '#EAF4FF', blueD: '#1A6FD4',
  green: '#06D6A0', greenD: '#04B884', red: '#EF4444', redL: '#FEE2E2',
  orange: '#FF6B35', orangeL: '#FFF3E0', coral: '#D85A30', purple: '#7B2CBF',
  yellow: '#FFD60A', slate: '#64748B',
};

const fieldSx = (accent = C.blue, disabled = false) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px', background: disabled ? C.blueL : '#FAFCFF',
    '& fieldset': { borderColor: disabled ? 'transparent' : C.blueL, borderWidth: '1.5px' },
    '&:hover fieldset': { borderColor: disabled ? 'transparent' : `${accent}60` },
    '&.Mui-focused fieldset': { borderColor: accent, boxShadow: `0 0 0 3px ${accent}12` },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: accent },
  '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: C.navy, opacity: 0.85 },
});

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    notifications, 
    preferences: notificationPrefs, 
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    togglePreference: toggleNotificationPref
  } = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  const [userData, setUserData] = useState({
    numero_utilisateur: '', nom: '', prenom: '', email: '',
    telephone: '', sexe: '', type_utilisateur: '', statut: '',
  });
  const [editedData, setEditedData] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [pwdData, setPwdData] = useState({ ancien: '', nouveau: '', confirmer: '' });

  useEffect(() => { 
    fetchProfile(); 
    
    // Vérifier si on doit ouvrir l'onglet notifications via URL
    const tab = searchParams.get('tab');
    if (tab === 'notifications') {
      setActiveTab('notifications');
    }
  }, [searchParams]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      const res = await axios.get(`${config.apiUrl}/profile`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        const d = res.data.data;
        const p = {
          numero_utilisateur: d.numero_utilisateur, nom: d.nom, prenom: d.prenom,
          email: d.email, telephone: d.telephone || '', sexe: d.sexe || '',
          type_utilisateur: d.type_utilisateur, statut: d.statut,
        };
        if (d.enseignant) p.enseignant = { ...d.enseignant };
        if (d.etudiant) p.etudiant = { ...d.etudiant };
        setUserData(p);
      }
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
      else setError('Impossible de charger le profil');
      setLoading(false);
    }
  };

  const handleEdit = () => { setEditedData({ ...userData }); setEditing(true); setError(''); setSuccess(''); setFieldErrors({}); };
  const handleCancel = () => { setEditing(false); setEditedData({}); setError(''); setFieldErrors({}); };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    let newError = '';

    // Validation Prénom et Nom: uniquement des lettres, espaces et tirets
    if (name === 'prenom' || name === 'nom') {
      if (value && !/^[a-zA-ZÀ-ÿ\s-]+$/.test(value)) {
        newError = 'Uniquement des lettres, espaces et tirets';
      }
      if (value && value.length < 2) {
        newError = 'Minimum 2 caractères';
      }
    }

    // Validation Email
    if (name === 'email') {
      if (value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newError = 'Format d\'email invalide';
        } else {
          const localPart = value.split('@')[0];
          if (!/[a-zA-Z]/.test(localPart)) {
            newError = 'L\'email doit contenir au moins une lettre avant le @';
          }
        }
      }
    }

    // Validation Téléphone: uniquement des chiffres, 8 caractères
    if (name === 'telephone') {
      newValue = value.replace(/\D/g, '').slice(0, 8);
      if (newValue && newValue.length !== 8) {
        newError = 'Le téléphone doit contenir exactement 8 chiffres';
      }
    }

    setEditedData({ ...editedData, [name]: newValue });
    setFieldErrors({ ...fieldErrors, [name]: newError });
  };
  
  const handlePwdChange = (e) => setPwdData({ ...pwdData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    // Vérifier s'il y a des erreurs de validation
    const hasErrors = Object.values(fieldErrors).some(err => err !== '');
    if (hasErrors) {
      setError('Veuillez corriger les erreurs avant de sauvegarder');
      return;
    }

    try {
      setLoading(true); setError('');
      const token = localStorage.getItem('token');
      const res = await axios.put(`${config.apiUrl}/profile`,
        { nom: editedData.nom, prenom: editedData.prenom, email: editedData.email, telephone: editedData.telephone, sexe: editedData.sexe },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setUserData(editedData); setEditing(false);
        setSuccess('✅ Profil mis à jour avec succès !');
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...u, nom: editedData.nom, prenom: editedData.prenom, email: editedData.email }));
      }
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
      setLoading(false);
    }
  };

  const handlePwdSubmit = async (e) => {
    e.preventDefault();
    if (pwdData.nouveau !== pwdData.confirmer) { setError('Les mots de passe ne correspondent pas'); return; }
    if (pwdData.nouveau.length < 8) { setError('Minimum 8 caractères requis'); return; }
    try {
      setLoading(true); setError('');
      const token = localStorage.getItem('token');
      const res = await axios.post(`${config.apiUrl}/auth/change-password`,
        { ancien_mot_de_passe: pwdData.ancien, nouveau_mot_de_passe: pwdData.nouveau },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setSuccess('🔐 Mot de passe modifié avec succès !');
        setChangingPwd(false);
        setPwdData({ ancien: '', nouveau: '', confirmer: '' });
      }
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur'); setLoading(false);
    }
  };

  const getRoleLabel = (r) => ({ ADMIN_MESRS: '💼 Administrateur MESRS', RECTEUR: "🎓 Recteur d'Université", DIRECTEUR: "🏫 Directeur d'Établissement", ENSEIGNANT: '👨‍🏫 Enseignant', ETUDIANT: '👨‍🎓 Étudiant' }[r] || r);
  const completedFields = [userData.prenom, userData.nom, userData.email, userData.telephone, userData.sexe].filter(Boolean).length;
  const completionPct = Math.round((completedFields / 6) * 100); // 6 champs au total incluant la photo

  if (loading && !editing) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress sx={{ color: C.blue }} />
    </Box>
  );

  return (
    <Box>
      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: '14px' }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '14px' }} onClose={() => setError('')}>{error}</Alert>}

      {/* HEADER CARD */}
      <Card sx={{ borderRadius: '20px', mb: 3, overflow: 'hidden', border: `1.5px solid #E2E8F0`, boxShadow: `0 4px 16px rgba(15,23,42,0.08)` }}>
        {/* Cover Band */}
        <Box sx={{ 
          height: 140, 
          position: 'relative', 
          background: '#F8FAFF', 
          borderBottom: '1px solid #E2E8F0',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: C.blue,
          }
        }}>
          {/* Navigation dans la cover */}
          <Box sx={{ position: 'absolute', top: '18px', left: '24px', right: '18px', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Breadcrumb */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.75, 
              fontSize: '12px', 
              color: '#475569',
              background: 'rgba(255,255,255,0.85)',
              padding: '5px 13px',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.95)',
              boxShadow: '0 1px 6px rgba(15,23,42,0.07)'
            }}>
              <Typography sx={{ fontSize: '12px', color: '#475569' }}>Tableau de bord</Typography>
              <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>›</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography sx={{ fontSize: '12px' }}>👤</Typography>
                <Typography sx={{ fontSize: '12px', color: C.blue, fontWeight: 700 }}>Mon Profil</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Identity Row */}
        <Box sx={{ px: 4, pb: 2.5, display: 'flex', alignItems: 'flex-end', gap: 2.75, mt: '-56px', position: 'relative', zIndex: 2 }}>
          {/* Avatar */}
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Avatar sx={{ 
              width: 96, 
              height: 96, 
              fontSize: '32px', 
              fontWeight: 800,
              background: C.navy,
              border: `4px solid #fff`, 
              boxShadow: `0 8px 28px rgba(26,58,107,0.35)` 
            }}>
              {userData.prenom?.[0]}{userData.nom?.[0]}
            </Avatar>
            
            {/* Badge En ligne */}
            <Box sx={{ 
              position: 'absolute', 
              top: 6, 
              right: -8,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              background: '#fff',
              border: '1.5px solid #A7F3D0',
              padding: '3px 8px',
              borderRadius: '20px',
              fontSize: '10px',
              fontWeight: 700,
              color: '#059669',
              boxShadow: '0 2px 10px rgba(16,185,129,0.22)',
              whiteSpace: 'nowrap',
              '&::before': {
                content: '""',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: C.green,
                flexShrink: 0
              }
            }}>
              En ligne
            </Box>
            
            {/* Bouton edit photo */}
            <IconButton 
              component="label" 
              sx={{ 
                position: 'absolute', 
                bottom: 2, 
                right: 2, 
                width: 28, 
                height: 28, 
                background: C.blue, 
                border: '2.5px solid #fff',
                boxShadow: `0 2px 8px rgba(30,110,245,0.5)`,
                '&:hover': { 
                  background: '#1558CC',
                  transform: 'scale(1.15)'
                } 
              }}
            >
              <PhotoCamera sx={{ fontSize: 12, color: '#fff' }} />
              <input type="file" hidden accept="image/*" />
            </IconButton>
          </Box>

          {/* Nom + Badges */}
          <Box sx={{ pb: 0.75, flex: 1, minWidth: 0 }}>
            <Typography sx={{ 
              fontWeight: 800, 
              fontSize: '23px', 
              color: C.navy, 
              mb: 1, 
              lineHeight: 1.2 
            }}>
              {userData.prenom} {userData.nom}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
              <Chip 
                label={getRoleLabel(userData.type_utilisateur)} 
                sx={{ 
                  background: '#EEF2FF', 
                  color: C.navy, 
                  border: '1.5px solid #C7D2FE',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  height: 26,
                  borderRadius: '20px',
                  '& .MuiChip-label': { px: 1.5 }
                }} 
              />
              <Chip 
                label={`#${userData.numero_utilisateur}`} 
                sx={{ 
                  background: '#F8FAFC', 
                  color: '#475569', 
                  border: '1.5px solid #E2E8F0',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  height: 24,
                  borderRadius: '20px',
                  fontFamily: 'monospace',
                  '& .MuiChip-label': { px: 1.5 }
                }} 
              />
            </Box>
          </Box>

          {/* Stats */}
          <Box sx={{ display: 'flex', gap: 1.25, ml: 'auto', flexShrink: 0, alignSelf: 'flex-end', pb: 0.75 }}>
            {[
              { icon: completionPct === 100 ? '✅' : '⏳', label: completionPct === 100 ? 'Profil complet' : 'Profil incomplet', value: `${completionPct}%`, color: completionPct === 100 ? C.green : C.orange },
              { icon: '🗓️', label: 'Membre depuis', value: '2026', color: C.navy },
            ].map((stat, i) => (
              <Box 
                key={i} 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  px: 2.5,
                  py: 1.5,
                  borderRadius: '14px',
                  background: '#F8FAFF',
                  border: '1.5px solid #DCE8FD',
                  boxShadow: '0 2px 8px rgba(30,110,245,0.07)',
                  minWidth: 80,
                  cursor: 'default',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 18px rgba(30,110,245,0.13)',
                    background: '#EEF4FF'
                  }
                }}
              >
                <Typography sx={{ fontSize: '16px', mb: 0.5 }}>{stat.icon}</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '18px', lineHeight: 1, color: stat.color }}>{stat.value}</Typography>
                <Typography sx={{ fontSize: '10px', color: '#94A3B8', mt: 0.4, fontWeight: 500, textAlign: 'center' }}>{stat.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Divider */}
        <Divider sx={{ mx: 0 }} />

        {/* TABS */}
        <Box sx={{ display: 'flex', gap: 0.5, px: 3.5, pt: 0.5 }}>
          {[
            { key: 'info', icon: '📋', label: 'Informations' },
            { key: 'security', icon: '🔒', label: 'Sécurité' },
            { key: 'notifications', icon: '🔔', label: 'Notifications', badge: unreadCount },
          ].map(tab => (
            <Button 
              key={tab.key} 
              onClick={() => setActiveTab(tab.key)} 
              sx={{
                px: 2,
                py: 1.5,
                pb: 1.75,
                borderRadius: 0,
                textTransform: 'none',
                fontSize: '13px',
                fontWeight: activeTab === tab.key ? 700 : 500,
                gap: 0.9,
                color: activeTab === tab.key ? C.blue : '#94A3B8',
                background: 'transparent',
                borderBottom: activeTab === tab.key ? `2.5px solid ${C.blue}` : '2.5px solid transparent',
                '&:hover': { 
                  color: activeTab === tab.key ? C.blue : '#0F172A',
                  background: 'none !important',
                  boxShadow: 'none !important'
                },
              }}
            >
              <span style={{ fontSize: '14px' }}>{tab.icon}</span>
              {tab.label}
              {tab.badge && (
                <Box sx={{ 
                  background: C.blueL, 
                  color: C.blue, 
                  fontSize: '10px', 
                  fontWeight: 700,
                  px: 0.75,
                  py: 0.1,
                  borderRadius: '20px',
                  ml: 0.25,
                  minWidth: 18,
                  textAlign: 'center'
                }}>
                  {tab.badge}
                </Box>
              )}
            </Button>
          ))}
        </Box>
      </Card>

      {/* TAB INFORMATIONS */}
      {activeTab === 'info' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            {/* Aperçu rapide */}
            <Card sx={{ borderRadius: '20px', border: `1.5px solid ${C.blueL}`, boxShadow: `0 2px 12px rgba(0,0,0,0.06)`, mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Typography sx={{ fontSize: '1.8rem' }}>📋</Typography>
                  <Box>
                    <Typography sx={{ fontSize: '1.05rem', color: C.navy, fontWeight: 700 }}>Aperçu rapide</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#8A9BB0' }}>Vos informations clés</Typography>
                  </Box>
                </Box>
                {[
                  { emoji: '👤', label: 'PRÉNOM', value: userData.prenom, color: C.purple },
                  { emoji: '👤', label: 'NOM', value: userData.nom, color: C.purple },
                  { emoji: '📧', label: 'EMAIL', value: userData.email, color: C.green },
                  { emoji: '📞', label: 'TÉLÉPHONE', value: userData.telephone, color: C.blue },
                  { emoji: '🆔', label: 'MATRICULE', value: userData.numero_utilisateur, color: C.blue },
                  { emoji: '💼', label: 'RÔLE', value: getRoleLabel(userData.type_utilisateur), color: C.blue },
                ].map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, borderBottom: i < 5 ? `1px solid ${C.blueL}` : 'none' }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: '10px', background: `${item.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Typography sx={{ fontSize: '1.3rem' }}>{item.emoji}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.68rem', color: '#AAB8C8', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.3 }}>{item.label}</Typography>
                      <Typography sx={{ fontSize: '0.9rem', color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value || '—'}</Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>

            {/* Complétion */}
            <Card sx={{ borderRadius: '20px', border: `1.5px solid ${C.blueL}`, boxShadow: `0 2px 12px rgba(0,0,0,0.06)` }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, pb: 3, borderBottom: `1px solid ${C.blueL}` }}>
                  <Box sx={{ width: 70, height: 70, borderRadius: '16px', background: `${C.green}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: '2rem' }}>✅</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '1.15rem', color: C.navy, fontWeight: 700, mb: 0.5 }}>Complétion du profil</Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: '#AAB8C8' }}>{completedFields} / 6 champs remplis</Typography>
                  </Box>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography sx={{ fontSize: '0.9rem', color: '#8A9BB0' }}>Progression</Typography>
                    <Typography sx={{ color: C.green, fontSize: '1.5rem' }}>{completionPct}%</Typography>
                  </Box>
                  <Box sx={{ height: 12, borderRadius: 6, background: `${C.green}15`, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', borderRadius: 6, width: `${completionPct}%`, background: C.green }} />
                  </Box>
                </Box>
                {[
                  { label: 'Prénom & Nom', done: !!(userData.prenom && userData.nom) },
                  { label: 'Adresse email', done: !!userData.email },
                  { label: 'Téléphone', done: !!userData.telephone },
                  { label: 'Sexe', done: !!userData.sexe },
                  { label: 'Photo de profil', done: false },
                ].map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: item.done ? `${C.green}30` : `${C.green}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography sx={{ fontSize: '0.9rem', color: C.green }}>✓</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.95rem', color: '#64748B' }}>{item.label}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            {/* Informations personnelles */}
            <Card sx={{ borderRadius: '20px', border: `1.5px solid ${C.blueL}`, boxShadow: `0 2px 12px rgba(0,0,0,0.06)` }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ fontSize: '1.8rem' }}>✏️</Typography>
                    <Box>
                      <Typography sx={{ fontSize: '1.15rem', color: C.navy, fontWeight: 700 }}>Informations personnelles</Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: '#8A9BB0' }}>Modifiez et enregistrez vos données</Typography>
                    </Box>
                  </Box>
                  {!editing ? (
                    <Button startIcon={<EditIcon />} onClick={handleEdit} sx={{
                      textTransform: 'none', color: '#fff', px: 3, py: 1,
                      borderRadius: '10px', background: C.navy, boxShadow: `0 4px 12px ${C.navy}30`,
                      '&:hover': { background: '#2A4A7A' },
                    }}>Modifier</Button>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button startIcon={<CancelIcon />} onClick={handleCancel} sx={{ textTransform: 'none', px: 2.5, borderRadius: '10px', border: `1.5px solid ${C.blueL}`, color: C.slate }}>Annuler</Button>
                      <Button startIcon={<SaveIcon />} onClick={handleSave} disabled={loading} sx={{ textTransform: 'none', color: '#fff', px: 3, borderRadius: '10px', background: C.green, '&:hover': { background: C.greenD } }}>Enregistrer</Button>
                    </Box>
                  )}
                </Box>

                <Grid container spacing={2.5}>
                  {[
                    { label: 'Prénom', name: 'prenom', sm: 6 },
                    { label: 'Nom', name: 'nom', sm: 6 },
                    { label: 'Adresse email', name: 'email', sm: 12, type: 'email' },
                    { label: 'Téléphone', name: 'telephone', sm: 6 },
                    { label: 'Sexe', name: 'sexe', sm: 6, select: true },
                    { label: 'Matricule', name: 'numero_utilisateur', sm: 6, disabled: true },
                    { label: 'Rôle', name: 'type_utilisateur', sm: 6, disabled: true, value: getRoleLabel(userData.type_utilisateur) },
                  ].map(f => (
                    <Grid item xs={12} sm={f.sm} key={f.name}>
                      {f.select ? (
                        <TextField fullWidth select label={f.label} name={f.name} value={editing ? editedData.sexe : userData.sexe} onChange={handleChange} disabled={!editing} SelectProps={{ native: true }} sx={fieldSx(editing ? C.blue : C.blue, !editing)}>
                          <option value="HOMME">Homme</option>
                          <option value="FEMME">Femme</option>
                        </TextField>
                      ) : (
                        <TextField 
                          fullWidth 
                          label={f.label} 
                          name={f.name} 
                          type={f.type || 'text'} 
                          value={f.disabled ? (f.value || userData[f.name]) : (editing ? (editedData[f.name] ?? '') : (userData[f.name] ?? ''))} 
                          onChange={handleChange} 
                          disabled={f.disabled || !editing} 
                          error={editing && !!fieldErrors[f.name]}
                          helperText={editing && fieldErrors[f.name]}
                          sx={fieldSx(C.blue, f.disabled || !editing)} 
                        />
                      )}
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* TAB SÉCURITÉ */}
      {activeTab === 'security' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            {/* Sécurité du compte */}
            <Card sx={{ borderRadius: '20px', border: `1.5px solid ${C.blueL}`, boxShadow: `0 2px 12px rgba(0,0,0,0.06)` }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Typography sx={{ fontSize: '1.8rem' }}>🔒</Typography>
                  <Box>
                    <Typography sx={{ fontSize: '1.15rem', color: C.navy, fontWeight: 700 }}>Sécurité du compte</Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: '#8A9BB0' }}>Gérez vos accès et mots de passe</Typography>
                  </Box>
                </Box>

                {/* Mot de passe */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2.5, mb: 2, borderRadius: '14px', background: `${C.orange}08`, border: `1.5px solid ${C.orange}20` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ fontSize: '1.5rem' }}>🔑</Typography>
                    <Box>
                      <Typography sx={{ fontSize: '0.95rem', color: C.navy, mb: 0.3 }}>Mot de passe</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#8A9BB0' }}>Dernière modification : il y a 3 mois</Typography>
                    </Box>
                  </Box>
                  <Button onClick={() => setChangingPwd(true)} sx={{
                    textTransform: 'none', fontSize: '0.85rem', color: C.navy,
                    px: 2, py: 0.8, borderRadius: '8px', border: `1.5px solid ${C.blueL}`,
                    '&:hover': { background: C.blueL, borderColor: C.blue, color: C.blue },
                  }}>Modifier →</Button>
                </Box>

                {/* Double authentification */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2.5, mb: 2, borderRadius: '14px', background: `${C.green}08`, border: `1.5px solid ${C.green}20` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ fontSize: '1.5rem' }}>📱</Typography>
                    <Box>
                      <Typography sx={{ fontSize: '0.95rem', color: C.navy, mb: 0.3 }}>Double authentification</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#8A9BB0' }}>Sécurisez votre compte via SMS</Typography>
                    </Box>
                  </Box>
                  <Button sx={{
                    textTransform: 'none', fontSize: '0.85rem', color: C.navy,
                    px: 2, py: 0.8, borderRadius: '8px', border: `1.5px solid ${C.blueL}`,
                    '&:hover': { background: C.blueL, borderColor: C.blue, color: C.blue },
                  }}>Activer →</Button>
                </Box>

                {/* Sessions actives */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2.5, borderRadius: '14px', background: `${C.blue}08`, border: `1.5px solid ${C.blue}20` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ fontSize: '1.5rem' }}>💻</Typography>
                    <Box>
                      <Typography sx={{ fontSize: '0.95rem', color: C.navy, mb: 0.3 }}>Sessions actives</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#8A9BB0' }}>1 session en cours · Chrome, Tunis</Typography>
                    </Box>
                  </Box>
                  <Button sx={{
                    textTransform: 'none', fontSize: '0.85rem', color: C.navy,
                    px: 2, py: 0.8, borderRadius: '8px', border: `1.5px solid ${C.blueL}`,
                    '&:hover': { background: C.blueL, borderColor: C.blue, color: C.blue },
                  }}>Déconnecter</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            {changingPwd ? (
              <Card sx={{ borderRadius: '20px', border: `1.5px solid ${C.blueL}`, boxShadow: `0 2px 12px rgba(0,0,0,0.06)` }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography sx={{ fontSize: '1.15rem', color: C.navy, fontWeight: 700, mb: 3 }}>Modifier le mot de passe</Typography>
                  <form onSubmit={handlePwdSubmit}>
                    <Grid container spacing={2.5}>
                      <Grid item xs={12}>
                        <TextField fullWidth label="Ancien mot de passe" name="ancien" type={showOldPwd ? 'text' : 'password'} value={pwdData.ancien} onChange={handlePwdChange} required sx={fieldSx(C.blue)}
                          InputProps={{ endAdornment: (
                            <InputAdornment position="end">
                              <IconButton size="small" onClick={() => setShowOldPwd(!showOldPwd)}>
                                {showOldPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          )}} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Nouveau mot de passe" name="nouveau" type={showNewPwd ? 'text' : 'password'} value={pwdData.nouveau} onChange={handlePwdChange} required sx={fieldSx(C.blue)}
                          InputProps={{ endAdornment: (
                            <InputAdornment position="end">
                              <IconButton size="small" onClick={() => setShowNewPwd(!showNewPwd)}>
                                {showNewPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          )}} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Confirmer" name="confirmer" type="password" value={pwdData.confirmer} onChange={handlePwdChange} required sx={fieldSx(C.green)} />
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                          <Button onClick={() => { setChangingPwd(false); setPwdData({ ancien: '', nouveau: '', confirmer: '' }); }} sx={{ textTransform: 'none', px: 3, borderRadius: '10px', border: `1.5px solid ${C.blueL}`, color: C.slate }}>Annuler</Button>
                          <Button type="submit" disabled={loading} sx={{ textTransform: 'none', color: '#fff', px: 4, borderRadius: '10px', background: C.green, '&:hover': { background: C.greenD } }}>
                            {loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Sauvegarder'}
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card sx={{ borderRadius: '20px', border: `1.5px solid ${C.blueL}`, boxShadow: `0 2px 12px rgba(0,0,0,0.06)` }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography sx={{ fontSize: '1.15rem', color: C.navy, fontWeight: 700, mb: 2 }}>Compte sécurisé</Typography>
                  <Box sx={{ p: 3, borderRadius: '14px', background: `${C.blue}08`, border: `1.5px solid ${C.blue}20` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 56, height: 56, borderRadius: '14px', background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🔒</Box>
                      <Box>
                        <Typography sx={{ fontSize: '1rem', color: C.navy, mb: 0.5 }}>Compte sécurisé</Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: '#8A9BB0', mb: 0.8 }}>Dernière modification : il y a 30 jours</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: C.green }} />
                          <Typography sx={{ fontSize: '0.75rem', color: C.green }}>Aucune activité suspecte détectée</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {/* TAB NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <Grid container spacing={3}>
          {/* Liste des notifications */}
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: '20px', border: `1.5px solid ${C.blueL}`, boxShadow: `0 2px 12px rgba(0,0,0,0.06)` }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ fontSize: '1.8rem' }}>🔔</Typography>
                    <Box>
                      <Typography sx={{ fontSize: '1.15rem', color: C.navy, fontWeight: 700 }}>
                        Notifications
                      </Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: '#8A9BB0' }}>
                        {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes lues'}
                      </Typography>
                    </Box>
                  </Box>
                  {notifications.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {unreadCount > 0 && (
                        <Button
                          startIcon={<MarkEmailReadIcon />}
                          onClick={markAllAsRead}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.85rem',
                            color: C.blue,
                            px: 2,
                            py: 0.8,
                            borderRadius: '10px',
                            border: `1.5px solid ${C.blueL}`,
                            '&:hover': { background: C.blueL },
                          }}
                        >
                          Tout marquer comme lu
                        </Button>
                      )}
                      <Button
                        startIcon={<DeleteIcon />}
                        onClick={clearAllNotifications}
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.85rem',
                          color: C.red,
                          px: 2,
                          py: 0.8,
                          borderRadius: '10px',
                          border: `1.5px solid ${C.redL}`,
                          '&:hover': { background: C.redL },
                        }}
                      >
                        Tout effacer
                      </Button>
                    </Box>
                  )}
                </Box>

                {notifications.length === 0 ? (
                  <Box sx={{ 
                    py: 8, 
                    textAlign: 'center',
                    borderRadius: '14px',
                    background: `${C.blueL}`,
                    border: `1.5px dashed ${C.blue}40`
                  }}>
                    <Typography sx={{ fontSize: '3rem', mb: 2 }}>🔕</Typography>
                    <Typography sx={{ fontSize: '1.1rem', color: C.navy, fontWeight: 600, mb: 1 }}>
                      Aucune notification
                    </Typography>
                    <Typography sx={{ fontSize: '0.9rem', color: '#8A9BB0' }}>
                      Vous serez notifié ici des nouvelles demandes d'accès
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {notifications.map((notif, index) => (
                      <ListItem
                        key={notif.id}
                        sx={{
                          mb: 1.5,
                          p: 2.5,
                          borderRadius: '14px',
                          background: notif.read ? '#F8FAFC' : `${C.blue}08`,
                          border: `1.5px solid ${notif.read ? '#E2E8F0' : C.blueL}`,
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'translateX(4px)',
                            boxShadow: `0 4px 12px ${notif.read ? 'rgba(0,0,0,0.08)' : `${C.blue}20`}`,
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            width: 48, 
                            height: 48, 
                            background: notif.read ? '#E2E8F0' : `${C.blue}20`,
                            fontSize: '1.5rem'
                          }}>
                            {notif.icon}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography sx={{ 
                                fontWeight: notif.read ? 600 : 800, 
                                fontSize: '0.95rem', 
                                color: C.navy 
                              }}>
                                {notif.title}
                              </Typography>
                              {!notif.read && (
                                <Box sx={{ 
                                  width: 8, 
                                  height: 8, 
                                  borderRadius: '50%', 
                                  background: C.blue,
                                  flexShrink: 0
                                }} />
                              )}
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography sx={{ fontSize: '0.85rem', color: '#64748B', mb: 0.5 }}>
                                {notif.message}
                              </Typography>
                              <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                                {notif.timestamp.toLocaleString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Typography>
                            </>
                          }
                        />
                        <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
                          {!notif.read && (
                            <IconButton
                              size="small"
                              onClick={() => markAsRead(notif.id)}
                              sx={{
                                color: C.blue,
                                '&:hover': { background: `${C.blue}15` },
                              }}
                            >
                              <MarkEmailReadIcon fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => deleteNotification(notif.id)}
                            sx={{
                              color: C.red,
                              '&:hover': { background: C.redL },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Préférences de notifications */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: '20px', border: `1.5px solid ${C.blueL}`, boxShadow: `0 2px 12px rgba(0,0,0,0.06)`, mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Typography sx={{ fontSize: '1.5rem' }}>⚙️</Typography>
                  <Box>
                    <Typography sx={{ fontSize: '1.05rem', color: C.navy, fontWeight: 700 }}>
                      Préférences
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#8A9BB0' }}>
                      Gérez vos notifications
                    </Typography>
                  </Box>
                </Box>

                {[
                  { key: 'email', icon: '📧', label: 'Notifications email', desc: 'Recevoir par email' },
                  { key: 'push', icon: '🔔', label: 'Notifications push', desc: 'En temps réel' },
                  { key: 'sms', icon: '📱', label: 'Notifications SMS', desc: 'Alertes urgentes' },
                  { key: 'rapports', icon: '📊', label: 'Rapports', desc: 'Résumés hebdomadaires' },
                  { key: 'demandes', icon: '🎯', label: 'Demandes d\'accès', desc: 'Nouvelles demandes' },
                  { key: 'activite', icon: '👥', label: 'Activité', desc: 'Actions utilisateurs' },
                ].map((pref) => (
                  <Box
                    key={pref.key}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 1.5,
                      borderBottom: `1px solid ${C.blueL}`,
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                      <Typography sx={{ fontSize: '1.3rem' }}>{pref.icon}</Typography>
                      <Box>
                        <Typography sx={{ fontSize: '0.9rem', color: C.navy, fontWeight: 600 }}>
                          {pref.label}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#8A9BB0' }}>
                          {pref.desc}
                        </Typography>
                      </Box>
                    </Box>
                    <Switch
                      checked={notificationPrefs[pref.key]}
                      onChange={() => toggleNotificationPref(pref.key)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: C.green,
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: C.green,
                        },
                      }}
                    />
                  </Box>
                ))}

                <Button
                  fullWidth
                  sx={{
                    mt: 3,
                    textTransform: 'none',
                    color: '#fff',
                    py: 1.2,
                    borderRadius: '10px',
                    background: C.blue,
                    fontWeight: 600,
                    '&:hover': { background: C.blueD },
                  }}
                >
                  💾 Enregistrer
                </Button>
              </CardContent>
            </Card>

            {/* Statistiques */}
            <Card sx={{ borderRadius: '20px', border: `1.5px solid ${C.blueL}`, boxShadow: `0 2px 12px rgba(0,0,0,0.06)` }}>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontSize: '1.05rem', color: C.navy, fontWeight: 700, mb: 2 }}>
                  📈 Statistiques
                </Typography>
                {[
                  { label: 'Total', value: notifications.length, color: C.blue },
                  { label: 'Non lues', value: unreadCount, color: C.orange },
                  { label: 'Aujourd\'hui', value: notifications.filter(n => {
                    const today = new Date();
                    return n.timestamp.toDateString() === today.toDateString();
                  }).length, color: C.green },
                ].map((stat, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1.5,
                      borderBottom: i < 2 ? `1px solid ${C.blueL}` : 'none',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.9rem', color: '#64748B' }}>
                      {stat.label}
                    </Typography>
                    <Typography sx={{ 
                      fontSize: '1.3rem', 
                      fontWeight: 800, 
                      color: stat.color 
                    }}>
                      {stat.value}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
