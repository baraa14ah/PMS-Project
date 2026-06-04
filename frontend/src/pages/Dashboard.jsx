import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import PageHeader from "../components/PageHeader";
import Swal from "sweetalert2";
import toast from "react-hot-toast"; // 🎯 أضفنا هذا الاستيراد لإصلاح خطأ الـ toast في السطر 118

// MUI
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Chip,
  Divider,
  LinearProgress,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
} from "@mui/material";

// Icons
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import HourglassBottomRoundedIcon from "@mui/icons-material/HourglassBottomRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";

// 🎯 تأثير التحويم الموحد للبطاقات
const hoverEffect = {
  transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },
};

export default function Dashboard() {
  const { t } = useLanguage();
  const { user, token: ctxToken, authHeaders, apiFetch, API_BASE_URL } =
    useAuth();
  const navigate = useNavigate();

  const token = ctxToken || localStorage.getItem("token");

  const name = user?.user?.name || t("common.user");
  const role = String(
    user?.role?.name ?? user?.role ?? "غير معروف",
  ).toLowerCase();

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("github") === "success") {
      Swal.fire({
        title: t("dashboard.githubSuccess"),
        text: t("dashboard.githubSuccessBody"),
        icon: "success",
        confirmButtonColor: "#24292e",
        confirmButtonText: t("dashboard.great"),
      });
      window.history.replaceState(null, "", window.location.pathname);
    } else if (params.get("github") === "error") {
      Swal.fire({ title: t("dashboard.githubError"), icon: "error" });
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [location]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    projectsTotal: 0,
    tasksTotal: 0,
    tasksCompleted: 0,
    progress: 0,
    pendingInvites: 0,
  });

  const [recentProjects, setRecentProjects] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);

  const safePercent = (n) => {
    const x = Number(n || 0);
    if (Number.isNaN(x)) return 0;
    return Math.max(0, Math.min(100, Math.round(x)));
  };

  const roleChip = () => (
    <Chip
      size="small"
      color={
        role === "admin"
          ? "error"
          : role === "supervisor"
            ? "info"
            : role === "student"
              ? "success"
              : "default"
      }
      label={t(`roles.${role}`, role)}
      icon={role === "admin" ? <AdminPanelSettingsRoundedIcon /> : undefined}
      sx={{ fontWeight: 800 }}
    />
  );

  const statusChip = (status) => {
    const s = (status || "pending").toLowerCase();
    if (s === "completed")
      return <Chip size="small" color="success" label={t("dashboard.completed")} />;
    if (s === "in_progress")
      return <Chip size="small" color="info" label={t("dashboard.inProgress")} />;
    if (s === "pending")
      return <Chip size="small" color="warning" label={t("dashboard.pending")} />;
    return <Chip size="small" variant="outlined" label={status || "—"} />;
  };

  const sortByDateDesc = (arr) =>
    [...arr].sort(
      (a, b) =>
        new Date(b.created_at || b.createdAt || 0) -
        new Date(a.created_at || a.createdAt || 0),
    );

  const fetchProjects = async () => {
    const { res, data } = await apiFetch(`${API_BASE_URL}/projects`, {
      headers: authHeaders(),
    });

    if (res.status === 429) {
      toast.error(
        "ضغط كبير على السيرفر (Too Many Attempts). يرجى الانتظار ثوانٍ وتحديث الصفحة.",
      );
    }

    if (!res.ok) throw new Error(data?.message || "تعذر جلب المشاريع");

    const projectsArray = data?.projects?.data || data?.projects || [];
    return Array.isArray(projectsArray) ? projectsArray : [];
  };

  const fetchProjectTasks = async (projectId) => {
    const { res, data } = await apiFetch(
      `${API_BASE_URL}/project/${projectId}/tasks`,
      { headers: authHeaders() },
    );
    if (!res.ok) return [];
    return data?.tasks || [];
  };

  const fetchPendingInvites = async () => {
    try {
      if (role === "supervisor") {
        const { res, data } = await apiFetch(
          `${API_BASE_URL}/supervisor/invitations`,
          { headers: authHeaders() },
        );
        if (res.ok)
          return Array.isArray(data?.invitations) ? data.invitations.length : 0;
        return 0;
      }

      if (role === "student") {
        const { res, data } = await apiFetch(
          `${API_BASE_URL}/student/invitations`,
          { headers: authHeaders() },
        );
        if (res.ok)
          return Array.isArray(data?.invitations) ? data.invitations.length : 0;
        return 0;
      }

      if (role === "admin") {
        const [s1, s2] = await Promise.all([
          apiFetch(`${API_BASE_URL}/supervisor/invitations`, {
            headers: authHeaders(),
          }),
          apiFetch(`${API_BASE_URL}/student/invitations`, {
            headers: authHeaders(),
          }),
        ]);

        const c1 =
          s1.res.ok && Array.isArray(s1.data?.invitations)
            ? s1.data.invitations.length
            : 0;
        const c2 =
          s2.res.ok && Array.isArray(s2.data?.invitations)
            ? s2.data.invitations.length
            : 0;
        return c1 + c2;
      }

      return 0;
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const run = async () => {
      try {
        setLoading(true);
        setError("");

        const { res, data } = await apiFetch(`${API_BASE_URL}/dashboard/summary`, {
          headers: authHeaders(),
        });

        if (!res.ok) {
          throw new Error(data?.message || t("dashboard.loadError"));
        }

        const s = data?.stats || {};
        setStats({
          projectsTotal: s.projects_total ?? 0,
          tasksTotal: s.tasks_total ?? 0,
          tasksCompleted: s.tasks_completed ?? 0,
          progress: s.progress ?? 0,
          pendingInvites: s.pending_invites ?? 0,
        });

        setRecentProjects(data?.recent_projects || []);
        setRecentTasks(data?.recent_tasks || []);
      } catch (e) {
        setError(e?.message || t("dashboard.loadError"));
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const dashboardConfig = useMemo(
    () => ({
      admin: {
        greeting: t("dashboard.adminGreeting"),
        projectsTitle: t("dashboard.adminProjects"),
        tasksTitle: t("dashboard.adminTasks"),
        invitesTitle: t("dashboard.adminInvites"),
        action1: {
          label: t("dashboard.adminManageProjects"),
          icon: <FolderOpenRoundedIcon />,
          to: "/dashboard/projects",
        },
        action2: {
          label: t("dashboard.adminManageUsers"),
          icon: <AdminPanelSettingsRoundedIcon />,
          to: "/dashboard/users",
        },
      },
      supervisor: {
        greeting: t("dashboard.supervisorGreeting"),
        projectsTitle: t("dashboard.supervisorProjects"),
        tasksTitle: t("dashboard.supervisorTasks"),
        invitesTitle: t("dashboard.supervisorInvites"),
        action1: {
          label: t("dashboard.supervisorProjectsAction"),
          icon: <FolderOpenRoundedIcon />,
          to: "/dashboard/projects",
        },
        action2: {
          label: t("dashboard.supervisorInvitesAction"),
          icon: <PersonAddAltRoundedIcon />,
          to: "/dashboard/supervisor/invitations",
        },
      },
      student: {
        greeting: t("dashboard.studentGreeting"),
        projectsTitle: t("dashboard.studentProjects"),
        tasksTitle: t("dashboard.studentTasks"),
        invitesTitle: t("dashboard.studentInvites"),
        action1: {
          label: t("dashboard.studentProjectsAction"),
          icon: <FolderOpenRoundedIcon />,
          to: "/dashboard/projects",
        },
        action2: {
          label: t("dashboard.studentInvitesAction"),
          icon: <PersonAddAltRoundedIcon />,
          to: "/dashboard/student/invitations",
        },
      },
    }),
    [t],
  );

  const currentConfig = dashboardConfig[role] || dashboardConfig.student;

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      <PageHeader
        title={t("dashboard.title")}
        subtitle={`${t("dashboard.welcome")} ${name} — ${currentConfig.greeting}`}
        icon={<DashboardRoundedIcon />}
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
            {roleChip()}
            <Button
              component={RouterLink}
              to={currentConfig.action1.to}
              variant="contained"
              startIcon={currentConfig.action1.icon}
              sx={{
                borderRadius: 2,
                fontWeight: 800,
                bgcolor: "white",
                color: "#0B1220",
                "&:hover": { bgcolor: "#F1F5F9" },
              }}
            >
              {currentConfig.action1.label}
            </Button>
            <Button
              component={RouterLink}
              to={currentConfig.action2.to}
              variant="outlined"
              startIcon={currentConfig.action2.icon}
              sx={{
                borderRadius: 2,
                fontWeight: 800,
                color: "white",
                borderColor: "rgba(255,255,255,0.4)",
              }}
            >
              {currentConfig.action2.label}
            </Button>
          </Stack>
        }
      />

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Divider sx={{ display: "none" }} />

        {/* 🎯 Progress Bar المطور */}
        {loading ? (
          <Stack direction="row" spacing={2} alignItems="center">
            <CircularProgress size={20} />
            <Typography sx={{ fontWeight: 700 }} color="text.secondary">
              {t("common.loading")}
            </Typography>
          </Stack>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Box sx={{ p: 2, bgcolor: "rgba(0,0,0,0.02)", borderRadius: 2 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ mb: 1.5 }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <AutoGraphRoundedIcon color="primary" fontSize="small" />
                <Typography variant="body1" sx={{ fontWeight: 800 }}>
                  {t("dashboard.overallProgress")}
                </Typography>
              </Stack>
              <Typography
                variant="h6"
                sx={{ fontWeight: 900, color: "primary.main" }}
              >
                {safePercent(stats.progress)}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={safePercent(stats.progress)}
              sx={{ height: 12, borderRadius: 6, bgcolor: "rgba(0,0,0,0.05)" }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1.5, fontWeight: 600 }}
            >
              {t("dashboard.tasksProgress")} {stats.tasksCompleted}{" "}
              {t("dashboard.tasksProgressOf")} {stats.tasksTotal}{" "}
              {t("dashboard.tasksProgressSuffix")}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* 🎯 Stats Cards المتكيفة */}
      {!loading && !error && (
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mt: 3 }}
        >
          {[
            {
              title: t("dashboard.projects"),
              value: stats.projectsTotal,
              icon: <FolderOpenRoundedIcon fontSize="large" />,
              desc: currentConfig.projectsTitle,
              color: "#3B82F6",
            },
            {
              title: t("dashboard.tasks"),
              value: stats.tasksTotal,
              icon: <ListAltRoundedIcon fontSize="large" />,
              desc: currentConfig.tasksTitle,
              color: "#8B5CF6",
            },
            {
              title: t("dashboard.completed"),
              value: stats.tasksCompleted,
              icon: <CheckCircleRoundedIcon fontSize="large" />,
              desc: t("dashboard.completed"),
              color: "#10B981",
            },
            {
              title: t("dashboard.invites"),
              value: stats.pendingInvites,
              icon: <HourglassBottomRoundedIcon fontSize="large" />,
              desc: currentConfig.invitesTitle,
              color: "#F59E0B",
            },
          ].map((stat, idx) => (
            <Paper
              key={idx}
              elevation={0}
              sx={{
                p: 3,
                flex: 1,
                borderRadius: 3,
                border: "1px solid #EAEAEA",
                position: "relative",
                overflow: "hidden",
                ...hoverEffect, // تطبيق تأثير النبض
              }}
            >
              {/* لمسة لونية خفيفة في زاوية البطاقة */}
              <Box
                sx={{
                  position: "absolute",
                  top: -15,
                  left: -15,
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  bgcolor: stat.color,
                  opacity: 0.1,
                }}
              />

              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ color: stat.color }}
              >
                {stat.icon}
                <Typography
                  sx={{
                    fontWeight: 900,
                    color: "text.primary",
                    fontSize: "1.1rem",
                  }}
                >
                  {stat.title}
                </Typography>
              </Stack>
              <Typography variant="h3" sx={{ fontWeight: 900, mt: 2, mb: 0.5 }}>
                {stat.value}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                {stat.desc}
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}

      {/* الجداول السفلية */}
      {!loading && !error && (
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          sx={{ mt: 3 }}
        >
          {/* Recent Projects */}
          <Paper
            elevation={0}
            sx={{
              p: 0,
              flex: 1,
              borderRadius: 3,
              border: "1px solid #EAEAEA",
              overflow: "hidden",
              ...hoverEffect,
            }}
          >
            <Box
              sx={{
                p: 2.5,
                borderBottom: "1px solid #EAEAEA",
                bgcolor: "#FAFAFA",
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography sx={{ fontWeight: 900, fontSize: "1.1rem" }}>
                  {t("dashboard.recentProjectsTitle")}
                </Typography>
                <Button
                  component={RouterLink}
                  to="/dashboard/projects"
                  size="small"
                  sx={{ fontWeight: 800 }}
                >
                  {t("dashboard.viewAll")}
                </Button>
              </Stack>
            </Box>

            <Box sx={{ p: recentProjects.length === 0 ? 3 : 0 }}>
              {recentProjects.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                >
                  {t("dashboard.noProjects")}
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, py: 1.5 }}>
                          {t("dashboard.projectName")}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, py: 1.5 }}>
                          {t("dashboard.status")}
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 800, py: 1.5, textAlign: "left" }}
                        >
                          {t("dashboard.action")}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentProjects.map((p) => (
                        <TableRow
                          key={p.id}
                          hover
                          sx={{ "&:last-child td": { border: 0 } }}
                        >
                          <TableCell sx={{ fontWeight: 700 }}>
                            {p.title || `Project #${p.id}`}
                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                color: "text.secondary",
                                fontWeight: 400,
                              }}
                              noWrap
                            >
                              {p.description
                                ? p.description.length > 40
                                  ? p.description.substring(0, 40) + "..."
                                  : p.description
                                : "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>{statusChip(p.status)}</TableCell>
                          <TableCell sx={{ textAlign: "left" }}>
                            <Button
                              component={RouterLink}
                              to={`/dashboard/projects/${p.id}`}
                              size="small"
                              variant="contained"
                              sx={{
                                borderRadius: 1.5,
                                fontWeight: 700,
                                boxShadow: "none",
                              }}
                            >
                              {t("dashboard.enter")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Paper>

          {/* Recent Tasks */}
          <Paper
            elevation={0}
            sx={{
              p: 0,
              flex: 1,
              borderRadius: 3,
              border: "1px solid #EAEAEA",
              overflow: "hidden",
              ...hoverEffect,
            }}
          >
            <Box
              sx={{
                p: 2.5,
                borderBottom: "1px solid #EAEAEA",
                bgcolor: "#FAFAFA",
              }}
            >
              <Typography sx={{ fontWeight: 900, fontSize: "1.1rem" }}>
                {t("dashboard.recentTasksTitle")}
              </Typography>
            </Box>

            <Box sx={{ p: recentTasks.length === 0 ? 3 : 0 }}>
              {recentTasks.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                >
                  {t("dashboard.noTasks")}
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, py: 1.5 }}>
                          {t("dashboard.taskName")}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, py: 1.5 }}>
                          {t("dashboard.status")}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, py: 1.5 }}>
                          {t("dashboard.link")}
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 800, py: 1.5, textAlign: "left" }}
                        >
                          {t("dashboard.action")}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentTasks.map((task) => (
                        <TableRow
                          key={task.id}
                          hover
                          sx={{ "&:last-child td": { border: 0 } }}
                        >
                          <TableCell sx={{ fontWeight: 700 }}>
                            {task.title || `Task #${task.id}`}
                            <Typography
                              variant="caption"
                              sx={{ display: "block", color: "text.secondary" }}
                            >
                              {t("dashboard.dueDate")}:{" "}
                              {task.deadline
                                ? new Date(task.deadline).toLocaleDateString()
                                : "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>{statusChip(task.status)}</TableCell>
                          <TableCell
                            sx={{
                              color: "text.secondary",
                              fontSize: "0.85rem",
                              maxWidth: 120,
                            }}
                            noWrap
                          >
                            {task.project_title ||
                              (task.project_id
                                ? `${t("dashboard.projectRef")} #${task.project_id}`
                                : "—")}
                          </TableCell>
                          <TableCell sx={{ textAlign: "left" }}>
                            {task.project_id ? (
                              <Button
                                component={RouterLink}
                                to={`/dashboard/projects/${task.project_id}?tab=tasks`}
                                size="small"
                                variant="outlined"
                                sx={{ borderRadius: 1.5, fontWeight: 700 }}
                              >
                                {t("dashboard.preview")}
                              </Button>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Paper>
        </Stack>
      )}
    </Box>
  );
}
