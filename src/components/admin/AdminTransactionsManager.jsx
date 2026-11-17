import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  DollarSign,
  Search,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Download,
  Calendar,
  Zap,
} from 'lucide-react';
import API_BASE from '../../lib/api';

function fmtDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminTransactionsManager({ dark }) {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'deposit' | 'usage'
  const [copiedId, setCopiedId] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/transactions?limit=250`);
      const data = await res.json();
      if (data?.transactions) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error('[AdminTransactionsManager] Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCsv = () => {
    if (!transactions.length) return;
    const headers = [
      'Date & Time',
      'User Email',
      'Type',
      'Description / Reference',
      'Stripe Session Ref',
      'Base Cost (OR)',
      'Net Profit',
      'Amount / Wallet Impact'
    ];
    const rows = transactions.map(t => {
      const isDeposit = t.type === 'deposit';
      const desc = t.model
        ? `${t.model.split('/').pop()}${t.tokens_total > 0 ? ` (${t.tokens_total} tok)` : ''}`
        : (t.metadata?.note || 'Stripe Deposit');
      return [
        `"${t.created_at ? new Date(t.created_at).toLocaleString() : ''}"`,
        `"${t.user_email || ''}"`,
        `"${isDeposit ? 'DEPOSIT' : 'USAGE'}"`,
        `"${desc}"`,
        `"${t.stripe_session_id || ''}"`,
        t.base_cost > 0 ? `$${Number(t.base_cost).toFixed(4)}` : '$0.00',
        t.profit_usd > 0 ? `+$${Number(t.profit_usd).toFixed(4)}` : '$0.00',
        isDeposit ? `+$${Number(t.amount).toFixed(2)}` : `-$${Math.abs(Number(t.amount)).toFixed(4)}`
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `netroot_billing_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    const email = (t.user_email || '').toLowerCase();
    const note = (t.metadata?.note || t.model || '').toLowerCase();
    const ref = (t.stripe_session_id || '').toLowerCase();
    return email.includes(s) || note.includes(s) || ref.includes(s);
  });

  const totalDeposits = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalUsage = transactions
    .filter(t => t.type === 'usage')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-5 rounded-2xl border ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400">Total Deposits Processed</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            ${totalDeposits.toFixed(2)}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Stripe Checkout & Pro Plan Included Credits</p>
        </div>

        <div className={`p-5 rounded-2xl border ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400">Total Billed Model Usage</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-blue-400">
            ${totalUsage.toFixed(4)}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">OpenRouter completions debited from wallets</p>
        </div>

        <div className={`p-5 rounded-2xl border ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400">Total Ledger Entries</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-purple-400">
            {transactions.length}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Immutable audit ledger events recorded</p>
        </div>
      </div>

      {/* Control bar: Search, Filters & Export */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border w-full ${dark ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
            <Search className="w-4 h-4 text-gray-500 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by user email, Stripe session ref, or note..."
              className="bg-transparent text-xs outline-none w-full text-white placeholder-gray-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-xs text-gray-500 hover:text-white">✕</button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className={`flex items-center p-1 rounded-xl border ${dark ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-gray-100 border-gray-200'}`}>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : dark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType('deposit')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'deposit'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : dark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Deposits
            </button>
            <button
              onClick={() => setFilterType('usage')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'usage'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : dark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Usage Debits
            </button>
          </div>

          <button
            onClick={fetchTransactions}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
              dark ? 'border-[#333] text-gray-300 hover:text-white hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportCsv}
            disabled={!transactions.length}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
              dark ? 'border-[#333] text-gray-300 hover:text-white hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className={`rounded-2xl border overflow-hidden ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
              dark ? 'bg-[#161616] border-[#222] text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}>
              <tr>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">User Email</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Description / Reference</th>
                <th className="py-3.5 px-4 text-right">Base Cost (OR)</th>
                <th className="py-3.5 px-4 text-right">Net Profit</th>
                <th className="py-3.5 px-4 text-right">Amount / Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading billing ledger...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-500">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((t, idx) => {
                  const isDeposit = t.type === 'deposit';
                  const refId = t.stripe_session_id || t.id;
                  return (
                    <tr key={t.id || idx} className="hover:bg-white/[0.02] transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-gray-400 whitespace-nowrap">
                        {fmtDate(t.created_at)}
                      </td>

                      {/* User Email */}
                      <td className="py-3.5 px-4 font-medium text-white">
                        <button
                          onClick={() => navigate(`/admin/user/${encodeURIComponent(t.user_email)}`)}
                          className="hover:text-blue-400 hover:underline flex items-center gap-1 group text-left"
                        >
                          <span>{t.user_email}</span>
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                        </button>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
                          isDeposit
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        }`}>
                          {isDeposit ? 'DEPOSIT' : 'USAGE'}
                        </span>
                      </td>

                      {/* Description & Stripe Ref */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-gray-200 truncate">
                          {t.model ? t.model.split('/').pop() : t.metadata?.note || 'Stripe Wallet Top-Up'}
                          {t.tokens_total > 0 && (
                            <span className="text-[10px] text-gray-500 font-mono ml-1.5">
                              ({Number(t.tokens_total).toLocaleString()} tok)
                            </span>
                          )}
                        </div>
                        {t.stripe_session_id && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] text-gray-500 truncate max-w-[150px]">
                              Ref: {t.stripe_session_id}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(t.stripe_session_id, refId)}
                              className="text-gray-500 hover:text-white transition-colors"
                              title="Copy Stripe Reference"
                            >
                              {copiedId === refId ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Base Cost */}
                      <td className="py-3.5 px-4 text-right font-mono text-[11px] text-orange-400/90 whitespace-nowrap">
                        {t.base_cost > 0 ? `$${Number(t.base_cost).toFixed(4)}` : '—'}
                      </td>

                      {/* Net Profit */}
                      <td className="py-3.5 px-4 text-right font-mono text-[11px] text-emerald-400 font-bold whitespace-nowrap">
                        {t.profit_usd > 0 ? `+$${Number(t.profit_usd).toFixed(4)}` : '—'}
                      </td>

                      {/* Amount / Impact */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                        <span className={isDeposit ? 'text-emerald-400' : 'text-gray-300'}>
                          {isDeposit ? `+$${Number(t.amount).toFixed(2)}` : `-$${Math.abs(Number(t.amount)).toFixed(4)}`}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

