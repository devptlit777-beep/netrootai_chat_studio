import { useState, useRef, useEffect } from 'react';
import {
  Key,
  Shield,
  LogOut,
  Camera,
  Loader2,
  Check,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Cpu,
  ChevronDown,
} from 'lucide-react';

const GPT5_MODELS = [
  { id: 'openai/gpt-oss-20b', label: 'GPT OSS 20B', tag: '🥈 Fast' },
  { id: 'qwen/qwen3.8-27b', label: 'Qwen3.8 27B Vision', tag: '🖼️ Vision' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', tag: '🥉 Fast' },
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', tag: '⭐ Versatile' },
  { id: 'openai/gpt-oss-120b', label: 'GPT OSS 120B', tag: '⚡ Strong' },
];

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage, languageOptions } from '../i18n';

function getFallbackAvatar(email) {
  const seed = email || 'default';
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=3b82f6,06b6d4`;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const [tab, setTab] = useState('user');

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0e0e0e] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className={`flex gap-1 mb-10 border-b ${darkMode ? 'border-[#222]' : 'border-gray-200'}`}>
          <TabBtn label={t('settings.user')} active={tab === 'user'} onClick={() => setTab('user')} darkMode={darkMode} />
          <TabBtn label={t('settings.security')} active={tab === 'security'} onClick={() => setTab('security')} darkMode={darkMode} />
        </div>

        {tab === 'user' ? (
          <UserTab profile={profile} user={user} onSaved={refreshProfile} darkMode={darkMode} />
        ) : (
          <SecurityTab userId={user?.id ?? ''} onSignOut={signOut} darkMode={darkMode} />
        )}
      </div>
    </div>
  );
}

function TabBtn({ label, active, onClick, darkMode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium transition-all relative ${active
        ? darkMode ? 'text-white' : 'text-gray-900'
        : darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
        }`}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3b82f6] rounded-full" />
      )}
    </button>
  );
}

