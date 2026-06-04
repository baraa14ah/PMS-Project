import React from "react";
import { Box, Paper, Typography, Stack, alpha } from "@mui/material";

/**
 * رأس موحّد لصفحات لوحة التحكم (يتماشى مع Landing / Auth).
 */
export default function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  gradient = true,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        background: gradient
          ? (theme) =>
              theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha("#0B1220", 0.9)} 0%, ${alpha("#1E3A5F", 0.85)} 100%)`
                : `linear-gradient(135deg, #0B1220 0%, #1E3A5F 55%, #0F766E 100%)`
          : "background.paper",
        color: gradient ? "#FFFFFF" : "text.primary",
        "& .MuiTypography-root": gradient ? { color: "#FFFFFF" } : undefined,
        "& .MuiChip-root": gradient
          ? { color: "#FFFFFF", borderColor: "rgba(255,255,255,0.35)" }
          : undefined,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ p: { xs: 2, md: 2.5 } }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          {icon && (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                bgcolor: gradient ? alpha("#fff", 0.12) : alpha("#3B82F6", 0.1),
                color: gradient ? "white" : "primary.main",
              }}
            >
              {icon}
            </Box>
          )}
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 950, lineHeight: 1.2 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                sx={{
                  mt: 0.4,
                  opacity: gradient ? 0.88 : 0.7,
                  fontWeight: 500,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        {actions && <Box>{actions}</Box>}
      </Stack>
    </Paper>
  );
}
