import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Grid,
  LinearProgress,
  Paper,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import ListToolbar from "../components/ListToolbar";
import PageHeader from "../components/PageHeader";
import { useLanguage } from "../context/LanguageContext";
import {
  dashboardCardSx,
  sectionPaperSx,
  accentTop,
  btnPrimarySx,
  btnOnGradientSx,
  BLUE,
  NAVY,
} from "../styles/dashboardUi";

const STATUS_COLORS = {
  completed: "#10B981",
  in_progress: BLUE,
  pending: "#F59E0B",
};

export default function Projects() {
  const { t } = useLanguage();
  const { token, user, authHeaders, apiFetch, API_BASE_URL } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newProject, setNewProject] = useState({ title: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const roleName = String(user?.role?.name || user?.role || "").toLowerCase();
  const currentUserId = Number(user?.user?.id || user?.id);
  const canCreateProject = roleName === "student" || roleName === "admin";

  const fetchProjects = async () => {
    setLoading(true);
    setError("");
    try {
      const { res, data } = await apiFetch(`${API_BASE_URL}/projects`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        setError(data?.message || t("projects.loadError"));
        setProjects([]);
        return;
      }
      const baseProjects = data?.projects?.data || data?.projects || [];
      setProjects(Array.isArray(baseProjects) ? baseProjects : []);
    } catch {
      setError(t("projects.loadError"));
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreateMessage("");
    if (!newProject.title.trim()) return;
    try {
      setCreating(true);
      const { res, data } = await apiFetch(`${API_BASE_URL}/project/create`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          title: newProject.title,
          description: newProject.description,
        }),
      });
      if (!res.ok) {
        setCreateMessage(data?.message || t("projects.loadError"));
        return;
      }
      setCreateMessage(t("projects.created"));
      setNewProject({ title: "", description: "" });
      fetchProjects();
    } catch {
      setCreateMessage(t("common.error"));
    } finally {
      setCreating(false);
    }
  };

  function derivedStatusFromProject(p) {
    const percent = p?.progress_percentage;
    if (percent != null) {
      const pr = Number(percent) || 0;
      if (pr >= 100) return "completed";
      if (pr > 0) return "in_progress";
      return "pending";
    }
    const total = Number(p?.total_tasks ?? 0);
    const completed = Number(p?.completed_tasks ?? 0);
    if (total > 0) {
      if (completed >= total) return "completed";
      if (completed > 0) return "in_progress";
      return "pending";
    }
    return String(p?.status || "pending").toLowerCase();
  }

  const visibleProjects = useMemo(() => {
    let filtered = projects;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.user?.name || "").toLowerCase().includes(q) ||
          (p.supervisor?.name || "").toLowerCase().includes(q),
      );
    }
    if (statusFilter) {
      filtered = filtered.filter(
        (p) => derivedStatusFromProject(p) === statusFilter,
      );
    }
    return filtered;
  }, [projects, searchQuery, statusFilter]);

  const relationChip = (p) => {
    if (!currentUserId) return null;
    const isOwner = Number(p.user_id) === currentUserId;
    const isSupervisor =
      Number(p.supervisor_id) === currentUserId ||
      Number(p.supervisor?.id) === currentUserId;
    if (isOwner) return <Chip size="small" color="warning" label={t("projects.owner")} />;
    if (isSupervisor) return <Chip size="small" color="info" label={t("projects.supervisor")} />;
    return <Chip size="small" color="success" label={t("projects.member")} />;
  };

  const statusChip = (status) => {
    const s = String(status || "pending").toLowerCase();
    if (s === "completed")
      return <Chip size="small" color="success" label={t("dashboard.completed")} />;
    if (s === "in_progress")
      return <Chip size="small" color="info" label={t("dashboard.inProgress")} />;
    if (s === "pending")
      return <Chip size="small" color="warning" label={t("dashboard.pending")} />;
    return <Chip size="small" variant="outlined" label={status || "—"} />;
  };

  const progressPercent = (p) => {
    const pr = p?.progress_percentage;
    if (pr != null) return Math.min(100, Math.max(0, Number(pr) || 0));
    const total = Number(p?.total_tasks ?? 0);
    const done = Number(p?.completed_tasks ?? 0);
    return total ? Math.round((done / total) * 100) : 0;
  };

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto" }}>
      <PageHeader
        title={t("projects.title")}
        subtitle={t("projects.subtitle")}
        icon={<FolderRoundedIcon />}
        actions={
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={fetchProjects}
            sx={btnOnGradientSx}
          >
            {t("common.refresh")}
          </Button>
        }
      />

      <ListToolbar
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t("projects.searchPlaceholder")}
        onRefresh={fetchProjects}
        filters={[
          {
            key: "status",
            label: t("projects.statusFilter"),
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "pending", label: t("dashboard.pending") },
              { value: "in_progress", label: t("dashboard.inProgress") },
              { value: "completed", label: t("dashboard.completed") },
            ],
          },
        ]}
      />

      {canCreateProject && (
        <Paper elevation={0} sx={sectionPaperSx}>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, color: "text.primary" }}>
            {t("projects.createTitle")}
          </Typography>
          {createMessage && (
            <Alert
              sx={{ mb: 2 }}
              severity={createMessage === t("projects.created") ? "success" : "info"}
            >
              {createMessage}
            </Alert>
          )}
          <Box component="form" onSubmit={handleCreateProject}>
            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("projects.titleLabel")}
                  value={newProject.title}
                  onChange={(e) =>
                    setNewProject((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("projects.descLabel")}
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  multiline
                  minRows={1}
                  required
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  startIcon={<AddRoundedIcon />}
                  disabled={creating}
                  sx={{ ...btnPrimarySx, py: 1.1, borderRadius: 2 }}
                >
                  {creating ? t("projects.creating") : t("projects.createBtn")}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}

      {loading && (
        <Paper elevation={0} sx={{ ...sectionPaperSx, textAlign: "center" }}>
          <CircularProgress sx={{ my: 2 }} />
          <Typography fontWeight={700}>{t("common.loading")}</Typography>
        </Paper>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && visibleProjects.length === 0 && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {t("projects.noProjects")}
        </Alert>
      )}

      {!loading && !error && visibleProjects.length > 0 && (
        <Paper elevation={0} sx={{ ...sectionPaperSx, mb: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 900, color: "text.primary" }}>
              {visibleProjects.length} {t("projects.title")}
            </Typography>
          </Stack>
          <Grid container spacing={2.5}>
            {visibleProjects.map((p) => {
              const status = derivedStatusFromProject(p);
              const pct = progressPercent(p);
              const accent = STATUS_COLORS[status] || NAVY;
              return (
                <Grid item xs={12} sm={6} lg={4} key={p.id}>
                  <Card elevation={0} sx={{ ...dashboardCardSx, ...accentTop(accent), minHeight: 300 }}>
                    <CardContent
                      sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        p: 2.5,
                        "&:last-child": { pb: 2.5 },
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        spacing={1}
                        sx={{ mb: 1 }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 900,
                            fontSize: "1.05rem",
                            lineHeight: 1.35,
                            color: "text.primary",
                          }}
                        >
                          {p.title || "—"}
                        </Typography>
                        {relationChip(p)}
                      </Stack>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 1.5,
                          flex: 1,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {p.description || "—"}
                      </Typography>

                      <Box sx={{ mb: 1.5 }}>{statusChip(status)}</Box>

                      <Stack spacing={0.75} sx={{ mb: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PersonRoundedIcon sx={{ fontSize: 17, color: "text.secondary" }} />
                          <Typography variant="body2" color="text.secondary">
                            {t("projects.ownerLabel")}:{" "}
                            <Typography component="span" fontWeight={700} color="text.primary">
                              {p.user?.name || "—"}
                            </Typography>
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <SupervisorAccountRoundedIcon
                            sx={{ fontSize: 17, color: "text.secondary" }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {t("projects.supervisorLabel")}:{" "}
                            <Typography component="span" fontWeight={700} color="text.primary">
                              {p.supervisor?.name || "—"}
                            </Typography>
                          </Typography>
                        </Stack>
                      </Stack>

                      <Box sx={{ mb: 2 }}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="caption" fontWeight={700} color="text.secondary">
                            {t("projects.progress")}
                          </Typography>
                          <Typography variant="caption" fontWeight={800} sx={{ color: accent }}>
                            {pct}%
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: "action.hover",
                            "& .MuiLinearProgress-bar": { bgcolor: accent },
                          }}
                        />
                      </Box>

                      {p.id && (
                        <Button
                          component={Link}
                          to={`/dashboard/projects/${p.id}`}
                          variant="contained"
                          fullWidth
                          endIcon={<ArrowOutwardRoundedIcon />}
                          sx={{
                            ...btnPrimarySx,
                            mt: "auto",
                            borderRadius: 2,
                            py: 1.1,
                          }}
                        >
                          {t("projects.open")}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      )}
    </Box>
  );
}
