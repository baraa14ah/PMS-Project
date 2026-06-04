import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from "@mui/material";
import ListToolbar from "../components/ListToolbar";

export default function PlatformProjects() {
  const { authHeaders, apiFetch, API_BASE_URL } = useAuth();

  const [projects, setProjects] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [universityFilter, setUniversityFilter] = useState("");
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);

  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    title: "",
    content: "",
    onConfirm: null,
  });
  const [dialogLoading, setDialogLoading] = useState(false);
  const closeDialog = () =>
    setDialogConfig((p) => ({ ...p, isOpen: false }));

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUniversities = async () => {
    const { res, data } = await apiFetch(`${API_BASE_URL}/admin/universities`, {
      headers: authHeaders(),
    });
    if (res.ok) setUniversities(data?.universities || []);
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (searchDebounced.trim()) params.set("search", searchDebounced.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (universityFilter) params.set("university_id", universityFilter);
      const qs = params.toString();
      const { res, data } = await apiFetch(
        `${API_BASE_URL}/admin/projects${qs ? `?${qs}` : ""}`,
        { headers: authHeaders() },
      );
      if (!res.ok) throw new Error(data?.message || "تعذر جلب المشاريع");
      setProjects(data?.projects || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDebounced, statusFilter, universityFilter]);

  const handleSave = async () => {
    if (!editData) return;
    setSaving(true);
    try {
      const { res, data } = await apiFetch(
        `${API_BASE_URL}/admin/projects/${editData.id}`,
        {
          method: "PUT",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            title: editData.title,
            description: editData.description,
            status: editData.status,
          }),
        },
      );
      if (!res.ok) throw new Error(data?.message || "تعذر التحديث");
      toast.success("تم تحديث المشروع");
      setEditData(null);
      fetchProjects();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (project) => {
    setDialogConfig({
      isOpen: true,
      title: "حذف المشروع؟",
      content: `حذف "${project.title}" نهائياً؟`,
      onConfirm: async () => {
        try {
          setDialogLoading(true);
          const { res, data } = await apiFetch(
            `${API_BASE_URL}/admin/projects/${project.id}`,
            { method: "DELETE", headers: authHeaders() },
          );
          if (!res.ok) throw new Error(data?.message || "تعذر الحذف");
          toast.success("تم حذف المشروع");
          fetchProjects();
          closeDialog();
        } catch (e) {
          toast.error(e.message);
          closeDialog();
        } finally {
          setDialogLoading(false);
        }
      },
    });
  };

  const statusLabel = useMemo(
    () => ({
      pending: "قيد الانتظار",
      in_progress: "قيد التنفيذ",
      completed: "مكتمل",
    }),
    [],
  );

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            إدارة المشاريع (المنصة)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            عرض وتعديل وحذف جميع مشاريع الجامعات
          </Typography>
        </Box>
      </Stack>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="بحث بعنوان المشروع..."
        onRefresh={fetchProjects}
        filters={[
          {
            key: "status",
            label: "الحالة",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "pending", label: "قيد الانتظار" },
              { value: "in_progress", label: "قيد التنفيذ" },
              { value: "completed", label: "مكتمل" },
            ],
          },
          {
            key: "university",
            label: "الجامعة",
            value: universityFilter,
            onChange: setUniversityFilter,
            options: universities.map((u) => ({
              value: String(u.id),
              label: u.name,
            })),
          },
        ]}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>العنوان</TableCell>
                  <TableCell>الجامعة</TableCell>
                  <TableCell>المالك</TableCell>
                  <TableCell>المشرف</TableCell>
                  <TableCell>الحالة</TableCell>
                  <TableCell align="right">إجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Button
                        component={Link}
                        to={`/dashboard/projects/${p.id}`}
                        size="small"
                      >
                        {p.title}
                      </Button>
                    </TableCell>
                    <TableCell>{p.university?.name || "—"}</TableCell>
                    <TableCell>{p.user?.name || "—"}</TableCell>
                    <TableCell>{p.supervisor?.name || "—"}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={statusLabel[p.status] || p.status || "—"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        onClick={() =>
                          setEditData({
                            id: p.id,
                            title: p.title,
                            description: p.description || "",
                            status: p.status || "pending",
                          })
                        }
                      >
                        تعديل
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDelete(p)}
                      >
                        حذف
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog
        open={Boolean(editData)}
        onClose={() => setEditData(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 900 }}>تعديل مشروع</DialogTitle>
        <DialogContent>
          {editData && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="العنوان"
                fullWidth
                value={editData.title}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, title: e.target.value }))
                }
              />
              <TextField
                label="الوصف"
                fullWidth
                multiline
                minRows={2}
                value={editData.description}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
              <TextField
                select
                label="الحالة"
                fullWidth
                value={editData.status}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <MenuItem value="pending">قيد الانتظار</MenuItem>
                <MenuItem value="in_progress">قيد التنفيذ</MenuItem>
                <MenuItem value="completed">مكتمل</MenuItem>
              </TextField>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditData(null)}>إلغاء</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            حفظ
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        {...dialogConfig}
        dialogLoading={dialogLoading}
        onClose={closeDialog}
      />
    </Box>
  );
}
