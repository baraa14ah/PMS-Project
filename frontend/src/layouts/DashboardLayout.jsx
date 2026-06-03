import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
  TextField,
  InputAdornment,
  Button,
  Stack,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  CircularProgress,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import MailRoundedIcon from "@mui/icons-material/MailRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";

const drawerWidth = 280;
const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function DashboardLayout() {
  const { user, token: ctxToken, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const token = ctxToken || localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    }),
    [token],
  );

  const roleName = String(user?.role?.name ?? user?.role ?? "").toLowerCase();
  const isAdmin = roleName === "admin";
  const isSupervisor = roleName === "supervisor";
  const isStudent = roleName === "student";

  const displayName = user?.user?.name || "User";

  // =========================
  // Profile Menu
  // =========================
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleOpenMenu = (e) => setAnchorEl(e.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleGoProfile = () => {
    handleCloseMenu();
    navigate("/dashboard/profile");
  };

  const handleLogout = () => {
    handleCloseMenu();
    logout();
    navigate("/login");
  };

  // =========================
  // Notifications
  // =========================
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const notifOpen = Boolean(notifAnchorEl);

  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState("");
  const [latestNotifs, setLatestNotifs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const openNotifMenu = (e) => setNotifAnchorEl(e.currentTarget);
  const closeNotifMenu = () => setNotifAnchorEl(null);

  const [lastNotifFetchAt, setLastNotifFetchAt] = useState(0);

  const parseNotif = (n) => {
    const d = n?.data || {};
    const type =
      d?.type || d?.notification_type || d?.event || d?.event_type || "";
    const title = d?.title ?? n?.title ?? "Notification";
    const body = d?.body ?? n?.body ?? d?.message ?? "";
    return { type, title, body };
  };

  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: authHeaders,
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.unread_count !== undefined) {
        setUnreadCount(Number(data.unread_count));
      }
    } catch (e) {
      console.error("فشل الاتصال بمسار الإشعارات", e);
    }
  };

  const fetchLatestNotifications = async () => {
    if (!token) return;

    setNotifLoading(true);
    setNotifError("");
    try {
      // جلب البيانات فوراً بدون أي تأخير أو كاش
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: authHeaders,
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setNotifError(data?.message || "تعذر جلب الإشعارات");
        setLatestNotifs([]);
        return;
      }

      const list = data?.notifications || [];
      setLatestNotifs(list.slice(0, 3));

      if (data?.unread_count !== undefined) {
        setUnreadCount(Number(data.unread_count) || 0);
      }
    } catch {
      setNotifError("خطأ أثناء الاتصال بالسيرفر");
      setLatestNotifs([]);
    } finally {
      setNotifLoading(false);
    }
  };

  const resolveNotificationUrl = (n) => {
    const payload = n?.data || {};
    const extra = payload?.data || {};

    const directUrl = extra?.url || payload?.url;
    if (directUrl) return directUrl;

    const projectId = extra?.project_id;
    const taskId = extra?.task_id;
    const commentId = extra?.comment_id;
    const type = payload?.type || "";

    if (type === "comment.project" && projectId) {
      return commentId
        ? `/dashboard/projects/${projectId}?tab=comments&comment_id=${commentId}`
        : `/dashboard/projects/${projectId}?tab=comments`;
    }

    if (type === "comment.task" && projectId) {
      return `/dashboard/projects/${projectId}?tab=tasks${taskId ? `&task_id=${taskId}` : ""}${commentId ? `&comment_id=${commentId}` : ""}`;
    }

    if (type.startsWith("task.") && projectId) {
      return `/dashboard/projects/${projectId}?tab=tasks${taskId ? `&task_id=${taskId}` : ""}`;
    }

    if (projectId) return `/dashboard/projects/${projectId}`;
    return "/dashboard/notifications";
  };

  // ✅ الضربة القاضية لمشكلة الرقم المعلق
  const handleClickNotification = async (n) => {
    closeNotifMenu();
    const url = resolveNotificationUrl(n);
    navigate(url);

    // إذا كان الإشعار غير مقروء، نخصم الرقم فوراً وبلا رجعة
    if (n && !n.read_at) {
      // 1. الخصم الفوري والمؤكد
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // 2. تغيير لون الإشعار محلياً في القائمة
      setLatestNotifs((prev) =>
        prev.map((item) =>
          item.id === n.id
            ? { ...item, read_at: new Date().toISOString() }
            : item,
        ),
      );

      // 3. إرسال الطلب بصمت (Fire and Forget) دون انتظار الرقم القديم ليعود
      try {
        const response = await fetch(
          `${API_BASE_URL}/notifications/${n.id}/mark-read`,
          {
            method: "POST", // استخدمنا POST كما كتبناها في مسارات لارافيل
            headers: authHeaders,
          },
        );
      } catch (e) {
        console.error("Failed to mark as read in background");
      }
    }
  };

  useEffect(() => {
    if (notifOpen) fetchLatestNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifOpen]);

  // =========================
  // Invitations
  // =========================
  const [studentInvCount, setStudentInvCount] = useState(0);
  const [supervisorInvCount, setSupervisorInvCount] = useState(0);

  const fetchInvitationCounts = async () => {
    if (!token) return;

    if (isStudent || isAdmin) {
      try {
        const res = await fetch(`${API_BASE_URL}/student/invitations`, {
          headers: authHeaders,
        });
        const data = await res.json().catch(() => null);
        if (res.ok) {
          const count =
            data?.pending_count ??
            data?.count ??
            (Array.isArray(data?.invitations) ? data.invitations.length : 0) ??
            (Array.isArray(data?.pending) ? data.pending.length : 0) ??
            0;
          setStudentInvCount(Number(count) || 0);
        }
      } catch {}
    }

    if (isSupervisor || isAdmin) {
      try {
        const res = await fetch(`${API_BASE_URL}/supervisor/invitations`, {
          headers: authHeaders,
        });
        const data = await res.json().catch(() => null);
        if (res.ok) {
          const count =
            data?.pending_count ??
            data?.count ??
            (Array.isArray(data?.invitations) ? data.invitations.length : 0) ??
            (Array.isArray(data?.pending) ? data.pending.length : 0) ??
            0;
          setSupervisorInvCount(Number(count) || 0);
        }
      } catch {}
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchUnreadCount();
    fetchInvitationCounts();

    // 1. الدالة التي تقوم بالتحديث عند استلام الإشارة
    const handleUpdateBadges = () => {
      fetchInvitationCounts();
      // (ويمكنك إضافة fetchUnreadCount إذا أردت تحديث كل شيء)
    };

    // 2. الاستماع للإشارة التي سميناها 'updateSidebarBadges'
    window.addEventListener("updateSidebarBadges", handleUpdateBadges);

    // 3. تنظيف الاستماع عند إغلاق المكون
    return () => {
      window.removeEventListener("updateSidebarBadges", handleUpdateBadges);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // =========================
  // Sidebar Nav
  // =========================
  const navItems = [
    { label: "Home", to: "/dashboard", icon: <HomeRoundedIcon /> },
    {
      label: "Projects",
      to: "/dashboard/projects",
      icon: <FolderRoundedIcon />,
    },
    {
      label: "Notifications",
      to: "/dashboard/notifications",
      icon: <NotificationsRoundedIcon />,
      badge: unreadCount,
    },
    {
      label: "Supervisor Invitations",
      to: "/dashboard/supervisor/invitations",
      icon: <SupervisorAccountRoundedIcon />,
      hidden: !(isSupervisor || isAdmin),
      badge: supervisorInvCount,
    },
    {
      label: "Student Invitations",
      to: "/dashboard/student/invitations",
      icon: <PersonAddAltRoundedIcon />,
      hidden: !(isStudent || isAdmin),
      badge: studentInvCount,
    },
    {
      label: "Messages",
      to: "/dashboard/messages",
      icon: <MailRoundedIcon />,
      hidden: true,
    },
    {
      label: "Tasks",
      to: "/dashboard/tasks",
      icon: <TaskAltRoundedIcon />,
      hidden: true,
    },
    {
      label: "Members",
      to: "/dashboard/members",
      icon: <GroupRoundedIcon />,
      hidden: true,
    },
    {
      label: "Settings",
      to: "/dashboard/settings",
      icon: <SettingsRoundedIcon />,
      hidden: true,
    },
  ];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#F6F7FB" }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid #E7E8F0",
            bgcolor: "#FFFFFF",
            px: 2,
            py: 2,
          },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ px: 1, pb: 1 }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: 999,
              bgcolor: "primary.main",
            }}
          />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            ByteHub
          </Typography>
        </Stack>
        <Divider sx={{ my: 1.5 }} />
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ px: 1, pb: 1.5 }}
        >
          <Avatar sx={{ bgcolor: "primary.main" }}>
            {(displayName?.[0] || "U").toUpperCase()}
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              {displayName}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Role: {roleName || "—"}
            </Typography>
          </Box>
        </Stack>
        <Divider sx={{ mb: 1 }} />
        <List sx={{ px: 0 }}>
          {navItems
            .filter((x) => !x.hidden)
            .map((item) => {
              const active =
                item.to === "/dashboard"
                  ? location.pathname === "/dashboard" ||
                    location.pathname === "/dashboard/"
                  : location.pathname === item.to ||
                    location.pathname.startsWith(item.to + "/");
              return (
                <ListItemButton
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    px: 1.25,
                    bgcolor: active ? "rgba(79,70,229,0.10)" : "transparent",
                    "&:hover": { bgcolor: "rgba(79,70,229,0.08)" },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: active ? "primary.main" : "text.secondary",
                    }}
                  >
                    {item.badge ? (
                      <Badge
                        color="error"
                        badgeContent={item.badge}
                        max={99}
                        overlap="circular"
                      >
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: active ? 800 : 600,
                      color: active ? "primary.main" : "text.primary",
                    }}
                  />
                </ListItemButton>
              );
            })}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <Divider sx={{ mt: 1 }} />
        <Button
          onClick={handleLogout}
          startIcon={<LogoutRoundedIcon />}
          sx={{
            mt: 2,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 700,
            justifyContent: "flex-start",
            px: 1.5,
          }}
          variant="outlined"
          color="primary"
          fullWidth
        >
          Logout
        </Button>
      </Drawer>

      {/* Main */}
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Topbar */}
        <Box
          sx={{
            bgcolor: "#FFFFFF",
            border: "1px solid #E7E8F0",
            borderRadius: 3,
            px: 2,
            py: 1.5,
            mb: 3,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <TextField
            size="small"
            placeholder="Search for anything..."
            sx={{ width: 420, bgcolor: "#F7F7FB", borderRadius: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ flexGrow: 1 }} />

          {/* ✅ Notifications */}
          <Tooltip title="Notifications">
            <IconButton onClick={openNotifMenu}>
              <Badge color="error" badgeContent={unreadCount} max={99}>
                <NotificationsRoundedIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={notifAnchorEl}
            open={notifOpen}
            onClose={closeNotifMenu}
            PaperProps={{
              sx: { width: 360, borderRadius: 3, mt: 1, overflow: "hidden" },
            }}
          >
            <Box sx={{ px: 2, py: 1.25, bgcolor: "#F7F7FB" }}>
              <Typography sx={{ fontWeight: 900 }}>آخر الإشعارات</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                آخر 3 إشعارات
              </Typography>
            </Box>
            {notifLoading && (
              <Box
                sx={{ p: 2, display: "flex", gap: 1.5, alignItems: "center" }}
              >
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  جارِ التحميل...
                </Typography>
              </Box>
            )}
            {!notifLoading && notifError && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="error">
                  {notifError}
                </Typography>
              </Box>
            )}
            {!notifLoading && !notifError && latestNotifs.length === 0 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  لا توجد إشعارات بعد.
                </Typography>
              </Box>
            )}
            {!notifLoading &&
              !notifError &&
              latestNotifs.map((n) => {
                const { title, body } = parseNotif(n);
                const isUnread = !n?.read_at;
                return (
                  <MenuItem
                    key={n?.id}
                    onClick={() => handleClickNotification(n)}
                    sx={{
                      alignItems: "flex-start",
                      gap: 1.5,
                      py: 1.2,
                      borderLeft: isUnread
                        ? "4px solid"
                        : "4px solid transparent",
                      borderLeftColor: isUnread
                        ? "primary.main"
                        : "transparent",
                      whiteSpace: "normal",
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        bgcolor: isUnread ? "primary.main" : "grey.400",
                        mt: 0.2,
                      }}
                    >
                      {(title?.[0] || "N").toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900, fontSize: 13 }} noWrap>
                        {title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", fontSize: 12.5 }}
                        noWrap
                      >
                        {body}
                      </Typography>
                    </Box>
                  </MenuItem>
                );
              })}
            <Divider />
            <Box sx={{ p: 1.25, display: "flex", gap: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  closeNotifMenu();
                  navigate("/dashboard/notifications");
                }}
                sx={{ borderRadius: 2, fontWeight: 800 }}
              >
                View all notifications
              </Button>
            </Box>
          </Menu>

          {/* Profile Clickable Area */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            onClick={handleOpenMenu}
            role="button"
            tabIndex={0}
            sx={{
              cursor: "pointer",
              px: 1,
              py: 0.6,
              borderRadius: 2,
              "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
              userSelect: "none",
            }}
          >
            <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main" }}>
              {(displayName?.[0] || "U").toUpperCase()}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
                {displayName}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {roleName || "—"}
              </Typography>
            </Box>
          </Stack>

          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleCloseMenu}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 220,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.4 }}>
              <Typography sx={{ fontWeight: 900 }}>{displayName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {roleName || "—"}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleGoProfile}>
              <ListItemIcon sx={{ minWidth: 34 }}>
                <AccountCircleRoundedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
              <ListItemIcon sx={{ minWidth: 34, color: "error.main" }}>
                <LogoutRoundedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </Box>

        {/* Content */}
        <Outlet context={{ unreadCount, setUnreadCount, fetchUnreadCount }} />
      </Box>
    </Box>
  );
}
