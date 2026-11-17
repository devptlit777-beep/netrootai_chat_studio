import { useEffect, useState } from 'react';
import { Loader2, Check, Zap, Star, Shield, CreditCard, ArrowUpRight, History } from 'lucide-react';
import { usePlan } from '../contexts/PlanContext';
import { useAuth } from '../contexts/AuthContext';
import API_BASE from '../lib/api';
import { DEFAULT_PLAN_LIMITS, fetchPlanLimits, getModelImageLimit } from '../lib/planLimits';
import { useTranslation } from 'react-i18next';
import WalletTopUpModal from './common/WalletTopUpModal';

export default function Billing({ darkMode }) {
  const { t } = useTranslation();
  const { plan, refresh, autoRenew, planEndDate, walletBalance, refreshWallet } = usePlan();
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState('');
  const [downgradeMessage, setDowngradeMessage] = useState('');
  const [planLimits, setPlanLimits] = useState(DEFAULT_PLAN_LIMITS);
  const [months, setMonths] = useState(1);
  const [autoRenewChoice, setAutoRenewChoice] = useState(true);

  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPlanLimits().then((limits) => {
      if (!cancelled) setPlanLimits(limits);
    }).catch(() => { });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    setLoadingTransactions(true);
    fetch(`${API_BASE}/api/wallet/transactions?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(d => {
        if (d.transactions) setTransactions(d.transactions);
      })
      .catch(() => {})
      .finally(() => setLoadingTransactions(false));
  }, [user?.email, walletBalance]);

  const freeLimit = planLimits.free?.dailyTokenLimit || DEFAULT_PLAN_LIMITS.free.dailyTokenLimit;
  const proLimit = planLimits.pro?.dailyTokenLimit || DEFAULT_PLAN_LIMITS.pro.dailyTokenLimit;
  const fluxImageLimit = getModelImageLimit('pro', 'black-forest-labs/FLUX.1-schnell') || 10;

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
      if (data.url) window.location.href = data.url;
    } catch {
      setError(t('billing.networkError'));
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handleCancelSubscription() {
    if (!user?.email) return;
    if (!window.confirm(t('billing.cancelConfirm'))) return;
    setError('');
    setDowngradeMessage('');
    setLoadingPlan('free');
    try {
      const res = await fetch(`${API_BASE}/api/cancel-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t('billing.failedCancel')); return; }
      await refresh();
      if (data.cancel_at_period_end) {
        setDowngradeMessage(t('billing.cancelPeriodEndMessage', {
          date: data.current_period_end ? new Date(data.current_period_end).toLocaleDateString() : t('billing.currentCycleEnd')
        }));
      } else {
        setDowngradeMessage(t('billing.cancelledImmediately'));
      }
    } catch {
      setError(t('billing.networkErrorCancel'));
    } finally {
      setLoadingPlan(null);
    }
  }

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      color: 'gray',
      icon: Shield,
      features: [
        `${freeLimit.toLocaleString()} tokens / day`,
        '20+ Free OpenRouter models (Llama 3.3, Qwen, Gemma, DeepSeek Free)',
        '2 AI Presentation (PPT) generations',
        'Basic plugins & live web search',
        'Token usage dashboard',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: months === 3 ? '$49' : '$19',
      period: months === 3 ? 'per 3 months' : 'per month',
      color: 'blue',
      icon: Star,
      badge: 'Most popular',
      features: [
        `${proLimit.toLocaleString()} tokens / day`,
        months === 3 ? '+$35.00 Free Wallet Credits included' : '+$12.00 Free Wallet Credits included',
        'Unlimited AI Presentation (PPT) generations & Studio',
        '470+ Frontier AI models (Claude 3.5 Sonnet, GPT-4o, DeepSeek R1)',
        `${fluxImageLimit} images generated per month with FLUX.1`,
        'Image Studio & Media generation access',
        'Custom API Keys & Developer Gateway',
        'Full Plugin Store & Advanced tools',
        'Priority inference & zero queue latency',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      color: 'purple',
      icon: Zap,
      features: [
        'Custom token quota & volume discounts',
        'Unlimited PPT Studio & custom brand templates',
        'Dedicated private inference endpoints',
        'Custom model fine-tuning & LoRAs',
        'SLA guarantee & 24/7 dedicated support',
        'SSO & team seat management',
        'Custom data retention & privacy policies',
      ],
    },
  ];

  return (
    <div className="max-w-full space-y-6 lg:max-w-4xl">
      {error && (
        <div className="p-4 rounded-xl text-xs font-medium bg-red-500/10 border border-red-500/25 text-red-400">
          {error}
        </div>
      )}

      {downgradeMessage && (
        <div className={`p-4 rounded-xl text-xs font-medium border ${darkMode ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
          {downgradeMessage}
        </div>
      )}

      {/* ── NetRoot AI Prepaid Model Credits Card ── */}
      <div className={`rounded-2xl border p-6 relative overflow-hidden transition-all ${
        darkMode ? 'bg-gradient-to-br from-[#161616] via-[#121212] to-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Model Usage Credits
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  Active Wallet
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Prepaid balance for OpenRouter frontier models & Fal.ai media generation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <span className={`text-xs block ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Current Balance</span>
              <span className="text-2xl font-black font-mono text-emerald-400">
                ${Number(walletBalance || 0).toFixed(2)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsTopUpOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Zap className="w-3.5 h-3.5" />
              Top Up Wallet
            </button>
          </div>
        </div>

        {/* Recent Transactions Snippet */}
        {transactions.length > 0 && (
          <div className="mt-5 pt-4 border-t border-dashed border-[#262626]">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className={`font-medium flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <History className="w-3.5 h-3.5" /> Recent Wallet Activity
              </span>
              <span className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Last {transactions.length} events</span>
            </div>
            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
              {transactions.slice(0, 3).map((tx) => (
                <div key={tx.id} className={`flex items-center justify-between text-[11px] py-1 px-2 rounded-lg ${darkMode ? 'bg-white/[0.02]' : 'bg-gray-50'}`}>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {tx.note || (tx.type === 'deposit' ? 'Wallet Top-Up' : `Model: ${tx.model || 'Inference'}`)}
                  </span>
                  <span className={`font-mono font-semibold ${tx.amount > 0 ? 'text-emerald-400' : darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {tx.amount > 0 ? `+${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(4)}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Current plan banner */}
      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#161616] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
        <div className="flex items-start justify-between">
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {t('billing.currentPlan')}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <h2 className={`text-xl font-bold capitalize ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {t(`common.${plan}`)}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {t('billing.active')}
              </span>
            </div>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {plan === 'free'
                ? `Free plan with ${freeLimit.toLocaleString()} daily tokens & 20+ free OpenRouter models.`
                : plan === 'pro'
                  ? `Pro plan with ${proLimit.toLocaleString()} daily tokens, PPT Studio, 470+ models, and ${fluxImageLimit} FLUX images/month.`
                  : 'Enterprise plan with custom quota & dedicated support.'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick summary comparison */}
      <div className={`rounded-2xl border px-5 py-4 ${darkMode ? 'border-[#2a2a2a] bg-[#161616]' : 'border-gray-200 bg-white'}`}>
        <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('billing.freeVsPro')}</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className={`rounded-xl p-3 border ${darkMode ? 'border-[#2a2a2a] bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('common.free')}</p>
            <p className={`mt-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{freeLimit.toLocaleString()} tokens/day • 20+ Free OpenRouter models • 2 PPTs</p>
          </div>
          <div className={`rounded-xl p-3 border ${darkMode ? 'border-blue-500/30 bg-blue-500/10' : 'border-blue-200 bg-blue-50'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{t('common.pro')}</p>
            <p className={`mt-1 text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{proLimit.toLocaleString()} tokens/day • 470+ models • Unlimited PPT Studio • FLUX: {fluxImageLimit} images/mo</p>
          </div>
        </div>
      </div>

      {/* Global Auto-Renew Bar */}
      <div className={`flex items-center justify-between px-5 py-3 rounded-2xl border transition-all ${
        darkMode ? 'bg-[#141414] border-[#262626]' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className={`text-xs font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            Subscription Renewal Settings
          </span>
          <span className={`text-[11px] hidden sm:inline ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            • Automatically keep your plan active & receive fresh model credits
          </span>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Auto-renew plan</span>
          <div
            onClick={() => setAutoRenewChoice(!autoRenewChoice)}
            className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
              autoRenewChoice ? 'bg-blue-600' : darkMode ? 'bg-[#333]' : 'bg-gray-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                autoRenewChoice ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </label>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => {
          const Icon = p.icon;
          const isCurrent = plan === p.id;

          return (
            <div
              key={p.id}
              className={`relative border rounded-2xl p-6 flex flex-col justify-between transition-all ${isCurrent
                ? p.color === 'purple' ? 'border-purple-500/50 bg-purple-500/5'
                  : p.color === 'blue' ? 'border-blue-500/50 bg-blue-500/5'
                    : darkMode ? 'border-[#3a3a3a] bg-[#1a1a1a]' : 'border-gray-300 bg-gray-50'
                : darkMode ? 'border-[#2a2a2a] bg-[#161616] hover:border-[#3a3a3a]' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
            >
              {p.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold bg-blue-500 text-white px-3 py-0.5 rounded-full shadow-md shadow-blue-500/30">
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
                <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>

                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-2xl font-bold ${p.color === 'purple' ? 'text-purple-400' : p.color === 'blue' ? 'text-blue-400' : darkMode ? 'text-white' : 'text-gray-900'
                    }`}>{p.price}</span>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{p.period}</span>
                </div>

                {/* Duration toggle embedded directly inside Pro Card */}
                {p.id === 'pro' && (
                  <div className="mt-3 mb-2 p-1.5 rounded-xl border bg-black/20 border-[#2a2a2a]">
                    <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setMonths(1)}
                        className={`py-1.5 px-2 rounded-lg transition-all ${
                          months === 1
                            ? 'bg-blue-600 text-white shadow-xs'
                            : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        1 Month ($19)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMonths(3)}
                        className={`py-1.5 px-2 rounded-lg transition-all relative ${
                          months === 3
                            ? 'bg-blue-600 text-white shadow-xs'
                            : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        3 Months ($49)
                        <span className="absolute -top-2 -right-1 text-[9px] bg-emerald-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                          -14%
                        </span>
                      </button>
                    </div>

                  </div>
                )}

                {p.id === 'free' && plan !== 'free' && (
                  <p className={`mt-3 text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {autoRenew ? `${t('billing.cancelRenewal')}${planEndDate ? ` (${new Date(planEndDate).toLocaleDateString()})` : ''}.` : t('billing.cancellationScheduled')}
                  </p>
                )}

                <ul className="space-y-2.5 mt-4 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${p.color === 'purple' ? 'text-purple-400' : p.color === 'blue' ? 'text-blue-400' : 'text-emerald-400'
                        }`} />
                      <span className={`text-xs ${f.includes('Free Wallet Credits') ? 'font-bold text-emerald-400' : f.includes('PPT') ? 'font-medium text-blue-300' : darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                {isCurrent ? (
                  p.id !== 'free' && (
                    <button
                      type="button"
                      onClick={handleCancelSubscription}
                      disabled={loadingPlan === 'free'}
                      className={`w-full py-2.5 rounded-xl text-xs font-semibold border transition-all ${darkMode ? 'border-[#333] hover:border-red-500/50 hover:bg-red-500/10 text-gray-400 hover:text-red-400' : 'border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-500 hover:text-red-600'
                        }`}
                    >
                      {loadingPlan === 'free' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : autoRenew ? t('billing.cancelPlan') : t('billing.cancelScheduled')}
                    </button>
                  )
                ) : p.id === 'enterprise' ? (
                  <a
                    href="mailto:contact@netrootai.tech?subject=Enterprise%20Inquiry"
                    className="w-full py-2.5 rounded-xl text-xs font-semibold border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-center transition-all block"
                  >
                    Contact Sales
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUpgrade(p.id)}
                    disabled={loadingPlan === p.id}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/25 active:scale-95"
                  >
                    {loadingPlan === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <>
                        <span>Upgrade to Pro ({months === 3 ? '$49' : '$19'})</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Up Modal */}
      <WalletTopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        darkMode={darkMode}
      />
    </div>
  );
}
