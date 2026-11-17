import { useState, useEffect } from 'react';
import {
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
  Sliders,
  DollarSign,
  Eye,
  EyeOff,
  Star,
  Check,
  Filter,
  Shield,
  Layers,
  Clock,
  CheckCheck,
  SlidersHorizontal,
  ArrowUpDown,
  Flame,
  Award,
  AlertTriangle,
  CheckSquare,
  Square,
  X,
  Calendar,
  Tag,
  Activity,
  Copy,
  ExternalLink,
  Bell,
  Radio,
  ArrowRight,
} from 'lucide-react';
import API_BASE from '../../lib/api';

export default function AdminModelsManager({ dark }) {
  const [activeTab, setActiveTab] = useState('fleet'); // 'fleet' or 'changelog'
  const [models, setModels] = useState([]);
  const [settings, setSettings] = useState({ global_margin_percentage: 20 });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [savingMargin, setSavingMargin] = useState(false);
  const [marginInput, setMarginInput] = useState('20');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, free, paid, visible, hidden
  const [providerFilter, setProviderFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popular'); // popular, name, price_asc, price_desc, context
  const [statusMsg, setStatusMsg] = useState('');
  const [editingNameId, setEditingNameId] = useState(null);
  const [tempName, setTempName] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Multi-select & confirmation modal state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmModal, setConfirmModal] = useState(null);

  // Auto-Cron & Changelog Feed State
  const [changelog, setChangelog] = useState([]);
  const [changelogLoading, setChangelogLoading] = useState(false);
  const [changelogFilter, setChangelogFilter] = useState('all'); // all, new_model, price_drop, free_tier
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [autoSyncHours, setAutoSyncHours] = useState(24);
  const [updatingCron, setUpdatingCron] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchModels(sortBy);
    fetchChangelog();
  }, [sortBy]);

  async function fetchModels(sort = sortBy) {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/models?all=true&sortBy=${sort}`);
      const data = await res.json();
      if (data.models) {
        setModels(data.models);
      }
      if (data.settings) {
        setSettings(data.settings);
        setMarginInput(String(data.settings.global_margin_percentage ?? 20));
        if (data.settings.auto_sync !== undefined) {
          setAutoSyncEnabled(Boolean(data.settings.auto_sync));
        }
        if (data.settings.auto_sync_interval_hours) {
          setAutoSyncHours(Number(data.settings.auto_sync_interval_hours));
        }
      }
    } catch (err) {
      console.error('Failed to load models:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchChangelog() {
    setChangelogLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/models/changelog`);
      const data = await res.json();
      if (data.changelog) {
        setChangelog(data.changelog);
      }
      if (data.auto_sync !== undefined) {
        setAutoSyncEnabled(Boolean(data.auto_sync));
      }
      if (data.auto_sync_interval_hours) {
        setAutoSyncHours(Number(data.auto_sync_interval_hours));
      }
      if (data.next_auto_sync_at && settings) {
        setSettings(prev => ({ ...prev, next_auto_sync_at: data.next_auto_sync_at }));
      }
    } catch (err) {
      console.error('Failed to load changelog:', err);
    } finally {
      setChangelogLoading(false);
    }
  }

  async function handleToggleAutoSync(newVal) {
    setUpdatingCron(true);
    setStatusMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/models/cron-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_sync: newVal, interval_hours: autoSyncHours }),
      });
      const data = await res.json();
      if (data.success) {
        setAutoSyncEnabled(newVal);
        setSettings(data.settings);
        setStatusMsg(newVal ? `Auto-sync cron enabled (running every ${autoSyncHours} hours)` : 'Auto-sync cron paused.');
      }
    } catch (err) {
      setStatusMsg(`Cron update error: ${err.message}`);
    } finally {
      setUpdatingCron(false);
    }
  }

  async function handleChangeInterval(newHours) {
    setUpdatingCron(true);
    setStatusMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/models/cron-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_sync: autoSyncEnabled, interval_hours: newHours }),
      });
      const data = await res.json();
      if (data.success) {
        setAutoSyncHours(newHours);
        setSettings(data.settings);
        setStatusMsg(`Sync frequency updated to every ${newHours} hours.`);
      }
    } catch (err) {
      setStatusMsg(`Cron update error: ${err.message}`);
    } finally {
      setUpdatingCron(false);
    }
  }

  function handleCopyId(id) {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  function handleConfigureInFleet(modelId) {
    setActiveTab('fleet');
    setFilterType('all');
    setProviderFilter('all');
    setPage(1);
    setSearch(modelId);
  }

  function formatNextSync(ts) {
    if (!ts) return 'Not scheduled';
    const date = new Date(ts);
    const now = new Date();
    const diffHours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    if (diffHours <= 0) return 'Running soon...';
    return `In ~${diffHours}h (${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})`;
  }

  async function handleSync() {
    setSyncing(true);
    setStatusMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/models/sync`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`Successfully synced ${data.count} models from upstream fleet!`);
        await fetchModels();
        await fetchChangelog();
      } else {
        setStatusMsg(`Sync error: ${data.error || 'Failed'}`);
      }
    } catch (err) {
      setStatusMsg(`Sync error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

  async function handleBulkAction(action, ids = null) {
    setBulkLoading(true);
    setStatusMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/models/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids }),
      });
      const data = await res.json();
      if (data.success) {
        let actionLabel = '';
        if (action === 'hide_all') actionLabel = 'All models hidden from users.';
        else if (action === 'show_all') actionLabel = 'All models enabled for users.';
        else if (action === 'enable_frontier_only') actionLabel = 'Only Top Frontier models are now active!';
        else if (action === 'show_selected') actionLabel = `${ids?.length || 0} selected models are now visible to users.`;
        else if (action === 'hide_selected') actionLabel = `${ids?.length || 0} selected models hidden from users.`;

        setStatusMsg(actionLabel);
        setSelectedIds(new Set());
        await fetchModels();
      }
    } catch (err) {
      setStatusMsg(`Bulk action error: ${err.message}`);
    } finally {
      setBulkLoading(false);
    }
  }

  // Single Model Visibility Toggle - With Confirmation on Hide
  function handleToggleVisibility(m) {
    const isCurrentlyVisible = m.is_visible !== false;
    if (isCurrentlyVisible) {
      setConfirmModal({
        type: 'single',
        model: m,
        title: 'Confirm Hide AI Model',
        message: `Are you sure you want to hide "${m.display_name || m.name}" (${m.provider})? Users will no longer see or chat with this model in the Model Catalog and Chat Studio.`,
        confirmLabel: 'Yes, Hide Model',
        onConfirm: async () => {
          await updateModel(m.id, { is_visible: false });
          setConfirmModal(null);
          setStatusMsg(`"${m.display_name || m.name}" is now hidden from users.`);
        },
      });
    } else {
      updateModel(m.id, { is_visible: true });
      setStatusMsg(`"${m.display_name || m.name}" is now visible to users.`);
    }
  }

  // Selected Models Action Handlers
  function handleRequestHideSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setConfirmModal({
      type: 'selected',
      count: ids.length,
      title: `Confirm Hide ${ids.length} Selected Models`,
      message: `Are you sure you want to hide all ${ids.length} selected AI models? They will be removed from the catalog and chat options for regular users.`,
      confirmLabel: `Yes, Hide ${ids.length} Models`,
      onConfirm: async () => {
        await handleBulkAction('hide_selected', ids);
        setConfirmModal(null);
      },
    });
  }

  function handleUnhideSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    handleBulkAction('show_selected', ids);
  }

  // Danger Hide All Confirmation Handler
  function handleRequestHideAll() {
    setConfirmModal({
      type: 'all',
      count: models.length,
      title: '⚠️ Confirm Hide All AI Models',
      message: `Caution: You are about to hide all ${models.length} AI models. Users will not have access to any models in the chat studio until unhidden.`,
      confirmLabel: 'Yes, Hide All Models',
      onConfirm: async () => {
        await handleBulkAction('hide_all');
        setConfirmModal(null);
      },
    });
  }

  async function handleSaveMargin(customMargin = null) {
    setSavingMargin(true);
    setStatusMsg('');
    try {
      const margin = customMargin !== null ? customMargin : (parseFloat(marginInput) || 0);
      if (customMargin !== null) setMarginInput(String(customMargin));

      const res = await fetch(`${API_BASE}/api/admin/models/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ global_margin_percentage: margin }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setStatusMsg(`Global margin updated to ${margin}%. Recalculating prices for 400+ models...`);
        setTimeout(() => fetchModels(), 1200);
      }
    } catch (err) {
      setStatusMsg(`Failed to save margin: ${err.message}`);
    } finally {
      setSavingMargin(false);
    }
  }

  async function updateModel(id, updates) {
    try {
      setModels(prev => prev.map(m => (m.id === id ? { ...m, ...updates } : m)));
      await fetch(`${API_BASE}/api/admin/models/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates }),
      });
    } catch (err) {
      console.error('Failed to update model:', err);
    }
  }

  function handleSaveDisplayName(id) {
    if (tempName.trim()) {
      updateModel(id, { display_name: tempName.trim() });
    }
    setEditingNameId(null);
  }

  function formatLastSynced(ts) {
    if (!ts) return 'Never synced';
    const date = new Date(ts);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Filter models
  const providers = Array.from(new Set(models.map(m => m.provider || 'AI'))).sort();

  const filtered = models.filter(m => {
    const matchesSearch =
      !search ||
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.id?.toLowerCase().includes(search.toLowerCase()) ||
      m.provider?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (providerFilter !== 'all' && m.provider?.toLowerCase() !== providerFilter.toLowerCase()) {
      return false;
    }

    if (filterType === 'free') return m.is_free;
    if (filterType === 'paid') return !m.is_free;
    if (filterType === 'visible') return m.is_visible !== false;
    if (filterType === 'hidden') return m.is_visible === false;

    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const visibleCount = models.filter(m => m.is_visible !== false).length;
  const freeCount = models.filter(m => m.is_free).length;
  const currentMargin = Number(settings?.global_margin_percentage || 20);

  // Multi-select helpers
  const allPageSelected = paginated.length > 0 && paginated.every(m => selectedIds.has(m.id));
  const somePageSelected = paginated.some(m => selectedIds.has(m.id));

  function toggleSelectAllPage() {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allPageSelected) {
        paginated.forEach(m => next.delete(m.id));
      } else {
        paginated.forEach(m => next.add(m.id));
      }
      return next;
    });
  }

  function toggleSelectRow(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelectedIds(new Set(filtered.map(m => m.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function formatPrettyDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  function getLocalDateStr(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatDateHeader(dateStr) {
    if (!dateStr) return '';
    const today = getLocalDateStr(new Date());
    const yesterday = getLocalDateStr(new Date(Date.now() - 86400000));
    if (dateStr === today) return `Today — ${formatPrettyDate(dateStr)}`;
    if (dateStr === yesterday) return `Yesterday — ${formatPrettyDate(dateStr)}`;
    return formatPrettyDate(dateStr);
  }

  const filteredChangelog = changelog.filter(item => {
    if (changelogFilter === 'new_model') return item.type === 'new_model';
    if (changelogFilter === 'price_drop') return item.type.includes('price');
    if (changelogFilter === 'free_tier') return item.type === 'free_tier' || item.is_free;
    return true;
  });

  const groupedChangelog = filteredChangelog.reduce((acc, item) => {
    const d = item.date || (item.timestamp ? item.timestamp.split('T')[0] : 'Recent');
    if (!acc[d]) acc[d] = [];
    acc[d].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* ── Top Controls & Sync Status Card ── */}
      <div className={`p-6 rounded-2xl border ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
              <Sliders className="w-4 h-4" />
              <span>Admin Model Governance</span>
            </div>
            <h2 className="text-xl font-bold mt-1 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-500" />
              AI Models & Dynamic Pricing Manager
            </h2>
            <p className={`text-xs mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              Sync upstream fleet, automate profit margins, manage auto-cron sync, and monitor newly launched frontier models.
            </p>
          </div>

          {/* Sync Button & Auto-Cron Widget */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Auto-Cron Job Status Widget */}
            <div className={`p-2.5 px-3.5 rounded-xl border flex items-center gap-3 ${dark ? 'bg-[#181818] border-[#2a2a2a]' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${autoSyncEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-500'}`}>
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold leading-tight">Daily Auto-Sync</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                      autoSyncEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {autoSyncEnabled ? 'Cron ON' : 'Paused'}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {autoSyncEnabled ? formatNextSync(settings?.next_auto_sync_at) : 'Auto cron disabled'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 border-l border-[#2e2e2e] pl-3">
                <select
                  value={autoSyncHours}
                  onChange={e => handleChangeInterval(Number(e.target.value))}
                  disabled={updatingCron || !autoSyncEnabled}
                  className={`text-[11px] rounded-lg px-2 py-1 font-semibold border outline-none ${
                    dark ? 'bg-[#111] border-[#333] text-gray-300' : 'bg-white border-gray-300'
                  }`}
                  title="Cron frequency interval"
                >
                  <option value={6}>Every 6h</option>
                  <option value={12}>Every 12h</option>
                  <option value={24}>Every 24h (Daily)</option>
                  <option value={48}>Every 48h</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleToggleAutoSync(!autoSyncEnabled)}
                  disabled={updatingCron}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    autoSyncEnabled
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                      : 'bg-gray-500/15 border border-gray-500/30 text-gray-400 hover:bg-gray-500/25'
                  }`}
                >
                  {updatingCron ? '...' : autoSyncEnabled ? 'Active' : 'Enable'}
                </button>
              </div>
            </div>

            {/* Manual Sync Button */}
            <div className="flex flex-col sm:items-end gap-1">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
              <div className="text-[10px] text-gray-500 font-mono">
                Last: <span className="text-gray-300">{formatLastSynced(settings?.last_synced_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sub-navigation: Fleet vs New Launches Changelog ── */}
        <div className="flex items-center gap-3 mt-6 pt-5 border-t border-[#222]">
          <button
            type="button"
            onClick={() => setActiveTab('fleet')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'fleet'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : dark
                ? 'bg-[#181818] text-gray-400 hover:text-white border border-[#262626]'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Model Fleet & Dynamic Margin ({models.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('changelog');
              fetchChangelog();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'changelog'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                : dark
                ? 'bg-[#181818] text-gray-400 hover:text-white border border-[#262626]'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            New Launches & Changelog Feed
            {changelog.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-400/20 text-purple-300 font-bold border border-purple-500/30">
                {changelog.length}
              </span>
            )}
          </button>
        </div>

        {/* Global Margin and Stat Badges */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#222]">
          <div className={`p-4 rounded-xl border ${dark ? 'bg-[#161616] border-[#262626]' : 'bg-gray-50 border-gray-100'}`}>
            <span className={`text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Total Models</span>
            <div className="text-2xl font-bold mt-1">{models.length}</div>
            <div className="text-xs text-emerald-400 mt-1 font-semibold">{visibleCount} active in User UI</div>
          </div>

          <div className={`p-4 rounded-xl border ${dark ? 'bg-[#161616] border-[#262626]' : 'bg-gray-50 border-gray-100'}`}>
            <span className={`text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Free Tier Models</span>
            <div className="text-2xl font-bold mt-1 text-emerald-400">{freeCount}</div>
            <div className={`text-xs mt-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Zero token cost</div>
          </div>

          {/* Profit Margin Control with Quick Presets */}
          <div className={`p-4 rounded-xl border col-span-2 ${dark ? 'bg-[#161616] border-[#262626]' : 'bg-gray-50 border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                Global Profit Margin (%)
              </span>
              {/* Quick Margin Presets */}
              <div className="flex items-center gap-1">
                {[15, 20, 25, 30, 50].map(pct => (
                  <button
                    key={pct}
                    onClick={() => handleSaveMargin(pct)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      Number(marginInput) === pct
                        ? 'bg-blue-600 text-white'
                        : dark
                        ? 'bg-[#222] text-gray-400 hover:text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    +{pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2.5">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={marginInput}
                  onChange={e => setMarginInput(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg text-sm font-semibold border outline-none ${
                    dark ? 'bg-[#111] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">%</span>
              </div>
              <button
                onClick={() => handleSaveMargin()}
                disabled={savingMargin}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                {savingMargin ? 'Saving...' : 'Apply Margin'}
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5">
              Current markup: <span className="text-emerald-400 font-semibold font-mono">+{currentMargin}%</span> on all base token rates.
            </p>
          </div>
        </div>

        {/* ── Bulk Actions Toolbar (Feature 1) ── */}
        <div className="mt-6 pt-5 border-t border-[#222] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 mr-1">
              <CheckCheck className="w-3.5 h-3.5 text-blue-400" /> Bulk Actions:
            </span>
            <button
              onClick={() => handleBulkAction('enable_frontier_only')}
              disabled={bulkLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600/15 border border-blue-500/30 text-blue-400 hover:bg-blue-600/25 transition-all flex items-center gap-1.5"
              title="Enables only top tier labs: OpenAI, Claude, Llama 3, DeepSeek, Google, Grok, Mistral"
            >
              <Award className="w-3.5 h-3.5" />
              Only Top Frontier Labs
            </button>
            <button
              onClick={() => handleBulkAction('show_all')}
              disabled={bulkLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              Show All ({models.length})
            </button>
            <button
              onClick={handleRequestHideAll}
              disabled={bulkLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-1.5"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Hide All
            </button>
          </div>

          {statusMsg && (
            <div className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium">
              {statusMsg}
            </div>
          )}
        </div>
      </div>

      {activeTab === 'changelog' ? (
        <div className="space-y-6">
          {/* Changelog Header & Filter Controls */}
          <div className={`p-6 rounded-2xl border ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Live Model Registry Feed
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  New Launches & Model Changelog
                </h3>
                <p className={`text-xs mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Automated chronological tracking of newly added models, price drops, and tier migrations detected by the auto-sync cron.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={fetchChangelog}
                  disabled={changelogLoading}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#181818] hover:bg-[#222] border border-[#2e2e2e] text-gray-300 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${changelogLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#222]">
              <div className={`p-3.5 rounded-xl border ${dark ? 'bg-[#161616] border-[#262626]' : 'bg-gray-50 border-gray-100'}`}>
                <span className="text-[11px] text-gray-500 block">Total Recorded Events</span>
                <span className="text-xl font-bold text-white font-mono mt-0.5 block">{changelog.length}</span>
              </div>
              <div className={`p-3.5 rounded-xl border ${dark ? 'bg-[#161616] border-[#262626]' : 'bg-gray-50 border-gray-100'}`}>
                <span className="text-[11px] text-gray-500 block">New Model Launches</span>
                <span className="text-xl font-bold text-blue-400 font-mono mt-0.5 block">
                  {changelog.filter(c => c.type === 'new_model').length}
                </span>
              </div>
              <div className={`p-3.5 rounded-xl border ${dark ? 'bg-[#161616] border-[#262626]' : 'bg-gray-50 border-gray-100'}`}>
                <span className="text-[11px] text-gray-500 block">Price Adjustments</span>
                <span className="text-xl font-bold text-emerald-400 font-mono mt-0.5 block">
                  {changelog.filter(c => c.type.includes('price')).length}
                </span>
              </div>
              <div className={`p-3.5 rounded-xl border ${dark ? 'bg-[#161616] border-[#262626]' : 'bg-gray-50 border-gray-100'}`}>
                <span className="text-[11px] text-gray-500 block">Free Tier Additions</span>
                <span className="text-xl font-bold text-purple-400 font-mono mt-0.5 block">
                  {changelog.filter(c => c.type === 'free_tier' || c.is_free).length}
                </span>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: `All Events (${changelog.length})` },
                { id: 'new_model', label: `🚀 New Launches (${changelog.filter(c => c.type === 'new_model').length})` },
                { id: 'price_drop', label: `💰 Price Drops (${changelog.filter(c => c.type.includes('price')).length})` },
                { id: 'free_tier', label: `🟢 Free Tier (${changelog.filter(c => c.type === 'free_tier' || c.is_free).length})` },
              ].map(chip => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setChangelogFilter(chip.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    changelogFilter === chip.id
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                      : dark
                      ? 'bg-[#181818] text-gray-400 hover:text-white border border-[#282828]'
                      : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date-Grouped Timeline Feed */}
          {changelogLoading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-3 text-xs text-gray-500">Loading New Launches Feed...</p>
            </div>
          ) : filteredChangelog.length === 0 ? (
            <div className={`p-12 text-center rounded-2xl border ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
              <Sparkles className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-300">No updates found for this filter</p>
              <p className="text-xs text-gray-500 mt-1">When upstream providers launch new models or adjust pricing, they will automatically log here.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedChangelog).map(([dateStr, items]) => (
                <div key={dateStr} className="space-y-3">
                  {/* Date Header */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono px-3 py-1 rounded-lg bg-[#181818] border border-[#2a2a2a] text-purple-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDateHeader(dateStr)}
                    </span>
                    <div className="h-px flex-1 bg-[#222]" />
                  </div>

                  {/* Event Cards */}
                  <div className="grid grid-cols-1 gap-3">
                    {items.map(item => (
                      <div
                        key={item.id}
                        className={`p-5 rounded-2xl border transition-all hover:border-purple-500/30 ${
                          dark ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                              item.type === 'new_model'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                : item.type === 'free_tier'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                            }`}>
                              {item.type === 'new_model' ? '🚀' : item.type === 'free_tier' ? '🟢' : '💰'}
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                                  item.type === 'new_model'
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    : item.type === 'free_tier'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                  {item.type === 'new_model' ? 'NEW LAUNCH' : item.type === 'free_tier' ? '100% FREE TIER' : 'PRICE CHANGE'}
                                </span>
                                <span className="text-sm font-bold text-white">{item.name}</span>
                                <span className="text-[11px] text-gray-500 font-medium">by {item.provider}</span>
                              </div>

                              <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                                {item.summary}
                              </p>

                              <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px] font-mono">
                                <span className="text-gray-500">{item.model_id}</span>
                                {item.context_length > 0 && (
                                  <span className="text-gray-400 bg-[#1c1c1c] px-2 py-0.5 rounded border border-[#2a2a2a]">
                                    {Math.round(item.context_length / 1000)}k context
                                  </span>
                                )}
                                {item.is_free ? (
                                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    $0.00 / 1M (100% Free)
                                  </span>
                                ) : item.pricing?.prompt !== undefined ? (
                                  <span className="text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                    ${Number(item.pricing.prompt).toFixed(2)}/1M prompt · ${Number(item.pricing.completion || 0).toFixed(2)}/1M comp
                                  </span>
                                ) : item.old_price && item.new_price ? (
                                  <span className="text-emerald-400 font-semibold">
                                    {item.old_price} → {item.new_price}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopyId(item.model_id)}
                              className="p-2 rounded-xl text-xs font-medium border border-[#2a2a2a] bg-[#181818] hover:bg-[#222] text-gray-400 hover:text-white transition-colors"
                              title="Copy Model ID"
                            >
                              {copiedId === item.model_id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleConfigureInFleet(item.model_id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600/15 border border-blue-500/30 text-blue-400 hover:bg-blue-600/25 transition-all"
                            >
                              Configure in Fleet <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ── Filter, Search & Sorting Bar (Feature 2) ── */}
          <div className={`p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          {[
            { id: 'all', label: `All (${models.length})` },
            { id: 'visible', label: `Active (${visibleCount})` },
            { id: 'free', label: `Free (${freeCount})` },
            { id: 'paid', label: `Paid (${models.length - freeCount})` },
            { id: 'hidden', label: `Hidden (${models.length - visibleCount})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => { setFilterType(f.id); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                filterType === f.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : dark
                  ? 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort Dropdown & Search (Feature 2) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sorting Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); setPage(1); }}
              className={`text-xs rounded-lg px-2.5 py-1.5 border outline-none font-semibold ${
                dark ? 'bg-[#1a1a1a] border-[#333] text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <option value="popular">🔥 Popular & Frontier First</option>
              <option value="name">🔤 Name (A - Z)</option>
              <option value="price_asc">💰 Price (Low to High)</option>
              <option value="price_desc">💎 Price (High to Low)</option>
              <option value="context">🧠 Context (Largest First)</option>
            </select>
          </div>

          {/* Provider Filter */}
          <select
            value={providerFilter}
            onChange={e => { setProviderFilter(e.target.value); setPage(1); }}
            className={`text-xs rounded-lg px-2.5 py-1.5 border outline-none ${
              dark ? 'bg-[#1a1a1a] border-[#333] text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            <option value="all">All Providers ({providers.length})</option>
            {providers.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Search Box */}
          <div className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 ${dark ? 'bg-[#1a1a1a] border-[#333]' : 'bg-gray-50 border-gray-200'}`}>
            <Search className={`w-3.5 h-3.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, provider, id..."
              className={`bg-transparent text-xs outline-none w-36 sm:w-52 ${dark ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
            />
          </div>
        </div>
      </div>

      {/* ── Multi-Select Batch Action Bar ── */}
      {selectedIds.size > 0 && (
        <div className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shadow-xl transition-all animate-in fade-in slide-in-from-top-2 ${
          dark
            ? 'bg-gradient-to-r from-blue-950/80 via-[#15152a] to-blue-950/80 border-blue-500/30 shadow-blue-950/30'
            : 'bg-blue-50 border-blue-200 shadow-blue-500/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-blue-600/30">
                {selectedIds.size}
              </span>
              <span className={`text-xs font-bold ${dark ? 'text-blue-200' : 'text-blue-900'}`}>
                models selected
              </span>
            </div>

            {selectedIds.size < filtered.length && (
              <button
                type="button"
                onClick={selectAllFiltered}
                className="text-xs text-blue-400 hover:text-blue-300 underline font-medium transition-colors"
              >
                Select all {filtered.length} filtered models
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUnhideSelected}
              disabled={bulkLoading}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              Unhide Selected ({selectedIds.size})
            </button>

            <button
              type="button"
              onClick={handleRequestHideSelected}
              disabled={bulkLoading}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-md shadow-red-600/20 flex items-center gap-1.5"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Hide Selected ({selectedIds.size})
            </button>

            <button
              type="button"
              onClick={clearSelection}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                dark ? 'bg-white/10 hover:bg-white/20 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Models Table ── */}
      <div className={`rounded-2xl border overflow-hidden ${dark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b ${dark ? 'border-[#222] bg-[#161616] text-gray-400' : 'border-gray-100 bg-gray-50 text-gray-500'}`}>
                {/* Select All Checkbox Column */}
                <th className="px-3 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={el => {
                      if (el) el.indeterminate = somePageSelected && !allPageSelected;
                    }}
                    onChange={toggleSelectAllPage}
                    className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-blue-600"
                    title="Select all on this page"
                  />
                </th>
                <th className="px-4 py-3 font-semibold w-16 text-center">Status</th>
                <th className="px-4 py-3 font-semibold">Model / Provider</th>
                <th className="px-4 py-3 font-semibold">Custom Display Name</th>
                <th className="px-4 py-3 font-semibold">Min Plan</th>
                <th className="px-4 py-3 font-semibold">Badge</th>
                <th className="px-4 py-3 font-semibold">Context</th>
                <th className="px-4 py-3 font-semibold">Pricing & Profit Breakdown (Feature 3)</th>
                <th className="px-4 py-3 font-semibold text-center w-12">Pin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                    <p className="mt-2 text-gray-500 text-xs">Loading AI models...</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    No models matching your search.
                  </td>
                </tr>
              ) : (
                paginated.map(m => {
                  const isVisible = m.is_visible !== false;
                  // Base Price per 1M
                  const basePrompt = m.base_pricing?.prompt ? (m.base_pricing.prompt * 1000000).toFixed(2) : '0.00';
                  const baseComp = m.base_pricing?.completion ? (m.base_pricing.completion * 1000000).toFixed(2) : '0.00';

                  // Netroot Selling Price per 1M
                  const sellPrompt = m.calculated_pricing?.prompt ? (m.calculated_pricing.prompt * 1000000).toFixed(2) : '0.00';
                  const sellComp = m.calculated_pricing?.completion ? (m.calculated_pricing.completion * 1000000).toFixed(2) : '0.00';

                  // Profit per 1M
                  const profitPrompt = (Number(sellPrompt) - Number(basePrompt)).toFixed(2);
                  const profitComp = (Number(sellComp) - Number(baseComp)).toFixed(2);

                  return (
                    <tr
                      key={m.id}
                      className={`transition-colors ${
                        selectedIds.has(m.id)
                          ? dark
                            ? 'bg-blue-600/15 border-l-2 border-l-blue-500'
                            : 'bg-blue-50 border-l-2 border-l-blue-500'
                          : dark
                          ? isVisible
                            ? 'hover:bg-white/[0.02]'
                            : 'bg-red-500/[0.02] opacity-60 hover:opacity-100'
                          : isVisible
                          ? 'hover:bg-gray-50'
                          : 'bg-red-50/50 opacity-60 hover:opacity-100'
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(m.id)}
                          onChange={() => toggleSelectRow(m.id)}
                          className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-blue-600"
                        />
                      </td>

                      {/* Visibility Toggle */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleVisibility(m)}
                          title={isVisible ? 'Visible to users - click to hide (will ask for confirmation)' : 'Hidden from users - click to show'}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            isVisible
                              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          }`}
                        >
                          {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Model & Provider */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{m.name}</div>
                        <div className="text-[11px] text-gray-500 font-mono mt-0.5">{m.id}</div>
                        <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          dark ? 'bg-[#222] text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {m.provider}
                        </span>
                      </td>

                      {/* Custom Display Name */}
                      <td className="px-4 py-3">
                        {editingNameId === m.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={tempName}
                              onChange={e => setTempName(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleSaveDisplayName(m.id)}
                              className={`px-2 py-1 text-xs rounded border outline-none w-36 ${
                                dark ? 'bg-[#1a1a1a] border-blue-500 text-white' : 'bg-white border-blue-500'
                              }`}
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveDisplayName(m.id)}
                              className="p-1 rounded bg-blue-600 text-white hover:bg-blue-500"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingNameId(m.id);
                              setTempName(m.display_name || m.name);
                            }}
                            className="cursor-pointer group flex items-center gap-1.5"
                            title="Click to rename for users"
                          >
                            <span className="font-medium text-gray-200 group-hover:text-blue-400 transition-colors">
                              {m.display_name || m.name}
                            </span>
                            <span className="text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                              ✎
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Min Plan */}
                      <td className="px-4 py-3">
                        <select
                          value={m.min_plan || 'free'}
                          onChange={e => updateModel(m.id, { min_plan: e.target.value })}
                          className={`text-xs rounded-lg px-2 py-1 border outline-none font-medium ${
                            m.min_plan === 'pro'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              : m.min_plan === 'enterprise'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : dark
                              ? 'bg-[#1a1a1a] text-gray-300 border-[#333]'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </td>

                      {/* Badge */}
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          defaultValue={m.custom_badge || ''}
                          placeholder="No badge"
                          onBlur={e => {
                            const val = e.target.value.trim();
                            updateModel(m.id, { custom_badge: val || null, badge_override: Boolean(val) });
                          }}
                          className={`text-xs px-2 py-0.5 rounded border outline-none w-24 ${
                            dark ? 'bg-[#181818] border-[#333] text-gray-300' : 'bg-gray-50 border-gray-200'
                          }`}
                        />
                      </td>

                      {/* Context */}
                      <td className="px-4 py-3 font-mono text-gray-400">
                        {m.context_length ? `${Math.round(m.context_length / 1000)}k` : '—'}
                      </td>

                      {/* Pricing & Profit Breakdown (Feature 3) */}
                      <td className="px-4 py-3">
                        {m.is_free ? (
                          <span className="text-emerald-400 font-bold font-mono">100% FREE</span>
                        ) : (
                          <div className="font-mono space-y-1">
                            {/* Netroot Selling Price */}
                            <div className="text-xs font-bold text-white">
                              ${sellPrompt} in <span className="text-gray-500 font-normal">/</span> ${sellComp} out
                            </div>
                            {/* Upstream Base Price */}
                            <div className="text-[10px] text-gray-500">
                              Base: ${basePrompt} / ${baseComp}
                            </div>
                            {/* Profit Badge */}
                            <div className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                              +${profitPrompt} / 1M profit ({currentMargin}%)
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Featured */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => updateModel(m.id, { is_featured: !m.is_featured })}
                          className={`p-1 rounded transition-colors ${
                            m.is_featured ? 'text-amber-400' : 'text-gray-600 hover:text-gray-400'
                          }`}
                          title={m.is_featured ? 'Pinned on user top list' : 'Click to pin on top'}
                        >
                          <Star className={`w-4 h-4 ${m.is_featured ? 'fill-amber-400' : ''}`} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={`px-5 py-3 border-t flex items-center justify-between text-xs ${dark ? 'border-[#222] text-gray-400' : 'border-gray-100 text-gray-500'}`}>
          <div>
            Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} of {filtered.length} models
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-3 py-1 rounded border disabled:opacity-30 ${dark ? 'border-[#333] hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`}
            >
              Previous
            </button>
            <span className="px-2">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`px-3 py-1 rounded border disabled:opacity-30 ${dark ? 'border-[#333] hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      </>
      )}

      {/* ── Confirmation Modal for Hiding Models (Avoid Accidental Hiding) ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-[#141414] border border-[#2e2e2e] p-6 shadow-2xl text-white">
            {/* Warning Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            {/* Single Model Preview if single hide */}
            {confirmModal.model && (
              <div className="mt-4 p-3 rounded-xl bg-[#1c1c1c] border border-[#2b2b2b] flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">
                    {confirmModal.model.display_name || confirmModal.model.name}
                  </div>
                  <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                    {confirmModal.model.id}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#262626] text-gray-300 font-medium text-[10px]">
                  {confirmModal.model.provider}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#222] hover:bg-[#2a2a2a] text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg shadow-red-500/25 flex items-center gap-1.5"
              >
                <EyeOff className="w-3.5 h-3.5" />
                {confirmModal.confirmLabel || 'Yes, Hide'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


