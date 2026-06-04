import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";

export default function Universities() {
  const { authHeaders, apiFetch, API_BASE_URL } = useAuth();

  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUni, setEditingUni] = useState(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchUniversities = async () => {
    try {
      setLoading(true);
      setError("");
      const { res, data } = await apiFetch(`${API_BASE_URL}/admin/universities`, {
        headers: authHeaders(),
      });
      if (res.ok && Array.isArray(data?.universities)) {
        setUniversities(data.universities);
      } else {
        setError(data?.message || "تعذر تحميل الجامعات");
      }
    } catch {
      setError("خطأ في الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddDialog = () => {
    setEditingUni(null);
    setFormName("");
    setFormSlug("");
    setFormActive(true);
    setDialogOpen(true);
  };

  const openEditDialog = (uni) => {
    setEditingUni(uni);
    setFormName(uni.name || "");
    setFormSlug(uni.slug || "");
    setFormActive(uni.is_active !== false);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUni(null);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error("اسم الجامعة مطلوب");
      return;
    }

    setSaving(true);
    try {
      const isEdit = !!editingUni;
      const url = isEdit
        ? `${API_BASE_URL}/admin/universities/${editingUni.id}`
        : `${API_BASE_URL}/admin/universities`;
      const method = isEdit ? "PUT" : "POST";

      const body = { name: formName.trim() };
      if (formSlug.trim()) body.slug = formSlug.trim();
      if (isEdit) body.is_active = formActive;

      const { res, data } = await apiFetch(url, {
        method,
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const msg = data?.errors
          ? Object.values(data.errors).flat().join(" | ")
          : data?.message || "حدث خطأ";
        toast.error(msg);
        setSaving(false);
        return;
      }

      toast.success(
        isEdit ? "تم تحديث الجامعة بنجاح" : "تم إنشاء الجامعة بنجاح",
      );
      handleCloseDialog();
      fetchUniversities();
    } catch {
      toast.error("خطأ في الاتصال بالسيرفر");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: "1px solid #EAEAEA",
          mb: 3,
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <SchoolRoundedIcon color="primary" fontSize="large" />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>
                إدارة الجامعات
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                إنشاء وتعديل الجامعات المسجلة في النظام
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={openAddDialog}
            sx={{ borderRadius: 2, fontWeight: 800, px: 3 }}
          >
            إضافة جامعة
          </Button>
        </Stack>
      </Paper>

      {loading ? (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 3 }}>
          <CircularProgress size={24} />
          <Typography sx={{ fontWeight: 700 }} color="text.secondary">
            جارِ تحميل الجامعات...
          </Typography>
        </Stack>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      ) : (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #EAEAEA",
            overflow: "hidden",
          }}
        >
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>اسم الجامعة</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Slug</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>الحالة</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>تاريخ الإنشاء</TableCell>
                  <TableCell sx={{ fontWeight: 800, textAlign: "left" }}>
                    إجراءات
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {universities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        لا توجد جامعات مسجلة بعد.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  universities.map((uni, idx) => (
                    <TableRow key={uni.id} hover>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{uni.name}</TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>
                        {uni.slug || "—"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={uni.is_active ? "نشطة" : "غير نشطة"}
                          color={uni.is_active ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>
                        {uni.created_at
                          ? new Date(uni.created_at).toLocaleDateString("ar-EG")
                          : "—"}
                      </TableCell>
                      <TableCell sx={{ textAlign: "left" }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditRoundedIcon />}
                          onClick={() => openEditDialog(uni)}
                          sx={{ borderRadius: 1.5, fontWeight: 700 }}
                        >
                          تعديل
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingUni ? "تعديل الجامعة" : "إضافة جامعة جديدة"}
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <TextField
            label="اسم الجامعة"
            fullWidth
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
          <TextField
            label="Slug (اختياري)"
            fullWidth
            value={formSlug}
            onChange={(e) => setFormSlug(e.target.value)}
            sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
          {editingUni && (
            <FormControlLabel
              control={
                <Switch
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                />
              }
              label="الجامعة نشطة"
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{ fontWeight: 700 }}
            disabled={saving}
          >
            إلغاء
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !formName.trim()}
            sx={{ borderRadius: 2, fontWeight: 800, px: 3 }}
          >
            {saving ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : editingUni ? (
              "تحديث"
            ) : (
              "إنشاء"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
