import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Grid,
  Chip, IconButton, InputAdornment, CircularProgress,
  Tooltip, Alert, Snackbar, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, keyframes,
} from '@mui/material';
import {
  Search, ArrowBack, Visibility,
} from '@mui/icons-material';
import api from '../services/api';

// ── PALETTE ───────────────────────────────────────
const C = {
  navy:   '#1A3A6B',
  blue:   '#4D9FFF',
  blueB:  '#85BFFF',
  blueL:  '#EAF4FF',
  orange: '#FF6B35',
  green:  '#06D6A0',
  yellow: '#FFD60A',
  purple: '#7B2CBF',
  slate:  '#64748B',
};

// ── KEYFRAMES ─────────────────────────────────────
const fadeUp = keyframes`
  from { opacity:0; transform:translateY(24px); }
  to   { opacity:1; transform:translateY(0); }
`;

const DirecteurDepartements = () => {
  const navigate = useNavigate();
  const [departements, setDepartements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    total_departements: 0,
    total_niveaux: 0,
    total_specialites: 0,
    total_etudiants: 0,
    total_enseignants: 0,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchDepartements(); }, [page, search]); // eslint-disable-line

  const fetchStats = async () => {
    try {
      const res = await api.get('/directeur/departements/stats');
      if (res.data.success) setStats(res.data.stats);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const fetchDepartements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/directeur/departements', {
        params: { page, limit: rowsPerPage, search: search.trim() },
      });
      if (res.data.success) {
        setDepartements(res.data.departements || []);
        const tot = res.data.pagination?.total || 0;
        setTotal(tot);
        setTotalPages(Math.ceil(tot / rowsPerPage));
      }
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbar({ open: true, message: 'Erreur lors du chargement des départements', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <Box sx={{ animation: `${fadeUp} 0.5s ease-out` }}>

      {/* ── HEADER ─────────────────────────────────── */}
      <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: '#fff', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 2, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
            🏛️
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1F2937', mb: 0.5 }}>
              Gestion des Départements
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              {total > 0
                ? `${total} département${total > 1 ? 's' : ''} — Gérez les départements de votre établissement`
                : 'Gérez les départements de votre établissement'}
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Retour au tableau de bord">
          <IconButton
            onClick={() => navigate('/dashboard/directeur')}
            sx={{
              width: 44, height: 44, borderRadius: '14px',
              background: '#F0F4FF', border: '2px solid #3B82F640', color: '#3B82F6',
              transition: 'all 0.3s ease',
              '&:hover': { background: '#3B82F620', transform: 'translateY(-2px)', boxShadow: '0 4px 12px #3B82F625' },
            }}
          >
            <ArrowBack sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── STATS CARDS ────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Départements', value: stats.total_departements, icon: '🏛️', color: C.blue,   bg: `linear-gradient(135deg, ${C.blue}08, #EFF6FF)` },
          { label: 'Niveaux',      value: stats.total_niveaux,      icon: '📚', color: C.green,  bg: `linear-gradient(135deg, ${C.green}08, #E6FBF5)` },
          { label: 'Spécialités',  value: stats.total_specialites,  icon: '🎓', color: C.orange, bg: `linear-gradient(135deg, ${C.orange}08, #FFF1EE)` },
          { label: 'Étudiants',    value: stats.total_etudiants,    icon: '👨‍🎓', color: C.purple, bg: `linear-gradient(135deg, ${C.purple}08, #F5F0FF)` },
        ].map((s, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ borderRadius: 3, border: '1.5px solid #EAF4FF', background: s.bg }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                    {s.icon}
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {s.label}
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: C.navy }}>
                  {s.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── FILTER ─────────────────────────────────── */}
      <Card sx={{ borderRadius: '20px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', mb: 3, background: '#fff' }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={10}>
              <TextField
                fullWidth
                size="medium"
                placeholder="Rechercher un département..."
                value={search}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#06B6D4', fontSize: 24 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px', background: '#F9FAFB',
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover fieldset': { borderColor: '#E5E7EB' },
                    '&.Mui-focused fieldset': { borderColor: '#06B6D4', borderWidth: '1px' },
                    '&.Mui-focused': { background: '#fff' },
                  },
                  '& input': {
                    fontSize: '0.95rem', color: '#6B7280',
                    '&::placeholder': { color: '#9CA3AF', opacity: 1 },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                onClick={() => { setSearch(''); setPage(1); }}
                sx={{
                  height: '56px', borderRadius: '12px', color: '#9CA3AF',
                  fontSize: '0.9rem', textTransform: 'none', fontWeight: 500,
                  '&:hover': { background: '#F9FAFB', color: '#6B7280' },
                }}
              >
                ✕ Effacer
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ── TABLE ──────────────────────────────────── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: C.blue }} />
        </Box>
      ) : departements.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Box sx={{ width: 88, height: 88, borderRadius: '50%', background: C.blueL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', mx: 'auto', mb: 2 }}>
            🔍
          </Box>
          <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '1.1rem', mb: 0.5 }}>
            Aucun département trouvé
          </Typography>
          <Typography sx={{ color: C.slate, fontSize: '0.85rem' }}>
            Essayez de modifier vos critères de recherche
          </Typography>
        </Box>
      ) : (
        <Card sx={{ borderRadius: '20px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', position: 'relative', background: '#fff' }}>
          {/* Colored top border */}
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${C.navy} 0%, ${C.blue} 100%)` }} />

          <TableContainer sx={{ mt: '4px' }}>
            <Table>
              <TableHead>
                <TableRow>
                  {['CODE', 'NOM', 'NIVEAUX', 'SPÉCIALITÉS', 'ÉTUDIANTS', 'ENSEIGNANTS', 'ACTIONS'].map((h, i) => (
                    <TableCell key={i} align={h === 'ACTIONS' ? 'center' : 'left'} sx={{
                      fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      borderBottom: '1px solid #F3F4F6', py: 2,
                    }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {departements.map((dept, index) => (
                  <TableRow
                    key={dept.id_departement}
                    sx={{
                      '&:hover': { background: '#F9FAFB' },
                      transition: 'background 0.2s',
                      borderBottom: index === departements.length - 1 ? 'none' : '1px solid #F3F4F6',
                    }}
                  >
                    {/* CODE */}
                    <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                      <Chip
                        label={dept.code_departement}
                        sx={{
                          background: '#EFF6FF', color: '#2563EB',
                          fontWeight: 700, fontSize: '0.85rem',
                          borderRadius: '8px', height: '32px',
                        }}
                      />
                    </TableCell>

                    {/* NOM */}
                    <TableCell sx={{ py: 3, borderBottom: 'none', color: '#1F2937', fontWeight: 500, fontSize: '0.95rem' }}>
                      {dept.nom_departement}
                    </TableCell>

                    {/* NIVEAUX */}
                    <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                      <Box>
                        <Typography sx={{ color: '#1F2937', fontWeight: 600, fontSize: '0.95rem' }}>
                          {dept.nombre_niveaux}
                        </Typography>
                        <Box sx={{ width: '60px', height: '3px', background: '#E5E7EB', borderRadius: '2px', mt: 0.5, position: 'relative', overflow: 'hidden' }}>
                          <Box sx={{
                            position: 'absolute', left: 0, top: 0, bottom: 0,
                            width: `${Math.min((dept.nombre_niveaux / 10) * 100, 100)}%`,
                            background: C.blue, borderRadius: '2px',
                          }} />
                        </Box>
                      </Box>
                    </TableCell>

                    {/* SPÉCIALITÉS */}
                    <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                      <Box>
                        <Typography sx={{ color: '#1F2937', fontWeight: 600, fontSize: '0.95rem' }}>
                          {dept.nombre_specialites}
                        </Typography>
                        <Box sx={{ width: '60px', height: '3px', background: '#E5E7EB', borderRadius: '2px', mt: 0.5, position: 'relative', overflow: 'hidden' }}>
                          <Box sx={{
                            position: 'absolute', left: 0, top: 0, bottom: 0,
                            width: `${Math.min((dept.nombre_specialites / 20) * 100, 100)}%`,
                            background: C.purple, borderRadius: '2px',
                          }} />
                        </Box>
                      </Box>
                    </TableCell>

                    {/* ÉTUDIANTS */}
                    <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                      <Box>
                        <Typography sx={{ color: '#1F2937', fontWeight: 600, fontSize: '0.95rem' }}>
                          {dept.nombre_etudiants}
                        </Typography>
                        <Box sx={{ width: '60px', height: '3px', background: '#E5E7EB', borderRadius: '2px', mt: 0.5, position: 'relative', overflow: 'hidden' }}>
                          <Box sx={{
                            position: 'absolute', left: 0, top: 0, bottom: 0,
                            width: `${Math.min((dept.nombre_etudiants / (stats.total_etudiants || 1)) * 100, 100)}%`,
                            background: C.green, borderRadius: '2px',
                          }} />
                        </Box>
                      </Box>
                    </TableCell>

                    {/* ENSEIGNANTS */}
                    <TableCell sx={{ py: 3, borderBottom: 'none', color: '#6B7280', fontWeight: 500, fontSize: '0.95rem' }}>
                      {dept.nombre_enseignants}
                    </TableCell>

                    {/* ACTIONS */}
                    <TableCell align="center" sx={{ py: 3, borderBottom: 'none' }}>
                      <Tooltip title="Voir les détails">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/dashboard/directeur/departements/${dept.id_departement}`)}
                          sx={{
                            width: 48, height: 48, borderRadius: '14px',
                            background: '#DBEAFE', color: '#2563EB',
                            transition: 'all 0.2s',
                            '&:hover': {
                              background: '#BFDBFE',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                            },
                          }}
                        >
                          <Visibility sx={{ fontSize: 22 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, borderTop: `1px solid ${C.blueL}` }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button
                size="small"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                sx={{ borderRadius: '8px', textTransform: 'none', color: C.navy, '&:disabled': { color: C.slate } }}
              >
                Précédent
              </Button>
              <Typography sx={{ px: 2, color: C.slate, fontSize: '0.9rem' }}>
                Page {page} sur {totalPages || 1}
              </Typography>
              <Button
                size="small"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                sx={{ borderRadius: '8px', textTransform: 'none', color: C.navy, '&:disabled': { color: C.slate } }}
              >
                Suivant
              </Button>
            </Box>
          </Box>
        </Card>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: '12px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DirecteurDepartements;
