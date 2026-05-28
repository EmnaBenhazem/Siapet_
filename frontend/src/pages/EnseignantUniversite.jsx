import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip,
  CircularProgress, Grid, Avatar, IconButton, LinearProgress, Tooltip, Button,
} from '@mui/material';
import { ArrowForward, Groups, Person } from '@mui/icons-material';
import api from '../services/api';

const COLORS = {
  primary:   '#1E3A8A',
  secondary: '#3B82F6',
  accent:    '#06B6D4',
  success:   '#10B981',
  warning:   '#F59E0B',
  danger:    '#EF4444',
  purple:    '#8B5CF6',
  bg:        '#F0F4FF',
};

const TYPE_CONFIG = {
  FACULTE:  { label: 'Faculté',  color: '#1E40AF', bg: '#EFF6FF', emoji: '🎓', short: 'FA' },
  INSTITUT: { label: 'Institut', color: '#6D28D9', bg: '#F5F3FF', emoji: '🏫', short: 'IN' },
  ECOLE:    { label: 'École',    color: '#065F46', bg: '#ECFDF5', emoji: '📚', short: 'EC' },
};

// ── MINI PROGRESS BAR ─────────────────────────────────────────────────
const MiniProgress = ({ label, value, max, color }) => (
  <Box sx={{ mb: 1.5 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{label}</Typography>
      <Typography variant="caption" sx={{ fontWeight: 700, color, fontSize: '0.75rem' }}>{value}/{max}</Typography>
    </Box>
    <LinearProgress
      variant="determinate"
      value={max > 0 ? Math.min((value / max) * 100, 100) : 0}
      sx={{
        height: 6, borderRadius: 3, background: '#E5E7EB',
        '& .MuiLinearProgress-bar': { background: color, borderRadius: 3 },
      }}
    />
  </Box>
);

// ── ETAB CARD ─────────────────────────────────────────────────────────
const EtabCard = ({ etab, isCurrent, totalEnseignants, totalEtudiants }) => {
  const cfg = TYPE_CONFIG[etab.type] || { label: etab.type, color: COLORS.secondary, bg: '#EFF6FF', emoji: '🏛️', short: '??' };
  const ratioEnseignants = totalEnseignants > 0 ? Math.round((etab.nb_enseignants / totalEnseignants) * 100) : 0;
  const ratioColor = ratioEnseignants >= 20 ? COLORS.success : ratioEnseignants >= 10 ? COLORS.warning : COLORS.danger;

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
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: COLORS.primary, fontSize: '1.1rem', mb: 0.5, letterSpacing: '-0.3px' }}
            >
              {etab.nom_etablissement}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
              {cfg.label}{etab.email ? ` • ${etab.email}` : ''}
            </Typography>
          </Box>
          <Avatar
            sx={{
              width: 48, height: 48,
              background: `linear-gradient(135deg, ${COLORS.secondary}20, ${COLORS.accent}20)`,
              border: `2px solid ${COLORS.secondary}30`,
              color: COLORS.secondary,
              fontWeight: 800,
            }}
          >
            {cfg.short}
          </Avatar>
        </Box>

        {/* Stats boxes */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box sx={{ p: 1.5, borderRadius: 2, background: `${COLORS.secondary}08`, border: `1px solid ${COLORS.secondary}20` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <Groups sx={{ fontSize: 16, color: COLORS.secondary }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>Étudiants</Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, fontSize: '1.3rem' }}>
                {etab.nb_etudiants}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ p: 1.5, borderRadius: 2, background: `${ratioColor}08`, border: `1px solid ${ratioColor}20` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <Person sx={{ fontSize: 16, color: ratioColor }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>Enseignants</Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: ratioColor, fontSize: '1.3rem' }}>
                {etab.nb_enseignants}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Progress bars */}
        <MiniProgress
          label="Part des enseignants"
          value={etab.nb_enseignants}
          max={totalEnseignants}
          color={ratioColor}
        />
        <MiniProgress
          label="Effectif total"
          value={etab.nb_etudiants}
          max={totalEtudiants}
          color={COLORS.secondary}
        />

        {/* Footer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 2, borderTop: '1px solid #EAF4FF' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={cfg.label}
              size="small"
              sx={{ background: '#EFF6FF', color: COLORS.secondary, fontWeight: 600, fontSize: '0.7rem', height: 22 }}
            />
            <Chip
              label={isCurrent ? 'Mon établissement' : `${etab.nb_enseignants} enseignants`}
              size="small"
              sx={{ background: '#F0FDF4', color: COLORS.success, fontWeight: 600, fontSize: '0.7rem', height: 22 }}
            />
          </Box>
          <Tooltip title="Voir les détails">
            <IconButton
              size="small"
              sx={{
                background: `${COLORS.secondary}12`,
                color: COLORS.secondary,
                '&:hover': { background: COLORS.secondary, color: '#fff' },
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

// ── MAIN ──────────────────────────────────────────────────────────────
const EnseignantUniversite = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState(null);

  useEffect(() => {
    api.get('/enseignant/dashboard/universite')
      .then(res => setData(res.data.data))
      .catch(err => console.error('Erreur chargement université:', err))
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
        <Typography fontSize="2rem">🏛️</Typography>
        <Typography sx={{ mt: 1, color: 'text.secondary' }}>Université introuvable</Typography>
        <Button onClick={() => navigate('/dashboard/enseignant')} sx={{ mt: 2 }}>Retour</Button>
      </Box>
    );
  }

  const { rectorat, etablissements, currentEtablissementId } = data;
  const totalEnseignants = etablissements.reduce((s, e) => s + e.nb_enseignants, 0);
  const totalEtudiants   = etablissements.reduce((s, e) => s + e.nb_etudiants,   0);

  return (
    <Box sx={{ pb: 4 }}>
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: '#fff', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 2, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
            🏛️
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1F2937', mb: 0.5 }}>{rectorat.nom_rectorat}</Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: rectorat.email || rectorat.telephone ? 0.75 : 0 }}>
              {rectorat.code_rectorat} · {rectorat.type}{rectorat.adresse && ` · ${rectorat.adresse}`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {rectorat.email && (
                <Box
                  component="a"
                  href={`mailto:${rectorat.email}`}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5,
                    color: COLORS.secondary, fontSize: '0.8rem', fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline', color: COLORS.primary },
                  }}
                >
                  ✉️ {rectorat.email}
                </Box>
              )}
              {rectorat.telephone && (
                <Box
                  component="a"
                  href={`tel:${rectorat.telephone}`}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5,
                    color: COLORS.success, fontSize: '0.8rem', fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline', color: '#047857' },
                  }}
                >
                  📞 {rectorat.telephone}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
        <IconButton
          onClick={() => navigate('/dashboard/enseignant')}
          sx={{ width: 44, height: 44, borderRadius: '14px', background: COLORS.bg, border: `2px solid ${COLORS.secondary}40`, color: COLORS.secondary, transition: 'all 0.3s ease', '&:hover': { background: `${COLORS.secondary}20`, transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${COLORS.secondary}25` } }}
        >
          <ArrowForward sx={{ fontSize: 20, transform: 'rotate(180deg)' }} />
        </IconButton>
      </Box>

      {/* ── STATS BAR ──────────────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { icon: '🏫', label: 'Établissements', value: etablissements.length, color: COLORS.primary,   bg: `linear-gradient(135deg, ${COLORS.secondary}08, ${COLORS.accent}08)` },
          { icon: '👤', label: 'Enseignants',    value: totalEnseignants,       color: COLORS.purple,    bg: `linear-gradient(135deg, ${COLORS.purple}08, ${COLORS.purple}15)` },
          { icon: '👥', label: 'Étudiants',      value: totalEtudiants,         color: COLORS.success,   bg: `linear-gradient(135deg, ${COLORS.success}08, ${COLORS.success}15)` },
        ].map((s) => (
          <Grid item xs={12} sm={4} key={s.label}>
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
                <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.primary }}>
                  {s.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── CARDS ──────────────────────────────────────────────────── */}
      <Typography sx={{ fontWeight: 800, color: '#1A3A6B', fontSize: '1rem', mb: 2 }}>
        Établissements rattachés
      </Typography>
      <Grid container spacing={3}>
        {etablissements.map(etab => (
          <Grid item xs={12} sm={6} md={4} key={etab.id_etablissement}>
            <EtabCard
              etab={etab}
              isCurrent={etab.id_etablissement === currentEtablissementId}
              totalEnseignants={totalEnseignants}
              totalEtudiants={totalEtudiants}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default EnseignantUniversite;
