import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, TextField,
  Select, MenuItem, FormControl, Grid,
  IconButton, Chip, CircularProgress, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  keyframes, Alert, Snackbar, Tooltip,
} from '@mui/material';
import {
  Search, ArrowBack, Refresh, RestoreFromTrash,
} from '@mui/icons-material';
import api from '../services/api';
import { ConfirmWithPasswordDialog } from '../components/Archive';

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
  coral:  '#D85A30',
  slate:  '#64748B',
};

// ── KEYFRAMES ─────────────────────────────────────
const fadeUp = keyframes`
  from { opacity:0; transform:translateY(24px); }
  to   { opacity:1; transform:translateY(0); }
`;

const RecteurEtablissementsArchives = () => {
  const navigate = useNavigate();
  const [etablissements, setEtablissements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, onConfirm: null, subtitle: '' });
  
  // Filtres
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    page: 1,
    limit: 10
  });

  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  useEffect(() => {
    fetchEtablissements();
  }, [filters]);

  const fetchEtablissements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      // Ajouter le paramètre archived=true pour récupérer les établissements archivés
      params.append('archived', 'true');

      const response = await api.get(`/etablissements/recteur?${params}`);
      
      if (response.data.success) {
        setEtablissements(response.data.etablissements || []);
        setPagination({
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors du chargement des établissements archivés',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (id, nom) => {
    setConfirmDialog({
      open: true,
      subtitle: nom || '',
      onConfirm: async (password) => {
        const response = await api.patch(`/etablissements/${id}/restore`, { password });
        if (response.data.success) {
          setSnackbar({ open: true, message: 'Établissement restauré avec succès', severity: 'success' });
          fetchEtablissements();
        }
      },
    });
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const typeColors = {
    FACULTE: { bg: '#FEF3C7', color: '#F59E0B' },
    ECOLE: { bg: '#DBEAFE', color: '#3B82F6' },
    INSTITUT: { bg: '#FEF3C7', color: '#F59E0B' },
    ISET: { bg: '#F3E8FF', color: '#8B5CF6' },
  };

  return (
    <Box sx={{ animation: `${fadeUp} 0.5s ease-out` }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: '16px',
            background: '#FFF4E6', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
          }}>
            📦
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, color: C.navy, fontSize: '1.8rem', letterSpacing: '-0.5px', mb: 0.3, lineHeight: 1.2 }}>
              Établissements Archivés
            </Typography>
            <Typography sx={{ color: C.slate, fontSize: '0.95rem' }}>
              Historique des établissements archivés
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard/recteur/etablissements')}
            sx={{
              borderColor: '#E5E7EB', color: C.slate,
              px: 3, py: 1.2, borderRadius: '12px',
              fontWeight: 700, textTransform: 'none',
              border: '2px solid',
              '&:hover': { borderColor: C.blue, color: C.blue, border: '2px solid' },
            }}
          >
            Retour
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ borderRadius: '20px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                size="medium"
                placeholder="Rechercher un établissement archivé..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
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
                  '& input': { fontSize: '0.95rem', color: '#6B7280' },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <Select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: '12px', background: '#F9FAFB',
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover fieldset': { borderColor: '#E5E7EB' },
                    '&.Mui-focused fieldset': { borderColor: '#06B6D4', borderWidth: '1px' },
                    '&.Mui-focused': { background: '#fff' },
                    fontSize: '0.95rem', color: '#6B7280',
                  }}
                >
                  <MenuItem value="">Tous les types</MenuItem>
                  <MenuItem value="FACULTE">Faculté</MenuItem>
                  <MenuItem value="ECOLE">École</MenuItem>
                  <MenuItem value="INSTITUT">Institut</MenuItem>
                  <MenuItem value="ISET">ISET</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: C.blue }} />
        </Box>
      ) : (
        <Card sx={{ borderRadius: '20px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', position: 'relative' }}>
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #EF4444 0%, #F59E0B 100%)' }} />
          
          <TableContainer sx={{ mt: '4px' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'transparent' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                    CODE
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                    NOM
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                    TYPE
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                    DATE CRÉATION
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                    ACTIONS
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {etablissements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <Typography sx={{ color: C.slate, fontSize: '0.95rem' }}>
                        Aucun établissement archivé
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  etablissements.map((etab, index) => (
                    <TableRow key={etab.id_etablissement} sx={{ '&:hover': { background: '#F9FAFB' }, transition: 'background 0.2s', borderBottom: index === etablissements.length - 1 ? 'none' : '1px solid #F3F4F6' }}>
                      <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                        <Chip label={etab.code_etablissement} sx={{ background: '#FEE2E2', color: '#EF4444', fontWeight: 700, fontSize: '0.85rem', borderRadius: '8px', height: '32px' }} />
                      </TableCell>
                      <TableCell sx={{ py: 3, borderBottom: 'none', color: '#6B7280', fontWeight: 500, fontSize: '0.95rem' }}>
                        {etab.nom_etablissement}
                      </TableCell>
                      <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                        <Chip label={etab.type} size="small" sx={{ background: typeColors[etab.type]?.bg || '#FEF3C7', color: typeColors[etab.type]?.color || '#F59E0B', fontWeight: 700, fontSize: '0.75rem', borderRadius: '8px', textTransform: 'uppercase', height: '28px' }} />
                      </TableCell>
                      <TableCell sx={{ py: 3, borderBottom: 'none', color: '#6B7280', fontWeight: 500, fontSize: '0.9rem' }}>
                        {etab.date_creation ? new Date(etab.date_creation).toLocaleDateString('fr-FR') : '-'}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 3, borderBottom: 'none' }}>
                        <Tooltip title="Restaurer">
                          <IconButton 
                            size="small" 
                            onClick={() => handleRestore(etab.id_etablissement, etab.nom_etablissement)}
                            sx={{ 
                              width: 36, 
                              height: 36, 
                              background: '#D1FAE5', 
                              color: '#10B981', 
                              '&:hover': { background: '#A7F3D0', color: '#059669' } 
                            }}
                          >
                            <RestoreFromTrash fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <ConfirmWithPasswordDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(p => ({ ...p, open: false }))}
        onConfirm={confirmDialog.onConfirm || (() => {})}
        title="Restaurer l'établissement"
        subtitle={confirmDialog.subtitle}
        gradient={['#10B981', '#059669']}
        warning="L'établissement redeviendra visible et actif. Confirmez avec votre mot de passe administrateur."
        actionLabel="Confirmer la restauration"
      />
    </Box>
  );
};

export default RecteurEtablissementsArchives;
