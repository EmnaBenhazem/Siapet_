import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button,
  Grid, Card, CardContent, keyframes,
} from '@mui/material';

// ── PALETTE ───────────────────────────────────────
const C = {
  navy:   '#1A3A6B',
  navyD:  '#0F2549',
  blue:   '#4D9FFF',
  blueB:  '#85BFFF',
  blueL:  '#EAF4FF',
  blueD:  '#1A6FD4',
  orange: '#FF6B35',
  green:  '#06D6A0',
  greenD: '#04B884',
  purple: '#7B2CBF',
  yellow: '#FFD60A',
  coral:  '#D85A30',
  coralL: '#F0997B',
  coralD: '#993C1D',
};

// ── KEYFRAMES ─────────────────────────────────────
const fadeUp = keyframes`
  from { opacity:0; transform:translateY(32px); }
  to   { opacity:1; transform:translateY(0); }
`;
const floatY = keyframes`
  0%,100% { transform:translateY(0px); }
  50%      { transform:translateY(-16px); }
`;
const spinCW = keyframes`
  from { transform:rotate(0deg); }
  to   { transform:rotate(360deg); }
`;
const blinkDot = keyframes`
  0%,100% { opacity:1; } 50% { opacity:0.2; }
`;
const shimmer = keyframes`
  0%   { background-position:0% 50%; }
  50%  { background-position:100% 50%; }
  100% { background-position:0% 50%; }
`;
const popIn = keyframes`
  from { opacity:0; transform:scale(0.6) translateY(16px); }
  to   { opacity:1; transform:scale(1) translateY(0); }
`;
const floatEmoji = keyframes`
  0%,100% { transform:translateY(0px) rotate(0deg); }
  50%      { transform:translateY(-5px) rotate(8deg); }
`;
const slideArrow = keyframes`
  0%,100% { transform:translateX(0); }
  50%      { transform:translateX(5px); }
`;
const spinStar = keyframes`
  0%   { transform:rotate(0deg) scale(1); }
  50%  { transform:rotate(180deg) scale(1.3); }
  100% { transform:rotate(360deg) scale(1); }
`;
const shimmerCoral = keyframes`
  0%   { background-position:-200% center; }
  100% { background-position:200% center; }
`;
const glowBlue = keyframes`
  0%,100% { box-shadow:0 4px 20px rgba(77,159,255,0.30); }
  50%      { box-shadow:0 4px 36px rgba(77,159,255,0.60), 0 0 0 4px rgba(77,159,255,0.10); }
`;
const bounceDot = keyframes`
  0%,80%,100% { transform:translateY(0); }
  40%          { transform:translateY(-6px); }
`;
const gradMove = keyframes`
  0%,100% { background-position:0% 50%; }
  50%      { background-position:100% 50%; }
`;
const shimmerLine = keyframes`
  0%   { background-position:-200% center; }
  100% { background-position: 200% center; }
`;

// ── BUTTON STYLES ─────────────────────────────────

/** Navbar — bleu navy */
const btnNavbar = {
  ml: 1, px: 3, py: 1.1,
  borderRadius: '14px',
  fontWeight: 700, fontSize: '1rem',
  color: '#fff', border: 'none',
  background: C.navy,
  display: 'inline-flex', alignItems: 'center', gap: '8px',
  transition: 'all 0.25s ease', position: 'relative', overflow: 'hidden',
  '& .nav-emoji': { fontSize: '15px', display: 'inline-block' },
  '&::after': { content: '""', position: 'absolute', top: '-50%', left: '-70%', width: '40%', height: '200%', background: 'rgba(255,255,255,0.20)', transform: 'skewX(-20deg)', transition: 'left 0.5s ease' },
  '&:hover::after': { left: '130%' },
  '&:hover': { transform: 'translateY(-2px)', color: '#fff', background: '#2A4A7A' },
};

