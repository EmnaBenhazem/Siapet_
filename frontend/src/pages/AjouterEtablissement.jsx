import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, TextField,
  Select, MenuItem, FormControl, IconButton, Stepper, Step, StepLabel,
  Switch, FormControlLabel, keyframes,
} from '@mui/material';
import api from '../services/api';

const C = {
  navy: '#0c1e3e', blue: '#1e6ef5', blueL: '#e8f0fe',
  green: '#10b981', greenL: '#d1fae5',
  red: '#ef4444', redL: '#fee2e2',
  amber: '#f59e0b', amberL: '#fef3c7',
  purple: '#7c3aed', purpleL: '#ede9fe',
  bg: '#f4f6fb', border: '#e2e8f0', border2: '#cbd5e1',
  textDark: '#0f172a', textMid: '#475569', textSoft: '#94a3b8',
};

const fadeUp = keyframes`
  from { opacity:0; transform:translateY(10px); }
  to { opacity:1; transform:translateY(0); }
`;

const AjouterEtablissement = () => {
  const navigate = useNavigate();
  const { id: idFromRoute } = useParams();
  const [activeStep, setActiveStep] = useState(1);
  const [universites, setUniversites] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    code_etablissement: '',
    nom_etablissement: '',
    type: '',
    id_rectorat: '',
    id_ville: '',
    telephone: '',
    email: '',
    annee_creation: '',
    effectif_total: 0,
    capacite_maximale: 0,
    nb_enseignants: 0,
    visible: true,
    inscriptions_en_ligne: false,
    notifications: true,
  });

  const [departements, setDepartements] = useState([
    { nom: '', code: '', chef: '', icon: '🏢' },
    { nom: '', code: '', chef: '', icon: '🔬' },
    { nom: '', code: '', chef: '', icon: '💡' },
  ]);

  const [specialites, setSpecialites] = useState([
    { nom: '', code: '', departement: '', niveau: '', icon: '🎯' },
    { nom: '', code: '', departement: '', niveau: '', icon: '📐' },
  ]);

  const [niveaux, setNiveaux] = useState([
    { niveau: '', code: '', capacite: '', duree: '', icon: '📖' },
    { niveau: '', code: '', capacite: '', duree: '', icon: '📗' },
  ]);

  const steps = ['Informations', 'Structure', 'Capacité', 'Confirmation'];

  useEffect(() => {
    fetchUniversites();

    // Edit mode: route param (/modifier/:id) ou query string (?edit=)
    const urlParams = new URLSearchParams(window.location.search);
    const queryEditId = urlParams.get('edit');
    const effectiveId = idFromRoute || queryEditId;
    if (effectiveId) {
      setIsEditMode(true);
      setEditId(effectiveId);
      fetchEtablissement(effectiveId);
    }
  }, [idFromRoute]);

  const fetchEtablissement = async (id) => {
    try {
      const response = await api.get(`/etablissements/${id}`);
      if (response.data.success) {
        const etab = response.data.etablissement;
        setFormData({
          code_etablissement: etab.code_etablissement || '',
          nom_etablissement: etab.nom_etablissement || '',
          type: etab.type || '',
          id_rectorat: etab.id_rectorat || '',
          id_ville: etab.id_ville || '',
          telephone: etab.telephone || '',
          email: etab.email || '',
          annee_creation: etab.annee_creation || (etab.date_creation ? new Date(etab.date_creation).getFullYear() : ''),
          effectif_total: etab.effectif_total || 0,
          capacite_maximale: etab.capacite_maximale || 0,
          nb_enseignants: etab.nb_enseignants || etab.nombre_enseignants || 0,
          visible: etab.visible !== false,
          inscriptions_en_ligne: etab.inscriptions_en_ligne || false,
          notifications: etab.notifications !== false,
        });

        // Charger les départements depuis l'API
        try {
          const deptResp = await api.get(`/etablissements/${id}/departements`);
          if (deptResp.data.success && deptResp.data.departements?.length) {
            const icons = ['🏢','🔬','💡','⚙️','🖥️','🧪','📐','🌍'];
            setDepartements(deptResp.data.departements.map((d, i) => ({
              nom: d.nom_departement || '',
              code: d.code_departement || '',
              chef: d.chef_departement || d.chef || '',
              icon: icons[i % icons.length],
            })));
          }
        } catch (_) { /* optional */ }

        // Charger les spécialités
        try {
          const specResp = await api.get(`/etablissements/${id}/specialites`);
          if (specResp.data.success && specResp.data.specialites?.length) {
            const icons = ['🎯','📐','🔭','💻','⚡','🏗️','🌿','📡'];
            setSpecialites(specResp.data.specialites.map((s, i) => ({
              nom: s.nom_specialite || '',
              code: s.code_specialite || '',
              departement: s.nom_departement || '',
              niveau: s.nom_niveau || s.type_niveau || '',
              icon: icons[i % icons.length],
            })));
          }
        } catch (_) { /* optional */ }
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du chargement des données');
    }
  };

  const fetchUniversites = async () => {
    try {
      const response = await api.get('/etablissements/universites');
      if (response.data.success) {
        setUniversites(response.data.data);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name) => (e) => {
    setFormData(prev => ({ ...prev, [name]: e.target.checked }));
  };

  const addDepartement = () => {
    const icons = ['🏢','🔬','💡','⚙️','🖥️','🧪','📐','🌍'];
    setDepartements([...departements, {
      nom: '', code: '', chef: '',
      icon: icons[departements.length % icons.length]
    }]);
  };

  const removeDepartement = (index) => {
    setDepartements(departements.filter((_, i) => i !== index));
  };

  const updateDepartement = (index, field, value) => {
    const updated = [...departements];
    updated[index][field] = value;
    setDepartements(updated);
  };

  const addSpecialite = () => {
    const icons = ['🎯','📐','🔭','💻','⚡','🏗️','🌿','📡'];
    setSpecialites([...specialites, {
      nom: '', code: '', departement: '', niveau: '',
      icon: icons[specialites.length % icons.length]
    }]);
  };

  const removeSpecialite = (index) => {
    setSpecialites(specialites.filter((_, i) => i !== index));
  };

  const updateSpecialite = (index, field, value) => {
    const updated = [...specialites];
    updated[index][field] = value;
    setSpecialites(updated);
  };

  const addNiveau = () => {
    const icons = ['📖','📗','🎓','🏅','🔬'];
    setNiveaux([...niveaux, {
      niveau: '', code: '', capacite: '', duree: '',
      icon: icons[niveaux.length % icons.length]
    }]);
  };

  const removeNiveau = (index) => {
    setNiveaux(niveaux.filter((_, i) => i !== index));
  };

  const updateNiveau = (index, field, value) => {
    const updated = [...niveaux];
    updated[index][field] = value;
    setNiveaux(updated);
  };

  const handleSubmit = async () => {
    if (isEditMode && !adminPassword.trim()) {
      setPasswordError('Le mot de passe administrateur est requis pour modifier un établissement.');
      return;
    }
    setPasswordError('');
    try {
      const payload = { ...formData, departements, specialites, niveaux };
      if (isEditMode && editId) {
        await api.put(`/etablissements/${editId}`, { ...payload, adminPassword });
      } else {
        await api.post('/etablissements', payload);
      }
      navigate('/dashboard/admin/etablissements');
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  return (
    <Box sx={{ animation: `${fadeUp} 0.35s ease both`, pb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: '14px',
            background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
            border: '1.5px solid #bfdbfe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px',
          }}>
            {isEditMode ? '✏️' : '➕'}
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '12.5px', color: C.textSoft, mb: 0.3 }}>
              <Typography onClick={() => navigate('/dashboard/admin/etablissements')} sx={{ color: C.blue, fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                Établissements
              </Typography>
              <span>›</span>
              <span>{isEditMode ? 'Modification' : 'Nouvel établissement'}</span>
            </Box>
            <Typography sx={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: '22px', color: C.navy }}>
              {isEditMode ? 'Modifier l\'établissement' : 'Ajouter un établissement'}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<span>✕</span>}
          onClick={() => navigate('/dashboard/admin/etablissements')}
          sx={{
            borderColor: C.border, color: C.textMid, textTransform: 'none',
            fontWeight: 600, fontSize: '13px', borderRadius: '11px',
            '&:hover': { borderColor: C.border2 }
          }}
        >
          Annuler
        </Button>
      </Box>

      {/* Steps */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {steps.map((label, index) => (
            <React.Fragment key={index}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flex: index < steps.length - 1 ? 1 : 'none' }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700,
                  border: '2px solid',
                  borderColor: index < activeStep ? C.green : index === activeStep ? C.blue : C.border,
                  background: index < activeStep ? C.green : index === activeStep ? C.blue : '#fff',
                  color: index <= activeStep ? '#fff' : C.textSoft,
                  boxShadow: index === activeStep ? '0 0 0 4px rgba(30,110,245,0.15)' : 'none',
                  transition: 'all 0.2s',
                }}>
                  {index < activeStep ? '✓' : index + 1}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: index <= activeStep ? (index < activeStep ? C.green : C.blue) : C.textSoft }}>
                    Étape {index + 1}
                  </Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: index === activeStep ? C.textDark : C.textMid }}>
                    {label}
                  </Typography>
                </Box>
              </Box>
              {index < steps.length - 1 && (
                <Box sx={{
                  flex: 1, height: '2px', borderRadius: '2px',
                  background: index < activeStep ? C.green : C.border,
                  mx: 1,
                }} />
              )}
            </React.Fragment>
          ))}
        </Box>
      </Box>

      {/* Card 1 - Informations générales */}
      {activeStep === 1 && (
      <Card sx={{ borderRadius: '18px', border: '1.5px solid ' + C.border, boxShadow: '0 1px 3px rgba(15,23,42,0.06)', mb: 2 }}>
        <Box sx={{ p: '16px 22px', borderBottom: '1px solid ' + C.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.125 }}>
            <Box sx={{ width: 30, height: 30, borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
              📋
            </Box>
            <Typography sx={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: '14px', color: C.textDark }}>
              Informations générales
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '12px', color: C.textSoft }}>
            <Box component="span" sx={{ color: C.red }}>*</Box> Champs obligatoires
          </Typography>
        </Box>
        <CardContent sx={{ p: '20px 22px' }}>
          {/* Identification */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: C.textSoft, textTransform: 'uppercase', letterSpacing: '1.2px', mb: 2, display: 'flex', alignItems: 'center', gap: 1.25, '&::after': { content: '""', flex: 1, height: '1px', background: C.border } }}>
              Identification
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.75, mb: 1.75 }}>
              <Box>
                <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: C.textMid, mb: 0.625 }}>
                  Code officiel <Box component="span" sx={{ color: C.red }}>*</Box>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  name="code_etablissement"
                  value={formData.code_etablissement}
                  onChange={handleInputChange}
                  placeholder="ex : ENIM"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px', background: '#fafbff', fontSize: '13.5px',
                      '& fieldset': { borderColor: C.border, borderWidth: '1.5px' },
                      '&:hover fieldset': { borderColor: C.border2 },
                      '&.Mui-focused fieldset': { borderColor: C.blue, borderWidth: '1.5px' },
                    }
                  }}
                />
                <Typography sx={{ fontSize: '11.5px', color: C.textSoft, mt: 0.5 }}>
                  Code unique, 10 caractères max
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: C.textMid, mb: 0.625 }}>
                  Type <Box component="span" sx={{ color: C.red }}>*</Box>
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    displayEmpty
                    sx={{
                      borderRadius: '10px', background: '#fafbff', fontSize: '13.5px',
                      '& fieldset': { borderColor: C.border, borderWidth: '1.5px' },
                      '&:hover fieldset': { borderColor: C.border2 },
                      '&.Mui-focused fieldset': { borderColor: C.blue, borderWidth: '1.5px' },
                    }}
                  >
                    <MenuItem value="">Sélectionner…</MenuItem>
                    <MenuItem value="ECOLE">École</MenuItem>
                    <MenuItem value="FACULTE">Faculté</MenuItem>
                    <MenuItem value="INSTITUT">Institut</MenuItem>
                    <MenuItem value="ISET">ISET</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <Box sx={{ mb: 1.75 }}>
              <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: C.textMid, mb: 0.625 }}>
                Intitulé complet <Box component="span" sx={{ color: C.red }}>*</Box>
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="nom_etablissement"
                value={formData.nom_etablissement}
                onChange={handleInputChange}
                placeholder="Nom officiel de l'établissement…"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px', background: '#fafbff', fontSize: '13.5px',
                    '& fieldset': { borderColor: C.border, borderWidth: '1.5px' },
                    '&:hover fieldset': { borderColor: C.border2 },
                    '&.Mui-focused fieldset': { borderColor: C.blue, borderWidth: '1.5px' },
                  }
                }}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.75 }}>
              <Box>
                <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: C.textMid, mb: 0.625 }}>
                  Université <Box component="span" sx={{ color: C.red }}>*</Box>
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    name="id_rectorat"
                    value={formData.id_rectorat}
                    onChange={handleInputChange}
                    displayEmpty
                    sx={{
                      borderRadius: '10px', background: '#fafbff', fontSize: '13.5px',
                      '& fieldset': { borderColor: C.border, borderWidth: '1.5px' },
                    }}
                  >
                    <MenuItem value="">Choisir…</MenuItem>
                    {universites.map(u => (
                      <MenuItem key={u.id} value={u.id}>{u.nom_etablissement}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: C.textMid, mb: 0.625 }}>
                  Ville <Box component="span" sx={{ color: C.red }}>*</Box>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  name="id_ville"
                  value={formData.id_ville}
                  onChange={handleInputChange}
                  placeholder="Ville"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px', background: '#fafbff', fontSize: '13.5px',
                      '& fieldset': { borderColor: C.border, borderWidth: '1.5px' },
                    }
                  }}
                />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: C.textMid, mb: 0.625 }}>
                  Année de création
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  name="annee_creation"
                  value={formData.annee_creation}
                  onChange={handleInputChange}
                  placeholder="ex : 1990"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px', background: '#fafbff', fontSize: '13.5px',
                      '& fieldset': { borderColor: C.border, borderWidth: '1.5px' },
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
      )}

      {/* Card 2 - Départements */}
      {activeStep === 2 && (
      <Card sx={{ borderRadius: '18px', border: '1.5px solid ' + C.border, boxShadow: '0 1px 3px rgba(15,23,42,0.06)', mb: 2 }}>
        <Box sx={{ p: '16px 22px', borderBottom: '1px solid ' + C.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.125 }}>
            <Box sx={{ width: 30, height: 30, borderRadius: '8px', background: C.blueL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
              🏢
            </Box>
            <Typography sx={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: '14px', color: C.textDark }}>
              Départements
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '12px', color: C.textSoft }}>
            Organisez les départements de l'établissement
          </Typography>
        </Box>
        <CardContent sx={{ p: '20px 22px' }}>
          {departements.map((dept, index) => (
            <Box key={index} sx={{
              display: 'flex', alignItems: 'center', gap: 1.25,
              background: '#fafbff', border: '1.5px solid ' + C.border, borderRadius: '12px',
              p: '12px 14px', mb: 1, transition: 'all 0.18s',
              '&:hover': { borderColor: '#c7d8f8', background: '#f5f8ff' }
            }}>
              <Box sx={{ color: C.textSoft, cursor: 'grab', fontSize: '14px' }}>⠿</Box>
              <Box sx={{ width: 32, height: 32, borderRadius: '9px', background: C.blueL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                {dept.icon}
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.25, flex: 1 }}>
                <TextField
                  size="small"
                  value={dept.nom}
                  onChange={(e) => updateDepartement(index, 'nom', e.target.value)}
                  placeholder="Nom du département"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '9px', background: '#fff', fontSize: '13px',
                      '& fieldset': { borderColor: C.border, borderWidth: '1.5px' },
                      '&:hover fieldset': { borderColor: C.border2 },
                      '&.Mui-focused fieldset': { borderColor: C.blue },
                    }
                  }}
                />
                <TextField
                  size="small"
                  value={dept.code}
                  onChange={(e) => updateDepartement(index, 'code', e.target.value)}
                  placeholder="Code (ex: GC)"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '9px', background: '#fff', fontSize: '13px',
                      '& fieldset': { borderColor: C.border, borderWidth: '1.5px' },
                    }
                  }}
                />
                <TextField
                  size="small"
                  value={dept.chef}
                  onChange={(e) => updateDepartement(index, 'chef', e.target.value)}
                  placeholder="Chef de département"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '9px', background: '#fff', fontSize: '13px',
                      '& fieldset': { borderColor: C.border, borderWidth: '1.5px' },
                    }
                  }}
                />
              </Box>
              <IconButton
                size="small"
                onClick={() => removeDepartement(index)}
                sx={{
                  width: 28, height: 28, borderRadius: '8px',
                  border: '1.5px solid #fecaca', background: C.redL, color: C.red,
                  '&:hover': { background: '#fecaca', transform: 'scale(1.1)' }
                }}
              >
                <span style={{ fontSize: '12px' }}>✕</span>
              </IconButton>
            </Box>
          ))}
          <Button
            fullWidth
            onClick={addDepartement}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.875,
              p: '10px 14px', border: '2px dashed ' + C.border, borderRadius: '11px',
              background: 'none', fontSize: '13px', fontWeight: 600, color: C.textSoft,
              textTransform: 'none',
              '&:hover': { borderColor: C.blue, color: C.blue, background: C.blueL }
            }}
          >
            ＋ Ajouter un département
          </Button>
        </CardContent>
      </Card>
      )}

      {/* Card 3 - Spécialités */}
      {activeStep === 2 && (
      <Card sx={{ borderRadius: '18px', border: '1.5px solid ' + C.border, boxShadow: '0 1px 3px rgba(15,23,42,0.06)', mb: 2 }}>
        <Box sx={{ p: '16px 22px', borderBottom: '1px solid ' + C.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.125 }}>
            <Box sx={{ width: 30, height: 30, borderRadius: '8px', background: C.purpleL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
              🎯
            </Box>
            <Typography sx={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: '14px', color: C.textDark }}>
              Spécialités
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '12px', color: C.textSoft }}>
            Rattachez les spécialités aux départements
          </Typography>
        </Box>
        <CardContent sx={{ p: '20px 22px' }}>
          {specialites.map((spec, index) => (
            <Box key={index} sx={{
              display: 'flex', alignItems: 'center', gap: 1.25,
              background: '#fafbff', border: '1.5px solid ' + C.border, borderRadius: '12px',
              p: '12px 14px', mb: 1, transition: 'all 0.18s',
              '&:hover': { borderColor: '#c7d8f8', background: '#f5f8ff' }
            }}>
              <Box sx={{ color: C.textSoft, cursor: 'grab', fontSize: '14px' }}>⠿</Box>
              <Box sx={{ width: 32, height: 32, borderRadius: '9px', background: C.purpleL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                {spec.icon}
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 1.25, flex: 1 }}>
                <TextField
                  size="small"
                  value={spec.nom}
                  onChange={(e) => updateSpecialite(index, 'nom', e.target.value)}
                  placeholder="Intitulé de la spécialité"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '9px', background: '#fff', fontSize: '13px',
                      '& fieldset': { borderColor: C.border, borderWidth: '1.5px' },
                    }
                  }}
                />
                <TextField
                  size="small"
                  value={spec.code}
                  onChange={(e) => updateSpecialite(index, 'code', e.target.value)}
                  placeholder="Code (ex: GC-STR)"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '9px', background: '#fff', fontSize: '13px',
                      '& fieldset': { borderColor: C.border, borderWidth: '1.5px' },
                    }
                  }}
                />
                <FormControl size="small">
                  <Select
                    value={spec.departement}
                    onChange={(e) => updateSpecialite(index, 'departement', e.target.value)}
                    displayEmpty
                    sx={{
                      borderRadius: '9px', background: '#fff', fontSize: '13px',
                      '& fieldset': { borderColor: C.border, borderWidth: '1.5px' },
                    }}
                  >
                    <MenuItem value="">— Département —</MenuItem>
                    {departements.filter(d => d.nom).map((d, i) => (
                      <MenuItem key={i} value={d.nom}>{d.nom}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small">
                  <Select
                    value={spec.niveau}
                    onChange={(e) => updateSpecialite(index, 'niveau', e.target.value)}
                    displayEmpty
                    sx={{
                      borderRadius: '9px', background: '#fff', fontSize: '13px',
                      '& fieldset': { borderColor: C.border, borderWidth: '1.5px' },
                    }}
                  >
                    <MenuItem value="">— Niveau —</MenuItem>
                    <MenuItem value="Licence">Licence</MenuItem>
                    <MenuItem value="Ingénieur">Ingénieur</MenuItem>
                    <MenuItem value="Master">Master</MenuItem>
                    <MenuItem value="Doctorat">Doctorat</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <IconButton
                size="small"
                onClick={() => removeSpecialite(index)}
                sx={{
                  width: 28, height: 28, borderRadius: '8px',
                  border: '1.5px solid #fecaca', background: C.redL, color: C.red,
                  '&:hover': { background: '#fecaca', transform: 'scale(1.1)' }
                }}
              >
                <span style={{ fontSize: '12px' }}>✕</span>
              </IconButton>
            </Box>
          ))}
          <Button
            fullWidth
            onClick={addSpecialite}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.875,
              p: '10px 14px', border: '2px dashed ' + C.border, borderRadius: '11px',
              background: 'none', fontSize: '13px', fontWeight: 600, color: C.textSoft,
              textTransform: 'none',
              '&:hover': { borderColor: C.blue, color: C.blue, background: C.blueL }
            }}
          >
            ＋ Ajouter une spécialité
          </Button>
        </CardContent>
      </Card>
      )}

      {/* Card 4 - Niveaux */}
      {activeStep === 3 && (
      <Card sx={{ borderRadius: '18px', border: '1.5px solid ' + C.border, boxShadow: '0 1px 3px rgba(15,23,42,0.06)', mb: 2 }}>
        <Box sx={{ p: '16px 22px', borderBottom: '1px solid ' + C.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.125 }}>
            <Box sx={{ width: 30, height: 30, borderRadius: '8px', background: C.greenL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
              📚
            </Box>
            <Typography sx={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: '14px', color: C.textDark }}>
              Niveaux d'études
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '12px', color: C.textSoft }}>
            Définissez les niveaux proposés
          </Typography>
        </Box>
        <CardContent sx={{ p: '20px 22px' }}>
          {niveaux.map((niv, index) => (
            <Box key={index} sx={{
              display: 'flex', alignItems: 'center', gap: 1.25,
              background: '#fafbff', border: '1.5px solid ' + C.border, borderRadius: '12px',
              p: '12px 14px', mb: 1, transition: 'all 0.18s',
              '&:hover': { borderColor: '#c7d8f8', background: '#f5f8ff' }
            }}>
              <Box sx={{ color: C.textSoft, cursor: 'grab', fontSize: '14px' }}>⠿</Box>
              <Box sx={{ width: 32, height: 32, borderRadius: '9px', background: ['#1e6ef518','#10b98118','#7c3aed18','#f59e0b18','#ef444418'][index % 5], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                {niv.icon}
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 1.25, flex: 1 }}>
                <FormControl size="small">
                  <Select
                    value={niv.niveau}
                    onChange={(e) => updateNiveau(index, 'niveau', e.target.value)}
                    displayEmpty
                    sx={{
                      borderRadius: '9px', background: '#fff', fontSize: '13px',
                      '& fieldset': { borderColor: C.border, borderWidth: '1.5px' },
                    }}
                  >
                    <MenuItem value="">— Niveau —</MenuItem>
                    <MenuItem value="Licence 1">Licence 1</MenuItem>
                    <MenuItem value="Licence 2">Licence 2</MenuItem>
                    <MenuItem value="Licence 3">Licence 3</MenuItem>
                    <MenuItem value="Ingénieur">Ingénieur</MenuItem>
                    <MenuItem value="Master 1">Master 1</MenuItem>
                    <MenuItem value="Master 2">Master 2</MenuItem>
                    <MenuItem value="Doctorat">Doctorat</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  value={niv.code}
                  onChange={(e) => updateNiveau(index, 'code', e.target.value)}
                  placeholder="Code (ex: L1, ING)"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '9px', background: '#fff', fontSize: '13px',
                      '& fieldset': { borderColor: C.border, borderWidth: '1.5px' },
                    }
                  }}
                />
                <TextField
                  size="small"
                  type="number"
                  value={niv.capacite}
                  onChange={(e) => updateNiveau(index, 'capacite', e.target.value)}
                  placeholder="Capacité max"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '9px', background: '#fff', fontSize: '13px',
                      '& fieldset': { borderColor: C.border, borderWidth: '1.5px' },
                    }
                  }}
                />
                <TextField
                  size="small"
                  value={niv.duree}
                  onChange={(e) => updateNiveau(index, 'duree', e.target.value)}
                  placeholder="Durée (ex: 1 an)"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '9px', background: '#fff', fontSize: '13px',
                      '& fieldset': { borderColor: C.border, borderWidth: '1.5px' },
                    }
                  }}
                />
              </Box>
              <IconButton
                size="small"
                onClick={() => removeNiveau(index)}
                sx={{
                  width: 28, height: 28, borderRadius: '8px',
                  border: '1.5px solid #fecaca', background: C.redL, color: C.red,
                  '&:hover': { background: '#fecaca', transform: 'scale(1.1)' }
                }}
              >
                <span style={{ fontSize: '12px' }}>✕</span>
              </IconButton>
            </Box>
          ))}
          <Button
            fullWidth
            onClick={addNiveau}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.875,
              p: '10px 14px', border: '2px dashed ' + C.border, borderRadius: '11px',
              background: 'none', fontSize: '13px', fontWeight: 600, color: C.textSoft,
              textTransform: 'none',
              '&:hover': { borderColor: C.blue, color: C.blue, background: C.blueL }
            }}
          >
            ＋ Ajouter un niveau
          </Button>
        </CardContent>
      </Card>
      )}

      {/* Card 5 - Capacité & Options */}
      {activeStep === 3 && (
      <Card sx={{ borderRadius: '18px', border: '1.5px solid ' + C.border, boxShadow: '0 1px 3px rgba(15,23,42,0.06)', mb: 2 }}>
        <Box sx={{ p: '16px 22px', borderBottom: '1px solid ' + C.border }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.125 }}>
            <Box sx={{ width: 30, height: 30, borderRadius: '8px', background: C.amberL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
              📊
            </Box>
            <Typography sx={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: '14px', color: C.textDark }}>
              Capacité & Options
            </Typography>
          </Box>
        </Box>
        <CardContent sx={{ p: '20px 22px' }}>
          {/* Capacité */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: C.textSoft, textTransform: 'uppercase', letterSpacing: '1.2px', mb: 2, display: 'flex', alignItems: 'center', gap: 1.25, '&::after': { content: '""', flex: 1, height: '1px', background: C.border } }}>
              Capacité
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.75 }}>
              <Box>
                <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: C.textMid, mb: 0.625 }}>
                  Effectif actuel <Box component="span" sx={{ color: C.red }}>*</Box>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  name="effectif_total"
                  value={formData.effectif_total}
                  onChange={handleInputChange}
                  placeholder="0"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px', background: '#fafbff', fontSize: '13.5px',
                      '& fieldset': { borderColor: C.border, borderWidth: '1.5px' },
                    }
                  }}
                />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: C.textMid, mb: 0.625 }}>
                  Capacité maximale <Box component="span" sx={{ color: C.red }}>*</Box>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  name="capacite_maximale"
                  value={formData.capacite_maximale}
                  onChange={handleInputChange}
                  placeholder="0"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px', background: '#fafbff', fontSize: '13.5px',
                      '& fieldset': { borderColor: C.border, borderWidth: '1.5px' },
                    }
                  }}
                />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: C.textMid, mb: 0.625 }}>
                  Nb. enseignants
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  name="nb_enseignants"
                  value={formData.nb_enseignants}
                  onChange={handleInputChange}
                  placeholder="0"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px', background: '#fafbff', fontSize: '13.5px',
                      '& fieldset': { borderColor: C.border, borderWidth: '1.5px' },
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Options */}
          <Box>
            <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: C.textSoft, textTransform: 'uppercase', letterSpacing: '1.2px', mb: 2, display: 'flex', alignItems: 'center', gap: 1.25, '&::after': { content: '""', flex: 1, height: '1px', background: C.border } }}>
              Options
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { name: 'visible', label: 'Visible dans la liste publique', sub: 'Apparaît dans les recherches', checked: formData.visible },
                { name: 'inscriptions_en_ligne', label: 'Inscriptions en ligne', sub: 'Activer le portail d\'inscription', checked: formData.inscriptions_en_ligne },
                { name: 'notifications', label: 'Notifications automatiques', sub: 'Alertes sur les changements de statut', checked: formData.notifications },
              ].map((opt, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.625, borderBottom: i < 2 ? '1px solid #f8fafc' : 'none' }}>
                  <Box>
                    <Typography sx={{ fontSize: '13.5px', fontWeight: 600, color: C.textDark }}>
                      {opt.label}
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: C.textSoft, mt: 0.25 }}>
                      {opt.sub}
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={opt.checked}
                        onChange={handleSwitchChange(opt.name)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: C.blue },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: C.blue },
                        }}
                      />
                    }
                    label=""
                    sx={{ m: 0 }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>
      )}

      {/* Card 6 - Confirmation */}
      {activeStep === 4 && (
      <Card sx={{ borderRadius: '18px', border: '1.5px solid ' + C.border, boxShadow: '0 1px 3px rgba(15,23,42,0.06)', mb: 2 }}>
        <Box sx={{ p: '16px 22px', borderBottom: '1px solid ' + C.border }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.125 }}>
            <Box sx={{ width: 30, height: 30, borderRadius: '8px', background: C.greenL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
              ✓
            </Box>
            <Typography sx={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: '14px', color: C.textDark }}>
              Confirmation
            </Typography>
          </Box>
        </Box>
        <CardContent sx={{ p: '20px 22px' }}>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Box sx={{ fontSize: '48px', mb: 2 }}>{isEditMode ? '💾' : '✅'}</Box>
            <Typography sx={{ fontSize: '18px', fontWeight: 700, color: C.textDark, mb: 1 }}>
              {isEditMode ? 'Prêt à enregistrer les modifications' : 'Prêt à enregistrer'}
            </Typography>
            <Typography sx={{ fontSize: '13px', color: C.textSoft }}>
              Vérifiez les informations et cliquez sur "{isEditMode ? 'Mettre à jour' : 'Enregistrer'}" pour finaliser
            </Typography>
          </Box>

          {isEditMode && (
            <Box sx={{
              mt: 1, p: '18px 20px',
              background: '#fffbeb', border: '1.5px solid #fcd34d',
              borderRadius: '14px',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: '8px', background: C.amberL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                  🔒
                </Box>
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: C.amber }}>
                  Confirmation administrateur requise
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '12px', color: '#92400e', mb: 1.5 }}>
                Entrez votre mot de passe pour autoriser cette modification.
              </Typography>
              <Box sx={{ position: 'relative' }}>
                <TextField
                  fullWidth
                  size="small"
                  type={showPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => { setAdminPassword(e.target.value); setPasswordError(''); }}
                  placeholder="Mot de passe administrateur"
                  error={!!passwordError}
                  helperText={passwordError}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword(v => !v)}
                        sx={{ color: C.textSoft }}
                      >
                        <span style={{ fontSize: '14px' }}>{showPassword ? '🙈' : '👁'}</span>
                      </IconButton>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px', background: '#fff', fontSize: '13.5px',
                      '& fieldset': { borderColor: passwordError ? C.red : '#fcd34d', borderWidth: '1.5px' },
                      '&:hover fieldset': { borderColor: C.amber },
                      '&.Mui-focused fieldset': { borderColor: C.amber, borderWidth: '1.5px' },
                    },
                    '& .MuiFormHelperText-root': { color: C.red, fontWeight: 600 },
                  }}
                />
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
      )}

      {/* Footer */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '16px 22px', background: '#fff', borderRadius: '18px', border: '1.5px solid ' + C.border, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
        <Typography sx={{ fontSize: '12px', color: C.textSoft }}>
          Étape {activeStep} sur 4 — {steps[activeStep - 1]}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.25 }}>
          {activeStep > 1 && (
            <Button
              variant="outlined"
              startIcon={<span>‹</span>}
              onClick={() => setActiveStep(activeStep - 1)}
              sx={{
                borderColor: C.border, color: C.textMid, textTransform: 'none',
                fontWeight: 600, fontSize: '13px', borderRadius: '11px',
                '&:hover': { borderColor: C.border2 }
              }}
            >
              Précédent
            </Button>
          )}
          {activeStep < 4 ? (
            <Button
              variant="contained"
              endIcon={<span>›</span>}
              onClick={() => setActiveStep(activeStep + 1)}
              sx={{
                background: C.blue, textTransform: 'none', fontWeight: 600,
                fontSize: '13px', borderRadius: '11px',
                boxShadow: '0 4px 14px rgba(30,110,245,0.3)',
                '&:hover': { background: '#1558cc' }
              }}
            >
              Suivant
            </Button>
          ) : (
            <Button
              variant="contained"
              endIcon={<span>✓</span>}
              onClick={handleSubmit}
              sx={{
                background: C.green, textTransform: 'none', fontWeight: 600,
                fontSize: '13px', borderRadius: '11px',
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                '&:hover': { background: '#059669' }
              }}
            >
              {isEditMode ? 'Mettre à jour' : 'Enregistrer'}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AjouterEtablissement;
