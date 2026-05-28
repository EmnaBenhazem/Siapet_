import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogActions, Box, Typography, IconButton,
  TextField, Button, Alert, CircularProgress, InputAdornment,
} from '@mui/material';
import { Lock, Visibility, VisibilityOff } from '@mui/icons-material';

/**
 * Dialog de confirmation générique avec vérification du mot de passe admin.
 *
 * Props :
 *   open        : boolean
 *   onClose     : () => void
 *   onConfirm   : async (password: string) => void  — doit throw en cas d'erreur
 *   title       : string
 *   subtitle    : string     (nom de l'entité concernée)
 *   icon        : ReactElement (ex: <Edit />)
 *   gradient    : [string, string]  (ex: ['#4D9FFF', '#1A6FD4'])
 *   warning     : string | ReactNode
 *   actionLabel : string     (ex: "Confirmer la modification")
 */
const ConfirmWithPasswordDialog = ({
  open,
  onClose,
  onConfirm,
  title      = 'Confirmer l\'action',
  subtitle   = '',
  icon       = null,
  gradient   = ['#4D9FFF', '#1A6FD4'],
  warning    = 'Cette action modifiera les données en base. Confirmez avec votre mot de passe.',
  actionLabel = 'Confirmer',
}) => {
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  useEffect(() => {
    if (!open) {
      setPassword('');
      setShowPassword(false);
      setLoading(false);
      setError('');
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!password.trim()) {
      setError('Veuillez saisir votre mot de passe administrateur.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onConfirm(password);
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || 'Mot de passe incorrect ou erreur serveur.');
    } finally {
      setLoading(false);
    }
  };

  const [g1, g2] = gradient;

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
    >
      {/* ── Header ── */}
      <Box sx={{
        background: `linear-gradient(135deg, ${g1} 0%, ${g2} 100%)`,
        p: 2.5,
        display: 'flex', alignItems: 'center', gap: 1.5,
      }}>
        {icon && (
          <Box sx={{
            width: 40, height: 40, borderRadius: '10px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {React.cloneElement(icon, { sx: { color: '#fff', fontSize: 22 } })}
          </Box>
        )}
        <Box>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      <DialogContent sx={{ pt: 3, pb: 1 }}>
        {warning && (
          <Alert severity="warning" sx={{ mb: 2.5, borderRadius: '10px', fontSize: '0.82rem' }}>
            {warning}
          </Alert>
        )}

        <Typography sx={{ fontSize: '0.82rem', color: '#64748B', mb: 1, fontWeight: 600 }}>
          Mot de passe administrateur
        </Typography>
        <TextField
          fullWidth
          size="small"
          type={showPassword ? 'text' : 'password'}
          placeholder="Entrez votre mot de passe"
          value={password}
          onChange={e => { setPassword(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleConfirm()}
          disabled={loading}
          autoFocus
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock sx={{ fontSize: 18, color: '#64748B' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                  {showPassword
                    ? <VisibilityOff sx={{ fontSize: 18 }} />
                    : <Visibility sx={{ fontSize: 18 }} />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              '&.Mui-focused fieldset': { borderColor: g1 },
            },
          }}
        />

        {error && (
          <Alert severity="error" sx={{ mt: 1.5, borderRadius: '10px', fontSize: '0.82rem' }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
        <Button
          fullWidth variant="outlined"
          onClick={onClose}
          disabled={loading}
          sx={{
            borderRadius: '10px', textTransform: 'none', fontWeight: 600,
            color: '#64748B', borderColor: '#E2E8F0',
            '&:hover': { background: '#F8FAFC', borderColor: '#CBD5E1' },
          }}
        >
          Annuler
        </Button>
        <Button
          fullWidth variant="contained"
          onClick={handleConfirm}
          disabled={loading || !password.trim()}
          sx={{
            borderRadius: '10px', textTransform: 'none', fontWeight: 700,
            background: `linear-gradient(135deg, ${g1} 0%, ${g2} 100%)`,
            '&:hover': { background: `linear-gradient(135deg, ${g2} 0%, ${g1} 100%)` },
            '&:disabled': { opacity: 0.5 },
          }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : actionLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmWithPasswordDialog;
