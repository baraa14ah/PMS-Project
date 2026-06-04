import React, { useEffect, useState, useMemo } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import SystemBreadcrumbs from "../components/SystemBreadcrumbs";
import NotificationBellMenu from "../components/NotificationBellMenu";
import BrandLogo from "../components/BrandLogo";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { getNavForRole } from "../config/navConfig";
import { brandColors } from "../theme";

import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  IconButton,
  Button,
  Stack,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  Chip,
  alpha,
} from "@mui/material";

import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";

const drawerWidth = 268;

export default function DashboardLayout() {
  const {
    user,
    token: ctxToken,
    logout,
    authHeaders,
    apiFetch,
    API_BASE_URL,
    universityName,
    isSuperAdmin: isSuperAdminCtx,
  } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeMode() || { mode: "light", toggleTheme: () => {} };

  const token = ctxToken || localStorage.getItem("token");
  const roleName = String(user?.role?.name ?? user?.role ?? "").toLowerCase();
  const isSuperAdmin = isSuperAdminCtx || roleName === "super_admin";
  const isTenantUser = !isSuperAdmin;

  const displayName = user?.user?.name || user?.name || "User";
  const roleLabel = t(`roles.${roleName}`, roleName);

  const workspaceLabel = isSuperAdmin
    ? t("common.platformAdmin")
    : universityName || null;

  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [studentInvCount, setStudentInvCount] = useState(0);
  const [supervisorInvCount, setSupervisorInvCount] = useState(0);
  const [passwordResetCount, setPasswordResetCount] = useState(0);

  const badges = useMemo(
    () => ({
      unread: unreadCount,
      supervisorInv: supervisorInvCount,
      studentInv: studentInvCount,
      passwordReset: passwordResetCount,
    }),
    [unreadCount, supervisorInvCount, studentInvCount, passwordResetCount],
  );

  const navItems = useMemo(() => getNavForRole(roleName), [roleName]);

  const fetchBadges = async () => {
    if (!token) return;
    try {
      const notifRes = await apiFetch(`${API_BASE_URL}/notifications`, {
        headers: authHeaders(),
      });
      if (notifRes.res.ok) {
        setUnreadCount(Number(notifRes.data?.unread_count) || 0);
      }
      if (isSuperAdmin) return;
      const { res, data } = await apiFetch(`${API_BASE_URL}/dashboard/badges`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      setStudentInvCount(Number(data?.student_invitations) || 0);
      setSupervisorInvCount(Number(data?.supervisor_invitations) || 0);
      setPasswordResetCount(Number(data?.password_reset_requests) || 0);
    } catch (e) {
      console.error("badges", e);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchBadges();
    const onUpdate = () => fetchBadges();
    window.addEventListener("updateSidebarBadges", onUpdate);
    return () => window.removeEventListener("updateSidebarBadges", onUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isSuperAdmin]);

  const resolveBadge = (item) => {
    if (!item.badgeKey) return 0;
    return badges[item.badgeKey] ?? 0;
  };

  const isActive = (item) => {
    if (item.end) {
      return (
        location.pathname === "/dashboard" || location.pathname === "/dashboard/"
      );
    }
    return (
      location.pathname === item.to ||
      location.pathname.startsWith(`${item.to}/`)
    );
  };

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            border: "none",
            borderInlineEnd: `1px solid`,
            borderColor: "divider",
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 2,
            background: `linear-gradient(180deg, ${brandColors.navy} 0%, #1E3A5F 100%)`,
            color: "white",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <BrandLogo size="sm" variant="hero" />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 950, lineHeight: 1.1 }}>
                {t("common.appName")}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }} noWrap>
                {t("common.appTagline")}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Stack sx={{ px: 2, py: 2 }} spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: brandColors.blue,
                fontWeight: 900,
              }}
            >
              {(displayName?.[0] || "U").toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 14 }} noWrap>
                {displayName}
              </Typography>
              <Chip
                label={roleLabel}
                size="small"
                sx={{
                  mt: 0.4,
                  height: 20,
                  fontSize: 11,
                  fontWeight: 800,
                  bgcolor: alpha(brandColors.teal, 0.15),
                  color: brandColors.teal,
                }}
              />
              {workspaceLabel && (
                <Typography variant="caption" color="text.secondary" display="block" noWrap>
                  {workspaceLabel}
                </Typography>
              )}
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <LanguageSwitcher size="small" sx={{ flex: 1 }} />
            <Tooltip title={mode === "dark" ? t("common.lightMode") : t("common.darkMode")}>
              <IconButton size="small" onClick={toggleTheme} sx={{ color: "text.secondary" }}>
                {mode === "dark" ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Divider />

        <List sx={{ px: 1.5, py: 1, flex: 1 }}>
          {navItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            const labelKey =
              isSuperAdmin && item.labelKeySuper ? item.labelKeySuper : item.labelKey;
            const badge = resolveBadge(item);

            return (
              <ListItemButton
                key={item.id}
                component={NavLink}
                to={item.to}
                selected={active}
                sx={{
                  mb: 0.5,
                  py: 1,
                  "&.Mui-selected": {
                    bgcolor: alpha(brandColors.blue, 0.12),
                    borderInlineStart: `3px solid ${brandColors.blue}`,
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: active ? "secondary.main" : "text.secondary" }}>
                  {badge > 0 ? (
                    <Badge color="error" badgeContent={badge} max={99}>
                      <Icon fontSize="small" />
                    </Badge>
                  ) : (
                    <Icon fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={t(labelKey)}
                  primaryTypographyProps={{
                    fontWeight: active ? 800 : 600,
                    fontSize: 14,
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            startIcon={<LogoutRoundedIcon />}
            onClick={handleLogout}
            sx={{ borderRadius: 2, fontWeight: 800, justifyContent: "flex-start", px: 2 }}
          >
            {t("common.logout")}
          </Button>
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, minWidth: 0 }}>
        <Box
          sx={{
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            px: 2,
            py: 1.25,
            mb: 3,
            display: "flex",
            alignItems: "center",
            gap: 2,
            boxShadow: "0 4px 20px rgba(15,23,42,0.04)",
          }}
        >
          <Box sx={{ flexGrow: 1 }} />
          <NotificationBellMenu
            token={token}
            authHeaders={authHeaders}
            apiFetch={apiFetch}
            API_BASE_URL={API_BASE_URL}
            unreadCount={unreadCount}
            setUnreadCount={setUnreadCount}
          />
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              cursor: "pointer",
              px: 1.5,
              py: 0.75,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: brandColors.navy, fontSize: 14 }}>
              {(displayName?.[0] || "U").toUpperCase()}
            </Avatar>
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <Typography sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>
                {displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {roleLabel}
              </Typography>
            </Box>
          </Stack>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{ sx: { borderRadius: 3, minWidth: 200 } }}
          >
            {isTenantUser && (
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  navigate("/dashboard/profile");
                }}
              >
                <ListItemIcon>
                  <AccountCircleRoundedIcon fontSize="small" />
                </ListItemIcon>
                {t("common.profile")}
              </MenuItem>
            )}
            <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
              <ListItemIcon sx={{ color: "error.main" }}>
                <LogoutRoundedIcon fontSize="small" />
              </ListItemIcon>
              {t("common.logout")}
            </MenuItem>
          </Menu>
        </Box>

        <SystemBreadcrumbs />
        <Outlet context={{ unreadCount, setUnreadCount }} />
      </Box>
    </Box>
  );
}
