import { useEffect, useState } from 'react';
import { Check, Zap, Star, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { usePlan } from '../contexts/PlanContext';
import { useAuth } from '../contexts/AuthContext';
import API_BASE from '../lib/api';
import { DEFAULT_PLAN_LIMITS, fetchPlanLimits } from '../lib/planLimits';

const PRO_PLAN = {
    name: 'NetRoot AI Pro',
    description: 'For power users who need more.',
    price: 19,
    currencySymbol: '$',
};

export default function PricingPage() {
    const { theme } = useTheme();
    const darkMode = theme === 'dark';
    const { plan } = usePlan();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [planLimits, setPlanLimits] = useState(DEFAULT_PLAN_LIMITS);

    useEffect(() => {
        let cancelled = false;
        fetchPlanLimits().then((limits) => {
            if (!cancelled) setPlanLimits(limits);
        }).catch(() => { });
        return () => { cancelled = true; };
    }, []);

    const isCurrentPlan = plan === 'pro' || plan === 'enterprise';
    const freeLimit = planLimits.free?.dailyTokenLimit || DEFAULT_PLAN_LIMITS.free.dailyTokenLimit;
    const freeModelsCount = planLimits.free?.allowedModels?.length || DEFAULT_PLAN_LIMITS.free.allowedModels.length;
    const proLimit = planLimits.pro?.dailyTokenLimit || DEFAULT_PLAN_LIMITS.pro.dailyTokenLimit;
    const proModelsCount = planLimits.pro?.allowedModels?.length || DEFAULT_PLAN_LIMITS.pro.allowedModels.length;
    const proFeatures = [
        `${proLimit.toLocaleString()} tokens / day`,
        `${proModelsCount} model${proModelsCount === 1 ? '' : 's'} available`,
        'All plugins + priority queue',
        'Email support',
        'Usage analytics',
    ];
    const freeFeatures = [
        `${freeLimit.toLocaleString()} tokens / day`,
        `${freeModelsCount} model${freeModelsCount === 1 ? '' : 's'} available`,
        'Basic plugins',
        'Community support',
    ];

    async function handleUpgrade() {
        if (!user?.email) return;
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/create-checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, plan: 'pro' }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Failed to start checkout.'); return; }
            window.location.href = data.url;
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-[#0e0e0e]' : 'bg-gray-50'}`}>
            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="text-center mb-14">
                    <h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Simple, transparent pricing
                    </h1>
                    <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Start free, upgrade when you need more power.
                    </p>
                </div>

                {error && (
                    <div className={`max-w-2xl mx-auto mb-6 px-4 py-3 rounded-xl text-sm font-medium text-center ${darkMode ? 'bg-red-500/10 border border-red-500/25 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                        {error}
                    </div>
                )}

                <div className={`max-w-2xl mx-auto mb-6 rounded-2xl border px-5 py-4 ${darkMode ? 'border-[#2a2a2a] bg-[#141414]' : 'border-gray-200 bg-white'}`}>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Plan limits at a glance</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className={`rounded-xl border p-3 ${darkMode ? 'border-[#2a2a2a] bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'}`}>
                            <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Free</p>
                            <p className={`mt-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{freeLimit.toLocaleString()} tokens/day • {freeModelsCount} model{freeModelsCount === 1 ? '' : 's'}</p>
                        </div>
                        <div className={`rounded-xl border p-3 ${darkMode ? 'border-blue-500/30 bg-blue-500/10' : 'border-blue-200 bg-blue-50'}`}>
                            <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Pro</p>
                            <p className={`mt-1 text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{proLimit.toLocaleString()} tokens/day • {proModelsCount} model{proModelsCount === 1 ? '' : 's'}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <div className={`border rounded-2xl p-8 flex flex-col ${darkMode ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
                        <div className="mb-6">
                            <h2 className={`text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Free</h2>
                            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Get started at no cost</p>
                        </div>
                        <div className="mb-6">
                            <span className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>$0</span>
                            <span className={`text-sm ml-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>/month</span>
                        </div>
                        <ul className="space-y-3 mb-8 flex-1">
                            {freeFeatures.map((f) => (
                                <li key={f} className="flex items-center gap-2.5">
                                    <Check className={`w-4 h-4 shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{f}</span>
                                </li>
                            ))}
                        </ul>
                        <div className={`text-center py-2.5 rounded-xl text-sm font-medium border ${plan === 'free'
                            ? darkMode ? 'border-[#3a3a3a] text-gray-400 bg-[#1e1e1e]' : 'border-gray-300 text-gray-500 bg-gray-50'
                            : darkMode ? 'border-[#2a2a2a] text-gray-500' : 'border-gray-200 text-gray-400'
                            }`}>
                            {plan === 'free' ? 'Current plan' : 'Free forever'}
                        </div>
                    </div>

                    <div className={`border-2 rounded-2xl p-8 flex flex-col relative overflow-hidden ${darkMode ? 'bg-[#141414] border-blue-500/50' : 'bg-white border-blue-500'}`}>
                        <div className="absolute top-4 right-4">
                            <span className="flex items-center gap-1 text-xs font-semibold bg-blue-500 text-white px-2.5 py-1 rounded-full">
                                <Star className="w-3 h-3" />
                                Popular
                            </span>
                        </div>
                        <div className="mb-6">
                            <h2 className={`text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{PRO_PLAN.name}</h2>
                            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{PRO_PLAN.description}</p>
                        </div>
                        <div className="mb-6">
                            <span className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {PRO_PLAN.currencySymbol}{PRO_PLAN.price}
                            </span>
                            <span className={`text-sm ml-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>/month</span>
                        </div>
                        <ul className="space-y-3 mb-8 flex-1">
                            {proFeatures.map((f) => (
                                <li key={f} className="flex items-center gap-2.5">
                                    <Check className="w-4 h-4 shrink-0 text-blue-400" />
                                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{f}</span>
                                </li>
                            ))}
                        </ul>
                        {isCurrentPlan ? (
                            <div className={`text-center py-2.5 rounded-xl text-sm font-medium border ${darkMode ? 'border-blue-500/40 text-blue-400 bg-blue-500/10' : 'border-blue-300 text-blue-600 bg-blue-50'}`}>
                                ✓ Current plan
                            </div>
                        ) : (
                            <button
                                onClick={handleUpgrade}
                                disabled={loading}
                                className="flex items-center justify-center gap-2 w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-70 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
                            >
                                {loading
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
                                    : <><Zap className="w-4 h-4" /> Upgrade to Pro</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
