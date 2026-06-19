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
import { useLanguage } from "../context/LanguageContext";
import { textEllipsisSx } from "../styles/textEllipsis";
import ProjectTimeline from "./ProjectDetails/ProjectTimeline";

import toast from "react-hot-toast";

import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Chip,
  Skeleton,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import ExitToAppRoundedIcon from "@mui/icons-material/ExitToAppRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import FolderZipRoundedIcon from "@mui/icons-material/FolderZipRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import { getRoleTheme } from "../config/roleTheme";
import { rtlSafeGradientStyle } from "../utils/rtlSafeGradient";

/** Project detail page with tabbed overview, tasks, comments, versions, and timeline. */
export default function ProjectDetails() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(0);

  const { token, user, authHeaders, apiFetch, API_BASE_URL } = useAuth();
  const currentUserId = user?.user?.id ?? user?.id;
  const currentRole = String(
    user?.role?.name ?? user?.role ?? "",
  ).toLowerCase();
  const roleTheme = getRoleTheme(currentRole);

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
    confirmText: "",
    confirmColor: "primary",
    onConfirm: null,
  });
  const [dialogLoading, setDialogLoading] = useState(false);

  /** Closes the global confirmation dialog. */
  const closeDialog = () =>
    setDialogConfig((prev) => ({ ...prev, isOpen: false }));

  const headerChipSx = {
    fontWeight: 700,
    bgcolor: "rgba(255,255,255,0.14)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.25)",
    "& .MuiChip-icon": { color: "#fff" },
  };

  /** Renders a localized status chip for the project header. */
  const statusChip = (status) => {
    const s = (status || "pending").toLowerCase();
    if (s === "completed")
      return (
        <Chip
          size="small"
          label={t("projectDetails.columnCompleted")}
          sx={headerChipSx}
        />
      );
    if (s === "in_progress")
      return (
        <Chip
          size="small"
          label={t("projectDetails.columnInProgress")}
          sx={headerChipSx}
        />
      );
    if (s === "pending")
      return (
        <Chip
          size="small"
          label={t("projectDetails.columnPending")}
          sx={headerChipSx}
        />
      );
    return <Chip size="small" label={status || "—"} sx={headerChipSx} />;
  };

  /** Ensures version records include a full storage file URL. */
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
  const showInvitesTab = canInviteSupervisor || canManageProject;

  const canGenerateAiTasks = useMemo(() => {
    if (currentRole !== "student" || !project || !currentUserId) return false;
    if (currentUserId === project.user_id) return true;
    if (!Array.isArray(project.members)) return false;
    return project.members.some((m) => {
      const memberId = m.id ?? m.student_id;
      const status = m.pivot?.status ?? m.status;
      return memberId === currentUserId && status === "accepted";
    });
  }, [currentRole, project, currentUserId]);

  const tabDefs = useMemo(() => {
    const defs = [
      {
        id: "overview",
        icon: DashboardRoundedIcon,
        label: t("projectDetails.tabOverview"),
      },
    ];
    if (showInvitesTab) {
      defs.push({
        id: "invites",
        icon: PersonAddAltRoundedIcon,
        label: t("projectDetails.tabInvites"),
      });
    }
    defs.push(
      {
        id: "tasks",
        icon: TaskAltRoundedIcon,
        label: t("projectDetails.tabTasks"),
      },
      {
        id: "comments",
        icon: ForumRoundedIcon,
        label: t("projectDetails.tabComments"),
      },
      {
        id: "versions",
        icon: FolderZipRoundedIcon,
        label: t("projectDetails.tabVersions"),
      },
      {
        id: "timeline",
        icon: HistoryRoundedIcon,
        label: t("projectDetails.tabTimeline"),
      },
    );
    return defs;
  }, [showInvitesTab, t]);

  const activeTabId = tabDefs[activeTab]?.id ?? "overview";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab") || "overview";
    const idx = tabDefs.findIndex((d) => d.id === tab);
    if (idx >= 0) setActiveTab(idx);
  }, [location.search, tabDefs]);

  useEffect(() => {
    if (!token) return navigate("/login");

    /** Loads project, tasks, progress, comments, and versions from the API. */
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
            projectR.data?.message || t("projectDetails.loadError"),
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
        setError(e?.message || t("projectDetails.unexpectedError"));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, navigate, authHeaders, apiFetch, API_BASE_URL, t]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const githubStatus = params.get("github");

    if (githubStatus === "success") {
      toast.success(t("projectDetails.githubLinked"), {
        duration: 5000,
        style: { fontWeight: "bold" },
      });
    } else if (githubStatus === "error") {
      toast.error(t("projectDetails.githubLinkFailed"));
    }

    if (githubStatus) {
      const clean = new URLSearchParams(location.search);
      clean.delete("github");
      clean.delete("reason");
      const qs = clean.toString();
      window.history.replaceState(
        null,
        "",
        qs ? `${location.pathname}?${qs}` : location.pathname,
      );
    }
  }, [location.search, location.pathname, t]);

  /** Opens confirmation to leave supervision of this project. */
  const handleLeaveSupervision = () => {
    if (!project?.id) return;
    setDialogConfig({
      isOpen: true,
      title: t("projectDetails.cancelSupervisionTitle"),
      content: t("projectDetails.cancelSupervisionContent"),
      confirmText: t("projectDetails.cancelSupervisionConfirm"),
      confirmColor: "warning",
      onConfirm: async () => {
        try {
          setDialogLoading(true);
          const { res } = await apiFetch(
            `${API_BASE_URL}/project/${project.id}/leave-supervision`,
            { method: "POST", headers: authHeaders() },
          );
          if (!res.ok) {
            toast.error(t("projectDetails.operationFailed"));
            return;
          }
          toast.success(t("projectDetails.cancelSupervisionSuccess"));
          setProject((prev) =>
            prev ? { ...prev, supervisor_id: null, supervisor: null } : prev,
          );
          closeDialog();
        } catch {
          toast.error(t("common.serverError"));
        } finally {
          setDialogLoading(false);
        }
      },
    });
  };

  /** Opens confirmation to permanently delete this project. */
  const handleDeleteProject = () => {
    setDialogConfig({
      isOpen: true,
      title: t("projectDetails.deleteProjectTitle"),
      content: t("projectDetails.deleteProjectContent"),
      confirmText: t("projectDetails.deleteProjectConfirm"),
      confirmColor: "error",
      onConfirm: async () => {
        try {
          setDialogLoading(true);
          const { res } = await apiFetch(
            `${API_BASE_URL}/project/delete/${id}`,
            { method: "DELETE", headers: authHeaders() },
          );
          if (!res.ok) {
            toast.error(t("projectDetails.operationFailed"));
            return;
          }
          toast.success(t("projectDetails.deleteProjectSuccess"));
          closeDialog();
          navigate("/dashboard/projects");
        } catch {
          toast.error(t("common.serverError"));
        } finally {
          setDialogLoading(false);
        }
      },
    });
  };

  /** Recalculates local progress stats and syncs with the API. */
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
      } catch {
        /* progress sync is best-effort */
      }
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          p: { xs: 2, md: 3 },
          width: "100%",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            mb: 3,
            overflow: "hidden",
          }}
        >
          <Box sx={{ px: 2, py: 1.75, bgcolor: "primary.main" }}>
            <Skeleton
              variant="text"
              width="40%"
              height={32}
              sx={{ bgcolor: "rgba(255,255,255,0.25)" }}
            />
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              {[80, 100, 70].map((w) => (
                <Skeleton
                  key={w}
                  variant="rounded"
                  width={w}
                  height={24}
                  sx={{ borderRadius: 4, bgcolor: "rgba(255,255,255,0.2)" }}
                />
              ))}
            </Stack>
          </Box>
          <Box sx={{ px: 2, py: 1.5, bgcolor: "background.paper" }}>
            <Stack direction="row" spacing={2}>
              {[110, 90, 100, 130, 120].map((w) => (
                <Skeleton key={w} variant="text" width={w} height={32} />
              ))}
            </Stack>
          </Box>
        </Paper>

        <Skeleton
          variant="rounded"
          width="100%"
          height={360}
          sx={{ borderRadius: 3 }}
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
          {t("projectDetails.back")}
        </Button>
      </Box>
    );
  }

  if (!project)
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">{t("projectDetails.notFound")}</Alert>
      </Box>
    );

  return (
    <Box
      sx={{
        px: { xs: 1.5, sm: 2, md: 2.5 },
        pt: { xs: 1, md: 1.5 },
        pb: 2,
        width: "100%",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: "1px solid",
          borderColor: "divider",
          mb: 1.5,
          overflow: "hidden",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "none"
              : "0 4px 16px rgba(15,23,42,0.06)",
        }}
      >
        <Box
          style={rtlSafeGradientStyle(roleTheme.gradient)}
          sx={{
            px: { xs: 1.5, md: 2 },
            py: { xs: 1.25, md: 1.5 },
            color: "#fff",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.25}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  lineHeight: 1.2,
                  fontSize: { xs: "1.15rem", md: "1.35rem" },
                  ...textEllipsisSx,
                }}
              >
                {project.title}
              </Typography>
              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{ mt: 0.75, flexWrap: "wrap", gap: 0.5 }}
              >
                {statusChip(derivedProjectStatus)}
                {project.supervisor?.name && (
                  <Chip
                    size="small"
                    icon={
                      <SchoolRoundedIcon sx={{ fontSize: "16px !important" }} />
                    }
                    label={t("projectDetails.supervisorLabel", {
                      name: project.supervisor.name,
                    })}
                    sx={{
                      height: 24,
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      bgcolor: "rgba(255,255,255,0.14)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.25)",
                      "& .MuiChip-icon": { color: "#fff" },
                    }}
                  />
                )}
                <Chip
                  size="small"
                  label={t("projectDetails.membersLabel", {
                    count: membersCount,
                  })}
                  sx={{
                    height: 24,
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    bgcolor: "rgba(255,255,255,0.14)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.25)",
                  }}
                />
              </Stack>
            </Box>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ flexShrink: 0 }}
            >
              {canLeaveSupervision && project.supervisor_id && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ExitToAppRoundedIcon />}
                  onClick={handleLeaveSupervision}
                  sx={{
                    borderRadius: 1.5,
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    py: 0.5,
                    color: "#fff",
                    borderColor: "rgba(255,255,255,0.55)",
                    "&:hover": {
                      borderColor: "#fff",
                      bgcolor: "rgba(255,255,255,0.1)",
                    },
                  }}
                >
                  {t("projectDetails.cancelSupervision")}
                </Button>
              )}
              <Button
                component={RouterLink}
                to="/dashboard/projects"
                size="small"
                variant="outlined"
                startIcon={<ArrowBackRoundedIcon />}
                sx={{
                  borderRadius: 1.5,
                  fontWeight: 800,
                  fontSize: "0.8rem",
                  py: 0.5,
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.55)",
                  "&:hover": {
                    borderColor: "#fff",
                    bgcolor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                {t("projectDetails.back")}
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ px: { xs: 0.5, md: 1 }, bgcolor: "background.paper" }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 44,
              "& .MuiTab-root": {
                fontWeight: 800,
                fontSize: "0.88rem",
                textTransform: "none",
                minHeight: 44,
                py: 1,
                gap: 0.5,
              },
              "& .Mui-selected": { color: "primary.main" },
              "& .MuiTabs-indicator": {
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
            }}
          >
            {tabDefs.map((tab) => (
              <Tab
                key={tab.id}
                icon={React.createElement(tab.icon)}
                iconPosition="start"
                label={tab.label}
              />
            ))}
          </Tabs>
        </Box>
      </Paper>

      <Box sx={{ minHeight: "60vh", width: "100%" }}>
        {activeTabId === "overview" && (
          <Stack spacing={2}>
            <ProjectInfoCard
              project={project}
              setProject={setProject}
              progress={progress}
              canEditProject={canEditProject}
              canDeleteProject={canDeleteProject}
              handleDeleteProject={handleDeleteProject}
            />
            <ProjectCharts tasks={tasks} />
          </Stack>
        )}

        {activeTabId === "invites" && (
          <InvitationsSection
            projectId={id}
            project={project}
            canInviteSupervisor={canInviteSupervisor}
            canManageProject={canManageProject}
          />
        )}

        {activeTabId === "tasks" && (
          <TasksTab
            projectId={project.id}
            projectDescription={project?.description}
            showAiGenerate={canGenerateAiTasks}
            tasks={tasks}
            setTasks={setTasks}
            updateProgressLocally={updateProgressLocally}
            setDialogConfig={setDialogConfig}
            setDialogLoading={setDialogLoading}
            closeDialog={closeDialog}
          />
        )}

        {activeTabId === "comments" && (
          <CommentsTab
            projectId={id}
            comments={comments}
            setComments={setComments}
            currentUserId={currentUserId}
            currentRole={currentRole}
            setDialogConfig={setDialogConfig}
            setDialogLoading={setDialogLoading}
            closeDialog={closeDialog}
          />
        )}

        {activeTabId === "versions" && (
          <VersionsTab
            projectId={id}
            project={project}
            versions={versions}
            setVersions={setVersions}
            currentUserId={currentUserId}
            currentRole={currentRole}
            canUploadVersion={canUploadVersion}
            normalizeFileUrl={normalizeFileUrl}
            setDialogConfig={setDialogConfig}
            setDialogLoading={setDialogLoading}
            closeDialog={closeDialog}
          />
        )}

        {activeTabId === "timeline" && <ProjectTimeline projectId={id} />}
      </Box>

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
