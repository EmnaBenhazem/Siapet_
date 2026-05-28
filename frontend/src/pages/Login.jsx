import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography,
  InputAdornment, IconButton, Alert, Link,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';
import config from '../config';

// ── PALETTE ───────────────────────────────────────
const C = {
  navy:    '#1A3A6B',
  blue:    '#4D9FFF',
  blueB:   '#85BFFF',
  blueL:   '#EAF4FF',
  slate:   '#64748B',
  line:    '#E8EFF8',
  green:   '#06D6A0',
  greenD:  '#04B884',
  greenL:  '#E1F5EE',
  violet:  '#9B4DFF',
  violetM: '#7B2CBF',
  violetL: '#EEEDFE',
  coral:   '#D85A30',
  coralL:  '#F0997B',
  coralD:  '#993C1D',
};

// ── FIELD STYLE ───────────────────────────────────
const fieldSx = (isFocused) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '14px',
    background: isFocused ? '#fff' : '#F8FAFE',
    transition: 'all 0.22s ease',
    boxShadow: isFocused ? `0 0 0 3px ${C.blueD}22` : 'none',
    '& fieldset': {
      border: `1.5px solid ${isFocused ? C.blueD : C.line}`,
      transition: 'border-color 0.22s',
    },
    '&:hover fieldset': { borderColor: C.blue },
    '&.Mui-focused fieldset': { borderColor: C.blueD },
  },
  '& .MuiOutlinedInput-input': { py: 1.5, fontSize: '0.92rem', color: C.navy },
});

