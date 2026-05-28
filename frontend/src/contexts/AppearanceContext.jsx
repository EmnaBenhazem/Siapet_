import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createTheme } from '@mui/material/styles';

const AppearanceContext = createContext();

export const useAppearance = () => {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error('useAppearance must be used inside AppearanceProvider');
  return ctx;
};

const buildTheme = (mode) => createTheme({
  palette: {
    mode,
    primary:    { main: '#4D9FFF', light: '#85BFFF', dark: '#1A6FD4' },
    secondary:  { main: '#06D6A0' },
    error:      { main: '#EF4444' },
    warning:    { main: '#FF6B35' },
    success:    { main: '#06D6A0' },
    background: mode === 'dark'
      ? { default: '#0F172A', paper: '#1E293B' }
      : { default: '#F8FAFC', paper: '#FFFFFF' },
    text: mode === 'dark'
      ? { primary: '#F1F5F9', secondary: '#94A3B8' }
      : { primary: '#1F2937',  secondary: '#64748B' },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        body: {
          background: theme.palette.background.default,
          transition: 'background 0.3s ease, color 0.3s ease',
        },
      }),
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none',
          border: `1px solid ${mode === 'dark' ? '#334155' : '#E5E7EB'}`,
          boxShadow: 'none',
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 50 },
      },
    },
  },
});

const LANGS = [
  { code: 'fr', label: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', label: 'العربية',  flag: '🇹🇳', dir: 'rtl' },
  { code: 'en', label: 'English',  flag: '🇬🇧', dir: 'ltr' },
];

export { LANGS };

export const AppearanceProvider = ({ children }) => {
  const [mode,     setMode]     = useState(() => localStorage.getItem('app-theme')    || 'light');
  const [language, setLanguage] = useState(() => localStorage.getItem('app-language') || 'fr');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    document.body.setAttribute('data-theme', mode);
    localStorage.setItem('app-theme', mode);
  }, [mode]);

  useEffect(() => {
    const lang = LANGS.find(l => l.code === language) || LANGS[0];
    document.documentElement.lang = lang.code;
    document.documentElement.dir  = lang.dir;
    localStorage.setItem('app-language', language);
  }, [language]);

  const toggleMode  = () => setMode(m => m === 'light' ? 'dark' : 'light');
  const theme       = useMemo(() => buildTheme(mode), [mode]);

  return (
    <AppearanceContext.Provider value={{ mode, toggleMode, setMode, language, setLanguage, theme }}>
      {children}
    </AppearanceContext.Provider>
  );
};
