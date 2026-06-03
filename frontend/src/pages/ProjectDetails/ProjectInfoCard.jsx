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
  LinearProgress,
} from "@mui/material";
import toast from "react-hot-toast";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function ProjectInfoCard({
  project,
  setProject,
  progress,
  canEditProject,
  canDeleteProject,
  handleDeleteProject,
  authHeaders,
}) {
  // الحالات الخاصة بتعديل المشروع
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(project?.title || "");
  const [editDesc, setEditDesc] = useState(project?.description || "");
  const [editGithub, setEditGithub] = useState(project?.github_repo_url || "");
  const [savingProject, setSavingProject] = useState(false);

  // حساب الأعضاء والمالك
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

  // دالة تحديث المشروع
  const handleUpdateProject = async () => {
    if (!project?.id) return;
    if (!editTitle.trim() || !editDesc.trim())
      return toast.error("أدخل العنوان والوصف");

    try {
      setSavingProject(true);
      const res = await fetch(`${API_BASE_URL}/project/update/${project.id}`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDesc,
          github_repo_url: editGithub || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return toast.error(data?.message || "تعذر تعديل المشروع");

      const updated = data?.project || data;
      setProject(updated); // تحديث الواجهة فوراً
      setEditGithub(updated?.github_repo_url || "");
      setEditOpen(false);
      toast.success("تم تعديل المشروع بنجاح");
    } catch {
      toast.error("خطأ أثناء الاتصال بالسيرفر");
    } finally {
      setSavingProject(false);
    }
  };

  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2 }}>
      {/* قسم معلومات المشروع وتعديله */}
      <Paper
        elevation={0}
        sx={{ p: 2.5, flex: 1, borderRadius: 3, border: "1px solid #EAEAEA" }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
          معلومات المشروع
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {project.description || "لا يوجد وصف للمشروع."}
        </Typography>
        <Divider sx={{ my: 1.5 }} />

        <Stack spacing={1}>
          <Typography variant="body2">
            <b>صاحب المشروع:</b> {project.user?.name || "—"} (
            {project.user?.email || "—"})
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">
              <b>GitHub:</b>
            </Typography>
            {project.github_repo_url ? (
              <>
                <Chip
                  component="a"
                  href={project.github_repo_url}
                  target="_blank"
                  clickable
                  label="زيارة المستودع"
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: "#24292e",
                    color: "white",
                    "&:hover": { bgcolor: "#000" },
                  }}
                />
                <Chip
                  label="مربوط بالنظام 🟢"
                  size="small"
                  sx={{
                    fontWeight: 800,
                    bgcolor: "#DCFCE7",
                    color: "#166534",
                    border: "1px solid #BBF7D0",
                  }}
                />
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                —
              </Typography>
            )}
          </Stack>

          <Divider sx={{ my: 1.5 }} />
          <Typography variant="body2" sx={{ fontWeight: 900, mb: 1 }}>
            أعضاء المشروع
          </Typography>

          {membersCount === 0 ? (
            <Typography variant="body2" color="text.secondary">
              لا يوجد أعضاء بعد.
            </Typography>
          ) : (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {displayMembers.map((m) => {
                const mid = m.id ?? m.user_id;
                const isOwner = owner && mid === owner.id;
                return (
                  <Chip
                    key={mid}
                    size="small"
                    variant={isOwner ? "filled" : "outlined"}
                    icon={
                      isOwner ? (
                        <span style={{ fontSize: 14 }}>👑</span>
                      ) : undefined
                    }
                    label={`${m.name}${m.email ? ` (${m.email})` : ""}${isOwner ? " - مالك المشروع" : ""}`}
                    sx={{ fontWeight: isOwner ? 900 : 700 }}
                  />
                );
              })}
            </Stack>
          )}

          {/* قسم إعدادات المشروع (تعديل وحذف) */}
          {canEditProject && (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mt: 2,
                borderRadius: 3,
                border: "1px solid #EAEAEA",
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                  إعدادات المشروع
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditTitle(project?.title || "");
                      setEditDesc(project?.description || "");
                      setEditGithub(project?.github_repo_url || "");
                      setEditOpen((v) => !v);
                    }}
                    sx={{ borderRadius: 2, fontWeight: 900 }}
                  >
                    {editOpen ? "إغلاق" : "تعديل"}
                  </Button>
                  {canDeleteProject && (
                    <Button
                      color="error"
                      variant="contained"
                      onClick={handleDeleteProject}
                      sx={{ borderRadius: 2, fontWeight: 900 }}
                    >
                      حذف المشروع
                    </Button>
                  )}
                </Stack>
              </Stack>

              {editOpen && (
                <Box sx={{ mt: 2 }}>
                  <Stack spacing={2}>
                    <TextField
                      label="اسم المشروع"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <TextField
                      label="وصف المشروع"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      multiline
                      minRows={3}
                    />
                    <TextField
                      label="رابط GitHub"
                      value={editGithub}
                      onChange={(e) => setEditGithub(e.target.value)}
                      placeholder="https://github.com/username/repository"
                    />
                    <Button
                      variant="contained"
                      onClick={handleUpdateProject}
                      disabled={savingProject}
                      sx={{ borderRadius: 2, fontWeight: 900, width: 220 }}
                    >
                      {savingProject ? "جاري الحفظ..." : "حفظ التعديلات"}
                    </Button>
                  </Stack>
                </Box>
              )}
            </Paper>
          )}
        </Stack>
      </Paper>

      {/* قسم نسبة التقدم */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          width: { xs: "100%", md: 360 },
          borderRadius: 3,
          border: "1px solid #EAEAEA",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
          نسبة التقدّم
        </Typography>
        {progress.total === 0 ? (
          <Typography variant="body2" color="text.secondary">
            لا توجد مهام بعد لحساب نسبة التقدم.
          </Typography>
        ) : (
          <>
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                {progress.percent}% مكتمل
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {progress.completed}/{progress.total}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress.percent}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </>
        )}
      </Paper>
    </Stack>
  );
}
