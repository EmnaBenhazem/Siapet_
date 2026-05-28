import React, { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
} from '@mui/material';
import { keyframes } from '@mui/system';
import { Close } from '@mui/icons-material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../../services/api';

const C = {
  navy: '#1A3A6B',
  blue: '#4D9FFF',
  blueL: '#EAF4FF',
  orange: '#FF6B35',
  green: '#06D6A0',
  purple: '#7B2CBF',
};

const popIn = keyframes`
  from { opacity:0; transform:scale(0.6) translateY(16px); }
  to   { opacity:1; transform:scale(1)   translateY(0);    }
`;

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFB088', '#C7CEEA', '#95E1D3'];

const InteractiveRegionMap = () => {
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionDetails, setRegionDetails] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const res = await api.get('/admin/dashboard/regions');
      if (res.data.success) {
        setRegions(res.data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des régions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegionDetails = async (regionId) => {
    setDetailsLoading(true);
    try {
      const res = await api.get(`/admin/dashboard/regions/${regionId}`);
      if (res.data.success) {
        setRegionDetails(res.data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleRegionClick = (region) => {
    setSelectedRegion(region);
    setDialogOpen(true);
    fetchRegionDetails(region.id_region);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRegion(null);
    setRegionDetails(null);
  };

  const getRegionColor = (statut) => {
    switch (statut) {
      case 'excellent':
        return C.green;
      case 'bon':
        return C.blue;
      case 'risque':
        return C.orange;
      default:
        return C.blue;
    }
  };

  // Positions approximatives des régions tunisiennes
  const regionPositions = {
    'Tunis': { x: '50%', y: '20%' },
    'Ariana': { x: '55%', y: '18%' },
    'Ben Arous': { x: '52%', y: '25%' },
    'Manouba': { x: '45%', y: '22%' },
    'Nabeul': { x: '65%', y: '28%' },
    'Zaghouan': { x: '58%', y: '32%' },
    'Bizerte': { x: '48%', y: '12%' },
    'Béja': { x: '42%', y: '28%' },
    'Jendouba': { x: '35%', y: '25%' },
    'Le Kef': { x: '38%', y: '32%' },
    'Siliana': { x: '42%', y: '35%' },
    'Sousse': { x: '60%', y: '45%' },
    'Monastir': { x: '62%', y: '50%' },
    'Mahdia': { x: '62%', y: '55%' },
    'Sfax': { x: '58%', y: '65%' },
    'Kairouan': { x: '48%', y: '48%' },
    'Kasserine': { x: '42%', y: '52%' },
    'Sidi Bouzid': { x: '48%', y: '58%' },
    'Gabès': { x: '55%', y: '80%' },
    'Médenine': { x: '60%', y: '88%' },
    'Tataouine': { x: '52%', y: '92%' },
    'Gafsa': { x: '45%', y: '72%' },
    'Tozeur': { x: '38%', y: '78%' },
    'Kébili': { x: '48%', y: '85%' },
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ 
        position: 'relative',
        height: 400,
        background: `linear-gradient(135deg, ${C.blueL} 0%, #F0F9FF 100%)`,
        borderRadius: '16px',
        border: `1.5px solid ${C.blue}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Grille de fond */}
        <Box sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(${C.blue}08 1px, transparent 1px),
            linear-gradient(90deg, ${C.blue}08 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }} />

        {/* Régions de Tunisie */}
        <Box sx={{ position: 'relative', width: '100%', maxWidth: 600, height: '100%', p: 4 }}>
          {regions.map((region, i) => {
            const position = regionPositions[region.nom_region] || { x: '50%', y: '50%' };
            const color = getRegionColor(region.statut);

            return (
              <Box key={region.id_region} sx={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                transform: 'translate(-50%, -50%)',
                animation: `${popIn} 0.5s ease-out ${0.3 + i * 0.05}s both`,
              }}>
                {/* Point sur la carte */}
                <Box 
                  onClick={() => handleRegionClick(region)}
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: color,
                    border: '3px solid #fff',
                    boxShadow: `0 4px 12px ${color}40`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.8)',
                      boxShadow: `0 6px 20px ${color}60`,
                      zIndex: 100,
                    },
                    '&:hover + .region-tooltip': {
                      opacity: 1,
                      visibility: 'visible',
                    },
                  }} 
                />
                
                {/* Tooltip */}
                <Box className="region-tooltip" sx={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  mb: 1,
                  background: '#fff',
                  border: `1.5px solid ${C.blueL}`,
                  borderRadius: '12px',
                  px: 2,
                  py: 1.5,
                  boxShadow: `0 8px 24px ${C.blue}18`,
                  opacity: 0,
                  visibility: 'hidden',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                  pointerEvents: 'none',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: `6px solid ${C.blueL}`,
                  },
                }}>
                  <Typography sx={{ fontWeight: 700, color: C.navy, fontSize: '0.85rem', mb: 0.3 }}>
                    {region.nom_region}
                  </Typography>
                  <Typography sx={{ color: '#8A9BB0', fontSize: '0.75rem' }}>
                    {parseInt(region.total_etudiants || 0).toLocaleString()} étudiants
                  </Typography>
                  <Typography sx={{ color: '#8A9BB0', fontSize: '0.75rem' }}>
                    Taux: <Box component="span" sx={{ fontWeight: 700, color }}>{parseFloat(region.taux_reussite_moyen || 0).toFixed(1)}%</Box>
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Dialog avec détails de la région */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: `linear-gradient(135deg, ${C.navy} 0%, ${C.blue} 100%)`,
          color: '#fff',
        }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              📍 {selectedRegion?.nom_region}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Détails et statistiques de la région
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} sx={{ color: '#fff' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          {detailsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : regionDetails ? (
            <Grid container spacing={3}>
              {/* Statistiques globales */}
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  {[
                    { label: 'Établissements', value: regionDetails.stats.total_etablissements, icon: '🏫', color: C.purple },
                    { label: 'Étudiants', value: parseInt(regionDetails.stats.total_etudiants || 0).toLocaleString(), icon: '👥', color: C.green },
                    { label: 'Enseignants', value: parseInt(regionDetails.stats.total_enseignants || 0).toLocaleString(), icon: '👨‍🏫', color: C.blue },
                    { label: 'Taux de réussite', value: `${parseFloat(regionDetails.stats.taux_reussite_moyen || 0).toFixed(1)}%`, icon: '📈', color: C.orange },
                  ].map((stat, i) => (
                    <Grid item xs={12} sm={6} md={3} key={i}>
                      <Box sx={{
                        p: 2,
                        borderRadius: 2,
                        background: `${stat.color}10`,
                        border: `1px solid ${stat.color}30`,
                      }}>
                        <Typography sx={{ fontSize: '1.5rem', mb: 0.5 }}>{stat.icon}</Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: stat.color }}>
                          {stat.value}
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem', color: '#8A9BB0' }}>
                          {stat.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              {/* Répartition par type */}
              {regionDetails.repartitionTypes && regionDetails.repartitionTypes.length > 0 && (
                <Grid item xs={12} md={5}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    📊 Répartition par type
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={regionDetails.repartitionTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.type} (${entry.nombre})`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="nombre"
                      >
                        {regionDetails.repartitionTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Grid>
              )}

              {/* Liste des établissements */}
              <Grid item xs={12} md={regionDetails.repartitionTypes?.length > 0 ? 7 : 12}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  🏛️ Établissements ({regionDetails.etablissements?.length || 0})
                </Typography>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Nom</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Étudiants</TableCell>
                        <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Enseignants</TableCell>
                        <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Taux</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {regionDetails.etablissements?.map((etab, index) => (
                        <TableRow key={index} sx={{ '&:hover': { background: '#F9FAFB' } }}>
                          <TableCell sx={{ fontWeight: 600 }}>{etab.nom_etablissement}</TableCell>
                          <TableCell>
                            <Chip 
                              label={etab.type} 
                              size="small"
                              sx={{ 
                                background: `${C.blue}15`, 
                                color: C.blue,
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 600 }}>
                            {parseInt(etab.effectif_etudiants || 0).toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 600 }}>
                            {parseInt(etab.effectif_enseignants || 0).toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Chip 
                              label={`${parseFloat(etab.taux_reussite || 0).toFixed(1)}%`}
                              size="small"
                              sx={{
                                background: etab.taux_reussite >= 14 ? `${C.green}15` : etab.taux_reussite >= 12 ? `${C.blue}15` : `${C.orange}15`,
                                color: etab.taux_reussite >= 14 ? C.green : etab.taux_reussite >= 12 ? C.blue : C.orange,
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          ) : (
            <Typography>Aucune donnée disponible</Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InteractiveRegionMap;
