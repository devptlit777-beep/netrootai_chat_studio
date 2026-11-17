import { useEffect, useState, useRef, useCallback } from 'react';
import { Sparkles, RefreshCw, BarChart3, Clock, Cpu, Layers, Activity, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import API_BASE from '../lib/api';
import { useTranslation } from 'react-i18next';

const DEFAULT_GROQ_USAGE = {
    model: 'openai/gpt-oss-20b',
    modelDisplayName: 'GPT OSS 20B',
    contextWindow: 131072,
    dailyTokenLimit: 100000,
    tokensUsedToday: 0,
    remainingTokens: 100000,
    usedPercent: 0,
    periodLabel: 'Last 30 days',
    period: '30d',
    totalSpend: 0.0,
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    cachedTokens: 0,
    totalRequests: 0,
    averageLatencyMs: 0,
    tokenTimeline: [],
};

function formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(value);
}

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
}

function formatTime(date, locale) {
    return new Date(date).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function TokenDashboard({ darkMode }) {
    const { t, i18n } = useTranslation();
    const { session } = useAuth();
    const [usageData, setUsageData] = useState(DEFAULT_GROQ_USAGE);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('30d');
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isLive, setIsLive] = useState(true);
    const intervalRef = useRef(null);
    const abortRef = useRef(null);

    const loadUsage = useCallback(async () => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLastUpdated(prev => {
            prev ? setRefreshing(true) : setLoading(true);
            return prev;
        });
        setError(null);

        try {
            if (!session?.access_token) throw new Error('Sign in to view your usage.');
            const response = await fetch(`${API_BASE}/api/my-usage?period=${period}`, {
                signal: controller.signal,
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to load usage data.');
            setUsageData({ ...DEFAULT_GROQ_USAGE, ...data });
            setLastUpdated(new Date());
            setIsLive(true);
        } catch (err) {
            if (err.name !== 'AbortError') {
                setError(err.message);
                setIsLive(false);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [period, session?.access_token]);

    useEffect(() => {
        loadUsage();
        return () => abortRef.current?.abort();
    }, [loadUsage]);

    useEffect(() => {
        intervalRef.current = setInterval(loadUsage, 30000);
        return () => clearInterval(intervalRef.current);
    }, [loadUsage]);

    const totalTokens = usageData.totalTokens || usageData.inputTokens + usageData.outputTokens;

    const timeline = usageData.tokenTimeline.length > 0 ? usageData.tokenTimeline : [
        { label: 'Mon', tokens: 0 }, { label: 'Tue', tokens: 0 }, { label: 'Wed', tokens: 0 },
        { label: 'Thu', tokens: 0 }, { label: 'Fri', tokens: 0 }, { label: 'Sat', tokens: 0 }, { label: 'Sun', tokens: 0 },
    ];
    const maxTimelineTokens = Math.max(...timeline.map(point => Number(point.tokens) || 0), 1);

    const usedPct = usageData.usedPercent || 0;
    const hasLimit = usageData.dailyTokenLimit !== null;
    const barColor = usedPct >= 90 ? 'bg-red-500' : usedPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
    const textColor = usedPct >= 90 ? 'text-red-400' : usedPct >= 70 ? 'text-amber-400' : 'text-emerald-400';

    const card = `rounded-3xl border p-4 ${darkMode ? 'border-[#242424] bg-[#181818]' : 'border-gray-200 bg-gray-50'}`;
    const lbl = `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`;
    const val = `text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`;

    return (
        <div className={`rounded-3xl border p-6 shadow-sm transition-colors ${darkMode ? 'border-[#2a2a2a] bg-[#121212]' : 'border-gray-200 bg-white'}`}>

            {/* Model Token Quota */}
            <div className={`mb-6 rounded-3xl border p-5 ${darkMode ? 'border-[#242424] bg-[#181818]' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`rounded-2xl p-2 ${darkMode ? 'bg-[#121212]' : 'bg-sky-50'}`}>
                            <Cpu className={`h-5 w-5 ${darkMode ? 'text-sky-400' : 'text-sky-600'}`} />
                        </div>
                        <div>
                            {/* <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Active model</p> */}
                            <p className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('usageDashboard.allModels')}</p>
                            {/* <p className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{usageData.modelDisplayName || usageData.model}</p> */}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('usageDashboard.contextWindow')}</p>
                        <p className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formatNumber(usageData.contextWindow)} tokens</p>
                    </div>
                </div>

                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('usageDashboard.dailyUsage')}</span>
                        <span className={`text-xs font-bold ${hasLimit ? textColor : 'text-sky-400'}`}>
                            {hasLimit ? t('usageDashboard.percentUsed', { percent: usedPct }) : t('usageDashboard.noDailyLimit')}
                        </span>
                    </div>
                    {hasLimit && (
                        <div className={`h-2.5 w-full rounded-full ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`}>
                            <div
                                className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`}
                                style={{ width: `${Math.max(usedPct, usedPct > 0 ? 2 : 0)}%` }}
                            />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className={`rounded-2xl p-3 ${darkMode ? 'bg-[#121212]' : 'bg-white border border-gray-200'}`}>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('usageDashboard.usedToday')}</p>
                        <p className={`mt-1 text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatNumber(usageData.tokensUsedToday)}</p>
                    </div>
                    <div className={`rounded-2xl p-3 ${darkMode ? 'bg-[#121212]' : 'bg-white border border-gray-200'}`}>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('usageDashboard.remaining')}</p>
                        <p className={`mt-1 text-base font-semibold ${hasLimit ? textColor : 'text-sky-400'}`}>
                            {hasLimit ? formatNumber(usageData.remainingTokens) : t('usageDashboard.unlimited')}
                        </p>
                    </div>
                    <div className={`rounded-2xl p-3 ${darkMode ? 'bg-[#121212]' : 'bg-white border border-gray-200'}`}>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('usageDashboard.dailyLimit')}</p>
                        <p className={`mt-1 text-base font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {hasLimit ? formatNumber(usageData.dailyTokenLimit) : '—'}
                        </p>
                    </div>
                </div>

                {usedPct >= 90 && (
                    <div className="mt-3 rounded-2xl bg-red-500/10 px-4 py-2 text-xs text-red-400 font-medium">
                        {t('usageDashboard.approachingLimit')}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className={`rounded-2xl p-3 ${darkMode ? 'bg-[#1e1e1e]' : 'bg-sky-50'}`}>
                            <Sparkles className={`h-5 w-5 ${darkMode ? 'text-sky-400' : 'text-sky-600'}`} />
                        </div>
                        <div>
                            <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('usageDashboard.totalSpend')}</p>
                            <p className={`text-3xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(usageData.totalSpend)}</p>
                        </div>
                    </div>
                    <div className={card}>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className={lbl}>{t('usageDashboard.totalTokens')}</p>
                                <p className={val}>{formatNumber(totalTokens)}</p>
                            </div>
                            <div>
                                <p className={lbl}>{t('usageDashboard.totalRequests')}</p>
                                <p className={val}>{formatNumber(usageData.totalRequests)}</p>
                            </div>
                        </div>
                        <div className="mt-4 h-32 overflow-hidden rounded-3xl bg-[#111111] px-3 py-3">
                            <div className="flex h-full items-end gap-2">
                                {timeline.map((point, index) => {
                                    const tokens = Number(point.tokens) || 0;
                                    const height = tokens > 0 ? Math.max(8, Math.round((tokens / maxTimelineTokens) * 100)) : 0;
                                    return (
                                        <div key={`${point.label}-${index}`} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                                            <div className="flex h-24 w-full items-end justify-center">
                                                <div className="w-3/5 rounded-t-md bg-gradient-to-t from-sky-700 to-sky-400 transition-all duration-300" style={{ height: `${height}%` }} title={`${point.label}: ${formatNumber(tokens)} tokens`} />
                                            </div>
                                            <p className="mt-2 text-center text-[10px] uppercase tracking-[0.15em] text-gray-500">{point.label}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex min-w-[240px] flex-col gap-3">
                    <div className={`flex items-center justify-between rounded-3xl border px-4 py-3 ${darkMode ? 'border-[#242424] bg-[#181818]' : 'border-gray-200 bg-gray-50'}`}>
                        <span className={lbl}>{t('usageDashboard.period')}</span>
                        <div className="flex gap-2">
                            {['1d', '7d', '30d'].map((v) => (
                                <button key={v} onClick={() => setPeriod(v)}
                                    className={`rounded-2xl px-3 py-1 text-xs font-semibold transition ${period === v ? 'bg-sky-500 text-white' : darkMode ? 'bg-[#121212] text-gray-400 hover:bg-[#1d1d1d]' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={card}>
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <p className={lbl}>{t('usageDashboard.cachedTokens')}</p>
                                <p className={`mt-1 ${val}`}>{formatNumber(usageData.cachedTokens)}</p>
                            </div>
                            <div className="rounded-2xl bg-sky-500/10 p-2 text-sky-400">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                        </div>
                        <p className={`mt-3 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{t('usageDashboard.cacheDescription')}</p>
                    </div>

                    <div className={card}>
                        <div className="flex items-center gap-2">
                            <div className={`rounded-2xl p-2 ${darkMode ? 'bg-[#121212]' : 'bg-slate-100'}`}>
                                <RefreshCw className={`h-4 w-4 ${darkMode ? 'text-sky-400' : 'text-sky-600'}`} />
                            </div>
                            <div>
                                <p className={lbl}>{t('usageDashboard.avgLatency')}</p>
                                <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{usageData.averageLatencyMs} ms</p>
                            </div>
                        </div>
                        <p className={`mt-3 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{t('usageDashboard.latencyDescription')}</p>
                    </div>
                </div>
            </div>

            <div className={`mt-6 rounded-3xl border p-5 ${darkMode ? 'border-[#242424] bg-[#181818]' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className={lbl}>{t('usageDashboard.breakdown')}</p>
                        <p className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{usageData.periodLabel}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <div className={`relative w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                    {isLive && (
                                        <>
                                            <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping" />
                                            <div className="absolute inset-0 rounded-full bg-emerald-400/30" />
                                        </>
                                    )}
                                </div>
                                <span className={`text-xs font-semibold uppercase tracking-[0.15em] ${isLive ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {isLive ? t('usageDashboard.live') : t('usageDashboard.offline')}
                                </span>
                            </div>
                            <button onClick={loadUsage} disabled={refreshing || loading}
                                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-[#242424]' : 'hover:bg-gray-200'} ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                            </button>
                        </div>
                        {lastUpdated && (
                            <div className={`flex items-center gap-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                <Clock className="w-3 h-3" />
                                <span>{t('usageDashboard.updated', { time: formatTime(lastUpdated, i18n.resolvedLanguage) })}</span>
                            </div>
                        )}
                    </div>
                </div>

                {error && <div className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[[t('usageDashboard.inputTokens'), usageData.inputTokens], [t('usageDashboard.outputTokens'), usageData.outputTokens], [t('usageDashboard.totalRequests'), usageData.totalRequests], [t('usageDashboard.cachedTokens'), usageData.cachedTokens]].map(([l, v]) => (
                        <div key={l} className={`rounded-3xl border p-4 ${darkMode ? 'border-[#2b2b2b] bg-[#121212]' : 'border-gray-200 bg-white'}`}>
                            <p className={lbl}>{l}</p>
                            <p className={`mt-2 ${val}`}>{formatNumber(v)}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Per-Model Usage Breakdown Section */}
            <div className={`mt-6 rounded-3xl border p-6 ${darkMode ? 'border-[#242424] bg-[#181818]' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                        <h3 className={`text-base font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            <Layers className="w-4 h-4 text-emerald-400" />
                            Model Token Consumption Breakdown
                        </h3>
                        <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Detailed token telemetry and requests count per model used during {usageData.periodLabel.toLowerCase()}.
                        </p>
                    </div>
                    <span className={`text-xs font-mono px-3 py-1 rounded-full border ${darkMode ? 'bg-[#121212] border-[#333] text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
                        {Object.keys(usageData.perModel || {}).length} Models Active
                    </span>
                </div>

                {Object.keys(usageData.perModel || {}).length === 0 ? (
                    <div className={`py-12 text-center rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#262626]' : 'bg-white border-gray-200'}`}>
                        <Activity className="w-8 h-8 text-gray-500 mx-auto mb-2 opacity-50" />
                        <p className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            No individual model usage recorded for {usageData.periodLabel.toLowerCase()}
                        </p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            Chat with any model in Chat Studio to track per-model tokens and request telemetry.
                        </p>
                    </div>
                ) : (
                    <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-[#121212] border-[#262626]' : 'bg-white border-gray-200'}`}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
                                    darkMode ? 'bg-[#161616] border-[#262626] text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-600'
                                }`}>
                                    <tr>
                                        <th className="py-3 px-4">Model & Provider</th>
                                        <th className="py-3 px-4">Requests</th>
                                        <th className="py-3 px-4">Prompt / Completion</th>
                                        <th className="py-3 px-4">Total Tokens</th>
                                        <th className="py-3 px-4">Share of Usage</th>
                                        <th className="py-3 px-4">Avg Latency</th>
                                        <th className="py-3 px-4 text-right">Last Used</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${darkMode ? 'divide-[#222]' : 'divide-gray-100'}`}>
                                    {Object.entries(usageData.perModel || {})
                                        .map(([modelId, data]) => ({ id: modelId, ...data }))
                                        .sort((a, b) => (b.tokens || 0) - (a.tokens || 0))
                                        .map(m => {
                                            const totalTok = usageData.totalTokens || 1;
                                            const pct = Math.min(100, Math.round(((m.tokens || 0) / totalTok) * 100));
                                            const provider = m.id.includes('/') ? m.id.split('/')[0] : (m.id === 'ppt-studio' ? 'NetRoot AI' : 'NetRoot');
                                            const displayName = m.id === 'ppt-studio'
                                                ? 'NetRoot AI PPT Studio'
                                                : m.id.split('/').pop().replace(/[-_]/g, ' ').toUpperCase();

                                            return (
                                                <tr key={m.id} className={`${darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'} transition-colors`}>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                                                darkMode ? 'bg-[#1e1e1e] text-blue-400' : 'bg-blue-50 text-blue-600'
                                                            }`}>
                                                                <Cpu className="w-3.5 h-3.5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                        {displayName}
                                                                    </span>
                                                                    <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded ${
                                                                        darkMode ? 'bg-[#222] text-gray-400' : 'bg-gray-200 text-gray-700'
                                                                    }`}>
                                                                        {provider}
                                                                    </span>
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 font-mono truncate max-w-[200px]">
                                                                    {m.id}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 font-mono font-semibold">
                                                        <span className="px-2 py-0.5 rounded-full text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                            {formatNumber(m.requests || 0)} calls
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-mono text-gray-400 text-[11px]">
                                                        <span className="text-emerald-400">{formatNumber(m.inputTokens || 0)}</span> in / <span className="text-indigo-400">{formatNumber(m.outputTokens || 0)}</span> out
                                                    </td>
                                                    <td className="py-3 px-4 font-mono font-bold text-white text-xs">
                                                        {formatNumber(m.tokens || 0)}
                                                    </td>
                                                    <td className="py-3 px-4 min-w-[120px]">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500"
                                                                    style={{ width: `${Math.max(4, pct)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] font-mono text-gray-400 w-8 text-right">
                                                                {pct}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 font-mono text-gray-400 text-[11px]">
                                                        {m.avgLatencyMs ? `${m.avgLatencyMs}ms` : '—'}
                                                    </td>
                                                    <td className="py-3 px-4 font-mono text-gray-400 text-[11px] text-right">
                                                        {m.lastUsed ? new Date(m.lastUsed).toLocaleDateString() : '—'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
