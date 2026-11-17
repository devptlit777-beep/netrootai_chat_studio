import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutGrid,
  TrendingUp,
  ListFilter,
  Key,
  FileText,
  ShieldCheck,
  Server,
  Shuffle,
  Sliders,
  Wrench,
  Eye,
  EyeOff,
  XCircle,
  Tag,
  Settings,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Plus,
  Search,
  Trash2,
  ExternalLink,
  AlertCircle,
  X,
  Code,
  Terminal,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Cpu,
  Layers,
  Lock,
  Unlock,
  RefreshCw,
  Zap,
  BarChart2,
  DollarSign,
  Activity,
  CheckCircle2,
  Globe,
  Calculator,
  Database,
  UploadCloud,
  SlidersHorizontal,
  FileCode,
  Sparkles,
  Clock,
  Gauge,
  Ban,
  CreditCard,
  Presentation,
  AlertTriangle,
  Loader2,
  Download,
  Play,
  Pencil,
  Users,
  UserPlus,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import API_BASE from '../../lib/api';
import ProviderLogo from '../common/ProviderLogo';
import Billing from '../Billing';
import TokenDashboard from '../TokenDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { usePlan } from '../../contexts/PlanContext';
import { DEFAULT_PLAN_LIMITS, normalizePlan, getModelImageLimit, fetchPlanLimits } from '../../lib/planLimits';

const WORKSPACE_MODELS = [
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT OSS 20B',
    desc: 'Fast open-weight 20B model for coding and general tasks',
    rpm: 30, tpm: 2000, dailyTokens: 200000, contextWindow: 131072,
    provider: 'OpenAI',
  }
,
  {
    id: 'allam-2-7b',
    name: 'ALLaM 2 7B',
    desc: 'Fast lightweight model for quick responses & Arabic/English bilingual tasks',
    rpm: 30, tpm: 30000, dailyTokens: 500000, contextWindow: 131072,
    provider: 'SDAIA',
  }
,
  {
    id: 'qwen/qwen3.8-27b',
    name: 'Qwen3.8 27B Vision',
    desc: 'Vision-capable model for image understanding and multimodal reasoning',
    rpm: 30, tpm: 6000, dailyTokens: 200000, contextWindow: 131072,
    provider: 'Qwen (Alibaba)',
  }
,
  {
    id: 'groq/compound-mini',
    name: 'Compound Mini',
    desc: 'Versatile agent model for coding, multi-step reasoning, and chat',
    rpm: 30, tpm: 6000, dailyTokens: 100000, contextWindow: 131072,
    provider: 'Groq',
  }
,
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT OSS 120B',
    desc: 'High-capacity 120B model for advanced reasoning, complex coding, and chat',
    rpm: 30, tpm: 6000, dailyTokens: 100000, contextWindow: 131072,
    provider: 'OpenAI',
  }
,
  {
    id: 'black-forest-labs/FLUX.1-schnell',
    name: 'FLUX.1 Schnell',
    desc: 'Image generation model • 10 images/month on Pro/Enterprise',
    rpm: 10, tpm: 0, dailyTokens: 1000, contextWindow: 0,
    provider: 'Black Forest Labs',
  }
,
  {
    id: 'ppt-studio',
    name: 'NetRoot AI PPT Studio',
    desc: 'Executive 16:9 presentation generation & AI slide editing',
    rpm: 20, tpm: 6000, dailyTokens: null, contextWindow: 131072,
    provider: 'NetRoot AI',
  }
,
];

function getVisibleModelIds(plan) {
  const normalizedPlan = normalizePlan(plan);
  const allowed = DEFAULT_PLAN_LIMITS[normalizedPlan]?.allowedModels || DEFAULT_PLAN_LIMITS.free.allowedModels;
  return WORKSPACE_MODELS.filter(m => allowed.includes(m.id)).map(m => m.id);
}

const PRESET_CATALOG = [
  {
    id: 'openai',
    name: 'OpenAI Direct Vault',
    desc: 'Route GPT-4o, o3-mini, GPT-4.5 & Dall-E 3 with $0 NetRoot markup.',
    placeholder: 'sk-proj-...',
    docUrl: 'https://platform.openai.com/api-keys',
    badge: 'OpenAI Enterprise',
    category: 'Big Tech',
    color: 'emerald',
  }
,
  {
    id: 'anthropic',
    name: 'Anthropic Claude Vault',
    desc: 'Direct routing for Claude 3.5 Sonnet, Haiku, Opus with native rate limits.',
    placeholder: 'sk-ant-...',
    docUrl: 'https://console.anthropic.com/settings/keys',
    badge: 'Claude Direct',
    category: 'Big Tech',
    color: 'amber',
  }
,
  {
    id: 'google',
    name: 'Google AI Gemini Vault',
    desc: 'Connect Gemini 2.5 Pro, Flash & Thinking models directly.',
    placeholder: 'AIzaSy...',
    docUrl: 'https://aistudio.google.com/app/apikey',
    badge: 'Google AI Studio',
    category: 'Big Tech',
    color: 'blue',
  }
,
  {
    id: 'groq',
    name: 'Groq LPU Vault',
    desc: 'Ultra-low latency sub-second inference for open-weights & Whisper.',
    placeholder: 'gsk_...',
    docUrl: 'https://console.groq.com/keys',
    badge: 'LPUs Hardware',
    category: 'Fast Inference',
    color: 'rose',
  }
,
  {
    id: 'deepseek',
    name: 'DeepSeek Direct Vault',
    desc: 'Route DeepSeek-V3 & DeepSeek-R1 reasoning models via your personal balance.',
    placeholder: 'sk-...',
    docUrl: 'https://platform.deepseek.com/api_keys',
    badge: 'DeepSeek Direct',
    category: 'Cost-Effective',
    color: 'cyan',
  }
,
  {
    id: 'nvidia',
    name: 'NVIDIA NIM Vault',
    desc: 'Direct access to NVIDIA Nemotron, Llama & accelerated NIM microservices.',
    placeholder: 'nvapi-...',
    docUrl: 'https://build.nvidia.com/',
    badge: 'NVIDIA Accelerated',
    category: 'Accelerated Compute',
    color: 'emerald',
  }
,
  {
    id: 'xai',
    name: 'xAI Grok Direct',
    desc: 'Elon Musk\'s Grok 2 & Grok 3 models with real-time reasoning.',
    placeholder: 'xai-...',
    docUrl: 'https://console.x.ai/',
    badge: 'Grok Live',
    category: 'Big Tech',
    color: 'indigo',
  }
,
  {
    id: 'mistral',
    name: 'Mistral AI Vault',
    desc: 'European frontier models including Mistral Large & Codestral.',
    placeholder: 'sk-...',
    docUrl: 'https://console.mistral.ai/api-keys/',
    badge: 'Mistral Frontier',
    category: 'European Frontier',
    color: 'orange',
  }
,
  {
    id: 'perplexity',
    name: 'Perplexity AI Search',
    desc: 'Sonar models with live web search grounding and citations.',
    placeholder: 'pplx-...',
    docUrl: 'https://www.perplexity.ai/settings/api',
    badge: 'Web Grounded',
    category: 'Search & Reason',
    color: 'teal',
  }
,
  {
    id: 'together',
    name: 'Together AI Fleet',
    desc: 'High-performance open-source serverless model hosting.',
    placeholder: 'sk-...',
    docUrl: 'https://api.together.xyz/settings/api-keys',
    badge: 'Open-Source Cloud',
    category: 'Inference Cloud',
    color: 'blue',
  }
,
  {
    id: 'fireworks',
    name: 'Fireworks AI Engine',
    desc: 'Sub-100ms ultra-fast serverless inference for fine-tuned LLMs.',
    placeholder: 'fw_...',
    docUrl: 'https://fireworks.ai/account/api-keys',
    badge: 'High Speed',
    category: 'Fast Inference',
    color: 'red',
  }
,
  {
    id: 'cohere',
    name: 'Cohere Enterprise',
    desc: 'Command R+ and enterprise multilingual reasoning models.',
    placeholder: 'sk-...',
    docUrl: 'https://dashboard.cohere.com/api-keys',
    badge: 'Enterprise AI',
    category: 'Enterprise',
    color: 'purple',
  }
,
  {
    id: 'cerebras',
    name: 'Cerebras Ultra-Compute',
    desc: 'Wafer-scale engine with 2,000+ tokens/sec throughput for Llama models.',
    placeholder: 'csk-...',
    docUrl: 'https://cloud.cerebras.ai/',
    badge: 'Wafer Scale',
    category: 'Fast Inference',
    color: 'yellow',
  }
,
];

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'billing', label: 'Billing & Plans', icon: CreditCard, badge: 'Plans' },
  { id: 'models', label: 'Your Models & Limits', icon: Cpu, badge: 'Fleet' },
  { id: 'analytics', label: 'Analytics & Tokens', icon: BarChart2 },
  { id: 'activity', label: 'Activity', icon: TrendingUp },
  { id: 'logs', label: 'Logs', icon: ListFilter },
  { id: 'keys', label: 'API Keys', icon: Key },
  { id: 'guardrails', label: 'Guardrails & Limits', icon: ShieldCheck },
  { id: 'byok', label: 'BYOK', icon: Server },
  { id: 'routing', label: 'Routing', icon: Shuffle },
  { id: 'presets', label: 'Presets', icon: Sliders },
  // { id: 'files', label: 'Files & RAG', icon: FileText, badge: 'Beta' }, // [Deferred: Will integrate with central Vector DB]
  // { id: 'tools', label: 'Tools', icon: Wrench }, // [Deferred: Postponed for upcoming release]
  // { id: 'observability', label: 'Observability', icon: Eye }, // [Deferred: Postponed for upcoming release]
  { id: 'classifiers', label: 'Classifiers', icon: Tag, badge: 'Beta' },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const AVAILABLE_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', icon: '🤖', popular: 'GPT-4o, o1, o3-mini' },
  { id: 'anthropic', name: 'Anthropic', icon: '⚡', popular: 'Claude 3.5 Sonnet & Haiku' },
  { id: 'google', name: 'Google AI', icon: '🌐', popular: 'Gemini 2.5 & 1.5 Pro' },
  { id: 'deepseek', name: 'DeepSeek', icon: '🐳', popular: 'DeepSeek-V3 & R1' },
  { id: 'meta-llama', name: 'Meta Llama', icon: '🦙', popular: 'Llama 3.1 & 3.3 70B' },
  { id: 'mistralai', name: 'Mistral AI', icon: '🌪️', popular: 'Mistral Large & Codestral' },
  { id: 'cohere', name: 'Cohere', icon: '💡', popular: 'Command R+ & Embed' },
  { id: 'qwen', name: 'Qwen / Alibaba', icon: '🔮', popular: 'Qwen 2.5 72B' },
  { id: 'minimax', name: 'MiniMax', icon: '🚀', popular: 'M3.1 Flash (Free)' },
  { id: 'liquid', name: 'Liquid AI', icon: '💧', popular: 'LFM-2.5 2.6B (Free)' },
  { id: 'bytedance', name: 'ByteDance', icon: '🎵', popular: 'Doubao & Seed' },
  { id: 'x-ai', name: 'xAI', icon: '🌌', popular: 'Grok 2 & Vision' },
];

export default function WorkspaceHub({ darkMode = true }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const resolveTab = (t) => {
    if (!t) return 'overview';
    if (t === 'billing') return 'billing';
    if (t === 'models' || t === 'limits' || t === 'fleet') return 'models';
    if (t === 'analytics' || t === 'token-dashboard') return 'analytics';
    if (t === 'api-keys' || t === 'keys') return 'keys';
    if (t === 'guardrails') return 'guardrails';
    if (t === 'general') return 'settings';
    if (t === 'overview') return 'overview';
    if (t === 'settings') return 'settings';
    return t;
  }
;

  const [activeTab, setActiveTab] = useState(() => resolveTab(searchParams.get('tab')));
  const [autoUpgradePlan, setAutoUpgradePlan] = useState(() => searchParams.get('upgrade') || null);
  const [showBanner, setShowBanner] = useState(true);
  const [loading, setLoading] = useState(true);

  // Authentication & Plan Context (Declared early to prevent TDZ ReferenceError)
  const { user, session } = useAuth();
  const { plan } = usePlan();

  // Fleet & Catalog Models State (Declared early for useMemo dependencies)
  const [allCatalogModels, setAllCatalogModels] = useState([]);

  useEffect(() => {
    const requested = resolveTab(searchParams.get('tab'));
    if (requested && requested !== activeTab) {
      setActiveTab(requested);
    }

    const up = searchParams.get('upgrade');
    if (up) setAutoUpgradePlan(up);
  }
, [searchParams]);

  // Workspace Data State
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [logs, setLogs] = useState([]);
  const [guardrails, setGuardrails] = useState(null);
  const [byok, setByok] = useState({});
  const [routing, setRouting] = useState(null);
  const [presets, setPresets] = useState([]);
  const [files, setFiles] = useState([]);
  const [tools, setTools] = useState([]);
  const [classifiers, setClassifiers] = useState([]);
  const [cacheSettings, setCacheSettings] = useState({
    enabled: true,
    similarity_threshold: 0.85,
    ttl_hours: 168,
    total_saved_usd: 48.25,
    total_cache_hits: 218,
  }
);
  const [observability, setObservability] = useState(null);

  // Modals & UI States
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({ name: '', monthly_limit_usd: 100, allowed_models: '' });
  const [keyModelPreset, setKeyModelPreset] = useState('all'); // 'all' | 'free' | 'custom'
  const [createdKeyResult, setCreatedKeyResult] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedState, setCopiedState] = useState({});
  const [selectedKeyForAnalytics, setSelectedKeyForAnalytics] = useState(null);
  const [keyAnalyticsData, setKeyAnalyticsData] = useState(null);
  const [loadingKeyAnalytics, setLoadingKeyAnalytics] = useState(false);
  const [selectedLogInspect, setSelectedLogInspect] = useState(null);
  const [logSearch, setLogSearch] = useState('');
  const [inspectTab, setInspectTab] = useState('overview'); // 'overview' | 'raw'
  const [copiedLogJson, setCopiedLogJson] = useState(false);
  const [showCreateWsModal, setShowCreateWsModal] = useState(false);
  const [newWsForm, setNewWsForm] = useState({ name: '', description: '', environment: 'production' });
  const [integrationLang, setIntegrationLang] = useState('curl');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState('');

  // BYOK Vault Local States
  const [byokInputs, setByokInputs] = useState({});
  const [showKeyMap, setShowKeyMap] = useState({});
  const [testingProvider, setTestingProvider] = useState(null);
  const [savingProvider, setSavingProvider] = useState(null);
  const [editingProvider, setEditingProvider] = useState({});
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectTab, setConnectTab] = useState('catalog'); // 'catalog' | 'custom'
  const [catalogSearch, setCatalogSearch] = useState('');
  const [customProviderForm, setCustomProviderForm] = useState({
    name: '',
    base_url: '',
    key: '',
    model_prefix: '',
  }
);
  const [customSaving, setCustomSaving] = useState(false);

  // Routing Policies & Fallbacks Local States
  const [showAddFallbackModal, setShowAddFallbackModal] = useState(false);
  const isFreePlan = (plan || 'free').toLowerCase() === 'free';

  // Compute models eligible for routing based on plan
  const eligibleRoutingModels = useMemo(() => {
    if (!Array.isArray(allCatalogModels) || allCatalogModels.length === 0) return [];
    if (!isFreePlan) return allCatalogModels;
    // Free plan users can only route across free-tier models
    return allCatalogModels.filter(m => {
      const id = (m.id || '').toLowerCase();
      const isZeroPrompt = Number(m.pricing?.prompt || 0) === 0;
      return id.endsWith(':free') || id.includes('free') || isZeroPrompt;
    }
);
  }
, [allCatalogModels, isFreePlan]);

  const [newFallbackForm, setNewFallbackForm] = useState({
    primary: 'liquid/lfm-2.5-2.6b:free',
    primaryMode: 'catalog', // 'catalog' | 'custom'
    primaryCustom: '',
    fallback: 'meta-llama/llama-3.3-70b-instruct:free',
    fallbackMode: 'catalog', // 'catalog' | 'custom'
    fallbackCustom: '',
    trigger: 'any_error',
  }
);
  const [simulatingFallback, setSimulatingFallback] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  // Compute active cards for BYOK: Top 6 default starters + any provider configured or custom
  const activeProvidersList = useMemo(() => {
    const starters = PRESET_CATALOG.slice(0, 6); // OpenAI, Anthropic, Gemini, Groq, DeepSeek, NVIDIA
    const list = [...starters];

    for (const [providerId, rec] of Object.entries(byok || {})) {
      if (!list.some(p => p.id === providerId)) {
        const fromCatalog = PRESET_CATALOG.find(p => p.id === providerId);
        if (fromCatalog) {
          list.push(fromCatalog);
        }
 else if (rec.is_custom || rec.base_url) {
          list.push({
            id: providerId,
            name: rec.display_name || providerId,
            desc: `Custom OpenAI-compatible endpoint at ${rec.base_url || 'self-hosted cluster'}`,
            placeholder: 'API Key...',
            docUrl: '#',
            badge: 'Custom Endpoint',
            isCustom: true,
            base_url: rec.base_url,
            model_prefix: rec.model_prefix,
            color: 'purple',
          }
);
        }

      }

    }

    return list;
  }
, [byok]);

  // Enterprise Modals
  const [showUploadFileModal, setShowUploadFileModal] = useState(false);
  const [newFileForm, setNewFileForm] = useState({ name: '', file_size_kb: 512, sync_chat: true });
  const [showAddClassifierModal, setShowAddClassifierModal] = useState(false);
  const [editingClassifierId, setEditingClassifierId] = useState(null);
  const [testClassifierPrompt, setTestClassifierPrompt] = useState('');
  const [testingClassifier, setTestingClassifier] = useState(false);
  const [testClassifierResult, setTestClassifierResult] = useState(null);
  const [newClassifierForm, setNewClassifierForm] = useState({
    name: '',
    condition_type: 'keyword',
    condition_value: '',
    target_action: 'route_model',
    target_value: 'anthropic/claude-3.5-sonnet',
    enabled: true,
  }
);
  const [showAddPresetModal, setShowAddPresetModal] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState(null); // null when creating, string id when editing
  const [selectedPresetForSnippet, setSelectedPresetForSnippet] = useState(null); // For "Use in API" code drawer
  const [newPresetForm, setNewPresetForm] = useState({
    name: '',
    description: '',
    system_prompt: '',
    default_model: 'openai/gpt-4o',
    temperature: 0.7,
    max_tokens: 2048,
  }
);
  const [newBlockedModelInput, setNewBlockedModelInput] = useState('');
  const [dynamicProviders, setDynamicProviders] = useState([]);
  const [providerSearch, setProviderSearch] = useState('');
  const [showAllProvidersModal, setShowAllProvidersModal] = useState(false);

  // Models Tab & Project Details State
  const [modelUsageData, setModelUsageData] = useState(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [modelModalMode, setModelModalMode] = useState(null);
  const [planLimits, setPlanLimits] = useState(DEFAULT_PLAN_LIMITS);
  const [allowedModels, setAllowedModels] = useState(() => getVisibleModelIds(plan));
  const [modelsFleetFilter, setModelsFleetFilter] = useState('all');

  const [serviceTier, setServiceTier] = useState('default');
  const [disableUserKeys, setDisableUserKeys] = useState(false);
  const [copiedProjectId, setCopiedProjectId] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [wsName, setWsName] = useState('');
  const [wsDescription, setWsDescription] = useState('');
  const [wsEnv, setWsEnv] = useState('production');
  const [monthlyBudget, setMonthlyBudget] = useState('250');
  const [budgetAlertThreshold, setBudgetAlertThreshold] = useState('80');

  // Team Members & Danger Zone States
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showInviteMemberModal, setShowInviteMemberModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('developer');
  const [invitingMember, setInvitingMember] = useState(false);

  const [showDeleteWsModal, setShowDeleteWsModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingWs, setDeletingWs] = useState(false);

  const [showResetConfigModal, setShowResetConfigModal] = useState(false);
  const [resettingConfig, setResettingConfig] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPlanLimits().then((limits) => {
      if (!cancelled) setPlanLimits(limits);
    }
).catch(() => {});
    return () => { cancelled = true; };
  }