export default function Login() {
  const navigate = useNavigate();
  const [showPwd, setShowPwd]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [focused, setFocused]       = useState('');
  const [form, setForm]             = useState({ email: '', mot_de_passe: '' });
  const [shakeError, setShakeError] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [hoverBtn, setHoverBtn]     = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${config.apiUrl}/auth/login`, {
        email: form.email,
        mot_de_passe: form.mot_de_passe,
      });
      if (res.data.success) {
        localStorage.setItem('token', res.data.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.data.user));
        setSuccess(true);
        const map = {
          admin_mesrs: 'admin', recteur: 'recteur', directeur: 'directeur',
          enseignant: 'enseignant', etudiant: 'etudiant',
        };
        const role = res.data.data.user.role.toLowerCase();
        setTimeout(() => navigate(`/dashboard/${map[role] || role}`), 900);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
      setShakeError(true);
      setTimeout(() => setShakeError(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(145deg, #F0F4FF 0%, #F7F0FF 50%, #F0FFF8 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── BG DOT GRID ─────────────────────── */}
      <Box sx={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `radial-gradient(${C.violet}0D 1px, transparent 1px)`,
        backgroundSize: '30px 30px',
      }} />

      {/* ── LARGE BLOBS ─────────────────────── */}
      <Box sx={{
        position: 'absolute', top: '-18%', right: '-8%',
        width: 560, height: 560, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.violet}14 0%, transparent 68%)`,
        pointerEvents: 'none',
      }} />
      <Box sx={{
        position: 'absolute', bottom: '-14%', left: '-10%',
        width: 480, height: 480, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.green}12 0%, transparent 68%)`,
        pointerEvents: 'none',
      }} />
      <Box sx={{
        position: 'absolute', top: '40%', left: '38%',
        width: 300, height: 300, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.coral}0A 0%, transparent 68%)`,
        pointerEvents: 'none',
      }} />

      {/* ── BACK BUTTON ─────────────────────── */}
      {/* ══ BOUTON RETOUR ACCUEIL ══════════════ */}
      <Box
        onClick={() => navigate('/')}
        sx={{
          position: 'absolute', top: 28, left: 32,
          display: 'flex', alignItems: 'center', gap: 0.8,
          cursor: 'pointer', zIndex: 10,
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${C.navy}20`,
          borderRadius: '12px',
          px: 2, py: 1,
          color: C.navy, fontSize: '0.85rem', fontWeight: 600,
          transition: 'all 0.25s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          '&:hover': { 
            background: C.navy,
            color: '#fff',
            transform: 'translateX(-2px)',
            boxShadow: '0 4px 16px rgba(26,58,107,0.25)',
          },
        }}
      >
        ← Accueil
      </Box>

      {/* ══ CARD ════════════════════════════════ */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        m: 'auto',
        mx: { xs: 2, sm: 'auto' },
        width: '100%',
        maxWidth: 1000,
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(15,30,53,0.12), 0 4px 20px rgba(15,30,53,0.06)',
        background: '#fff',
        position: 'relative', zIndex: 2,
        minHeight: { md: 560 },
      }}>

        {/* ══ LEFT : VISUAL PANEL ═════════════ */}
        <Box sx={{
          flex: '0 0 44%',
          background: `linear-gradient(155deg, ${C.navy} 0%, #1E4880 55%, #162E58 100%)`,
          p: { xs: 3, md: 4.5 },
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* inner dot grid */}
          <Box sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }} />

          {/* violet glow center */}
          <Box sx={{
            position: 'absolute', top: '22%', left: '50%',
            width: 300, height: 300, borderRadius: '50%',
            background: `radial-gradient(circle, ${C.violet}26 0%, transparent 68%)`,
            pointerEvents: 'none',
          }} />

          {/* coral glow bottom */}
          <Box sx={{
            position: 'absolute', bottom: '-5%', right: '-5%',
            width: 200, height: 200, borderRadius: '50%',
            background: `radial-gradient(circle, ${C.coral}18 0%, transparent 68%)`,
            pointerEvents: 'none',
          }} />

          {/* ── TOP : LOGO ── */}
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Typography sx={{
                fontWeight: 900, fontSize: '2rem', letterSpacing: '-0.5px',
                color: '#fff',
              }}>SIAPET</Typography>
            </Box>
          </Box>

          {/* ── MIDDLE : HERO VISUAL + TEXT ── */}
          <Box sx={{ position: 'relative', zIndex: 1 }}>

            {/* headline */}
            {/* Central visual */}
            <Box sx={{
              position: 'relative', width: 130, height: 130, mx: 'auto', mb: 2,
            }}>
              {/* center emoji */}
              <Box sx={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                fontSize: '2.2rem', lineHeight: 1,
                filter: 'drop-shadow(0 4px 12px rgba(155,77,255,0.4))',
              }}>🎓</Box>

              {/* orbit ring 1 */}
              <Box sx={{
                position: 'absolute', top: '50%', left: '50%',
                width: 84, height: 84,
                border: `1px solid rgba(155,77,255,0.25)`,
                borderRadius: '50%',
                transform: 'translate(-50%,-50%)',
              }} />

              {/* orbit ring 2 */}
              <Box sx={{
                position: 'absolute', top: '50%', left: '50%',
                width: 124, height: 124,
                border: `1px dashed rgba(6,214,160,0.20)`,
                borderRadius: '50%',
                transform: 'translate(-50%,-50%)',
              }} />

              {/* floating mini badges */}
              {[
                { emoji: '📊', top: '-10px', right: '-6px' },
                { emoji: '🚀', bottom: '-8px', left: '-8px' },
                { emoji: '⭐', top: '8px', left: '-16px' },
              ].map((b, i) => (
                <Box key={i} sx={{
                  position: 'absolute', ...b,
                  fontSize: '0.95rem', lineHeight: 1,
                  filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))',
                }}>{b.emoji}</Box>
              ))}
            </Box>

            <Typography sx={{
              color: 'rgba(255,255,255,0.48)', fontSize: '0.82rem',
              lineHeight: 1.7, maxWidth: 240, mx: 'auto', textAlign: 'center',
            }}>
              Plateforme intelligente pour l'analyse des performances éducatives en Tunisie.
            </Typography>

            {/* divider */}
            <Box sx={{
              width: 44, height: 2.5, borderRadius: 2, my: 1.8, mx: 'auto',
              background: `linear-gradient(90deg, ${C.blue}, ${C.coral})`,
            }} />

            {/* perks */}
            {[
              { icon: '🚀', label: 'Accès instantané et sécurisé'   },
              { icon: '🔒', label: 'Données chiffrées et protégées'  },
              { icon: '📊', label: 'Tableaux de bord en temps réel'  },
            ].map((p, i) => (
              <Box key={i} sx={{
                display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.9,
                transition: 'transform 0.2s ease',
                '&:hover': { transform: 'translateX(6px)' },
                cursor: 'default',
              }}>
                <Box sx={{
                  width: 26, height: 26, borderRadius: '7px',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.82rem', flexShrink: 0,
                }}>{p.icon}</Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.78rem' }}>
                  {p.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* ── BOTTOM : STATS ── */}
          <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', gap: 1.8, justifyContent: 'center' }}>
            {[
              { val: '10K+', label: 'Étudiants',      emoji: '🎓' },
              { val: '150+', label: 'Établissements',  emoji: '🏛️' },
              { val: '95%',  label: 'Satisfaction',    emoji: '⭐' },
            ].map((s, i) => (
              <Box key={i} sx={{
                textAlign: 'center',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', px: 1.4, py: 0.9,
                transition: 'all 0.25s ease',
                cursor: 'default',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  background: 'rgba(255,255,255,0.09)',
                  border: `1px solid rgba(155,77,255,0.3)`,
                  boxShadow: `0 6px 20px rgba(155,77,255,0.2)`,
                },
              }}>
                <Typography sx={{ fontSize: '0.9rem', mb: 0.2 }}>{s.emoji}</Typography>
                <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.92rem', letterSpacing: '-0.3px' }}>{s.val}</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{s.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ══ RIGHT : FORM PANEL ══════════════ */}
        <Box sx={{
          flex: 1,
          p: { xs: 3, md: 5 },
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* subtle top-right decoration */}
          <Box sx={{
            position: 'absolute', top: -30, right: -30,
            width: 140, height: 140, borderRadius: '50%',
            background: `radial-gradient(circle, ${C.green}10 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <Box sx={{ maxWidth: 360, mx: 'auto', width: '100%', position: 'relative', zIndex: 1 }}>

            {/* ── HEADER ── */}
            <Box sx={{ mb: 3 }}>
              {/* top badge */}
              <Box sx={{
                display: 'inline-flex', alignItems: 'center', gap: 0.8,
                background: C.blueL, border: `1.5px solid ${C.blue}30`,
                px: 1.8, py: 0.6, borderRadius: '50px', mb: 1.2,
              }}>
                <Box sx={{
                  width: 7, height: 7, borderRadius: '50%', background: '#4A90E2',
                }} />
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#4A90E2', letterSpacing: '0.8px' }}>
                  Plateforme active · Tunisie 2026
                </Typography>
              </Box>

              <Typography sx={{
                fontSize: '1.75rem', fontWeight: 900, color: C.navy,
                letterSpacing: '-1px', mb: 0.5,
                display: 'flex', alignItems: 'center', gap: 1,
              }}>
                Connexion
                <Box component="span" sx={{
                  display: 'inline-block',
                  transformOrigin: 'bottom right',
                }}>🔐</Box>
              </Typography>
              <Typography sx={{ color: C.slate, fontSize: '0.88rem', lineHeight: 1.65 }}>
                Entrez vos identifiants pour accéder à votre espace
              </Typography>
            </Box>

            {/* ── ERROR ── */}
            {error && (
              <Alert severity="error" sx={{
                mb: 3, borderRadius: '12px', fontSize: '0.84rem',
              }}>
                {error}
              </Alert>
            )}

            {/* ── FORM ── */}
            <Box component="form" onSubmit={handleSubmit}>

              {/* Email */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                  <Typography sx={{
                    color: C.navy, fontWeight: 700, fontSize: '0.75rem',
                    textTransform: 'uppercase', letterSpacing: '0.8px',
                  }}>Email</Typography>
                </Box>
                <TextField
                  fullWidth type="email" name="email"
                  value={form.email} onChange={handleChange} required
                  placeholder="prenom.nom@universite.tn"
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography sx={{
                          fontSize: '1.05rem', lineHeight: 1,
                          transition: 'transform 0.3s ease',
                          transform: focused === 'email' ? 'scale(1.25) rotate(-5deg)' : 'scale(1)',
                          display: 'inline-block',
                        }}>✉️</Typography>
                      </InputAdornment>
                    ),
                  }}
                  sx={fieldSx(focused === 'email')}
                />
              </Box>

              {/* Password */}
              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                  <Typography sx={{
                    color: C.navy, fontWeight: 700, fontSize: '0.75rem',
                    textTransform: 'uppercase', letterSpacing: '0.8px',
                  }}>Mot de passe</Typography>
                </Box>
                <TextField
                  fullWidth type={showPwd ? 'text' : 'password'}
                  name="mot_de_passe" value={form.mot_de_passe}
                  onChange={handleChange} required placeholder="••••••••••"
                  onFocus={() => setFocused('pwd')}
                  onBlur={() => setFocused('')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography sx={{
                          fontSize: '1.05rem', lineHeight: 1,
                          transition: 'transform 0.3s ease',
                          transform: focused === 'pwd' ? 'scale(1.25) rotate(-12deg)' : 'scale(1)',
                          display: 'inline-block',
                        }}>🔑</Typography>
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPwd(!showPwd)}
                          edge="end" size="small"
                          sx={{
                            color: '#C8D8E8', transition: 'all 0.2s ease',
                            '&:hover': { color: C.blue, transform: 'scale(1.15)' },
                          }}
                        >
                          {showPwd
                            ? <VisibilityOff sx={{ fontSize: 17 }} />
                            : <Visibility sx={{ fontSize: 17 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={fieldSx(focused === 'pwd')}
                />
              </Box>

              {/* Forgot */}
              <Box sx={{ textAlign: 'right', mb: 2.5 }}>
                <Link href="/forgot-password" underline="none" sx={{
                  color: C.navy, fontSize: '0.8rem', fontWeight: 600,
                  transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 0.4,
                  '&:hover': { color: C.navy, opacity: 0.7, transform: 'translateX(2px)' },
                }}>
                  🔓 Mot de passe oublié ?
                </Link>
              </Box>

              {/* ✦ CTA BUTTON — bleu */}
              <Button
                type="submit" fullWidth
                disabled={loading || success}
                onMouseEnter={() => setHoverBtn(true)}
                onMouseLeave={() => setHoverBtn(false)}
                sx={{
                  py: 1.5, borderRadius: '14px',
                  background: success
                    ? `linear-gradient(90deg, ${C.navyD}, ${C.navy}, ${C.blue}, ${C.navy}, ${C.navyD})`
                    : C.navy,
                  backgroundSize: success ? '300% auto' : 'auto',
                  color: '#fff', fontWeight: 800, fontSize: '0.98rem',
                  textTransform: 'none', letterSpacing: '0.3px',
                  transition: 'all 0.3s ease',
                  position: 'relative', overflow: 'hidden',
                  transform: success ? 'scale(1.02)' : hoverBtn ? 'translateY(-3px) scale(1.02)' : 'scale(1)',
                  boxShadow: hoverBtn && !success
                    ? `0 14px 40px rgba(26,58,107,0.40)`
                    : success ? `0 8px 28px rgba(26,58,107,0.40)` : 'none',
                  '&::after': {
                    content: '""', position: 'absolute',
                    top: '-50%', left: '-70%', width: '40%', height: '200%',
                    background: 'rgba(255,255,255,0.22)',
                    transform: 'skewX(-22deg)',
                    transition: 'left 0.55s ease',
                  },
                  '&:hover::after': { left: '130%' },
                  '&:hover': { background: success ? undefined : '#2A4A7A' },
                  '&:disabled': loading || success ? {} : {
                    background: C.line, boxShadow: 'none', color: '#A0B0C0',
                  },
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                    {[0, 0.18, 0.36].map((d, i) => (
                      <Box key={i} sx={{
                        width: 7, height: 7, borderRadius: '50%', background: '#fff',
                      }} />
                    ))}
                  </Box>
                ) : success ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                    <Box component="span">🎉</Box>
                    Connexion réussie !
                    <Box component="span">✅</Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                    <Box component="span" sx={{
                      fontSize: '1rem',
                      display: 'inline-block',
                    }}>🚀</Box>
                    Se connecter
                    <Box component="span" sx={{ display: 'inline-block' }}>→</Box>
                  </Box>
                )}
              </Button>


              {/* Bottom note */}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}