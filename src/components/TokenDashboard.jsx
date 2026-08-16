import { useEffect, useState, useRef, useCallback } from 'react';
import { Sparkles, RefreshCw, BarChart3, Clock, Cpu } from 'lucide-react';

const DEFAULT_GROQ_USAGE = {
    model: 'openai/gpt-oss-20b',
    modelDisplayName: 'GPT OSS 20B',
    contextWindow: 131072,
    dailyTokenLimit: 1000000,
    tokensUsedToday: 0,
    remainingTokens: 1000000,
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

function formatTime(date) {
    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function TokenDashboard({ darkMode }) {
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
            const response = await fetch(`/api/usage?period=${period}`, { signal: controller.signal });
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
    }, [period]);

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
                            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Active model</p>
                            <p className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{usageData.modelDisplayName || usageData.model}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Context window</p>
                        <p className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formatNumber(usageData.contextWindow)} tokens</p>
                    </div>
                </div>

                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Daily token usage</span>
                        <span className={`text-xs font-bold ${hasLimit ? textColor : 'text-sky-400'}`}>
                            {hasLimit ? `${usedPct}% used` : 'No daily limit'}
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
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Used today</p>
                        <p className={`mt-1 text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatNumber(usageData.tokensUsedToday)}</p>
                    </div>
                    <div className={`rounded-2xl p-3 ${darkMode ? 'bg-[#121212]' : 'bg-white border border-gray-200'}`}>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Remaining</p>
                        <p className={`mt-1 text-base font-semibold ${hasLimit ? textColor : 'text-sky-400'}`}>
                            {hasLimit ? formatNumber(usageData.remainingTokens) : '∞ Unlimited'}
                        </p>
                    </div>
                    <div className={`rounded-2xl p-3 ${darkMode ? 'bg-[#121212]' : 'bg-white border border-gray-200'}`}>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Daily limit</p>
                        <p className={`mt-1 text-base font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {hasLimit ? formatNumber(usageData.dailyTokenLimit) : '—'}
                        </p>
                    </div>
                </div>

                {usedPct >= 90 && (
                    <div className="mt-3 rounded-2xl bg-red-500/10 px-4 py-2 text-xs text-red-400 font-medium">
                        ⚠️ Approaching daily token limit — resets at midnight UTC
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
                            <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Total spend</p>
                            <p className={`text-3xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(usageData.totalSpend)}</p>
                        </div>
                    </div>
                    <div className={card}>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className={lbl}>Total tokens</p>
                                <p className={val}>{formatNumber(totalTokens)}</p>
                            </div>
                            <div>
                                <p className={lbl}>Total requests</p>
                                <p className={val}>{formatNumber(usageData.totalRequests)}</p>
                            </div>
                        </div>
                        <div className="mt-4 h-32 overflow-hidden rounded-3xl bg-[#111111] px-3 py-3">
                            <div className="flex h-full items-end gap-2">
                                {timeline.map((point) => {
                                    const max = Math.max(...timeline.map(i => i.tokens), 1);
                                    const height = Math.max(1, Math.round((point.tokens / max) * 100));
                                    return (
                                        <div key={point.label} className="flex-1">
                                            <div className="mx-auto h-full rounded-full bg-gradient-to-b from-sky-400 to-sky-700 transition-all duration-300" style={{ height: `${height}%` }} />
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
                        <span className={lbl}>Period</span>
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
                                <p className={lbl}>Cached tokens</p>
                                <p className={`mt-1 ${val}`}>{formatNumber(usageData.cachedTokens)}</p>
                            </div>
                            <div className="rounded-2xl bg-sky-500/10 p-2 text-sky-400">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                        </div>
                        <p className={`mt-3 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Saved by cache reads and repeated context.</p>
                    </div>

                    <div className={card}>
                        <div className="flex items-center gap-2">
                            <div className={`rounded-2xl p-2 ${darkMode ? 'bg-[#121212]' : 'bg-slate-100'}`}>
                                <RefreshCw className={`h-4 w-4 ${darkMode ? 'text-sky-400' : 'text-sky-600'}`} />
                            </div>
                            <div>
                                <p className={lbl}>Avg latency</p>
                                <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{usageData.averageLatencyMs} ms</p>
                            </div>
                        </div>
                        <p className={`mt-3 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Average response time for the selected period.</p>
                    </div>
                </div>
            </div>

            <div className={`mt-6 rounded-3xl border p-5 ${darkMode ? 'border-[#242424] bg-[#181818]' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className={lbl}>Usage breakdown</p>
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
                                    {isLive ? 'Live' : 'Offline'}
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
                                <span>Updated: {formatTime(lastUpdated)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {error && <div className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[['Input tokens', usageData.inputTokens], ['Output tokens', usageData.outputTokens], ['Total requests', usageData.totalRequests], ['Cached tokens', usageData.cachedTokens]].map(([l, v]) => (
                        <div key={l} className={`rounded-3xl border p-4 ${darkMode ? 'border-[#2b2b2b] bg-[#121212]' : 'border-gray-200 bg-white'}`}>
                            <p className={lbl}>{l}</p>
                            <p className={`mt-2 ${val}`}>{formatNumber(v)}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}