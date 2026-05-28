import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TablePagination,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Grid, Chip, IconButton, InputAdornment, CircularProgress,
  Button, Dialog, Tooltip, Alert, Snackbar, keyframes,
} from '@mui/material';
import {
  Search, FilterList, Visibility,
  Close, Email, Phone, LocationOn,
  Business, CalendarToday, ArrowBack, School,
} from '@mui/icons-material';
import api from '../services/api';

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

// ── ROLE CONFIG ───────────────────────────────────
const ROLE_CFG = {
  DIRECTEUR:  { emoji: '👨‍💼', color: C.purple, label: 'Directeur'  },
  ENSEIGNANT: { emoji: '👨‍🏫', color: C.blue,   label: 'Enseignant' },
  ETUDIANT:   { emoji: '👨‍🎓', color: C.green, bgColor: '#E8F8F5', label: 'Étudiant'   },
};

const STATUS_CFG = {
  ACTIF:    { bg: `${C.green}12`,  color: C.green,  label: '● Actif',    dot: C.green  },
  INACTIF:  { bg: `${C.orange}12`, color: C.orange, label: '◐ Inactif',  dot: C.orange },
  SUSPENDU: { bg: `${C.red}10`,    color: C.red,    label: '✕ Suspendu', dot: C.red    },
};

