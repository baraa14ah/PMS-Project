import { createTheme } from "@mui/material/styles";

const NAVY = "#0B1220";
const BLUE = "#3B82F6";
const TEAL = "#14B8A6";

export const brandColors = { navy: NAVY, blue: BLUE, teal: TEAL, bg: "#F7F8FA", border: "#E2E8F0" };

export const getDesignTokens = (mode, direction = "rtl", lang = "ar") => ({
  direction,
  palette: {
    mode,
    ...(mode === "light"
      ? {
          primary: { main: NAVY, contrastText: "#fff" },
          secondary: { main: BLUE },
          success: { main: TEAL },
          background: { default: "#F7F8FA", paper: "#FFFFFF" },
          text: { primary: NAVY, secondary: "#64748B" },
          divider: "#E2E8F0",
        }
      : {
          primary: { main: "#F1F5F9", contrastText: NAVY },
          secondary: { main: "#60A5FA" },
          success: { main: "#2DD4BF" },
          background: { default: NAVY, paper: "#1E293B" },
          text: { primary: "#F1F5F9", secondary: "#94A3B8" },
          divider: "#334155",
        }),
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      lang === "en"
        ? [
            "Inter",
            "system-ui",
            "-apple-system",
            "Segoe UI",
            "Roboto",
            "Cairo",
            "Arial",
            "sans-serif",
          ].join(",")
        : [
            "Cairo",
            "Inter",
            "system-ui",
            "-apple-system",
            "Segoe UI",
            "Roboto",
            "Arial",
            "sans-serif",
          ].join(","),
    h3: { fontWeight: 900, letterSpacing: -0.5 },
    h4: { fontWeight: 900, letterSpacing: -0.3 },
    h5: { fontWeight: 800 },
    button: { fontWeight: 800, textTransform: "none" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: mode === "light" ? "#F7F8FA" : NAVY,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: `1px solid ${mode === "light" ? "#E2E8F0" : "#334155"}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10 },
        contained: {
          color: "#FFFFFF !important",
          "& .MuiButton-startIcon, & .MuiButton-endIcon": {
            color: "#FFFFFF !important",
          },
        },
        containedPrimary: {
          color: "#FFFFFF !important",
          background: `linear-gradient(135deg, ${NAVY} 0%, #1E293B 100%)`,
          boxShadow: mode === "light" ? "0 8px 24px rgba(11,18,32,0.2)" : "none",
          "&:hover": {
            color: "#FFFFFF !important",
            background: `linear-gradient(135deg, #1E293B 0%, #334155 100%)`,
          },
          "&.Mui-disabled": {
            color: "rgba(255,255,255,0.45) !important",
          },
        },
        containedSuccess: {
          color: "#FFFFFF !important",
          "&:hover": { color: "#FFFFFF !important" },
        },
        containedSecondary: {
          color: "#FFFFFF !important",
          "&:hover": { color: "#FFFFFF !important" },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          "&.MuiTypography-root": {},
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderInlineEnd: `1px solid ${mode === "light" ? "#E2E8F0" : "#334155"}`,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          "&.Mui-selected": {
            backgroundColor: mode === "light" ? "rgba(59, 130, 246, 0.12)" : "rgba(59, 130, 246, 0.2)",
            "&:hover": {
              backgroundColor: mode === "light" ? "rgba(59, 130, 246, 0.16)" : "rgba(59, 130, 246, 0.25)",
            },
          },
        },
      },
    },
  },
});
