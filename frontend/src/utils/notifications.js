import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import SystemUpdateAltRoundedIcon from "@mui/icons-material/SystemUpdateAltRounded";

export function parseNotification(n) {
  const payload =
    n?.data && typeof n.data === "object" && !Array.isArray(n.data) ? n.data : {};
  const type = String(
    payload?.type ||
      payload?.notification_type ||
      payload?.event ||
      payload?.event_type ||
      "",
  );
  const title = payload?.title ?? n?.title ?? "إشعار";
  const body = payload?.body ?? n?.body ?? payload?.message ?? "";
  return { type, title, body, payload };
}

export function resolveNotificationUrl(n) {
  const { type: rawType, payload } = parseNotification(n);
  const type = String(rawType || "");
  const extra = payload?.data || {};
  const directUrl = extra?.url || payload?.url;
  if (directUrl) return directUrl;

  const projectId = extra?.project_id ?? payload?.project_id;
  const taskId = extra?.task_id ?? payload?.task_id;
  const commentId = extra?.comment_id ?? payload?.comment_id;

  if (type === "password.reset_request" || type === "password.reset_by_admin") {
    return payload?.url || "/dashboard/users?tab=password_requests";
  }

  if (type === "comment.project" && projectId) {
    return commentId
      ? `/dashboard/projects/${projectId}?tab=comments&comment_id=${commentId}`
      : `/dashboard/projects/${projectId}?tab=comments`;
  }

  if (type === "comment.task" && projectId) {
    return `/dashboard/projects/${projectId}?tab=tasks${taskId ? `&task_id=${taskId}` : ""}${commentId ? `&comment_id=${commentId}` : ""}`;
  }

  if (type.startsWith("task.") && projectId) {
    return `/dashboard/projects/${projectId}?tab=tasks${taskId ? `&task_id=${taskId}` : ""}`;
  }

  if (type.includes("version") && projectId) {
    return `/dashboard/projects/${projectId}?tab=versions`;
  }

  if (type.includes("invit") && type.includes("supervisor")) {
    return "/dashboard/supervisor/invitations";
  }

  if (type.includes("invit") && type.includes("student")) {
    return "/dashboard/student/invitations";
  }

  if (projectId) return `/dashboard/projects/${projectId}`;
  return "/dashboard/notifications";
}

export function getNotificationMeta(type = "") {
  const t = String(type).toLowerCase();

  if (t.includes("password")) {
    return {
      icon: LockResetRoundedIcon,
      color: "#D97706",
      bg: "rgba(217,119,6,0.12)",
      label: "كلمة المرور",
    };
  }
  if (t.includes("comment")) {
    return {
      icon: ChatBubbleOutlineRoundedIcon,
      color: "#2563EB",
      bg: "rgba(37,99,235,0.12)",
      label: "تعليق",
    };
  }
  if (t.startsWith("task.")) {
    return {
      icon: AssignmentRoundedIcon,
      color: "#7C3AED",
      bg: "rgba(124,58,237,0.12)",
      label: "مهمة",
    };
  }
  if (t.includes("version")) {
    return {
      icon: SystemUpdateAltRoundedIcon,
      color: "#0891B2",
      bg: "rgba(8,145,178,0.12)",
      label: "إصدار",
    };
  }
  if (t.includes("invit")) {
    return {
      icon: PersonAddAltRoundedIcon,
      color: "#059669",
      bg: "rgba(5,150,105,0.12)",
      label: "دعوة",
    };
  }
  if (t.includes("project")) {
    return {
      icon: FolderRoundedIcon,
      color: "#4F46E5",
      bg: "rgba(79,70,229,0.12)",
      label: "مشروع",
    };
  }
  if (t.includes("user") || t.includes("member")) {
    return {
      icon: GroupRoundedIcon,
      color: "#DC2626",
      bg: "rgba(220,38,38,0.12)",
      label: "مستخدم",
    };
  }

  return {
    icon: NotificationsRoundedIcon,
    color: "#111827",
    bg: "rgba(17,24,39,0.08)",
    label: "نظام",
  };
}

export function formatNotificationTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "الآن";
  if (diffMin < 60) return `منذ ${diffMin} د`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `منذ ${diffH} س`;
  return date.toLocaleString("ar-EG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