// ── FIELD STYLE ───────────────────────────────────
const getFieldSx = (roleFilter) => {
  const accentColor = roleFilter === 'DIRECTEUR' ? C.purple : (roleFilter === 'ETUDIANT' ? C.green : C.blue);
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
const RecteurUserManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get('role')?.toUpperCase() || '';
  
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [total, setTotal]           = useState(0);
  const [filters, setFilters]       = useState({
    search: '', role: roleFromUrl, statut: '', etablissement: '',
  });
  const [filterOptions, setFilterOptions] = useState({ roles: [], statuts: [], etablissements: [] });
  const [selectedUser, setSelectedUser]   = useState(null);
  const [detailsOpen, setDetailsOpen]     = useState(false);
  const [hovCard, setHovCard]             = useState(null);
  const [snackbar, setSnackbar]           = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => { fetchFilterOptions(); }, []);
  useEffect(() => { fetchUsers(); }, [page, rowsPerPage, filters]);

  const fetchFilterOptions = async () => {
    try {
      const res = await api.get('/users/recteur/filter-options');
      setFilterOptions({
        roles: res.data.roles || [],
        statuts: res.data.statuts || [],
        etablissements: res.data.etablissements || [],
      });
    } catch {}
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const clean = Object.entries(filters).reduce((acc, [k, v]) => { 
        if (v !== '' && v != null) acc[k] = typeof v === 'string' ? v.trim() : v; 
        return acc; 
      }, {});
      const res = await api.get('/users/recteur', { params: { page: page + 1, limit: rowsPerPage, ...clean } });
      setUsers(res.data.users || []);
      setTotal(res.data.pagination?.total || 0);
    } catch {
      setSnackbar({ open: true, message: 'Erreur lors du chargement des utilisateurs', severity: 'error' });
    } finally { setLoading(false); }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const getRoleLabel = () => {
    if (filters.role === 'DIRECTEUR') return 'Directeurs';
    if (filters.role === 'ENSEIGNANT') return 'Enseignants';
    if (filters.role === 'ETUDIANT') return 'Étudiants';
    return 'Utilisateurs';
  };

  const getRoleDescription = () => {
    if (filters.role === 'DIRECTEUR') return 'Gérez les directeurs des établissements de votre rectorat';
    if (filters.role === 'ENSEIGNANT') return 'Gérez les enseignants de votre rectorat';
    if (filters.role === 'ETUDIANT') return 'Gérez les étudiants de votre rectorat';
    return 'Gérez les directeurs, enseignants et étudiants de votre rectorat';
  };

  const roleCfg = ROLE_CFG[filters.role] || { emoji: '👥', color: C.blue };
  const accentColor = roleCfg.color || C.blue;
  const fieldSx = getFieldSx(filters.role);

  return (
    <Box>

      {/* ══ HEADER ════════════════════════════════ */}
      <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: '#fff', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: 2,
            background: filters.role === 'DIRECTEUR' ? '#F3E8FF' : (filters.role === 'ETUDIANT' ? '#E8F8F5' : (filters.role === 'ENSEIGNANT' ? '#DBEAFE' : '#EFF6FF')),
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
          }}>{roleCfg.emoji || '👥'}</Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1F2937', mb: 0.5 }}>
              Gestion des {getRoleLabel()}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              {total > 0
                ? `${total} ${getRoleLabel().toLowerCase()} — ${getRoleDescription()}`
                : getRoleDescription()}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Retour au tableau de bord">
            <IconButton onClick={() => navigate('/dashboard/recteur')}
              sx={{ width: 44, height: 44, borderRadius: '14px', background: '#F0F4FF', border: '2px solid #3B82F640', color: '#3B82F6',
                transition: 'all 0.3s ease',
                '&:hover': { background: '#3B82F620', transform: 'translateY(-2px)', boxShadow: '0 4px 12px #3B82F625' } }}>
              <ArrowBack sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ══ FILTRES ═══════════════════════════════ */}
      <Card sx={{
        borderRadius: '22px', mb: 3, overflow: 'hidden',
        border: `1.5px solid ${C.blueL}`,
        boxShadow: `0 4px 24px rgba(26,58,107,0.07)`,
      }}>
        <Box sx={{ 
          height: 3, 
          background: filters.role === 'DIRECTEUR' 
            ? `linear-gradient(90deg, ${C.purple}, #9D4EDD, ${C.purple})` 
            : filters.role === 'ETUDIANT'
            ? `linear-gradient(90deg, ${C.green}, #05C78D, ${C.green})`
            : `linear-gradient(90deg, ${C.blue}, ${C.blueB}, ${C.blue})`, 
          backgroundSize: '300% auto' 
        }} />
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box sx={{ 
                width: 32, height: 32, borderRadius: '9px', 
                background: filters.role === 'DIRECTEUR' ? '#F5F3FF' : (filters.role === 'ETUDIANT' ? '#ECFDF5' : '#F0F7FF'), 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                boxShadow: filters.role === 'DIRECTEUR' ? `0 3px 10px ${C.purple}30` : (filters.role === 'ETUDIANT' ? `0 3px 10px ${C.green}30` : `0 3px 10px ${C.blue}30`)
              }}>
                <FilterList sx={{ color: filters.role === 'DIRECTEUR' ? C.purple : (filters.role === 'ETUDIANT' ? C.green : C.blueD), fontSize: 16 }} />
              </Box>
              <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.95rem' }}>Filtres de recherche</Typography>
            </Box>
          </Box>

          <Grid container spacing={2}>
            {/* Search */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth size="small"
                placeholder="Rechercher par nom, email, téléphone..."
                value={filters.search}
                onChange={(e) => { setFilters(p => ({ ...p, search: e.target.value })); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 17, color: '#B8C8D8' }} /></InputAdornment> }}
                sx={fieldSx}
              />
            </Grid>

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
                <InputLabel>Établissement</InputLabel>
                <Select value={filters.etablissement} label="Établissement" onChange={(e) => { setFilters(p => ({ ...p, etablissement: e.target.value })); setPage(0); }}>
                  <MenuItem value="">Tous les établissements</MenuItem>
                  {filterOptions.etablissements.map(e => <MenuItem key={e.id_etablissement} value={e.id_etablissement}>{e.nom_etablissement}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ══ CARDS LIST ════════════════════════════ */}
      <Box sx={{ mb: 3 }}>
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
                          '&::before': {
                            content: '""', position: 'absolute',
                            top: 0, left: 0, right: 0, height: '3px',
                            background: user.type_utilisateur === 'DIRECTEUR' 
                              ? `linear-gradient(90deg, ${C.purple}, #9D4EDD)` 
                              : user.type_utilisateur === 'ETUDIANT'
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
                                background: user.type_utilisateur === 'DIRECTEUR' ? '#E9D5FF' : (user.type_utilisateur === 'ETUDIANT' ? '#D1FAE5' : '#BFDBFE'),
                                boxShadow: `0 4px 14px ${rc.color}30`,
                                transition: 'transform 0.3s ease',
                                transform: isHov ? 'scale(1.08) rotate(5deg)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                {rc.emoji}
                              </Box>
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
                            <Tooltip title="Voir détails">
                              <IconButton size="small" onClick={() => handleViewDetails(user)} sx={{
                                width: 30, height: 30, borderRadius: '8px',
                                background: C.blueL, color: C.blueD,
                                transition: 'all 0.2s',
                                '&:hover': { background: `${C.blue}22`, transform: 'scale(1.12)' },
                              }}>
                                <Visibility sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
            </Grid>

            {/* Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                labelRowsPerPage="Par page:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
              />
            </Box>
          </>
        )}
      </Box>

      {/* ══ DETAILS DIALOG ════════════════════════ */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            overflow: 'hidden',
            border: `1.5px solid ${C.blueL}`,
          }
        }}
      >
        {selectedUser && (() => {
          const rc = ROLE_CFG[selectedUser.type_utilisateur] || { emoji: '👤', color: C.blue, label: selectedUser.type_utilisateur };
          const sc = STATUS_CFG[selectedUser.statut] || STATUS_CFG.INACTIF;
          const detailAccent = filters.role === 'DIRECTEUR' ? C.purple : (filters.role === 'ETUDIANT' ? C.green : C.blue);
          const detailBgLight = filters.role === 'DIRECTEUR' ? '#F5F3FF' : (filters.role === 'ETUDIANT' ? '#ECFDF5' : C.blueL);
          const detailBgGrad = filters.role === 'DIRECTEUR' ? 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)' : (filters.role === 'ETUDIANT' ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' : `linear-gradient(135deg, ${C.blueL} 0%, #D6EEFF 100%)`);
          
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

              <Box sx={{ p: 3, background: '#FAFCFF' }}>
                {/* Matricule badge */}
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8, mb: 2.5, background: detailBgLight, border: `1px solid ${detailAccent}22`, borderRadius: '8px', px: 1.5, py: 0.5 }}>
                  <Typography sx={{ fontSize: '0.65rem', color: '#9BAAB8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Matricule</Typography>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: detailAccent, fontFamily: 'monospace' }}>#{selectedUser.numero_utilisateur}</Typography>
                </Box>

                <Grid container spacing={0.5}>
                  <Grid item xs={12} sm={6}>
                    <InfoRow icon={<Email />} label="Email" value={selectedUser.email} accent={detailAccent} />
                    <InfoRow icon={<Phone />} label="Téléphone" value={selectedUser.telephone} accent={detailAccent} />
                    <InfoRow icon={<LocationOn />} label="Ville" value={selectedUser.nom_ville} accent={detailAccent} />
                    <InfoRow icon={<LocationOn />} label="Région" value={selectedUser.nom_region} accent={detailAccent} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow icon={<Business />} label="Établissement" value={selectedUser.nom_etablissement} accent={detailAccent} />
                    <InfoRow icon={<School />} label="Université" value={selectedUser.nom_rectorat} accent={detailAccent} />
                    <InfoRow icon={<CalendarToday />} label="Création" value={selectedUser.date_creation ? new Date(selectedUser.date_creation).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : null} accent={detailAccent} />
                  </Grid>
                </Grid>

                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 1.5, mt: 3, pt: 2.5, borderTop: `1px solid ${C.blueL}` }}>
                  <Button fullWidth onClick={() => setDetailsOpen(false)} sx={{
                    borderRadius: '12px', textTransform: 'none', fontWeight: 700, color: C.navy, border: `1.5px solid ${C.blueL}`,
                    '&:hover': { background: C.blueL, borderColor: `${C.blue}50` },
                  }}>Fermer</Button>
                </Box>
              </Box>
            </>
          );
        })()}
      </Dialog>

      {/* ══ SNACKBAR ══════════════════════════════ */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RecteurUserManagement;
