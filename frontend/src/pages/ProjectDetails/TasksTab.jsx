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
  Avatar,
  useTheme, // 🎯 أضفنا استدعاء الثيم لمعرفة الوضع الحالي
} from "@mui/material";
import toast from "react-hot-toast";

// Icons
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function TasksTab({
  projectId,
  tasks,
  setTasks,
  authHeaders,
  updateProgressLocally,
  setDialogConfig,
  setDialogLoading,
  closeDialog,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark"; // 🎯 متغير سحري يخبرنا إذا كنا في الوضع الليلي

  const today = new Date().toISOString().split("T")[0];
  const maxYear = new Date().getFullYear() + 5;
  const maxDate = `${maxYear}-12-31`;

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

  const validateDeadline = (dateStr) => {
    if (!dateStr) return true;
    if (dateStr < today) return "لا يمكن اختيار تاريخ في الماضي.";
    if (dateStr > maxDate) return "تاريخ بعيد جداً! اختر تاريخاً منطقياً.";
    return true;
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskMsg({ type: "", text: "" });
    if (!newTask.title.trim())
      return setTaskMsg({ type: "error", text: "عنوان المهمة مطلوب." });

    const dateCheck = validateDeadline(newTask.deadline);
    if (dateCheck !== true)
      return setTaskMsg({ type: "error", text: dateCheck });

    try {
      setCreatingTask(true);
      const res = await fetch(`${API_BASE_URL}/task/create`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
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
      toast.success("تم إضافة المهمة بنجاح ✅");
    } catch {
      setTaskMsg({ type: "error", text: "حدث خطأ أثناء الاتصال بالسيرفر." });
    } finally {
      setCreatingTask(false);
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

    const dateCheck = validateDeadline(editTaskData.deadline);
    if (dateCheck !== true) return toast.error(dateCheck);

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
      toast.success("تم التعديل بنجاح ✏️");
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
      confirmColor: "error",
      onConfirm: async () => {
        try {
          setDialogLoading(true);
          const res = await fetch(`${API_BASE_URL}/task/delete/${taskId}`, {
            method: "DELETE",
            headers: authHeaders,
          });

          if (!res.ok) {
            toast.error("تعذر حذف المهمة");
            return;
          }

          const updated = tasks.filter((t) => t.id !== taskId);
          setTasks(updated);
          updateProgressLocally(updated);

          toast.success("تم حذف المهمة بنجاح 🗑️");
          closeDialog();
        } catch {
          toast.error("حدث خطأ أثناء الاتصال بالسيرفر");
        } finally {
          setDialogLoading(false);
        }
      },
    });
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData("taskId"));
    const task = tasks.find((t) => t.id === taskId);

    if (!task || task.status === newStatus) return;

    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus } : t,
    );
    setTasks(updated);
    updateProgressLocally(updated);

    try {
      const res = await fetch(`${API_BASE_URL}/task/update/${taskId}`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("حدث خطأ أثناء تحديث الحالة");
    }
  };

  const renderTaskColumn = (statusValue, title, colorCode) => {
    const columnTasks = tasks.filter(
      (t) => (t.status || "pending") === statusValue,
    );

    return (
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Paper
          elevation={0}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, statusValue)}
          sx={{
            p: 2,
            bgcolor: isDark ? "background.default" : "#fdfdfd", // 🎯 يتأقلم مع الظلام
            borderRadius: "30px",
            minHeight: "450px",
            height: "100%",
            border: "1px solid",
            borderColor: "divider",
            borderTop: `6px solid ${colorCode}`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 3, px: 1 }}
          >
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: "1.05rem",
                color: "text.primary",
              }}
            >
              {title}
            </Typography>
            <Avatar
              sx={{
                width: 28,
                height: 28,
                fontSize: 13,
                bgcolor: colorCode,
                fontWeight: 800,
              }}
            >
              {columnTasks.length}
            </Avatar>
          </Stack>

          <Stack spacing={2} sx={{ flex: 1 }}>
            {columnTasks.map((t) => {
              const isEditing = editingTaskId === t.id;
              const isOverdue = t.deadline && t.deadline < today;

              return (
                <Paper
                  key={t.id}
                  elevation={0}
                  draggable={!isEditing}
                  onDragStart={(e) => handleDragStart(e, t.id)}
                  sx={{
                    p: 2,
                    borderRadius: "20px",
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper", // 🎯 الكارت يأخذ لون الورقة حسب الثيم
                    cursor: isEditing ? "default" : "grab",
                    "&:active": { cursor: isEditing ? "default" : "grabbing" },
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: isEditing ? "none" : "translateY(-2px)",
                      boxShadow: isEditing
                        ? "none"
                        : isDark
                          ? "0px 4px 12px rgba(0,0,0,0.3)"
                          : "0px 4px 12px rgba(0,0,0,0.03)",
                    },
                  }}
                >
                  {isEditing ? (
                    <Stack spacing={1.5}>
                      <TextField
                        size="small"
                        label="العنوان"
                        value={editTaskData.title}
                        onChange={(e) =>
                          setEditTaskData({
                            ...editTaskData,
                            title: e.target.value,
                          })
                        }
                      />
                      <TextField
                        size="small"
                        label="الوصف"
                        value={editTaskData.description}
                        onChange={(e) =>
                          setEditTaskData({
                            ...editTaskData,
                            description: e.target.value,
                          })
                        }
                        multiline
                        minRows={2}
                      />
                      <TextField
                        size="small"
                        type="date"
                        label="الموعد النهائي"
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ min: today, max: maxDate }}
                        value={editTaskData.deadline}
                        onChange={(e) =>
                          setEditTaskData({
                            ...editTaskData,
                            deadline: e.target.value,
                          })
                        }
                      />
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          color="inherit"
                          onClick={() => setEditingTaskId(null)}
                        >
                          إلغاء
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleSaveEditTask(t.id)}
                        >
                          حفظ
                        </Button>
                      </Stack>
                    </Stack>
                  ) : (
                    <Box>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            sx={{
                              fontWeight: 800,
                              fontSize: "1rem",
                              mb: 0.5,
                              color: "text.primary",
                            }}
                          >
                            {t.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                          >
                            {t.description || "بدون وصف"}
                          </Typography>
                        </Box>
                        <DragIndicatorRoundedIcon
                          sx={{ color: "text.disabled", cursor: "grab" }}
                          fontSize="small"
                        />
                      </Stack>

                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: isOverdue ? "error.main" : "text.secondary",
                            fontWeight: 700,
                          }}
                        >
                          {t.deadline
                            ? new Date(t.deadline).toLocaleDateString("ar-EG")
                            : "بدون موعد"}
                        </Typography>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="تعديل">
                            <IconButton
                              size="small"
                              onClick={() => handleEditTaskClick(t)}
                              sx={{ color: "text.secondary" }}
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
                      </Stack>
                    </Box>
                  )}
                </Paper>
              );
            })}

            {columnTasks.length === 0 && (
              <Box
                sx={{
                  border: "1.5px dashed",
                  borderColor: "divider", // 🎯 الخط المنقط يتأقلم
                  borderRadius: "50px",
                  py: 3,
                  mt: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", fontWeight: 600 }}
                >
                  اسحب المهام إلى هنا
                </Typography>
              </Box>
            )}
          </Stack>
        </Paper>
      </Box>
    );
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box component="form" onSubmit={handleCreateTask} sx={{ mb: 4 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            size="small"
            label="عنوان المهمة"
            value={newTask.title}
            onChange={(e) =>
              setNewTask((p) => ({ ...p, title: e.target.value }))
            }
            sx={{ borderRadius: 2 }}
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
            inputProps={{ min: today, max: maxDate }}
            value={newTask.deadline}
            onChange={(e) =>
              setNewTask((p) => ({ ...p, deadline: e.target.value }))
            }
            sx={{ minWidth: 200 }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={creatingTask}
            sx={{ minWidth: 100, borderRadius: 2, fontWeight: 800 }}
          >
            {creatingTask ? "..." : "إضافة"}
          </Button>
        </Stack>
        {taskMsg.text && (
          <Alert
            severity={taskMsg.type === "error" ? "error" : "success"}
            sx={{ mt: 2 }}
          >
            {taskMsg.text}
          </Alert>
        )}
      </Box>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        alignItems="stretch"
        sx={{ width: "100%" }}
      >
        {renderTaskColumn("pending", "قيد الانتظار", "#f39c12")}
        {renderTaskColumn("in_progress", "قيد التنفيذ", "#3498db")}
        {renderTaskColumn("completed", "مكتملة", "#2ecc71")}
      </Stack>
    </Box>
  );
}
