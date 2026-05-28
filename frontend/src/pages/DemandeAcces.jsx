import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, TextField, Button,
  Grid, Alert, CircularProgress,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { keyframes } from '@mui/material';
import axios from 'axios';
import config from '../config';

// ── PALETTE ───────────────────────────────────────
const C = {
  navy:    '#1A3A6B',
  navyD:   '#0F2549',
  blue:    '#4D9FFF',
  blueB:   '#85BFFF',
  blueL:   '#EAF4FF',
  blueD:   '#1A6FD4',
  green:   '#06D6A0',
  greenD:  '#04B884',
  greenDD: '#065F46',
  coral:   '#D85A30',
  coralL:  '#F0997B',
  coralD:  '#993C1D',
  orange:  '#FF6B35',
  purple:  '#7B2CBF',
  muted:   '#8A9BB0',
  bg:      '#F4F8FF',
};

// ── KEYFRAMES ─────────────────────────────────────
const fadeUp = keyframes`
  from { opacity:0; transform:translateY(24px); }
  to   { opacity:1; transform:translateY(0); }
`;
const popIn = keyframes`
  from { opacity:0; transform:scale(0.85) translateY(10px); }
  to   { opacity:1; transform:scale(1) translateY(0); }
`;
const floatY = keyframes`
  0%,100% { transform:translateY(0); }
  50%      { transform:translateY(-10px); }
`;
const spinCW = keyframes`
  from { transform:rotate(0deg); }
  to   { transform:rotate(360deg); }
`;
const blinkDot = keyframes`
  0%,100% { opacity:1; } 50% { opacity:0.2; }
`;
const gradMove = keyframes`
  0%,100% { background-position:0% 50%; }
  50%      { background-position:100% 50%; }
`;
const shimmerLine = keyframes`
  0%   { background-position:-200% center; }
  100% { background-position: 200% center; }
`;
const shimmerCoral = keyframes`
  0%   { background-position:-200% center; }
  100% { background-position: 200% center; }
`;
const glowGreen = keyframes`
  0%,100% { box-shadow:0 6px 22px rgba(6,214,160,0.30); }
  50%      { box-shadow:0 10px 36px rgba(6,214,160,0.58), 0 0 0 4px rgba(6,214,160,0.08); }
`;
const glowBlue = keyframes`
  0%,100% { box-shadow:0 6px 22px rgba(77,159,255,0.30); }
  50%      { box-shadow:0 10px 36px rgba(77,159,255,0.58), 0 0 0 4px rgba(77,159,255,0.08); }
`;
const floatEmoji = keyframes`
  0%,100% { transform:translateY(0) rotate(0deg); }
  50%      { transform:translateY(-5px) rotate(7deg); }
`;
const slideArrow = keyframes`
  0%,100% { transform:translateX(0); }
  50%      { transform:translateX(6px); }
`;
const pulse = keyframes`
  0%,100% { box-shadow:0 0 0 0 rgba(6,214,160,0.38); }
  50%      { box-shadow:0 0 0 12px rgba(6,214,160,0); }
`;
const bounceDot = keyframes`
  0%,80%,100% { transform:translateY(0); }
  40%          { transform:translateY(-6px); }
`;

// ── ROLE CONFIG ───────────────────────────────────
const ROLE_CONFIG = {
  etudiant:   { label: 'Étudiant',    emoji: '👨‍🎓', color: C.green,  desc: 'Suivi académique & résultats'  },
  enseignant: { label: 'Enseignant',  emoji: '👨‍🏫', color: C.blue,   desc: 'Cours, étudiants & plannings'  },
  directeur:  { label: 'Directeur',   emoji: '👨‍💼', color: C.purple, desc: 'Pilotage établissement'         },
  recteur:    { label: 'Recteur',     emoji: '👨‍💼', color: C.coral,  desc: 'Supervision université'         },
};

// ── FIELD STYLE ───────────────────────────────────
const fieldSx = (accent = C.blue) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '14px', background: '#FAFCFF',
    fontSize: '0.95rem', transition: 'all 0.22s ease',
    '& fieldset': { borderColor: C.blueL, borderWidth: '1.5px' },
    '&:hover fieldset': { borderColor: `${accent}60` },
    '&.Mui-focused': { background: '#fff' },
    '&.Mui-focused fieldset': { borderColor: accent, borderWidth: '2px', boxShadow: `0 0 0 4px ${accent}12` },
  },
  '& .MuiInputLabel-root': { color: C.muted, fontSize: '0.9rem' },
  '& .MuiInputLabel-root.Mui-focused': { color: accent },
});

