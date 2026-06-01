import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  Divider,
  Link as MuiLink,
} from "@mui/material";

import { Link as RouterLink } from "react-router-dom";

import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info"); // "success" | "error" | "info"
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0 && !loading;
  }, [email, password, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.token) {
        await login(data.token);
        setMessageType("success");
        toast.success("تم تسجيل الدخول بنجاح ✅");
        navigate("/dashboard");
      } else {
        setMessageType("error");
        toast.error(data?.message || "بيانات الدخول غير صحيحة ❌");
      }
    } catch (err) {
      console.error("NETWORK ERROR:", err);
      setMessageType("error");
      toast.error("خطأ في الاتصال بالسيرفر");
    }

    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F7F8FA",
        display: "grid",
        placeItems: "center",
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "min(1100px, 100%)",
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid #E6E8EC",
          boxShadow: "0 18px 60px rgba(0,0,0,0.08)",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" },
          minHeight: { xs: "auto", md: 620 },
        }}
      >
        {/* Left / Brand */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            justifyContent: "space-between",
            p: 5,
            bgcolor: "#111827",
            color: "white",
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 800 }} variant="h5">
              ByteHub
            </Typography>
          </Box>
          <Box sx={{ mt: 6 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
              Manage your <br /> projects smarter.
            </Typography>
            <Typography sx={{ mt: 2, opacity: 0.85, maxWidth: 420 }}>
              Track tasks, versions, comments, and invitations in one place with
              a clean modern dashboard.
            </Typography>

            <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <Typography sx={{ fontWeight: 700 }}>Tasks</Typography>
                <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                  Organized workflow
                </Typography>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <Typography sx={{ fontWeight: 700 }}>Versions</Typography>
                <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                  Clean release history
                </Typography>
              </Box>
            </Box>
          </Box>

          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            © {new Date().getFullYear()} ByteHub
          </Typography>
        </Box>

        {/* Right / Login Form */}
        <Box
          sx={{
            p: { xs: 3, md: 5 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            bgcolor: "white",
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            تسجيل الدخول
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: "#6B7280" }}>
            أدخل بريدك وكلمة المرور للوصول للوحة التحكم.
          </Typography>

          {message && (
            <Alert severity={messageType} sx={{ mt: 3, borderRadius: 2 }}>
              {message}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
              البريد الإلكتروني
            </Typography>
            <TextField
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              type="email"
              autoComplete="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
            />

            <Typography
              variant="body2"
              sx={{ fontWeight: 700, mt: 2.5, mb: 1 }}
            >
              كلمة المرور
            </Typography>
            <TextField
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
            />

            <Button
              type="submit"
              fullWidth
              disabled={!canSubmit}
              sx={{
                mt: 3,
                borderRadius: 2.5,
                py: 1.4,
                fontWeight: 800,
                textTransform: "none",
                bgcolor: "#111827",
                "&:hover": { bgcolor: "#0B1220" },
              }}
              variant="contained"
            >
              {loading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={18} sx={{ color: "white" }} />
                  جاري الدخول...
                </Box>
              ) : (
                "دخول"
              )}
            </Button>

            <Divider sx={{ my: 3 }} />

            <Typography variant="body2" sx={{ color: "#6B7280" }}>
              ليس لديك حساب؟{" "}
              <MuiLink
                component={RouterLink}
                to="/register"
                underline="hover"
                sx={{ fontWeight: 800, color: "#111827" }}
              >
                إنشاء حساب
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
