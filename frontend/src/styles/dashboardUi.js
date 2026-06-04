import { alpha } from "@mui/material";

export const NAVY = "#0B1220";
export const BLUE = "#3B82F6";

/** أزرار داكنة — نص أبيض دائماً */
export const btnPrimarySx = {
  bgcolor: NAVY,
  color: "#FFFFFF !important",
  fontWeight: 800,
  "&:hover": { bgcolor: "#1E293B" },
  "&.Mui-disabled": { color: "rgba(255,255,255,0.5) !important" },
};

export const btnOnGradientSx = {
  color: "#FFFFFF",
  borderColor: "rgba(255,255,255,0.45)",
  fontWeight: 800,
  "&:hover": { borderColor: "#FFFFFF", bgcolor: "rgba(255,255,255,0.1)" },
};

export const dashboardCardSx = {
  height: "100%",
  borderRadius: 3,
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
  boxShadow: "0 4px 20px rgba(15,23,42,0.06)",
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  "&:hover": {
    transform: "translateY(-3px)",
    boxShadow: "0 12px 28px rgba(15,23,42,0.1)",
  },
};

export const sectionPaperSx = {
  p: { xs: 2, md: 2.5 },
  mb: 3,
  borderRadius: 3,
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
  boxShadow: "0 2px 12px rgba(15,23,42,0.04)",
};

export const accentTop = (color) => ({
  borderTop: `4px solid ${color}`,
});
