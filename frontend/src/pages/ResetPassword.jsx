import React, { useMemo, useState } from "react";
import {
  Link as RouterLink,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import {
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  Link as MuiLink,
  Box,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import AuthPageShell from "../components/AuthPageShell";
import { API_BASE_URL } from "../utils/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email = params.get("email") || "";
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const canSubmit = useMemo(
    () =>
      email &&
      token &&
      password.length >= 6 &&
      password === password2 &&
      !loading,
    [email, token, password, password2, loading],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== password2) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/password/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          token,
          password,
          password_confirmation: password2,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "تعذر إعادة تعيين كلمة المرور");
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2800);
    } catch {
      setError("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  if (!email || !token) {
    return (
      <AuthPageShell
        title="رابط غير صالح"
        subtitle="يبدو أن الرابط ناقصاً أو منتهياً."
      >
        <Alert severity="warning" sx={{ mt: 3, borderRadius: 2 }}>
          اطلب رابطاً جديداً من صفحة استعادة كلمة المرور ثم افتح الرابط من
          البريد مباشرة.
        </Alert>
        <Button
          component={RouterLink}
          to="/forgot-password"
          variant="contained"
          sx={{
            mt: 3,
            fontWeight: 800,
            borderRadius: 2.5,
            bgcolor: "#111827",
            color: "#fff",
            "&:hover": { bgcolor: "#0B1220", color: "#fff" },
          }}
        >
          طلب رابط جديد
        </Button>
      </AuthPageShell>
    );
  }

  if (success) {
    return (
      <AuthPageShell
        title="تم بنجاح"
        subtitle="جاري تحويلك إلى صفحة تسجيل الدخول..."
      >
        <Alert severity="success" sx={{ mt: 3, borderRadius: 2 }}>
          تم تحديث كلمة المرور. سجّل الدخول بكلمة المرور الجديدة.
        </Alert>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      title="كلمة مرور جديدة"
      subtitle={`تعيين كلمة مرور جديدة للحساب: ${email}`}
      brandTitle="Set a new password."
      brandBody="Choose a strong password you do not use on other sites."
    >
      {error && (
        <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
          كلمة المرور الجديدة
        </Typography>
        <TextField
          fullWidth
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="6 أحرف على الأقل"
          autoComplete="new-password"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 }, mb: 2 }}
        />

        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
          تأكيد كلمة المرور
        </Typography>
        <TextField
          fullWidth
          type="password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          autoComplete="new-password"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockResetRoundedIcon fontSize="small" />
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
            color: "#fff",
            "&:hover": { bgcolor: "#0B1220", color: "#fff" },
          }}
          variant="contained"
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: "white" }} />
          ) : (
            "حفظ وتسجيل الدخول"
          )}
        </Button>

        <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
          <MuiLink
            component={RouterLink}
            to="/forgot-password"
            underline="hover"
            sx={{ fontWeight: 700, color: "#6B7280", mr: 2 }}
          >
            طلب رابط جديد
          </MuiLink>
          <MuiLink
            component={RouterLink}
            to="/login"
            underline="hover"
            sx={{ fontWeight: 800, color: "#111827" }}
          >
            تسجيل الدخول
          </MuiLink>
        </Typography>
      </Box>
    </AuthPageShell>
  );
}
