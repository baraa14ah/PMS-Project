import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Chip,
  Divider,
  Grid,
} from "@mui/material";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";

// ✅ ضع شعارك هنا: src/assets/byte.png
import Logo from "../assets/byte.png";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Top bar */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          bgcolor: "rgba(247,248,250,0.78)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              py: 1.8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Stack direction="row" spacing={1.2} alignItems="center">
              {/* ✅ Logo */}
              <Box
                component="img"
                src={Logo}
                alt="ByteHub Logo"
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2.5,
                  objectFit: "cover",
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "black",
                }}
              />

              <Box>
                <Typography
                  sx={{
                    fontWeight: 900,
                    letterSpacing: 0.2,
                    lineHeight: 1.1,
                    fontSize: 16,
                  }}
                >
                  ByteHub
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", lineHeight: 1 }}
                >
                  Projects • Teams • Versions
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                onClick={() => navigate("/login")}
                variant="text"
                sx={{ fontWeight: 800 }}
              >
                تسجيل الدخول
              </Button>
              <Button
                onClick={() => navigate("/register")}
                variant="contained"
                color="primary"
                sx={{ fontWeight: 900, borderRadius: 2.2 }}
              >
                إنشاء حساب
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Hero background */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          py: { xs: 6, md: 10 },
        }}
      >
        {/* Decorative blobs */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.9,
            background:
              "radial-gradient(900px 500px at 15% 15%, rgba(37,99,235,0.18), transparent 60%), radial-gradient(800px 500px at 85% 25%, rgba(17,24,39,0.16), transparent 60%), radial-gradient(700px 500px at 50% 85%, rgba(37,99,235,0.10), transparent 60%)",
          }}
        />

        <Container maxWidth="lg" sx={{ position: "relative" }}>
          <Grid container spacing={4} alignItems="center">
            {/* Left */}
            <Grid item xs={12} md={6}>
              <Stack spacing={2.2}>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  <Chip
                    icon={<AutoAwesomeOutlinedIcon />}
                    label="Project Management Dashboard"
                    sx={{
                      bgcolor: "background.paper",
                      fontWeight: 800,
                    }}
                  />
                  <Chip
                    label="Students • Supervisors • Admin"
                    sx={{
                      bgcolor: "background.paper",
                      fontWeight: 800,
                    }}
                  />
                </Stack>

                <Typography
                  variant="h3"
                  sx={{
                    lineHeight: 1.08,
                    fontWeight: 950,
                    letterSpacing: -0.4,
                  }}
                >
                  منصة حديثة لإدارة المشاريع الجامعية{" "}
                  <Box component="span" sx={{ color: "secondary.main" }}>
                    بسرعة ووضوح
                  </Box>
                </Typography>

                <Typography
                  sx={{
                    color: "text.secondary",
                    fontSize: 16,
                    maxWidth: 560,
                    lineHeight: 1.9,
                    fontWeight: 600,
                  }}
                >
                  مهام، تعليقات، إصدارات، ودعوات للطلاب والمشرفين — كل شيء منظم
                  داخل كل مشروع، بتجربة تشبه أدوات الشركات.
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.3}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<RocketLaunchOutlinedIcon />}
                    onClick={() => navigate("/register")}
                    sx={{ fontWeight: 900, borderRadius: 2.2 }}
                  >
                    ابدأ الآن
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate("/login")}
                    sx={{
                      borderColor: "divider",
                      fontWeight: 900,
                      borderRadius: 2.2,
                    }}
                  >
                    لدي حساب
                  </Button>
                </Stack>

                {/* Quick stats */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.2,
                    borderRadius: 4,
                    mt: 1,
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                    gap: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
                >
                  <Stat title="Projects" value="Organized" />
                  <Stat title="Invitations" value="Smart Flow" />
                  <Stat title="Versions" value="Clean History" />
                </Paper>
              </Stack>
            </Grid>

            {/* Right: Preview */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 5,
                  overflow: "hidden",
                  boxShadow: "0 20px 70px rgba(0,0,0,0.10)",
                }}
              >
                <Box sx={{ p: 2, bgcolor: "primary.main", color: "white" }}>
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <Box
                      component="img"
                      src={Logo}
                      alt="ByteHub"
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: 2,
                        objectFit: "cover",
                        bgcolor: "rgba(255,255,255,0.18)",
                        border: "1px solid rgba(255,255,255,0.28)",
                      }}
                    />
                    <Box>
                      <Typography sx={{ fontWeight: 950, lineHeight: 1.1 }}>
                        Dashboard Preview
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.85 }}>
                        نفس الروح داخل النظام
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box sx={{ p: 2.2, bgcolor: "background.paper" }}>
                  <Stack spacing={1.4}>
                    <PreviewRow
                      icon={<TaskAltOutlinedIcon />}
                      title="Tasks"
                      desc="Progress • Status • Deadlines"
                    />
                    <Divider />
                    <PreviewRow
                      icon={<ForumOutlinedIcon />}
                      title="Comments"
                      desc="Edit • Delete • Per Project"
                    />
                    <Divider />
                    <PreviewRow
                      icon={<LayersOutlinedIcon />}
                      title="Versions"
                      desc="Upload • Timeline • Files"
                    />
                  </Stack>

                  <Box sx={{ mt: 2 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 4,
                        bgcolor: "background.default",
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography sx={{ fontWeight: 950 }}>UX Goal</Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          mt: 0.5,
                          lineHeight: 1.9,
                          fontWeight: 600,
                        }}
                      >
                        واجهة نظيفة + أيقونات + مسافات مريحة + Cards احترافية.
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Features section */}
          <Box sx={{ mt: { xs: 6, md: 9 } }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 950 }}>
              لماذا ByteHub
            </Typography>
            <Typography
              sx={{
                color: "text.secondary",
                mb: 3,
                fontWeight: 600,
                lineHeight: 1.9,
              }}
            >
              كل شيء مصمم ليخدم الطالب والمشرف بدون تعقيد.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FeatureCard
                  title="دعوات"
                  desc="دعوة مشرف أو طلاب مع قبول/رفض."
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FeatureCard
                  title="محتوى خاص"
                  desc="تعليقات وإصدارات تظهر فقط لأصحاب المشروع."
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FeatureCard
                  title="تتبّع واضح"
                  desc="تقدم المشروع مبني على حالة المهام."
                />
              </Grid>
            </Grid>
          </Box>

          {/* Bottom CTA */}
          <Paper
            elevation={0}
            sx={{
              mt: { xs: 6, md: 9 },
              p: { xs: 3, md: 4 },
              borderRadius: 5,
              bgcolor: "primary.main",
              color: "white",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                right: -120,
                top: -120,
                width: 320,
                height: 320,
                borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.08)",
              }}
            />
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 950 }}>
                  جاهز تبدأ؟
                </Typography>
                <Typography sx={{ opacity: 0.9, mt: 0.5, fontWeight: 600 }}>
                  أنشئ حساب طالب/مشرف وابدأ بإدارة مشاريعكم مباشرة.
                </Typography>
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={() => navigate("/register")}
                  sx={{ color: "white", fontWeight: 900, borderRadius: 2.2 }}
                >
                  إنشاء حساب
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/login")}
                  sx={{
                    borderColor: "rgba(255,255,255,0.35)",
                    color: "white",
                    fontWeight: 900,
                    borderRadius: 2.2,
                  }}
                >
                  تسجيل الدخول
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {/* Footer */}
          <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              © {new Date().getFullYear()} ByteHub — Modern UI with MUI Theme
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

function Stat({ title, value }) {
  return (
    <Box>
      <Typography
        sx={{ fontWeight: 950, color: "text.primary", letterSpacing: 0.2 }}
      >
        {value}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", fontWeight: 700 }}
      >
        {title}
      </Typography>
    </Box>
  );
}

function PreviewRow({ icon, title, desc }) {
  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: 3,
          display: "grid",
          placeItems: "center",
          bgcolor: "background.default",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 950 }}>{title}</Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", fontWeight: 600, lineHeight: 1.9 }}
        >
          {desc}
        </Typography>
      </Box>
    </Box>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.6,
        borderRadius: 4,
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Typography sx={{ fontWeight: 950 }}>{title}</Typography>
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          mt: 0.7,
          fontWeight: 600,
          lineHeight: 1.9,
        }}
      >
        {desc}
      </Typography>
    </Paper>
  );
}