/** Hero principal — bleu navy */
const btnPrimary = {
  px: 5, py: 1.8,
  borderRadius: '14px',
  fontWeight: 800, fontSize: '1rem',
  color: '#fff', border: 'none',
  background: C.navy,
  display: 'inline-flex', alignItems: 'center', gap: '10px',
  transition: 'transform 0.2s ease, background 0.2s ease',
  position: 'relative', overflow: 'hidden',
  '& .p-emoji': { fontSize: '18px', display: 'inline-block' },
  '& .p-arrow': { display: 'inline-block' },
  '&::after': { content: '""', position: 'absolute', top: '-50%', left: '-70%', width: '40%', height: '200%', background: 'rgba(255,255,255,0.18)', transform: 'skewX(-20deg)', transition: 'left 0.5s ease' },
  '&:hover::after': { left: '130%' },
  '&:hover': { transform: 'translateY(-3px) scale(1.03)', color: '#fff', background: '#2A4A7A' },
};

/** Hero secondaire — glassmorphism bleu */
const btnSecondary = {
  px: 5, py: 1.8,
  borderRadius: '14px',
  fontWeight: 700, fontSize: '1rem',
  color: C.navy,
  background: 'rgba(234,244,255,0.75)',
  border: `1.5px solid rgba(77,159,255,0.35)`,
  backdropFilter: 'blur(10px)',
  display: 'inline-flex', alignItems: 'center', gap: '10px',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: C.blue,
    background: 'rgba(77,159,255,0.12)',
    color: C.navy,
    transform: 'translateY(-2px)',
    boxShadow: `0 6px 20px rgba(77,159,255,0.22)`,
  },
};

/** CTA — bleu navy avec contour clair */
const btnCTA = {
  px: 8, py: 2.2,
  borderRadius: '50px',
  fontWeight: 800, fontSize: '1.1rem',
  color: '#fff', 
  border: `2px solid rgba(255,255,255,0.3)`,
  background: C.navy,
  display: 'inline-flex', alignItems: 'center', gap: '12px',
  letterSpacing: '0.5px',
  transition: 'transform 0.2s ease, border-color 0.2s ease',
  '& .cta-emoji': { fontSize: '20px', display: 'inline-block' },
  '&:hover': { 
    transform: 'translateY(-4px) scale(1.05)', 
    color: '#fff',
    borderColor: 'rgba(255,255,255,0.5)',
  },
};