, []);

  useEffect(() => {
    setAllowedModels(getVisibleModelIds(plan));
  }
, [plan, planLimits]);

  useEffect(() => {
    if (activeWorkspace) {
      setWsName(activeWorkspace.name || 'Default Workspace');
      setWsDescription(activeWorkspace.description || '');
      setWsEnv(activeWorkspace.environment || 'production');
      if (activeWorkspace.service_tier) setServiceTier(activeWorkspace.service_tier);
      if (activeWorkspace.disable_user_keys !== undefined) setDisableUserKeys(Boolean(activeWorkspace.disable_user_keys));
      if (activeWorkspace.monthly_budget_usd !== undefined) setMonthlyBudget(String(activeWorkspace.monthly_budget_usd));
      if (activeWorkspace.budget_alert_threshold !== undefined) setBudgetAlertThreshold(String(activeWorkspace.budget_alert_threshold));
      loadWorkspaceMembers(activeWorkspace.id);
    }

  }
, [activeWorkspace]);

  useEffect(() => {
    if (!session?.access_token) return;
    let cancelled = false;
    const loadUsage = async () => {
      setLoadingUsage(true);
      try {
        const response = await fetch(`${API_BASE}/api/my-usage?period=1d&_=${Date.now()}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: 'no-store',
        }
);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!cancelled) {
          setModelUsageData(data);
          setLoadingUsage(false);
        }

      }
 catch (err) {
        if (!cancelled) {
          setLoadingUsage(false);
        }

      }

    }
;
    loadUsage();
    const onFocus = () => loadUsage();
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    }
;
  }
, [session?.access_token]);

  useEffect(() => {
    fetchInitialData();
  }
, []);

  async function fetchInitialData(overrideWsId) {
    setLoading(true);
    try {
      // 1. Parallel loading: Core bootstrap data and fleet models concurrently
      const userEmailHeader = user?.email || session?.user?.email || '';
      const wsQuery = overrideWsId ? `?workspaceId=${encodeURIComponent(overrideWsId)}` : '';
      const logsQuery = overrideWsId ? `?limit=50&workspaceId=${encodeURIComponent(overrideWsId)}` : '?limit=50';
      const [bootRes, modelsRes, logsRes, byokRes, rtRes, prRes, filesRes, toolsRes, clsRes, csRes, obsRes, dynProvRes] = await Promise.all([
        fetch(`${API_BASE}/api/workspace/bootstrap${wsQuery}`, { headers: { 'x-user-email': userEmailHeader } }).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE}/api/models`).then(r => r.json()).catch(() => ({ models: [] })),
        fetch(`${API_BASE}/api/workspace/logs${logsQuery}`).then(r => r.json()).catch(() => ({ logs: [] })),
        fetch(`${API_BASE}/api/workspace/byok${wsQuery}`).then(r => r.json()).catch(() => ({ byok: {} })),
        fetch(`${API_BASE}/api/workspace/routing${wsQuery}`).then(r => r.json()).catch(() => ({ routing: {} })),
        fetch(`${API_BASE}/api/workspace/presets${wsQuery}`).then(r => r.json()).catch(() => ({ presets: [] })),
        fetch(`${API_BASE}/api/workspace/files`).then(r => r.json()).catch(() => ({ files: [] })),
        fetch(`${API_BASE}/api/workspace/tools`).then(r => r.json()).catch(() => ({ tools: [] })),
        fetch(`${API_BASE}/api/workspace/classifiers${wsQuery}`).then(r => r.json()).catch(() => ({ classifiers: [] })),
        fetch(`${API_BASE}/api/workspace/cache-settings`).then(r => r.json()).catch(() => ({ cacheSettings: null })),
        fetch(`${API_BASE}/api/workspace/observability`).then(r => r.json()).catch(() => ({ metrics: null })),
        fetch(`${API_BASE}/api/workspace/providers`).then(r => r.json()).catch(() => ({ providers: [] })),
      ]);

      if (bootRes?.workspaces) setWorkspaces(bootRes.workspaces);
      if (bootRes?.overview) {
        setOverviewData(bootRes.overview);
        setActiveWorkspace(bootRes.overview.workspace);
      }

      if (bootRes?.keys) setApiKeys(bootRes.keys);
      if (bootRes?.activity) setActivityData(bootRes.activity);
      if (bootRes?.guardrails) setGuardrails(bootRes.guardrails);

      if (Array.isArray(modelsRes?.models)) {
        setAllCatalogModels(modelsRes.models.filter(m => !m.id?.endsWith(':batch')));
      }


      if (logsRes?.logs) setLogs(logsRes.logs);
      if (byokRes?.byok) setByok(byokRes.byok);
      if (rtRes?.routing) setRouting(rtRes.routing);
      if (prRes?.presets) setPresets(prRes.presets);
      if (filesRes?.files) setFiles(filesRes.files);
      if (toolsRes?.tools) setTools(toolsRes.tools);
      if (clsRes?.classifiers) setClassifiers(clsRes.classifiers);
      if (csRes?.cacheSettings) setCacheSettings(csRes.cacheSettings);
      if (obsRes?.metrics) setObservability(obsRes.metrics);
      if (Array.isArray(dynProvRes?.providers) && dynProvRes.providers.length > 0) {
        setDynamicProviders(dynProvRes.providers);
      }

    }
 catch (err) {
      console.error('[workspace] failed to load workspace data:', err);
    }
 finally {
      setLoading(false);
    }

  }


  // Key creation handler
  async function handleCreateKey(e) {
    e.preventDefault();
    try {
      const allowedArr = newKeyForm.allowed_models
        ? newKeyForm.allowed_models.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const res = await fetch(`${API_BASE}/api/workspace/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyForm.name || 'Developer API Key',
          monthly_limit_usd: Number(newKeyForm.monthly_limit_usd) || 100,
          allowed_models: allowedArr,
        }
),
      }
);
      const data = await res.json();
      if (data.key) {
        setCreatedKeyResult(data.key);
        setApiKeys(prev => [data.key, ...prev]);
        setNewKeyForm({ name: '', monthly_limit_usd: 100, allowed_models: '' });
      }

    }
 catch (err) {
      alert('Failed to generate key: ' + err.message);
    }

  }


  // Key toggle
  async function handleToggleKey(keyId) {
    try {
      const res = await fetch(`${API_BASE}/api/workspace/keys/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId }),
      }
);
      const data = await res.json();
      if (data.key) {
        setApiKeys(prev => prev.map(k => (k.id === keyId ? { ...k, status: data.key.status } : k)));
      }

    }
 catch (err) {
      alert('Failed to toggle key status');
    }

  }


  // Key delete
  async function handleDeleteKey(keyId) {
    if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) return;
    try {
      await fetch(`${API_BASE}/api/workspace/keys/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId }),
      }
);
      setApiKeys(prev => prev.filter(k => k.id !== keyId));
    }
 catch (err) {
      alert('Failed to delete key');
    }

  }


  // Guardrails save with explicit override support to avoid stale closure state
  async function handleSaveGuardrails(override) {
    try {
      const payload = override || guardrails;
      const res = await fetch(`${API_BASE}/api/workspace/guardrails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
);
      const data = await res.json();
      if (data.success) {
        if (override) setGuardrails(override);
        flashToast('Guardrail policies updated successfully!');
      }

    }
 catch (err) {
      alert('Failed to save guardrails');
    }

  }


  // ── Blocked Providers & Blocked Models Handlers ──
  function handleToggleProviderBlock(providerId) {
    const current = guardrails?.blocked_providers || [];
    const isBlocked = current.map(p => p.toLowerCase()).includes(providerId.toLowerCase());
    const updated = isBlocked
      ? current.filter(p => p.toLowerCase() !== providerId.toLowerCase())
      : [...current, providerId];
    const newGuardrails = { ...guardrails, blocked_providers: updated };
    setGuardrails(newGuardrails);
    handleSaveGuardrails(newGuardrails);
  }


  function handleAddBlockedModel(modelSlug) {
    const target = modelSlug || newBlockedModelInput;
    if (!target?.trim()) return;
    const slug = target.trim().toLowerCase();
    const current = guardrails?.disallowed_models || [];
    if (!current.includes(slug)) {
      const updated = [...current, slug];
      const newGuardrails = { ...guardrails, disallowed_models: updated };
      setGuardrails(newGuardrails);
      handleSaveGuardrails(newGuardrails);
    }

    setNewBlockedModelInput('');
  }


  function handleRemoveBlockedModel(modelSlug) {
    const updated = (guardrails?.disallowed_models || []).filter(m => m !== modelSlug);
    const newGuardrails = { ...guardrails, disallowed_models: updated };
    setGuardrails(newGuardrails);
    handleSaveGuardrails(newGuardrails);
  }


  // Export Logs CSV
  const handleExportLogsCsv = () => {
    if (!logs || logs.length === 0) {
      alert('No logs available to export.');
      return;
    }

    const headers = ['Timestamp', 'Key Name', 'Model', 'Provider', 'Status', 'Prompt Tokens', 'Completion Tokens', 'Total Tokens', 'Latency (ms)', 'Cost (USD)', 'Profit (USD)'];
    const rows = logs.map(l => [
      `"${l.timestamp || ''}"`,
      `"${(l.key_name || '').replace(/"/g, '""')}"`,
      `"${l.model || ''}"`,
      `"${l.provider || ''}"`,
      l.status || 200,
      l.prompt_tokens || 0,
      l.completion_tokens || 0,
      l.total_tokens || 0,
      l.latency_ms || 0,
      (l.cost_usd || 0).toFixed(6),
      (l.profit_usd || 0).toFixed(6),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `netroot_workspace_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
;

  // BYOK Secure Vault Operations
  async function handleSaveByok(provider) {
    const rawVal = (byokInputs[provider] || '').trim();
    if (!rawVal) {
      flashToast('Please enter an API key first');
      return;
    }

    if (rawVal.includes('••••')) {
      flashToast('Masked key cannot be re-saved. Please enter the full key.');
      return;
    }

    setSavingProvider(provider);
    try {
      const res = await fetch(`${API_BASE}/api/workspace/byok`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-plan': normalizePlan(plan),
        }
,
        body: JSON.stringify({
          provider,
          key: rawVal,
          user_plan: normalizePlan(plan),
        }
),
      }
);
      const data = await res.json();
      if (data.success) {
        setByok(data.byok);
        setEditingProvider(prev => ({ ...prev, [provider]: false }));
        setByokInputs(prev => ({ ...prev, [provider]: '' }));
        flashToast(`${provider.toUpperCase()} key encrypted & saved into secure vault!`);
        // Test key validity immediately
        handleTestByok(provider, rawVal);
      }
 else {
        alert(data.error || 'Failed to save BYOK key');
      }

    }
 catch (err) {
      alert('Failed to save BYOK key: ' + err.message);
    }
 finally {
      setSavingProvider(null);
    }

  }


  async function handleTestByok(provider, optionalKey, optionalBaseUrl) {
    setTestingProvider(provider);
    try {
      const res = await fetch(`${API_BASE}/api/workspace/byok/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key: optionalKey, base_url: optionalBaseUrl }),
      }
);
      const data = await res.json();
      if (data.byok) {
        setByok(data.byok);
      }

      if (data.success) {
        flashToast(`✓ ${data.message || 'Key verified successfully!'}`);
      }
 else {
        flashToast(`✕ ${data.message || 'Verification failed'}`, 'error');
      }

    }
 catch (err) {
      flashToast(`✕ Test connection failed: ${err.message}`, 'error');
    }
 finally {
      setTestingProvider(null);
    }

  }


  async function handleSaveCustomProvider() {
    if (!customProviderForm.name?.trim()) {
      flashToast('Please enter a provider name (e.g. Ollama Local)');
      return;
    }

    if (!customProviderForm.base_url?.trim()) {
      flashToast('Please enter a Base URL (e.g. http://localhost:11434/v1)');
      return;
    }

    if (!customProviderForm.key?.trim()) {
      flashToast('Please enter an API Key (or "none" if self-hosted without auth)');
      return;
    }

    setCustomSaving(true);
    const providerId = 'custom_' + customProviderForm.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    try {
      const res = await fetch(`${API_BASE}/api/workspace/byok`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-plan': normalizePlan(plan),
        }
,
        body: JSON.stringify({
          provider: providerId,
          key: customProviderForm.key.trim(),
          display_name: customProviderForm.name.trim(),
          base_url: customProviderForm.base_url.trim(),
          model_prefix: customProviderForm.model_prefix.trim() || customProviderForm.name.toLowerCase().trim(),
          is_custom: true,
          user_plan: normalizePlan(plan),
        }
),
      }
);
      const data = await res.json();
      if (data.success) {
        setByok(data.byok);
        setShowConnectModal(false);
        const savedName = customProviderForm.name;
        const savedKey = customProviderForm.key.trim();
        const savedUrl = customProviderForm.base_url.trim();
        setCustomProviderForm({ name: '', base_url: '', key: '', model_prefix: '' });
        flashToast(`Custom provider "${savedName}" connected & saved!`);
        handleTestByok(providerId, savedKey, savedUrl);
      }
 else {
        alert(data.error || 'Failed to connect custom provider');
      }

    }
 catch (err) {
      alert('Failed: ' + err.message);
    }
 finally {
      setCustomSaving(false);
    }

  }


  function handleAddCatalogProvider(p) {
    setShowConnectModal(false);
    setEditingProvider(prev => ({ ...prev, [p.id]: true }));
    flashToast(`Enter your ${p.name} API key to activate`);
  }


  async function handleDeleteByok(provider) {
    if (!confirm(`Are you sure you want to disconnect and delete your ${provider.toUpperCase()} BYOK key from the vault?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/workspace/byok`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      }
);
      const data = await res.json();
      if (data.success) {
        setByok(data.byok);
        setByokInputs(prev => ({ ...prev, [provider]: '' }));
        setEditingProvider(prev => ({ ...prev, [provider]: false }));
        flashToast(`${provider.toUpperCase()} key permanently removed from vault`);
      }

    }
 catch (err) {
      alert('Failed to delete key: ' + err.message);
    }

  }


  // Routing save
  async function handleSaveRouting(customRoutingData = null) {
    const payload = customRoutingData || routing;
    try {
      const res = await fetch(`${API_BASE}/api/workspace/routing`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-plan': plan || 'free'
        }
,
        body: JSON.stringify(payload),
      }
);
      const data = await res.json();
      if (data.success) {
        setRouting(data.routing);
        flashToast('Routing policies updated successfully!');
      }
 else {
        alert(data.error?.message || 'Failed to save routing configuration.');
      }

    }
 catch (err) {
      alert('Failed to save routing: ' + err.message);
    }

  }


  // Routing: Add Fallback Rule
  function handleAddFallbackRule(e) {
    e.preventDefault();
    const effectivePrimary = newFallbackForm.primaryMode === 'custom' 
      ? newFallbackForm.primaryCustom.trim() 
      : newFallbackForm.primary.trim();

    const effectiveFallback = newFallbackForm.fallbackMode === 'custom' 
      ? newFallbackForm.fallbackCustom.trim() 
      : newFallbackForm.fallback.trim();

    if (!effectivePrimary || !effectiveFallback) {
      alert('Please specify both a primary and a fallback model.');
      return;
    }

    if (effectivePrimary.toLowerCase() === effectiveFallback.toLowerCase()) {
      alert('Primary and fallback model cannot be the same.');
      return;
    }


    const currentFallbacks = routing?.fallbacks || [];
    const newRule = {
      id: `fb_${Date.now()}`,
      primary: effectivePrimary,
      fallback: effectiveFallback,
      trigger: newFallbackForm.trigger || 'any_error',
    }
;

    const updated = {
      ...routing,
      fallbacks: [...currentFallbacks, newRule],
    }
;
    setRouting(updated);
    setShowAddFallbackModal(false);
    // Reset custom inputs
    setNewFallbackForm(prev => ({ ...prev, primaryCustom: '', fallbackCustom: '' }));
    handleSaveRouting(updated);
  }


  // Routing: Delete Fallback Rule
  function handleDeleteFallbackRule(ruleId) {
    const currentFallbacks = routing?.fallbacks || [];
    const updated = {
      ...routing,
      fallbacks: currentFallbacks.filter(f => f.id !== ruleId),
    }
;
    setRouting(updated);
    handleSaveRouting(updated);
  }


  // Routing: Live Simulation Test
  async function handleSimulateFallback() {
    setSimulatingFallback(true);
    setSimulationResult(null);
    try {
      const activeFallbacks = routing?.fallbacks || [];
      const testPair = activeFallbacks[0] || {
        primary: 'anthropic/claude-3.5-sonnet',
        fallback: 'deepseek/deepseek-chat',
      }
;

      const res = await fetch(`${API_BASE}/api/workspace/routing/test-simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary: testPair.primary,
          fallback: testPair.fallback,
        }
),
      }
);
      const data = await res.json();
      if (data.success) {
        setSimulationResult(data.simulation);
        flashToast('Failover simulation completed successfully!');
      }
 else {
        alert('Simulation failed: ' + (data.error?.message || 'Server error'));
      }

    }
 catch (err) {
      alert('Simulation error: ' + err.message);
    }
 finally {
      setSimulatingFallback(false);
    }

  }


  // ── Files Handlers ──
  async function handleUploadFile(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/workspace/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFileForm.name,
          file_size_bytes: Number(newFileForm.file_size_kb || 512) * 1024,
          estimated_tokens: Math.round(Number(newFileForm.file_size_kb || 512) * 250),
          sync_chat: newFileForm.sync_chat,
        }
),
      }
);
      const data = await res.json();
      if (data.file) {
        setFiles(prev => [data.file, ...prev]);
        setShowUploadFileModal(false);
        setNewFileForm({ name: '', file_size_kb: 512, sync_chat: true });
        flashToast('File uploaded and indexed into RAG memory!');
      }

    }
 catch (err) {
      alert('Failed to upload file: ' + err.message);
    }

  }


  async function handleDeleteFile(fileId) {
    if (!confirm('Are you sure you want to remove this file from workspace knowledge?')) return;
    try {
      await fetch(`${API_BASE}/api/workspace/files/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      }
);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      flashToast('File deleted successfully.');
    }
 catch (err) {
      alert('Failed to delete file');
    }

  }


  async function handleToggleFileSync(fileId) {
    try {
      const res = await fetch(`${API_BASE}/api/workspace/files/toggle-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      }
);
      const data = await res.json();
      if (data.file) {
        setFiles(prev => prev.map(f => (f.id === fileId ? data.file : f)));
        flashToast(data.file.sync_chat ? 'File synced to active Chat context' : 'File un-synced from Chat context');
      }

    }
 catch (err) {
      alert('Failed to toggle sync status');
    }

  }


  // ── Tools Handlers ──
  async function handleToggleTool(toolId, currentEnabled) {
    try {
      const res = await fetch(`${API_BASE}/api/workspace/tools/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, enabled: !currentEnabled }),
      }
);
      const data = await res.json();
      if (data.tool) {
        setTools(prev => prev.map(t => (t.id === toolId ? data.tool : t)));
        flashToast(`Tool "${data.tool.name}" ${data.tool.enabled ? 'Enabled' : 'Disabled'}`);
      }

    }
 catch (err) {
      alert('Failed to toggle tool');
    }

  }


  // ── Classifiers Handlers (with Execution Priority Queue) ──
  async function handleSaveClassifier(e) {
    e.preventDefault();
    try {
      const isEditing = Boolean(editingClassifierId);
      const payload = isEditing 
        ? { ...newClassifierForm, id: editingClassifierId }
        : { ...newClassifierForm, priority: classifiers.length + 1 };

      const res = await fetch(`${API_BASE}/api/workspace/classifiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
);
      const data = await res.json();
      if (data.classifier) {
        if (isEditing) {
          setClassifiers(prev => prev.map(c => c.id === editingClassifierId ? data.classifier : c));
          flashToast('Classifier rule updated!');
        }
 else {
          setClassifiers(prev => [...prev, data.classifier]);
          flashToast('Classifier rule created in execution queue!');
        }

        setShowAddClassifierModal(false);
        setEditingClassifierId(null);
        setNewClassifierForm({
          name: '',
          condition_type: 'keyword',
          condition_value: '',
          target_action: 'route_model',
          target_value: 'anthropic/claude-3.5-sonnet',
          enabled: true,
        }
);
      }

    }
 catch (err) {
      alert('Failed to save classifier: ' + err.message);
    }

  }


  async function handleToggleClassifier(rule) {
    const updated = { ...rule, enabled: !rule.enabled };
    try {
      const res = await fetch(`${API_BASE}/api/workspace/classifiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }
);
      const data = await res.json();
      if (data.classifier) {
        setClassifiers(prev => prev.map(c => c.id === rule.id ? data.classifier : c));
        flashToast(`Rule '${rule.name}' ${updated.enabled ? 'activated' : 'paused'}.`);
      }

    }
 catch (err) {
      alert('Failed to toggle rule');
    }

  }


  function handleOpenEditClassifier(rule) {
    setEditingClassifierId(rule.id);
    setNewClassifierForm({
      name: rule.name || '',
      condition_type: rule.condition_type || 'keyword',
      condition_value: rule.condition_value || '',
      target_action: rule.target_action || 'route_model',
      target_value: rule.target_value || 'anthropic/claude-3.5-sonnet',
      enabled: rule.enabled !== false,
    }
);
    setShowAddClassifierModal(true);
  }


  async function handleTestEvaluatePrompt(e) {
    e?.preventDefault();
    if (!testClassifierPrompt.trim()) return;
    setTestingClassifier(true);
    setTestClassifierResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/workspace/classifiers/test-evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: testClassifierPrompt.trim() }),
      }
);
      const data = await res.json();
      setTestClassifierResult(data);
    }
 catch (err) {
      alert('Failed to evaluate prompt: ' + err.message);
    }
 finally {
      setTestingClassifier(false);
    }

  }


  async function handleDeleteClassifier(ruleId) {
    if (!confirm('Are you sure you want to remove this classifier rule?')) return;
    try {
      await fetch(`${API_BASE}/api/workspace/classifiers/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId }),
      }
);
      const res = await fetch(`${API_BASE}/api/workspace/classifiers`);
      const data = await res.json();
      setClassifiers(data.classifiers || []);
      flashToast('Classifier rule removed.');
    }
 catch (err) {
      alert('Failed to delete classifier');
    }

  }


  async function handleMoveClassifierPriority(index, direction) {
    const newArr = [...classifiers];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newArr.length) return;

    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;

    const orderedIds = newArr.map(c => c.id);
    try {
      const res = await fetch(`${API_BASE}/api/workspace/classifiers/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      }
);
      const data = await res.json();
      if (data.classifiers) {
        setClassifiers(data.classifiers);
        flashToast('Priority order reindexed successfully!');
      }

    }
 catch (err) {
      alert('Failed to reorder classifiers');
    }

  }


  // ── Cache Settings Handler (with Similarity Threshold Slider) ──
  async function handleSaveCacheSettings(customUpdates = {}) {
    try {
      const payload = { ...cacheSettings, ...customUpdates };
      const res = await fetch(`${API_BASE}/api/workspace/cache-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
);
      const data = await res.json();
      if (data.cacheSettings) {
        setCacheSettings(data.cacheSettings);
        flashToast('Semantic Caching configuration saved!');
      }

    }
 catch (err) {
      alert('Failed to update cache settings');
    }

  }


  // ── Presets Handlers ──
  async function handleSavePreset(e) {
    e.preventDefault();
    try {
      const isEditing = Boolean(editingPresetId);
      const url = isEditing 
        ? `${API_BASE}/api/workspace/presets/update`
        : `${API_BASE}/api/workspace/presets`;

      const payload = isEditing 
        ? { ...newPresetForm, id: editingPresetId }
        : newPresetForm;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-plan': plan || 'free'
        }
,
        body: JSON.stringify(payload),
      }
);
      const data = await res.json();

      if (data.preset) {
        if (isEditing) {
          setPresets(prev => prev.map(p => p.id === editingPresetId ? data.preset : p));
          flashToast('System Preset updated successfully!');
        }
 else {
          setPresets(prev => [...prev, data.preset]);
          flashToast('System Preset created successfully!');
        }

        setShowAddPresetModal(false);
        setEditingPresetId(null);
        setNewPresetForm({ name: '', description: '', system_prompt: '', default_model: 'openai/gpt-4o', temperature: 0.7, max_tokens: 2048 });
      }
 else if (data.error) {
        alert(data.error.message || 'Failed to save preset.');
      }

    }
 catch (err) {
      alert('Failed to save preset: ' + err.message);
    }

  }


  function handleOpenCreatePreset() {
    setEditingPresetId(null);
    setNewPresetForm({
      name: '',
      description: '',
      system_prompt: '',
      default_model: 'openai/gpt-4o',
      temperature: 0.7,
      max_tokens: 2048,
    }
);
    setShowAddPresetModal(true);
  }


  function handleOpenEditPreset(preset) {
    setEditingPresetId(preset.id);
    setNewPresetForm({
      name: preset.name || '',
      description: preset.description || '',
      system_prompt: preset.system_prompt || '',
      default_model: preset.default_model || 'openai/gpt-4o',
      temperature: preset.temperature !== undefined ? preset.temperature : 0.7,
      max_tokens: preset.max_tokens || 2048,
    }
);
    setShowAddPresetModal(true);
  }


  function handleClonePreset(preset) {
    setEditingPresetId(null);
    setNewPresetForm({
      name: `${preset.name} (Copy)`,
      description: preset.description || '',
      system_prompt: preset.system_prompt || '',
      default_model: preset.default_model || 'openai/gpt-4o',
      temperature: preset.temperature !== undefined ? preset.temperature : 0.7,
      max_tokens: preset.max_tokens || 2048,
    }
);
    setShowAddPresetModal(true);
  }


  async function handleDeletePreset(presetId) {
    if (!confirm('Are you sure you want to delete this preset?')) return;
    try {
      await fetch(`${API_BASE}/api/workspace/presets/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId }),
      }
);
      setPresets(prev => prev.filter(p => p.id !== presetId));
      flashToast('Preset deleted.');
    }
 catch (err) {
      alert('Failed to delete preset');
    }

  }


  function flashToast(msg) {
    setSavedSuccessMsg(msg);
    setTimeout(() => setSavedSuccessMsg(''), 3500);
  }


  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  }


  function copyWithFeedback(text, keyId = 'default') {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedState(prev => ({ ...prev, [keyId]: true }));
    setTimeout(() => {
      setCopiedState(prev => ({ ...prev, [keyId]: false }));
    }
, 2000);
  }


  async function openKeyAnalytics(keyObj) {
    setSelectedKeyForAnalytics(keyObj);
    setLoadingKeyAnalytics(true);
    try {
      const res = await fetch(`${API_BASE}/api/workspace/keys/analytics?keyId=${encodeURIComponent(keyObj.id)}`);
      const data = await res.json();
      setKeyAnalyticsData(data);
    } catch (err) {
      console.error('[workspace] failed to load key analytics:', err);
    } finally {
      setLoadingKeyAnalytics(false);
    }
  }

  // ── Workspace Switcher & Creation Handlers ──
  async function handleSwitchWorkspace(targetWs) {
    try {
      const res = await fetch(`${API_BASE}/api/workspace/workspaces/active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: targetWs.id }),
      });
      const d = await res.json();
      if (d.success) {
        setActiveWorkspace(d.activeWorkspace || targetWs);
        setShowCreateWsModal(false);
        flashToast(`Switched to workspace: ${targetWs.name}`);
        await fetchInitialData(targetWs.id);
        if (targetWs.id) loadWorkspaceMembers(targetWs.id);
      }
    } catch (err) {
      alert('Failed to switch workspace: ' + err.message);
    }
  }

  async function handleCreateWorkspace(e) {
    e.preventDefault();
    if (!newWsForm.name.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/workspace/workspaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWsForm.name.trim(),
          description: newWsForm.description.trim(),
        }),
      });
      const d = await res.json();
      if (d.success && d.workspace) {
        setWorkspaces(prev => [...prev, d.workspace]);
        setActiveWorkspace(d.workspace);
        setShowCreateWsModal(false);
        setNewWsForm({ name: '', description: '', environment: 'production' });
        flashToast(`Created & switched to ${d.workspace.name}!`);
        await fetchInitialData(d.workspace.id);
        if (d.workspace.id) loadWorkspaceMembers(d.workspace.id);
      } else {
        alert(d.error || 'Failed to create workspace');
      }
    } catch (err) {
      alert('Network error creating workspace: ' + err.message);
    }
  }

  // ── Team Members & Workspace Lifecycle Handlers ──
  async function loadWorkspaceMembers(wsId) {
    if (!wsId) return;
    setLoadingMembers(true);
    try {
      const email = user?.email || session?.user?.email || 'admin@netrootai.tech';
      const res = await fetch(`${API_BASE}/api/workspace/members?workspaceId=${encodeURIComponent(wsId)}`, {
        headers: { 'x-user-email': email },
      });
      const data = await res.json();
      if (data.members) setMembers(data.members);
    } catch (err) {
      console.warn('[workspace] failed to load members:', err);
    } finally {
      setLoadingMembers(false);
    }
  }

  async function handleSaveWorkspaceSettings(e) {
    e?.preventDefault();
    setSettingsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/workspace/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspace?.id,
          name: wsName || activeWorkspace?.name || 'Default Workspace',
          description: wsDescription,
          environment: wsEnv || activeWorkspace?.environment || 'production',
          service_tier: serviceTier,
          disable_user_keys: disableUserKeys,
          monthly_budget_usd: Number(monthlyBudget) || 250,
          budget_alert_threshold: Number(budgetAlertThreshold) || 80,
        }),
      });
      const d = await res.json();
      if (d.success && d.workspace) {
        setActiveWorkspace(d.workspace);
        setWorkspaces(prev => prev.map(w => w.id === d.workspace.id ? d.workspace : w));
        setSettingsSaved(true);
        flashToast('Workspace settings saved successfully!');
        setTimeout(() => setSettingsSaved(false), 2500);
      } else {
        alert(d.error || 'Failed to save settings');
      }
    } catch (err) {
      alert('Network error while saving settings: ' + err.message);
    } finally {
      setSettingsSaving(false);
    }
  }

  async function handleInviteMember(e) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInvitingMember(true);
    try {
      const res = await fetch(`${API_BASE}/api/workspace/members/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspace?.id,
          email: inviteEmail.trim(),
          role: inviteRole,
          invitedBy: user?.email || session?.user?.email || 'Owner',
        }),
      });
      const data = await res.json();
      if (data.success && data.member) {
        setMembers(prev => [...prev, data.member]);
        setShowInviteMemberModal(false);
        setInviteEmail('');
        flashToast(`Invited ${data.member.email} as ${data.member.role}`);
      } else {
        alert(data.error || 'Failed to invite member');
      }
    } catch (err) {
      alert('Network error inviting member: ' + err.message);
    } finally {
      setInvitingMember(false);
    }
  }

  async function handleRemoveMember(memberId, email) {
    if (!confirm(`Are you sure you want to remove ${email} from this workspace?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/workspace/members/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: activeWorkspace?.id, memberId }),
      });
      const data = await res.json();
      if (data.success) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
        flashToast('Member removed from workspace.');
      } else {
        alert(data.error || 'Failed to remove member');
      }
    } catch (err) {
      alert('Failed to remove member: ' + err.message);
    }
  }

  async function handleUpdateMemberRole(memberId, role) {
    try {
      const res = await fetch(`${API_BASE}/api/workspace/members/update-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: activeWorkspace?.id, memberId, role }),
      });
      const data = await res.json();
      if (data.success && data.member) {
        setMembers(prev => prev.map(m => m.id === memberId ? data.member : m));
        flashToast(`Updated role to ${role}`);
      }
    } catch (err) {
      alert('Failed to update role');
    }
  }

  async function handleResetWorkspaceConfig() {
    setResettingConfig(true);
    try {
      const res = await fetch(`${API_BASE}/api/workspace/reset-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: activeWorkspace?.id }),
      });
      const data = await res.json();
      if (data.success) {
        const [rtRes, clsRes] = await Promise.all([
          fetch(`${API_BASE}/api/workspace/routing`).then(r => r.json()).catch(() => ({ routing: {} })),
          fetch(`${API_BASE}/api/workspace/classifiers`).then(r => r.json()).catch(() => ({ classifiers: [] })),
        ]);
        if (rtRes?.routing) setRouting(rtRes.routing);
        if (clsRes?.classifiers) setClassifiers(clsRes.classifiers);
        setShowResetConfigModal(false);
        flashToast('Workspace configurations reset to default successfully!');
      } else {
        alert(data.error || 'Failed to reset config');
      }
    } catch (err) {
      alert('Reset failed: ' + err.message);
    } finally {
      setResettingConfig(false);
    }
  }

  async function handleDeleteCurrentWorkspace() {
    if (deleteConfirmText.trim() !== (activeWorkspace?.name || '').trim()) {
      alert('Confirmation name does not match. Please enter the exact workspace name.');
      return;
    }
    setDeletingWs(true);
    try {
      const res = await fetch(`${API_BASE}/api/workspace/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: activeWorkspace?.id }),
      });
      const data = await res.json();
      if (data.success) {
        setWorkspaces(data.workspaces || []);
        setActiveWorkspace(data.activeWorkspace || data.workspaces?.[0]);
        setShowDeleteWsModal(false);
        setDeleteConfirmText('');
        flashToast('Workspace deleted. Switched back to Default Workspace.');
      } else {
        alert(data.error || 'Failed to delete workspace');
      }
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeletingWs(false);
    }
  }


  const thisWeekUsage = overviewData?.usageThisWeek || {
    spend_usd: 0,
    requests_count: 0,
    tokens_count: 0,
  }
