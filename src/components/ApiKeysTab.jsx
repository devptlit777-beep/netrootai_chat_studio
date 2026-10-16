import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, Copy, Check, ExternalLink, X, Key } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'gsk_';
  for (let i = 0; i < 48; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function trackingIdFromId(id) {
  const clean = id.replace(/-/g, '');
  return 'key_' + clean.slice(0, 16);
}

function formatDate(dateStr, locale) {
  return new Date(dateStr).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
}

function inputCls(dark) {
  return `w-full border rounded-lg px-4 py-2.5 outline-none transition-colors text-sm ${
    dark
      ? 'bg-[#1e1e1e] border-[#2e2e2e] focus:border-[#3e3e3e] text-white placeholder-gray-600'
      : 'bg-white border-gray-300 focus:border-gray-400 text-gray-900 placeholder-gray-400'
  }`;
}

export default function ApiKeysTab({ darkMode }) {
  const { t, i18n } = useTranslation();
  const { user, profile } = useAuth();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPerms, setNewKeyPerms] = useState('All');
  const [createdKey, setCreatedKey] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const [renaming, setRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    setLoading(true);
    const { data } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });
    setKeys(data || []);
    setLoading(false);
  }

  const filtered = keys.filter(k => {
    const matchesSearch = k.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || k.is_active;
    return matchesSearch && matchesStatus;
  });

  async function handleCreate() {
    if (!newKeyName.trim()) return;
    setCreating(true);
    setCreateError(null);

    const fullKey = generateApiKey();
    const keyPrefix = fullKey.slice(-4);

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        name: newKeyName.trim(),
        key_prefix: keyPrefix,
        key_hash: btoa(fullKey),
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      setCreateError(error.message);
      setCreating(false);
      return;
    }

    setCreatedKey(fullKey);
    if (data) setKeys(prev => [data, ...prev]);
    setCreating(false);
  }

  function closeCreate() {
    setShowCreate(false);
    setCreatedKey(null);
    setNewKeyName('');
    setNewKeyPerms('All');
    setCreateError(null);
    setCopiedKey(false);
  }

  function copyKey(key) {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  }

  async function handleRename() {
    if (!renaming || !renameValue.trim()) return;
    setRenameLoading(true);
    const { error } = await supabase
      .from('api_keys')
      .update({ name: renameValue.trim() })
      .eq('id', renaming.id);
    if (!error) {
      setKeys(prev => prev.map(k => k.id === renaming.id ? { ...k, name: renameValue.trim() } : k));
      setRenaming(null);
    }
    setRenameLoading(false);
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', deleting.id);
    if (!error) {
      setKeys(prev => prev.filter(k => k.id !== deleting.id));
      setDeleting(null);
    }
    setDeleteLoading(false);
  }

  const creatorName = profile?.full_name || user?.email?.split('@')[0] || 'You';
  const border = darkMode ? 'border-[#2a2a2a]' : 'border-gray-200';

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('apiKeys.title')}</h2>
        <div className="flex items-center gap-3">
          <button className={`flex items-center gap-2 text-sm border rounded-lg px-4 py-2 transition-colors ${darkMode ? 'border-[#3a3a3a] text-gray-300 hover:bg-white/5' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
            {t('apiKeys.usage')}
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 text-sm font-medium bg-white hover:bg-gray-100 text-black rounded-lg px-4 py-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('apiKeys.create')}
          </button>
        </div>
      </div>

      <div className={`flex items-center gap-3 pb-4 border-b ${border}`}>
        <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${darkMode ? 'bg-[#222] border-[#333]' : 'bg-white border-gray-300'}`}>
          <Search className={`w-4 h-4 shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('apiKeys.search')}
            className={`bg-transparent outline-none text-sm w-36 ${darkMode ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
          />
        </div>

        <button
          onClick={() => setStatusFilter(prev => prev === 'active' ? 'all' : 'active')}
          className={`flex items-center gap-1.5 text-sm border rounded-full px-3 py-1.5 transition-colors ${
            statusFilter === 'active'
              ? darkMode ? 'border-white/30 bg-white/10 text-white' : 'border-gray-700 bg-gray-100 text-gray-900'
              : darkMode ? 'border-[#333] text-gray-500 hover:text-gray-300' : 'border-gray-200 text-gray-500 hover:text-gray-700'
          }`}
        >
          {statusFilter === 'active' && <Check className="w-3.5 h-3.5" />}
          {t('apiKeys.active')}
          {statusFilter === 'active' && <X className="w-3 h-3 ml-0.5 opacity-60" />}
        </button>

        <button className={`flex items-center gap-1.5 text-sm border rounded-full px-3 py-1.5 transition-colors ${darkMode ? 'border-[#333] text-gray-500 hover:text-gray-300' : 'border-gray-200 text-gray-500 hover:text-gray-700'}`}>
          <Plus className="w-3.5 h-3.5" />
          {t('apiKeys.addFilter')}
        </button>

        <span className={`text-sm ml-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {t('apiKeys.result', { count: filtered.length })}
        </span>
      </div>

      <div className={`border border-t-0 rounded-b-xl overflow-x-auto ${border}`}>
        <div
          className={`min-w-[900px] grid text-xs font-medium uppercase tracking-wide px-5 py-3 border-b ${border} ${darkMode ? 'text-gray-500 bg-[#161616]' : 'text-gray-400 bg-gray-50'}`}
          style={{ gridTemplateColumns: '1.6fr 0.8fr 1.6fr 1fr 1fr 1fr 1fr 0.8fr 56px' }}
        >
          <span>{t('common.name')}</span>
          <span>{t('apiKeys.status')}</span>
          <span>{t('apiKeys.trackingId')}</span>
          <span>{t('apiKeys.secretKey')}</span>
          <span>{t('apiKeys.created')}</span>
          <span>{t('apiKeys.lastUsed')}</span>
          <span>{t('apiKeys.createdBy')}</span>
          <span>{t('apiKeys.permissions')}</span>
          <span />
        </div>

        {loading ? (
          <div className={`flex items-center justify-center py-16 ${darkMode ? 'bg-[#141414]' : 'bg-white'}`}>
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-20 ${darkMode ? 'bg-[#141414]' : 'bg-white'}`}>
            <Key className={`w-10 h-10 mb-3 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`} />
            <p className={`text-sm font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {keys.length === 0 ? t('apiKeys.noKeys') : t('apiKeys.noFilterMatches')}
            </p>
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {keys.length === 0 ? t('apiKeys.createToStart') : t('apiKeys.adjustFilters')}
            </p>
          </div>
        ) : (
          filtered.map(k => (
            <div
              key={k.id}
              className={`min-w-[900px] grid items-center px-5 py-4 border-b last:border-b-0 transition-colors ${border} ${darkMode ? 'bg-[#141414] hover:bg-[#1c1c1c]' : 'bg-white hover:bg-gray-50'}`}
              style={{ gridTemplateColumns: '1.6fr 0.8fr 1.6fr 1fr 1fr 1fr 1fr 0.8fr 56px' }}
            >
              <span className={`text-sm font-medium truncate pr-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {k.name}
              </span>

              <span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                  k.is_active
                    ? 'text-emerald-400 bg-emerald-400/10'
                    : darkMode ? 'text-gray-500 bg-[#222]' : 'text-gray-500 bg-gray-100'
                }`}>
                  {k.is_active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
                  {k.is_active ? t('apiKeys.active') : t('apiKeys.inactive')}
                </span>
              </span>

              <span className={`text-xs font-mono truncate pr-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {trackingIdFromId(k.id)}
              </span>

              <span className={`text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                gsk_...{k.key_prefix}
              </span>

              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {formatDate(k.created_at, i18n.resolvedLanguage)}
              </span>

              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {k.last_used_at ? formatDate(k.last_used_at, i18n.resolvedLanguage) : t('apiKeys.never')}
              </span>

              <span className={`text-xs truncate pr-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {creatorName}
              </span>

              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('apiKeys.all')}</span>

              <div className="flex items-center gap-0.5 justify-end">
                <button
                  onClick={() => { setRenaming(k); setRenameValue(k.name); }}
                  title={t('apiKeys.rename')}
                  className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${darkMode ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleting(k)}
                  title={t('apiKeys.revoke')}
                  className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${darkMode ? 'text-gray-500 hover:text-red-400 hover:bg-red-400/10' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl ${darkMode ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
            <div className={`flex items-center justify-between px-6 py-5 border-b ${border}`}>
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {createdKey ? t('apiKeys.saveKey') : t('apiKeys.create')}
              </h3>
              <button
                onClick={closeCreate}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {!createdKey ? (
                <>
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('common.name')}</label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={e => setNewKeyName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !creating && newKeyName.trim() && handleCreate()}
                      placeholder={t('apiKeys.mySecretKey')}
                      className={inputCls(darkMode)}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('apiKeys.permissions')}</label>
                    <div className="relative">
                      <select
                        value={newKeyPerms}
                        onChange={e => setNewKeyPerms(e.target.value)}
                        className={`${inputCls(darkMode)} appearance-none cursor-pointer`}
                      >
                        <option>{t('apiKeys.all')}</option>
                        <option>{t('apiKeys.readOnly')}</option>
                        <option>{t('apiKeys.writeOnly')}</option>
                      </select>
                      <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </div>
                  </div>
                  {createError && (
                    <p className={`text-sm rounded-lg px-3 py-2 ${darkMode ? 'text-red-400 bg-red-400/10 border border-red-400/20' : 'text-red-600 bg-red-50 border border-red-200'}`}>{createError}</p>
                  )}
                </>
              ) : (
                <>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('apiKeys.saveSomewhereSafe')}{' '}
                    <strong className={darkMode ? 'text-white' : 'text-gray-900'}>{t('apiKeys.cannotViewAgain')}</strong> after closing this dialog.
                  </p>
                  <div className={`flex items-start gap-2 border rounded-lg px-3 py-3 ${darkMode ? 'bg-[#0d0d0d] border-[#2e2e2e]' : 'bg-gray-50 border-gray-200'}`}>
                    <span className={`flex-1 break-all text-xs font-mono ${darkMode ? 'text-emerald-400' : 'text-gray-800'}`}>{createdKey}</span>
                    <button
                      onClick={() => copyKey(createdKey)}
                      className={`shrink-0 p-1 rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                      {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                    {t('apiKeys.copyNow')}
                  </p>
                </>
              )}
            </div>

            <div className={`flex justify-end gap-2 px-6 py-4 border-t ${border}`}>
              <button
                onClick={closeCreate}
                className={`text-sm px-4 py-2 rounded-lg border transition-colors ${darkMode ? 'border-[#3a3a3a] text-gray-400 hover:text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                {createdKey ? t('apiKeys.done') : t('common.cancel')}
              </button>
              {!createdKey && (
                <button
                  onClick={handleCreate}
                  disabled={creating || !newKeyName.trim()}
                  className="text-sm font-medium bg-white hover:bg-gray-100 disabled:opacity-50 text-black px-5 py-2 rounded-lg transition-colors"
                >
                  {creating ? t('apiKeys.creating') : t('apiKeys.createSecret')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {renaming && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-sm rounded-2xl border shadow-2xl ${darkMode ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
            <div className={`flex items-center justify-between px-6 py-5 border-b ${border}`}>
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('apiKeys.renameKey')}</h3>
              <button onClick={() => setRenaming(null)} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5">
              <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('common.name')}</label>
              <input
                type="text"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !renameLoading && renameValue.trim() && handleRename()}
                className={inputCls(darkMode)}
                autoFocus
              />
            </div>
            <div className={`flex justify-end gap-2 px-6 py-4 border-t ${border}`}>
              <button onClick={() => setRenaming(null)} className={`text-sm px-4 py-2 rounded-lg border transition-colors ${darkMode ? 'border-[#3a3a3a] text-gray-400 hover:text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>{t('common.cancel')}</button>
              <button onClick={handleRename} disabled={renameLoading || !renameValue.trim()} className="text-sm font-medium bg-white hover:bg-gray-100 disabled:opacity-50 text-black px-5 py-2 rounded-lg transition-colors">
                {renameLoading ? t('project.saving') : t('project.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-sm rounded-2xl border shadow-2xl ${darkMode ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('apiKeys.revokeTitle')}</h3>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('apiKeys.revokeWarning', { name: deleting.name })}
              </p>
            </div>
            <div className={`flex justify-end gap-2 px-6 py-4 border-t ${border}`}>
              <button onClick={() => setDeleting(null)} className={`text-sm px-4 py-2 rounded-lg border transition-colors ${darkMode ? 'border-[#3a3a3a] text-gray-400 hover:text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>{t('common.cancel')}</button>
              <button onClick={handleDelete} disabled={deleteLoading} className="text-sm font-medium bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg transition-colors">
                {deleteLoading ? t('apiKeys.revoking') : t('apiKeys.revokeKey')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}