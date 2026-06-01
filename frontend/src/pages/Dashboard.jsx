import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import Swal from "sweetalert2";
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

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function Dashboard() {
  const { user, token: ctxToken } = useAuth();
  const navigate = useNavigate();

  // ✅ fallback لو token مش موجود في context
  const token = ctxToken || localStorage.getItem("token");

  const name = user?.user?.name || "مستخدم";
  const role = String(
    user?.role?.name ?? user?.role ?? "غير معروف",
  ).toLowerCase();

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    }),
    [token],
  );

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("github") === "success") {
      Swal.fire({
        title: "تم الربط بنجاح! 🐙",
        text: "تم ربط حسابك بـ GitHub بشكل آمن.",
        icon: "success",
        confirmButtonColor: "#24292e",
        confirmButtonText: "ممتاز!",
      });
      window.history.replaceState(null, "", window.location.pathname);
    } else if (params.get("github") === "error") {
      Swal.fire({ title: "فشل الربط!", icon: "error" });
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

  const roleChip = () => {
    if (role === "admin")
      return <Chip size="small" color="error" label="Admin" />;
    if (role === "supervisor")
      return <Chip size="small" color="info" label="Supervisor" />;
    if (role === "student")
      return <Chip size="small" color="success" label="Student" />;
    return <Chip size="small" variant="outlined" label={role} />;
  };

  const statusChip = (status) => {
    const s = (status || "pending").toLowerCase();
    if (s === "completed")
      return <Chip size="small" color="success" label="مكتمل" />;
    if (s === "in_progress")
      return <Chip size="small" color="info" label="قيد التنفيذ" />;
    if (s === "pending")
      return <Chip size="small" color="warning" label="قيد الانتظار" />;
    return <Chip size="small" variant="outlined" label={status || "—"} />;
  };

  const sortByDateDesc = (arr) =>
    [...arr].sort(
      (a, b) =>
        new Date(b.created_at || b.createdAt || 0) -
        new Date(a.created_at || a.createdAt || 0),
    );

  const fetchProjects = async () => {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      headers: authHeaders,
    });

    // ✅ التقاط خطأ الـ Spam وتنبيه المستخدم بدلاً من تحطيم الموقع
    if (res.status === 429) {
      toast.error(
        "ضغط كبير على السيرفر (Too Many Attempts). يرجى الانتظار ثوانٍ وتحديث الصفحة.",
      );
    }

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "تعذر جلب المشاريع");

    // ✅ الحل الجذري لاختفاء المشاريع: دعم نظام الصفحات (Pagination) الخاص بـ Laravel
    const projectsArray = data?.projects?.data || data?.projects || [];
    return Array.isArray(projectsArray) ? projectsArray : [];
  };

  const fetchProjectTasks = async (projectId) => {
    const res = await fetch(`${API_BASE_URL}/project/${projectId}/tasks`, {
      headers: authHeaders,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return []; // ✅ لا نوقف الداشبورد إذا مشروع واحد فشل
    return data?.tasks || [];
  };

  const fetchPendingInvites = async () => {
    // ✅ حسب دورك
    // supervisor: /supervisor/invitations
    // student: /student/invitations
    // admin: نجرب الاثنين ونجمعهم
    try {
      if (role === "supervisor") {
        const r = await fetch(`${API_BASE_URL}/supervisor/invitations`, {
          headers: authHeaders,
        });
        const j = await r.json().catch(() => null);
        if (r.ok)
          return Array.isArray(j?.invitations) ? j.invitations.length : 0;
        return 0;
      }

      if (role === "student") {
        const r = await fetch(`${API_BASE_URL}/student/invitations`, {
          headers: authHeaders,
        });
        const j = await r.json().catch(() => null);
        if (r.ok)
          return Array.isArray(j?.invitations) ? j.invitations.length : 0;
        return 0;
      }

      if (role === "admin") {
        const [r1, r2] = await Promise.all([
          fetch(`${API_BASE_URL}/supervisor/invitations`, {
            headers: authHeaders,
          }),
          fetch(`${API_BASE_URL}/student/invitations`, {
            headers: authHeaders,
          }),
        ]);
        const j1 = await r1.json().catch(() => null);
        const j2 = await r2.json().catch(() => null);

        const c1 =
          r1.ok && Array.isArray(j1?.invitations) ? j1.invitations.length : 0;
        const c2 =
          r2.ok && Array.isArray(j2?.invitations) ? j2.invitations.length : 0;
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

        // 1) جلب المشاريع الصحيحة
        const projects = await fetchProjects();

        // ✅ 2) إيقاف الـ Spam: لكي لا يغضب السيرفر، سنجلب مهام "أحدث 3 مشاريع فقط" بدلاً من كل المشاريع
        const recentProjs = sortByDateDesc(projects).slice(0, 3);
        const taskLists = await Promise.all(
          recentProjs.map((p) => fetchProjectTasks(p.id)),
        );

        // تجميع المهام
        const allTasks = taskLists.flat().map((t) => {
          const project = projects.find((p) => p.id === t.project_id);
          return {
            ...t,
            project_title: project?.title || t.project_title || "",
          };
        });

        const tasksTotal = allTasks.length;
        const tasksCompleted = allTasks.filter(
          (t) => String(t.status || "").toLowerCase() === "completed",
        ).length;

        const pendingInvites = await fetchPendingInvites();

        setStats({
          projectsTotal: projects.length,
          tasksTotal,
          tasksCompleted,
          progress: tasksTotal
            ? safePercent((tasksCompleted / tasksTotal) * 100)
            : 0,
          pendingInvites,
        });

        setRecentProjects(sortByDateDesc(projects).slice(0, 6));
        setRecentTasks(sortByDateDesc(allTasks).slice(0, 6));
      } catch (e) {
        setError(
          e?.message ||
            "تعذر تحميل بيانات الداشبورد. تأكد من الـ API أو التوكن.",
        );
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto" }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: "1px solid #EAEAEA",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <DashboardRoundedIcon />
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                Dashboard
              </Typography>
              {roleChip()}
            </Stack>
            <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
              مرحباً، <b>{name}</b> — تابع مشاريعك، المهام، والتقدّم بسرعة.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              component={RouterLink}
              to="/dashboard/projects"
              variant="contained"
              startIcon={<FolderOpenRoundedIcon />}
              sx={{ borderRadius: 2, fontWeight: 900, textTransform: "none" }}
            >
              المشاريع
            </Button>
            <Button
              component={RouterLink}
              to="/dashboard/notifications"
              variant="outlined"
              startIcon={<NotificationsRoundedIcon />}
              sx={{ borderRadius: 2, fontWeight: 900, textTransform: "none" }}
            >
              الإشعارات
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Progress */}
        {loading ? (
          <Stack direction="row" spacing={2} alignItems="center">
            <CircularProgress size={20} />
            <Typography sx={{ fontWeight: 700 }} color="text.secondary">
              جارِ تحميل الداشبورد...
            </Typography>
          </Stack>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                التقدّم العام
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 900 }}>
                {safePercent(stats.progress)}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={safePercent(stats.progress)}
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              مكتمل: {stats.tasksCompleted} / {stats.tasksTotal} مهمة
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Stats Cards */}
      {!loading && !error && (
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mt: 2 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              flex: 1,
              borderRadius: 3,
              border: "1px solid #EAEAEA",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <FolderOpenRoundedIcon />
              <Typography sx={{ fontWeight: 900 }}>المشاريع</Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 1 }}>
              {stats.projectsTotal}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              عدد المشاريع حسب صلاحياتك
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              flex: 1,
              borderRadius: 3,
              border: "1px solid #EAEAEA",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <ListAltRoundedIcon />
              <Typography sx={{ fontWeight: 900 }}>المهام</Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 1 }}>
              {stats.tasksTotal}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              إجمالي المهام المرتبطة بمشاريعك
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              flex: 1,
              borderRadius: 3,
              border: "1px solid #EAEAEA",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <CheckCircleRoundedIcon />
              <Typography sx={{ fontWeight: 900 }}>المكتمل</Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 1 }}>
              {stats.tasksCompleted}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              مهام مكتملة حتى الآن
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              flex: 1,
              borderRadius: 3,
              border: "1px solid #EAEAEA",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <HourglassBottomRoundedIcon />
              <Typography sx={{ fontWeight: 900 }}>الدعوات</Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 1 }}>
              {stats.pendingInvites}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              عدد الدعوات المعلقة (حسب الدور)
            </Typography>
          </Paper>
        </Stack>
      )}

      {/* Recent lists side-by-side */}
      {!loading && !error && (
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          sx={{ mt: 2 }}
        >
          {/* Recent Projects */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              flex: 1,
              borderRadius: 3,
              border: "1px solid #EAEAEA",
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Typography sx={{ fontWeight: 900 }}>آخر المشاريع</Typography>
              <Button
                component={RouterLink}
                to="/dashboard/projects"
                size="small"
                variant="outlined"
                sx={{ borderRadius: 2, fontWeight: 900, textTransform: "none" }}
              >
                عرض الكل
              </Button>
            </Stack>

            {recentProjects.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                لا توجد مشاريع حالياً.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 900 }}>المشروع</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>الحالة</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>فتح</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentProjects.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell sx={{ fontWeight: 800 }}>
                          {p.title || `Project #${p.id}`}
                          <Typography
                            variant="caption"
                            sx={{ display: "block", color: "text.secondary" }}
                          >
                            {p.description || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>{statusChip(p.status)}</TableCell>
                        <TableCell>
                          <Button
                            component={RouterLink}
                            to={`/dashboard/projects/${p.id}`}
                            size="small"
                            variant="contained"
                            sx={{
                              borderRadius: 2,
                              fontWeight: 900,
                              textTransform: "none",
                            }}
                          >
                            Open
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* Recent Tasks */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              flex: 1,
              borderRadius: 3,
              border: "1px solid #EAEAEA",
            }}
          >
            <Typography sx={{ fontWeight: 900, mb: 1 }}>آخر المهام</Typography>

            {recentTasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                لا توجد مهام حالياً.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 900 }}>المهمة</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>الحالة</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>الموعد</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>المشروع</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>فتح</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentTasks.map((t) => (
                      <TableRow key={t.id} hover>
                        <TableCell sx={{ fontWeight: 800 }}>
                          {t.title || `Task #${t.id}`}
                        </TableCell>
                        <TableCell>{statusChip(t.status)}</TableCell>
                        <TableCell>
                          {t.deadline
                            ? new Date(t.deadline).toLocaleDateString("ar-EG")
                            : "—"}
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary" }}>
                          {t.project_title ||
                            (t.project_id ? `#${t.project_id}` : "—")}
                        </TableCell>
                        <TableCell>
                          {t.project_id ? (
                            <Button
                              component={RouterLink}
                              to={`/dashboard/projects/${t.project_id}`}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderRadius: 2,
                                fontWeight: 900,
                                textTransform: "none",
                              }}
                            >
                              Open
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
          </Paper>
        </Stack>
      )}
    </Box>
  );
}
