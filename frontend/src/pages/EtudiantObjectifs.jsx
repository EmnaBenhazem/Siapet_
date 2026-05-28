import React, { useState } from 'react';
import {
  Box, Typography, IconButton, Tooltip, LinearProgress,
  Card, CardContent, Grid, Chip, Button, Dialog, DialogContent,
  DialogTitle, TextField, MenuItem, DialogActions,
} from '@mui/material';
import { ArrowBack, Add, CheckCircle, RadioButtonUnchecked, Delete, EmojiEvents } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const C = {
  primary: '#1A3A6B',
  blue: '#4D9FFF',
  blueL: '#EAF4FF',
  green: '#06D6A0',
  orange: '#FF6B35',
  purple: '#8B5CF6',
  warning: '#F59E0B',
  danger: '#EF4444',
};

const CATEGORIES = [
  { label: 'Académique', color: C.blue,    icon: '📚' },
  { label: 'Personnel',  color: C.purple,  icon: '🌱' },
  { label: 'Projet',     color: C.orange,  icon: '🚀' },
  { label: 'Santé',      color: C.green,   icon: '💪' },
];

const INITIAL_OBJECTIFS = [
  { id: 1, titre: 'Atteindre une moyenne de 15/20', categorie: 'Académique', echeance: '2026-06-30', progression: 70, termine: false, description: 'Améliorer mes résultats en mathématiques et en algorithmique.' },
  { id: 2, titre: 'Valider tous les modules du semestre', categorie: 'Académique', echeance: '2026-06-15', progression: 85, termine: false, description: 'Ne rater aucun examen et obtenir la moyenne dans toutes les matières.' },
  { id: 3, titre: 'Réaliser un projet personnel en React', categorie: 'Projet', echeance: '2026-07-01', progression: 40, termine: false, description: 'Développer une application web complète avec React et Node.js.' },
  { id: 4, titre: 'Lire 2 livres techniques', categorie: 'Personnel', echeance: '2026-05-31', progression: 100, termine: true, description: 'Clean Code et The Pragmatic Programmer.' },
];

const getCategoryMeta = (label) => CATEGORIES.find(c => c.label === label) || CATEGORIES[0];

const getProgressColor = (val) => {
  if (val >= 80) return C.green;
  if (val >= 50) return C.blue;
  if (val >= 25) return C.warning;
  return C.danger;
};

