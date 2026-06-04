import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import toast from "react-hot-toast";

// 🎯 استدعاء نافذة التأكيد الخاصة بك بدلاً من SweetAlert
import ConfirmDialog from "../components/ConfirmDialog";
import ListToolbar from "../components/ListToolbar";
import { btnPrimarySx } from "../styles/dashboardUi";

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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
} from "@mui/material";

import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import VpnKeyRoundedIcon from "@mui/icons-material/VpnKeyRounded";

export default function Users() {
  const { dir } = useLanguage();
  const { token, user: currentUser, authHeaders, apiFetch, API_BASE_URL } =
    useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const jsonHeaders = useMemo(
    () => authHeaders({ "Content-Type": "application/json" }),
    [authHeaders],
  );

  const adminRole = String(
    currentUser?.role?.name ?? currentUser?.role ?? "",
  ).toLowerCase();
  const isAdmin = adminRole === "admin";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTab, setCurrentTab] = useState(
    () => searchParams.get("tab") || "all",
  );
  const [passwordRequests, setPasswordRequests] = useState([]);
  const [passwordRequestsLoading, setPasswordRequestsLoading] = useState(false);
  const [passwordRequestsError, setPasswordRequestsError] = useState("");
  const [tempPasswordDialog, setTempPasswordDialog] = useState({
    open: false,
    password: "",
    userName: "",
  });
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState({ id: "", name: "", email: "" });
  const [isSaving, setIsSaving] = useState(false);

  const [openAdd, setOpenAdd] = useState(false);
  const [addData, setAddData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    student_number: "",
  });
  const [isAdding, setIsAdding] = useState(false);

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

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = async (status = currentTab) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (roleFilter) params.set("role", roleFilter);
      if (searchDebounced.trim()) params.set("search", searchDebounced.trim());
      const qs = params.toString();
      const url = `${API_BASE_URL}/users${qs ? `?${qs}` : ""}`;

      const { res, data } = await apiFetch(url, {
        headers: jsonHeaders,
      });
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

  const fetchPasswordRequests = async () => {
    try {
      setPasswordRequestsLoading(true);
      setPasswordRequestsError("");
      const { res, data } = await apiFetch(
        `${API_BASE_URL}/password-reset-requests`,
        { headers: jsonHeaders },
      );
      if (!res.ok) {
        throw new Error(data?.message || "تعذر جلب طلبات كلمة المرور");
      }
      setPasswordRequests(data?.requests || []);
    } catch (err) {
      setPasswordRequestsError(err.message);
      toast.error(err.message);
    } finally {
      setPasswordRequestsLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !isAdmin) return;
    apiFetch(`${API_BASE_URL}/password-reset-requests`, { headers: jsonHeaders })
      .then(({ res, data }) => {
        if (res.ok) setPasswordRequests(data?.requests || []);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  useEffect(() => {
    if (!token) return;
    if (currentTab === "password_requests") {
      fetchPasswordRequests();
    } else {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentTab, roleFilter, searchDebounced]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    if (newValue === "password_requests") {
      setSearchParams({ tab: "password_requests" });
    } else {
      setSearchParams({});
    }
  };

  const handleIssueTempPassword = (req) => {
    const userName = req?.user?.name || req?.email;
    setDialogConfig({
      isOpen: true,
      title: "تعيين كلمة مرور مؤقتة؟",
      content: `سيتم إنشاء كلمة مؤقتة للمستخدم «${userName}». انسخها وأبلغه بها مرة واحدة فقط (لا تُعرض مرة أخرى).`,
      confirmText: "نعم، إنشاء كلمة مؤقتة",
      confirmColor: "primary",
      onConfirm: async () => {
        try {
          setDialogLoading(true);
          const { res, data } = await apiFetch(
            `${API_BASE_URL}/password-reset-requests/${req.id}/temporary-password`,
            { method: "POST", headers: jsonHeaders },
          );
          if (!res.ok) {
            const msg =
              data?.errors?.request?.[0] ||
              data?.message ||
              "تعذر تعيين كلمة المرور";
            throw new Error(msg);
          }
          closeDialog();
          setPasswordRequests((prev) => prev.filter((r) => r.id !== req.id));
          setTempPasswordDialog({
            open: true,
            password: data.temporary_password,
            userName,
          });
          toast.success("تم تعيين كلمة مؤقتة");
          window.dispatchEvent(new Event("updateSidebarBadges"));
        } catch (e) {
          toast.error(e.message);
          closeDialog();
        } finally {
          setDialogLoading(false);
        }
      },
    });
  };

  const handleDismissPasswordRequest = (req) => {
    const userName = req?.user?.name || req?.email;
    setDialogConfig({
      isOpen: true,
      title: "إغلاق الطلب؟",
      content: `إغلاق طلب استعادة كلمة المرور للمستخدم «${userName}» دون تعيين كلمة جديدة.`,
      confirmText: "إغلاق الطلب",
      confirmColor: "inherit",
      onConfirm: async () => {
        try {
          setDialogLoading(true);
          const { res, data } = await apiFetch(
            `${API_BASE_URL}/password-reset-requests/${req.id}/dismiss`,
            { method: "POST", headers: jsonHeaders },
          );
          if (!res.ok) {
            throw new Error(data?.message || "تعذر إغلاق الطلب");
          }
          setPasswordRequests((prev) => prev.filter((r) => r.id !== req.id));
          closeDialog();
          toast.success("تم إغلاق الطلب");
          window.dispatchEvent(new Event("updateSidebarBadges"));
        } catch (e) {
          toast.error(e.message);
          closeDialog();
        } finally {
          setDialogLoading(false);
        }
      },
    });
  };

  const copyTempPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPasswordDialog.password);
      toast.success("تم نسخ كلمة المرور");
    } catch {
      toast.error("تعذر النسخ — انسخ يدوياً");
    }
  };

  const handleAddSubmit = async () => {
    if (!addData.name || !addData.email) {
      return toast.error("يرجى تعبئة جميع الحقول المطلوبة");
    }

    try {
      setIsAdding(true);
      const { res, data } = await apiFetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          name: addData.name,
          email: addData.email,
          role: addData.role,
          ...(addData.role === "student"
            ? { student_number: addData.student_number }
            : {}),
        }),
      });

      if (!res.ok) {
        throw new Error(data?.message || "حدث خطأ أثناء إضافة المستخدم");
      }

      toast.success("تم إضافة المستخدم بنجاح 👏");
      setUsers((prev) => [data.user, ...prev]);
      setAddData({ name: "", email: "", role: "student", student_number: "" });
      setOpenAdd(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleOpenEdit = (user) => {
    setEditData({ id: user.id, name: user.name, email: user.email });
    setOpenEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!editData.name || !editData.email)
      return toast.error("يرجى تعبئة جميع الحقول");

    try {
      setIsSaving(true);
      const { res, data } = await apiFetch(
        `${API_BASE_URL}/users/${editData.id}`,
        {
          method: "PUT",
          headers: jsonHeaders,
          body: JSON.stringify({ name: editData.name, email: editData.email }),
        },
      );
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

  const handleDelete = (id, name) => {
    setDialogConfig({
      isOpen: true,
      title: "حذف المستخدم نهائياً؟",
      content: `هل أنت متأكد أنك تريد حذف المستخدم "${name}"؟ احذر: إذا كان المستخدم مرتبطاً بمشاريع أو مهام، قد يرفض النظام حذفه للحفاظ على البيانات.`,
      confirmText: "نعم، احذف المستخدم",
      confirmColor: "error",
      onConfirm: async () => {
        try {
          setDialogLoading(true);
          const { res, data } = await apiFetch(`${API_BASE_URL}/users/${id}`, {
            method: "DELETE",
            headers: jsonHeaders,
          });

          if (!res.ok) {
            throw new Error(
              data?.message || "تعذر حذف المستخدم من قاعدة البيانات",
            );
          }

          toast.success("تم حذف المستخدم بنجاح 🗑️");
          setUsers((prev) => prev.filter((u) => u.id !== id));
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

  const handleApprove = (id, name) => {
    setDialogConfig({
      isOpen: true,
      title: "قبول انضمام المستخدم؟",
      content: `هل أنت متأكد من قبول انضمام "${name}" للنظام؟ سيتمكن المستخدم من الوصول للمشاريع والمهام.`,
      confirmText: "نعم، قبول الانضمام",
      confirmColor: "success",
      onConfirm: async () => {
        try {
          setDialogLoading(true);
          const { res, data } = await apiFetch(
            `${API_BASE_URL}/users/${id}/approve`,
            { method: "POST", headers: jsonHeaders },
          );

          if (!res.ok) {
            throw new Error(data?.message || "تعذر قبول المستخدم");
          }

          toast.success("تم قبول انضمام المستخدم بنجاح ✅");
          setUsers((prev) =>
            prev.map((u) => (u.id === id ? { ...u, status: "active" } : u)),
          );
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

  const handleReject = (id, name) => {
    setDialogConfig({
      isOpen: true,
      title: "رفض انضمام المستخدم؟",
      content: `هل أنت متأكد من رفض انضمام "${name}"؟ لن يتمكن المستخدم من الوصول للنظام.`,
      confirmText: "نعم، رفض الانضمام",
      confirmColor: "error",
      onConfirm: async () => {
        try {
          setDialogLoading(true);
          const { res, data } = await apiFetch(
            `${API_BASE_URL}/users/${id}/reject`,
            { method: "POST", headers: jsonHeaders },
          );

          if (!res.ok) {
            throw new Error(data?.message || "تعذر رفض المستخدم");
          }

          toast.success("تم رفض انضمام المستخدم ❌");
          setUsers((prev) =>
            prev.map((u) => (u.id === id ? { ...u, status: "rejected" } : u)),
          );
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
    const s = String(status || "active").toLowerCase();
    if (s === "pending")
      return (
        <Chip
          size="small"
          color="warning"
          icon={<PendingActionsRoundedIcon />}
          label="قيد الانتظار"
          sx={{ fontWeight: 800 }}
        />
      );
    if (s === "rejected")
      return (
        <Chip
          size="small"
          color="error"
          icon={<CancelRoundedIcon />}
          label="مرفوض"
          sx={{ fontWeight: 800 }}
        />
      );
    return (
      <Chip
        size="small"
        color="success"
        icon={<CheckCircleRoundedIcon />}
        label="نشط"
        sx={{ fontWeight: 800 }}
      />
    );
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

  const isPasswordTab = currentTab === "password_requests";

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
          sx={{ ...btnPrimarySx, borderRadius: 2, px: 3, py: 1 }}
          onClick={() => setOpenAdd(true)}
        >
          مستخدم جديد
        </Button>
      </Stack>

      <Box sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            "& .MuiTab-root": { fontWeight: 800, fontSize: "1rem" },
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Tab label="الكل" value="all" />
          <Tab label="قيد الانتظار" value="pending" />
          <Tab label="نشط" value="active" />
          <Tab label="مرفوض" value="rejected" />
          {isAdmin && (
            <Tab
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <span>طلبات كلمة المرور</span>
                  {passwordRequests.length > 0 && (
                    <Chip
                      size="small"
                      color="warning"
                      label={passwordRequests.length}
                      sx={{ height: 22, fontWeight: 800 }}
                    />
                  )}
                </Stack>
              }
              value="password_requests"
            />
          )}
        </Tabs>
      </Box>

      {!isPasswordTab && (
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="بحث بالاسم، البريد، أو الرقم الجامعي..."
        onRefresh={() => fetchUsers()}
        filters={[
          {
            key: "role",
            label: "الدور",
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
              { value: "student", label: "طالب" },
              { value: "supervisor", label: "مشرف" },
            ],
          },
        ]}
      />
      )}

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #EAEAEA",
          overflow: "hidden",
        }}
      >
        {isPasswordTab ? (
          passwordRequestsLoading ? (
            <Box sx={{ p: 10, textAlign: "center" }}>
              <CircularProgress />
            </Box>
          ) : passwordRequestsError ? (
            <Box sx={{ p: 5, textAlign: "center" }}>
              <Typography color="error" sx={{ fontWeight: 800, mb: 2 }}>
                {passwordRequestsError}
              </Typography>
              <Button variant="outlined" onClick={fetchPasswordRequests}>
                إعادة المحاولة
              </Button>
            </Box>
          ) : passwordRequests.length === 0 ? (
            <Box sx={{ p: 10, textAlign: "center" }}>
              <LockResetRoundedIcon
                sx={{ fontSize: 56, color: "text.disabled", mb: 2 }}
              />
              <Typography sx={{ fontWeight: 800, color: "text.secondary" }}>
                لا توجد طلبات استعادة كلمة مرور حالياً.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900 }}>المستخدم</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>البريد</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>الرقم الجامعي</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>حالة الحساب</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>التاريخ</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>ملاحظة</TableCell>
                    <TableCell sx={{ fontWeight: 900, textAlign: "center" }}>
                      إجراءات
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {passwordRequests.map((req) => (
                    <TableRow key={req.id} hover>
                      <TableCell sx={{ fontWeight: 800 }}>
                        {req.user?.name || "—"}
                      </TableCell>
                      <TableCell>{req.email}</TableCell>
                      <TableCell>
                        {req.student_number || req.user?.student_number || "—"}
                      </TableCell>
                      <TableCell>{statusChip(req.user?.status)}</TableCell>
                      <TableCell>
                        {req.created_at
                          ? new Date(req.created_at).toLocaleString("ar-EG")
                          : "—"}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" noWrap title={req.message}>
                          {req.message || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="center"
                        >
                          <Tooltip title="كلمة مرور مؤقتة">
                            <span>
                              <IconButton
                                color="primary"
                                size="small"
                                disabled={req.user?.status !== "active"}
                                onClick={() => handleIssueTempPassword(req)}
                              >
                                <VpnKeyRoundedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="إغلاق الطلب">
                            <IconButton
                              size="small"
                              onClick={() => handleDismissPasswordRequest(req)}
                            >
                              <CancelRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        ) : loading ? (
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
            <Button variant="outlined" onClick={() => fetchUsers()}>
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
              لا يوجد مستخدمين في هذا القسم.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900, py: 2 }}>الاسم</TableCell>
                  <TableCell sx={{ fontWeight: 900, py: 2 }}>
                    الرقم الجامعي
                  </TableCell>
                  <TableCell sx={{ fontWeight: 900, py: 2 }}>
                    البريد الإلكتروني
                  </TableCell>
                  <TableCell sx={{ fontWeight: 900, py: 2 }}>
                    الصلاحية
                  </TableCell>
                  <TableCell sx={{ fontWeight: 900, py: 2 }}>
                    الحالة
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
                    <TableCell sx={{ color: "text.secondary" }}>
                      {u.student_number || "—"}
                    </TableCell>
                    <TableCell
                      sx={{ color: "text.secondary", fontWeight: 500 }}
                    >
                      {u.email}
                    </TableCell>
                    <TableCell>{roleChip(u.role?.name || u.role)}</TableCell>
                    <TableCell>{statusChip(u.status)}</TableCell>
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
                        {isAdmin && u.status === "pending" && (
                          <>
                            <Tooltip title="قبول">
                              <IconButton
                                color="success"
                                size="small"
                                onClick={() => handleApprove(u.id, u.name)}
                              >
                                <CheckCircleRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="رفض">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleReject(u.id, u.name)}
                              >
                                <CancelRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
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
        dir={dir}
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
            sx={{ ...btnPrimarySx, px: 3 }}
          >
            {isSaving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={tempPasswordDialog.open}
        onClose={() =>
          setTempPasswordDialog({ open: false, password: "", userName: "" })
        }
        maxWidth="sm"
        fullWidth
        dir={dir}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          كلمة المرور المؤقتة — {tempPasswordDialog.userName}
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            لن تُعرض هذه الكلمة مرة أخرى. انسخها وأبلغ المستخدم فوراً، ثم اطلب
            منه تغييرها من الملف الشخصي بعد الدخول.
          </Alert>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "#F9FAFB",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography
              sx={{
                fontFamily: "monospace",
                fontWeight: 800,
                fontSize: "1.1rem",
                letterSpacing: 1,
              }}
              dir="ltr"
            >
              {tempPasswordDialog.password}
            </Typography>
            <IconButton onClick={copyTempPassword} color="primary">
              <ContentCopyRoundedIcon />
            </IconButton>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            onClick={() =>
              setTempPasswordDialog({ open: false, password: "", userName: "" })
            }
            sx={btnPrimarySx}
          >
            تم الإبلاغ
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
      {/* 🎯 نافذة إضافة مستخدم جديد */}
      <Dialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        maxWidth="sm"
        fullWidth
        dir={dir}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>إضافة مستخدم جديد</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="الاسم الكامل"
              fullWidth
              value={addData.name}
              onChange={(e) => setAddData({ ...addData, name: e.target.value })}
            />
            <TextField
              label="البريد الإلكتروني"
              type="email"
              fullWidth
              value={addData.email}
              onChange={(e) =>
                setAddData({ ...addData, email: e.target.value })
              }
              dir="ltr"
            />

            <FormControl fullWidth>
              <InputLabel>صلاحية المستخدم (Role)</InputLabel>
              <Select
                value={addData.role}
                label="صلاحية المستخدم (Role)"
                onChange={(e) =>
                  setAddData({ ...addData, role: e.target.value })
                }
              >
                <MenuItem value="student" sx={{ fontWeight: 600 }}>
                  👨‍🎓 طالب
                </MenuItem>
                <MenuItem value="supervisor" sx={{ fontWeight: 600 }}>
                  👨‍🏫 مشرف
                </MenuItem>
              </Select>
            </FormControl>

            {addData.role === "student" && (
              <TextField
                label="الرقم الجامعي"
                fullWidth
                required
                value={addData.student_number}
                onChange={(e) =>
                  setAddData({ ...addData, student_number: e.target.value })
                }
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button
            onClick={() => setOpenAdd(false)}
            color="inherit"
            sx={{ fontWeight: 800 }}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleAddSubmit}
            variant="contained"
            disabled={isAdding}
            sx={{ ...btnPrimarySx, px: 3 }}
          >
            {isAdding ? "جاري الإضافة..." : "إضافة المستخدم"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