function UserTab({ profile, user, onSaved, darkMode }) {
  const { t, i18n } = useTranslation();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [defaultOrg, setDefaultOrg] = useState(profile?.default_org ?? '');
  const [defaultModel, setDefaultModel] = useState('openai/gpt-oss-20b');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadDone, setUploadDone] = useState(false);
  const [localPreview, setLocalPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const remoteAvatar = profile?.avatar_url
    ? `${profile.avatar_url}?v=${profile.updated_at}`
    : getFallbackAvatar(user?.email);

  const avatarUrl = localPreview ?? remoteAvatar;

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadError(null);
    setUploadDone(false);

    const objectUrl = URL.createObjectURL(file);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(objectUrl);
    setUploadingAvatar(true);

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
    const path = `${user.id}.${ext}`;

    const { error: storageError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (storageError) {
      setUploadError(storageError.message);
      setLocalPreview(null);
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (profileError) {
      setUploadError(profileError.message);
      setLocalPreview(null);
    } else {
      setUploadDone(true);
      setTimeout(() => setUploadDone(false), 3000);
      await onSaved();
      setLocalPreview(null);
    }

    setUploadingAvatar(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSave() {
    if (!user) return;

    setSaving(true);

    await supabase.from('profiles').update({
      full_name: fullName,
      phone: phone || null,
      default_org: defaultOrg || fullName,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    await onSaved();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className={`text-2xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('settings.general')}</h1>
        <div className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 ${darkMode ? 'border-[#252525]' : 'border-gray-200'}`}>
          <div>
            <label htmlFor="app-language" className={`block text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('settings.language')}
            </label>
            <p className={`mt-0.5 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('settings.languageDescription')}
            </p>
          </div>
          <div className="relative shrink-0">
            <select
              id="app-language"
              value={i18n.resolvedLanguage || i18n.language}
              onChange={event => changeAppLanguage(event.target.value)}
              className={`appearance-none cursor-pointer rounded-full border py-2.5 pl-4 pr-10 text-sm font-medium outline-none transition-colors ${darkMode ? 'border-[#464646] bg-[#2c2c2c] text-white hover:bg-[#363636]' : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'}`}
            >
              {languageOptions.map(({ code, name }) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
            <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
        </div>
      </section>

      {uploadError && (
        <div className={`border rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${darkMode ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
          <span className="font-medium">{t('settings.uploadFailed')}</span> {uploadError}
        </div>
      )}

      {uploadDone && (
        <div className={`border rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${darkMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
          <Check className="w-4 h-4" />
          {t('settings.avatarUpdated')}
        </div>
      )}

      <div className="flex items-center gap-5">
        <div className="relative">
          <img
            key={avatarUrl}
            src={avatarUrl}
            alt="avatar"
            onError={e => { e.currentTarget.src = getFallbackAvatar(user?.email); }}
            className={`w-20 h-20 rounded-full object-cover border-2 transition-opacity ${uploadingAvatar ? 'opacity-60' : 'opacity-100'} ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute bottom-0 right-0 w-7 h-7 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-60 rounded-full flex items-center justify-center transition-all shadow-lg"
          >
            {uploadingAvatar ? (
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5 text-white" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>

        <div>
          <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{profile?.full_name || 'Your Name'}</p>
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{user?.email}</p>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{t('settings.avatarHint')}</p>
        </div>
      </div>

      <FormField label={t('settings.name')} desc={t('settings.nameDescription')} darkMode={darkMode}>
        <input
          type="text"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          className={`w-full border rounded-lg px-4 py-2.5 outline-none transition-colors text-sm ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a] focus:border-[#3a3a3a] text-white placeholder-gray-600' : 'bg-white border-gray-300 focus:border-gray-400 text-gray-900 placeholder-gray-400'}`}
        />
      </FormField>

      <FormField label={t('settings.email')} desc={t('settings.emailDescription')} darkMode={darkMode}>
        <input
          type="email"
          value={user?.email ?? ''}
          disabled
          className={`w-full border rounded-lg px-4 py-2.5 outline-none text-sm cursor-not-allowed ${darkMode ? 'bg-[#141414] border-[#222] text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
        />
      </FormField>

      <FormField label={t('settings.phone')} desc={t('settings.phoneDescription')} darkMode={darkMode}>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+1 234 567 8900 / +91 9876543210"
          className={`w-full border rounded-lg px-4 py-2.5 outline-none transition-colors text-sm ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a] focus:border-[#3a3a3a] text-white placeholder-gray-600' : 'bg-white border-gray-300 focus:border-gray-400 text-gray-900 placeholder-gray-400'}`}
        />
      </FormField>

      <FormField label={t('settings.defaultOrganization')} desc={t('settings.defaultOrganizationDescription')} darkMode={darkMode}>
        <div className="relative">
          <select
            value={defaultOrg}
            onChange={e => setDefaultOrg(e.target.value)}
            className={`w-full border rounded-lg px-4 py-2.5 outline-none transition-colors text-sm appearance-none cursor-pointer ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a] focus:border-[#3a3a3a] text-white' : 'bg-white border-gray-300 focus:border-gray-400 text-gray-900'}`}
          >
            <option value={fullName || profile?.full_name || ''}>{fullName || profile?.full_name || 'Personal'}</option>
          </select>
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </FormField>

      {/* <FormField label="Default model" desc="The model used by default for new threads" darkMode={darkMode}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowModelMenu(v => !v)}
            className={`w-full flex items-center justify-between border rounded-lg px-4 py-2.5 text-sm transition-colors ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a] text-white' : 'bg-white border-gray-300 hover:border-gray-400 text-gray-900'}`}
          >
            <div className="flex items-center gap-2.5">
              <Cpu className={`w-4 h-4 shrink-0 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
              <span className="font-medium">{defaultModel}</span>
              <span className={`text-xs rounded-full px-2 py-0.5 ${darkMode ? 'bg-[#252525] text-gray-500' : 'bg-gray-100 text-gray-500'}`}>
                {GPT5_MODELS.find(m => m.id === defaultModel)?.tag}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showModelMenu ? 'rotate-180' : ''} ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          </button>

          {showModelMenu && (
            <div className={`absolute top-full mt-1.5 left-0 right-0 border rounded-xl py-1.5 shadow-2xl z-50 ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
              <p className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                Select default model
              </p>
              {GPT5_MODELS.map(m => {
                const active = defaultModel === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setDefaultModel(m.id); setShowModelMenu(false); }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                      active
                        ? darkMode ? 'bg-blue-500/10 text-white' : 'bg-blue-50 text-gray-900'
                        : darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Cpu className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-blue-400' : darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                      <span className="font-medium">{m.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs rounded-full px-2 py-0.5 ${active ? 'bg-blue-500/20 text-blue-400' : darkMode ? 'bg-[#252525] text-gray-500' : 'bg-gray-100 text-gray-500'}`}>
                        {m.tag}
                      </span>
                      {active && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </FormField> */}

      <div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-white hover:bg-gray-100 disabled:opacity-60 text-black font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4 text-emerald-600" /> : null}
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function SecurityTab({ userId, onSignOut, darkMode }) {
  const { t } = useTranslation();
  const [apiKeys, setApiKeys] = useState([]);
  const [loadedKeys, setLoadedKeys] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState(null);
  const [showGenerated, setShowGenerated] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  async function loadApiKeys() {
    if (!userId) return;
    const { data } = await supabase.from('api_keys').select('*').order('created_at', { ascending: false });
    if (data) setApiKeys(data);
    setLoadedKeys(true);
  }

  async function createApiKey() {
    if (!newKeyName.trim() || !userId) return;

    const rawKey = `sk-netrootai-${crypto.randomUUID().replace(/-/g, '')}`;
    const prefix = rawKey.slice(0, 20);

    const encoder = new TextEncoder();
    const data = encoder.encode(rawKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const { data: inserted, error } = await supabase
      .from('api_keys')
      .insert({ name: newKeyName.trim(), key_prefix: prefix, key_hash: keyHash })
      .select()
      .single();

    if (!error && inserted) {
      setApiKeys(prev => [inserted, ...prev]);
      setGeneratedKey(rawKey);
      setShowGenerated(true);
      setNewKeyName('');
      setCreatingKey(false);
    }
  }

  async function revokeKey(id) {
    await supabase.from('api_keys').update({ is_active: false }).eq('id', id);
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: false } : k));
  }

  async function deleteKey(id) {
    await supabase.from('api_keys').delete().eq('id', id);
    setApiKeys(prev => prev.filter(k => k.id !== id));
  }

  return (
    <div className="space-y-4">
      {generatedKey && (
        <div className={`border rounded-xl p-4 mb-6 ${darkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
          <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
            API key created — copy it now, it won't be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className={`flex-1 rounded-lg px-3 py-2 text-sm font-mono break-all ${darkMode ? 'bg-black/30 text-emerald-300' : 'bg-white text-emerald-600'}`}>
              {showGenerated ? generatedKey : '••••••••••••••••••••••••••••••••'}
            </code>
            <button onClick={() => setShowGenerated(v => !v)} className={`transition-colors ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}>
              {showGenerated ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(generatedKey)}
              className={`text-xs border rounded-lg px-3 py-2 transition-colors ${darkMode ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-emerald-300'}`}
            >
              Copy
            </button>
          </div>
          <button
            onClick={() => setGeneratedKey(null)}
            className={`text-xs mt-2 transition-colors ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className={`border rounded-xl overflow-hidden divide-y ${darkMode ? 'bg-[#141414] border-[#222] divide-[#1f1f1f]' : 'bg-white border-gray-200 divide-gray-200'}`}>
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Key className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('settings.revokeApiKey')}</p>
              {loadedKeys && apiKeys.length > 0 && (
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {apiKeys.filter(k => k.is_active).length} active key{apiKeys.filter(k => k.is_active).length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={loadedKeys ? () => { } : loadApiKeys}
            className={`text-sm border rounded-lg px-4 py-2 transition-colors ${darkMode ? 'text-white bg-[#1e1e1e] hover:bg-[#2a2a2a] border-[#2a2a2a]' : 'text-gray-700 bg-white hover:bg-gray-50 border-gray-300'}`}
          >
            {loadedKeys ? 'Hide keys' : 'View all keys'}
          </button>
        </div>

        {loadedKeys && (
          <div className={`px-5 py-4 ${darkMode ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
            {creatingKey ? (
              <div className="flex items-center gap-2 mb-4">
                <input
                  autoFocus
                  type="text"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder="Key name (e.g. Production)"
                  onKeyDown={e => {
                    if (e.key === 'Enter') createApiKey();
                    if (e.key === 'Escape') setCreatingKey(false);
                  }}
                  className={`flex-1 border rounded-lg px-3 py-2 outline-none text-sm ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a] focus:border-[#3b82f6]/50 text-white placeholder-gray-600' : 'bg-white border-gray-300 focus:border-blue-500 text-gray-900 placeholder-gray-400'}`}
                />
                <button onClick={createApiKey} className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg px-3 py-2 text-sm transition-colors">
                  Create
                </button>
                <button onClick={() => setCreatingKey(false)} className={`text-sm px-2 py-2 transition-colors ${darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t('common.cancel')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreatingKey(true)}
                className="flex items-center gap-1.5 text-sm text-[#3b82f6] hover:text-[#60a5fa] transition-colors mb-4"
              >
                <Plus className="w-4 h-4" />
                Create new API key
              </button>
            )}

            {apiKeys.length === 0 ? (
              <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{t('settings.noApiKeys')}</p>
            ) : (
              <div className="space-y-2">
                {apiKeys.map(key => (
                  <div key={key.id} className={`flex items-center justify-between border rounded-lg px-4 py-3 ${darkMode ? 'bg-[#1a1a1a] border-[#222]' : 'bg-white border-gray-200'}`}>
                    <div>
                      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{key.name}</p>
                      <p className={`text-xs font-mono mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{key.key_prefix}...</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${key.is_active ? darkMode ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-700' : darkMode ? 'bg-red-500/15 text-red-400' : 'bg-red-100 text-red-700'}`}>
                        {key.is_active ? t('common.active') : t('settings.revoked')}
                      </span>
                      {key.is_active && (
                        <button
                          onClick={() => revokeKey(key.id)}
                          className={`text-xs border rounded px-2 py-1 transition-colors ${darkMode ? 'text-gray-500 hover:text-yellow-400 border-[#2a2a2a] hover:border-yellow-400/30' : 'text-gray-500 hover:text-yellow-600 border-gray-200 hover:border-yellow-300'}`}
                        >
                          {t('settings.revoke')}
                        </button>
                      )}
                      <button
                        onClick={() => deleteKey(key.id)}
                        className={`transition-colors ${darkMode ? 'text-gray-600 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Shield className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('settings.multiFactor')}</p>
              <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{mfaEnabled ? t('settings.enabled') : t('settings.notEnabled')}</p>
            </div>
          </div>
          <button
            onClick={() => setMfaEnabled(v => !v)}
            className={`text-sm border rounded-lg px-4 py-2 transition-colors ${darkMode ? 'text-white bg-[#1e1e1e] hover:bg-[#2a2a2a] border-[#2a2a2a]' : 'text-gray-700 bg-white hover:bg-gray-50 border-gray-300'}`}
          >
            {mfaEnabled ? t('settings.disableMfa') : t('settings.enableMfa')}
          </button>
        </div> */}

        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <LogOut className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('settings.logout')}</p>
              <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{t('settings.endSession')}</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className={`text-sm border rounded-lg px-4 py-2 transition-colors ${darkMode ? 'text-white bg-[#1e1e1e] hover:bg-[#2a2a2a] border-[#2a2a2a]' : 'text-gray-700 bg-white hover:bg-gray-50 border-gray-300'}`}
          >
            {t('settings.logout')}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, desc, children, darkMode }) {
  return (
    <div>
      <label className={`block text-sm font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{label}</label>
      {desc && <p className={`text-xs mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{desc}</p>}
      {children}
    </div>
  );
}