import React, { useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  useParams,
  Link as RouterLink,
  useLocation,
} from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import CommentsTab from "./ProjectDetails/CommentsTab";
import VersionsTab from "./ProjectDetails/VersionsTab";
import TasksTab from "./ProjectDetails/TasksTab";
import InvitationsSection from "./ProjectDetails/InvitationsSection";
import ProjectInfoCard from "./ProjectDetails/ProjectInfoCard";
import ProjectCharts from "./ProjectDetails/ProjectCharts";
import { useAuth } from "../context/AuthContext";
import ProjectTimeline from "./ProjectDetails/ProjectTimeline";

import toast from "react-hot-toast";

// MUI
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Chip,
  Skeleton,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";

// Icons
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import ExitToAppRoundedIcon from "@mui/icons-material/ExitToAppRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import FolderZipRoundedIcon from "@mui/icons-material/FolderZipRounded";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // 🎯 حالة التبويب النشط (0 = نظرة عامة، 1 = المهام، الخ)
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const githubStatus = params.get("github");

    if (githubStatus === "success") {
      toast.success("تم ربط حسابك بـ GitHub بنجاح! 🐙", {
        duration: 5000,
        style: { fontWeight: "bold" },
      });
      window.history.replaceState(null, "", window.location.pathname);
    } else if (githubStatus === "error") {
      toast.error("فشل ربط حساب GitHub ❌");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [location.search]);

  const { token, user, authHeaders, apiFetch, API_BASE_URL } = useAuth();
  const currentUserId = user?.user?.id;
  const currentRole = user?.role;

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [versions, setVersions] = useState([]);
  const [progress, setProgress] = useState({
    total: 0,
    completed: 0,
    percent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    title: "",
    content: "",
    confirmText: "تأكيد",
    confirmColor: "primary",
    onConfirm: null,
  });
  const [dialogLoading, setDialogLoading] = useState(false);
  const closeDialog = () =>
    setDialogConfig((prev) => ({ ...prev, isOpen: false }));

  const statusChip = (status) => {
    const s = (status || "pending").toLowerCase();
    if (s === "completed")
      return (
        <Chip
          size="small"
          color="success"
          label="مكتمل"
          sx={{ fontWeight: 700 }}
        />
      );
    if (s === "in_progress")
      return (
        <Chip
          size="small"
          color="info"
          label="قيد التنفيذ"
          sx={{ fontWeight: 700 }}
        />
      );
    if (s === "pending")
      return (
        <Chip
          size="small"
          color="warning"
          label="قيد الانتظار"
          sx={{ fontWeight: 700 }}
        />
      );
    return <Chip size="small" variant="outlined" label={status || "—"} />;
  };

  const normalizeFileUrl = (v) => {
    if (!v) return v;
    if (v.file_url) return v;
    if (v.file_path) {
      const base = API_BASE_URL.replace("/api", "");
      return { ...v, file_url: `${base}/storage/${v.file_path}` };
    }
    return v;
  };

  const derivedProjectStatus = useMemo(() => {
    if (!progress?.total || Number(progress.total) === 0)
      return (project?.status || "pending").toLowerCase();
    if (Number(progress.percent) >= 100) return "completed";
    if (Number(progress.completed) > 0 || Number(progress.percent) > 0)
      return "in_progress";
    return "pending";
  }, [progress, project?.status]);

  const membersCount =
    (Array.isArray(project?.members) ? project.members.length : 0) +
    (project?.user ? 1 : 0);

  const canInviteSupervisor =
    (currentRole === "student" &&
      project &&
      currentUserId === project.user_id) ||
    currentRole === "admin";
  const canManageProject =
    currentRole === "admin" ||
    (project && currentUserId === project.user_id) ||
    (project && currentUserId === project.supervisor_id);
  const canUploadVersion =
    currentRole === "admin" ||
    (project && currentUserId === project.user_id) ||
    (project && currentUserId === project.supervisor_id) ||
    currentRole === "student";
  const canLeaveSupervision =
    (currentRole === "supervisor" &&
      project &&
      currentUserId === project.supervisor_id) ||
    currentRole === "admin";
  const canEditProject =
    currentRole === "admin" ||
    (project && currentUserId === project.user_id) ||
    (project && currentUserId === project.supervisor_id);
  const canDeleteProject =
    currentRole === "admin" || (project && currentUserId === project.user_id);

  useEffect(() => {
    if (!token) return navigate("/login");
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError("");
        const headers = authHeaders();
        const [projectR, tasksR, progressR, commentsR, versionsR] =
          await Promise.all([
            apiFetch(`${API_BASE_URL}/project/${id}`, { headers }),
            apiFetch(`${API_BASE_URL}/project/${id}/tasks`, { headers }),
            apiFetch(`${API_BASE_URL}/project/${id}/progress`, { headers }),
            apiFetch(`${API_BASE_URL}/project/${id}/comments`, { headers }),
            apiFetch(`${API_BASE_URL}/project/${id}/versions`, { headers }),
          ]);

        if (!projectR.res.ok) {
          throw new Error(
            projectR.data?.message || "تعذر جلب بيانات المشروع",
          );
        }

        const p = projectR.data?.project || projectR.data;
        setProject(p);

        if (tasksR.res.ok) {
          setTasks(tasksR.data?.tasks || []);
        }
        if (progressR.res.ok) {
          setProgress({
            total: progressR.data?.total_tasks ?? 0,
            completed: progressR.data?.completed_tasks ?? 0,
            percent: progressR.data?.progress_percentage ?? 0,
          });
        }
        if (commentsR.res.ok) {
          setComments(commentsR.data?.comments || []);
        }
        if (versionsR.res.ok) {
          setVersions((versionsR.data?.versions || []).map(normalizeFileUrl));
        }
      } catch (e) {
        setError(e?.message || "حدث خطأ غير متوقع");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, token, navigate, authHeaders, apiFetch, API_BASE_URL]);

  const handleLeaveSupervision = () => {
    if (!project?.id) return;
    setDialogConfig({
      isOpen: true,
      title: "إلغاء الإشراف؟",
      content: "هل أنت متأكد من رغبتك في التوقف عن الإشراف على هذا المشروع؟",
      confirmText: "نعم، إلغاء الإشراف",
      confirmColor: "warning",
      onConfirm: async () => {
        try {
          setDialogLoading(true);
          const { res } = await apiFetch(
            `${API_BASE_URL}/project/${project.id}/leave-supervision`,
            { method: "POST", headers: authHeaders() },
          );
          if (!res.ok) {
            toast.error("تعذر تنفيذ العملية ❌");
            return;
          }
          toast.success("تم إلغاء الإشراف بنجاح 👋");
          setProject((prev) =>
            prev ? { ...prev, supervisor_id: null, supervisor: null } : prev,
          );
          closeDialog();
        } catch {
          toast.error("حدث خطأ في الاتصال 🌐");
        } finally {
          setDialogLoading(false);
        }
      },
    });
  };

  const handleDeleteProject = () => {
    setDialogConfig({
      isOpen: true,
      title: "حذف المشروع نهائياً؟",
      content:
        "هل أنت متأكد أنك تريد حذف هذا المشروع؟ سيتم حذف جميع المهام، التعليقات، والإصدارات المرتبطة به ولن تتمكن من استعادتها.",
      confirmText: "نعم، احذف المشروع",
      confirmColor: "error",
      onConfirm: async () => {
        try {
          setDialogLoading(true);
          const { res } = await apiFetch(
            `${API_BASE_URL}/project/delete/${id}`,
            { method: "DELETE", headers: authHeaders() },
          );
          if (!res.ok) {
            toast.error("تعذر حذف المشروع ❌");
            return;
          }
          toast.success("تم حذف المشروع بنجاح 🗑️");
          closeDialog();
          navigate("/dashboard/projects");
        } catch {
          toast.error("حدث خطأ في الاتصال 🌐");
        } finally {
          setDialogLoading(false);
        }
      },
    });
  };

  const updateProgressLocally = async (currentTasks) => {
    const total = currentTasks.length;
    const completed = currentTasks.filter(
      (t) => t.status === "completed",
    ).length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    setProgress({ total, completed, percent });
    if (project?.id) {
      try {
        await apiFetch(`${API_BASE_URL}/project/${project.id}/progress`, {
          headers: authHeaders(),
        });
      } catch (e) {}
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          p: { xs: 2, md: 3 },
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* هيكل الهيدر العلوي */}
        <Skeleton
          variant="rounded"
          width="100%"
          height={110}
          sx={{ mb: 3, borderRadius: 3 }}
          animation="wave"
        />

        {/* هيكل قسم المعلومات (مربع كبير ومربع صغير بجانبه) */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Skeleton
            variant="rounded"
            width="100%"
            height={280}
            sx={{ borderRadius: 3, flex: 2 }}
            animation="wave"
          />
          <Skeleton
            variant="rounded"
            width="100%"
            height={280}
            sx={{ borderRadius: 3, flex: 1 }}
            animation="wave"
          />
        </Stack>

        {/* هيكل شريط التبويبات */}
        <Skeleton
          variant="rounded"
          width="100%"
          height={55}
          sx={{ mb: 2, borderRadius: 2 }}
          animation="wave"
        />

        {/* هيكل المحتوى السفلي */}
        <Skeleton
          variant="rounded"
          width="100%"
          height={300}
          sx={{ borderRadius: 3 }}
          animation="wave"
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          startIcon={<ArrowBackRoundedIcon />}
        >
          رجوع
        </Button>
      </Box>
    );
  }

  if (!project)
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">المشروع غير موجود.</Alert>
      </Box>
    );

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
      {/* 1. Header (ثابت دائماً) */}
      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 3, border: "1px solid #EAEAEA", mb: 3 }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems="center"
        >
          <Box sx={{ width: "100%" }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: "#172B4D" }}>
              {project.title}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mt: 1.5, flexWrap: "wrap", gap: 1 }}
            >
              {statusChip(derivedProjectStatus)}
              {project.supervisor?.name && (
                <Chip
                  size="small"
                  icon={<SchoolRoundedIcon />}
                  label={`المشرف: ${project.supervisor.name}`}
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              )}
              <Chip
                size="small"
                variant="outlined"
                label={`الأعضاء: ${membersCount}`}
                sx={{ fontWeight: 600 }}
              />
            </Stack>
          </Box>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ minWidth: "max-content", mt: { xs: 2, md: 0 } }}
          >
            {canLeaveSupervision && project.supervisor_id && (
              <Button
                color="error"
                variant="outlined"
                startIcon={<ExitToAppRoundedIcon />}
                onClick={handleLeaveSupervision}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                إلغاء الإشراف
              </Button>
            )}
            <Button
              component={RouterLink}
              to="/dashboard/projects"
              variant="contained"
              color="inherit"
              startIcon={<ArrowBackRoundedIcon />}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              رجوع
            </Button>
          </Stack>
        </Stack>

        {/* 2. شريط التبويبات الأنيق */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 4 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTab-root": {
                fontWeight: 800,
                fontSize: "1rem",
                textTransform: "none",
                minHeight: "48px",
              },
            }}
          >
            <Tab
              icon={<DashboardRoundedIcon />}
              iconPosition="start"
              label="نظرة عامة"
            />
            <Tab
              icon={<TaskAltRoundedIcon />}
              iconPosition="start"
              label="المهام"
            />
            <Tab
              icon={<ForumRoundedIcon />}
              iconPosition="start"
              label="التعليقات"
            />
            <Tab
              icon={<FolderZipRoundedIcon />}
              iconPosition="start"
              label="الإصدارات وملفات العمل"
            />
            <Tab
              icon={<TaskAltRoundedIcon />}
              iconPosition="start"
              label="سجل النشاطات ⏱️"
            />
          </Tabs>
        </Box>
      </Paper>

      {/* 3. المحتوى المتغير بناءً على التبويب النشط */}
      <Box sx={{ minHeight: "60vh" }}>
        {/* التبويب 0: نظرة عامة (المعلومات والدعوات) */}
        {activeTab === 0 && (
          <Box>
            <ProjectInfoCard
              project={project}
              setProject={setProject}
              progress={progress}
              canEditProject={canEditProject}
              canDeleteProject={canDeleteProject}
              handleDeleteProject={handleDeleteProject}
              authHeaders={authHeaders}
            />
            <ProjectCharts tasks={tasks} />
            <InvitationsSection
              projectId={id}
              project={project}
              authHeaders={authHeaders}
              canInviteSupervisor={canInviteSupervisor}
              canManageProject={canManageProject}
            />
          </Box>
        )}

        {/* التبويب 1: المهام */}
        {activeTab === 1 && (
          <TasksTab
            projectId={project.id}
            tasks={tasks}
            setTasks={setTasks}
            authHeaders={authHeaders}
            updateProgressLocally={updateProgressLocally}
            setDialogConfig={setDialogConfig}
            setDialogLoading={setDialogLoading}
            closeDialog={closeDialog}
          />
        )}

        {/* التبويب 2: التعليقات */}
        {activeTab === 2 && (
          <CommentsTab
            projectId={id}
            comments={comments}
            setComments={setComments}
            currentUserId={currentUserId}
            currentRole={currentRole}
            authHeaders={authHeaders}
            setDialogConfig={setDialogConfig}
            setDialogLoading={setDialogLoading}
            closeDialog={closeDialog}
          />
        )}

        {/* التبويب 3: الإصدارات */}
        {activeTab === 3 && (
          <VersionsTab
            projectId={id}
            project={project}
            versions={versions}
            setVersions={setVersions}
            currentUserId={currentUserId}
            currentRole={currentRole}
            authHeaders={authHeaders}
            canUploadVersion={canUploadVersion}
            normalizeFileUrl={normalizeFileUrl}
            setDialogConfig={setDialogConfig}
            setDialogLoading={setDialogLoading}
            closeDialog={closeDialog}
          />
        )}

        {/* التبويب 4: سجل النشاطات */}
        {activeTab === 4 && (
          <ProjectTimeline projectId={id} authHeaders={authHeaders} />
        )}
      </Box>

      {/* نافذة التأكيد الشاملة */}
      <ConfirmDialog
        open={dialogConfig.isOpen}
        title={dialogConfig.title}
        content={dialogConfig.content}
        confirmText={dialogConfig.confirmText}
        confirmColor={dialogConfig.confirmColor}
        loading={dialogLoading}
        onClose={closeDialog}
        onConfirm={dialogConfig.onConfirm}
      />
    </Box>
  );
}
