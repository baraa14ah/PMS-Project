import { alpha } from "@mui/material";
import { getRoleTheme } from "../config/roleTheme";

export const AUTH_PRIMARY_BTN_CLASS = "bytehub-btn-gradient";

/** Role-based background gradient for light or dark mode. */
export function resolveRoleGradient(roleName, mode = "light", gradientOverride) {
  const roleTheme = getRoleTheme(roleName);
  const light = gradientOverride || roleTheme.gradient;
  const dark = `linear-gradient(135deg, ${alpha("#0B1220", 0.95)} 0%, ${alpha(roleTheme.accent, 0.35)} 100%)`;
  return mode === "dark" ? dark : light;
}

/** Inline styles bypass stylis RTL so gradients stay visible in Arabic. */
export function rtlSafeGradientStyle(gradient, bgColor) {
  if (!gradient) return bgColor ? { backgroundColor: bgColor } : undefined;
  return {
    backgroundImage: gradient,
    backgroundColor: bgColor || "transparent",
  };
}

/** Gradient clipped to text (hero titles, etc.). */
export function rtlSafeTextGradientStyle(gradient) {
  if (!gradient) return undefined;
  return {
    backgroundImage: gradient,
    backgroundColor: "transparent",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: "transparent",
  };
}

/** Soft radial glow layers for auth page backgrounds. */
export function authPageBgRadials(blue = "#3B82F6", teal = "#14B8A6") {
  return `radial-gradient(700px 400px at 0% 0%, ${alpha(blue, 0.09)}, transparent 55%), radial-gradient(600px 350px at 100% 100%, ${alpha(teal, 0.08)}, transparent 50%)`;
}

export const GRADIENT = {
  landingHero: "linear-gradient(165deg, #0B1220 0%, #1E293B 45%, #0F2847 100%)",
  authBrand:
    "linear-gradient(160deg, #0B1220 0%, #0F2847 40%, #1E293B 100%)",
  authBrandShimmer:
    "linear-gradient(160deg, #0B1220 0%, #0F2847 40%, #1E293B 100%)",
  primaryBtn: "linear-gradient(135deg, #0B1220 0%, #1E293B 100%)",
  logoHero: "linear-gradient(135deg, #0B1220 0%, #1E3A5F 50%, #0F766E 100%)",
};

/** Dashboard logo gradient tinted by the active user role. */
export function logoRoleGradient(roleName) {
  const { accent } = getRoleTheme(roleName);
  return `linear-gradient(145deg, #0B1220 0%, ${alpha(accent, 0.5)} 50%, ${accent} 100%)`;
}
