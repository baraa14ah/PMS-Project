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

import EmptyState from "../components/EmptyState";
import NotificationsOffRoundedIcon from "@mui/icons-material/NotificationsOffRounded";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function Notifications() {
  const { token } = useAuth();
  const navigate = useNavigate();

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
    setUnreadCount((prev) => Math.max(0, prev - 1));

    setItems((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
      ),
    );

    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/mark-read`, {
        method: "POST",
        headers: authHeaders,
      });
    } catch (e) {}
  };

  const markAll = async () => {
    setUnreadCount(0);
    setItems((prev) =>
      prev.map((n) => ({
        ...n,
        read_at: n.read_at || new Date().toISOString(),
      })),
    );

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/mark-all-read`,
        {
          method: "POST",
          headers: authHeaders,
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("مشكلة من السيرفر أثناء تحديث الإشعارات:", errorData);
      }
    } catch (e) {
      console.error("فشل الاتصال بالسيرفر (مشكلة شبكة):", e);
    }
  };

  const deleteOne = async (id, isUnread) => {
    if (isUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    setItems((prev) => prev.filter((n) => n.id !== id));

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
    setItems([]);
    setUnreadCount(0);

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

    if (n?.id && !n?.read_at) {
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
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

  const hoverEffect = {
    transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
      borderColor: "white",
    },
  };

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

        {/* 🎯 هنا تم دمج مكون الفراغ الذكي */}
        {items.length === 0 ? (
          <EmptyState
            icon={<NotificationsOffRoundedIcon />}
            title="لا توجد إشعارات حالياً"
            description="أنت على اطلاع بكل جديد! لم تصلك أي إشعارات جديدة حتى هذه اللحظة."
          />
        ) : (
          <Stack spacing={1}>
            {items.map((n) => {
              const payload = n.data || {};
              const isUnread = !n.read_at;

              const title = payload.title || "Notification";
              const body = payload.body || "";

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
                    // 🎯 دمج صحيح لمتغير hoverEffect
                    transition: hoverEffect.transition,
                    "&:hover": {
                      bgcolor: isUnread
                        ? "rgba(255,193,7,0.14)"
                        : "rgba(0,0,0,0.03)",
                      ...hoverEffect["&:hover"],
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={2}
                    dir="rtl"
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{ fontWeight: 900, unicodeBidi: "isolate" }}
                      >
                        {title}
                      </Typography>

                      {body ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 0.3,
                            whiteSpace: "pre-wrap",
                            unicodeBidi: "isolate",
                          }}
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
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ unicodeBidi: "isolate" }}
                        >
                          {n.created_at
                            ? new Date(n.created_at).toLocaleString("ar-EG")
                            : ""}
                        </Typography>
                      </Stack>
                    </Box>

                    <Stack direction="row" spacing={1} dir="ltr">
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
