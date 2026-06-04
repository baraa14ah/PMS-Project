import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Paper, Typography, Link as MuiLink, Stack, alpha, keyframes } from "@mui/material";
import BrandLogo from "./BrandLogo";
import LanguageSwitcher from "./LanguageSwitcher";
import { AUTH_COLORS } from "./authStyles";

const shimmer = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const DEFAULT_SLIDES = [
  { title: "مهام وتقدم", desc: "نسبة إنجاز المشروع من حالة المهام" },
  { title: "دعوات الفريق", desc: "مشرف وطلاب — قبول ورفض منظم" },
  { title: "إشعارات فورية", desc: "تعليقات، مهام، وإصدارات" },
];

export default function AuthPageShell({
  title,
  subtitle,
  brandTitle = "إدارة مشاريعك بذكاء.",
  brandBody = "مهام، إصدارات، تعليقات، ودعوات — كل شيء في مكان واحد.",
  brandHighlights = [],
  brandSlides,
  children,
}) {
  const slides =
    brandSlides?.length > 0
      ? brandSlides
      : brandHighlights.length > 0
        ? brandHighlights
        : DEFAULT_SLIDES;

  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const id = setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 4000);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: AUTH_COLORS.bg,
        display: "grid",
        placeItems: "center",
        p: 2,
        backgroundImage: `
          radial-gradient(700px 400px at 0% 0%, ${alpha(AUTH_COLORS.blue, 0.09)}, transparent 55%),
          radial-gradient(600px 350px at 100% 100%, ${alpha(AUTH_COLORS.teal, 0.08)}, transparent 50%)
        `,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "min(1120px, 100%)",
          borderRadius: 4,
          overflow: "hidden",
          border: `1px solid ${AUTH_COLORS.border}`,
          boxShadow: "0 28px 80px rgba(15,23,42,0.12)",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" },
          minHeight: { xs: "auto", md: 620 },
        }}
      >
        {/* لوحة العلامة */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            justifyContent: "space-between",
            p: 5,
            color: "white",
            position: "relative",
            overflow: "hidden",
            background: `linear-gradient(160deg, ${AUTH_COLORS.navy} 0%, #0F2847 40%, ${AUTH_COLORS.slate} 100%)`,
            backgroundSize: "200% 200%",
            animation: `${shimmer} 18s ease infinite`,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              opacity: 0.25,
              backgroundImage: `radial-gradient(${alpha("#fff", 0.12)} 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              width: 320,
              height: 320,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${alpha(AUTH_COLORS.teal, 0.35)}, transparent 70%)`,
              top: -100,
              right: -80,
            }}
          />

          <Stack
            component={RouterLink}
            to="/"
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{
              position: "relative",
              textDecoration: "none",
              color: "inherit",
              "&:hover": { opacity: 0.92 },
            }}
          >
            <BrandLogo size="lg" variant="hero" />
            <Box>
              <Typography sx={{ fontWeight: 950, fontSize: 20 }}>ByteHub</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 600 }}>
                منصة المشاريع الجامعية
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ position: "relative", my: 4 }}>
            <Typography variant="h3" sx={{ fontWeight: 950, lineHeight: 1.2 }}>
              {brandTitle}
            </Typography>
            <Typography sx={{ mt: 2, opacity: 0.88, maxWidth: 400, lineHeight: 1.9, fontWeight: 500 }}>
              {brandBody}
            </Typography>

            <Paper
              elevation={0}
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 3,
                bgcolor: alpha("#fff", 0.08),
                border: `1px solid ${alpha("#fff", 0.12)}`,
                minHeight: 88,
                transition: "opacity 0.4s",
              }}
            >
              <Typography sx={{ fontWeight: 900, fontSize: 15 }}>
                {slides[slideIndex]?.title}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.85 }}>
                {slides[slideIndex]?.desc}
              </Typography>
              <Stack direction="row" spacing={0.75} sx={{ mt: 1.5 }}>
                {slides.map((_, i) => (
                  <Box
                    key={i}
                    sx={{
                      width: i === slideIndex ? 20 : 8,
                      height: 8,
                      borderRadius: 99,
                      bgcolor: i === slideIndex ? AUTH_COLORS.teal : alpha("#fff", 0.35),
                      transition: "width 0.3s, background-color 0.3s",
                    }}
                  />
                ))}
              </Stack>
            </Paper>
          </Box>

          <Typography variant="caption" sx={{ opacity: 0.6, position: "relative" }}>
            © {new Date().getFullYear()} ByteHub
          </Typography>
        </Box>

        {/* النموذج */}
        <Box
          sx={{
            p: { xs: 3, md: 5 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            bgcolor: "white",
            animation: `${fadeUp} 0.5s ease-out`,
          }}
        >
          <Stack
            component={RouterLink}
            to="/"
            direction="row"
            spacing={1.2}
            alignItems="center"
            sx={{
              display: { md: "none" },
              textDecoration: "none",
              color: AUTH_COLORS.navy,
              mb: 2,
              fontWeight: 900,
            }}
          >
            <BrandLogo size="sm" variant="onLight" />
            ByteHub
          </Stack>

          <BrandLogo
            size="md"
            variant="onLight"
            sx={{ display: { md: "none" }, mb: 2, alignSelf: "center" }}
          />

          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Typography variant="h4" sx={{ fontWeight: 950, color: AUTH_COLORS.navy }}>
              {title}
            </Typography>
            <LanguageSwitcher size="small" />
          </Stack>
          {subtitle && (
            <Typography variant="body2" sx={{ mt: 1, color: AUTH_COLORS.muted, lineHeight: 1.75 }}>
              {subtitle}
            </Typography>
          )}
          {children}
        </Box>
      </Paper>
    </Box>
  );
}