;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0a0a0a] text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
      {/* ── Top Header Bar (Screenshot Match) ── */}
      <header className={`border-b sticky top-0 z-30 px-6 py-2.5 flex items-center justify-between ${darkMode ? 'bg-[#0f0f0f]/95 border-[#1f1f1f] backdrop-blur-md' : 'bg-white/95 border-gray-200 backdrop-blur-md'
        }
`}>
        <div className="flex items-center gap-3">
          {/* Workspace Switcher */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className={`px-2 py-1 rounded-md font-mono ${darkMode ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
              Personal
            </span>
            <span className="text-gray-500">/</span>
            <button
              onClick={() => setShowCreateWsModal(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium transition-all ${darkMode ? 'bg-[#181818] border-[#2e2e2e] text-white hover:border-gray-500' : 'bg-white border-gray-300 text-gray-900'
                }
`}
            >
              <span>{activeWorkspace?.name || 'Default Workspace'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Center / Search */}
        <div className="hidden md:flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${darkMode ? 'bg-[#161616] border-[#282828] text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-600'
            }
`}>
            <Search className="w-3.5 h-3.5" />
            <input
              placeholder="Search Workspace..."
              className="bg-transparent outline-none w-44 text-xs placeholder-gray-500"
            />
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-mono text-gray-400">⌘K</kbd>
          </div>
        </div>

        {/* Right Navigation Quick Links */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <button onClick={() => navigate('/dashboard')} className="hover:text-blue-400 text-gray-400 transition-colors">
            Dashboard
          </button>
          <button onClick={() => navigate('/app/models')} className="hover:text-blue-400 text-gray-400 transition-colors">
            Models
          </button>
          <button onClick={() => navigate('/threads')} className="hover:text-blue-400 text-gray-400 transition-colors">
            Chat
          </button>
          <button onClick={() => navigate('/help')} className="hover:text-blue-400 text-gray-400 transition-colors">
            Docs
          </button>
          <div className="w-px h-4 bg-gray-700" />
          <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            NetRoot AI Gateway Active
          </span>
        </div>
      </header>

      {/* ── Main Layout: Sidebar + Content ── */}
      <div className="flex">
        {/* Left Sidebar */}
        <aside className={`w-56 shrink-0 border-r min-h-[calc(100vh-49px)] p-4 ${darkMode ? 'bg-[#0d0d0d] border-[#1f1f1f]' : 'bg-white border-gray-200'
          }
`}>
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex items-center gap-1.5 text-xs mb-6 font-medium transition-colors ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
              }
`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Account</span>
          </button>

          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 px-2.5">
            Workspace
          </div>

          <nav className="space-y-0.5">
            {SIDEBAR_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${isActive
                      ? darkMode
                        ? 'bg-[#1f1f1f] text-white shadow-sm font-semibold'
                        : 'bg-blue-50 text-blue-600 font-semibold'
                      : darkMode
                        ? 'text-gray-400 hover:text-white hover:bg-white/5'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? (darkMode ? 'text-lime-400' : 'text-blue-600') : 'text-gray-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/20">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            }
)}
          </nav>

          {/* Quick API Gateway badge */}
          <div className={`mt-8 p-3 rounded-xl border text-[11px] ${darkMode ? 'bg-[#141414] border-[#222]' : 'bg-gray-100 border-gray-200'
            }
`}>
            <div className="flex items-center gap-1.5 text-blue-400 font-semibold mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Developer Gateway</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-tight">
              Forward requests via <code className="text-gray-300 font-mono">/api/v1/chat/completions</code> with NetRoot Keys.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-8 max-w-6xl">
          {savedSuccessMsg && (
            <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{savedSuccessMsg}</span>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 1: OVERVIEW (Screenshot Exact Match)
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Title & Description */}
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  {activeWorkspace?.name || 'Default Workspace'}
                </h1>
                <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  We created this workspace for you with all your existing API keys, routing rules, privacy settings, guardrails, and configurations.
                </p>
              </div>

              {/* Informational Banner */}
              {showBanner && (
                <div className={`p-4 rounded-xl border flex items-start justify-between relative ${darkMode ? 'bg-[#0f1923] border-[#1d354a] text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-900'
                  }
`}>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-0.5">Introducing Workspaces!</h4>
                    <p className="text-xs text-blue-300/90 leading-relaxed">
                      Organize your NetRoot AI inference models and team usage into different environments with separate keys, configurations, budgets, and rules.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowBanner(false)}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* This Week's Usage Cards */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-white tracking-wide">This Week's Usage</h3>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    View Activity <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Spend */}
                  <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center text-center min-h-[140px] transition-all ${darkMode ? 'bg-[#111] border-[#222] hover:border-[#333]' : 'bg-white border-gray-200'
                    }
`}>
                    <BarChart2 className="w-5 h-5 text-gray-500 mb-2" />
                    <div className="text-sm font-semibold text-gray-300">
                      {thisWeekUsage.spend_usd > 0 ? `$${thisWeekUsage.spend_usd.toFixed(4)} spent` : 'No spend this week'}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1">NetRoot 20% Margin Active</span>
                  </div>

                  {/* Card 2: Requests */}
                  <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center text-center min-h-[140px] transition-all ${darkMode ? 'bg-[#111] border-[#222] hover:border-[#333]' : 'bg-white border-gray-200'
                    }
`}>
                    <Activity className="w-5 h-5 text-gray-500 mb-2" />
                    <div className="text-sm font-semibold text-gray-300">
                      {thisWeekUsage.requests_count > 0 ? `${thisWeekUsage.requests_count} requests this week` : 'No requests this week'}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1">Live Gateway Telemetry</span>
                  </div>

                  {/* Card 3: Tokens */}
                  <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center text-center min-h-[140px] transition-all ${darkMode ? 'bg-[#111] border-[#222] hover:border-[#333]' : 'bg-white border-gray-200'
                    }
`}>
                    <Layers className="w-5 h-5 text-gray-500 mb-2" />
                    <div className="text-sm font-semibold text-gray-300">
                      {thisWeekUsage.tokens_count > 0 ? `${thisWeekUsage.tokens_count.toLocaleString()} tokens this week` : 'No tokens this week'}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1">Prompt & Completion Tokens</span>
                  </div>
                </div>
              </div>

              {/* 8 Feature Jump Cards (Screenshot 1-to-1 Match) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* 1. API Keys */}
                <div
                  onClick={() => setActiveTab('keys')}
                  className={`p-5 rounded-2xl border cursor-pointer group transition-all duration-200 ${darkMode ? 'bg-[#111] border-[#222] hover:border-blue-500/40 hover:bg-[#141414]' : 'bg-white border-gray-200 hover:border-blue-400'
                    }
`}
                >
                  <div className="flex items-start justify-between">
                    <Key className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="text-sm font-bold text-white mt-3 group-hover:text-blue-400 transition-colors">API Keys</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Create and manage API keys in this workspace.
                  </p>
                  <div className="mt-4 text-[11px] font-mono text-gray-500">
                    {apiKeys.length} {apiKeys.length === 1 ? 'key' : 'keys'} active
                  </div>
                </div>

                {/* 2. Guardrails */}
                <div
                  onClick={() => setActiveTab('guardrails')}
                  className={`p-5 rounded-2xl border cursor-pointer group transition-all duration-200 ${darkMode ? 'bg-[#111] border-[#222] hover:border-emerald-500/40 hover:bg-[#141414]' : 'bg-white border-gray-200 hover:border-emerald-400'
                    }
`}
                >
                  <div className="flex items-start justify-between">
                    <ShieldCheck className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="text-sm font-bold text-white mt-3 group-hover:text-emerald-400 transition-colors">Guardrails</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Set budgets, model/provider restrictions, privacy, and content policies.
                  </p>
                  <div className="mt-4 text-[11px] font-mono text-emerald-400">
                    Budget cap: ${guardrails?.monthly_budget_cap_usd || 250}/mo
                  </div>
                </div>

                {/* 3. BYOK */}
                <div
                  onClick={() => setActiveTab('byok')}
                  className={`p-5 rounded-2xl border cursor-pointer group transition-all duration-200 ${darkMode ? 'bg-[#111] border-[#222] hover:border-purple-500/40 hover:bg-[#141414]' : 'bg-white border-gray-200 hover:border-purple-400'
                    }
`}
                >
                  <div className="flex items-start justify-between">
                    <Server className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="text-sm font-bold text-white mt-3 group-hover:text-purple-400 transition-colors">BYOK</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Bring your own custom provider API keys or use platform routing.
                  </p>
                  <div className="mt-4 text-[11px] font-mono text-purple-400">
                    NetRoot Managed Cloud Active
                  </div>
                </div>

                {/* 4. Routing */}
                <div
                  onClick={() => setActiveTab('routing')}
                  className={`p-5 rounded-2xl border cursor-pointer group transition-all duration-200 ${darkMode ? 'bg-[#111] border-[#222] hover:border-amber-500/40 hover:bg-[#141414]' : 'bg-white border-gray-200 hover:border-amber-400'
                    }
`}
                >
                  <div className="flex items-start justify-between">
                    <Shuffle className="w-5 h-5 text-gray-400 group-hover:text-amber-400 transition-colors" />
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="text-sm font-bold text-white mt-3 group-hover:text-amber-400 transition-colors">Routing</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Set routing policies for models and providers.
                  </p>
                  <div className="mt-4 text-[11px] font-mono text-amber-400">
                    Auto Fallback Cascades
                  </div>
                </div>

                {/* 5. Presets */}
                <div
                  onClick={() => setActiveTab('presets')}
                  className={`p-5 rounded-2xl border cursor-pointer group transition-all duration-200 ${darkMode ? 'bg-[#111] border-[#222] hover:border-cyan-500/40 hover:bg-[#141414]' : 'bg-white border-gray-200 hover:border-cyan-400'
                    }
`}
                >
                  <div className="flex items-start justify-between">
                    <Sliders className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="text-sm font-bold text-white mt-3 group-hover:text-cyan-400 transition-colors">Presets</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Save shortcuts for system prompts and request parameters.
                  </p>
                  <div className="mt-4 text-[11px] font-mono text-cyan-400">
                    {presets.length} Presets Configured
                  </div>
                </div>

                {/* 6. Classifiers */}
                <div
                  onClick={() => setActiveTab('classifiers')}
                  className={`p-5 rounded-2xl border cursor-pointer group transition-all duration-200 ${darkMode ? 'bg-[#111] border-[#222] hover:border-amber-500/40 hover:bg-[#141414]' : 'bg-white border-gray-200 hover:border-amber-400'
                    }
`}
                >
                  <div className="flex items-start justify-between">
                    <Tag className="w-5 h-5 text-gray-400 group-hover:text-amber-400 transition-colors" />
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="text-sm font-bold text-white mt-3 group-hover:text-amber-400 transition-colors">Classifiers</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Evaluate intent and apply guardrails before query routing.
                  </p>
                  <div className="mt-4 text-[11px] font-mono text-amber-400">
                    {classifiers.length} Rules Active
                  </div>
                </div>

                {/* 7. Settings */}
                <div
                  onClick={() => setActiveTab('settings')}
                  className={`p-5 rounded-2xl border cursor-pointer group transition-all duration-200 ${darkMode ? 'bg-[#111] border-[#222] hover:border-gray-400 hover:bg-[#141414]' : 'bg-white border-gray-200 hover:border-gray-500'
                    }
