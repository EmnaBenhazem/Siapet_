import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Card,
  Grid, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress, Alert, Snackbar,
  Tabs, Tab, IconButton, Tooltip,
} from '@mui/material';
import { ArrowBack, CheckCircle, Cancel } from '@mui/icons-material';
import { keyframes } from '@mui/material';
import axios from 'axios';
import config from '../config';

// ── Palette SIAPET ────────────────────────────────────────
const C = {
  navy:    '#1A3A6B',
  navyD:   '#0F2549',
  blue:    '#4D9FFF',
  blueL:   '#EAF4FF',
  orange:  '#F59E0B',
  green:   '#06D6A0',
  greenD:  '#059669',
  red:     '#EF4444',
  muted:   '#8A9BB0',
  bg:      '#F7FBFF',
};

// ── Animations ────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity:0; transform:translateY(24px); }
  to   { opacity:1; transform:translateY(0); }
`;
const slideIn = keyframes`
  from { opacity:0; transform:translateX(-20px); }
  to   { opacity:1; transform:translateX(0); }
`;
const popIn = keyframes`
  from { opacity:0; transform:scale(0.9); }
  to   { opacity:1; transform:scale(1); }
`;

const GestionDemandesAcces = () => {
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [motifRefus, setMotifRefus] = useState('');
  const [processing, setProcessing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.apiUrl}/demandes-acces`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDemandes(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
      setSnackbar({ open: true, message: 'Erreur lors du chargement des demandes', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (demande, type) => {
    setSelectedDemande(demande);
    setActionType(type);
    setDialogOpen(true);
    setMotifRefus('');
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedDemande(null);
    setActionType('');
    setMotifRefus('');
  };

  const handleAction = async () => {
    if (!selectedDemande) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      // Utiliser id_demande au lieu de id
      const demandeId = selectedDemande.id_demande || selectedDemande.id;
      const endpoint = actionType === 'accepter' 
        ? `${config.apiUrl}/demandes-acces/${demandeId}/accepter`
        : `${config.apiUrl}/demandes-acces/${demandeId}/refuser`;
      
      const data = actionType === 'refuser' ? { commentaire_admin: motifRefus } : {};
      
      await axios.put(endpoint, data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSnackbar({ 
        open: true, 
        message: `Demande ${actionType === 'accepter' ? 'acceptée' : 'refusée'} avec succès`, 
        severity: 'success' 
      });
      
      handleCloseDialog();
      fetchDemandes();
    } catch (error) {
      console.error('Erreur lors du traitement:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Erreur lors du traitement', 
        severity: 'error' 
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusChip = (statut) => {
    const config = {
      en_attente: { label: 'En attente', color: C.orange, bg: `${C.orange}15` },
      accepte: { label: 'Acceptée', color: C.green, bg: `${C.green}15` },
      refuse: { label: 'Refusée', color: C.red, bg: `${C.red}15` },
    };
    const c = config[statut] || config.en_attente;
    return (
      <Chip 
        label={c.label} 
        size="small"
        sx={{ 
          background: c.bg, 
          color: c.color, 
          fontWeight: 700,
          fontSize: '0.75rem',
        }} 
      />
    );
  };

  const getRoleLabel = (role) => {
    const roles = {
      etudiant: { label: 'Étudiant', emoji: '🎓' },
      enseignant: { label: 'Enseignant', emoji: '👨‍🏫' },
      directeur: { label: 'Directeur', emoji: '👔' },
      recteur: { label: 'Recteur', emoji: '🏛️' },
    };
    const r = roles[role] || { label: role, emoji: '👤' };
    return `${r.emoji} ${r.label}`;
  };

  const filteredDemandes = demandes.filter(d => {
    if (tabValue === 0) return d.statut === 'en_attente';
    if (tabValue === 1) return d.statut === 'accepte';
    if (tabValue === 2) return d.statut === 'refuse';
    return true;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: C.bg, pt: 1, pb: 4 }}>
      <Container maxWidth="lg">

        {/* ── Header ── */}
        <Box sx={{ mb: 3, p: 3, borderRadius: 3, background: '#fff', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: 2, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
              📋
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#1F2937', mb: 0.5 }}>
                Gestion des demandes d'accès
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                {demandes.length > 0
                  ? `${demandes.length} demande${demandes.length > 1 ? 's' : ''} — validez ou refusez les demandes d'inscription`
                  : 'Validez ou refusez les demandes d\'inscription au système'}
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

        {/* ── Tabs ── */}
        <Card sx={{ 
          mb: 3, 
          borderRadius: '18px', 
          boxShadow: `0 4px 20px ${C.blue}10`,
          border: `1.5px solid ${C.blueL}`,
          overflow: 'hidden',
        }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)}
            sx={{
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
              '& .MuiTab-root': { 
                fontWeight: 700, 
                fontSize: '0.9rem',
                textTransform: 'none',
                minHeight: 56,
                transition: 'all 0.2s',
                '&:hover': {
                  background: `${C.blue}08`,
                },
              },
              '& .Mui-selected': { 
                color: C.navy,
              },
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontWeight: 700 }}>En attente</Typography>
                  <Chip 
                    label={demandes.filter(d => d.statut === 'en_attente').length} 
                    size="small"
                    sx={{ 
                      background: `${C.orange}15`, 
                      color: C.orange, 
                      fontWeight: 800,
                      height: 22,
                      minWidth: 28,
                    }} 
                  />
                </Box>
              }
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontWeight: 700 }}>Acceptées</Typography>
                  <Chip 
                    label={demandes.filter(d => d.statut === 'accepte').length} 
                    size="small"
                    sx={{ 
                      background: `${C.green}15`, 
                      color: C.green, 
                      fontWeight: 800,
                      height: 22,
                      minWidth: 28,
                    }} 
                  />
                </Box>
              }
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontWeight: 700 }}>Refusées</Typography>
                  <Chip 
                    label={demandes.filter(d => d.statut === 'refuse').length} 
                    size="small"
                    sx={{ 
                      background: `${C.red}15`, 
                      color: C.red, 
                      fontWeight: 800,
                      height: 22,
                      minWidth: 28,
                    }} 
                  />
                </Box>
              }
            />
          </Tabs>
        </Card>

        {/* ── Cards Grid ── */}
        {filteredDemandes.length === 0 ? (
          <Card sx={{ 
            borderRadius: '20px', 
            p: 6, 
            textAlign: 'center',
            boxShadow: `0 4px 20px ${C.blue}10`,
            animation: `${fadeUp} 0.5s ease-out`,
          }}>
            <Box sx={{
              width: 80, height: 80, borderRadius: '50%',
              background: C.blueL, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', mx: 'auto', mb: 2,
            }}>
              📋
            </Box>
            <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '1.2rem', mb: 1 }}>
              Aucune demande {tabValue === 0 ? 'en attente' : tabValue === 1 ? 'acceptée' : 'refusée'}
            </Typography>
            <Typography sx={{ color: C.muted, fontSize: '0.9rem' }}>
              Les nouvelles demandes apparaîtront ici
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={2.5}>
            {filteredDemandes.map((demande, idx) => {
              const roleConfig = {
                etudiant: { label: 'Étudiant', emoji: '👨‍🎓', color: C.green, gradient: `linear-gradient(90deg, ${C.green}, #05C78D)` },
                enseignant: { label: 'Enseignant', emoji: '👨‍🏫', color: C.blue, gradient: `linear-gradient(90deg, ${C.blue}, #85BFFF)` },
                directeur: { label: 'Directeur', emoji: '👨‍💼', color: '#7B2CBF', gradient: `linear-gradient(90deg, #7B2CBF, #9D4EDD)` },
                recteur: { label: 'Recteur', emoji: '👨‍💼', color: C.orange, gradient: `linear-gradient(90deg, ${C.orange}, #FF8C5A)` },
              };
              const role = roleConfig[demande.type_acteur] || { label: demande.type_acteur, emoji: '👤', color: C.navy, gradient: `linear-gradient(90deg, ${C.navy}, ${C.blue})` };

              return (
                <Grid item xs={12} md={6} key={demande.id_demande || demande.id}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: '18px',
                      border: `1.5px solid ${C.blueL}`,
                      overflow: 'hidden',
                      position: 'relative',
                      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                      animation: `${popIn} 0.4s ease-out ${idx * 0.05}s both`,
                      '&:hover': {
                        transform: 'translateY(-6px)',
                        boxShadow: `0 16px 48px ${role.color}18`,
                        borderColor: `${role.color}30`,
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: '4px',
                        background: role.gradient,
                      },
                    }}
                  >
                    <Box sx={{ p: 2.5 }}>
                      {/* Header */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                        <Box sx={{
                          width: 52, height: 52, borderRadius: '12px',
                          background: `${role.color}12`,
                          border: `1.5px solid ${role.color}28`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.5rem', flexShrink: 0,
                        }}>
                          {role.emoji}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '1rem', mb: 0.3 }}>
                            {demande.nom} {demande.prenom}
                          </Typography>
                          <Chip 
                            label={role.label} 
                            size="small"
                            sx={{ 
                              background: `${role.color}12`, 
                              color: role.color, 
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              height: 22,
                              border: `1px solid ${role.color}28`,
                            }} 
                          />
                        </Box>
                        {getStatusChip(demande.statut)}
                      </Box>

                      {/* Info */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '0.8rem' }}>🆔</Typography>
                          <Typography sx={{ fontSize: '0.85rem', color: C.muted, fontWeight: 600 }}>
                            {demande.cin}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '0.8rem' }}>📧</Typography>
                          <Typography sx={{ fontSize: '0.85rem', color: C.muted }}>
                            {demande.email}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '0.8rem' }}>📅</Typography>
                          <Typography sx={{ fontSize: '0.85rem', color: C.muted }}>
                            {new Date(demande.date_demande).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Actions */}
                      {demande.statut === 'en_attente' && (
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 1.5, 
                          pt: 2, 
                          borderTop: `1px solid ${C.blueL}` 
                        }}>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<CheckCircle />}
                            onClick={() => handleOpenDialog(demande, 'accepter')}
                            sx={{
                              background: `${C.green}15`,
                              color: C.green,
                              fontWeight: 700,
                              borderRadius: '12px',
                              textTransform: 'none',
                              border: `1.5px solid ${C.green}30`,
                              boxShadow: 'none',
                              '&:hover': {
                                background: `${C.green}25`,
                                borderColor: `${C.green}50`,
                                transform: 'translateY(-2px)',
                                boxShadow: `0 6px 16px ${C.green}20`,
                              },
                            }}
                          >
                            Accepter
                          </Button>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<Cancel />}
                            onClick={() => handleOpenDialog(demande, 'refuser')}
                            sx={{
                              color: C.red,
                              borderColor: `${C.red}30`,
                              fontWeight: 700,
                              borderRadius: '12px',
                              textTransform: 'none',
                              background: `${C.red}08`,
                              borderWidth: '1.5px',
                              '&:hover': {
                                borderColor: `${C.red}50`,
                                background: `${C.red}15`,
                                transform: 'translateY(-2px)',
                                boxShadow: `0 6px 16px ${C.red}20`,
                                borderWidth: '1.5px',
                              },
                            }}
                          >
                            Refuser
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* ── Dialog Confirmation ── */}
        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog} 
          maxWidth="sm" 
          fullWidth
          disableEnforceFocus
          disableAutoFocus
        >
          <DialogTitle sx={{ fontWeight: 800, color: C.navy }}>
            {actionType === 'accepter' ? '✅ Accepter la demande' : '❌ Refuser la demande'}
          </DialogTitle>
          <DialogContent>
            {selectedDemande && (
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ mb: 1, color: C.muted, fontSize: '0.9rem' }}>
                  <strong>CIN:</strong> {selectedDemande.cin}
                </Typography>
                <Typography sx={{ mb: 1, color: C.muted, fontSize: '0.9rem' }}>
                  <strong>Email:</strong> {selectedDemande.email}
                </Typography>
                <Typography sx={{ mb: 2, color: C.muted, fontSize: '0.9rem' }}>
                  <strong>Rôle:</strong> {getRoleLabel(selectedDemande.type_acteur)}
                </Typography>
              </Box>
            )}
            
            {actionType === 'refuser' && (
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Motif du refus (optionnel)"
                value={motifRefus}
                onChange={(e) => setMotifRefus(e.target.value)}
                placeholder="Expliquez pourquoi cette demande est refusée..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  },
                }}
              />
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDialog} sx={{ color: C.muted }}>
              Annuler
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              variant="contained"
              sx={{
                background: actionType === 'accepter' 
                  ? `linear-gradient(135deg, ${C.green}, ${C.greenD})`
                  : `linear-gradient(135deg, ${C.red}, #DC2626)`,
                color: '#fff',
                fontWeight: 700,
                px: 3,
                '&:hover': {
                  boxShadow: `0 6px 20px ${actionType === 'accepter' ? C.green : C.red}40`,
                },
              }}
            >
              {processing ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Confirmer'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Snackbar ── */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ borderRadius: '12px' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

      </Container>
    </Box>
  );
};

export default GestionDemandesAcces;
