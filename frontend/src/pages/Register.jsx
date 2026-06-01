import React, { useMemo, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
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
  MenuItem,
  Link,
} from "@mui/material";

import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student"); // ✅ فقط student/supervisor
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info"); // success/error/info
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (!name.trim() || !email.trim() || !password.trim()) return false;
    if (password !== password2) return false;
    if (!["student", "supervisor"].includes(role)) return false;
    return true;
  }, [name, email, password, password2, role, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (password !== password2) {
      setMessageType("error");
      toast.error("كلمتا المرور غير متطابقتين ❌");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role, // ✅ نرسل role = student أو supervisor
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        // لو Laravel Validation
        const validationMsg = data?.errors
          ? Object.values(data.errors).flat().join(" | ")
          : null;

        setMessageType("error");
        toast.error(validationMsg || data?.message || "تعذر إنشاء الحساب");
        setLoading(false);
        return;
      }

      setMessageType("success");
      toast.success("✅ تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن.");
      setLoading(false);

      // تحويل للّوجن بعد نجاح التسجيل
      setTimeout(() => navigate("/login"), 400);
    } catch (err) {
      console.error(err);
      setMessageType("error");
      toast.error("خطأ في الاتصال بالسيرفر");
      setLoading(false);
    }
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
          minHeight: { xs: "auto", md: 650 },
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
            <Typography
              sx={{ fontWeight: 800, letterSpacing: 0.2 }}
              variant="h5"
            >
              ByteHub
            </Typography>
            <Typography sx={{ mt: 1, opacity: 0.85 }} variant="body2">
              Create your account
            </Typography>
          </Box>

          <Box sx={{ mt: 6 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
              Join the <br /> dashboard.
            </Typography>
            <Typography sx={{ mt: 2, opacity: 0.85, maxWidth: 420 }}>
              Students and supervisors can register here. Admin accounts are
              managed internally.
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            © {new Date().getFullYear()} ByteHub
          </Typography>
        </Box>

        {/* Right / Form */}
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
            إنشاء حساب
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: "#6B7280" }}>
            سجّل كطالب أو كمشرف.
          </Typography>

          {message && (
            <Alert severity={messageType} sx={{ mt: 3, borderRadius: 2 }}>
              {message}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
              الاسم الكامل
            </Typography>
            <TextField
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: Ahmed Ali"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
            />

            <Typography
              variant="body2"
              sx={{ fontWeight: 700, mt: 2.5, mb: 1 }}
            >
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
              نوع الحساب
            </Typography>
            <TextField
              select
              fullWidth
              value={role}
              onChange={(e) => setRole(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SchoolOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
            >
              <MenuItem value="student">طالب (Student)</MenuItem>
              <MenuItem value="supervisor">مشرف (Supervisor)</MenuItem>
            </TextField>

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
              autoComplete="new-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
            />

            <Typography
              variant="body2"
              sx={{ fontWeight: 700, mt: 2.5, mb: 1 }}
            >
              تأكيد كلمة المرور
            </Typography>
            <TextField
              fullWidth
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="new-password"
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
                  جاري إنشاء الحساب...
                </Box>
              ) : (
                "إنشاء حساب"
              )}
            </Button>

            <Divider sx={{ my: 3 }} />

            <Typography variant="body2" sx={{ color: "#6B7280" }}>
              لديك حساب بالفعل؟{" "}
              <Link
                component={RouterLink}
                to="/login"
                underline="hover"
                sx={{ fontWeight: 800 }}
              >
                تسجيل الدخول
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
