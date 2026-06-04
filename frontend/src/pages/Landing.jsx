import React from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Grid,
  alpha,
  keyframes,
} from "@mui/material";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import FolderSpecialRoundedIcon from "@mui/icons-material/FolderSpecialRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import BrandLogo from "../components/BrandLogo";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../context/LanguageContext";

const NAVY = "#0B1220";
const SLATE = "#1E293B";
const BLUE = "#3B82F6";
const TEAL = "#14B8A6";
const AMBER = "#F59E0B";

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.85; }
`;

export default function Landing() {
  const navigate = useNavigate();
  const { t, dir, isRtl } = useLanguage();

  const journeySteps = [
    { step: "1", title: t("landing.step1Title"), desc: t("landing.step1Desc") },
    { step: "2", title: t("landing.step2Title"), desc: t("landing.step2Desc") },
    { step: "3", title: t("landing.step3Title"), desc: t("landing.step3Desc") },
    { step: "4", title: t("landing.step4Title"), desc: t("landing.step4Desc") },
  ];

  return (
    <Box sx={{ minHeight: "100vh", direction: dir, bgcolor: "#FAFBFC" }}>
      <LandingNav navigate={navigate} />

      {/* Hero */}
      <Box
        component="section"
        sx={{
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(165deg, ${NAVY} 0%, ${SLATE} 45%, #0F2847 100%)`,
          color: "white",
          pt: { xs: 6, md: 10 },
          pb: { xs: 10, md: 14 },
        }}
      >
        <HeroBackground />
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} lg={6}>
              <Stack spacing={3}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignSelf: "flex-start",
                    alignItems: "center",
                    gap: 1,
                    px: 2,
                    py: 0.75,
                    borderRadius: 99,
                    bgcolor: alpha(BLUE, 0.2),
                    border: `1px solid ${alpha(BLUE, 0.45)}`,
                  }}
                >
                  <HubRoundedIcon sx={{ fontSize: 18, color: TEAL }} />
                  <Typography sx={{ fontWeight: 800, fontSize: 13 }}>
                    {t("landing.heroBadge")}
                  </Typography>
                </Box>

                <Typography
                  component="h1"
                  sx={{
                    fontWeight: 950,
                    fontSize: { xs: "2.1rem", sm: "2.75rem", md: "3.2rem" },
                    lineHeight: 1.15,
                    letterSpacing: -0.5,
                  }}
                >
                  {t("landing.heroTitle1")}
                  <Box
                    component="span"
                    sx={{
                      display: "block",
                      background: `linear-gradient(90deg, ${TEAL}, ${BLUE})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {t("landing.heroTitle2")}
                  </Box>
                </Typography>

                <Typography
                  sx={{
                    fontSize: { xs: 16, md: 18 },
                    lineHeight: 1.95,
                    color: alpha("#fff", 0.82),
                    maxWidth: 520,
                    fontWeight: 500,
                  }}
                >
                  {t("landing.heroBody")}
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button
                    size="large"
                    variant="contained"
                    {...(isRtl
                      ? { startIcon: <ArrowForwardRoundedIcon /> }
                      : { endIcon: <ArrowForwardRoundedIcon /> })}
                    onClick={() => navigate("/register")}
                    sx={{
                      py: 1.5,
                      px: 3,
                      fontWeight: 900,
                      borderRadius: 3,
                      fontSize: 16,
                      bgcolor: BLUE,
                      color: "#fff",
                      boxShadow: `0 12px 40px ${alpha(BLUE, 0.45)}`,
                      "&:hover": { bgcolor: "#2563EB", color: "#fff" },
                    }}
                  >
                    {t("landing.ctaRegister")}
                  </Button>
                  <Button
                    size="large"
                    variant="outlined"
                    onClick={() => navigate("/login")}
                    sx={{
                      py: 1.5,
                      px: 3,
                      fontWeight: 800,
                      borderRadius: 3,
                      borderColor: alpha("#fff", 0.35),
                      color: "white",
                      "&:hover": {
                        borderColor: "white",
                        bgcolor: alpha("#fff", 0.08),
                      },
                    }}
                  >
                    {t("landing.login")}
                  </Button>
                </Stack>

                <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ pt: 1 }}>
                  <TrustPill icon={<ShieldRoundedIcon />} text={t("landing.trust1")} />
                  <TrustPill icon={<CheckCircleRoundedIcon />} text={t("landing.trust2")} />
                  <TrustPill icon={<NotificationsActiveRoundedIcon />} text={t("landing.trust3")} />
                </Stack>
              </Stack>
            </Grid>

            <Grid item xs={12} lg={6}>
              <EcosystemVisual isRtl={isRtl} />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Who is it for */}
      <Box component="section" sx={{ py: { xs: 8, md: 12 }, bgcolor: "#FAFBFC" }}>
        <Container maxWidth="lg">
          <SectionHeader
            eyebrow={t("landing.rolesEyebrow")}
            title={t("landing.rolesTitle")}
            subtitle={t("landing.rolesSubtitle")}
          />
          <Grid container spacing={3}>
            <RoleCard
              icon={<PersonRoundedIcon />}
              color={TEAL}
              role={t("landing.studentRole")}
              points={[t("landing.studentP1"), t("landing.studentP2"), t("landing.studentP3")]}
            />
            <RoleCard
              icon={<SupervisorAccountRoundedIcon />}
              color={BLUE}
              role={t("landing.supervisorRole")}
              points={[
                t("landing.supervisorP1"),
                t("landing.supervisorP2"),
                t("landing.supervisorP3"),
              ]}
            />
            <RoleCard
              icon={<AdminPanelSettingsRoundedIcon />}
              color={AMBER}
              role={t("landing.adminRole")}
              points={[t("landing.adminP1"), t("landing.adminP2"), t("landing.adminP3")]}
            />
          </Grid>
        </Container>
      </Box>

      {/* Journey */}
      <Box
        component="section"
        sx={{
          py: { xs: 8, md: 10 },
          background: `linear-gradient(180deg, ${alpha(BLUE, 0.04)} 0%, transparent 100%)`,
        }}
      >
        <Container maxWidth="lg">
          <SectionHeader
            eyebrow={t("landing.journeyEyebrow")}
            title={t("landing.journeyTitle")}
            subtitle={t("landing.journeySubtitle")}
          />
          <Grid container spacing={2}>
            {journeySteps.map((item, i) => (
              <Grid item xs={12} sm={6} md={3} key={item.step}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    height: "100%",
                    borderRadius: 3,
                    border: "1px solid #E2E8F0",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 48,
                      fontWeight: 950,
                      color: alpha(BLUE, 0.12),
                      lineHeight: 1,
                      mb: 1,
                    }}
                  >
                    {item.step}
                  </Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 17, color: NAVY }}>
                    {item.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.8, lineHeight: 1.8, fontWeight: 600 }}
                  >
                    {item.desc}
                  </Typography>
                  {i < 3 && (
                    <Box
                      sx={{
                        display: { xs: "none", md: "block" },
                        position: "absolute",
                        left: -12,
                        top: "50%",
                        width: 24,
                        height: 2,
                        bgcolor: alpha(BLUE, 0.3),
                      }}
                    />
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Box component="section" sx={{ py: { xs: 8, md: 12 }, bgcolor: "white" }}>
        <Container maxWidth="lg">
          <SectionHeader
            eyebrow={t("landing.featuresEyebrow")}
            title={t("landing.featuresTitle")}
            subtitle={t("landing.featuresSubtitle")}
          />
          <Grid container spacing={2.5}>
            <FeatureTile
              icon={<SchoolRoundedIcon />}
              title={t("landing.feat1Title")}
              desc={t("landing.feat1Desc")}
              color={TEAL}
            />
            <FeatureTile
              icon={<MailOutlineRoundedIcon />}
              title={t("landing.feat2Title")}
              desc={t("landing.feat2Desc")}
              color={BLUE}
            />
            <FeatureTile
              icon={<TaskAltRoundedIcon />}
              title={t("landing.feat3Title")}
              desc={t("landing.feat3Desc")}
              color="#8B5CF6"
            />
            <FeatureTile
              icon={<ForumRoundedIcon />}
              title={t("landing.feat4Title")}
              desc={t("landing.feat4Desc")}
              color="#EC4899"
            />
            <FeatureTile
              icon={<LayersRoundedIcon />}
              title={t("landing.feat5Title")}
              desc={t("landing.feat5Desc")}
              color="#0891B2"
            />
            <FeatureTile
              icon={<LockResetRoundedIcon />}
              title={t("landing.feat6Title")}
              desc={t("landing.feat6Desc")}
              color={AMBER}
            />
          </Grid>
        </Container>
      </Box>

      {/* Dashboard preview */}
      <Box component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: NAVY, color: "white" }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={5}>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: "1.75rem", md: "2.25rem" },
                  lineHeight: 1.2,
                }}
              >
                {t("landing.previewTitle")}
              </Typography>
              <Typography sx={{ mt: 2, opacity: 0.85, lineHeight: 1.9, fontWeight: 500 }}>
                {t("landing.previewBody")}
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<RocketLaunchRoundedIcon />}
                onClick={() => navigate("/register")}
                sx={{
                  mt: 3,
                  fontWeight: 900,
                  borderRadius: 3,
                  bgcolor: TEAL,
                  color: NAVY,
                  "&:hover": { bgcolor: "#0D9488" },
                }}
              >
                {t("landing.previewCta")}
              </Button>
            </Grid>
            <Grid item xs={12} md={7}>
              <DashboardMockup />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Box
        component="section"
        sx={{
          py: { xs: 8, md: 10 },
          background: `linear-gradient(135deg, ${alpha(BLUE, 0.08)}, ${alpha(TEAL, 0.12)})`,
        }}
      >
        <Container maxWidth="md">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, md: 5 },
              borderRadius: 4,
              textAlign: "center",
              border: `1px solid ${alpha(BLUE, 0.2)}`,
              background: "white",
            }}
          >
            <FolderSpecialRoundedIcon sx={{ fontSize: 56, color: BLUE, mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 950, color: NAVY }}>
              {t("landing.ctaTitle")}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ mt: 1.5, maxWidth: 480, mx: "auto", lineHeight: 1.9, fontWeight: 600 }}
            >
              {t("landing.ctaBody")}
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              justifyContent="center"
              sx={{ mt: 4 }}
            >
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate("/register")}
                sx={{
                  fontWeight: 900,
                  borderRadius: 3,
                  px: 4,
                  bgcolor: NAVY,
                  color: "#fff",
                  "&:hover": { bgcolor: SLATE, color: "#fff" },
                }}
              >
                {t("landing.ctaRegisterFree")}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate("/login")}
                sx={{ fontWeight: 800, borderRadius: 3, px: 4, borderColor: "#CBD5E1" }}
              >
                {t("landing.ctaHasAccount")}
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>

      <Box
        component="footer"
        sx={{
          py: 4,
          textAlign: "center",
          borderTop: "1px solid #E2E8F0",
          bgcolor: "white",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mb: 1 }}>
          <BrandLogo size="sm" variant="onLight" />
          <Typography sx={{ fontWeight: 900, color: NAVY }}>ByteHub</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          © {new Date().getFullYear()} — {t("landing.footer")}
        </Typography>
      </Box>
    </Box>
  );
}

function LandingNav({ navigate }) {
  const { t } = useLanguage();
  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        bgcolor: alpha("#FAFBFC", 0.92),
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid #E2E8F0",
      }}
    >
      <Container maxWidth="lg">
        <Stack direction="row" alignItems="center" justifyContent="space-between" py={1.5}>
            <Stack
              component={RouterLink}
              to="/"
              direction="row"
              spacing={1.2}
              alignItems="center"
              sx={{ textDecoration: "none", color: NAVY }}
            >
              <BrandLogo size="md" variant="onLight" />
            <Box>
              <Typography sx={{ fontWeight: 950, lineHeight: 1.1 }}>{t("common.appName")}</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                {t("common.appTagline")}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <LanguageSwitcher size="small" />
            <Button onClick={() => navigate("/login")} sx={{ fontWeight: 800, color: NAVY }}>
              {t("landing.login")}
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate("/register")}
              sx={{
                fontWeight: 900,
                borderRadius: 2.5,
                bgcolor: NAVY,
                color: "#fff",
                boxShadow: "none",
                "&:hover": { bgcolor: SLATE, color: "#fff" },
              }}
            >
              {t("landing.register")}
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

function HeroBackground() {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          opacity: 0.2,
          backgroundImage: `radial-gradient(${alpha("#fff", 0.12)} 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          width: { xs: 220, md: 320 },
          height: { xs: 220, md: 320 },
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(TEAL, 0.18)}, transparent 70%)`,
          top: -60,
          left: -40,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          width: { xs: 200, md: 280 },
          height: { xs: 200, md: 280 },
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(BLUE, 0.2)}, transparent 70%)`,
          bottom: -40,
          right: -30,
        }}
      />
    </Box>
  );
}

