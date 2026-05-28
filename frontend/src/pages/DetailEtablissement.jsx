import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, Chip, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, IconButton, Grid, keyframes, Pagination,
  CircularProgress, LinearProgress, Dialog, DialogContent, DialogActions,
  TextField, Alert, InputAdornment, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import {
  ArrowBack, Edit, Delete, FileDownload, Visibility, VisibilityOff, InfoOutlined,
  Archive, Unarchive, Close as CloseIcon, Lock, Computer, Public,
} from '@mui/icons-material';
import axios from 'axios';
import api from '../services/api';
import config from '../config';
import mlService from '../services/mlService';
import { exportCSV } from '../utils/csv';

const API_BASE_URL = config.apiUrl;

const C = {
  navy: '#0c1e3e', blue: '#1e6ef5', blueL: '#e8f0fe',
  green: '#10b981', greenL: '#d1fae5', red: '#ef4444', redL: '#fee2e2',
  amber: '#f59e0b', amberL: '#fef3c7', purple: '#7c3aed', purpleL: '#ede9fe',
  tealL: '#e0f2fe', bg: '#f4f6fb', border: '#e2e8f0',
  textDark: '#0f172a', textMid: '#475569', textSoft: '#94a3b8',
};

const fadeUp = keyframes`
  from { opacity:0; transform:translateY(10px); }
  to { opacity:1; transform:translateY(0); }
`;

// ── Utilitaire : parser un user-agent en (OS, navigateur, appareil) ──
const parseUA = (ua = '') => {
  const u = ua.toLowerCase();
  let os = 'Inconnu', browser = 'Inconnu', device = 'Ordinateur';
  if (u.includes('windows nt 10'))      os = u.includes('windows nt 10.0; win64') ? 'Windows 11/10' : 'Windows 10';
  else if (u.includes('windows nt 11')) os = 'Windows 11';
  else if (u.includes('windows nt 6.3')) os = 'Windows 8.1';
  else if (u.includes('windows nt 6.1')) os = 'Windows 7';
  else if (u.includes('windows'))        os = 'Windows';
  else if (u.includes('mac os x'))       os = 'macOS';
  else if (u.includes('android'))      { os = 'Android'; device = 'Mobile'; }
  else if (u.includes('iphone'))       { os = 'iOS'; device = 'iPhone'; }
  else if (u.includes('ipad'))         { os = 'iPadOS'; device = 'iPad'; }
  else if (u.includes('linux'))          os = 'Linux';

  if      (u.includes('edg/'))      browser = 'Microsoft Edge';
  else if (u.includes('opr/'))      browser = 'Opera';
  else if (u.includes('chrome/'))   browser = 'Chrome';
  else if (u.includes('firefox/'))  browser = 'Firefox';
  else if (u.includes('safari/'))   browser = 'Safari';

  return { os, browser, device };
};

