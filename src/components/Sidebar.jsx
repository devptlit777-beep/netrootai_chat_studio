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
  LayoutGrid,
  Cpu,
  Wand2,
  Map,
  Video,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { usePlan } from "../contexts/PlanContext";
import { useTranslation } from "react-i18next";

const navItems = [
  { icon: Home, path: "/dashboard", label: "Home" },
  { icon: Cpu, path: "/app/models", label: "AI Models & Compare" },
  { icon: LayoutGrid, path: "/workspace", label: "Developer Workspace" },
  { icon: MessageSquare, path: "/threads", label: "Threads" },
  { icon: History, path: "/history", label: "History" },
  { icon: FolderOpen, path: "/files", label: "Files" },
  { icon: Share2, path: "/shared", label: "Shared" },
  { icon: Database, path: "/plugins", label: "Plugins" },
  { icon: Sparkles, path: "/image-studio", label: "Image Studio" },
  { icon: Wand2, path: "/edit-studio", label: "AI Workflow Edit Studio" },
  { icon: Presentation, path: "/ppt-studio", label: "NetRoot AI PPT Studio" },
  { icon: Map, path: "/maps", label: "Maps" },
  // { icon: Video, path: "/webinars", label: "Webinars" },
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
    return !accessExpired || Boolean(featureAccess?.[feature]);
  };
  const featureByPath = {
    '/app/models': 'models',
    '/workspace': 'project-settings',
    '/threads': 'threads',
    '/files': 'files',
    '/plugins': 'plugins',
    '/image-studio': 'image-studio',
    '/edit-studio': 'image-studio',
    '/ppt-studio': 'ppt-studio',
    '/maps': 'maps',
    '/webinars': 'webinars',
  };

  const navigate = useNavigate();
  const location = useLocation();

  const darkMode = theme === "dark";

  const avatarUrl = profile?.avatar_url
    ? `${profile.avatar_url}?v=${profile.updated_at}`
    : getFallbackAvatar(user?.email);

  return (
    <div
      className={`fixed left-0 top-0 z-40 flex h-screen w-[60px] flex-col items-center border-r py-3 ${darkMode
        ? "bg-[#111111] border-[#222]"
        : "bg-white border-gray-200"
        }`}
    >
      {/* Logo */}
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-6 flex h-10 w-10 shrink-0 items-center justify-center transition-transform hover:scale-105"
      >
        <img
          src="/image.png"
          alt="NetrootAI"
          className="w-9 h-9 object-contain"
        />
      </button>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="flex flex-1 flex-col items-center gap-1">
        {navItems.filter(({ path }) => path === "/dashboard" || canUse(featureByPath[path])).map(({ icon: Icon, path, label }) => {
          const active = location.pathname === path || (path === '/app/models' && location.pathname.startsWith('/app/models')) || (path === "/webinars" && location.pathname.startsWith("/webinars/"));
          const itemLabel = path === "/maps" ? (t("sidebar.maps") || "Maps") : path === "/webinars" ? (t("sidebar.webinars") || "Webinars") : label;

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              title={itemLabel}
              aria-label={itemLabel}
              className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${active
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
      <div className="mt-auto flex flex-col items-center gap-2">
        <button
          onClick={() => navigate("/help")}
          title={t("sidebar.docsHelp")}
          aria-label={t("sidebar.docsHelp")}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${location.pathname === "/help"
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
          onClick={() => navigate("/workspace?tab=billing")}
          title={t("sidebar.projectSettings") || "Workspace & Settings"}
          aria-label={t("sidebar.projectSettings") || "Workspace & Settings"}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${location.pathname.startsWith("/workspace")
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
          onClick={() => navigate("/settings")}
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