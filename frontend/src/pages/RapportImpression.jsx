import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Chip, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Grid,
} from '@mui/material';
import {
  Print, ArrowBack, PictureAsPdf, Assessment, CheckCircle,
  Warning, ErrorOutline, School, Business, People, AutoGraph,
} from '@mui/icons-material';

// ── Palette plateforme ─────────────────────────────────────────────
const C = {
  navy:   '#1A3A6B', blue:   '#4D9FFF', blueL:  '#EAF4FF',
  green:  '#06D6A0', orange: '#FF6B35', red:    '#EF4444',
  purple: '#7B2CBF', teal:   '#0E6678', yellow: '#FFD60A',
};

const getMentionColor = m => {
  const map = { 'Très bien':'#22c55e', 'Bien':'#06D6A0', 'Assez bien':'#4D9FFF', 'Passable':'#F59E0B', 'Insuffisant':'#EF4444' };
  return map[m] || '#8A9BB0';
};
const getRisqueColor = v => v === 'Critique' ? C.red : v === 'À risque' ? C.orange : C.green;
const fmt = (n, d = 0) => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });

const REPORT_LABELS = {
  etudiants:      { label: 'Rapport Étudiants',         icon: '👥', color: C.blue   },
  etablissements: { label: 'Rapport Établissements',    icon: '🏫', color: C.navy   },
  enseignants:    { label: 'Rapport Enseignants',       icon: '👨‍🏫', color: C.purple },
  academique:     { label: 'Rapport Académique',        icon: '📚', color: C.green  },
  risque:         { label: 'Rapport Risque Académique', icon: '⚠️', color: C.orange },
};

// ── Carte KPI mini ─────────────────────────────────────────────────
function KpiMini({ icon, label, value, color }) {
  return (
    <Box sx={{
      p: 2, borderRadius: '14px', background: '#fff',
      border: `1.5px solid ${color}22`, textAlign: 'center',
      boxShadow: `0 2px 10px ${color}12`,
    }}>
      <Typography sx={{ fontSize: '1.4rem', mb: 0.5 }}>{icon}</Typography>
      <Typography sx={{ fontWeight: 900, fontSize: '1.4rem', color, lineHeight: 1 }}>{value}</Typography>
      <Typography sx={{ color: '#8A9BB0', fontSize: '0.72rem', mt: 0.3, fontWeight: 600 }}>{label}</Typography>
    </Box>
  );
}

