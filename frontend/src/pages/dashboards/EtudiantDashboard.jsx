import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import {
  Box, Grid, Card, CardContent, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, LinearProgress, Paper, CircularProgress, IconButton, Tooltip,
  Dialog, DialogContent,
} from '@mui/material';
import { InfoOutlined, Close, TrendingUp, TrendingDown, MenuBook, EmojiEvents, Person, EventNote } from '@mui/icons-material';
import mlService from '../../services/mlService';
import { useNavigate } from 'react-router-dom';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from 'recharts';

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

// ── INFO MODAL ─────────────────────────────────────────────────────────────
const CARD_INFO_CONFIGS = {
  radarCompetences: {
    title: 'Radar des Compétences',
    icon: '🎯',
    color: '#3B82F6',
    description: 'Ce graphique radar compare vos notes à la moyenne de classe pour chaque matière. Plus la zone rouge est grande, meilleures sont vos performances.',
    legend: [
      { label: 'Zone rouge (vos notes)', desc: 'Votre performance actuelle', color: '#FF6B6B' },
      { label: 'Zone verte (moyenne)', desc: 'Performance moyenne de la classe', color: '#4ECDC4' },
    ],
    insight: 'Les matières où votre zone dépasse largement la moyenne sont vos points forts. Concentrez vos révisions sur celles où vous êtes en dessous.',
  },
  evolutionMoyenne: {
    title: 'Évolution de la Moyenne',
    icon: '📈',
    color: '#10B981',
    description: "Ce graphique trace l'évolution de votre moyenne par semestre. Il permet de visualiser votre progression académique.",
    legend: [
      { label: 'Tendance ascendante', desc: 'Amélioration continue', color: '#10B981' },
      { label: 'Tendance stable', desc: 'Performance constante', color: '#3B82F6' },
      { label: 'Tendance descendante', desc: 'Baisse à surveiller', color: '#EF4444' },
    ],
    insight: 'Une progression régulière indique une bonne assimilation. Une baisse peut nécessiter un ajustement de votre méthode de travail.',
  },
  notesMatiere: {
    title: 'Notes par Matière',
    icon: '📚',
    color: '#8B5CF6',
    description: 'Ce tableau présente vos résultats pour chaque matière avec comparaison à la moyenne de classe.',
    legend: [
      { label: 'Excellent', desc: 'Note ≥ 16/20', color: '#10B981' },
      { label: 'Bon', desc: 'Note 14–16/20', color: '#3B82F6' },
      { label: 'Correct', desc: 'Note 12–14/20', color: '#F59E0B' },
      { label: 'À améliorer', desc: 'Note < 12/20', color: '#EF4444' },
    ],
    insight: "L'écart avec la moyenne vous positionne par rapport à vos pairs. Un écart positif indique que vous surperformez.",
  },
};

