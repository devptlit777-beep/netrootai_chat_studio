import { useEffect, useState } from 'react';
import { Check, Zap, Star, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { usePlan } from '../contexts/PlanContext';
import { useAuth } from '../contexts/AuthContext';
import API_BASE from '../lib/api';
import { DEFAULT_PLAN_LIMITS, fetchPlanLimits, getModelImageLimit } from '../lib/planLimits';
import { useTranslation } from 'react-i18next';

const PRO_PLAN = {
    name: 'NetRoot AI Pro',
    description: 'For power users who need more.',
    price: 19,
    currencySymbol: '$',
};

export default function PricingPage() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const darkMode = theme === 'dark';
    const { plan } = usePlan();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [planLimits, setPlanLimits] = useState(DEFAULT_PLAN_LIMITS);
    const [months, setMonths] = useState(1);
    const [autoRenewChoice, setAutoRenewChoice] = useState(true);

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
    const fluxImageLimit = getModelImageLimit('pro', 'black-forest-labs/FLUX.1-schnell');
    const proFeatures = [
<<<<<<< HEAD
        t('plans.tokensPerDay', { count: proLimit.toLocaleString() }),
        t('plans.modelsAvailable', { count: proModelsCount }),
        t('plans.fluxImages', { count: fluxImageLimit }),
        t('plans.allPlugins'),
        t('plans.emailSupport'),
        t('plans.usageAnalytics'),
    ];
    const freeFeatures = [
        t('plans.tokensPerDay', { count: freeLimit.toLocaleString() }),
        t('plans.modelsAvailable', { count: freeModelsCount }),
        t('plans.basicPlugins'),
        t('plans.communitySupport'),
=======
        `${proLimit.toLocaleString()} tokens / day`,
        `${proModelsCount} model${proModelsCount === 1 ? '' : 's'} available`,
        `FLUX image generation: ${fluxImageLimit} images / month`,
        'Unlimited AI presentations & edits',
        'All plugins + priority queue',
        'Email support',
        'Usage analytics',
    ];
    const freeFeatures = [
        `${freeLimit.toLocaleString()} tokens / day`,
        `${freeModelsCount} model${freeModelsCount === 1 ? '' : 's'} available`,
        '2 AI presentations lifetime',
        'Basic plugins',
        'Community support',
>>>>>>> 806306b7a37e545d96f582656b0a5eb47c8d972a
    ];

    async function handleUpgrade() {
        if (!user?.email) return;
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/create-checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, plan: 'pro', months, autoRenew: autoRenewChoice }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || t('plans.failureStartCheckout')); return; }
            window.location.href = data.url;
        } catch {
            setError(t('plans.networkError'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-[#0e0e0e]' : 'bg-gray-50'}`}>
            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="text-center mb-14">
                    <h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {t('plans.heading')}
                    </h1>
                    <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('plans.subtitle')}
                    </p>
                </div>

                {error && (
                    <div className={`max-w-2xl mx-auto mb-6 px-4 py-3 rounded-xl text-sm font-medium text-center ${darkMode ? 'bg-red-500/10 border border-red-500/25 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                        {error}
                    </div>
                )}

                <div className={`max-w-2xl mx-auto mb-6 rounded-2xl border px-5 py-4 ${darkMode ? 'border-[#2a2a2a] bg-[#141414]' : 'border-gray-200 bg-white'}`}>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('plans.chooseDuration')}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {[1, 2, 3, 6, 12].map(value => <button key={value} type="button" onClick={() => setMonths(value)} className={`px-3 py-2 rounded-lg text-sm font-semibold border ${months === value ? 'bg-blue-600 border-blue-500 text-white' : darkMode ? 'border-[#333] text-gray-400 hover:text-white' : 'border-gray-200 text-gray-600'}`}>{value} {t(value === 1 ? 'common.month' : 'common.months')}</button>)}
                    </div>
                    <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>${(19 * months).toFixed(2)} is billed every {months} month{months === 1 ? '' : 's'} until cancelled.</p>
                    <label className={`mt-3 flex items-center gap-2 text-xs cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}><input type="checkbox" checked={autoRenewChoice} onChange={event => setAutoRenewChoice(event.target.checked)} className="accent-blue-600" /> {t('plans.autoRenew')}</label>
                </div>

                <div className={`max-w-2xl mx-auto mb-6 rounded-2xl border px-5 py-4 ${darkMode ? 'border-[#2a2a2a] bg-[#141414]' : 'border-gray-200 bg-white'}`}>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('plans.limits')}</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className={`rounded-xl border p-3 ${darkMode ? 'border-[#2a2a2a] bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'}`}>
                            <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('common.free')}</p>
                            <p className={`mt-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{freeLimit.toLocaleString()} tokens/day • {freeModelsCount} model{freeModelsCount === 1 ? '' : 's'}</p>
                        </div>
                        <div className={`rounded-xl border p-3 ${darkMode ? 'border-blue-500/30 bg-blue-500/10' : 'border-blue-200 bg-blue-50'}`}>
                            <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{t('common.pro')}</p>
                            <p className={`mt-1 text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{proLimit.toLocaleString()} tokens/day • {proModelsCount} model{proModelsCount === 1 ? '' : 's'} • FLUX: {fluxImageLimit} images/month</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <div className={`border rounded-2xl p-8 flex flex-col ${darkMode ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
                        <div className="mb-6">
                            <h2 className={`text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('common.free')}</h2>
                            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{t('plans.freeStart')}</p>
                        </div>
                        <div className="mb-6">
                            <span className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>$0</span>
                            <span className={`text-sm ml-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{t('plans.perMonth')}</span>
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
                            {plan === 'free' ? t('plans.currentPlan') : t('plans.freeForever')}
                        </div>
                    </div>

                    <div className={`border-2 rounded-2xl p-8 flex flex-col relative overflow-hidden ${darkMode ? 'bg-[#141414] border-blue-500/50' : 'bg-white border-blue-500'}`}>
                        <div className="absolute top-4 right-4">
                            <span className="flex items-center gap-1 text-xs font-semibold bg-blue-500 text-white px-2.5 py-1 rounded-full">
                                <Star className="w-3 h-3" />
                                {t('plans.popular')}
                            </span>
                        </div>
                        <div className="mb-6">
                            <h2 className={`text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{PRO_PLAN.name}</h2>
                            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{t('plans.proDescription')}</p>
                        </div>
                        <div className="mb-6">
                            <span className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {PRO_PLAN.currencySymbol}{PRO_PLAN.price}
                            </span>
                            <span className={`text-sm ml-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{t('plans.perMonth')}</span>
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
                                ✓ {t('plans.currentPlan')}
                            </div>
                        ) : (
                            <button
                                onClick={handleUpgrade}
                                disabled={loading}
                                className="flex items-center justify-center gap-2 w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-70 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
                            >
                                {loading
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('plans.redirecting')}</>
                                    : <><Zap className="w-4 h-4" /> Upgrade to Pro</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
