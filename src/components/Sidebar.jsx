import {
  Home,
  MessageSquare,
  History,
  FolderOpen,
  Share2,
  Database,
  Puzzle,
  Settings,
  Sparkles,
  HelpCircle,
  Presentation,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { usePlan } from "../contexts/PlanContext";
import { useTranslation } from "react-i18next";

const navItems = [
  { icon: Home, path: "/dashboard", label: "Home" },
  { icon: MessageSquare, path: "/threads", label: "Threads" },
  { icon: History, path: "/history", label: "History" },
  { icon: FolderOpen, path: "/files", label: "Files" },
  { icon: Share2, path: "/shared", label: "Shared" },
  { icon: Database, path: "/plugins", label: "Plugins" },
  { icon: Sparkles, path: "/image-studio", label: "Image Studio" },
  { icon: Presentation, path: "/ppt-studio", label: "PPT Studio" },
];

function getFallbackAvatar(email) {
  const seed = email || "default";
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    seed
  )}&backgroundColor=3b82f6,06b6d4`;
}

export default function Sidebar() {
  const { t } = useTranslation();
  const { profile, user } = useAuth();
  const { theme } = useTheme();
  const { accessExpired, featureAccess, plan } = usePlan();
  const canUse = feature => {
    if (feature === 'ppt-studio') {
      return true; // Keep visible so user can click to upgrade via FeatureGate
    }
    return !accessExpired || Boolean(featureAccess?.[feature]);
  };

  const navigate = useNavigate();
  const location = useLocation();

  const darkMode = theme === "dark";

  const avatarUrl = profile?.avatar_url
    ? `${profile.avatar_url}?v=${profile.updated_at}`
    : getFallbackAvatar(user?.email);

  return (
    <div
      className={`w-[60px] min-h-screen border-r flex flex-col items-center py-3 fixed left-0 top-0 z-40 ${darkMode
        ? "bg-[#111111] border-[#222]"
        : "bg-white border-gray-200"
        }`}
    >
      {/* Logo */}
      <button
        onClick={() => navigate("/dashboard")}
        className="w-10 h-10 flex items-center justify-center mb-6 hover:scale-105 transition-transform"
      >
        <img
          src="/image.png"
          alt="NetrootAI"
          className="w-9 h-9 object-contain"
        />
      </button>

      {/* Navigation */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {navItems.filter(({ path }) => path === "/dashboard" || canUse(path === "/threads" ? "threads" : path === "/files" ? "files" : path === "/plugins" ? "plugins" : path === "/image-studio" ? "image-studio" : path === "/ppt-studio" ? "ppt-studio" : "none")).map(({ icon: Icon, path, label }) => {
          const active = location.pathname === path;

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              title={label}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${active
                ? darkMode
                  ? "bg-white/10 text-white"
                  : "bg-blue-50 text-blue-600"
                : darkMode
                  ? "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                }`}
            >
              <Icon className="w-5 h-5" />
              {path === "/ppt-studio" && plan === 'free' && !featureAccess?.['ppt-studio'] && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 shadow-sm" title="Pro Feature" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col items-center gap-2 mt-auto">
        <button
          onClick={() => navigate("/help")}
          title={t("sidebar.docsHelp")}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${location.pathname === "/help"
            ? darkMode
              ? "bg-white/10 text-white"
              : "bg-blue-50 text-blue-600"
            : darkMode
              ? "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {canUse("project-settings") && <button
          onClick={() => navigate("/project-settings")}
          title={t("sidebar.projectSettings")}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${location.pathname === "/project-settings"
            ? darkMode
              ? "bg-white/10 text-white"
              : "bg-blue-50 text-blue-600"
            : darkMode
              ? "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
        >
          <Settings className="w-5 h-5" />
        </button>}

        <img
          key={avatarUrl}
          src={avatarUrl}
          alt="avatar"
          onClick={() => { if (canUse("settings")) navigate("/settings"); }}
          className={`w-9 h-9 rounded-full object-cover border-2 cursor-pointer hover:border-[#3b82f6] transition-colors ${location.pathname === "/settings"
            ? "border-blue-500"
            : darkMode
              ? "border-[#333]"
              : "border-gray-200"
            }`}
        />
      </div>
    </div>
  );
}