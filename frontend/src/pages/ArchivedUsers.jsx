import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TablePagination,
  TextField, Grid, Chip, IconButton, InputAdornment, CircularProgress,
  Button, Tooltip, Alert, Snackbar, Avatar,
} from '@mui/material';
import {
  Search, Restore, ArrowBack, Delete, InfoOutlined,
} from '@mui/icons-material';
import api from '../services/api';
import { RestoreActionDialog, ArchiveLogDialog } from '../components/Archive';

// ── PALETTE ───────────────────────────────────────
const C = {
  navy:   '#1A3A6B',
  blue:   '#4D9FFF',
  blueB:  '#85BFFF',
  blueL:  '#EAF4FF',
  blueD:  '#1A6FD4',
  green:  '#06D6A0',
  red:    '#EF4444',
  orange: '#FF6B35',
  coral:  '#D85A30',
  purple: '#7B2CBF',
  slate:  '#64748B',
};

// ── FIELD STYLE ───────────────────────────────────
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px', background: '#FAFCFF',
    '& fieldset': { borderColor: C.blueL, borderWidth: '1.5px' },
    '&:hover fieldset': { borderColor: `${C.blue}60` },
    '&.Mui-focused fieldset': { borderColor: C.blue, boxShadow: `0 0 0 3px ${C.blue}12` },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: C.blue },
};

const ROLE_CFG = {
  RECTEUR:    { emoji: '👨‍💼', color: C.orange, label: 'Recteur'    },
  DIRECTEUR:  { emoji: '👨‍💼', color: C.purple, label: 'Directeur'  },
  ENSEIGNANT: { emoji: '👨‍🏫', color: C.blue,   label: 'Enseignant' },
  ETUDIANT:   { emoji: '👨‍🎓', color: C.green,  label: 'Étudiant'   },
  ADMIN_MESRS:{ emoji: '👨‍💼', color: C.navy,   label: 'Admin'      },
};

const TYPE_TITLE = {
  recteur: 'Recteurs', directeur: 'Directeurs',
  enseignant: 'Enseignants', etudiant: 'Étudiants',
};

