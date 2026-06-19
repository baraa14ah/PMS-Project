import React, { useMemo } from "react";
import { Typography, Box, Stack, alpha } from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import { useLanguage } from "../../context/LanguageContext";
import ProjectSectionShell from "../../components/ProjectSectionShell";

/** Custom tooltip for the project task status pie chart. */
function ChartTooltip({ active, payload, totalTasks, isRtl, tasksLabel }) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  const percent = totalTasks > 0 ? Math.round((data.value / totalTasks) * 100) : 0;

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        p: 1.5,
        minWidth: 140,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        boxShadow: "0px 8px 24px rgba(0,0,0,0.12)",
        dir: isRtl ? "rtl" : "ltr",
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 0.5 }}>
        {data.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
        {data.value} {tasksLabel} ({percent}%)
      </Typography>
    </Box>
  );
}

/** Displays task status counts and a pie chart for a project. */
export default function ProjectCharts({ tasks }) {
  const { t, isRtl } = useLanguage();

  const counts = useMemo(() => {
    const completed = tasks.filter((task) => task.status === "completed").length;
    const inProgress = tasks.filter((task) => task.status === "in_progress").length;
    const pending = tasks.filter(
      (task) => task.status === "pending" || !task.status,
    ).length;
    return { completed, inProgress, pending, total: tasks.length };
  }, [tasks]);

  const stats = useMemo(
    () =>
      [
        { name: t("projectDetails.columnCompleted"), value: counts.completed, color: "#10B981" },
        { name: t("projectDetails.columnInProgress"), value: counts.inProgress, color: "#3B82F6" },
        { name: t("projectDetails.columnPending"), value: counts.pending, color: "#F59E0B" },
      ].filter((item) => item.value > 0),
    [counts, t],
  );

  const totalTasks = stats.reduce((acc, curr) => acc + curr.value, 0);
  const tasksLabel = t("projectDetails.chartTasks");

  const statCards = [
    { label: t("projectDetails.columnPending"), value: counts.pending, color: "#F59E0B" },
    { label: t("projectDetails.columnInProgress"), value: counts.inProgress, color: "#3B82F6" },
    { label: t("projectDetails.columnCompleted"), value: counts.completed, color: "#10B981" },
  ];

  return (
    <ProjectSectionShell
      icon={QueryStatsRoundedIcon}
      title={t("projectDetails.chartTitle")}
      subtitle={t("projectDetails.chartSubtitle")}
      accent="#7C3AED"
      sx={{ mt: 2.5 }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
        <Stack direction={{ xs: "row", md: "column" }} spacing={1.5} sx={{ minWidth: { md: 160 } }}>
          {statCards.map((card) => (
            <Box
              key={card.label}
              sx={{
                flex: 1,
                p: 1.75,
                borderRadius: 2.5,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: alpha(card.color, 0.06),
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 900, color: card.color, lineHeight: 1 }}>
                {card.value}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                {card.label}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Box sx={{ flex: 1, minWidth: 0, height: 240 }}>
          {tasks.length === 0 ? (
            <Box
              sx={{
                height: "100%",
                minHeight: 200,
                display: "grid",
                placeItems: "center",
                borderRadius: 2.5,
                border: "1px dashed",
                borderColor: "divider",
              }}
            >
              <Typography color="text.secondary" sx={{ fontWeight: 600 }}>
                {t("projectDetails.chartEmpty")}
              </Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={240} minWidth={0}>
              <PieChart>
                <Pie
                  data={stats}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={86}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={false}
                >
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  content={
                    <ChartTooltip
                      totalTasks={totalTasks}
                      isRtl={isRtl}
                      tasksLabel={tasksLabel}
                    />
                  }
                  isAnimationActive={false}
                />
                <Legend
                  verticalAlign="bottom"
                  height={28}
                  iconSize={10}
                  wrapperStyle={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    direction: isRtl ? "rtl" : "ltr",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Box>
      </Stack>
    </ProjectSectionShell>
  );
}
