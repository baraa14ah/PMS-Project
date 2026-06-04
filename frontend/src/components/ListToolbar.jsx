import React from "react";
import {
  Paper,
  Stack,
  TextField,
  MenuItem,
  Button,
  InputAdornment,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

/**
 * Shared search + filter bar for list pages.
 * filters: [{ key, label, value, onChange, options: [{ value, label }] }]
 */
export default function ListToolbar({
  search = "",
  onSearchChange,
  searchPlaceholder = "بحث بالاسم أو البريد...",
  filters = [],
  onRefresh,
  children,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ md: "center" }}
        flexWrap="wrap"
      >
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
          sx={{ minWidth: 220, flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />

        {filters.map((f) => (
          <TextField
            key={f.key}
            select
            size="small"
            label={f.label}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">الكل</MenuItem>
            {(f.options || []).map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        ))}

        {children}

        {onRefresh && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={onRefresh}
            sx={{ fontWeight: 700 }}
          >
            تحديث
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
