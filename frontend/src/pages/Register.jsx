import React, { useMemo, useState, useEffect } from "react";
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
  MenuItem,
  Link,
  IconButton,
  Stack,
  Box,
  Collapse,
  Paper,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import AuthPageShell from "../components/AuthPageShell";
import { useLanguage } from "../context/LanguageContext";
import { API_BASE_URL } from "../utils/api";
import {
  authFieldSx,
  authPrimaryBtnSx,
  roleCardSx,
  AUTH_COLORS,
} from "../components/authStyles";

export default function Register() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [universityId, setUniversityId] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [univLoading, setUnivLoading] = useState(true);
  const [univError, setUnivError] = useState("");

  const passMatch = password && password2 && password === password2;
  const passLong = password.length >= 6;

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        setUnivLoading(true);
        const res = await fetch(`${API_BASE_URL}/universities`, {
          headers: { Accept: "application/json" },
        });
        const data = await res.json().catch(() => null);
        if (res.ok && Array.isArray(data?.universities)) {
          setUniversities(data.universities);
        } else {
          setUnivError("تعذر تحميل قائمة الجامعات");
        }
      } catch {
        setUnivError("خطأ في الاتصال بالسيرفر");
      } finally {
        setUnivLoading(false);
      }
    };
    fetchUniversities();
  }, []);

  const canSubmit = useMemo(() => {
    if (loading || !name.trim() || !email.trim() || !password.trim()) return false;
    if (password !== password2 || password.length < 6) return false;
    if (!universityId || univLoading || univError || universities.length === 0) return false;
    if (role === "student" && !studentNumber.trim()) return false;
    return true;
  }, [name, email, password, password2, role, loading, universityId, studentNumber, univLoading, univError, universities.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (password !== password2) {
      toast.error("كلمتا المرور غير متطابقتين");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          university_id: universityId,
          ...(role === "student" ? { student_number: studentNumber.trim() } : {}),
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const validationMsg = data?.errors
          ? Object.values(data.errors).flat().join(" | ")
          : null;
        setMessageType("error");
        toast.error(validationMsg || data?.message || "تعذر إنشاء الحساب");
        setLoading(false);
        return;
      }

      setMessageType("success");
      setMessage("تم إنشاء الحساب! بعد اعتماد مدير الجامعة يمكنك تسجيل الدخول.");
      toast.success("تم إنشاء الحساب — انتظر اعتماد الجامعة");
      setTimeout(() => navigate("/login"), 1200);
    } catch {
      setMessageType("error");
      toast.error("خطأ في الاتصال بالسيرفر");
    }
    setLoading(false);
  };

  return (
    <AuthPageShell
      title={t("auth.registerTitle")}
      subtitle={t("auth.registerSubtitle")}
      brandTitle={t("auth.registerTitle")}
      brandBody={t("auth.registerSubtitle")}
    >
      {message && (
        <Alert severity={messageType} sx={{ mt: 3, borderRadius: 2.5 }}>
          {message}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
          {t("auth.accountType")}
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }}>
          <Paper
            elevation={0}
            onClick={() => setRole("student")}
            sx={{ flex: 1, ...roleCardSx(role === "student", AUTH_COLORS.teal) }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <PersonRoundedIcon sx={{ color: AUTH_COLORS.teal }} />
              <Box>
                <Typography sx={{ fontWeight: 900 }}>{t("auth.student")}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("nav.projects")}
                </Typography>
              </Box>
              {role === "student" && (
                <CheckCircleRoundedIcon sx={{ color: AUTH_COLORS.teal, ml: "auto" }} />
              )}
            </Stack>
          </Paper>
          <Paper
            elevation={0}
            onClick={() => setRole("supervisor")}
            sx={{ flex: 1, ...roleCardSx(role === "supervisor", AUTH_COLORS.blue) }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <SupervisorAccountRoundedIcon sx={{ color: AUTH_COLORS.blue }} />
              <Box>
                <Typography sx={{ fontWeight: 900 }}>{t("auth.supervisor")}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("nav.supervisorInvitations")}
                </Typography>
              </Box>
              {role === "supervisor" && (
                <CheckCircleRoundedIcon sx={{ color: AUTH_COLORS.blue, ml: "auto" }} />
              )}
            </Stack>
          </Paper>
        </Stack>

        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
          {t("auth.fullName")}
        </Typography>
        <TextField
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="الاسم كما في الجامعة"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonOutlineIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={authFieldSx}
        />

        <Typography variant="body2" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
          {t("auth.email")}
        </Typography>
        <TextField
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailOutlinedIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={authFieldSx}
        />

        <Typography variant="body2" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
          {t("auth.university")}
        </Typography>
        {univLoading ? (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              جارِ تحميل الجامعات...
            </Typography>
          </Stack>
        ) : univError ? (
          <Alert severity="error">{univError}</Alert>
        ) : universities.length === 0 ? (
          <Alert severity="warning">لا توجد جامعات متاحة حالياً.</Alert>
        ) : (
          <TextField
            select
            fullWidth
            value={universityId}
            onChange={(e) => setUniversityId(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SchoolOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={authFieldSx}
          >
            <MenuItem value="" disabled>
              {t("auth.chooseUniversity")}
            </MenuItem>
            {universities.map((uni) => (
              <MenuItem key={uni.id} value={uni.id}>
                {uni.name}
              </MenuItem>
            ))}
          </TextField>
        )}

        <Collapse in={role === "student"}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
              {t("auth.studentNumber")}
            </Typography>
            <TextField
              fullWidth
              required={role === "student"}
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              placeholder="مثال: 202400123"
              sx={authFieldSx}
            />
          </Box>
        </Collapse>

        <Typography variant="body2" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
          {t("auth.password")}
        </Typography>
        <TextField
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type={showPass ? "text" : "password"}
          autoComplete="new-password"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShowPass((v) => !v)} edge="end">
                  {showPass ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={authFieldSx}
        />
        <Stack direction="row" spacing={1} sx={{ mt: 0.75 }}>
          <PassHint ok={passLong} label={t("auth.passMin")} />
        </Stack>

        <Typography variant="body2" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
          {t("auth.confirmPassword")}
        </Typography>
        <TextField
          fullWidth
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          type={showPass2 ? "text" : "password"}
          error={password2.length > 0 && !passMatch}
          autoComplete="new-password"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShowPass2((v) => !v)} edge="end">
                  {showPass2 ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={authFieldSx}
        />
        {password2.length > 0 && (
          <PassHint ok={passMatch} label={t("auth.passMatch")} />
        )}

        <Button
          type="submit"
          fullWidth
          disabled={!canSubmit}
          variant="contained"
          startIcon={!loading && <HowToRegRoundedIcon />}
          sx={authPrimaryBtnSx}
        >
          {loading ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} sx={{ color: "white" }} />
              جاري إنشاء الحساب...
            </Stack>
          ) : (
            t("auth.createAccountBtn")
          )}
        </Button>

        <Divider sx={{ my: 3 }} />
        <Typography variant="body2" sx={{ color: AUTH_COLORS.muted, textAlign: "center" }}>
          {t("auth.hasAccount")}{" "}
          <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 900, color: AUTH_COLORS.navy }}>
            {t("auth.login")}
          </Link>
        </Typography>
      </Box>
    </AuthPageShell>
  );
}

function PassHint({ ok, label }) {
  return (
    <Typography
      variant="caption"
      sx={{
        fontWeight: 700,
        color: ok ? "success.main" : "text.secondary",
        display: "flex",
        alignItems: "center",
        gap: 0.5,
      }}
    >
      <CheckCircleRoundedIcon sx={{ fontSize: 14, opacity: ok ? 1 : 0.35 }} />
      {label}
    </Typography>
  );
}
