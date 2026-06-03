import { createTheme } from "@mui/material/styles";

// حولناها إلى دالة تستقبل (mode) لتقرر الألوان
export const getDesignTokens = (mode) => ({
  // 🎯 إضافة اتجاه النص الافتراضي ليكون مدعوماً في الثيم
  direction: "rtl",

  palette: {
    mode,
    ...(mode === "light"
      ? {
          // ألوانك الأصلية (الوضع الفاتح)
          primary: { main: "#111827" },
          secondary: { main: "#2563EB" },
          background: { default: "#F7F8FA", paper: "#FFFFFF" },
          text: { primary: "#111827", secondary: "#6B7280" },
          divider: "#E6E8EC",
        }
      : {
          // الألوان الجديدة (الوضع الداكن الأنيق)
          primary: { main: "#F9FAFB" }, // أبيض للوضع الداكن
          secondary: { main: "#3B82F6" }, // أزرق فاقع قليلاً
          background: { default: "#111827", paper: "#1F2937" }, // خلفيات داكنة
          text: { primary: "#F9FAFB", secondary: "#9CA3AF" }, // نصوص فاتحة
          divider: "#374151",
        }),
  },
  // تخصيصاتك الأصلية تبقى كما هي للوضعين!
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
        // تغيير لون الخلفية الأساسية حسب الوضع
        body: {
          backgroundColor: mode === "light" ? "#F7F8FA" : "#111827",
          unicodeBidi: "isolate", // 🎯 حماية كل نصوص الموقع (div, span, p)
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          unicodeBidi: "isolate", // 🎯 حماية مكونات النصوص الخاصة بـ MUI
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: `1px solid ${mode === "light" ? "#E6E8EC" : "#374151"}`,
          backgroundImage: "none", // لمنع التأثير الرمادي المزعج في الوضع الداكن
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          unicodeBidi: "isolate", // 🎯 حماية النصوص داخل الأزرار
        },
        containedPrimary: {
          boxShadow:
            mode === "light"
              ? "0 12px 30px rgba(0,0,0,0.14)"
              : "0 8px 20px rgba(0,0,0,0.5)",
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: "medium" },
    },
  },
});
