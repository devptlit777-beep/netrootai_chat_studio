import { Zap } from 'lucide-react';
import { usePlan } from '../contexts/PlanContext';
import { useTheme } from "../contexts/ThemeContext";
import { useNavigate } from 'react-router-dom';

export default function PlanBadge({ darkMode }) {
  const { plan, planName, loading } = usePlan();
  const navigate = useNavigate();

  if (loading) return null;

  if (plan === 'free') {
    return (
      <button
        onClick={() => navigate('/pricing')}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all hover:scale-105 bg-gradient-to-r from-blue-500/15 to-purple-500/15 border-blue-500/30 text-blue-400 hover:from-blue-500/25 hover:to-purple-500/25"
      >
        <Zap className="w-3 h-3" />
        Upgrade to Pro
      </button>
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
        plan === 'enterprise'
          ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
          : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
      }`}
    >
      <Zap className="w-3 h-3" />
      {planName}
    </div>
  );
}