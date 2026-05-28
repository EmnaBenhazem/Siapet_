import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Container, Typography, TextField, Button, Alert,
  Card, CardContent, InputAdornment
} from '@mui/material';

// ── PALETTE ───────────────────────────────────────
const C = {
  navy:   '#1A3A6B',
  navyD:  '#0F2549',
  blue:   '#4D9FFF',
  blueB:  '#85BFFF',
  blueL:  '#EAF4FF',
  blueD:  '#1A6FD4',
  coral:  '#FF6B35',
  green:  '#06D6A0',
  greenD: '#04B884',
  violet: '#9B4DFF',
  slate:  '#64748B',
  line:   '#E2E8F0',
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/password-reset/request`,
        { email }
      );

      if (response.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const fieldSx = (isFocused) => ({
    '& .MuiOutlinedInput-root': {
      borderRadius: '14px',
      background: '#fff',
      border: `2px solid ${isFocused ? C.blue : C.line}`,
      transition: 'all 0.25s ease',
      '& fieldset': { border: 'none' },
      '&:hover': { borderColor: C.blue },
      '&.Mui-focused': { borderColor: C.blue, boxShadow: `0 0 0 3px ${C.blue}15` },
    },
    '& .MuiInputBase-input': {
      py: 1.8, fontSize: '0.95rem', color: C.navy,
      '&::placeholder': { color: '#A0B0C0', opacity: 1 },
    },
  });

  if (success) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(145deg, #F0F4FF 0%, #F7F0FF 50%, #F0FFF8 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background elements */}
        <Box sx={{ position: 'absolute', top: '-18%', right: '-8%', width: 560, height: 560, borderRadius: '50%', background: `radial-gradient(circle, ${C.violet}14 0%, transparent 68%)`, pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: '-14%', left: '-10%', width: 480, height: 480, borderRadius: '50%', background: `radial-gradient(circle, ${C.green}12 0%, transparent 68%)`, pointerEvents: 'none' }} />

        <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
          <Card sx={{
            width: '100%', maxWidth: 420, borderRadius: '24px',
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
          }}>
            <CardContent sx={{ p: 5, textAlign: 'center' }}>
              <Box sx={{
                width: 80, height: 80, borderRadius: '50%',
                background: `linear-gradient(135deg, ${C.greenD}, ${C.green})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.5rem', mx: 'auto', mb: 3,
                boxShadow: `0 8px 32px ${C.green}40`,
              }}>📧</Box>

              <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: C.navy, mb: 2 }}>
                Email envoyé !
              </Typography>
              <Typography sx={{ color: '#6B7C93', mb: 3, lineHeight: 1.6 }}>
                Si un compte existe avec l'adresse <Box component="strong" sx={{ color: C.navy }}>{email}</Box>, vous recevrez un email avec un lien pour réinitialiser votre mot de passe.
              </Typography>

              <Alert severity="info" sx={{ mb: 4, borderRadius: '12px', textAlign: 'left' }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>💡 Informations importantes :</Typography>
                <Box component="ul" sx={{ m: 0, pl: 2, '& li': { fontSize: '0.85rem', mb: 0.5 } }}>
                  <li>Le lien est valide pendant 1 heure</li>
                  <li>Vérifiez également votre dossier spam</li>
                </Box>
              </Alert>

              <Button
                onClick={() => navigate('/login')}
                fullWidth
                sx={{
                  py: 1.8, borderRadius: '14px',
                  background: C.navy, color: '#fff',
                  fontWeight: 800, fontSize: '1rem',
                  '&:hover': { background: '#2A4A7A' },
                }}
              >
                Retour à la connexion
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(145deg, #F0F4FF 0%, #F7F0FF 50%, #F0FFF8 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background elements */}
      <Box sx={{ position: 'absolute', top: '-18%', right: '-8%', width: 560, height: 560, borderRadius: '50%', background: `radial-gradient(circle, ${C.violet}14 0%, transparent 68%)`, pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: '-14%', left: '-10%', width: 480, height: 480, borderRadius: '50%', background: `radial-gradient(circle, ${C.green}12 0%, transparent 68%)`, pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', top: '40%', left: '38%', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${C.coral}0A 0%, transparent 68%)`, pointerEvents: 'none' }} />

      {/* Bouton retour */}
      <Box
        onClick={() => navigate('/login')}
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
        ← Retour à la connexion
      </Box>

      <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
        <Card sx={{
          width: '100%', maxWidth: 420, borderRadius: '24px',
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        }}>
          <CardContent sx={{ p: 5 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{
                display: 'inline-block', background: C.blueL,
                border: `1.5px solid ${C.navy}28`,
                color: C.navy, px: 2.5, py: 0.8, borderRadius: '50px',
                fontWeight: 700, fontSize: '0.75rem', letterSpacing: '2px',
                textTransform: 'uppercase', mb: 2.5,
                boxShadow: `0 3px 14px ${C.navy}12`,
              }}>Mot de passe oublié</Box>
              
              <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: C.navy, mb: 1 }}>
                Réinitialiser votre mot de passe
              </Typography>
              <Typography sx={{ color: '#6B7C93', fontSize: '0.95rem' }}>
                Entrez votre email pour recevoir un lien de réinitialisation
              </Typography>
            </Box>

            {/* Divider */}
            <Box sx={{
              width: 44, height: 2.5, borderRadius: 2, my: 3, mx: 'auto',
              background: `linear-gradient(90deg, ${C.blue}, ${C.coral})`,
            }} />

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                  <Typography sx={{
                    color: C.navy, fontWeight: 700, fontSize: '0.75rem',
                    textTransform: 'uppercase', letterSpacing: '0.8px',
                  }}>Email</Typography>
                </Box>
                <TextField
                  fullWidth
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="votre.email@universite.tn"
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  sx={fieldSx(focused)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ fontSize: '1.1rem' }}>📧</Box>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Submit button */}
              <Button
                type="submit"
                fullWidth
                disabled={loading}
                sx={{
                  py: 1.8, borderRadius: '14px',
                  background: C.navy, color: '#fff',
                  fontWeight: 800, fontSize: '1rem',
                  transition: 'all 0.25s ease',
                  '&:hover': { background: '#2A4A7A' },
                  '&:disabled': { background: C.line, color: '#A0B0C0' },
                }}
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ForgotPassword;
