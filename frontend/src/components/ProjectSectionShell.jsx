import React from "react";
import { Box, Paper, Stack, Typography, alpha } from "@mui/material";
import { sectionPaperSx, accentTop } from "../styles/dashboardUi";

/** Paper wrapper with accent bar, header, and optional actions for project sections. */
export default function ProjectSectionShell({
  icon: Icon,
  title,
  subtitle,
  accent = "#3B82F6",
  actions,
  children,
  sx,
  contentSx,
  noPadding,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        ...sectionPaperSx,
        ...accentTop(accent),
        overflow: "hidden",
        ...(noPadding ? { p: 0 } : {}),
        ...sx,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.5}
        sx={{
          px: noPadding ? { xs: 2, md: 2.5 } : 0,
          pt: noPadding ? { xs: 2, md: 2.5 } : 0,
          pb: noPadding ? 0 : 2,
          mb: noPadding ? 2 : 0,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
          {Icon && (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                bgcolor: alpha(accent, 0.12),
                color: accent,
              }}
            >
              <Icon />
            </Box>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.25 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.35, fontWeight: 500, maxWidth: 560 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        {actions}
      </Stack>
      <Box sx={{ ...(noPadding ? { px: { xs: 2, md: 2.5 }, pb: { xs: 2, md: 2.5 } } : {}), ...contentSx }}>
        {children}
      </Box>
    </Paper>
  );
}
