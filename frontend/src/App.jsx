import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Box, CircularProgress, Typography } from "@mui/material";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Notifications from "./pages/Notifications";
import ProjectDetails from "./pages/ProjectDetails";
import DashboardLayout from "./layouts/DashboardLayout";
import { useAuth } from "./context/AuthContext";
import { useLanguage } from "./context/LanguageContext";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import SupervisorInvitations from "./pages/SupervisorInvitations";
import StudentInvitations from "./pages/StudentInvitations";
import Profile from "./pages/Profile";
import CustomThemeProvider from "./context/ThemeContext";
import Users from "./pages/Users";
import PendingApproval from "./pages/PendingApproval";
import AccountBlocked from "./pages/AccountBlocked";
import Universities from "./pages/Universities";
import PlatformUsers from "./pages/PlatformUsers";
import PlatformProjects from "./pages/PlatformProjects";
import PlatformDashboard from "./pages/PlatformDashboard";
import ForgotPassword from "./pages/ForgotPassword";

function UsersPage() {
  const { isSuperAdmin, user } = useAuth();
  const roleName = String(user?.role?.name || user?.role || "").toLowerCase();
  if (!isSuperAdmin && roleName !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return isSuperAdmin ? <PlatformUsers /> : <Users />;
}

function ProjectsPage() {
  const { isSuperAdmin } = useAuth();
  return isSuperAdmin ? <PlatformProjects /> : <Projects />;
}

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

function SuperAdminRoute({ children }) {
  const { isSuperAdmin } = useAuth();
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function TenantRoute({ children }) {
  const { isSuperAdmin } = useAuth();
  if (isSuperAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function DashboardIndex() {
  const { isSuperAdmin } = useAuth();
  if (isSuperAdmin) return <PlatformDashboard />;
  return <Dashboard />;
}

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
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </CustomThemeProvider>
  );
}
