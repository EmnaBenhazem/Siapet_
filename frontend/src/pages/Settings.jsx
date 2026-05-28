import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid, Avatar,
  Switch, Chip, CircularProgress, Alert, Divider,
  IconButton, InputAdornment, keyframes, Tooltip,
} from '@mui/material';
import {
  Notifications, Security, Settings as SettingsIcon,
  Visibility, VisibilityOff, Lock, Email, Phone,
  CheckCircle, History, Campaign, Analytics,
  Assignment, Circle, LightMode, DarkMode, CheckRounded,
} from '@mui/icons-material';
import axios from 'axios';
import config from '../config';
import { useNotifications } from '../contexts/NotificationContext';
import { useAppearance, LANGS } from '../contexts/AppearanceContext';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const C = {
  navy: '#1A3A6B', blue: '#4D9FFF', blueL: '#EAF4FF', blueB: '#85BFFF',
  green: '#06D6A0', greenL: '#E6FAF5',
  orange: '#FF6B35', orangeL: '#FFF4E6',
  red: '#EF4444', redL: '#FEE2E2',
  purple: '#7B2CBF', purpleL: '#F3E8FF',
  slate: '#64748B', border: '#E5E7EB',
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px', background: '#FAFCFF',
    '& fieldset': { borderColor: C.blueL, borderWidth: '1.5px' },
    '&:hover fieldset': { borderColor: `${C.blue}60` },
    '&.Mui-focused fieldset': { borderColor: C.blue, boxShadow: `0 0 0 3px ${C.blue}12` },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: C.blue },
};

const actionLabels = {
  LOGIN:        { label: 'Connexion',          icon: '🔑', color: C.green  },
  LOGOUT:       { label: 'Déconnexion',         icon: '🚪', color: C.slate  },
  CREATION:     { label: 'Création',            icon: '➕', color: C.blue   },
  MODIFICATION: { label: 'Modification',        icon: '✏️', color: C.orange },
  ARCHIVAGE:    { label: 'Archivage',           icon: '📦', color: C.purple },
  RESTAURATION: { label: 'Restauration',        icon: '♻️', color: C.green  },
  SUPPRESSION:  { label: 'Suppression',         icon: '🗑️', color: C.red    },
  ACCES_REFUSE: { label: 'Accès refusé',        icon: '⛔', color: C.red    },
};

const tabs = [
  { id: 'systeme',       label: 'Système',       icon: <SettingsIcon /> },
  { id: 'notifications', label: 'Notifications', icon: <Notifications /> },
  { id: 'securite',      label: 'Sécurité',      icon: <Security /> },
];

const roleLabels = {
  ADMIN_MESRS: 'Administrateur MESRS', ADMIN: 'Administrateur',
  RECTEUR: 'Recteur', DIRECTEUR: 'Directeur',
  ENSEIGNANT: 'Enseignant', ETUDIANT: 'Étudiant',
};

const initials = (nom, prenom) =>
  `${(prenom || '').charAt(0)}${(nom || '').charAt(0)}`.toUpperCase() || '?';

const avatarBg = (role) => {
  const map = { ADMIN_MESRS: '#1A3A6B', ADMIN: '#1A3A6B', RECTEUR: '#7B2CBF',
    DIRECTEUR: '#FF6B35', ENSEIGNANT: '#06D6A0', ETUDIANT: '#4D9FFF' };
  return map[role] || '#64748B';
};

