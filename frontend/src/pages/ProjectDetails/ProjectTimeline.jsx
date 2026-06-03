import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from "@mui/lab";

// Icons
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import AddTaskRoundedIcon from "@mui/icons-material/AddTaskRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";

const API_BASE_URL = "http://127.0.0.1:8000/api";

// 🎯 دالة سحرية لتعيين الأيقونة واللون حسب نوع الحركة
const getActivityConfig = (type) => {
  switch (type) {
    case "create":
      return {
        color: "primary",
        icon: <RocketLaunchRoundedIcon fontSize="small" />,
      };
    case "complete":
      return {
        color: "success",
        icon: <TaskAltRoundedIcon fontSize="small" />,
      };
    case "progress":
      return {
        color: "info",
        icon: <PlayCircleRoundedIcon fontSize="small" />,
      };
    case "join":
      return {
        color: "secondary",
        icon: <PersonAddAltRoundedIcon fontSize="small" />,
      };
    case "update":
      return {
        color: "warning",
        icon: <AddTaskRoundedIcon fontSize="small" />,
      };
    default:
      return {
        color: "grey",
        icon: <PlayCircleRoundedIcon fontSize="small" />,
      };
  }
};

// 🎯 دالة لتنسيق التاريخ ليظهر بشكل أنيق (مثال: 3 يونيو - 06:00 م)
const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("ar-EG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export default function ProjectTimeline({ projectId, authHeaders }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${API_BASE_URL}/project/${projectId}/activities`,
          {
            headers: authHeaders,
          },
        );
        const data = await res.json();

        if (res.ok && data.status === "success") {
          setActivities(data.activities || []);
        } else {
          throw new Error("حدث خطأ أثناء جلب النشاطات");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchActivities();
    }
  }, [projectId, authHeaders]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 900, mb: 3 }}>
        سجل نشاطات المشروع ⏱️
      </Typography>

      {activities.length === 0 ? (
        <Typography
          sx={{ color: "text.secondary", textAlign: "center", py: 4 }}
        >
          لا توجد نشاطات مسجلة في هذا المشروع حتى الآن.
        </Typography>
      ) : (
        <Timeline sx={{ p: 0, m: 0 }}>
          {activities.map((activity, index) => {
            const isLast = index === activities.length - 1;
            const config = getActivityConfig(activity.type);
            const userName = activity.user?.name || "مستخدم غير معروف";

            return (
              <TimelineItem key={activity.id} sx={{ minHeight: 70 }}>
                <TimelineOppositeContent
                  sx={{
                    flex: 0.3,
                    pl: 2,
                    pr: 0,
                    color: "text.secondary",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {formatTime(activity.created_at)}
                </TimelineOppositeContent>

                <TimelineSeparator>
                  <TimelineDot
                    color={config.color}
                    sx={{
                      boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                      p: 1,
                    }}
                  >
                    {config.icon}
                  </TimelineDot>
                  {!isLast && (
                    <TimelineConnector sx={{ bgcolor: "divider", width: 2 }} />
                  )}
                </TimelineSeparator>

                <TimelineContent sx={{ py: 1.5, pr: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar
                      sx={{
                        width: 30,
                        height: 30,
                        bgcolor: `${config.color}.main`,
                        fontSize: "0.85rem",
                        fontWeight: 800,
                      }}
                    >
                      {userName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography
                        dir="rtl" // 🎯 إجبار الاتجاه
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.95rem",
                          unicodeBidi: "isolate",
                          textAlign: "right",
                        }}
                      >
                        {activity.action}
                      </Typography>
                      <Typography
                        dir="rtl"
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          unicodeBidi: "isolate",
                          textAlign: "right",
                          fontWeight: 600,
                        }}
                      >
                        بواسطة: {userName}
                      </Typography>
                    </Box>
                  </Stack>
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      )}
    </Paper>
  );
}
