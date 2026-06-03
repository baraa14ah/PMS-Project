import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  MenuItem,
  Button,
  Alert,
} from "@mui/material";

// Icons
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function InvitationsSection({
  projectId,
  project,
  authHeaders,
  canInviteSupervisor,
  canManageProject,
}) {
  // ---------------- الحالات (States) ----------------
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [invitingSupervisor, setInvitingSupervisor] = useState(false);
  const [inviteSupervisorMsg, setInviteSupervisorMsg] = useState("");

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [inviteStudentMsg, setInviteStudentMsg] = useState("");
  const [invitingStudent, setInvitingStudent] = useState(false);
  const [studentsLoadMsg, setStudentsLoadMsg] = useState("");

  // ---------------- دوال جلب البيانات (Fetch) ----------------
  const fetchSupervisors = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/supervisors`, {
        headers: authHeaders,
      });
      const data = await res.json().catch(() => null);
      if (res.ok) setSupervisors(data?.supervisors || []);
    } catch {}
  };

  const fetchStudentsForInvite = async () => {
    setStudentsLoadMsg("جاري تحميل قائمة الطلاب...");
    try {
      const res1 = await fetch(
        `${API_BASE_URL}/project/${projectId}/students`,
        { headers: authHeaders },
      );

      if (res1.ok) {
        const data1 = await res1.json();
        if (Array.isArray(data1?.students)) {
          setStudents(data1.students);
          if (data1.students.length === 0) {
            setStudentsLoadMsg("جميع الطلاب مسجلين بالفعل في هذا المشروع ✅");
          } else {
            setStudentsLoadMsg(
              `تم تحميل ${data1.students.length} طالب يمكن دعوتهم ✅`,
            );
          }
          return;
        }
      }

      const res2 = await fetch(`${API_BASE_URL}/students`, {
        headers: authHeaders,
      });
      if (res2.ok) {
        const data2 = await res2.json();
        setStudents(data2?.students || []);
        setStudentsLoadMsg(`تم تحميل ${data2?.students?.length || 0} طالب ✅`);
      }
    } catch (error) {
      setStudentsLoadMsg("خطأ أثناء الاتصال بالسيرفر لجلب الطلاب");
    }
  };

  // جلب القوائم تلقائياً عند فتح القسم
  useEffect(() => {
    if (canInviteSupervisor) fetchSupervisors();
    if (canManageProject) fetchStudentsForInvite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, canInviteSupervisor, canManageProject]);

  // ---------------- دوال الإرسال ----------------
  const handleSendSupervisorInvite = async () => {
    setInviteSupervisorMsg("");
    if (!selectedSupervisor)
      return setInviteSupervisorMsg("اختر مشرفاً أولاً.");
    try {
      setInvitingSupervisor(true);
      const res = await fetch(
        `${API_BASE_URL}/project/${projectId}/invite-supervisor`,
        {
          method: "POST",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ supervisor_id: Number(selectedSupervisor) }),
        },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok)
        return setInviteSupervisorMsg(data?.message || "فشل إرسال الدعوة");

      setInviteSupervisorMsg("تم إرسال دعوة المشرف بنجاح");
      setSelectedSupervisor("");
    } catch {
      setInviteSupervisorMsg("خطأ أثناء إرسال الدعوة");
    } finally {
      setInvitingSupervisor(false);
    }
  };

  const handleInviteStudent = async () => {
    setInviteStudentMsg("");
    if (!selectedStudent) return setInviteStudentMsg("اختر طالباً أولاً.");
    try {
      setInvitingStudent(true);
      const res = await fetch(
        `${API_BASE_URL}/project/${projectId}/invite-student`,
        {
          method: "POST",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ student_id: Number(selectedStudent) }),
        },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok)
        return setInviteStudentMsg(data?.message || "فشل إرسال الدعوة");

      setInviteStudentMsg("تم إرسال الدعوة للطالب");
      setStudents((prev) =>
        prev.filter((s) => s.id !== Number(selectedStudent)),
      );
      setSelectedStudent("");
    } catch {
      setInviteStudentMsg("خطأ أثناء إرسال الدعوة");
    } finally {
      setInvitingStudent(false);
    }
  };

  // ---------------- الواجهة ----------------
  if (!canInviteSupervisor && !canManageProject) return null;

  return (
    <Paper
      elevation={0}
      sx={{ p: 2.5, mt: 2, borderRadius: 3, border: "1px solid #EAEAEA" }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
        الدعوات
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        {/* قسم المشرفين */}
        {canInviteSupervisor && (
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
              دعوة مشرف للمشروع
            </Typography>
            {project?.supervisor_id ? (
              <Alert severity="info">تم تعيين مشرف لهذا المشروع مسبقًا.</Alert>
            ) : (
              <>
                {inviteSupervisorMsg && (
                  <Alert
                    sx={{ mb: 1 }}
                    severity={
                      inviteSupervisorMsg.includes("نجاح") ? "success" : "info"
                    }
                  >
                    {inviteSupervisorMsg}
                  </Alert>
                )}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="اختر مشرف"
                    value={selectedSupervisor}
                    onChange={(e) => setSelectedSupervisor(e.target.value)}
                  >
                    <MenuItem value="">—</MenuItem>
                    {supervisors.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name} ({s.email})
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button
                    variant="contained"
                    startIcon={<PersonAddAltRoundedIcon />}
                    onClick={handleSendSupervisorInvite}
                    disabled={invitingSupervisor}
                    sx={{ minWidth: 120 }}
                  >
                    {invitingSupervisor ? "..." : "إرسال"}
                  </Button>
                </Stack>
              </>
            )}
          </Box>
        )}

        {/* قسم الطلاب */}
        {canManageProject && (
          <Box sx={{ flex: 1 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                دعوة طالب للانضمام
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={fetchStudentsForInvite}
              >
                تحديث القائمة
              </Button>
            </Stack>

            {inviteStudentMsg && (
              <Alert
                sx={{ mb: 1 }}
                severity={
                  inviteStudentMsg.includes("إرسال") ? "success" : "info"
                }
              >
                {inviteStudentMsg}
              </Alert>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField
                select
                fullWidth
                size="small"
                label="اختر طالب"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
              >
                <MenuItem value="">—</MenuItem>
                {students.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} ({s.email})
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                color="success"
                startIcon={<PersonAddAltRoundedIcon />}
                onClick={handleInviteStudent}
                disabled={invitingStudent}
                sx={{ minWidth: 120 }}
              >
                {invitingStudent ? "..." : "دعوة"}
              </Button>
            </Stack>

            {studentsLoadMsg && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1 }}
              >
                {studentsLoadMsg}
              </Typography>
            )}
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
