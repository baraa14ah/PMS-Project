/** أنماط مشتركة لصفحات الدخول والتسجيل */
export const AUTH_COLORS = {
  navy: "#0B1220",
  slate: "#1E293B",
  blue: "#3B82F6",
  teal: "#14B8A6",
  muted: "#6B7280",
  border: "#E2E8F0",
  bg: "#F7F8FA",
};

export const authFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.5,
    transition: "box-shadow 0.2s, border-color 0.2s",
    "&.Mui-focused": {
      boxShadow: `0 0 0 3px rgba(59, 130, 246, 0.18)`,
    },
  },
};

export const authPrimaryBtnSx = {
  mt: 3,
  borderRadius: 2.5,
  py: 1.5,
  fontWeight: 900,
  fontSize: 16,
  textTransform: "none",
  color: "#FFFFFF !important",
  background: `linear-gradient(135deg, ${AUTH_COLORS.navy} 0%, ${AUTH_COLORS.slate} 100%)`,
  boxShadow: "0 8px 24px rgba(15,23,42,0.25)",
  transition: "transform 0.15s, box-shadow 0.2s",
  "&:hover": {
    color: "#FFFFFF !important",
    background: `linear-gradient(135deg, #0F172A 0%, #334155 100%)`,
    boxShadow: "0 12px 28px rgba(15,23,42,0.3)",
  },
  "&:active": { transform: "scale(0.98)" },
  "&.Mui-disabled": {
    color: "rgba(255,255,255,0.7) !important",
    background: "#94A3B8",
    boxShadow: "none",
  },
  "& .MuiButton-startIcon, & .MuiButton-endIcon": {
    color: "#FFFFFF !important",
  },
};

export const roleCardSx = (selected, color) => ({
  p: 2,
  borderRadius: 3,
  cursor: "pointer",
  border: "2px solid",
  borderColor: selected ? color : AUTH_COLORS.border,
  bgcolor: selected ? `${color}14` : "white",
  transition: "all 0.2s ease",
  transform: selected ? "scale(1.02)" : "scale(1)",
  boxShadow: selected ? `0 8px 24px ${color}22` : "none",
  "&:hover": {
    borderColor: color,
    bgcolor: `${color}0A`,
  },
});
