import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";

/** Accent colors, gradients, and icons for each user role. */
export const ROLE_THEMES = {
  student: {
    accent: "#14B8A6",
    accentSoft: "rgba(20, 184, 166, 0.14)",
    gradient:
      "linear-gradient(135deg, #0B1220 0%, #0F4C47 48%, #14B8A6 100%)",
    labelKey: "roles.student",
    icon: SchoolRoundedIcon,
    chipColor: "success",
  },
  supervisor: {
    accent: "#3B82F6",
    accentSoft: "rgba(59, 130, 246, 0.14)",
    gradient:
      "linear-gradient(135deg, #0B1220 0%, #1E3A5F 52%, #3B82F6 100%)",
    labelKey: "roles.supervisor",
    icon: SupervisorAccountRoundedIcon,
    chipColor: "info",
  },
  admin: {
    accent: "#F59E0B",
    accentSoft: "rgba(245, 158, 11, 0.14)",
    gradient:
      "linear-gradient(135deg, #0B1220 0%, #422006 45%, #D97706 100%)",
    labelKey: "roles.admin",
    icon: AdminPanelSettingsRoundedIcon,
    chipColor: "warning",
  },
  super_admin: {
    accent: "#A78BFA",
    accentSoft: "rgba(167, 139, 250, 0.16)",
    gradient:
      "linear-gradient(135deg, #0B1220 0%, #312E81 50%, #7C3AED 100%)",
    labelKey: "roles.super_admin",
    icon: SecurityRoundedIcon,
    chipColor: "secondary",
  },
};

/** Icons mapped to user account status values. */
export const STATUS_ICONS = {
  active: VerifiedUserRoundedIcon,
  pending: HowToRegRoundedIcon,
  rejected: PersonRoundedIcon,
};

/** Returns theme tokens for a role, defaulting to student. */
export function getRoleTheme(roleName) {
  const role = String(roleName || "student").toLowerCase();
  return ROLE_THEMES[role] || ROLE_THEMES.student;
}

/** Returns the icon component associated with a role. */
export function getRoleIcon(roleName) {
  const role = String(roleName || "student").toLowerCase();
  const theme = ROLE_THEMES[role] || ROLE_THEMES.student;
  return theme.icon;
}

/** Returns the icon component associated with an account status. */
export function getStatusIcon(status) {
  const s = String(status || "active").toLowerCase();
  return STATUS_ICONS[s] || STATUS_ICONS.active;
}