// ── STATIC DOTS ──────────────────────────────────
const StaticDots = () => (
  <Box sx={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
    {[0, 1, 2].map((i) => (
      <Box key={i} sx={{
        width: 6, height: 6, borderRadius: '50%', background: C.blueD,
      }} />
    ))}
  </Box>
);





// ── ANIMATED COUNTER ──────────────────────────────
const AnimCounter = ({ end, suffix = '' }) => {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const done = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        let cur = 0;
        const step = Math.ceil(end / 55);
        const t = setInterval(() => {
          cur = Math.min(cur + step, end);
          setVal(cur);
          if (cur >= end) clearInterval(t);
        }, 22);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
};

// ── MAIN ──────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [hovCard, setHovCard] = useState(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const goto = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const navLinks = [
    { label: 'Accueil',         id: 'hero'     },
    { label: 'Fonctionnalités', id: 'features' },
    { label: 'À propos',        id: 'cta'      },
  ];

  const features = [
    { icon: '👨‍💼', title: 'Administrateurs', desc: "Vue d'ensemble nationale, KPIs en temps réel, carte géographique interactive et identification des établissements à risque.", color: C.coral  },
    { icon: '🎓',  title: 'Recteurs',         desc: "Gestion universitaire complète, supervision des établissements, allocation budgétaire et rapports stratégiques.",             color: C.blue   },
    { icon: '🏛️', title: 'Directeurs',        desc: "Tableau de bord personnalisé, analyse comparative par filière et système d'alertes intelligent.",                             color: C.blueD  },
    { icon: '👨‍🏫', title: 'Enseignants',      desc: "Statistiques par classe, identification des étudiants à risque et recommandations pédagogiques propulsées par l'IA.",        color: C.green  },
    { icon: '👨‍🎓', title: 'Étudiants',        desc: "Suivi personnalisé de progression, radar des compétences et recommandations d'apprentissage sur mesure.",                    color: C.orange },
    { icon: '📊',  title: 'Analytics',         desc: "Visualisations interactives, tendances temporelles, analyses comparatives et exports personnalisables.",                      color: C.blueB  },
  ];

  const stats = [
    { end: 10000, suffix: '+', label: 'Étudiants actifs', icon: '🎓', color: C.coral, metric: '+18% vs année précédente' },
    { end: 150,   suffix: '+', label: 'Établissements', icon: '🏛️', color: C.blue, metric: '+34 nouveaux en 2025' },
    { end: 95,    suffix: '%', label: 'Taux de satisfaction', icon: '⭐', color: C.green, metric: '+7pts depuis le lancement' },
    { end: 12,    suffix: '%', label: 'Amélioration moy. résultats', icon: '📈', color: C.yellow, metric: 'Mesuré sur 6 mois' },
  ];

  return (
    <Box sx={{ background: '#F4F8FF', overflowX: 'hidden' }}>

      {/* ══ NAVBAR ══════════════════════════════ */}
      <Box component="nav" sx={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(22px)',
        borderBottom: `1.5px solid ${scrolled ? C.blueL : 'transparent'}`,
        boxShadow: scrolled ? `0 4px 28px rgba(77,159,255,0.10)` : 'none',
        transition: 'all 0.32s ease',
        px: { xs: 3, md: 8 },
        display: 'flex', alignItems: 'center',
        height: 68,
      }}>
        <Box onClick={() => goto('hero')} sx={{ display: 'flex', alignItems: 'center', gap: 1.2, cursor: 'pointer', mr: 'auto' }}>
          <Typography sx={{
            fontWeight: 900, fontSize: '2rem', letterSpacing: '-0.8px',
            color: C.navy,
          }}>SIAPET</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {navLinks.map(({ label, id }) => (
            <Typography key={id} onClick={() => goto(id)} sx={{
              color: C.navy, fontWeight: 600, cursor: 'pointer',
              fontSize: '1.1rem', position: 'relative', py: 0.5,
              transition: 'color 0.25s',
              '&:hover': { color: C.navy },
              '&::after': {
                content: '""', position: 'absolute',
                bottom: 0, left: '50%', transform: 'translateX(-50%)',
                height: '2px', width: 0, borderRadius: '2px',
                background: `linear-gradient(90deg, ${C.blue}, ${C.coral})`,
                transition: 'width 0.28s ease',
              },
              '&:hover::after': { width: '100%' },
            }}>{label}</Typography>
          ))}
          <Button onClick={() => navigate('/login')} sx={btnNavbar}>
            <Box component="span" className="nav-emoji">🚀</Box>
            Commencer
            <Box component="span">→</Box>
          </Button>
        </Box>
      </Box>

      {/* ══ HERO ════════════════════════════════ */}
      <Box id="hero" sx={{
        minHeight: '92vh', display: 'flex', alignItems: 'center',
        pt: { xs: 8, md: 10 }, pb: { xs: 8, md: 10 },
        position: 'relative', overflow: 'hidden',
        background: `radial-gradient(ellipse 90% 80% at 50% 0%, ${C.blueL} 0%, #F4F8FF 65%)`,
      }}>
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `radial-gradient(${C.blue}18 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />
        {[
          { w: 460, top: '-8%',    right: '-6%', c: C.blue,  d: '0s',   dur: '11s' },
          { w: 340, bottom: '-4%', left:  '-4%', c: C.coral, d: '1.5s', dur: '14s' },
          { w: 220, top: '35%',    right: '14%', c: C.green, d: '3s',   dur: '9s'  },
        ].map((b, i) => (
          <Box key={i} sx={{
            position: 'absolute', width: b.w, height: b.w,
            top: b.top, bottom: b.bottom, left: b.left, right: b.right,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${b.c}18 0%, transparent 72%)`,
            animation: `${floatY} ${b.dur} ease-in-out infinite`,
            animationDelay: b.d, pointerEvents: 'none',
          }} />
        ))}

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={8} alignItems="center">
            <Grid item xs={12} md={6}>
              {/* Badge */}
              <Box sx={{
                display: 'inline-flex', alignItems: 'center', gap: 1,
                background: '#fff', border: `1.5px solid ${C.blueL}`,
                px: 2.2, py: 0.9, borderRadius: '50px', mb: 3.5,
                boxShadow: `0 4px 18px ${C.blue}12`,
                animation: `${fadeUp} 0.6s ease-out 0.1s both`,
              }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: C.blueD }} />
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: C.blueD, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                  Plateforme Active · Tunisie 2026
                </Typography>
              </Box>

              <Typography sx={{ fontSize: { xs: '2.6rem', md: '4rem' }, fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2px', color: C.navy, mb: 0.5, animation: `${fadeUp} 0.6s ease-out 0.2s both` }}>
                L'avenir de
              </Typography>
              <Typography sx={{
                fontSize: { xs: '2.6rem', md: '4rem' }, fontWeight: 900,
                lineHeight: 1.08, letterSpacing: '-2px', mb: 0.5,
                background: `linear-gradient(90deg, ${C.blue}, ${C.coral})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                animation: `${fadeUp} 0.6s ease-out 0.3s both`,
              }}>l'analyse éducative</Typography>
              <Typography sx={{ fontSize: { xs: '2.6rem', md: '4rem' }, fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2px', color: C.navy, mb: 3.5, animation: `${fadeUp} 0.6s ease-out 0.4s both` }}>
                commence ici.
              </Typography>

              <Typography sx={{ color: '#5A6878', fontSize: '1.05rem', lineHeight: 1.85, mb: 4.5, maxWidth: 470, animation: `${fadeUp} 0.6s ease-out 0.5s both` }}>
                <Box component="strong" sx={{ color: C.navy }}>SIAPET</Box> — plateforme
                intelligente pour l'analyse des performances éducatives en Tunisie,
                propulsée par l'intelligence artificielle.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', animation: `${fadeUp} 0.6s ease-out 0.6s both` }}>
                <Button onClick={() => navigate('/login')} sx={btnPrimary}>
                  <Box component="span" className="p-emoji">✨</Box>
                  Se connecter
                  <Box component="span" className="p-arrow">→</Box>
                </Button>
                <Button onClick={() => goto('features')} sx={btnSecondary}>
                  <StaticDots />
                  Voir les fonctionnalités
                </Button>
              </Box>
            </Grid>

            {/* RIGHT VISUAL */}
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
              <Box sx={{ position: 'relative', width: 520, height: 520 }}>
                {[
                  { top: 20, right: -22, rot: '-9deg', bdr: C.coral + '40' },
                  { top: 10, right:   8, rot: '-3deg', bdr: C.blue  + '28' },
                ].map((c, i) => (
                  <Box key={i} sx={{
                    position: 'absolute', width: 380, height: 240,
                    top: c.top, right: c.right, borderRadius: '22px',
                    background: '#fff', border: `1.5px solid ${c.bdr}`,
                    boxShadow: '0 8px 28px rgba(0,0,0,0.06)',
                    transform: `rotate(${c.rot})`,
                    animation: `${floatY} ${10 + i * 3}s ease-in-out infinite`,
                    animationDelay: `${i * 0.6}s`,
                  }} />
                ))}

                {/* Dashboard card */}
                <Box sx={{
                  position: 'absolute', top: 48, right: 0, width: 420,
                  borderRadius: '24px', background: '#fff',
                  border: `1.5px solid ${C.blueL}`,
                  boxShadow: `0 20px 60px rgba(77,159,255,0.14)`,
                  p: 3.5, animation: `${fadeUp} 0.8s ease-out 0.3s both`,
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, mt: 0.5 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '1.05rem' }}>Tableau de bord</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#9BAAB8', mt: 0.1 }}>Performances · 2026</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, background: `${C.green}12`, border: `1px solid ${C.green}28`, px: 1.5, py: 0.5, borderRadius: '50px' }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: C.green }} />
                      <Typography sx={{ fontSize: '0.75rem', color: C.green, fontWeight: 700 }}>En direct</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: 100, mb: 3 }}>
                    {[38, 55, 48, 72, 60, 94, 52].map((h, idx) => (
                      <Box key={idx} sx={{
                        flex: 1, height: `${h}%`, borderRadius: '6px 6px 0 0',
                        background: idx === 5
                          ? `linear-gradient(180deg, ${C.blue}, ${C.blueD})`
                          : idx === 3
                          ? `linear-gradient(180deg, ${C.coral}70, ${C.coral}40)`
                          : C.blueL,
                        border: (idx === 5 || idx === 3) ? 'none' : `1px solid ${C.blueL}`,
                      }} />
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.2 }}>
                    {[
                      { label: 'Moy. nationale', val: '78%',  c: C.blue  },
                      { label: 'Évolution',       val: '+12%', c: C.green },
                      { label: 'Établissements',  val: '150+', c: C.coral },
                    ].map(chip => (
                      <Box key={chip.label} sx={{
                        flex: 1, textAlign: 'center', borderRadius: '12px',
                        background: `${chip.c}0E`, border: `1px solid ${chip.c}25`, p: '8px 5px',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-2px)' },
                      }}>
                        <Typography sx={{ fontSize: '0.7rem', color: '#9BAAB8' }}>{chip.label}</Typography>
                        <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: chip.c }}>{chip.val}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* AI badge */}
                <Box sx={{
                  position: 'absolute', bottom: 120, left: -10,
                  background: `linear-gradient(135deg, ${C.navyD}, ${C.navy})`,
                  borderRadius: '18px', border: `1px solid ${C.blue}30`,
                  boxShadow: `0 8px 28px rgba(26,58,107,0.35)`,
                  px: 2.5, py: 1.8,
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  animation: `${fadeUp} 1s ease-out 1s both`,
                }}>
                  <Typography sx={{ fontSize: '1.4rem' }}>🤖</Typography>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Analyse IA</Typography>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>Prédiction précise</Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ══ STATS ════════════════════════════════ */}
      <Box sx={{
        background: `linear-gradient(160deg, ${C.navyD} 0%, ${C.navy} 55%, #1E4880 100%)`,
        py: 12, position: 'relative', overflow: 'hidden',
        '&::before': { content: '""', position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `radial-gradient(rgba(77,159,255,0.12) 1px, transparent 1px)`, backgroundSize: '26px 26px' },
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Box sx={{
              display: 'inline-block', background: C.navy,
              border: `1.5px solid ${C.blue}28`,
              color: '#fff', px: 2.5, py: 0.8, borderRadius: '50px',
              fontWeight: 700, fontSize: '0.75rem', letterSpacing: '2px',
              textTransform: 'uppercase', mb: 2.5,
              boxShadow: `0 3px 14px ${C.navy}12`,
            }}>Chiffres clés</Box>
            <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: { xs: '1.8rem', md: '2.4rem' }, letterSpacing: '-1px' }}>
              SIAPET en{' '}
              <Box component="span" sx={{ background: `linear-gradient(90deg, ${C.blue}, ${C.coral})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>chiffres</Box>
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {stats.map((s, i) => (
              <Grid item xs={6} md={3} key={i}>
                <Box sx={{
                  textAlign: 'left', p: { xs: 4, md: 5.5 },
                  borderRadius: '24px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  animation: `${popIn} 0.55s ease-out ${i * 0.1}s both`,
                  position: 'relative', overflow: 'hidden',
                  height: '280px', // Hauteur fixe pour toutes les cartes
                  display: 'flex', flexDirection: 'column',
                  '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: s.color, borderRadius: '24px 24px 0 0' },
                  '&:hover': { background: `${s.color}18`, border: `1px solid ${s.color}40`, transform: 'translateY(-10px)', boxShadow: `0 22px 55px ${s.color}28` },
                }}>
                  <Typography sx={{ fontSize: '2rem', mb: 2 }}>{s.icon}</Typography>
                  <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: { xs: '2.8rem', md: '3.4rem' }, lineHeight: 1, mb: 1, textShadow: `0 0 30px ${s.color}55` }}>
                    <AnimCounter end={s.end} suffix={s.suffix} />
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '2px', mb: 2, flex: 1 }}>
                    {s.label}
                  </Typography>
                  <Box sx={{ mt: 'auto' }}>
                    <Box sx={{ width: '60%', height: '3px', background: s.color, borderRadius: '2px', mb: 1.5 }} />
                    <Typography sx={{ color: s.color, fontWeight: 600, fontSize: '0.75rem' }}>
                      {s.metric}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ══ FEATURES ════════════════════════════ */}
      <Box id="features" sx={{ py: 13, background: '#F4F8FF' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Box sx={{
              display: 'inline-block', background: C.blueL,
              border: `1.5px solid ${C.blue}28`,
              color: C.blueD, px: 2.5, py: 0.8, borderRadius: '50px',
              fontWeight: 700, fontSize: '0.75rem', letterSpacing: '2px',
              textTransform: 'uppercase', mb: 2.5,
              boxShadow: `0 3px 14px ${C.blue}12`,
            }}>Fonctionnalités</Box>
            <Typography sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 900, letterSpacing: '-1.5px', color: C.navy, mb: 1.5 }}>
              Une plateforme pour{' '}
              <Box component="span" sx={{ background: `linear-gradient(135deg, ${C.blue}, ${C.coral})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                chaque acteur
              </Box>
            </Typography>
            <Typography sx={{ color: '#6B7C93', fontSize: '1.05rem', maxWidth: 580, mx: 'auto', lineHeight: 1.75 }}>
              Des outils puissants et intuitifs adaptés à chaque rôle dans l'écosystème éducatif tunisien.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {features.map((f, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Card
                  onMouseEnter={() => setHovCard(i)}
                  onMouseLeave={() => setHovCard(null)}
                  elevation={0}
                  sx={{
                    height: '100%', borderRadius: '20px', background: '#fff',
                    border: `1.5px solid ${hovCard === i ? f.color + '50' : '#E8EFF8'}`,
                    boxShadow: hovCard === i ? `0 20px 60px ${f.color}1A` : '0 3px 18px rgba(0,0,0,0.04)',
                    transform: hovCard === i ? 'translateY(-10px)' : 'none',
                    transition: 'all 0.32s cubic-bezier(0.4,0,0.2,1)',
                    position: 'relative', overflow: 'hidden',
                    animation: `${fadeUp} 0.55s ease-out ${i * 0.07}s both`,
                    '&::before': {
                      content: '""', position: 'absolute',
                      top: 0, left: 0, right: 0, height: '4px',
                      background: `linear-gradient(90deg, ${f.color}, ${C.blue})`,
                      borderRadius: '20px 20px 0 0',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3.5 }}>
                    <Box sx={{
                      width: 80, height: 80, borderRadius: '20px',
                      background: `${f.color}08`, border: `1px solid ${f.color}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '2.2rem', mb: 3,
                      transition: 'transform 0.28s ease',
                      transform: hovCard === i ? 'rotate(6deg) scale(1.12)' : 'none',
                    }}>{f.icon}</Box>
                    <Typography sx={{ fontWeight: 800, color: C.navy, fontSize: '1.3rem', mb: 2 }}>{f.title}</Typography>
                    <Typography sx={{ color: '#6B7C93', lineHeight: 1.75, fontSize: '0.95rem', mb: 3 }}>{f.desc}</Typography>
                    <Box sx={{
                      display: 'flex', alignItems: 'center', gap: 0.5,
                      color: f.color, fontWeight: 700, fontSize: '0.9rem',
                      cursor: 'pointer',
                      opacity: hovCard === i ? 1 : 0.7,
                      transform: hovCard === i ? 'translateX(0)' : 'translateX(-5px)',
                      transition: 'all 0.28s ease 0.05s',
                    }}>En savoir plus →</Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ══ CTA ═════════════════════════════════ */}
      <Box id="cta" sx={{
        py: 14, position: 'relative', overflow: 'hidden',
        background: `linear-gradient(155deg, ${C.navyD} 0%, ${C.navy} 55%, #1E4880 100%)`,
        '&::before': { content: '""', position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `radial-gradient(rgba(77,159,255,0.12) 1px, transparent 1px)`, backgroundSize: '26px 26px' },
      }}>

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '3.4rem', mb: 2, display: 'inline-block', animation: `${floatY} 4s ease-in-out infinite` }}>🚀</Typography>
          <Typography sx={{ fontSize: { xs: '2rem', md: '3.2rem' }, fontWeight: 900, letterSpacing: '-1.5px', color: '#fff', mb: 2 }}>
            Rejoignez{' '}
            <Box component="span" sx={{
              background: `linear-gradient(90deg, ${C.blue}, ${C.coral})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>SIAPET</Box>
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.58)', fontSize: '1.05rem', mb: 5.5, lineHeight: 1.8, maxWidth: 520, mx: 'auto' }}>
            Rejoignez des milliers d'établissements qui utilisent SIAPET pour améliorer
            leurs performances éducatives à travers la Tunisie.
          </Typography>

          {/* Stats rapides */}
          <Box sx={{ 
            mb: 5.5, 
            background: 'rgba(255,255,255,0.04)', 
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '20px',
            p: 4,
            backdropFilter: 'blur(10px)',
          }}>
            <Grid container spacing={4}>
              {[
                { value: '10K+', label: 'Étudiants', color: C.blue },
                { value: '150+', label: 'Établissements', color: C.coral },
                { value: '95%', label: 'Satisfaction', color: C.green },
                { value: '48h', label: 'Déploiement', color: C.yellow },
              ].map((stat, i) => (
                <Grid item xs={6} md={3} key={i}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ 
                      color: stat.color, 
                      fontWeight: 900, 
                      fontSize: { xs: '1.8rem', md: '2.2rem' }, 
                      lineHeight: 1, 
                      mb: 0.5 
                    }}>
                      {stat.value}
                    </Typography>
                    <Typography sx={{ 
                      color: 'rgba(255,255,255,0.6)', 
                      fontWeight: 600, 
                      fontSize: '0.75rem', 
                      textTransform: 'uppercase', 
                      letterSpacing: '1.5px' 
                    }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Button onClick={() => navigate('/login')} sx={btnCTA}>
            <Box component="span" className="cta-emoji">🎓</Box>
            Accéder à la plateforme →
          </Button>
        </Container>
      </Box>

      {/* ══ FOOTER ══════════════════════════════ */}
      <Box sx={{ py: 7, background: '#fff', borderTop: `2px solid #EDF2FA` }}>
        <Container maxWidth="lg">
          <Grid container spacing={5}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
                <Typography sx={{ fontWeight: 900, fontSize: '1.35rem', letterSpacing: '-0.5px', background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  SIAPET
                </Typography>
              </Box>
              <Typography sx={{ color: '#6B7C93', fontSize: '0.87rem', lineHeight: 1.7, mb: 1 }}>
                Système Intelligent d'Analyse Prédictive des Performances Éducatives
              </Typography>
              <Typography sx={{ color: '#A0AEC0', fontSize: '0.82rem' }}>Transformez vos données en insights actionnables.</Typography>
            </Grid>

            {[
              { title: 'Plateforme', links: ['Accueil', 'Fonctionnalités', 'À propos'] },
              { title: 'Ressources', links: ['Documentation', 'Support', 'FAQ'] },
              { title: 'Légal',      links: ['Confidentialité', 'Conditions', 'Mentions légales'] },
            ].map(col => (
              <Grid item xs={6} sm={4} md={2} key={col.title}>
                <Typography sx={{ fontWeight: 800, color: C.navy, mb: 2.5, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                  {col.title}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                  {col.links.map(l => (
                    <Typography key={l} sx={{ color: '#6B7C93', fontSize: '0.87rem', cursor: 'pointer', transition: 'all 0.22s ease', '&:hover': { color: C.blue, transform: 'translateX(4px)' } }}>
                      {l}
                    </Typography>
                  ))}
                </Box>
              </Grid>
            ))}

            <Grid item xs={6} sm={4} md={2}>
              <Typography sx={{ fontWeight: 800, color: C.navy, mb: 2.5, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Contact</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                <Typography sx={{ color: '#6B7C93', fontSize: '0.87rem' }}>siapet2026@gmail.com</Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 5, pt: 3.5, borderTop: '1.5px solid #EDF2FA', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography sx={{ color: '#A0AEC0', fontSize: '0.8rem' }}>© 2026 SIAPET — Tous droits réservés</Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              {['Confidentialité', "Conditions d'utilisation"].map(t => (
                <Typography key={t} sx={{ color: '#A0AEC0', fontSize: '0.8rem', cursor: 'pointer', transition: 'color 0.22s', '&:hover': { color: C.blue } }}>
                  {t}
                </Typography>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}