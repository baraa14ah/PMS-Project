import React from "react";
import { useLocation, Link as RouterLink } from "react-router-dom";
import { Breadcrumbs, Link, Typography, Box } from "@mui/material";
import NavigateBeforeRoundedIcon from "@mui/icons-material/NavigateBeforeRounded";
import { useLanguage } from "../context/LanguageContext";

const ROUTE_KEYS = {
  dashboard: "breadcrumbs.dashboard",
  projects: "breadcrumbs.projects",
  notifications: "breadcrumbs.notifications",
  profile: "breadcrumbs.profile",
  users: "breadcrumbs.users",
  universities: "breadcrumbs.universities",
  invitations: "breadcrumbs.invitations",
  supervisor: "breadcrumbs.invitations",
  student: "breadcrumbs.invitations",
};

/** Renders translated breadcrumb trail from the current route path. */
export default function SystemBreadcrumbs() {
  const location = useLocation();
  const { t, dir } = useLanguage();
  const pathnames = location.pathname.split("/").filter((x) => x);

  if (pathnames.length <= 1) return null;

  return (
    <Box sx={{ mb: 2, maxWidth: 1400, mx: "auto", width: "100%" }}>
      <Breadcrumbs
        separator={<NavigateBeforeRoundedIcon fontSize="small" />}
        aria-label="breadcrumb"
        dir={dir}
      >
        {pathnames.map((value, index) => {
          const isLast = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isId = !Number.isNaN(Number(value));
          const key = ROUTE_KEYS[value];
          let displayName = key ? t(key) : value;
          if (isId) displayName = t("breadcrumbs.details");

          if (isLast) {
            return (
              <Typography
                color="text.primary"
                key={to}
                sx={{ fontWeight: 800, fontSize: "0.9rem" }}
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
              sx={{ fontSize: "0.9rem" }}
            >
              {displayName}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}
