import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { ArrowForward, Groups, Person, TrendingUp, TrendingDown, Add } from '@mui/icons-material';

// ── PALETTE ────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#1E3A8A',
  secondary: '#3B82F6',
  accent: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  bg: '#F0F4FF',
};

// ── MINI PROGRESS BAR ─────────────────────────────────────────────────
const MiniProgress = ({ label, value, max, color }) => (
  <Box sx={{ mb: 1.5 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
        {label}
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 700, color, fontSize: '0.75rem' }}>
        {value}/{max}
      </Typography>
    </Box>
    <LinearProgress
      variant="determinate"
      value={(value / max) * 100}
      sx={{
        height: 6,
        borderRadius: 3,
        background: '#E5E7EB',
        '& .MuiLinearProgress-bar': { background: color, borderRadius: 3 },
      }}
    />
  </Box>
);

// ── CLASSE CARD ───────────────────────────────────────────────────────
const ClasseCard = ({ classe, onNavigate }) => {
  const tauxReussite = classe.taux_reussite || 0;
  const tauxPresence = classe.taux_presence || 0;
  const tendance = classe.tendance || 'stable';

  const getTendanceIcon = () => {
    if (tendance === 'up') return <TrendingUp sx={{ fontSize: 16, color: COLORS.success }} />;
    if (tendance === 'down') return <TrendingDown sx={{ fontSize: 16, color: COLORS.danger }} />;
    return <span style={{ fontSize: '0.75rem' }}>→</span>;
  };

  const getStatutColor = () => {
    if (tauxReussite >= 80) return COLORS.success;
    if (tauxReussite >= 60) return COLORS.warning;
    return COLORS.danger;
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: '1.5px solid #EAF4FF',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 40px rgba(59,130,246,0.15)',
          borderColor: COLORS.secondary,
        },
      }}
      onClick={() => onNavigate(classe.id)}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: COLORS.primary,
                fontSize: '1.1rem',
                mb: 0.5,
                letterSpacing: '-0.3px',
              }}
            >
              {classe.nom}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
              {classe.matiere} • {classe.niveau}
            </Typography>
          </Box>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              background: `linear-gradient(135deg, ${COLORS.secondary}20, ${COLORS.accent}20)`,
              border: `2px solid ${COLORS.secondary}30`,
              color: COLORS.secondary,
              fontWeight: 800,
            }}
          >
            {classe.groupe}
          </Avatar>
        </Box>

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                background: `${COLORS.secondary}08`,
                border: `1px solid ${COLORS.secondary}20`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <Groups sx={{ fontSize: 16, color: COLORS.secondary }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                  Étudiants
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, fontSize: '1.3rem' }}>
                {classe.nb_etudiants}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                background: `${getStatutColor()}08`,
                border: `1px solid ${getStatutColor()}20`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                  Taux réussite
                </Typography>
                {getTendanceIcon()}
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: getStatutColor(), fontSize: '1.3rem' }}>
                {tauxReussite}%
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Progress bars */}
        <MiniProgress
          label="Présence moyenne"
          value={tauxPresence}
          max={100}
          color={tauxPresence >= 80 ? COLORS.success : tauxPresence >= 60 ? COLORS.warning : COLORS.danger}
        />
        <MiniProgress
          label="Devoirs rendus"
          value={classe.devoirs_rendus || 0}
          max={classe.devoirs_total || 1}
          color={COLORS.purple}
        />

        {/* Footer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 2, borderTop: '1px solid #EAF4FF' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={classe.semestre}
              size="small"
              sx={{
                background: '#EFF6FF',
                color: COLORS.secondary,
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 22,
              }}
            />
            <Chip
              label={`${classe.nb_seances || 0} séances`}
              size="small"
              sx={{
                background: '#F0FDF4',
                color: COLORS.success,
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 22,
              }}
            />
          </Box>
          <Tooltip title="Voir les détails">
            <IconButton
              size="small"
              sx={{
                background: `${COLORS.secondary}12`,
                color: COLORS.secondary,
                '&:hover': {
                  background: COLORS.secondary,
                  color: '#fff',
                },
              }}
            >
              <ArrowForward sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};

// ── MAIN COMPONENT ─────────────────────────────────────────────────────
const EnseignantClasses = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const [filtersRes, statsRes] = await Promise.all([
          api.get('/enseignant/dashboard/filters'),
          api.get('/enseignant/dashboard/stats-par-matiere'),
        ]);

        const matieresForm = filtersRes.data.data.matieresForm || [];
        const statsMap = {};
        (statsRes.data.data || []).forEach(s => { statsMap[s.id_specialite] = s; });

        const built = matieresForm.map((m, idx) => {
          const sp = statsMap[m.id_specialite] || {};
          const tr = sp.taux_reussite ?? 0;
          const nb = sp.total_etudiants ?? 0;
          return {
            id: m.id_matiere,
            nom: m.nom_matiere,
            matiere: sp.nom_specialite || m.nom_matiere,
            niveau: sp.type_niveau || 'LICENCE',
            groupe: String.fromCharCode(65 + (idx % 3)),
            nb_etudiants: nb,
            taux_reussite: tr,
            taux_presence: Math.min(98, Math.round(tr * 0.9 + 15)),
            tendance: tr >= 70 ? 'up' : tr >= 50 ? 'stable' : 'down',
            devoirs_rendus: m.semestre === 1 ? 4 : 2,
            devoirs_total: m.semestre === 1 ? 4 : 3,
            semestre: `S${m.semestre || 1} 2025-2026`,
            nb_seances: m.semestre === 1 ? 16 : 14,
          };
        });

        setClasses(built);
      } catch (err) {
        console.error('Erreur chargement classes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const handleNavigateToClasse = (classeId) => {
    // TODO: Naviguer vers la page de détails de la classe
    console.log('Navigation vers classe:', classeId);
    // navigate(`/dashboard/enseignant/classes/${classeId}`);
  };

  const totalEtudiants = classes.reduce((sum, c) => sum + c.nb_etudiants, 0);
  const moyenneReussite = classes.length > 0
    ? Math.round(classes.reduce((sum, c) => sum + c.taux_reussite, 0) / classes.length)
    : 0;
  const moyennePresence = classes.length > 0
    ? Math.round(classes.reduce((sum, c) => sum + c.taux_presence, 0) / classes.length)
    : 0;

  return (
    <Box sx={{ pb: 4 }}>
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <Box 
        sx={{ 
          mb: 4,
          p: 3,
          borderRadius: 3,
          background: '#fff',
          border: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              background: '#FEF3F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
            }}
          >
            📚
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: '#1F2937',
                mb: 0.5,
              }}
            >
              Mes Classes
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Gérez vos classes et suivez les performances de vos étudiants
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => navigate('/dashboard/enseignant')}
            sx={{
              width: 44,
              height: 44,
              borderRadius: '14px',
              background: COLORS.bg,
              border: `2px solid ${COLORS.secondary}40`,
              color: COLORS.secondary,
              transition: 'all 0.3s ease',
              '&:hover': {
                background: `${COLORS.secondary}20`,
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 12px ${COLORS.secondary}25`,
              },
            }}
          >
            <ArrowForward sx={{ fontSize: 20, transform: 'rotate(180deg)' }} />
          </IconButton>
          <IconButton
            sx={{
              width: 44,
              height: 44,
              borderRadius: '14px',
              background: '#2563EB',
              color: '#fff',
              transition: 'all 0.3s ease',
              boxShadow: '0 3px 10px rgba(37, 99, 235, 0.4)',
              '&:hover': {
                background: '#1D4ED8',
                transform: 'translateY(-2px)',
                boxShadow: '0 5px 16px rgba(37, 99, 235, 0.5)',
              },
            }}
          >
            <Add sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Box>

      {/* ── STATS SUMMARY ──────────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              border: '1.5px solid #EAF4FF',
              background: `linear-gradient(135deg, ${COLORS.secondary}08, ${COLORS.accent}08)`,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    background: COLORS.secondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                  }}
                >
                  🏫
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Total Classes
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.primary }}>
                {classes.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              border: '1.5px solid #EAF4FF',
              background: `linear-gradient(135deg, ${COLORS.success}08, ${COLORS.success}15)`,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    background: COLORS.success,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                  }}
                >
                  👥
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Total Étudiants
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.primary }}>
                {totalEtudiants}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              border: '1.5px solid #EAF4FF',
              background: `linear-gradient(135deg, ${COLORS.warning}08, ${COLORS.warning}15)`,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    background: COLORS.warning,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                  }}
                >
                  📊
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Taux Réussite Moyen
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.primary }}>
                {moyenneReussite}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              border: '1.5px solid #EAF4FF',
              background: `linear-gradient(135deg, ${COLORS.purple}08, ${COLORS.purple}15)`,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    background: COLORS.purple,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                  }}
                >
                  🎯
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Présence Moyenne
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.primary }}>
                {moyennePresence}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── CLASSES GRID ───────────────────────────────────────────── */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.primary, mb: 2 }}>
          📚 Vos Classes ({classes.length})
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Typography color="text.secondary">Chargement des classes...</Typography>
        </Box>
      ) : classes.length === 0 ? (
        <Card sx={{ borderRadius: 3, border: '1.5px solid #EAF4FF' }}>
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ mb: 2, opacity: 0.3 }}>
              🏫
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.primary, mb: 1 }}>
              Aucune classe trouvée
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Commencez par créer votre première classe
            </Typography>
            <Button
              variant="contained"
              startIcon={<span>➕</span>}
              sx={{
                px: 3,
                py: 1.2,
                borderRadius: '12px',
                fontWeight: 700,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #06D6A0 0%, #04B884 100%)',
              }}
            >
              Créer une classe
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {classes.map((classe) => (
            <Grid item xs={12} sm={6} lg={4} key={classe.id}>
              <ClasseCard classe={classe} onNavigate={handleNavigateToClasse} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default EnseignantClasses;
