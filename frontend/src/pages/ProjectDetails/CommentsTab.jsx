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
} from "@mui/material";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

// Icons
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";

export default function CommentsTab({
  projectId,
  comments,
  setComments,
  currentUserId,
  currentRole,
  setDialogConfig,
  setDialogLoading,
  closeDialog,
}) {
  const { authHeaders, apiFetch, API_BASE_URL } = useAuth();

  // الحالات الخاصة بالتعليقات فقط (تم عزلها هنا لكي لا تزدحم الصفحة الرئيسية)
  const [newComment, setNewComment] = useState("");
  const [commentMsg, setCommentMsg] = useState({ type: "", text: "" });
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentValue, setEditingCommentValue] = useState("");

  // ---------------- الدوال ----------------
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return toast.error("لا يمكن إرسال تعليق فارغ ⚠️");

    try {
      const { res, data } = await apiFetch(
        `${API_BASE_URL}/project/${projectId}/comment`,
        {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ comment: newComment }),
        },
      );

      if (!res.ok) return toast.error(data?.message || "تعذر إرسال التعليق ❌");

      setComments((prev) => [data?.comment, ...prev].filter(Boolean));
      setNewComment("");
      toast.success("تمت إضافة التعليق بنجاح 💬");
    } catch {
      toast.error("حدث خطأ أثناء الاتصال بالسيرفر 🌐");
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editingCommentValue.trim())
      return toast.error("لا يمكن حفظ تعليق فارغ");

    try {
      const { res } = await apiFetch(`${API_BASE_URL}/comment/${commentId}`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ comment: editingCommentValue }),
      });

      if (!res.ok) return toast.error("تعذر تعديل التعليق");

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, comment: editingCommentValue } : c,
        ),
      );
      toast.success("تم تعديل التعليق بنجاح ✏️");
      setEditingCommentId(null);
      setEditingCommentValue("");
    } catch {
      toast.error("حدث خطأ أثناء التعديل");
    }
  };

  const handleDeleteComment = (commentId) => {
    setDialogConfig({
      isOpen: true,
      title: "حذف التعليق؟",
      content: "هل أنت متأكد أنك تريد حذف هذا التعليق نهائياً؟",
      confirmText: "حذف",
      confirmColor: "error",
      onConfirm: async () => {
        try {
          setDialogLoading(true);
          const { res } = await apiFetch(`${API_BASE_URL}/comment/${commentId}`, {
            method: "DELETE",
            headers: authHeaders(),
          });

          if (!res.ok) {
            toast.error("تعذر حذف التعليق ❌");
            return;
          }

          setComments((prev) => prev.filter((c) => c.id !== commentId));
          toast.success("تم حذف التعليق بنجاح");
          closeDialog();
        } catch {
          toast.error("خطأ في الاتصال 🌐");
        } finally {
          setDialogLoading(false);
        }
      },
    });
  };

  // ---------------- الواجهة ----------------
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
        التعليقات
      </Typography>

      {/* صندوق إضافة التعليق */}
      <Box component="form" onSubmit={handleAddComment} sx={{ mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField
            fullWidth
            multiline
            minRows={1}
            maxRows={4}
            size="small"
            label="اكتب تعليقك"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Button type="submit" variant="contained" sx={{ minWidth: 120 }}>
            إرسال
          </Button>
        </Stack>
      </Box>

      {/* 🎯 صندوق التعليقات القابل للتمرير (حل مشكلة طول الصفحة) */}
      <Box
        sx={{
          maxHeight: "450px", // أقصى ارتفاع للصندوق
          overflowY: "auto", // تفعيل التمرير العمودي
          pr: 1, // مسافة صغيرة من اليمين لشريط التمرير
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#ccc",
            borderRadius: "10px",
          },
        }}
      >
        {comments.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            لا توجد تعليقات بعد.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {comments.map((c) => {
              const canEdit = currentUserId && c.user_id === currentUserId;
              const canDelete = currentRole === "admin" || canEdit;
              const isEditing = editingCommentId === c.id;

              return (
                <Paper
                  key={c.id}
                  variant="outlined"
                  sx={{ p: 1.5, borderRadius: 2, borderColor: "#EFEFEF" }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 800 }}>
                        {c.user?.name || "مستخدم"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {c.created_at
                          ? new Date(c.created_at).toLocaleString("ar-EG")
                          : ""}
                      </Typography>
                    </Box>
                    {(canEdit || canDelete) && (
                      <Stack direction="row" spacing={0.5}>
                        {canEdit && !isEditing && (
                          <Tooltip title="تعديل">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingCommentId(c.id);
                                setEditingCommentValue(c.comment || "");
                              }}
                            >
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canDelete && (
                          <Tooltip title="حذف">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteComment(c.id)}
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    )}
                  </Stack>
                  <Box sx={{ mt: 1 }}>
                    {isEditing ? (
                      <>
                        <TextField
                          fullWidth
                          multiline
                          minRows={2}
                          value={editingCommentValue}
                          onChange={(e) =>
                            setEditingCommentValue(e.target.value)
                          }
                        />
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                          sx={{ mt: 1 }}
                        >
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<SaveRoundedIcon />}
                            onClick={() => handleUpdateComment(c.id)}
                          >
                            حفظ
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CancelRoundedIcon />}
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditingCommentValue("");
                            }}
                          >
                            إلغاء
                          </Button>
                        </Stack>
                      </>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-wrap" }}
                      >
                        {c.comment}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