function nodePosition(node, isRtl) {
  const pos = { top: node.top };
  if (isRtl) {
    if (node.left) pos.right = node.left;
    if (node.right) pos.left = node.right;
  } else {
    if (node.left) pos.left = node.left;
    if (node.right) pos.right = node.right;
  }
  return pos;
}

function EcosystemVisual({ isRtl }) {
  const { t } = useLanguage();
  const drift = isRtl ? "-8px" : "8px";
  const floatDir = keyframes`
    0%, 100% { transform: translateY(0) translateX(0); }
    50% { transform: translateY(-10px) translateX(${drift}); }
  `;

  const nodes = [
    { label: t("landing.ecoUniversity"), sub: t("landing.ecoUniversitySub"), color: AMBER, top: "8%", right: "42%" },
    { label: t("landing.ecoAdmin"), sub: t("landing.ecoAdminSub"), color: AMBER, top: "32%", right: "8%" },
    { label: t("landing.ecoSupervisor"), sub: t("landing.ecoSupervisorSub"), color: BLUE, top: "32%", left: "8%" },
    { label: t("landing.ecoStudent"), sub: t("landing.ecoStudentSub"), color: TEAL, top: "58%", right: "22%" },
    { label: t("landing.ecoProject"), sub: t("landing.ecoProjectSub"), color: "#A78BFA", top: "72%", left: "28%" },
  ];

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: { xs: 300, md: 380 },
        borderRadius: 4,
        border: `1px solid ${alpha("#fff", 0.12)}`,
        bgcolor: alpha("#fff", 0.05),
        isolation: "isolate",
        animation: `${floatDir} 7s ease-in-out infinite`,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 72,
          height: 72,
          borderRadius: "50%",
          bgcolor: alpha(BLUE, 0.15),
          border: `1px solid ${alpha(TEAL, 0.35)}`,
          display: "grid",
          placeItems: "center",
          zIndex: 1,
        }}
      >
        <HubRoundedIcon sx={{ fontSize: 32, color: TEAL }} />
      </Box>
      {nodes.map((n) => (
        <Paper
          key={n.label}
          elevation={0}
          sx={{
            position: "absolute",
            ...nodePosition(n, isRtl),
            zIndex: 2,
            px: 1.4,
            py: 1,
            borderRadius: 2,
            maxWidth: 150,
            bgcolor: alpha("#0B1220", 0.72),
            border: `1px solid ${alpha(n.color, 0.5)}`,
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: 12, lineHeight: 1.3, color: "#fff" }}>
            {n.label}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: alpha("#fff", 0.82), fontWeight: 600, fontSize: 10, display: "block" }}
          >
            {n.sub}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}

