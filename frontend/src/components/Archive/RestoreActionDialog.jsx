import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogActions, Box, Typography, IconButton,
  TextField, Button, Alert, CircularProgress, InputAdornment,
} from '@mui/material';
import { Unarchive, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import api from '../../services/api';

/**
 * Dialog de restauration générique réutilisable.
 *
 * Props :
 *   - open / onClose / onSuccess
 *   - entityType, entityLabel, entity
 *   - restoreEndpoint   : string
 *   - cascadeAvailable  : boolean
 *   - cascadeLabel      : string
 *   - info              : ReactNode
 */
const RestoreActionDialog = ({
  open, onClose, onSuccess,
  entityType, entityLabel = 'élément', entity,
  restoreEndpoint,
  cascadeAvailable = false, cascadeLabel = 'Restaurer aussi les éléments liés',
  info = null,
}) => {
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [reason, setReason]             = useState('');
  const [error, setError]               = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [cascade, setCascade]           = useState(true);

  useEffect(() => {
    if (!open) {
      setPassword(''); setShowPassword(false); setReason(''); setError(''); setCascade(true);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!password) { setError('Veuillez saisir votre mot de passe'); return; }
    setSubmitting(true); setError('');
    try {
      const body = { password, reason };
      if (cascadeAvailable) body.cascade = cascade;
      await api.patch(restoreEndpoint, body);
      onSuccess && onSuccess();
      onClose && onClose();
    } catch (e) {
      console.error('restore:', e);
      setError(e.response?.data?.message || 'Erreur lors de la restauration');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !submitting && onClose && onClose()}
      maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
    >
      {/* ── Header ── */}
      <Box sx={{
        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
      }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: '10px',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Unarchive sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
            Restaurer {entityLabel ? `le ${entityLabel}` : ''}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem' }}>
            {entity?.nom}
          </Typography>
        </Box>
      </Box>

      <DialogContent sx={{ pt: 3, pb: 1 }}>
        {info && (
          <Alert severity="info" sx={{ mb: 2.5, borderRadius: '10px', fontSize: '0.82rem' }}>
            {info}
          </Alert>
        )}

        {cascadeAvailable && (
          <Box sx={{
            mb: 2, p: 1.5, borderRadius: '10px',
            background: cascade ? '#ECFDF5' : '#F8FAFC',
            border: `1.5px solid ${cascade ? '#A7F3D0' : '#E2E8F0'}`,
            display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
          }} onClick={() => setCascade(prev => !prev)}>
            <Box sx={{
              width: 22, height: 22, borderRadius: '6px',
              border: `2px solid ${cascade ? '#10B981' : '#CBD5E1'}`,
              background: cascade ? '#10B981' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: '14px',
            }}>
              {cascade ? '✓' : ''}
            </Box>
            <Typography sx={{ flex: 1, fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>
              {cascadeLabel}
            </Typography>
          </Box>
        )}

        <TextField
          fullWidth multiline rows={2} size="small"
          placeholder="Raison de la restauration (optionnel)"
          value={reason}
          onChange={e => setReason(e.target.value)}
          sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '13px' } }}
        />

        <Typography sx={{ fontSize: '0.82rem', color: '#64748B', mb: 1, fontWeight: 600 }}>
          Mot de passe administrateur
        </Typography>
        <TextField
          fullWidth size="small"
          type={showPassword ? 'text' : 'password'}
          placeholder="Entrez votre mot de passe"
          value={password}
          onChange={e => { setPassword(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleConfirm()}
          disabled={submitting}
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
              '&.Mui-focused fieldset': { borderColor: '#10B981' },
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
          onClick={onClose} disabled={submitting}
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
          disabled={submitting || !password}
          sx={{
            borderRadius: '10px', textTransform: 'none', fontWeight: 700,
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' },
            '&:disabled': { opacity: 0.5 },
          }}
        >
          {submitting
            ? <CircularProgress size={20} sx={{ color: '#fff' }} />
            : 'Confirmer la restauration'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RestoreActionDialog;
