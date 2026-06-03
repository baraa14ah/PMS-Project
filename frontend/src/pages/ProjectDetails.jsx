import React, { useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  useParams,
  Link as RouterLink,
  useLocation,
} from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

// MUI
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Chip,
  Divider,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  IconButton,
  Tooltip,
  Avatar,
} from "@mui/material";

// Icons
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import ExitToAppRoundedIcon from "@mui/icons-material/ExitToAppRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const githubStatus = params.get("github");

    if (githubStatus === "success") {
      // إشعار ناعم يظهر لعدة ثوانٍ ويختفي
      toast.success("تم ربط حسابك بـ GitHub بنجاح! 🐙", {
        duration: 5000,
        style: { fontWeight: "bold" },
      });
      // تنظيف الرابط
      window.history.replaceState(null, "", window.location.pathname);
    } else if (githubStatus === "error") {
      toast.error("فشل ربط حساب GitHub ❌");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [location.search]);

  const { token, user } = useAuth();

  const currentUserId = user?.user?.id;
  const currentRole = user?.role;

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    }),
    [token],
  );

  // -------------------- Base Data --------------------
  const [project, setProject] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [versions, setVersions] = useState([]);

  const [progress, setProgress] = useState({
    total: 0,
    completed: 0,
    percent: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // -------------------- project edit/delete --------------------
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [savingProject, setSavingProject] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [editGithub, setEditGithub] = useState("");

  // -------------------- Task Create / Edit / Delete --------------------
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    deadline: "",
  });
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskMsg, setTaskMsg] = useState({ type: "", text: "" });

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskData, setEditTaskData] = useState({
    title: "",
    description: "",
    deadline: "",
  });
  const [savingTask, setSavingTask] = useState(false);

  // -------------------- Comments --------------------
  const [newComment, setNewComment] = useState("");
  const [commentMsg, setCommentMsg] = useState({ type: "", text: "" });
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentValue, setEditingCommentValue] = useState("");

  // -------------------- Versions --------------------
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

  // -------------------- Supervisor & Student invite --------------------
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [invitingSupervisor, setInvitingSupervisor] = useState(false);
  const [inviteSupervisorMsg, setInviteSupervisorMsg] = useState("");

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [inviteStudentMsg, setInviteStudentMsg] = useState("");
  const [invitingStudent, setInvitingStudent] = useState(false);
  const [studentsLoadMsg, setStudentsLoadMsg] = useState("");

  // -------------------- Helpers --------------------
  const statusChip = (status) => {
    const s = (status || "pending").toLowerCase();
    if (s === "completed")
      return <Chip size="small" color="success" label="مكتمل" />;
    if (s === "in_progress")
      return <Chip size="small" color="info" label="قيد التنفيذ" />;
    if (s === "pending")
      return <Chip size="small" color="warning" label="قيد الانتظار" />;
    return <Chip size="small" variant="outlined" label={status || "—"} />;
  };

  const normalizeFileUrl = (v) => {
    if (!v) return v;
    if (v.file_url) return v;
    if (v.file_path) {
      const base = API_BASE_URL.replace("/api", "");
      return { ...v, file_url: `${base}/storage/${v.file_path}` };
    }
    return v;
  };

  const derivedProjectStatus = useMemo(() => {
    if (!progress?.total || Number(progress.total) === 0) {
      return (project?.status || "pending").toLowerCase();
    }
    if (Number(progress.percent) >= 100) return "completed";
    if (Number(progress.completed) > 0 || Number(progress.percent) > 0)
      return "in_progress";
    return "pending";
  }, [progress, project?.status]);

  const members = Array.isArray(project?.members) ? project.members : [];
  const owner = project?.user
    ? {
        id: project.user.id,
        name: project.user.name,
        email: project.user.email,
        isOwner: true,
      }
    : null;
  const membersWithoutOwner = members.filter((m) => {
    if (!owner) return true;
    const memberId = m.id || m.student_id || m.user_id;
    return memberId !== owner.id;
  });
  const displayMembers = owner
    ? [owner, ...membersWithoutOwner]
    : membersWithoutOwner;
  const membersCount = displayMembers.length;

  //-------------------- dialog------------------------
  // 1. دماغ النافذة: يخزن شكل النافذة وماذا ستفعل عند التأكيد
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    title: "",
    content: "",
    confirmText: "تأكيد",
    confirmColor: "primary",
    onConfirm: null,
  });

  // 2. حالة التحميل (لإظهار كلمة "جاري التنفيذ...")
  const [dialogLoading, setDialogLoading] = useState(false);

  // 3. دالة إغلاق النافذة
  const closeDialog = () =>
    setDialogConfig((prev) => ({ ...prev, isOpen: false }));

  // -------------------- Permissions --------------------
  const canInviteSupervisor =
    (currentRole === "student" &&
      project &&
      currentUserId === project.user_id) ||
    currentRole === "admin";
  const canManageProject =
    currentRole === "admin" ||
    (project && currentUserId === project.user_id) ||
    (project && currentUserId === project.supervisor_id);
  const canUploadVersion =
    currentRole === "admin" ||
    (project && currentUserId === project.user_id) ||
    (project && currentUserId === project.supervisor_id) ||
    currentRole === "student";
  const canLeaveSupervision =
    (currentRole === "supervisor" &&
      project &&
      currentUserId === project.supervisor_id) ||
    currentRole === "admin";
  const canEditProject =
    currentRole === "admin" ||
    (project && currentUserId === project.user_id) ||
    (project && currentUserId === project.supervisor_id);
  const canDeleteProject =
    currentRole === "admin" || (project && currentUserId === project.user_id);

  // -------------------- Fetch Lists --------------------
  const fetchSupervisors = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/supervisors`, {
        headers: authHeaders,
      });
      const data = await res.json().catch(() => null);
      if (res.ok) setSupervisors(data?.supervisors || []);
    } catch {}
  };

  const fetchStudentsForInvite = async (projectId) => {
    setStudentsLoadMsg("جاري تحميل قائمة الطلاب...");
    try {
      // المحاولة الأولى: جلب الطلاب المتاحين (المفلترين من الباك إند)
      const res1 = await fetch(
        `${API_BASE_URL}/project/${projectId}/students`,
        {
          headers: authHeaders,
        },
      );

      if (res1.ok) {
        const data1 = await res1.json();

        // 💡 التعديل هنا: نقبل البيانات طالما هي مصفوفة، حتى لو كانت فارغة
        if (Array.isArray(data1?.students)) {
          setStudents(data1.students);

          if (data1.students.length === 0) {
            setStudentsLoadMsg("جميع الطلاب مسجلين بالفعل في هذا المشروع ✅");
          } else {
            setStudentsLoadMsg(
              `تم تحميل ${data1.students.length} طالب يمكن دعوتهم ✅`,
            );
          }
          return; // نوقف التنفيذ هنا لكي لا ينتقل للمحاولة الثانية
        }
      }

      // المحاولة الثانية: لن يصل إلى هنا إلا إذا فشل المسار الأول تماماً
      const res2 = await fetch(`${API_BASE_URL}/students`, {
        headers: authHeaders,
      });

      if (res2.ok) {
        const data2 = await res2.json();
        setStudents(data2?.students || []);
        setStudentsLoadMsg(`تم تحميل ${data2?.students?.length || 0} طالب ✅`);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setStudentsLoadMsg("خطأ أثناء الاتصال بالسيرفر لجلب الطلاب");
    }
  };

  useEffect(() => {
    if (!token) return navigate("/login");
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError("");
        const [projectRes, tasksRes, progressRes, commentsRes, versionsRes] =
          await Promise.all([
            fetch(`${API_BASE_URL}/project/${id}`, { headers: authHeaders }),
            fetch(`${API_BASE_URL}/project/${id}/tasks`, {
              headers: authHeaders,
            }),
            fetch(`${API_BASE_URL}/project/${id}/progress`, {
              headers: authHeaders,
            }),
            fetch(`${API_BASE_URL}/project/${id}/comments`, {
              headers: authHeaders,
            }),
            fetch(`${API_BASE_URL}/project/${id}/versions`, {
              headers: authHeaders,
            }),
          ]);

        const projectJson = await projectRes.json().catch(() => null);
        if (!projectRes.ok)
          throw new Error(projectJson?.message || "تعذر جلب بيانات المشروع");

        const p = projectJson?.project || projectJson;
        setProject(p);
        setEditTitle(p?.title || "");
        setEditDesc(p?.description || "");
        setEditGithub(p?.github_repo_url || "");

        if (tasksRes.ok) {
          const t = await tasksRes.json().catch(() => null);
          setTasks(t?.tasks || []);
        }
        if (progressRes.ok) {
          const pr = await progressRes.json().catch(() => null);
          setProgress({
            total: pr?.total_tasks ?? 0,
            completed: pr?.completed_tasks ?? 0,
            percent: pr?.progress_percentage ?? 0,
          });
        }
        if (commentsRes.ok) {
          const c = await commentsRes.json().catch(() => null);
          setComments(c?.comments || []);
        }
        if (versionsRes.ok) {
          const v = await versionsRes.json().catch(() => null);
          setVersions((v?.versions || []).map(normalizeFileUrl));
        }

        fetchSupervisors();
        fetchStudentsForInvite(p?.id || id);
      } catch (e) {
        setError(e?.message || "حدث خطأ غير متوقع");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  const handleUpdateProject = async () => {
    if (!project?.id) return;
    if (!editTitle.trim() || !editDesc.trim())
      return toast.error("أدخل العنوان والوصف");
    try {
      setSavingProject(true);
      const res = await fetch(`${API_BASE_URL}/project/update/${project.id}`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDesc,
          github_repo_url: editGithub || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return toast.error(data?.message || "تعذر تعديل المشروع");
      const updated = data?.project || data;
      setProject(updated);
      setEditGithub(updated?.github_repo_url || "");
      setEditOpen(false);
      toast.success("تم تعديل المشروع بنجاح");
    } catch {
      toast.error("خطأ أثناء الاتصال بالسيرفر");
    } finally {
      setSavingProject(false);
    }
  };
  const handleDeleteProject = () => {
    if (!project?.id) return;
    setDialogConfig({
      isOpen: true,
      title: "حذف المشروع نهائياً؟",
      content:
        "تحذير: سيتم حذف كافة المهام والتعليقات والملفات. لا يمكنك الرجوع عن هذا القرار!",
      confirmText: "نعم، احذف كل شيء",
      confirmColor: "error", // تعادل اللون الأحمر في MUI

      onConfirm: async () => {
        try {
          setDialogLoading(true);

          const res = await fetch(
            `${API_BASE_URL}/project/delete/${project.id}`,
            {
              method: "DELETE",
              headers: authHeaders,
            },
          );

          if (!res.ok) {
            toast.error("تعذر حذف المشروع ❌");
            return; // نوقف التنفيذ إذا فشل
          }

          toast.success("تم حذف المشروع بنجاح 👋");
          closeDialog(); // نغلق النافذة أولاً
          navigate("/dashboard/projects"); // ثم ننقله لصفحة المشاريع
        } catch {
          toast.error("خطأ في الاتصال بالسيرفر 🌐");
        } finally {
          setDialogLoading(false); // إيقاف التحميل
        }
      },
    });
  };

  const handleSendSupervisorInvite = async () => {
    setInviteSupervisorMsg("");
    if (!selectedSupervisor)
      return setInviteSupervisorMsg("اختر مشرفاً أولاً.");
    try {
      setInvitingSupervisor(true);
      const res = await fetch(
        `${API_BASE_URL}/project/${project.id}/invite-supervisor`,
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
        `${API_BASE_URL}/project/${project.id}/invite-student`,
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

  const handleLeaveSupervision = () => {
    // التأكد من وجود المشروع أولاً
    if (!project?.id) return;

    // إرسال الأوامر للنافذة الشاملة
    setDialogConfig({
      isOpen: true,
      title: "إلغاء الإشراف؟",
      content: "هل أنت متأكد من رغبتك في التوقف عن الإشراف على هذا المشروع؟",
      confirmText: "نعم، إلغاء الإشراف",
      confirmColor: "warning", // اللون البرتقالي التحذيري في MUI

      onConfirm: async () => {
        try {
          setDialogLoading(true); // تشغيل تأثير التحميل

          const res = await fetch(
            `${API_BASE_URL}/project/${project.id}/leave-supervision`,
            {
              method: "POST",
              headers: authHeaders,
            },
          );

          if (!res.ok) {
            toast.error("تعذر تنفيذ العملية ❌");
            return;
          }

          toast.success("تم إلغاء الإشراف بنجاح 👋");

          // تحديث حالة المشروع في الواجهة
          setProject((prev) =>
            prev ? { ...prev, supervisor_id: null, supervisor: null } : prev,
          );

          closeDialog(); // إغلاق النافذة بعد الانتهاء
        } catch {
          toast.error("حدث خطأ في الاتصال 🌐");
        } finally {
          setDialogLoading(false); // إيقاف التحميل
        }
      },
    });
  };
  const updateProgressLocally = async (currentTasks) => {
    const total = currentTasks.length;
    const completed = currentTasks.filter(
      (t) => t.status === "completed",
    ).length;
    const percent = total ? Math.round((completed / total) * 100) : 0;

    setProgress({ total, completed, percent });

    if (project?.id) {
      try {
        await fetch(`${API_BASE_URL}/project/${project.id}/progress`, {
          headers: authHeaders,
        });
      } catch (e) {
        // نتجاهل الخطأ هنا لكي لا نزعج المستخدم
      }
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskMsg({ type: "", text: "" });
    if (!newTask.title.trim())
      return setTaskMsg({ type: "error", text: "عنوان المهمة مطلوب." });

    try {
      setCreatingTask(true);
      const res = await fetch(`${API_BASE_URL}/task/create`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: project.id,
          title: newTask.title,
          description: newTask.description || null,
          deadline: newTask.deadline || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok)
        return setTaskMsg({
          type: "error",
          text: data?.message || "تعذر إنشاء المهمة",
        });

      const newTaskList = [data?.task, ...tasks].filter(Boolean);
      setTasks(newTaskList);
      updateProgressLocally(newTaskList);

      setNewTask({ title: "", description: "", deadline: "" });
      setTaskMsg({ type: "success", text: "تم إضافة المهمة بنجاح" });
    } catch {
      setTaskMsg({ type: "error", text: "حدث خطأ أثناء الاتصال بالسيرفر." });
    } finally {
      setCreatingTask(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/task/update/${taskId}`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) return toast.error("تعذر تحديث حالة المهمة");
      const updated = tasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t,
      );
      setTasks(updated);
      updateProgressLocally(updated);
    } catch {
      toast.error("حدث خطأ أثناء تحديث الحالة");
    }
  };

  const handleEditTaskClick = (task) => {
    setEditingTaskId(task.id);
    setEditTaskData({
      title: task.title || "",
      description: task.description || "",
      deadline: task.deadline || "",
    });
  };

  const handleSaveEditTask = async (taskId) => {
    if (!editTaskData.title.trim()) return toast.error("العنوان مطلوب");
    try {
      setSavingTask(true);
      const res = await fetch(`${API_BASE_URL}/task/update/${taskId}`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTaskData.title,
          description: editTaskData.description || null,
          deadline: editTaskData.deadline || null,
        }),
      });

      if (!res.ok) return toast.error("تعذر تعديل المهمة");

      const updated = tasks.map((t) =>
        t.id === taskId ? { ...t, ...editTaskData } : t,
      );
      setTasks(updated);
      setEditingTaskId(null);
    } catch {
      toast.error("حدث خطأ في الاتصال بالسيرفر");
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = (taskId) => {
    setDialogConfig({
      isOpen: true,
      title: "هل أنت متأكد؟",
      content: "هل تريد فعلاً حذف هذه المهمة؟ لا يمكن التراجع.",
      confirmText: "نعم، احذفها!",
      confirmColor: "error", // أحمر للحذف

      onConfirm: async () => {
        try {
          setDialogLoading(true); // تشغيل تأثير التحميل في الزر

          const res = await fetch(`${API_BASE_URL}/task/delete/${taskId}`, {
            method: "DELETE",
            headers: authHeaders,
          });

          const data = await res.json().catch(() => null);

          if (!res.ok) {
            toast.error(data?.message || "تعذر حذف المهمة");
            return; // نوقف التنفيذ إذا حدث خطأ
          }

          // 🎯 إذا نجح الحذف في السيرفر، نحدث الواجهة (State)
          const updated = tasks.filter((t) => t.id !== taskId);
          setTasks(updated);
          updateProgressLocally(updated);

          toast.success("تم حذف المهمة بنجاح 🗑️");
          closeDialog(); // إغلاق النافذة بعد النجاح
        } catch (e) {
          toast.error("حدث خطأ أثناء الاتصال بالسيرفر");
        } finally {
          setDialogLoading(false); // إيقاف التحميل
        }
      },
    });
  };
  const handleAddComment = async (e) => {
    e.preventDefault();

    // 1. إشعار خطأ إذا كان التعليق فارغاً
    if (!newComment.trim()) {
      return toast.error("لا يمكن إرسال تعليق فارغ ⚠️");
    }

    try {
      const res = await fetch(`${API_BASE_URL}/project/${id}/comment`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ comment: newComment }),
      });
      const data = await res.json().catch(() => null);

      // 2. إشعار خطأ إذا رفض السيرفر
      if (!res.ok) {
        return toast.error(data?.message || "تعذر إرسال التعليق ❌");
      }

      setComments((prev) => [data?.comment, ...prev].filter(Boolean));
      setNewComment("");

      // 3. إشعار النجاح الفخم!
      toast.success("تمت إضافة التعليق بنجاح 💬");
    } catch {
      toast.error("حدث خطأ أثناء الاتصال بالسيرفر 🌐");
    }
  };
  const handleUpdateComment = async (commentId) => {
    if (!editingCommentValue.trim()) {
      return toast.error("لا يمكن حفظ تعليق فارغ");
    }

    try {
      const res = await fetch(`${API_BASE_URL}/comment/${commentId}`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ comment: editingCommentValue }),
      });

      if (!res.ok) {
        return toast.error("تعذر تعديل التعليق");
      }
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, comment: editingCommentValue } : c,
        ),
      );

      toast.success("تم تعديل التعليق بنجاح ✏️");

      // إغلاق وضع التعديل وتفريغ الحقل
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
      confirmColor: "error", // أحمر

      onConfirm: async () => {
        try {
          setDialogLoading(true); // تشغيل التحميل في زر النافذة

          const res = await fetch(`${API_BASE_URL}/comment/${commentId}`, {
            method: "DELETE",
            headers: authHeaders,
          });

          if (!res.ok) {
            toast.error("تعذر حذف التعليق ❌");
            return; // إيقاف التنفيذ
          }

          // تحديث الواجهة فوراً
          setComments((prev) => prev.filter((c) => c.id !== commentId));
          toast.success("تم حذف التعليق بنجاح");

          closeDialog(); // إغلاق النافذة بعد النجاح
        } catch {
          toast.error("خطأ في الاتصال 🌐");
        } finally {
          setDialogLoading(false); // إيقاف التحميل
        }
      },
    });
  };

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

      const res = await fetch(`${API_BASE_URL}/project/${id}/versions/upload`, {
        method: "POST",
        headers: authHeaders,
        body: fd,
      });
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
    // إرسال الأوامر للنافذة الشاملة
    setDialogConfig({
      isOpen: true,
      title: "حذف هذا الإصدار؟",
      content: "سيتم حذف الملف المرفوع نهائياً.",
      confirmText: "نعم، احذف",
      confirmColor: "error", // أحمر

      onConfirm: async () => {
        try {
          setDialogLoading(true); // تشغيل التحميل

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

          // تحديث الواجهة فوراً
          setVersions((prev) => prev.filter((v) => v.id !== versionId));
          toast.success("تم حذف الإصدار بنجاح 🗑️");

          closeDialog(); // إغلاق النافذة
        } catch {
          toast.error("خطأ في الاتصال 🌐");
        } finally {
          setDialogLoading(false); // إيقاف التحميل
        }
      },
    });
  };
  const handlePushToGithub = (versionId) => {
    // الفحص الاستباقي قبل فتح النافذة
    if (!project?.github_repo_url) {
      return toast.error("يرجى إضافة رابط مستودع GitHub للمشروع أولاً.");
    }

    // إرسال الأوامر للنافذة
    setDialogConfig({
      isOpen: true,
      title: "رفع إلى GitHub؟",
      content: "سيتم دفع هذا الملف كإصدار جديد إلى مستودعك على GitHub.",
      confirmText: "نعم، ارفع الآن",
      confirmColor: "primary", // اللون الأزرق القياسي

      onConfirm: async () => {
        try {
          setDialogLoading(true); // تشغيل التحميل

          // الكود الخاص بالدفع لجيتهاب (اكتمل بناءً على مساراتك السابقة)
          const res = await fetch(
            `${API_BASE_URL}/project/versions/${versionId}/push`,
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

          closeDialog(); // إغلاق النافذة
        } catch {
          toast.error("خطأ في الاتصال بالسيرفر 🌐");
        } finally {
          setDialogLoading(false); // إيقاف التحميل
        }
      },
    });
  };
  if (loading) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">
            جارِ تحميل بيانات المشروع...
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
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          startIcon={<ArrowBackRoundedIcon />}
        >
          رجوع
        </Button>
      </Box>
    );
  }

  if (!project)
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">المشروع غير موجود.</Alert>
      </Box>
    );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, width: "100%" }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{ p: 2.5, borderRadius: 3, border: "1px solid #EAEAEA" }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {project.title}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mt: 1, flexWrap: "wrap" }}
            >
              {statusChip(derivedProjectStatus)}
              {project.supervisor?.name && (
                <Chip
                  size="small"
                  icon={<SchoolRoundedIcon />}
                  label={`المشرف: ${project.supervisor.name}`}
                  variant="outlined"
                />
              )}
              <Chip
                size="small"
                variant="outlined"
                label={`الأعضاء: ${membersCount}`}
              />
            </Stack>
          </Box>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="flex-end"
          >
            <Button
              component={RouterLink}
              to="/dashboard/projects"
              variant="outlined"
              startIcon={<ArrowBackRoundedIcon />}
            >
              رجوع
            </Button>
            {canLeaveSupervision && project.supervisor_id && (
              <Button
                color="error"
                variant="contained"
                startIcon={<ExitToAppRoundedIcon />}
                onClick={handleLeaveSupervision}
              >
                إلغاء الإشراف
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Info + Progress */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2 }}>
        <Paper
          elevation={0}
          sx={{ p: 2.5, flex: 1, borderRadius: 3, border: "1px solid #EAEAEA" }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
            معلومات المشروع
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {project.description || "لا يوجد وصف للمشروع."}
          </Typography>
          <Divider sx={{ my: 1.5 }} />
          <Stack spacing={1}>
            <Typography variant="body2">
              <b>صاحب المشروع:</b> {project.user?.name || "—"} (
              {project.user?.email || "—"})
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2">
                <b>GitHub:</b>
              </Typography>
              {project.github_repo_url ? (
                <>
                  <Chip
                    component="a"
                    href={project.github_repo_url}
                    target="_blank"
                    clickable
                    label="زيارة المستودع"
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor: "#24292e",
                      color: "white",
                      "&:hover": { bgcolor: "#000" },
                    }}
                  />
                  <Chip
                    label="مربوط بالنظام 🟢"
                    size="small"
                    sx={{
                      fontWeight: 800,
                      bgcolor: "#DCFCE7",
                      color: "#166534",
                      border: "1px solid #BBF7D0",
                    }}
                  />
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  —
                </Typography>
              )}
            </Stack>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2" sx={{ fontWeight: 900, mb: 1 }}>
              أعضاء المشروع
            </Typography>
            {membersCount === 0 ? (
              <Typography variant="body2" color="text.secondary">
                لا يوجد أعضاء بعد.
              </Typography>
            ) : (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {displayMembers.map((m) => {
                  const mid = m.id ?? m.user_id;
                  const isOwner = owner && mid === owner.id;
                  return (
                    <Chip
                      key={mid}
                      size="small"
                      variant={isOwner ? "filled" : "outlined"}
                      icon={
                        isOwner ? (
                          <span style={{ fontSize: 14 }}>👑</span>
                        ) : undefined
                      }
                      label={`${m.name}${m.email ? ` (${m.email})` : ""}${isOwner ? " - مالك المشروع" : ""}`}
                      sx={{ fontWeight: isOwner ? 900 : 700 }}
                    />
                  );
                })}
              </Stack>
            )}
            {canEditProject && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  mt: 2,
                  borderRadius: 3,
                  border: "1px solid #EAEAEA",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                    إعدادات المشروع
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      onClick={() => setEditOpen((v) => !v)}
                      sx={{ borderRadius: 2, fontWeight: 900 }}
                    >
                      {editOpen ? "إغلاق" : "تعديل"}
                    </Button>
                    {canDeleteProject && (
                      <Button
                        color="error"
                        variant="contained"
                        onClick={handleDeleteProject}
                        disabled={deletingProject}
                        sx={{ borderRadius: 2, fontWeight: 900 }}
                      >
                        {deletingProject ? "..." : "حذف المشروع"}
                      </Button>
                    )}
                  </Stack>
                </Stack>
                {editOpen && (
                  <Box sx={{ mt: 2 }}>
                    <Stack spacing={2}>
                      <TextField
                        label="اسم المشروع"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                      <TextField
                        label="وصف المشروع"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        multiline
                        minRows={3}
                      />
                      <TextField
                        label="رابط GitHub"
                        value={editGithub}
                        onChange={(e) => setEditGithub(e.target.value)}
                        placeholder="https://github.com/username/repository"
                      />
                      <Button
                        variant="contained"
                        onClick={handleUpdateProject}
                        disabled={savingProject}
                        sx={{ borderRadius: 2, fontWeight: 900, width: 220 }}
                      >
                        {savingProject ? "جاري الحفظ..." : "حفظ التعديلات"}
                      </Button>
                    </Stack>
                  </Box>
                )}
              </Paper>
            )}
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            width: { xs: "100%", md: 360 },
            borderRadius: 3,
            border: "1px solid #EAEAEA",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
            نسبة التقدّم
          </Typography>
          {progress.total === 0 ? (
            <Typography variant="body2" color="text.secondary">
              لا توجد مهام بعد لحساب نسبة التقدم.
            </Typography>
          ) : (
            <>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  {progress.percent}% مكتمل
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {progress.completed}/{progress.total}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progress.percent}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </>
          )}
        </Paper>
      </Stack>

      {(canInviteSupervisor || canManageProject) && (
        <Paper
          elevation={0}
          sx={{ p: 2.5, mt: 2, borderRadius: 3, border: "1px solid #EAEAEA" }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
            الدعوات
          </Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            {/* Invite Supervisor */}
            {canInviteSupervisor && (
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                  دعوة مشرف للمشروع
                </Typography>
                {project.supervisor_id ? (
                  <Alert severity="info">
                    تم تعيين مشرف لهذا المشروع مسبقًا.
                  </Alert>
                ) : (
                  <>
                    {inviteSupervisorMsg && (
                      <Alert sx={{ mb: 1 }} severity="info">
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

            {/* Invite Students */}
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
                    onClick={() => fetchStudentsForInvite(project.id)}
                  >
                    تحديث القائمة
                  </Button>
                </Stack>
                {inviteStudentMsg && (
                  <Alert sx={{ mb: 1 }} severity="info">
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
                {students.length === 0 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 1 }}
                  >
                    لا توجد أسماء طلاب في القائمة.
                  </Typography>
                )}
              </Box>
            )}
          </Stack>
        </Paper>
      )}

      {/* Tasks */}
      <Paper
        elevation={0}
        sx={{ p: 2.5, mt: 2, borderRadius: 3, border: "1px solid #EAEAEA" }}
      >
        <Typography
          id="tasks"
          variant="subtitle1"
          sx={{ fontWeight: 800, mb: 2 }}
        >
          المهام
        </Typography>

        <Box component="form" onSubmit={handleCreateTask} sx={{ mb: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <TextField
              fullWidth
              size="small"
              label="عنوان المهمة"
              value={newTask.title}
              onChange={(e) =>
                setNewTask((p) => ({ ...p, title: e.target.value }))
              }
            />
            <TextField
              fullWidth
              size="small"
              label="وصف (اختياري)"
              value={newTask.description}
              onChange={(e) =>
                setNewTask((p) => ({ ...p, description: e.target.value }))
              }
            />
            <TextField
              size="small"
              type="date"
              label="الموعد النهائي"
              InputLabelProps={{ shrink: true }}
              value={newTask.deadline}
              onChange={(e) =>
                setNewTask((p) => ({ ...p, deadline: e.target.value }))
              }
              sx={{ minWidth: 200 }}
            />
            <Button type="submit" variant="contained" disabled={creatingTask}>
              {creatingTask ? "..." : "إضافة"}
            </Button>
          </Stack>
          {taskMsg.text && (
            <Alert
              severity={taskMsg.type === "error" ? "error" : "success"}
              sx={{ mt: 1 }}
            >
              {taskMsg.text}
            </Alert>
          )}
        </Box>

        {tasks.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            لا توجد مهام حالياً.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900 }}>العنوان</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>الوصف</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 140 }}>
                    الموعد النهائي
                  </TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 180 }}>
                    الحالة
                  </TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 100 }}>
                    إجراءات
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((t) => {
                  const isEditing = editingTaskId === t.id;

                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={editTaskData.title}
                            onChange={(e) =>
                              setEditTaskData({
                                ...editTaskData,
                                title: e.target.value,
                              })
                            }
                            fullWidth
                          />
                        ) : (
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                              {t.title}
                            </Typography>
                            {/* الأيقونة والاسم */}
                            <Stack
                              direction="row"
                              spacing={0.5}
                              alignItems="center"
                              sx={{ mt: 0.5 }}
                            >
                              <Avatar
                                sx={{
                                  width: 18,
                                  height: 18,
                                  fontSize: 10,
                                  bgcolor: "primary.main",
                                }}
                              >
                                {/* قراءة أول حرف من اسم المسؤول */}
                                {String(t.assigned_to?.name || "U")
                                  .charAt(0)
                                  .toUpperCase()}
                              </Avatar>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontWeight: 600 }}
                              >
                                المسؤول: {t.assigned_to?.name || "غير محدد"}
                              </Typography>
                            </Stack>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={editTaskData.description}
                            onChange={(e) =>
                              setEditTaskData({
                                ...editTaskData,
                                description: e.target.value,
                              })
                            }
                            fullWidth
                          />
                        ) : (
                          t.description || "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            type="date"
                            value={editTaskData.deadline}
                            onChange={(e) =>
                              setEditTaskData({
                                ...editTaskData,
                                deadline: e.target.value,
                              })
                            }
                            fullWidth
                          />
                        ) : t.deadline ? (
                          new Date(t.deadline).toLocaleDateString("ar-EG")
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          value={t.status || "pending"}
                          onChange={(e) =>
                            handleStatusChange(t.id, e.target.value)
                          }
                          fullWidth
                          disabled={isEditing}
                        >
                          <MenuItem value="pending">قيد الانتظار</MenuItem>
                          <MenuItem value="in_progress">قيد التنفيذ</MenuItem>
                          <MenuItem value="completed">مكتملة</MenuItem>
                        </TextField>
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="حفظ">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleSaveEditTask(t.id)}
                                disabled={savingTask}
                              >
                                <SaveRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="إلغاء">
                              <IconButton
                                size="small"
                                onClick={() => setEditingTaskId(null)}
                              >
                                <CancelRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ) : (
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="تعديل">
                              <IconButton
                                size="small"
                                onClick={() => handleEditTaskClick(t)}
                              >
                                <EditRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="حذف">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteTask(t.id)}
                              >
                                <DeleteOutlineRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Comments + Versions side-by-side */}
      <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ mt: 2 }}>
        {/* Comments */}
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
          <Typography
            id="comments"
            variant="subtitle1"
            sx={{ fontWeight: 800, mb: 2 }}
          >
            التعليقات
          </Typography>
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
            {commentMsg.text && (
              <Alert
                severity={commentMsg.type === "error" ? "error" : "success"}
                sx={{ mt: 1 }}
              >
                {commentMsg.text}
              </Alert>
            )}
          </Box>
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
        </Paper>

        {/* Versions */}
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
                    onChange={(e) =>
                      setVersionFile(e.target.files?.[0] || null)
                    }
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
          {editingVersionId && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
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
          {versions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              لا توجد إصدارات بعد.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {versions.map((v) => {
                // تأكد من جلب user_id في الباك إند
                const ownerId = String(v?.user_id || "");
                const safeCurrentUserId = String(currentUserId || "");

                // 2. المقارنة (تظهر الأزرار فقط إذا تطابق الـ ID وكان المستخدم مسجل دخول)
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
                            download // 👈 هذه الإضافة الصغيرة مهمة
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
        </Paper>
      </Stack>
      <ConfirmDialog
        open={dialogConfig.isOpen}
        title={dialogConfig.title}
        content={dialogConfig.content}
        confirmText={dialogConfig.confirmText}
        confirmColor={dialogConfig.confirmColor}
        loading={dialogLoading}
        onClose={closeDialog}
        onConfirm={dialogConfig.onConfirm}
      />
    </Box>
  );
}
