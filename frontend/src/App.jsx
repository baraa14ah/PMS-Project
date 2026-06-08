import React, { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Box, CircularProgress, Typography } from "@mui/material";
import DashboardLayout from "./layouts/DashboardLayout";
import { useAuth } from "./context/AuthContext";
import { useLanguage } from "./context/LanguageContext";
import CustomThemeProvider from "./context/ThemeContext";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Projects = lazy(() => import("./pages/Projects"));
const Notifications = lazy(() => import("./pages/Notifications"));
const ProjectDetails = lazy(() => import("./pages/ProjectDetails"));
const SupervisorInvitations = lazy(() => import("./pages/SupervisorInvitations"));
const StudentInvitations = lazy(() => import("./pages/StudentInvitations"));
const Profile = lazy(() => import("./pages/Profile"));
const Users = lazy(() => import("./pages/Users"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const AccountBlocked = lazy(() => import("./pages/AccountBlocked"));
const Universities = lazy(() => import("./pages/Universities"));
const PlatformUsers = lazy(() => import("./pages/PlatformUsers"));
const PlatformProjects = lazy(() => import("./pages/PlatformProjects"));
const PlatformDashboard = lazy(() => import("./pages/PlatformDashboard"));
const ProjectIdeation = lazy(() => import("./pages/ProjectIdeation"));

/** Routes admins to tenant Users and super admins to PlatformUsers. */
function UsersPage() {
  const { isSuperAdmin, user } = useAuth();
  const roleName = String(user?.role?.name || user?.role || "").toLowerCase();
  if (!isSuperAdmin && roleName !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return isSuperAdmin ? <PlatformUsers /> : <Users />;
}

/** Routes super admins to PlatformProjects; others to tenant Projects. */
function ProjectsPage() {
  const { isSuperAdmin } = useAuth();
  return isSuperAdmin ? <PlatformProjects /> : <Projects />;
}

/** Full-screen spinner shown while the user profile loads. */
function LoadingScreen() {
  const { t } = useLanguage();
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <CircularProgress />
      <Typography sx={{ mt: 2, fontWeight: 700, color: "text.secondary" }}>
        {t("common.loading")}
      </Typography>
    </Box>
  );
}

/** Guards dashboard routes behind auth, status, and session checks. */
function ProtectedRoute({ children }) {
  const { isAuthenticated, status, loadingProfile, sessionBlock } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (loadingProfile) return <LoadingScreen />;

  if (sessionBlock === "no_university") {
    return <AccountBlocked />;
  }

  if (status === "pending" || status === "rejected") {
    return <PendingApproval />;
  }

  if (!status || status !== "active") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/** Restricts a route to platform super admins only. */
function SuperAdminRoute({ children }) {
  const { isSuperAdmin } = useAuth();
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

/** Blocks super admins from tenant-only screens. */
function TenantRoute({ children }) {
  const { isSuperAdmin } = useAuth();
  if (isSuperAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

/** Restricts a route to students only. */
function StudentRoute({ children }) {
  const { role } = useAuth();
  if (role !== "student") return <Navigate to="/dashboard" replace />;
  return children;
}

/** Picks the dashboard home view based on the user role. */
function DashboardIndex() {
  const { isSuperAdmin } = useAuth();
  if (isSuperAdmin) return <PlatformDashboard />;
  return <Dashboard />;
}

/** Root router: public auth pages and protected dashboard routes. */
export default function App() {
  return (
    <CustomThemeProvider>
      <Toaster position="top-center" reverseOrder={false} />

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<Navigate to="/forgot-password" replace />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardIndex />} />
          <Route
            path="universities"
            element={
              <SuperAdminRoute>
                <Universities />
              </SuperAdminRoute>
            }
          />
          <Route
            path="profile"
            element={
              <TenantRoute>
                <Profile />
              </TenantRoute>
            }
          />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="users" element={<UsersPage />} />
          <Route
            path="supervisor/invitations"
            element={
              <TenantRoute>
                <SupervisorInvitations />
              </TenantRoute>
            }
          />
          <Route
            path="student/invitations"
            element={
              <TenantRoute>
                <StudentInvitations />
              </TenantRoute>
            }
          />
          <Route
            path="ideation"
            element={
              <TenantRoute>
                <StudentRoute>
                  <ProjectIdeation />
                </StudentRoute>
              </TenantRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </CustomThemeProvider>
  );
}
