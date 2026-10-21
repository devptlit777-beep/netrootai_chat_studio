
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Loader2, Check, Copy, Search, Download, Plus,
  MoreHorizontal, PenSquare, AlertTriangle, Users, X, Cpu,
  CreditCard, Lock, Zap, Star, Shield, ChevronRight, Presentation,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePlan } from '../contexts/PlanContext';
import ApiKeysTab from '../components/ApiKeysTab';
import TokenDashboard from '../components/TokenDashboard';
import BillingTab from '../components/Billing';
import API_BASE from '../lib/api';
import { DEFAULT_PLAN_LIMITS, fetchPlanLimits, getModelImageLimit, normalizePlan } from '../lib/planLimits';
import { useTranslation } from 'react-i18next';
// import MembersTab from '../components/MembersTab';
// import GroupsTab from '../components/GroupsTab';
// import RolesTab from '../components/RolesTab';
// import WebhooksTab from '../components/WebhooksTab';
// import EvaluationsTab from '../components/EvaluationsTab';

const TABS = ['general', 'limits', 'billing', 'api-keys', 'token-dashboard'];
// const TABS = ['general', 'limits', 'billing', 'members', 'groups', 'roles', 'webhooks', 'evaluations', 'api-keys', 'token-dashboard'];
export default function ProjectSettingsPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(() => searchParams.get('tab') || 'general');
  const [autoUpgradePlan, setAutoUpgradePlan] = useState(() => searchParams.get('upgrade') || null);

  const showOrgButton = tab === 'members' || tab === 'groups' || tab === 'roles';

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('project.title')}</h1>
          {/* {showOrgButton && (
            <button className={`flex items-center gap-2 text-sm border rounded-lg px-4 py-2 transition-colors ${darkMode ? 'border-[#3a3a3a] text-gray-300 hover:bg-white/5' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
              <ExternalLink className="w-4 h-4" />
              Organization settings
              <span className="text-xs">↗</span>
            </button>
          )} */}
        </div>

        {/* Tabs */}
        <div className={`flex gap-0 border-b mb-10 ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
          {TABS.map(tabKey => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`px-5 py-2.5 text-sm font-medium whitespace-nowrap capitalize transition-all relative ${tab === tabKey
                ? darkMode ? 'text-white' : 'text-gray-900'
                : darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {tabKey === 'api-keys' ? t('project.apiKeys') : tabKey === 'token-dashboard' ? t('project.tokenDashboard') : t(`project.${tabKey}`)}
              {tab === tabKey && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />}
            </button>
          ))}
        </div>

        {tab === 'general' && <GeneralTab darkMode={darkMode} />}
        {tab === 'limits' && <LimitsTab darkMode={darkMode} onUpgrade={() => setTab('billing')} />}
        {tab === 'billing' && <BillingTab darkMode={darkMode} autoUpgradePlan={autoUpgradePlan} onAutoUpgradeDone={() => { setAutoUpgradePlan(null); }} />}
        {/* {tab === 'members' && <MembersTab darkMode={darkMode} />}
        {tab === 'groups' && <GroupsTab darkMode={darkMode} />}
        {tab === 'roles' && <RolesTab darkMode={darkMode} />}
        {tab === 'webhooks' && <WebhooksTab darkMode={darkMode} />}
        {tab === 'evaluations' && <EvaluationsTab darkMode={darkMode} />} */}
        {tab === 'api-keys' && <ApiKeysTab darkMode={darkMode} />}
        {tab === 'token-dashboard' && <TokenDashboard darkMode={darkMode} />}
      </div>
    </div>
  );
}