const InfoModal = ({ open, onClose, cfg }) => {
  if (!cfg) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: '24px', border: '1.5px solid #EAF4FF', boxShadow: '0 24px 60px rgba(26,58,107,0.18)' } }}>
      <Box sx={{ px: 3, py: 2.5, background: `linear-gradient(135deg, ${cfg.color}12 0%, #EAF4FF 100%)`,
        borderBottom: `1.5px solid ${cfg.color}20`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: '14px', background: '#fff', border: `1.5px solid ${cfg.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: `0 4px 16px ${cfg.color}18` }}>
            {cfg.icon}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, color: '#1A3A6B', fontSize: '1.05rem' }}>{cfg.title}</Typography>
            <Typography sx={{ color: '#8A9BB0', fontSize: '0.74rem' }}>Guide d'interprétation</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#1A3A6B', opacity: 0.5, borderRadius: '10px',
          '&:hover': { background: `${cfg.color}18`, opacity: 1, transform: 'rotate(90deg)' }, transition: 'all 0.2s' }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 2.5, p: 2.5, borderRadius: '14px', background: '#fff', border: '1px solid #EAF4FF' }}>
          <Typography sx={{ fontWeight: 800, color: '#1A3A6B', fontSize: '0.88rem', mb: 1.2 }}>📖 Comment lire cette carte ?</Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.7 }}>{cfg.description}</Typography>
        </Box>
        {cfg.legend && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 800, color: '#1A3A6B', fontSize: '0.88rem', mb: 1.2 }}>🔑 Légende</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {cfg.legend.map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, borderRadius: '12px',
                  background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0, mt: 0.5, boxShadow: `0 0 6px ${item.color}60` }} />
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: '#1A3A6B', fontSize: '0.82rem' }}>{item.label}</Typography>
                    {item.desc && <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', mt: 0.2 }}>{item.desc}</Typography>}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
        {cfg.insight && (
          <Box sx={{ p: 2.5, borderRadius: '14px', background: `linear-gradient(135deg, ${cfg.color}08, #EAF4FF)`, border: `1px solid ${cfg.color}20` }}>
            <Typography sx={{ fontSize: '0.84rem', color: '#1A3A6B', fontWeight: 600, lineHeight: 1.65 }}>
              💡 <strong>Conseil :</strong> {cfg.insight}
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ── ML PANEL ÉTUDIANT (light theme, DirecteurDashboard style) ──────────────
function EtudiantMLPanel({ prefilledData }) {
  const [m2Pred, setM2Pred] = useState(null);
  const [m2Load, setM2Load] = useState(false);
  const [m3Pred, setM3Pred] = useState(null);
  const [m3Load, setM3Load] = useState(false);

  const dataKey = JSON.stringify(prefilledData);
  useEffect(() => {
    if (!prefilledData) return;
    setM2Load(true);
    mlService.predireRisque(prefilledData.m2)
      .then(r => setM2Pred(r.data))
      .catch(() => {})
      .finally(() => setM2Load(false));
    setM3Load(true);
    mlService.predirePerformance(prefilledData.m3)
      .then(r => setM3Pred(r.data))
      .catch(() => {})
      .finally(() => setM3Load(false));
  }, [dataKey]);

  const risqueColor = m2Pred?.a_risque ? '#EF4444' : '#22c55e';

  return (
    <Box sx={{ mb: 4 }}>
      <Card sx={{
        borderRadius: '20px', overflow: 'hidden',
        border: '1.5px solid #C7D9F5', background: '#fff',
        boxShadow: '0 4px 20px rgba(77,159,255,0.08)',
      }}>
        {/* Header */}
        <Box sx={{
          px: 3, py: 2.5, borderBottom: '1px solid #C7D9F5',
          background: 'linear-gradient(135deg, #EAF4FF 0%, #DBEEFF 100%)',
          display: 'flex', alignItems: 'center', gap: 2,
        }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: '14px',
            background: 'linear-gradient(135deg, #1A3A6B, #4D9FFF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', flexShrink: 0, boxShadow: '0 4px 14px rgba(77,159,255,0.3)',
          }}>🤖</Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 900, color: '#1A3A6B', fontSize: '1.1rem', letterSpacing: '-0.3px' }}>
              Prévisions IA · Mon Profil Académique
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0' }}>
              Modèles M2 · M3 · Calculés à partir de votre historique et résultats actuels
            </Typography>
          </Box>
          <Chip label="IA ACTIVE" size="small" sx={{
            ml: 'auto', flexShrink: 0,
            background: 'linear-gradient(135deg, #1A3A6B, #4D9FFF)',
            color: '#fff', fontWeight: 800, fontSize: '0.7rem',
            borderRadius: '8px', border: 'none',
          }} />
        </Box>

        {/* Body */}
        <Grid container>
          {/* M2 — Risque */}
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 3, borderRight: { md: '1px solid #EAF4FF' }, borderBottom: { xs: '1px solid #EAF4FF', md: 'none' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: '8px', background: 'linear-gradient(135deg, #FF6B35, #FFB347)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>⚠️</Box>
                <Typography sx={{ fontWeight: 800, color: '#1A3A6B', fontSize: '0.85rem' }}>Risque Académique — M2</Typography>
                <Chip label="M2" size="small" sx={{ ml: 'auto', background: '#FF6B3518', color: '#FF6B35', fontWeight: 700, fontSize: '0.62rem', borderRadius: '6px' }} />
              </Box>
              {m2Load ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
                  <CircularProgress size={20} sx={{ color: '#4D9FFF' }} />
                  <Typography sx={{ color: '#8A9BB0', fontSize: '0.8rem' }}>Analyse en cours...</Typography>
                </Box>
              ) : m2Pred ? (
                <Box>
                  <Box sx={{ p: 2.5, borderRadius: '16px', background: `${risqueColor}0e`, border: `1.5px solid ${risqueColor}28`, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.8, mb: 1 }}>
                      <Typography sx={{ fontWeight: 900, fontSize: '3rem', color: risqueColor, lineHeight: 1, letterSpacing: '-2px' }}>
                        {Math.round((m2Pred.probabilite || 0) * 100)}
                      </Typography>
                      <Typography sx={{ color: '#8A9BB0', fontWeight: 600, mb: 0.6, fontSize: '1.1rem' }}>%</Typography>
                      <Chip label={m2Pred.niveau_alerte || (m2Pred.a_risque ? 'Risque' : 'Stable')} size="small" sx={{ ml: 0.5, mb: 0.5, background: `${risqueColor}18`, color: risqueColor, border: `1px solid ${risqueColor}35`, fontWeight: 700, fontSize: '0.68rem' }} />
                    </Box>
                    <LinearProgress variant="determinate" value={(m2Pred.probabilite || 0) * 100}
                      sx={{ height: 7, borderRadius: 4, mb: 1, backgroundColor: `${risqueColor}15`, '& .MuiLinearProgress-bar': { backgroundColor: risqueColor, borderRadius: 4 } }} />
                    <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0' }}>
                      {m2Pred.a_risque ? '⚠️ Situation nécessitant votre attention' : '✅ Situation académique favorable'}
                    </Typography>
                  </Box>
                  {m2Pred.conseil && (
                    <Box sx={{ p: 1.5, borderRadius: '10px', background: '#EAF4FF', border: '1px solid #C7D9F5' }}>
                      <Typography sx={{ fontSize: '0.72rem', color: '#1A3A6B', lineHeight: 1.6 }}>💡 {m2Pred.conseil}</Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography sx={{ color: '#8A9BB0', fontSize: '0.8rem' }}>Service ML non disponible (port 5001)</Typography>
              )}
            </Box>
          </Grid>

          {/* M3 — Performance */}
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: '8px', background: 'linear-gradient(135deg, #7B2CBF, #4D9FFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>🎯</Box>
                <Typography sx={{ fontWeight: 800, color: '#1A3A6B', fontSize: '0.85rem' }}>Performance Future — M3</Typography>
                <Chip label="M3" size="small" sx={{ ml: 'auto', background: '#7B2CBF18', color: '#7B2CBF', fontWeight: 700, fontSize: '0.62rem', borderRadius: '6px' }} />
              </Box>
              {m3Load ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
                  <CircularProgress size={20} sx={{ color: '#7B2CBF' }} />
                  <Typography sx={{ color: '#8A9BB0', fontSize: '0.8rem' }}>Calcul en cours...</Typography>
                </Box>
              ) : m3Pred ? (
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={5}>
                    <Box sx={{ p: 2, borderRadius: '14px', background: `${m3Pred.couleur}0e`, border: `1.5px solid ${m3Pred.couleur}28`, textAlign: 'center' }}>
                      <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.8 }}>Moyenne prédite</Typography>
                      <Typography sx={{ fontWeight: 900, fontSize: '2.2rem', color: m3Pred.couleur, lineHeight: 1, letterSpacing: '-1.5px' }}>
                        {m3Pred.moyenne_finale_predite}
                      </Typography>
                      <Typography sx={{ fontSize: '0.78rem', color: '#8A9BB0', fontWeight: 600 }}>/20</Typography>
                      <Chip label={m3Pred.mention} size="small" sx={{ mt: 0.8, background: `${m3Pred.couleur}18`, color: m3Pred.couleur, border: `1px solid ${m3Pred.couleur}35`, fontWeight: 700, fontSize: '0.62rem' }} />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={7}>
                    <Box sx={{ p: 2, borderRadius: '14px', background: '#FAFBFF', border: '1px solid #E8EEF8', height: '100%' }}>
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#1A3A6B', mb: 1 }}>Grille de mentions</Typography>
                      {[
                        { label: 'Très bien',   seuil: '≥ 16', color: '#22c55e' },
                        { label: 'Bien',        seuil: '≥ 14', color: '#06D6A0' },
                        { label: 'Assez bien',  seuil: '≥ 12', color: '#4D9FFF' },
                        { label: 'Passable',    seuil: '≥ 10', color: '#F59E0B' },
                        { label: 'Insuffisant', seuil: '< 10', color: '#EF4444' },
                      ].map(m => (
                        <Box key={m.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.6 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: m.color, flexShrink: 0, opacity: m3Pred.mention === m.label ? 1 : 0.22 }} />
                          <Typography sx={{ fontSize: '0.68rem', flex: 1, color: m3Pred.mention === m.label ? m.color : '#8A9BB0', fontWeight: m3Pred.mention === m.label ? 800 : 500 }}>
                            {m.label}
                          </Typography>
                          <Typography sx={{ fontSize: '0.62rem', color: '#8A9BB0' }}>{m.seuil}</Typography>
                          {m3Pred.mention === m.label && (
                            <Chip label="✓" size="small" sx={{ height: 16, minWidth: 24, fontSize: '0.58rem', fontWeight: 800, background: `${m.color}18`, color: m.color, '& .MuiChip-label': { px: 0.6 } }} />
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Typography sx={{ color: '#8A9BB0', fontSize: '0.8rem' }}>Service ML non disponible (port 5001)</Typography>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box sx={{ px: 3, pb: 2.5 }}>
          <Box sx={{ p: 2, borderRadius: '12px', background: '#EAF4FF', border: '1px solid #C7D9F540' }}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#1A3A6B', mb: 0.4 }}>Comment sont calculées ces prévisions ?</Typography>
            <Typography sx={{ fontSize: '0.71rem', color: '#64748B', lineHeight: 1.7 }}>
              M2 analyse vos résultats passés, absences et évolution de notes pour évaluer votre risque académique. M3 prédit votre moyenne finale à partir de vos contrôles continus et de votre trajectoire.
            </Typography>
          </Box>
        </Box>
      </Card>
    </Box>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
const EtudiantDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile]         = useState(null);
  const [dashData, setDashData]       = useState(null);
  const [rawNotes, setRawNotes]       = useState([]);
  const [absences, setAbsences]       = useState({ absences: [], stats: { total: 0, justifiees: 0, non_justifiees: 0 } });
  const [loading, setLoading]         = useState(true);
  const [dashLoading, setDashLoading] = useState(true);
  const [absLoading, setAbsLoading]   = useState(true);
  const [infoModal, setInfoModal]     = useState({ open: false, key: null });

  const openInfo  = (key) => setInfoModal({ open: true, key });
  const closeInfo = () => setInfoModal({ open: false, key: null });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    axios.get(`${config.apiUrl}/profile`, { headers })
      .then(r => setProfile(r.data.data))
      .catch(err => console.error('Erreur profil:', err))
      .finally(() => setLoading(false));

    axios.get(`${config.apiUrl}/etudiant/dashboard`, { headers })
      .then(r => setDashData(r.data.data))
      .catch(err => console.error('Erreur données dashboard:', err))
      .finally(() => setDashLoading(false));

    axios.get(`${config.apiUrl}/etudiant/notes`, { headers })
      .then(r => setRawNotes(r.data.data || []))
      .catch(err => console.error('Erreur notes:', err));

    axios.get(`${config.apiUrl}/etudiant/absences`, { headers })
      .then(r => setAbsences(r.data.data || { absences: [], stats: { total: 0, justifiees: 0, non_justifiees: 0 } }))
      .catch(err => console.error('Erreur absences:', err))
      .finally(() => setAbsLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">Impossible de charger votre profil</Typography>
      </Box>
    );
  }

  // ── Calcul depuis les notes brutes (/etudiant/notes) ─────────────────
  const matiereMap = {};
  for (const n of rawNotes) {
    if (!matiereMap[n.id_matiere]) {
      matiereMap[n.id_matiere] = {
        id: n.id_matiere, nom: n.nom_matiere, code: n.code_matiere,
        semestre: n.semestre, sumV: 0, sumC: 0,
      };
    }
    const c = parseFloat(n.coef_examen) || 1;
    matiereMap[n.id_matiere].sumV += parseFloat(n.note) * c;
    matiereMap[n.id_matiere].sumC += c;
  }
  const notesParMatiere = Object.values(matiereMap)
    .map(m => ({ ...m, note: m.sumC > 0 ? Math.round((m.sumV / m.sumC) * 100) / 100 : 0 }))
    .sort((a, b) => parseInt(a.semestre) - parseInt(b.semestre) || a.nom.localeCompare(b.nom));

  const semMap = {};
  for (const n of rawNotes) {
    const s = String(n.semestre);
    if (!semMap[s]) semMap[s] = { sum: 0, count: 0 };
    semMap[s].sum += parseFloat(n.note);
    semMap[s].count++;
  }
  const evolutionCalculee = Object.entries(semMap)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([s, d]) => ({ semestre: `S${s}`, moyenne: Math.round((d.sum / d.count) * 100) / 100 }));

  // ── Données finales : priorité dashData, fallback calcul local ────────
  const alertes         = dashData?.alertes      || [];
  const nbMatieres      = dashData?.stats?.nb_matieres     || 0;
  const semestreActuel  = dashData?.stats?.semestre_actuel || '—';
  const classement      = dashData?.stats?.classement      || '—';

  const matieres = (dashData?.matieres?.length ? dashData.matieres : notesParMatiere.map(m => {
    const note = m.note;
    return {
      nom: m.nom, code: m.code, semestre: m.semestre, note,
      moyenneClasse: 0, ecart: '—',
      statut: note >= 16 ? 'excellent' : note >= 14 ? 'bon' : note >= 12 ? 'correct' : 'ameliorer',
      progression: Math.round((note / 20) * 100),
    };
  }));

  const competencesData = (dashData?.competences?.length ? dashData.competences : notesParMatiere.map(m => ({
    matiere: m.code || m.nom.slice(0, 6),
    note: m.note,
    moyenne: 0,
  })));

  const evolutionData = dashData?.evolution?.length ? dashData.evolution : evolutionCalculee;

  // Limites Y pour le graphe évolution
  const yMin = evolutionData.length
    ? Math.max(0, Math.floor(Math.min(...evolutionData.map(d => d.moyenne)) - 1))
    : 0;
  const yMax = evolutionData.length
    ? Math.min(20, Math.ceil(Math.max(...evolutionData.map(d => d.moyenne)) + 1))
    : 20;

  return (
    <Box sx={{ pb: 4 }}>
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: '#fff', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 2, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>
            {profile.sexe === 'Féminin' || profile.sexe === 'FEMME' ? '👩‍🎓' : '👨‍🎓'}
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1F2937', mb: 0.5 }}>
              Dashboard Étudiant
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              {profile.prenom} {profile.nom}
              {profile.etudiant?.specialite_nom && ` · ${profile.etudiant.specialite_nom}`}
            </Typography>
            {profile.etudiant?.etablissement_nom && (
              <Box
                onClick={() => navigate('/dashboard/etudiant/etablissement')}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, cursor: 'pointer', width: 'fit-content' }}
              >
                <span style={{ fontSize: '0.85rem' }}>🏫</span>
                <Typography
                  variant="caption"
                  sx={{
                    color: COLORS.secondary, fontWeight: 700,
                    textDecoration: 'underline', textDecorationColor: `${COLORS.secondary}50`,
                    textUnderlineOffset: '3px', transition: 'all 0.2s',
                    '&:hover': { color: COLORS.primary, textDecorationColor: COLORS.primary },
                  }}
                >
                  {profile.etudiant.etablissement_nom}
                </Typography>
              </Box>
            )}
            {profile.etudiant?.ville_nom && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                <span style={{ fontSize: '0.85rem' }}>📍</span>
                <Typography variant="caption" sx={{ color: COLORS.primary, fontWeight: 600 }}>
                  {profile.etudiant.ville_nom}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Tooltip title="Mes Cours">
            <IconButton onClick={() => navigate('/dashboard/etudiant/cours')} sx={{
              width: 44, height: 44, borderRadius: '14px',
              background: COLORS.secondary, color: '#fff',
              transition: 'all 0.3s ease', boxShadow: `0 3px 10px ${COLORS.secondary}40`,
              '&:hover': { background: '#2563EB', transform: 'translateY(-2px)', boxShadow: `0 5px 16px ${COLORS.secondary}50` },
            }}>
              <MenuBook sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Mes Notes">
            <IconButton onClick={() => navigate('/dashboard/etudiant/notes')} sx={{
              width: 44, height: 44, borderRadius: '14px',
              background: COLORS.success, color: '#fff',
              transition: 'all 0.3s ease', boxShadow: `0 3px 10px ${COLORS.success}40`,
              '&:hover': { background: '#059669', transform: 'translateY(-2px)', boxShadow: `0 5px 16px ${COLORS.success}50` },
            }}>
              <EmojiEvents sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Mon Profil">
            <IconButton onClick={() => navigate('/dashboard/profile')} sx={{
              width: 44, height: 44, borderRadius: '14px',
              background: COLORS.purple, color: '#fff',
              transition: 'all 0.3s ease', boxShadow: `0 3px 10px ${COLORS.purple}40`,
              '&:hover': { background: '#7C3AED', transform: 'translateY(-2px)', boxShadow: `0 5px 16px ${COLORS.purple}50` },
            }}>
              <Person sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── PRÉDICTIONS ML ─────────────────────────────────────────── */}
      {profile.etudiant && (() => {
        // Use computed average from actual notes if available, else stored value
        const computedMoy = matieres.length > 0
          ? matieres.reduce((s, m) => s + m.note, 0) / matieres.length
          : null;
        const moy = parseFloat((computedMoy ?? parseFloat(profile.etudiant.moyenne_generale) ?? 10).toFixed(2));

        const semRaw = parseInt(dashData?.stats?.semestre_actuel) || 1;
        const niveauMap = { 1: 'L1', 2: 'L1', 3: 'L2', 4: 'L2', 5: 'L3', 6: 'L3' };
        const niveau = niveauMap[semRaw] || 'L1';
        const filiere = profile.etudiant.specialite_nom || 'Informatique';

        // taux_absence: ratio of non-justified absences * 10, min 5 when no data
        const tauxAbs = absences.stats.total > 0
          ? Math.min(100, parseFloat((absences.stats.non_justifiees / absences.stats.total * 30 + absences.stats.total * 1.5).toFixed(1)))
          : 5;

        // participation: decreases with non-justified absences (0–10 scale)
        const participation = Math.max(0, Math.min(10, Math.round(10 - absences.stats.non_justifiees * 0.8)));

        const nbSous10 = matieres.filter(m => m.note < 10).length;
        const ratioNotes = matieres.length > 0 ? (matieres.filter(m => m.note != null && m.note > 0).length / matieres.length) : 0.8;

        // Use real exam notes sorted chronologically as cc1/cc2/cc3 proxies
        const sortedNoteValues = [...rawNotes]
          .sort((a, b) => (a.id_examen || 0) - (b.id_examen || 0))
          .map(n => parseFloat(n.note) || moy)
          .filter(v => v > 0);
        const cc1 = Math.min(20, Math.max(0, parseFloat((sortedNoteValues[0] ?? moy * 0.95).toFixed(2))));
        const cc2 = Math.min(20, Math.max(0, parseFloat((sortedNoteValues[Math.floor(sortedNoteValues.length / 2)] ?? moy).toFixed(2))));
        const cc3 = Math.min(20, Math.max(0, parseFloat((sortedNoteValues[sortedNoteValues.length - 1] ?? moy * 1.05).toFixed(2))));

        const prefilledData = {
          m2: {
            moy_semestre_prec: moy,
            note_cc1: cc1,
            note_cc2: cc2,
            note_cc3: cc3,
            taux_absence: tauxAbs,
            nb_echecs_anterieurs: nbSous10,
            evolution_notes: parseFloat((cc3 - cc1).toFixed(2)),
            participation,
            niveau,
            filiere,
          },
          m3: {
            moy_semestre_prec: moy,
            note_cc1: cc1,
            note_cc2: cc2,
            note_cc3: cc3,
            taux_absence_actuel: tauxAbs,
            pente_evolution: parseFloat((cc3 - cc1).toFixed(2)),
            nb_matieres_sous_10: nbSous10,
            ratio_notes_obtenues: parseFloat(ratioNotes.toFixed(2)),
            niveau,
            filiere,
          },
        };
        return <EtudiantMLPanel prefilledData={prefilledData} />;
      })()}

      {/* ── STATS CARDS ─────────────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            icon: '📚', label: 'Matières', color: COLORS.secondary,
            bg: `linear-gradient(135deg, ${COLORS.secondary}08, ${COLORS.accent}08)`,
            value: nbMatieres > 0 ? String(nbMatieres) : '—',
            sub: semestreActuel !== '—' ? `Semestre ${semestreActuel}` : 'Toutes spécialités',
          },
          {
            icon: '⭐', label: 'Moyenne générale', color: COLORS.success,
            bg: `linear-gradient(135deg, ${COLORS.success}08, ${COLORS.success}15)`,
            value: profile.etudiant?.moyenne_generale != null
              ? `${parseFloat(profile.etudiant.moyenne_generale).toFixed(2)}`
              : '—',
            sub: profile.etudiant?.moyenne_generale != null ? '/20' : 'Non calculée',
          },
          {
            icon: '🏆', label: 'Classement', color: COLORS.warning,
            bg: `linear-gradient(135deg, ${COLORS.warning}08, ${COLORS.warning}15)`,
            value: classement,
            sub: classement !== '—' ? 'Dans la spécialité' : 'Non calculé',
          },
          {
            icon: '📈', label: 'Taux de réussite', color: COLORS.purple,
            bg: `linear-gradient(135deg, ${COLORS.purple}08, ${COLORS.purple}15)`,
            value: matieres.length > 0
              ? `${Math.round((matieres.filter(m => m.note >= 10).length / matieres.length) * 100)}%`
              : profile.etudiant?.moyenne_generale != null
                ? `${parseFloat(profile.etudiant.moyenne_generale) >= 10 ? '100' : '0'}%`
                : '—',
            sub: '≥ 10/20',
          },
          {
            icon: '📋', label: 'Absences', color: COLORS.danger,
            bg: `linear-gradient(135deg, ${COLORS.danger}08, ${COLORS.danger}15)`,
            value: String(absences.stats.total),
            sub: absences.stats.total === 0
              ? 'Aucune absence'
              : `${absences.stats.justifiees} justifiée${absences.stats.justifiees > 1 ? 's' : ''} · ${absences.stats.non_justifiees} non justifiée${absences.stats.non_justifiees > 1 ? 's' : ''}`,
          },
        ].map((s) => (
          <Grid item xs={12} sm={6} md key={s.label}>
            <Card sx={{ borderRadius: 3, border: '1.5px solid #EAF4FF', background: s.bg,
              transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' } }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, background: s.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                    {s.icon}
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>{s.label}</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.primary, mb: 0.3 }}>{s.value}</Typography>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>{s.sub}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── ROW 1: Radar + Alertes ──────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Radar */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>🎯 Radar des compétences</Typography>
                <IconButton size="small" onClick={() => openInfo('radarCompetences')}
                  sx={{ width: 32, height: 32, borderRadius: '10px', background: '#3B82F612', border: '1.5px solid #3B82F625',
                    color: '#3B82F6', '&:hover': { background: '#3B82F6', color: '#fff', transform: 'scale(1.1)' }, transition: 'all 0.2s' }}>
                  <InfoOutlined sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
              {competencesData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={competencesData}>
                      <PolarGrid stroke="#E5E7EB" />
                      <PolarAngleAxis dataKey="matiere" tick={{ fontSize: 11, fill: '#6B7280' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 20]} tick={{ fontSize: 10 }} />
                      <Radar name="Vos notes" dataKey="note" stroke="#FF6B6B" fill="#FF6B6B" fillOpacity={0.3} strokeWidth={2} />
                      <Radar name="Moyenne classe" dataKey="moyenne" stroke="#4ECDC4" fill="#4ECDC4" fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 5" />
                      <Legend />
                      <RechartsTooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                  <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, color: 'text.secondary' }}>
                    📊 Ligne pleine: vos notes | Ligne pointillée: moyenne de classe
                  </Typography>
                </>
              ) : (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>📊</Typography>
                  <Typography color="text.secondary">Aucune note disponible pour le moment</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Alertes */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>🔔 Alertes & Notifications</Typography>
              {alertes.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {alertes.slice(0, 3).map((alerte, i) => (
                    <Paper key={i} sx={{
                      p: 2.5,
                      borderLeft: 4,
                      borderColor: alerte.type === 'warning' ? '#FFB74D' : alerte.type === 'success' ? '#66BB6A' : '#42A5F5',
                      background: alerte.type === 'warning' ? '#FFF3E0' : alerte.type === 'success' ? '#E8F5E9' : '#E3F2FD',
                      borderRadius: 2, transition: 'all 0.2s',
                      '&:hover': { transform: 'translateX(4px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.9rem' }}>
                        {alerte.type === 'warning' ? '⚠️' : alerte.type === 'success' ? '✅' : '📅'} {alerte.titre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {alerte.message}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>✅</Typography>
                  <Typography color="text.secondary">Aucune alerte pour le moment</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── ROW 2: Notes par matière ────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>📚 Notes par matière</Typography>
                <IconButton size="small" onClick={() => openInfo('notesMatiere')}
                  sx={{ width: 32, height: 32, borderRadius: '10px', background: '#8B5CF612', border: '1.5px solid #8B5CF625',
                    color: '#8B5CF6', '&:hover': { background: '#8B5CF6', color: '#fff', transform: 'scale(1.1)' }, transition: 'all 0.2s' }}>
                  <InfoOutlined sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
              {matieres.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ background: '#F9FAFB' }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Matière</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Semestre</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Note</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Moyenne classe</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Écart</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Statut</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Progression</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {matieres.map((matiere, index) => (
                        <TableRow key={index} sx={{ '&:hover': { background: '#F9FAFB' }, transition: 'background 0.2s' }}>
                          <TableCell sx={{ fontSize: '0.9rem', fontWeight: 600 }}>{matiere.nom}</TableCell>
                          <TableCell>
                            <Chip label={`S${matiere.semestre}`} size="small"
                              sx={{ background: '#EFF6FF', color: COLORS.primary, fontWeight: 700, fontSize: '0.72rem' }} />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, fontSize: '1.1rem', color: COLORS.primary }}>
                            {matiere.note}/20
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.9rem' }}>
                            {matiere.moyenneClasse > 0 ? `${matiere.moyenneClasse}/20` : '—'}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem',
                            color: matiere.ecart.startsWith('+') ? '#66BB6A' : '#EF5350' }}>
                            {matiere.moyenneClasse > 0 ? matiere.ecart : '—'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={matiere.statut === 'excellent' ? 'Excellent' : matiere.statut === 'bon' ? 'Bon' : matiere.statut === 'ameliorer' ? 'À améliorer' : 'Correct'}
                              size="small"
                              sx={{
                                background: matiere.statut === 'excellent' ? '#D1FAE5' : matiere.statut === 'bon' ? '#DBEAFE' : matiere.statut === 'ameliorer' ? '#FFF3E0' : '#F3F4F6',
                                color: matiere.statut === 'excellent' ? '#065F46' : matiere.statut === 'bon' ? '#1E40AF' : matiere.statut === 'ameliorer' ? '#E65100' : '#374151',
                                fontWeight: 700, fontSize: '0.75rem',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <LinearProgress variant="determinate" value={matiere.progression}
                                sx={{ width: 120, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: matiere.progression >= 75 ? '#66BB6A' : matiere.progression >= 60 ? '#FFB74D' : '#EF5350',
                                    borderRadius: 4,
                                  } }} />
                              <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 42 }}>
                                {matiere.progression}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>📋</Typography>
                  <Typography color="text.secondary">Aucune note saisie pour le moment</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── ROW 3: Évolution + Recommandations ──────────────────────── */}
      <Grid container spacing={3}>
        {/* Évolution */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>📈 Évolution de ma moyenne</Typography>
                <IconButton size="small" onClick={() => openInfo('evolutionMoyenne')}
                  sx={{ width: 32, height: 32, borderRadius: '10px', background: '#10B98112', border: '1.5px solid #10B98125',
                    color: '#10B981', '&:hover': { background: '#10B981', color: '#fff', transform: 'scale(1.1)' }, transition: 'all 0.2s' }}>
                  <InfoOutlined sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
              {evolutionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="semestre" stroke="#6B7280" tick={{ fontSize: 12 }} />
                    <YAxis domain={[yMin, yMax]} stroke="#6B7280" tick={{ fontSize: 12 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      formatter={(v) => [`${v}/20`, 'Moyenne']} />
                    <Line type="monotone" dataKey="moyenne" stroke="#FF6B6B" strokeWidth={3}
                      dot={{ fill: '#FF6B6B', r: 6 }} name="Moyenne générale" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>📈</Typography>
                  <Typography color="text.secondary">Aucune donnée d'évolution disponible</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recommandations dynamiques */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>💡 Recommandations personnalisées</Typography>

              {/* Matières à améliorer */}
              {matieres.filter(m => m.note < 12).length > 0 && (
                <Box sx={{ mb: 2, p: 2.5, background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
                  borderRadius: '14px', border: '1.5px solid #FFCC80' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#E65100', fontSize: '0.9rem' }}>
                    ⚠️ Matières nécessitant des efforts
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {matieres.filter(m => m.note < 12).map((m, i) => (
                      <Typography key={i} component="li" variant="body2" sx={{ mb: 0.8, lineHeight: 1.6 }}>
                        <strong>{m.nom}</strong> — {m.note}/20
                        {m.moyenneClasse > 0 && ` (moy. classe: ${m.moyenneClasse}/20)`}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Points forts */}
              {matieres.filter(m => m.note >= 15).length > 0 && (
                <Box sx={{ mb: 2, p: 2.5, background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
                  borderRadius: '14px', border: '1.5px solid #A5D6A7' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#2E7D32', fontSize: '0.9rem' }}>
                    🌟 Vos points forts
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {matieres.filter(m => m.note >= 15).map((m, i) => (
                      <Typography key={i} component="li" variant="body2" sx={{ mb: 0.8, lineHeight: 1.6 }}>
                        <strong>{m.nom}</strong> — {m.note}/20 {m.ecart !== '—' && `(${m.ecart})`}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Message si aucune note */}
              {matieres.length === 0 && (
                <Box sx={{ p: 2.5, background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
                  borderRadius: '14px', border: '1.5px solid #90CAF9' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#1565C0', fontSize: '0.9rem' }}>
                    📚 Ressources générales
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    <Typography component="li" variant="body2" sx={{ mb: 0.8, lineHeight: 1.6 }}>
                      MOOC: Algorithmes et structures de données
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.8, lineHeight: 1.6 }}>
                      Tutoriel: Développement Web moderne
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ lineHeight: 1.6 }}>
                      Exercices pratiques sur les bases de données
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── ROW 4: Mes Absences ─────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mt: 0 }}>
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 38, height: 38, borderRadius: '10px', background: `${COLORS.danger}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <EventNote sx={{ color: COLORS.danger, fontSize: 20 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>📋 Mes Absences</Typography>
                </Box>
                {absences.stats.total > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={`${absences.stats.total} absence${absences.stats.total > 1 ? 's' : ''}`}
                      size="small" sx={{ background: '#FEE2E2', color: '#991B1B', fontWeight: 700 }} />
                    <Chip label={`${absences.stats.justifiees} justifiée${absences.stats.justifiees > 1 ? 's' : ''}`}
                      size="small" sx={{ background: '#D1FAE5', color: '#065F46', fontWeight: 700 }} />
                    <Chip label={`${absences.stats.non_justifiees} non justifiée${absences.stats.non_justifiees > 1 ? 's' : ''}`}
                      size="small" sx={{ background: '#FEF3C7', color: '#92400E', fontWeight: 700 }} />
                  </Box>
                )}
              </Box>

              {/* Empty state */}
              {absences.absences.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>✅</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#374151' }}>Aucune absence enregistrée</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: '0.88rem', mt: 0.5 }}>
                    Continuez sur cette lancée !
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ border: '1px solid #E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                  {absences.absences.map((a, i) => {
                    const dateStr = new Date(a.date_absence).toLocaleDateString('fr-FR', {
                      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
                    });
                    return (
                      <Box key={a.id_absence} sx={{
                        display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
                        px: 2.5, py: 1.8,
                        background: a.justifiee
                          ? (i % 2 === 0 ? '#F0FDF4' : '#FAFFF9')
                          : (i % 2 === 0 ? '#FFF5F5' : '#FFFAFA'),
                        borderBottom: i < absences.absences.length - 1 ? '1px solid #F3F4F6' : 'none',
                        borderLeft: `4px solid ${a.justifiee ? '#10B981' : '#EF4444'}`,
                        transition: 'background 0.15s',
                        '&:hover': { background: a.justifiee ? '#DCFCE7' : '#FEE2E2' },
                      }}>
                        {/* Date */}
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, minWidth: 130,
                          color: a.justifiee ? '#065F46' : '#991B1B' }}>
                          {dateStr}
                        </Typography>

                        {/* Type de séance */}
                        <Chip label={a.type_seance} size="small"
                          sx={{ fontWeight: 700, fontSize: '0.75rem',
                            background: a.justifiee ? '#D1FAE5' : '#FEE2E2',
                            color: a.justifiee ? '#065F46' : '#991B1B' }} />

                        {/* Spécialité */}
                        <Typography sx={{ fontSize: '0.85rem', color: '#4B5563', fontWeight: 600, flex: 1 }}>
                          {a.nom_specialite}
                          {a.semestre ? ` — S${a.semestre}` : ''}
                        </Typography>

                        {/* Enseignant */}
                        {a.enseignant_nom && (
                          <Typography sx={{ fontSize: '0.78rem', color: '#6B7280' }}>
                            👤 {a.enseignant_nom}
                          </Typography>
                        )}

                        {/* Statut */}
                        <Chip
                          label={a.justifiee ? '✓ Justifiée' : '✗ Non justifiée'}
                          size="small"
                          sx={{
                            fontWeight: 700, fontSize: '0.75rem',
                            background: a.justifiee ? '#D1FAE5' : '#FEF3C7',
                            color: a.justifiee ? '#065F46' : '#92400E',
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Info Modal */}
      <InfoModal open={infoModal.open} onClose={closeInfo} cfg={CARD_INFO_CONFIGS[infoModal.key]} />

    </Box>
  );
};

export default EtudiantDashboard;
