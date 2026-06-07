import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Chip,
  Divider,
  TextField,
  CircularProgress,
  Avatar,
  alpha,
} from "@mui/material";
import toast from "react-hot-toast";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import GitHubIcon from "@mui/icons-material/GitHub";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import ProjectSectionShell from "../../components/ProjectSectionShell";
import { dashboardCardSx } from "../../styles/dashboardUi";

/** Label-value row for project metadata display. */
function MetaRow({ label, children }) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={{ xs: 0.5, sm: 2 }}
      sx={{ py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 800, minWidth: { sm: 140 }, flexShrink: 0 }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Stack>
  );
}

/** Project overview card with members, settings, and progress summary. */
export default function ProjectInfoCard({
  project,
  setProject,
  progress,
  canEditProject,
  canDeleteProject,
  handleDeleteProject,
}) {
  const { authHeaders, apiFetch, API_BASE_URL } = useAuth();
  const { t } = useLanguage();
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(project?.title || "");
  const [editDesc, setEditDesc] = useState(project?.description || "");
  const [editGithub, setEditGithub] = useState(project?.github_repo_url || "");
  const [savingProject, setSavingProject] = useState(false);

  const members = Array.isArray(project?.members) ? project.members : [];
  const owner = project?.user
    ? {
        id: project.user.id,
        name: project.user.name,
        email: project.user.email,
        isOwner: true,
      }
    : null;

  const membersWithoutOwner = members.filter((m) => {
    if (!owner) return true;
    const memberId = m.id || m.student_id || m.user_id;
    return memberId !== owner.id;
  });

  const displayMembers = owner
    ? [owner, ...membersWithoutOwner]
    : membersWithoutOwner;
  const membersCount = displayMembers.length;

  /** Saves project title, description, and GitHub URL edits. */
  const handleUpdateProject = async () => {
    if (!project?.id) return;
    if (!editTitle.trim() || !editDesc.trim())
      return toast.error(t("projectDetails.titleDescRequired"));

    try {
      setSavingProject(true);
      const { res, data } = await apiFetch(
        `${API_BASE_URL}/project/update/${project.id}`,
        {
          method: "PUT",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            title: editTitle,
            description: editDesc,
            github_repo_url: editGithub || null,
          }),
        },
      );
      if (!res.ok) return toast.error(data?.message || t("projectDetails.projectUpdateError"));

      const updated = data?.project || data;
      setProject(updated);
      setEditGithub(updated?.github_repo_url || "");
      setEditOpen(false);
      toast.success(t("projectDetails.projectUpdated"));
    } catch {
      toast.error(t("common.serverError"));
    } finally {
      setSavingProject(false);
    }
  };

  const progressValue = Math.max(0, Math.min(100, Number(progress?.percent) || 0));

  return (
    <Stack direction={{ xs: "column", lg: "row" }} spacing={2.5} sx={{ mt: 0 }}>
      <Box sx={{ flex: 1.4, minWidth: 0 }}>
        <ProjectSectionShell
          icon={InfoOutlinedIcon}
          title={t("projectDetails.projectInfo")}
          subtitle={t("projectDetails.projectInfoSubtitle")}
          accent="#2563EB"
        >
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: 2.5,
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.03)"
                  : alpha("#2563EB", 0.04),
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.75 }}>
              {project.description || t("projectDetails.noProjectDescription")}
            </Typography>
          </Paper>

          <MetaRow label={t("projectDetails.projectOwner")}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: "primary.main",
                  fontWeight: 900,
                  fontSize: "0.95rem",
                }}
              >
                {project.user?.name?.charAt(0)?.toUpperCase() || "?"}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 800 }}>{project.user?.name || "—"}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {project.user?.email || "—"}
                </Typography>
              </Box>
            </Stack>
          </MetaRow>

          <MetaRow label="GitHub">
            {project.github_repo_url ? (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  component="a"
                  href={project.github_repo_url}
                  target="_blank"
                  rel="noreferrer"
                  clickable
                  icon={<GitHubIcon />}
                  label={t("projectDetails.visitRepo")}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: "#24292e",
                    color: "white",
                    "& .MuiChip-icon": { color: "white" },
                    "&:hover": { bgcolor: "#000" },
                  }}
                />
                <Chip
                  label={t("projectDetails.linkedToSystem")}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ fontWeight: 800 }}
                />
              </Stack>
            ) : (
              <Chip
                label={t("projectDetails.githubNotLinked")}
                size="small"
                color="warning"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            )}
          </MetaRow>

          <Box sx={{ pt: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <GroupsRoundedIcon fontSize="small" color="action" />
              <Typography sx={{ fontWeight: 900 }}>
                {t("projectDetails.projectMembers")}
              </Typography>
              <Chip size="small" label={membersCount} sx={{ fontWeight: 800, height: 22 }} />
            </Stack>
            {membersCount === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t("projectDetails.noMembers")}
              </Typography>
            ) : (
              <Stack spacing={1}>
                {displayMembers.map((m) => {
                  const mid = m.id ?? m.user_id;
                  const isOwner = owner && mid === owner.id;
                  return (
                    <Stack
                      key={mid}
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: isOwner ? "primary.main" : "divider",
                        bgcolor: isOwner
                          ? (theme) => alpha(theme.palette.primary.main, 0.06)
                          : "transparent",
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          fontSize: "0.85rem",
                          fontWeight: 800,
                          bgcolor: isOwner ? "primary.main" : "grey.500",
                        }}
                      >
                        {m.name?.charAt(0)?.toUpperCase() || "?"}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800 }} noWrap>
                          {m.name}
                          {isOwner ? t("projectDetails.ownerBadge") : ""}
                        </Typography>
                        {m.email && (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {m.email}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Box>

          {canEditProject && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mt: 2.5,
                borderRadius: 2.5,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.default",
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={1.5}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <SettingsRoundedIcon fontSize="small" color="action" />
                  <Typography sx={{ fontWeight: 900 }}>
                    {t("projectDetails.projectSettings")}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setEditTitle(project?.title || "");
                      setEditDesc(project?.description || "");
                      setEditGithub(project?.github_repo_url || "");
                      setEditOpen((v) => !v);
                    }}
                    sx={{ borderRadius: 2, fontWeight: 800 }}
                  >
                    {editOpen ? t("projectDetails.close") : t("common.edit")}
                  </Button>
                  {canDeleteProject && (
                    <Button
                      color="error"
                      variant="contained"
                      size="small"
                      onClick={handleDeleteProject}
                      sx={{ borderRadius: 2, fontWeight: 800 }}
                    >
                      {t("projectDetails.deleteProject")}
                    </Button>
                  )}
                </Stack>
              </Stack>

              {editOpen && (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <TextField
                    label={t("projectDetails.projectName")}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label={t("projectDetails.projectDescription")}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    multiline
                    minRows={3}
                    fullWidth
                  />
                  <TextField
                    label={t("projectDetails.githubLink")}
                    value={editGithub}
                    onChange={(e) => setEditGithub(e.target.value)}
                    placeholder="https://github.com/username/repository"
                    fullWidth
                  />
                  <Button
                    variant="contained"
                    onClick={handleUpdateProject}
                    disabled={savingProject}
                    sx={{ borderRadius: 2, fontWeight: 900, alignSelf: "flex-start", px: 3 }}
                  >
                    {savingProject ? t("projectDetails.saving") : t("projectDetails.saveChanges")}
                  </Button>
                </Stack>
              )}
            </Paper>
          )}
        </ProjectSectionShell>
      </Box>

      <Paper
        elevation={0}
        sx={{
          ...dashboardCardSx,
          p: 2.5,
          width: { xs: "100%", lg: 320 },
          flexShrink: 0,
          alignSelf: "flex-start",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <TrendingUpRoundedIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            {t("projectDetails.progressTitle")}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {t("projectDetails.progressSubtitle")}
        </Typography>

        {progress.total === 0 ? (
          <Box
            sx={{
              py: 4,
              textAlign: "center",
              borderRadius: 2,
              border: "1px dashed",
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {t("projectDetails.noTasksForProgress")}
            </Typography>
          </Box>
        ) : (
          <Stack alignItems="center" spacing={2}>
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <CircularProgress
                variant="determinate"
                value={100}
                size={140}
                thickness={3}
                sx={{ color: (theme) => alpha(theme.palette.primary.main, 0.12) }}
              />
              <CircularProgress
                variant="determinate"
                value={progressValue}
                size={140}
                thickness={3}
                sx={{
                  position: "absolute",
                  left: 0,
                  color: "primary.main",
                  "& .MuiCircularProgress-circle": { strokeLinecap: "round" },
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: "absolute",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
                  {progressValue}%
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  {t("projectDetails.percentComplete", { percent: progressValue })}
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
              <Box
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 2,
                  textAlign: "center",
                  bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 900, color: "success.main" }}>
                  {progress.completed}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  {t("projectDetails.columnCompleted")}
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 2,
                  textAlign: "center",
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 900, color: "primary.main" }}>
                  {progress.total}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  {t("projectDetails.chartTasks")}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
