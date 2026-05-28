import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogActions, Box, Typography, IconButton,
  TextField, Button, Alert, CircularProgress, InputAdornment,
} from '@mui/material';
import { Archive, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import api from '../../services/api';

/**
 * Dialog d'archivage générique réutilisable.
 *
 * Props :
 *   - open            : boolean
 *   - onClose         : () => void
 *   - onSuccess       : () => void
 *   - entityType      : string
 *   - entityLabel     : string  ex. "département", "spécialité"
 *   - entity          : { id, nom }
 *   - impactEndpoint  : string | null
 *   - archiveEndpoint : string
 *   - renderImpact    : (impact) => ReactNode
 *   - warning         : ReactNode
 *   - cascade         : boolean
 */
const ArchiveActionDialog = ({
  open, onClose, onSuccess,
  entityType, entityLabel = 'élément', entity,
  impactEndpoint = null, archiveEndpoint,
  renderImpact = null, warning = null, cascade = false,
}) => {
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [reason, setReason]             = useState('');
  const [error, setError]               = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [impact, setImpact]             = useState(null);
  const [loadingImpact, setLoadingImpact] = useState(false);

  useEffect(() => {
    if (!open) {
      setPassword(''); setShowPassword(false); setReason(''); setError(''); setImpact(null);
      return;
    }
    if (impactEndpoint) {
      setLoadingImpact(true);
      api.get(impactEndpoint)
        .then(r => { if (r.data.success) setImpact(r.data); })
        .catch(e => { console.error('impact:', e); setError("Impossible de charger l'impact"); })
        .finally(() => setLoadingImpact(false));
    }
  }, [open, impactEndpoint]);

  const handleConfirm = async () => {
    if (!password) { setError('Veuillez saisir votre mot de passe'); return; }
    setSubmitting(true); setError('');
    try {
      const body = { password, reason };
      if (cascade) body.cascade = true;
      await api.patch(archiveEndpoint, body);
      onSuccess && onSuccess();
      onClose && onClose();
    } catch (e) {
      console.error('archive:', e);
      setError(e.response?.data?.message || "Erreur lors de l'archivage");
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
        background: 'linear-gradient(135deg, #FB923C 0%, #D97706 100%)',
        p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
      }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: '10px',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Archive sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
            Archiver {entityLabel ? `le ${entityLabel}` : ''}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem' }}>
            {entity?.nom}
          </Typography>
        </Box>
      </Box>

      <DialogContent sx={{ pt: 3, pb: 1 }}>
        {loadingImpact ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} sx={{ color: '#FB923C' }} />
          </Box>
        ) : (
          <>
            {warning && (
              <Alert severity="warning" sx={{ mb: 2.5, borderRadius: '10px', fontSize: '0.82rem' }}>
                {warning}
              </Alert>
            )}

            {impact && renderImpact && (
              <Box sx={{ mb: 2.5 }}>{renderImpact(impact)}</Box>
            )}

            <TextField
              fullWidth multiline rows={2} size="small"
              placeholder="Raison de l'archivage (optionnel)"
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
                  '&.Mui-focused fieldset': { borderColor: '#FB923C' },
                },
              }}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 1.5, borderRadius: '10px', fontSize: '0.82rem' }}>
                {error}
              </Alert>
            )}
          </>
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
            background: 'linear-gradient(135deg, #FB923C 0%, #D97706 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #D97706 0%, #FB923C 100%)' },
            '&:disabled': { opacity: 0.5 },
          }}
        >
          {submitting
            ? <CircularProgress size={20} sx={{ color: '#fff' }} />
            : "Confirmer l'archivage"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArchiveActionDialog;
