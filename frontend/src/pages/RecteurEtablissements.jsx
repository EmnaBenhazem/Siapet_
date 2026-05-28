import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, TextField,
  Select, MenuItem, FormControl, Grid,
  Dialog, IconButton, Chip, CircularProgress, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  keyframes, Alert, Snackbar, Tooltip,
} from '@mui/material';
import {
  Search, Visibility, ArrowBack, Refresh, FileDownload,
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
  coral:  '#D85A30',
  slate:  '#64748B',
};

// ── KEYFRAMES ─────────────────────────────────────
const fadeUp = keyframes`
  from { opacity:0; transform:translateY(24px); }
  to   { opacity:1; transform:translateY(0); }
`;
const popIn = keyframes`
  from { opacity:0; transform:scale(0.88); }
  to   { opacity:1; transform:scale(1); }
`;

const RecteurEtablissements = () => {
  const navigate = useNavigate();
  const [etablissements, setEtablissements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
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
    fetchStats();
  }, [filters]);

  const fetchEtablissements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await api.get(`/etablissements/recteur?${params}`);

      if (response.data.success) {
        console.log('Établissements reçus:', response.data.etablissements);
        setEtablissements(response.data.etablissements);
        setPagination({
          total: response.data.total,
          totalPages: response.data.totalPages
        });
      }
    } catch (error) {
      console.error('Erreur chargement établissements:', error);
      setSnackbar({ 
        open: true, 
        message: `Erreur: ${error.response?.data?.message || error.message}`, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/etablissements/recteur/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleViewDetail = async (id) => {
    navigate(`/dashboard/recteur/etablissements/${id}`);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);

      const response = await api.get(`/etablissements/recteur/export?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `etablissements_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // Libérer la mémoire
      setSnackbar({ open: true, message: '✅ Export réussi', severity: 'success' });
    } catch (error) {
      console.error('❌ Erreur export:', error);
      setSnackbar({ 
        open: true, 
        message: `❌ Erreur lors de l'export: ${error.response?.data?.message || error.message}`, 
        severity: 'error' 
      });
    }
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
      <Box sx={{ 
        mb: 4, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: 2 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Icon */}
          <Box sx={{
            width: 64,
            height: 64,
            borderRadius: '16px',
            background: '#FFF4E6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
          }}>
            🏫
          </Box>
          {/* Title & Description */}
          <Box>
            <Typography sx={{ 
              fontWeight: 900, 
              color: C.navy, 
              fontSize: '1.8rem', 
              letterSpacing: '-0.5px', 
              mb: 0.3,
              lineHeight: 1.2,
            }}>
              Gestion des Établissements
            </Typography>
            <Typography sx={{ color: C.slate, fontSize: '0.95rem' }}>
              Consultez les établissements de votre rectorat
            </Typography>
          </Box>
        </Box>

        {/* Buttons on the right */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => navigate('/dashboard/recteur')}
            sx={{
              width: 44,
              height: 44,
              borderRadius: '14px',
              background: C.blueL,
              border: `2px solid ${C.blue}40`,
              color: C.blue,
              transition: 'all 0.3s ease',
              '&:hover': {
                background: `${C.blue}20`,
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 12px ${C.blue}25`,
              },
            }}
          >
            <ArrowBack sx={{ fontSize: 20 }} />
          </IconButton>
          <IconButton
            onClick={handleExport}
            sx={{
              width: 44,
              height: 44,
              borderRadius: '14px',
              background: '#F0FDF4',
              border: '2px solid #86EFAC',
              color: C.green,
              transition: 'all 0.3s ease',
              '&:hover': {
                background: '#DCFCE7',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(6, 214, 160, 0.25)',
              },
            }}
          >
            <FileDownload sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { 
              label: 'TOTAL ÉTABLISSEMENTS', 
              value: stats.total_etablissements || '0', 
              icon: '🏫', 
              color: '#FF6B35',
              change: '+2 nouveaux',
              changePositive: true
            },
            { 
              label: 'FACULTÉS', 
              value: stats.total_facultes || '0', 
              icon: '🎓', 
              color: '#06D6A0',
              change: '+1 nouvelle faculté',
              changePositive: true
            },
            { 
              label: 'ÉCOLES & INSTITUTS', 
              value: (parseInt(stats.total_ecoles || 0) + parseInt(stats.total_instituts || 0) + parseInt(stats.total_isets || 0)).toString(), 
              icon: '🏛️', 
              color: '#7B2CBF',
              change: '+3 vs mois dernier',
              changePositive: true
            },
            { 
              label: 'BUDGET TOTAL', 
              value: stats.budget_total ? `${(parseFloat(stats.budget_total) / 1000000).toFixed(1)}M TND` : '0 TND', 
              icon: '💰', 
              color: '#FFD60A',
              change: '+8.5% vs année dernière',
              changePositive: true
            },
          ].map((stat, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card sx={{
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                animation: `${popIn} 0.4s ease-out ${i * 0.1}s both`,
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                background: '#fff',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 28px ${stat.color}30`,
                },
              }}>
                {/* Colored top border */}
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '5px',
                  background: stat.color,
                }} />
                
                <CardContent sx={{ p: 3, pt: 3.5 }}>
                  {/* Header with label and icon */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    mb: 2.5 
                  }}>
                    <Typography sx={{ 
                      fontSize: '0.7rem', 
                      color: '#9CA3AF', 
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      lineHeight: 1.3,
                    }}>
                      {stat.label}
                    </Typography>
                    <Box sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      background: `${stat.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                    }}>
                      {stat.icon}
                    </Box>
                  </Box>

                  {/* Main value */}
                  <Typography sx={{ 
                    fontSize: '2.8rem', 
                    fontWeight: 900, 
                    color: '#1F2937', 
                    mb: 2,
                    lineHeight: 1,
                  }}>
                    {stat.value}
                  </Typography>

                  {/* Change indicator */}
                  <Box sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1.5,
                    py: 0.6,
                    borderRadius: '8px',
                    background: stat.changePositive ? `${stat.color}15` : '#FEE2E2',
                  }}>
                    <Typography sx={{ 
                      fontSize: '0.75rem', 
                      color: stat.changePositive ? stat.color : '#EF4444',
                      fontWeight: 600,
                    }}>
                      ↗ {stat.change}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{
        borderRadius: '20px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        mb: 3,
        background: '#fff',
      }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                size="medium"
                name="search"
                placeholder="Rechercher un établissement..."
                value={filters.search}
                onChange={handleFilterChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#06B6D4', fontSize: 24 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    background: '#F9FAFB',
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover fieldset': { borderColor: '#E5E7EB' },
                    '&.Mui-focused fieldset': { borderColor: '#06B6D4', borderWidth: '1px' },
                    '&.Mui-focused': { background: '#fff' },
                  },
                  '& input': {
                    fontSize: '0.95rem',
                    color: '#6B7280',
                    '&::placeholder': {
                      color: '#9CA3AF',
                      opacity: 1,
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="medium">
                <Select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  displayEmpty
                  sx={{
                    borderRadius: '12px',
                    background: '#F9FAFB',
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover fieldset': { borderColor: '#E5E7EB' },
                    '&.Mui-focused fieldset': { borderColor: '#06B6D4', borderWidth: '1px' },
                    '& .MuiSelect-select': {
                      color: filters.type ? '#374151' : '#9CA3AF',
                      fontSize: '0.95rem',
                    },
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
            <Grid item xs={12} md={1}>
              <Button
                fullWidth
                onClick={() => setFilters({ search: '', type: '', page: 1, limit: 10 })}
                sx={{
                  height: '56px',
                  borderRadius: '12px',
                  color: '#9CA3AF',
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    background: '#F9FAFB',
                    color: '#6B7280',
                  },
                }}
              >
                ✕ Effacer
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: C.blue }} />
        </Box>
      ) : (
        <Card sx={{
          borderRadius: '20px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          position: 'relative',
          background: '#fff',
        }}>
          {/* Colored top border */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #2563EB 0%, #06B6D4 100%)',
          }} />
          
          <TableContainer sx={{ mt: '4px' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'transparent' }}>
                  <TableCell sx={{ 
                    fontWeight: 700, 
                    color: '#9CA3AF', 
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '1px solid #F3F4F6',
                    py: 2,
                  }}>
                    CODE
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 700, 
                    color: '#9CA3AF', 
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '1px solid #F3F4F6',
                    py: 2,
                  }}>
                    NOM
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 700, 
                    color: '#9CA3AF', 
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '1px solid #F3F4F6',
                    py: 2,
                  }}>
                    TYPE
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 700, 
                    color: '#9CA3AF', 
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '1px solid #F3F4F6',
                    py: 2,
                  }}>
                    EFFECTIF
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 700, 
                    color: '#9CA3AF', 
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '1px solid #F3F4F6',
                    py: 2,
                  }}>
                    CAPACITÉ
                  </TableCell>
                  <TableCell align="center" sx={{ 
                    fontWeight: 700, 
                    color: '#9CA3AF', 
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '1px solid #F3F4F6',
                    py: 2,
                  }}>
                    ACTIONS
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {etablissements.map((etab, index) => (
                  <TableRow
                    key={etab.id_etablissement}
                    sx={{
                      '&:hover': { background: '#F9FAFB' },
                      transition: 'background 0.2s',
                      borderBottom: index === etablissements.length - 1 ? 'none' : '1px solid #F3F4F6',
                    }}
                  >
                    <TableCell sx={{ 
                      py: 3,
                      borderBottom: 'none',
                    }}>
                      <Chip
                        label={etab.code_etablissement}
                        sx={{
                          background: '#EFF6FF',
                          color: '#2563EB',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          borderRadius: '8px',
                          height: '32px',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ 
                      py: 3,
                      borderBottom: 'none',
                      color: '#1F2937',
                      fontWeight: 500,
                      fontSize: '0.95rem',
                    }}>
                      {etab.nom_etablissement}
                    </TableCell>
                    <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                      <Chip
                        label={etab.type}
                        size="small"
                        sx={{
                          background: typeColors[etab.type]?.bg || '#FEF3C7',
                          color: typeColors[etab.type]?.color || '#F59E0B',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          borderRadius: '8px',
                          textTransform: 'uppercase',
                          height: '28px',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                      <Box>
                        <Typography sx={{ 
                          color: '#1F2937', 
                          fontWeight: 700,
                          fontSize: '1rem',
                          mb: 0.5,
                        }}>
                          {etab.effectif_total || 0}
                        </Typography>
                        <Box sx={{
                          width: '50px',
                          height: '3px',
                          background: '#F59E0B',
                          borderRadius: '2px',
                        }} />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ 
                      py: 3,
                      borderBottom: 'none',
                      color: '#6B7280',
                      fontWeight: 500,
                      fontSize: '0.95rem',
                    }}>
                      {etab.capacite_maximale || '-'}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 3, borderBottom: 'none' }}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Voir détails">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetail(etab.id_etablissement)}
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '10px',
                              background: '#DBEAFE',
                              color: '#3B82F6',
                              '&:hover': { 
                                background: '#BFDBFE', 
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                              },
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Visibility sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
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
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RecteurEtablissements;
