import { useEffect, useState } from 'react';
import { Loader2, Check, Zap, Star, Shield } from 'lucide-react';
import { usePlan } from '../contexts/PlanContext';
import { useAuth } from '../contexts/AuthContext';
import API_BASE from '../lib/api';
import { DEFAULT_PLAN_LIMITS, fetchPlanLimits, getModelImageLimit } from '../lib/planLimits';
import { useTranslation } from 'react-i18next';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    color: 'gray',
    icon: Shield,
    features: [
      '10,000 tokens / day',
      '3 models available',
      'Basic plugins',
      'token dashboard',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    period: 'per month',
    color: 'blue',
    icon: Star,
    badge: 'Most popular',
    features: [
      '100,000 tokens / day',
      '6 models available',
      '10 images generated per month with FLUX',
      'All plugins + priority queue',
      'Email support',
      'Usage analytics',
    ],
    cta: 'Upgrade to Pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    color: 'purple',
    icon: Zap,
    features: [
      'Unlimited tokens (no daily cap)',
      'All models + early access',
      'Custom plugins & integrations',
      'Dedicated support + SLA',
      'Team seats & SSO',
    ],
    cta: 'Contact Sales',
  },
];

export default function Billing({ darkMode }) {
  const { t } = useTranslation();
  const { plan, refresh, autoRenew, planEndDate } = usePlan();
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState('');
  const [downgradeMessage, setDowngradeMessage] = useState('');
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

  const freeLimit = planLimits.free?.dailyTokenLimit || DEFAULT_PLAN_LIMITS.free.dailyTokenLimit;
  const freeModelsCount = planLimits.free?.allowedModels?.length || DEFAULT_PLAN_LIMITS.free.allowedModels.length;
  const proLimit = planLimits.pro?.dailyTokenLimit || DEFAULT_PLAN_LIMITS.pro.dailyTokenLimit;
  const proModelsCount = planLimits.pro?.allowedModels?.length || DEFAULT_PLAN_LIMITS.pro.allowedModels.length;
  const fluxImageLimit = getModelImageLimit('pro', 'black-forest-labs/FLUX.1-schnell');

  async function handleUpgrade(planId) {
    if (!user?.email) return;
    setError('');
    setDowngradeMessage('');
    setLoadingPlan(planId);
    try {
      const res = await fetch(`${API_BASE}/api/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, plan: planId, months, autoRenew: autoRenewChoice }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t('billing.failedCheckout')); return; }
      window.location.href = data.url;
    } catch {
      setError(t('billing.networkError'));
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handleDowngrade() {
    if (!user?.email) return;
    setError('');
    setLoadingPlan('free');
    try {
      const res = await fetch(`${API_BASE}/api/cancel-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t('billing.failedDowngrade')); return; }
      await refresh();
      const endDate = data.current_period_end ? new Date(data.current_period_end).toLocaleDateString() : null;
      setDowngradeMessage(data.cancel_at_period_end
        ? t('billing.noRenewal', { date: endDate || t('billing.billingPeriodEnd') })
        : t('billing.changedToFree'));
    } catch {
      setError(t('billing.networkError'));
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {error && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${darkMode ? 'bg-red-500/10 border border-red-500/25 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {error}
        </div>
      )}
      {downgradeMessage && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${darkMode ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>{downgradeMessage}</div>
      )}

      {/* Current plan banner */}
      <div className={`flex items-center justify-between border rounded-xl px-6 py-4 ${plan === 'enterprise' ? darkMode ? 'border-purple-500/30 bg-purple-500/5' : 'border-purple-200 bg-purple-50'
        : plan === 'pro' ? darkMode ? 'border-blue-500/30 bg-blue-500/5' : 'border-blue-200 bg-blue-50'
          : darkMode ? 'border-[#2a2a2a] bg-[#161616]' : 'border-gray-200 bg-gray-50'
        }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${plan === 'enterprise' ? 'bg-purple-500/20' : plan === 'pro' ? 'bg-blue-500/20' : darkMode ? 'bg-[#222]' : 'bg-gray-200'
            }`}>
            {plan === 'enterprise' ? <Zap className="w-4 h-4 text-purple-400" />
              : plan === 'pro' ? <Star className="w-4 h-4 text-blue-400" />
                : <Shield className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />}
          </div>
          <div>
            <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('billing.youAreOnPlan', { plan: t(`common.${plan}`, { defaultValue: plan.charAt(0).toUpperCase() + plan.slice(1) }) })}
            </p>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {plan === 'free' ? t('billing.freePlanDescription', { tokens: proLimit.toLocaleString(), models: proModelsCount, images: fluxImageLimit })
                : plan === 'pro' ? t('billing.proPlanDescription', { tokens: proLimit.toLocaleString(), models: proModelsCount, images: fluxImageLimit })
                  : t('billing.enterprisePlanDescription')}
            </p>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl border px-5 py-4 ${darkMode ? 'border-[#2a2a2a] bg-[#161616]' : 'border-gray-200 bg-white'}`}>
        <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('billing.freeVsPro')}</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className={`rounded-xl p-3 border ${darkMode ? 'border-[#2a2a2a] bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('common.free')}</p>
            <p className={`mt-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{freeLimit.toLocaleString()} tokens/day • {freeModelsCount} model{freeModelsCount === 1 ? '' : 's'}</p>
          </div>
          <div className={`rounded-xl p-3 border ${darkMode ? 'border-blue-500/30 bg-blue-500/10' : 'border-blue-200 bg-blue-50'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{t('common.pro')}</p>
            <p className={`mt-1 text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{proLimit.toLocaleString()} tokens/day • {proModelsCount} model{proModelsCount === 1 ? '' : 's'} • FLUX: {fluxImageLimit} images/month</p>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl border px-5 py-4 ${darkMode ? 'border-[#2a2a2a] bg-[#161616]' : 'border-gray-200 bg-white'}`}>
        <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('billing.chooseDuration')}</p>
        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>You will be charged ${(19 * months).toFixed(2)} every {months} month{months === 1 ? '' : 's'} until you cancel.</p>
        <div className="mt-3 flex gap-2">
          {[1, 2, 3, 6, 12].map(value => <button key={value} type="button" onClick={() => setMonths(value)} className={`px-3 py-2 rounded-lg text-sm font-semibold border ${months === value ? 'bg-blue-600 border-blue-500 text-white' : darkMode ? 'border-[#333] text-gray-400 hover:text-white' : 'border-gray-200 text-gray-600'}`}>{value} {t(value === 1 ? 'common.month' : 'common.months')}</button>)}
        </div>
        <label className={`mt-4 flex items-center gap-2 text-xs cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}><input type="checkbox" checked={autoRenewChoice} onChange={event => setAutoRenewChoice(event.target.checked)} className="accent-blue-600" /> {t('billing.autoRenew')}</label>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-3 gap-4">
        {PLANS.map((p) => {
          const Icon = p.icon;
          const isCurrent = plan === p.id;

          return (
            <div
              key={p.id}
              className={`relative border rounded-2xl p-6 flex flex-col gap-5 transition-all ${isCurrent
                ? p.color === 'purple' ? 'border-purple-500/50 bg-purple-500/5'
                  : p.color === 'blue' ? 'border-blue-500/50 bg-blue-500/5'
                    : darkMode ? 'border-[#3a3a3a] bg-[#1a1a1a]' : 'border-gray-300 bg-gray-50'
                : darkMode ? 'border-[#2a2a2a] bg-[#161616] hover:border-[#3a3a3a]' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
            >
              {p.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold bg-blue-500 text-white px-3 py-0.5 rounded-full">
                  {t('billing.mostPopular')}
                </span>
              )}
              {isCurrent && (
                <span className={`absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 rounded-full border ${p.color === 'purple' ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                  : p.color === 'blue' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                    : darkMode ? 'bg-[#2a2a2a] text-gray-400 border-[#3a3a3a]' : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>{t('billing.active')}</span>
              )}

              <div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${p.color === 'purple' ? 'bg-purple-500/15' : p.color === 'blue' ? 'bg-blue-500/15' : darkMode ? 'bg-[#222]' : 'bg-gray-100'
                  }`}>
                  <Icon className={`w-5 h-5 ${p.color === 'purple' ? 'text-purple-400' : p.color === 'blue' ? 'text-blue-400' : darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                </div>
                <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t(`common.${p.id}`)}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-2xl font-bold ${p.color === 'purple' ? 'text-purple-400' : p.color === 'blue' ? 'text-blue-400' : darkMode ? 'text-white' : 'text-gray-900'
                    }`}>{p.price === 'Custom' ? t('billing.customPrice') : p.price}</span>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t(`billing.${p.id === 'free' ? 'forever' : p.id === 'pro' ? 'perMonth' : 'contactUs'}`)}</span>
                </div>
                {p.id === 'free' && plan !== 'free' && (
                  <p className={`mt-3 text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {autoRenew ? `${t('billing.cancelRenewal')}${planEndDate ? ` (${new Date(planEndDate).toLocaleDateString()})` : ''}.` : t('billing.cancellationScheduled')}
                  </p>
                )}
              </div>

              <ul className="space-y-2 flex-1">
                {t(`billing.features.${p.id}`, { returnObjects: true }).map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${p.color === 'purple' ? 'text-purple-400' : p.color === 'blue' ? 'text-blue-400' : 'text-emerald-400'
                      }`} />
                    <span className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={isCurrent || !!loadingPlan || (p.id === 'free' && plan !== 'free' && !autoRenew)}
                onClick={() => {
                  if (isCurrent) return;
                  if (p.id === 'enterprise') {
                    window.open('mailto:sales@netrootai.com?subject=Enterprise Plan', '_blank');
                    return;
                  }
                  if (p.id === 'free') {
                    handleDowngrade();
                    return;
                  }
                  handleUpgrade(p.id);
                }}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${isCurrent
                  ? darkMode ? 'bg-[#222] text-gray-500 cursor-default' : 'bg-gray-100 text-gray-400 cursor-default'
                  : p.color === 'purple'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/20'
                    : p.color === 'blue'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/20'
                      : darkMode ? 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {loadingPlan === p.id
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('billing.redirecting')}</>
                  : isCurrent ? t('plans.currentPlan') : p.id === 'free' ? (plan !== 'free' && !autoRenew ? t('billing.cancellationScheduledLabel') : t('billing.downgradeToFreeButton')) : p.id === 'enterprise' ? t('billing.contactSales') : t('dashboard.upgrade')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
