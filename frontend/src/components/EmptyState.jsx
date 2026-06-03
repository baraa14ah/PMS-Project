import React from "react";
import { Box, Typography, Button, alpha } from "@mui/material";

export default function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        px: 2,
        textAlign: "center",
      }}
      dir="rtl"
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          color: "primary.main",
          mb: 3,
          "& svg": { fontSize: 40 },
        }}
      >
        {icon}
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
        {title}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 400, mb: actionText ? 3 : 0 }}
      >
        {description}
      </Typography>

      {actionText && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{ borderRadius: 8, px: 4 }}
        >
          {actionText}
        </Button>
      )}
    </Box>
  );
}
