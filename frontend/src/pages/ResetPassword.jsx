import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import {
  Box, Container, Typography, TextField, Button, Alert,
  Card, CardContent, IconButton, InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

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

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nouveau_mot_de_passe: '',
    confirmer_mot_de_passe: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [focused, setFocused] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const generateStrongPassword = () => {
    const length = 16;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + special;
    
    let password = '';
    // Garantir au moins un caractère de chaque type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Remplir le reste
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Mélanger le mot de passe
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setFormData({
      nouveau_mot_de_passe: password,
      confirmer_mot_de_passe: password,
    });
    setShowPwd(true);
    setShowConfirmPwd(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.nouveau_mot_de_passe !== formData.confirmer_mot_de_passe) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.nouveau_mot_de_passe.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${config.apiUrl}/auth/password-reset/confirm`,
        {
          token,
          nouveau_mot_de_passe: formData.nouveau_mot_de_passe,
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Une erreur est survenue';
      setError(msg);
      if (msg.toLowerCase().includes('invalide') || msg.toLowerCase().includes('expiré')) {
        setTokenInvalid(true);
      }
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
              }}>✓</Box>

              <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: C.navy, mb: 2 }}>
                Mot de passe réinitialisé !
              </Typography>
              <Typography sx={{ color: '#6B7C93', mb: 4, lineHeight: 1.6 }}>
                Votre mot de passe a été changé avec succès. Vous allez être redirigé vers la page de connexion...
              </Typography>

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
                Se connecter maintenant
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  if (tokenInvalid) {
    return (
      <Box sx={{
        minHeight: '100vh', display: 'flex',
        background: 'linear-gradient(145deg, #F0F4FF 0%, #F7F0FF 50%, #F0FFF8 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{ position: 'absolute', top: '-18%', right: '-8%', width: 560, height: 560, borderRadius: '50%', background: `radial-gradient(circle, ${C.violet}14 0%, transparent 68%)`, pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: '-14%', left: '-10%', width: 480, height: 480, borderRadius: '50%', background: `radial-gradient(circle, ${C.green}12 0%, transparent 68%)`, pointerEvents: 'none' }} />
        <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
          <Card sx={{
            width: '100%', maxWidth: 420, borderRadius: '24px',
            background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
          }}>
            <CardContent sx={{ p: 5, textAlign: 'center' }}>
              <Box sx={{
                width: 80, height: 80, borderRadius: '50%',
                background: `linear-gradient(135deg, #FF6B35, #D85A30)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.5rem', mx: 'auto', mb: 3,
                boxShadow: `0 8px 32px rgba(255,107,53,0.3)`,
              }}>⏰</Box>
              <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color: C.navy, mb: 1.5 }}>
                Lien expiré ou invalide
              </Typography>
              <Typography sx={{ color: '#6B7C93', mb: 4, lineHeight: 1.6 }}>
                Ce lien de réinitialisation a expiré ou a déjà été utilisé.<br />
                Veuillez demander un nouveau lien.
              </Typography>
              <Button
                onClick={() => navigate('/forgot-password')}
                fullWidth
                sx={{
                  py: 1.8, borderRadius: '14px', mb: 2,
                  background: C.navy, color: '#fff',
                  fontWeight: 800, fontSize: '1rem',
                  '&:hover': { background: '#2A4A7A' },
                }}
              >
                Demander un nouveau lien
              </Button>
              <Button
                onClick={() => navigate('/login')}
                fullWidth variant="outlined"
                sx={{
                  py: 1.5, borderRadius: '14px',
                  borderColor: C.line, color: C.slate,
                  fontWeight: 700,
                  '&:hover': { borderColor: C.blue, color: C.blue, background: C.blueL },
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
              <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: C.navy, mb: 1 }}>
                🔐 Nouveau mot de passe
              </Typography>
              <Typography sx={{ color: '#6B7C93', fontSize: '0.95rem' }}>
                Choisissez un nouveau mot de passe sécurisé
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
              {/* Nouveau mot de passe */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{
                    color: C.navy, fontWeight: 700, fontSize: '0.75rem',
                    textTransform: 'uppercase', letterSpacing: '0.8px',
                  }}>Nouveau mot de passe</Typography>
                  <Button
                    onClick={generateStrongPassword}
                    size="small"
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: C.blue,
                      textTransform: 'none',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '8px',
                      background: `${C.blue}10`,
                      '&:hover': {
                        background: `${C.blue}20`,
                      },
                    }}
                  >
                    ✨ Générer un mot de passe fort
                  </Button>
                </Box>
                <TextField
                  fullWidth
                  type={showPwd ? 'text' : 'password'}
                  name="nouveau_mot_de_passe"
                  value={formData.nouveau_mot_de_passe}
                  onChange={handleChange}
                  required
                  placeholder="Minimum 8 caractères"
                  onFocus={() => setFocused('pwd')}
                  onBlur={() => setFocused('')}
                  sx={fieldSx(focused === 'pwd')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ fontSize: '1.1rem' }}>🔑</Box>
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPwd(!showPwd)} edge="end">
                          {showPwd ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Confirmer mot de passe */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                  <Typography sx={{
                    color: C.navy, fontWeight: 700, fontSize: '0.75rem',
                    textTransform: 'uppercase', letterSpacing: '0.8px',
                  }}>Confirmer le mot de passe</Typography>
                </Box>
                <TextField
                  fullWidth
                  type={showConfirmPwd ? 'text' : 'password'}
                  name="confirmer_mot_de_passe"
                  value={formData.confirmer_mot_de_passe}
                  onChange={handleChange}
                  required
                  placeholder="Retapez votre mot de passe"
                  onFocus={() => setFocused('confirm')}
                  onBlur={() => setFocused('')}
                  sx={fieldSx(focused === 'confirm')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ fontSize: '1.1rem' }}>🔑</Box>
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirmPwd(!showConfirmPwd)} edge="end">
                          {showConfirmPwd ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Conseils */}
              <Alert severity="info" sx={{ mb: 4, borderRadius: '12px' }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>💡 Conseils pour un mot de passe sécurisé :</Typography>
                <Box component="ul" sx={{ m: 0, pl: 2, '& li': { fontSize: '0.85rem', mb: 0.5 } }}>
                  <li>Au moins 8 caractères</li>
                  <li>Mélangez majuscules et minuscules</li>
                  <li>Incluez des chiffres et des caractères spéciaux</li>
                  <li>Évitez les informations personnelles</li>
                </Box>
              </Alert>

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
                {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ResetPassword;
