import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, Box, Typography, IconButton, CircularProgress,
} from '@mui/material';
import { InfoOutlined, Close as CloseIcon } from '@mui/icons-material';
import api from '../../services/api';
import { parseUA } from './parseUA';

/**
 * Dialog d'affichage du log d'archivage (tracing).
 *
 * Deux modes :
 *  1) log fourni inline via prop `log`
 *  2) fetched via prop `logEndpoint` (GET retournant { log: {...} } ou les champs au top-level)
 *
 * Props :
 *   - open / onClose
 *   - entityLabel : "département" / "spécialité" / "établissement"
 *   - entityName  : nom à afficher dans l'en-tête
 *   - log         : objet log avec les champs (performed_at, performed_by, ip_address, user_agent, reason, cascade_count, archived_by_nom, archived_by_prenom, archived_by_email)
 *   - logEndpoint : si log non fourni, fetch depuis cet endpoint
 *   - showCascade : bool — afficher la ligne "Spécialités cascadées"
 */
const ArchiveLogDialog = ({
  open, onClose,
  entityLabel = 'élément', entityName = '',
  log: logProp = null, logEndpoint = null,
  showCascade = false,
}) => {
  const [log, setLog] = useState(logProp);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLog(logProp);
  }, [logProp]);

  useEffect(() => {
    if (!open || logProp || !logEndpoint) return;
    setLoading(true);
    api.get(logEndpoint)
      .then(r => {
        setLog(r.data.log || r.data);
      })
      .catch(e => console.error('log fetch:', e))
      .finally(() => setLoading(false));
  }, [open, logEndpoint, logProp]);

  const d = log || {};
  // Compatibilité : on accepte deux formats (depuis archive_log direct OU joints sur entité)
  const performedAt = d.performed_at || d.log_performed_at || d.archived_at;
  const performedBy = d.performed_by || d.archived_by;
  const performedByName = (d.archived_by_prenom || d.archived_by_nom)
    ? `${d.archived_by_prenom || ''} ${d.archived_by_nom || ''}`.trim()
    : performedBy;
  const { os, browser, device } = parseUA(d.user_agent || '');

  const dateStr = performedAt
    ? new Date(performedAt).toLocaleString('fr-TN', { dateStyle: 'long', timeStyle: 'medium' })
    : '—';

  const rows = [
    { icon: '📅', label: 'Date & heure',       value: dateStr },
    { icon: '👤', label: 'Effectué par',       value: performedByName || '—', sub: d.archived_by_email },
    { icon: '🆔', label: 'Matricule',          value: performedBy || '—' },
    { icon: '🌐', label: 'Adresse IP',         value: d.ip_address || '—' },
    { icon: '💻', label: 'Système / Appareil', value: `${os} · ${device}` },
    { icon: '🧭', label: 'Navigateur',         value: browser },
  ];
  if (showCascade) rows.push({ icon: '🔗', label: 'Éléments cascadés', value: `${d.cascade_count ?? 0} élément(s) traité(s) en cascade` });
  rows.push({ icon: '📝', label: 'Raison', value: d.reason || '— Aucune raison fournie —' });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: '18px', overflow: 'hidden' } }}
    >
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
              Détails de l'archivage {entityLabel ? `(${entityLabel})` : ''}
            </Typography>
            <Typography sx={{ fontSize: '12px', color: '#1E40AF' }}>{entityName}</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#1E3A8A' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent sx={{ p: 2.5 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ color: '#2563EB' }} />
          </Box>
        ) : !log ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ fontSize: '2.5rem', mb: 1, opacity: 0.3 }}>📂</Typography>
            <Typography sx={{ color: '#94A3B8', fontSize: '13px' }}>
              Aucun log disponible pour cet élément
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {rows.map((r, i) => (
              <Box key={i} sx={{
                display: 'flex', alignItems: 'flex-start', gap: 1.5,
                p: 1.5, borderRadius: '10px',
                background: '#FAFBFF', border: '1px solid #E5E7EB',
              }}>
                <Box sx={{ fontSize: '1.2rem', flexShrink: 0 }}>{r.icon}</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '10.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', mb: 0.3 }}>
                    {r.label}
                  </Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', wordBreak: 'break-word' }}>
                    {r.value}
                  </Typography>
                  {r.sub && (
                    <Typography sx={{ fontSize: '11px', color: '#94A3B8', mt: 0.2 }}>{r.sub}</Typography>
                  )}
                </Box>
              </Box>
            ))}
            {d.user_agent && (
              <Box sx={{ mt: 0.5, p: 1.2, borderRadius: '8px', background: '#F1F5F9', fontSize: '10px', color: '#94A3B8', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {d.user_agent}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ArchiveLogDialog;