/* ─── General ─────────────────────────────────────────────────────────────── */
function GeneralTab({ darkMode }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [projectName, setProjectName] = useState('Default project');
  const [serviceTier, setServiceTier] = useState('Default');
  const [disableUserKeys, setDisableUserKeys] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const projectId = `proj_1lp3DvhuCzQGikZSlThsNdHU`;

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function copyId() {
    navigator.clipboard.writeText(projectId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  return (
    <div className="space-y-8 max-w-lg">
      <Field label={t('project.projectName')} darkMode={darkMode}>
        <input
          type="text"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          className={inputCls(darkMode)}
        />
      </Field>

      <Field label={t('project.projectId')} darkMode={darkMode}>
        <div className="relative">
          <input
            type="text"
            value={projectId}
            readOnly
            className={`${inputCls(darkMode)} pr-10 font-mono cursor-default`}
          />
          <button onClick={copyId} className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>
            {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </Field>

      <Field label={t('project.serviceTier')} darkMode={darkMode}>
        <div className="relative">
          <select
            value={serviceTier}
            onChange={e => setServiceTier(e.target.value)}
            className={`${inputCls(darkMode)} appearance-none cursor-pointer`}
          >
            <option>{t('project.default')}</option>
            <option>{t('project.flex')}</option>
            <option>{t('project.scale')}</option>
          </select>
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>
        <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          {t('project.tierDescription')}
        </p>
      </Field>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setDisableUserKeys(v => !v)}
          className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${disableUserKeys ? 'bg-[#3b82f6]' : darkMode ? 'bg-[#3a3a3a]' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${disableUserKeys ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('project.disableUserKeys')}</span>
      </div>

      <div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 font-medium px-5 py-2.5 rounded-lg text-sm transition-colors ${darkMode ? 'bg-[#f5f5f5] hover:bg-white text-black' : 'bg-gray-900 hover:bg-black text-white'}`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4 text-emerald-600" /> : null}
          {saved ? t('project.saved') : saving ? t('project.saving') : t('project.save')}
        </button>
      </div>
    </div>
  );
}

/* ─── Models list ─────────────────────────────────────────────────────────── */
const ALL_MODELS = [
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT OSS 20B',
    desc: 'Fast open-weight model for coding and general tasks',
    rpm: 30, tpm: 2000, dailyTokens: 200000, contextWindow: 131072,
    usageWeight: 0.35,
  },
  {
    id: 'allam-2-7b',
    name: 'Allam 2 7B',
    desc: 'Fast lightweight model for quick responses',
    rpm: 30, tpm: 30000, dailyTokens: 500000, contextWindow: 131072,
    usageWeight: 0.08,
  },
  {
    id: 'qwen/qwen3.8-27b',
    name: 'Qwen3.8 27B',
    desc: 'Vision-capable model for image understanding and multimodal tasks',
    rpm: 30, tpm: 6000, dailyTokens: 200000, contextWindow: 131072,
    usageWeight: 0.10,
  },
  {
    id: 'groq/compound-mini',
    name: 'Compound Mini',
    desc: 'Versatile model for coding, reasoning, and chat',
    rpm: 30, tpm: 6000, dailyTokens: 100000, contextWindow: 131072,
    usageWeight: 0.12,
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT OSS 120B',
    desc: 'High-capacity model for advanced reasoning and chat',
    rpm: 30, tpm: 6000, dailyTokens: 100000, contextWindow: 131072,
    usageWeight: 0.12,
  },
  {
    id: 'black-forest-labs/FLUX.1-schnell',
    name: 'FLUX.1 Schnell',
    desc: 'Image generation model • 10 images/month on Pro/Enterprise',
    rpm: 10, tpm: 0, dailyTokens: 1000, contextWindow: 0,
    usageWeight: 1,
  },
  {
    id: 'ppt-studio',
    name: 'NetRoot AI PPT Studio',
    desc: 'Executive 16:9 presentation generation & AI slide editing • ~850–1,200 tokens/deck',
    rpm: 20, tpm: 6000, dailyTokens: null, contextWindow: 131072,
    usageWeight: 0.15,
  },
];

function getVisibleModelIds(plan) {
  const normalizedPlan = normalizePlan(plan);
  const allowedModels = DEFAULT_PLAN_LIMITS[normalizedPlan]?.allowedModels || DEFAULT_PLAN_LIMITS.free.allowedModels;
  return ALL_MODELS.filter(m => allowedModels.includes(m.id)).map(m => m.id);
}

/* Limites tab  */
function LimitsTab({ darkMode, onUpgrade }) {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { plan } = usePlan();
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState(null);
  const [planLimits, setPlanLimits] = useState(DEFAULT_PLAN_LIMITS);
  const [allowedModels, setAllowedModels] = useState(() => getVisibleModelIds(plan));

  useEffect(() => {
    let cancelled = false;
    fetchPlanLimits().then((limits) => {
      if (!cancelled) setPlanLimits(limits);
    }).catch(() => { });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!session?.access_token) return;
    let cancelled = false;
    const loadUsage = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/my-usage?period=1d&_=${Date.now()}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: 'no-store',
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!cancelled) {
          setUsageData(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Usage fetch failed:', err);
          setLoading(false);
        }
      }
    };
    const refreshOnFocus = () => { loadUsage(); };
    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') loadUsage();
    };

    loadUsage();
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnVisible);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnVisible);
    };
  }, [session?.access_token]);

  useEffect(() => {
    setAllowedModels(getVisibleModelIds(plan));
  }, [plan, planLimits]);

  const perModelTokens = usageData?.perModelTokens || {};
  const perModelImages = usageData?.perModelImages || {};
  const imageUsageThisMonth = usageData?.imageUsageThisMonth ?? perModelImages['black-forest-labs/FLUX.1-schnell'] ?? 0;
  const activePlanLimits = planLimits[normalizePlan(plan)] || planLimits.free;
  const planLimit = activePlanLimits.dailyTokenLimit;
  const freeLimit = planLimits.free?.dailyTokenLimit || DEFAULT_PLAN_LIMITS.free.dailyTokenLimit;
  const freeModelsCount = planLimits.free?.allowedModels?.length || DEFAULT_PLAN_LIMITS.free.allowedModels.length;
  const proLimit = planLimits.pro?.dailyTokenLimit || DEFAULT_PLAN_LIMITS.pro.dailyTokenLimit;
  const proModelsCount = planLimits.pro?.allowedModels?.length || DEFAULT_PLAN_LIMITS.pro.allowedModels.length;

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('project.modelRateLimits')}
          </h3>
          <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {plan === 'pro'
              ? t('project.proIncludesLimits', { tokens: proLimit.toLocaleString(), models: proModelsCount })
              : t('project.freeIncludesLimits', {
                  tokens: freeLimit.toLocaleString(),
                  models: freeModelsCount,
                  proTokens: proLimit.toLocaleString(),
                  proModels: proModelsCount,
                })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {plan !== 'free' && (
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full border ${plan === 'enterprise'
                ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                }`}
            >
              {plan === 'enterprise' ? '⚡ Enterprise' : '⭐ Pro'}
            </span>
          )}

          <button
            onClick={() => setModalMode('allow-block')}
            className={`shrink-0 text-sm font-medium rounded-lg px-4 py-2 border transition-colors ${darkMode
              ? 'bg-[#2a2a2a] hover:bg-[#333] border-[#3a3a3a] text-white'
              : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800'
              }`}
          >
            {t('project.allowBlockModels')}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-5 flex-wrap">
        {[
          ['bg-emerald-500', t('project.under60')],
          ['bg-yellow-500', '60–85%'],
          ['bg-red-500', t('project.over85')],
          ['bg-red-700', t('project.fullyBlocked')],
        ].map(([cls, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${cls}`} />
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {label}
            </span>
          </div>
        ))}

        {loading && (
          <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
            {t('project.loadingUsage')}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {ALL_MODELS.filter(m => allowedModels.includes(m.id)).map(model => {
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

          return (
            <div
              key={model.id}
              className={`border rounded-xl overflow-hidden relative ${isBlocked
                ? darkMode
                  ? 'border-red-900/60 bg-[#161616]'
                  : 'border-red-200 bg-white'
                : darkMode
                  ? 'border-[#2a2a2a] bg-[#161616]'
                  : 'border-gray-200 bg-white'
                }`}
            >
              {isBlocked && (
                <div
                  className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl backdrop-blur-[2px] ${darkMode ? 'bg-[#0e0e0e]/80' : 'bg-white/85'
                    }`}
                >
                  <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-red-400" />
                  </div>

                  <div className="text-center">
                    <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {t('project.dailyLimitReached')}
                    </p>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {t(isFlux ? 'project.modelBlockedUntilMonth' : 'project.modelBlockedUntilMidnight', { model: model.name })}
                    </p>
                  </div>

                  <button
                    onClick={onUpgrade}
                    className="flex items-center gap-1.5 text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white px-5 py-2 rounded-lg transition-all shadow-lg"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {t('project.upgradeUnlock')}
                  </button>
                </div>
              )}

              <div className={`px-5 pt-4 pb-3 ${isBlocked ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${darkMode ? 'bg-[#222]' : 'bg-gray-100'}`}>
                      {model.id === 'ppt-studio' ? (
                        <Presentation
                          className={`w-4 h-4 ${isBlocked
                            ? 'text-red-600'
                            : isOver
                              ? 'text-red-400'
                              : isWarn
                                ? 'text-yellow-400'
                                : darkMode
                                  ? 'text-blue-400'
                                  : 'text-blue-600'
                            }`}
                        />
                      ) : (
                        <Cpu
                          className={`w-4 h-4 ${isBlocked
                            ? 'text-red-600'
                            : isOver
                              ? 'text-red-400'
                              : isWarn
                                ? 'text-yellow-400'
                                : darkMode
                                  ? 'text-gray-400'
                                  : 'text-gray-500'
                            }`}
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {model.name}
                        </span>

                        {isBlocked && (
                          <span className="text-xs bg-red-700/20 text-red-500 border border-red-700/40 rounded-full px-2 py-0.5 font-medium">
                            {t('project.blocked')}
                          </span>
                        )}

                        {isOver && (
                          <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/25 rounded-full px-2 py-0.5 font-medium">
                            {t('project.limitReached')}
                          </span>
                        )}

                        {isWarn && (
                          <span className="text-xs bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 rounded-full px-2 py-0.5 font-medium">
                            {t('project.nearLimit')}
                          </span>
                        )}
                      </div>

                      <p className={`text-xs mt-0.5 truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
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
                        {t(isFlux ? 'project.imagesThisMonth' : 'project.dailyTokens')}
                      </span>

                      <span
                        className={`text-xs font-mono ${isBlocked
                          ? 'text-red-500'
                          : isOver
                            ? 'text-red-400'
                            : isWarn
                              ? 'text-yellow-400'
                              : darkMode
                                ? 'text-gray-400'
                                : 'text-gray-500'
                          }`}
                      >
                        {usedValue.toLocaleString()} / {effectiveLimit.toLocaleString()} ({dailyPct}%)
                      </span>
                    </div>

                    <div className={`h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
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
                <div className={`px-5 py-3 border-t flex items-center gap-3 ${darkMode ? 'border-[#2a2a2a] bg-red-500/5' : 'border-red-100 bg-red-50'}`}>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className={`text-xs font-medium ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{t(isFlux ? 'project.monthlyLimitUpgrade' : 'project.dailyLimitUpgrade')}</span>
                </div>
              )}
              {!isBlocked && isWarn && (
                <div className={`px-5 py-3 border-t flex items-center gap-3 ${darkMode ? 'border-[#2a2a2a] bg-yellow-500/5' : 'border-yellow-100 bg-yellow-50'}`}>
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  <span className={`text-xs font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>{t(isFlux ? 'project.approachingMonthlyLimit' : 'project.approachingDailyLimit')}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modalMode && (
        <ModelSelectModal
          darkMode={darkMode}
          mode={modalMode}
          selected={allowedModels}
          onSave={ids => {
            setAllowedModels(ids);
            setModalMode(null);
          }}
          onClose={() => setModalMode(null)}
        />
      )}
    </div>
  );
}

function StatPill({ label, value, darkMode }) {
  return (
    <div
      className={`flex items-center gap-1 text-xs border rounded-lg px-2.5 py-1 ${darkMode
        ? 'border-[#2e2e2e] bg-[#1e1e1e] text-gray-400'
        : 'border-gray-200 bg-gray-50 text-gray-500'
        }`}
    >
      <span className={`font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        {label}
      </span>
      <span className={`font-mono ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {value}
      </span>
    </div>
  );
}

/* ─── Model Select Modal ──────────────────────────────────────────────────── */
function ModelSelectModal({ darkMode, mode, selected, onSave, onClose }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState(selected);

  const filtered = ALL_MODELS.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.desc.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id) {
    setDraft(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function selectAll() { setDraft(ALL_MODELS.map(m => m.id)); }
  function clearAll() { setDraft([]); }

  const title = mode === 'allow-block' ? t('project.allowBlockModels') : t('project.rateLimitModels');
  const subtitle = mode === 'allow-block'
    ? t('project.chooseAllowedModels')
    : t('project.chooseRateLimitedModels');

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-lg rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] ${darkMode ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
        <div className={`flex items-center justify-between px-6 pt-6 pb-4 border-b ${darkMode ? 'border-[#222]' : 'border-gray-200'}`}>
          <div>
            <h3 className={`font-semibold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className={`px-6 py-3 border-b ${darkMode ? 'border-[#222]' : 'border-gray-200'}`}>
          <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 mb-3 ${darkMode ? 'bg-[#1e1e1e] border-[#2e2e2e]' : 'bg-gray-50 border-gray-300'}`}>
            <Search className={`w-4 h-4 shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('project.searchModels')}
              className={`bg-transparent outline-none text-sm flex-1 ${darkMode ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {t('project.selectModelCount', { selected: draft.length, total: ALL_MODELS.length })}
            </span>
            <div className="flex gap-3">
              <button onClick={selectAll} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">{t('project.selectAll')}</button>
              <button onClick={clearAll} className={`text-xs transition-colors ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}>{t('project.clearAll')}</button>
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
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors text-left ${checked
                  ? darkMode ? 'bg-blue-500/10' : 'bg-blue-50'
                  : darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                  }`}
              >
                <div className={`w-5 h-5 rounded border shrink-0 flex items-center justify-center transition-all ${checked
                  ? 'bg-blue-500 border-blue-500'
                  : darkMode ? 'border-[#3a3a3a]' : 'border-gray-300'
                  }`}>
                  {checked && <Check className="w-3 h-3 text-white" />}
                </div>

                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${checked
                  ? 'bg-blue-500/20'
                  : darkMode ? 'bg-[#222]' : 'bg-gray-100'
                  }`}>
                  <Cpu className={`w-4 h-4 ${checked ? 'text-blue-400' : darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${checked ? darkMode ? 'text-white' : 'text-gray-900' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {model.name}
                  </p>
                  <p className={`text-xs truncate ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{model.desc}</p>
                </div>

                {checked && (
                  <span className="shrink-0 text-xs bg-blue-500/15 text-blue-400 border border-blue-500/25 rounded-full px-2 py-0.5 font-medium">
                    {mode === 'allow-block' ? t('project.allowed') : t('project.limited')}
                  </span>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className={`text-sm text-center py-10 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{t('project.noModelsMatch')}</p>
          )}
        </div>

        <div className={`flex items-center justify-between px-6 py-4 border-t ${darkMode ? 'border-[#222]' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`text-sm px-4 py-2 rounded-lg border transition-colors ${darkMode ? 'border-[#3a3a3a] text-gray-400 hover:text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            {t('project.cancel')}
          </button>
          <button
            onClick={() => onSave(draft)}
            className="text-sm font-medium bg-white hover:bg-gray-100 text-black px-5 py-2 rounded-lg transition-colors"
          >
            {t('project.saveChanges')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Members ─────────────────────────────────────────────────────────────── */
function MembersTab({ darkMode }) {
  const { user, profile } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');

  const name = profile?.full_name || 'You';
  const email = user?.email || '';

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${darkMode ? 'bg-[#222] border-[#333]' : 'bg-white border-gray-300'}`}>
            <Search className={`w-4 h-4 shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search members..."
              className={`bg-transparent outline-none text-sm w-40 ${darkMode ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
            />
          </div>
          {/* Filter pills */}
          <div className={`flex items-center gap-0 border rounded-lg overflow-hidden ${darkMode ? 'border-[#333]' : 'border-gray-300'}`}>
            {(['all', 'users', 'service-accounts']).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-sm px-4 py-2 capitalize transition-colors ${filter === f
                  ? darkMode ? 'bg-[#333] text-white font-medium' : 'bg-gray-200 text-gray-900 font-medium'
                  : darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-[#2a2a2a]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {f === 'service-accounts' ? 'Service accounts' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className={`flex items-center gap-2 text-sm border rounded-lg px-4 py-2 transition-colors ${darkMode ? 'bg-[#2a2a2a] border-[#3a3a3a] text-white hover:bg-[#333]' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className={`flex items-center gap-2 text-sm border rounded-lg px-4 py-2 transition-colors ${darkMode ? 'bg-[#2a2a2a] border-[#3a3a3a] text-white hover:bg-[#333]' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            <Plus className="w-4 h-4" />
            Service account
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 text-sm font-medium bg-white hover:bg-gray-100 text-black rounded-lg px-4 py-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add member
          </button>
        </div>
      </div>

      {/* Two-pane layout */}
      <div className="flex gap-0">
        {/* Member list */}
        <div className={`flex-1 border rounded-xl overflow-hidden ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
          <div
            onClick={() => setSelectedMember('owner')}
            className={`flex items-center justify-between px-5 py-4 cursor-pointer transition-colors ${selectedMember === 'owner'
              ? darkMode ? 'bg-[#2a2a2a]' : 'bg-blue-50'
              : darkMode ? 'hover:bg-[#222]' : 'hover:bg-gray-50'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {name[0]?.toUpperCase() ?? 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{name}</span>
                  <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/25 rounded px-1.5 py-0.5 font-medium">{t('project.you')}</span>
                  <span className={`text-xs border rounded px-2 py-0.5 font-medium ${darkMode ? 'border-[#3a3a3a] text-gray-300' : 'border-gray-300 text-gray-600'}`}>{t('project.organizationOwner')}</span>
                </div>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <button className={`text-sm border rounded-lg px-4 py-1.5 transition-colors ${darkMode ? 'border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a]' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                Leave
              </button>
              <button className={`flex items-center gap-1.5 text-sm border rounded-lg px-4 py-1.5 transition-colors ${darkMode ? 'border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a]' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                <PenSquare className="w-3.5 h-3.5" />
                Roles
              </button>
            </div>
          </div>
        </div>

        {/* Detail pane */}
        <div className={`w-72 flex items-center justify-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {selectedMember ? (
            <div className={`p-6 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <p className="font-semibold">{name}</p>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{email}</p>
              <p className="text-xs mt-3 text-green-400">{t('project.organizationOwner')}</p>
            </div>
          ) : (
            <p className="text-sm font-semibold">{t('project.selectMember')}</p>
          )}
        </div>
      </div>

      {/* Add member modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`w-full max-w-md mx-4 border rounded-2xl p-6 shadow-2xl ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
            <h3 className={`font-semibold text-lg mb-5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('project.addMember')}</h3>
            <div className="space-y-4">
              <Field label={t('common.email')} darkMode={darkMode}>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@example.com" className={inputCls(darkMode)} />
              </Field>
              <Field label={t('project.role')} darkMode={darkMode}>
                <div className="relative">
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className={`${inputCls(darkMode)} appearance-none cursor-pointer`}>
                    <option value="Owner">{t('project.owner')}</option>
                    <option value="Member">{t('project.member')}</option>
                    <option value="Viewer">{t('project.viewer')}</option>
                  </select>
                  <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                </div>
              </Field>
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <button onClick={() => setShowAddModal(false)} className={`text-sm px-4 py-2 rounded-lg border transition-colors ${darkMode ? 'border-[#3a3a3a] text-gray-400 hover:text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>{t('common.cancel')}</button>
              <button
                onClick={() => { if (inviteEmail) setShowAddModal(false); }}
                className="text-sm font-medium bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg transition-colors"
              >
                Send invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Groups ──────────────────────────────────────────────────────────────── */
function GroupsTab({ darkMode }) {
  const [search, setSearch] = useState('');

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${darkMode ? 'bg-[#222] border-[#333]' : 'bg-white border-gray-300'}`}>
          <Search className={`w-4 h-4 shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search groups..."
            className={`bg-transparent outline-none text-sm w-44 ${darkMode ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
          />
        </div>
        <button className="flex items-center gap-2 text-sm font-medium bg-white hover:bg-gray-100 text-black rounded-lg px-4 py-2 transition-colors">
          <Plus className="w-4 h-4" />
          Add group
        </button>
      </div>

      <div className={`border rounded-xl flex flex-col items-center justify-center py-28 ${darkMode ? 'border-[#2a2a2a] bg-[#161616]' : 'border-gray-200 bg-white'}`}>
        <p className={`text-base font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('project.noGroups')}</p>
        <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{t('project.addGroupDescription')}</p>
      </div>
    </div>
  );
}

/* ─── Roles ───────────────────────────────────────────────────────────────── */
const PRESET_ROLES = [
  { letter: 'O', name: 'Owner', desc: 'Full control: can manage project settings and members.' },
  { letter: 'V', name: 'Viewer', desc: 'Viewer role for project' },
  { letter: 'M', name: 'Member', desc: 'Can read/write data. No direct member-management controls.' },
];

function RolesTab({ darkMode }) {
  const [search, setSearch] = useState('');

  const filtered = PRESET_ROLES.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${darkMode ? 'bg-[#222] border-[#333]' : 'bg-white border-gray-300'}`}>
          <Search className={`w-4 h-4 shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search roles..."
            className={`bg-transparent outline-none text-sm w-44 ${darkMode ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
          />
        </div>
        <button className="flex items-center gap-2 text-sm font-medium bg-white hover:bg-gray-100 text-black rounded-lg px-4 py-2 transition-colors">
          <Plus className="w-4 h-4" />
          Create role
        </button>
      </div>

      <div className={`border rounded-xl divide-y overflow-hidden ${darkMode ? 'border-[#2a2a2a] divide-[#2a2a2a]' : 'border-gray-200 divide-gray-200'}`}>
        {filtered.map(role => (
          <div key={role.name} className={`flex items-center gap-4 px-5 py-5 ${darkMode ? 'bg-[#161616] hover:bg-[#1e1e1e]' : 'bg-white hover:bg-gray-50'} transition-colors`}>
            <div className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm font-semibold shrink-0 ${darkMode ? 'border-[#3a3a3a] text-gray-300 bg-[#222]' : 'border-gray-300 text-gray-700 bg-gray-100'}`}>
              {role.letter}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{role.name}</span>
                <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/25 rounded px-1.5 py-0.5 font-medium">{t('project.preset')}</span>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{role.desc}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className={`text-sm border rounded-lg px-4 py-1.5 font-medium transition-colors ${darkMode ? 'bg-[#2a2a2a] border-[#3a3a3a] text-white hover:bg-[#333]' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'}`}>
                Assignments
              </button>
              <button className={`text-sm border rounded-lg px-4 py-1.5 font-medium transition-colors ${darkMode ? 'border-[#3a3a3a] text-white hover:bg-[#2a2a2a]' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                Permissions
              </button>
              <button className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${darkMode ? 'text-gray-500 hover:text-white hover:bg-[#2a2a2a]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Webhooks ────────────────────────────────────────────────────────────── */
function WebhooksTab({ darkMode }) {
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState(['response.completed']);
  const allEvents = ['response.completed', 'response.failed', 'run.completed', 'run.failed', 'thread.created'];

  function toggleEvent(e) {
    setEvents(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  }

  return (
    <div className="space-y-8 max-w-lg">
      <Field label="Endpoint URL" desc="The HTTPS URL that will receive webhook events." darkMode={darkMode}>
        <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://yourapp.com/webhooks" className={inputCls(darkMode)} />
      </Field>
      <div>
        <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('project.eventsToSend')}</label>
        <div className="space-y-2.5">
          {allEvents.map(e => (
            <label key={e} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleEvent(e)}>
              <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${events.includes(e) ? 'bg-[#3b82f6] border-[#3b82f6]' : darkMode ? 'border-[#3a3a3a] group-hover:border-[#4a4a4a]' : 'border-gray-300 group-hover:border-gray-400'}`}>
                {events.includes(e) && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              <span className={`text-sm font-mono ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{e}</span>
            </label>
          ))}
        </div>
      </div>
      <button disabled={!url} className="flex items-center gap-2 bg-white hover:bg-gray-100 disabled:opacity-40 text-black font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
        Add webhook
      </button>
    </div>
  );
}

/* ─── Evaluations ─────────────────────────────────────────────────────────── */
function EvaluationsTab({ darkMode }) {
  return (
    <div className={`flex flex-col items-center justify-center py-28 text-center border rounded-xl ${darkMode ? 'border-[#2a2a2a] bg-[#161616]' : 'border-gray-200 bg-white'}`}>
      <Users className={`w-10 h-10 mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
      <p className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('project.evaluations')}</p>
      <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{t('project.evaluationsDescription')}</p>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function Field({ label, desc, children, darkMode }) {
  return (
    <div>
      <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{label}</label>
      {desc && <p className={`text-xs mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{desc}</p>}
      {children}
    </div>
  );
}

function inputCls(darkMode) {
  return `w-full border rounded-lg px-4 py-2.5 outline-none transition-colors text-sm ${darkMode
    ? 'bg-[#1e1e1e] border-[#2e2e2e] focus:border-[#3e3e3e] text-white placeholder-gray-600'
    : 'bg-white border-gray-300 focus:border-gray-400 text-gray-900 placeholder-gray-400'
    }`;
}
