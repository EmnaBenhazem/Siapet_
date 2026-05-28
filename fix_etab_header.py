import sys
fname = r'C:\Users\benha\Downloads\SIAPET\Sprint3-ML-main\frontend\src\pages\DetailEtablissement.jsx'
with open(fname, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Structure (0-indexed):
#   lines[:521]      = everything up to and including the outer animation <Box> opening (line 521)
#   lines[521:637]   = old simple header (lines 522-637 in 1-indexed)
#   lines[637:875]   = blank + ML section (lines 638-875 in 1-indexed)
#   lines[875:1001]  = blank + old Hero Card (lines 876-1001 in 1-indexed) — REMOVE
#   lines[1001:]     = blank + Info Grid + rest

NEW_HEADER = """\
      {/* ══ HEADER ════════════════════════════════ */}
      <Card sx={{
        borderRadius: '22px',
        border: '1.5px solid ' + C.border,
        boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
        overflow: 'hidden',
        mb: 3,
      }}>
        {/* Cover */}
        <Box sx={{
          height: '110px',
          position: 'relative',
          background: 'radial-gradient(ellipse at 20% 60%, rgba(30,110,245,0.12) 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, rgba(14,165,233,0.1) 0%, transparent 50%), linear-gradient(135deg, #eef4ff 0%, #e0f2fe 100%)',
          '&::before': {
            content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
            background: 'linear-gradient(90deg, #1e6ef5, #0ea5e9)',
          },
          '&::after': {
            content: '""', position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(30,110,245,0.12) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          },
        }} />
        {/* Identity row */}
        <Box sx={{ px: 3.5, pb: 2.5, display: 'flex', alignItems: 'flex-end', gap: 2.25, mt: '-42px', position: 'relative', zIndex: 2 }}>
          <Box sx={{
            width: 76, height: 76, borderRadius: '20px',
            border: '4px solid #fff',
            background: 'linear-gradient(135deg, #1e6ef5, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '30px', flexShrink: 0,
            boxShadow: '0 6px 20px rgba(30,110,245,0.28)',
          }}>
            \U0001f3eb
          </Box>
          <Box sx={{ pb: 0.5, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.5 }}>
              <Typography
                onClick={() => navigate(isRecteur ? '/dashboard/recteur/etablissements' : '/dashboard/admin/etablissements')}
                sx={{ fontSize: '0.72rem', color: C.blue, fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              >
                Établissements
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0' }}>›</Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0', fontWeight: 500 }}>{etablissement.code_etablissement}</Typography>
            </Box>
            <Typography sx={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: '20px', color: C.textDark, mb: 0.75 }}>
              {etablissement.nom_etablissement}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875, flexWrap: 'wrap' }}>
              <Chip label={etablissement.type} size="small"
                sx={{ background: typeColors[etablissement.type]?.bg || C.tealL, color: typeColors[etablissement.type]?.color || '#075985', fontWeight: 700, fontSize: '11px', borderRadius: '20px', height: '24px' }} />
              <Chip label="● Actif" size="small"
                sx={{ background: C.greenL, color: '#065f46', fontWeight: 700, fontSize: '11px', borderRadius: '20px', height: '24px', border: '1px solid #a7f3d0' }} />
              <Typography sx={{ fontSize: '12px', color: C.textSoft, fontWeight: 500 }}>
                Code : <Box component="span" sx={{ color: C.blue, fontWeight: 700 }}>{etablissement.code_etablissement}</Box>
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, pb: 0.5, flexShrink: 0 }}>
            {[
              { label: 'Étudiants',    value: etablissement.effectif_total      || 0, color: C.navy    },
              { label: 'Enseignants',  value: etablissement.nombre_enseignants  || 0, color: '#10B981' },
              { label: 'Capacité max', value: etablissement.capacite_maximale   || 0, color: C.blue    },
            ].map((stat, i) => (
              <Box key={i} sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                p: '10px 16px', borderRadius: '12px',
                background: '#f8faff', border: '1.5px solid #dce8fd',
                minWidth: '72px', transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(30,110,245,0.12)', background: '#eef4ff' },
              }}>
                <Typography sx={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: '17px', color: stat.color, lineHeight: 1 }}>
                  {stat.value}
                </Typography>
                <Typography sx={{ fontSize: '10px', color: C.textSoft, mt: 0.375, fontWeight: 500 }}>{stat.label}</Typography>
              </Box>
            ))}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Tooltip title="Retour">
                <IconButton
                  onClick={() => navigate(isRecteur ? '/dashboard/recteur/etablissements' : '/dashboard/admin/etablissements')}
                  sx={{ width: 44, height: 44, borderRadius: '14px', background: C.blueL, border: `2px solid ${C.blue}40`, color: C.blue, transition: 'all 0.3s ease',
                    '&:hover': { background: `${C.blue}20`, transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${C.blue}25` } }}>
                  <ArrowBack sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Exporter en CSV">
                <IconButton
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('token');
                      const exportUrl = isRecteur
                        ? `${API_BASE_URL}/etablissements/recteur/export?id=${id}`
                        : `${API_BASE_URL}/etablissements/export?id=${id}`;
                      const response = await axios.get(exportUrl, {
                        headers: { Authorization: `Bearer ${token}` },
                        responseType: 'blob'
                      });
                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `etablissement_${etablissement.code_etablissement}_${Date.now()}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                    } catch (error) {
                      console.error('Erreur export:', error);
                      alert("Erreur lors de l'export");
                    }
                  }}
                  sx={{ width: 44, height: 44, borderRadius: '14px', background: '#F0FDF4', border: '2px solid #86EFAC', color: C.green, transition: 'all 0.3s ease',
                    '&:hover': { background: '#DCFCE7', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(6, 214, 160, 0.25)' } }}>
                  <FileDownload sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
              {!isRecteur && (
                <Tooltip title="Modifier l'établissement">
                  <IconButton
                    onClick={() => navigate(`/dashboard/admin/etablissements/modifier/${id}`)}
                    sx={{ width: 44, height: 44, borderRadius: '14px', background: '#FEF3C7', border: '2px solid #FDE68A', color: '#D97706', transition: 'all 0.3s ease',
                      '&:hover': { background: '#FDE68A', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)' } }}>
                    <Edit sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>
      </Card>
"""

before   = lines[:521]      # up to and including outer animation Box opening
ml       = lines[637:875]   # blank + ML section (M1 + M3 cards)
after    = lines[1001:]     # blank + Info Grid + rest (skip old hero card)

new_content = ''.join(before) + NEW_HEADER + ''.join(ml) + ''.join(after)

with open(fname, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f'Done. New total lines: {len(new_content.splitlines())}')
