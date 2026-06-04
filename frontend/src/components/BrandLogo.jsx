import React from "react";
import { Box } from "@mui/material";
import Logo from "../assets/byte.png";

const SIZES = { sm: 36, md: 44, lg: 56, xl: 72 };

/**
 * الشعار أبيض على خلفية داكنة في الملف — على الخلفيات الفاتحة نضع حاوية داكنة.
 * variant: "onDark" بدون حاوية | "onLight" حاوية كحلية | "hero" حاوية متدرجة أكبر
 */
export default function BrandLogo({
  size = "md",
  variant = "onLight",
  sx = {},
}) {
  const px = typeof size === "number" ? size : SIZES[size] || SIZES.md;
  const pad = variant === "hero" ? 1.25 : 0.65;
  const box = px + pad * 8 * 2;

  const shell =
    variant === "onDark"
      ? {
          bgcolor: "transparent",
          border: "none",
          boxShadow: "none",
        }
      : variant === "hero"
        ? {
            background: "linear-gradient(135deg, #0B1220 0%, #1E3A5F 50%, #0F766E 100%)",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 12px 32px rgba(15,23,42,0.35)",
          }
        : {
            bgcolor: "#0B1220",
            border: "1px solid #1E293B",
            boxShadow: "0 4px 14px rgba(15,23,42,0.2)",
          };

  return (
    <Box
      sx={{
        width: box,
        height: box,
        borderRadius: variant === "hero" ? 3 : 2,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        ...shell,
        ...sx,
      }}
    >
      <Box
        component="img"
        src={Logo}
        alt="ByteHub"
        sx={{
          width: px,
          height: px,
          objectFit: "contain",
          display: "block",
        }}
      />
    </Box>
  );
}
