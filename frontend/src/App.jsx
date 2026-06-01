import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Notifications from "./pages/Notifications";
import ProjectDetails from "./pages/ProjectDetails";
import DashboardLayout from "./Layouts/DashboardLayout";
import { useAuth } from "./context/AuthContext";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import SupervisorInvitations from "./pages/SupervisorInvitations";
import StudentInvitations from "./pages/StudentInvitations";
import Profile from "./pages/Profile";
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App({ toggleMode, mode }) {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout toggleMode={toggleMode} mode={mode} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetails />} />
        <Route path="notifications" element={<Notifications />} />

        <Route
          path="supervisor/invitations"
          element={<SupervisorInvitations />}
        />
        <Route path="student/invitations" element={<StudentInvitations />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
