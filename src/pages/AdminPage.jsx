import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users, Zap, TrendingUp, LogOut, RefreshCw, Search, Shield, CreditCard, DollarSign, Wallet,
  ChevronDown, ChevronUp, X, Clock, Activity, MessageSquare, Cpu, Mail, RotateCw,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import API_BASE from '../lib/api';
import AdminModelsManager from '../components/admin/AdminModelsManager';
import AdminTransactionsManager from '../components/admin/AdminTransactionsManager';
import AdminNotificationBell from '../components/admin/AdminNotificationBell';
import AdminOpenRouterWidget from '../components/admin/AdminOpenRouterWidget';
import { Receipt } from 'lucide-react';

const ADMIN_EMAIL = 'admin@netrootai.com';
const ADMIN_PASSWORD = 'NetrootAdmin@2024';

function fmt(n) { return (n || 0).toLocaleString(); }
function fmtMs(ms) { return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`; }
function fmtDate(ts) { return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function fmtPlanDate(ts) { return ts ? new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'; }

function StatusBadge({ status }) {
  const { t } = useTranslation();
  const active = status === 'active';
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>{active ? t('admin.active') : t('admin.expired')}</span>;
}

export default function AdminPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const navigate = useNavigate();

  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin_authed') === '1');
  const [adminTab, setAdminTab] = useState('users'); // 'users' or 'models'
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginErr, setLoginErr] = useState('');

  const [users, setUsers] = useState([]);
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('tokens');
  const [sortDir, setSortDir] = useState('desc');
  const [financials, setFinancials] = useState({ totalDeposits: 0, totalBaseCost: 0, totalProfit: 0, totalWalletReserves: 0, marginPercentage: 20 });
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'profitable' | 'heavy' | 'low_balance'

  // selected user detail
  const [selectedUser, setSelectedUser] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [querySearch, setQuerySearch] = useState('');
  const [notifyingEmail, setNotifyingEmail] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [reactivatingEmail, setReactivatingEmail] = useState('');

  function handleLogin(e) {
    e.preventDefault();
    if (loginEmail.trim().toLowerCase() === ADMIN_EMAIL && loginPw === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_authed', '1');
      setAuthed(true);
    } else {
      setLoginErr(t('admin.invalidCredentials'));
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_authed');
    setAuthed(false);
    navigate('/login');
  }

  async function fetchData() {
    setLoading(true);
    try {
      const [ur, ur2] = await Promise.all([
        fetch(`${API_BASE}/api/admin/users`),
        fetch(`${API_BASE}/api/usage?period=30d`),
      ]);
      const uj = await ur.json();
      const u2j = await ur2.json();
      setUsers(uj.users || []);
      if (uj.financials) setFinancials(uj.financials);
      setUsageData(u2j);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function notifyExpiredUser(event, user) {
    event.stopPropagation();
    setNotifyingEmail(user.email);
    setNotificationMessage('');
    try {
      const response = await fetch(`${API_BASE}/api/admin/send-expired-plan-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('admin.unableSendNotification'));
      setNotificationMessage(t('common.notificationSent', { email: user.email }));
    } catch (error) {
      setNotificationMessage(error.message);
    } finally {
      setNotifyingEmail('');
    }
  }

  async function reactivateUser(event, user) {
    event.stopPropagation();
    if (!window.confirm(t('common.reactivateConfirmation', { email: user.email }))) return;
    setReactivatingEmail(user.email);
    setNotificationMessage('');
    try {
      const response = await fetch(`${API_BASE}/api/admin/reactivate-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('common.unableReactivate'));
      setNotificationMessage(t('common.reactivatedUntil', { email: user.email, date: fmtPlanDate(data.current_period_end) }));
      await fetchData();
    } catch (error) {
      setNotificationMessage(error.message);
    } finally {
      setReactivatingEmail('');
    }
  }

  async function fetchUserDetail(email) {
    setDetailLoading(true);
    setDetail(null);
    setQuerySearch('');
    try {
      const r = await fetch(`${API_BASE}/api/admin/user-detail?email=${encodeURIComponent(email)}`);
      const j = await r.json();
      setDetail(j);
    } catch (e) { console.error(e); }
    setDetailLoading(false);
  }

  function openUser(u) {
    navigate(`/admin/user/${encodeURIComponent(u.email)}`);
  }

  function closeDetail() {
    setSelectedUser(null);
    setDetail(null);
  }

  useEffect(() => { if (authed) fetchData(); }, [authed]);

  function toggleSort(f) {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('desc'); }
  }

  const filtered = users
    .filter(u => {
      const matchesSearch = (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.full_name || '').toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      if (filterMode === 'profitable') return (u.profit_usd || 0) > 0;
      if (filterMode === 'low_balance') return (u.wallet_balance || 0) < 2.0;
      if (filterMode === 'heavy') return (u.tokens || 0) > 10000 || (u.openrouter_cost || 0) > 0.05;
      return true;
    })
    .sort((a, b) => {
      let av = 0, bv = 0;
      if (sortField === 'tokens') { av = a.tokens || 0; bv = b.tokens || 0; }
      else if (sortField === 'profit') { av = a.profit_usd || 0; bv = b.profit_usd || 0; }
      else if (sortField === 'openrouter_cost') { av = a.openrouter_cost || 0; bv = b.openrouter_cost || 0; }
      else if (sortField === 'billed_cost') { av = a.billed_cost || 0; bv = b.billed_cost || 0; }
      else if (sortField === 'wallet_balance') { av = a.wallet_balance || 0; bv = b.wallet_balance || 0; }
      else if (sortField === 'email') { av = a.email; bv = b.email; }
      else if (sortField === 'plan') { av = a.plan || ''; bv = b.plan || ''; }
      else if (sortField === 'status') { av = a.plan_status || ''; bv = b.plan_status || ''; }
      else if (sortField === 'end_date') { av = a.current_period_end || ''; bv = b.current_period_end || ''; }
      else { av = a.created_at || ''; bv = b.created_at || ''; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const maxTokens = Math.max(1, ...users.map(u => u.tokens || 0));
  const proUsers = users.filter(u => u.plan === 'pro' && u.plan_status === 'active').length;
  const expiredUsers = users.filter(u => u.plan_status === 'expired').length;

  const getQueryText = q => q.prompt || q.query || q.message || null;
  const filteredQueries = (detail?.queries || []).filter(q =>
    !querySearch || (getQueryText(q) || '').toLowerCase().includes(querySearch.toLowerCase())
  );
  const userTimeline = detail?.timeline || [];
  const maxUserTimelineTokens = Math.max(1, ...userTimeline.map(day => day.tokens || 0));

  function SortIcon({ field }) {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-[#0a0a0f]' : 'bg-gray-50'}`}>
        <div className={`w-full max-w-sm mx-4 border rounded-2xl px-8 py-10 shadow-2xl ${dark ? 'bg-[#111118] border-white/10' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-center mb-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${dark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
              <Shield className="w-7 h-7 text-blue-500" />
            </div>
          </div>
          <h1 className={`text-xl font-bold text-center mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>{t('admin.dashboard')}</h1>
          <p className={`text-sm text-center mb-7 ${dark ? 'text-gray-500' : 'text-gray-500'}`}>{t('admin.restrictedAccess')}</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder={t('admin.emailPlaceholder')} value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
              className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none ${dark ? 'bg-[#1a1a28] border-white/10 text-white placeholder-gray-500 focus:border-blue-500/60' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'}`} required />
            <input type="password" placeholder={t('admin.passwordPlaceholder')} value={loginPw} onChange={e => setLoginPw(e.target.value)}
              className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none ${dark ? 'bg-[#1a1a28] border-white/10 text-white placeholder-gray-500 focus:border-blue-500/60' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'}`} required />
            {loginErr && <p className="text-red-400 text-sm">{loginErr}</p>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
              {t('admin.signIn')}
            </button>
          </form>
          <button onClick={() => navigate('/login')} className={`mt-4 w-full text-center text-sm ${dark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
            {t('admin.backToLogin')}
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen w-full overflow-x-hidden ${dark ? 'bg-[#0e0e0e] text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`border-b px-4 sm:px-6 py-3.5 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 sticky top-0 z-30 ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3 shrink-0 min-w-max">
          <img src="/image.png" alt="NetRoot AI logo" className="w-9 h-9 object-contain shrink-0" />
          <div>
            <h1 className="font-bold text-lg leading-none">{t('admin.dashboard')}</h1>
            <p className={`text-xs mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>NetRoot AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          <div className={`flex items-center p-1 rounded-xl border mr-2 ${dark ? 'bg-[#181818] border-[#2a2a2a]' : 'bg-gray-100 border-gray-200'}`}>
            <button
              onClick={() => setAdminTab('users')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                adminTab === 'users' ? 'bg-blue-600 text-white shadow-sm' : dark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Users & Usage
            </button>
            <button
              onClick={() => setAdminTab('transactions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                adminTab === 'transactions' ? 'bg-blue-600 text-white shadow-sm' : dark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Payments & Billing Log
            </button>
            <button
              onClick={() => setAdminTab('models')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                adminTab === 'models' ? 'bg-blue-600 text-white shadow-sm' : dark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              AI Models & Dynamic Pricing
            </button>
          </div>
          {/* Real-Time Live Notification Center for Model & OpenRouter Alerts */}
          <AdminNotificationBell dark={dark} />

          <button onClick={fetchData} disabled={loading} className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${dark ? 'border-[#333] text-gray-400 hover:text-white' : 'border-gray-200 text-gray-500 hover:text-gray-700'}`}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> {t('admin.refresh')}
          </button>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors">
            <LogOut className="w-3.5 h-3.5" /> {t('admin.logout')}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ── OpenRouter Live Master Balance & Real-Time Usage Tracking ── */}
        <AdminOpenRouterWidget dark={dark} />

        {adminTab === 'models' ? (
          <AdminModelsManager dark={dark} />
        ) : adminTab === 'transactions' ? (
          <AdminTransactionsManager dark={dark} />
        ) : (
          <>
            {/* Stats */}
                {/* ── Global Financial Overview Cards (NetRoot AI & OpenRouter P&L) ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> Platform Financial Revenue & P&L Engine
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
              dark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              +{financials.marginPercentage || 20}% Net Margin Applied
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Deposits */}
            <div className={`rounded-2xl border p-5 relative overflow-hidden ${
              dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'
            }`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-blue-500/10 text-blue-400">
                <CreditCard className="w-4.5 h-4.5" />
              </div>
              <p className={`text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Total Wallet Deposits</p>
              <p className="text-2xl font-black mt-0.5 font-mono text-blue-400">
                ${(financials.totalDeposits || 0).toFixed(2)}
              </p>
              <p className={`text-[10px] mt-1.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Stripe collections into NetRoot</p>
            </div>

            {/* Card 2: OpenRouter Base Cost */}
            <div className={`rounded-2xl border p-5 relative overflow-hidden ${
              dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'
            }`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-orange-500/10 text-orange-400">
                <Cpu className="w-4.5 h-4.5" />
              </div>
              <p className={`text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>OpenRouter Paid (Base Cost)</p>
              <p className="text-2xl font-black mt-0.5 font-mono text-orange-400">
                ${Number(financials.totalBaseCost || 0) > 0 && Number(financials.totalBaseCost || 0) < 0.05 ? Number(financials.totalBaseCost || 0).toFixed(4) : Number(financials.totalBaseCost || 0).toFixed(2)}
              </p>
              <p className={`text-[10px] mt-1.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Upstream provider token cost</p>
            </div>

            {/* Card 3: Net Profit */}
            <div className={`rounded-2xl border p-5 relative overflow-hidden ${
              dark ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-200'
            }`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-emerald-500/15 text-emerald-400">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
              <p className={`text-xs font-medium ${dark ? 'text-emerald-300' : 'text-emerald-800'}`}>NetRoot Profit Earned</p>
              <p className="text-2xl font-black mt-0.5 font-mono text-emerald-400">
                +${Number(financials.totalProfit || 0) > 0 && Number(financials.totalProfit || 0) < 0.05 ? Number(financials.totalProfit || 0).toFixed(4) : Number(financials.totalProfit || 0).toFixed(2)}
              </p>
              <p className={`text-[10px] mt-1.5 ${dark ? 'text-emerald-400/70' : 'text-emerald-700'}`}>Net margin retained in your bank</p>
            </div>

            {/* Card 4: Wallet Reserves */}
            <div className={`rounded-2xl border p-5 relative overflow-hidden ${
              dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'
            }`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-purple-500/10 text-purple-400">
                <Wallet className="w-4.5 h-4.5" />
              </div>
              <p className={`text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Active Wallet Reserves</p>
              <p className="text-2xl font-black mt-0.5 font-mono text-purple-400">
                ${(financials.totalWalletReserves || 0).toFixed(2)}
              </p>
              <p className={`text-[10px] mt-1.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Unspent user credit balances</p>
            </div>
          </div>
        </div>

        {/* Existing Fleet Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-8">
          {[
            { icon: Users, label: t('admin.totalUsers'), value: users.length, color: 'blue' },
            { icon: Zap, label: t('admin.proUsers'), value: proUsers, color: 'purple' },
            { icon: Clock, label: t('admin.expiredPlans'), value: expiredUsers, color: 'red' },
            { icon: TrendingUp, label: t('admin.totalTokens30d'), value: fmt(usageData?.totalTokens || 0), color: 'emerald' },
            { icon: Activity, label: t('admin.avgLatency30d'), value: usageData?.averageLatencyMs ? fmtMs(usageData.averageLatencyMs) : '—', color: 'orange' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className={`rounded-2xl border p-5 ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${dark ? `bg-${color}-500/10` : `bg-${color}-50`}`}>
                <Icon className={`w-4.5 h-4.5 text-${color}-500`} />
              </div>
              <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-500'}`}>{label}</p>
              <p className="text-2xl font-bold mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div className={`rounded-2xl border ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
          <div className={`flex flex-col md:flex-row md:items-center justify-between px-5 py-4 border-b gap-3 ${dark ? 'border-[#222]' : 'border-gray-100'}`}>
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <span>{t('admin.allUsers')}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${dark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                  {filtered.length} of {users.length}
                </span>
              </h2>
              <p className={`text-xs mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                Click any user row to view model-by-model profit breakdown & query latency
              </p>
            </div>

            {/* Smart Filters & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className={`flex items-center p-1 rounded-xl border text-xs ${dark ? 'bg-[#181818] border-[#2a2a2a]' : 'bg-gray-100 border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    filterMode === 'all' ? 'bg-blue-600 text-white shadow-xs' : dark ? 'text-gray-400 hover:text-white' : 'text-gray-600'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('pro_users')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    filterMode === 'pro_users' ? 'bg-purple-600 text-white shadow-xs' : dark ? 'text-gray-400 hover:text-white' : 'text-gray-600'
                  }`}
                >
                  ⭐ Pro Users ({proUsers})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('profitable')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    filterMode === 'profitable' ? 'bg-emerald-600 text-white shadow-xs' : dark ? 'text-gray-400 hover:text-white' : 'text-gray-600'
                  }`}
                >
                  🔥 Profitable
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('heavy')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    filterMode === 'heavy' ? 'bg-orange-600 text-white shadow-xs' : dark ? 'text-gray-400 hover:text-white' : 'text-gray-600'
                  }`}
                >
                  ⚡ Heavy Usage
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('low_balance')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    filterMode === 'low_balance' ? 'bg-red-600 text-white shadow-xs' : dark ? 'text-gray-400 hover:text-white' : 'text-gray-600'
                  }`}
                >
                  ⚠️ Low Balance
                </button>
              </div>

              <div className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 ${dark ? 'bg-[#1a1a1a] border-[#333]' : 'bg-gray-50 border-gray-200'}`}>
                <Search className={`w-3.5 h-3.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('admin.searchUsers')}
                  className={`bg-transparent text-xs outline-none w-36 ${dark ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
                />
              </div>
            </div>
          </div>
          {notificationMessage && <p className={`px-5 py-2 text-xs ${notificationMessage.startsWith(t('common.notificationSentPrefix')) ? 'text-emerald-400' : 'text-red-400'}`}>{notificationMessage}</p>}

          {loading ? (
            <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b ${dark ? 'border-[#222]' : 'border-gray-100'}`}>
                    {[
                      { label: '#', field: null, w: 'w-8' },
                      { label: t('admin.email'), field: 'email' },
                      { label: t('admin.plan'), field: 'plan' },
                      { label: 'Wallet', field: 'wallet_balance' },
                      { label: 'OpenRouter Paid', field: 'openrouter_cost' },
                      { label: 'Billed Cost', field: 'billed_cost' },
                      { label: '💰 Net Profit', field: 'profit' },
                      { label: t('admin.tokens30d'), field: 'tokens' },
                      { label: t('admin.status'), field: 'status' },
                      { label: t('admin.action'), field: null },
                    ].map(({ label, field, w }) => (
                      <th key={label} onClick={() => field && toggleSort(field)}
                        className={`text-left px-4 py-3 font-medium ${dark ? 'text-gray-400' : 'text-gray-600'} ${field ? 'cursor-pointer select-none hover:text-white' : ''} ${w || ''}`}>
                        <div className="flex items-center gap-1">{label}{field && <SortIcon field={field} />}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={10} className={`text-center py-12 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>{t('admin.noUsersFound')}</td></tr>
                  ) : filtered.map((u, i) => (
                    <tr key={u.id} onClick={() => openUser(u)}
                      className={`border-b last:border-0 cursor-pointer transition-colors ${dark ? 'border-[#1a1a1a] hover:bg-white/[0.04]' : 'border-gray-50 hover:bg-blue-50/40'} ${selectedUser?.id === u.id ? dark ? 'bg-blue-500/5' : 'bg-blue-50' : ''}`}>
                      <td className={`px-4 py-3.5 text-xs ${dark ? 'text-gray-600' : 'text-gray-400'}`}>{i + 1}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className={`font-medium text-xs ${dark ? 'text-gray-200' : 'text-gray-900'}`}>{u.email}</span>
                          {u.full_name && <span className={`text-[11px] ${dark ? 'text-gray-500' : 'text-gray-500'}`}>{u.full_name}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {u.plan === 'pro' ? (
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1 w-max ${
                            u.interval_months === 3
                              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                              : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          }`}>
                            {u.interval_months === 3 ? 'Pro (3 Mo - $49)' : 'Pro (1 Mo - $19)'}
                          </span>
                        ) : (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dark ? 'bg-white/5 text-gray-400 border border-[#2a2a2a]' : 'bg-gray-100 text-gray-600'}`}>
                            {u.plan || 'free'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs">
                        <span className={`font-bold ${(u.wallet_balance || 0) < 1 ? 'text-amber-400' : 'text-blue-400'}`}>
                          ${Number(u.wallet_balance || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className={`px-4 py-3.5 font-mono text-xs ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                        ${Number(u.openrouter_cost || 0) > 0 && Number(u.openrouter_cost || 0) < 0.05 ? Number(u.openrouter_cost || 0).toFixed(4) : Number(u.openrouter_cost || 0).toFixed(2)}
                      </td>
                      <td className={`px-4 py-3.5 font-mono text-xs font-medium ${dark ? 'text-gray-300' : 'text-gray-800'}`}>
                        ${Number(u.billed_cost || 0) > 0 && Number(u.billed_cost || 0) < 0.05 ? Number(u.billed_cost || 0).toFixed(4) : Number(u.billed_cost || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs">
                        <span className="font-bold text-emerald-400">
                          +${Number(u.profit_usd || 0) > 0 && Number(u.profit_usd || 0) < 0.05 ? Number(u.profit_usd || 0).toFixed(4) : Number(u.profit_usd || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`h-1.5 w-16 rounded-full overflow-hidden ${dark ? 'bg-white/5' : 'bg-gray-100'}`}>
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, ((u.tokens || 0) / maxTokens) * 100)}%` }} />
                          </div>
                          <span className={`text-xs font-mono ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{fmt(u.tokens)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge status={u.plan_status} /></td>
                      <td className="px-4 py-3.5">
                        {u.plan_status === 'expired' && (
                          <button
                            onClick={event => reactivateUser(event, u)}
                            disabled={reactivatingEmail === u.email}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:cursor-wait disabled:opacity-60"
                            title={t('admin.activateFreeTitle')}
                          >
                            <RotateCw className="h-3 w-3" /> Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
      )}
      </div>

      {/* ── User Detail Drawer ─────────────────────────────────────────────── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex">
          {/* backdrop */}
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={closeDetail} />

          {/* panel */}
          <div className={`w-full max-w-2xl h-full overflow-y-auto flex flex-col border-l ${dark ? 'bg-[#0e0e0e] border-[#222]' : 'bg-white border-gray-200'}`}>
            {/* panel header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10 ${dark ? 'bg-[#0e0e0e] border-[#222]' : 'bg-white border-gray-100'}`}>
              <div>
                <p className="font-semibold">{selectedUser.email}</p>
                <p className={`text-xs mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{selectedUser.full_name || t('admin.noName')} · <span className={selectedUser.plan === 'pro' ? 'text-purple-400' : dark ? 'text-gray-500' : 'text-gray-400'}>{selectedUser.plan || 'free'}</span></p>
              </div>
              <button onClick={closeDetail} className={`w-8 h-8 flex items-center justify-center rounded-lg ${dark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center flex-1 py-20">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : detail ? (
              <div className="px-6 py-5 space-y-6">
                {/* Summary stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: t('admin.tokens24h'), value: fmt(detail.tokens24h) },
                    { label: t('admin.tokens30dShort'), value: fmt(detail.tokens30d) },
                    { label: t('admin.requests30d'), value: fmt(detail.requests30d) },
                    { label: t('admin.avgLatency'), value: detail.avgLatencyMs ? fmtMs(detail.avgLatencyMs) : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className={`rounded-xl border p-3 ${dark ? 'bg-[#111] border-[#222]' : 'bg-gray-50 border-gray-200'}`}>
                      <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-500'}`}>{label}</p>
                      <p className="text-lg font-bold mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Selected user token usage */}
                <div className={`rounded-xl border p-4 ${dark ? 'bg-[#111] border-[#222]' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{t('admin.dailyTokenUsage')}</p>
                      <p className={`text-xs mt-1 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>{t('admin.last7Days')}</p>
                    </div>
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-3 items-end h-36">
                    {userTimeline.map((day, index) => (
                      <div key={`${day.label}-${index}`} className="h-full flex flex-col items-center justify-end gap-1.5 min-w-0">
                        <span className={`text-[9px] truncate max-w-full ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{fmt(day.tokens)}</span>
                        <div className="w-full max-w-9 h-24 flex items-end">
                          <div
                            className="w-full rounded-t bg-blue-500"
                            style={{ height: `${Math.max(4, ((day.tokens || 0) / maxUserTimelineTokens) * 100)}%` }}
                            title={`${day.label}: ${fmt(day.tokens)} tokens`}
                          />
                        </div>
                        <span className={`text-[10px] ${dark ? 'text-gray-500' : 'text-gray-500'}`}>{day.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Avg throughput */}
                {detail.avgThroughput > 0 && (
                  <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${dark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                    <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
                    <p className={`text-sm ${dark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      Avg throughput: <strong>{fmt(detail.avgThroughput)} tokens/sec</strong>
                    </p>
                  </div>
                )}

                {/* Per-model breakdown */}
                {Object.keys(detail.perModel || {}).length > 0 && (
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{t('admin.modelUsage30d')}</p>
                    <div className="space-y-2">
                      {Object.entries(detail.perModel).sort((a, b) => b[1].tokens - a[1].tokens).map(([model, stats]) => (
                        <div key={model} className={`flex items-center justify-between rounded-lg px-3 py-2 ${dark ? 'bg-[#111] border border-[#222]' : 'bg-gray-50 border border-gray-200'}`}>
                          <div className="flex items-center gap-2">
                            <Cpu className={`w-3.5 h-3.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                            <span className={`text-sm font-mono ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{model}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className={dark ? 'text-gray-400' : 'text-gray-600'}>{fmt(stats.tokens)} tokens</span>
                            <span className={dark ? 'text-gray-600' : 'text-gray-400'}>{stats.requests} req</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Queries */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {t('admin.recentQueries', { count: filteredQueries.length })}
                    </p>
                    <div className={`flex items-center gap-2 border rounded-lg px-2.5 py-1 ${dark ? 'bg-[#1a1a1a] border-[#333]' : 'bg-gray-50 border-gray-200'}`}>
                      <Search className={`w-3 h-3 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <input value={querySearch} onChange={e => setQuerySearch(e.target.value)} placeholder={t('admin.filterQueries')}
                        className={`bg-transparent text-xs outline-none w-32 ${dark ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`} />
                    </div>
                  </div>

                  {filteredQueries.length === 0 ? (
                    <p className={`text-sm text-center py-8 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>{t('admin.noQueriesFound')}</p>
                  ) : (
                    <div className="space-y-2">
                      {filteredQueries.map((q, i) => (
                        <div key={i} className={`rounded-xl border p-4 ${dark ? 'bg-[#111] border-[#222]' : 'bg-gray-50 border-gray-200'}`}>
                          {/* Query text */}
                          <div className="flex items-start gap-2 mb-3">
                            <MessageSquare className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${dark ? 'text-blue-400' : 'text-blue-500'}`} />
                            <p className={`text-sm leading-relaxed ${dark ? 'text-gray-200' : 'text-gray-800'}`}>
                              {getQueryText(q) || <span className={dark ? 'text-gray-600 italic' : 'text-gray-400 italic'}>{t('admin.noPromptRecorded')}</span>}
                            </p>
                          </div>

                          {/* Metrics row */}
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span className={`flex items-center gap-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                              <Clock className="w-3 h-3" />
                              {fmtDate(q.ts)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full font-mono ${dark ? 'bg-white/5 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                              {q.model?.split('/').pop() || q.model}
                            </span>
                            <span className={`flex items-center gap-1 ${dark ? 'text-blue-400' : 'text-blue-600'}`}>
                              <Zap className="w-3 h-3" />
                              {fmt(q.totalTokens)} tokens
                            </span>
                            <span className={`flex items-center gap-1 ${dark ? 'text-amber-400' : 'text-amber-600'}`}>
                              <Clock className="w-3 h-3" />
                              {fmtMs(q.latencyMs)}
                            </span>
                            {q.throughput > 0 && (
                              <span className={`flex items-center gap-1 ${dark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                <Activity className="w-3 h-3" />
                                {fmt(q.throughput)} tok/s
                              </span>
                            )}
                          </div>

                          {/* Token bar */}
                          <div className="mt-3 flex items-center gap-2">
                            <div className={`flex-1 h-1 rounded-full overflow-hidden ${dark ? 'bg-white/5' : 'bg-gray-200'}`}>
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (q.inputTokens / Math.max(1, q.totalTokens)) * 100)}%` }} />
                            </div>
                            <span className={`text-[10px] whitespace-nowrap ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
                              in {fmt(q.inputTokens)} / out {fmt(q.outputTokens)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
