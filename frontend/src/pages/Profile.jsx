import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

// MUI
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
  Alert,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

// Icons
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import GitHubIcon from "@mui/icons-material/GitHub";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function Profile() {
  const { token, user } = useAuth();

  const role = (user?.role || "").toLowerCase(); // "student" / "admin" / "supervisor"
  const isStudent = role === "student";

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    }),
    [token],
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editMode, setEditMode] = useState(false);

  // server data
  const [serverUser, setServerUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // form
  const [form, setForm] = useState({
    phone: "",
    avatar: "",
    university_name: "",
    student_number: "",
  });

  const setField = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const fetchProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/profile/me`, {
        headers: authHeaders,
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message || "تعذر جلب بيانات البروفايل");
        setServerUser(null);
        setProfile(null);
        return;
      }

      setServerUser(data?.user || null);
      setProfile(data?.profile || null);

      const p = data?.profile || {};
      setForm({
        phone: p.phone || "",
        avatar: p.avatar || "",
        university_name: p.university_name || "",
        student_number: p.student_number || "",
      });
    } catch {
      setError("حدث خطأ في الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleCancel = () => {
    setEditMode(false);
    // رجّع القيم من آخر شيء محفوظ
    const p = profile || {};
    setForm({
      phone: p.phone || "",
      avatar: p.avatar || "",
      university_name: p.university_name || "",
      student_number: p.student_number || "",
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        phone: form.phone || null,
        avatar: form.avatar || null,
        ...(isStudent
          ? {
              university_name: form.university_name || null,
              student_number: form.student_number || null,
            }
          : {}),
      };

      const res = await fetch(`${API_BASE_URL}/profile/me`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const firstError =
          data?.errors &&
          Object.values(data.errors)?.[0] &&
          Object.values(data.errors)?.[0]?.[0];

        toast.error(firstError || data?.message || "تعذر حفظ البروفايل");
        return;
      }

      toast.success("تم حفظ البروفايل بنجاح ✅");
      setProfile(data?.profile || null);
      setServerUser(data?.user || null);

      setEditMode(false);

      const p = data?.profile || {};
      setForm({
        phone: p.phone || "",
        avatar: p.avatar || "",
        university_name: p.university_name || "",
        student_number: p.student_number || "",
      });
    } catch {
      toast.error("خطأ أثناء الاتصال بالسيرفر");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // Github Unlink Logic
  // =========================
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const performUnlinkGithub = async () => {
    setConfirmOpen(false);

    try {
      setUnlinking(true);

      const res = await fetch(`${API_BASE_URL}/profile/unlink-github`, {
        method: "POST",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(data?.message || "تعذر إلغاء الربط");
        return;
      }

      toast.success("تم إلغاء ربط حساب GitHub بنجاح ✅");
      fetchProfile();
    } catch {
      toast.error("حدث خطأ أثناء الاتصال بالسيرفر");
    } finally {
      setUnlinking(false);
    }
  };

  // UI
  if (loading) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">
            جارِ تحميل البروفايل...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={fetchProfile}>
          إعادة المحاولة
        </Button>
      </Box>
    );
  }

  const displayName =
    serverUser?.name || serverUser?.user?.name || user?.user?.name || "مستخدم";
  const displayEmail =
    serverUser?.email || serverUser?.user?.email || user?.user?.email || "—";

  const currentUserId = serverUser?.id || user?.user?.id;
  const isGithubConnected = serverUser
    ? !!serverUser.github_token
    : !!user?.user?.github_token;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto" }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2.6,
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(900px 320px at 10% 10%, rgba(37,99,235,0.12), transparent 60%), radial-gradient(700px 320px at 85% 35%, rgba(17,24,39,0.10), transparent 60%)",
          }}
        />

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          sx={{ position: "relative" }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={form.avatar || undefined}
              sx={{
                width: 56,
                height: 56,
                borderRadius: 3,
                bgcolor: "background.default",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <PersonRoundedIcon />
            </Avatar>

            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                الملف الشخصي
              </Typography>
              <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
                {displayName} • {displayEmail}
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                sx={{ mt: 1, flexWrap: "wrap" }}
              >
                <Chip
                  size="small"
                  label={`Role: ${role || "—"}`}
                  sx={{ bgcolor: "background.paper" }}
                />
                {isStudent && (
                  <Chip
                    size="small"
                    icon={<SchoolRoundedIcon />}
                    label="Student fields enabled"
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {!editMode ? (
              <Button
                variant="contained"
                startIcon={<EditRoundedIcon />}
                onClick={() => setEditMode(true)}
                sx={{ borderRadius: 2.5, fontWeight: 900 }}
              >
                تعديل
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  startIcon={<SaveRoundedIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ borderRadius: 2.5, fontWeight: 900 }}
                >
                  {saving ? "جاري الحفظ..." : "حفظ"}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelRoundedIcon />}
                  onClick={handleCancel}
                  disabled={saving}
                  sx={{ borderRadius: 2.5, fontWeight: 900 }}
                >
                  إلغاء
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Content */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2 }}>
        {/* Left card */}
        <Paper
          elevation={0}
          sx={{
            flex: 1.2,
            p: 2.6,
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <Typography sx={{ fontWeight: 900 }}>بيانات الحساب</Typography>
            <Chip size="small" label={editMode ? "Edit mode" : "View mode"} />
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2}>
            <TextField
              label="الاسم"
              value={displayName}
              disabled
              helperText="الاسم يأتي من جدول المستخدمين (users)"
            />

            <TextField
              label="البريد الإلكتروني"
              value={displayEmail}
              disabled
            />

            <TextField
              label="رقم الهاتف (اختياري)"
              value={form.phone}
              onChange={setField("phone")}
              disabled={!editMode}
            />

            <TextField
              label="رابط الصورة (Avatar URL) اختياري"
              value={form.avatar}
              onChange={setField("avatar")}
              disabled={!editMode}
              InputProps={{
                endAdornment: (
                  <Tooltip title="ضع رابط صورة (مثال: https://...)">
                    <IconButton size="small">
                      <PhotoCameraRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ),
              }}
            />
          </Stack>
        </Paper>

        {/* Right card */}
        <Stack spacing={2} sx={{ flex: 1 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.6,
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography sx={{ fontWeight: 900, mb: 1 }}>
              معلومات إضافية
            </Typography>

            <Divider sx={{ my: 2 }} />

            {!isStudent ? (
              <Alert severity="info">
                لا توجد حقول خاصة لدورك حالياً (فقط الطالب لديه بيانات جامعية).
              </Alert>
            ) : (
              <Stack spacing={2}>
                <TextField
                  label="اسم الجامعة"
                  value={form.university_name}
                  onChange={setField("university_name")}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <SchoolRoundedIcon
                        sx={{ mr: 1, color: "text.secondary" }}
                      />
                    ),
                  }}
                />

                <TextField
                  label="الرقم الجامعي"
                  value={form.student_number}
                  onChange={setField("student_number")}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <BadgeRoundedIcon
                        sx={{ mr: 1, color: "text.secondary" }}
                      />
                    ),
                  }}
                />
              </Stack>
            )}
          </Paper>

          {/* GitHub Connection */}
          <Paper
            elevation={0}
            sx={{
              p: 2.6,
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography sx={{ fontWeight: 900, mb: 1 }}>
              الحسابات المرتبطة
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              اربط حسابك بـ GitHub لتمكين ميزات الرفع التلقائي للإصدارات في
              مشاريعك.
            </Typography>

            {!isGithubConnected ? (
              <Button
                variant="contained"
                startIcon={<GitHubIcon />}
                sx={{ bgcolor: "#24292e", "&:hover": { bgcolor: "#000" } }}
                onClick={() => {
                  window.location.href = `${API_BASE_URL}/auth/github/redirect?user_id=${currentUserId}`;
                }}
                fullWidth
              >
                ربط حسابي بـ GitHub
              </Button>
            ) : (
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
                sx={{ width: "100%" }}
              >
                <Chip
                  icon={<CheckCircleIcon />}
                  label="حساب GitHub مرتبط"
                  color="success"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />

                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => setConfirmOpen(true)}
                  disabled={unlinking}
                  sx={{ fontWeight: 700, borderRadius: 2 }}
                >
                  {unlinking ? "جاري الإلغاء..." : "إلغاء الربط"}
                </Button>
              </Stack>
            )}
          </Paper>
        </Stack>
      </Stack>

      {/* نافذة تأكيد الإلغاء */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>تأكيد إلغاء الربط</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontWeight: 500 }}>
            هل أنت متأكد أنك تريد إلغاء ربط حساب GitHub الخاص بك؟ ستتوقف ميزات
            الرفع التلقائي للإصدارات الخاصة بمشاريعك.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            color="inherit"
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            تراجع
          </Button>
          <Button
            onClick={performUnlinkGithub}
            color="error"
            variant="contained"
            sx={{ fontWeight: 700, borderRadius: 2 }}
            disableElevation
          >
            نعم، إلغاء الربط
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
