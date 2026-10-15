import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { usePlan } from '../contexts/PlanContext';
import { supabase } from '../lib/supabase';
import { ensureCorePlugins } from '../lib/corePlugins';
import { Search, X, Settings, CheckCircle, Loader2 } from 'lucide-react';

const CATEGORIES = ['All', 'Productivity', 'Code', 'Search', 'Data', 'Communication'];

// Plugins that need user-supplied API keys / config
const CONFIG_FIELDS = {
    'web-search': [{ key: 'api_key', label: 'Brave Search API Key (optional, improves results)', placeholder: 'BSA...', type: 'password', required: false }],
    'github': [{ key: 'token', label: 'GitHub Personal Access Token', placeholder: 'ghp_...', type: 'password' }],
    'notion': [{ key: 'token', label: 'Notion Integration Token', placeholder: 'secret_...', type: 'password' }],
    'jira': [
        { key: 'domain', label: 'Jira Domain', placeholder: 'yourcompany.atlassian.net', type: 'text' },
        { key: 'email', label: 'Jira Email', placeholder: 'you@company.com', type: 'text' },
        { key: 'token', label: 'Jira API Token', placeholder: 'ATATT...', type: 'password' },
    ],
    'slack': [{ key: 'token', label: 'Slack Bot Token', placeholder: 'xoxb-...', type: 'password' }],
    'postgres': [{ key: 'url', label: 'PostgreSQL Connection URL', placeholder: 'postgresql://user:pass@host/db', type: 'password' }],
    'linear': [{ key: 'token', label: 'Linear API Key', placeholder: 'lin_api_...', type: 'password' }],
    'image-gen': [{ key: 'openai_key', label: 'OpenAI API Key', placeholder: 'sk-...', type: 'password' }],
    'image-describe': [],
    'csv-analyzer': [],
};

const PLUGINS = [
    { id: 'ppt-generator', name: 'NetRoot AI PPT Studio', description: 'Transform chat discussions into executive 16:9 presentation slide decks, visual cards, and native PowerPoint (.pptx) files.', category: 'Productivity', icon: '📽️', needsConfig: false, proOnly: true },
    { id: 'web-search', name: 'Web Search', description: 'Search the web in real time. No API key required; add an optional Brave Search key for improved results.', category: 'Search', icon: '🌐', needsConfig: true },
    { id: 'calculator', name: 'Calculator', description: 'Evaluate math expressions precisely. The AI runs your formula server-side and returns the exact result.', category: 'Productivity', icon: '🧮', needsConfig: false },
    { id: 'pdf-search', name: 'PDF.js Search', description: 'Extract and search text from uploaded PDF files using PDF.js, then answer questions about the document.', category: 'Data', icon: '📄', needsConfig: false },
    { id: 'json-transformer', name: 'JSON / YAML Converter', description: 'Prettify, minify, validate, or instantly convert data between JSON and YAML formats.', category: 'Data', icon: '🔄', needsConfig: false, proOnly: true },
    { id: 'arxiv', name: 'arXiv Search', description: 'Search academic papers on arXiv.org and use real paper titles and abstracts in answers.', category: 'Search', icon: '📚', needsConfig: false, proOnly: true },
    { id: 'code-runner', name: 'Code Runner', description: 'Execute JavaScript snippets in a sandboxed Node.js VM and return the actual output.', category: 'Code', icon: '⚡', needsConfig: false, proOnly: true },
    // { id: 'github', name: 'GitHub', description: 'Search public repositories, read files, and fetch issues with your personal access token.', category: 'Code', icon: '🐙', needsConfig: true, proOnly: true },
    // { id: 'notion', name: 'Notion', description: 'Search and read Notion pages and databases using your integration token.', category: 'Productivity', icon: '📝', needsConfig: true, proOnly: true },
    // { id: 'jira', name: 'Jira', description: 'Query Jira issues and sprints using your Atlassian credentials.', category: 'Productivity', icon: '🎯', needsConfig: true },
    // { id: 'slack', name: 'Slack', description: 'Search Slack channels and summarise threads using your bot token.', category: 'Communication', icon: '💬', needsConfig: true },
    // { id: 'postgres', name: 'PostgreSQL', description: 'Run read-only SQL queries against your Postgres database via a connection URL.', category: 'Data', icon: '🐘', needsConfig: true },
    // { id: 'csv-analyzer', name: 'CSV Analyzer', description: 'Upload a CSV file and ask questions about the data. The AI parses and analyses it directly.', category: 'Data', icon: '📊', needsConfig: true },
    // { id: 'linear', name: 'Linear', description: 'Query Linear issues and projects using your API key.', category: 'Productivity', icon: '🔷', needsConfig: true },
    // { id: 'image-gen', name: 'Image Generation', description: 'Generate images from text prompts using DALL·E via your OpenAI API key.', category: 'Productivity', icon: '🎨', needsConfig: true },

];

