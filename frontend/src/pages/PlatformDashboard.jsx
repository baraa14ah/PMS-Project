import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";

const statCards = [
  { key: "universities", label: "الجامعات", icon: <SchoolRoundedIcon />, color: "#1565C0", to: "/dashboard/universities" },
  { key: "users", label: "المستخدمون", icon: <GroupRoundedIcon />, color: "#2E7D32", to: "/dashboard/users" },
  { key: "projects", label: "المشاريع", icon: <FolderRoundedIcon />, color: "#6A1B9A", to: "/dashboard/projects" },
  { key: "pending_users", label: "طلبات انتظار", icon: <PendingActionsRoundedIcon />, color: "#EF6C00", to: "/dashboard/users" },
];

export default function PlatformDashboard() {
  const { authHeaders, apiFetch, API_BASE_URL } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { res, data } = await apiFetch(
          `${API_BASE_URL}/admin/dashboard/stats`,
          { headers: authHeaders() },
        );
        if (!res.ok) throw new Error(data?.message || "تعذر تحميل الإحصائيات");
        setStats(data?.stats || {});
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <AdminPanelSettingsRoundedIcon sx={{ fontSize: 40, color: "primary.main" }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            لوحة إدارة المنصة
          </Typography>
          <Typography variant="body2" color="text.secondary">
            إدارة جميع الجامعات والمستخدمين والمشاريع — حسابك لا يظهر في قوائم المستخدمين
          </Typography>
        </Box>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {statCards.map((card) => (
            <Grid item xs={12} sm={6} md={3} key={card.key}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  height: "100%",
                }}
              >
                <Stack spacing={2}>
                  <Box sx={{ color: card.color }}>{card.icon}</Box>
                  <Typography variant="h3" sx={{ fontWeight: 900 }}>
                    {stats?.[card.key] ?? 0}
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>{card.label}</Typography>
                  <Button component={Link} to={card.to} size="small" variant="outlined">
                    فتح
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Paper sx={{ mt: 4, p: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
          اختصارات سريعة
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={2}>
          <Button component={Link} to="/dashboard/universities" variant="contained">
            إدارة الجامعات
          </Button>
          <Button component={Link} to="/dashboard/users" variant="contained" color="secondary">
            كل المستخدمين
          </Button>
          <Button component={Link} to="/dashboard/projects" variant="contained" color="success">
            كل المشاريع
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
