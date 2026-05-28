import sys
fname = r'C:\Users\benha\Downloads\SIAPET\Sprint3-ML-main\frontend\src\pages\DetailDepartement.jsx'
with open(fname, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Old header:  lines[529..597] (0-indexed, inclusive)
# Blank+ML:    lines[598..904]
# Old hero:    lines[905..973] (REMOVE)
# After:       lines[974:]     (but skip extra blank, start from 975)

NEW_HEADER = """\
      {/* ══ HEADER ════════════════════════════════ */}
      <Card sx={{
        borderRadius: '22px', border: `1.5px solid ${C.blueL}`,
        boxShadow: '0 4px 16px rgba(26,58,107,0.08)',
        overflow: 'hidden', mb: 3,
      }}>
        {/* Cover gradient */}
        <Box sx={{
          height: 96,
          background: `linear-gradient(135deg, ${C.blueL} 0%, #D6EEFF 60%, #EAF4FF 100%)`,
          position: 'relative',
          '&::before': {
            content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
            background: `linear-gradient(90deg, ${C.blue}, ${C.blueB}, ${C.green})`,
          },
          '&::after': {
            content: '""', position: 'absolute', inset: 0,
            backgroundImage: `radial-gradient(circle, ${C.blue}14 1px, transparent 1px)`,
            backgroundSize: '22px 22px',
          },
        }} />
        {/* Identity row */}
        <Box sx={{ px: 3.5, pb: 2.5, display: 'flex', alignItems: 'flex-end', gap: 2.5, mt: '-40px', position: 'relative', zIndex: 2 }}>
          <Box sx={{
            width: 76, height: 76, borderRadius: '20px',
            border: '4px solid #fff',
            background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.9rem', flexShrink: 0,
            boxShadow: `0 6px 22px ${C.blue}35`,
          }}>
            🏛️
          </Box>
          <Box sx={{ pb: 0.5, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.5 }}>
              <Typography
                onClick={() => backPath ? navigate(backPath) : navigate(-1)}
                sx={{ fontSize: '0.72rem', color: C.blue, fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              >
                {breadcrumbLabel}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0' }}>›</Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#8A9BB0', fontWeight: 500 }}>{departement.code_departement}</Typography>
            </Box>
            <Typography sx={{ fontWeight: 900, fontSize: '1.25rem', color: C.navy, mb: 0.6, letterSpacing: '-0.4px' }}>
              {departement.nom_departement}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="DÉPARTEMENT" size="small"
                sx={{ background: C.blueL, color: C.blue, fontWeight: 700, fontSize: '0.72rem', border: `1px solid ${C.blue}28`, borderRadius: '8px', height: 22 }} />
              <Chip label="● Actif" size="small"
                sx={{ background: '#d1fae5', color: '#065f46', fontWeight: 700, fontSize: '0.72rem', borderRadius: '8px', height: 22, border: '1px solid #a7f3d0' }} />
              <Typography sx={{ fontSize: '0.78rem', color: '#8A9BB0', fontWeight: 500 }}>
                {departement.nom_etablissement}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, pb: 0.5, flexShrink: 0 }}>
            {[
              { label: 'Étudiants',    value: departement.nombre_etudiants   || 0, color: C.blue   },
              { label: 'Enseignants',  value: departement.nombre_enseignants  || 0, color: C.green  },
              { label: 'Spécialités',  value: departement.nombre_specialites  || 0, color: C.purple },
            ].map((s, i) => (
              <Box key={i} sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                px: 2, py: 1.2, borderRadius: '12px',
                background: `${s.color}08`, border: `1.5px solid ${s.color}20`,
                minWidth: 68, transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 5px 14px ${s.color}18`, background: `${s.color}12` },
              }}>
                <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', color: s.color, lineHeight: 1 }}>{s.value}</Typography>
                <Typography sx={{ fontSize: '0.62rem', color: '#8A9BB0', mt: 0.4, fontWeight: 600 }}>{s.label}</Typography>
              </Box>
            ))}
            <Box sx={{ display: 'flex', gap: 0.75 }}>
              <Tooltip title={tabHasData ? 'Exporter en CSV' : 'Aucune donnée'}>
                <span>
                  <IconButton onClick={handleExportCSV} disabled={!tabHasData}
                    sx={{ width: 44, height: 44, borderRadius: '14px', background: '#F0FDF4', border: '2px solid #86EFAC', color: C.green, transition: 'all 0.3s ease',
                      '&:hover': { background: '#DCFCE7', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(6, 214, 160, 0.25)' },
                      '&.Mui-disabled': { background: '#F1F5F9', border: '2px solid #E2E8F0', color: '#94A3B8' } }}>
                    <FileDownload sx={{ fontSize: 20 }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Retour">
                <IconButton onClick={() => backPath ? navigate(backPath) : navigate(-1)}
                  sx={{ width: 44, height: 44, borderRadius: '14px', background: '#F0F4FF', border: '2px solid rgba(59,130,246,0.25)', color: '#3B82F6', transition: 'all 0.3s ease',
                    '&:hover': { background: 'rgba(59,130,246,0.12)', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(59,130,246,0.15)' } }}>
                  <ArrowBack sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Card>
"""

before      = lines[:529]       # unchanged before old header comment
blank_ml    = lines[598:905]    # blank line + ML section + blank before hero card
after       = lines[975:]       # info grid and rest (skip extra blank at 974)

new_content = ''.join(before) + NEW_HEADER + ''.join(blank_ml) + ''.join(after)

with open(fname, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f'Done. New total lines: {len(new_content.splitlines())}')