export default function EtudiantObjectifs() {
  const navigate = useNavigate();
  const [objectifs, setObjectifs] = useState(INITIAL_OBJECTIFS);
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({ titre: '', categorie: 'Académique', echeance: '', progression: 0, description: '' });

  const termines  = objectifs.filter(o => o.termine).length;
  const enCours   = objectifs.filter(o => !o.termine).length;
  const moyenneProgression = objectifs.length
    ? Math.round(objectifs.reduce((s, o) => s + o.progression, 0) / objectifs.length)
    : 0;

  const toggleTermine = (id) =>
    setObjectifs(prev => prev.map(o => o.id === id ? { ...o, termine: !o.termine, progression: !o.termine ? 100 : o.progression } : o));

  const deleteObjectif = (id) => setObjectifs(prev => prev.filter(o => o.id !== id));

  const handleAdd = () => {
    if (!form.titre) return;
    setObjectifs(prev => [...prev, { ...form, id: Date.now(), termine: false, progression: Number(form.progression) }]);
    setForm({ titre: '', categorie: 'Académique', echeance: '', progression: 0, description: '' });
    setOpenDialog(false);
  };

  return (
    <Box sx={{ pb: 4 }}>

      {/* Header */}
      <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: '#fff', border: '1px solid #E5E7EB',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 2, background: `${C.purple}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
            🎯
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: C.primary, mb: 0.4 }}>Mes Objectifs</Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>Suivez votre progression et atteignez vos buts</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Ajouter un objectif">
            <IconButton onClick={() => setOpenDialog(true)}
              sx={{ width: 44, height: 44, borderRadius: '14px', background: C.purple, color: '#fff',
                transition: 'all 0.3s ease', boxShadow: `0 3px 10px ${C.purple}40`,
                '&:hover': { background: '#7C3AED', transform: 'translateY(-2px)' } }}>
              <Add sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Retour au tableau de bord">
            <IconButton onClick={() => navigate('/dashboard/etudiant')}
              sx={{ width: 44, height: 44, borderRadius: '14px', background: '#F0F4FF', border: '2px solid #3B82F640', color: '#3B82F6',
                transition: 'all 0.3s ease',
                '&:hover': { background: '#3B82F620', transform: 'translateY(-2px)', boxShadow: '0 4px 12px #3B82F625' } }}>
              <ArrowBack sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {[
          { icon: '🎯', label: 'Total objectifs',    value: objectifs.length, color: C.blue,    bg: `${C.blue}10` },
          { icon: '✅', label: 'Terminés',           value: termines,          color: C.green,   bg: `${C.green}10` },
          { icon: '⏳', label: 'En cours',           value: enCours,           color: C.orange,  bg: `${C.orange}10` },
          { icon: '📈', label: 'Progression moyenne', value: `${moyenneProgression}%`, color: C.purple, bg: `${C.purple}10` },
        ].map((s, i) => (
          <Grid item xs={6} sm={3} key={i}>
            <Card sx={{ borderRadius: 3, border: `1.5px solid ${s.color}25`, background: `linear-gradient(135deg, ${s.bg}, #fff)`,
              transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${s.color}20` } }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, background: s.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                    {s.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: 600 }}>{s.label}</Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', color: C.primary, lineHeight: 1.1 }}>{s.value}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Liste objectifs */}
      <Grid container spacing={2.5}>
        {objectifs.map(obj => {
          const cat = getCategoryMeta(obj.categorie);
          const pColor = getProgressColor(obj.progression);
          return (
            <Grid item xs={12} md={6} key={obj.id}>
              <Card sx={{
                borderRadius: 3, border: `1.5px solid ${obj.termine ? C.green + '40' : '#E5E7EB'}`,
                background: obj.termine ? `linear-gradient(135deg, ${C.green}06, #fff)` : '#fff',
                transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' },
                opacity: obj.termine ? 0.85 : 1,
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      <IconButton size="small" onClick={() => toggleTermine(obj.id)} sx={{ color: obj.termine ? C.green : '#D1D5DB', p: 0.3 }}>
                        {obj.termine ? <CheckCircle /> : <RadioButtonUnchecked />}
                      </IconButton>
                      <Typography sx={{ fontWeight: 700, color: C.primary, fontSize: '0.95rem',
                        textDecoration: obj.termine ? 'line-through' : 'none', opacity: obj.termine ? 0.7 : 1 }}>
                        {obj.titre}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => deleteObjectif(obj.id)}
                      sx={{ color: '#D1D5DB', '&:hover': { color: C.danger }, ml: 1 }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>

                  {obj.description && (
                    <Typography sx={{ fontSize: '0.82rem', color: '#6B7280', mb: 1.5, pl: 4 }}>
                      {obj.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pl: 4 }}>
                    <Chip label={`${cat.icon} ${obj.categorie}`} size="small"
                      sx={{ background: `${cat.color}15`, color: cat.color, fontWeight: 700, fontSize: '0.72rem', border: `1px solid ${cat.color}30` }} />
                    {obj.echeance && (
                      <Chip label={`📅 ${new Date(obj.echeance).toLocaleDateString('fr-FR')}`} size="small"
                        sx={{ background: '#F9FAFB', color: '#6B7280', fontWeight: 600, fontSize: '0.72rem' }} />
                    )}
                    {obj.termine && (
                      <Chip icon={<EmojiEvents sx={{ fontSize: '0.9rem !important' }} />} label="Terminé" size="small"
                        sx={{ background: `${C.green}15`, color: C.green, fontWeight: 700, fontSize: '0.72rem' }} />
                    )}
                  </Box>

                  <Box sx={{ pl: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>Progression</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: pColor, fontWeight: 800 }}>{obj.progression}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={obj.progression}
                      sx={{ height: 8, borderRadius: 4, background: '#F3F4F6',
                        '& .MuiLinearProgress-bar': { background: pColor, borderRadius: 4 } }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Dialog ajouter */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ fontWeight: 800, color: C.primary, pb: 1 }}>🎯 Nouvel objectif</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField fullWidth label="Titre de l'objectif" value={form.titre}
            onChange={e => setForm({ ...form, titre: e.target.value })}
            sx={{ mb: 2, mt: 1 }} size="small" />
          <TextField fullWidth select label="Catégorie" value={form.categorie}
            onChange={e => setForm({ ...form, categorie: e.target.value })}
            sx={{ mb: 2 }} size="small">
            {CATEGORIES.map(c => <MenuItem key={c.label} value={c.label}>{c.icon} {c.label}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Description" value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            sx={{ mb: 2 }} size="small" multiline rows={2} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField fullWidth label="Échéance" type="date" value={form.echeance}
                onChange={e => setForm({ ...form, echeance: e.target.value })}
                size="small" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Progression (%)" type="number" value={form.progression}
                onChange={e => setForm({ ...form, progression: Math.min(100, Math.max(0, Number(e.target.value))) })}
                size="small" inputProps={{ min: 0, max: 100 }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ borderRadius: '10px', textTransform: 'none', color: '#6B7280' }}>
            Annuler
          </Button>
          <Button onClick={handleAdd} variant="contained" disabled={!form.titre}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, background: C.purple,
              '&:hover': { background: '#7C3AED' } }}>
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
