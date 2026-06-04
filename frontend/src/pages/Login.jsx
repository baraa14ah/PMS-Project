import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  Divider,
  Link as MuiLink,
  IconButton,
  Stack,
  Box,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import AuthPageShell from "../components/AuthPageShell";
import { useLanguage } from "../context/LanguageContext";
import { API_BASE_URL } from "../utils/api";
import { authFieldSx, authPrimaryBtnSx, AUTH_COLORS } from "../components/authStyles";

export default function Login() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const canSubmit = useMemo(
    () => email.trim() && password.trim() && !loading,
    [email, password, loading],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.token) {
        await login(data.token);
        toast.success("تم تسجيل الدخول بنجاح");
        navigate("/dashboard");
      } else {
        setMessageType("error");
        setMessage(data?.message || "بيانات الدخول غير صحيحة");
        toast.error(data?.message || "بيانات الدخول غير صحيحة");
      }
    } catch {
      setMessageType("error");
      setMessage("خطأ في الاتصال بالسيرفر");
      toast.error("خطأ في الاتصال بالسيرفر");
    }
    setLoading(false);
  };

  return (
    <AuthPageShell
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSubtitle")}
      brandTitle={t("auth.loginTitle")}
      brandBody={t("auth.loginSubtitle")}
    >
      {message && (
        <Alert severity={messageType} sx={{ mt: 3, borderRadius: 2.5 }}>
          {message}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: focused === "email" ? AUTH_COLORS.blue : "inherit" }}>
          {t("auth.email")}
        </Typography>
        <TextField
          fullWidth
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setFocused("email")}
          onBlur={() => setFocused(null)}
          autoComplete="email"
          placeholder="name@university.edu"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailOutlinedIcon fontSize="small" color={focused === "email" ? "primary" : "action"} />
              </InputAdornment>
            ),
          }}
          sx={authFieldSx}
        />

        <Typography
          variant="body2"
          sx={{ fontWeight: 700, mt: 2.5, mb: 1, color: focused === "pass" ? AUTH_COLORS.blue : "inherit" }}
        >
          {t("auth.password")}
        </Typography>
        <TextField
          fullWidth
          type={showPass ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setFocused("pass")}
          onBlur={() => setFocused(null)}
          autoComplete="current-password"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon fontSize="small" color={focused === "pass" ? "primary" : "action"} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShowPass((v) => !v)} edge="end" tabIndex={-1}>
                  {showPass ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={authFieldSx}
        />

        <Button
          type="submit"
          fullWidth
          disabled={!canSubmit}
          variant="contained"
          startIcon={!loading && <LoginRoundedIcon />}
          sx={authPrimaryBtnSx}
        >
          {loading ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={20} sx={{ color: "white" }} />
              <span>{t("auth.signingIn")}</span>
            </Stack>
          ) : (
            t("auth.signIn")
          )}
        </Button>

        <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
          <MuiLink component={RouterLink} to="/forgot-password" underline="hover" sx={{ fontWeight: 700, color: AUTH_COLORS.muted }}>
            {t("auth.forgotPassword")}
          </MuiLink>
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="body2" color="text.secondary" textAlign="center">
          {t("auth.noAccount")}{" "}
          <MuiLink component={RouterLink} to="/register" underline="hover" sx={{ fontWeight: 900, color: AUTH_COLORS.navy }}>
            {t("auth.createAccount")}
          </MuiLink>
        </Typography>
      </Box>
    </AuthPageShell>
  );
}
