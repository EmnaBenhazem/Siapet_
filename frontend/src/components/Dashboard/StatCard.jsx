import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';

// ── Exact palette from Landing / Login ────────────
const C = {
  navy:   '#1A3A6B',
  blue:   '#4D9FFF',
  blueB:  '#85BFFF',
  blueL:  '#EAF4FF',
  orange: '#FF6B35',
  green:  '#06D6A0',
  yellow: '#FFD60A',
  purple: '#7B2CBF',
};

const fadeUp = keyframes`
  from { opacity:0; transform:translateY(32px); }
  to   { opacity:1; transform:translateY(0);    }
`;

const iconBgMap = {
  coral:    { bg: '#FFF1EE', color: '#FF6B35' },
  mint:     { bg: '#E6FBF5', color: '#06D6A0' },
  lavender: { bg: '#F3EEFF', color: '#7B2CBF' },
  peach:    { bg: '#FFF7ED', color: '#F59E0B' },
};

export default function StatCard({ title, value, change, changeType, icon, iconBg, delay = 0 }) {
  const palette = iconBgMap[iconBg] || { bg: C.blueL, color: C.blue };
  
  return (
    <Card sx={{
      borderRadius: '20px', background: '#fff',
      border: `1.5px solid ${C.blueL}`,
      boxShadow: `0 2px 16px ${C.blue}0A`,
      animation: `${fadeUp} 0.55s ease-out ${delay}s both`,
      transition: 'all 0.32s cubic-bezier(0.4,0,0.2,1)',
      position: 'relative', overflow: 'hidden',
      height: '100%',
      '&::before': {
        content: '""', position: 'absolute',
        top: 0, left: 0, right: 0, height: '5px',
        background: palette.color,
        borderRadius: '20px 20px 0 0',
      },
      '&:hover': { transform: 'translateY(-6px)', boxShadow: `0 12px 36px ${palette.color}18` },
    }}>
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Typography sx={{ 
            color: '#8A9BB0', fontSize: '0.65rem', fontWeight: 700, 
            lineHeight: 1.3, textTransform: 'uppercase', letterSpacing: '1px',
            maxWidth: '65%',
          }}>
            {title}
          </Typography>
          <Box sx={{
            width: 44, height: 44, borderRadius: '12px',
            background: palette.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', flexShrink: 0,
            border: `1.5px solid ${palette.color}28`,
          }}>
            {icon}
          </Box>
        </Box>
        <Typography sx={{ fontWeight: 900, fontSize: '1.8rem', color: C.navy, letterSpacing: '-1.5px', mb: 'auto', lineHeight: 1 }}>
          {value}
        </Typography>
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.5,
          px: 1.5, py: 0.5, borderRadius: '16px',
          background: changeType === 'positive' ? `${C.green}15` : changeType === 'neutral' ? '#FFF0F0' : '#FFF0F0',
          color: changeType === 'positive' ? C.green : changeType === 'neutral' ? '#EF4444' : '#EF4444',
          fontSize: '0.68rem', fontWeight: 700,
          border: `1px solid ${changeType === 'positive' ? C.green + '28' : changeType === 'neutral' ? '#FFCDD2' : '#FFCDD2'}`,
          alignSelf: 'flex-start',
          mt: 2,
        }}>
          {change}
        </Box>
      </CardContent>
    </Card>
  );
}
