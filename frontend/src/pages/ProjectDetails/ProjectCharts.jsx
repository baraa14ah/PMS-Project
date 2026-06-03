import React, { useMemo } from "react";
import { Paper, Typography, Box, Stack, Divider } from "@mui/material"; // 🎯 استدعينا Stack و Divider للترتيب
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";

export default function ProjectCharts({ tasks }) {
  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const pending = tasks.filter(
      (t) => t.status === "pending" || !t.status,
    ).length;

    return [
      { name: "مكتملة", value: completed, color: "#2ecc71" },
      { name: "قيد التنفيذ", value: inProgress, color: "#3498db" },
      { name: "قيد الانتظار", value: pending, color: "#f39c12" },
    ].filter((item) => item.value > 0);
  }, [tasks]);

  if (tasks.length === 0) return null;

  // حساب إجمالي المهام
  const totalTasks = stats.reduce((acc, curr) => acc + curr.value, 0);

  // 🎯 تصميم المربع المنبثق الجديد (مرتب، نظيف، وبدون عجقة)
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percent =
        totalTasks > 0 ? Math.round((data.value / totalTasks) * 100) : 0;

      return (
        <Box
          sx={{
            bgcolor: "background.paper",
            p: 1.5,
            minWidth: 140, // 🎯 عرض مناسب لكي لا ينضغط الكلام
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            boxShadow: "0px 8px 24px rgba(0,0,0,0.12)", // 🎯 ظل أنعم وأفخم
            dir: "rtl",
          }}
        >
          <Stack spacing={1}>
            {/* القسم العلوي: النقطة الملونة + اسم الحالة */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  bgcolor: data.color,
                }}
              />
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 900, color: "text.primary" }}
              >
                {data.name}
              </Typography>
            </Stack>
            <Divider sx={{ my: 0.5 }} /> {/* 🎯 خط فاصل ناعم */}
            {/* القسم السفلي: الأرقام */}
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: "text.secondary" }}
            >
              العدد:{" "}
              <span style={{ color: data.color, fontWeight: 900 }}>
                {data.value}
              </span>{" "}
              مهام
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: "text.secondary" }}
            >
              النسبة:{" "}
              <span style={{ color: data.color, fontWeight: 900 }}>
                {percent}%
              </span>
            </Typography>
          </Stack>
        </Box>
      );
    }
    return null;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mt: 2,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <QueryStatsRoundedIcon color="primary" fontSize="small" />
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          التحليل البصري للمهام
        </Typography>
      </Box>

      <Box sx={{ width: "100%", height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={stats}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
              isAnimationActive={false} // إيقاف أنميشن الدائرة
            >
              {stats.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>

            <Tooltip content={<CustomTooltip />} isAnimationActive={false} />

            <Legend
              verticalAlign="bottom"
              height={20}
              iconSize={8}
              wrapperStyle={{
                fontSize: "0.85rem",
                fontWeight: 700,
                direction: "rtl",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
