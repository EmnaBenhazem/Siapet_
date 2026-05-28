import { createTheme } from "@mui/material/styles";

// Palette de couleurs bleues modernes et professionnelles
export const colors = {
  // Couleurs principales - Tons bleus
  primary: "#1E70EB",
  primaryDark: "#0D4CB3",
  primaryLight: "#6FA3F5",
  secondary: "#9CBAF7",
  accent: "#4A8CE8",
  pale: "#E8F1FB",
  paleHover: "#D6E8F9",

  // Gradients
  gradientMain: "linear-gradient(135deg, #1E70EB 0%, #0D4CB3 100%)",
  gradientHero: "linear-gradient(135deg, #E8F1FB 0%, #D0E4F7 50%, #B8D4F5 100%)",
  gradientCool: "linear-gradient(135deg, #6FA3F5 0%, #1E70EB 100%)",
  gradientSoft: "linear-gradient(135deg, #E8F1FB 0%, #C5D9F9 100%)",

  // Couleurs de statut
  success: "#10B981",
  warning: "#F59E0B",
  error: "#F87171",
  info: "#60A5FA",

  // Backgrounds clairs
  background: {
    default: "#F8FAFC",
    paper: "#FFFFFF",
    light: "#E8F1FB",
  },

  // Texte
  text: {
    primary: "#2D3436",
    secondary: "#636E72",
    disabled: "#B2BEC3",
    white: "#FFFFFF",
  },

  // Bordures et ombres
  border: "#E2E8F0",
  shadow: "rgba(30, 112, 235, 0.15)",
};

const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary,
      light: colors.primaryLight,
      dark: colors.primaryDark,
    },
    secondary: {
      main: colors.secondary,
      light: colors.pale,
      dark: colors.accent,
    },
    success: {
      main: colors.success,
    },
    warning: {
      main: colors.warning,
    },
    error: {
      main: colors.error,
    },
    info: {
      main: colors.info,
    },
    background: {
      default: colors.background.default,
      paper: colors.background.paper,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
    },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Crimson Pro", serif',
      fontSize: "2.5rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontFamily: '"Crimson Pro", serif',
      fontSize: "2rem",
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 600,
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    "none",
    "0 2px 8px rgba(30, 112, 235, 0.08)",
    "0 4px 12px rgba(30, 112, 235, 0.10)",
    "0 8px 24px rgba(30, 112, 235, 0.12)",
    "0 12px 32px rgba(30, 112, 235, 0.14)",
    "0 16px 48px rgba(30, 112, 235, 0.16)",
    "0 20px 56px rgba(30, 112, 235, 0.18)",
    "0 24px 64px rgba(30, 112, 235, 0.20)",
    ...Array(17).fill("none"),
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 50,
          padding: "10px 24px",
          fontSize: "0.95rem",
          fontWeight: 600,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(30, 112, 235, 0.25)",
            transform: "translateY(-2px)",
          },
        },
        contained: {
          background: colors.gradientMain,
          color: "#FFFFFF",
          "&:hover": {
            background: colors.primaryDark,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: "0 2px 8px rgba(30, 112, 235, 0.08)",
          border: "none",
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: "0 8px 24px rgba(30, 112, 235, 0.12)",
            transform: "translateY(-4px)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 16,
            backgroundColor: "#FFFFFF",
            "&:hover fieldset": {
              borderColor: colors.primary,
            },
            "&.Mui-focused fieldset": {
              borderColor: colors.primary,
            },
          },
        },
      },
    },
  },
});

export default theme;