const ArchivedUsers = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('type');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [hovCard, setHovCard] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [restoreDlg, setRestoreDlg] = useState({ open: false, entity: null });
  const [logDlg, setLogDlg] = useState({ open: false, entity: null });

  useEffect(() => { fetchArchivedUsers(); }, [page, rowsPerPage, search, userType]);

  const fetchArchivedUsers = async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: rowsPerPage, search: search.trim() };
      if (userType) params.role = userType.toUpperCase();
      
      const res = await api.get('/users/archived', { params });
      setUsers(res.data.users || []);
      setTotal(res.data.pagination?.total || 0);
    } catch {
      setSnackbar({ open: true, message: 'Erreur lors du chargement', severity: 'error' });
    } finally { setLoading(false); }
  };

  const handleRestore = (user) => {
    setRestoreDlg({
      open: true,
      entity: { id: user.numero_utilisateur, nom: `${user.prenom} ${user.nom}`.trim() },
    });
  };

  const pageTitle = userType ? `${TYPE_TITLE[userType] || 'Utilisateurs'} Archivés` : 'Utilisateurs Archivés';

  return (
    <Box>
      {/* ══ HEADER ════════════════════════════════ */}
      <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: '#fff', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 2, background: '#FEF3F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
            📦
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1F2937', mb: 0.5 }}>
              {pageTitle}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              {total > 0
                ? `${total} utilisateur${total > 1 ? 's' : ''} archivé${total > 1 ? 's' : ''} — consultez et restaurez les comptes désactivés`
                : 'Consultez et restaurez les utilisateurs archivés du système'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Retour au tableau de bord">
            <IconButton onClick={() => navigate('/dashboard/admin')}
              sx={{ width: 44, height: 44, borderRadius: '14px', background: '#F0F4FF', border: '2px solid #3B82F640', color: '#3B82F6',
                transition: 'all 0.3s ease',
                '&:hover': { background: '#3B82F620', transform: 'translateY(-2px)', boxShadow: '0 4px 12px #3B82F625' } }}>
              <ArrowBack sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ══ SEARCH ════════════════════════════════ */}
      <Card sx={{
        borderRadius: '22px', mb: 3, overflow: 'hidden',
        border: `1.5px solid ${C.blueL}`,
        boxShadow: `0 4px 24px rgba(26,58,107,0.07)`,
      }}>
        <CardContent sx={{ p: 3 }}>
          <TextField
            fullWidth size="small"
            placeholder="Rechercher par nom, email, téléphone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 17, color: '#B8C8D8' }} /></InputAdornment> }}
            sx={fieldSx}
          />
        </CardContent>
      </Card>

      {/* ══ CARDS LIST ════════════════════════════ */}
      <Card sx={{
        borderRadius: '22px', overflow: 'hidden',
        border: `1.5px solid ${C.blueL}`,
        boxShadow: `0 4px 24px rgba(26,58,107,0.07)`,
      }}>
        <CardContent sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
              <CircularProgress size={52} thickness={3} sx={{ color: C.blue }} />
              <Typography sx={{ color: C.slate, fontSize: '0.88rem' }}>Chargement...</Typography>
            </Box>
          ) : users.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Box sx={{
                width: 88, height: 88, borderRadius: '50%',
                background: C.blueL, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.5rem', mx: 'auto', mb: 2,
              }}>📦</Box>
              <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '1.1rem', mb: 0.5 }}>
                Aucun utilisateur archivé
              </Typography>
            </Box>
          ) : (
            <>
              <Grid container spacing={2.5}>
                {users.map((user, idx) => {
                  const rc = ROLE_CFG[user.type_utilisateur] || { emoji: '👤', color: C.blue, label: user.type_utilisateur };
                  const isHov = hovCard === idx;
                  
                  // Déterminer la couleur de la ligne selon le type d'utilisateur
                  const topLineGradient = user.type_utilisateur === 'RECTEUR' 
                    ? `linear-gradient(90deg, ${C.orange}, #FF8C5A)` 
                    : user.type_utilisateur === 'DIRECTEUR'
                    ? `linear-gradient(90deg, ${C.purple}, #9D4EDD)`
                    : user.type_utilisateur === 'ETUDIANT'
                    ? `linear-gradient(90deg, ${C.green}, #05C78D)`
                    : `linear-gradient(90deg, ${C.blue}, ${C.blueB})`;
                  
                  // Déterminer la couleur de fond de l'avatar selon le type d'utilisateur
                  const avatarBg = user.type_utilisateur === 'RECTEUR' 
                    ? '#FFE5CC' 
                    : user.type_utilisateur === 'DIRECTEUR'
                    ? '#E9D5FF'
                    : user.type_utilisateur === 'ETUDIANT'
                    ? '#D1FAE5'
                    : user.type_utilisateur === 'ENSEIGNANT'
                    ? '#BFDBFE'
                    : '#E3F2FD';

                  return (
                    <Grid item xs={12} sm={6} md={4} key={user.numero_utilisateur}>
                      <Card
                        onMouseEnter={() => setHovCard(idx)}
                        onMouseLeave={() => setHovCard(null)}
                        elevation={0}
                        sx={{
                          borderRadius: '18px', overflow: 'hidden',
                          border: `1.5px solid ${isHov ? C.slate + '50' : C.blueL}`,
                          boxShadow: isHov ? `0 16px 48px ${C.slate}18` : `0 2px 12px rgba(0,0,0,0.04)`,
                          transform: isHov ? 'translateY(-6px)' : 'none',
                          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                          opacity: 0.85,
                          position: 'relative',
                          // top accent bar
                          '&::before': {
                            content: '""', position: 'absolute',
                            top: 0, left: 0, right: 0, height: '3px',
                            background: topLineGradient,
                          },
                        }}
                      >
                        <CardContent sx={{ p: 2.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                            <Box sx={{
                              width: 52, height: 52, fontSize: '1.4rem',
                              borderRadius: '12px',
                              background: avatarBg,
                              boxShadow: `0 4px 14px ${rc.color}30`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              {rc.emoji}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.95rem', mb: 0.4 }}>
                                {user.nom} {user.prenom}
                              </Typography>
                              <Chip label={rc.label} size="small" sx={{ background: `${rc.color}12`, color: rc.color, fontWeight: 700, fontSize: '0.68rem', border: `1px solid ${rc.color}28`, borderRadius: '7px', height: 20 }} />
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <Typography sx={{ fontSize: '0.78rem' }}>📧</Typography>
                              <Typography sx={{ fontSize: '0.78rem', color: C.slate }}>{user.email}</Typography>
                            </Box>
                            {user.telephone && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <Typography sx={{ fontSize: '0.78rem' }}>📱</Typography>
                                <Typography sx={{ fontSize: '0.78rem', color: C.slate }}>{user.telephone}</Typography>
                              </Box>
                            )}
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: `1px solid ${C.blueL}` }}>
                            <Chip label="📦 Archivé" size="small" sx={{ background: `${C.slate}12`, color: C.slate, fontWeight: 700, fontSize: '0.7rem', borderRadius: '7px', height: 22 }} />
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Détails de l'archivage">
                                <IconButton size="small" onClick={() => setLogDlg({ open: true, entity: user })} sx={{
                                  width: 30, height: 30, borderRadius: '8px',
                                  background: '#EFF6FF', color: '#2563EB',
                                  transition: 'all 0.2s',
                                  '&:hover': { background: '#2563EB', color: '#fff', transform: 'scale(1.12)' },
                                }}>
                                  <InfoOutlined sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Restaurer">
                                <IconButton size="small" onClick={() => handleRestore(user)} sx={{
                                  width: 30, height: 30, borderRadius: '8px',
                                  background: `${C.green}10`, color: C.green,
                                  transition: 'all 0.2s',
                                  '&:hover': { background: `${C.green}20`, transform: 'scale(1.12)' },
                                }}>
                                  <Restore sx={{ fontSize: 14 }} />
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

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <TablePagination
                  component="div" count={total} page={page}
                  onPageChange={(e, p) => setPage(p)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                  rowsPerPageOptions={[6, 12, 24]}
                  labelRowsPerPage="Par page :"
                  labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ borderRadius: '12px', boxShadow: `0 4px 20px rgba(0,0,0,0.12)` }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <RestoreActionDialog
        open={restoreDlg.open}
        onClose={() => setRestoreDlg({ open: false, entity: null })}
        onSuccess={() => {
          setSnackbar({ open: true, message: `${restoreDlg.entity.nom} restauré`, severity: 'success' });
          fetchArchivedUsers();
        }}
        entityType="utilisateur"
        entityLabel="utilisateur"
        entity={restoreDlg.entity}
        restoreEndpoint={restoreDlg.entity ? `/users/${restoreDlg.entity.id}/restore` : ''}
        info={<>L'utilisateur pourra de nouveau se connecter à son compte.</>}
      />

      <ArchiveLogDialog
        open={logDlg.open}
        onClose={() => setLogDlg({ open: false, entity: null })}
        entityLabel="utilisateur"
        entityName={logDlg.entity ? `${logDlg.entity.prenom} ${logDlg.entity.nom}`.trim() : ''}
        logEndpoint={logDlg.entity ? `/users/${logDlg.entity.numero_utilisateur}/archive-log` : null}
      />
    </Box>
  );
};

export default ArchivedUsers;
