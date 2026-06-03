import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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

const API_BASE_URL = "http://127.0.0.1:8000/api";

// 🎯 تأثير التحويم الموحد للبطاقات
const hoverEffect = {
  transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },
};

export default function Dashboard() {
  const { user, token: ctxToken } = useAuth();
  const navigate = useNavigate();

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
      return (
        <Chip
          size="small"
          color="error"
          label="مدير النظام"
          icon={<AdminPanelSettingsRoundedIcon />}
          sx={{ fontWeight: 800 }}
        />
      );
    if (role === "supervisor")
      return (
        <Chip size="small" color="info" label="مشرف" sx={{ fontWeight: 800 }} />
      );
    if (role === "student")
      return (
        <Chip
          size="small"
          color="success"
          label="طالب"
          sx={{ fontWeight: 800 }}
        />
      );
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

    if (res.status === 429) {
      toast.error(
        "ضغط كبير على السيرفر (Too Many Attempts). يرجى الانتظار ثوانٍ وتحديث الصفحة.",
      );
    }

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "تعذر جلب المشاريع");

    const projectsArray = data?.projects?.data || data?.projects || [];
    return Array.isArray(projectsArray) ? projectsArray : [];
  };

  const fetchProjectTasks = async (projectId) => {
    const res = await fetch(`${API_BASE_URL}/project/${projectId}/tasks`, {
      headers: authHeaders,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return [];
    return data?.tasks || [];
  };

  const fetchPendingInvites = async () => {
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

        const projects = await fetchProjects();
        const recentProjs = sortByDateDesc(projects).slice(0, 3);
        const taskLists = await Promise.all(
          recentProjs.map((p) => fetchProjectTasks(p.id)),
        );

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

  // 🎯 إعدادات الواجهة الذكية بناءً على الصلاحيات
  const dashboardConfig = {
    admin: {
      greeting: "نظرة شاملة على النظام، تحكم بالمشاريع والدعوات بسلاسة.",
      projectsTitle: "إجمالي مشاريع النظام",
      tasksTitle: "إجمالي المهام المسجلة",
      invitesTitle: "كل الدعوات المعلقة",
      action1: {
        label: "إدارة المشاريع",
        icon: <FolderOpenRoundedIcon />,
        to: "/dashboard/projects",
      },
      action2: {
        label: "إدارة المستخدمين",
        icon: <AdminPanelSettingsRoundedIcon />,
        to: "#",
      }, // يمكن تغييره لصفحة المستخدمين مستقبلاً
    },
    supervisor: {
      greeting: "تابع أداء الطلاب والمشاريع التي تشرف عليها بكل سهولة.",
      projectsTitle: "مشاريع تحت إشرافك",
      tasksTitle: "مهام المشاريع المُشرف عليها",
      invitesTitle: "طلبات إشراف معلقة",
      action1: {
        label: "مشاريع الإشراف",
        icon: <FolderOpenRoundedIcon />,
        to: "/dashboard/projects",
      },
      action2: {
        label: "طلبات الإشراف",
        icon: <PersonAddAltRoundedIcon />,
        to: "/dashboard/supervisor/invitations",
      },
    },
    student: {
      greeting: "تابع مشاريعك، أنجز مهامك، وحقق أهدافك بسرعة.",
      projectsTitle: "مشاريعك الحالية",
      tasksTitle: "المهام المطلوبة منك",
      invitesTitle: "دعوات فرق معلقة",
      action1: {
        label: "مشاريعي",
        icon: <FolderOpenRoundedIcon />,
        to: "/dashboard/projects",
      },
      action2: {
        label: "دعوات الانضمام",
        icon: <PersonAddAltRoundedIcon />,
        to: "/dashboard/student/invitations",
      },
    },
  };

  // جلب الإعداد المناسب للدور الحالي (مع وضع افتراضي للطالب إذا لم يُعرف الدور)
  const currentConfig = dashboardConfig[role] || dashboardConfig.student;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto" }}>
      {/* 🎯 Header الذكي */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: "1px solid #EAEAEA",
          bgcolor: role === "admin" ? "rgba(211, 47, 47, 0.02)" : "transparent", // تمييز خفيف للمدير
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Box>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <DashboardRoundedIcon color="primary" fontSize="large" />
              <Typography variant="h4" sx={{ fontWeight: 900 }}>
                الرئيسية
              </Typography>
              {roleChip()}
            </Stack>
            <Typography
              variant="subtitle1"
              sx={{ color: "text.secondary", fontWeight: 500 }}
            >
              مرحباً <b>{name}</b>، {currentConfig.greeting}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <Button
              component={RouterLink}
              to={currentConfig.action1.to}
              variant="contained"
              startIcon={currentConfig.action1.icon}
              sx={{ borderRadius: 2, fontWeight: 800, px: 3 }}
            >
              {currentConfig.action1.label}
            </Button>
            <Button
              component={RouterLink}
              to={currentConfig.action2.to}
              variant="outlined"
              startIcon={currentConfig.action2.icon}
              sx={{ borderRadius: 2, fontWeight: 800, px: 3 }}
            >
              {currentConfig.action2.label}
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* 🎯 Progress Bar المطور */}
        {loading ? (
          <Stack direction="row" spacing={2} alignItems="center">
            <CircularProgress size={20} />
            <Typography sx={{ fontWeight: 700 }} color="text.secondary">
              جارِ تحميل البيانات...
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
                  مؤشر الإنجاز العام
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
              تم إنجاز {stats.tasksCompleted} من أصل {stats.tasksTotal} مهمة
              نشطة.
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
              title: "المشاريع",
              value: stats.projectsTotal,
              icon: <FolderOpenRoundedIcon fontSize="large" />,
              desc: currentConfig.projectsTitle,
              color: "#3B82F6",
            },
            {
              title: "المهام",
              value: stats.tasksTotal,
              icon: <ListAltRoundedIcon fontSize="large" />,
              desc: currentConfig.tasksTitle,
              color: "#8B5CF6",
            },
            {
              title: "المنجز",
              value: stats.tasksCompleted,
              icon: <CheckCircleRoundedIcon fontSize="large" />,
              desc: "مهام تم إكمالها بنجاح",
              color: "#10B981",
            },
            {
              title: "الدعوات",
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
                  أحدث المشاريع النشطة
                </Typography>
                <Button
                  component={RouterLink}
                  to="/dashboard/projects"
                  size="small"
                  sx={{ fontWeight: 800 }}
                >
                  عرض الكل
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
                  لا توجد مشاريع حالياً.
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, py: 1.5 }}>
                          اسم المشروع
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, py: 1.5 }}>
                          الحالة
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 800, py: 1.5, textAlign: "left" }}
                        >
                          إجراء
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
                              دخول
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
                آخر المهام المحدثة
              </Typography>
            </Box>

            <Box sx={{ p: recentTasks.length === 0 ? 3 : 0 }}>
              {recentTasks.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                >
                  لا توجد مهام حالياً.
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, py: 1.5 }}>
                          المهمة
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, py: 1.5 }}>
                          الحالة
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, py: 1.5 }}>
                          الارتباط
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 800, py: 1.5, textAlign: "left" }}
                        >
                          إجراء
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentTasks.map((t) => (
                        <TableRow
                          key={t.id}
                          hover
                          sx={{ "&:last-child td": { border: 0 } }}
                        >
                          <TableCell sx={{ fontWeight: 700 }}>
                            {t.title || `Task #${t.id}`}
                            <Typography
                              variant="caption"
                              sx={{ display: "block", color: "text.secondary" }}
                            >
                              الموعد:{" "}
                              {t.deadline
                                ? new Date(t.deadline).toLocaleDateString(
                                    "ar-EG",
                                  )
                                : "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>{statusChip(t.status)}</TableCell>
                          <TableCell
                            sx={{
                              color: "text.secondary",
                              fontSize: "0.85rem",
                              maxWidth: 120,
                            }}
                            noWrap
                          >
                            {t.project_title ||
                              (t.project_id ? `مشروع #${t.project_id}` : "—")}
                          </TableCell>
                          <TableCell sx={{ textAlign: "left" }}>
                            {t.project_id ? (
                              <Button
                                component={RouterLink}
                                to={`/dashboard/projects/${t.project_id}?tab=tasks`}
                                size="small"
                                variant="outlined"
                                sx={{ borderRadius: 1.5, fontWeight: 700 }}
                              >
                                معاينة
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
