import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import ProjectSettingsPage from "./pages/ProjectSettingsPage";
import StoragePage from "./pages/StoragePage";
import PluginsPage from "./pages/PluginsPage";
import ResetPassword from "./pages/ResetPassword";
import ThreadsPage from "./pages/ThreadsPage";
import PricingPage from './pages/PricingPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import { PlanProvider } from "./contexts/PlanContext";
import Sidebar from "./components/Sidebar";

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const darkMode = theme === "dark";

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-[#0e0e0e]" : "bg-gray-100"
          }`}
      >
        <div
          className={`w-8 h-8 border-2 ${darkMode ? "border-[#3b82f6]" : "border-blue-500"
            } border-t-transparent rounded-full animate-spin`}
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      className={`flex min-h-screen ${darkMode ? "bg-[#0e0e0e]" : "bg-gray-50"
        }`}
    >
      <Sidebar />

      <div className="flex-1 ml-[60px]">
        <Routes>
          <Route
            path="/dashboard"
            element={
              <DashboardPage
                darkMode={darkMode}
                onToggleDark={toggleTheme}
              />
            }
          />

          <Route
            path="/dashboard/:threadId"
            element={
              <DashboardPage
                darkMode={darkMode}
                onToggleDark={toggleTheme}
              />
            }
          />

          {/* Pricing */}
          <Route path="/pricing" element={<PricingPage />} />

          <Route path="/checkout/success" element={<CheckoutSuccessPage />} />

          <Route path="/threads" element={<ThreadsPage />} />

          <Route path="/settings" element={<SettingsPage />} />

          <Route
            path="/project-settings"
            element={<ProjectSettingsPage />}
          />

          <Route path="/files" element={<StoragePage />} />

          <Route path="/plugins" element={<PluginsPage />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function AuthRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      <Route path="/reset" element={<ResetPassword />} />

      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <PlanProvider>
            <AuthRoutes />
          </PlanProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}