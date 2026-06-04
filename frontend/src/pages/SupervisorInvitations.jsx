import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  IconButton,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";

export default function SupervisorInvitations() {
  const { token, user, authHeaders, apiFetch, API_BASE_URL } = useAuth();
  const roleName = (user?.role || "").toLowerCase();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError("");

      const { res, data } = await apiFetch(
        `${API_BASE_URL}/supervisor/invitations`,
        { headers: authHeaders() },
      );

      if (!res.ok) {
        setError(data?.message || "تعذر جلب دعوات الإشراف");
        setItems([]);
        return;
      }

      setItems(data?.invitations || []);
    } catch {
      setError("خطأ أثناء الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const acceptInvite = async (inviteId) => {
    try {
      setBusyId(inviteId);
      const { res, data } = await apiFetch(
        `${API_BASE_URL}/supervisor/invitations/${inviteId}/accept`,
        { method: "POST", headers: authHeaders() },
      );
      if (!res.ok) return toast.error(data?.message || "تعذر قبول الدعوة");

      setItems((prev) => prev.filter((x) => x.id !== inviteId));
      toast.success("تم قبول الدعوة بنجاح، أنت الآن مشرف على المشروع!");
      window.dispatchEvent(new Event("updateSidebarBadges"));
    } catch {
      toast.error("حدث خطأ أثناء قبول الدعوة");
    } finally {
      setBusyId(null);
    }
  };

  const rejectInvite = async (inviteId) => {
    try {
      setBusyId(inviteId);
      const { res, data } = await apiFetch(
        `${API_BASE_URL}/supervisor/invitations/${inviteId}/reject`,
        { method: "POST", headers: authHeaders() },
      );
      if (!res.ok) return toast.error(data?.message || "تعذر رفض الدعوة");

      setItems((prev) => prev.filter((x) => x.id !== inviteId));
      toast.success("تم رفض الدعوة بنجاح");
      window.dispatchEvent(new Event("updateSidebarBadges"));
    } catch {
      toast.error("حدث خطأ أثناء رفض الدعوة");
    } finally {
      setBusyId(null);
    }
  };

  if (roleName !== "supervisor" && roleName !== "admin") {
    return (
      <Box sx={{ maxWidth: 1200, mx: "auto", mt: 4 }}>
        <Alert severity="warning" sx={{ borderRadius: 2, fontWeight: "bold" }}>
          هذه الصفحة مخصصة للمشرفين فقط.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            دعوات الإشراف
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            قم بقبول أو رفض دعوات الإشراف القادمة للمشاريع.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshRoundedIcon />}
          onClick={fetchInvitations}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900 }}
        >
          تحديث
        </Button>
      </Stack>

      {/* Loading */}
      {loading && (
        <Card sx={{ borderRadius: 3, border: "1px solid #E7E8F0" }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress size={22} />
              <Typography sx={{ fontWeight: 700 }}>
                جارِ تحميل الدعوات...
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Empty */}
      {!loading && !error && items.length === 0 && (
        <Card sx={{ borderRadius: 3, border: "1px solid #E7E8F0" }}>
          <CardContent>
            <Stack spacing={1} alignItems="flex-start">
              <Chip
                icon={<SchoolRoundedIcon />}
                label="لا توجد دعوات"
                variant="outlined"
                sx={{ fontWeight: 800 }}
              />
              <Typography color="text.secondary">
                عندما يرسل لك طالب دعوة إشراف ستظهر هنا.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!loading && !error && items.length > 0 && (
        <Card sx={{ borderRadius: 3, border: "1px solid #E7E8F0" }}>
          <CardContent>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                الدعوات الواردة
              </Typography>
              <Chip label={`${items.length} دعوة`} size="small" />
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900 }}>المشروع</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>مرسلة من</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>تاريخ الإرسال</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 160 }}>
                    إجراءات
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {items.map((inv) => (
                  <TableRow key={inv.id} hover>
                    <TableCell sx={{ fontWeight: 800 }}>
                      {inv.project_title || inv.project?.title || "—"}
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography sx={{ fontWeight: 800 }}>
                          {/* قرأنا البيانات من العلاقة student التي أرسلها الباك إند */}
                          {inv.student?.name || "طالب (مالك المشروع)"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {inv.student?.email || ""}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {inv.created_at
                          ? new Date(inv.created_at).toLocaleString("ar-EG")
                          : "—"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="قبول">
                          <span>
                            <IconButton
                              color="success"
                              onClick={() => acceptInvite(inv.id)}
                              disabled={busyId === inv.id}
                            >
                              <CheckCircleRoundedIcon />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title="رفض">
                          <span>
                            <IconButton
                              color="error"
                              onClick={() => rejectInvite(inv.id)}
                              disabled={busyId === inv.id}
                            >
                              <HighlightOffRoundedIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
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
