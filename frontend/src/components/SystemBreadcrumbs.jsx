import React from "react";
import { useLocation, Link as RouterLink } from "react-router-dom";
import { Breadcrumbs, Link, Typography, Box } from "@mui/material";
import NavigateBeforeRoundedIcon from "@mui/icons-material/NavigateBeforeRounded";

// 🎯 قاموس ذكي لترجمة الروابط الإنجليزية إلى واجهة عربية
const routeNames = {
  dashboard: "الرئيسية",
  projects: "المشاريع",
  tasks: "المهام",
  notifications: "الإشعارات",
  profile: "الملف الشخصي",
  invitations: "الدعوات",
  students: "الطلاب",
  supervisors: "المشرفين",
};

export default function SystemBreadcrumbs() {
  const location = useLocation();
  // تقسيم الرابط الحالي إلى أجزاء (مثلاً: /dashboard/projects/12)
  const pathnames = location.pathname.split("/").filter((x) => x);

  // إذا كنا في الصفحة الرئيسية فقط، قد لا نحتاج لعرض المسار (اختياري، يمكنك إزالته)
  if (pathnames.length <= 1) return null;

  return (
    <Box
      sx={{
        mb: 2,
        px: { xs: 2, md: 3 },
        maxWidth: "1400px",
        mx: "auto",
        width: "100%",
      }}
    >
      <Breadcrumbs
        separator={<NavigateBeforeRoundedIcon fontSize="small" />}
        aria-label="breadcrumb"
        dir="rtl"
      >
        {pathnames.map((value, index) => {
          // هل هذا هو آخر عنصر في المسار؟ (الصفحة التي نقف عليها حالياً)
          const isLast = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;

          // إذا كان الرابط عبارة عن رقم (مثل ID المشروع)، نكتب "التفاصيل"
          const isId = !isNaN(value);
          let displayName = routeNames[value] || value;
          if (isId) displayName = "التفاصيل";

          if (isLast) {
            return (
              <Typography
                color="text.primary"
                key={to}
                sx={{
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  unicodeBidi: "isolate",
                }}
              >
                {displayName}
              </Typography>
            );
          }

          return (
            <Link
              component={RouterLink}
              underline="hover"
              color="inherit"
              to={to}
              key={to}
              sx={{ display: "flex", alignItems: "center", fontSize: "0.9rem" }}
            >
              {displayName}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}
