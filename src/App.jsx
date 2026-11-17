import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { usePlan } from "./contexts/PlanContext";

import AdminPage from "./pages/AdminPage";
import AdminUserPage from "./pages/AdminUserPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import ProjectSettingsPage from "./pages/ProjectSettingsPage";
import ModelsPage from "./pages/ModelsPage";
import StoragePage from "./pages/StoragePage";
import PluginsPage from "./pages/PluginsPage";
import ImageStudioPage from "./pages/ImageStudioPage";
import EditStudioPage from "./pages/EditStudioPage";
import PptStudioPage from "./pages/PptStudioPage";
import WorkspacePage from "./pages/WorkspacePage";
import ResetPassword from "./pages/ResetPassword";
import ThreadsPage from "./pages/ThreadsPage";
import HelpPage from "./pages/HelpPage";
import PricingPage from './pages/PricingPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import { PlanProvider } from "./contexts/PlanContext";
import Sidebar from "./components/Sidebar";
import { useTranslation } from "react-i18next";

// ── Landing & Showcase Portal (ChatBix) ──
import LandingLayout from "./landing/LandingLayout";
import HomePage from "./landing/pages/HomePage";
import TrialChatPage from "./landing/pages/TrialChatPage";
import DocsPage from "./landing/pages/DocsPage";
import AboutUsPage from "./landing/pages/AboutUsPage";
import DevelopersPage from "./landing/pages/DevelopersPage";
import VideoStudioPage from "./landing/pages/VideoStudioPage";
import LandingPricingPage from "./landing/pages/PricingPage";
import LandingModelsPage from "./landing/pages/ModelsPage";
import LandingPptStudioPage from "./landing/pages/PptStudioPage";
import LandingImageStudioPage from "./landing/pages/ImageStudioPage";

function ProjectSettingsRedirect() {
  const [searchParams] = useSearchParams();
  const q = searchParams.toString();
  return <Navigate to={`/workspace${q ? `?${q}` : '?tab=billing'}`} replace />;
}

function UpgradeRequired({ darkMode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen flex items-center justify-center px-6 ${darkMode ? "bg-[#0e0e0e] text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className={`w-full max-w-md rounded-2xl border p-8 text-center ${darkMode ? "bg-[#111] border-[#2a2a2a]" : "bg-white border-gray-200"}`}>
        <h1 className="text-xl font-bold">{t("dashboard.upgrade")}</h1>
        <p className={`mt-3 text-sm leading-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Your one-month access period has ended. Chat remains available on the Free plan, but this feature requires an active Pro plan.
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

          {/* Models Hub */}
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/app/models" element={<ModelsPage />} />

          {/* Pricing */}
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/app/pricing" element={<PricingPage />} />

          <Route path="/checkout/success" element={<CheckoutSuccessPage />} />

          <Route path="/threads" element={<FeatureGate darkMode={darkMode} feature="threads"><ThreadsPage /></FeatureGate>} />

          <Route path="/help" element={<HelpPage />} />

          <Route path="/settings" element={<FeatureGate darkMode={darkMode} feature="settings"><SettingsPage /></FeatureGate>} />

          <Route
            path="/project-settings"
            element={<ProjectSettingsRedirect />}
          />

          <Route path="/files" element={<FeatureGate darkMode={darkMode} feature="files"><StoragePage /></FeatureGate>} />

          <Route path="/plugins" element={<FeatureGate darkMode={darkMode} feature="plugins"><PluginsPage /></FeatureGate>} />

          <Route path="/image-studio" element={<FeatureGate darkMode={darkMode} feature="image-studio"><ImageStudioPage /></FeatureGate>} />

          <Route path="/edit-studio" element={<EditStudioPage />} />
          <Route path="/app/edit-studio" element={<EditStudioPage />} />

          <Route path="/ppt-studio" element={<FeatureGate darkMode={darkMode} feature="ppt-studio"><PptStudioPage /></FeatureGate>} />

          <Route path="/workspace" element={<WorkspacePage />} />

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
      {/* ── Public Landing & Showcase Portal (ChatBix) ── */}
      <Route path="/" element={<LandingLayout><HomePage /></LandingLayout>} />
      <Route path="/chat" element={<LandingLayout><TrialChatPage /></LandingLayout>} />
      <Route path="/trial-chat" element={<LandingLayout><TrialChatPage /></LandingLayout>} />
      <Route path="/docs" element={<LandingLayout><DocsPage /></LandingLayout>} />
      <Route path="/about" element={<LandingLayout><AboutUsPage /></LandingLayout>} />
      <Route path="/about-us" element={<LandingLayout><AboutUsPage /></LandingLayout>} />
      <Route path="/developers" element={<LandingLayout><DevelopersPage /></LandingLayout>} />
      <Route path="/video-studio" element={<LandingLayout><VideoStudioPage /></LandingLayout>} />
      <Route path="/showcase/ppt" element={<LandingLayout><LandingPptStudioPage /></LandingLayout>} />
      <Route path="/showcase/image" element={<LandingLayout><LandingImageStudioPage /></LandingLayout>} />

      {/* Models Fleet & Pricing Showcases (Always viewable on landing for all visitors) */}
      <Route path="/models" element={<LandingLayout><LandingModelsPage /></LandingLayout>} />
      <Route path="/pricing" element={<LandingLayout><LandingPricingPage /></LandingLayout>} />
      <Route path="/help" element={<LandingLayout><DocsPage /></LandingLayout>} />

      {/* ── Auth System ── */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/user/:email" element={<AdminUserPage />} />
      <Route path="/reset" element={<ResetPassword />} />

      {/* ── Authenticated SaaS Studio App ── */}
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