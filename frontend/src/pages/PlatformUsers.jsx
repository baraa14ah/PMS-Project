import React, { useEffect, useMemo, useState } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
} from "@mui/material";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import ListToolbar from "../components/ListToolbar";

export default function PlatformUsers() {
  const { authHeaders, apiFetch, API_BASE_URL } = useAuth();

  const [users, setUsers] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [universityFilter, setUniversityFilter] = useState("");

  const [openAdd, setOpenAdd] = useState(false);
  const [addData, setAddData] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
    university_id: "",
    university_ids: [],
    student_number: "",
    status: "active",
  });
  const [saving, setSaving] = useState(false);

  const [editData, setEditData] = useState(null);

  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    title: "",
    content: "",
    onConfirm: null,
  });
  const [dialogLoading, setDialogLoading] = useState(false);
  const closeDialog = () =>
    setDialogConfig((p) => ({ ...p, isOpen: false }));

  const fetchUniversities = async () => {
    const { res, data } = await apiFetch(`${API_BASE_URL}/admin/universities`, {
      headers: authHeaders(),
    });
    if (res.ok) setUniversities(data?.universities || []);
  };

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (searchDebounced.trim()) params.set("search", searchDebounced.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (roleFilter) params.set("role", roleFilter);
      if (universityFilter) params.set("university_id", universityFilter);
      const qs = params.toString();
      const { res, data } = await apiFetch(
        `${API_BASE_URL}/admin/users${qs ? `?${qs}` : ""}`,
        { headers: authHeaders() },
      );
      if (!res.ok) throw new Error(data?.message || "تعذر جلب المستخدمين");
      setUsers(data?.users || []);
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
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDebounced, statusFilter, roleFilter, universityFilter]);

  const handleCreate = async () => {
    if (!addData.name || !addData.email || !addData.university_id) {
      return toast.error("الاسم والبريد والجامعة مطلوبة");
    }
    setSaving(true);
    try {
      const payload = {
        name: addData.name,
        email: addData.email,
        password: addData.password,
        role: addData.role,
        status: addData.status,
        university_id: Number(addData.university_id),
      };
      if (addData.role === "supervisor" && addData.university_ids?.length) {
        payload.university_ids = addData.university_ids.map(Number);
        payload.university_id = Number(addData.university_ids[0]);
      }
      if (addData.role === "student") {
        payload.student_number = addData.student_number?.trim();
      }

      const { res, data } = await apiFetch(`${API_BASE_URL}/admin/users`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(data?.message || "تعذر إنشاء المستخدم");
      toast.success(
        addData.role === "admin"
          ? "تم إنشاء مسؤول الجامعة بنجاح"
          : "تم إنشاء المستخدم بنجاح",
      );
      setOpenAdd(false);
      setAddData({
        name: "",
        email: "",
        password: "",
        role: "admin",
        university_id: "",
        university_ids: [],
        student_number: "",
        status: "active",
      });
      fetchUsers();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editData) return;
    setSaving(true);
    try {
      const body = {
        name: editData.name,
        email: editData.email,
        role: editData.role,
        status: editData.status,
        university_id: Number(editData.university_id),
      };
      if (editData.role === "supervisor" && editData.university_ids?.length) {
        body.university_ids = editData.university_ids.map(Number);
        body.university_id = Number(editData.university_ids[0]);
      }
      if (editData.role === "student") {
        body.student_number = editData.student_number;
      }
      if (editData.password?.trim()) body.password = editData.password;

      const { res, data } = await apiFetch(
        `${API_BASE_URL}/admin/users/${editData.id}`,
        {
          method: "PUT",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) throw new Error(data?.message || "تعذر التحديث");
      toast.success("تم تحديث المستخدم");
      setEditData(null);
      fetchUsers();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (user) => {
    setDialogConfig({
      isOpen: true,
      title: "حذف المستخدم؟",
      content: `حذف "${user.name}" (${user.email}) نهائياً؟`,
      onConfirm: async () => {
        try {
          setDialogLoading(true);
          const { res, data } = await apiFetch(
            `${API_BASE_URL}/admin/users/${user.id}`,
            { method: "DELETE", headers: authHeaders() },
          );
          if (!res.ok) throw new Error(data?.message || "تعذر الحذف");
          toast.success("تم الحذف");
          fetchUsers();
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

  const statusChip = (status) => {
    const colors = {
      active: "success",
      pending: "warning",
      rejected: "error",
    };
    return (
      <Chip
        size="small"
        color={colors[status] || "default"}
        label={status || "—"}
      />
    );
  };

  const activeUniversities = useMemo(
    () => universities.filter((u) => u.is_active !== false),
    [universities],
  );

  const formatUniversities = (u) => {
    if (u.role?.name === "supervisor" && u.supervisor_universities?.length) {
      return u.supervisor_universities.map((uni) => uni.name).join("، ");
    }
    return u.university?.name || "—";
  };

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
            إدارة المستخدمين (المنصة)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            إنشاء مسؤول لكل جامعة، تعديل أو حذف أي مستخدم
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddAltRoundedIcon />}
          onClick={() => setOpenAdd(true)}
          sx={{ fontWeight: 800 }}
        >
          إضافة مستخدم
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="بحث بالاسم، البريد، الرقم الجامعي..."
        onRefresh={fetchUsers}
        filters={[
          {
            key: "status",
            label: "الحالة",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "active", label: "نشط" },
              { value: "pending", label: "قيد الانتظار" },
              { value: "rejected", label: "مرفوض" },
            ],
          },
          {
            key: "role",
            label: "الدور",
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
              { value: "admin", label: "مسؤول جامعة" },
              { value: "supervisor", label: "مشرف" },
              { value: "student", label: "طالب" },
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
                  <TableCell>الاسم</TableCell>
                  <TableCell>الرقم الجامعي</TableCell>
                  <TableCell>البريد</TableCell>
                  <TableCell>الدور</TableCell>
                  <TableCell>الجامعة</TableCell>
                  <TableCell>الحالة</TableCell>
                  <TableCell align="right">إجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.student_number || "—"}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      {u.role?.name === "admin" && (
                        <Chip
                          size="small"
                          icon={<AdminPanelSettingsRoundedIcon />}
                          label="مسؤول جامعة"
                          color="primary"
                        />
                      )}
                      {u.role?.name !== "admin" && (
                        <Chip size="small" label={u.role?.name} />
                      )}
                    </TableCell>
                    <TableCell>{formatUniversities(u)}</TableCell>
                    <TableCell>{statusChip(u.status)}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        onClick={() =>
                          setEditData({
                            id: u.id,
                            name: u.name,
                            email: u.email,
                            role: u.role?.name || "student",
                            status: u.status,
                            university_id: u.university_id,
                            university_ids: (u.supervisor_universities || []).map(
                              (uni) => uni.id,
                            ),
                            student_number: u.student_number || "",
                            password: "",
                          })
                        }
                      >
                        تعديل
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDelete(u)}
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

      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>
          إضافة مستخدم (مسؤول جامعة أو غيره)
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="الاسم"
              fullWidth
              value={addData.name}
              onChange={(e) =>
                setAddData((p) => ({ ...p, name: e.target.value }))
              }
            />
            <TextField
              label="البريد"
              fullWidth
              value={addData.email}
              onChange={(e) =>
                setAddData((p) => ({ ...p, email: e.target.value }))
              }
            />
            <TextField
              label="كلمة المرور"
              type="password"
              fullWidth
              value={addData.password}
              onChange={(e) =>
                setAddData((p) => ({ ...p, password: e.target.value }))
              }
            />
            <TextField
              select
              label="الدور"
              fullWidth
              value={addData.role}
              onChange={(e) =>
                setAddData((p) => ({ ...p, role: e.target.value }))
              }
            >
              <MenuItem value="admin">مسؤول جامعة (Admin)</MenuItem>
              <MenuItem value="supervisor">مشرف</MenuItem>
              <MenuItem value="student">طالب</MenuItem>
            </TextField>
            {addData.role === "supervisor" ? (
              <TextField
                select
                label="الجامعات (يمكن اختيار أكثر من واحدة)"
                fullWidth
                SelectProps={{ multiple: true }}
                value={addData.university_ids}
                onChange={(e) => {
                  const ids = e.target.value;
                  setAddData((p) => ({
                    ...p,
                    university_ids: ids,
                    university_id: ids[0] || "",
                  }));
                }}
              >
                {activeUniversities.map((uni) => (
                  <MenuItem key={uni.id} value={uni.id}>
                    {uni.name}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                select
                label="الجامعة"
                fullWidth
                value={addData.university_id}
                onChange={(e) =>
                  setAddData((p) => ({ ...p, university_id: e.target.value }))
                }
              >
                <MenuItem value="" disabled>
                  اختر الجامعة
                </MenuItem>
                {activeUniversities.map((uni) => (
                  <MenuItem key={uni.id} value={uni.id}>
                    {uni.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {addData.role === "student" && (
              <TextField
                label="الرقم الجامعي"
                fullWidth
                required
                value={addData.student_number}
                onChange={(e) =>
                  setAddData((p) => ({ ...p, student_number: e.target.value }))
                }
              />
            )}
            <TextField
              select
              label="الحالة"
              fullWidth
              value={addData.status}
              onChange={(e) =>
                setAddData((p) => ({ ...p, status: e.target.value }))
              }
            >
              <MenuItem value="active">نشط</MenuItem>
              <MenuItem value="pending">قيد الانتظار</MenuItem>
              <MenuItem value="rejected">مرفوض</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>إلغاء</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? "جاري الحفظ..." : "إنشاء"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(editData)}
        onClose={() => setEditData(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 900 }}>تعديل مستخدم</DialogTitle>
        <DialogContent>
          {editData && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="الاسم"
                fullWidth
                value={editData.name}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, name: e.target.value }))
                }
              />
              <TextField
                label="البريد"
                fullWidth
                value={editData.email}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, email: e.target.value }))
                }
              />
              <TextField
                label="كلمة مرور جديدة (اختياري)"
                type="password"
                fullWidth
                value={editData.password}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, password: e.target.value }))
                }
              />
              <TextField
                select
                label="الدور"
                fullWidth
                value={editData.role}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, role: e.target.value }))
                }
              >
                <MenuItem value="admin">مسؤول جامعة</MenuItem>
                <MenuItem value="supervisor">مشرف</MenuItem>
                <MenuItem value="student">طالب</MenuItem>
              </TextField>
              {editData.role === "supervisor" ? (
                <TextField
                  select
                  label="الجامعات"
                  fullWidth
                  SelectProps={{ multiple: true }}
                  value={editData.university_ids || []}
                  onChange={(e) => {
                    const ids = e.target.value;
                    setEditData((p) => ({
                      ...p,
                      university_ids: ids,
                      university_id: ids[0] || p.university_id,
                    }));
                  }}
                >
                  {universities.map((uni) => (
                    <MenuItem key={uni.id} value={uni.id}>
                      {uni.name}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  select
                  label="الجامعة"
                  fullWidth
                  value={editData.university_id}
                  onChange={(e) =>
                    setEditData((p) => ({
                      ...p,
                      university_id: e.target.value,
                    }))
                  }
                >
                  {universities.map((uni) => (
                    <MenuItem key={uni.id} value={uni.id}>
                      {uni.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              {editData.role === "student" && (
                <TextField
                  label="الرقم الجامعي"
                  fullWidth
                  value={editData.student_number || ""}
                  onChange={(e) =>
                    setEditData((p) => ({
                      ...p,
                      student_number: e.target.value,
                    }))
                  }
                />
              )}
              <TextField
                select
                label="الحالة"
                fullWidth
                value={editData.status}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, status: e.target.value }))
                }
              >
                <MenuItem value="active">نشط</MenuItem>
                <MenuItem value="pending">قيد الانتظار</MenuItem>
                <MenuItem value="rejected">مرفوض</MenuItem>
              </TextField>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditData(null)}>إلغاء</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={saving}>
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