function DashboardMockup() {
  const { t } = useLanguage();
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        border: `1px solid ${alpha("#fff", 0.15)}`,
        boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
      }}
    >
      <Box sx={{ px: 2, py: 1.5, bgcolor: alpha("#fff", 0.08), display: "flex", gap: 0.75 }}>
        {["#EF4444", "#F59E0B", "#22C55E"].map((c) => (
          <Box key={c} sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: c }} />
        ))}
        <Typography variant="caption" sx={{ mr: 1, opacity: 0.7, fontWeight: 700 }}>
          dashboard
        </Typography>
      </Box>
      <Box sx={{ p: 2.5, bgcolor: "#F8FAFC", color: NAVY }}>
        <Grid container spacing={1.5}>
          {[
            { label: t("dashboard.projects"), val: "12", c: BLUE },
            { label: t("dashboard.tasks"), val: "48", c: TEAL },
            { label: t("dashboard.progress"), val: "67%", c: AMBER },
          ].map((s) => (
            <Grid item xs={4} key={s.label}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "white",
                  border: "1px solid #E2E8F0",
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  {s.label}
                </Typography>
                <Typography sx={{ fontWeight: 950, color: s.c, fontSize: 22 }}>
                  {s.val}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Stack spacing={1} sx={{ mt: 2 }}>
          {["مهمة جديدة في مشروع التخرج", "دعوة إشراف من فريق Web", "تعليق على الإصدار v2"].map(
            (t, i) => (
              <Box
                key={t}
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  bgcolor: "white",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: i === 0 ? BLUE : i === 1 ? TEAL : AMBER,
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 12 }}>
                  {t}
                </Typography>
              </Box>
            ),
          )}
        </Stack>
      </Box>
    </Paper>
  );
}

