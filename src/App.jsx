import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { usePlan } from "./contexts/PlanContext";

import AdminPage from "./pages/AdminPage";
import AdminUserPage from "./pages/AdminUserPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import ProjectSettingsPage from "./pages/ProjectSettingsPage";
import StoragePage from "./pages/StoragePage";
import PluginsPage from "./pages/PluginsPage";
import ImageStudioPage from "./pages/ImageStudioPage";
import PptStudioPage from "./pages/PptStudioPage";
import ResetPassword from "./pages/ResetPassword";
import ThreadsPage from "./pages/ThreadsPage";
import HelpPage from "./pages/HelpPage";
import PricingPage from './pages/PricingPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import { PlanProvider } from "./contexts/PlanContext";
import Sidebar from "./components/Sidebar";
import { useTranslation } from "react-i18next";

function UpgradeRequired({ darkMode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen flex items-center justify-center px-6 ${darkMode ? "bg-[#0e0e0e] text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className={`w-full max-w-md rounded-2xl border p-8 text-center ${darkMode ? "bg-[#111] border-[#2a2a2a]" : "bg-white border-gray-200"}`}>
        <h1 className="text-xl font-bold">{t("dashboard.upgrade")}</h1>
        <p className={`mt-3 text-sm leading-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          {t("dashboard.featureRequiresPro")}
        </p>
        <button onClick={() => navigate("/pricing")} className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
          Upgrade to Pro
        </button>
      </div>
    </div>
  );
}

function FeatureGate({ children, darkMode, feature }) {
  const { accessExpired, featureAccess, loading } = usePlan();
  if (loading) return null;
  return accessExpired && !featureAccess?.[feature] ? <UpgradeRequired darkMode={darkMode} /> : children;
}

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

          <Route path="/threads" element={<FeatureGate darkMode={darkMode} feature="threads"><ThreadsPage /></FeatureGate>} />

          <Route path="/help" element={<HelpPage />} />

          <Route path="/settings" element={<FeatureGate darkMode={darkMode} feature="settings"><SettingsPage /></FeatureGate>} />

          <Route
            path="/project-settings"
            element={<FeatureGate darkMode={darkMode} feature="project-settings"><ProjectSettingsPage /></FeatureGate>}
          />

          <Route path="/files" element={<FeatureGate darkMode={darkMode} feature="files"><StoragePage /></FeatureGate>} />

          <Route path="/plugins" element={<FeatureGate darkMode={darkMode} feature="plugins"><PluginsPage /></FeatureGate>} />

          <Route path="/image-studio" element={<FeatureGate darkMode={darkMode} feature="image-studio"><ImageStudioPage /></FeatureGate>} />

          <Route path="/ppt-studio" element={<FeatureGate darkMode={darkMode} feature="ppt-studio"><PptStudioPage /></FeatureGate>} />

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
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      <Route path="/admin" element={<AdminPage />} />

      <Route path="/admin/user/:email" element={<AdminUserPage />} />

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