function Toggle({ enabled, onChange, darkMode, disabled }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={onChange}
            disabled={disabled}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${enabled ? 'bg-blue-500' : darkMode ? 'bg-[#333]' : 'bg-gray-300'}`}
        >
            <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
    );
}

function ConfigModal({ plugin, config, onSave, onClose, darkMode }) {
    const fields = CONFIG_FIELDS[plugin.id] || [];
    const requiredFields = fields.filter(f => f.required !== false);
    const [values, setValues] = useState(() => {
        const init = {};
        fields.forEach(f => { init[f.key] = config?.[f.key] || ''; });
        return init;
    });

    const base = darkMode ? 'bg-[#111] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900';
    const inputCls = `w-full rounded-lg border px-3 py-2 text-sm outline-none ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-600 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'}`;

    if (plugin.id === 'csv-analyzer') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${base}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{plugin.icon}</span>
                            <p className="font-semibold">{plugin.name}</p>
                        </div>
                        <button onClick={onClose}><X className="w-4 h-4 text-gray-400 hover:text-white" /></button>
                    </div>
                    <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        No configuration needed. Once enabled, attach a CSV file in the chat and ask questions about it.
                    </p>
                    <button onClick={() => onSave({})} className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                        Enable Plugin
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${base}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{plugin.icon}</span>
                        <p className="font-semibold">
                            {plugin.name}
                            {plugin.id === 'web-search' ? ' - Optional Configuration' : ' — Configuration'}
                        </p>
                    </div>
                    <button onClick={onClose}><X className="w-4 h-4 text-gray-400 hover:text-white" /></button>
                </div>
                {plugin.id === 'web-search' && (
                    <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        No API key required. Leave this blank to use the built-in search fallback, or add a Brave Search API key for better results.
                    </p>
                )}
                <div className="space-y-3 mb-5">
                    {fields.map(f => (
                        <div key={f.key}>
                            <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{f.label}</label>
                            <input
                                type={f.type}
                                value={values[f.key]}
                                onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                                placeholder={f.placeholder}
                                className={inputCls}
                            />
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button onClick={onClose} className={`flex-1 rounded-lg py-2 text-sm font-medium border transition-colors ${darkMode ? 'border-[#2a2a2a] text-gray-400 hover:text-white' : 'border-gray-300 text-gray-600 hover:text-gray-900'}`}>
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(values)}
                        disabled={requiredFields.some(f => !values[f.key]?.trim())}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2 text-sm font-medium transition-colors"
                    >
                        Save & Enable
                    </button>
                </div>
            </div>
        </div>
    );
}
export default function PluginsPage() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const { plan } = usePlan();
    const darkMode = theme === 'dark';

    const [pluginStates, setPluginStates] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [configModal, setConfigModal] = useState(null);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const loadPlugins = useCallback(async () => {
        if (!user) return;
        try {
            await ensureCorePlugins(user.id);
            const { data } = await supabase
                .from('user_plugins')
                .select('plugin_id, enabled, config')
                .eq('user_id', user.id);

            const map = {};
            (data || []).forEach(row => { map[row.plugin_id] = { enabled: row.enabled, config: row.config || {} }; });
            setPluginStates(map);
        } catch (error) {
            console.error('Failed to load plugins:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { loadPlugins(); }, [loadPlugins]);

    async function savePlugin(pluginId, enabled, config = {}) {
        setSaving(pluginId);
        try {
            const payload = { user_id: user.id, plugin_id: pluginId, enabled, config };
            const { data, error } = await supabase
                .from('user_plugins')
                .select('plugin_id')
                .eq('user_id', user.id)
                .eq('plugin_id', pluginId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                await supabase
                    .from('user_plugins')
                    .update(payload)
                    .eq('user_id', user.id)
                    .eq('plugin_id', pluginId);
            } else {
                await supabase.from('user_plugins').insert(payload);
            }
            setPluginStates(prev => ({ ...prev, [pluginId]: { enabled, config } }));
        } catch (error) {
            console.error('Failed to save plugin:', error);
        } finally {
            setSaving(null);
        }
    }

    async function handleToggle(plugin) {
        if (plugin.proOnly && plan === 'free') return;
        const current = pluginStates[plugin.id];
        const isEnabled = current?.enabled || false;

        if (!isEnabled && plugin.needsConfig) {
            setConfigModal(plugin);
            return;
        }
        await savePlugin(plugin.id, !isEnabled, current?.config || {});
    }

    async function handleConfigSave(config) {
        await savePlugin(configModal.id, true, config);
        setConfigModal(null);
    }

    const filtered = PLUGINS.filter(p => {
        const matchCat = activeCategory === 'All' || p.category === activeCategory;
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    const enabledCount = PLUGINS.filter(p => pluginStates[p.id]?.enabled).length;

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-[#0e0e0e] text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-5xl mx-auto px-6 py-8">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Plugins</h1>
                        <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {loading ? 'Loading...' : `${enabledCount} of ${PLUGINS.length} plugins enabled`}
                        </p>
                    </div>
                    <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 w-full sm:w-64 ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-300'}`}>
                        <Search className={`w-4 h-4 shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search plugins..."
                            className={`bg-transparent text-sm outline-none flex-1 ${darkMode ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
                        />
                        {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-gray-500" /></button>}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                    {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-blue-500 text-white' : darkMode ? 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222] border border-[#2a2a2a]' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                            {cat}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className={`w-6 h-6 animate-spin ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border ${darkMode ? 'border-[#222] bg-[#111]' : 'border-gray-200 bg-white'}`}>
                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>No plugins found</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {filtered.map(plugin => {
                            const state = pluginStates[plugin.id];
                            const enabled = state?.enabled || false;
                            const locked = plugin.proOnly && plan === 'free';
                            const isSaving = saving === plugin.id;

                            return (
                                <div key={plugin.id} className={`rounded-2xl border p-5 flex flex-col gap-3 transition-colors ${enabled ? darkMode ? 'border-blue-500/40 bg-blue-500/5' : 'border-blue-300 bg-blue-50' : darkMode ? 'border-[#222] bg-[#111111]' : 'border-gray-200 bg-white'}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl leading-none">{plugin.icon}</span>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{plugin.name}</p>
                                                    {enabled && <CheckCircle className="w-3.5 h-3.5 text-blue-400" />}
                                                </div>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-[#222] text-gray-500' : 'bg-gray-100 text-gray-500'}`}>
                                                    {plugin.category}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {locked && <span className="text-[10px] font-semibold uppercase tracking-wide text-purple-400">Pro</span>}
                                            {enabled && plugin.needsConfig && (
                                                <button onClick={() => setConfigModal(plugin)} title="Edit config"
                                                    className={`p-1 rounded-lg transition-colors ${darkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
                                                    <Settings className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {isSaving ? (
                                                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                                            ) : (
                                                <Toggle enabled={enabled} onChange={() => handleToggle(plugin)} darkMode={darkMode} disabled={locked} />
                                            )}
                                        </div>
                                    </div>
                                    <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {plugin.description}
                                    </p>
                                    {!plugin.needsConfig && (
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                                            No API key required
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {configModal && (
                <ConfigModal
                    plugin={configModal}
                    config={pluginStates[configModal.id]?.config || {}}
                    onSave={handleConfigSave}
                    onClose={() => setConfigModal(null)}
                    darkMode={darkMode}
                />
            )}
        </div>
    );
}