function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <Box sx={{ textAlign: "center", mb: 5, maxWidth: 640, mx: "auto" }}>
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: 13,
          color: BLUE,
          letterSpacing: 0.5,
          mb: 1,
        }}
      >
        {eyebrow}
      </Typography>
      <Typography
        variant="h4"
        sx={{ fontWeight: 950, color: NAVY, fontSize: { xs: "1.6rem", md: "2rem" } }}
      >
        {title}
      </Typography>
      <Typography
        color="text.secondary"
        sx={{ mt: 1.5, lineHeight: 1.85, fontWeight: 600 }}
      >
        {subtitle}
      </Typography>
    </Box>
  );
}

function RoleCard({ icon, color, role, points }) {
  return (
    <Grid item xs={12} md={4}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          height: "100%",
          borderRadius: 3,
          border: "1px solid #E2E8F0",
          transition: "all 0.25s",
          "&:hover": {
            borderColor: alpha(color, 0.5),
            boxShadow: `0 16px 40px ${alpha(color, 0.12)}`,
            transform: "translateY(-4px)",
          },
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: alpha(color, 0.12),
            color,
            display: "grid",
            placeItems: "center",
            mb: 2,
            "& svg": { fontSize: 26 },
          }}
        >
          {icon}
        </Box>
        <Typography sx={{ fontWeight: 950, fontSize: 20, color: NAVY, mb: 1.5 }}>
          {role}
        </Typography>
        <Stack spacing={1}>
          {points.map((p) => (
            <Stack key={p} direction="row" spacing={1} alignItems="flex-start">
              <CheckCircleRoundedIcon sx={{ fontSize: 18, color, mt: 0.2 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.7 }}>
                {p}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Paper>
    </Grid>
  );
}

function FeatureTile({ icon, title, desc, color }) {
  return (
    <Grid item xs={12} sm={6} md={4}>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          height: "100%",
          borderRadius: 3,
          border: "1px solid #E2E8F0",
          bgcolor: "#FAFBFC",
        }}
      >
        <Box sx={{ color, mb: 1.5, "& svg": { fontSize: 28 } }}>{icon}</Box>
        <Typography sx={{ fontWeight: 900, color: NAVY }}>{title}</Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.8, lineHeight: 1.75, fontWeight: 600 }}
        >
          {desc}
        </Typography>
      </Paper>
    </Grid>
  );
}

function TrustPill({ icon, text }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Box sx={{ color: TEAL, display: "flex", "& svg": { fontSize: 18 } }}>{icon}</Box>
      <Typography variant="body2" sx={{ fontWeight: 700, opacity: 0.9 }}>
        {text}
      </Typography>
    </Stack>
  );
}
