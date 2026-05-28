import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, Typography, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, InputAdornment, IconButton, Tooltip, keyframes,
} from '@mui/material';
import { Search, RestoreFromTrash, Delete, ArrowBack, InfoOutlined } from '@mui/icons-material';
import axios from 'axios';
import config from '../config';
import { RestoreActionDialog, ArchiveLogDialog } from '../components/Archive';

const API_BASE_URL = config.apiUrl;

const C = {
  navy: '#1A3A6B', blue: '#4D9FFF', blueL: '#EAF4FF',
  green: '#06D6A0', red: '#ef4444', redL: '#fee2e2',
  amber: '#FFD60A', purple: '#7B2CBF',
  slate: '#64748B', border: '#e2e8f0',
};

const fadeUp = keyframes`
  from { opacity:0; transform:translateY(24px); }
  to   { opacity:1; transform:translateY(0); }
`;

const EtablissementsArchives = () => {
  const navigate = useNavigate();
  const [etablissements, setEtablissements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // Restauration sécurisée + tracing
  const [restoreDlg, setRestoreDlg] = useState({ open: false, entity: null });
  const [logDlg, setLogDlg] = useState({ open: false, entity: null });

  useEffect(() => {
    fetchArchivedEtablissements();
  }, []);

  const fetchArchivedEtablissements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/etablissements?archived=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setEtablissements(response.data.etablissements || []);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ouvre le dialog de restauration sécurisée
  const handleRestore = (etab) => {
    setRestoreDlg({
      open: true,
      entity: { id: etab.id_etablissement, nom: etab.nom_etablissement },
    });
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm('⚠️ ATTENTION: Cette action est irréversible. Voulez-vous vraiment supprimer définitivement cet établissement ?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/etablissements/${id}/permanent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchArchivedEtablissements();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const filteredEtablissements = etablissements.filter(etab =>
    etab.nom_etablissement?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    etab.code_etablissement?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const typeColors = {
    FACULTE: { bg: '#FEF3C7', color: '#F59E0B' },
    ECOLE: { bg: '#DBEAFE', color: '#3B82F6' },
    INSTITUT: { bg: '#FEF3C7', color: '#F59E0B' },
    ISET: { bg: '#F3E8FF', color: '#8B5CF6' },
  };

  return (
    <Box sx={{ animation: `${fadeUp} 0.5s ease-out` }}>
      {/* Header */}
      <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: '#fff', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 2, background: '#FFF4E6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
            📦
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1F2937', mb: 0.5 }}>
              Établissements Archivés
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              {etablissements.length > 0
                ? `${etablissements.length} établissement${etablissements.length > 1 ? 's' : ''} archivé${etablissements.length > 1 ? 's' : ''} — consultez et restaurez les établissements désactivés`
                : 'Consultez et restaurez les établissements archivés'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Retour aux établissements">
            <IconButton onClick={() => navigate('/dashboard/admin/etablissements')}
              sx={{ width: 44, height: 44, borderRadius: '14px', background: '#F0F4FF', border: '2px solid #3B82F640', color: '#3B82F6',
                transition: 'all 0.3s ease',
                '&:hover': { background: '#3B82F620', transform: 'translateY(-2px)', boxShadow: '0 4px 12px #3B82F625' } }}>
              <ArrowBack sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Search */}
      <Card sx={{ borderRadius: '20px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <TextField
            fullWidth
            size="medium"
            placeholder="Rechercher un établissement archivé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#06B6D4', fontSize: 24 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px', background: '#F9FAFB',
                '& fieldset': { borderColor: 'transparent' },
                '&:hover fieldset': { borderColor: '#E5E7EB' },
                '&.Mui-focused fieldset': { borderColor: '#06B6D4', borderWidth: '1px' },
                '&.Mui-focused': { background: '#fff' },
              },
              '& input': { fontSize: '0.95rem', color: '#6B7280' },
            }}
          />
        </Box>
      </Card>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: C.blue }} />
        </Box>
      ) : (
        <Card sx={{ borderRadius: '20px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', position: 'relative' }}>
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #EF4444 0%, #F59E0B 100%)' }} />
          
          <TableContainer sx={{ mt: '4px' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'transparent' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                    CODE
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                    NOM
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                    TYPE
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                    DATE ARCHIVAGE
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', py: 2 }}>
                    ACTIONS
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEtablissements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <Typography sx={{ color: C.slate, fontSize: '0.95rem' }}>
                        Aucun établissement archivé
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEtablissements.map((etab, index) => (
                    <TableRow key={etab.id_etablissement} sx={{ '&:hover': { background: '#F9FAFB' }, transition: 'background 0.2s', borderBottom: index === filteredEtablissements.length - 1 ? 'none' : '1px solid #F3F4F6' }}>
                      <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                        <Chip label={etab.code_etablissement} sx={{ background: '#FEE2E2', color: '#EF4444', fontWeight: 700, fontSize: '0.85rem', borderRadius: '8px', height: '32px' }} />
                      </TableCell>
                      <TableCell sx={{ py: 3, borderBottom: 'none', color: '#6B7280', fontWeight: 500, fontSize: '0.95rem' }}>
                        {etab.nom_etablissement}
                      </TableCell>
                      <TableCell sx={{ py: 3, borderBottom: 'none' }}>
                        <Chip label={etab.type} size="small" sx={{ background: typeColors[etab.type]?.bg || '#FEF3C7', color: typeColors[etab.type]?.color || '#F59E0B', fontWeight: 700, fontSize: '0.75rem', borderRadius: '8px', textTransform: 'uppercase', height: '28px' }} />
                      </TableCell>
                      <TableCell sx={{ py: 3, borderBottom: 'none', color: '#6B7280', fontWeight: 500, fontSize: '0.9rem' }}>
                        {etab.date_archivage ? new Date(etab.date_archivage).toLocaleDateString('fr-FR') : '-'}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 3, borderBottom: 'none' }}>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <IconButton size="small" onClick={() => setLogDlg({ open: true, entity: etab })} sx={{ width: 36, height: 36, background: '#EFF6FF', color: '#2563EB', mr: 0.5, '&:hover': { background: '#2563EB', color: '#fff' } }}>
                            <InfoOutlined sx={{ fontSize: 17 }} />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleRestore(etab)} sx={{ width: 36, height: 36, background: '#D1FAE5', color: '#10B981', '&:hover': { background: '#A7F3D0', color: '#059669' } }}>
                            <RestoreFromTrash fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handlePermanentDelete(etab.id_etablissement)} sx={{ width: 36, height: 36, background: '#FEE2E2', color: '#EF4444', '&:hover': { background: '#FECACA', color: '#DC2626' } }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <RestoreActionDialog
        open={restoreDlg.open}
        onClose={() => setRestoreDlg({ open: false, entity: null })}
        onSuccess={() => fetchArchivedEtablissements()}
        entityType="etablissement"
        entityLabel="établissement"
        entity={restoreDlg.entity}
        restoreEndpoint={restoreDlg.entity ? `/etablissements/${restoreDlg.entity.id}/restore` : ''}
        info={<>L'établissement redeviendra <b>visible et actif</b> dans la liste principale.</>}
      />

      <ArchiveLogDialog
        open={logDlg.open}
        onClose={() => setLogDlg({ open: false, entity: null })}
        entityLabel="établissement"
        entityName={logDlg.entity?.nom_etablissement}
        logEndpoint={logDlg.entity ? `/etablissements/${logDlg.entity.id_etablissement}/archive-log` : null}
      />
    </Box>
  );
};

export default EtablissementsArchives;
