import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, Grid, IconButton, Tooltip, CircularProgress, keyframes,
  Dialog, DialogContent, DialogActions, DialogTitle, Button, TextField, Alert,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { ArrowBack, Close, InfoOutlined, FileDownload, Edit } from '@mui/icons-material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import mlService from '../services/mlService';
import { exportCSV } from '../utils/csv';

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
  from { opacity:0; transform:translateY(16px); }
  to   { opacity:1; transform:translateY(0);    }
`;
const popIn = keyframes`
  from { opacity:0; transform:scale(0.94); }
  to   { opacity:1; transform:scale(1);    }
`;
const slideLeft = keyframes`
  from { opacity:0; transform:translateX(-16px); }
  to   { opacity:1; transform:translateX(0);     }
`;

// ── ML MODAL CONFIGS ──────────────────────────────
const ML_MODAL_CONFIGS = {
  m1: {
    icon: '🎯',
    title: 'Modèle M1 — Taux de réussite prédit',
    accentColor: C.blue,
    kpis: [
      { icon: '📊', label: 'Type',       value: 'Régression',  color: C.blue   },
      { icon: '📅', label: 'Horizon',    value: '2025-2026',   color: C.green  },
      { icon: '🗃️', label: 'Données',    value: '2 ans réels', color: C.orange },
      { icon: '🏛️', label: 'Portée',    value: 'Département', color: C.purple },
    ],
    description:
      'Ce modèle prédit le taux de réussite attendu pour l\'année académique 2025-2026. Il s\'appuie sur les taux de réussite historiques des deux dernières années académiques, le taux d\'absence moyen des étudiants et le ratio étudiants/enseignants calculés depuis la base de données réelle de ce département.',
    legend: [
      { color: '#22C55E', label: 'Bon (≥ 70%)',    desc: 'Taux de réussite satisfaisant — maintenir les efforts pédagogiques.',      badge: '✅ BON'     },
      { color: '#F59E0B', label: 'Moyen (55–69%)', desc: 'Des améliorations sont possibles — revoir les méthodes d\'enseignement.', badge: '⚠️ MOYEN'   },
      { color: '#EF4444', label: 'Faible (< 55%)', desc: 'Situation préoccupante — des mesures urgentes sont recommandées.',         badge: '🔴 FAIBLE'  },
    ],
    insight:
      'Les deux leviers principaux pour améliorer ce score sont : (1) réduire le taux d\'absence moyen des étudiants et (2) améliorer le ratio d\'encadrement enseignant. Un ratio ≤ 1:20 est associé à de meilleures performances.',
  },
  m3: {
    icon: '📈',
    title: 'Modèle M3 — Performance future prédite',
    accentColor: C.purple,
    kpis: [
      { icon: '🔮', label: 'Type',         value: 'Régression',    color: C.purple },
      { icon: '📝', label: 'Sortie',       value: 'Moy. /20',      color: C.blue   },
      { icon: '📚', label: 'Entrées',      value: 'CC + absence',  color: C.green  },
      { icon: '🏛️', label: 'Portée',      value: 'Département',   color: C.orange },
    ],
    description:
      'Ce modèle prédit la moyenne générale attendue au prochain semestre pour le profil moyen des étudiants de ce département. Il prend en compte la moyenne actuelle, l\'évolution entre les deux derniers semestres, le taux d\'absence, le nombre de matières inférieures à 10/20 et le ratio de matières validées.',
    legend: [
      { color: '#22C55E', label: 'Très bien (≥ 16/20)', desc: 'Trajectoire excellente — valoriser le dossier académique.',             badge: 'TB'  },
      { color: '#4D9FFF', label: 'Bien (14–15.9/20)',   desc: 'Très bon niveau — cibler les matières sous 14 pour atteindre TB.',     badge: 'B'   },
      { color: '#06D6A0', label: 'Assez bien (12–13.9)', desc: 'Niveau satisfaisant — renforcer les fondamentaux.',                   badge: 'AB'  },
      { color: '#F59E0B', label: 'Passable (10–11.9)',   desc: 'Niveau juste — suivi pédagogique ciblé recommandé.',                  badge: 'P'   },
      { color: '#EF4444', label: 'Insuffisant (< 10)',   desc: 'Situation critique — intervention immédiate nécessaire.',             badge: 'INS' },
    ],
    insight:
      'Réduire les absences et améliorer les notes de contrôle continu (CC) sont les facteurs les plus influents sur cette prédiction. Une pente positive (moy. actuelle > moy. précédente) est le meilleur indicateur de progression.',
  },
};

// ── ML INFO DIALOG ────────────────────────────────
function MLInfoDialog({ open, modelKey, onClose, departementNom }) {
  const cfg = ML_MODAL_CONFIGS[modelKey];
  if (!cfg) return null;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          border: `1.5px solid ${C.blueL}`,
          boxShadow: '0 24px 60px rgba(26,58,107,0.18)',
          animation: `${popIn} 0.35s cubic-bezier(0.34,1.56,0.64,1)`,
          overflow: 'hidden',
          background: '#FAFCFF',
        },
      }}
    >
      {/* Header */}
      <Box sx={{
        px: 3, py: 2.5,
        background: `linear-gradient(135deg, ${cfg.accentColor}12 0%, ${C.blueL} 100%)`,
        borderBottom: `1.5px solid ${cfg.accentColor}22`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: '14px',
            background: '#fff', border: `1.5px solid ${cfg.accentColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', boxShadow: `0 4px 16px ${cfg.accentColor}18`,
          }}>
            {cfg.icon}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, color: C.navy, fontSize: '1.05rem', letterSpacing: '-0.3px' }}>
              {cfg.title}
            </Typography>
            <Typography sx={{ color: '#8A9BB0', fontSize: '0.74rem' }}>
              Département · {departementNom}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{
          color: C.navy, opacity: 0.5, borderRadius: '10px',
          transition: 'all 0.2s',
          '&:hover': { background: `${cfg.accentColor}18`, opacity: 1, transform: 'rotate(90deg)' },
        }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {/* KPIs */}
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          {cfg.kpis.map((kpi, i) => (
            <Grid item xs={6} sm={3} key={i}>
              <Box sx={{
                p: 1.8, borderRadius: '14px',
                background: `${kpi.color}10`, border: `1px solid ${kpi.color}22`,
                textAlign: 'center',
                animation: `${popIn} 0.4s ease-out ${i * 0.07}s both`,
              }}>
                <Typography sx={{ fontSize: '1.4rem', mb: 0.4 }}>{kpi.icon}</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: '1.05rem', color: kpi.color, letterSpacing: '-0.3px' }}>
                  {kpi.value}
                </Typography>
                <Typography sx={{ fontSize: '0.68rem', color: '#8A9BB0', fontWeight: 600 }}>{kpi.label}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Description */}
        <Box sx={{ mb: 2.5, p: 2.5, borderRadius: '14px', background: '#fff', border: `1px solid ${C.blueL}` }}>
          <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.88rem', mb: 1.2 }}>
            📖 Comment lire cette carte ?
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.7 }}>
            {cfg.description}
          </Typography>
        </Box>

        {/* Legend */}
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.88rem', mb: 1.2 }}>
            🔑 Interprétation des résultats
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {cfg.legend.map((item, i) => (
              <Box key={i} sx={{
                display: 'flex', alignItems: 'flex-start', gap: 1.5,
                p: 1.5, borderRadius: '12px',
                background: `${item.color}08`, border: `1px solid ${item.color}20`,
                animation: `${slideLeft} 0.35s ease-out ${i * 0.06}s both`,
              }}>
                <Box sx={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: item.color, flexShrink: 0, mt: 0.5,
                  boxShadow: `0 0 6px ${item.color}60`,
                }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, color: C.navy, fontSize: '0.82rem' }}>{item.label}</Typography>
                  {item.desc && (
                    <Typography sx={{ fontSize: '0.74rem', color: '#6B7280', mt: 0.2 }}>{item.desc}</Typography>
                  )}
                </Box>
                {item.badge && (
                  <Chip label={item.badge} size="small" sx={{
                    height: 20, fontSize: '0.65rem', fontWeight: 800,
                    background: `${item.color}18`, color: item.color,
                    border: `1px solid ${item.color}30`, flexShrink: 0,
                  }} />
                )}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Insight */}
        <Box sx={{
          p: 2.5, borderRadius: '14px',
          background: `linear-gradient(135deg, ${cfg.accentColor}08, ${C.blueL})`,
          border: `1px solid ${cfg.accentColor}20`,
        }}>
          <Typography sx={{ fontSize: '0.84rem', color: C.navy, fontWeight: 600, lineHeight: 1.7 }}>
            💡 <strong>Conseil :</strong> {cfg.insight}
          </Typography>
        </Box>
      </DialogContent>

      {/* Footer */}
      <Box sx={{ px: 3, py: 2, borderTop: `1px solid ${C.blueL}`, display: 'flex', justifyContent: 'flex-end', background: '#fff' }}>
        <Button onClick={onClose} variant="contained" sx={{
          borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3,
          background: `linear-gradient(135deg, ${cfg.accentColor}, ${cfg.accentColor}BB)`,
          boxShadow: `0 4px 16px ${cfg.accentColor}30`,
          '&:hover': { boxShadow: `0 6px 20px ${cfg.accentColor}45`, transform: 'translateY(-1px)' },
          transition: 'all 0.2s',
        }}>
          Fermer
        </Button>
      </Box>
    </Dialog>
  );
}

