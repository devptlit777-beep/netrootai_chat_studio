import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, ArrowLeft, Clock, Cpu, LogOut, MessageSquare, RefreshCw, RotateCw, Search, Shield, Zap, CreditCard, DollarSign, Wallet, TrendingUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import API_BASE from '../lib/api';

function fmt(value) { return (value || 0).toLocaleString(); }
function fmtMs(ms) { return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`; }
function fmtDate(ts) {
    return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtPlanDate(ts, isPaid, t) {
    if (ts) return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return isPaid ? 'Active (Auto-renew)' : t('common.noPaidPlan');
}

export default function AdminUserPage() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const dark = theme === 'dark';
    const navigate = useNavigate();
    const { email: encodedEmail } = useParams();
    const email = decodeURIComponent(encodedEmail || '');
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [querySearch, setQuerySearch] = useState('');
    const [featureAccess, setFeatureAccess] = useState({});
    const [accessMessage, setAccessMessage] = useState('');
    const [reactivateMessage, setReactivateMessage] = useState('');
    const [reactivating, setReactivating] = useState(false);
    const featureOptions = [
        ['models', t('admin.models')],
        ['maps', t('admin.maps')],
        ['webinars', t('admin.webinars')],
        ['threads', t('admin.threads')],
        ['files', t('admin.files')],
        ['plugins', t('admin.plugins')],
        ['image-studio', t('admin.imageStudio')],
        ['ppt-studio', t('admin.pptStudio')],
        ['project-settings', t('admin.projectSettings')],
    ];

    useEffect(() => {
        if (sessionStorage.getItem('admin_authed') !== '1') {
            navigate('/admin', { replace: true });
            return;
        }

        let active = true;
        setLoading(true);
        fetch(`${API_BASE}/api/admin/user-detail?email=${encodeURIComponent(email)}`)
            .then(response => response.json())
            .then(data => { if (active) { setDetail(data); setFeatureAccess(data.feature_access || {}); } })
            .catch(error => console.error(error))
            .finally(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, [email, navigate]);

    function logout() {
        sessionStorage.removeItem('admin_authed');
        navigate('/login');
    }

    async function updateFeatureAccess(feature, enabled) {
        setAccessMessage(t('admin.savingAccess'));
        try {
            const response = await fetch(`${API_BASE}/api/admin/feature-access`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, feature, enabled }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || t('common.unableUpdateAccess'));
            setFeatureAccess(data.feature_access || {});
            setAccessMessage(t('admin.accessUpdated'));
        } catch (error) {
            setAccessMessage(error.message);
        }
    }

    async function reactivateUser() {
        if (!window.confirm(t('common.reactivateConfirmation', { email }))) return;
        setReactivating(true);
        setReactivateMessage('');
        try {
            const response = await fetch(`${API_BASE}/api/admin/reactivate-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || t('common.unableReactivate'));
            setDetail(previous => ({ ...previous, subscription: { ...previous.subscription, ...data } }));
            setReactivateMessage(t('common.freePlanActiveUntil', { date: fmtPlanDate(data.current_period_end, t) }));
        } catch (error) {
            setReactivateMessage(error.message);
        } finally {
            setReactivating(false);
        }
    }

    const getQueryText = query => query.prompt || query.query || query.message || null;
    const filteredQueries = (detail?.queries || []).filter(query =>
        !querySearch || (getQueryText(query) || '').toLowerCase().includes(querySearch.toLowerCase())
    );
    const userTimeline = detail?.timeline || [];
    const maxUserTimelineTokens = Math.max(1, ...userTimeline.map(day => day.tokens || 0));
    const hasFullPlanAccess = detail?.subscription?.plan_status === 'active'
        && ['pro', 'enterprise'].includes(detail?.subscription?.plan);

    return (
        <div className={`min-h-screen ${dark ? 'bg-[#0e0e0e] text-white' : 'bg-gray-50 text-gray-900'}`}>
            <header className={`sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6 sm:py-4 ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-3">
                    <img src="/image.png" alt="NetRoot AI logo" className="w-9 h-9 object-contain" />
                    {/* <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                        <Shield className="w-5 h-5 text-blue-500" />
                    </div> */}
                    <div>
                        <h1 className="font-bold text-lg leading-none">{t('admin.userDetailsTitle')}</h1>
                        <p className={`text-xs mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{t('admin.dashboard')}</p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <button onClick={() => navigate('/admin')} aria-label={t('admin.users')} className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-sm sm:px-3 ${dark ? 'border-[#333] text-gray-400 hover:text-white' : 'border-gray-200 text-gray-500 hover:text-gray-700'}`}>
                        <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{t('admin.users')}</span>
                    </button>
                    <button onClick={logout} aria-label={t('admin.logout')} className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1.5 text-sm text-red-400 sm:px-3">
                        <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{t('admin.logout')}</span>
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
                <div className="mb-6">
                    <p className={`text-sm ${dark ? 'text-gray-500' : 'text-gray-500'}`}>{t('admin.userAccount')}</p>
                    <h2 className="text-2xl font-bold mt-1 break-all">{email}</h2>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-blue-500" /></div>
                ) : detail ? (
                    <div className="space-y-6">
                        <section className={`rounded-2xl border p-5 ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
                            <h3 className="font-semibold mb-4">{t('admin.planStatus')}</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                <div>
                                    <p className="text-xs text-gray-500">{t('admin.plan')}</p>
                                    <p className="font-semibold mt-1">
                                        {detail.subscription?.plan === 'pro'
                                            ? detail.subscription?.interval_months === 3
                                                ? 'Pro (3 Months - $49)'
                                                : 'Pro (1 Month - $19)'
                                            : 'Free'}
                                    </p>
                                </div>
                                <div><p className="text-xs text-gray-500">{t('admin.status')}</p><p className={`font-semibold mt-1 capitalize ${detail.subscription?.plan_status === 'expired' ? 'text-red-400' : 'text-emerald-400'}`}>{detail.subscription?.plan_status === 'expired' ? t('admin.expired') : t('admin.active')}</p></div>
                                <div><p className="text-xs text-gray-500">{t('admin.planEndDate')}</p><p className="font-semibold mt-1">{fmtPlanDate(detail.subscription?.current_period_end, detail.subscription?.plan === 'pro', t)}</p></div>
                                <div><p className="text-xs text-gray-500">{t('admin.renewal')}</p><p className={`font-semibold mt-1 ${detail.subscription?.auto_renew ? 'text-emerald-400' : 'text-gray-500'}`}>{detail.subscription?.plan === 'free' ? t('admin.notApplicable') : detail.subscription?.auto_renew ? (detail.subscription?.interval_months === 3 ? 'Every 3 Months ($49)' : 'Every Month ($19)') : t('admin.off')}</p></div>
                            </div>
                            {(detail.subscription?.plan_status === 'expired' || reactivateMessage) && (
                                <div className="mt-4 flex items-center gap-3">
                                    {detail.subscription?.plan_status === 'expired' && <button onClick={reactivateUser} disabled={reactivating} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60">
                                        <RotateCw className="h-4 w-4" />
                                        {reactivating ? t('admin.activating') : t('common.activateFreeForMonth')}
                                    </button>}
                                    {reactivateMessage && <span className="text-xs text-emerald-400">{reactivateMessage}</span>}
                                </div>
                            )}
                        </section>
                        <section className={`rounded-2xl border p-5 ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold">{t('admin.featureAccess')}</h3>
                                    <p className="text-xs text-gray-500 mt-1">{t('admin.featureAccessHelp')}</p>
                                </div>
                                {accessMessage && <span className="text-xs text-emerald-400">{accessMessage}</span>}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {featureOptions.map(([feature, label]) => (
                                    <label key={feature} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${hasFullPlanAccess ? 'cursor-default opacity-70' : 'cursor-pointer'} ${dark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                                        <input type="checkbox" checked={hasFullPlanAccess || Boolean(featureAccess[feature])} disabled={hasFullPlanAccess} onChange={event => updateFeatureAccess(feature, event.target.checked)} className="accent-blue-600" />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </section>
                                                {/* ── User Financial & Margin Summary ── */}
                        <section className="mb-2">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                                    <DollarSign className="w-3.5 h-3.5" /> User Wallet & OpenRouter P&L
                                </h3>
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                                    dark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                    +{detail.marginPercentage || 20}% Net Profit Margin
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className={`rounded-xl border p-4 ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                        <span>Wallet Balance</span>
                                        <Wallet className="w-3.5 h-3.5 text-blue-400" />
                                    </div>
                                    <p className="text-xl font-bold font-mono text-blue-400">
                                        ${Number(detail.wallet?.balance || 0).toFixed(2)}
                                    </p>
                                    <span className="text-[10px] text-gray-500">Available prepaid credits</span>
                                </div>
                                <div className={`rounded-xl border p-4 ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                        <span>OpenRouter Paid</span>
                                        <Cpu className="w-3.5 h-3.5 text-orange-400" />
                                    </div>
                                    <p className="text-xl font-bold font-mono text-orange-400">
                                        ${Number(detail.wallet?.totalBaseCost || 0) > 0 && Number(detail.wallet?.totalBaseCost || 0) < 0.05 ? Number(detail.wallet?.totalBaseCost || 0).toFixed(4) : Number(detail.wallet?.totalBaseCost || 0).toFixed(2)}
                                    </p>
                                    <span className="text-[10px] text-gray-500">Base provider cost (30d)</span>
                                </div>
                                <div className={`rounded-xl border p-4 ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                        <span>Billed to User</span>
                                        <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                                    </div>
                                    <p className="text-xl font-bold font-mono text-indigo-400">
                                        ${Number(detail.wallet?.totalBilled || 0) > 0 && Number(detail.wallet?.totalBilled || 0) < 0.05 ? Number(detail.wallet?.totalBilled || 0).toFixed(4) : Number(detail.wallet?.totalBilled || 0).toFixed(2)}
                                    </p>
                                    <span className="text-[10px] text-gray-500">Deducted with margin</span>
                                </div>
                                <div className={`rounded-xl border p-4 ${dark ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                                    <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
                                        <span>NetRoot Profit</span>
                                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                    </div>
                                    <p className="text-xl font-bold font-mono text-emerald-400">
                                        +${Number(detail.wallet?.totalProfit || 0) > 0 && Number(detail.wallet?.totalProfit || 0) < 0.05 ? Number(detail.wallet?.totalProfit || 0).toFixed(4) : Number(detail.wallet?.totalProfit || 0).toFixed(2)}
                                    </p>
                                    <span className="text-[10px] text-emerald-400/70">Your retained cash</span>
                                </div>
                            </div>
                        </section>

<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                [t('admin.tokens24h'), fmt(detail.tokens24h)],
                                [t('admin.tokens30dShort'), fmt(detail.tokens30d)],
                                [t('admin.requests30d'), fmt(detail.requests30d)],
                                [t('admin.avgLatency'), detail.avgLatencyMs ? fmtMs(detail.avgLatencyMs) : '—'],
                            ].map(([label, value]) => (
                                <div key={label} className={`rounded-xl border p-4 ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
                                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-500'}`}>{label}</p>
                                    <p className="text-xl font-bold mt-1">{value}</p>
                                </div>
                            ))}
                        </div>

                        {detail.avgThroughput > 0 && (
                            <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${dark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                                <Activity className="w-4 h-4 text-emerald-500" />
                                <p className={`text-sm ${dark ? 'text-emerald-400' : 'text-emerald-700'}`}>{t('admin.averageThroughput')} <strong>{fmt(detail.avgThroughput)} tokens/sec</strong></p>
                            </div>
                        )}

                        <section className={`rounded-2xl border p-5 ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="font-semibold">{t('admin.dailyTokenUsage')}</h3>
                                    <p className={`text-xs mt-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{t('admin.last7Days')}</p>
                                </div>
                                <Activity className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44">
                                {userTimeline.map((day, index) => (
                                    <div key={`${day.label}-${index}`} className="h-full flex flex-col items-center justify-end gap-2 min-w-0">
                                        <span className={`text-[10px] font-medium truncate max-w-full ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{fmt(day.tokens)}</span>
                                        <div className="w-full max-w-12 h-28 flex items-end">
                                            <div
                                                className="w-full rounded-t-md bg-blue-500"
                                                style={{ height: `${Math.max(4, ((day.tokens || 0) / maxUserTimelineTokens) * 100)}%` }}
                                                title={`${day.label}: ${fmt(day.tokens)} tokens`}
                                            />
                                        </div>
                                        <span className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-500'}`}>{day.label}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {Object.keys(detail.perModel || {}).length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('admin.modelUsage30d')} & Financial P&L
                                    </h3>
                                    <span className="text-[11px] text-gray-500">Breakdown by model</span>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {Object.entries(detail.perModel).map(([model, stats]) => (
                                        <div key={model} className={`flex flex-col p-3.5 rounded-xl border ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="flex items-center gap-1.5 text-xs font-bold font-mono">
                                                    <Cpu className="w-3.5 h-3.5 text-blue-500" />
                                                    {model.split('/').pop() || model}
                                                </span>
                                                <span className={`text-[11px] font-mono ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {fmt(stats.tokens)} tok · {stats.requests} req
                                                </span>
                                            </div>
                                            <div className={`flex items-center justify-between pt-2 border-t text-xs font-mono ${dark ? 'border-white/5' : 'border-gray-100'}`}>
                                                <div>
                                                    <span className="text-[10px] text-gray-500 block">OpenRouter Cost</span>
                                                    <span className="text-orange-400 font-medium">${Number(stats.base_cost || 0).toFixed(4)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-gray-500 block">Billed to User</span>
                                                    <span className={`font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>${Number(stats.billed_cost || 0).toFixed(4)}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] text-emerald-400 block">Net Profit</span>
                                                    <span className="text-emerald-400 font-bold">+${Number(stats.profit_usd || 0).toFixed(4)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        

                        {/* ── User Wallet Activity Ledger ── */}
                        {detail.wallet?.transactions?.length > 0 && (
                            <section className={`rounded-2xl border p-5 ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-semibold text-sm">Recent Wallet & Usage Ledger</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">Top-up deposits & per-request token debits</p>
                                    </div>
                                    <span className="text-xs text-gray-500 font-mono">
                                        {detail.wallet.transactions.length} entries
                                    </span>
                                </div>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {detail.wallet.transactions.slice(0, 15).map((t, idx) => (
                                        <div key={t.id || idx} className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${dark ? 'bg-[#161616] border-[#242424]' : 'bg-gray-50 border-gray-100'}`}>
                                            <div className="flex items-center gap-2.5">
                                                <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] ${
                                                    t.type === 'deposit'
                                                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                                }`}>
                                                    {t.type === 'deposit' ? 'DEPOSIT' : 'USAGE'}
                                                </span>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-medium ${dark ? 'text-gray-300' : 'text-gray-800'}`}>
                                                            {t.model ? t.model.split('/').pop() : t.metadata?.note || 'Stripe Deposit'}
                                                        </span>
                                                        {t.tokens_total > 0 && (
                                                            <span className="text-[11px] text-gray-500 font-mono">
                                                                ({t.tokens_total.toLocaleString()} tok)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono mt-0.5">
                                                        {t.created_at && (
                                                            <span>{new Date(t.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                        )}
                                                        {t.stripe_session_id && (
                                                            <span className="text-gray-400">Ref: {t.stripe_session_id.slice(0, 16)}...</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 font-mono">
                                                {t.base_cost > 0 && (
                                                    <span className="text-[11px] text-orange-400/80">
                                                        OR: ${Number(t.base_cost).toFixed(4)}
                                                    </span>
                                                )}
                                                {t.profit_usd > 0 && (
                                                    <span className="text-[11px] text-emerald-400 font-bold">
                                                        +${Number(t.profit_usd).toFixed(4)}
                                                    </span>
                                                )}
                                                <span className={`font-bold ${t.amount > 0 ? 'text-emerald-400' : dark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    {t.amount > 0 ? `+${Number(t.amount).toFixed(2)}` : `-${Math.abs(Number(t.amount)).toFixed(4)}`}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
<section className={`rounded-2xl border p-5 ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <h3 className="font-semibold">{t('admin.recentQueries', { count: filteredQueries.length })}</h3>
                                <div className={`flex items-center gap-2 border rounded-lg px-2.5 py-1.5 ${dark ? 'bg-[#1a1a1a] border-[#333]' : 'bg-gray-50 border-gray-200'}`}>
                                    <Search className="w-3 h-3 text-gray-500" />
                                    <input value={querySearch} onChange={event => setQuerySearch(event.target.value)} placeholder={t('admin.filterQueries')} className={`bg-transparent text-xs outline-none w-36 ${dark ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`} />
                                </div>
                            </div>
                            {filteredQueries.length === 0 ? (
                                <p className={`text-sm text-center py-8 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>{t('admin.noQueriesFound')}</p>
                            ) : (
                                <div className="space-y-3">
                                    {filteredQueries.map((query, index) => (
                                        <article key={`${query.ts}-${index}`} className={`rounded-xl border p-4 ${dark ? 'bg-[#0e0e0e] border-[#222]' : 'bg-gray-50 border-gray-200'}`}>
                                            <div className="flex items-start gap-2 mb-3">
                                                <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-500" />
                                                <p className="text-sm leading-relaxed break-words">{getQueryText(query) || <span className="text-gray-500 italic">{t('admin.noPromptRecorded')}</span>}</p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-xs">
                                                <span className="flex items-center gap-1 text-gray-500"><Clock className="w-3 h-3" />{fmtDate(query.ts)}</span>
                                                <span className="font-mono text-gray-500">{query.model?.split('/').pop() || query.model}</span>
                                                <span className="flex items-center gap-1 text-blue-500"><Zap className="w-3 h-3" />{fmt(query.totalTokens)} tokens</span>
                                                <span className="flex items-center gap-1 text-amber-500"><Clock className="w-3 h-3" />{fmtMs(query.latencyMs)}</span>
                                                {query.throughput > 0 && <span className="flex items-center gap-1 text-emerald-500"><Activity className="w-3 h-3" />{fmt(query.throughput)} tok/s</span>}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                ) : <p className="text-center py-20 text-gray-500">{t('admin.unableLoadDetails')}</p>}
            </main>
        </div>
    );
}
