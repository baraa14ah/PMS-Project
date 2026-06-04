import React from "react";
import { ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import { useLanguage } from "../context/LanguageContext";

export default function LanguageSwitcher({ size = "small", sx = {} }) {
  const { lang, setLang } = useLanguage();

  return (
    <ToggleButtonGroup
      size={size}
      exclusive
      value={lang}
      onChange={(_, v) => v && setLang(v)}
      sx={{
        bgcolor: "action.hover",
        borderRadius: 2,
        ...sx,
      }}
    >
      <ToggleButton value="ar" sx={{ fontWeight: 800, px: 1.5, py: 0.25 }}>
        <Tooltip title="العربية">ع</Tooltip>
      </ToggleButton>
      <ToggleButton value="en" sx={{ fontWeight: 800, px: 1.5, py: 0.25 }}>
        <Tooltip title="English">EN</Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