// ── TABLE HEADER CELL ─────────────────────────────
const TH = ({ children, center }) => (
  <TableCell sx={{
    fontWeight: 700, fontSize: '0.72rem',
    textTransform: 'uppercase', letterSpacing: '0.8px',
    color: '#8A9BB0', py: 1.5,
    textAlign: center ? 'center' : 'left',
  }}>
    {children}
  </TableCell>
);

// ── STAT MINI BOX ─────────────────────────────────
const StatBox = ({ icon, label, value, color, bg }) => (
  <Box sx={{
    display: 'flex', alignItems: 'center', gap: 1.5,
    p: 1.8, borderRadius: '14px',
    background: bg, border: `1.5px solid ${color}20`,
    transition: 'all 0.2s',
    '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 6px 18px ${color}18` },
  }}>
    <Box sx={{
      width: 38, height: 38, borderRadius: '10px',
      background: `${color}18`, border: `1px solid ${color}28`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.1rem', flexShrink: 0,
    }}>
      {icon}
    </Box>
    <Box>
      <Typography sx={{ fontSize: '0.68rem', color: '#8A9BB0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</Typography>
      <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', color, lineHeight: 1.1 }}>{value}</Typography>
    </Box>
  </Box>
);

// ── INFO ROW ──────────────────────────────────────
const InfoRow = ({ label, value }) => (
  <Box sx={{ py: 1.4, borderBottom: `1px solid ${C.blueL}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>{label}</Typography>
    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: C.navy, textAlign: 'right' }}>{value || '—'}</Typography>
  </Box>
);

// ── MAIN COMPONENT ────────────────────────────────
const DetailDepartement = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const _user     = JSON.parse(localStorage.getItem('user') || '{}');
  const _role     = _user.role?.toLowerCase();
  const _isAdmin  = _role === 'admin' || _role === 'admin_mesrs';
  const _isRect   = _role === 'recteur';

  const deptApiBase = _isAdmin ? '/etablissements/departements'
                    : _isRect  ? '/etablissements/recteur/departements'
                    :            '/directeur/departements';

  const specialitesPath    = _isAdmin ? 'dept-specialites' : 'specialites';
  const backPath           = (_isAdmin || _isRect) ? null : '/dashboard/directeur/departements';
  const breadcrumbLabel    = (_isAdmin || _isRect) ? 'Retour établissement' : 'Départements';

  const [departement,      setDepartement]      = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [activeTab,        setActiveTab]        = useState(0);
  const [niveaux,          setNiveaux]          = useState([]);
  const [specialites,      setSpecialites]      = useState([]);
  const [enseignants,      setEnseignants]      = useState([]);
  const [etudiantsRisque,  setEtudiantsRisque]  = useState([]);
  const [expandedRisqueSpecs, setExpandedRisqueSpecs] = useState(new Set());
  const [loadingTab,       setLoadingTab]       = useState(false);

  // ML states
  const [mlStats,      setMlStats]      = useState(null);
  const [mlPred,       setMlPred]       = useState(null);   // M1 result
  const [mlPerfPred,   setMlPerfPred]   = useState(null);   // M3 result
  const [mlLoading,    setMlLoading]    = useState(false);
  const [mlInfoOpen,   setMlInfoOpen]   = useState(null);   // 'm1' | 'm3' | null
  const [mlProjMode,   setMlProjMode]   = useState('annee');
  const [mlProjection, setMlProjection] = useState([]);
  const [mlProjLoad,   setMlProjLoad]   = useState(false);
  const [m3Proj,       setM3Proj]       = useState([]);
  const [m3ProjLoad,   setM3ProjLoad]   = useState(false);

  // Edit dialog state
  const [editOpen,    setEditOpen]    = useState(false);
  const [editNom,     setEditNom]     = useState('');
  const [editCode,    setEditCode]    = useState('');
  const [editSaving,  setEditSaving]  = useState(false);
  const [editError,   setEditError]   = useState('');

  useEffect(() => { fetchDepartement(); }, [id]); // eslint-disable-line

  useEffect(() => {
    if (departement && id) fetchTabData();
  }, [activeTab, departement, id]); // eslint-disable-line

  useEffect(() => {
    if (id) fetchMLData();
  }, [id]); // eslint-disable-line

  const fetchDepartement = async () => {
    try {
      const endpoint = (_isAdmin || _isRect) ? `${deptApiBase}/${id}/detail` : `${deptApiBase}/${id}`;
      const res = await api.get(endpoint);
      if (res.data.success) {
        setDepartement(res.data.departement);
        setNiveaux(res.data.niveaux || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchMLData = async () => {
    setMlLoading(true);
    try {
      const res = await api.get(`${deptApiBase}/${id}/ml-data`);
      if (res.data.success) {
        setMlStats(res.data.stats);
        const [r1, r3] = await Promise.all([
          mlService.predireReussite(res.data.m1).catch(() => null),
          mlService.predirePerformance(res.data.m3).catch(() => null),
        ]);
        if (r1?.data) setMlPred(r1.data);
        if (r3?.data) setMlPerfPred(r3.data);
      }
    } catch (e) { console.error('ML dept error:', e); }
    finally { setMlLoading(false); }
  };

  const fetchTabData = async () => {
    setLoadingTab(true);
    try {
      if (activeTab === 1) {
        const res = await api.get(`${deptApiBase}/${id}/${specialitesPath}`);
        if (res.data.success) setSpecialites(res.data.specialites);
      } else if (activeTab === 2) {
        const res = await api.get(`${deptApiBase}/${id}/enseignants`);
        if (res.data.success) setEnseignants(res.data.enseignants);
      } else if (activeTab === 3) {
        const res = await api.get(`${deptApiBase}/${id}/etudiants-risque`);
        if (res.data.success) {
          setEtudiantsRisque(res.data.etudiants);
          // auto-développer toutes les spécialités
          const specs = new Set(res.data.etudiants.map(e => e.nom_specialite || '— Sans spécialité —'));
          setExpandedRisqueSpecs(specs);
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoadingTab(false); }
  };

  const projeterDeptM1 = async () => {
    if (!mlStats) return;
    setMlProjLoad(true); setMlProjection([]);
    const results = [];
    let an1 = mlStats.taux_reussite_an1 ?? 76;
    let an2 = mlStats.taux_reussite_an2 ?? 74;
    try {
      for (let year = 2026; year <= 2030; year++) {
        const { data } = await mlService.predireReussite({
          taux_reussite_an1: an1, taux_reussite_an2: an2,
          taux_absence_moyen: mlStats.taux_absence ?? 15.0,
          ratio_etud_ens: 18, budget_par_etud: 5000,
          nb_labos: 5, taux_rotation_ens: 8.0,
          region: departement?.nom_region || 'Grand Tunis',
          type_etablissement: 'Université',
        });
        results.push({ year: `${year}`, taux: data.taux_reussite_predit, couleur: data.couleur, interp: data.interpretation });
        an2 = an1; an1 = data.taux_reussite_predit;
      }
      setMlProjection(results);
    } catch (e) { console.error('M1 proj dept:', e); }
    finally { setMlProjLoad(false); }
  };

  const projeterDeptM3 = async () => {
    if (!mlStats) return;
    setM3ProjLoad(true); setM3Proj([]);
    const results = [];
    let moy = mlStats.moy_actuelle ?? 12;
    try {
      for (let year = 2026; year <= 2030; year++) {
        const { data } = await mlService.predirePerformance({
          moy_semestre_prec: moy,
          note_cc1: Math.round(Math.min(20, moy + 0.3) * 10) / 10,
          note_cc2: moy,
          note_cc3: Math.round(Math.min(20, moy + 0.5) * 10) / 10,
          taux_absence_actuel: mlStats.taux_absence ?? 15.0,
          pente_evolution: 0.4,
          nb_matieres_sous_10: 1,
          ratio_notes_obtenues: Math.min(1, Math.max(0, (mlStats.taux_reussite_an1 ?? 70) / 100)),
          niveau: 'L3', filiere: 'Ingénierie',
        });
        results.push({ year: `${year}`, moyenne: data.moyenne_finale_predite, mention: data.mention, couleur: data.couleur });
        moy = data.moyenne_finale_predite;
      }
      setM3Proj(results);
    } catch (e) { console.error('M3 proj dept:', e); }
    finally { setM3ProjLoad(false); }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 10, gap: 2 }}>
      <CircularProgress size={32} sx={{ color: C.blue }} />
      <Typography sx={{ color: '#8A9BB0', fontSize: '0.85rem' }}>Chargement du département...</Typography>
    </Box>
  );

  if (!departement) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
      <Typography sx={{ fontSize: '2.5rem', opacity: 0.3 }}>🏛️</Typography>
      <Typography sx={{ fontWeight: 600, color: C.navy }}>Département non trouvé</Typography>
    </Box>
  );

  const nbRisque = etudiantsRisque.filter(e => e.risque?.niveau_alerte !== 'VERT').length;
  const tabCount = [
    departement.nombre_niveaux    || 0,
    departement.nombre_specialites || 0,
    departement.nombre_enseignants || 0,
    activeTab === 3 ? nbRisque : '⚠',
  ];

  // ── Export CSV pour l'onglet actif ──
  const handleExportCSV = () => {
    const deptSlug = (departement.nom_departement || 'departement')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 60);

    if (activeTab === 0) {
      exportCSV(`${deptSlug}_niveaux`,
        [
          { key: 'code_niveau',        label: 'Code'        },
          { key: 'nom_niveau',         label: 'Niveau'      },
          { key: 'nombre_specialites', label: 'Spécialités' },
          { key: 'nombre_etudiants',   label: 'Étudiants'   },
        ], niveaux);
    } else if (activeTab === 1) {
      exportCSV(`${deptSlug}_specialites`,
        [
          { key: 'code_specialite',  label: 'Code'      },
          { key: 'nom_specialite',   label: 'Spécialité' },
          { key: 'nom_niveau',       label: 'Niveau'    },
          { key: 'nombre_etudiants', label: 'Étudiants' },
        ], specialites);
    } else if (activeTab === 2) {
      exportCSV(`${deptSlug}_enseignants`,
        [
          { key: 'numero_utilisateur', label: 'Matricule'  },
          { key: 'grade',              label: 'Grade'      },
          { key: 'specialite',         label: 'Spécialité' },
        ], enseignants);
    } else if (activeTab === 3) {
      exportCSV(`${deptSlug}_etudiants_risque`,
        [
          { key: 'matricule',       label: 'Matricule'        },
          { key: 'nom_specialite',  label: 'Spécialité'       },
          { key: 'niveau',          label: 'Niveau'           },
          { key: 'moy_actuelle',    label: 'Moyenne /20'      },
          { key: 'taux_absence',    label: 'Absence (%)'      },
          { key: 'nb_matieres_echec', label: 'Matières échec' },
          { key: 'niveau_alerte',   label: 'Niveau de risque' },
          { key: 'probabilite',     label: 'Probabilité'      },
        ], etudiantsRisque.map(e => ({
          matricule:        e.numero_etudiant || e.numero_utilisateur || '',
          nom_specialite:   e.nom_specialite || '',
          niveau:           e.niveau || '',
          moy_actuelle:     e.moy_actuelle,
          taux_absence:     e.taux_absence,
          nb_matieres_echec: e.nb_matieres_echec,
          niveau_alerte:    e.risque?.niveau_alerte || 'VERT',
          probabilite:      e.risque?.probabilite || 0,
        })));
    }
  };

  const tabHasData = [niveaux.length, specialites.length, enseignants.length, etudiantsRisque.length][activeTab] > 0;

  const EmptyTab = ({ icon, text }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
      <Typography sx={{ fontSize: '2rem', opacity: 0.3 }}>{icon}</Typography>
      <Typography sx={{ color: '#8A9BB0', fontSize: '0.85rem' }}>{text}</Typography>
    </Box>
  );

  const LoadingTab = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6, gap: 2 }}>
      <CircularProgress size={22} sx={{ color: C.blue }} />
      <Typography sx={{ color: '#8A9BB0', fontSize: '0.82rem' }}>Chargement...</Typography>
    </Box>
  );

  return (
    <Box sx={{ animation: `${fadeUp} 0.4s ease both`, pb: 6 }}>

      {/* ══ HEADER ════════════════════════════════ */}
      <Card sx={{
        borderRadius: '22px', border: `1.5px solid ${C.blueL}`,
        boxShadow: '0 4px 16px rgba(26,58,107,0.08)',
        overflow: 'hidden', mb: 3,
      }}>
        {/* Cover gradient */}
        <Box sx={{
          height: 96,
          background: `linear-gradient(135deg, ${C.blueL} 0%, #D6EEFF 60%, #EAF4FF 100%)`,
          position: 'relative',
          '&::before': {
            content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
            background: `linear-gradient(90deg, ${C.blue}, ${C.blueB}, ${C.green})`,
          },
          '&::after': {
            content: '""', position: 'absolute', inset: 0,
            backgroundImage: `radial-gradient(circle, ${C.blue}14 1px, transparent 1px)`,
            backgroundSize: '22px 22px',
          },
        }} />
        {/* Identity row */}
        <Box sx={{ px: 3.5, pb: 2.5, display: 'flex', alignItems: 'flex-end', gap: 2.5, mt: '-40px', position: 'relative', zIndex: 2 }}>
          <Box sx={{
            width: 76, height: 76, borderRadius: '20px',
            border: '4px solid #fff',
            background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.9rem', flexShrink: 0,
            boxShadow: `0 6px 22px ${C.blue}35`,
          }}>
            🏛️
          </Box>
          <Box sx={{ pb: 0.5, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.5 }}>
              <Typography
                onClick={() => backPath ? navigate(backPath) : navigate(-1)}
                sx={{ fontSize: '0.72rem', color: C.blue, fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              >
                {breadcrumbLabel}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0' }}>›</Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0', fontWeight: 500 }}>{departement.code_departement}</Typography>
            </Box>
            <Typography sx={{ fontWeight: 900, fontSize: '1.25rem', color: C.navy, mb: 0.6, letterSpacing: '-0.4px' }}>
              {departement.nom_departement}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="DÉPARTEMENT" size="small"
                sx={{ background: C.blueL, color: C.blue, fontWeight: 700, fontSize: '0.72rem', border: `1px solid ${C.blue}28`, borderRadius: '8px', height: 22 }} />
              <Chip label="● Actif" size="small"
                sx={{ background: '#d1fae5', color: '#065f46', fontWeight: 700, fontSize: '0.72rem', borderRadius: '8px', height: 22, border: '1px solid #a7f3d0' }} />
              <Typography sx={{ fontSize: '0.78rem', color: '#8A9BB0', fontWeight: 500 }}>
                {departement.nom_etablissement}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, pb: 0.5, flexShrink: 0 }}>
            {[
              { label: 'Étudiants',    value: departement.nombre_etudiants   || 0, color: C.blue   },
              { label: 'Enseignants',  value: departement.nombre_enseignants  || 0, color: C.green  },
              { label: 'Spécialités',  value: departement.nombre_specialites  || 0, color: C.purple },
            ].map((s, i) => (
              <Box key={i} sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                px: 2, py: 1.2, borderRadius: '12px',
                background: `${s.color}08`, border: `1.5px solid ${s.color}20`,
                minWidth: 68, transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 5px 14px ${s.color}18`, background: `${s.color}12` },
              }}>
                <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', color: s.color, lineHeight: 1 }}>{s.value}</Typography>
                <Typography sx={{ fontSize: '0.62rem', color: '#8A9BB0', mt: 0.4, fontWeight: 600 }}>{s.label}</Typography>
              </Box>
            ))}
            <Box sx={{ display: 'flex', gap: 0.75 }}>
              <Tooltip title={tabHasData ? 'Exporter en CSV' : 'Aucune donnée'}>
                <span>
                  <IconButton onClick={handleExportCSV} disabled={!tabHasData}
                    sx={{ width: 44, height: 44, borderRadius: '14px', background: '#F0FDF4', border: '2px solid #86EFAC', color: C.green, transition: 'all 0.3s ease',
                      '&:hover': { background: '#DCFCE7', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(6, 214, 160, 0.25)' },
                      '&.Mui-disabled': { background: '#F1F5F9', border: '2px solid #E2E8F0', color: '#94A3B8' } }}>
                    <FileDownload sx={{ fontSize: 20 }} />
                  </IconButton>
                </span>
              </Tooltip>
              {(_isAdmin || _isRect) && (
                <Tooltip title="Modifier le département">
                  <IconButton onClick={() => { setEditNom(departement.nom_departement); setEditCode(departement.code_departement); setEditError(''); setEditOpen(true); }}
                    sx={{ width: 44, height: 44, borderRadius: '14px', background: '#FEF3C7', border: '2px solid #FDE68A', color: '#D97706', transition: 'all 0.3s ease',
                      '&:hover': { background: '#FDE68A', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(217,119,6,0.25)' } }}>
                    <Edit sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Retour">
                <IconButton onClick={() => backPath ? navigate(backPath) : navigate(-1)}
                  sx={{ width: 44, height: 44, borderRadius: '14px', background: '#F0F4FF', border: '2px solid rgba(59,130,246,0.25)', color: '#3B82F6', transition: 'all 0.3s ease',
                    '&:hover': { background: 'rgba(59,130,246,0.12)', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(59,130,246,0.15)' } }}>
                  <ArrowBack sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Card>
      {/* ══ EDIT DIALOG ══════════════════════════ */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 0.5 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1rem', color: C.navy, pb: 1 }}>
          Modifier le département
        </DialogTitle>
        <DialogContent>
          {editError && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{editError}</Alert>}
          <TextField
            label="Nom du département" fullWidth value={editNom}
            onChange={e => setEditNom(e.target.value)}
            sx={{ mb: 2, mt: 0.5 }}
            size="small"
          />
          <TextField
            label="Code département" fullWidth value={editCode}
            onChange={e => setEditCode(e.target.value.toUpperCase())}
            size="small"
            inputProps={{ maxLength: 20 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setEditOpen(false)} variant="outlined"
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, borderColor: '#CBD5E1', color: '#64748B' }}>
            Annuler
          </Button>
          <Button
            variant="contained" disabled={editSaving || !editNom.trim()}
            onClick={async () => {
              setEditSaving(true); setEditError('');
              try {
                const token = localStorage.getItem('token');
                const url = `${deptApiBase}/${id}`;
                await api.put(url, { nom_departement: editNom.trim(), code_departement: editCode.trim() }, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                setDepartement(prev => ({ ...prev, nom_departement: editNom.trim(), code_departement: editCode.trim() }));
                setEditOpen(false);
              } catch (err) {
                setEditError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
              } finally {
                setEditSaving(false);
              }
            }}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`, boxShadow: 'none' }}>
            {editSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══ ML PREDICTIONS ═══════════════════════ */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>

        {/* ── M1 : Taux de réussite prédit ── */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            borderRadius: '18px', border: '1.5px solid #C7D9F5', overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(77,159,255,0.08)',
            animation: `${fadeUp} 0.4s ease-out 0.3s both`,
          }}>
            {/* Header */}
            <Box sx={{
              px: 2.5, py: 2,
              borderBottom: `1px solid #C7D9F5`,
              background: `linear-gradient(135deg, #EAF4FF 0%, #DBEEFF 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #1A3A6B, #4D9FFF)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', boxShadow: '0 3px 10px rgba(77,159,255,0.3)' }}>🎯</Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#1A3A6B' }}>Prédiction taux de réussite</Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0' }}>Modèle M1 · Prévision 2025-2026</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label="M1" size="small" sx={{ background: 'linear-gradient(135deg, #1A3A6B, #4D9FFF)', color: '#fff', fontWeight: 800, fontSize: '0.65rem', border: 'none' }} />
                <Tooltip title="Explication du modèle" arrow>
                  <IconButton size="small" onClick={() => setMlInfoOpen('m1')} sx={{
                    width: 30, height: 30, borderRadius: '9px',
                    background: `rgba(77,159,255,0.12)`, border: `1.5px solid rgba(77,159,255,0.25)`, color: '#1A3A6B',
                    transition: 'all 0.2s',
                    '&:hover': { background: '#4D9FFF', color: '#fff', transform: 'scale(1.1)' },
                  }}>
                    <InfoOutlined sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <CardContent sx={{ p: 2.5 }}>
              {mlLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3, gap: 1.5 }}>
                  <CircularProgress size={20} sx={{ color: C.blue }} />
                  <Typography sx={{ fontSize: '0.8rem', color: '#8A9BB0' }}>Calcul en cours…</Typography>
                </Box>
              ) : mlPred ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
                    <ToggleButtonGroup
                      value={mlProjMode} exclusive size="small"
                      onChange={(_, v) => {
                        if (!v) return;
                        setMlProjMode(v);
                        if (v === 'projection') {
                          if (!mlProjection.length) projeterDeptM1();
                          if (!m3Proj.length) projeterDeptM3();
                        }
                      }}
                      sx={{ background: '#fff', borderRadius: '10px', border: '1px solid #E5E7EB', overflow: 'hidden' }}
                    >
                      <ToggleButton value="annee" sx={{ textTransform: 'none', fontSize: '0.72rem', fontWeight: 700, px: 1.5, py: 0.5, border: 'none', '&.Mui-selected': { background: C.blue, color: '#fff' } }}>
                        Année en cours
                      </ToggleButton>
                      <ToggleButton value="projection" sx={{ textTransform: 'none', fontSize: '0.72rem', fontWeight: 700, px: 1.5, py: 0.5, border: 'none', '&.Mui-selected': { background: C.blue, color: '#fff' } }}>
                        → 2030
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                  {mlProjMode === 'annee' ? (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 2 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: '3rem', color: mlPred.couleur, lineHeight: 1, letterSpacing: '-2px' }}>
                          {mlPred.taux_reussite_predit}
                        </Typography>
                        <Typography sx={{ fontWeight: 700, color: mlPred.couleur, mb: 0.6, fontSize: '1.1rem' }}>%</Typography>
                        <Box sx={{ ml: 1, mb: 0.8, px: 1.5, py: 0.4, borderRadius: '8px', background: `${mlPred.couleur}15`, border: `1px solid ${mlPred.couleur}30` }}>
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: mlPred.couleur }}>{mlPred.interpretation}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ mb: 2.5 }}>
                        <Box sx={{ height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', borderRadius: 4, width: `${mlPred.taux_reussite_predit}%`, background: `linear-gradient(90deg, ${mlPred.couleur}, ${mlPred.couleur}CC)`, transition: 'width 1s ease' }} />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography sx={{ fontSize: '0.65rem', color: '#8A9BB0' }}>0%</Typography>
                          <Typography sx={{ fontSize: '0.65rem', color: '#8A9BB0' }}>100%</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {[
                          { label: 'An n-2 réel', value: mlStats?.taux_reussite_an2 != null ? `${mlStats.taux_reussite_an2}%` : '—' },
                          { label: 'An n-1 réel', value: mlStats?.taux_reussite_an1 != null ? `${mlStats.taux_reussite_an1}%` : '—' },
                          { label: 'Prédit n',    value: `${mlPred.taux_reussite_predit}%`, highlight: true, color: mlPred.couleur },
                        ].map((item, i) => (
                          <Box key={i} sx={{ flex: 1, p: 1.2, borderRadius: '10px', textAlign: 'center', background: item.highlight ? `${item.color}10` : '#F8FAFC', border: `1px solid ${item.highlight ? item.color + '30' : '#E5E7EB'}` }}>
                            <Typography sx={{ fontSize: '0.62rem', color: '#8A9BB0', fontWeight: 700, textTransform: 'uppercase', mb: 0.3 }}>{item.label}</Typography>
                            <Typography sx={{ fontWeight: 900, fontSize: '0.95rem', color: item.highlight ? item.color : C.navy }}>{item.value}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </>
                  ) : (
                    <Box>
                      {mlProjLoad ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3, gap: 1.5 }}>
                          <CircularProgress size={18} sx={{ color: C.blue }} />
                          <Typography sx={{ fontSize: '0.8rem', color: '#8A9BB0' }}>Projection en cours…</Typography>
                        </Box>
                      ) : (
                        <>
                          <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={mlProjection.map(d => ({ annee: d.year, taux: d.taux }))}>
                              <defs>
                                <linearGradient id="m1ProjGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={C.blue} stopOpacity={0.35} />
                                  <stop offset="95%" stopColor={C.blue} stopOpacity={0.03} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                              <XAxis dataKey="annee" tick={{ fill: '#8A9BB0', fontSize: 10 }} axisLine={false} tickLine={false} />
                              <YAxis domain={[60, 100]} tick={{ fill: '#8A9BB0', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={38} />
                              <RechartsTooltip
                                contentStyle={{ background: '#fff', border: '1.5px solid #EAF4FF', borderRadius: 10, fontSize: 12 }}
                                formatter={v => [`${typeof v === 'number' ? v.toFixed(1) : v}%`, 'Taux de réussite']}
                              />
                              <Area type="monotone" dataKey="taux" stroke={C.blue} strokeWidth={2.5} fill="url(#m1ProjGrad)" dot={{ fill: C.blue, strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: C.blue }} />
                            </AreaChart>
                          </ResponsiveContainer>
                          {mlProjection.length > 1 && (() => {
                            const first = mlProjection[0].taux;
                            const last = mlProjection[mlProjection.length - 1].taux;
                            const diff = Math.round((last - first) * 10) / 10;
                            return (
                              <Box sx={{ mt: 1, px: 1.5, py: 0.8, borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: 0.8, background: diff >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${diff >= 0 ? '#86efac' : '#fca5a5'}` }}>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: diff >= 0 ? '#15803d' : '#dc2626' }}>
                                  {diff >= 0 ? '📈 +' : '📉 '}{diff}% tendance 2026→2030
                                </Typography>
                              </Box>
                            );
                          })()}
                        </>
                      )}
                    </Box>
                  )}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography sx={{ fontSize: '1.5rem', mb: 1, opacity: 0.3 }}>🤖</Typography>
                  <Typography sx={{ fontSize: '0.82rem', color: '#8A9BB0' }}>Données insuffisantes pour la prédiction</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── M3 : Performance future ── */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            borderRadius: '18px', border: '1.5px solid #DDD0F5', overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(123,44,191,0.08)',
            animation: `${fadeUp} 0.4s ease-out 0.38s both`,
          }}>
            {/* Header */}
            <Box sx={{
              px: 2.5, py: 2,
              borderBottom: `1px solid #DDD0F5`,
              background: `linear-gradient(135deg, #F3EEFF 0%, #E8D5FF 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #5b1a9e, #7B2CBF)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', boxShadow: '0 3px 10px rgba(123,44,191,0.3)' }}>📈</Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#3b1366' }}>Performance future</Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#8A9BB0' }}>Modèle M3 · Moyenne prédite prochain semestre</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label="M3" size="small" sx={{ background: 'linear-gradient(135deg, #5b1a9e, #7B2CBF)', color: '#fff', fontWeight: 800, fontSize: '0.65rem', border: 'none' }} />
                <Tooltip title="Explication du modèle" arrow>
                  <IconButton size="small" onClick={() => setMlInfoOpen('m3')} sx={{
                    width: 30, height: 30, borderRadius: '9px',
                    background: `rgba(123,44,191,0.1)`, border: `1.5px solid rgba(123,44,191,0.22)`, color: '#7B2CBF',
                    transition: 'all 0.2s',
                    '&:hover': { background: '#7B2CBF', color: '#fff', transform: 'scale(1.1)' },
                  }}>
                    <InfoOutlined sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <CardContent sx={{ p: 2.5 }}>
              {mlLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3, gap: 1.5 }}>
                  <CircularProgress size={20} sx={{ color: C.purple }} />
                  <Typography sx={{ fontSize: '0.8rem', color: '#8A9BB0' }}>Calcul en cours…</Typography>
                </Box>
              ) : mlPerfPred ? (
                <>
                  {mlProjMode === 'annee' ? (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 2 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: '3rem', color: mlPerfPred.couleur, lineHeight: 1, letterSpacing: '-2px' }}>
                          {mlPerfPred.moyenne_finale_predite}
                        </Typography>
                        <Typography sx={{ fontWeight: 700, color: mlPerfPred.couleur, mb: 0.6, fontSize: '1.1rem' }}>/20</Typography>
                        <Box sx={{ ml: 1, mb: 0.8, px: 1.5, py: 0.4, borderRadius: '8px', background: `${mlPerfPred.couleur}15`, border: `1px solid ${mlPerfPred.couleur}30` }}>
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: mlPerfPred.couleur }}>{mlPerfPred.mention}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ mb: 2.5 }}>
                        <Box sx={{ height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', borderRadius: 4, width: `${(mlPerfPred.moyenne_finale_predite / 20) * 100}%`, background: `linear-gradient(90deg, ${mlPerfPred.couleur}, ${mlPerfPred.couleur}CC)`, transition: 'width 1s ease' }} />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography sx={{ fontSize: '0.65rem', color: '#8A9BB0' }}>0/20</Typography>
                          <Typography sx={{ fontSize: '0.65rem', color: '#8A9BB0' }}>20/20</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                        {[
                          { label: 'Insuffisant', min: 0,  max: 10 },
                          { label: 'Passable',    min: 10, max: 12 },
                          { label: 'Assez bien',  min: 12, max: 14 },
                          { label: 'Bien',        min: 14, max: 16 },
                          { label: 'Très bien',   min: 16, max: 20 },
                        ].map((m) => {
                          const isActive = mlPerfPred.moyenne_finale_predite >= m.min && mlPerfPred.moyenne_finale_predite < m.max;
                          return (
                            <Box key={m.label} sx={{ px: 1.2, py: 0.5, borderRadius: '8px', fontSize: '0.68rem', fontWeight: 700, background: isActive ? `${mlPerfPred.couleur}18` : '#F8FAFC', color: isActive ? mlPerfPred.couleur : '#8A9BB0', border: `1.5px solid ${isActive ? mlPerfPred.couleur + '40' : '#E5E7EB'}` }}>
                              {m.label} ({m.min}–{m.max})
                            </Box>
                          );
                        })}
                      </Box>
                      {mlStats && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${C.blueL}`, display: 'flex', gap: 1 }}>
                          <Box sx={{ flex: 1, p: 1.2, borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                            <Typography sx={{ fontSize: '0.62rem', color: '#8A9BB0', fontWeight: 700, textTransform: 'uppercase', mb: 0.3 }}>Moy. actuelle</Typography>
                            <Typography sx={{ fontWeight: 900, fontSize: '0.95rem', color: C.navy }}>{mlStats.moy_actuelle}/20</Typography>
                          </Box>
                          <Box sx={{ flex: 1, p: 1.2, borderRadius: '10px', background: `${mlPerfPred.couleur}10`, border: `1px solid ${mlPerfPred.couleur}30`, textAlign: 'center' }}>
                            <Typography sx={{ fontSize: '0.62rem', color: '#8A9BB0', fontWeight: 700, textTransform: 'uppercase', mb: 0.3 }}>Prédit</Typography>
                            <Typography sx={{ fontWeight: 900, fontSize: '0.95rem', color: mlPerfPred.couleur }}>{mlPerfPred.moyenne_finale_predite}/20</Typography>
                          </Box>
                          <Box sx={{ flex: 1, p: 1.2, borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                            <Typography sx={{ fontSize: '0.62rem', color: '#8A9BB0', fontWeight: 700, textTransform: 'uppercase', mb: 0.3 }}>Absence moy.</Typography>
                            <Typography sx={{ fontWeight: 900, fontSize: '0.95rem', color: mlStats.taux_absence > 20 ? '#EF4444' : C.slate }}>{mlStats.taux_absence}%</Typography>
                          </Box>
                        </Box>
                      )}
                    </>
                  ) : (
                    <Box>
                      {m3ProjLoad ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3, gap: 1.5 }}>
                          <CircularProgress size={18} sx={{ color: C.purple }} />
                          <Typography sx={{ fontSize: '0.8rem', color: '#8A9BB0' }}>Projection en cours…</Typography>
                        </Box>
                      ) : (
                        <>
                          <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={m3Proj.map(d => ({ annee: d.year, moyenne: d.moyenne }))}>
                              <defs>
                                <linearGradient id="m3ProjGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={C.purple} stopOpacity={0.35} />
                                  <stop offset="95%" stopColor={C.purple} stopOpacity={0.03} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                              <XAxis dataKey="annee" tick={{ fill: '#8A9BB0', fontSize: 10 }} axisLine={false} tickLine={false} />
                              <YAxis domain={[8, 20]} tick={{ fill: '#8A9BB0', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}/20`} width={42} />
                              <RechartsTooltip
                                contentStyle={{ background: '#fff', border: '1.5px solid #EAF4FF', borderRadius: 10, fontSize: 12 }}
                                formatter={v => [`${typeof v === 'number' ? v.toFixed(2) : v}/20`, 'Moyenne prédite']}
                              />
                              <Area type="monotone" dataKey="moyenne" stroke={C.purple} strokeWidth={2.5} fill="url(#m3ProjGrad)" dot={{ fill: C.purple, strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: C.purple }} />
                            </AreaChart>
                          </ResponsiveContainer>
                          {m3Proj.length > 1 && (() => {
                            const first = m3Proj[0].moyenne;
                            const last = m3Proj[m3Proj.length - 1].moyenne;
                            const diff = Math.round((last - first) * 100) / 100;
                            return (
                              <Box sx={{ mt: 1, px: 1.5, py: 0.8, borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: 0.8, background: diff >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${diff >= 0 ? '#86efac' : '#fca5a5'}` }}>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: diff >= 0 ? '#15803d' : '#dc2626' }}>
                                  {diff >= 0 ? '📈 +' : '📉 '}{diff} pts tendance 2026→2030
                                </Typography>
                              </Box>
                            );
                          })()}
                        </>
                      )}
                    </Box>
                  )}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography sx={{ fontSize: '1.5rem', mb: 1, opacity: 0.3 }}>🤖</Typography>
                  <Typography sx={{ fontSize: '0.82rem', color: '#8A9BB0' }}>Données insuffisantes pour la prédiction</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>

        {/* Informations générales */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '18px', border: '1px solid #E5E7EB', height: '100%', animation: `${fadeUp} 0.4s ease-out 0.15s both` }}>
            <Box sx={{
              px: 2.5, py: 2, borderBottom: `1px solid ${C.blueL}`,
              background: `linear-gradient(135deg, ${C.blueL} 0%, #f0f9ff 100%)`,
              display: 'flex', alignItems: 'center', gap: 1.2,
            }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '9px', background: '#fff', border: `1.5px solid ${C.blue}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', boxShadow: `0 3px 10px ${C.blue}18` }}>📋</Box>
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: C.navy }}>Informations générales</Typography>
            </Box>
            <CardContent sx={{ p: 2.5 }}>
              <InfoRow label="Code"          value={departement.code_departement} />
              <InfoRow label="Établissement" value={departement.nom_etablissement} />
              <InfoRow label="Niveaux"       value={departement.nombre_niveaux || 0} />
              <InfoRow label="Spécialités"   value={departement.nombre_specialites || 0} />
              <InfoRow label="Description"   value={departement.description} />
              <Box sx={{ pt: 1.4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#8A9BB0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date de création</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: C.navy }}>
                  {departement.date_creation ? new Date(departement.date_creation).toLocaleDateString('fr-FR') : '—'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistiques */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '18px', border: '1px solid #E5E7EB', height: '100%', animation: `${fadeUp} 0.4s ease-out 0.2s both` }}>
            <Box sx={{
              px: 2.5, py: 2, borderBottom: `1px solid ${C.blueL}`,
              background: `linear-gradient(135deg, ${C.blueL} 0%, #f0f9ff 100%)`,
              display: 'flex', alignItems: 'center', gap: 1.2,
            }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '9px', background: '#fff', border: `1.5px solid ${C.blue}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', boxShadow: `0 3px 10px ${C.blue}18` }}>📊</Box>
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: C.navy }}>Statistiques</Typography>
            </Box>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <StatBox icon="👥" label="Effectif total"  value={departement.nombre_etudiants  || 0} color={C.blue}   bg={`${C.blue}08`}   />
                <StatBox icon="👨‍🏫" label="Enseignants"   value={departement.nombre_enseignants || 0} color={C.green}  bg={`${C.green}08`}  />
                <StatBox icon="📚" label="Niveaux"         value={departement.nombre_niveaux    || 0} color={C.orange} bg={`${C.orange}08`} />
                <StatBox icon="🎯" label="Spécialités"     value={departement.nombre_specialites|| 0} color={C.purple} bg={`${C.purple}08`} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>


      {/* ══ TABS CARD ═════════════════════════════ */}
      <Card sx={{
        borderRadius: '18px', border: '1px solid #E5E7EB',
        overflow: 'hidden',
        animation: `${fadeUp} 0.4s ease-out 0.25s both`,
      }}>
        <Box sx={{ borderBottom: `1.5px solid ${C.blueL}`, background: `linear-gradient(135deg, ${C.blueL} 0%, #f0f9ff 100%)`, px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            sx={{
              minHeight: '52px',
              '& .MuiTab-root': {
                textTransform: 'none', fontSize: '0.85rem',
                fontWeight: 600, color: '#8A9BB0',
                minHeight: '52px', px: 2,
                '&.Mui-selected': { color: C.navy, fontWeight: 800 },
              },
              '& .MuiTabs-indicator': { height: '3px', backgroundColor: C.blue, borderRadius: '3px 3px 0 0' },
            }}
          >
            {[
              { icon: '📚', label: 'Niveaux' },
              { icon: '🎯', label: 'Spécialités' },
              { icon: '👨‍🏫', label: 'Enseignants' },
              { icon: '🚨', label: 'À risque' },
            ].map((t, i) => (
              <Tab key={i} label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                  <Chip label={tabCount[i]} size="small" sx={{
                    height: 20, fontSize: '0.68rem', fontWeight: 800,
                    background: activeTab === i
                      ? (i === 3 ? C.orange : C.blue)
                      : (i === 3 ? `${C.orange}15` : `${C.blue}15`),
                    color: activeTab === i ? '#fff'
                      : (i === 3 ? C.orange : C.blue),
                    border: `1px solid ${activeTab === i
                      ? (i === 3 ? C.orange : C.blue)
                      : (i === 3 ? C.orange + '30' : C.blue + '30')}`,
                    '& .MuiChip-label': { px: 0.8 },
                  }} />
                </Box>
              } />
            ))}
          </Tabs>

        </Box>

        {/* ── Niveaux ── */}
        {activeTab === 0 && (
          niveaux.length === 0 ? <EmptyTab icon="📚" text="Aucun niveau trouvé" /> : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: C.blueL }}>
                    <TH>Code</TH>
                    <TH>Niveau</TH>
                    <TH center>Spécialités</TH>
                    <TH center>Étudiants</TH>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {niveaux.map((n, i) => (
                    <TableRow key={i} sx={{ '&:hover': { background: `${C.blue}04` }, borderBottom: i < niveaux.length - 1 ? `1px solid ${C.blueL}` : 'none' }}>
                      <TableCell sx={{ py: 2 }}>
                        <Chip label={n.code_niveau} size="small" sx={{ background: C.blueL, color: C.blue, fontWeight: 700, fontSize: '0.72rem', border: `1px solid ${C.blue}28` }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: C.navy, fontSize: '0.88rem', py: 2 }}>{n.nom_niveau}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 600, py: 2 }}>{n.nombre_specialites || 0}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 600, py: 2 }}>{n.nombre_etudiants || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        )}

        {/* ── Spécialités ── */}
        {activeTab === 1 && (
          loadingTab ? <LoadingTab /> : specialites.length === 0 ? <EmptyTab icon="🎯" text="Aucune spécialité trouvée" /> : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: C.blueL }}>
                    <TH>Code</TH>
                    <TH>Spécialité</TH>
                    <TH>Niveau</TH>
                    <TH center>Étudiants</TH>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {specialites.map((s, i) => (
                    <TableRow key={i} sx={{ '&:hover': { background: `${C.purple}04` }, borderBottom: i < specialites.length - 1 ? `1px solid ${C.blueL}` : 'none' }}>
                      <TableCell sx={{ py: 2 }}>
                        <Chip label={s.code_specialite} size="small" sx={{ background: `${C.purple}12`, color: C.purple, fontWeight: 700, fontSize: '0.72rem', border: `1px solid ${C.purple}28` }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: C.navy, fontSize: '0.88rem', py: 2 }}>{s.nom_specialite}</TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Chip label={s.nom_niveau} size="small" sx={{ background: C.blueL, color: C.blue, fontWeight: 600, fontSize: '0.7rem', border: `1px solid ${C.blue}22` }} />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 600, py: 2 }}>{s.nombre_etudiants || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        )}

        {/* ── Enseignants ── */}
        {activeTab === 2 && (
          loadingTab ? <LoadingTab /> : enseignants.length === 0 ? <EmptyTab icon="👨‍🏫" text="Aucun enseignant trouvé" /> : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: C.blueL }}>
                    <TH>Matricule</TH>
                    <TH>Grade</TH>
                    <TH>Spécialité</TH>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {enseignants.map((e, i) => (
                    <TableRow key={i} sx={{ '&:hover': { background: `${C.green}04` }, borderBottom: i < enseignants.length - 1 ? `1px solid ${C.blueL}` : 'none' }}>
                      <TableCell sx={{ py: 2 }}>
                        <Chip label={e.numero_utilisateur} size="small" sx={{ background: `${C.green}10`, color: C.green, fontWeight: 700, fontSize: '0.75rem', border: `1px solid ${C.green}28`, borderRadius: '8px' }} />
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Chip label={e.grade || 'N/A'} size="small" sx={{ background: `${C.green}12`, color: C.green, fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${C.green}28` }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: '#8A9BB0', py: 2 }}>{e.specialite || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        )}

        {/* ── Étudiants à risque ── */}
        {activeTab === 3 && (
          loadingTab ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
              <CircularProgress size={28} sx={{ color: C.orange }} />
              <Typography sx={{ color: '#8A9BB0', fontSize: '0.82rem' }}>
                Analyse ML en cours pour chaque étudiant…
              </Typography>
            </Box>
          ) : etudiantsRisque.length === 0 ? (
            <EmptyTab icon="✅" text="Aucun étudiant à analyser dans ce département" />
          ) : (
            <>
              {/* Summary banner */}
              <Box sx={{ px: 2.5, pt: 2, pb: 1.5, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {[
                  { label: 'Risque élevé',  color: '#EF4444', bg: '#FEF2F2', count: etudiantsRisque.filter(e => e.risque?.niveau_alerte === 'ROUGE').length  },
                  { label: 'Risque modéré', color: '#F59E0B', bg: '#FFFBEB', count: etudiantsRisque.filter(e => e.risque?.niveau_alerte === 'ORANGE').length },
                  { label: 'Faible risque', color: '#22C55E', bg: '#F0FDF4', count: etudiantsRisque.filter(e => e.risque?.niveau_alerte === 'VERT').length   },
                  { label: 'Analysés',      color: C.slate,   bg: '#F8FAFC', count: etudiantsRisque.length },
                ].map((s, i) => (
                  <Box key={i} sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    px: 2, py: 1, borderRadius: '10px',
                    background: s.bg, border: `1px solid ${s.color}25`,
                  }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', color: s.color }}>{s.count}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: s.color, fontWeight: 600 }}>{s.label}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Groupes par spécialité */}
              <Box sx={{ px: 2.5, pb: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {(() => {
                  // Regrouper les étudiants par spécialité
                  const groups = new Map();
                  etudiantsRisque.forEach(et => {
                    const key = et.nom_specialite || '— Sans spécialité —';
                    if (!groups.has(key)) groups.set(key, []);
                    groups.get(key).push(et);
                  });
                  // Trier les spécialités par nombre de risque élevé décroissant
                  const sorted = [...groups.entries()].sort((a, b) => {
                    const rougeA = a[1].filter(e => e.risque?.niveau_alerte === 'ROUGE').length;
                    const rougeB = b[1].filter(e => e.risque?.niveau_alerte === 'ROUGE').length;
                    if (rougeB !== rougeA) return rougeB - rougeA;
                    return b[1].length - a[1].length;
                  });

                  return sorted.map(([specName, etus]) => {
                    const isOpen = expandedRisqueSpecs.has(specName);
                    const nbRouge  = etus.filter(e => e.risque?.niveau_alerte === 'ROUGE').length;
                    const nbOrange = etus.filter(e => e.risque?.niveau_alerte === 'ORANGE').length;
                    const nbVert   = etus.filter(e => e.risque?.niveau_alerte === 'VERT').length;
                    const headerColor = nbRouge > 0 ? '#EF4444' : nbOrange > 0 ? '#F59E0B' : '#22C55E';

                    return (
                      <Box key={specName} sx={{
                        borderRadius: '14px',
                        border: `1.5px solid ${isOpen ? headerColor + '50' : C.blueL}`,
                        overflow: 'hidden',
                        transition: 'border-color 0.2s',
                      }}>
                        {/* En-tête spécialité */}
                        <Box
                          onClick={() => setExpandedRisqueSpecs(prev => {
                            const next = new Set(prev);
                            isOpen ? next.delete(specName) : next.add(specName);
                            return next;
                          })}
                          sx={{
                            px: 2.5, py: 1.5,
                            display: 'flex', alignItems: 'center', gap: 1.5,
                            cursor: 'pointer',
                            background: isOpen ? `${headerColor}08` : '#FAFBFF',
                            borderBottom: isOpen ? `1px solid ${C.blueL}` : 'none',
                            transition: 'background 0.2s',
                            '&:hover': { background: `${headerColor}10` },
                          }}
                        >
                          <Box sx={{
                            width: 32, height: 32, borderRadius: '10px',
                            background: `${headerColor}15`, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px',
                          }}>🎯</Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {specName}
                            </Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0', mt: 0.2 }}>
                              {etus.length} étudiant{etus.length > 1 ? 's' : ''} analysé{etus.length > 1 ? 's' : ''}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                            {nbRouge > 0 && (
                              <Chip label={`${nbRouge} élevé`} size="small"
                                sx={{ background: '#FEE2E2', color: '#B91C1C', fontWeight: 700, fontSize: '10px', height: '22px', borderRadius: '6px', '& .MuiChip-label': { px: 0.75 } }} />
                            )}
                            {nbOrange > 0 && (
                              <Chip label={`${nbOrange} modéré`} size="small"
                                sx={{ background: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: '10px', height: '22px', borderRadius: '6px', '& .MuiChip-label': { px: 0.75 } }} />
                            )}
                            {nbVert > 0 && (
                              <Chip label={`${nbVert} faible`} size="small"
                                sx={{ background: '#D1FAE5', color: '#065F46', fontWeight: 700, fontSize: '10px', height: '22px', borderRadius: '6px', '& .MuiChip-label': { px: 0.75 } }} />
                            )}
                            <Typography sx={{ fontSize: '16px', color: '#8A9BB0', ml: 0.5 }}>
                              {isOpen ? '▲' : '▼'}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Tableau étudiants */}
                        {isOpen && (
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ background: `${C.orange}06` }}>
                                  <TH>Étudiant</TH>
                                  <TH center>Niveau</TH>
                                  <TH center>Moyenne</TH>
                                  <TH center>Absence</TH>
                                  <TH center>Matières échec</TH>
                                  <TH center>Niveau de risque</TH>
                                  <TH center>Probabilité</TH>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {etus.map((et, i) => {
                                  const alerte = et.risque?.niveau_alerte || 'VERT';
                                  const prob   = et.risque?.probabilite   || 0;
                                  const rColor = alerte === 'ROUGE' ? '#EF4444' : alerte === 'ORANGE' ? '#F59E0B' : '#22C55E';
                                  const rBg    = alerte === 'ROUGE' ? '#FEF2F2' : alerte === 'ORANGE' ? '#FFFBEB' : '#F0FDF4';
                                  const rLabel = alerte === 'ROUGE' ? 'Élevé'    : alerte === 'ORANGE' ? 'Modéré'   : 'Faible';
                                  const moyColor = et.moy_actuelle < 10 ? '#EF4444' : et.moy_actuelle < 12 ? '#F59E0B' : C.green;

                                  return (
                                    <TableRow key={i} sx={{
                                      '&:hover': { background: `${rColor}06` },
                                      borderBottom: i < etus.length - 1 ? `1px solid ${C.blueL}` : 'none',
                                      borderLeft: `3px solid ${alerte === 'ROUGE' ? '#EF4444' : alerte === 'ORANGE' ? '#F59E0B' : 'transparent'}`,
                                    }}>
                                      {/* Étudiant */}
                                      <TableCell sx={{ py: 1.6 }}>
                                        <Chip
                                          label={et.numero_etudiant || et.numero_utilisateur || '—'}
                                          size="small"
                                          sx={{ background: C.blueL, color: C.blue, fontWeight: 700, fontSize: '0.72rem', border: `1px solid ${C.blue}28`, borderRadius: '7px' }}
                                        />
                                      </TableCell>

                                      {/* Niveau */}
                                      <TableCell sx={{ textAlign: 'center', py: 1.6 }}>
                                        <Chip label={et.niveau || 'N/A'} size="small"
                                          sx={{ background: C.blueL, color: C.blue, fontWeight: 700, fontSize: '0.68rem', border: `1px solid ${C.blue}28` }} />
                                      </TableCell>

                                      {/* Moyenne */}
                                      <TableCell sx={{ textAlign: 'center', py: 1.6 }}>
                                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: moyColor }}>
                                          {et.moy_actuelle}/20
                                        </Typography>
                                      </TableCell>

                                      {/* Absence */}
                                      <TableCell sx={{ textAlign: 'center', py: 1.6 }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: et.taux_absence > 25 ? '#EF4444' : et.taux_absence > 15 ? '#F59E0B' : C.slate }}>
                                          {et.taux_absence}%
                                        </Typography>
                                      </TableCell>

                                      {/* Matières échec */}
                                      <TableCell sx={{ textAlign: 'center', py: 1.6 }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: et.nb_echecs > 3 ? '#EF4444' : C.slate }}>
                                          {et.nb_echecs}
                                        </Typography>
                                      </TableCell>

                                      {/* Niveau de risque */}
                                      <TableCell sx={{ textAlign: 'center', py: 1.6 }}>
                                        <Chip label={rLabel} size="small" sx={{
                                          background: rBg, color: rColor,
                                          fontWeight: 800, fontSize: '0.7rem',
                                          border: `1.5px solid ${rColor}40`,
                                          borderRadius: '7px',
                                        }} />
                                      </TableCell>

                                      {/* Probabilité */}
                                      <TableCell sx={{ textAlign: 'center', py: 1.6 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4 }}>
                                          <Typography sx={{ fontWeight: 900, fontSize: '0.9rem', color: rColor }}>
                                            {Math.round(prob * 100)}%
                                          </Typography>
                                          <Box sx={{ width: 50, height: 4, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                                            <Box sx={{ height: '100%', width: `${Math.round(prob * 100)}%`, background: rColor, borderRadius: 2, transition: 'width 0.6s ease' }} />
                                          </Box>
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Box>
                    );
                  });
                })()}
              </Box>
            </>
          )
        )}
      </Card>
      {/* ══ ML INFO DIALOG ════════════════════════ */}
      <MLInfoDialog
        open={Boolean(mlInfoOpen)}
        modelKey={mlInfoOpen}
        onClose={() => setMlInfoOpen(null)}
        departementNom={departement.nom_departement}
      />
    </Box>
  );
};

export default DetailDepartement;
