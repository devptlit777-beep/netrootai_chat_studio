import { useState } from 'react';
import {
  Sparkles,
  Zap,
  Lock,
  CheckCircle2,
  X,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import API_BASE from '../../lib/api';

export default function ProUpgradeModal({
  isOpen,
  onClose,
  model,
  darkMode = true,
  onSelectFreeModel,
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const modelDisplayName = model?.display_name || model?.name || (typeof model === 'string' ? model : 'Frontier AI Model');
  const provider = model?.provider || 'Frontier Lab';

  async function handleCheckout() {
    if (!user?.email) {
      setError('Please sign in to upgrade your subscription.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          plan: 'pro',
          months: 1,
          autoRenew: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to start Stripe checkout. Please try again.');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Checkout URL not returned from server.');
      }
    } catch (err) {
      setError('Network error while connecting to payment gateway.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        onClick={e => e.stopPropagation()}
        className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all duration-200 animate-in zoom-in-95 ${darkMode
            ? 'bg-[#121214] border-[#2c2c34] text-white shadow-black/80'
            : 'bg-white border-gray-200 text-gray-900 shadow-2xl'
          }`}
      >
        {/* Glow Header Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        {/* Modal Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                    Pro Access Required
                  </span>
                </div>
                <h3 className="text-lg font-extrabold mt-1 leading-snug">
                  Unlock Frontier Intelligence
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl transition-colors ${darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Requested Model Highlight Box */}
          <div className={`mt-4 p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${darkMode ? 'bg-[#18181c] border-[#292932]' : 'bg-gray-50 border-gray-200'
            }`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 font-bold text-xs">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate text-white">{modelDisplayName}</div>
                <div className="text-[10px] text-gray-400 font-medium">{provider} • Frontier Series</div>
              </div>
            </div>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0">
              <Lock className="w-3 h-3" /> PRO ONLY
            </span>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="px-6 py-2 space-y-2.5">
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Upgrade to NetRoot Pro to chat with {modelDisplayName} and unleash the full frontier fleet:
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2.5 text-gray-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>460+ Frontier Models:</strong> Claude 3.5 Sonnet, GPT-4o, DeepSeek, Gemini 1.5 Pro</span>
            </div>
            <div className="flex items-center gap-2.5 text-gray-300">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span><strong>100,000 Daily Tokens:</strong> 10x higher capacity for serious workflows</span>
            </div>
            <div className="flex items-center gap-2.5 text-gray-300">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
              <span><strong>FLUX.1 AI Images:</strong> 10 high-resolution image generations/month</span>
            </div>
            <div className="flex items-center gap-2.5 text-gray-300">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span><strong>Agentic Plugins:</strong> Code runner, ArXiv, GitHub, Notion, PPT Studio</span>
            </div>
          </div>
        </div>

        {/* Error message if any */}
        {error && (
          <div className="mx-6 my-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Plan Pricing & Action Bar */}
        <div className={`p-6 pt-4 border-t mt-4 flex flex-col gap-3 ${darkMode ? 'bg-[#151518] border-[#26262a]' : 'bg-gray-50 border-gray-100'
          }`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Plan Pricing</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-white">$19</span>
                <span className="text-xs text-gray-400">/ month</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="py-2.5 px-5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting to Stripe...
                </>
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5" />
                  Upgrade to Pro Now
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Fallback to Free Models Option */}
          {onSelectFreeModel && (
            <div className="pt-2 border-t border-white/5 text-center">
              <button
                type="button"
                onClick={() => {
                  onSelectFreeModel();
                  onClose();
                }}
                className="text-[11px] text-gray-400 hover:text-white transition-colors"
              >
                Or continue with 100% Free models (DeepSeek V4.1, MiniMax Flash) →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
