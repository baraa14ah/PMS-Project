import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#111827" }, // نفس الأسود الفخم
    secondary: { main: "#2563EB" }, // أزرق حديث للـ accents
    background: {
      default: "#F7F8FA",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#111827",
      secondary: "#6B7280",
    },
    divider: "#E6E8EC",
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: [
      "Inter",
      "system-ui",
      "-apple-system",
      "Segoe UI",
      "Roboto",
      "Arial",
      "sans-serif",
      "Cairo",
    ].join(","),
    h3: { fontWeight: 900, letterSpacing: -0.8 },
    h4: { fontWeight: 900, letterSpacing: -0.4 },
    h5: { fontWeight: 900 },
    button: { fontWeight: 900, textTransform: "none" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "#F7F8FA" },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: "1px solid #E6E8EC",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12 },
        containedPrimary: {
          boxShadow: "0 12px 30px rgba(0,0,0,0.14)",
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: "medium" },
    },
  },
});

export default theme;
