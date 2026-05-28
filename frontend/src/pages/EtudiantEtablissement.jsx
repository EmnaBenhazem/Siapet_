import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip,
  CircularProgress, Grid, IconButton, LinearProgress, Tooltip, Button,
} from '@mui/material';
import { ArrowBack, Groups, Person, School } from '@mui/icons-material';
import api from '../services/api';

const C = {
  primary:   '#1E3A8A',
  secondary: '#3B82F6',
  accent:    '#06B6D4',
  success:   '#10B981',
  warning:   '#F59E0B',
  purple:    '#8B5CF6',
};

const TYPE_CONFIG = {
  FACULTE:  { label: 'Faculté',  color: '#1E40AF', bg: '#EFF6FF', emoji: '🎓' },
  INSTITUT: { label: 'Institut', color: '#6D28D9', bg: '#F5F3FF', emoji: '🏫' },
  ECOLE:    { label: 'École',    color: '#065F46', bg: '#ECFDF5', emoji: '📚' },
};

const StatBox = ({ icon, label, value, color }) => (
  <Box sx={{ p: 2, borderRadius: 2, background: `${color}08`, border: `1px solid ${color}20`, textAlign: 'center' }}>
    <Box sx={{ fontSize: '1.4rem', mb: 0.5 }}>{icon}</Box>
    <Typography sx={{ fontWeight: 900, fontSize: '1.8rem', color, lineHeight: 1 }}>{value}</Typography>
    <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, mt: 0.3 }}>{label}</Typography>
  </Box>
);

export default function EtudiantEtablissement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/etudiant/etablissement')
      .then(r => setData(r.data.data))
      .catch(err => console.error('Erreur chargement établissement:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography fontSize="2rem">🏫</Typography>
        <Typography sx={{ mt: 1, color: 'text.secondary' }}>Établissement introuvable</Typography>
        <Button onClick={() => navigate('/dashboard/etudiant')} sx={{ mt: 2 }}>Retour</Button>
      </Box>
    );
  }

  const { etablissement, specialites } = data;
  const cfg = TYPE_CONFIG[etablissement.type] || { label: etablissement.type, color: C.secondary, bg: '#EFF6FF', emoji: '🏛️' };

  // Group specialites by departement
  const byDept = specialites.reduce((acc, s) => {
    const dept = s.nom_departement || 'Autre';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(s);
    return acc;
  }, {});

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: '#fff', border: '1px solid #E5E7EB',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 2, background: cfg.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
            {cfg.emoji}
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1F2937', mb: 0.3 }}>
              {etablissement.nom_etablissement}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              {etablissement.code_etablissement && `${etablissement.code_etablissement} · `}
              {cfg.label}
              {etablissement.nom_ville && ` · ${etablissement.nom_ville}`}
            </Typography>
            {etablissement.nom_rectorat && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4 }}>
                <span style={{ fontSize: '0.85rem' }}>🏛️</span>
                <Typography variant="caption" sx={{ color: C.secondary, fontWeight: 700 }}>
                  {etablissement.nom_rectorat}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        <Tooltip title="Retour au tableau de bord">
          <IconButton onClick={() => navigate('/dashboard/etudiant')}
            sx={{ width: 44, height: 44, borderRadius: '14px', background: '#F0F4FF',
              border: '2px solid #3B82F640', color: '#3B82F6', transition: 'all 0.3s ease',
              '&:hover': { background: '#3B82F620', transform: 'translateY(-2px)', boxShadow: '0 4px 12px #3B82F625' } }}>
            <ArrowBack sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatBox icon="👥" label="Étudiants" value={etablissement.nb_etudiants} color={C.secondary} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatBox icon="👤" label="Enseignants" value={etablissement.nb_enseignants} color={C.purple} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatBox icon="📚" label="Spécialités" value={etablissement.nb_specialites} color={C.success} />
        </Grid>
      </Grid>

      {/* Contact */}
      {(etablissement.email || etablissement.telephone || etablissement.adresse) && (
        <Card sx={{ borderRadius: 3, border: '1.5px solid #EAF4FF', mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography sx={{ fontWeight: 800, color: C.primary, mb: 2, fontSize: '0.95rem' }}>
              📋 Informations de contact
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {etablissement.email && (
                <Box component="a" href={`mailto:${etablissement.email}`}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: C.secondary,
                    fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' } }}>
                  ✉️ {etablissement.email}
                </Box>
              )}
              {etablissement.telephone && (
                <Box component="a" href={`tel:${etablissement.telephone}`}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: C.success,
                    fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' } }}>
                  📞 {etablissement.telephone}
                </Box>
              )}
              {etablissement.adresse && (
                <Typography sx={{ color: '#6B7280', fontSize: '0.85rem', fontWeight: 600 }}>
                  📍 {etablissement.adresse}
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Spécialités */}
      {specialites.length > 0 && (
        <>
          <Typography sx={{ fontWeight: 800, color: C.primary, fontSize: '1rem', mb: 2 }}>
            Spécialités proposées
          </Typography>
          {Object.entries(byDept).map(([dept, specs], di) => {
            const deptColors = [C.secondary, C.purple, C.success, C.warning, C.accent];
            const color = deptColors[di % deptColors.length];
            return (
              <Box key={dept} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: `${color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <School sx={{ color, fontSize: 20 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: C.primary }}>{dept}</Typography>
                  <Chip label={`${specs.length} spécialité${specs.length > 1 ? 's' : ''}`} size="small"
                    sx={{ background: `${color}15`, color, fontWeight: 700 }} />
                </Box>
                <Grid container spacing={2}>
                  {specs.map(s => {
                    const pct = etablissement.nb_etudiants > 0
                      ? Math.min(Math.round((s.nb_etudiants / etablissement.nb_etudiants) * 100), 100)
                      : 0;
                    return (
                      <Grid item xs={12} sm={6} md={4} key={s.id_specialite}>
                        <Card sx={{ borderRadius: 3, border: `1.5px solid ${color}20`, transition: 'all 0.25s',
                          '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 24px ${color}18`, borderColor: `${color}50` } }}>
                          <CardContent sx={{ p: 2.5 }}>
                            <Typography sx={{ fontWeight: 800, color: C.primary, fontSize: '0.9rem', mb: 0.5 }}>
                              {s.nom_specialite}
                            </Typography>
                            {s.code_specialite && (
                              <Chip label={s.code_specialite} size="small"
                                sx={{ background: `${color}15`, color, fontWeight: 700, fontSize: '0.7rem', fontFamily: 'monospace', mb: 1.5 }} />
                            )}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                              <Groups sx={{ fontSize: 14, color: '#6B7280' }} />
                              <Typography sx={{ fontSize: '0.78rem', color: '#6B7280', fontWeight: 600 }}>
                                {s.nb_etudiants} étudiant{s.nb_etudiants !== 1 ? 's' : ''}
                              </Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={pct}
                              sx={{ height: 5, borderRadius: 3, background: '#E5E7EB',
                                '& .MuiLinearProgress-bar': { background: color, borderRadius: 3 } }} />
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            );
          })}
        </>
      )}
    </Box>
  );
}
