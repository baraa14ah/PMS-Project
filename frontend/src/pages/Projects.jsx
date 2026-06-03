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
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  InputAdornment,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function Projects() {
  const { token, user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newProject, setNewProject] = useState({ title: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState("");

  // ✅ شريط البحث
  const [searchQuery, setSearchQuery] = useState("");

  const roleName = String(user?.role?.name || user?.role || "").toLowerCase();
  const currentUserId = Number(user?.user?.id || user?.id);

  const canCreateProject = roleName === "student" || roleName === "admin";

  const fetchProjects = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message || "تعذر جلب المشاريع من الخادم");
        setProjects([]);
        return;
      }

      const baseProjects = data?.projects?.data || data?.projects || [];

      // جلب نسبة الإنجاز لكل مشروع
      const projectsWithProgress = await Promise.all(
        baseProjects.map(async (p) => {
          if (!p?.id) return p;

          try {
            const prRes = await fetch(
              `${API_BASE_URL}/project/${p.id}/progress`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: "application/json",
                },
              },
            );

            const pr = await prRes.json().catch(() => null);
            if (!prRes.ok) return p;

            return {
              ...p,
              progress_percentage: pr?.progress_percentage ?? 0,
              total_tasks: pr?.total_tasks ?? 0,
              completed_tasks: pr?.completed_tasks ?? 0,
            };
          } catch {
            return p;
          }
        }),
      );

      setProjects(projectsWithProgress);
    } catch (e) {
      setError("حدث خطأ في الاتصال بالسيرفر");
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

      const res = await fetch(`${API_BASE_URL}/project/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          title: newProject.title,
          description: newProject.description,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setCreateMessage(data?.message || "تعذر إنشاء المشروع");
        return;
      }

      setCreateMessage("✅ تم إنشاء المشروع");
      setNewProject({ title: "", description: "" });
      fetchProjects();
    } catch {
      setCreateMessage("حدث خطأ في الاتصال بالسيرفر أثناء إنشاء المشروع");
    } finally {
      setCreating(false);
    }
  };

  // ✅ تم إزالة الفلترة المعقدة، والاعتماد فقط على البحث المباشر للحفاظ على ثبات عرض المشاريع
  const visibleProjects = useMemo(() => {
    let filtered = projects;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.user?.name || "").toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [projects, searchQuery]);

  const relationChip = (p) => {
    if (!currentUserId) return null;

    const isOwner = Number(p.user_id) === currentUserId;
    const isSupervisor =
      Number(p.supervisor_id) === currentUserId ||
      Number(p.supervisor?.id) === currentUserId;

    if (isOwner) return <Chip size="small" color="warning" label="👑 مالك" />;
    if (isSupervisor) return <Chip size="small" color="info" label="🧑‍🏫 مشرف" />;

    return <Chip size="small" color="success" label="👥 عضو" />;
  };

  const statusChip = (status) => {
    const s = String(status || "pending").toLowerCase();
    if (s === "completed")
      return <Chip size="small" color="success" label="مكتمل" />;
    if (s === "in_progress")
      return <Chip size="small" color="info" label="قيد التنفيذ" />;
    if (s === "pending")
      return <Chip size="small" color="warning" label="قيد الانتظار" />;
    return <Chip size="small" variant="outlined" label={status || "—"} />;
  };

  const derivedStatusFromProject = (p) => {
    const percent = p?.progress_percentage;

    if (percent !== null && percent !== undefined) {
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
  };
  // 🎯 تأثير التحويم الأنيق (يمكنك نسخه لأي مكون في مشروعك)
  const hoverEffect = {
    transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
    "&:hover": {
      transform: "translateY(-4px)", // رفع البطاقة 4 بيكسل للأعلى
      boxShadow: "0 10px 25px rgba(0,0,0,0.08)", // ظل ناعم جداً
      borderColor: "primary.main", // تغيير لون الإطار للون الأساسي (اختياري)
    },
  };
  return (
    <Box>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          Projects
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={fetchProjects}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800 }}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {/* شريط البحث المباشر */}
      <Card sx={{ mb: 2, borderRadius: 3, border: "1px solid #E7E8F0" }}>
        <CardContent>
          <TextField
            fullWidth
            size="small"
            placeholder="البحث باسم المشروع أو اسم الطالب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Create Project */}
      {canCreateProject && (
        <Card sx={{ mb: 2, borderRadius: 3, border: "1px solid #E7E8F0" }}>
          <CardContent>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Create New Project
              </Typography>
            </Stack>
            {createMessage && (
              <Alert sx={{ mb: 2 }} severity="info">
                {createMessage}
              </Alert>
            )}
            <Box component="form" onSubmit={handleCreateProject}>
              <Stack spacing={2}>
                <TextField
                  label="Title"
                  value={newProject.title}
                  onChange={(e) =>
                    setNewProject((p) => ({ ...p, title: e.target.value }))
                  }
                  required
                />
                <TextField
                  label="Description"
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  multiline
                  rows={3}
                  required
                />
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  disabled={creating}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 900,
                    width: 220,
                  }}
                >
                  {creating ? "Creating..." : "Create"}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Loading/Error */}
      {loading && (
        <Card sx={{ borderRadius: 3, border: "1px solid #E7E8F0" }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress size={22} />
              <Typography sx={{ fontWeight: 700 }}>
                Loading projects...
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {!loading && error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && visibleProjects.length === 0 && (
        <Alert severity="warning">No projects found.</Alert>
      )}

      {/* Table */}
      {!loading && !error && visibleProjects.length > 0 && (
        <Card sx={{ borderRadius: 3, border: "1px solid #E7E8F0" }}>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Owner</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Supervisor</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Me</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleProjects.map((p, idx) => (
                  <TableRow key={p.id || idx} hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>
                      {p.title || "—"}
                      <Typography
                        variant="caption"
                        sx={{ display: "block", color: "text.secondary" }}
                      >
                        {p.description || ""}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {statusChip(derivedStatusFromProject(p))}
                    </TableCell>
                    <TableCell>{p.user?.name || "—"}</TableCell>
                    <TableCell>{p.supervisor?.name || "—"}</TableCell>
                    <TableCell>{relationChip(p)}</TableCell>
                    <TableCell>
                      {p.id ? (
                        <Button
                          component={Link}
                          to={`/dashboard/projects/${p.id}`}
                          variant="outlined"
                          endIcon={<ArrowOutwardRoundedIcon />}
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 900,
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
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