const DetailEtablissement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [etablissement, setEtablissement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedDept, setExpandedDept] = useState(null);
  const [departements, setDepartements] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [loadingTab, setLoadingTab] = useState(false);
  const [specialitesPage, setSpecialitesPage] = useState(1);
  const [enseignantsPage, setEnseignantsPage] = useState(1);
  const [specialitesPagination, setSpecialitesPagination] = useState({ total: 0, totalPages: 0 });
  const [enseignantsPagination, setEnseignantsPagination] = useState({ total: 0, totalPages: 0 });
  const [mlPred,  setMlPred]  = useState(null);
  const [mlLoad,  setMlLoad]  = useState(false);
  const [mlPerfPred, setMlPerfPred] = useState(null);
  const [mlPerfLoad, setMlPerfLoad] = useState(true);
  const [infoOpen,   setInfoOpen]   = useState(null); // 'm1' | 'm3' | null
  const [mlProjMode,    setMlProjMode]    = useState('annee');
  const [mlProjection,  setMlProjection]  = useState([]);
  const [mlProjLoading, setMlProjLoading] = useState(false);
  const [mlM3Proj,      setMlM3Proj]      = useState([]);
  const [mlM3ProjLoad,  setMlM3ProjLoad]  = useState(false);
  const [risqueData, setRisqueData] = useState(null);
  const [archivesOpen, setArchivesOpen] = useState(false);
  const [archivedDepts, setArchivedDepts] = useState([]);
  const [archivesLoading, setArchivesLoading] = useState(false);
  // Dialog d'archivage générique (dept OU spec)
  // type: 'dept' | 'spec'
  const [archiveDialog, setArchiveDialog] = useState({ open: false, type: null, entity: null, impact: null, loading: false });
  const [archivePassword, setArchivePassword] = useState('');
  const [showArchivePassword, setShowArchivePassword] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [archiveError, setArchiveError] = useState('');
  const [archiveSubmitting, setArchiveSubmitting] = useState(false);
  // Dialog de tracing (dept OU spec)
  const [logDialog, setLogDialog] = useState({ open: false, type: null, entity: null });
  // Dialog de restauration (dept OU spec)
  const [restoreDialog, setRestoreDialog] = useState({ open: false, type: null, entity: null });
  const [restorePassword, setRestorePassword] = useState('');
  const [showRestorePassword, setShowRestorePassword] = useState(false);
  const [restoreReason, setRestoreReason] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [restoreSubmitting, setRestoreSubmitting] = useState(false);
  const [restoreCascade, setRestoreCascade] = useState(true);
  const [specArchivesOpen, setSpecArchivesOpen] = useState(false);
  const [archivedSpecs, setArchivedSpecs] = useState([]);
  const [specArchivesLoading, setSpecArchivesLoading] = useState(false);
  const [expandedRisqueDept, setExpandedRisqueDept] = useState(new Set());

  // Récupérer le rôle de l'utilisateur
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role?.toLowerCase();
  const isRecteur = userRole === 'recteur';

  useEffect(() => {
    fetchEtablissement();
  }, [id]);

  useEffect(() => {
    // Réinitialiser les pages quand on change d'onglet
    setSpecialitesPage(1);
    setEnseignantsPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (etablissement && id) {
      fetchTabData();
    }
  }, [activeTab, etablissement, id, specialitesPage, enseignantsPage]);

  const fetchEtablissement = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const role = user.role?.toLowerCase();

      // Utiliser l'API appropriée selon le rôle
      const apiPath = role === 'recteur'
        ? `/etablissements/recteur/${id}`
        : `/etablissements/${id}`;

      const response = await api.get(apiPath);
      if (response.data.success) {
        const etab = response.data.etablissement;
        setEtablissement(etab);
        // ML prediction with this étab's data
        const taux2 = parseFloat(etab.taux_reussite || 70);
        const taux1 = Math.max(0, Math.round((taux2 - 1.8) * 10) / 10);
        const effectif = parseInt(etab.effectif_total || 100);
        const budget   = parseFloat(etab.budget_alloue || 0);
        const budgetParEtud = effectif > 0 ? Math.round(budget / effectif) : 5000;
        const typeEtab = etab.type || 'Université';
        const nbLabos  = typeEtab === 'ECOLE' ? 8 : typeEtab === 'ISET' ? 5 : typeEtab === 'FACULTE' ? 6 : 4;
        setMlLoad(true);
        mlService.predireReussite({
          taux_reussite_an1:  taux1,
          taux_reussite_an2:  taux2,
          taux_absence_moyen: 15.0,
          ratio_etud_ens:     18,
          budget_par_etud:    Math.max(0, budgetParEtud),
          nb_labos:           nbLabos,
          taux_rotation_ens:  8.0,
          region:             etab.nom_region || etab.nom_ville || 'Grand Tunis',
          type_etablissement: typeEtab,
        })
          .then(r => setMlPred(r.data))
          .catch(() => {})
          .finally(() => setMlLoad(false));

        // M3 — Performance Future
        const moyEst  = Math.round(Math.min(16, Math.max(5, 5 + (taux2 / 100) * 10)) * 10) / 10;
        const nSous10 = Math.max(0, Math.round((1 - taux2 / 100) * 6));
        const filiere = typeEtab === 'ECOLE' ? 'Ingénierie' : typeEtab === 'ISET' ? 'Informatique' : typeEtab === 'FACULTE' ? 'Gestion' : 'Ingénierie';
        setMlPerfLoad(true);
        mlService.predirePerformance({
          moy_semestre_prec:    moyEst,
          note_cc1:             Math.round(Math.min(20, moyEst + 0.3) * 10) / 10,
          note_cc2:             moyEst,
          note_cc3:             Math.round(Math.min(20, moyEst + 0.5) * 10) / 10,
          taux_absence_actuel:  15.0,
          pente_evolution:      0.4,
          nb_matieres_sous_10:  nSous10,
          ratio_notes_obtenues: Math.min(1, Math.max(0, taux2 / 100)),
          niveau:               'L3',
          filiere,
        })
          .then(r => setMlPerfPred(r.data))
          .catch(() => {})
          .finally(() => setMlPerfLoad(false));
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const projeterEtabM1 = async () => {
    if (!etablissement) return;
    setMlProjLoading(true); setMlProjection([]);
    const taux2 = parseFloat(etablissement.taux_reussite || 70);
    const taux1 = Math.max(0, Math.round((taux2 - 1.8) * 10) / 10);
    const effectif = parseInt(etablissement.effectif_total || 100);
    const budget = parseFloat(etablissement.budget_alloue || 0);
    const budgetParEtud = effectif > 0 ? Math.round(budget / effectif) : 5000;
    const typeEtab = etablissement.type || 'Université';
    const nbLabos = typeEtab === 'ECOLE' ? 8 : typeEtab === 'ISET' ? 5 : typeEtab === 'FACULTE' ? 6 : 4;
    const results = [];
    let an1 = taux1; let an2 = taux2;
    try {
      for (let year = 2026; year <= 2030; year++) {
        const { data } = await mlService.predireReussite({
          taux_reussite_an1: an1, taux_reussite_an2: an2,
          taux_absence_moyen: 15.0, ratio_etud_ens: 18,
          budget_par_etud: Math.max(0, budgetParEtud),
          nb_labos: nbLabos, taux_rotation_ens: 8.0,
          region: etablissement.nom_region || etablissement.nom_ville || 'Grand Tunis',
          type_etablissement: typeEtab,
        });
        results.push({ year: `${year}`, taux: data.taux_reussite_predit, couleur: data.couleur, interp: data.interpretation });
        an2 = an1; an1 = data.taux_reussite_predit;
      }
      setMlProjection(results);
    } catch (e) { console.error('M1 proj etab:', e); }
    finally { setMlProjLoading(false); }
  };

  const projeterEtabM3 = async () => {
    if (!etablissement) return;
    setMlM3ProjLoad(true); setMlM3Proj([]);
    const taux2 = parseFloat(etablissement.taux_reussite || 70);
    const typeEtab = etablissement.type || 'Université';
    const filiere = typeEtab === 'ECOLE' ? 'Ingénierie' : typeEtab === 'ISET' ? 'Informatique' : typeEtab === 'FACULTE' ? 'Gestion' : 'Ingénierie';
    const nSous10 = Math.max(0, Math.round((1 - taux2 / 100) * 6));
    const results = [];
    let moy = Math.round(Math.min(16, Math.max(5, 5 + (taux2 / 100) * 10)) * 10) / 10;
    try {
      for (let year = 2026; year <= 2030; year++) {
        const { data } = await mlService.predirePerformance({
          moy_semestre_prec: moy,
          note_cc1: Math.round(Math.min(20, moy + 0.3) * 10) / 10,
          note_cc2: moy,
          note_cc3: Math.round(Math.min(20, moy + 0.5) * 10) / 10,
          taux_absence_actuel: 15.0, pente_evolution: 0.4,
          nb_matieres_sous_10: nSous10,
          ratio_notes_obtenues: Math.min(1, Math.max(0, taux2 / 100)),
          niveau: 'L3', filiere,
        });
        results.push({ year: `${year}`, moyenne: data.moyenne_finale_predite, mention: data.mention, couleur: data.couleur });
        moy = data.moyenne_finale_predite;
      }
      setMlM3Proj(results);
    } catch (e) { console.error('M3 proj etab:', e); }
    finally { setMlM3ProjLoad(false); }
  };

  const fetchTabData = async () => {
    setLoadingTab(true);
    try {
      const basePath = isRecteur ? '/etablissements/recteur' : '/etablissements';

      if (activeTab === 0) {
        const response = await api.get(`${basePath}/${id}/departements`);
        if (response.data.success) {
          setDepartements(response.data.departements);
        }
      } else if (activeTab === 1) {
        const response = await api.get(`${basePath}/${id}/specialites?page=${specialitesPage}&limit=5`);
        if (response.data.success) {
          setSpecialites(response.data.specialites);
          setSpecialitesPagination(response.data.pagination);
        }
      } else if (activeTab === 2) {
        const response = await api.get(`${basePath}/${id}/enseignants?page=${enseignantsPage}&limit=5`);
        if (response.data.success) {
          setEnseignants(response.data.enseignants);
          setEnseignantsPagination(response.data.pagination);
        }
      } else if (activeTab === 4) {
        const response = await api.get(`${basePath}/${id}/etudiants-risque`);
        if (response.data.success) {
          setRisqueData(response.data);
          if (response.data.departements?.length > 0) {
            setExpandedRisqueDept(new Set(response.data.departements.map(d => d.id_departement)));
          }
        }
      }
    } catch (error) {
      console.error('Erreur fetchTabData:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoadingTab(false);
    }
  };

  const fetchSpecialitesByDepartement = async (departementId) => {
    try {
      const basePath = isRecteur ? '/etablissements/recteur' : '/etablissements';
      const response = await api.get(`${basePath}/departements/${departementId}/specialites`);
      if (response.data.success) {
        return response.data.specialites;
      }
      return [];
    } catch (error) {
      console.error('Erreur:', error);
      return [];
    }
  };

  // ── Archivage des départements ──
  const openArchivesDialog = async () => {
    setArchivesOpen(true);
    setArchivesLoading(true);
    try {
      const basePath = isRecteur ? '/etablissements/recteur' : '/etablissements';
      const resp = await api.get(`${basePath}/${id}/departements-archives`);
      if (resp.data.success) setArchivedDepts(resp.data.departements || []);
    } catch (e) { console.error('archives:', e); }
    finally { setArchivesLoading(false); }
  };

  // Ouvre le dialog d'archivage générique (type: 'dept' | 'spec')
  const openArchiveDialog = async (type, entityId, entityNom) => {
    setArchiveDialog({ open: true, type, entity: { id: entityId, nom: entityNom }, impact: null, loading: true });
    setArchivePassword('');
    setArchiveReason('');
    setArchiveError('');
    try {
      const basePath = isRecteur ? '/etablissements/recteur' : '/etablissements';
      const url = type === 'dept'
        ? `${basePath}/departements/${entityId}/impact`
        : `${basePath}/specialites/${entityId}/impact`;
      const resp = await api.get(url);
      if (resp.data.success) {
        setArchiveDialog(prev => ({ ...prev, impact: resp.data, loading: false }));
      }
    } catch (e) {
      console.error('impact:', e);
      setArchiveDialog(prev => ({ ...prev, loading: false }));
      setArchiveError('Impossible de charger l\'impact');
    }
  };

  const archiveDept = (deptId, deptNom) => openArchiveDialog('dept', deptId, deptNom);
  const archiveSpec = (specId, specNom) => openArchiveDialog('spec', specId, specNom);

  const confirmArchive = async () => {
    if (!archivePassword) {
      setArchiveError('Veuillez saisir votre mot de passe');
      return;
    }
    setArchiveSubmitting(true);
    setArchiveError('');
    try {
      const basePath = isRecteur ? '/etablissements/recteur' : '/etablissements';
      const url = archiveDialog.type === 'dept'
        ? `${basePath}/departements/${archiveDialog.entity.id}/archive`
        : `${basePath}/specialites/${archiveDialog.entity.id}/archive`;
      const body = archiveDialog.type === 'dept'
        ? { password: archivePassword, reason: archiveReason, cascade: true }
        : { password: archivePassword, reason: archiveReason };
      await api.patch(url, body);
      setArchiveDialog({ open: false, type: null, entity: null, impact: null, loading: false });
      setArchivePassword('');
      setArchiveReason('');
      fetchTabData();
    } catch (e) {
      console.error('archive:', e);
      setArchiveError(e.response?.data?.message || 'Erreur lors de l\'archivage');
    } finally {
      setArchiveSubmitting(false);
    }
  };

  // Ouvre le dialog de restauration générique
  const openRestoreDialog = (type, entity) => {
    setRestoreDialog({ open: true, type, entity });
    setRestorePassword('');
    setRestoreReason('');
    setRestoreError('');
    setRestoreCascade(true);
  };
  const restoreDept = (deptId, deptNom) => openRestoreDialog('dept', { id: deptId, nom: deptNom });

  const confirmRestore = async () => {
    if (!restorePassword) {
      setRestoreError('Veuillez saisir votre mot de passe');
      return;
    }
    setRestoreSubmitting(true);
    setRestoreError('');
    try {
      const basePath = isRecteur ? '/etablissements/recteur' : '/etablissements';
      const url = restoreDialog.type === 'dept'
        ? `${basePath}/departements/${restoreDialog.entity.id}/restore`
        : `${basePath}/specialites/${restoreDialog.entity.id}/restore`;
      const body = restoreDialog.type === 'dept'
        ? { password: restorePassword, reason: restoreReason, cascade: restoreCascade }
        : { password: restorePassword, reason: restoreReason };
      await api.patch(url, body);
      // Mise à jour des listes
      if (restoreDialog.type === 'dept') {
        setArchivedDepts(prev => prev.filter(d => d.id_departement !== restoreDialog.entity.id));
      } else {
        setArchivedSpecs(prev => prev.filter(s => s.id_specialite !== restoreDialog.entity.id));
      }
      setRestoreDialog({ open: false, type: null, entity: null });
      fetchTabData();
    } catch (e) {
      console.error('restore:', e);
      setRestoreError(e.response?.data?.message || 'Erreur lors de la restauration');
    } finally {
      setRestoreSubmitting(false);
    }
  };

  // ── Archivage des spécialités ──
  const openSpecArchivesDialog = async () => {
    setSpecArchivesOpen(true);
    setSpecArchivesLoading(true);
    try {
      const basePath = isRecteur ? '/etablissements/recteur' : '/etablissements';
      const resp = await api.get(`${basePath}/${id}/specialites-archives`);
      if (resp.data.success) setArchivedSpecs(resp.data.specialites || []);
    } catch (e) { console.error('spec archives:', e); }
    finally { setSpecArchivesLoading(false); }
  };

  const restoreSpec = (specId, specNom) => openRestoreDialog('spec', { id: specId, nom: specNom });

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><Typography>Chargement...</Typography></Box>;
  if (!etablissement) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><Typography>Établissement non trouvé</Typography></Box>;

  // ── Export CSV pour l'onglet actif ──
  const handleExportCSV = () => {
    const slug = (etablissement.nom_etablissement || 'etablissement')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 60);

    if (activeTab === 0) {
      exportCSV(`${slug}_departements`,
        [
          { key: 'code_departement',   label: 'Code'         },
          { key: 'nom_departement',    label: 'Département'  },
          { key: 'nombre_specialites', label: 'Spécialités'  },
          { key: 'nombre_enseignants', label: 'Enseignants'  },
          { key: 'nombre_etudiants',   label: 'Étudiants'    },
        ], departements);
    } else if (activeTab === 1) {
      exportCSV(`${slug}_specialites`,
        [
          { key: 'code_specialite',  label: 'Code'         },
          { key: 'nom_specialite',   label: 'Spécialité'   },
          { key: 'nom_departement',  label: 'Département'  },
          { key: 'nom_niveau',       label: 'Niveau'       },
          { key: 'nombre_etudiants', label: 'Étudiants'    },
        ], specialites);
    } else if (activeTab === 2) {
      exportCSV(`${slug}_enseignants`,
        [
          { key: 'matricule',       label: 'Matricule'   },
          { key: 'nom_departement', label: 'Département' },
          { key: 'grade',           label: 'Grade'       },
          { key: 'specialite',      label: 'Spécialité'  },
        ], enseignants.map(e => ({
          matricule:       e.matricule || e.numero_utilisateur || '',
          nom_departement: e.nom_departement || '',
          grade:           e.grade || '',
          specialite:      e.specialite || '',
        })));
    } else if (activeTab === 4 && risqueData?.departments) {
      const flat = [];
      risqueData.departments.forEach(dept => {
        (dept.etudiants || []).forEach(etu => {
          flat.push({
            code_departement: dept.code_departement,
            nom_departement:  dept.nom_departement,
            matricule:        etu.numero_etudiant || etu.numero_utilisateur || '',
            nom_specialite:   etu.nom_specialite || '',
            type_niveau:      etu.type_niveau || '',
            moyenne_generale: etu.moyenne_generale,
            statut:           etu.statut || '',
          });
        });
      });
      exportCSV(`${slug}_etudiants_risque`,
        [
          { key: 'code_departement', label: 'Code dept'    },
          { key: 'nom_departement',  label: 'Département'  },
          { key: 'matricule',        label: 'Matricule'    },
          { key: 'nom_specialite',   label: 'Spécialité'   },
          { key: 'type_niveau',      label: 'Niveau'       },
          { key: 'moyenne_generale', label: 'Moyenne /20'  },
          { key: 'statut',           label: 'Statut'       },
        ], flat);
    }
  };

  const tabDataCounts = [
    departements.length,
    specialites.length,
    enseignants.length,
    0, // Activité tab — pas d'export
    risqueData?.departments?.reduce((sum, d) => sum + (d.etudiants?.length || 0), 0) || 0,
  ];
  const exportable = activeTab !== 3;
  const tabHasData = tabDataCounts[activeTab] > 0;

  const typeColors = {
    FACULTE: { bg: C.amberL, color: C.amber },
    ECOLE: { bg: C.tealL, color: '#075985' },
    INSTITUT: { bg: C.amberL, color: C.amber },
    ISET: { bg: C.purpleL, color: C.purple },
  };

  const tauxRemplissage = etablissement.capacite_maximale 
    ? Math.round((etablissement.effectif_total / etablissement.capacite_maximale) * 100)
    : 0;

  return (
    <Box sx={{ animation: `${fadeUp} 0.35s ease both`, pb: 6 }}>
      {/* ══ HEADER ════════════════════════════════ */}
      <Card sx={{
        borderRadius: '22px',
        border: '1.5px solid ' + C.border,
        boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
        overflow: 'hidden',
        mb: 3,
      }}>
        {/* Cover */}
        <Box sx={{
          height: '110px',
          position: 'relative',
          background: 'radial-gradient(ellipse at 20% 60%, rgba(30,110,245,0.12) 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, rgba(14,165,233,0.1) 0%, transparent 50%), linear-gradient(135deg, #eef4ff 0%, #e0f2fe 100%)',
          '&::before': {
            content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
            background: 'linear-gradient(90deg, #1e6ef5, #0ea5e9)',
          },
          '&::after': {
            content: '""', position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(30,110,245,0.12) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          },
        }} />
        {/* Identity row */}
        <Box sx={{ px: 3.5, pb: 2.5, display: 'flex', alignItems: 'flex-end', gap: 2.25, mt: '-42px', position: 'relative', zIndex: 2 }}>
          <Box sx={{
            width: 76, height: 76, borderRadius: '20px',
            border: '4px solid #fff',
            background: 'linear-gradient(135deg, #1e6ef5, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '30px', flexShrink: 0,
            boxShadow: '0 6px 20px rgba(30,110,245,0.28)',
          }}>
            🏫
          </Box>
          <Box sx={{ pb: 0.5, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.5 }}>
              <Typography
                onClick={() => navigate(isRecteur ? '/dashboard/recteur/etablissements' : '/dashboard/admin/etablissements')}
                sx={{ fontSize: '0.72rem', color: C.blue, fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              >
                Établissements
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0' }}>›</Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0', fontWeight: 500 }}>{etablissement.code_etablissement}</Typography>
            </Box>
            <Typography sx={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: '20px', color: C.textDark, mb: 0.75 }}>
              {etablissement.nom_etablissement}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875, flexWrap: 'wrap' }}>
              <Chip label={etablissement.type} size="small"
                sx={{ background: typeColors[etablissement.type]?.bg || C.tealL, color: typeColors[etablissement.type]?.color || '#075985', fontWeight: 700, fontSize: '11px', borderRadius: '20px', height: '24px' }} />
              <Chip label="● Actif" size="small"
                sx={{ background: C.greenL, color: '#065f46', fontWeight: 700, fontSize: '11px', borderRadius: '20px', height: '24px', border: '1px solid #a7f3d0' }} />
              <Typography sx={{ fontSize: '12px', color: C.textSoft, fontWeight: 500 }}>
                Code : <Box component="span" sx={{ color: C.blue, fontWeight: 700 }}>{etablissement.code_etablissement}</Box>
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, pb: 0.5, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[
                { label: 'Étudiants',    value: etablissement.effectif_total      || 0, color: C.navy    },
                { label: 'Enseignants',  value: etablissement.nombre_enseignants  || 0, color: '#10B981' },
                { label: 'Capacité max', value: etablissement.capacite_maximale   || 0, color: C.blue    },
              ].map((stat, i) => (
                <Box key={i} sx={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  p: '10px 16px', borderRadius: '12px',
                  background: '#f8faff', border: '1.5px solid #dce8fd',
                  minWidth: '72px', transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(30,110,245,0.12)', background: '#eef4ff' },
                }}>
                  <Typography sx={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: '17px', color: stat.color, lineHeight: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography sx={{ fontSize: '10px', color: C.textSoft, mt: 0.375, fontWeight: 500 }}>{stat.label}</Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 0.75 }}>
              <Tooltip title="Retour">
                <IconButton
                  onClick={() => navigate(isRecteur ? '/dashboard/recteur/etablissements' : '/dashboard/admin/etablissements')}
                  sx={{ width: 44, height: 44, borderRadius: '14px', background: C.blueL, border: `2px solid ${C.blue}40`, color: C.blue, transition: 'all 0.3s ease',
                    '&:hover': { background: `${C.blue}20`, transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${C.blue}25` } }}>
                  <ArrowBack sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Exporter en CSV">
                <IconButton
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('token');
                      const exportUrl = isRecteur
                        ? `${API_BASE_URL}/etablissements/recteur/export?id=${id}`
                        : `${API_BASE_URL}/etablissements/export?id=${id}`;
                      const response = await axios.get(exportUrl, {
                        headers: { Authorization: `Bearer ${token}` },
                        responseType: 'blob'
                      });
                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `etablissement_${etablissement.code_etablissement}_${Date.now()}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                    } catch (error) {
                      console.error('Erreur export:', error);
                      alert("Erreur lors de l'export");
                    }
                  }}
                  sx={{ width: 44, height: 44, borderRadius: '14px', background: '#F0FDF4', border: '2px solid #86EFAC', color: C.green, transition: 'all 0.3s ease',
                    '&:hover': { background: '#DCFCE7', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(6, 214, 160, 0.25)' } }}>
                  <FileDownload sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
              {!isRecteur && (
                <Tooltip title="Modifier l'établissement">
                  <IconButton
                    onClick={() => navigate(`/dashboard/admin/etablissements/modifier/${id}`)}
                    sx={{ width: 44, height: 44, borderRadius: '14px', background: '#FEF3C7', border: '2px solid #FDE68A', color: '#D97706', transition: 'all 0.3s ease',
                      '&:hover': { background: '#FDE68A', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)' } }}>
                    <Edit sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>
      </Card>

      {/* ── Prévision IA ─────────────────────────────────────── */}
      {(mlLoad || mlPred) && (
        <Card sx={{ borderRadius: '18px', border: `1.5px solid ${C.blueL}`, boxShadow: '0 1px 3px rgba(15,23,42,0.06)', mb: 2.5, overflow: 'hidden' }}>
          {/* Header */}
          <Box sx={{ px: '22px', py: '14px', borderBottom: `1px solid ${C.blueL}`, background: 'linear-gradient(135deg, #eef4ff 0%, #e0f2fe 100%)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 34, height: 34, borderRadius: '10px', background: 'linear-gradient(135deg, #0c1e3e, #1e6ef5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🤖</Box>
            <Box>
              <Typography sx={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: '14px', color: C.textDark }}>
                Prévision IA — Année académique 2025-2026
              </Typography>
              <Typography sx={{ fontSize: '11px', color: C.textSoft }}>
                Modèle M1 · basé sur les données réelles de cet établissement
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
              <IconButton size="small" onClick={() => setInfoOpen('m1')} sx={{
                width: 28, height: 28, borderRadius: '8px',
                background: 'rgba(30,110,245,0.12)', border: '1px solid rgba(30,110,245,0.25)',
                color: C.blue,
                '&:hover': { background: 'rgba(30,110,245,0.22)', transform: 'scale(1.1)' },
                transition: 'all 0.2s',
              }}>
                <InfoOutlined sx={{ fontSize: 15 }} />
              </IconButton>
              <Chip label="IA" size="small" sx={{ background: 'linear-gradient(135deg, #0c1e3e, #1e6ef5)', color: '#fff', fontWeight: 800, fontSize: '10px', borderRadius: '8px', border: 'none' }} />
            </Box>
          </Box>
          <CardContent sx={{ p: '20px 22px' }}>
            {mlLoad ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                <CircularProgress size={20} sx={{ color: C.blue }} />
                <Typography sx={{ color: C.textSoft, fontSize: '13px' }}>Calcul de la prévision en cours...</Typography>
              </Box>
            ) : mlPred && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <ToggleButtonGroup
                    value={mlProjMode} exclusive size="small"
                    onChange={(_, v) => {
                      if (!v) return;
                      setMlProjMode(v);
                      if (v === 'projection') {
                        if (!mlProjection.length) projeterEtabM1();
                        if (!mlM3Proj.length) projeterEtabM3();
                      }
                    }}
                    sx={{ background: '#fff', borderRadius: '10px', border: '1px solid #E2E8F0', overflow: 'hidden' }}
                  >
                    <ToggleButton value="annee" sx={{ textTransform: 'none', fontSize: '12px', fontWeight: 700, px: 2, py: 0.6, border: 'none', '&.Mui-selected': { background: C.blue, color: '#fff' } }}>
                      Année en cours
                    </ToggleButton>
                    <ToggleButton value="projection" sx={{ textTransform: 'none', fontSize: '12px', fontWeight: 700, px: 2, py: 0.6, border: 'none', '&.Mui-selected': { background: C.blue, color: '#fff' } }}>
                      Projection → 2030
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                {mlProjMode === 'annee' ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, borderRadius: '14px', background: `${mlPred.couleur}0d`, border: `1.5px solid ${mlPred.couleur}28` }}>
                        <Typography sx={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.9px', textTransform: 'uppercase', color: C.textSoft, mb: 1 }}>
                          Taux de réussite prédit 2025-2026
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, mb: 1 }}>
                          <Typography sx={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 900, fontSize: '2.2rem', color: mlPred.couleur, lineHeight: 1, letterSpacing: '-1px' }}>
                            {mlPred.taux_reussite_predit}
                          </Typography>
                          <Typography sx={{ color: C.textSoft, fontWeight: 600, mb: 0.3, fontSize: '1rem' }}>%</Typography>
                          <Chip label={mlPred.interpretation} size="small" sx={{ ml: 0.5, mb: 0.2, background: `${mlPred.couleur}18`, color: mlPred.couleur, border: `1px solid ${mlPred.couleur}35`, fontWeight: 700, fontSize: '11px' }} />
                        </Box>
                        <Box sx={{ height: 6, borderRadius: 3, background: `${mlPred.couleur}15`, overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', borderRadius: 3, width: `${mlPred.taux_reussite_predit}%`, background: mlPred.couleur, transition: 'width 0.8s ease' }} />
                        </Box>
                        <Typography sx={{ fontSize: '11px', color: C.textSoft, mt: 0.8 }}>
                          {mlPred.taux_reussite_predit >= parseFloat(etablissement?.taux_reussite || 0)
                            ? `▲ +${Math.abs(Math.round((mlPred.taux_reussite_predit - parseFloat(etablissement?.taux_reussite || 0)) * 10) / 10)} pts vs taux actuel`
                            : `▼ ${Math.abs(Math.round((mlPred.taux_reussite_predit - parseFloat(etablissement?.taux_reussite || 0)) * 10) / 10)} pts vs taux actuel`}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, borderRadius: '14px', background: '#FEF2F2', border: '1.5px solid #FECACA' }}>
                        <Typography sx={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.9px', textTransform: 'uppercase', color: C.textSoft, mb: 1 }}>
                          Taux d'échec prédit 2025-2026
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, mb: 1 }}>
                          <Typography sx={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 900, fontSize: '2.2rem', color: '#EF4444', lineHeight: 1, letterSpacing: '-1px' }}>
                            {Math.round((100 - mlPred.taux_reussite_predit) * 10) / 10}
                          </Typography>
                          <Typography sx={{ color: C.textSoft, fontWeight: 600, mb: 0.3, fontSize: '1rem' }}>%</Typography>
                        </Box>
                        <Box sx={{ height: 6, borderRadius: 3, background: '#FECACA', overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', borderRadius: 3, width: `${100 - mlPred.taux_reussite_predit}%`, background: '#EF4444', transition: 'width 0.8s ease' }} />
                        </Box>
                        <Typography sx={{ fontSize: '11px', color: C.textSoft, mt: 0.8 }}>
                          ~{Math.round((100 - mlPred.taux_reussite_predit) * parseInt(etablissement?.effectif_total || 0) / 100).toLocaleString('fr-TN')} étudiants concernés
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                ) : (
                  <Box>
                    {mlProjLoading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, justifyContent: 'center' }}>
                        <CircularProgress size={18} sx={{ color: C.blue }} />
                        <Typography sx={{ color: C.textSoft, fontSize: '13px' }}>Projection en cours...</Typography>
                      </Box>
                    ) : mlProjection.map((item, i) => (
                      <Box key={i} sx={{ mb: i < mlProjection.length - 1 ? 1.5 : 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography sx={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>{item.year}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <Typography sx={{ fontSize: '14px', fontWeight: 900, color: item.couleur }}>{item.taux}%</Typography>
                            <Chip label={item.interp} size="small" sx={{ height: 18, fontSize: '10px', fontWeight: 700, background: `${item.couleur}15`, color: item.couleur, border: `1px solid ${item.couleur}30`, '& .MuiChip-label': { px: 0.8 } }} />
                          </Box>
                        </Box>
                        <Box sx={{ height: 7, borderRadius: 3, background: `${item.couleur}15`, overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', borderRadius: 3, width: `${item.taux}%`, background: item.couleur, transition: 'width 0.8s ease' }} />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── M3 Performance Future ─────────────────────────────── */}
      <Card sx={{ borderRadius: '18px', border: `1.5px solid ${C.purpleL}`, boxShadow: '0 1px 3px rgba(15,23,42,0.06)', mb: 2.5, overflow: 'hidden' }}>
        <Box sx={{ px: '22px', py: '14px', borderBottom: `1px solid ${C.purpleL}`, background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 34, height: 34, borderRadius: '10px', background: 'linear-gradient(135deg, #7c3aed, #1e6ef5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🎯</Box>
          <Box>
            <Typography sx={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: '14px', color: C.textDark }}>
              Performance Future — Modèle M3 · IA
            </Typography>
            <Typography sx={{ fontSize: '11px', color: C.textSoft }}>
              Moyenne finale prédite · basée sur les indicateurs de cet établissement · 2025-2026
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
            <IconButton size="small" onClick={() => setInfoOpen('m3')} sx={{
              width: 28, height: 28, borderRadius: '8px',
              background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)',
              color: C.purple,
              '&:hover': { background: 'rgba(124,58,237,0.22)', transform: 'scale(1.1)' },
              transition: 'all 0.2s',
            }}>
              <InfoOutlined sx={{ fontSize: 15 }} />
            </IconButton>
            <Chip label="M3 · IA" size="small" sx={{ background: 'linear-gradient(135deg, #7c3aed, #1e6ef5)', color: '#fff', fontWeight: 800, fontSize: '10px', borderRadius: '8px', border: 'none' }} />
          </Box>
        </Box>
        <CardContent sx={{ p: '20px 22px' }}>
          {mlPerfLoad ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
              <CircularProgress size={20} sx={{ color: C.purple }} />
              <Typography sx={{ color: C.textSoft, fontSize: '13px' }}>Calcul de la performance future...</Typography>
            </Box>
          ) : mlPerfPred ? (
            mlProjMode === 'annee' ? (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={5}>
                  <Box sx={{ p: 2.5, borderRadius: '14px', background: `${mlPerfPred.couleur}0d`, border: `1.5px solid ${mlPerfPred.couleur}28`, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.9px', textTransform: 'uppercase', color: C.textSoft, mb: 1 }}>
                      Moyenne finale prédite 2025-2026
                    </Typography>
                    <Typography sx={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 900, fontSize: '3rem', color: mlPerfPred.couleur, lineHeight: 1, letterSpacing: '-2px' }}>
                      {mlPerfPred.moyenne_finale_predite}
                    </Typography>
                    <Typography sx={{ color: C.textSoft, fontWeight: 600, fontSize: '1rem', mt: 0.3 }}>/20</Typography>
                    <Chip label={mlPerfPred.mention} size="small" sx={{ mt: 1, background: `${mlPerfPred.couleur}18`, color: mlPerfPred.couleur, border: `1px solid ${mlPerfPred.couleur}35`, fontWeight: 700, fontSize: '11px' }} />
                    <Box sx={{ mt: 1.5, height: 6, borderRadius: 3, background: `${mlPerfPred.couleur}15`, overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', borderRadius: 3, width: `${(mlPerfPred.moyenne_finale_predite / 20) * 100}%`, background: mlPerfPred.couleur, transition: 'width 0.8s ease' }} />
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={7}>
                  <Box sx={{ p: 2.5, borderRadius: '14px', background: '#FAFBFF', border: '1px solid #F1F5F9', height: '100%' }}>
                    <Typography sx={{ fontSize: '11px', fontWeight: 700, color: C.textDark, mb: 1.5 }}>
                      📊 Grille de correspondance académique
                    </Typography>
                    {[
                      { label: 'Très bien',  seuil: '≥ 16/20', color: '#22c55e' },
                      { label: 'Bien',       seuil: '≥ 14/20', color: '#06D6A0' },
                      { label: 'Assez bien', seuil: '≥ 12/20', color: '#4D9FFF' },
                      { label: 'Passable',   seuil: '≥ 10/20', color: '#F59E0B' },
                      { label: 'Insuffisant',seuil: '< 10/20',  color: '#EF4444' },
                    ].map(m => (
                      <Box key={m.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.1, p: mlPerfPred.mention === m.label ? 1 : 0, borderRadius: '10px', background: mlPerfPred.mention === m.label ? `${m.color}09` : 'transparent', border: mlPerfPred.mention === m.label ? `1px solid ${m.color}25` : '1px solid transparent', transition: 'all 0.2s' }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: m.color, flexShrink: 0, opacity: mlPerfPred.mention === m.label ? 1 : 0.25 }} />
                        <Typography sx={{ fontSize: '12px', color: mlPerfPred.mention === m.label ? m.color : C.textSoft, fontWeight: mlPerfPred.mention === m.label ? 800 : 500, flex: 1 }}>
                          {m.label}
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: '#8A9BB0', fontWeight: 500 }}>{m.seuil}</Typography>
                        {mlPerfPred.mention === m.label && (
                          <Chip label="Prédit ✓" size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, background: `${m.color}18`, color: m.color, border: `1px solid ${m.color}30` }} />
                        )}
                      </Box>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            ) : (
              <Box>
                {mlM3ProjLoad ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, justifyContent: 'center' }}>
                    <CircularProgress size={18} sx={{ color: C.purple }} />
                    <Typography sx={{ color: C.textSoft, fontSize: '13px' }}>Projection en cours...</Typography>
                  </Box>
                ) : mlM3Proj.map((item, i) => (
                  <Box key={i} sx={{ mb: i < mlM3Proj.length - 1 ? 1.5 : 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography sx={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>{item.year}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Typography sx={{ fontSize: '14px', fontWeight: 900, color: item.couleur }}>{item.moyenne}/20</Typography>
                        <Chip label={item.mention} size="small" sx={{ height: 18, fontSize: '10px', fontWeight: 700, background: `${item.couleur}15`, color: item.couleur, border: `1px solid ${item.couleur}30`, '& .MuiChip-label': { px: 0.8 } }} />
                      </Box>
                    </Box>
                    <Box sx={{ height: 7, borderRadius: 3, background: `${item.couleur}15`, overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', borderRadius: 3, width: `${(item.moyenne / 20) * 100}%`, background: item.couleur, transition: 'width 0.8s ease' }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            )
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, px: 2, borderRadius: '12px', background: '#F8FAFF', border: '1px dashed #C8D8E8' }}>
              <Typography sx={{ fontSize: '1.2rem' }}>⚡</Typography>
              <Typography sx={{ color: C.textSoft, fontSize: '13px' }}>
                Service IA M3 non disponible — vérifiez que le serveur ML est démarré sur le port 5001
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Info Grid */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Informations générales */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            borderRadius: '18px',
            border: '1.5px solid ' + C.border,
            boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
            height: '100%',
          }}>
            <Box sx={{ p: '16px 22px', borderBottom: '1px solid ' + C.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.125 }}>
                <Box sx={{
                  width: 30,
                  height: 30,
                  borderRadius: '8px',
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                }}>
                  📋
                </Box>
                <Typography sx={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: '14px', color: C.textDark }}>
                  Informations générales
                </Typography>
              </Box>
            </Box>
            <CardContent sx={{ p: '20px 22px' }}>
              <Grid container>
                {[
                  { label: 'Code', value: etablissement.code_etablissement },
                  { label: 'Type', value: etablissement.type, chip: true },
                  { label: 'Université', value: etablissement.universite_nom || '-' },
                  { label: 'Ville', value: etablissement.nom_ville || '-' },
                  { label: 'Téléphone', value: etablissement.telephone || '-' },
                  { label: 'Email', value: etablissement.email || '-', email: true },
                  { label: 'Adresse', value: etablissement.adresse || '-', fullWidth: true },
                  { label: 'Site web', value: etablissement.site_web || '-', link: true, fullWidth: true },
                  { label: 'Date de création', value: etablissement.date_creation ? new Date(etablissement.date_creation).toLocaleDateString('fr-FR') : '-', fullWidth: true },
                ].map((item, i) => (
                  <Grid item xs={item.fullWidth ? 12 : 6} key={i}>
                    <Box sx={{ py: 1.5, pr: !item.fullWidth && i % 2 === 0 ? 2.25 : 0, pl: !item.fullWidth && i % 2 === 1 ? 2.25 : 0, borderBottom: i < 8 ? '1px solid #f8fafc' : 'none' }}>
                      <Typography sx={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.9px', textTransform: 'uppercase', color: C.textSoft, mb: 0.375, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                        {item.label}
                      </Typography>
                      {item.chip ? (
                        <Chip
                          label={item.value}
                          size="small"
                          sx={{
                            background: typeColors[item.value]?.bg || C.tealL,
                            color: typeColors[item.value]?.color || '#075985',
                            fontWeight: 700,
                            fontSize: '11px',
                            height: '24px',
                            fontFamily: "'Bricolage Grotesque', sans-serif",
                          }}
                        />
                      ) : item.link && item.value !== '-' ? (
                        <Typography
                          component="a"
                          href={item.value.startsWith('http') ? item.value : `https://${item.value}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: C.blue,
                            textDecoration: 'none',
                            fontFamily: "'Bricolage Grotesque', sans-serif",
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          {item.value}
                        </Typography>
                      ) : (
                        <Typography sx={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: item.email ? C.blue : C.textDark,
                          fontFamily: "'Bricolage Grotesque', sans-serif",
                        }}>
                          {item.value}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistiques & Performance */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            borderRadius: '18px',
            border: '1.5px solid ' + C.border,
            boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
            height: '100%',
          }}>
            <Box sx={{ p: '16px 22px', borderBottom: '1px solid ' + C.border }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.125 }}>
                <Box sx={{
                  width: 30,
                  height: 30,
                  borderRadius: '8px',
                  background: C.blueL,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                }}>
                  📊
                </Box>
                <Typography sx={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: '14px', color: C.textDark }}>
                  Statistiques & Performance
                </Typography>
              </Box>
            </Box>
            <CardContent sx={{ p: '20px 22px' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { 
                    label: 'Budget alloué', 
                    value: etablissement.budget_alloue ? `${parseFloat(etablissement.budget_alloue).toLocaleString()} TND` : 'N/A',
                    icon: '💰',
                    color: '#10B981',
                    bgColor: '#ECFDF5'
                  },
                  { 
                    label: 'Effectif total', 
                    value: etablissement.effectif_total || 0,
                    icon: '👥',
                    color: '#3B82F6',
                    bgColor: '#EFF6FF'
                  },
                  { 
                    label: 'Taux de réussite', 
                    value: etablissement.taux_reussite ? `${parseFloat(etablissement.taux_reussite).toFixed(1)}%` : 'N/A',
                    percent: etablissement.taux_reussite || 0,
                    icon: '✅',
                    color: '#10B981',
                    bgColor: '#ECFDF5',
                    showBar: true
                  },
                  { 
                    label: 'Taux d\'échec', 
                    value: etablissement.taux_echec ? `${parseFloat(etablissement.taux_echec).toFixed(1)}%` : 'N/A',
                    percent: etablissement.taux_echec || 0,
                    icon: '❌',
                    color: '#EF4444',
                    bgColor: '#FEE2E2',
                    showBar: true
                  },
                  { 
                    label: 'Performance globale', 
                    value: etablissement.performance ? `${parseFloat(etablissement.performance).toFixed(1)}%` : 'N/A',
                    percent: etablissement.performance || 0,
                    icon: '⭐',
                    color: '#F59E0B',
                    bgColor: '#FEF3C7',
                    showBar: true
                  },
                ].map((item, i) => (
                  <Box key={i} sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: '12px',
                    background: '#FAFBFF',
                    border: '1px solid #F1F5F9',
                    transition: 'all 0.2s',
                    '&:hover': {
                      background: item.bgColor,
                      borderColor: item.color + '30',
                    }
                  }}>
                    <Box sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '10px',
                      background: item.bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      flexShrink: 0,
                    }}>
                      {item.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '11px', color: C.textSoft, fontWeight: 600, mb: 0.5 }}>
                        {item.label}
                      </Typography>
                      {item.showBar ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ flex: 1, height: '6px', background: '#F1F5F9', borderRadius: '20px', overflow: 'hidden' }}>
                            <Box sx={{
                              height: '100%',
                              width: `${item.percent}%`,
                              background: item.color,
                              borderRadius: '20px',
                              transition: 'width 0.3s ease',
                            }} />
                          </Box>
                          <Typography sx={{ fontSize: '13px', fontWeight: 700, color: item.color, minWidth: '45px', textAlign: 'right' }}>
                            {item.value}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography sx={{ fontSize: '14px', fontWeight: 700, color: C.textDark }}>
                          {item.value}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Card */}
      <Card data-tab-section="etablissement-tabs" sx={{
        borderRadius: '18px',
        border: '1.5px solid ' + C.border,
        boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
        overflow: 'hidden',
      }}>
        <Box sx={{ borderBottom: '1px solid ' + C.border, background: '#fafbff', px: 2.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            sx={{
              minHeight: '48px',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '13px',
                fontWeight: 500,
                color: C.textSoft,
                minHeight: '48px',
                px: 2,
                gap: 0.5,
                '&.Mui-selected': {
                  color: C.blue,
                  fontWeight: 700,
                },
              },
              '& .MuiTabs-indicator': {
                height: '2.5px',
                backgroundColor: C.blue,
              },
            }}
          >
            <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><span>🏢</span><span>Départements</span><Chip label={etablissement.nombre_departements || 0} size="small" sx={{ height: '18px', fontSize: '10px', fontWeight: 700, background: activeTab === 0 ? C.blue : C.blueL, color: activeTab === 0 ? '#fff' : C.blue, '& .MuiChip-label': { px: 0.875 } }} /></Box>} />
            <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><span>🎯</span><span>Spécialités</span><Chip label={etablissement.nombre_specialites || 0} size="small" sx={{ height: '18px', fontSize: '10px', fontWeight: 700, background: activeTab === 1 ? C.blue : C.blueL, color: activeTab === 1 ? '#fff' : C.blue, '& .MuiChip-label': { px: 0.875 } }} /></Box>} />
            <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><span>👨‍🏫</span><span>Enseignants</span><Chip label={etablissement.nombre_enseignants || 0} size="small" sx={{ height: '18px', fontSize: '10px', fontWeight: 700, background: activeTab === 2 ? C.blue : C.blueL, color: activeTab === 2 ? '#fff' : C.blue, '& .MuiChip-label': { px: 0.875 } }} /></Box>} />
            <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><span>⏰</span><span>Activité</span></Box>} />
            <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><span>⚠️</span><span>Étudiants à risque</span>{risqueData && <Chip label={risqueData.total} size="small" sx={{ height: '18px', fontSize: '10px', fontWeight: 700, background: activeTab === 4 ? C.red : C.redL, color: activeTab === 4 ? '#fff' : C.red, '& .MuiChip-label': { px: 0.875 } }} />}</Box>} />
          </Tabs>

          {activeTab === 0 ? (
            <Tooltip title="Voir les départements archivés" arrow>
              <IconButton
                onClick={openArchivesDialog}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '14px',
                  background: '#FFFBEB',
                  border: '2px solid #FDE68A',
                  color: '#D97706',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: '#FEF3C7',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
                  },
                }}
              >
                <Archive sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          ) : activeTab === 1 ? (
            <Tooltip title="Voir les spécialités archivées" arrow>
              <IconButton
                onClick={openSpecArchivesDialog}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '14px',
                  background: '#FFFBEB',
                  border: '2px solid #FDE68A',
                  color: '#D97706',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: '#FEF3C7',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
                  },
                }}
              >
                <Archive sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          ) : exportable && (
            <Tooltip title={tabHasData ? 'Exporter en CSV' : 'Aucune donnée à exporter'} arrow>
              <span>
                <IconButton
                  onClick={handleExportCSV}
                  disabled={!tabHasData}
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
                    '&.Mui-disabled': {
                      background: '#F1F5F9',
                      border: '2px solid #E2E8F0',
                      color: '#94A3B8',
                    },
                  }}
                >
                  <FileDownload sx={{ fontSize: 20 }} />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>

        {/* Tab Content */}
        <Box>
          {/* Départements Tab */}
          {activeTab === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: 'transparent' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                      CODE
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                      DÉPARTEMENT
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                      CHEF DE DÉPARTEMENT
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                      SPÉCIALITÉS
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                      ENSEIGNANTS
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                      ACTIONS
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingTab ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography>Chargement...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : departements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="textSecondary">Aucun département trouvé</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    departements.map((dept, index) => (
                      <TableRow key={dept.id_departement} sx={{ '&:hover': { background: '#F9FAFB' }, transition: 'background 0.2s', borderBottom: index === departements.length - 1 ? 'none' : '1px solid #F3F4F6' }}>
                        <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                          <Chip label={dept.code_departement} sx={{ background: '#EFF6FF', color: '#2563EB', fontWeight: 700, fontSize: '0.85rem', borderRadius: '8px', height: '32px' }} />
                        </TableCell>
                        <TableCell sx={{ py: 3, borderBottom: 'none', color: '#1F2937', fontWeight: 600, fontSize: '0.95rem' }}>
                          {dept.nom_departement}
                        </TableCell>
                        <TableCell sx={{ py: 3, borderBottom: 'none', color: '#6B7280', fontWeight: 500, fontSize: '0.9rem' }}>
                          {dept.chef_departement || '-'}
                        </TableCell>
                        <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                          <Chip label={`${dept.nombre_specialites} spécialités`} size="small" sx={{ background: C.greenL, color: '#065f46', fontWeight: 700, fontSize: '0.8rem', borderRadius: '8px', height: '28px' }} />
                        </TableCell>
                        <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                          <Chip label={`${dept.nombre_enseignants} enseignants`} size="small" sx={{ background: C.purpleL, color: C.purple, fontWeight: 700, fontSize: '0.8rem', borderRadius: '8px', height: '28px' }} />
                        </TableCell>
                        <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Voir le détail du département" arrow>
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/dashboard/${isRecteur ? 'recteur' : 'admin'}/departements/${dept.id_departement}`)}
                                sx={{
                                  background: C.blueL,
                                  color: C.blue,
                                  borderRadius: '8px',
                                  width: 34,
                                  height: 34,
                                  border: `1px solid ${C.blue}30`,
                                  transition: 'all 0.2s',
                                  '&:hover': { background: C.blue, color: '#fff', boxShadow: `0 4px 12px ${C.blue}40` },
                                }}
                              >
                                <Visibility sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Archiver ce département" arrow>
                              <IconButton
                                size="small"
                                onClick={() => archiveDept(dept.id_departement, dept.nom_departement)}
                                sx={{
                                  background: '#FFFBEB',
                                  color: '#D97706',
                                  borderRadius: '8px',
                                  width: 34,
                                  height: 34,
                                  border: '1px solid #FDE68A',
                                  transition: 'all 0.2s',
                                  '&:hover': { background: '#D97706', color: '#fff', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.4)' },
                                }}
                              >
                                <Archive sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Spécialités Tab */}
          {activeTab === 1 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: 'transparent' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                      CODE
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                      INTITULÉ
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                      DÉPARTEMENT
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                      NIVEAU
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                      ÉTUDIANTS
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                      TAUX REMPLISSAGE
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                      ACTIONS
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingTab ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography>Chargement...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : specialites.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="textSecondary">Aucune spécialité trouvée</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    specialites.map((spec, index) => (
                      <TableRow key={spec.id_specialite} sx={{ '&:hover': { background: '#F9FAFB' }, transition: 'background 0.2s', borderBottom: index === specialites.length - 1 ? 'none' : '1px solid #F3F4F6' }}>
                        <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                          <Chip label={spec.code_specialite} sx={{ background: '#EFF6FF', color: '#2563EB', fontWeight: 700, fontSize: '0.85rem', borderRadius: '8px', height: '32px' }} />
                        </TableCell>
                        <TableCell sx={{ py: 3, borderBottom: 'none', color: '#1F2937', fontWeight: 600, fontSize: '0.95rem' }}>
                          {spec.nom_specialite}
                        </TableCell>
                        <TableCell sx={{ py: 3, borderBottom: 'none', color: '#6B7280', fontWeight: 500, fontSize: '0.9rem' }}>
                          {spec.nom_departement}
                        </TableCell>
                        <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                          <Chip label={spec.niveau} size="small" sx={{ background: spec.niveau === 'Master' ? C.purpleL : C.amberL, color: spec.niveau === 'Master' ? C.purple : C.amber, fontWeight: 700, fontSize: '0.75rem', borderRadius: '8px', height: '28px' }} />
                        </TableCell>
                        <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                          <Typography sx={{ color: '#1F2937', fontWeight: 600, fontSize: '0.95rem' }}>
                            {spec.nombre_etudiants}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flex: 1, maxWidth: '120px', height: '6px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                              <Box sx={{
                                height: '100%',
                                width: `${spec.taux_remplissage}%`,
                                background: spec.taux_remplissage >= 90 ? '#EF4444' : spec.taux_remplissage >= 80 ? '#F59E0B' : '#10B981',
                                borderRadius: '3px'
                              }} />
                            </Box>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1F2937', minWidth: '40px' }}>
                              {spec.taux_remplissage}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                          <Tooltip title="Archiver cette spécialité" arrow>
                            <IconButton
                              size="small"
                              onClick={() => archiveSpec(spec.id_specialite, spec.nom_specialite)}
                              sx={{
                                background: '#FFFBEB',
                                color: '#D97706',
                                borderRadius: '8px',
                                width: 34,
                                height: 34,
                                border: '1px solid #FDE68A',
                                transition: 'all 0.2s',
                                '&:hover': { background: '#D97706', color: '#fff', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.4)' },
                              }}
                            >
                              <Archive sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination pour Spécialités */}
          {activeTab === 1 && specialitesPagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3, borderTop: '1px solid #F3F4F6' }}>
              <Pagination 
                count={specialitesPagination.totalPages} 
                page={specialitesPage} 
                onChange={(e, page) => setSpecialitesPage(page)}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}

          {/* Enseignants Tab */}
          {activeTab === 2 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: 'transparent' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                      MATRICULE
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                      DÉPARTEMENT
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                      GRADE
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                      SPÉCIALITÉ
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingTab ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                        <Typography>Chargement...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : enseignants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                        <Typography color="textSecondary">Aucun enseignant trouvé</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    enseignants.map((ens, index) => (
                      <TableRow key={ens.numero_utilisateur} sx={{ '&:hover': { background: '#F9FAFB' }, transition: 'background 0.2s', borderBottom: index === enseignants.length - 1 ? 'none' : '1px solid #F3F4F6' }}>
                        <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                          <Chip label={ens.matricule || ens.numero_utilisateur} sx={{ background: '#EFF6FF', color: '#2563EB', fontWeight: 700, fontSize: '0.85rem', borderRadius: '8px', height: '32px' }} />
                        </TableCell>
                        <TableCell sx={{ py: 3, borderBottom: 'none', color: '#6B7280', fontWeight: 500, fontSize: '0.9rem' }}>
                          {ens.nom_departement || '-'}
                        </TableCell>
                        <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                          <Chip
                            label={ens.grade || 'N/A'}
                            size="small"
                            sx={{
                              background: ens.grade === 'Professeur' ? C.purpleL : ens.grade === 'Maître de conférences' ? C.blueL : C.greenL,
                              color: ens.grade === 'Professeur' ? C.purple : ens.grade === 'Maître de conférences' ? C.blue : '#065f46',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              borderRadius: '8px',
                              height: '28px'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 3, borderBottom: 'none', color: '#6B7280', fontWeight: 500, fontSize: '0.9rem' }}>
                          {ens.specialite || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {/* Pagination pour Enseignants */}
          {activeTab === 2 && enseignantsPagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3, borderTop: '1px solid #F3F4F6' }}>
              <Pagination 
                count={enseignantsPagination.totalPages} 
                page={enseignantsPage} 
                onChange={(e, page) => setEnseignantsPage(page)}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
          
          {/* Activité Tab */}
          {activeTab === 3 && (
            <Box sx={{ p: '20px 22px' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  { icon: '✏️', bg: '#eff6ff', title: 'Informations générales mises à jour', date: 'Il y a 2 jours · 14:32' },
                  { icon: '➕', bg: C.greenL, title: 'Nouvelle spécialité "IA & Data" ajoutée — Dept. Informatique', date: 'Il y a 5 jours · 09:15' },
                  { icon: '🏢', bg: C.purpleL, title: 'Département "Génie des Systèmes" créé', date: 'Il y a 1 semaine · 11:00' },
                  { icon: '👥', bg: C.amberL, title: 'Effectifs mis à jour — +120 inscrits en Licence 1', date: 'Il y a 2 semaines · 08:45' },
                  { icon: '📋', bg: '#fce7f3', title: 'Niveau Master 2 ouvert pour l\'année 2025-2026', date: 'Il y a 1 mois · 15:20' },
                ].map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1.75, pb: i < 4 ? 2 : 0 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <Box sx={{
                        width: 30,
                        height: 30,
                        borderRadius: '9px',
                        background: item.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                      }}>
                        {item.icon}
                      </Box>
                      {i < 4 && (
                        <Box sx={{ width: '2px', flex: 1, background: '#f1f5f9', mt: 0.625 }} />
                      )}
                    </Box>
                    <Box sx={{ flex: 1, pt: 0.375 }}>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: C.textDark }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{ fontSize: '11px', color: C.textSoft, mt: 0.25 }}>
                        {item.date}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Étudiants à risque Tab */}
          {activeTab === 4 && (
            <Box sx={{ p: '20px 22px' }}>
              {loadingTab ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4 }}>
                  <CircularProgress size={22} sx={{ color: C.red }} />
                  <Typography sx={{ color: C.textSoft, fontSize: '13px' }}>Chargement des étudiants à risque...</Typography>
                </Box>
              ) : !risqueData ? (
                <Typography sx={{ color: C.textSoft, textAlign: 'center', py: 4 }}>Aucune donnée disponible</Typography>
              ) : (
                <>
                  {/* Barre de synthèse */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                    {[
                      { label: '% étudiants à risque', value: `${risqueData.taux_risque_global || 0}%`, color: C.red, bg: C.redL, icon: '📊' },
                      { label: 'Total à risque', value: `${risqueData.total} / ${risqueData.total_etudiants || 0}`, color: C.red, bg: C.redL, icon: '⚠️' },
                      { label: 'Situation critique (< 7)', value: risqueData.nb_critique, color: '#b91c1c', bg: '#fee2e2', icon: '🔴' },
                      { label: 'En attention (7–10)', value: risqueData.nb_attention, color: C.amber, bg: C.amberL, icon: '🟠' },
                    ].map((s, i) => (
                      <Box key={i} sx={{
                        flex: '1 1 140px', p: '14px 18px', borderRadius: '14px',
                        background: s.bg, border: `1.5px solid ${s.color}28`,
                        display: 'flex', alignItems: 'center', gap: 1.5,
                      }}>
                        <Typography sx={{ fontSize: '1.3rem' }}>{s.icon}</Typography>
                        <Box>
                          <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', color: s.color, lineHeight: 1 }}>
                            {s.value}
                          </Typography>
                          <Typography sx={{ fontSize: '11px', color: C.textSoft, mt: 0.3, fontWeight: 600 }}>
                            {s.label}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  {risqueData.departements.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 5, borderRadius: '16px', background: C.greenL, border: `1.5px solid ${C.green}30` }}>
                      <Typography sx={{ fontSize: '2rem', mb: 1 }}>✅</Typography>
                      <Typography sx={{ fontWeight: 700, color: C.green, fontSize: '15px' }}>
                        Aucun étudiant à risque dans cet établissement
                      </Typography>
                      <Typography sx={{ color: C.textSoft, fontSize: '12px', mt: 0.5 }}>
                        Tous les étudiants ont une moyenne ≥ 10 / 20
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                      {risqueData.departements.map((dept) => {
                        // Fallbacks défensifs si le backend ne renvoie pas tous les champs
                        const nbCrit = dept.nb_critique || 0;
                        const nbAtt  = dept.nb_attention || 0;
                        const nbRisque = dept.nb_risque ?? (nbCrit + nbAtt);
                        const totalEtu = dept.total_etudiants || 0;
                        const taux = totalEtu > 0
                          ? Math.round((nbRisque / totalEtu) * 1000) / 10
                          : null; // null = ratio inconnu

                        const tauxColor = taux === null ? C.textSoft
                          : taux >= 30 ? '#EF4444'
                          : taux >= 15 ? '#F59E0B'
                          : taux > 0   ? '#10B981'
                          : C.textSoft;
                        const tauxBg = taux === null ? '#FAFBFF'
                          : taux >= 30 ? '#FEF2F2'
                          : taux >= 15 ? '#FFFBEB'
                          : taux > 0   ? '#F0FDF4'
                          : '#FAFBFF';

                        return (
                          <Box key={dept.id_departement} sx={{
                            display: 'flex', alignItems: 'center', gap: 2,
                            p: '14px 18px',
                            borderRadius: '14px',
                            border: `1.5px solid ${tauxColor}25`,
                            background: tauxBg,
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: tauxColor + '60',
                              transform: 'translateY(-1px)',
                              boxShadow: `0 4px 14px ${tauxColor}20`,
                            },
                          }}>
                            {/* Bloc gauche : code + nom + breakdown */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                              <Chip
                                label={dept.code_departement}
                                size="small"
                                sx={{ background: C.blueL, color: C.blue, fontWeight: 700, fontSize: '11px', borderRadius: '8px', height: '26px', flexShrink: 0 }}
                              />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '14px', color: C.textDark, mb: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {dept.nom_departement}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                                  <Typography component="span" sx={{ fontSize: '11.5px', color: C.textSoft, fontWeight: 600 }}>
                                    {totalEtu > 0
                                      ? <><b style={{ color: C.textDark }}>{nbRisque}</b> / {totalEtu} étudiants à risque</>
                                      : <><b style={{ color: C.textDark }}>{nbRisque}</b> étudiant{nbRisque > 1 ? 's' : ''} à risque</>}
                                  </Typography>
                                  {nbCrit > 0 && (
                                    <Chip label={`${nbCrit} critique${nbCrit > 1 ? 's' : ''}`} size="small"
                                      sx={{ background: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: '10px', height: '20px', borderRadius: '6px', '& .MuiChip-label': { px: 0.75 } }} />
                                  )}
                                  {nbAtt > 0 && (
                                    <Chip label={`${nbAtt} attention`} size="small"
                                      sx={{ background: C.amberL, color: '#92400e', fontWeight: 700, fontSize: '10px', height: '20px', borderRadius: '6px', '& .MuiChip-label': { px: 0.75 } }} />
                                  )}
                                </Box>
                              </Box>
                            </Box>

                            {/* Bloc droit : barre + % */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 170, justifyContent: 'flex-end' }}>
                              {taux !== null && (
                                <>
                                  <Box sx={{ width: 80, height: 8, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
                                    <Box sx={{
                                      height: '100%',
                                      width: `${Math.min(taux, 100)}%`,
                                      background: tauxColor,
                                      borderRadius: 4,
                                      transition: 'width 0.6s ease',
                                    }} />
                                  </Box>
                                  <Typography sx={{
                                    fontWeight: 900, fontSize: '20px',
                                    color: tauxColor,
                                    minWidth: 60, textAlign: 'right',
                                    lineHeight: 1,
                                    fontFamily: "'Bricolage Grotesque', sans-serif",
                                  }}>
                                    {taux}%
                                  </Typography>
                                </>
                              )}
                              {taux === null && (
                                <Typography sx={{ fontSize: '11px', color: C.textSoft, fontStyle: 'italic', minWidth: 80, textAlign: 'right' }}>
                                  N/A
                                </Typography>
                              )}
                            </Box>

                            {/* Bouton détail */}
                            <Tooltip title="Voir le détail du département" arrow>
                              <IconButton
                                onClick={() => navigate(`/dashboard/${isRecteur ? 'recteur' : 'admin'}/departements/${dept.id_departement}`)}
                                sx={{
                                  width: 40, height: 40, borderRadius: '11px',
                                  background: '#fff',
                                  border: `1.5px solid ${tauxColor === C.textSoft ? C.border : tauxColor + '50'}`,
                                  color: tauxColor === C.textSoft ? C.blue : tauxColor,
                                  '&:hover': {
                                    background: tauxColor === C.textSoft ? C.blue : tauxColor,
                                    color: '#fff',
                                    transform: 'translateY(-1px)',
                                    boxShadow: `0 4px 10px ${tauxColor === C.textSoft ? C.blue : tauxColor}40`,
                                  },
                                  transition: 'all 0.2s', flexShrink: 0,
                                }}
                              >
                                <Visibility sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </>
              )}
            </Box>
          )}
        </Box>
      </Card>

      {/* ── Popup explicatif IA ────────────────────────────────── */}
      <Dialog
        open={!!infoOpen}
        onClose={() => setInfoOpen(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(15,23,42,0.18)' } }}
      >
        {/* Header coloré selon le modèle */}
        <Box sx={{
          px: 3, py: 2.5,
          background: infoOpen === 'm1'
            ? 'linear-gradient(135deg, #eef4ff 0%, #e0f2fe 100%)'
            : 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
          borderBottom: `1px solid ${infoOpen === 'm1' ? C.blueL : C.purpleL}`,
          display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
          <Box sx={{
            width: 42, height: 42, borderRadius: '12px', flexShrink: 0,
            background: infoOpen === 'm1'
              ? 'linear-gradient(135deg, #0c1e3e, #1e6ef5)'
              : 'linear-gradient(135deg, #7c3aed, #1e6ef5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
          }}>
            {infoOpen === 'm1' ? '🤖' : '🎯'}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '15px', color: C.textDark }}>
              {infoOpen === 'm1'
                ? 'Comment fonctionne la Prévision IA — M1 ?'
                : 'Comment fonctionne la Performance Future — M3 ?'}
            </Typography>
            <Typography sx={{ fontSize: '11px', color: C.textSoft, mt: 0.3 }}>
              {infoOpen === 'm1'
                ? 'Modèle M1 · Régression Linéaire · R²=86%'
                : 'Modèle M3 · Régression Linéaire · R²=74.5%'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setInfoOpen(null)}
            sx={{ color: C.textSoft, '&:hover': { color: C.textDark, background: '#f1f5f9' } }}>
            ✕
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          {/* Section : C'est quoi ? */}
          <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${C.border}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
              <Box sx={{ width: 24, height: 24, borderRadius: '6px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>💡</Box>
              <Typography sx={{ fontWeight: 700, fontSize: '13px', color: C.textDark }}>C'est quoi ?</Typography>
            </Box>
            <Typography sx={{ fontSize: '13px', color: C.textMid, lineHeight: 1.75 }}>
              {infoOpen === 'm1'
                ? "Ce chiffre est une estimation du taux de réussite attendu pour l'année académique 2025-2026. Il est calculé par un algorithme d'intelligence artificielle entraîné sur des données réelles d'établissements universitaires tunisiens."
                : "Ce chiffre est une estimation de la moyenne finale que les étudiants de cet établissement devraient obtenir en 2025-2026. Il est produit par un algorithme d'intelligence artificielle qui analyse les tendances académiques actuelles."}
            </Typography>
          </Box>

          {/* Section : Formule mathématique */}
          <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${C.border}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 24, height: 24, borderRadius: '6px', background: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>🧮</Box>
              <Typography sx={{ fontWeight: 700, fontSize: '13px', color: C.textDark }}>Formule mathématique appliquée</Typography>
            </Box>

            {/* Formule générale */}
            <Box sx={{ mb: 1.5, p: 1.5, borderRadius: '10px', background: '#0f172a', border: '1px solid #1e293b' }}>
              <Typography sx={{ fontSize: '11px', color: '#94a3b8', mb: 0.6, fontWeight: 600, letterSpacing: '0.05em' }}>
                Régression Linéaire Multiple
              </Typography>
              <Typography sx={{
                fontFamily: 'monospace', fontSize: '13px', color: '#7dd3fc', lineHeight: 1.9,
                whiteSpace: 'pre-wrap',
              }}>
                {infoOpen === 'm1'
                  ? 'ŷ = β₀ + β₁·x₁ + β₂·x₂ + β₃·x₃\n   + β₄·x₄ + β₅·x₅ + β₆·x₆ + β₇·x₇'
                  : 'ŷ = β₀ + β₁·x₁ + β₂·x₂ + β₃·x₃\n   + β₄·x₄ + β₅·x₅ + β₆·x₆\n   + β₇·x₇ + β₈·x₈'}
              </Typography>
              <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #1e293b' }}>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '11px', color: '#4ade80' }}>
                  {infoOpen === 'm1' ? 'ŷ = Taux de réussite prédit (%)' : 'ŷ = Moyenne finale prédite (/20)'}
                </Typography>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '11px', color: '#f59e0b', mt: 0.3 }}>
                  β₀…βₙ = coefficients appris par le modèle
                </Typography>
              </Box>
            </Box>

            {/* Mapping des variables */}
            <Typography sx={{ fontSize: '11px', fontWeight: 700, color: C.textSoft, mb: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Correspondance des variables
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {(infoOpen === 'm1' ? [
                { sym: 'x₁', name: 'Taux de réussite N-1',        unit: '%' },
                { sym: 'x₂', name: 'Taux de réussite N-2',        unit: '%' },
                { sym: 'x₃', name: "Taux d'absence moyen",        unit: '%' },
                { sym: 'x₄', name: 'Ratio étudiants / enseignant', unit: 'nb' },
                { sym: 'x₅', name: 'Budget par étudiant',          unit: 'DT' },
                { sym: 'x₆', name: 'Nombre de laboratoires',       unit: 'nb' },
                { sym: 'x₇', name: 'Taux de rotation enseignants', unit: '%' },
              ] : [
                { sym: 'x₁', name: 'Moyenne semestre précédent',    unit: '/20' },
                { sym: 'x₂', name: 'Note CC1',                      unit: '/20' },
                { sym: 'x₃', name: 'Note CC2',                      unit: '/20' },
                { sym: 'x₄', name: 'Note CC3',                      unit: '/20' },
                { sym: 'x₅', name: "Taux d'absence actuel",         unit: '%' },
                { sym: 'x₆', name: 'Pente d\'évolution CC1→CC3',    unit: 'pts' },
                { sym: 'x₇', name: 'Matières sous la moyenne',      unit: 'nb' },
                { sym: 'x₈', name: 'Ratio de notes obtenues',       unit: '0–1' },
              ]).map(v => (
                <Box key={v.sym} sx={{ display: 'flex', alignItems: 'center', gap: 1.2, px: 1.2, py: 0.7, borderRadius: '8px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 800, color: '#7c3aed', minWidth: 24 }}>{v.sym}</Typography>
                  <Typography sx={{ fontSize: '12px', color: C.textMid, flex: 1 }}>{v.name}</Typography>
                  <Chip label={v.unit} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, background: '#ede9fe', color: '#7c3aed', '& .MuiChip-label': { px: 0.8 } }} />
                </Box>
              ))}
            </Box>

            {/* Formule d'estimation pour cet établissement */}
            <Box sx={{ mt: 1.5, p: 1.5, borderRadius: '10px', background: 'linear-gradient(135deg, #fffbeb 0%, #fef9c3 100%)', border: '1px solid #fde68a' }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#92400e', mb: 0.6 }}>
                📐 Estimation des entrées depuis les données de l'établissement
              </Typography>
              <Typography sx={{ fontFamily: 'monospace', fontSize: '11px', color: '#78350f', lineHeight: 2, whiteSpace: 'pre-wrap' }}>
                {infoOpen === 'm1'
                  ? 'x₁ = max(0, taux_réussite − 1.8)\nx₂ = taux_réussite  (valeur réelle DB)\nx₅ = budget_alloué ÷ effectif_total'
                  : 'x₁ = min(16, max(5, 5 + taux_réussite × 0.1))\nx₇ = max(0, round((1 − taux_réussite) × 6))\nx₂₋₄ = estimés à partir de x₁ ± 0.5 pts'}
              </Typography>
            </Box>
          </Box>

          {/* Section : Données utilisées */}
          <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${C.border}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 24, height: 24, borderRadius: '6px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>📊</Box>
              <Typography sx={{ fontWeight: 700, fontSize: '13px', color: C.textDark }}>Données utilisées pour le calcul</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
              {(infoOpen === 'm1' ? [
                { icon: '📈', text: 'Taux de réussite des 2 dernières années' },
                { icon: '🚪', text: 'Taux d\'absence moyen des étudiants' },
                { icon: '👥', text: 'Ratio étudiants par enseignant' },
                { icon: '💰', text: 'Budget alloué par étudiant' },
                { icon: '🔬', text: 'Nombre de laboratoires disponibles' },
                { icon: '🔄', text: 'Taux de rotation des enseignants' },
                { icon: '📍', text: 'Région géographique et type d\'établissement' },
              ] : [
                { icon: '📝', text: 'Moyenne estimée du semestre précédent' },
                { icon: '✏️', text: 'Notes de contrôle continu CC1, CC2, CC3' },
                { icon: '🚪', text: 'Taux d\'absence actuel' },
                { icon: '📉', text: 'Tendance d\'évolution des notes (hausse/baisse)' },
                { icon: '⚠️', text: 'Nombre de matières en dessous de la moyenne' },
                { icon: '✅', text: 'Ratio de notes complètes obtenues' },
                { icon: '🎓', text: 'Niveau d\'études et filière' },
              ]).map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.2, px: 1.5, py: 0.9, borderRadius: '9px', background: '#f8fafc' }}>
                  <Typography sx={{ fontSize: '0.9rem' }}>{item.icon}</Typography>
                  <Typography sx={{ fontSize: '12.5px', color: C.textMid }}>{item.text}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Section : Comment lire le résultat */}
          <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${C.border}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 24, height: 24, borderRadius: '6px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>🔍</Box>
              <Typography sx={{ fontWeight: 700, fontSize: '13px', color: C.textDark }}>Comment lire le résultat ?</Typography>
            </Box>
            {infoOpen === 'm1' ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.7 }}>
                {[
                  { range: '≥ 70%', label: 'Bon', color: '#22c55e', bg: '#f0fdf4' },
                  { range: '55% – 69%', label: 'Moyen', color: '#f59e0b', bg: '#fffbeb' },
                  { range: '< 55%', label: 'Faible', color: '#ef4444', bg: '#fef2f2' },
                ].map(m => (
                  <Box key={m.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1, borderRadius: '9px', background: m.bg, border: `1px solid ${m.color}20` }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: '12.5px', color: m.color, fontWeight: 700, minWidth: 80 }}>{m.range}</Typography>
                    <Typography sx={{ fontSize: '12.5px', color: C.textMid }}>→ {m.label}</Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.7 }}>
                {[
                  { range: '≥ 16/20', label: 'Très bien', color: '#22c55e', bg: '#f0fdf4' },
                  { range: '≥ 14/20', label: 'Bien', color: '#06D6A0', bg: '#ecfdf5' },
                  { range: '≥ 12/20', label: 'Assez bien', color: '#4D9FFF', bg: '#eff6ff' },
                  { range: '≥ 10/20', label: 'Passable', color: '#f59e0b', bg: '#fffbeb' },
                  { range: '< 10/20', label: 'Insuffisant', color: '#ef4444', bg: '#fef2f2' },
                ].map(m => (
                  <Box key={m.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 0.9, borderRadius: '9px', background: m.bg, border: `1px solid ${m.color}20` }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: '12.5px', color: m.color, fontWeight: 700, minWidth: 70 }}>{m.range}</Typography>
                    <Typography sx={{ fontSize: '12.5px', color: C.textMid }}>→ Mention {m.label}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Section : Fiabilité */}
          <Box sx={{ px: 3, py: 2.5 }}>
            <Box sx={{ p: 2, borderRadius: '12px', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '1px solid #bae6fd' }}>
              <Typography sx={{ fontWeight: 700, fontSize: '12.5px', color: '#0369a1', mb: 0.5 }}>
                ⚡ Précision du modèle : {infoOpen === 'm1' ? 'R² = 86%' : 'R² = 74,5%'}
              </Typography>
              <Typography sx={{ fontSize: '12px', color: '#0c4a6e', lineHeight: 1.7 }}>
                {infoOpen === 'm1'
                  ? "Le modèle explique 86% de la variation des taux de réussite observés. C'est une bonne fiabilité pour une prévision académique. La valeur reste une estimation — les résultats réels peuvent varier selon des facteurs imprévisibles."
                  : "Le modèle explique 74,5% de la variation des moyennes finales observées. Il s'agit d'une estimation basée sur les tendances actuelles. Les résultats réels peuvent différer selon l'effort individuel des étudiants et d'autres facteurs."}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* ── Dialog : Départements archivés ─────────────────────── */}
      <Dialog
        open={archivesOpen}
        onClose={() => setArchivesOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden' } }}
      >
        <Box sx={{
          px: 3, py: 2,
          background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          borderBottom: '1.5px solid #FDE68A',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: '12px',
              background: '#FDE68A', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Archive sx={{ color: '#D97706', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography sx={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: '16px', color: '#92400E' }}>
                Départements archivés
              </Typography>
              <Typography sx={{ fontSize: '11.5px', color: '#A16207' }}>
                {archivedDepts.length} département{archivedDepts.length > 1 ? 's' : ''} archivé{archivedDepts.length > 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setArchivesOpen(false)} sx={{ color: '#92400E' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          {archivesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={28} sx={{ color: '#D97706' }} />
            </Box>
          ) : archivedDepts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ fontSize: '2.5rem', mb: 1, opacity: 0.4 }}>📦</Typography>
              <Typography sx={{ fontWeight: 700, color: C.textMid, fontSize: '14px' }}>
                Aucun département archivé
              </Typography>
              <Typography sx={{ fontSize: '12px', color: C.textSoft, mt: 0.5 }}>
                Les départements archivés apparaîtront ici
              </Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ background: '#FAFBFF' }}>
                  {['Code', 'Département', 'Chef', 'Archivé le', 'Action'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.4px', py: 1.5 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {archivedDepts.map((dept, i) => (
                  <TableRow key={dept.id_departement} sx={{ '&:hover': { background: '#FFFBEB' }, borderBottom: i < archivedDepts.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <TableCell sx={{ py: 2 }}>
                      <Chip label={dept.code_departement} size="small" sx={{ background: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: '11px', borderRadius: '7px' }} />
                    </TableCell>
                    <TableCell sx={{ py: 2, fontWeight: 600, fontSize: '13px', color: C.textDark }}>
                      {dept.nom_departement}
                    </TableCell>
                    <TableCell sx={{ py: 2, fontSize: '12px', color: C.textMid }}>
                      {dept.chef_departement || '—'}
                    </TableCell>
                    <TableCell sx={{ py: 2, fontSize: '11.5px', color: C.textSoft }}>
                      {dept.archived_at ? new Date(dept.archived_at).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', gap: 0.75 }}>
                        <Tooltip title="Voir les détails de l'archivage" arrow>
                          <IconButton
                            size="small"
                            onClick={() => setLogDialog({ open: true, type: 'dept', entity: dept })}
                            sx={{
                              background: '#EFF6FF', color: '#2563EB',
                              borderRadius: '8px', width: 34, height: 34,
                              border: '1px solid #BFDBFE',
                              '&:hover': { background: '#2563EB', color: '#fff', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)' },
                            }}
                          >
                            <InfoOutlined sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Restaurer ce département" arrow>
                          <IconButton
                            size="small"
                            onClick={() => restoreDept(dept.id_departement, dept.nom_departement)}
                            sx={{
                              background: '#D1FAE5', color: '#065F46',
                              borderRadius: '8px', width: 34, height: 34,
                              border: '1px solid #86EFAC',
                              '&:hover': { background: '#10B981', color: '#fff', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' },
                            }}
                          >
                            <Unarchive sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog : Confirmer l'archivage (impact + password) ────── */}
      <Dialog
        open={archiveDialog.open}
        onClose={() => !archiveSubmitting && setArchiveDialog({ open: false, type: null, entity: null, impact: null, loading: false })}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', overflow: 'hidden' } }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #FB923C 0%, #D97706 100%)',
          p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Archive sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
              Archiver {archiveDialog.type === 'spec' ? 'la spécialité' : 'le département'}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)' }}>
              {archiveDialog.entity?.nom}
            </Typography>
          </Box>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          {archiveDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} sx={{ color: '#FB923C' }} />
            </Box>
          ) : (
            <>
              {archiveDialog.type === 'dept' ? (
                <Alert severity="warning" sx={{ mb: 2.5, borderRadius: '10px', fontSize: '12.5px' }}>
                  <b>Action en cascade.</b> Archiver ce département entraînera automatiquement
                  l'archivage de <b>toutes ses spécialités actives</b>. Les enseignants et étudiants
                  resteront en base mais ne pourront plus être assignés à de nouvelles inscriptions.
                </Alert>
              ) : (
                <Alert severity="warning" sx={{ mb: 2.5, borderRadius: '10px', fontSize: '12.5px' }}>
                  <b>Confirmation requise.</b> La spécialité sera archivée et ne sera plus visible dans
                  la liste active. Les étudiants déjà inscrits resteront en base mais aucune nouvelle
                  inscription ne sera possible.
                </Alert>
              )}

              {archiveDialog.impact && (
                <Box sx={{ mb: 2.5, p: 2, background: '#FFFBEB', borderRadius: '10px', border: '1.5px solid #FDE68A' }}>
                  <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.6px', mb: 1.2 }}>
                    Impact de cette action
                  </Typography>
                  {archiveDialog.type === 'dept' ? (
                    <>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
                        <Box sx={{ textAlign: 'center', p: 1, background: '#fff', borderRadius: '8px' }}>
                          <Typography sx={{ fontWeight: 900, fontSize: '22px', color: '#D97706' }}>{archiveDialog.impact.nombre_specialites_actives}</Typography>
                          <Typography sx={{ fontSize: '10.5px', color: C.textSoft }}>Spécialités</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center', p: 1, background: '#fff', borderRadius: '8px' }}>
                          <Typography sx={{ fontWeight: 900, fontSize: '22px', color: C.purple }}>{archiveDialog.impact.nombre_enseignants_actifs}</Typography>
                          <Typography sx={{ fontSize: '10.5px', color: C.textSoft }}>Enseignants</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center', p: 1, background: '#fff', borderRadius: '8px' }}>
                          <Typography sx={{ fontWeight: 900, fontSize: '22px', color: C.blue }}>{archiveDialog.impact.nombre_etudiants_inscrits}</Typography>
                          <Typography sx={{ fontSize: '10.5px', color: C.textSoft }}>Étudiants</Typography>
                        </Box>
                      </Box>
                      {archiveDialog.impact.specialites?.length > 0 && (
                        <Box sx={{ mt: 1.2, pt: 1.2, borderTop: '1px dashed #FDE68A' }}>
                          <Typography sx={{ fontSize: '10.5px', fontWeight: 700, color: '#92400E', mb: 0.5 }}>
                            Spécialités qui seront archivées :
                          </Typography>
                          {archiveDialog.impact.specialites.map(s => (
                            <Typography key={s.id_specialite} sx={{ fontSize: '11.5px', color: '#7C2D12', pl: 1 }}>
                              • {s.nom_specialite} ({s.nombre_etudiants} étudiants)
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </>
                  ) : (
                    <>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1 }}>
                        <Box sx={{ textAlign: 'center', p: 1.5, background: '#fff', borderRadius: '8px' }}>
                          <Typography sx={{ fontWeight: 900, fontSize: '26px', color: C.blue }}>{archiveDialog.impact.nombre_etudiants_inscrits}</Typography>
                          <Typography sx={{ fontSize: '10.5px', color: C.textSoft }}>Étudiant(s) inscrit(s) dans cette spécialité</Typography>
                        </Box>
                      </Box>
                      {archiveDialog.impact.specialite && (
                        <Box sx={{ mt: 1.2, pt: 1.2, borderTop: '1px dashed #FDE68A', fontSize: '11.5px', color: '#7C2D12' }}>
                          <div>• Département : <b>{archiveDialog.impact.specialite.nom_departement}</b></div>
                          <div>• Niveau : <b>{archiveDialog.impact.specialite.nom_niveau || '—'}</b></div>
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              )}

              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                placeholder="Raison de l'archivage (optionnel)"
                value={archiveReason}
                onChange={e => setArchiveReason(e.target.value)}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '13px' } }}
              />

              <Typography sx={{ fontSize: '0.82rem', color: '#64748B', mb: 1, fontWeight: 600 }}>
                Mot de passe administrateur
              </Typography>
              <TextField
                fullWidth
                size="small"
                type={showArchivePassword ? 'text' : 'password'}
                placeholder="Entrez votre mot de passe"
                value={archivePassword}
                onChange={e => { setArchivePassword(e.target.value); setArchiveError(''); }}
                onKeyDown={e => e.key === 'Enter' && confirmArchive()}
                disabled={archiveSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ fontSize: 18, color: '#64748B' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowArchivePassword(p => !p)} tabIndex={-1}>
                        {showArchivePassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', '&.Mui-focused fieldset': { borderColor: '#FB923C' } } }}
              />

              {archiveError && (
                <Alert severity="error" sx={{ mt: 1.5, borderRadius: '10px', fontSize: '12.5px' }}>
                  {archiveError}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
          <Button
            fullWidth variant="outlined"
            onClick={() => setArchiveDialog({ open: false, type: null, entity: null, impact: null, loading: false })}
            disabled={archiveSubmitting}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, color: '#64748B', borderColor: '#E2E8F0', '&:hover': { background: '#F8FAFC', borderColor: '#CBD5E1' } }}
          >
            Annuler
          </Button>
          <Button
            fullWidth variant="contained"
            onClick={confirmArchive}
            disabled={archiveSubmitting || !archivePassword}
            sx={{
              borderRadius: '10px', textTransform: 'none', fontWeight: 700,
              background: 'linear-gradient(135deg, #FB923C 0%, #D97706 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #D97706 0%, #FB923C 100%)' },
              '&:disabled': { opacity: 0.5 },
            }}
          >
            {archiveSubmitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : "Confirmer l'archivage"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog : Confirmer la restauration (password + log) ──── */}
      <Dialog
        open={restoreDialog.open}
        onClose={() => !restoreSubmitting && setRestoreDialog({ open: false, type: null, entity: null })}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', overflow: 'hidden' } }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Unarchive sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
              Restaurer {restoreDialog.type === 'spec' ? 'la spécialité' : 'le département'}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)' }}>
              {restoreDialog.entity?.nom}
            </Typography>
          </Box>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 2.5, borderRadius: '10px', fontSize: '12.5px' }}>
            {restoreDialog.type === 'dept'
              ? <>L'élément redeviendra <b>visible et actif</b>. {restoreCascade ? 'Toutes les spécialités archivées de ce département seront aussi restaurées.' : 'Les spécialités archivées resteront archivées.'}</>
              : <>La spécialité redeviendra <b>visible et active</b>. Si son département est archivé, la restauration sera refusée.</>}
          </Alert>

          {restoreDialog.type === 'dept' && (
            <Box sx={{
              mb: 2, p: 1.5, borderRadius: '10px',
              background: restoreCascade ? '#ECFDF5' : '#F8FAFC',
              border: `1.5px solid ${restoreCascade ? '#A7F3D0' : '#E2E8F0'}`,
              display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
            }}
              onClick={() => setRestoreCascade(prev => !prev)}
            >
              <Box sx={{
                width: 22, height: 22, borderRadius: '6px',
                border: `2px solid ${restoreCascade ? '#10B981' : '#CBD5E1'}`,
                background: restoreCascade ? '#10B981' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 900, fontSize: '14px',
              }}>
                {restoreCascade ? '✓' : ''}
              </Box>
              <Typography sx={{ flex: 1, fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>
                Restaurer aussi les spécialités archivées de ce département
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            multiline
            rows={2}
            size="small"
            placeholder="Raison de la restauration (optionnel)"
            value={restoreReason}
            onChange={e => setRestoreReason(e.target.value)}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '13px' } }}
          />

          <Typography sx={{ fontSize: '0.82rem', color: '#64748B', mb: 1, fontWeight: 600 }}>
            Mot de passe administrateur
          </Typography>
          <TextField
            fullWidth
            size="small"
            type={showRestorePassword ? 'text' : 'password'}
            placeholder="Entrez votre mot de passe"
            value={restorePassword}
            onChange={e => { setRestorePassword(e.target.value); setRestoreError(''); }}
            onKeyDown={e => e.key === 'Enter' && confirmRestore()}
            disabled={restoreSubmitting}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ fontSize: 18, color: '#64748B' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowRestorePassword(p => !p)} tabIndex={-1}>
                    {showRestorePassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', '&.Mui-focused fieldset': { borderColor: '#10B981' } } }}
          />

          {restoreError && (
            <Alert severity="error" sx={{ mt: 1.5, borderRadius: '10px', fontSize: '12.5px' }}>
              {restoreError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
          <Button
            fullWidth variant="outlined"
            onClick={() => setRestoreDialog({ open: false, type: null, entity: null })}
            disabled={restoreSubmitting}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, color: '#64748B', borderColor: '#E2E8F0', '&:hover': { background: '#F8FAFC', borderColor: '#CBD5E1' } }}
          >
            Annuler
          </Button>
          <Button
            fullWidth variant="contained"
            onClick={confirmRestore}
            disabled={restoreSubmitting || !restorePassword}
            sx={{
              borderRadius: '10px', textTransform: 'none', fontWeight: 700,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' },
              '&:disabled': { opacity: 0.5 },
            }}
          >
            {restoreSubmitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Confirmer la restauration'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog : Tracing de l'archivage (générique dept/spec) ── */}
      <Dialog
        open={logDialog.open}
        onClose={() => setLogDialog({ open: false, type: null, entity: null })}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', overflow: 'hidden' } }}
      >
        {logDialog.entity && (() => {
          const d = logDialog.entity;
          const isSpec = logDialog.type === 'spec';
          const { os, browser, device } = parseUA(d.user_agent || '');
          const dt = d.log_performed_at || d.archived_at;
          const dateStr = dt ? new Date(dt).toLocaleString('fr-TN', { dateStyle: 'long', timeStyle: 'medium' }) : '—';
          const archivedByName = (d.archived_by_prenom || d.archived_by_nom)
            ? `${d.archived_by_prenom || ''} ${d.archived_by_nom || ''}`.trim()
            : d.archived_by;
          const entityName = isSpec ? d.nom_specialite : d.nom_departement;
          const rows = [
            { icon: '📅',  label: 'Date & heure',       value: dateStr },
            { icon: '👤',  label: 'Archivé par',        value: archivedByName || '—', sub: d.archived_by_email },
            { icon: '🆔',  label: 'Matricule',          value: d.archived_by || '—' },
            { icon: '🌐',  label: 'Adresse IP',         value: d.ip_address || '—' },
            { icon: '💻',  label: 'Système / Appareil', value: `${os} · ${device}` },
            { icon: '🧭',  label: 'Navigateur',         value: browser },
          ];
          if (!isSpec) {
            rows.push({ icon: '📚', label: 'Spécialités cascadées', value: `${d.cascade_count ?? 0} spécialité(s) archivée(s) en cascade` });
          }
          rows.push({ icon: '📝', label: 'Raison', value: d.reason || '— Aucune raison fournie —' });

          return (
            <>
              <Box sx={{
                px: 3, py: 2,
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                borderBottom: '1.5px solid #BFDBFE',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: '12px', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <InfoOutlined sx={{ color: '#fff', fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '15px', color: '#1E3A8A' }}>
                      Détails de l'archivage {isSpec ? '(spécialité)' : '(département)'}
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#1E40AF' }}>
                      {entityName}
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => setLogDialog({ open: false, type: null, entity: null })} sx={{ color: '#1E3A8A' }}>
                  <CloseIcon />
                </IconButton>
              </Box>
              <DialogContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {rows.map((r, i) => (
                    <Box key={i} sx={{
                      display: 'flex', alignItems: 'flex-start', gap: 1.5,
                      p: 1.5, borderRadius: '10px',
                      background: '#FAFBFF', border: '1px solid #E5E7EB',
                    }}>
                      <Box sx={{ fontSize: '1.2rem', flexShrink: 0 }}>{r.icon}</Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '10.5px', fontWeight: 700, color: C.textSoft, textTransform: 'uppercase', letterSpacing: '0.6px', mb: 0.3 }}>
                          {r.label}
                        </Typography>
                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: C.textDark, wordBreak: 'break-word' }}>
                          {r.value}
                        </Typography>
                        {r.sub && (
                          <Typography sx={{ fontSize: '11px', color: C.textSoft, mt: 0.2 }}>{r.sub}</Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                  {d.user_agent && (
                    <Box sx={{ mt: 0.5, p: 1.2, borderRadius: '8px', background: '#F1F5F9', fontSize: '10px', color: C.textSoft, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {d.user_agent}
                    </Box>
                  )}
                </Box>
              </DialogContent>
            </>
          );
        })()}
      </Dialog>

      {/* ── Dialog : Spécialités archivées ─────────────────────── */}
      <Dialog
        open={specArchivesOpen}
        onClose={() => setSpecArchivesOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden' } }}
      >
        <Box sx={{
          px: 3, py: 2,
          background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          borderBottom: '1.5px solid #FDE68A',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: '12px',
              background: '#FDE68A', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Archive sx={{ color: '#D97706', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography sx={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: '16px', color: '#92400E' }}>
                Spécialités archivées
              </Typography>
              <Typography sx={{ fontSize: '11.5px', color: '#A16207' }}>
                {archivedSpecs.length} spécialité{archivedSpecs.length > 1 ? 's' : ''} archivée{archivedSpecs.length > 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setSpecArchivesOpen(false)} sx={{ color: '#92400E' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          {specArchivesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={28} sx={{ color: '#D97706' }} />
            </Box>
          ) : archivedSpecs.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ fontSize: '2.5rem', mb: 1, opacity: 0.4 }}>📦</Typography>
              <Typography sx={{ fontWeight: 700, color: C.textMid, fontSize: '14px' }}>
                Aucune spécialité archivée
              </Typography>
              <Typography sx={{ fontSize: '12px', color: C.textSoft, mt: 0.5 }}>
                Les spécialités archivées apparaîtront ici
              </Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ background: '#FAFBFF' }}>
                  {['Code', 'Spécialité', 'Département', 'Niveau', 'Archivée le', 'Action'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.4px', py: 1.5 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {archivedSpecs.map((spec, i) => (
                  <TableRow key={spec.id_specialite} sx={{ '&:hover': { background: '#FFFBEB' }, borderBottom: i < archivedSpecs.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <TableCell sx={{ py: 2 }}>
                      <Chip label={spec.code_specialite} size="small" sx={{ background: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: '11px', borderRadius: '7px' }} />
                    </TableCell>
                    <TableCell sx={{ py: 2, fontWeight: 600, fontSize: '13px', color: C.textDark }}>
                      {spec.nom_specialite}
                    </TableCell>
                    <TableCell sx={{ py: 2, fontSize: '12px', color: C.textMid }}>
                      {spec.nom_departement || '—'}
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Chip label={spec.niveau || '—'} size="small" sx={{ background: C.purpleL, color: C.purple, fontWeight: 600, fontSize: '11px', height: '22px' }} />
                    </TableCell>
                    <TableCell sx={{ py: 2, fontSize: '11.5px', color: C.textSoft }}>
                      {spec.archived_at ? new Date(spec.archived_at).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', gap: 0.75 }}>
                        <Tooltip title="Voir les détails de l'archivage" arrow>
                          <IconButton
                            size="small"
                            onClick={() => setLogDialog({ open: true, type: 'spec', entity: spec })}
                            sx={{
                              background: '#EFF6FF', color: '#2563EB',
                              borderRadius: '8px', width: 34, height: 34,
                              border: '1px solid #BFDBFE',
                              '&:hover': { background: '#2563EB', color: '#fff', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)' },
                            }}
                          >
                            <InfoOutlined sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Restaurer cette spécialité" arrow>
                          <IconButton
                            size="small"
                            onClick={() => restoreSpec(spec.id_specialite, spec.nom_specialite)}
                            sx={{
                              background: '#D1FAE5', color: '#065F46',
                              borderRadius: '8px', width: 34, height: 34,
                              border: '1px solid #86EFAC',
                              '&:hover': { background: '#10B981', color: '#fff', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' },
                            }}
                          >
                            <Unarchive sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DetailEtablissement;
