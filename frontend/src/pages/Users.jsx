import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

// 🎯 استدعاء نافذة التأكيد الخاصة بك بدلاً من SweetAlert
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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";

import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function Users() {
  const { token } = useAuth();

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    [token],
  );

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState({ id: "", name: "", email: "" });
  const [isSaving, setIsSaving] = useState(false);

  // 🎯 إعدادات نافذة التأكيد (ConfirmDialog)
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    title: "",
    content: "",
    confirmText: "تأكيد",
    confirmColor: "error",
    onConfirm: null,
  });
  const [dialogLoading, setDialogLoading] = useState(false);
  const closeDialog = () =>
    setDialogConfig((prev) => ({ ...prev, isOpen: false }));

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: authHeaders,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok)
        throw new Error(data?.message || "تعذر جلب بيانات المستخدمين");
      setUsers(data?.users || data?.data || []);
    } catch (err) {
      setError(err.message);
      toast.error("فشل الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleOpenEdit = (user) => {
    setEditData({ id: user.id, name: user.name, email: user.email });
    setOpenEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!editData.name || !editData.email)
      return toast.error("يرجى تعبئة جميع الحقول");

    try {
      setIsSaving(true);
      const res = await fetch(`${API_BASE_URL}/users/${editData.id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ name: editData.name, email: editData.email }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "حدث خطأ أثناء التعديل");

      toast.success("تم تحديث بيانات المستخدم بنجاح 👏");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editData.id
            ? { ...u, name: editData.name, email: editData.email }
            : u,
        ),
      );
      setOpenEdit(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 🎯 دالة الحذف المربوطة بـ ConfirmDialog
  const handleDelete = (id, name) => {
    setDialogConfig({
      isOpen: true,
      title: "حذف المستخدم نهائياً؟",
      content: `هل أنت متأكد أنك تريد حذف المستخدم "${name}"؟ احذر: إذا كان المستخدم مرتبطاً بمشاريع أو مهام، قد يرفض النظام حذفه للحفاظ على البيانات.`,
      confirmText: "نعم، احذف المستخدم",
      confirmColor: "error",
      onConfirm: async () => {
        try {
          setDialogLoading(true); // تشغيل زر التحميل الدوار
          const res = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: "DELETE",
            headers: authHeaders,
          });

          const data = await res.json().catch(() => null);

          if (!res.ok) {
            // هنا نلتقط رسالة الخطأ الحقيقية من اللارافيل
            throw new Error(
              data?.message || "تعذر حذف المستخدم من قاعدة البيانات",
            );
          }

          toast.success("تم حذف المستخدم بنجاح 🗑️");
          setUsers((prev) => prev.filter((u) => u.id !== id));
          closeDialog(); // إغلاق النافذة
        } catch (e) {
          toast.error(e.message); // عرض رسالة الخطأ للمدير
          closeDialog();
        } finally {
          setDialogLoading(false);
        }
      },
    });
  };

  const roleChip = (roleName) => {
    const role = String(roleName || "").toLowerCase();
    if (role === "admin")
      return (
        <Chip
          size="small"
          color="error"
          icon={<AdminPanelSettingsRoundedIcon />}
          label="مدير"
          sx={{ fontWeight: 800 }}
        />
      );
    if (role === "supervisor")
      return (
        <Chip
          size="small"
          color="info"
          icon={<SupervisorAccountRoundedIcon />}
          label="مشرف"
          sx={{ fontWeight: 800 }}
        />
      );
    if (role === "student")
      return (
        <Chip
          size="small"
          color="success"
          icon={<SchoolRoundedIcon />}
          label="طالب"
          sx={{ fontWeight: 800 }}
        />
      );
    return <Chip size="small" variant="outlined" label={role || "غير معروف"} />;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <GroupRoundedIcon color="primary" fontSize="large" />
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              إدارة المستخدمين
            </Typography>
          </Stack>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500 }}
          >
            إضافة، تعديل، وحذف حسابات الطلاب والمشرفين في النظام.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddAltRoundedIcon />}
          sx={{ borderRadius: 2, fontWeight: 800, px: 3, py: 1 }}
          onClick={() => toast("جاري تجهيز إضافة مستخدم جديد...")}
        >
          مستخدم جديد
        </Button>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #EAEAEA",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Box
            sx={{
              p: 10,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <CircularProgress />
            <Typography sx={{ fontWeight: 800 }} color="text.secondary">
              جاري جلب بيانات المستخدمين...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Typography color="error" sx={{ fontWeight: 800, mb: 2 }}>
              {error}
            </Typography>
            <Button variant="outlined" onClick={fetchUsers}>
              إعادة المحاولة
            </Button>
          </Box>
        ) : users.length === 0 ? (
          <Box sx={{ p: 10, textAlign: "center" }}>
            <GroupRoundedIcon
              sx={{ fontSize: 60, color: "text.disabled", mb: 2 }}
            />
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: "text.secondary" }}
            >
              لا يوجد مستخدمين مسجلين بعد.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900, py: 2 }}>الاسم</TableCell>
                  <TableCell sx={{ fontWeight: 900, py: 2 }}>
                    البريد الإلكتروني
                  </TableCell>
                  <TableCell sx={{ fontWeight: 900, py: 2 }}>
                    الصلاحية
                  </TableCell>
                  <TableCell sx={{ fontWeight: 900, py: 2 }}>
                    تاريخ الانضمام
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 900, py: 2, textAlign: "center" }}
                  >
                    إجراءات
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow
                    key={u.id}
                    hover
                    sx={{ "&:last-child td": { border: 0 } }}
                  >
                    <TableCell sx={{ fontWeight: 800 }}>{u.name}</TableCell>
                    <TableCell
                      sx={{ color: "text.secondary", fontWeight: 500 }}
                    >
                      {u.email}
                    </TableCell>
                    <TableCell>{roleChip(u.role?.name || u.role)}</TableCell>
                    <TableCell
                      sx={{ color: "text.secondary", fontSize: "0.9rem" }}
                    >
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString("ar-EG")
                        : "—"}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                      >
                        <Tooltip title="تعديل">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOpenEdit(u)}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDelete(u.id, u.name)}
                          >
                            <DeleteRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* نافذة التعديل */}
      <Dialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        maxWidth="sm"
        fullWidth
        dir="rtl"
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          تعديل بيانات المستخدم
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="الاسم الكامل"
              fullWidth
              value={editData.name}
              onChange={(e) =>
                setEditData({ ...editData, name: e.target.value })
              }
            />
            <TextField
              label="البريد الإلكتروني"
              type="email"
              fullWidth
              value={editData.email}
              onChange={(e) =>
                setEditData({ ...editData, email: e.target.value })
              }
              dir="ltr"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button
            onClick={() => setOpenEdit(false)}
            color="inherit"
            sx={{ fontWeight: 800 }}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={isSaving}
            sx={{ fontWeight: 800, px: 3 }}
          >
            {isSaving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🎯 نافذة التأكيد الشاملة والموحدة (MUI) */}
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
