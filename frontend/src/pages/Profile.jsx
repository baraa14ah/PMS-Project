import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { rtlSafeGradientStyle } from "../utils/rtlSafeGradient";
import toast from "react-hot-toast";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Chip,
  Divider,
  TextField,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Switch,
  FormControlLabel,
} from "@mui/material";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import GitHubLinkCard from "../components/GitHubLinkCard";
import { isGithubLinked } from "../utils/githubLink";

/** User profile page with edit, password, and GitHub linking. */
export default function Profile() {
  const { t } = useLanguage();
  const { token, user, authHeaders, apiFetch, API_BASE_URL } = useAuth();

  const role = (user?.role || "").toLowerCase();
  const isStudent = role === "student";
  const isSupervisor = role === "supervisor";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [pwdForm, setPwdForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [availabilitySaving, setAvailabilitySaving] = useState({});

  const [serverUser, setServerUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    phone: "",
    avatar: "",
    university_name: "",
    student_number: "",
  });

  /** Returns a change handler that updates one form field by key. */
  const setField = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  /** Loads the current user profile from the API. */
  const fetchProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const { res, data } = await apiFetch(`${API_BASE_URL}/profile/me`, {
        headers: authHeaders(),
      });

      if (!res.ok) {
        setError(data?.message || t("profile.loadError"));
        setServerUser(null);
        setProfile(null);
        return;
      }

      setServerUser(data?.user || null);
      setProfile(data?.profile || null);

      const p = data?.profile || {};
      setForm({
        phone: p.phone || "",
        avatar: p.avatar || "",
        university_name: p.university_name || "",
        student_number:
          data?.user?.student_number || p.student_number || "",
      });
    } catch {
      setError(t("common.serverError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /** Toggles supervisor availability for a specific university. */
  const handleToggleAvailability = async (universityId, nextValue) => {
    setAvailabilitySaving((prev) => ({ ...prev, [universityId]: true }));
    try {
      const { res, data } = await apiFetch(
        `${API_BASE_URL}/profile/supervisor-availability`,
        {
          method: "PUT",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            university_id: universityId,
            accepting_supervision: nextValue,
          }),
        },
      );

      if (!res.ok) {
        toast.error(data?.message || t("profile.availabilityError"));
        return;
      }

      setServerUser(data?.user || null);
      toast.success(
        nextValue
          ? t("profile.availabilityOn")
          : t("profile.availabilityOff"),
      );
    } catch {
      toast.error(t("common.serverError"));
    } finally {
      setAvailabilitySaving((prev) => ({ ...prev, [universityId]: false }));
    }
  };

  /** Discards edits and restores form values from saved profile. */
  const handleCancel = () => {
    setEditMode(false);
    const p = profile || {};
    setForm({
      phone: p.phone || "",
      avatar: p.avatar || "",
      university_name: p.university_name || "",
      student_number:
        serverUser?.student_number || p.student_number || "",
    });
  };

  /** Persists editable profile fields to the server. */
  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        phone: form.phone || null,
        avatar: form.avatar || null,
        ...(isStudent
          ? { university_name: form.university_name || null }
          : {}),
      };

      const { res, data } = await apiFetch(`${API_BASE_URL}/profile/me`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const firstError =
          data?.errors &&
          Object.values(data.errors)?.[0] &&
          Object.values(data.errors)?.[0]?.[0];

        toast.error(firstError || data?.message || t("profile.saveError"));
        return;
      }

      toast.success(t("profile.saved"));
      setProfile(data?.profile || null);
      setServerUser(data?.user || null);

      setEditMode(false);

      const p = data?.profile || {};
      setForm({
        phone: p.phone || "",
        avatar: p.avatar || "",
        university_name: p.university_name || "",
        student_number: p.student_number || "",
      });
    } catch {
      toast.error(t("common.serverError"));
    } finally {
      setSaving(false);
    }
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  /** Removes the linked GitHub account from the user profile. */
  const performUnlinkGithub = async () => {
    setConfirmOpen(false);

    try {
      setUnlinking(true);

      const { res, data } = await apiFetch(
        `${API_BASE_URL}/profile/unlink-github`,
        { method: "POST", headers: authHeaders() },
      );

      if (!res.ok) {
        toast.error(data?.message || t("profile.unlinkError"));
        return;
      }

      toast.success(t("profile.unlinkSuccess"));
      fetchProfile();
    } catch {
      toast.error(t("common.serverError"));
    } finally {
      setUnlinking(false);
    }
  };

  /** Submits the password change form to the API. */
  const handleChangePassword = async () => {
    try {
      setPwdSaving(true);
      const { res, data } = await apiFetch(
        `${API_BASE_URL}/profile/change-password`,
        {
          method: "PUT",
          headers: authHeaders({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify(pwdForm),
        },
      );
      if (!res.ok) {
        throw new Error(
          data?.message || t("profile.passwordChangeError"),
        );
      }
      toast.success(t("profile.passwordUpdated"));
      setPwdForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">
            {t("profile.loading")}
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={fetchProfile}>
          {t("common.retry")}
        </Button>
      </Box>
    );
  }

  const displayName =
    serverUser?.name || serverUser?.user?.name || user?.user?.name || t("profile.userFallback");
  const displayEmail =
    serverUser?.email || serverUser?.user?.email || user?.user?.email || "—";

  const currentUserId = serverUser?.id || user?.user?.id;
  const isGithubConnected = isGithubLinked(user, serverUser);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto" }}>
      <Paper
        elevation={0}
        sx={{
          p: 2.6,
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          style={rtlSafeGradientStyle(
            "radial-gradient(900px 320px at 10% 10%, rgba(37,99,235,0.12), transparent 60%), radial-gradient(700px 320px at 85% 35%, rgba(17,24,39,0.10), transparent 60%)",
          )}
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
          }}
        />

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          sx={{ position: "relative" }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={form.avatar || undefined}
              sx={{
                width: 56,
                height: 56,
                borderRadius: 3,
                bgcolor: "background.default",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <PersonRoundedIcon />
            </Avatar>

            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                {t("profile.title")}
              </Typography>
              <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
                {displayName} • {displayEmail}
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                sx={{ mt: 1, flexWrap: "wrap" }}
              >
                <Chip
                  size="small"
                  label={`${t("common.role")}: ${t(`roles.${role}`, role || "—")}`}
                  sx={{ bgcolor: "background.paper" }}
                />
                {isStudent && (
                  <Chip
                    size="small"
                    icon={<SchoolRoundedIcon />}
                    label={t("profile.studentFieldsEnabled")}
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {!editMode ? (
              <Button
                variant="contained"
                startIcon={<EditRoundedIcon />}
                onClick={() => setEditMode(true)}
                sx={{ borderRadius: 2.5, fontWeight: 900 }}
              >
                {t("profile.edit")}
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  startIcon={<SaveRoundedIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ borderRadius: 2.5, fontWeight: 900 }}
                >
                  {saving ? t("profile.saving") : t("profile.save")}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelRoundedIcon />}
                  onClick={handleCancel}
                  disabled={saving}
                  sx={{ borderRadius: 2.5, fontWeight: 900 }}
                >
                  {t("profile.cancel")}
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </Paper>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2 }}>
        <Paper
          elevation={0}
          sx={{
            flex: 1.2,
            p: 2.6,
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <Typography sx={{ fontWeight: 900 }}>{t("profile.accountData")}</Typography>
            <Chip size="small" label={editMode ? t("profile.editMode") : t("profile.viewMode")} />
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2}>
            <TextField
              label={t("profile.name")}
              value={displayName}
              disabled
              helperText={t("profile.nameHelper")}
            />

            <TextField
              label={t("profile.email")}
              value={displayEmail}
              disabled
            />

            <TextField
              label={t("profile.phone")}
              value={form.phone}
              onChange={setField("phone")}
              disabled={!editMode}
            />

            <TextField
              label={t("profile.avatarUrl")}
              value={form.avatar}
              onChange={setField("avatar")}
              disabled={!editMode}
              InputProps={{
                endAdornment: (
                  <Tooltip title={t("profile.avatarTooltip")}>
                    <IconButton size="small">
                      <PhotoCameraRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ),
              }}
            />
          </Stack>
        </Paper>

        <Stack spacing={2} sx={{ flex: 1 }}>
          <GitHubLinkCard
            variant="profile"
            userId={currentUserId}
            apiBaseUrl={API_BASE_URL}
            linked={isGithubConnected}
            returnTo="/dashboard/profile"
            onUnlink={() => setConfirmOpen(true)}
            unlinking={unlinking}
          />

          <Paper
            elevation={0}
            sx={{
              p: 2.6,
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography sx={{ fontWeight: 900, mb: 1 }}>
              {t("profile.extraInfo")}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {isSupervisor ? (
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {t("profile.supervisorUniversitiesHint")}
                </Typography>
                {(serverUser?.supervisor_memberships || []).length === 0 ? (
                  <Alert severity="info">{t("profile.supervisorNoUniversities")}</Alert>
                ) : (
                  (serverUser?.supervisor_memberships || []).map((uni) => (
                    <Stack
                      key={uni.id}
                      spacing={1}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "background.default",
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                          <SchoolRoundedIcon fontSize="small" color="action" />
                          <Typography sx={{ fontWeight: 800 }} noWrap>
                            {uni.name}
                          </Typography>
                        </Stack>
                        <Chip
                          size="small"
                          color={
                            uni.status === "active"
                              ? "success"
                              : uni.status === "rejected"
                                ? "error"
                                : "warning"
                          }
                          label={t(`users.status${uni.status === "active" ? "Active" : uni.status === "rejected" ? "Rejected" : "Pending"}`)}
                          sx={{ fontWeight: 800, flexShrink: 0 }}
                        />
                      </Stack>
                      {uni.status === "active" && (
                        <FormControlLabel
                          sx={{ m: 0, alignItems: "flex-start" }}
                          control={
                            <Switch
                              size="small"
                              checked={uni.accepting_supervision !== false}
                              disabled={!!availabilitySaving[uni.id]}
                              onChange={(_, checked) =>
                                handleToggleAvailability(uni.id, checked)
                              }
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                {uni.accepting_supervision !== false
                                  ? t("profile.availableForStudents")
                                  : t("profile.unavailableForStudents")}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {t("profile.availabilityHint")}
                              </Typography>
                            </Box>
                          }
                        />
                      )}
                    </Stack>
                  ))
                )}
              </Stack>
            ) : !isStudent ? (
              <Alert severity="info">
                {t("profile.noRoleFields")}
              </Alert>
            ) : (
              <Stack spacing={2}>
                <TextField
                  label={t("profile.universityName")}
                  value={form.university_name}
                  onChange={setField("university_name")}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <SchoolRoundedIcon
                        sx={{ mr: 1, color: "text.secondary" }}
                      />
                    ),
                  }}
                />

                <TextField
                  label={t("profile.studentNumber")}
                  value={form.student_number || serverUser?.student_number || ""}
                  disabled
                  helperText={t("profile.studentNumberHelper")}
                  InputProps={{
                    startAdornment: (
                      <BadgeRoundedIcon
                        sx={{ mr: 1, color: "text.secondary" }}
                      />
                    ),
                  }}
                />
              </Stack>
            )}
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2.6,
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography sx={{ fontWeight: 900, mb: 1 }}>
              {t("profile.changePassword")}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              <TextField
                label={t("profile.currentPassword")}
                type="password"
                value={pwdForm.current_password}
                onChange={(e) =>
                  setPwdForm((p) => ({
                    ...p,
                    current_password: e.target.value,
                  }))
                }
              />
              <TextField
                label={t("profile.newPassword")}
                type="password"
                value={pwdForm.new_password}
                onChange={(e) =>
                  setPwdForm((p) => ({ ...p, new_password: e.target.value }))
                }
              />
              <TextField
                label={t("profile.confirmNewPassword")}
                type="password"
                value={pwdForm.new_password_confirmation}
                onChange={(e) =>
                  setPwdForm((p) => ({
                    ...p,
                    new_password_confirmation: e.target.value,
                  }))
                }
              />
              <Button
                variant="contained"
                disabled={pwdSaving}
                onClick={handleChangePassword}
                sx={{ fontWeight: 800, alignSelf: "flex-start" }}
              >
                {pwdSaving ? t("profile.saving") : t("profile.savePassword")}
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Stack>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>{t("profile.unlinkTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontWeight: 500 }}>
            {t("profile.unlinkContent")}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            color="inherit"
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            {t("profile.unlinkBack")}
          </Button>
          <Button
            onClick={performUnlinkGithub}
            color="error"
            variant="contained"
            sx={{ fontWeight: 700, borderRadius: 2 }}
            disableElevation
          >
            {t("profile.unlinkConfirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
