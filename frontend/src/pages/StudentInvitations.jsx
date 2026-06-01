import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

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
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import toast from "react-hot-toast";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function StudentInvitations() {
  const { token, user } = useAuth();
  const roleName = (user?.role || "").toLowerCase();

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    }),
    [token],
  );

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE_URL}/student/invitations`, {
        headers: authHeaders,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message || "تعذر جلب دعوات الانضمام");
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
      const res = await fetch(
        `${API_BASE_URL}/student/invitations/${inviteId}/accept`,
        { method: "POST", headers: authHeaders },
      );

      const data = await res.json().catch(() => null);
      if (!res.ok) return toast.error(data?.message || "تعذر قبول الدعوة");

      setItems((prev) => prev.filter((x) => x.id !== inviteId));
      toast.success("✅ تم قبول الدعوة والانضمام للمشروع");

      // ✅ مهم: بعد القبول، افتح صفحة المشاريع مباشرة (حتى يلاحظ المستخدم التحديث)
      // إذا لا تريد تحويل، احذف السطر التالي
      window.location.href = "/dashboard/projects";
    } catch {
      toast.error("حدث خطأ أثناء قبول الدعوة");
    } finally {
      setBusyId(null);
    }
  };

  const rejectInvite = async (inviteId) => {
    try {
      setBusyId(inviteId);
      const res = await fetch(
        `${API_BASE_URL}/student/invitations/${inviteId}/reject`,
        { method: "POST", headers: authHeaders },
      );

      const data = await res.json().catch(() => null);
      if (!res.ok) return toast.error(data?.message || "تعذر رفض الدعوة");

      setItems((prev) => prev.filter((x) => x.id !== inviteId));
      toast.success("تم رفض الدعوة");
    } catch {
      toast.error("حدث خطأ أثناء رفض الدعوة");
    } finally {
      setBusyId(null);
    }
  };

  // ✅ حماية UI
  if (roleName !== "student" && roleName !== "admin") {
    return (
      <Alert severity="warning" sx={{ borderRadius: 2 }}>
        هذه الصفحة مخصصة للطلاب فقط.
      </Alert>
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
            دعوات الانضمام للمشاريع
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            هنا ستجد دعوات الانضمام التي وصلتك ويمكنك قبولها أو رفضها.
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
                icon={<GroupAddRoundedIcon />}
                label="لا توجد دعوات"
                variant="outlined"
                sx={{ fontWeight: 800 }}
              />
              <Typography color="text.secondary">
                عندما يدعوك أحد للانضمام لمشروع ستظهر الدعوة هنا.
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
                  <TableCell sx={{ fontWeight: 900 }}>المرسل</TableCell>
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
                      {inv.project?.title || inv.project_title || "—"}
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography sx={{ fontWeight: 800 }}>
                          {inv.sender?.name ||
                            inv.project?.user?.name ||
                            "مرسل الدعوة"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {inv.sender?.email || ""}
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