export default function Settings() {
  const navigate = useNavigate();
  const { preferences, togglePreference } = useNotifications();
  const { mode, toggleMode, language, setLanguage } = useAppearance();

  const [activeTab,    setActiveTab]    = useState('systeme');
  const [profile,      setProfile]      = useState(null);
  const [activity,     setActivity]     = useState([]);
  const [actLoading,   setActLoading]   = useState(false);

  const [pwdForm,      setPwdForm]      = useState({ ancien: '', nouveau: '', confirmer: '' });
  const [pwdErrors,    setPwdErrors]    = useState({});
  const [showPwd,      setShowPwd]      = useState({ ancien: false, nouveau: false, confirmer: false });
  const [pwdSaving,    setPwdSaving]    = useState(false);

  const [alert,        setAlert]        = useState(null); // { type, msg }

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { loadProfile(); }, []);

  useEffect(() => {
    if (activeTab === 'securite' && activity.length === 0) loadActivity();
  }, [activeTab]);

  const loadProfile = async () => {
    try {
      const { data } = await axios.get(`${config.apiUrl}/profile`, { headers });
      if (data.success) setProfile(data.data);
    } catch { navigate('/login'); }
  };

  const loadActivity = async () => {
    setActLoading(true);
    try {
      const { data } = await axios.get(`${config.apiUrl}/profile/activity?limit=15`, { headers });
      if (data.success) setActivity(data.history || []);
    } catch { setActivity([]); }
    finally { setActLoading(false); }
  };

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  // ── Password handlers ────────────────────────────────────
  const validatePwd = () => {
    const errs = {};
    if (!pwdForm.ancien) errs.ancien = 'Requis';
    if (!pwdForm.nouveau) errs.nouveau = 'Requis';
    else if (pwdForm.nouveau.length < 8) errs.nouveau = 'Minimum 8 caractères';
    else if (!/[A-Z]/.test(pwdForm.nouveau)) errs.nouveau = 'Au moins 1 majuscule';
    else if (!/[0-9]/.test(pwdForm.nouveau)) errs.nouveau = 'Au moins 1 chiffre';
    if (!pwdForm.confirmer) errs.confirmer = 'Requis';
    else if (pwdForm.confirmer !== pwdForm.nouveau) errs.confirmer = 'Les mots de passe ne correspondent pas';
    setPwdErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const savePassword = async () => {
    if (!validatePwd()) return;
    setPwdSaving(true);
    try {
      await axios.post(`${config.apiUrl}/auth/password/change`,
        { ancienMotDePasse: pwdForm.ancien, nouveauMotDePasse: pwdForm.nouveau },
        { headers }
      );
      setPwdForm({ ancien: '', nouveau: '', confirmer: '' });
      setPwdErrors({});
      showAlert('success', 'Mot de passe modifié avec succès.');
    } catch (e) {
      showAlert('error', e.response?.data?.message || 'Mot de passe actuel incorrect.');
    } finally { setPwdSaving(false); }
  };

  if (!profile) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: C.blue }} /></Box>;
  }

  const role = profile.type_utilisateur || profile.role || '';

  // ── Notification options by role ─────────────────────────
  const notifOptions = [
    { key: 'email',    label: 'Notifications par email',    desc: 'Recevoir un email pour chaque événement important', icon: <Email sx={{ color: C.blue }} /> },
    { key: 'push',     label: 'Notifications dans l\'app',  desc: 'Alertes en temps réel dans la plateforme',           icon: <Campaign sx={{ color: C.purple }} /> },
    { key: 'sms',      label: 'Notifications SMS',          desc: 'Recevoir un SMS pour les alertes critiques',         icon: <Phone sx={{ color: C.green }} /> },
  ];
  const eventOptions = [
    ...((['ADMIN_MESRS','ADMIN','RECTEUR','DIRECTEUR'].includes(role))
      ? [{ key: 'demandes', label: "Nouvelles demandes d'accès", desc: 'Quand un utilisateur soumet une demande', icon: <Assignment sx={{ color: C.orange }} /> }]
      : []),
    { key: 'rapports', label: 'Rapports et analyses', desc: 'Génération de rapports périodiques', icon: <Analytics sx={{ color: C.blue }} /> },
    { key: 'activite', label: "Journal d'activité", desc: 'Résumé quotidien des activités de compte', icon: <History sx={{ color: C.slate }} /> },
  ];

  return (
    <Box sx={{ animation: `${fadeUp} 0.4s ease-out`, maxWidth: 1100, mx: 'auto' }}>

      {/* ══ HEADER ══════════════════════════════════════════ */}
      <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: '#fff', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ width: 56, height: 56, borderRadius: 2, background: C.blueL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
          ⚙️
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1F2937' }}>Paramètres</Typography>
          <Typography variant="body2" sx={{ color: C.slate }}>Gérez votre compte, vos préférences et la sécurité</Typography>
        </Box>
      </Box>

      {alert && (
        <Alert severity={alert.type} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setAlert(null)}>
          {alert.msg}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ── Sidebar tabs ─────────────────────────────── */}
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: '20px', border: `1px solid ${C.border}`, boxShadow: 'none', overflow: 'hidden' }}>
            <Box sx={{ p: 2.5, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 52, height: 52, background: avatarBg(role), fontWeight: 800, fontSize: '1.1rem' }}>
                {initials(profile.nom, profile.prenom)}
              </Avatar>
              <Box sx={{ overflow: 'hidden' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: C.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile.prenom} {profile.nom}
                </Typography>
                <Chip label={roleLabels[role] || role} size="small"
                  sx={{ background: C.blueL, color: C.blue, fontWeight: 700, fontSize: '0.68rem', borderRadius: '6px', height: 20, mt: 0.3 }} />
              </Box>
            </Box>
            <Box sx={{ p: 1 }}>
              {tabs.map(tab => (
                <Box key={tab.id} onClick={() => setActiveTab(tab.id)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5,
                    borderRadius: '12px', cursor: 'pointer', mb: 0.5,
                    background: activeTab === tab.id ? C.blueL : 'transparent',
                    color: activeTab === tab.id ? C.blue : C.slate,
                    transition: 'all 0.2s',
                    '&:hover': { background: activeTab === tab.id ? C.blueL : '#F9FAFB' },
                  }}>
                  <Box sx={{ '& .MuiSvgIcon-root': { fontSize: 20, color: activeTab === tab.id ? C.blue : C.slate } }}>
                    {tab.icon}
                  </Box>
                  <Typography sx={{ fontWeight: activeTab === tab.id ? 700 : 500, fontSize: '0.9rem' }}>
                    {tab.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>

        {/* ── Content ──────────────────────────────────── */}
        <Grid item xs={12} md={9}>

          {/* ═══════════════════════════════════════════
              ONGLET 1 — SYSTÈME
          ═══════════════════════════════════════════ */}
          {activeTab === 'systeme' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

              {/* ── Thème ──────────────────────────────── */}
              <Card sx={{ borderRadius: '20px', border: `1px solid ${C.border}`, boxShadow: 'none' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, background: '#FFF8E1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                      🎨
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: C.navy }}>Thème d'affichage</Typography>
                      <Typography variant="body2" sx={{ color: C.slate }}>Choisissez l'apparence de la plateforme</Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    {[
                      {
                        id: 'light', label: 'Mode Clair', desc: 'Interface lumineuse et lisible',
                        icon: <LightMode sx={{ fontSize: 28, color: '#F59E0B' }} />,
                        preview: { bg: '#F8FAFC', card: '#fff', text: '#1F2937', accent: '#4D9FFF' },
                      },
                      {
                        id: 'dark', label: 'Mode Sombre', desc: 'Réduit la fatigue visuelle',
                        icon: <DarkMode sx={{ fontSize: 28, color: '#6366F1' }} />,
                        preview: { bg: '#0F172A', card: '#1E293B', text: '#F1F5F9', accent: '#4D9FFF' },
                      },
                    ].map(opt => {
                      const selected = mode === opt.id;
                      return (
                        <Grid item xs={12} sm={6} key={opt.id}>
                          <Box onClick={toggleMode}
                            sx={{
                              borderRadius: '16px', border: `2px solid ${selected ? C.blue : C.border}`,
                              overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s',
                              boxShadow: selected ? `0 0 0 4px ${C.blue}20` : 'none',
                              '&:hover': { border: `2px solid ${C.blue}80`, transform: 'translateY(-2px)' },
                            }}>
                            {/* Mini preview */}
                            <Box sx={{ height: 80, background: opt.preview.bg, p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.7 }}>
                              <Box sx={{ height: 10, width: '60%', borderRadius: 2, background: opt.preview.card, border: `1px solid ${opt.id === 'dark' ? '#334155' : '#E5E7EB'}` }} />
                              <Box sx={{ display: 'flex', gap: 0.7 }}>
                                {[40, 55, 35].map((w, i) => (
                                  <Box key={i} sx={{ height: 28, width: `${w}%`, borderRadius: 1.5, background: i === 0 ? opt.preview.accent : opt.preview.card, opacity: i === 0 ? 0.85 : 1, border: `1px solid ${opt.id === 'dark' ? '#334155' : '#E5E7EB'}` }} />
                                ))}
                              </Box>
                              <Box sx={{ height: 8, width: '40%', borderRadius: 2, background: opt.preview.text, opacity: 0.25 }} />
                            </Box>
                            {/* Label */}
                            <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: selected ? C.blueL : '#F9FAFB' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                {opt.icon}
                                <Box>
                                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: C.navy }}>{opt.label}</Typography>
                                  <Typography sx={{ fontSize: '0.72rem', color: C.slate }}>{opt.desc}</Typography>
                                </Box>
                              </Box>
                              {selected && <CheckRounded sx={{ color: C.blue, fontSize: 22 }} />}
                            </Box>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </CardContent>
              </Card>

              {/* ── Langue ─────────────────────────────── */}
              <Card sx={{ borderRadius: '20px', border: `1px solid ${C.border}`, boxShadow: 'none' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, background: C.greenL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                      🌐
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: C.navy }}>Langue de l'interface</Typography>
                      <Typography variant="body2" sx={{ color: C.slate }}>Choisissez la langue d'affichage de la plateforme</Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    {LANGS.map(lang => {
                      const selected = language === lang.code;
                      return (
                        <Grid item xs={12} sm={4} key={lang.code}>
                          <Box onClick={() => setLanguage(lang.code)}
                            sx={{
                              borderRadius: '14px', border: `2px solid ${selected ? C.blue : C.border}`,
                              p: 2, cursor: 'pointer', transition: 'all 0.2s',
                              background: selected ? C.blueL : '#F9FAFB',
                              boxShadow: selected ? `0 0 0 4px ${C.blue}15` : 'none',
                              display: 'flex', alignItems: 'center', gap: 1.5,
                              '&:hover': { border: `2px solid ${C.blue}70`, background: C.blueL },
                            }}>
                            <Typography sx={{ fontSize: '2rem', lineHeight: 1 }}>{lang.flag}</Typography>
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: C.navy }}>{lang.label}</Typography>
                              <Typography sx={{ fontSize: '0.7rem', color: C.slate }}>{lang.dir === 'rtl' ? 'RTL' : 'LTR'}</Typography>
                            </Box>
                            {selected && <CheckRounded sx={{ color: C.blue, fontSize: 20, flexShrink: 0 }} />}
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>

                  {language !== 'fr' && (
                    <Box sx={{ mt: 2, p: 2, borderRadius: '12px', background: '#FFF8E1', border: '1px solid #FCD34D', display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                      <Typography sx={{ fontSize: '1.1rem' }}>ℹ️</Typography>
                      <Typography sx={{ fontSize: '0.82rem', color: '#92400E' }}>
                        La traduction complète de l'interface sera disponible prochainement. La préférence est enregistrée et appliquée dès que les traductions seront disponibles.
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* ── Résumé préférences ─────────────────── */}
              <Card sx={{ borderRadius: '20px', border: `1px solid ${C.border}`, boxShadow: 'none', background: 'linear-gradient(135deg,#F0F9FF,#EAF4FF)' }}>
                <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: C.green, fontSize: 32, flexShrink: 0 }} />
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: C.navy, fontSize: '0.95rem' }}>Préférences sauvegardées automatiquement</Typography>
                    <Typography sx={{ color: C.slate, fontSize: '0.8rem' }}>
                      Thème : <b>{mode === 'dark' ? 'Sombre' : 'Clair'}</b> · Langue : <b>{LANGS.find(l => l.code === language)?.label}</b>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

            </Box>
          )}

          {/* ═══════════════════════════════════════════
              ONGLET 2 — NOTIFICATIONS
          ═══════════════════════════════════════════ */}
          {activeTab === 'notifications' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

              {/* Canaux */}
              <Card sx={{ borderRadius: '20px', border: `1px solid ${C.border}`, boxShadow: 'none' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, background: C.purpleL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📡</Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: C.navy }}>Canaux de notification</Typography>
                      <Typography variant="body2" sx={{ color: C.slate }}>Choisissez comment vous souhaitez être notifié</Typography>
                    </Box>
                  </Box>
                  {notifOptions.map((opt, i) => (
                    <React.Fragment key={opt.key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ width: 40, height: 40, borderRadius: 2, background: '#F9FAFB', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {opt.icon}
                          </Box>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: C.navy }}>{opt.label}</Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: C.slate }}>{opt.desc}</Typography>
                          </Box>
                        </Box>
                        <Switch
                          checked={preferences[opt.key] || false}
                          onChange={() => togglePreference(opt.key)}
                          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: C.blue }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { background: C.blue } }}
                        />
                      </Box>
                      {i < notifOptions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </CardContent>
              </Card>

              {/* Événements */}
              <Card sx={{ borderRadius: '20px', border: `1px solid ${C.border}`, boxShadow: 'none' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, background: C.orangeL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🔔</Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: C.navy }}>Événements notifiés</Typography>
                      <Typography variant="body2" sx={{ color: C.slate }}>Sélectionnez les événements qui déclenchent une notification</Typography>
                    </Box>
                  </Box>
                  {eventOptions.map((opt, i) => (
                    <React.Fragment key={opt.key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ width: 40, height: 40, borderRadius: 2, background: '#F9FAFB', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {opt.icon}
                          </Box>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: C.navy }}>{opt.label}</Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: C.slate }}>{opt.desc}</Typography>
                          </Box>
                        </Box>
                        <Switch
                          checked={preferences[opt.key] || false}
                          onChange={() => togglePreference(opt.key)}
                          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: C.blue }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { background: C.blue } }}
                        />
                      </Box>
                      {i < eventOptions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </CardContent>
              </Card>

              {/* Status résumé */}
              <Card sx={{ borderRadius: '20px', border: `1px solid ${C.border}`, boxShadow: 'none', background: 'linear-gradient(135deg,#F0F9FF,#EAF4FF)' }}>
                <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: C.green, fontSize: 32 }} />
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: C.navy, fontSize: '0.95rem' }}>Préférences sauvegardées automatiquement</Typography>
                    <Typography sx={{ color: C.slate, fontSize: '0.8rem' }}>
                      {Object.values(preferences).filter(Boolean).length} option{Object.values(preferences).filter(Boolean).length !== 1 ? 's' : ''} active{Object.values(preferences).filter(Boolean).length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* ═══════════════════════════════════════════
              ONGLET 3 — SÉCURITÉ
          ═══════════════════════════════════════════ */}
          {activeTab === 'securite' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

              {/* Changer mot de passe */}
              <Card sx={{ borderRadius: '20px', border: `1px solid ${C.border}`, boxShadow: 'none' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, background: C.redL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🔐</Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: C.navy }}>Changer le mot de passe</Typography>
                      <Typography variant="body2" sx={{ color: C.slate }}>Utilisez un mot de passe fort d'au moins 8 caractères</Typography>
                    </Box>
                  </Box>
                  <Grid container spacing={2.5}>
                    {[
                      { key: 'ancien',    label: 'Mot de passe actuel' },
                      { key: 'nouveau',   label: 'Nouveau mot de passe' },
                      { key: 'confirmer', label: 'Confirmer le nouveau mot de passe' },
                    ].map(({ key, label }) => (
                      <Grid item xs={12} key={key}>
                        <TextField
                          fullWidth label={label} type={showPwd[key] ? 'text' : 'password'}
                          value={pwdForm[key]}
                          onChange={e => setPwdForm(p => ({ ...p, [key]: e.target.value }))}
                          error={!!pwdErrors[key]} helperText={pwdErrors[key]}
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><Lock sx={{ color: C.blue, fontSize: 20 }} /></InputAdornment>,
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setShowPwd(p => ({ ...p, [key]: !p[key] }))}>
                                  {showPwd[key] ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={fieldSx}
                        />
                      </Grid>
                    ))}
                  </Grid>

                  {/* Indicateur de force */}
                  {pwdForm.nouveau && (
                    <Box sx={{ mt: 2, p: 2, borderRadius: '12px', background: '#F9FAFB', border: `1px solid ${C.border}` }}>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: C.slate, mb: 1 }}>Critères du mot de passe :</Typography>
                      {[
                        { ok: pwdForm.nouveau.length >= 8,        label: 'Au moins 8 caractères' },
                        { ok: /[A-Z]/.test(pwdForm.nouveau),      label: 'Au moins 1 majuscule' },
                        { ok: /[0-9]/.test(pwdForm.nouveau),      label: 'Au moins 1 chiffre' },
                        { ok: /[^A-Za-z0-9]/.test(pwdForm.nouveau), label: '1 caractère spécial (recommandé)' },
                      ].map(({ ok, label }) => (
                        <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Circle sx={{ fontSize: 8, color: ok ? C.green : C.border }} />
                          <Typography sx={{ fontSize: '0.78rem', color: ok ? C.green : C.slate }}>{label}</Typography>
                        </Box>
                      ))}
                    </Box>
                  )}

                  <Button
                    onClick={savePassword} disabled={pwdSaving} fullWidth variant="contained"
                    startIcon={pwdSaving ? <CircularProgress size={16} color="inherit" /> : <Lock />}
                    sx={{ mt: 3, borderRadius: '12px', textTransform: 'none', fontWeight: 700, py: 1.5, background: C.navy, '&:hover': { background: '#243F6B' }, '&:disabled': { background: C.border } }}>
                    {pwdSaving ? 'Modification...' : 'Modifier le mot de passe'}
                  </Button>
                </CardContent>
              </Card>

              {/* Historique d'activité */}
              <Card sx={{ borderRadius: '20px', border: `1px solid ${C.border}`, boxShadow: 'none' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: 2, background: C.blueL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📋</Box>
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: C.navy }}>Historique d'activité</Typography>
                        <Typography variant="body2" sx={{ color: C.slate }}>Les 15 dernières actions sur votre compte</Typography>
                      </Box>
                    </Box>
                    <Tooltip title="Rafraîchir">
                      <IconButton size="small" onClick={loadActivity} sx={{ borderRadius: '10px', border: `1px solid ${C.border}` }}>
                        <History sx={{ fontSize: 18, color: C.slate }} />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {actLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} sx={{ color: C.blue }} /></Box>
                  ) : activity.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography sx={{ fontSize: '2rem', mb: 1 }}>📭</Typography>
                      <Typography sx={{ color: C.slate, fontSize: '0.9rem' }}>Aucune activité enregistrée</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {activity.map((item, i) => {
                        const meta = actionLabels[item.action] || { label: item.action, icon: '📌', color: C.slate };
                        const date = new Date(item.date_action);
                        const details = typeof item.details === 'string' ? JSON.parse(item.details || '{}') : (item.details || {});
                        return (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5, borderRadius: '12px', background: i % 2 === 0 ? '#FAFBFF' : '#fff', border: `1px solid ${C.border}`, transition: 'all 0.2s', '&:hover': { border: `1px solid ${C.blue}30` } }}>
                            <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: `${meta.color}15`, border: `1px solid ${meta.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                              {meta.icon}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: C.navy }}>{meta.label}</Typography>
                              {details.nom_cible && (
                                <Typography sx={{ fontSize: '0.75rem', color: C.slate, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {details.nom_cible}
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                              <Typography sx={{ fontSize: '0.75rem', color: C.slate, fontWeight: 500 }}>
                                {date.toLocaleDateString('fr-TN', { day: '2-digit', month: 'short' })}
                              </Typography>
                              <Typography sx={{ fontSize: '0.7rem', color: C.border }}>
                                {date.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </CardContent>
              </Card>

            </Box>
          )}

        </Grid>
      </Grid>
    </Box>
  );
}
