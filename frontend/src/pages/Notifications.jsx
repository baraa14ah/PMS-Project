import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Divider,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function Notifications() {
  const { token } = useAuth();
  const navigate = useNavigate();

  // ✅ 1. السر هنا: نستخدم الرقم العام ودالة التحديث من الـ Layout ليتزامن الموقع كله
  const { unreadCount, setUnreadCount } = useOutletContext();

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    }),
    [token],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: authHeaders,
      });
      const data = await res.json().catch(() => null);

      if (!res.ok)
        throw new Error(data?.message || "Failed to load notifications");

      setItems(data?.notifications || []);
      // تحديث الرقم العام في السايد بار من السيرفر
      if (data?.unread_count !== undefined) {
        setUnreadCount(Number(data.unread_count));
      }
    } catch (e) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    // 1. الخصم الفوري من السايد بار
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // 2. تحديث الإشعار محلياً ليصبح مقروءاً
    setItems((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
      ),
    );

    // 3. إرسال الطلب بصمت
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/mark-read`, {
        method: "POST",
        headers: authHeaders,
      });
    } catch (e) {}
  };

  const markAll = async () => {
    // 1. التحديث الوهمي السريع للواجهة لكي لا ينتظر المستخدم
    setUnreadCount(0);
    setItems((prev) =>
      prev.map((n) => ({
        ...n,
        read_at: n.read_at || new Date().toISOString(),
      })),
    );

    // 2. إرسال الطلب وكشف الأخطاء إن حدثت
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/mark-all-read`,
        {
          method: "POST",
          headers: authHeaders,
        },
      );

      if (!response.ok) {
        // إذا رفض لارافيل الطلب (مثلا مشكلة Token أو 500) سيتم طباعته هنا
        const errorData = await response.json();
        console.error("مشكلة من السيرفر أثناء تحديث الإشعارات:", errorData);
      }
    } catch (e) {
      console.error("فشل الاتصال بالسيرفر (مشكلة شبكة):", e);
    }
  };

  const deleteOne = async (id, isUnread) => {
    // 1. إذا كان الإشعار المحذوف غير مقروء، نخصمه من السايد بار
    if (isUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    // 2. إخفاء الإشعار من الشاشة فوراً
    setItems((prev) => prev.filter((n) => n.id !== id));

    // 3. إرسال أمر الحذف للسيرفر وكشف الأخطاء
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("مشكلة من السيرفر أثناء حذف الإشعار:", errorData);
      }
    } catch (e) {
      console.error("فشل الاتصال بالسيرفر:", e);
    }
  };

  const deleteAll = async () => {
    // 1. التحديث الوهمي السريع للواجهة (تفريغ القائمة وتصفير العداد)
    setItems([]);
    setUnreadCount(0);

    // 2. إرسال طلب الحذف للسيرفر
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/delete-all`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("مشكلة من السيرفر أثناء حذف الإشعارات:", errorData);
      }
    } catch (e) {
      console.error("فشل الاتصال بالسيرفر (مشكلة شبكة):", e);
    }
  };

  const resolveNotificationUrl = (n) => {
    const payload = n?.data || {};
    const extra = payload?.data || {};

    const directUrl = extra?.url || payload?.url;
    if (directUrl) return directUrl;

    const projectId = extra?.project_id;
    const taskId = extra?.task_id;
    const commentId = extra?.comment_id;
    const type = payload?.type || "";

    if (type === "comment.project" && projectId) {
      return commentId
        ? `/dashboard/projects/${projectId}?tab=comments&comment_id=${commentId}`
        : `/dashboard/projects/${projectId}?tab=comments`;
    }

    if (type === "comment.task" && projectId) {
      return `/dashboard/projects/${projectId}?tab=tasks${
        taskId ? `&task_id=${taskId}` : ""
      }${commentId ? `&comment_id=${commentId}` : ""}`;
    }

    if (type.startsWith("task.") && projectId) {
      return `/dashboard/projects/${projectId}?tab=tasks${
        taskId ? `&task_id=${taskId}` : ""
      }`;
    }

    if (projectId) return `/dashboard/projects/${projectId}`;
    return "/dashboard/notifications";
  };

  const handleOpenNotification = async (n) => {
    const url = resolveNotificationUrl(n);

    // إذا كان غير مقروء، يتم الخصم فوراً وبلا رجعة قبل الانتقال
    if (n?.id && !n?.read_at) {
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        // إشعار السيرفر بصمت في الخلفية
        fetch(`${API_BASE_URL}/notifications/mark-read/${n.id}`, {
          method: "POST",
          headers: authHeaders,
        });
      } catch (e) {}
    }

    navigate(url);
  };

  useEffect(() => {
    if (!token) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">Loading notifications.</Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Paper
        elevation={0}
        sx={{ p: 2.5, borderRadius: 3, border: "1px solid #EAEAEA" }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Notifications
          </Typography>

          <Stack direction="row" spacing={1}>
            <Chip
              label={`Unread: ${unreadCount}`}
              color={unreadCount ? "warning" : "default"}
            />
            <Button size="small" variant="outlined" onClick={fetchAll}>
              Refresh
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={markAll}
              disabled={!unreadCount}
            >
              Mark all read
            </Button>
            <Button
              size="small"
              color="error"
              variant="outlined"
              onClick={deleteAll}
              disabled={!items.length}
            >
              Delete all
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {items.length === 0 ? (
          <Typography color="text.secondary">No notifications.</Typography>
        ) : (
          <Stack spacing={1}>
            {items.map((n) => {
              const payload = n.data || {};
              const isUnread = !n.read_at;

              const title = payload.title || "Notification";
              const body = payload.body || "";
              const type = payload.type || "system";

              return (
                <Paper
                  key={n.id}
                  variant="outlined"
                  onClick={() => handleOpenNotification(n)}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    borderColor: "#EFEFEF",
                    bgcolor: isUnread ? "rgba(255,193,7,0.10)" : "transparent",
                    cursor: "pointer",
                    "&:hover": {
                      bgcolor: isUnread
                        ? "rgba(255,193,7,0.14)"
                        : "rgba(0,0,0,0.03)",
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={2}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900 }}>{title}</Typography>

                      {body ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.3, whiteSpace: "pre-wrap" }}
                        >
                          {body}
                        </Typography>
                      ) : null}

                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ mt: 1 }}
                        alignItems="center"
                      >
                        <Typography variant="caption" color="text.secondary">
                          {n.created_at
                            ? new Date(n.created_at).toLocaleString("ar-EG")
                            : ""}
                        </Typography>
                      </Stack>
                    </Box>

                    <Stack direction="row" spacing={1}>
                      {isUnread && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={(e) => {
                            e.stopPropagation();
                            markRead(n.id);
                          }}
                        >
                          Mark read
                        </Button>
                      )}
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          // تمرير حالة الإشعار (مقروء أم لا) للخصم الصحيح
                          deleteOne(n.id, isUnread);
                        }}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
