import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  Button,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
} from "@mui/material";
import toast from "react-hot-toast";

// Icons
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function VersionsTab({
  projectId,
  project,
  versions,
  setVersions,
  currentUserId,
  currentRole,
  authHeaders,
  canUploadVersion,
  normalizeFileUrl,
  setDialogConfig,
  setDialogLoading,
  closeDialog,
}) {
  // ---------------- الحالات (States) ----------------
  const [versionTitle, setVersionTitle] = useState("");
  const [versionNote, setVersionNote] = useState("");
  const [versionFile, setVersionFile] = useState(null);
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const [versionMsg, setVersionMsg] = useState({ type: "", text: "" });

  const [editingVersionId, setEditingVersionId] = useState(null);
  const [editVersionTitle, setEditVersionTitle] = useState("");
  const [editVersionDesc, setEditVersionDesc] = useState("");
  const [savingEditVersion, setSavingEditVersion] = useState(false);

  const [pushingVersionId, setPushingVersionId] = useState(null);

  // ---------------- الدوال (Functions) ----------------
  const handleUploadVersion = async (e) => {
    e.preventDefault();
    setVersionMsg({ type: "", text: "" });
    if (!versionTitle.trim() || !versionFile)
      return setVersionMsg({ type: "error", text: "العنوان والملف مطلوبان." });

    try {
      setUploadingVersion(true);
      const fd = new FormData();
      fd.append("version_title", versionTitle);
      fd.append("version_description", versionNote || "");
      fd.append("file", versionFile);

      const res = await fetch(
        `${API_BASE_URL}/project/${projectId}/versions/upload`,
        {
          method: "POST",
          headers: authHeaders,
          body: fd,
        },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok)
        return setVersionMsg({
          type: "error",
          text: data?.message || "فشل رفع الإصدار",
        });

      setVersions((prev) =>
        [normalizeFileUrl(data?.version), ...prev].filter(Boolean),
      );
      setVersionTitle("");
      setVersionNote("");
      setVersionFile(null);
      setVersionMsg({ type: "success", text: "تم رفع الإصدار بنجاح ✅" });
    } catch {
      setVersionMsg({ type: "error", text: "خطأ أثناء الاتصال بالسيرفر." });
    } finally {
      setUploadingVersion(false);
    }
  };

  const openEditVersion = (v) => {
    setEditingVersionId(v.id);
    setEditVersionTitle(v.version_title || "");
    setEditVersionDesc(v.version_description || "");
  };

  const cancelEditVersion = () => {
    setEditingVersionId(null);
    setEditVersionTitle("");
    setEditVersionDesc("");
  };

  const handleSaveEditVersion = async (e) => {
    e.preventDefault();
    if (!editVersionTitle.trim()) return toast.error("عنوان الإصدار مطلوب");
    try {
      setSavingEditVersion(true);
      const res = await fetch(
        `${API_BASE_URL}/project/versions/${editingVersionId}`,
        {
          method: "PUT",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({
            version_title: editVersionTitle,
            version_description: editVersionDesc || null,
          }),
        },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) return toast.error("فشل تعديل الإصدار");

      setVersions((prev) =>
        prev.map((v) =>
          v.id === editingVersionId
            ? normalizeFileUrl({ ...v, ...data?.version })
            : v,
        ),
      );
      cancelEditVersion();
    } catch {
      toast.error("حدث خطأ أثناء تعديل الإصدار");
    } finally {
      setSavingEditVersion(false);
    }
  };

  const handleDeleteVersion = (versionId) => {
    setDialogConfig({
      isOpen: true,
      title: "حذف هذا الإصدار؟",
      content: "سيتم حذف الملف المرفوع نهائياً.",
      confirmText: "نعم، احذف",
      confirmColor: "error",
      onConfirm: async () => {
        try {
          setDialogLoading(true);
          const res = await fetch(
            `${API_BASE_URL}/project/versions/${versionId}`,
            {
              method: "DELETE",
              headers: authHeaders,
            },
          );

          if (!res.ok) {
            toast.error("فشل حذف الإصدار ❌");
            return;
          }

          setVersions((prev) => prev.filter((v) => v.id !== versionId));
          toast.success("تم حذف الإصدار بنجاح 🗑️");
          closeDialog();
        } catch {
          toast.error("خطأ في الاتصال 🌐");
        } finally {
          setDialogLoading(false);
        }
      },
    });
  };

  const handlePushToGithub = (versionId) => {
    if (!project?.github_repo_url) {
      return toast.error("يرجى إضافة رابط مستودع GitHub للمشروع أولاً.");
    }
    setDialogConfig({
      isOpen: true,
      title: "رفع إلى GitHub؟",
      content: "سيتم دفع هذا الملف كإصدار جديد إلى مستودعك على GitHub.",
      confirmText: "نعم، ارفع الآن",
      confirmColor: "primary",
      onConfirm: async () => {
        try {
          setDialogLoading(true);
          setPushingVersionId(versionId);
          const res = await fetch(
            `${API_BASE_URL}/project-versions/${versionId}/push-to-github`,
            {
              method: "POST",
              headers: authHeaders,
            },
          );
          const data = await res.json().catch(() => null);

          if (!res.ok) {
            toast.error(data?.message || "فشل الرفع إلى مستودع GitHub ❌");
            return;
          }

          toast.success("تم رفع الإصدار إلى GitHub بنجاح 🚀");
          closeDialog();
        } catch {
          toast.error("خطأ في الاتصال بالسيرفر 🌐");
        } finally {
          setDialogLoading(false);
          setPushingVersionId(null);
        }
      },
    });
  };

  const hoverEffect = {
    transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
    "&:hover": {
      transform: "translateY(-4px)", // رفع البطاقة 4 بيكسل للأعلى
      boxShadow: "0 10px 25px rgba(0,0,0,0.08)", // ظل ناعم جداً
      borderColor: "primary.main", // تغيير لون الإطار للون الأساسي (اختياري)
    },
  };
  // ---------------- الواجهة (UI) ----------------
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        flex: 1,
        minWidth: 0,
        borderRadius: 3,
        border: "1px solid #EAEAEA",
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
        إصدارات المشروع (Versions)
      </Typography>

      {!canUploadVersion && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          لا يمكنك رفع إصدارات لهذا المشروع.
        </Alert>
      )}

      {/* قسم رفع الإصدار */}
      {canUploadVersion && (
        <Box component="form" onSubmit={handleUploadVersion} sx={{ mb: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              fullWidth
              size="small"
              label="عنوان الإصدار"
              value={versionTitle}
              onChange={(e) => setVersionTitle(e.target.value)}
            />
            <TextField
              fullWidth
              size="small"
              label="وصف (اختياري)"
              value={versionNote}
              onChange={(e) => setVersionNote(e.target.value)}
            />
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileRoundedIcon />}
              sx={{ minWidth: 170 }}
            >
              اختيار ملف
              <input
                hidden
                type="file"
                onChange={(e) => setVersionFile(e.target.files?.[0] || null)}
              />
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={uploadingVersion}
              sx={{ minWidth: 110 }}
            >
              {uploadingVersion ? "..." : "رفع"}
            </Button>
          </Stack>
          {versionFile && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              الملف: {versionFile.name}
            </Typography>
          )}
          {versionMsg.text && (
            <Alert
              severity={versionMsg.type === "error" ? "error" : "success"}
              sx={{ mt: 1 }}
            >
              {versionMsg.text}
            </Alert>
          )}
        </Box>
      )}

      {/* قسم تعديل الإصدار (يظهر عند الضغط على زر التعديل) */}
      {editingVersionId && (
        <Paper
          variant="outlined"
          sx={{ p: 2, borderRadius: 2, mb: 2, bgcolor: "#fcfcfc" }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <Typography sx={{ fontWeight: 800 }}>
              تعديل الإصدار #{editingVersionId}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={cancelEditVersion}
              startIcon={<CancelRoundedIcon />}
            >
              إلغاء
            </Button>
          </Stack>
          <Box component="form" onSubmit={handleSaveEditVersion}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <TextField
                fullWidth
                size="small"
                label="عنوان الإصدار"
                value={editVersionTitle}
                onChange={(e) => setEditVersionTitle(e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label="الوصف"
                value={editVersionDesc}
                onChange={(e) => setEditVersionDesc(e.target.value)}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={savingEditVersion}
                startIcon={<SaveRoundedIcon />}
                sx={{ minWidth: 120 }}
              >
                {savingEditVersion ? "..." : "حفظ"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      )}

      {/* 🎯 صندوق قائمة الإصدارات القابل للتمرير */}
      <Box
        sx={{
          maxHeight: "450px", // نفس ارتفاع التعليقات ليظهروا بشكل متناسق
          overflowY: "auto",
          pr: 1,
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#ccc",
            borderRadius: "10px",
          },
        }}
      >
        {versions.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            لا توجد إصدارات بعد.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {versions.map((v) => {
              const ownerId = String(v?.user_id || "");
              const safeCurrentUserId = String(currentUserId || "");
              const canEditV =
                safeCurrentUserId !== "" && ownerId === safeCurrentUserId;
              const canDeleteV = currentRole === "admin" || canEditV;

              return (
                <Paper
                  key={v.id}
                  variant="outlined"
                  sx={{ p: 1.5, borderRadius: 2, borderColor: "#EFEFEF" }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 800 }}>
                        {v.version_title || `Version #${v.id}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {v.created_at
                          ? new Date(v.created_at).toLocaleString("ar-EG")
                          : ""}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        {v.version_description || "بدون وصف"}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      {v.file_url ? (
                        <Button
                          size="small"
                          variant="outlined"
                          component="a"
                          href={v.file_url}
                          target="_blank"
                          rel="noreferrer"
                          download
                        >
                          تحميل
                        </Button>
                      ) : (
                        <Chip
                          size="small"
                          label="لا يوجد ملف"
                          variant="outlined"
                        />
                      )}

                      {project?.github_repo_url &&
                        project?.user_id === currentUserId && (
                          <Tooltip title="دفع كإصدار إلى GitHub">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handlePushToGithub(v.id)}
                              disabled={pushingVersionId === v.id}
                            >
                              {pushingVersionId === v.id ? (
                                <CircularProgress size={20} />
                              ) : (
                                <CloudUploadRoundedIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                        )}

                      {canEditV && (
                        <Tooltip title="تعديل">
                          <IconButton
                            size="small"
                            onClick={() => openEditVersion(v)}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDeleteV && (
                        <Tooltip title="حذف">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteVersion(v.id)}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