export default function RapportImpression() {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const raw = sessionStorage.getItem('rapport_impression');
    if (!raw) { setNotFound(true); return; }
    try {
      setReportData(JSON.parse(raw));
    } catch { setNotFound(true); }
  }, [navigate]);

  const handlePrint = () => {
    window.print();
  };

  if (notFound) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.blueL, gap: 2 }}>
      <Typography sx={{ fontSize: '3rem' }}>📭</Typography>
      <Typography sx={{ fontWeight: 700, color: C.navy, fontSize: '1.2rem' }}>Aucun rapport à afficher</Typography>
      <Typography sx={{ color: '#8A9BB0', fontSize: '0.9rem' }}>Générez d'abord un rapport depuis la page Rapports & Exports.</Typography>
      <Button variant="contained" startIcon={<ArrowBack />} onClick={() => window.close()}
        sx={{ mt: 1, borderRadius: '10px', textTransform: 'none', fontWeight: 700, background: C.navy }}>
        Fermer
      </Button>
    </Box>
  );

  if (!reportData) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress sx={{ color: C.blue }} />
    </Box>
  );

  const { rows, summary, reportType, apercu, cols, currentType, generatedAt } = reportData;
  const typeInfo = REPORT_LABELS[reportType] || { label: 'Rapport', icon: '📄', color: C.blue };
  const now = generatedAt || new Date().toLocaleString('fr-FR');

  return (
    <>
      {/* ── CSS impression ─────────────────────────────────────── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          .print-page { box-shadow: none !important; border-radius: 0 !important; margin-top: 0 !important; }
          .print-table-row:nth-child(even) { background: #f8faff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .kpi-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 1.2cm; size: A4 portrait; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
        }
        @media screen {
          body { background: #EAF4FF; }
        }
      `}</style>

      {/* ── Barre d'actions (masquée à l'impression) ─────────── */}
      <Box className="no-print" sx={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: '#fff', borderBottom: '1px solid #E5E7EB',
        px: 3, py: 1.5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
        boxShadow: '0 2px 12px rgba(26,58,107,0.08)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px',
            background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
          }}>
            {typeInfo.icon}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.95rem', lineHeight: 1.2 }}>
              {apercu?.titre || typeInfo.label}
            </Typography>
            <Typography sx={{ color: '#8A9BB0', fontSize: '0.72rem' }}>
              Généré le {now} · {rows.length} enregistrement{rows.length > 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined" startIcon={<ArrowBack />} onClick={() => window.close()}
            sx={{ borderRadius: '9px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', borderColor: '#D1D5DB', color: '#6B7280', '&:hover': { borderColor: C.navy, color: C.navy } }}
          >
            Fermer
          </Button>
          <Button
            variant="contained" startIcon={<Print />} onClick={handlePrint}
            sx={{
              borderRadius: '9px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem',
              background: 'linear-gradient(135deg, #C62828, #EF5350)',
              boxShadow: '0 4px 14px rgba(198,40,40,0.3)',
              '&:hover': { background: '#b71c1c' },
            }}
          >
            Imprimer / Enregistrer PDF
          </Button>
        </Box>
      </Box>

      {/* ── Document principal ───────────────────────────────── */}
      <Box sx={{ mt: '72px', px: { xs: 2, md: 4 }, pb: 6, maxWidth: 1100, mx: 'auto' }} className="print-page" ref={printRef}>

        {/* ── En-tête du rapport ── */}
        <Box className="print-header" sx={{
          mb: 4, p: 3, borderRadius: '20px', overflow: 'hidden', position: 'relative',
          background: `linear-gradient(135deg, ${C.navy} 0%, #2A5A9B 60%, ${C.blue} 100%)`,
          boxShadow: '0 8px 32px rgba(26,58,107,0.22)',
        }}>
          {/* Décorations */}
          <Box sx={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <Box sx={{ position: 'absolute', bottom: -20, left: 100, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, position: 'relative', zIndex: 1 }}>
            <Box>
              {/* Logo / Brand */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', border: '1px solid rgba(255,255,255,0.2)' }}>
                  {typeInfo.icon}
                </Box>
                <Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    SIAPET · Plateforme d'Analyse Académique
                  </Typography>
                  <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '1.2rem', lineHeight: 1.2, mt: 0.3 }}>
                    {apercu?.titre || typeInfo.label}
                  </Typography>
                </Box>
              </Box>

              {/* Métadonnées */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {[
                  { icon: '📅', label: 'Généré le', val: now },
                  { icon: '🎯', label: 'Portée', val: apercu?.portee || 'Tous les établissements' },
                  { icon: '📦', label: 'Données', val: apercu?.donnees || typeInfo.label },
                ].map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Typography sx={{ fontSize: '0.9rem' }}>{item.icon}</Typography>
                    <Box>
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</Typography>
                      <Typography sx={{ color: '#fff', fontSize: '0.78rem', fontWeight: 600 }}>{item.val}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Badge type de rapport */}
            <Box sx={{ textAlign: 'right' }}>
              <Chip
                label={typeInfo.label}
                sx={{
                  background: 'rgba(255,255,255,0.18)', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontWeight: 800, fontSize: '0.75rem', borderRadius: '10px',
                  mb: 1,
                }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem' }}>
                  {rows.length} enregistrement{rows.length > 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ── Résumé statistique ── */}
        {Object.keys(summary).length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '1rem', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assessment sx={{ color: C.blue, fontSize: 20 }} />
              Résumé statistique
            </Typography>
            <Grid container spacing={2}>
              {summary.total != null && (
                <Grid item xs={6} sm={4} md={2}>
                  <KpiMini icon="📊" label="Total" value={fmt(summary.total)} color={typeInfo.color} />
                </Grid>
              )}
              {summary.moyenne != null && (
                <Grid item xs={6} sm={4} md={2}>
                  <KpiMini icon="⭐" label="Moyenne" value={`${summary.moyenne}/20`} color={C.blue} />
                </Grid>
              )}
              {summary.a_risque != null && (
                <Grid item xs={6} sm={4} md={2}>
                  <KpiMini icon="⚠️" label="À risque" value={fmt(summary.a_risque)} color={C.orange} />
                </Grid>
              )}
              {summary.critique != null && (
                <Grid item xs={6} sm={4} md={2}>
                  <KpiMini icon="🚨" label="Critique" value={fmt(summary.critique)} color={C.red} />
                </Grid>
              )}
              {summary.tres_bien != null && (
                <Grid item xs={6} sm={4} md={2}>
                  <KpiMini icon="🏆" label="Très bien" value={fmt(summary.tres_bien)} color="#22c55e" />
                </Grid>
              )}
              {summary.reussite != null && (
                <Grid item xs={6} sm={4} md={2}>
                  <KpiMini icon="✅" label="Réussite" value={fmt(summary.reussite)} color={C.green} />
                </Grid>
              )}
              {summary.total_etudiants != null && (
                <Grid item xs={6} sm={4} md={2}>
                  <KpiMini icon="👥" label="Étudiants" value={fmt(summary.total_etudiants)} color={C.blue} />
                </Grid>
              )}
              {summary.total_enseignants != null && (
                <Grid item xs={6} sm={4} md={2}>
                  <KpiMini icon="👨‍🏫" label="Enseignants" value={fmt(summary.total_enseignants)} color={C.purple} />
                </Grid>
              )}
              {summary.moyenne_globale != null && (
                <Grid item xs={6} sm={4} md={2}>
                  <KpiMini icon="📈" label="Moy. globale" value={`${summary.moyenne_globale}/20`} color={C.green} />
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* ── Tableau de données ── */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 4, height: 20, borderRadius: 2, background: `linear-gradient(${typeInfo.color}, ${C.blue})`, mr: 0.5 }} />
              Données détaillées
            </Typography>
            <Chip
              label={`${rows.length} entrée${rows.length > 1 ? 's' : ''}`}
              size="small"
              sx={{ background: `${typeInfo.color}14`, color: typeInfo.color, fontWeight: 700, fontSize: '0.72rem' }}
            />
          </Box>

          <TableContainer sx={{
            borderRadius: '14px', border: `1.5px solid ${C.blueL}`,
            boxShadow: '0 2px 12px rgba(26,58,107,0.06)',
            overflow: 'auto',
          }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: `linear-gradient(135deg, ${C.navy}, #2A5A9B)` }}>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 800, fontSize: '0.68rem', py: 1.5, width: 36, borderBottom: 'none' }}>#</TableCell>
                  {(cols || []).map(c => (
                    <TableCell key={c.key} sx={{ color: '#fff', fontWeight: 800, fontSize: '0.72rem', py: 1.5, whiteSpace: 'nowrap', borderBottom: 'none' }}>
                      {c.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow
                    key={i}
                    className="print-table-row"
                    sx={{
                      background: i % 2 === 0 ? '#fff' : '#F8FAFF',
                      borderBottom: `1px solid ${C.blueL}`,
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <TableCell sx={{ color: '#8A9BB0', fontSize: '0.7rem', py: 1.2, fontWeight: 600 }}>{i + 1}</TableCell>
                    {(cols || []).map(c => {
                      const val = row[c.key];

                      if (c.key === 'mention' && reportType === 'etudiants') return (
                        <TableCell key={c.key} sx={{ py: 1.2 }}>
                          <Box sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.5,
                            px: 1.2, py: 0.4, borderRadius: '6px',
                            background: `${getMentionColor(val)}18`,
                            border: `1px solid ${getMentionColor(val)}35`,
                          }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: getMentionColor(val), flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: getMentionColor(val) }}>{val || '—'}</Typography>
                          </Box>
                        </TableCell>
                      );

                      if (c.key === 'niveau_risque') return (
                        <TableCell key={c.key} sx={{ py: 1.2 }}>
                          <Box sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.5,
                            px: 1.2, py: 0.4, borderRadius: '6px',
                            background: `${getRisqueColor(val)}18`,
                            border: `1px solid ${getRisqueColor(val)}35`,
                          }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: getRisqueColor(val), flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: getRisqueColor(val) }}>{val || '—'}</Typography>
                          </Box>
                        </TableCell>
                      );

                      if (c.key === 'moyenne_generale' || c.key === 'moyenne') {
                        const num = parseFloat(val);
                        const col = num >= 14 ? '#22c55e' : num >= 10 ? C.blue : num >= 7 ? C.orange : C.red;
                        return (
                          <TableCell key={c.key} sx={{ py: 1.2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                              <Box sx={{ width: 26, height: 26, borderRadius: '7px', background: `${col}16`, border: `1px solid ${col}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 900, color: col }}>{val ?? '—'}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                        );
                      }

                      if (c.key === 'pct_risque') {
                        const num = parseFloat(val);
                        const col = num > 50 ? C.red : num > 35 ? C.orange : '#22c55e';
                        return (
                          <TableCell key={c.key} sx={{ py: 1.2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ flex: 1, maxWidth: 60, height: 5, borderRadius: 3, background: '#f0f0f0', overflow: 'hidden' }}>
                                <Box sx={{ height: '100%', width: `${Math.min(num, 100)}%`, background: col, borderRadius: 3 }} />
                              </Box>
                              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: col }}>{num}%</Typography>
                            </Box>
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell key={c.key} sx={{ py: 1.2, fontSize: '0.77rem', color: '#374151', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {val ?? '—'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* ── Pied de page ── */}
        <Divider sx={{ mb: 3, borderColor: C.blueL }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: '9px',
              background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem',
            }}>
              🎓
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '0.82rem' }}>SIAPET</Typography>
              <Typography sx={{ color: '#8A9BB0', fontSize: '0.68rem' }}>Système d'Information pour l'Enseignement Supérieur — Tunisie</Typography>
            </Box>
          </Box>
          <Typography sx={{ color: '#8A9BB0', fontSize: '0.72rem' }}>
            Document généré le {now} · {rows.length} enregistrements · Confidentiel
          </Typography>
        </Box>
      </Box>
    </>
  );
}
