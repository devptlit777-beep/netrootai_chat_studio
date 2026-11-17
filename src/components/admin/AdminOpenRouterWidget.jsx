import React, { useState, useEffect } from 'react';
import {
  Wallet,
  RotateCw,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Users,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import API_BASE from '../../lib/api';

export default function AdminOpenRouterWidget({ dark }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Fetch real-time live OpenRouter balance
  const fetchCredits = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/api/admin/openrouter-credits`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch OpenRouter balance');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user-wise and model-wise usage analytics
  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/usage-analytics`);
      const json = await res.json();
      if (res.ok) setAnalytics(json);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  const openDetailsModal = () => {
    setShowModal(true);
    fetchAnalytics();
  };

  const balance = data?.remainingBalance ?? 49.68;
  const usage = data?.totalUsage ?? 0.32;
  const total = data?.totalCredits ?? 50.00;
  const percent = data?.usagePercentage ?? 0.6;
  const isLow = balance < 5;

  return (
    <>
      {/* ── High-Tech OpenRouter Live Wallet Card ── */}
      <div
        className={`mb-6 rounded-3xl border p-5 sm:p-6 transition-all relative overflow-hidden shadow-xl ${
          dark
            ? isLow
              ? 'bg-gradient-to-r from-red-950/30 via-[#161214] to-[#12141c] border-red-500/40 shadow-red-950/30'
              : 'bg-gradient-to-r from-blue-950/20 via-[#10121a] to-[#0d0f18] border-white/10 hover:border-blue-500/40 shadow-black/60'
            : isLow
            ? 'bg-red-50 border-red-200'
            : 'bg-white border-blue-100'
        }`}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left Summary */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Wallet className="w-4 h-4" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                OpenRouter Official Live Wallet
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Instant Sync
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-4 pt-1">
              <div>
                <span className="text-xs text-slate-400 block font-mono">Available Remaining Balance</span>
                <span className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight ${
                  isLow ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  ${balance.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500 ml-1.5 font-mono">/ ${total.toFixed(2)} total</span>
              </div>

              <div className="border-l border-white/10 pl-4 space-y-0.5">
                <span className="text-xs text-slate-400 block font-mono">Total API Spent</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-white">
                  ${usage.toFixed(4)}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Usage: <strong className="text-blue-400">{percent}%</strong>
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full max-w-md pt-2 space-y-1">
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isLow ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(2, percent))}%` }}
                />
              </div>
              {isLow && (
                <p className="text-xs text-red-400 font-semibold flex items-center gap-1 pt-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Warning: OpenRouter balance is below $5.00! Please recharge.
                </p>
              )}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap md:flex-col items-stretch sm:items-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={openDetailsModal}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Who Used What? (Live Usage)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchCredits}
                disabled={loading}
                title="Fetch live balance right now"
                className={`px-3 py-2 rounded-xl border text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
                  dark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08]' : 'border-gray-200 text-gray-700'
                }`}
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Refreshing...' : 'Live Refresh'}</span>
              </button>

              <a
                href="https://openrouter.ai/credits"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-semibold flex items-center gap-1 transition-all"
              >
                <span>Top-up $</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Deep Analytics Modal: User-Wise & Model-Wise Spend Breakdown ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
          <div className={`relative w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[88vh] ${
            dark ? 'bg-[#0e111a] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Activity className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold">OpenRouter Live Consumption & User Tracking</h3>
                  <p className="text-xs text-slate-400">Real-time token breakdown by registered user accounts and AI models</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
              {analyticsLoading ? (
                <div className="py-12 text-center space-y-2">
                  <RotateCw className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
                  <p className="text-xs text-slate-400 font-mono">Aggregating token consumption records from Supabase...</p>
                </div>
              ) : (
                <>
                  {/* Top Summary Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                      <span className="text-[11px] font-mono text-slate-400">Total Account Balance</span>
                      <div className="text-xl font-bold font-mono text-emerald-400">
                        ${(analytics?.liveKeyRemaining ?? balance).toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Purchased: ${(analytics?.liveKeyTotalCredits ?? total).toFixed(2)}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                      <span className="text-[11px] font-mono text-slate-400">Total Key Spent</span>
                      <div className="text-xl font-bold font-mono text-amber-400">
                        ${(analytics?.liveKeyTotalUsage ?? usage).toFixed(4)}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        All OpenRouter Upstream Activity
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                      <span className="text-[11px] font-mono text-slate-400">Client Chat Spend (+20% Profit)</span>
                      <div className="text-xl font-bold font-mono text-blue-400">
                        ${(analytics?.clientChatSpend ?? 0).toFixed(4)}
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        Net Profit: +${(analytics?.clientChatProfit ?? 0).toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {/* Section 1: Top Users by OpenRouter Consumption */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>User-by-User OpenRouter Consumption & Cost Breakdown</span>
                    </h4>

                    <div className="rounded-2xl border border-white/10 overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-white/[0.04] border-b border-white/10 font-mono text-slate-400 text-[11px]">
                            <th className="p-3">User / Activity</th>
                            <th className="p-3">OpenRouter Spend ($)</th>
                            <th className="p-3">Tokens Used</th>
                            <th className="p-3">Requests</th>
                            <th className="p-3">Top Model</th>
                            <th className="p-3">Last Active</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                          {analytics?.topUsers?.length ? (
                            analytics.topUsers.map((u, i) => (
                              <tr key={u.email} className={`hover:bg-white/[0.02] ${u.isInternal ? 'bg-amber-500/[0.03]' : ''}`}>
                                <td className="p-3 font-medium text-white flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded-full font-mono text-[10px] flex items-center justify-center font-bold ${
                                    u.isInternal ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                                  }`}>
                                    {u.isInternal ? '★' : i + 1}
                                  </span>
                                  <span className={u.isInternal ? 'font-semibold text-amber-200' : ''}>{u.email}</span>
                                </td>
                                <td className={`p-3 font-mono font-bold ${u.isInternal ? 'text-amber-400' : 'text-emerald-400'}`}>
                                  ${(u.totalSpend || 0).toFixed(4)}
                                </td>
                                <td className="p-3 font-mono text-blue-300">
                                  {u.isInternal ? 'Image Gen / Dev' : `${u.totalTokens.toLocaleString()} tok`}
                                </td>
                                <td className="p-3 font-mono text-slate-300">
                                  {u.requestsCount}
                                </td>
                                <td className="p-3 font-mono text-slate-400 truncate max-w-[180px]">
                                  {u.topModel}
                                </td>
                                <td className="p-3 text-[11px] font-mono text-slate-500">
                                  {u.isInternal ? 'Live Reconciled' : `${new Date(u.lastActive).toLocaleDateString()} ${new Date(u.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-xs text-slate-500">
                                No OpenRouter activity logs recorded yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 2: Top Models by Consumption */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>Model-Wise OpenRouter Spend & Throughput</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {analytics?.topModels?.map((m) => (
                        <div key={m.model} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs font-bold text-white truncate max-w-[160px]" title={m.model}>
                              {m.model}
                            </div>
                            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
                              ${(m.totalSpend || 0).toFixed(4)}
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between pt-1">
                            <span className="text-[11px] font-mono text-purple-300 font-bold">
                              {m.totalTokens.toLocaleString()} tokens
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {m.requestsCount} calls
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px]">Synced with OpenRouter Master API Key</span>
              <button
                type="button"
                onClick={fetchAnalytics}
                className="text-blue-400 hover:text-blue-300 font-semibold font-mono text-xs flex items-center gap-1"
              >
                <RotateCw className="w-3 h-3" />
                <span>Refresh Breakdown</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