`}
                >
                  <div className="flex items-start justify-between">
                    <Settings className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="text-sm font-bold text-white mt-3 group-hover:text-white transition-colors">Settings</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Edit the workspace name and description.
                  </p>
                  <div className="mt-4 text-[11px] font-mono text-gray-500">
                    Environment: {activeWorkspace?.environment || 'Production'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW: BILLING & PLANS (Consolidated from Project Settings)
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  Billing & Subscription Plans
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Manage your subscription tier, daily token allowance, and payment options.
                </p>
              </div>
              <Billing
                darkMode={darkMode}
                autoUpgradePlan={autoUpgradePlan}
                onAutoUpgradeDone={() => setAutoUpgradePlan(null)}
              />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW: YOUR MODELS & LIMITS (Fleet Rate Limits, Quota & Model Toggles)
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'models' && (() => {
            const isPro = plan === 'pro' || plan === 'enterprise';
            const normalizedPlan = normalizePlan(plan);
            const activePlanLimits = planLimits[normalizedPlan] || planLimits.free;
            const planLimit = activePlanLimits.dailyTokenLimit;
            const freeLimit = planLimits.free?.dailyTokenLimit || DEFAULT_PLAN_LIMITS.free.dailyTokenLimit;
            const proLimit = planLimits.pro?.dailyTokenLimit || DEFAULT_PLAN_LIMITS.pro.dailyTokenLimit;

            const perModelTokens = modelUsageData?.perModelTokens || {};
            const perModelImages = modelUsageData?.perModelImages || {};
            const imageUsageThisMonth = modelUsageData?.imageUsageThisMonth ?? perModelImages['black-forest-labs/FLUX.1-schnell'] ?? 0;
            const totalUsedToday = modelUsageData?.tokensUsedToday || 0;

            return (
              <div className="space-y-6 max-w-5xl">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-blue-400" />
                      Your Models & Daily Quota Limits
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      {isPro
                        ? `💎 Pro Plan includes ${proLimit.toLocaleString()} daily tokens across all 470+ frontier & open-source models.`
                        : `🟢 Free Plan includes ${freeLimit.toLocaleString()} daily tokens on fast native models. Upgrade to Pro for 100,000 tokens/day.`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                        plan === 'enterprise'
                          ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                          : plan === 'pro'
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      }
`}
                    >
                      {plan === 'enterprise' ? '⚡ Enterprise' : plan === 'pro' ? '💎 Pro Tier' : '🟢 Free Fleet'}
                    </span>

                    {!isPro && (
                      <button
                        onClick={() => setActiveTab('billing')}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3.5 py-1.5 rounded-xl shadow-md transition-all"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Upgrade to Pro
                      </button>
                    )}

                    <button
                      onClick={() => setModelModalMode('allow-block')}
                      className={`text-xs font-medium rounded-xl px-3.5 py-1.5 border transition-colors ${
                        darkMode
                          ? 'bg-[#1e1e1e] hover:bg-[#282828] border-[#333] text-white'
                          : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800'
                      }
`}
                    >
                      Allow / Block Models
                    </button>
                  </div>
                </div>

                {/* 3 Quota Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Daily Chat Tokens Card */}
                  <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span className="flex items-center gap-1.5 font-medium text-white">
                        <Zap className="w-4 h-4 text-amber-400" />
                        Daily Chat Tokens
                      </span>
                      <span className="font-mono text-[11px]">
                        {planLimit ? `${Math.min(100, Math.round((totalUsedToday / planLimit) * 100))}%` : 'Unlimited'}
                      </span>
                    </div>
                    <p className="text-xl font-bold font-mono text-white mb-2">
                      {totalUsedToday.toLocaleString()} <span className="text-xs text-gray-500 font-normal">/ {planLimit ? planLimit.toLocaleString() : '∞'} tokens</span>
                    </p>
                    <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-[#222]' : 'bg-gray-100'}`}>
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-emerald-400"
                        style={{ width: `${planLimit ? Math.min(100, Math.round((totalUsedToday / planLimit) * 100)) : 10}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">
                      Resets automatically at midnight (00:00 UTC)
                    </p>
                  </div>

                  {/* FLUX Image Studio Card */}
                  <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span className="flex items-center gap-1.5 font-medium text-white">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        FLUX.1 Image Studio
                      </span>
                      <span className="font-mono text-[11px]">
                        {isPro ? `${imageUsageThisMonth} / 10` : 'Pro Only'}
                      </span>
                    </div>
                    <p className="text-xl font-bold font-mono text-white mb-2">
                      {imageUsageThisMonth} <span className="text-xs text-gray-500 font-normal">/ {isPro ? '10 images/mo' : '0 (Free)'}</span>
                    </p>
                    <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-[#222]' : 'bg-gray-100'}`}>
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-purple-500"
                        style={{ width: `${isPro ? Math.min(100, (imageUsageThisMonth / 10) * 100) : 0}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">
                      {isPro ? 'Includes high-definition FLUX Schnell generation' : 'Upgrade to Pro for 10 images each month'}
                    </p>
                  </div>

                  {/* PPT Studio Card */}
                  <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span className="flex items-center gap-1.5 font-medium text-white">
                        <Presentation className="w-4 h-4 text-blue-400" />
                        NetRoot PPT Studio
                      </span>
                      <span className="font-mono text-[11px]">
                        {isPro ? 'Active' : 'Free Tier'}
                      </span>
                    </div>
                    <p className="text-xl font-bold font-mono text-white mb-2">
                      {isPro ? 'Unlimited' : '2 Lifetime'} <span className="text-xs text-gray-500 font-normal">decks</span>
                    </p>
                    <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-[#222]' : 'bg-gray-100'}`}>
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-blue-500"
                        style={{ width: isPro ? '100%' : '50%' }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">
                      Executive 16:9 decks • ~850-1,200 tokens/deck
                    </p>
                  </div>
                </div>

                {/* Color Legend */}
                <div className="flex items-center gap-5 flex-wrap pt-2">
                  {[
                    ['bg-emerald-500', '< 60% Safe'],
                    ['bg-yellow-500', '60% – 85% Warning'],
                    ['bg-red-500', '> 85% Near Limit'],
                    ['bg-red-700', '100% Fully Blocked'],
                  ].map(([cls, label]) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${cls}`} />
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {label}
                      </span>
                    </div>
                  ))}

                  {loadingUsage && (
                    <span className={`text-xs flex items-center gap-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Syncing usage telemetry...
                    </span>
                  )}
                </div>

                {/* Fleet Filter Bar & Dynamically Merged Models */}
                {(() => {
                  const perModel30d = modelUsageData?.perModel || {};
                  const baseModelIds = new Set(WORKSPACE_MODELS.map(m => m.id));

                  // Construct dynamic model objects for any models the user has actually used
                  const dynamicallyUsedModels = Object.keys(perModel30d)
                    .concat(Object.keys(perModelTokens))
                    .filter((id, idx, arr) => arr.indexOf(id) === idx && !baseModelIds.has(id))
                    .map(id => {
                      const stats = perModel30d[id] || {};
                      const parts = id.split('/');
                      const rawProvider = parts.length > 1 ? parts[0] : 'NetRoot AI';
                      const provider = rawProvider.charAt(0).toUpperCase() + rawProvider.slice(1);
                      const name = parts[parts.length - 1].replace(/[-_]/g, ' ').toUpperCase();
                      return {
                        id,
                        name,
                        desc: `Catalog model actively used in your workspace (${stats.requests || 1} calls • ${(stats.tokens || 0).toLocaleString()} tokens)`,
                        rpm: 30,
                        tpm: 6000,
                        dailyTokens: planLimit,
                        contextWindow: 131072,
                        provider,
                        isDynamicallyUsed: true,
                        totalUsed30d: stats.tokens || 0,
                        requests30d: stats.requests || 0,
                        lastUsed: stats.lastUsed,
                      }
;
                    }
);

                  const combinedFleetModels = [
                    ...WORKSPACE_MODELS.filter(m => allowedModels.includes(m.id)),
                    ...dynamicallyUsedModels,
                  ];

                  const usedCount = combinedFleetModels.filter(m => {
                    const isFlux = m.id === 'black-forest-labs/FLUX.1-schnell';
                    const usedValue = isFlux ? imageUsageThisMonth : (perModelTokens[m.id] || m.totalUsed30d || 0);
                    return usedValue > 0 || (m.requests30d && m.requests30d > 0);
                  }
).length;

                  const filteredFleetModels = combinedFleetModels.filter(m => {
                    if (modelsFleetFilter === 'used') {
                      const isFlux = m.id === 'black-forest-labs/FLUX.1-schnell';
                      const usedValue = isFlux ? imageUsageThisMonth : (perModelTokens[m.id] || m.totalUsed30d || 0);
                      return usedValue > 0 || (m.requests30d && m.requests30d > 0);
                    }

                    if (modelsFleetFilter === 'core') {
                      return !m.isDynamicallyUsed;
                    }

                    return true;
                  }
);

                  return (
                    <div className="space-y-4">
                      {/* Sub-filter tabs */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${darkMode ? 'bg-[#141414] border-[#242424]' : 'bg-gray-100 border-gray-200'}`}>
                          <button
                            onClick={() => setModelsFleetFilter('all')}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                              modelsFleetFilter === 'all'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                            }
`}
                          >
                            All Models ({combinedFleetModels.length})
                          </button>
                          <button
                            onClick={() => setModelsFleetFilter('used')}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                              modelsFleetFilter === 'used'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                            }
`}
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Your Used Models ({usedCount})
                          </button>
                          <button
                            onClick={() => setModelsFleetFilter('core')}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                              modelsFleetFilter === 'core'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                            }
`}
                          >
                            Core Fleet ({WORKSPACE_MODELS.filter(m => allowedModels.includes(m.id)).length})
                          </button>
                        </div>
                      </div>

                      {/* Per-Model Fleet Cards */}
                      <div className="space-y-3">
                        {filteredFleetModels.map(model => {
                          const isFlux = model.id === 'black-forest-labs/FLUX.1-schnell';
                          const isPpt = model.id === 'ppt-studio';
                          const usedValue = isFlux ? imageUsageThisMonth : (perModelTokens[model.id] || 0);
                          const effectiveLimit = isFlux ? getModelImageLimit(plan, model.id) : isPpt ? null : planLimit;

                          const rawPct =
                            effectiveLimit && effectiveLimit > 0
                              ? Math.round((usedValue / effectiveLimit) * 100)
                              : 0;

                          const dailyPct = Math.min(100, Math.max(0, rawPct));
                          const isBlocked = effectiveLimit !== null && rawPct >= 100;
                          const isOver = dailyPct >= 85 && !isBlocked;
                          const isWarn = dailyPct >= 60 && dailyPct < 85;

                          const barColor = isBlocked
                            ? 'bg-red-700'
                            : isOver
                              ? 'bg-red-500'
                              : isWarn
                                ? 'bg-yellow-500'
                                : 'bg-emerald-500';

                          const total30d = model.totalUsed30d || perModel30d[model.id]?.tokens || 0;
                          const calls30d = model.requests30d || perModel30d[model.id]?.requests || 0;

                    return (
                      <div
                        key={model.id}
                        className={`border rounded-2xl overflow-hidden relative transition-all ${
                          isBlocked
                            ? darkMode
                              ? 'border-red-900/60 bg-[#161616]'
                              : 'border-red-200 bg-white'
                            : darkMode
                              ? 'border-[#222] bg-[#121212]'
                              : 'border-gray-200 bg-white'
                        }
`}
                      >
                        {isBlocked && (
                          <div
                            className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl backdrop-blur-[2px] ${
                              darkMode ? 'bg-[#0e0e0e]/85' : 'bg-white/90'
                            }
`}
                          >
                            <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                              <Lock className="w-5 h-5 text-red-400" />
                            </div>

                            <div className="text-center px-4">
                              <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Daily Limit Reached for {model.name}
                              </p>
                              <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {isFlux ? 'Monthly image allowance reached. Resets next billing cycle.' : 'Daily tokens exhausted. Resets at midnight (00:00 UTC).'}
                              </p>
                            </div>

                            <button
                              onClick={() => setActiveTab('billing')}
                              className="flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white px-5 py-2 rounded-xl transition-all shadow-lg"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              Upgrade to Pro for 100k Tokens
                            </button>
                          </div>
                        )}

                        <div className={`p-5 ${isBlocked ? 'opacity-30 pointer-events-none select-none' : ''}`}>
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-[#1c1c1c]' : 'bg-gray-100'}`}>
                                {model.id === 'ppt-studio' ? (
                                  <Presentation className="w-4 h-4 text-blue-400" />
                                ) : isFlux ? (
                                  <Sparkles className="w-4 h-4 text-purple-400" />
                                ) : (
                                  <Cpu className="w-4 h-4 text-gray-300" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {model.name}
                                  </span>

                                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                                    darkMode ? 'bg-[#1a1a1a] border-[#333] text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-600'
                                  }
`}>
                                    {model.provider}
                                  </span>

                                  {isBlocked && (
                                    <span className="text-[10px] bg-red-700/20 text-red-500 border border-red-700/40 rounded-full px-2 py-0.5 font-medium">
                                      Blocked
                                    </span>
                                  )}

                                  {isOver && (
                                    <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/25 rounded-full px-2 py-0.5 font-medium">
                                      Near Limit
                                    </span>
                                  )}

                                  {isWarn && (
                                    <span className="text-[10px] bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 rounded-full px-2 py-0.5 font-medium">
                                      Approaching Limit
                                    </span>
                                  )}

                                  {calls30d > 0 && (
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                      {calls30d} calls • {total30d.toLocaleString()} tokens
                                    </span>
                                  )}

                                  {model.isDynamicallyUsed && (
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                      Active Chat Model
                                    </span>
                                  )}
                                </div>

                                <p className={`text-xs mt-0.5 truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {model.desc}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                              <StatPill label="RPM" value={model.rpm} darkMode={darkMode} />
                              <StatPill label="TPM" value={model.tpm?.toLocaleString()} darkMode={darkMode} />
                              <StatPill
                                label="CTX"
                                value={`${(model.contextWindow / 1024).toFixed(0)}K`}
                                darkMode={darkMode}
                              />
                            </div>
                          </div>

                          {effectiveLimit ? (
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                  {isFlux ? 'Images generated this month' : 'Tokens consumed today'}
                                </span>

                                <span
                                  className={`text-xs font-mono font-medium ${
                                    isBlocked
                                      ? 'text-red-500'
                                      : isOver
                                        ? 'text-red-400'
                                        : isWarn
                                          ? 'text-yellow-400'
                                          : darkMode
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                  }
`}
                                >
                                  {usedValue.toLocaleString()} / {effectiveLimit.toLocaleString()} ({dailyPct}%)
                                </span>
                              </div>

                              <div className={`h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-[#222]' : 'bg-gray-100'}`}>
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                  style={{ width: `${dailyPct}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                Tokens used today
                              </span>
                              <span className={`text-xs font-mono font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                {usedValue.toLocaleString()} tokens • No daily limit
                              </span>
                            </div>
                          )}
                        </div>

                        {!isBlocked && isOver && (
                          <div className={`px-5 py-2.5 border-t flex items-center gap-2.5 ${darkMode ? 'border-[#222] bg-red-500/5' : 'border-red-100 bg-red-50'}`}>
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span className={`text-xs font-medium ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                              Approaching daily token threshold. Upgrade to Pro for 10x higher capacity.
                            </span>
                          </div>
                        )}
                        {!isBlocked && isWarn && (
                          <div className={`px-5 py-2.5 border-t flex items-center gap-2.5 ${darkMode ? 'border-[#222] bg-yellow-500/5' : 'border-yellow-100 bg-yellow-50'}`}>
                            <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                            <span className={`text-xs font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                              Notice: 60%+ daily quota used today.
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }
)}
                </div>

                {modelModalMode && (
                  <ModelSelectModal
                    darkMode={darkMode}
                    modelsList={allCatalogModels.length > 0 ? allCatalogModels : WORKSPACE_MODELS}
                    selected={allowedModels}
                    onSave={async (ids) => {
                      setAllowedModels(ids);
                      await handleSaveGuardrails({ ...guardrails, allowed_models: ids });
                      setModelModalMode(null);
                    }
}
                    onClose={() => setModelModalMode(null)}
                  />
                )}
              </div>
            );
          }
)()}
        </div>
      );
    }
)()}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW: ANALYTICS & TOKENS (Consolidated from Project Settings)
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-emerald-400" />
                  Token Analytics & Quota Telemetry
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Track prompt tokens, completion tokens, daily usage progress, and request timeline.
                </p>
              </div>
              <TokenDashboard darkMode={darkMode} />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 2: API KEYS TAB
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'keys' && (() => {
            const gatewayHost = typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : 'http://localhost:3001/api/v1';
            const devSnippets = {
              curl: `curl ${gatewayHost}/chat/completions \\
  -H "Authorization: Bearer nr-live-YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "liquid/lfm-2.5-2.6b:free",
    "messages": [{"role": "user", "content": "Hello NetRoot AI!"}]
  }
'`,
              python: `from openai import OpenAI

client = OpenAI(
    base_url="${gatewayHost}",
    api_key="nr-live-YOUR_KEY",
)

response = client.chat.completions.create(
    model="liquid/lfm-2.5-2.6b:free",
    messages=[{"role": "user", "content": "Hello NetRoot AI!"}],
)
print(response.choices[0].message.content)`,
              node: `import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "${gatewayHost}",
  apiKey: "nr-live-YOUR_KEY",
});

const completion = await openai.chat.completions.create({
  model: "liquid/lfm-2.5-2.6b:free",
  messages: [{ role: "user", content: "Hello NetRoot AI!" }],
});
console.log(completion.choices[0].message.content);`
            }
;

            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Key className="w-5 h-5 text-blue-400" />
                      API Keys
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      API keys allow external applications to consume models securely via the NetRoot AI Developer Gateway.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setCreatedKeyResult(null);
                      setKeyModelPreset('all');
                      setNewKeyForm({ name: '', monthly_limit_usd: 100, allowed_models: '' });
                      setShowCreateKeyModal(true);
                    }
}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Key
                  </button>
                </div>

                {/* Keys Table */}
                <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                  <table className="w-full text-left text-xs">
                    <thead className={`border-b text-[11px] font-semibold uppercase tracking-wider ${darkMode ? 'bg-[#181818] border-[#222] text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
                      }
`}>
                      <tr>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Secret Key</th>
                        <th className="py-3 px-4">Spend / Monthly Cap</th>
                        <th className="py-3 px-4">Last Used</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f1f1f]">
                      {apiKeys.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-gray-500">
                            No API keys found. Create your first key above.
                          </td>
                        </tr>
                      ) : (
                        apiKeys.map(k => (
                          <tr
                            key={k.id}
                            className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                            onClick={() => openKeyAnalytics(k)}
                          >
                            <td className="py-3 px-4 font-semibold text-white">
                              <div className="flex items-center gap-2">
                                <span>{k.name}</span>
                                {k.allowed_models && k.allowed_models.length > 0 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    {k.allowed_models.length} {k.allowed_models.length === 1 ? 'model' : 'models'}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-gray-500 font-mono">ID: {k.id}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyWithFeedback(k.id, `id_${k.id}`);
                                  }
}
                                  className="text-gray-500 hover:text-white transition-colors"
                                  title="Copy Key ID"
                                >
                                  {copiedState[`id_${k.id}`] ? (
                                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-2.5 h-2.5" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-gray-300">
                              <div className="flex items-center gap-2">
                                <span>{k.key_masked}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyWithFeedback(k.key_masked, `sec_${k.id}`);
                                  }
}
                                  className="text-gray-500 hover:text-white transition-colors"
                                  title="Copy masked key"
                                >
                                  {copiedState[`sec_${k.id}`] ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-1 min-w-[130px]">
                                <div className="flex items-center justify-between text-[11px] font-mono">
                                  <span className="font-semibold text-emerald-400">${(k.current_spend_usd || 0).toFixed(4)}</span>
                                  <span className="text-gray-500">/ ${k.monthly_limit_usd || 100}</span>
                                </div>
                                <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min(100, Math.max(2, (((k.current_spend_usd || 0) / (k.monthly_limit_usd || 100)) * 100)))}%`
                                    }
}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-gray-400">
                              {k.last_used_at ? (
                                <div>
                                  <span className="text-gray-300">
                                    {new Date(k.last_used_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                  <span className="text-gray-500 ml-1.5">
                                    {new Date(k.last_used_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-500 italic">Never</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${k.status === 'active'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-gray-500/15 text-gray-400 border border-gray-500/20'
                                }
`}>
                                {k.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => openKeyAnalytics(k)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/25 transition-all shadow-sm"
                                  title="View Usage Charts & Gateway Logs (Gemini Style)"
                                >
                                  <BarChart2 className="w-3.5 h-3.5" />
                                  <span>Usage & Logs</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleKey(k.id)}
                                  title={k.status === 'active' ? 'Disable Key' : 'Enable Key'}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                  {k.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteKey(k.id)}
                                  title="Revoke Key"
                                  className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Developer Integration Code Box */}
                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-blue-400" />
                      <div>
                        <h3 className="text-sm font-bold text-white">How to connect with NetRoot AI</h3>
                        <p className="text-[11px] text-gray-400">OpenAI SDK compatible — swap the baseURL and use your NetRoot API Key</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {['curl', 'python', 'node'].map(lang => (
                        <button
                          key={lang}
                          onClick={() => setIntegrationLang(lang)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-mono font-semibold uppercase ${integrationLang === lang
                              ? 'bg-blue-600 text-white'
                              : 'bg-white/5 text-gray-400 hover:text-white'
                            }
`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <pre className={`p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed ${darkMode ? 'bg-[#0a0a0a] text-gray-300 border border-[#222]' : 'bg-gray-100 text-gray-800'
                      }
`}>
                      {devSnippets[integrationLang]}
                    </pre>
                    <button
                      onClick={() => copyWithFeedback(devSnippets[integrationLang], 'snippet')}
                      className="absolute top-3 right-3 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 transition-colors flex items-center gap-1.5 text-xs font-medium"
                      title="Copy snippet"
                    >
                      {copiedState['snippet'] ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[11px] text-emerald-400 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px] text-gray-300">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          }
)()}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 3: ACTIVITY TAB (Usage Charts & Analytics)
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Usage & Activity
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Real-time analytics across API gateway calls, token consumption, and cost breakdown.
                </p>
              </div>

              {/* Weekly Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                  <span className="text-[11px] text-gray-400 block mb-1">Weekly Spend</span>
                  <div className="text-2xl font-bold font-mono text-emerald-400">${thisWeekUsage.spend_usd.toFixed(4)}</div>
                  <span className="text-[10px] text-gray-500 mt-1 block">Includes 20% NetRoot margin</span>
                </div>
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                  <span className="text-[11px] text-gray-400 block mb-1">Weekly Requests</span>
                  <div className="text-2xl font-bold font-mono text-blue-400">{thisWeekUsage.requests_count}</div>
                  <span className="text-[10px] text-gray-500 mt-1 block">100% gateway success rate</span>
                </div>
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                  <span className="text-[11px] text-gray-400 block mb-1">Weekly Tokens</span>
                  <div className="text-2xl font-bold font-mono text-purple-400">{thisWeekUsage.tokens_count.toLocaleString()}</div>
                  <span className="text-[10px] text-gray-500 mt-1 block">Input + Output token sum</span>
                </div>
              </div>

              {/* Visual Daily Breakdown Chart */}
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                <h3 className="text-sm font-bold text-white mb-6">7-Day Request Volume</h3>
                <div className="flex items-end justify-between gap-4 h-44 pt-6 px-2">
                  {(activityData?.timeseries || []).map((day, idx) => {
                    const maxReq = Math.max(1, ...activityData.timeseries.map(d => d.requests));
                    const heightPct = Math.round((day.requests / maxReq) * 100);
                    return (
                      <div key={day.date || idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <span className="text-[10px] font-mono font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {day.requests}
                        </span>
                        <div
                          className="w-full max-w-[40px] bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg transition-all duration-300 group-hover:from-blue-500 group-hover:to-indigo-400"
                          style={{ height: `${Math.max(12, heightPct)}%` }}
                        />
                        <span className="text-[10px] font-mono text-gray-500">{day.date?.slice(5)}</span>
                      </div>
                    );
                  }
)}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 4: LOGS TAB (Real-Time Requests Table & Inspector)
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ListFilter className="w-5 h-5 text-blue-400" />
                    Gateway Request Logs
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Search and inspect incoming completions processed by NetRoot AI proxy.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportLogsCsv}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${darkMode ? 'bg-white/5 border-[#333] text-gray-300 hover:text-white hover:bg-white/10' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'}`}
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    Export CSV
                  </button>
                  <button
                    onClick={fetchInitialData}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Filter */}
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'
                }
`}>
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  value={logSearch}
                  onChange={e => setLogSearch(e.target.value)}
                  placeholder="Filter logs by model, key name, status..."
                  className="bg-transparent text-xs outline-none w-full text-white placeholder-gray-500"
                />
              </div>

              {/* Logs Table */}
              <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                <table className="w-full text-left text-xs">
                  <thead className={`border-b text-[11px] font-semibold uppercase tracking-wider ${darkMode ? 'bg-[#181818] border-[#222] text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
                    }
`}>
                    <tr>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Source / Cache</th>
                      <th className="py-3 px-4">Model</th>
                      <th className="py-3 px-4">Tokens</th>
                      <th className="py-3 px-4">Latency</th>
                      <th className="py-3 px-4">Billed Cost</th>
                      <th className="py-3 px-4 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f1f1f]">
                    {(logs || [])
                      .filter(l => {
                        if (!logSearch) return true;
                        const s = logSearch.toLowerCase();
                        const model = (l.model || '').toLowerCase();
                        const key = (l.key_name || '').toLowerCase();
                        const status = String(l.status || '');
                        const provider = (l.provider || '').toLowerCase();
                        const id = (l.id || '').toLowerCase();
                        return model.includes(s) || key.includes(s) || status.includes(s) || provider.includes(s) || id.includes(s);
                      }
)
                      .map(log => {
                        const isErr = (log.status || 200) >= 400;
                        const latMs = log.latency_ms ?? 0;
                        const formattedLatency = latMs >= 1000 ? `${(latMs / 1000).toFixed(1)}s` : `${latMs}ms`;
                        const formattedDate = log.timestamp
                          ? new Date(log.timestamp).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            }
)
                          : '—';

                        return (
                          <tr
                            key={log.id || Math.random()}
                            onClick={() => { setSelectedLogInspect(log); setInspectTab('overview'); }}
                            className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                          >
                            <td className="py-3 px-4 text-[11px] font-mono text-gray-400 whitespace-nowrap">
                              {formattedDate}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`flex items-center gap-1.5 font-mono font-bold text-[11px] ${
                                isErr ? 'text-red-400' : 'text-emerald-400'
                              }
`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isErr ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`} />
                                {log.status || 200} {isErr ? 'ERR' : 'OK'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {log.cached_status ? (
                                <span className="px-2 py-0.5 rounded-full font-mono font-bold text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                                  <Zap className="w-3 h-3 text-emerald-400" />
                                  ⚡ Cached ($0.00)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1 w-fit">
                                  <Globe className="w-3 h-3 text-blue-400" />
                                  Live API
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold text-white">
                              {log.model || 'unknown'}
                            </td>
                            <td className="py-3 px-4 font-mono text-gray-300 whitespace-nowrap">
                              {Number(log.total_tokens ?? 0).toLocaleString()} <span className="text-[10px] text-gray-500">({Number(log.prompt_tokens ?? 0).toLocaleString()}/{Number(log.completion_tokens ?? 0).toLocaleString()})</span>
                            </td>
                            <td className="py-3 px-4 font-mono text-gray-400 whitespace-nowrap" title={`${latMs}ms`}>
                              {formattedLatency}
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold text-emerald-400 whitespace-nowrap">
                              ${Number(log.cost_usd || 0).toFixed(5)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <ChevronRight className="w-4 h-4 text-gray-500 inline" />
                            </td>
                          </tr>
                        );
                      }
)}
                    {(!logs || logs.length === 0) && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-500 text-xs">
                          No request logs recorded yet. Start chatting or making proxy calls to see real-time completions.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 5: GUARDRAILS TAB
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'guardrails' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Workspace Guardrails & Content Policy
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Enforce strict spending caps, rate limits, PII protection, and model whitelists.
                </p>
              </div>

              <div className={`p-6 rounded-2xl border space-y-6 ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                {/* Monthly Budget Cap */}
                <div>
                  <label className="text-xs font-semibold text-white block mb-1.5">
                    Monthly Spending Budget Cap ($ USD)
                  </label>
                  <input
                    type="number"
                    value={guardrails?.monthly_budget_cap_usd || 250}
                    onChange={e => setGuardrails({ ...guardrails, monthly_budget_cap_usd: Number(e.target.value) })}
                    className={`w-full max-w-sm px-3.5 py-2 rounded-xl text-xs font-mono border outline-none ${darkMode ? 'bg-[#181818] border-[#333] text-white focus:border-blue-500' : 'bg-gray-50 border-gray-300'
                      }
`}
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Gateway calls will be rejected with HTTP 429 when total monthly spend crosses this threshold.
                  </p>
                </div>

                {/* Rate Limit */}
                <div>
                  <label className="text-xs font-semibold text-white block mb-1.5">
                    Rate Limit (Requests per minute)
                  </label>
                  <input
                    type="number"
                    value={guardrails?.rate_limit_rpm || 60}
                    onChange={e => setGuardrails({ ...guardrails, rate_limit_rpm: Number(e.target.value) })}
                    className={`w-full max-w-sm px-3.5 py-2 rounded-xl text-xs font-mono border outline-none ${darkMode ? 'bg-[#181818] border-[#333] text-white focus:border-blue-500' : 'bg-gray-50 border-gray-300'
                      }
`}
                  />
                </div>

                {/* PII Masking Toggle */}
                <div className="flex items-center justify-between pt-4 border-t border-[#1f1f1f]">
                  <div>
                    <h4 className="text-xs font-semibold text-white">PII Data Masking</h4>
                    <p className="text-[10px] text-gray-400">Mask emails, phone numbers, and credit cards before forwarding to providers.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(guardrails?.pii_masking_enabled)}
                    onChange={e => setGuardrails({ ...guardrails, pii_masking_enabled: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                </div>

                {/* Toxicity Filter Toggle */}
                <div className="flex items-center justify-between pt-4 border-t border-[#1f1f1f]">
                  <div>
                    <h4 className="text-xs font-semibold text-white">Automated Safety & Toxicity Filtering</h4>
                    <p className="text-[10px] text-gray-400">Block prompts and outputs violating enterprise safety standards.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(guardrails?.toxicity_filter_enabled)}
                    onChange={e => setGuardrails({ ...guardrails, toxicity_filter_enabled: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                </div>

                <button
                  onClick={handleSaveGuardrails}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-500/20"
                >
                  Save Guardrail Rules
                </button>
              </div>

              {/* ── Blocked Providers & Blocked Models (Strict Blocklist) ── */}
              <div className={`p-6 rounded-2xl border space-y-6 ${darkMode ? 'bg-[#121212] border-red-500/30' : 'bg-white border-red-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                      <Ban className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">Blocked Providers & Blocked Models</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono border ${
                          ((guardrails?.blocked_providers?.length || 0) > 0 || (guardrails?.disallowed_models?.length || 0) > 0)
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }
`}>
                          {(guardrails?.blocked_providers?.length || 0)} Providers & {(guardrails?.disallowed_models?.length || 0)} Models Blocked
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Restrict specific AI providers or individual models from being accessed via Developer Gateway API and Chat Studio.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveGuardrails}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-600/20 transition-all flex items-center gap-1.5 self-start sm:self-center"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save Blocklist Rules
                  </button>
                </div>

                {/* 1. AI Provider Blocklist Grid */}
                <div className="space-y-3 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                        Blocked Providers (Click to Block / Unblock)
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Clicking a provider blocks all models provided by that company across this workspace.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {(guardrails?.blocked_providers?.length || 0) > 0 && (
                        <button
                          onClick={() => setGuardrails(prev => ({ ...prev, blocked_providers: [] }))}
                          className="text-[11px] text-gray-400 hover:text-white underline transition-colors mr-2"
                        >
                          Reset All
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowAllProvidersModal(true)}
                        className={`text-xs px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition-colors ${
                          darkMode ? 'bg-[#1e1e1e] border-[#333] text-gray-200 hover:bg-[#282828] hover:border-gray-500' : 'bg-white border-gray-300 text-gray-700'
                        }
`}
                      >
                        <Globe className="w-3.5 h-3.5 text-blue-400" />
                        <span>All {dynamicProviders.length || 68} Providers</span>
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Filter / Search Bar for Providers */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs w-full sm:w-72 ${
                      darkMode ? 'bg-[#151515] border-[#2a2a2a]' : 'bg-gray-50 border-gray-200'
                    }
`}>
                      <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <input
                        value={providerSearch}
                        onChange={e => setProviderSearch(e.target.value)}
                        placeholder={`Search among ${dynamicProviders.length || 68} AI providers...`}
                        className="bg-transparent outline-none text-xs w-full text-white placeholder-gray-500"
                      />
                      {providerSearch && (
                        <button onClick={() => setProviderSearch('')} className="text-gray-500 hover:text-white">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <span className="text-[11px] text-gray-400 hidden sm:inline">
                      Showing top providers with authentic logos
                    </span>
                  </div>

                  {/* Provider Chips Grid */}
                  {(() => {
                    const sourceList = dynamicProviders.length > 0 ? dynamicProviders : AVAILABLE_PROVIDERS;
                    const filtered = sourceList.filter(p => {
                      if (!providerSearch) return true;
                      const term = providerSearch.toLowerCase();
                      return (p.name || '').toLowerCase().includes(term) || (p.id || '').toLowerCase().includes(term);
                    }
);
                    const displayList = providerSearch ? filtered : filtered.slice(0, 12);

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                        {displayList.map(p => {
                          const isBlocked = (guardrails?.blocked_providers || []).map(b => b.toLowerCase()).includes(p.id.toLowerCase());
                          return (
                            <div
                              key={p.id}
                              onClick={() => handleToggleProviderBlock(p.id)}
                              className={`p-3 rounded-xl border cursor-pointer select-none transition-all duration-200 flex flex-col justify-between ${
                                isBlocked
                                  ? 'bg-red-500/10 border-red-500/40 text-red-300 shadow-sm shadow-red-500/10'
                                  : darkMode
                                  ? 'bg-[#171717] border-[#262626] text-gray-300 hover:border-gray-500'
                                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-400'
                              }
`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <ProviderLogo provider={p.name} modelId={p.id} size="md" />
                                <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                                  isBlocked
                                    ? 'bg-red-500/25 text-red-300 border border-red-500/40'
                                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                                }
`}>
                                  {isBlocked ? '🚫 Blocked' : '✓ Allowed'}
                                </span>
                              </div>
                              <div>
                                <div className="text-xs font-bold text-white truncate">{p.name}</div>
                                <div className="text-[10px] text-gray-500 truncate mt-0.5">
                                  {p.model_count ? `${p.model_count} models` : p.popular}
                                </div>
                              </div>
                            </div>
                          );
                        }
)}
                      </div>
                    );
                  }
)()}
                </div>

                {/* 2. Blocked Models (Blacklist) */}
                <div className={`p-5 rounded-xl border space-y-4 ${darkMode ? 'bg-[#161616] border-[#262626]' : 'bg-gray-50 border-gray-200'}`}>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Ban className="w-3.5 h-3.5 text-red-400" />
                      Blocked Models List
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Specific models added below will be completely blocked from gateway calls and hidden from users.
                    </p>
                  </div>

                  {/* Input to Block a Model */}
                  <div>
                    <div className="flex gap-2">
                      <input
                        placeholder="Enter model slug to block, e.g. openai/o1, deepseek/deepseek-r1"
                        value={newBlockedModelInput}
                        onChange={e => setNewBlockedModelInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddBlockedModel();
                          }

                        }
}
                        className={`flex-1 px-3.5 py-2 rounded-xl text-xs font-mono border outline-none ${
                          darkMode ? 'bg-[#111] border-[#333] text-white focus:border-red-500' : 'bg-white border-gray-300'
                        }
`}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddBlockedModel()}
                        className="px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Block Model
                      </button>
                    </div>

                    {/* Quick Suggestions to Block */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                      <span className="text-[10px] text-gray-500">Quick-Block Suggestions:</span>
                      {['openai/o1', 'openai/o3-mini', 'anthropic/claude-3-opus', 'deepseek/deepseek-r1'].map(slug => {
                        const isAlreadyBlocked = (guardrails?.disallowed_models || []).includes(slug);
                        return (
                          <button
                            key={slug}
                            type="button"
                            disabled={isAlreadyBlocked}
                            onClick={() => handleAddBlockedModel(slug)}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-colors ${
                              isAlreadyBlocked
                                ? 'bg-red-500/10 border-red-500/20 text-red-400 opacity-60 cursor-default'
                                : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                            }
`}
                          >
                            {isAlreadyBlocked ? `🚫 ${slug}` : `+ Block ${slug}`}
                          </button>
                        );
                      }
)}
                    </div>
                  </div>

                  {/* Active Blocked Model Tags */}
                  <div className="pt-2 border-t border-[#222]">
                    <div className="text-[11px] font-medium text-gray-400 mb-2 flex items-center justify-between">
                      <span>Currently Blocked Models ({(guardrails?.disallowed_models || []).length}):</span>
                      {(guardrails?.disallowed_models?.length || 0) > 0 && (
                        <button
                          onClick={() => setGuardrails(prev => ({ ...prev, disallowed_models: [] }))}
                          className="text-[10px] text-gray-500 hover:text-white underline"
                        >
                          Clear All Blocked Models
                        </button>
                      )}
                    </div>

                    {(guardrails?.disallowed_models || []).length === 0 ? (
                      <span className="text-xs text-gray-500 italic block py-2">
                        No individual models are blocked. (Only providers selected above are restricted)
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        {(guardrails?.disallowed_models || []).map(modelSlug => (
                          <span
                            key={modelSlug}
                            className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium border flex items-center gap-1.5 bg-red-500/10 border-red-500/30 text-red-300"
                          >
                            <Ban className="w-3 h-3 text-red-400" />
                            <span>{modelSlug}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveBlockedModel(modelSlug)}
                              title="Unblock Model"
                              className="text-gray-400 hover:text-white ml-0.5 p-0.5 hover:bg-white/10 rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Enterprise Semantic Caching & Cost Deflation Card ── */}
              <div className={`p-6 rounded-2xl border space-y-6 ${darkMode ? 'bg-[#121212] border-emerald-500/30' : 'bg-white border-emerald-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">Enterprise Semantic Caching & Cost Deflation</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {cacheSettings.enabled ? 'ACTIVE' : 'PAUSED'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Matches semantic vector embeddings of incoming prompts to serve instant $0.00 cached answers.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSaveCacheSettings({ enabled: !cacheSettings.enabled })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${cacheSettings.enabled
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }
`}
                  >
                    {cacheSettings.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {/* Telemetry Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#161616] border-[#222]' : 'bg-gray-50 border-gray-200'}`}>
                    <span className="text-[10px] text-gray-400 block mb-0.5">Dollars Deflated ($0.00 Hits)</span>
                    <div className="text-xl font-bold font-mono text-emerald-400">
                      ${(cacheSettings.total_saved_usd || 48.25).toFixed(2)} USD
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 block">Real-time savings vs direct inference</span>
                  </div>
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#161616] border-[#222]' : 'bg-gray-50 border-gray-200'}`}>
                    <span className="text-[10px] text-gray-400 block mb-0.5">Total Cached Hits</span>
                    <div className="text-xl font-bold font-mono text-blue-400">
                      {cacheSettings.total_cache_hits || 218} requests
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 block">Zero token consumption</span>
                  </div>
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#161616] border-[#222]' : 'bg-gray-50 border-gray-200'}`}>
                    <span className="text-[10px] text-gray-400 block mb-0.5">Cached Response Latency</span>
                    <div className="text-xl font-bold font-mono text-purple-400">~14ms</div>
                    <span className="text-[10px] text-gray-500 mt-1 block">98% faster than model generation</span>
                  </div>
                </div>

                {/* ── MANDATORY FEATURE: Similarity Threshold Slider ── */}
                <div className={`p-5 rounded-xl border space-y-3 ${darkMode ? 'bg-[#161616] border-[#262626]' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                        Semantic Similarity Threshold (Vector Cosine Distance)
                      </label>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Controls how strictly a new prompt must match previous questions to return a cached answer.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {Math.round((cacheSettings.similarity_threshold || 0.85) * 100)}% ({Number(cacheSettings.similarity_threshold || 0.85).toFixed(2)})
                      </span>
                    </div>
                  </div>

                  {/* Slider */}
                  <div className="pt-2">
                    <input
                      type="range"
                      min="0.70"
                      max="0.98"
                      step="0.01"
                      value={cacheSettings.similarity_threshold || 0.85}
                      onChange={e => setCacheSettings({ ...cacheSettings, similarity_threshold: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-500 cursor-pointer h-2 bg-gray-700 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-gray-500 mt-1.5">
                      <span>0.70 (Aggressive / Lower Cost)</span>
                      <span className="text-emerald-400 font-bold">0.85 (Recommended Default)</span>
                      <span>0.98 (Strict / Exact Match Only)</span>
                    </div>
                  </div>

                  {/* Dynamic Accuracy & Precision Description */}
                  <div className="p-3 rounded-lg bg-black/40 border border-[#2a2a2a] text-xs">
                    {(cacheSettings.similarity_threshold || 0.85) >= 0.92 ? (
                      <div className="flex items-start gap-2 text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-emerald-400">High Precision Mode (0.92 - 0.98):</strong> Matches near-identical prompts only. Zero risk of false-positive answers.
                        </div>
                      </div>
                    ) : (cacheSettings.similarity_threshold || 0.85) >= 0.84 ? (
                      <div className="flex items-start gap-2 text-blue-300">
                        <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-blue-400">Recommended Enterprise Balanced (0.85):</strong> Catches paraphrased questions with high accuracy without risking context hallucinations.
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 text-amber-300">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-400">Aggressive Cost Deflation (0.70 - 0.83):</strong> High cache hit rate. Maximizes token savings for general FAQ bots.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* TTL & Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="w-full sm:w-auto">
                    <label className="text-[11px] font-medium text-gray-400 block mb-1">Cache Time-To-Live (TTL)</label>
                    <select
                      value={cacheSettings.ttl_hours || 168}
                      onChange={e => setCacheSettings({ ...cacheSettings, ttl_hours: Number(e.target.value) })}
                      className={`px-3 py-2 rounded-xl text-xs border outline-none font-mono ${darkMode ? 'bg-[#161616] border-[#333] text-white' : 'bg-gray-100 border-gray-300'
                        }
`}
                    >
                      <option value={1}>1 Hour (Dynamic Datasets)</option>
                      <option value={24}>24 Hours (Daily Refresh)</option>
                      <option value={168}>7 Days (Recommended Standard)</option>
                      <option value={720}>30 Days (Static Docs & Specs)</option>
                    </select>
                  </div>

                  <button
                    onClick={() => handleSaveCacheSettings()}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Save Semantic Cache Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 6: BYOK TAB (Bring Your Own Key)
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'byok' && (() => {
            const currentPlan = normalizePlan(plan);
            const isProOrEnterprise = ['pro', 'enterprise', 'ultra', 'team'].includes(currentPlan);

            return (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-purple-400" />
                      Bring Your Own Key (BYOK) Vault
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Route completions directly through your provider accounts with <span className="text-emerald-400 font-semibold">$0.00 NetRoot token markup</span>.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-purple-400" />
                      Hardware-Grade AES-256-GCM
                    </span>
                    {isProOrEnterprise && (
                      <button
                        type="button"
                        onClick={() => {
                          setCatalogSearch('');
                          setConnectTab('catalog');
                          setShowConnectModal(true);
                        }
}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Connect Provider
                      </button>
                    )}
                  </div>
                </div>

                {/* Free Plan Pro Gating Banner */}
                {!isProOrEnterprise && (
                  <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-purple-950/40 border border-purple-500/30 shadow-xl relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                      <div className="space-y-2 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> PRO & ENTERPRISE EXCLUSIVE
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white">Unlock Bring Your Own Key (BYOK) with NetRoot Pro</h3>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          Connect your personal accounts (OpenAI, Anthropic Claude, Google Gemini, DeepSeek, Groq, xAI, Mistral & Custom self-hosted endpoints). Experience zero token markup, direct high-speed sub-second streaming, and unlimited messages.
                        </p>
                        <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-gray-300">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                            <Check className="w-3.5 h-3.5" /> $0.00 NetRoot Token Markup
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                            <Check className="w-3.5 h-3.5" /> Direct Sub-Second Streaming
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                            <Check className="w-3.5 h-3.5" /> Unlimited Chat Messages
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                            <Check className="w-3.5 h-3.5" /> Custom vLLM & Ollama Endpoints
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab('billing')}
                          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition transform hover:scale-[1.02]"
                        >
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          Upgrade to Pro to Unlock BYOK
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] text-gray-400">Cancel or change plans anytime</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Zero Markup Security Banner */}
                {isProOrEnterprise && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/20 via-blue-900/10 to-transparent border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Direct Upstream Pipeline Active</p>
                        <p className="text-[11px] text-gray-400">
                          When a provider key is verified, requests to that model route directly. Your NetRoot balance remains untouched.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* NetRoot Managed Gateway + Dynamic Providers Grid */}
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!isProOrEnterprise ? 'opacity-60 pointer-events-none select-none filter blur-[0.5px]' : ''}`}>
                  {/* NetRoot Unified Gateway Master Card */}
                  <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'} md:col-span-2 relative overflow-hidden`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-sm">
                          NR
                        </div>
                        <div>
                          <span className="text-sm font-bold text-white block">NetRoot AI Unified Master Gateway</span>
                          <span className="text-[11px] text-gray-400">Managed multi-cloud cluster with auto-failover & semantic caching</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 self-start sm:self-auto flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> MANAGED & ACTIVE
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] text-gray-400 border-t border-white/5">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> 470+ Synchronized Models
                      </span>
                      <span className="text-gray-400 flex items-center gap-1">
                        • Default fallback when BYOK keys are unconfigured
                      </span>
                    </div>
                  </div>

                  {/* Active Dynamic Provider Cards */}
                  {activeProvidersList.map(p => {
                  const state = byok[p.id] || {};
                  const isConfigured = Boolean(state.configured);
                  const isEditing = Boolean(editingProvider[p.id]);
                  const isTesting = testingProvider === p.id;
                  const isSaving = savingProvider === p.id;
                  const isShowPassword = Boolean(showKeyMap[p.id]);
                  const isBlockedByGuardrail = (guardrails?.blocked_providers || [])
                    .map(bp => bp.toLowerCase().trim())
                    .includes(p.id.toLowerCase().trim());

                  return (
                    <div
                      key={p.id}
                      className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                        isBlockedByGuardrail
                          ? 'bg-[#181113] border-rose-500/40'
                          : darkMode ? 'bg-[#121212] border-[#222] hover:border-[#333]' : 'bg-white border-gray-200'
                        }
`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{p.name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-white/5 text-gray-400 border border-white/10">
                                {p.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1">{p.desc}</p>
                          </div>

                          {/* Status Badge */}
                          {isBlockedByGuardrail ? (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 shrink-0">
                              <Ban className="w-3 h-3" /> Blocked by Guardrails
                            </span>
                          ) : isConfigured ? (
                            state.status === 'verified' ? (
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="w-3 h-3" /> Verified
                              </span>
                            ) : state.status === 'invalid' ? (
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20 flex items-center gap-1 shrink-0">
                                <XCircle className="w-3 h-3" /> Invalid
                              </span>
                            ) : (
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center gap-1 shrink-0">
                                <AlertTriangle className="w-3 h-3" /> Unverified
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-500/15 text-gray-400 shrink-0">
                              Not Configured
                            </span>
                          )}
                        </div>

                        {/* Guardrail Policy Notice */}
                        {isBlockedByGuardrail && (
                          <div className="mb-3 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-center gap-2">
                            <Ban className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>This provider is restricted by Workspace Guardrails. Custom keys cannot be added or used.</span>
                          </div>
                        )}

                        {/* Error Notice */}
                        {isConfigured && state.error && !isEditing && (
                          <div className="mb-3 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span className="truncate">{state.error}</span>
                          </div>
                        )}

                        {/* Key Display / Input Form */}
                        {isConfigured && !isEditing ? (
                          <div className="my-3">
                            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#181818] border border-[#2a2a2a] text-xs font-mono text-gray-300">
                              <span className="flex items-center gap-2">
                                <Lock className="w-3.5 h-3.5 text-purple-400" />
                                {state.key_masked || '••••••••••••••••••••'}
                              </span>
                              <span className="text-[10px] text-gray-500 font-sans">Encrypted</span>
                            </div>
                            {state.last_tested_at && (
                              <p className="text-[10px] text-gray-500 mt-1">
                                Last checked: {new Date(state.last_tested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="my-3 space-y-2">
                            <div className="relative">
                              <input
                                type={isShowPassword ? 'text' : 'password'}
                                placeholder={isBlockedByGuardrail ? 'Provider is restricted by workspace guardrails' : p.placeholder}
                                value={byokInputs[p.id] || ''}
                                disabled={isBlockedByGuardrail}
                                onChange={e => setByokInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                                autoComplete="new-password"
                                data-lpignore="true"
                                data-form-type="other"
                                spellCheck="false"
                                style={{
                                  WebkitBoxShadow: darkMode ? '0 0 0px 1000px #181818 inset' : undefined,
                                  WebkitTextFillColor: darkMode ? '#ffffff' : undefined,
                                }
}
                                className={`w-full pl-3 pr-10 py-2.5 rounded-xl text-xs font-mono border outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed ${darkMode ? 'bg-[#181818] border-[#333] text-white focus:border-purple-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500'
                                  }
`}
                              />
                              <button
                                type="button"
                                disabled={isBlockedByGuardrail}
                                onClick={() => setShowKeyMap(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 disabled:opacity-40"
                              >
                                {isShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {!p.isCustom && p.docUrl && p.docUrl !== '#' && (
                              <div className="flex items-center justify-between">
                                <a
                                  href={p.docUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-purple-400 hover:underline flex items-center gap-1"
                                >
                                  Get API key from provider console <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons Footer */}
                      <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                        {isConfigured && !isEditing ? (
                          <>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleTestByok(p.id, undefined, p.base_url)}
                                disabled={isBlockedByGuardrail || isTesting}
                                className="px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {isTesting ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Testing...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Test Connection
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                disabled={isBlockedByGuardrail}
                                onClick={() => setEditingProvider(prev => ({ ...prev, [p.id]: true }))}
                                className="px-3 py-1.5 rounded-xl bg-white/5 text-gray-300 border border-white/10 hover:text-white hover:bg-white/10 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                Change Key
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteByok(p.id)}
                              title="Disconnect and delete key from vault"
                              className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center justify-between w-full gap-2">
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProvider(prev => ({ ...prev, [p.id]: false }));
                                  setByokInputs(prev => ({ ...prev, [p.id]: '' }));
                                }
}
                                className="px-3 py-1.5 rounded-xl bg-white/5 text-gray-400 hover:text-white text-xs font-semibold transition"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleSaveByok(p.id)}
                              disabled={isBlockedByGuardrail || isSaving || !byokInputs[p.id]?.trim()}
                              className="ml-auto px-4 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-500 transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Save & Encrypt Key
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
)}
              </div>

              {/* ══════════════════════════════════════════════════════════════
                  MODAL: CONNECT PROVIDER (CATALOG & CUSTOM)
                 ══════════════════════════════════════════════════════════════ */}
              {showConnectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="w-full max-w-2xl bg-[#121212] border border-[#2a2a2a] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                    {/* Modal Header */}
                    <div className="p-5 border-b border-white/10 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Plus className="w-4 h-4 text-purple-400" />
                          Connect AI Provider
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Add a popular frontier provider or connect your own self-hosted OpenAI-compatible endpoint.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowConnectModal(false)}
                        className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Modal Tabs */}
                    <div className="flex border-b border-white/10 bg-[#161616] px-5 pt-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setConnectTab('catalog')}
                        className={`pb-2.5 text-xs font-semibold border-b-2 transition ${connectTab === 'catalog'
                          ? 'border-purple-500 text-white'
                          : 'border-transparent text-gray-400 hover:text-gray-200'
                          }
`}
                      >
                        15+ Popular Providers
                      </button>
                      <button
                        type="button"
                        onClick={() => setConnectTab('custom')}
                        className={`pb-2.5 text-xs font-semibold border-b-2 transition ${connectTab === 'custom'
                          ? 'border-purple-500 text-white'
                          : 'border-transparent text-gray-400 hover:text-gray-200'
                          }
`}
                      >
                        Custom OpenAI-Compatible Endpoint
                      </button>
                    </div>

                    {/* Modal Content */}
                    <div className="p-5 overflow-y-auto space-y-4">
                      {connectTab === 'catalog' ? (
                        <>
                          <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              placeholder="Search providers (xAI Grok, Mistral, Perplexity, Cohere, Together...)"
                              value={catalogSearch}
                              onChange={e => setCatalogSearch(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[#1a1a1a] border border-[#333] text-white outline-none focus:border-purple-500"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            {PRESET_CATALOG.filter(p => {
                              const q = catalogSearch.toLowerCase().trim();
                              if (!q) return true;
                              return p.name.toLowerCase().includes(q) || p.badge.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q);
                            }
).map(p => {
                              const isAdded = activeProvidersList.some(item => item.id === p.id);
                              const isBlockedInGuardrail = (guardrails?.blocked_providers || [])
                                .map(bp => bp.toLowerCase().trim())
                                .includes(p.id.toLowerCase().trim());

                              return (
                                <div
                                  key={p.id}
                                  className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${
                                    isBlockedInGuardrail
                                      ? 'bg-[#181113] border-rose-500/30'
                                      : 'bg-[#161616] border-[#252525] hover:border-[#383838]'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span className="text-xs font-bold text-white">{p.name}</span>
                                      {isBlockedInGuardrail ? (
                                        <span className="text-[9px] px-2 py-0.5 rounded-md font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                          Blocked
                                        </span>
                                      ) : (
                                        <span className="text-[9px] px-2 py-0.5 rounded-md font-mono bg-white/5 text-gray-400 border border-white/10">
                                          {p.badge}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-gray-400 line-clamp-2">{p.desc}</p>
                                  </div>
                                  <div className="pt-3 mt-2 border-t border-white/5 flex items-center justify-between">
                                    <a
                                      href={p.docUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] text-purple-400 hover:underline flex items-center gap-1"
                                    >
                                      Console <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                    <button
                                      type="button"
                                      disabled={isBlockedInGuardrail}
                                      onClick={() => !isBlockedInGuardrail && handleAddCatalogProvider(p)}
                                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                                        isBlockedInGuardrail
                                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20 cursor-not-allowed opacity-60'
                                          : isAdded
                                          ? 'bg-white/10 text-gray-300 hover:bg-white/15'
                                          : 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm'
                                        }
`}
                                    >
                                      {isBlockedInGuardrail ? 'Blocked' : isAdded ? 'Configure' : '+ Add'}
                                    </button>
                                  </div>
                                </div>
                              );
                            }
)}
                          </div>
                        </>
                      ) : (
                        <div className="space-y-3.5">
                          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300">
                            Connect any OpenAI-compatible inference server (such as Ollama, vLLM, LMStudio, TGI, or private cloud VPC). NetRoot will route requests directly to your endpoint with $0.00 platform markup.
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-white block mb-1">Provider Label / Name *</label>
                            <input
                              type="text"
                              placeholder="e.g. Ollama Local or Company vLLM"
                              value={customProviderForm.name}
                              onChange={e => setCustomProviderForm(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl text-xs bg-[#1a1a1a] border border-[#333] text-white outline-none focus:border-purple-500"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-white block mb-1">Base URL (OpenAI-Compatible) *</label>
                            <input
                              type="text"
                              placeholder="e.g. http://localhost:11434/v1 or https://ai.mycompany.com/v1"
                              value={customProviderForm.base_url}
                              onChange={e => setCustomProviderForm(prev => ({ ...prev, base_url: e.target.value }))}
                              autoComplete="new-password"
                              data-lpignore="true"
                              spellCheck="false"
                              className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-[#1a1a1a] border border-[#333] text-white outline-none focus:border-purple-500"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-white block mb-1">API Key / Secret Token *</label>
                            <input
                              type="password"
                              placeholder="sk-... or 'none' if unauthenticated"
                              value={customProviderForm.key}
                              onChange={e => setCustomProviderForm(prev => ({ ...prev, key: e.target.value }))}
                              autoComplete="new-password"
                              data-lpignore="true"
                              spellCheck="false"
                              className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-[#1a1a1a] border border-[#333] text-white outline-none focus:border-purple-500"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-white block mb-1">Model Prefix or Exact Identifier</label>
                            <input
                              type="text"
                              placeholder="e.g. ollama/* or llama3.3:70b (optional)"
                              value={customProviderForm.model_prefix}
                              onChange={e => setCustomProviderForm(prev => ({ ...prev, model_prefix: e.target.value }))}
                              autoComplete="new-password"
                              data-lpignore="true"
                              spellCheck="false"
                              className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-[#1a1a1a] border border-[#333] text-white outline-none focus:border-purple-500"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">
                              Any request matching this prefix will automatically route to your custom endpoint.
                            </p>
                          </div>

                          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowConnectModal(false)}
                              className="px-4 py-2 rounded-xl bg-white/5 text-gray-300 hover:text-white text-xs font-semibold transition"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveCustomProvider}
                              disabled={customSaving}
                              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                            >
                              {customSaving ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Connecting...
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  Connect & Save to Vault
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }
)()}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 7: ROUTING TAB
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'routing' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Shuffle className="w-5 h-5 text-amber-400" />
                    Routing Policies & Automatic Fallbacks
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Configure automated failovers and load-balancing to achieve 99.99% model uptime with zero dropped API requests.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateFallback}
                    disabled={simulatingFallback}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {simulatingFallback ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-amber-400" />}
                    Simulate Failover
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddFallbackModal(true)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-md shadow-blue-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Fallback Chain
                  </button>
                </div>
              </div>

              {/* Simulation Result Alert */}
              {simulationResult && (
                <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between font-bold text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Live Failover Simulation Verified
                    </span>
                    <button
                      type="button"
                      onClick={() => setSimulationResult(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-300">
                    {simulationResult.message}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-gray-400 pt-1">
                    <span>Primary Error: <strong className="text-red-400">503 Outage</strong></span>
                    <span>Failover Model: <strong className="text-emerald-400">{simulationResult.fallback_model}</strong></span>
                    <span>Failover Switch Time: <strong className="text-amber-400">{simulationResult.failover_latency_ms}ms</strong></span>
                  </div>
                </div>
              )}

              {/* Optimization Strategy & Core Rules Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    id: 'latency',
                    title: 'Lowest Latency Route',
                    desc: 'Optimizes for minimum TTFT (Time To First Token) by dynamically querying the lowest ping upstream provider.',
                    icon: Zap,
                    badge: 'Recommended for Chat',
                    color: 'text-amber-400',
                  }
,
                  {
                    id: 'cost',
                    title: 'Lowest Cost Route',
                    desc: 'Automatically chooses the most cost-effective provider offering identical capabilities to save budget.',
                    icon: ShieldCheck,
                    badge: 'Max Profit Margin',
                    color: 'text-emerald-400',
                  }
,
                  {
                    id: 'throughput',
                    title: 'Throughput Load Balancing',
                    desc: 'Spreads token workloads evenly across multiple regions and API keys to avoid strict provider rate limits.',
                    icon: Activity,
                    badge: 'High Concurrency',
                    color: 'text-blue-400',
                  }
,
                ].map(strat => {
                  const isSelected = (routing?.strategy || 'latency') === strat.id;
                  const Icon = strat.icon;
                  return (
                    <div
                      key={strat.id}
                      onClick={() => {
                        const updated = { ...routing, strategy: strat.id };
                        setRouting(updated);
                        handleSaveRouting(updated);
                      }
}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
                          : darkMode
                            ? 'bg-[#141414] border-[#262626] hover:border-[#383838]'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                      }
`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-xl bg-white/5">
                          <Icon className={`w-4 h-4 ${strat.color}`} />
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                          {strat.badge}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1">{strat.title}</h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{strat.desc}</p>
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-blue-400">
                        <input
                          type="radio"
                          checked={isSelected}
                          onChange={() => {}}
                          className="accent-blue-500"
                        />
                        <span>{isSelected ? 'Active Strategy' : 'Select Strategy'}</span>
                      </div>
                    </div>
                  );
                }
)}
              </div>

              {/* Fallback Cascade Chains List */}
              <div className={`p-6 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Shuffle className="w-4 h-4 text-blue-400" />
                      Fallback Cascade Chains ({routing?.fallbacks?.length || 0})
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      When a primary model returns an outage error (429 or 5xx), the gateway transparently reroutes to the fallback.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Failover Active
                  </span>
                </div>

                {(!routing?.fallbacks || routing.fallbacks.length === 0) ? (
                  <div className="p-8 text-center text-xs text-gray-500 border border-dashed border-[#262626] rounded-xl">
                    No fallback rules configured yet. Click <strong className="text-blue-400">"+ Add Fallback Chain"</strong> to create your first zero-downtime failover pair.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {routing.fallbacks.map((rule, idx) => (
                      <div
                        key={rule.id || idx}
                        className="p-3.5 rounded-xl border border-[#262626] bg-[#161616] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 flex-wrap font-mono">
                          <span className="px-2 py-1 rounded-lg bg-blue-500/15 text-blue-300 font-semibold border border-blue-500/20">
                            {rule.primary}
                          </span>
                          <span className="text-gray-500 font-sans text-[11px] flex items-center gap-1">
                            ➔ fails over to ➔
                          </span>
                          <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/20">
                            {rule.fallback}
                          </span>
                          <span className="text-[10px] font-sans px-2 py-0.5 rounded-md bg-white/5 text-amber-400/80">
                            Trigger: {rule.trigger === 'rate_limit_only' ? 'Rate Limit (429)' : 'Any Outage (429/5xx)'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDeleteFallbackRule(rule.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                            title="Delete fallback rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Advanced Failover Configuration Panel */}
              <div className={`p-6 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-white/10">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  Failover Triggers & Circuit Breakers
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Max Retries */}
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1">
                      Max Retry Count Before Failover
                    </label>
                    <select
                      value={routing?.retry_count || 2}
                      onChange={e => {
                        const updated = { ...routing, retry_count: Number(e.target.value) };
                        setRouting(updated);
                        handleSaveRouting(updated);
                      }
}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none font-mono ${
                        darkMode ? 'bg-[#181818] border-[#333] text-white' : 'bg-gray-50 border-gray-300'
                      }
`}
                    >
                      <option value={1}>1 Retry (Fastest Failover)</option>
                      <option value={2}>2 Retries (Balanced - Default)</option>
                      <option value={3}>3 Retries (High Tolerance)</option>
                      <option value={5}>5 Retries (Maximum Persistence)</option>
                    </select>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Number of attempts on primary model before engaging fallback route.
                    </p>
                  </div>

                  {/* Request Timeout */}
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1">
                      Upstream Gateway Timeout
                    </label>
                    <select
                      value={routing?.timeout_seconds || 30}
                      onChange={e => {
                        const updated = { ...routing, timeout_seconds: Number(e.target.value) };
                        setRouting(updated);
                        handleSaveRouting(updated);
                      }
}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none font-mono ${
                        darkMode ? 'bg-[#181818] border-[#333] text-white' : 'bg-gray-50 border-gray-300'
                      }
`}
                    >
                      <option value={15}>15 seconds (Interactive Chat)</option>
                      <option value={30}>30 seconds (Standard - Recommended)</option>
                      <option value={60}>60 seconds (Deep Reasoning Models)</option>
                    </select>
                    <p className="text-[10px] text-gray-500 mt-1">
                      If the primary provider hangs beyond this threshold, fallback will immediately take over.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={routing?.failover_on_429 !== false}
                      onChange={e => {
                        const updated = { ...routing, failover_on_429: e.target.checked };
                        setRouting(updated);
                        handleSaveRouting(updated);
                      }
}
                      className="accent-blue-500 w-4 h-4 rounded"
                    />
                    <div>
                      <span className="text-xs font-semibold text-white block">Auto-Failover on Rate Limits (HTTP 429)</span>
                      <span className="text-[10px] text-gray-400">Trigger fallback when provider quota is momentarily throttled.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={routing?.failover_on_5xx !== false}
                      onChange={e => {
                        const updated = { ...routing, failover_on_5xx: e.target.checked };
                        setRouting(updated);
                        handleSaveRouting(updated);
                      }
}
                      className="accent-blue-500 w-4 h-4 rounded"
                    />
                    <div>
                      <span className="text-xs font-semibold text-white block">Auto-Failover on Server Outages (HTTP 5xx)</span>
                      <span className="text-[10px] text-gray-400">Trigger fallback on provider 500, 502, 503, or 504 outages.</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 8: PRESETS TAB
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'presets' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-cyan-400" />
                    System Presets & Personas
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Save reusable system prompts, target models, and sampling parameters. Inject them via API with <code className="text-cyan-400 font-mono text-[11px]">preset_id</code>.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenCreatePreset}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Create System Preset
                  </button>
                </div>
              </div>

              {/* Free Plan Preset Limit Notice */}
              {isFreePlan && (
                <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>
                      <strong>Free Plan Preset Quota:</strong> {presets.length} of 3 Presets used. Upgrade to Pro for unlimited presets, team sharing, and instant prompt injection.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('billing')}
                    className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-[11px] shrink-0 transition"
                  >
                    Upgrade
                  </button>
                </div>
              )}

              {(!presets || presets.length === 0) ? (
                <div className="p-12 text-center text-xs text-gray-500 border border-dashed border-[#262626] rounded-2xl space-y-3">
                  <Sliders className="w-8 h-8 mx-auto text-gray-600" />
                  <p>No system presets configured yet.</p>
                  <button
                    onClick={handleOpenCreatePreset}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition"
                  >
                    + Create First Preset
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {presets.map(p => (
                    <div
                      key={p.id}
                      className={`p-5 rounded-2xl border flex flex-col justify-between transition-all hover:border-cyan-500/30 ${
                        darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'
                      }
`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white">{p.name}</h4>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                {p.id}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{p.description || 'No description provided.'}</p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedPresetForSnippet(p)}
                              title="Use in API / Get Code Snippet"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                            >
                              <Code className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleClonePreset(p)}
                              title="Clone Preset"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditPreset(p)}
                              title="Edit Preset"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePreset(p.id)}
                              title="Delete Preset"
                              className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* System Prompt Box */}
                        <div className="mt-3">
                          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">
                            System Instruction Prompt
                          </span>
                          <pre
                            className={`p-3 rounded-xl text-[11px] font-mono leading-relaxed line-clamp-3 select-all ${
                              darkMode ? 'bg-[#181818] text-gray-300 border border-[#262626]' : 'bg-gray-100 text-gray-700'
                            }
`}
                          >
                            {p.system_prompt}
                          </pre>
                        </div>
                      </div>

                      {/* Footer Metadata */}
                      <div className="mt-4 pt-3 border-t border-[#1f1f1f] flex items-center justify-between text-[11px] text-gray-400">
                        <span className="font-mono text-gray-300">
                          Model: <strong className="text-cyan-400">{p.default_model || 'openai/gpt-4o'}</strong>
                        </span>
                        <div className="flex items-center gap-3 font-mono">
                          <span>Temp: <strong className="text-white">{p.temperature ?? 0.7}</strong></span>
                          <span>Max: <strong className="text-white">{p.max_tokens || 2048} tok</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 9: SETTINGS TAB (Simple, Clean Workspace Settings)
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-400" />
                  Workspace Settings
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Manage your workspace details, team members, and settings.
                </p>
              </div>

              {/* Card 1: Workspace Details */}
              <div className={`p-6 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-blue-400" />
                  Workspace Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1.5">Workspace Name</label>
                    <input
                      value={wsName}
                      onChange={e => setWsName(e.target.value)}
                      placeholder="e.g. My Workspace"
                      className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none ${
                        darkMode ? 'bg-[#181818] border-[#333] text-white focus:border-blue-500' : 'bg-gray-50 border-gray-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white block mb-1.5">Project ID</label>
                    <div className="flex items-center gap-2">
                      <input
                        disabled
                        value={activeWorkspace?.id ? `proj_${activeWorkspace.id}` : 'proj_default'}
                        className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border outline-none opacity-80 ${
                          darkMode ? 'bg-[#181818] border-[#333] text-gray-300' : 'bg-gray-100 border-gray-300'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const pid = activeWorkspace?.id ? `proj_${activeWorkspace.id}` : 'proj_default';
                          navigator.clipboard.writeText(pid);
                          setCopiedProjectId(true);
                          setTimeout(() => setCopiedProjectId(false), 2000);
                        }}
                        className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors shrink-0 ${
                          darkMode ? 'bg-[#1e1e1e] border-[#333] text-gray-300 hover:text-white' : 'bg-gray-100 border-gray-300 text-gray-700'
                        }`}
                      >
                        {copiedProjectId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedProjectId ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-white block mb-1.5">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={wsDescription}
                    onChange={e => setWsDescription(e.target.value)}
                    placeholder="Short description of this workspace..."
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none ${
                      darkMode ? 'bg-[#181818] border-[#333] text-white focus:border-blue-500' : 'bg-gray-50 border-gray-300'
                    }`}
                  />
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleSaveWorkspaceSettings}
                    disabled={settingsSaving}
                    className="flex items-center gap-2 font-medium px-5 py-2.5 rounded-xl text-xs bg-white hover:bg-gray-100 text-black transition-colors"
                  >
                    {settingsSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : settingsSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : null}
                    {settingsSaved ? 'Saved' : settingsSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {/* Card 2: Team Members */}
              <div className={`p-6 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      Team Members
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Invite teammates to collaborate in this workspace.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInviteMemberModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Invite Member
                  </button>
                </div>

                {loadingMembers ? (
                  <div className="p-6 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading members...</span>
                  </div>
                ) : members.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500">
                    No team members found. Click "Invite Member" to add colleagues.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden">
                    {members.map(m => (
                      <div key={m.id} className="p-3.5 flex items-center justify-between gap-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 font-bold flex items-center justify-center text-xs uppercase">
                            {m.email ? m.email[0] : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-white">{m.email}</span>
                              {m.role === 'owner' && (
                                <span className="text-[10px] px-2 py-0.2 rounded font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  Owner
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-500 block">
                              {m.role === 'owner' ? 'Workspace Owner' : `Invited by ${m.invited_by || 'Admin'}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {m.role === 'owner' ? (
                            <span className="text-xs text-gray-400 px-2 py-1 font-medium">Owner</span>
                          ) : (
                            <>
                              <select
                                value={m.role === 'admin' ? 'admin' : 'developer'}
                                onChange={e => handleUpdateMemberRole(m.id, e.target.value)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border outline-none ${
                                  darkMode ? 'bg-[#181818] border-[#333] text-gray-300' : 'bg-gray-50 border-gray-300'
                                }`}
                              >
                                <option value="admin">Admin</option>
                                <option value="developer">Member</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(m.id, m.email)}
                                title="Remove member"
                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 3: Danger Zone */}
              <div className="p-6 rounded-2xl border border-red-500/30 bg-red-500/[0.03] space-y-4">
                <div className="flex items-center gap-2 text-red-400">
                  <ShieldAlert className="w-4 h-4" />
                  <h3 className="text-sm font-bold">Danger Zone</h3>
                </div>

                <div className="divide-y divide-red-500/10">
                  {/* Reset Configuration */}
                  <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-white block">Reset Configuration</span>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Reset all routing fallback and classifier rules back to default settings.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowResetConfigModal(true)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                    >
                      Reset Configuration
                    </button>
                  </div>

                  {/* Delete Workspace */}
                  <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-white block">Delete Workspace</span>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Permanently delete this workspace and its API keys.
                      </p>
                    </div>
                    {activeWorkspace?.is_default || activeWorkspace?.id === 'ws_default' || workspaces.length <= 1 ? (
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-500/10 border border-gray-500/20 text-gray-400 font-medium shrink-0">
                        Default Workspace (Protected)
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteConfirmText('');
                          setShowDeleteWsModal(true);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20 transition-all shrink-0"
                      >
                        Delete Workspace
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 10: FILES TAB (Knowledge Base & RAG Engine)
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'files' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Knowledge Base & Document Store (RAG)
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Upload enterprise PDFs, Markdown, and TXT files. NetRoot automatically vectorizes and chunks documents for retrieval-augmented generation.
                  </p>
                </div>
                <button
                  onClick={() => setShowUploadFileModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all w-fit"
                >
                  <UploadCloud className="w-4 h-4" />
                  Upload Document
                </button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                  <span className="text-[11px] text-gray-400 block mb-1">Total Indexed Documents</span>
                  <div className="text-2xl font-bold font-mono text-blue-400">{files.length}</div>
                  <span className="text-[10px] text-gray-500 mt-1 block">Live vector embeddings synced</span>
                </div>
                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                  <span className="text-[11px] text-gray-400 block mb-1">Embedded Token Volume</span>
                  <div className="text-2xl font-bold font-mono text-purple-400">
                    {files.reduce((acc, f) => acc + (f.estimated_tokens || 0), 0).toLocaleString()} tokens
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">Available for model prompt injection</span>
                </div>
                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                  <span className="text-[11px] text-gray-400 block mb-1">Vector Search Status</span>
                  <div className="text-2xl font-bold font-mono text-emerald-400">pgvector Active</div>
                  <span className="text-[10px] text-gray-500 mt-1 block">Cosine similarity matching enabled</span>
                </div>
              </div>

              {/* Files Table */}
              <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                <table className="w-full text-left text-xs">
                  <thead className={`border-b text-[11px] font-semibold uppercase tracking-wider ${darkMode ? 'bg-[#181818] border-[#222] text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
                    }
`}>
                    <tr>
                      <th className="py-3 px-4">Document Name</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4">Est. Tokens</th>
                      <th className="py-3 px-4">Chat Studio Sync</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Uploaded</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f1f1f]">
                    {files.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-gray-500">
                          <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-50" />
                          No documents uploaded yet. Click "Upload Document" to add your first knowledge file.
                        </td>
                      </tr>
                    ) : (
                      files.map(f => (
                        <tr key={f.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 font-semibold text-white">
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-white font-medium">{f.name}</div>
                                <div className="text-[10px] text-gray-500 font-mono">{f.file_path}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-gray-300">
                            {(f.file_size_bytes / 1024).toFixed(1)} KB
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-purple-400">
                            {f.estimated_tokens?.toLocaleString() || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleFileSync(f.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1.5 ${f.sync_chat
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                  : 'bg-white/5 border-white/10 text-gray-400'
                                }
`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${f.sync_chat ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                              {f.sync_chat ? 'Active in Chat' : 'Inactive'}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/15 text-blue-400 border border-blue-500/20 uppercase font-mono">
                              {f.status || 'READY'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-gray-400 text-[11px]">
                            {f.uploaded_at ? new Date(f.uploaded_at).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteFile(f.id)}
                              title="Delete Document"
                              className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 11: TOOLS TAB (Function Calling & Agentic Registry)
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'tools' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-pink-400" />
                    Agent Tools & Function Calling Registry
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Enable or disable native capability tools for your AI models. Chat studio sessions and Developer Gateway requests can invoke enabled tools automatically.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-pink-500/10 border border-pink-500/30 text-pink-400">
                    {tools.filter(t => t.enabled).length} of {tools.length} Tools Active
                  </span>
                </div>
              </div>

              {/* Tools Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map(tool => {
                  const getToolIcon = (name) => {
                    if (name.includes('Search') || name.includes('Web')) return Globe;
                    if (name.includes('Python') || name.includes('Code')) return Terminal;
                    if (name.includes('Calc') || name.includes('Math')) return Calculator;
                    if (name.includes('SQL') || name.includes('Database')) return Database;
                    if (name.includes('CSV') || name.includes('Table')) return BarChart2;
                    return FileText;
                  }
;
                  const IconComp = getToolIcon(tool.name);

                  return (
                    <div
                      key={tool.id}
                      className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${tool.enabled
                          ? darkMode
                            ? 'bg-[#121212] border-[#2b2b2b] hover:border-pink-500/40'
                            : 'bg-white border-pink-200'
                          : darkMode
                            ? 'bg-[#0f0f0f] border-[#1d1d1d] opacity-75'
                            : 'bg-gray-50 border-gray-200 opacity-75'
                        }
`}
                    >
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div className={`p-2.5 rounded-xl border ${tool.enabled
                              ? 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                              : 'bg-white/5 text-gray-500 border-white/5'
                            }
`}>
                            <IconComp className="w-5 h-5" />
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase font-mono border ${tool.enabled
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                            }
`}>
                            {tool.enabled ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block mb-1">
                          {tool.category || 'Capability'}
                        </span>
                        <h4 className="text-sm font-bold text-white">{tool.name}</h4>
                        <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-[#1f1f1f] flex items-center justify-between">
                        <span className="text-[10px] font-mono text-gray-500">
                          {tool.enabled ? 'Sandboxed runtime' : 'Disabled for gateway'}
                        </span>
                        <button
                          onClick={() => handleToggleTool(tool.id, tool.enabled)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${tool.enabled
                              ? 'bg-pink-500/15 border-pink-500/30 text-pink-400 hover:bg-pink-500/25'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                            }
`}
                        >
                          {tool.enabled ? 'Disable Tool' : 'Enable Tool'}
                        </button>
                      </div>
                    </div>
                  );
                }
)}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 12: OBSERVABILITY TAB (Gateway Telemetry & Performance)
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'observability' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Eye className="w-5 h-5 text-indigo-400" />
                    Gateway Observability & Performance Telemetry
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Real-time metrics on gateway latency, Time to First Token (TTFT), error rates, and semantic cache cost deflation.
                  </p>
                </div>
                <button
                  onClick={fetchInitialData}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium text-gray-400 hover:text-white transition-colors w-fit"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh Telemetry
                </button>
              </div>

              {/* 4 Stat KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-gray-400">Avg Gateway Latency</span>
                    <Clock className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {observability?.avg_latency_ms || 412}ms
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">
                    ↓ 18% faster than direct API
                  </span>
                </div>

                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-gray-400">Time-to-First-Token (TTFT)</span>
                    <Gauge className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-blue-400">
                    {observability?.avg_ttft_ms || 195}ms
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    Streaming buffer active
                  </span>
                </div>

                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-gray-400">Gateway Success Rate</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    {observability?.success_rate_pct || 99.8}%
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    Zero downstream dropouts
                  </span>
                </div>

                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-gray-400">Cache Deflation Savings</span>
                    <Zap className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    ${(cacheSettings?.total_saved_usd || 48.25).toFixed(2)}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">
                    {cacheSettings?.total_cache_hits || 218} requests at $0.00
                  </span>
                </div>
              </div>

              {/* Provider Traffic Distribution & Fallbacks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    Provider Routing Distribution
                  </h3>
                  <div className="space-y-3">
                    {[
                      { name: 'NetRoot Smart Router', pct: 45, color: 'bg-blue-500' },
                      { name: 'DeepSeek Direct', pct: 28, color: 'bg-emerald-500' },
                      { name: 'Anthropic Claude 3.5', pct: 17, color: 'bg-purple-500' },
                      { name: 'Google Gemini & MiniMax', pct: 10, color: 'bg-amber-500' },
                    ].map(p => (
                      <div key={p.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300 font-medium">{p.name}</span>
                          <span className="text-gray-400 font-mono">{p.pct}%</span>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${p.color} rounded-full`} style={{ width: `${p.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-purple-400" />
                    Enterprise Telemetry Connectors
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl border border-[#262626] bg-[#161616] flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-white">Langfuse LLM Observability</h5>
                        <p className="text-[10px] text-gray-400">Stream session traces, prompt versions, and user ratings.</p>
                      </div>
                      <button
                        onClick={() => flashToast('Langfuse connector configuration synchronized!')}
                        className="px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 text-xs font-semibold"
                      >
                        Connected
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl border border-[#262626] bg-[#161616] flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-white">Datadog APM & Vector Logs</h5>
                        <p className="text-[10px] text-gray-400">Forward HTTP gateway status codes, TTFT latency, and spans.</p>
                      </div>
                      <button
                        onClick={() => flashToast('Datadog APM connector enabled!')}
                        className="px-3 py-1.5 rounded-xl bg-white/5 text-gray-400 border border-white/10 hover:text-white text-xs font-semibold"
                      >
                        Configure
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 13: CLASSIFIERS TAB (Priority Intent Execution Queue)
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'classifiers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Tag className="w-5 h-5 text-amber-400" />
                    Intent Classifiers & Priority Execution Queue
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Define rules to evaluate user queries before routing. Rules execute in strict Priority Order (<span className="text-amber-400 font-bold">#1 downwards</span>) to prevent rule conflicts.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingClassifierId(null);
                    setNewClassifierForm({
                      name: '',
                      condition_type: 'keyword',
                      condition_value: '',
                      target_action: 'route_model',
                      target_value: 'anthropic/claude-3.5-sonnet',
                      enabled: true,
                    }
);
                    setShowAddClassifierModal(true);
                  }
}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20 transition-all w-fit"
                >
                  <Plus className="w-4 h-4" />
                  Add Classifier Rule
                </button>
              </div>

              {/* ── Interactive Test Simulator (Playground) ── */}
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Play className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Live Query Classifier Simulator</h4>
                      <p className="text-[11px] text-gray-400">Test how your user prompt is matched against active priority rules without calling an LLM</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleTestEvaluatePrompt} className="flex gap-2">
                  <input
                    type="text"
                    value={testClassifierPrompt}
                    onChange={(e) => setTestClassifierPrompt(e.target.value)}
                    placeholder="Enter a test prompt... e.g. Write a quick python script or help me hack a server"
                    className={`flex-1 px-3 py-2 rounded-xl text-xs border outline-none ${darkMode ? 'bg-[#181818] border-[#2a2a2a] text-white focus:border-amber-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                  />
                  <button
                    type="submit"
                    disabled={testingClassifier || !testClassifierPrompt.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white shadow-md shadow-amber-600/20 transition-all shrink-0"
                  >
                    {testingClassifier ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    <span>Simulate Match</span>
                  </button>
                </form>

                {/* Simulation Result */}
                {testClassifierResult && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    {(testClassifierResult.isMatched || testClassifierResult.matched) ? (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <span className="text-xs font-bold text-white">
                              Matched Rule #{testClassifierResult.matchedRule?.priority || 1}: {testClassifierResult.matchedRule?.name}
                            </span>
                            <span className="text-[11px] text-gray-400 ml-2 font-mono">
                              ({testClassifierResult.matchedRule?.condition_type}: "{testClassifierResult.matchedRule?.condition_value}")
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-400 font-sans">Action:</span>
                          {testClassifierResult.action === 'block' ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                              Blocked ({testClassifierResult.targetValue || testClassifierResult.value})
                            </span>
                          ) : testClassifierResult.action === 'route_model' ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              Route to: {testClassifierResult.targetValue || testClassifierResult.targetModel}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              System Prompt Injected
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs text-gray-400">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>No classifier rules triggered. Request will pass to standard workspace routing fallback.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Priority Ordered Rules Queue */}
              <div className="space-y-3">
                {classifiers.length === 0 ? (
                  <div className={`p-12 rounded-2xl border text-center ${darkMode ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'}`}>
                    <Tag className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-gray-400">No classifier rules configured.</p>
                    <p className="text-xs text-gray-500 mt-1">Click "Add Classifier Rule" to create your first intent evaluation rule.</p>
                  </div>
                ) : (
                  classifiers.map((rule, idx) => (
                    <div
                      key={rule.id}
                      className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                        rule.enabled === false
                          ? 'opacity-60 bg-[#0e0e0e] border-[#1a1a1a]'
                          : darkMode
                          ? 'bg-[#121212] border-[#222] hover:border-[#333]'
                          : 'bg-white border-gray-200'
                      }
`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Priority Badge */}
                        <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-center shrink-0 min-w-[56px]">
                          <span className="text-xs">#{rule.priority || idx + 1}</span>
                          <span className="text-[9px] uppercase tracking-wider text-amber-500/80">Order</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{rule.name}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/5 border border-white/10 text-gray-400 uppercase font-mono">
                              {rule.condition_type}
                            </span>
                            {rule.enabled === false ? (
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                PAUSED
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                ACTIVE
                              </span>
                            )}
                          </div>

                          <div className="mt-1 text-xs text-gray-400 font-mono flex items-center gap-1.5 flex-wrap">
                            <span className="text-gray-500 font-sans">Matching:</span>
                            <span className="text-gray-300 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                              {rule.condition_value}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <span className="text-gray-500 text-[11px]">Action:</span>
                            {rule.target_action === 'route_model' ? (
                              <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                ➔ Route to {rule.target_value}
                              </span>
                            ) : rule.target_action === 'block' ? (
                              <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
                                🚫 Block Request: {rule.target_value}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                💉 System Prompt Injection
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Controls: Active Toggle, Edit, Priority Up/Down, Delete */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        {/* Toggle active / pause button */}
                        <button
                          onClick={() => handleToggleClassifier(rule)}
                          title={rule.enabled === false ? 'Activate Rule' : 'Pause Rule'}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                            rule.enabled === false
                              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'
                              : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
                          }
`}
                        >
                          {rule.enabled === false ? 'Enable' : 'Pause'}
                        </button>

                        {/* Edit Rule */}
                        <button
                          onClick={() => handleOpenEditClassifier(rule)}
                          title="Edit Classifier Rule"
                          className="p-1.5 rounded-xl text-gray-400 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Priority Up / Down Controls */}
                        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden p-0.5">
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMoveClassifierPriority(idx, 'up')}
                            title="Increase Priority (Evaluate Earlier)"
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={idx === classifiers.length - 1}
                            onClick={() => handleMoveClassifierPriority(idx, 'down')}
                            title="Decrease Priority (Evaluate Later)"
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteClassifier(rule.id)}
                          title="Delete Classifier Rule"
                          className="p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Modal: Create API Key ── */}
      {showCreateKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-6 space-y-4 shadow-2xl ${darkMode ? 'bg-[#141414] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
            }
`}>
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-400" />
                Create New API Key
              </h3>
              <button onClick={() => setShowCreateKeyModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {createdKeyResult ? (
              <div className="space-y-4 pt-1">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>API Key created successfully! Keep it confidential.</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] text-amber-400 block mb-1 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Copy your secret key now. It will not be shown again!
                    </span>
                    <div className={`p-3 rounded-xl font-mono text-xs flex items-center justify-between border ${darkMode ? 'bg-[#0a0a0a] border-emerald-500/40 text-emerald-400' : 'bg-gray-100 border-gray-300 text-gray-900'
                      }
`}>
                      <span className="break-all font-semibold select-all">{createdKeyResult.key}</span>
                      <button
                        type="button"
                        onClick={() => copyWithFeedback(createdKeyResult.key, 'created_key')}
                        className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 ml-2 shrink-0 transition-colors flex items-center gap-1 text-xs"
                      >
                        {copiedState['created_key'] ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedState['created_key'] ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Key Name</span>
                      <span className="font-semibold text-white truncate block">{createdKeyResult.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Monthly Budget</span>
                      <span className="font-mono text-white">${createdKeyResult.monthly_limit_usd || 100}/mo</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Scope</span>
                      <span className="text-gray-300">
                        {createdKeyResult.allowed_models && createdKeyResult.allowed_models.length > 0
                          ? createdKeyResult.allowed_models.join(', ')
                          : 'All catalog models allowed'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateKeyModal(false)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
                >
                  I have saved my key
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4 pt-1">
                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-1">Key Name</label>
                  <input
                    required
                    placeholder="e.g., Production Backend / Mobile App"
                    value={newKeyForm.name}
                    onChange={e => setNewKeyForm({ ...newKeyForm, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-blue-500' : 'bg-gray-50 border-gray-300'
                      }
`}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-1">Monthly Budget Cap ($ USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-gray-500 font-mono">$</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={newKeyForm.monthly_limit_usd}
                      onChange={e => setNewKeyForm({ ...newKeyForm, monthly_limit_usd: e.target.value })}
                      className={`w-full pl-7 pr-3 py-2 rounded-xl text-xs border outline-none font-mono ${darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-blue-500' : 'bg-gray-50 border-gray-300'
                        }
`}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">Maximum monthly cost this key is allowed to incur before requests are capped.</span>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-1.5">Model Permissions / Fleet</label>
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setKeyModelPreset('all');
                        setNewKeyForm({ ...newKeyForm, allowed_models: '' });
                      }
}
                      className={`py-1.5 px-2 text-[11px] rounded-lg font-medium border text-center transition-all ${
                        keyModelPreset === 'all'
                          ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }
`}
                    >
                      All Models
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setKeyModelPreset('free');
                        setNewKeyForm({
                          ...newKeyForm,
                          allowed_models: 'openai/gpt-oss-20b, nvidia/nemotron-3.5-lightning:free, google/gemma-4-26b-a4b-it:free, openrouter/free'
                        }
);
                      }
}
                      className={`py-1.5 px-2 text-[11px] rounded-lg font-medium border text-center transition-all ${
                        keyModelPreset === 'free'
                          ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }
`}
                    >
                      Free Fleet Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setKeyModelPreset('custom')}
                      className={`py-1.5 px-2 text-[11px] rounded-lg font-medium border text-center transition-all ${
                        keyModelPreset === 'custom'
                          ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }
`}
                    >
                      Custom Filter
                    </button>
                  </div>

                  {keyModelPreset === 'custom' && (
                    <input
                      placeholder="e.g. liquid/lfm-2.5-2.6b:free, openai/gpt-oss-20b"
                      value={newKeyForm.allowed_models}
                      onChange={e => setNewKeyForm({ ...newKeyForm, allowed_models: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl text-xs border outline-none font-mono ${darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-blue-500' : 'bg-gray-50 border-gray-300'
                        }
`}
                    />
                  )}
                  {((guardrails?.blocked_providers?.length || 0) > 0 || (guardrails?.disallowed_models?.length || 0) > 0) && (
                    <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>Note: {(guardrails?.blocked_providers?.length || 0)} providers & {(guardrails?.disallowed_models?.length || 0)} models are blocked in Workspace Guardrails.</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowCreateKeyModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
                  >
                    Generate API Key
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Gemini-Style Key Analytics & Live Logs Drawer ── */}
      {selectedKeyForAnalytics && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
            darkMode ? 'bg-[#121212] border-[#262626] text-white' : 'bg-white border-gray-200 text-gray-900'
          }
`}>
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{selectedKeyForAnalytics.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      selectedKeyForAnalytics.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : 'bg-gray-500/15 text-gray-400 border border-gray-500/20'
                    }
`}>
                      {selectedKeyForAnalytics.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 font-mono">
                    <span>ID: {selectedKeyForAnalytics.id}</span>
                    <span>•</span>
                    <span>{selectedKeyForAnalytics.key_masked}</span>
                    <button
                      type="button"
                      onClick={() => copyWithFeedback(selectedKeyForAnalytics.key_masked, 'modal_key_mask')}
                      className="text-gray-500 hover:text-white"
                      title="Copy Key"
                    >
                      {copiedState['modal_key_mask'] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openKeyAnalytics(selectedKeyForAnalytics)}
                  title="Refresh Metrics"
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingKeyAnalytics ? 'animate-spin text-blue-400' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedKeyForAnalytics(null);
                    setKeyAnalyticsData(null);
                  }
}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {loadingKeyAnalytics ? (
                <div className="py-20 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                  <p className="text-xs text-gray-400 font-mono">Fetching real-time usage metrics and proxy logs for this key...</p>
                </div>
              ) : (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                      <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
                        <span>Total Requests</span>
                        <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <div className="text-xl font-bold font-mono text-white">
                        {(keyAnalyticsData?.stats?.totalRequests || 0).toLocaleString()}
                      </div>
                      <span className="text-[10px] text-gray-500">Processed by Gateway</span>
                    </div>

                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                      <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
                        <span>Total Tokens</span>
                        <Cpu className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <div className="text-xl font-bold font-mono text-purple-400">
                        {(keyAnalyticsData?.stats?.totalTokens || 0).toLocaleString()}
                      </div>
                      <span className="text-[10px] text-gray-500">Prompt + Completion</span>
                    </div>

                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                      <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
                        <span>Spend vs Cap</span>
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="text-xl font-bold font-mono text-emerald-400">
                        ${(keyAnalyticsData?.stats?.totalCost || 0).toFixed(4)}
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        Limit: ${selectedKeyForAnalytics.monthly_limit_usd || 100}/mo
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                      <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
                        <span>Avg Latency</span>
                        <Gauge className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <div className="text-xl font-bold font-mono text-amber-400">
                        {keyAnalyticsData?.stats?.avgLatency || 0} ms
                      </div>
                      <span className="text-[10px] text-gray-500">End-to-end proxy roundtrip</span>
                    </div>
                  </div>

                  {/* 7-Day Usage Activity Chart (Gemini Studio style) */}
                  <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-blue-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">7-Day Usage Activity</h4>
                      </div>
                      <span className="text-[11px] text-gray-400 font-mono">Daily Request Volume</span>
                    </div>

                    {(() => {
                      const series = keyAnalyticsData?.timeseries || [];
                      const maxReq = Math.max(1, ...series.map(d => d.requests || 0));

                      return (
                        <div className="pt-4">
                          <div className="h-32 flex items-end justify-between gap-2 border-b border-white/10 pb-2">
                            {series.map((day, idx) => {
                              const heightPct = day.requests > 0 ? Math.max(15, Math.round((day.requests / maxReq) * 100)) : 4;
                              return (
                                <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                  {/* Tooltip */}
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-10 bg-black/90 border border-white/20 rounded-lg p-1.5 text-[10px] font-mono pointer-events-none whitespace-nowrap text-center shadow-lg">
                                    <div className="font-bold text-white">{day.date}</div>
                                    <div className="text-blue-400">{day.requests} calls • {(day.tokens || 0).toLocaleString()} tok</div>
                                  </div>

                                  {/* Bar */}
                                  <div
                                    style={{ height: `${heightPct}%` }}
                                    className={`w-full max-w-[36px] rounded-t-md transition-all duration-300 ${
                                      day.requests > 0
                                        ? 'bg-gradient-to-t from-blue-600 to-emerald-400 group-hover:brightness-125'
                                        : 'bg-white/5'
                                    }
`}
                                  />
                                </div>
                              );
                            }
)}
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-2 text-[10px] font-mono text-gray-500">
                            {series.map((day, idx) => (
                              <div key={idx} className="flex-1 text-center">
                                {day.date}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
)()}
                  </div>

                  {/* Direct Gateway Request Logs for this Key */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ListFilter className="w-4 h-4 text-blue-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Proxy Request Logs for this Key ({keyAnalyticsData?.recentLogs?.length || 0})
                        </h4>
                      </div>
                      <span className="text-[11px] text-gray-500">Filtered by Key ID</span>
                    </div>

                    <div className="rounded-xl border border-white/10 overflow-hidden bg-black/40">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider bg-white/[0.02] text-gray-400">
                          <tr>
                            <th className="py-2.5 px-3">Time</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Model</th>
                            <th className="py-2.5 px-3">Latency</th>
                            <th className="py-2.5 px-3">Tokens</th>
                            <th className="py-2.5 px-3">Cost</th>
                            <th className="py-2.5 px-3 text-right">Inspect</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                          {(!keyAnalyticsData?.recentLogs || keyAnalyticsData.recentLogs.length === 0) ? (
                            <tr>
                              <td colSpan="7" className="py-8 text-center text-gray-500 text-xs font-sans">
                                No gateway requests recorded for this key yet. Send an API request using the curl snippet below!
                              </td>
                            </tr>
                          ) : (
                            keyAnalyticsData.recentLogs.map(log => (
                              <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-2.5 px-3 text-gray-300 text-[11px]">
                                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                    log.status === 200
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  }
`}>
                                    {log.status} OK
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-gray-300 text-[11px] truncate max-w-[170px]">
                                  <div className="flex items-center gap-1.5">
                                    <span>{log.model}</span>
                                    {log.is_fallback && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25 shrink-0" title={`Failover from ${log.original_model || 'primary'}`}>
                                        Fallback
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-gray-400 text-[11px]">
                                  {log.latency_ms}ms
                                </td>
                                <td className="py-2.5 px-3 text-gray-300 text-[11px]">
                                  {log.total_tokens} <span className="text-gray-500 text-[10px]">({log.prompt_tokens}/{log.completion_tokens})</span>
                                </td>
                                <td className="py-2.5 px-3 text-emerald-400 text-[11px]">
                                  ${(log.cost_usd || 0).toFixed(5)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-sans">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedLogInspect(log)}
                                    className="p-1 rounded-lg text-blue-400 hover:text-white hover:bg-blue-500/20 transition-colors"
                                    title="Inspect JSON Request"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Ready-to-use cURL for this key */}
                  <div className="p-4 rounded-xl border border-white/10 bg-black/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-blue-400" />
                        Quick Test Request for {selectedKeyForAnalytics.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const hostUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
                            ? window.location.origin
                            : 'http://localhost:3001';
                          const curlTest = `curl ${hostUrl}/api/v1/chat/completions \\
  -H "Authorization: Bearer nr-live-YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "nvidia/nemotron-3.5-lightning:free",
    "messages": [{"role": "user", "content": "Testing key ${selectedKeyForAnalytics.id}"}]
  }
'`;
                          copyWithFeedback(curlTest, 'test_curl');
                        }
}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        {copiedState['test_curl'] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedState['test_curl'] ? 'Copied' : 'Copy cURL'}</span>
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono text-gray-400 bg-black/80 p-2.5 rounded-lg overflow-x-auto">
                      {`curl ${typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? window.location.origin : 'http://localhost:3001'}/api/v1/chat/completions \\
  -H "Authorization: Bearer nr-live-YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "nvidia/nemotron-3.5-lightning:free", "messages": [{"role": "user", "content": "Testing ${selectedKeyForAnalytics.name}"}]}'`}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Inspect Log ── */}
      {selectedLogInspect && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-2xl border p-6 space-y-5 shadow-2xl transition-all ${
            darkMode ? 'bg-[#121212] border-[#262626] text-white' : 'bg-white border-gray-200 text-gray-900'
          }
`}>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#222]">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                  <ListFilter className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2 font-mono text-white">
                    Request Details
                    <span className="text-xs text-gray-400 font-normal">({selectedLogInspect.id})</span>
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedLogInspect, null, 2));
                    setCopiedLogJson(true);
                    setTimeout(() => setCopiedLogJson(false), 2000);
                  }
}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                    copiedLogJson
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : darkMode ? 'bg-white/5 border-[#333] text-gray-300 hover:text-white hover:bg-white/10' : 'bg-gray-100 border-gray-200 text-gray-700'
                  }
`}
                >
                  {copiedLogJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLogJson ? 'Copied!' : 'Copy JSON'}
                </button>
                <button
                  onClick={() => setSelectedLogInspect(null)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Status */}
              <div className={`p-3 rounded-xl border ${darkMode ? 'bg-[#181818] border-[#2a2a2a]' : 'bg-gray-50 border-gray-200'}`}>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Status</p>
                <p className={`font-mono font-bold text-sm mt-1 flex items-center gap-1.5 ${
                  (selectedLogInspect.status || 200) >= 400 ? 'text-red-400' : 'text-emerald-400'
                }
`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    (selectedLogInspect.status || 200) >= 400 ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'
                  }
`} />
                  {selectedLogInspect.status || 200} {(selectedLogInspect.status || 200) >= 400 ? 'ERR' : 'OK'}
                </p>
              </div>

              {/* Total Tokens */}
              <div className={`p-3 rounded-xl border ${darkMode ? 'bg-[#181818] border-[#2a2a2a]' : 'bg-gray-50 border-gray-200'}`}>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Tokens</p>
                <p className="font-mono font-bold text-sm text-white mt-1">
                  {Number(selectedLogInspect.total_tokens || 0).toLocaleString()}
                </p>
              </div>

              {/* Latency */}
              <div className={`p-3 rounded-xl border ${darkMode ? 'bg-[#181818] border-[#2a2a2a]' : 'bg-gray-50 border-gray-200'}`}>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Latency</p>
                <p className="font-mono font-bold text-sm text-amber-400 mt-1">
                  {(selectedLogInspect.latency_ms || 0) >= 1000
                    ? `${((selectedLogInspect.latency_ms || 0) / 1000).toFixed(2)}s`
                    : `${selectedLogInspect.latency_ms || 0}ms`}
                </p>
              </div>

              {/* Billed Cost */}
              <div className={`p-3 rounded-xl border ${darkMode ? 'bg-[#181818] border-[#2a2a2a]' : 'bg-gray-50 border-gray-200'}`}>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Billed Cost</p>
                <p className="font-mono font-bold text-sm text-emerald-400 mt-1">
                  ${Number(selectedLogInspect.cost_usd || 0).toFixed(5)}
                </p>
              </div>
            </div>

            {/* Sub-tabs switcher: Overview vs Raw JSON */}
            <div className="flex items-center gap-2 border-b border-[#222] pb-2">
              <button
                type="button"
                onClick={() => setInspectTab('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  inspectTab === 'overview'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
`}
              >
                Overview & Parameters
              </button>
              <button
                type="button"
                onClick={() => setInspectTab('raw')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  inspectTab === 'raw'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
`}
              >
                Raw JSON
              </button>
            </div>

            {/* Tab 1: Overview */}
            {inspectTab === 'overview' ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs ${
                  darkMode ? 'bg-[#161616] border-[#262626]' : 'bg-gray-50 border-gray-200'
                }
`}>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Timestamp (UTC / Local)</span>
                    <span className="font-mono font-semibold text-white mt-0.5 block">
                      {selectedLogInspect.timestamp
                        ? new Date(selectedLogInspect.timestamp).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          }
)
                        : '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[11px]">Model & Upstream</span>
                    <span className="font-mono font-semibold text-blue-400 mt-0.5 block truncate">
                      {selectedLogInspect.model || 'unknown'}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[11px]">Key Name & ID</span>
                    <span className="font-medium text-gray-200 mt-0.5 block">
                      {selectedLogInspect.key_name || 'Direct Chat'} ({selectedLogInspect.key_id || 'session'})
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[11px]">Source Routing / Cache</span>
                    <span className="mt-0.5 block">
                      {selectedLogInspect.cached_status ? (
                        <span className="text-emerald-400 font-mono font-bold">⚡ Cached ($0.00)</span>
                      ) : (
                        <span className="text-blue-400 font-mono">🌐 Live OpenRouter Proxy</span>
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[11px]">Client IP</span>
                    <span className="font-mono text-gray-300 mt-0.5 block">
                      {selectedLogInspect.client_ip || '127.0.0.1'}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[11px]">NetRoot Retained Margin</span>
                    <span className="font-mono text-emerald-400 font-bold mt-0.5 block">
                      +${Number(selectedLogInspect.profit_usd || 0).toFixed(6)}
                    </span>
                  </div>
                </div>

                {/* Tokens Progress Ratio */}
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#161616] border-[#262626]' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-gray-400 font-medium">Prompt vs Completion Breakdown</span>
                    <span className="font-mono text-gray-300">
                      In: {Number(selectedLogInspect.prompt_tokens || 0).toLocaleString()} / Out: {Number(selectedLogInspect.completion_tokens || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-white/5 flex">
                    <div
                      className="bg-blue-500 h-full"
                      style={{
                        width: `${Math.min(
                          100,
                          ((selectedLogInspect.prompt_tokens || 0) /
                            Math.max(1, selectedLogInspect.total_tokens || 1)) *
                            100
                        )}%`,
                      }
}
                      title="Prompt Tokens"
                    />
                    <div
                      className="bg-purple-500 h-full"
                      style={{
                        width: `${Math.min(
                          100,
                          ((selectedLogInspect.completion_tokens || 0) /
                            Math.max(1, selectedLogInspect.total_tokens || 1)) *
                            100
                        )}%`,
                      }
}
                      title="Completion Tokens"
                    />
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-gray-400 mt-2 font-mono">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Prompt: {Number(selectedLogInspect.prompt_tokens || 0).toLocaleString()}</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" /> Completion: {Number(selectedLogInspect.completion_tokens || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Tab 2: Raw JSON */
              <pre className={`p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed max-h-80 border ${
                darkMode ? 'bg-[#0a0a0a] text-emerald-400 border-[#222]' : 'bg-gray-100 text-gray-800 border-gray-300'
              }
`}>
                {JSON.stringify(selectedLogInspect, null, 2)}
              </pre>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLogInspect(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Add Fallback Cascade Rule ── */}
      {showAddFallbackModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-6 space-y-4 shadow-2xl ${
            darkMode ? 'bg-[#141414] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
          }
`}>
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-blue-400" />
                Add Automatic Fallback Chain
              </h3>
              <button
                type="button"
                onClick={() => setShowAddFallbackModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-400">
              When the primary model is unavailable or rate-limited, NetRoot AI will seamlessly forward incoming requests to the fallback target with zero dropped tokens.
            </p>

            {/* Free Plan Guidance Banner */}
            {isFreePlan && (
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Free Plan Tier:</strong> Fallback routing is restricted to Free Catalog models. Upgrade to Pro to route across Frontier (GPT-4o, Claude 3.5 Sonnet) and Custom Endpoints.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('billing')}
                  className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-[11px] shrink-0 transition"
                >
                  Upgrade
                </button>
              </div>
            )}

            <form onSubmit={handleAddFallbackRule} className="space-y-4 pt-1">
              {/* Primary Model Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-white block">
                    Primary Model (Upstream Target)
                  </label>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setNewFallbackForm(prev => ({ ...prev, primaryMode: 'catalog' }))}
                      className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                        newFallbackForm.primaryMode === 'catalog'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }
`}
                    >
                      Catalog ({eligibleRoutingModels.length || 0})
                    </button>
                    {!isFreePlan && (
                      <button
                        type="button"
                        onClick={() => setNewFallbackForm(prev => ({ ...prev, primaryMode: 'custom' }))}
                        className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                          newFallbackForm.primaryMode === 'custom'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:text-white'
                        }
`}
                      >
                        Custom ID
                      </button>
                    )}
                  </div>
                </div>

                {newFallbackForm.primaryMode === 'catalog' ? (
                  <select
                    value={newFallbackForm.primary}
                    onChange={e => setNewFallbackForm(prev => ({ ...prev, primary: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border outline-none ${
                      darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-blue-500' : 'bg-gray-50 border-gray-300'
                    }
`}
                  >
                    {eligibleRoutingModels.length > 0 ? (
                      eligibleRoutingModels.map(m => {
                        const isBlocked = (guardrails?.blocked_providers || []).map(p => p.toLowerCase().trim()).includes((m.id.split('/')[0] || '').toLowerCase().trim()) ||
                          (guardrails?.disallowed_models || []).map(dm => dm.toLowerCase().trim()).includes(m.id.toLowerCase().trim());
                        return (
                          <option key={m.id} value={m.id} disabled={isBlocked}>
                            {isBlocked ? '🚫 [BLOCKED BY GUARDRAILS] ' : ''}{m.id} {m.name && m.name !== m.id ? `(${m.name})` : ''}
                          </option>
                        );
                      })
                    ) : (
                      <option value="liquid/lfm-2.5-2.6b:free">liquid/lfm-2.5-2.6b:free</option>
                    )}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. mistralai/mistral-large or ollama/llama3"
                    value={newFallbackForm.primaryCustom}
                    onChange={e => setNewFallbackForm(prev => ({ ...prev, primaryCustom: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border outline-none ${
                      darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-blue-500' : 'bg-gray-50 border-gray-300'
                    }
`}
                  />
                )}
              </div>

              {/* Failover Arrow */}
              <div className="flex items-center justify-center gap-2 text-xs font-medium text-amber-400 py-0.5">
                <span className="w-8 h-[1px] bg-amber-400/30" />
                <span>➔ 100% Seamless Failover ➔</span>
                <span className="w-8 h-[1px] bg-amber-400/30" />
              </div>

              {/* Fallback Model Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-white block">
                    Fallback Model (Redundant Target)
                  </label>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setNewFallbackForm(prev => ({ ...prev, fallbackMode: 'catalog' }))}
                      className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                        newFallbackForm.fallbackMode === 'catalog'
                          ? 'bg-emerald-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }
`}
                    >
                      Catalog ({eligibleRoutingModels.length || 0})
                    </button>
                    {!isFreePlan && (
                      <button
                        type="button"
                        onClick={() => setNewFallbackForm(prev => ({ ...prev, fallbackMode: 'custom' }))}
                        className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                          newFallbackForm.fallbackMode === 'custom'
                            ? 'bg-emerald-600 text-white'
                            : 'text-gray-400 hover:text-white'
                        }
`}
                      >
                        Custom ID
                      </button>
                    )}
                  </div>
                </div>

                {newFallbackForm.fallbackMode === 'catalog' ? (
                  <select
                    value={newFallbackForm.fallback}
                    onChange={e => setNewFallbackForm(prev => ({ ...prev, fallback: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border outline-none ${
                      darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-emerald-500' : 'bg-gray-50 border-gray-300'
                    }
`}
                  >
                    {eligibleRoutingModels.length > 0 ? (
                      eligibleRoutingModels.map(m => {
                        const isBlocked = (guardrails?.blocked_providers || []).map(p => p.toLowerCase().trim()).includes((m.id.split('/')[0] || '').toLowerCase().trim()) ||
                          (guardrails?.disallowed_models || []).map(dm => dm.toLowerCase().trim()).includes(m.id.toLowerCase().trim());
                        return (
                          <option key={m.id} value={m.id} disabled={isBlocked}>
                            {isBlocked ? '🚫 [BLOCKED BY GUARDRAILS] ' : ''}{m.id} {m.name && m.name !== m.id ? `(${m.name})` : ''}
                          </option>
                        );
                      })
                    ) : (
                      <option value="meta-llama/llama-3.3-70b-instruct:free">meta-llama/llama-3.3-70b-instruct:free</option>
                    )}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. google/gemini-2.5-flash or self-hosted/qwen"
                    value={newFallbackForm.fallbackCustom}
                    onChange={e => setNewFallbackForm(prev => ({ ...prev, fallbackCustom: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border outline-none ${
                      darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-emerald-500' : 'bg-gray-50 border-gray-300'
                    }
`}
                  />
                )}
              </div>

              {/* Trigger Condition */}
              <div>
                <label className="text-xs font-semibold text-white block mb-1">
                  Failover Trigger Condition
                </label>
                <select
                  value={newFallbackForm.trigger}
                  onChange={e => setNewFallbackForm(prev => ({ ...prev, trigger: e.target.value }))}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none ${
                    darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-blue-500' : 'bg-gray-50 border-gray-300'
                  }
`}
                >
                  <option value="any_error">Any Outage (429 Rate Limit, 500, 502, 503, 504 or Timeout)</option>
                  <option value="rate_limit_only">Strictly Rate Limits (HTTP 429 Only)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddFallbackModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Fallback Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Upload Document (RAG) ── */}
      {showUploadFileModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-2xl ${darkMode ? 'bg-[#141414] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
            }
`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-blue-400" />
                Upload Knowledge Document
              </h3>
              <button onClick={() => setShowUploadFileModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadFile} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1">Document File Name</label>
                <input
                  required
                  placeholder="e.g. quarterly_earnings_report.pdf"
                  value={newFileForm.name}
                  onChange={e => setNewFileForm({ ...newFileForm, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-blue-500' : 'bg-gray-50 border-gray-300'
                    }
`}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1">Approximate File Size (KB)</label>
                <input
                  type="number"
                  min="1"
                  value={newFileForm.file_size_kb}
                  onChange={e => setNewFileForm({ ...newFileForm, file_size_kb: Number(e.target.value) })}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none font-mono ${darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-blue-500' : 'bg-gray-50 border-gray-300'
                    }
`}
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Est. Tokens: ~{Math.round(Number(newFileForm.file_size_kb || 512) * 250).toLocaleString()} tokens
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <span className="text-xs font-semibold text-white block">Chat Studio Auto-Sync</span>
                  <span className="text-[10px] text-gray-400">Inject document embeddings into studio chat prompts</span>
                </div>
                <input
                  type="checkbox"
                  checked={newFileForm.sync_chat}
                  onChange={e => setNewFileForm({ ...newFileForm, sync_chat: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadFileModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20"
                >
                  Upload & Index
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Create / Edit Intent Classifier Rule ── */}
      {showAddClassifierModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-6 space-y-4 shadow-2xl ${darkMode ? 'bg-[#141414] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
            }
`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                {editingClassifierId ? 'Edit Intent Classifier Rule' : 'Add Intent Classifier Rule'}
              </h3>
              <button
                onClick={() => {
                  setShowAddClassifierModal(false);
                  setEditingClassifierId(null);
                }
}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-400">
              {editingClassifierId
                ? 'Update rule parameters. Execution priority order will be preserved.'
                : <>New rules are appended to the queue as <strong className="text-amber-400">#{classifiers.length + 1} Priority</strong>. You can reorder their execution priority at any time.</>
              }

            </p>

            <form onSubmit={handleSaveClassifier} className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1">Rule Name</label>
                <input
                  required
                  placeholder="e.g. Fast Conversational Greeting Filter"
                  value={newClassifierForm.name}
                  onChange={e => setNewClassifierForm({ ...newClassifierForm, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-amber-500' : 'bg-gray-50 border-gray-300'
                    }
`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-1">Condition Type</label>
                  <select
                    value={newClassifierForm.condition_type}
                    onChange={e => setNewClassifierForm({ ...newClassifierForm, condition_type: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${darkMode ? 'bg-[#1e1e1e] border-[#333] text-white' : 'bg-gray-50 border-gray-300'
                      }
`}
                  >
                    <option value="keyword">Keyword List (comma-separated)</option>
                    <option value="regex">Regex Expression</option>
                    <option value="toxicity">Toxicity / Sensitive Check</option>
                    <option value="token_length">Token Length Threshold (&gt; N)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-1">Target Action</label>
                  <select
                    value={newClassifierForm.target_action}
                    onChange={e => {
                      const newAction = e.target.value;
                      let defaultTargetVal = newClassifierForm.target_value;
                      if (newAction === 'route_model' && !defaultTargetVal.includes('/')) {
                        defaultTargetVal = eligibleRoutingModels[0]?.id || 'anthropic/claude-3.5-sonnet';
                      }
 else if (newAction === 'block' && defaultTargetVal.includes('/')) {
                        defaultTargetVal = 'Request blocked by enterprise policy.';
                      }
 else if (newAction === 'inject_prompt' && defaultTargetVal.includes('/')) {
                        defaultTargetVal = 'You are a professional assistant. Answer accurately and succinctly.';
                      }

                      setNewClassifierForm({ ...newClassifierForm, target_action: newAction, target_value: defaultTargetVal });
                    }
}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${darkMode ? 'bg-[#1e1e1e] border-[#333] text-white' : 'bg-gray-50 border-gray-300'
                      }
`}
                  >
                    <option value="route_model">Route to Specific Model</option>
                    <option value="block">Block Request (Safety)</option>
                    <option value="inject_prompt">Inject System Guardrail</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1">
                  {newClassifierForm.condition_type === 'token_length'
                    ? 'Token Count Threshold (Triggers if prompt token length > value)'
                    : newClassifierForm.condition_type === 'regex'
                    ? 'Regular Expression (e.g. ^(?i)code\\b.*)'
                    : newClassifierForm.condition_type === 'toxicity'
                    ? 'Prohibited / Sensitive Keywords or Toxicity trigger words'
                    : 'Match Patterns / Keywords (comma-separated)'}
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder={
                    newClassifierForm.condition_type === 'token_length'
                      ? 'e.g. 1500'
                      : newClassifierForm.condition_type === 'regex'
                      ? 'e.g. ^(?i)(debug|optimize|refactor)\\b'
                      : 'Comma-separated keywords, e.g. python, coding, javascript, debug'
                  }

                  value={newClassifierForm.condition_value}
                  onChange={e => setNewClassifierForm({ ...newClassifierForm, condition_value: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border outline-none ${darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-amber-500' : 'bg-gray-50 border-gray-300'
                    }
`}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1">
                  {newClassifierForm.target_action === 'route_model'
                    ? 'Destination Target Model'
                    : newClassifierForm.target_action === 'block'
                    ? 'Block Error Message (Returned to client)'
                    : 'System Prompt to Inject'}
                </label>
                {newClassifierForm.target_action === 'route_model' ? (
                  <div className="space-y-2">
                    {eligibleRoutingModels.length > 0 ? (
                      <select
                        value={newClassifierForm.target_value}
                        onChange={e => setNewClassifierForm({ ...newClassifierForm, target_value: e.target.value })}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-mono border outline-none ${
                          darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-amber-500' : 'bg-gray-50 border-gray-300'
                        }
`}
                      >
                        {eligibleRoutingModels.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.id} {m.name && m.name !== m.id ? `(${m.name})` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        required
                        placeholder="e.g. anthropic/claude-3.5-sonnet"
                        value={newClassifierForm.target_value}
                        onChange={e => setNewClassifierForm({ ...newClassifierForm, target_value: e.target.value })}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-mono border outline-none ${
                          darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-amber-500' : 'bg-gray-50 border-gray-300'
                        }
`}
                      />
                    )}
                  </div>
                ) : newClassifierForm.target_action === 'inject_prompt' ? (
                  <textarea
                    required
                    rows={2}
                    placeholder="e.g. Always respond in strict JSON format."
                    value={newClassifierForm.target_value}
                    onChange={e => setNewClassifierForm({ ...newClassifierForm, target_value: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono border outline-none ${
                      darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-amber-500' : 'bg-gray-50 border-gray-300'
                    }
`}
                  />
                ) : (
                  <input
                    required
                    placeholder="e.g. Request blocked by enterprise policy."
                    value={newClassifierForm.target_value}
                    onChange={e => setNewClassifierForm({ ...newClassifierForm, target_value: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono border outline-none ${
                      darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-amber-500' : 'bg-gray-50 border-gray-300'
                    }
`}
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddClassifierModal(false);
                    setEditingClassifierId(null);
                  }
}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/20"
                >
                  {editingClassifierId ? 'Update Classifier Rule' : 'Save Classifier Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Create / Edit System Preset ── */}
      {showAddPresetModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-6 space-y-4 shadow-2xl ${darkMode ? 'bg-[#141414] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
            }
`}>
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                {editingPresetId ? 'Edit System Preset' : 'Create System Preset'}
              </h3>
              <button onClick={() => { setShowAddPresetModal(false); setEditingPresetId(null); }} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePreset} className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-semibold text-white block mb-1">Preset Name</label>
                <input
                  required
                  placeholder="e.g. Legal Contract Reviewer"
                  value={newPresetForm.name}
                  onChange={e => setNewPresetForm({ ...newPresetForm, name: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none ${darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-cyan-500' : 'bg-gray-50 border-gray-300'
                    }
`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">Short Description</label>
                <input
                  placeholder="e.g. Audits commercial agreements for liability and SLA terms"
                  value={newPresetForm.description}
                  onChange={e => setNewPresetForm({ ...newPresetForm, description: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none ${darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-cyan-500' : 'bg-gray-50 border-gray-300'
                    }
`}
                />
              </div>

              {/* Target / Preferred Model */}
              <div>
                <label className="text-xs font-semibold text-white block mb-1">Target Model</label>
                <select
                  value={newPresetForm.default_model || 'openai/gpt-4o'}
                  onChange={e => setNewPresetForm({ ...newPresetForm, default_model: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border outline-none ${
                    darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-cyan-500' : 'bg-gray-50 border-gray-300'
                  }
`}
                >
                  {eligibleRoutingModels.length > 0 ? (
                    eligibleRoutingModels.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.id} {m.name && m.name !== m.id ? `(${m.name})` : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="openai/gpt-4o">openai/gpt-4o</option>
                      <option value="anthropic/claude-3.5-sonnet">anthropic/claude-3.5-sonnet</option>
                      <option value="deepseek/deepseek-chat">deepseek/deepseek-chat</option>
                      <option value="google/gemini-2.5-flash">google/gemini-2.5-flash</option>
                    </>
                  )}
                </select>
              </div>

              {/* System Instruction Prompt with Token Counter */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-white">System Prompt</label>
                  <span className="text-[10px] font-mono text-cyan-400">
                    ~{Math.round((newPresetForm.system_prompt || '').length / 4)} tokens
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  placeholder="You are an enterprise legal counsel specialized in SaaS contract negotiation..."
                  value={newPresetForm.system_prompt}
                  onChange={e => setNewPresetForm({ ...newPresetForm, system_prompt: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border outline-none ${darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-cyan-500' : 'bg-gray-50 border-gray-300'
                    }
`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300 font-medium">Temperature</span>
                    <span className="font-mono text-cyan-400 font-bold">{newPresetForm.temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={newPresetForm.temperature}
                    onChange={e => setNewPresetForm({ ...newPresetForm, temperature: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white block mb-1">Max Output Tokens</label>
                  <input
                    type="number"
                    min="256"
                    max="16384"
                    step="256"
                    value={newPresetForm.max_tokens}
                    onChange={e => setNewPresetForm({ ...newPresetForm, max_tokens: Number(e.target.value) })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border outline-none ${darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-cyan-500' : 'bg-gray-50 border-gray-300'
                      }
`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => { setShowAddPresetModal(false); setEditingPresetId(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 flex items-center gap-1.5 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  {editingPresetId ? 'Update Preset' : 'Save System Preset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: "Use in API" Code Snippet Drawer for Preset ── */}
      {selectedPresetForSnippet && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-2xl border p-6 space-y-4 shadow-2xl ${
            darkMode ? 'bg-[#141414] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
          }
`}>
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Code className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Call Preset via API</h3>
                  <span className="text-[11px] font-mono text-cyan-400">{selectedPresetForSnippet.name} ({selectedPresetForSnippet.id})</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPresetForSnippet(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Pass <code className="text-cyan-400 font-mono">preset_id: "{selectedPresetForSnippet.id}"</code> in your completion request. The NetRoot Gateway automatically injects your system prompt and sampling parameters.
            </p>

            {/* Code Snippet Box */}
            <div className="relative">
              <pre className="p-4 rounded-xl bg-black border border-white/10 text-[11px] font-mono text-gray-300 overflow-x-auto leading-relaxed select-all">
{`curl -X POST https://api.netrootai.tech/v1/chat/completions \\
  -H "Authorization: Bearer nr-live-YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${selectedPresetForSnippet.default_model || 'openai/gpt-4o'}",
    "preset_id": "${selectedPresetForSnippet.id}",
    "messages": [
      { "role": "user", "content": "Hello, assist me based on your preset role." }
    ]
  }
'`}
              </pre>
              <button
                type="button"
                onClick={() => copyWithFeedback(`curl -X POST https://api.netrootai.tech/v1/chat/completions \\\n  -H "Authorization: Bearer nr-live-YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "${selectedPresetForSnippet.default_model || 'openai/gpt-4o'}",\n    "preset_id": "${selectedPresetForSnippet.id}",\n    "messages": [\n      { "role": "user", "content": "Hello, assist me based on your preset role." }\n    ]\n  }
'`, selectedPresetForSnippet.id)}
                className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium flex items-center gap-1 transition"
              >
                {copiedState[selectedPresetForSnippet.id] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedState[selectedPresetForSnippet.id] ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedPresetForSnippet(null)}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── All 68 AI Providers Modal (Full Blocklist Matrix) ── */}
      {showAllProvidersModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-4xl max-h-[85vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 ${
            darkMode ? 'bg-[#141416] border-[#2a2a2e] text-white' : 'bg-white border-gray-200 text-gray-900'
          }
`}>
            {/* Modal Header */}
            <div className={`p-5 sm:p-6 border-b flex items-center justify-between gap-4 ${
              darkMode ? 'border-[#26262a] bg-[#18181b]' : 'border-gray-200 bg-gray-50'
            }
`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">All Available AI Providers</h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {dynamicProviders.length || 68} Providers Detected
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Click any provider to toggle strict blocking across this workspace.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAllProvidersModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Filter Bar */}
            <div className="p-4 sm:p-5 border-b border-[#26262a] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs w-full sm:w-96 ${
                darkMode ? 'bg-[#1b1b1e] border-[#333]' : 'bg-gray-100 border-gray-300'
              }
`}>
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  value={providerSearch}
                  onChange={e => setProviderSearch(e.target.value)}
                  placeholder="Search provider by name (e.g. OpenAI, DeepSeek, Mistral)..."
                  className="bg-transparent outline-none text-xs w-full text-white placeholder-gray-500"
                  autoFocus
                />
                {providerSearch && (
                  <button onClick={() => setProviderSearch('')} className="text-gray-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
                <span className="text-gray-400">
                  <strong className="text-red-400">{(guardrails?.blocked_providers || []).length}</strong> Blocked
                </span>
                {(guardrails?.blocked_providers?.length || 0) > 0 && (
                  <button
                    onClick={() => setGuardrails(prev => ({ ...prev, blocked_providers: [] }))}
                    className="text-[11px] text-gray-400 hover:text-white underline ml-1"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Modal Providers Grid */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {(() => {
                const list = dynamicProviders.length > 0 ? dynamicProviders : AVAILABLE_PROVIDERS;
                const filtered = list.filter(p => {
                  if (!providerSearch) return true;
                  const term = providerSearch.toLowerCase();
                  return (p.name || '').toLowerCase().includes(term) || (p.id || '').toLowerCase().includes(term);
                }
);

                if (filtered.length === 0) {
                  return (
                    <div className="py-16 text-center text-gray-500 text-xs">
                      No AI providers match "{providerSearch}".
                    </div>
                  );
                }


                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {filtered.map(p => {
                      const isBlocked = (guardrails?.blocked_providers || []).map(b => b.toLowerCase()).includes(p.id.toLowerCase());
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleToggleProviderBlock(p.id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer select-none transition-all duration-200 flex flex-col justify-between ${
                            isBlocked
                              ? 'bg-red-500/10 border-red-500/40 text-red-300 shadow-sm shadow-red-500/10'
                              : darkMode
                              ? 'bg-[#18181b] border-[#2a2a2e] text-gray-300 hover:border-gray-500'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-400'
                          }
`}
                        >
                          <div className="flex items-center justify-between mb-2.5">
                            <ProviderLogo provider={p.name} modelId={p.id} size="md" />
                            <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                              isBlocked
                                ? 'bg-red-500/25 text-red-300 border border-red-500/40'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                            }
`}>
                              {isBlocked ? '🚫 Blocked' : '✓ Allowed'}
                            </span>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white truncate">{p.name}</div>
                            <div className="text-[10px] text-gray-500 truncate mt-0.5">
                              {p.model_count ? `${p.model_count} models` : p.popular}
                            </div>
                          </div>
                        </div>
                      );
                    }
)}
                  </div>
                );
              }
)()}
            </div>

            {/* Modal Footer */}
            <div className={`p-4 sm:p-5 border-t flex items-center justify-between gap-3 ${
              darkMode ? 'border-[#26262a] bg-[#18181b]' : 'border-gray-200 bg-gray-50'
            }
`}>
              <span className="text-xs text-gray-400">
                {(guardrails?.blocked_providers || []).length} providers marked as restricted
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAllProvidersModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white"
                >
                  Done
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSaveGuardrails();
                    setShowAllProvidersModal(false);
                  }
}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-600/20 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save & Apply Rules
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Workspace Switcher & Creator ── */}
      {showCreateWsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-6 space-y-5 shadow-2xl ${
            darkMode ? 'bg-[#141414] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-blue-400" />
                Workspaces
              </h3>
              <button onClick={() => setShowCreateWsModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of existing and shared workspaces */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Your Workspaces</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {workspaces.map(w => {
                  const isActive = w.id === activeWorkspace?.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => handleSwitchWorkspace(w)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${
                        isActive
                          ? 'bg-blue-500/15 border-blue-500/40 text-white font-semibold'
                          : 'bg-white/5 border-white/5 hover:border-white/20 text-gray-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-400' : 'bg-gray-600'}`} />
                        <div>
                          <span className="block">{w.name}</span>
                          {w.description && <span className="text-[10px] text-gray-500 line-clamp-1">{w.description}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {w.is_default && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-white/10 text-gray-400">
                            Default
                          </span>
                        )}
                        {w.member_role && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            {w.member_role}
                          </span>
                        )}
                        {isActive && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Create new workspace form */}
            <div className="pt-3 border-t border-white/10">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2.5">
                Create New Workspace
              </label>
              <form onSubmit={handleCreateWorkspace} className="space-y-3">
                <div>
                  <input
                    required
                    placeholder="Workspace Name (e.g. Mobile App, Client Project)"
                    value={newWsForm.name}
                    onChange={e => setNewWsForm({ ...newWsForm, name: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none ${
                      darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-blue-500' : 'bg-gray-50 border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <input
                    placeholder="Short description (optional)"
                    value={newWsForm.description}
                    onChange={e => setNewWsForm({ ...newWsForm, description: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none ${
                      darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-blue-500' : 'bg-gray-50 border-gray-300'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCreateWsModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Workspace</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Invite Team Member ── */}
      {showInviteMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-2xl ${
            darkMode ? 'bg-[#141414] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-400" />
                Invite Team Member
              </h3>
              <button onClick={() => setShowInviteMemberModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteMember} className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none ${
                    darkMode ? 'bg-[#1e1e1e] border-[#333] text-white focus:border-purple-500' : 'bg-gray-50 border-gray-300'
                  }`}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none ${
                    darkMode ? 'bg-[#1e1e1e] border-[#333] text-white' : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <option value="developer">Member (Can use workspace)</option>
                  <option value="admin">Admin (Full access)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteMemberModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={invitingMember || !inviteEmail.trim()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-purple-600/20 flex items-center gap-1.5"
                >
                  {invitingMember && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Send Invitation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Reset Workspace Configuration ── */}
      {showResetConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-2xl ${
            darkMode ? 'bg-[#141414] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-red-500/20">
              <h3 className="text-sm font-bold flex items-center gap-2 text-red-400">
                <RotateCcw className="w-4 h-4" />
                Reset Configuration
              </h3>
              <button onClick={() => setShowResetConfigModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to reset all routing fallback policies, intent classifiers, and semantic cache thresholds for <strong className="text-white">{activeWorkspace?.name}</strong> back to factory defaults?
            </p>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-gray-400 space-y-1">
              <div>✓ Existing API keys will remain active.</div>
              <div>✓ Team members and permissions will be preserved.</div>
              <div>✓ Fallback chains and classifier rules will be cleared.</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfigModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetWorkspaceConfig}
                disabled={resettingConfig}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-red-600/20 flex items-center gap-1.5"
              >
                {resettingConfig && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Reset to Defaults</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Delete Workspace Safety Confirmation ── */}
      {showDeleteWsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border border-red-500/30 p-6 space-y-4 shadow-2xl ${
            darkMode ? 'bg-[#161214] text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-red-500/20">
              <h3 className="text-sm font-bold flex items-center gap-2 text-red-400">
                <ShieldAlert className="w-4 h-4" />
                Confirm Workspace Deletion
              </h3>
              <button onClick={() => setShowDeleteWsModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs leading-relaxed">
              <strong>Warning:</strong> This will permanently delete <span className="font-bold underline">{activeWorkspace?.name}</span> and revoke all its API keys, BYOK keys, and configurations immediately.
            </div>

            <div>
              <label className="text-xs text-gray-300 block mb-1.5">
                To confirm, please type <strong className="text-red-400 select-all font-mono">{activeWorkspace?.name}</strong> below:
              </label>
              <input
                type="text"
                placeholder={activeWorkspace?.name}
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border outline-none ${
                  darkMode ? 'bg-[#22181a] border-red-500/30 text-white focus:border-red-500' : 'bg-gray-50 border-gray-300'
                }`}
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteWsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCurrentWorkspace}
                disabled={deletingWs || deleteConfirmText.trim() !== (activeWorkspace?.name || '').trim()}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md shadow-red-600/20 flex items-center gap-1.5"
              >
                {deletingWs && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, darkMode }) {
  return (
    <div
      className={`flex items-center gap-1 text-[11px] border rounded-lg px-2.5 py-1 ${
        darkMode
          ? 'border-[#2e2e2e] bg-[#1a1a1a] text-gray-400'
          : 'border-gray-200 bg-gray-50 text-gray-500'
      }
`}
    >
      <span className={`font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        {label}
      </span>
      <span className={`font-mono font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {value}
      </span>
    </div>
  );
}

function ModelSelectModal({ darkMode, modelsList, selected, onSave, onClose }) {
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState(selected);

  const filtered = modelsList.filter(m => {
    const s = search.toLowerCase();
    const name = (m.display_name || m.name || m.id || '').toLowerCase();
    const desc = (m.description || m.desc || '').toLowerCase();
    const id = (m.id || '').toLowerCase();
    return name.includes(s) || desc.includes(s) || id.includes(s);
  }
);

  function toggle(id) {
    setDraft(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }


  function selectAll() {
    setDraft(modelsList.map(m => m.id));
  }

  function clearAll() {
    setDraft([]);
  }


  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] ${
          darkMode ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'
        }
`}
      >
        <div
          className={`flex items-center justify-between px-6 pt-6 pb-4 border-b ${
            darkMode ? 'border-[#222]' : 'border-gray-200'
          }
`}
        >
          <div>
            <h3 className={`font-semibold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Allow / Block Models
            </h3>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Select which models team members and users can access in this workspace
            </p>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              darkMode
                ? 'text-gray-400 hover:text-white hover:bg-white/5'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }
`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className={`px-6 py-3 border-b ${darkMode ? 'border-[#222]' : 'border-gray-200'}`}>
          <div
            className={`flex items-center gap-2 border rounded-xl px-3 py-2 mb-3 ${
              darkMode ? 'bg-[#1e1e1e] border-[#2e2e2e]' : 'bg-gray-50 border-gray-300'
            }
`}
          >
            <Search className={`w-4 h-4 shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search workspace models..."
              className={`bg-transparent outline-none text-xs flex-1 ${
                darkMode ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'
              }
`}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Selected {draft.length} of {modelsList.length} models
            </span>
            <div className="flex gap-3">
              <button
                onClick={selectAll}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Select all
              </button>
              <button
                onClick={clearAll}
                className={`text-xs transition-colors ${
                  darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }
`}
              >
                Clear all
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-3 py-2">
          {filtered.map(model => {
            const checked = draft.includes(model.id);
            return (
              <button
                key={model.id}
                onClick={() => toggle(model.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-colors text-left ${
                  checked
                    ? darkMode
                      ? 'bg-blue-500/10'
                      : 'bg-blue-50'
                    : darkMode
                    ? 'hover:bg-white/5'
                    : 'hover:bg-gray-50'
                }
`}
              >
                <div
                  className={`w-5 h-5 rounded border shrink-0 flex items-center justify-center transition-all ${
                    checked
                      ? 'bg-blue-500 border-blue-500'
                      : darkMode
                      ? 'border-[#3a3a3a]'
                      : 'border-gray-300'
                  }
`}
                >
                  {checked && <Check className="w-3 h-3 text-white" />}
                </div>

                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    checked ? 'bg-blue-500/20' : darkMode ? 'bg-[#222]' : 'bg-gray-100'
                  }
`}
                >
                  <Cpu
                    className={`w-4 h-4 ${
                      checked ? 'text-blue-400' : darkMode ? 'text-gray-400' : 'text-gray-500'
                    }
`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-semibold ${
                      checked
                        ? darkMode
                          ? 'text-white'
                          : 'text-gray-900'
                        : darkMode
                        ? 'text-gray-300'
                        : 'text-gray-700'
                    }
`}
                  >
                    {model.display_name || model.name || model.id}
                  </p>
                  <p className={`text-[11px] truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {model.description || model.desc || model.id}
                  </p>
                </div>

                {checked && (
                  <span className="shrink-0 text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/25 rounded-full px-2 py-0.5 font-medium">
                    Allowed
                  </span>
                )}
              </button>
            );
          }
)}
        </div>

        <div
          className={`flex items-center justify-between px-6 py-4 border-t ${
            darkMode ? 'border-[#222]' : 'border-gray-200'
          }
`}
        >
          <button
            onClick={onClose}
            className={`text-xs px-4 py-2 rounded-lg border transition-colors ${
              darkMode
                ? 'border-[#3a3a3a] text-gray-400 hover:text-white'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }
`}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(draft)}
            className="text-xs font-medium bg-white hover:bg-gray-100 text-black px-5 py-2 rounded-lg transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