// ── BOUNCING DOTS ─────────────────────────────────
const BouncingDots = () => (
  <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
    {[0, 0.15, 0.3].map((d, i) => (
      <Box key={i} sx={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: `${bounceDot} 1.2s ease-in-out ${d}s infinite` }} />
    ))}
  </Box>
);

// ── SUCCESS PAGE ──────────────────────────────────
const SuccessPage = ({ navigate }) => (
  <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #E8EAF6 0%, #F3E5F5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
    <Container maxWidth="sm">
      <Box sx={{
        background: '#FEFEFE', borderRadius: '32px',
        p: 6, textAlign: 'center',
        borderTop: `4px solid ${C.green}`,
        boxShadow: `0 20px 60px rgba(0,0,0,0.12)`,
        position: 'relative', overflow: 'visible',
      }}>
        {/* success icon */}
        <Box sx={{
          width: 140, height: 140, borderRadius: '50%',
          background: `linear-gradient(135deg, #10B981 0%, #059669 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '-90px auto 32px',
          boxShadow: `0 15px 50px rgba(16, 185, 129, 0.4)`,
          animation: `${popIn} 0.6s ease-out`,
        }}>
          <Typography sx={{ fontSize: '5rem', color: '#1E3A5F', fontWeight: 'bold', lineHeight: 1 }}>✓</Typography>
        </Box>

        <Typography sx={{ fontWeight: 900, color: '#1E3A5F', fontSize: '2rem', letterSpacing: '-0.5px', mb: 3 }}>
          Demande envoyée ! 🎉
        </Typography>
        <Typography sx={{ color: '#8B92A8', fontSize: '1.05rem', lineHeight: 1.8, mb: 2 }}>
          Votre demande a été soumise avec succès.
        </Typography>
        <Typography sx={{ color: '#8B92A8', fontSize: '1.05rem', lineHeight: 1.8, mb: 4 }}>
          L'administration examinera votre dossier et vous recevrez vos identifiants par email si elle est acceptée.
        </Typography>

        {/* security badges */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, background: '#E0F2FE', border: `1px solid #BAE6FD`, px: 2, py: 1.2, borderRadius: '12px' }}>
            <Typography sx={{ fontSize: '1.1rem' }}>🔒</Typography>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#0369A1' }}>Sécurisé</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, background: '#D1FAE5', border: `1px solid #A7F3D0`, px: 2, py: 1.2, borderRadius: '12px' }}>
            <Typography sx={{ fontSize: '1.1rem' }}>✅</Typography>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#065F46' }}>Soumis</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, background: '#DBEAFE', border: `1px solid #BFDBFE`, px: 2, py: 1.2, borderRadius: '12px' }}>
            <Typography sx={{ fontSize: '1.1rem' }}>📧</Typography>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E40AF' }}>Email envoyé</Typography>
          </Box>
        </Box>

        {/* CTA button */}
        <Button onClick={() => navigate('/')} sx={{
          width: '100%',
          px: 5, py: 2.5, borderRadius: '16px',
          fontWeight: 700, fontSize: '1.05rem', color: '#fff',
          textTransform: 'none', border: 'none',
          background: '#1E3A5F',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(30, 58, 95, 0.25)',
          transition: 'all 0.3s ease',
          '&:hover': { 
            transform: 'translateY(-2px)', 
            color: '#fff',
            background: '#152B47',
            boxShadow: '0 12px 32px rgba(30, 58, 95, 0.35)',
          },
        }}>
          Retour à la connexion
        </Button>
      </Box>
    </Container>
  </Box>
);

// ── MAIN ──────────────────────────────────────────
const DemandeAcces = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');
  const [formData, setFormData] = useState({ type_acteur: '', nom: '', prenom: '', cin: '', email: '' });
  const [fieldErrors, setFieldErrors] = useState({ nom: '', prenom: '', cin: '', email: '' });

  const handleChange = (e) => { 
    const { name, value } = e.target;
    let newValue = value;
    let newError = '';

    // Validation Nom et Prénom: uniquement des lettres, espaces et tirets
    if (name === 'nom' || name === 'prenom') {
      if (value && !/^[a-zA-ZÀ-ÿ\s-]+$/.test(value)) {
        newError = 'Uniquement des lettres, espaces et tirets';
      }
      if (value && value.length < 2) {
        newError = 'Minimum 2 caractères';
      }
    }

    // Validation CIN: uniquement des chiffres, max 8 caractères
    if (name === 'cin') {
      newValue = value.replace(/\D/g, '').slice(0, 8);
      if (newValue && newValue.length !== 8) {
        newError = 'Le CIN doit contenir exactement 8 chiffres';
      }
    }

    // Validation Email: format strict
    if (name === 'email') {
      if (value) {
        // Vérifier le format de base
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newError = 'Format d\'email invalide';
        } else {
          // Vérifier que la partie avant @ contient au moins une lettre
          const localPart = value.split('@')[0];
          if (!/[a-zA-Z]/.test(localPart)) {
            newError = 'L\'email doit contenir au moins une lettre avant le @';
          }
          // Vérifier que le domaine est valide
          const domain = value.split('@')[1];
          if (domain && !/^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/.test(domain)) {
            newError = 'Domaine email invalide';
          }
        }
      }
    }

    setFormData({ ...formData, [name]: newValue }); 
    setFieldErrors({ ...fieldErrors, [name]: newError });
    setError(''); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await axios.post(`${config.apiUrl}/demandes-acces/soumettre`, formData);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la soumission');
    } finally { setLoading(false); }
  };

  if (success) return <SuccessPage navigate={navigate} />;

  const role    = ROLE_CONFIG[formData.type_acteur];
  const accent  = role?.color || C.blue;
  const isReady = !!(formData.type_acteur && formData.nom && formData.prenom && formData.cin && formData.email && !fieldErrors.nom && !fieldErrors.prenom && !fieldErrors.cin && !fieldErrors.email);

  return (
    <Box sx={{
      minHeight: '100vh', background: C.bg, py: 5,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* bg dot grid */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `radial-gradient(${C.blue}12 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />
      {/* blobs */}
      <Box sx={{ position: 'absolute', top: '-12%', right: '-6%', width: 420, height: 420, borderRadius: '50%', background: `radial-gradient(circle, ${C.blue}10 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: '-10%', left: '-8%', width: 360, height: 360, borderRadius: '50%', background: `radial-gradient(circle, ${C.green}0E 0%, transparent 70%)`, pointerEvents: 'none' }} />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>

        {/* ── HEADER CARD ── */}
        <Box sx={{
          background: `linear-gradient(155deg, ${C.navyD} 0%, ${C.navy} 50%, #1E4880 100%)`,
          borderRadius: '24px', px: 4, py: 4,
          textAlign: 'center', mb: 3,
          position: 'relative', overflow: 'hidden',
          boxShadow: `0 16px 48px rgba(26,58,107,0.22)`,
        }}>
          {/* dot grid */}
          <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
          {/* rings */}
          {[280, 180].map((sz, i) => (
            <Box key={sz} sx={{
              position: 'absolute', top: '50%', right: '-5%',
              width: sz, height: sz, borderRadius: '50%',
              border: `1px solid rgba(255,255,255,${i === 0 ? '0.06' : '0.04'})`,
              transform: 'translateY(-50%)',
            }} />
          ))}
          {/* shimmer bottom */}
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${C.blue}, ${C.coral}, ${C.green}, ${C.blue})`, backgroundSize: '300% auto' }} />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            {/* logo */}
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box sx={{ width: 9, height: 9, borderRadius: '50%', background: C.green, boxShadow: `0 0 12px ${C.green}` }} />
              <Typography sx={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '2.5px', color: '#fff', textTransform: 'uppercase' }}>SIAPET</Typography>
            </Box>

            {/* title */}
            <Typography sx={{ fontWeight: 900, color: '#fff', fontSize: { xs: '1.7rem', md: '2rem' }, letterSpacing: '-0.5px', lineHeight: 1.15, mb: 0.8 }}>
              Demande d'accès
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.60)', fontSize: '0.85rem' }}>
              Ministère de l'Enseignement Supérieur — Tunisie 🇹🇳
            </Typography>

            {/* info chips */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2, flexWrap: 'wrap' }}>
              {[
                { icon: '🔒', label: 'Accès sécurisé' },
                { icon: '📧', label: 'Confirmation email' },
                { icon: '⚡', label: 'Réponse rapide' },
              ].map((chip, i) => (
                <Box key={i} sx={{
                  display: 'inline-flex', alignItems: 'center', gap: 0.6,
                  background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(8px)', borderRadius: '50px', px: 1.5, py: 0.5,
                }}>
                  <Typography sx={{ fontSize: '0.75rem' }}>{chip.icon}</Typography>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.78)' }}>{chip.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* ── ROLE SELECTOR ── */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.8 }}>
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', background: C.blue }} />
            <Typography sx={{ color: C.muted, fontSize: '0.73rem', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
              Sélectionnez votre rôle
            </Typography>
          </Box>

          <Grid container spacing={1.5}>
            {Object.entries(ROLE_CONFIG).map(([key, r], idx) => {
              const selected = formData.type_acteur === key;
              return (
                <Grid item xs={6} sm={3} key={key}>
                  <Box
                    onClick={() => { setFormData({ ...formData, type_acteur: key }); setError(''); }}
                    sx={{
                      cursor: 'pointer', borderRadius: '18px',
                      p: 2.2, textAlign: 'center',
                      background: selected ? `${r.color}08` : '#fff',
                      border: `1.5px solid ${selected ? r.color : C.blueL}`,
                      transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
                      position: 'relative', overflow: 'hidden',
                      boxShadow: selected ? `0 10px 28px ${r.color}22` : `0 2px 10px rgba(0,0,0,0.04)`,
                      '&:hover': { borderColor: `${r.color}60`, transform: 'translateY(-4px)', boxShadow: `0 10px 28px ${r.color}18` },
                      '&::before': selected ? {
                        content: '""', position: 'absolute',
                        top: 0, left: 0, right: 0, height: '3.5px',
                        background: `linear-gradient(90deg, ${r.color}, ${C.blue})`,
                      } : {},
                    }}
                  >
                    <Typography sx={{
                      fontSize: '1.7rem', mb: 0.5, display: 'inline-block',
                      transition: 'transform 0.3s ease',
                      transform: selected ? 'scale(1.2) rotate(6deg)' : 'scale(1)',
                      filter: selected ? `drop-shadow(0 3px 8px ${r.color}50)` : 'none',
                    }}>{r.emoji}</Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: selected ? r.color : C.navy, transition: 'color 0.25s' }}>
                      {r.label}
                    </Typography>
                    {selected && (
                      <Typography sx={{ fontSize: '0.64rem', color: C.muted, mt: 0.4, lineHeight: 1.4 }}>
                        {r.desc}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* ── FORM CARD ── */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            background: '#fff', borderRadius: '24px', overflow: 'hidden',
            border: `1.5px solid ${C.blueL}`,
            boxShadow: `0 8px 40px rgba(26,58,107,0.09)`,
          }}
        >
          {/* accent bar */}
          <Box sx={{
            height: 4,
            background: `linear-gradient(90deg, ${accent}, ${C.blueB}, ${accent})`,
            backgroundSize: '300% auto',
            transition: 'background 0.4s ease',
          }} />

          <Box sx={{ p: { xs: 3, md: 4 } }}>
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px', fontSize: '0.88rem' }}>{error}</Alert>}

            {/* section header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8, mb: 3 }}>
              <Box sx={{
                width: 42, height: 42, borderRadius: '13px',
                background: `linear-gradient(135deg, ${C.blueD}, ${C.blue})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', boxShadow: `0 5px 16px ${C.blue}35`,
              }}>🔐</Box>
              <Box>
                <Typography sx={{ fontWeight: 900, color: C.navy, fontSize: '1rem', letterSpacing: '-0.2px' }}>
                  Vos identifiants
                </Typography>
                <Typography sx={{ color: C.muted, fontSize: '0.78rem' }}>
                  Entrez votre CIN et votre adresse email
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Nom" name="nom"
                  value={formData.nom} onChange={handleChange} required
                  placeholder="Votre nom"
                  error={!!fieldErrors.nom}
                  helperText={fieldErrors.nom}
                  InputProps={{ startAdornment: <Typography sx={{ mr: 1, fontSize: '1.1rem', display: 'inline-block' }}>👤</Typography> }}
                  sx={fieldSx(C.blue)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Prénom" name="prenom"
                  value={formData.prenom} onChange={handleChange} required
                  placeholder="Votre prénom"
                  error={!!fieldErrors.prenom}
                  helperText={fieldErrors.prenom}
                  InputProps={{ startAdornment: <Typography sx={{ mr: 1, fontSize: '1.1rem', display: 'inline-block' }}>👤</Typography> }}
                  sx={fieldSx(C.blue)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Numéro CIN" name="cin"
                  value={formData.cin} onChange={handleChange} required
                  placeholder="12345678"
                  error={!!fieldErrors.cin}
                  helperText={fieldErrors.cin}
                  InputProps={{ startAdornment: <Typography sx={{ mr: 1, fontSize: '1.1rem', display: 'inline-block' }}>🪪</Typography> }}
                  sx={fieldSx(C.blue)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth type="email" label="Adresse email" name="email"
                  value={formData.email} onChange={handleChange} required
                  placeholder="exemple@email.com"
                  error={!!fieldErrors.email}
                  helperText={fieldErrors.email}
                  InputProps={{ startAdornment: <Typography sx={{ mr: 1, fontSize: '1.1rem', display: 'inline-block' }}>✉️</Typography> }}
                  sx={fieldSx(C.green)}
                />
              </Grid>
            </Grid>

            {/* progress indicator */}
            {(formData.type_acteur || formData.nom || formData.prenom || formData.cin || formData.email) && (
              <Box sx={{ mt: 2.5, p: 1.8, borderRadius: '12px', background: C.blueL, border: `1px solid ${C.blue}18` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                  <Typography sx={{ fontSize: '0.72rem', color: C.muted, fontWeight: 600 }}>Complétion du formulaire</Typography>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 900, color: isReady ? C.green : C.blue }}>
                    {[formData.type_acteur, formData.nom, formData.prenom, formData.cin, formData.email].filter(Boolean).length} / 5 champs remplis
                  </Typography>
                </Box>
                <Box sx={{ height: 5, borderRadius: 3, background: `${C.blue}18`, overflow: 'hidden' }}>
                  <Box sx={{
                    height: '100%', borderRadius: 3,
                    width: `${[formData.type_acteur, formData.nom, formData.prenom, formData.cin, formData.email].filter(Boolean).length * 20}%`,
                    background: isReady
                      ? `linear-gradient(90deg, ${C.greenDD}, ${C.greenD}, ${C.green})`
                      : `linear-gradient(90deg, ${C.blueD}, ${C.blue})`,
                    backgroundSize: '200% auto',
                    transition: 'width 0.5s ease, background 0.4s ease',
                  }} />
                </Box>
              </Box>
            )}

            {/* buttons */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {/* Retour — navy */}
              <Grid item xs={4}>
                <Button
                  fullWidth
                  startIcon={<ArrowBack sx={{ fontSize: '0.9rem !important' }} />}
                  onClick={() => navigate('/')}
                  sx={{
                    py: 1.55, borderRadius: '14px',
                    textTransform: 'none', fontWeight: 700, fontSize: '0.85rem',
                    color: '#fff', border: 'none',
                    background: C.navy,
                    position: 'relative', overflow: 'hidden',
                    transition: 'transform 0.25s ease',
                    '&::after': { content: '""', position: 'absolute', top: '-50%', left: '-70%', width: '40%', height: '200%', background: 'rgba(255,255,255,0.16)', transform: 'skewX(-22deg)', transition: 'left 0.5s ease' },
                    '&:hover::after': { left: '130%' },
                    '&:hover': { transform: 'translateY(-2px)', color: '#fff', background: C.navyD },
                  }}
                >
                  Retour
                </Button>
              </Grid>

              {/* Soumettre — vert */}
              <Grid item xs={8}>
                <Button
                  type="submit" fullWidth disabled={loading || !isReady}
                  sx={{
                    py: 1.55, borderRadius: '14px',
                    textTransform: 'none', fontWeight: 800, fontSize: '0.95rem',
                    color: '#fff', border: 'none',
                    background: isReady ? C.green : `${C.green}55`,
                    position: 'relative', overflow: 'hidden',
                    transition: 'transform 0.25s ease, background 0.25s ease',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    '&::after': { content: '""', position: 'absolute', top: '-50%', left: '-70%', width: '40%', height: '200%', background: 'rgba(255,255,255,0.18)', transform: 'skewX(-22deg)', transition: 'left 0.5s ease' },
                    '&:hover::after': { left: '130%' },
                    '&:hover:not(:disabled)': { transform: 'translateY(-2px)', color: '#fff', background: C.greenD },
                    '&:disabled': { boxShadow: 'none', color: 'rgba(255,255,255,0.60)' },
                  }}
                >
                  {loading ? (
                    <BouncingDots />
                  ) : (
                    <>
                      <Box component="span" sx={{ fontSize: '1rem', display: 'inline-block' }}>📤</Box>
                      Soumettre ma demande
                      {isReady && <Box component="span" sx={{ display: 'inline-block' }}>→</Box>}
                    </>
                  )}
                </Button>
              </Grid>
            </Grid>

            {/* bottom note */}
            <Box sx={{ mt: 3, pt: 2.5, borderTop: `1px solid ${C.blueL}`, textAlign: 'center' }}>
              <Typography sx={{ color: '#C0D0E0', fontSize: '0.72rem' }}>
                🔐 Accès réservé — sur invitation de l'administration MESRS
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default DemandeAcces;