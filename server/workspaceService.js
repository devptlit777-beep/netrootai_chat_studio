import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { isModelFree, getUserWallet, deductUserWallet } from './walletService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_FILE = join(__dirname, 'workspaceData.json');

// Default initial state matching OpenRouter Workspace spec
function getDefaultWorkspaceData() {
  const now = new Date().toISOString();
  return {
    workspaces: [
      {
        id: 'ws_default',
        name: 'Default Workspace',
        slug: 'default-workspace',
        description: 'Default workspace for API keys, routing rules, privacy settings, and configurations.',
        created_at: '2026-10-01T00:00:00.000Z',
        environment: 'production',
        is_default: true,
      },
    ],
    activeWorkspaceId: 'ws_default',
    userActiveWorkspaces: {},
    byokByWorkspace: {},
    apiKeys: [
      {
        id: 'key_prod_01',
        workspace_id: 'ws_default',
        owner_email: 'admin@netrootai.tech',
        name: 'Default Production App Key',
        key_masked: 'nr-live-8f92a1•••••••••••••2c4',
        key_hash: crypto.createHash('sha256').update('nr-live-8f92a10c74de489b9102c401aa94c2').digest('hex'),
        created_at: '2026-10-15T12:00:00.000Z',
        last_used_at: '2026-10-21T05:01:12.000Z',
        monthly_limit_usd: 100,
        current_spend_usd: 1.48,
        status: 'active',
        allowed_models: [],
      },
    ],
    thisWeekUsage: {
      spend_usd: 1.48,
      requests_count: 32,
      tokens_count: 84200,
      last_updated: now,
    },
    activityTimeseries: [
      { date: '2026-10-15', spend_usd: 0.12, requests: 3, tokens: 6800 },
      { date: '2026-10-16', spend_usd: 0.24, requests: 5, tokens: 14200 },
      { date: '2026-10-17', spend_usd: 0.08, requests: 2, tokens: 4900 },
      { date: '2026-10-18', spend_usd: 0.35, requests: 7, tokens: 21500 },
      { date: '2026-10-19', spend_usd: 0.19, requests: 4, tokens: 11200 },
      { date: '2026-10-20', spend_usd: 0.32, requests: 6, tokens: 16800 },
      { date: '2026-10-21', spend_usd: 0.18, requests: 5, tokens: 8800 },
    ],
    logs: [
      {
        id: 'log_001',
        workspace_id: 'ws_default',
        timestamp: '2026-10-21T05:01:12.000Z',
        key_name: 'Default Production App Key',
        key_id: 'key_prod_01',
        model: 'liquid/lfm-2.5-2.6b:free',
        provider: 'Liquid',
        status: 200,
        latency_ms: 342,
        prompt_tokens: 38,
        completion_tokens: 64,
        total_tokens: 102,
        cost_usd: 0.00,
        profit_usd: 0.00,
        client_ip: '127.0.0.1',
      },
      {
        id: 'log_002',
        workspace_id: 'ws_default',
        timestamp: '2026-10-20T21:14:05.000Z',
        key_name: 'Default Production App Key',
        key_id: 'key_prod_01',
        model: 'deepseek/deepseek-chat',
        provider: 'DeepSeek',
        status: 200,
        latency_ms: 618,
        prompt_tokens: 280,
        completion_tokens: 140,
        total_tokens: 420,
        cost_usd: 0.00042,
        profit_usd: 0.00008,
        client_ip: '127.0.0.1',
      },
      {
        id: 'log_003',
        workspace_id: 'ws_default',
        timestamp: '2026-10-20T18:22:40.000Z',
        key_name: 'Default Production App Key',
        key_id: 'key_prod_01',
        model: 'minimax/minimax-m3.1-flash:free',
        provider: 'MiniMax',
        status: 200,
        latency_ms: 480,
        prompt_tokens: 110,
        completion_tokens: 215,
        total_tokens: 325,
        cost_usd: 0.00,
        profit_usd: 0.00,
        client_ip: '127.0.0.1',
      },
    ],
    guardrails: {
      monthly_budget_cap_usd: 250,
      alert_threshold_pct: 80,
      rate_limit_rpm: 60,
      pii_masking_enabled: true,
      toxicity_filter_enabled: true,
      blocked_providers: [],
      disallowed_models: [],
    },
    byok: {
      openai: { configured: false, key_masked: '' },
      anthropic: { configured: false, key_masked: '' },
      google: { configured: false, key_masked: '' },
      groq: { configured: false, key_masked: '' },
      openrouter: {
        configured: true,
        key_masked: 'sk-or-v1-f78•••••••••••••••6ecd8ac',
      },
    },
    routing: {
      strategy: 'latency', // 'latency' | 'cost' | 'throughput'
      fallbacks: [
        {
          id: 'fb_1',
          primary: 'anthropic/claude-3.5-sonnet',
          fallback: 'deepseek/deepseek-chat',
        },
      ],
      retry_count: 2,
    },
    presets: [
      {
        id: 'preset_1',
        name: 'Concise Support Agent',
        description: 'For customer service chatbots needing crisp, accurate answers.',
        system_prompt: 'You are an intelligent customer support assistant for NetRoot AI. Answer questions clearly, accurately, and politely. Keep explanations concise.',
        temperature: 0.3,
        max_tokens: 1000,
      },
      {
        id: 'preset_2',
        name: 'Full-Stack Developer',
        description: 'Optimized for writing clean, tested, production-grade code.',
        system_prompt: 'You are a senior principal software engineer. Provide robust, bug-free, and well-typed code. Explain edge cases and design considerations.',
        temperature: 0.2,
        max_tokens: 4096,
      },
    ],
    observability: {
      langfuse_enabled: false,
      langfuse_public_key: '',
      datadog_enabled: false,
      datadog_api_key: '',
    },
    profit_margin_pct: 20, // NetRoot AI markup: 20%
  };
}

let cachedModelsList = null;
let lastModelsCacheRead = 0;

function getCachedModels() {
  const now = Date.now();
  if (cachedModelsList && (now - lastModelsCacheRead < 60000)) {
    return cachedModelsList;
  }
  try {
    const cachePath = join(__dirname, 'modelsCache.json');
    if (existsSync(cachePath)) {
      cachedModelsList = JSON.parse(readFileSync(cachePath, 'utf8'));
      lastModelsCacheRead = now;
      return cachedModelsList;
    }
  } catch (e) {
    console.error('[workspaceService] Error reading modelsCache.json:', e);
  }
  return [];
}

export function calculateModelCost(modelId, promptTokens = 0, completionTokens = 0, marginPct = 20) {
  const totalTokens = (promptTokens || 0) + (completionTokens || 0);
  if (!modelId || totalTokens <= 0) {
    return { isFree: true, baseCost: 0, netrootProfit: 0, billedCost: 0 };
  }

  const isFreeTag = modelId.endsWith(':free') || 
                    modelId === 'openai/gpt-oss-20b' || 
                    modelId === 'allam-2-7b' || 
                    modelId.startsWith('qwen/qwen3.8-27b') || 
                    modelId.startsWith('qwen/qwen3.6-27b') ||
                    modelId === 'ppt-studio';

  const models = getCachedModels();
  const found = models.find(m => m.id === modelId || m.id?.toLowerCase() === modelId?.toLowerCase());

  if (found?.is_free || (found?.calculated_pricing?.prompt === 0 && found?.calculated_pricing?.completion === 0) || isFreeTag) {
    return { isFree: true, baseCost: 0, netrootProfit: 0, billedCost: 0 };
  }

  const promptRate = found?.base_pricing?.prompt ?? (found?.calculated_pricing?.prompt ? found.calculated_pricing.prompt / 1.2 : 1.5e-6);
  const compRate = found?.base_pricing?.completion ?? (found?.calculated_pricing?.completion ? found.calculated_pricing.completion / 1.2 : 2.0e-6);

  const baseCost = (promptTokens * promptRate) + (completionTokens * compRate);
  const netrootProfit = baseCost * (marginPct / 100);
  const billedCost = baseCost + netrootProfit;

  return {
    isFree: false,
    baseCost: Number(baseCost.toFixed(6)),
    netrootProfit: Number(netrootProfit.toFixed(6)),
    billedCost: Number(billedCost.toFixed(6)),
  };
}

function checkAndApplyCycles(data) {
  if (!data) return;
  const now = new Date();

  // Weekly reset check for thisWeekUsage (Sunday midnight boundary)
  if (data.thisWeekUsage?.last_updated) {
    const lastDate = new Date(data.thisWeekUsage.last_updated);
    const currentWeekStart = new Date(now);
    currentWeekStart.setUTCHours(0, 0, 0, 0);
    currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() - currentWeekStart.getUTCDay());

    if (lastDate < currentWeekStart) {
      data.thisWeekUsage = {
        spend_usd: 0.00,
        requests_count: 0,
        tokens_count: 0,
        last_updated: now.toISOString(),
      };
    }
  }

  // Monthly reset check for API keys (1st of calendar month boundary)
  if (Array.isArray(data.apiKeys)) {
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();
    for (const key of data.apiKeys) {
      if (key.last_used_at) {
        const lastUsed = new Date(key.last_used_at);
        if (lastUsed.getUTCFullYear() < currentYear || lastUsed.getUTCMonth() < currentMonth) {
          key.current_spend_usd = 0.00;
        }
      }
    }
  }
}

function loadData() {
  try {
    if (!existsSync(DATA_FILE)) {
      const initial = getDefaultWorkspaceData();
      saveData(initial);
      return initial;
    }
    const raw = readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    checkAndApplyCycles(data);
    return data;
  } catch (err) {
    console.error('[workspaceService] Error loading data, using defaults:', err.message);
    return getDefaultWorkspaceData();
  }
}

function saveData(data) {
  try {
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[workspaceService] Error saving data:', err.message);
  }
}

// ── Service API ─────────────────────────────────────────────────────────────

export function resolveUserWorkspace(data, userEmail, userId, preferredWsId) {
  const normEmail = (userEmail || '').trim().toLowerCase();
  data.workspaces = data.workspaces || [];

  // 1. If preferredWsId is explicitly passed, verify access
  if (preferredWsId) {
    const found = data.workspaces.find(w => w.id === preferredWsId);
    if (found) {
      if (!normEmail) return found;
      if (found.owner_email && found.owner_email.toLowerCase() === normEmail) return found;
      if (userId && found.user_id && found.user_id === userId) return found;
      const isMember = (data.members || []).some(m => m.workspace_id === found.id && m.email?.toLowerCase() === normEmail);
      if (isMember) return found;
    }
  }

  // 2. Check user's saved active workspace mapping
  data.userActiveWorkspaces = data.userActiveWorkspaces || {};
  if (normEmail && data.userActiveWorkspaces[normEmail]) {
    const savedId = data.userActiveWorkspaces[normEmail];
    const ws = data.workspaces.find(w => w.id === savedId);
    if (ws) return ws;
  }

  // 3. Find any workspace owned by this user
  if (normEmail) {
    const owned = data.workspaces.find(w => w.owner_email && w.owner_email.toLowerCase() === normEmail);
    if (owned) {
      data.userActiveWorkspaces[normEmail] = owned.id;
      return owned;
    }
  }

  // 4. Auto-initialize personal workspace if user is identified
  if (normEmail) {
    const newWsId = `ws_${crypto.randomBytes(6).toString('hex')}`;
    const userWs = {
      id: newWsId,
      owner_email: normEmail,
      user_id: userId || null,
      name: 'Personal Workspace',
      slug: 'personal-workspace',
      description: 'Your private workspace for API keys, routing rules, guardrails, and configurations.',
      created_at: new Date().toISOString(),
      environment: 'production',
      is_default: true,
    };
    data.workspaces.push(userWs);
    data.members = data.members || [];
    data.members.push({
      id: `mem_${crypto.randomBytes(6).toString('hex')}`,
      workspace_id: newWsId,
      email: normEmail,
      role: 'owner',
      status: 'active',
      created_at: new Date().toISOString(),
    });
    data.userActiveWorkspaces[normEmail] = newWsId;
    saveData(data);
    return userWs;
  }

  // 5. Fallback for unauthenticated/demo
  return data.workspaces[0] || {
    id: 'ws_default',
    name: 'Default Workspace',
    slug: 'default-workspace',
    description: 'Default developer workspace',
    created_at: new Date().toISOString(),
    environment: 'production',
    is_default: true,
  };
}

export function getWorkspaces(userEmail, userId) {
  const data = loadData();
  const normalizedUserEmail = (userEmail || '').toLowerCase().trim();
  let allWorkspaces = data.workspaces || [];

  data.userActiveWorkspaces = data.userActiveWorkspaces || {};

  if (normalizedUserEmail) {
    const memberEntries = (data.members || []).filter(m => m.email && m.email.toLowerCase() === normalizedUserEmail);
    let userWorkspaces = allWorkspaces.filter(w => {
      if (w.owner_email && w.owner_email.toLowerCase() === normalizedUserEmail) return true;
      if (userId && w.user_id && w.user_id === userId) return true;
      return memberEntries.some(m => m.workspace_id === w.id);
    });

    if (userWorkspaces.length === 0) {
      const userWs = resolveUserWorkspace(data, normalizedUserEmail, userId);
      userWorkspaces = [userWs];
    }

    const activeId = data.userActiveWorkspaces[normalizedUserEmail] || userWorkspaces[0]?.id;
    return {
      workspaces: userWorkspaces.map(w => {
        const mem = memberEntries.find(m => m.workspace_id === w.id);
        return {
          ...w,
          member_role: mem?.role || (w.owner_email?.toLowerCase() === normalizedUserEmail ? 'owner' : 'member'),
          is_shared: Boolean(mem && w.owner_email?.toLowerCase() !== normalizedUserEmail),
        };
      }),
      activeWorkspaceId: activeId,
    };
  }

  return {
    workspaces: allWorkspaces,
    activeWorkspaceId: data.activeWorkspaceId || 'ws_default',
  };
}

export function setActiveWorkspace(workspaceId, userEmail) {
  const data = loadData();
  const normalizedUserEmail = (userEmail || '').toLowerCase().trim();
  const found = (data.workspaces || []).find(w => w.id === workspaceId);
  if (!found) throw new Error('Workspace not found.');

  if (normalizedUserEmail) {
    data.userActiveWorkspaces = data.userActiveWorkspaces || {};
    data.userActiveWorkspaces[normalizedUserEmail] = workspaceId;
  } else {
    data.activeWorkspaceId = workspaceId;
  }
  saveData(data);
  return found;
}

export function createWorkspace({ name, description, environment = 'production', userEmail, userId }) {
  const data = loadData();
  const normalizedUserEmail = (userEmail || '').toLowerCase().trim();
  const id = `ws_${crypto.randomBytes(6).toString('hex')}`;
  const slug = (name || 'Workspace').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const ws = {
    id,
    owner_email: normalizedUserEmail || null,
    user_id: userId || null,
    name: name?.trim() || 'Custom Workspace',
    slug,
    description: (description || '').trim(),
    created_at: new Date().toISOString(),
    environment,
    is_default: false,
  };
  data.workspaces = data.workspaces || [];
  data.workspaces.push(ws);
  if (normalizedUserEmail) {
    data.members = data.members || [];
    data.members.push({
      id: `mem_${crypto.randomBytes(6).toString('hex')}`,
      workspace_id: id,
      email: normalizedUserEmail,
      role: 'owner',
      status: 'active',
      created_at: new Date().toISOString(),
    });
    data.userActiveWorkspaces = data.userActiveWorkspaces || {};
    data.userActiveWorkspaces[normalizedUserEmail] = id;
  } else {
    data.activeWorkspaceId = id;
  }
  saveData(data);
  return ws;
}

export function getWorkspaceOverview(workspaceId, userEmail, userId) {
  const data = loadData();
  const ws = resolveUserWorkspace(data, userEmail, userId, workspaceId);
  const wsId = ws.id;
  const normEmail = (userEmail || '').toLowerCase().trim();

  const keys = (data.apiKeys || []).filter(k => {
    if (k.workspace_id !== wsId) return false;
    if (normEmail && k.owner_email && k.owner_email.toLowerCase() !== normEmail) return false;
    return true;
  });
  const logs = (data.logs || []).filter(l => l.workspace_id === wsId);

  return {
    workspace: ws,
    usageThisWeek: data.thisWeekUsage || { spend_usd: 0, requests_count: 0, tokens_count: 0 },
    stats: {
      totalKeys: keys.length,
      activeKeys: keys.filter(k => k.status === 'active').length,
      totalRequests: logs.length,
      totalSpend: (data.thisWeekUsage?.spend_usd || 0).toFixed(2),
      budgetCap: data.guardrails?.monthly_budget_cap_usd || 250,
      profitMarginPct: data.profit_margin_pct || 20,
    },
    guardrails: getGuardrails(wsId),
    routing: getRouting(wsId),
    presetsCount: (data.presets || []).length,
  };
}

export function getWorkspaceActivity(workspaceId, userEmail, userId) {
  const data = loadData();
  return {
    timeseries: data.activityTimeseries || [],
    thisWeek: data.thisWeekUsage || { spend_usd: 0, requests_count: 0, tokens_count: 0 },
    recentLogsCount: (data.logs || []).length,
  };
}

export function getApiKeys(workspaceId, userEmail, userId) {
  const data = loadData();
  const ws = resolveUserWorkspace(data, userEmail, userId, workspaceId);
  const wsId = ws.id;
  const normEmail = (userEmail || '').toLowerCase().trim();

  const keys = (data.apiKeys || [])
    .filter(k => {
      if (k.workspace_id !== wsId) return false;
      if (normEmail && k.owner_email && k.owner_email.toLowerCase() !== normEmail) return false;
      return true;
    })
    .map(k => ({
      id: k.id,
      name: k.name,
      key_masked: k.key_masked,
      created_at: k.created_at,
      last_used_at: k.last_used_at,
      monthly_limit_usd: k.monthly_limit_usd,
      current_spend_usd: k.current_spend_usd,
      status: k.status,
      allowed_models: k.allowed_models || [],
      owner_email: k.owner_email || null,
    }));
  return keys;
}

export function createApiKey({ workspaceId, name, monthly_limit_usd = 100, allowed_models = [], userEmail, userId }) {
  const data = loadData();
  const ws = resolveUserWorkspace(data, userEmail, userId, workspaceId);
  const wsId = ws.id;
  const normEmail = (userEmail || '').toLowerCase().trim();

  const rawHex = crypto.randomBytes(16).toString('hex');
  const fullSecret = `nr-live-${rawHex}`;
  const masked = `nr-live-${rawHex.slice(0, 6)}•••••••••••••${rawHex.slice(-4)}`;
  const hash = crypto.createHash('sha256').update(fullSecret).digest('hex');

  const newKey = {
    id: `key_${crypto.randomBytes(5).toString('hex')}`,
    workspace_id: wsId,
    owner_email: normEmail || null,
    user_id: userId || null,
    name: name?.trim() || 'API Key',
    key_masked: masked,
    key_hash: hash,
    created_at: new Date().toISOString(),
    last_used_at: null,
    monthly_limit_usd: Number(monthly_limit_usd) || 100,
    current_spend_usd: 0.00,
    status: 'active',
    allowed_models: Array.isArray(allowed_models) ? allowed_models : [],
  };

  data.apiKeys = data.apiKeys || [];
  data.apiKeys.unshift(newKey);
  saveData(data);

  return {
    id: newKey.id,
    name: newKey.name,
    key: fullSecret, // returned in full ONLY on creation response
    key_masked: masked,
    monthly_limit_usd: newKey.monthly_limit_usd,
    current_spend_usd: 0.00,
    allowed_models: newKey.allowed_models,
    last_used_at: null,
    status: newKey.status,
    created_at: newKey.created_at,
  };
}

export function deleteApiKey(keyId, userEmail, userId) {
  const data = loadData();
  const normEmail = (userEmail || '').toLowerCase().trim();
  const before = data.apiKeys?.length || 0;
  data.apiKeys = (data.apiKeys || []).filter(k => {
    if (k.id !== keyId) return true;
    if (normEmail && k.owner_email && k.owner_email.toLowerCase() !== normEmail) {
      return true; // Not owned by requesting user
    }
    return false;
  });
  saveData(data);
  return { success: true, deleted: data.apiKeys.length < before };
}

export function toggleApiKeyStatus(keyId, userEmail, userId) {
  const data = loadData();
  const normEmail = (userEmail || '').toLowerCase().trim();
  const key = (data.apiKeys || []).find(k => k.id === keyId);
  if (!key) throw new Error('API Key not found.');
  if (normEmail && key.owner_email && key.owner_email.toLowerCase() !== normEmail) {
    throw new Error('Permission denied: You do not own this API key.');
  }
  key.status = key.status === 'active' ? 'disabled' : 'active';
  saveData(data);
  return key;
}

export function getKeyAnalytics(workspaceId, keyId) {
  const data = loadData();
  const wsId = workspaceId || data.activeWorkspaceId || 'ws_default';
  const key = (data.apiKeys || []).find(k => k.id === keyId);
  if (!key) return null;

  const keyLogs = (data.logs || []).filter(l => l.key_id === keyId || l.key_name?.includes(key.name));

  const totalRequests = keyLogs.length;
  const totalTokens = keyLogs.reduce((s, l) => s + (l.total_tokens || 0), 0);
  const totalCost = keyLogs.reduce((s, l) => s + (l.cost_usd || 0), 0);
  const avgLatency = totalRequests > 0
    ? Math.round(keyLogs.reduce((s, l) => s + (l.latency_ms || 0), 0) / totalRequests)
    : 0;

  // Build daily timeline for last 7 days
  const daysMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    daysMap[d] = { date: d.slice(5), requests: 0, tokens: 0, spend: 0 };
  }

  for (const log of keyLogs) {
    const day = (log.timestamp || '').slice(0, 10);
    if (daysMap[day]) {
      daysMap[day].requests += 1;
      daysMap[day].tokens += (log.total_tokens || 0);
      daysMap[day].spend += Number((log.cost_usd || 0).toFixed(4));
    }
  }

  return {
    key: {
      id: key.id,
      name: key.name,
      key_masked: key.key_masked,
      created_at: key.created_at,
      last_used_at: key.last_used_at,
      monthly_limit_usd: key.monthly_limit_usd,
      current_spend_usd: key.current_spend_usd,
      status: key.status,
      allowed_models: key.allowed_models || [],
    },
    stats: {
      totalRequests,
      totalTokens,
      totalCost: Number(totalCost.toFixed(4)),
      currentSpend: Number((key.current_spend_usd || 0).toFixed(4)),
      monthlyLimit: key.monthly_limit_usd || 100,
      avgLatency,
    },
    timeseries: Object.values(daysMap),
    recentLogs: keyLogs.slice(0, 30),
  };
}

export function getLogs(workspaceId, { search = '', limit = 50, offset = 0, userEmail, userId } = {}) {
  const data = loadData();
  const ws = resolveUserWorkspace(data, userEmail, userId, workspaceId);
  const wsId = ws.id;
  let logs = (data.logs || []).filter(l => l.workspace_id === wsId);

  if (search) {
    const s = search.toLowerCase();
    logs = logs.filter(
      l =>
        l.model?.toLowerCase().includes(s) ||
        l.key_name?.toLowerCase().includes(s) ||
        String(l.status).includes(s)
    );
  }

  const total = logs.length;
  const paginated = logs.slice(offset, offset + limit);
  return { logs: paginated, total, limit, offset };
}
export const getWorkspaceLogs = getLogs;

export function getGuardrails(workspaceId) {
  const data = loadData();
  return data.guardrails || {};
}

export function updateGuardrails(workspaceId, updates) {
  const data = loadData();
  data.guardrails = { ...data.guardrails, ...updates };
  saveData(data);
  return data.guardrails;
}

/**
 * Mask Personally Identifiable Information (PII) and secret keys
 */
export function maskPiiData(text) {
  if (!text || typeof text !== 'string') return text;
  let masked = text;

  // 1. Credit Card Numbers (13 to 19 digits formatted or unformatted)
  masked = masked.replace(/\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9]{2})[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11}|(?:\d{4}[ -]?){3}\d{4})\b/g, '[CARD_REDACTED]');

  // 2. Email Addresses
  masked = masked.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');

  // 3. Phone Numbers (International and domestic formats)
  masked = masked.replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, (match) => {
    const digitsOnly = match.replace(/\D/g, '');
    if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
      return '[PHONE_REDACTED]';
    }
    return match;
  });

  // 4. API Keys & Secrets (OpenAI sk-, Groq gsk_, NetRoot nr-, Google AIza, GitHub ghp_, JWTs)
  masked = masked.replace(/\b(?:sk|gsk|nr-live|nr-test)-[a-zA-Z0-9_-]{20,}\b/g, '[API_KEY_REDACTED]');
  masked = masked.replace(/\bAIza[0-9A-Za-z-_]{35}\b/g, '[API_KEY_REDACTED]');
  masked = masked.replace(/\bghp_[a-zA-Z0-9]{36}\b/g, '[API_KEY_REDACTED]');
  masked = masked.replace(/\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g, '[JWT_TOKEN_REDACTED]');

  // 5. SSN / Tax IDs
  masked = masked.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');

  return masked;
}

/**
 * Automated Safety & Toxicity Filter
 */
const TOXIC_PATTERNS = [
  /\b(?:how to make|create|build)\s+(?:a\s+)?(?:bomb|explosive|dirty bomb|chemical weapon|biological weapon|nerve agent)\b/i,
  /\b(?:kill yourself|commit suicide|self-harm|how to hang yourself)\b/i,
  /\b(?:write|create|generate)\s+(?:a\s+)?(?:ransomware|trojan|keylogger|zero-day exploit|ddos botnet)\b/i,
  /\b(?:sql injection payload to drop|bypass authentication payload|steal credentials script)\b/i,
  /\b(?:ignore all previous instructions and|DAN mode enabled|Developer Mode Output:|bypass all safety rules)\b/i,
  /\b(?:child abuse|child exploitation|hate speech attack|exterminate all)\b/i,
];

export function checkWorkspaceToxicity(text) {
  if (!text || typeof text !== 'string') return { isToxic: false };
  for (const pattern of TOXIC_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isToxic: true,
        reason: 'Content violates enterprise safety, security, and anti-abuse policies.',
      };
    }
  }
  return { isToxic: false };
}

const workspaceRateLimitTracker = new Map();

/**
 * Rate limit requests per minute per workspace
 */
export function checkWorkspaceRateLimit(workspaceId, limitRpm = 60) {
  const wsId = workspaceId || 'ws_default';
  const rpm = Math.max(1, Number(limitRpm) || 60);
  const now = Date.now();
  const windowMs = 60000;

  let timestamps = workspaceRateLimitTracker.get(wsId) || [];
  timestamps = timestamps.filter(t => (now - t) < windowMs);

  if (timestamps.length >= rpm) {
    const oldest = timestamps[0];
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    return {
      allowed: false,
      currentRpm: timestamps.length,
      limitRpm: rpm,
      retryAfterSec,
      message: `Rate limit of ${rpm} requests per minute exceeded for this workspace. Please retry after ${retryAfterSec} seconds.`,
    };
  }

  timestamps.push(now);
  workspaceRateLimitTracker.set(wsId, timestamps);
  return { allowed: true, currentRpm: timestamps.length, limitRpm: rpm };
}

/**
 * Master Enterprise Guardrails Enforcement Engine
 * Applied universally across Developer Gateway and Chat Studio
 */
export function enforceWorkspaceGuardrails({
  workspaceId = 'ws_default',
  model,
  prompt = '',
  messages = [],
  userPlan = 'pro',
}) {
  const data = loadData();
  const guardrails = getGuardrails(workspaceId) || {};
  const monthlyCap = guardrails.monthly_budget_cap_usd || 250;

  // 1. Check Monthly Spending Budget Cap
  const currentSpend = data.thisWeekUsage?.spend_usd || 0;
  if (currentSpend >= monthlyCap) {
    return {
      blocked: true,
      status: 429,
      code: 'workspace_budget_exceeded',
      message: `Workspace monthly budget cap ($${monthlyCap}) has been reached. Please contact your workspace administrator or raise the budget cap in Guardrails.`,
    };
  }

  // 2. Check Rate Limit (RPM)
  const rateLimitRpm = guardrails.rate_limit_rpm || 60;
  const rateCheck = checkWorkspaceRateLimit(workspaceId, rateLimitRpm);
  if (!rateCheck.allowed) {
    return {
      blocked: true,
      status: 429,
      code: 'rate_limit_exceeded',
      message: rateCheck.message,
      retryAfterSec: rateCheck.retryAfterSec,
    };
  }

  // 3. Check Blocked Providers (Strict enterprise blocklist - NO BYOK BYPASS)
  const targetModel = (model || '').trim();
  const provider = (targetModel.split('/')[0] || '').toLowerCase().trim();
  const blockedProviders = (guardrails.blocked_providers || []).map(p => p.toLowerCase().trim());
  if (provider && blockedProviders.includes(provider)) {
    return {
      blocked: true,
      status: 403,
      code: 'provider_blocked',
      message: `Provider '${provider}' is restricted by workspace guardrails. All models from this provider are blocked across Gateway, Chat Studio, and BYOK.`,
    };
  }

  // 4. Check Disallowed Models (Strict model blocklist)
  const targetModelLower = targetModel.toLowerCase();
  const targetBaseSlug = targetModelLower.split(':')[0].replace(/-\d{8}$/, '');
  const targetShortSlug = targetModelLower.includes('/') ? targetModelLower.split('/')[1] : targetModelLower;
  const targetShortBase = targetBaseSlug.includes('/') ? targetBaseSlug.split('/')[1] : targetBaseSlug;

  const disallowedModels = (guardrails.disallowed_models || []).map(m => m.toLowerCase().trim());
  const isModelDisallowed = disallowedModels.some(dm => {
    const dmBase = dm.split(':')[0].replace(/-\d{8}$/, '');
    const dmShort = dm.includes('/') ? dm.split('/')[1] : dm;
    const dmShortBase = dmBase.includes('/') ? dmBase.split('/')[1] : dmBase;

    if (
      dm === targetModelLower ||
      dmBase === targetBaseSlug ||
      dmShort === targetShortSlug ||
      dmShortBase === targetShortBase ||
      targetModelLower.startsWith(dmBase + ':') ||
      dm.startsWith(targetBaseSlug + ':')
    ) {
      return true;
    }

    if (dm.length >= 4 && (targetModelLower.includes(dm) || targetShortSlug.includes(dm))) {
      return true;
    }

    return false;
  });

  if (isModelDisallowed) {
    return {
      blocked: true,
      status: 403,
      code: 'guardrail_violation',
      message: `Model '${targetModel}' is restricted by workspace guardrails.`,
    };
  }

  // 5. Automated Safety & Toxicity Filter
  let extractedPrompt = prompt;
  if (!extractedPrompt && Array.isArray(messages) && messages.length > 0) {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    extractedPrompt = lastUserMsg ? lastUserMsg.content : '';
  }
  const promptStr = typeof extractedPrompt === 'string' ? extractedPrompt : JSON.stringify(extractedPrompt || '');

  if (guardrails.toxicity_filter_enabled !== false) {
    const toxicityResult = checkWorkspaceToxicity(promptStr);
    if (toxicityResult.isToxic) {
      return {
        blocked: true,
        status: 403,
        code: 'content_policy_violation',
        message: `Request blocked: Content violates workspace safety and toxicity policy. (${toxicityResult.reason})`,
      };
    }
  }

  // 6. PII Data Masking
  let maskedPrompt = promptStr;
  let maskedMessages = messages;

  if (guardrails.pii_masking_enabled) {
    maskedPrompt = maskPiiData(promptStr);
    if (Array.isArray(messages) && messages.length > 0) {
      maskedMessages = messages.map(m => {
        if (m.role === 'user' && typeof m.content === 'string') {
          return { ...m, content: maskPiiData(m.content) };
        }
        return m;
      });
    }
  }

  return {
    blocked: false,
    maskedPrompt,
    maskedMessages,
  };
}

export function getWorkspaceAvailableProviders() {
  try {
    const modelsPath = join(__dirname, 'modelsCache.json');
    if (!existsSync(modelsPath)) return [];
    const models = JSON.parse(readFileSync(modelsPath, 'utf8'));
    const map = new Map();

    for (const m of models) {
      if (!m || !m.id) continue;
      const slug = (m.id.split('/')[0] || '').toLowerCase().trim();
      if (!slug) continue;
      const displayName = m.provider || (slug.charAt(0).toUpperCase() + slug.slice(1));

      if (!map.has(slug)) {
        map.set(slug, {
          id: slug,
          name: displayName,
          model_count: 0,
          sample_models: [],
        });
      }
      const entry = map.get(slug);
      entry.model_count++;
      if (entry.sample_models.length < 3) {
        entry.sample_models.push(m.display_name || m.name || m.id);
      }
    }

    const providers = Array.from(map.values());
    providers.sort((a, b) => b.model_count - a.model_count);
    return providers;
  } catch (e) {
    console.error('[workspaceService] getWorkspaceAvailableProviders error:', e);
    return [];
  }
}

// ── BYOK Vault Cryptographic Scheme (AES-256-GCM) ──────────────────────────
const BYOK_MASTER_SECRET = process.env.ENCRYPTION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'netroot-byok-vault-secret-key-32b-min';
const BYOK_DERIVED_KEY = crypto.createHash('sha256').update(BYOK_MASTER_SECRET).digest();

export const PRESET_BYOK_ENDPOINTS = {
  openai: {
    testUrl: 'https://api.openai.com/v1/models',
    chatUrl: 'https://api.openai.com/v1/chat/completions',
    headerType: 'bearer',
  },
  anthropic: {
    testUrl: 'https://api.anthropic.com/v1/models',
    chatUrl: 'https://api.anthropic.com/v1/messages',
    headerType: 'anthropic',
  },
  google: {
    testUrl: (k) => `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(k)}`,
    chatUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    headerType: 'bearer',
  },
  deepseek: {
    testUrl: 'https://api.deepseek.com/models',
    chatUrl: 'https://api.deepseek.com/chat/completions',
    headerType: 'bearer',
  },
  groq: {
    testUrl: 'https://api.groq.com/openai/v1/models',
    chatUrl: 'https://api.groq.com/openai/v1/chat/completions',
    headerType: 'bearer',
  },
  xai: {
    testUrl: 'https://api.x.ai/v1/models',
    chatUrl: 'https://api.x.ai/v1/chat/completions',
    headerType: 'bearer',
  },
  mistral: {
    testUrl: 'https://api.mistral.ai/v1/models',
    chatUrl: 'https://api.mistral.ai/v1/chat/completions',
    headerType: 'bearer',
  },
  together: {
    testUrl: 'https://api.together.xyz/v1/models',
    chatUrl: 'https://api.together.xyz/v1/chat/completions',
    headerType: 'bearer',
  },
  fireworks: {
    testUrl: 'https://api.fireworks.ai/inference/v1/models',
    chatUrl: 'https://api.fireworks.ai/inference/v1/chat/completions',
    headerType: 'bearer',
  },
  perplexity: {
    testUrl: 'https://api.perplexity.ai/models',
    chatUrl: 'https://api.perplexity.ai/chat/completions',
    headerType: 'bearer',
  },
  cohere: {
    testUrl: 'https://api.cohere.com/v2/models',
    chatUrl: 'https://api.cohere.com/v2/chat',
    headerType: 'bearer',
  },
  cerebras: {
    testUrl: 'https://api.cerebras.ai/v1/models',
    chatUrl: 'https://api.cerebras.ai/v1/chat/completions',
    headerType: 'bearer',
  },
  nvidia: {
    testUrl: 'https://integrate.api.nvidia.com/v1/models',
    chatUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
    headerType: 'bearer',
  },
};

export function encryptApiKey(plainText) {
  if (!plainText) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', BYOK_DERIVED_KEY, iv);
  let ciphertext = cipher.update(plainText, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return {
    ciphertext,
    iv: iv.toString('hex'),
    tag,
  };
}

export function decryptApiKey(record) {
  if (!record || !record.ciphertext || !record.iv || !record.tag) return null;
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      BYOK_DERIVED_KEY,
      Buffer.from(record.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(record.tag, 'hex'));
    let decrypted = decipher.update(record.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[workspaceService] Decrypt BYOK key failed:', err.message);
    return null;
  }
}

export function getByok(workspaceId, userEmail, userId) {
  const data = loadData();
  const ws = resolveUserWorkspace(data, userEmail, userId, workspaceId);
  const wsId = ws.id;
  data.byokByWorkspace = data.byokByWorkspace || {};
  const rawByok = data.byokByWorkspace[wsId] || (wsId === 'ws_default' ? data.byok || {} : {});
  const sanitized = {};
  for (const [provider, rec] of Object.entries(rawByok)) {
    if (!rec) continue;
    sanitized[provider] = {
      configured: Boolean(rec.ciphertext || (rec.configured && rec.key_masked)),
      key_masked: rec.key_masked || '',
      status: rec.status || (rec.configured ? 'verified' : 'unconfigured'),
      last_tested_at: rec.last_tested_at || null,
      updated_at: rec.updated_at || null,
      error: rec.error || null,
      display_name: rec.display_name || null,
      base_url: rec.base_url || null,
      model_prefix: rec.model_prefix || null,
      is_custom: Boolean(rec.is_custom),
    };
  }
  return sanitized;
}

export function updateByok(workspaceId, provider, rawKey, options = {}) {
  // Pro / Enterprise plan enforcement
  const plan = (options.user_plan || '').toLowerCase().trim();
  if (plan === 'free') {
    const err = new Error('BYOK Vault is an exclusive Pro & Enterprise feature. Please upgrade your plan.');
    err.status = 403;
    throw err;
  }

  const data = loadData();
  const ws = resolveUserWorkspace(data, options.userEmail, options.userId, workspaceId);
  const wsId = ws.id;
  data.byokByWorkspace = data.byokByWorkspace || {};
  data.byokByWorkspace[wsId] = data.byokByWorkspace[wsId] || {};

  const cleanProvider = (provider || '').toLowerCase().trim();
  if (!cleanProvider) return getByok(wsId, options.userEmail, options.userId);

  // Guardrail check: Prevent configuring BYOK keys for blocked providers
  const guardrails = getGuardrails(wsId) || {};
  const blockedProviders = (guardrails.blocked_providers || []).map(p => p.toLowerCase().trim());
  if (blockedProviders.includes(cleanProvider)) {
    const err = new Error(`Cannot configure BYOK key: Provider '${cleanProvider}' is restricted by workspace guardrails.`);
    err.status = 403;
    throw err;
  }

  if (!rawKey || !rawKey.trim()) {
    delete data.byokByWorkspace[wsId][cleanProvider];
    saveData(data);
    return getByok(wsId, options.userEmail, options.userId);
  }

  const key = rawKey.trim();
  // Protection against accidentally persisting masked strings
  if (key.includes('••••')) {
    return getByok(wsId, options.userEmail, options.userId);
  }

  const masked = key.length > 8 ? `${key.slice(0, 6)}••••••••${key.slice(-4)}` : '••••••••';
  const encrypted = encryptApiKey(key);

  data.byokByWorkspace[wsId][cleanProvider] = {
    configured: true,
    key_masked: masked,
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    tag: encrypted.tag,
    status: 'unverified',
    updated_at: new Date().toISOString(),
    last_tested_at: null,
    error: null,
    display_name: options.displayName || options.display_name || cleanProvider,
    base_url: options.baseUrl || options.base_url ? (options.baseUrl || options.base_url).replace(/\/+$/, '') : null,
    model_prefix: options.modelPrefix || options.model_prefix || null,
    is_custom: Boolean(options.isCustom || options.is_custom),
  };
  saveData(data);
  return getByok(wsId, options.userEmail, options.userId);
}

export function deleteByokKey(workspaceId, provider, userEmail, userId) {
  const data = loadData();
  const ws = resolveUserWorkspace(data, userEmail, userId, workspaceId);
  const wsId = ws.id;
  data.byokByWorkspace = data.byokByWorkspace || {};
  const cleanProvider = (provider || '').toLowerCase().trim();
  if (data.byokByWorkspace[wsId]) {
    delete data.byokByWorkspace[wsId][cleanProvider];
  }
  if (wsId === 'ws_default' && data.byok) {
    delete data.byok[cleanProvider];
  }
  saveData(data);
  return getByok(wsId, userEmail, userId);
}

export async function testByokKey(workspaceId, provider, optionalRawKey, optionalBaseUrl, userEmail, userId) {
  const data = loadData();
  const ws = resolveUserWorkspace(data, userEmail, userId, workspaceId);
  const wsId = ws.id;
  data.byokByWorkspace = data.byokByWorkspace || {};
  const wsByok = data.byokByWorkspace[wsId] || (wsId === 'ws_default' ? data.byok || {} : {});
  const cleanProvider = (provider || '').toLowerCase().trim();

  // Guardrail check: Prevent testing BYOK keys for blocked providers
  const guardrails = getGuardrails(wsId) || {};
  const blockedProviders = (guardrails.blocked_providers || []).map(p => p.toLowerCase().trim());
  if (blockedProviders.includes(cleanProvider)) {
    return {
      success: false,
      status: 'invalid',
      message: `Testing blocked: Provider '${cleanProvider}' is restricted by workspace guardrails.`,
    };
  }

  let rawKey = optionalRawKey ? optionalRawKey.trim() : null;
  const existingRec = wsByok[cleanProvider];
  if (!rawKey || rawKey.includes('••••')) {
    if (existingRec && existingRec.ciphertext) {
      rawKey = decryptApiKey(existingRec);
    }
  }

  if (!rawKey) {
    return {
      success: false,
      status: 'invalid',
      message: `No API key provided or found for ${cleanProvider}.`,
    };
  }

  const baseUrl = (optionalBaseUrl || existingRec?.base_url || '').replace(/\/+$/, '');
  let isValid = false;
  let statusMessage = '';

  try {
    if (baseUrl) {
      // Custom OpenAI-compatible endpoint ping
      const testUrl = `${baseUrl}/models`;
      const resp = await fetch(testUrl, {
        headers: { Authorization: `Bearer ${rawKey}` },
      });
      isValid = resp.ok;
      statusMessage = resp.ok
        ? `Custom provider endpoint reached successfully (${resp.status})`
        : `Endpoint returned HTTP ${resp.status}`;
    } else if (cleanProvider === 'openai') {
      const resp = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${rawKey}` },
      });
      isValid = resp.ok;
      statusMessage = resp.ok ? 'OpenAI key verified successfully' : `OpenAI rejected key (HTTP ${resp.status})`;
    } else if (cleanProvider === 'anthropic') {
      const resp = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': rawKey,
          'anthropic-version': '2023-06-01',
        },
      });
      isValid = resp.ok;
      statusMessage = resp.ok ? 'Anthropic key verified successfully' : `Anthropic rejected key (HTTP ${resp.status})`;
    } else if (cleanProvider === 'google') {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(rawKey)}`);
      isValid = resp.ok;
      statusMessage = resp.ok ? 'Google Gemini key verified successfully' : `Google rejected key (HTTP ${resp.status})`;
    } else if (cleanProvider === 'groq') {
      const resp = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${rawKey}` },
      });
      isValid = resp.ok;
      statusMessage = resp.ok ? 'Groq LPU key verified successfully' : `Groq rejected key (HTTP ${resp.status})`;
    } else if (cleanProvider === 'deepseek') {
      const resp = await fetch('https://api.deepseek.com/models', {
        headers: { Authorization: `Bearer ${rawKey}` },
      });
      isValid = resp.ok;
      statusMessage = resp.ok ? 'DeepSeek key verified successfully' : `DeepSeek rejected key (HTTP ${resp.status})`;
    } else if (cleanProvider === 'xai') {
      const resp = await fetch('https://api.x.ai/v1/models', {
        headers: { Authorization: `Bearer ${rawKey}` },
      });
      isValid = resp.ok;
      statusMessage = resp.ok ? 'xAI Grok key verified successfully' : `xAI rejected key (HTTP ${resp.status})`;
    } else if (cleanProvider === 'mistral') {
      const resp = await fetch('https://api.mistral.ai/v1/models', {
        headers: { Authorization: `Bearer ${rawKey}` },
      });
      isValid = resp.ok;
      statusMessage = resp.ok ? 'Mistral AI key verified successfully' : `Mistral rejected key (HTTP ${resp.status})`;
    } else if (cleanProvider === 'together') {
      const resp = await fetch('https://api.together.xyz/v1/models', {
        headers: { Authorization: `Bearer ${rawKey}` },
      });
      isValid = resp.ok;
      statusMessage = resp.ok ? 'Together AI key verified successfully' : `Together rejected key (HTTP ${resp.status})`;
    } else if (cleanProvider === 'fireworks') {
      const resp = await fetch('https://api.fireworks.ai/inference/v1/models', {
        headers: { Authorization: `Bearer ${rawKey}` },
      });
      isValid = resp.ok;
      statusMessage = resp.ok ? 'Fireworks AI key verified successfully' : `Fireworks rejected key (HTTP ${resp.status})`;
    } else if (cleanProvider === 'cohere') {
      const resp = await fetch('https://api.cohere.com/v2/models', {
        headers: { Authorization: `Bearer ${rawKey}` },
      });
      isValid = resp.ok;
      statusMessage = resp.ok ? 'Cohere key verified successfully' : `Cohere rejected key (HTTP ${resp.status})`;
    } else if (cleanProvider === 'cerebras') {
      const resp = await fetch('https://api.cerebras.ai/v1/models', {
        headers: { Authorization: `Bearer ${rawKey}` },
      });
      isValid = resp.ok;
      statusMessage = resp.ok ? 'Cerebras key verified successfully' : `Cerebras rejected key (HTTP ${resp.status})`;
    } else if (cleanProvider === 'nvidia') {
      const resp = await fetch('https://integrate.api.nvidia.com/v1/models', {
        headers: { Authorization: `Bearer ${rawKey}` },
      });
      isValid = resp.ok;
      statusMessage = resp.ok ? 'NVIDIA NIM key verified successfully' : `NVIDIA rejected key (HTTP ${resp.status})`;
    } else {
      return {
        success: false,
        status: 'invalid',
        message: `Unsupported provider: ${cleanProvider}`,
      };
    }
  } catch (netErr) {
    isValid = false;
    statusMessage = `Connection failed: ${netErr.message}`;
  }

  // Update persistent state in data.byok and data.byokByWorkspace
  if (data.byokByWorkspace?.[wsId]?.[cleanProvider]) {
    data.byokByWorkspace[wsId][cleanProvider].status = isValid ? 'verified' : 'invalid';
    data.byokByWorkspace[wsId][cleanProvider].last_tested_at = new Date().toISOString();
    data.byokByWorkspace[wsId][cleanProvider].error = isValid ? null : statusMessage;
    saveData(data);
  } else if (data.byok?.[cleanProvider]) {
    data.byok[cleanProvider].status = isValid ? 'verified' : 'invalid';
    data.byok[cleanProvider].last_tested_at = new Date().toISOString();
    data.byok[cleanProvider].error = isValid ? null : statusMessage;
    saveData(data);
  }

  return {
    success: isValid,
    status: isValid ? 'verified' : 'invalid',
    message: statusMessage,
    byok: getByok(wsId, userEmail, userId),
  };
}

// ── Anthropic Direct Adapter (Converts OpenAI payload to Claude & vice-versa) ──
export async function callAnthropicDirect({ key, body, res, stream }) {
  let systemPrompt = '';
  const anthropicMessages = [];

  for (const m of (body.messages || [])) {
    if (m.role === 'system') {
      systemPrompt += (systemPrompt ? '\n\n' : '') + (m.content || '');
    } else {
      anthropicMessages.push({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content || '',
      });
    }
  }

  const targetModel = (body.model || 'claude-3-5-sonnet-20241022').replace(/^anthropic\//, '');
  const payload = {
    model: targetModel,
    messages: anthropicMessages,
    max_tokens: Number(body.max_tokens) || 4096,
    temperature: typeof body.temperature === 'number' ? body.temperature : 0.7,
  };
  if (systemPrompt) payload.system = systemPrompt;
  if (stream) payload.stream = true;

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!anthropicRes.ok) {
      const errData = await anthropicRes.json().catch(() => ({}));
      return {
        status: anthropicRes.status,
        payload: {
          error: {
            message: errData.error?.message || `Anthropic rejected request (HTTP ${anthropicRes.status})`,
            type: 'upstream_error',
          },
        },
      };
    }

    if (stream && res) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      const reader = anthropicRes.body.getReader();
      const decoder = new TextDecoder();
      let estimatedTokens = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              const deltaText = parsed.delta.text;
              estimatedTokens += Math.max(1, Math.round(deltaText.length / 4));
              const openAiChunk = {
                id: 'chatcmpl-' + crypto.randomBytes(6).toString('hex'),
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: targetModel,
                choices: [{ index: 0, delta: { content: deltaText }, finish_reason: null }],
              };
              res.write(`data: ${JSON.stringify(openAiChunk)}\n\n`);
            }
          } catch (_) {}
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
      return { isStreamHandled: true, estimatedTokens };
    }

    const rawJson = await anthropicRes.json();
    const textContent = (rawJson.content || []).map(c => c.text || '').join('');
    const promptTokens = rawJson.usage?.input_tokens || 50;
    const completionTokens = rawJson.usage?.output_tokens || 50;

    const openAiFormat = {
      id: rawJson.id || ('chatcmpl-' + crypto.randomBytes(6).toString('hex')),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: targetModel,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: textContent },
          finish_reason: rawJson.stop_reason === 'end_turn' ? 'stop' : (rawJson.stop_reason || 'stop'),
        },
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
    };

    return { status: 200, payload: openAiFormat };
  } catch (err) {
    return {
      status: 502,
      payload: {
        error: { message: `Anthropic direct connection error: ${err.message}`, type: 'upstream_error' },
      },
    };
  }
}

export function getActiveByokKey(workspaceId, targetModel, userPlan) {
  // Plan downgrade guard: Free users cannot use BYOK keys
  if (userPlan && userPlan.toLowerCase().trim() === 'free') {
    return null;
  }

  const data = loadData();
  data.byokByWorkspace = data.byokByWorkspace || {};
  const rawByok = (workspaceId && data.byokByWorkspace[workspaceId]) || data.byok || {};
  const modelNameLower = (targetModel || '').toLowerCase().trim();

  // Guardrail check: Blocked providers cannot return any active BYOK key
  const guardrails = getGuardrails(workspaceId) || {};
  const blockedProviders = (guardrails.blocked_providers || []).map(p => p.toLowerCase().trim());
  const vendorPrefix = modelNameLower.split('/')[0] || '';
  if (vendorPrefix && blockedProviders.includes(vendorPrefix)) {
    return null;
  }

  // 1. Check Custom Providers by model prefix
  for (const [providerId, rec] of Object.entries(rawByok)) {
    if (rec && rec.is_custom && rec.ciphertext && rec.status !== 'invalid') {
      const prefix = (rec.model_prefix || '').toLowerCase().replace(/\*$/, '').trim();
      if (prefix && (modelNameLower.startsWith(prefix) || modelNameLower === prefix)) {
        const dec = decryptApiKey(rec);
        if (dec) {
          return {
            key: dec,
            provider: providerId,
            base_url: rec.base_url,
            is_custom: true,
            model_prefix: rec.model_prefix,
          };
        }
      }
    }
  }

  // 2. Check Standard Preset Providers
  const VENDOR_ALIAS = {
    mistralai: 'mistral',
    'x-ai': 'xai',
    grok: 'xai',
    'meta-llama': 'groq',
  };
  const cleanVendor = VENDOR_ALIAS[vendorPrefix] || vendorPrefix;

  const directRec = rawByok[cleanVendor];
  if (directRec && directRec.ciphertext && directRec.status !== 'invalid') {
    const dec = decryptApiKey(directRec);
    if (dec) {
      return {
        key: dec,
        provider: cleanVendor,
        base_url: directRec.base_url,
        is_custom: Boolean(directRec.is_custom),
      };
    }
  }

  return null;
}

export function getRouting(workspaceId) {
  const data = loadData();
  const defaultRouting = {
    strategy: 'latency', // 'latency' | 'cost' | 'throughput'
    retry_count: 2,
    timeout_seconds: 30,
    failover_on_429: true,
    failover_on_5xx: true,
    fallbacks: [
      {
        id: 'fb_1',
        primary: 'anthropic/claude-3.5-sonnet',
        fallback: 'deepseek/deepseek-chat',
        trigger: 'any_error',
      },
    ],
  };
  return { ...defaultRouting, ...(data.routing || {}) };
}

export function updateRouting(workspaceId, updates) {
  const data = loadData();
  data.routing = { ...getRouting(workspaceId), ...updates };
  saveData(data);
  return data.routing;
}

/**
 * Execute a single upstream completion attempt with BYOK or Master Pool
 */
async function executeSingleGatewayAttempt({
  targetModel,
  body,
  req,
  res,
  matchedKey,
  data,
  isStream,
  isFallback = false,
  originalModel = null,
}) {
  const targetProvider = (targetModel.split('/')[0] || '').toLowerCase();
  const byokKeyInfo = getActiveByokKey(matchedKey.workspace_id, targetModel, matchedKey.user_plan);
  const isByok = Boolean(byokKeyInfo);

  const openrouterApiKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterApiKey && !isByok && !process.env.GROQ_API_KEY) {
    return {
      status: 500,
      payload: {
        error: {
          message: 'Upstream Master API Key is not configured on NetRoot AI server.',
          type: 'server_error',
        },
      },
    };
  }

  // Check user wallet balance if using platform key on a paid model
  if (!isByok && matchedKey.owner_email && !isModelFree(targetModel)) {
    try {
      const wallet = await getUserWallet(matchedKey.owner_email, matchedKey.user_id);
      if (wallet && Number(wallet.balance) <= 0) {
        return {
          status: 402,
          payload: {
            error: {
              message: 'Your NetRoot AI wallet balance is depleted ($0.00). Please top up your wallet in the dashboard to make API calls with premium models.',
              type: 'insufficient_funds',
              code: 'wallet_balance_depleted',
            },
          },
        };
      }
    } catch (e) {
      console.warn('[gateway] Wallet balance check error:', e.message);
    }
  }

  const startMs = Date.now();
  const marginPct = data.profit_margin_pct || 20;

  // Direct Anthropic BYOK execution with message format adapter
  if (isByok && byokKeyInfo.provider === 'anthropic') {
    const directResult = await callAnthropicDirect({
      key: byokKeyInfo.key,
      body: { ...body, model: targetModel },
      res,
      stream: isStream,
    });

    if (directResult.isStreamHandled) {
      const latencyMs = Date.now() - startMs;
      const estimatedTokens = directResult.estimatedTokens || 100;
      matchedKey.last_used_at = new Date().toISOString();
      data.thisWeekUsage.requests_count += 1;
      data.thisWeekUsage.tokens_count += (50 + estimatedTokens);
      data.thisWeekUsage.last_updated = new Date().toISOString();

      const logEntry = {
        id: `log_${crypto.randomBytes(4).toString('hex')}`,
        workspace_id: matchedKey.workspace_id,
        timestamp: new Date().toISOString(),
        key_name: matchedKey.name,
        key_id: matchedKey.id,
        model: targetModel,
        provider: 'Anthropic Direct',
        status: 200,
        latency_ms: latencyMs,
        prompt_tokens: 50,
        completion_tokens: estimatedTokens,
        total_tokens: 50 + estimatedTokens,
        cost_usd: 0.00,
        profit_usd: 0.00,
        is_byok: true,
        is_fallback: isFallback,
        original_model: originalModel,
        client_ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1',
      };
      data.logs = data.logs || [];
      data.logs.unshift(logEntry);
      if (data.logs.length > 500) data.logs = data.logs.slice(0, 500);
      saveData(data);
      return { isStreamHandled: true, status: 200 };
    }

    if (directResult.status >= 400) {
      return directResult;
    }

    const latencyMs = Date.now() - startMs;
    const usage = directResult.payload.usage || {};
    matchedKey.last_used_at = new Date().toISOString();
    data.thisWeekUsage.requests_count += 1;
    data.thisWeekUsage.tokens_count += (usage.total_tokens || 100);
    data.thisWeekUsage.last_updated = new Date().toISOString();

    const logEntry = {
      id: `log_${crypto.randomBytes(4).toString('hex')}`,
      workspace_id: matchedKey.workspace_id,
      timestamp: new Date().toISOString(),
      key_name: matchedKey.name,
      key_id: matchedKey.id,
      model: targetModel,
      provider: 'Anthropic Direct',
      status: 200,
      latency_ms: latencyMs,
      prompt_tokens: usage.prompt_tokens || 50,
      completion_tokens: usage.completion_tokens || 50,
      total_tokens: usage.total_tokens || 100,
      cost_usd: 0.00,
      profit_usd: 0.00,
      is_byok: true,
      is_fallback: isFallback,
      original_model: originalModel,
      client_ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1',
    };
    data.logs = data.logs || [];
    data.logs.unshift(logEntry);
    if (data.logs.length > 500) data.logs = data.logs.slice(0, 500);
    saveData(data);

    return {
      status: 200,
      payload: directResult.payload,
    };
  }

  const GROQ_GATEWAY_MODELS = new Set([
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b',
    'allam-2-7b',
    'qwen/qwen3.8-27b',
    'whisper-large-v3',
    'whisper-large-v3-turbo',
  ]);
  const isGroqNative = GROQ_GATEWAY_MODELS.has(targetModel) && Boolean(process.env.GROQ_API_KEY);

  let upstreamUrl = 'https://openrouter.ai/api/v1/chat/completions';
  let upstreamAuth = openrouterApiKey ? `Bearer ${openrouterApiKey}` : '';
  let forwardedBody = { ...body, model: targetModel };

  if (isByok) {
    if (byokKeyInfo.base_url) {
      upstreamUrl = `${byokKeyInfo.base_url}/chat/completions`;
      upstreamAuth = `Bearer ${byokKeyInfo.key}`;
      forwardedBody.model = targetModel;
    } else if (byokKeyInfo.provider === 'google') {
      upstreamUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
      upstreamAuth = `Bearer ${byokKeyInfo.key}`;
      forwardedBody.model = targetModel.replace(/^google\//, '');
    } else if (byokKeyInfo.provider === 'openai') {
      upstreamUrl = 'https://api.openai.com/v1/chat/completions';
      upstreamAuth = `Bearer ${byokKeyInfo.key}`;
      forwardedBody.model = targetModel.replace(/^openai\//, '');
    } else if (byokKeyInfo.provider === 'deepseek') {
      upstreamUrl = 'https://api.deepseek.com/chat/completions';
      upstreamAuth = `Bearer ${byokKeyInfo.key}`;
      forwardedBody.model = targetModel.replace(/^deepseek\//, '');
    } else if (byokKeyInfo.provider === 'groq') {
      upstreamUrl = 'https://api.groq.com/openai/v1/chat/completions';
      upstreamAuth = `Bearer ${byokKeyInfo.key}`;
      forwardedBody.model = targetModel.replace(/^groq\//, '');
    } else if (PRESET_BYOK_ENDPOINTS[byokKeyInfo.provider]) {
      upstreamUrl = PRESET_BYOK_ENDPOINTS[byokKeyInfo.provider].chatUrl;
      upstreamAuth = `Bearer ${byokKeyInfo.key}`;
      forwardedBody.model = targetModel.includes('/') ? targetModel.split('/')[1] : targetModel;
    }
  } else if (isGroqNative) {
    upstreamUrl = 'https://api.groq.com/openai/v1/chat/completions';
    upstreamAuth = `Bearer ${process.env.GROQ_API_KEY}`;
  }

  // Handle SSE streaming proxy when stream: true is requested by developer
  if (isStream && res) {
    try {
      const upstreamRes = await fetch(upstreamUrl, {
        method: 'POST',
        headers: {
          Authorization: upstreamAuth,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://netrootai.tech',
          'X-Title': 'NetRoot AI Developer Gateway',
        },
        body: JSON.stringify(forwardedBody),
      });

      if (!upstreamRes.ok) {
        const errorData = await upstreamRes.json().catch(() => ({}));
        const cleanErr = sanitizeUpstreamError(errorData, upstreamRes.status, targetModel);
        return { status: upstreamRes.status, payload: cleanErr };
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      let estimatedTokens = 0;
      const reader = upstreamRes.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkStr = decoder.decode(value, { stream: true });
        estimatedTokens += Math.max(1, Math.round(chunkStr.length / 4));
        res.write(value);
      }
      res.end();

      const latencyMs = Date.now() - startMs;
      const { billedCost: rawBilledCost, netrootProfit: rawProfit } = calculateModelCost(targetModel, 50, estimatedTokens, marginPct);
      const billedCost = isByok ? 0.00 : rawBilledCost;
      const netrootProfit = isByok ? 0.00 : rawProfit;

      if (!isByok) {
        matchedKey.current_spend_usd = Number((matchedKey.current_spend_usd + billedCost).toFixed(5));
        data.thisWeekUsage.spend_usd = Number((data.thisWeekUsage.spend_usd + billedCost).toFixed(5));
        if (matchedKey.owner_email && billedCost > 0) {
          try {
            await deductUserWallet({
              email: matchedKey.owner_email,
              userId: matchedKey.user_id,
              billedCost,
              model: targetModel,
              promptTokens: 50,
              completionTokens: estimatedTokens,
              targetService: 'developer_gateway',
            });
          } catch (deductErr) {
            console.warn('[gateway] deductUserWallet error:', deductErr.message);
          }
        }
      }
      matchedKey.last_used_at = new Date().toISOString();
      data.thisWeekUsage.requests_count += 1;
      data.thisWeekUsage.tokens_count += (50 + estimatedTokens);
      data.thisWeekUsage.last_updated = new Date().toISOString();

      const logEntry = {
        id: `log_${crypto.randomBytes(4).toString('hex')}`,
        workspace_id: matchedKey.workspace_id,
        timestamp: new Date().toISOString(),
        key_name: matchedKey.name,
        key_id: matchedKey.id,
        model: targetModel,
        provider: getCleanVendor(targetModel),
        status: 200,
        latency_ms: latencyMs,
        prompt_tokens: 50,
        completion_tokens: estimatedTokens,
        total_tokens: 50 + estimatedTokens,
        cost_usd: billedCost,
        profit_usd: netrootProfit,
        is_byok: isByok,
        is_fallback: isFallback,
        original_model: originalModel,
        client_ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1',
      };
      data.logs = data.logs || [];
      data.logs.unshift(logEntry);
      if (data.logs.length > 500) data.logs = data.logs.slice(0, 500);
      saveData(data);

      return { isStreamHandled: true, status: 200 };
    } catch (streamErr) {
      console.error('[gateway] stream proxy error:', streamErr);
      if (!res.headersSent) {
        return { status: 502, payload: sanitizeUpstreamError(streamErr.message, 502, targetModel) };
      }
      res.end();
      return { isStreamHandled: true, status: 502 };
    }
  }

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        Authorization: upstreamAuth,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://netrootai.tech',
        'X-Title': 'NetRoot AI Developer Gateway',
      },
      body: JSON.stringify(forwardedBody),
    });

    const completionData = await upstreamRes.json().catch(() => ({}));
    const latencyMs = Date.now() - startMs;

    if (!upstreamRes.ok) {
      const cleanErr = sanitizeUpstreamError(completionData, upstreamRes.status, targetModel);
      return {
        status: upstreamRes.status,
        payload: cleanErr,
      };
    }

    // Calculate authentic cost with NetRoot Profit Margin
    const promptTokens = completionData.usage?.prompt_tokens || 0;
    const completionTokens = completionData.usage?.completion_tokens || 0;
    const totalTokens = completionData.usage?.total_tokens || promptTokens + completionTokens;

    const { baseCost, netrootProfit: rawProfit, billedCost: rawBilledCost } = calculateModelCost(targetModel, promptTokens, completionTokens, marginPct);
    const billedCost = isByok ? 0.00 : rawBilledCost;
    const netrootProfit = isByok ? 0.00 : rawProfit;

    // Update key & this week metrics (only debit wallet if not BYOK)
    if (!isByok) {
      matchedKey.current_spend_usd = Number((matchedKey.current_spend_usd + billedCost).toFixed(5));
      data.thisWeekUsage.spend_usd = Number((data.thisWeekUsage.spend_usd + billedCost).toFixed(5));
      if (matchedKey.owner_email && billedCost > 0) {
        try {
          await deductUserWallet({
            email: matchedKey.owner_email,
            userId: matchedKey.user_id,
            billedCost,
            model: targetModel,
            promptTokens,
            completionTokens,
            targetService: 'developer_gateway',
          });
        } catch (deductErr) {
          console.warn('[gateway] deductUserWallet error:', deductErr.message);
        }
      }
    }
    matchedKey.last_used_at = new Date().toISOString();

    data.thisWeekUsage.requests_count += 1;
    data.thisWeekUsage.tokens_count += totalTokens;
    data.thisWeekUsage.last_updated = new Date().toISOString();

    // Log the request
    const logEntry = {
      id: `log_${crypto.randomBytes(4).toString('hex')}`,
      workspace_id: matchedKey.workspace_id,
      timestamp: new Date().toISOString(),
      key_name: matchedKey.name,
      key_id: matchedKey.id,
      model: targetModel,
      provider: getCleanVendor(targetModel),
      status: 200,
      latency_ms: latencyMs,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      cost_usd: billedCost,
      profit_usd: netrootProfit,
      is_byok: isByok,
      is_fallback: isFallback,
      original_model: originalModel,
      client_ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1',
    };

    data.logs = data.logs || [];
    data.logs.unshift(logEntry);
    if (data.logs.length > 500) data.logs = data.logs.slice(0, 500);

    saveData(data);

    // Ensure clean white-labeled payload
    if (completionData && typeof completionData === 'object') {
      delete completionData.provider;
      delete completionData.user_id;
      delete completionData.x_groq;
    }

    return {
      status: 200,
      payload: completionData,
    };
  } catch (err) {
    console.error('[gateway] completion proxy error:', err.message);
    return {
      status: 502,
      payload: sanitizeUpstreamError(err.message, 502, targetModel),
    };
  }
}

export function getPresets(workspaceId) {
  const data = loadData();
  return data.presets || [];
}

export function createPreset(workspaceId, presetData) {
  const data = loadData();
  const newPreset = {
    id: `preset_${crypto.randomBytes(4).toString('hex')}`,
    name: presetData.name?.trim() || 'Custom Preset',
    description: presetData.description?.trim() || '',
    system_prompt: presetData.system_prompt || '',
    default_model: presetData.default_model?.trim() || 'openai/gpt-4o',
    temperature: typeof presetData.temperature === 'number' ? presetData.temperature : 0.7,
    max_tokens: Number(presetData.max_tokens) || 2048,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  data.presets = data.presets || [];
  data.presets.push(newPreset);
  saveData(data);
  return newPreset;
}

export function updatePreset(workspaceId, presetId, updates = {}) {
  const data = loadData();
  data.presets = data.presets || [];
  const idx = data.presets.findIndex(p => p.id === presetId);
  if (idx === -1) {
    throw new Error('Preset not found');
  }

  const existing = data.presets[idx];
  const updatedPreset = {
    ...existing,
    name: updates.name !== undefined ? updates.name.trim() : existing.name,
    description: updates.description !== undefined ? updates.description.trim() : existing.description,
    system_prompt: updates.system_prompt !== undefined ? updates.system_prompt : existing.system_prompt,
    default_model: updates.default_model !== undefined ? updates.default_model.trim() : (existing.default_model || 'openai/gpt-4o'),
    temperature: typeof updates.temperature === 'number' ? updates.temperature : existing.temperature,
    max_tokens: Number(updates.max_tokens) || existing.max_tokens || 2048,
    updated_at: new Date().toISOString(),
  };

  data.presets[idx] = updatedPreset;
  saveData(data);
  return updatedPreset;
}

export function deletePreset(workspaceId, presetId) {
  const data = loadData();
  data.presets = (data.presets || []).filter(p => p.id !== presetId);
  saveData(data);
  return { success: true };
}

export function updateWorkspaceSettings(workspaceId, updates = {}) {
  const data = loadData();
  const wsId = workspaceId || data.activeWorkspaceId || 'ws_default';
  const ws = (data.workspaces || []).find(w => w.id === wsId);
  if (!ws) throw new Error('Workspace not found.');
  if (updates.name) ws.name = updates.name.trim();
  if (updates.description !== undefined) ws.description = updates.description.trim();
  if (updates.environment) ws.environment = updates.environment;
  if (updates.service_tier !== undefined) ws.service_tier = updates.service_tier;
  if (updates.disable_user_keys !== undefined) ws.disable_user_keys = Boolean(updates.disable_user_keys);
  if (updates.monthly_budget_usd !== undefined) ws.monthly_budget_usd = Number(updates.monthly_budget_usd);
  if (updates.budget_alert_threshold !== undefined) ws.budget_alert_threshold = Number(updates.budget_alert_threshold);
  saveData(data);
  return ws;
}

export function getWorkspaceBootstrapData(workspaceId, userEmail, userId) {
  const data = loadData();
  const wsInfo = getWorkspaces(userEmail, userId);
  const activeWsId = workspaceId || wsInfo.activeWorkspaceId || 'ws_default';
  const overview = getWorkspaceOverview(activeWsId, userEmail, userId);
  const keys = getApiKeys(activeWsId, userEmail, userId);
  const guardrails = getGuardrails(activeWsId);
  const activity = getWorkspaceActivity(activeWsId, userEmail, userId);
  return {
    workspaces: wsInfo.workspaces,
    activeWorkspaceId: activeWsId,
    overview,
    keys,
    guardrails,
    activity,
  };
}

// ── Files & Knowledge (RAG) ────────────────────────────────────────────────
export function getWorkspaceFiles(workspaceId) {
  const data = loadData();
  const wsId = workspaceId || data.activeWorkspaceId || 'ws_default';
  return (data.files || []).filter(f => f.workspace_id === wsId);
}

export function addWorkspaceFile(workspaceId, fileInfo) {
  const data = loadData();
  const wsId = workspaceId || data.activeWorkspaceId || 'ws_default';
  const newFile = {
    id: `file_${crypto.randomBytes(4).toString('hex')}`,
    workspace_id: wsId,
    name: fileInfo.name || 'Untitled Document',
    file_path: fileInfo.file_path || `/uploads/${fileInfo.name}`,
    file_size_bytes: fileInfo.file_size_bytes || 102400,
    estimated_tokens: fileInfo.estimated_tokens || Math.round((fileInfo.file_size_bytes || 102400) / 4),
    sync_chat: fileInfo.sync_chat !== false,
    status: 'ready',
    uploaded_at: new Date().toISOString(),
  };
  data.files = data.files || [];
  data.files.unshift(newFile);
  saveData(data);
  return newFile;
}

export function deleteWorkspaceFile(workspaceId, fileId) {
  const data = loadData();
  data.files = (data.files || []).filter(f => f.id !== fileId);
  saveData(data);
  return { success: true };
}

export function toggleFileChatSync(workspaceId, fileId) {
  const data = loadData();
  const file = (data.files || []).find(f => f.id === fileId);
  if (file) {
    file.sync_chat = !file.sync_chat;
    saveData(data);
    return file;
  }
  return null;
}

// ── Agentic Tools & Function Registry ──────────────────────────────────────
export function getWorkspaceTools(workspaceId) {
  const data = loadData();
  return data.tools || [];
}

export function toggleWorkspaceTool(workspaceId, toolId, enabled) {
  const data = loadData();
  const tool = (data.tools || []).find(t => t.id === toolId);
  if (tool) {
    tool.enabled = Boolean(enabled);
    saveData(data);
    return tool;
  }
  return null;
}

// ── Classifiers & Intent Rules (with Execution Priority Queue) ─────────────
export function getWorkspaceClassifiers(workspaceId) {
  const data = loadData();
  const wsId = workspaceId || data.activeWorkspaceId || 'ws_default';
  const list = (data.classifiers || []).filter(c => c.workspace_id === wsId);
  return list.sort((a, b) => (a.priority || 1) - (b.priority || 1));
}

/**
 * Evaluate user query prompt against active workspace classifiers in strict priority order (#1 downwards).
 * Returns { action, targetValue, matchedRule } if a rule triggers, or null.
 */
export function evaluateIntentClassifiers(workspaceId, promptText) {
  if (!promptText || typeof promptText !== 'string') return null;
  const classifiers = getWorkspaceClassifiers(workspaceId);
  const activeRules = classifiers.filter(c => c.enabled !== false);
  const cleanPrompt = promptText.toLowerCase().trim();

  for (const rule of activeRules) {
    let isMatched = false;
    const condType = rule.condition_type || 'keyword';
    const condVal = (rule.condition_value || '').trim();

    if (condType === 'keyword') {
      // Comma-separated keyword matching
      const keywords = condVal.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
      isMatched = keywords.some(k => cleanPrompt.includes(k));
    } else if (condType === 'regex') {
      try {
        const regex = new RegExp(condVal, 'i');
        isMatched = regex.test(cleanPrompt);
      } catch (e) {
        // invalid regex safe skip
      }
    } else if (condType === 'toxicity') {
      // Standard toxicity keyword check
      const toxicKeywords = condVal ? condVal.split(',').map(k => k.trim().toLowerCase()).filter(Boolean) : ['hate', 'attack', 'kill', 'threat'];
      isMatched = toxicKeywords.some(k => cleanPrompt.includes(k));
    } else if (condType === 'token_length') {
      const minLength = Number(condVal) || 1000;
      isMatched = cleanPrompt.length >= minLength;
    }

    if (isMatched) {
      return {
        action: rule.target_action, // 'route_model' | 'block' | 'inject_prompt'
        targetValue: rule.target_value,
        matchedRule: rule,
      };
    }
  }

  return null;
}

export function saveWorkspaceClassifier(workspaceId, ruleData) {
  const data = loadData();
  const wsId = workspaceId || data.activeWorkspaceId || 'ws_default';
  data.classifiers = data.classifiers || [];

  if (ruleData.id) {
    const idx = data.classifiers.findIndex(c => c.id === ruleData.id);
    if (idx !== -1) {
      data.classifiers[idx] = {
        ...data.classifiers[idx],
        ...ruleData,
        workspace_id: wsId,
      };
      saveData(data);
      return data.classifiers[idx];
    }
  }

  const newRule = {
    id: `rule_${crypto.randomBytes(4).toString('hex')}`,
    workspace_id: wsId,
    name: ruleData.name?.trim() || 'Custom Intent Rule',
    priority: Number(ruleData.priority) || (data.classifiers.length + 1),
    condition_type: ruleData.condition_type || 'keyword',
    condition_value: ruleData.condition_value || '',
    target_action: ruleData.target_action || 'route_model',
    target_value: ruleData.target_value || 'anthropic/claude-3.5-sonnet',
    enabled: ruleData.enabled !== false,
  };
  data.classifiers.push(newRule);
  saveData(data);
  return newRule;
}

export function deleteWorkspaceClassifier(workspaceId, ruleId) {
  const data = loadData();
  data.classifiers = (data.classifiers || []).filter(c => c.id !== ruleId);
  // Re-index priorities to maintain clean 1, 2, 3 sequence
  data.classifiers.forEach((c, idx) => { c.priority = idx + 1; });
  saveData(data);
  return { success: true };
}

export function reorderWorkspaceClassifiers(workspaceId, orderedIds) {
  const data = loadData();
  data.classifiers = data.classifiers || [];
  orderedIds.forEach((id, idx) => {
    const rule = data.classifiers.find(c => c.id === id);
    if (rule) {
      rule.priority = idx + 1;
    }
  });
  saveData(data);
  return data.classifiers.sort((a, b) => a.priority - b.priority);
}

// ── Semantic Cache Settings (with Similarity Threshold) ─────────────────────
export function getWorkspaceCacheSettings(workspaceId) {
  const data = loadData();
  return data.cacheSettings || {
    enabled: true,
    similarity_threshold: 0.85,
    ttl_hours: 168,
    total_saved_usd: 48.25,
    total_cache_hits: 218,
  };
}

export function updateWorkspaceCacheSettings(workspaceId, updates) {
  const data = loadData();
  data.cacheSettings = {
    ...data.cacheSettings,
    ...updates,
    similarity_threshold: typeof updates.similarity_threshold === 'number'
      ? Math.max(0.70, Math.min(0.98, updates.similarity_threshold))
      : (data.cacheSettings?.similarity_threshold || 0.85),
  };
  saveData(data);
  return data.cacheSettings;
}

// ── Observability & Telemetry Metrics ───────────────────────────────────────
export function getObservabilityMetrics(workspaceId) {
  const data = loadData();
  const wsId = workspaceId || data.activeWorkspaceId || 'ws_default';
  const logs = (data.logs || []).filter(l => l.workspace_id === wsId);

  const totalReqs = logs.length;
  const successfulReqs = logs.filter(l => l.status >= 200 && l.status < 300).length;
  const successRate = totalReqs > 0 ? ((successfulReqs / totalReqs) * 100).toFixed(1) : '99.8';

  const latencies = logs.map(l => l.latency_ms || 300).filter(n => n > 0);
  const avgLatency = latencies.length > 0
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : 340;

  const cacheSettings = data.cacheSettings || {};

  // Compute provider distribution dynamically from logs
  const providerCounts = {};
  for (const log of logs) {
    let p = log.provider || (log.model?.includes('/') ? log.model.split('/')[0] : 'Unknown');
    p = p.charAt(0).toUpperCase() + p.slice(1);
    providerCounts[p] = (providerCounts[p] || 0) + 1;
  }
  const providerColors = {
    Anthropic: '#f97316',
    Openai: '#10b981',
    Deepseek: '#3b82f6',
    Liquid: '#8b5cf6',
    Minimax: '#ec4899',
    Meta: '#06b6d4',
    Google: '#eab308',
    Groq: '#f43f5e',
    Other: '#64748b',
  };
  let providerDistribution = [];
  if (totalReqs > 0) {
    providerDistribution = Object.entries(providerCounts).map(([name, count]) => ({
      name,
      percentage: Math.round((count / totalReqs) * 100),
      color: providerColors[name] || providerColors.Other,
    })).sort((a, b) => b.percentage - a.percentage);
  } else {
    providerDistribution = [
      { name: 'OpenAI', percentage: 40, color: '#10b981' },
      { name: 'Anthropic', percentage: 35, color: '#f97316' },
      { name: 'DeepSeek', percentage: 25, color: '#3b82f6' },
    ];
  }

  return {
    avg_latency_ms: avgLatency,
    ttft_ms: Math.round(avgLatency * 0.65), // Time to first token approx ~65% of full latency
    success_rate_pct: successRate,
    cache_hit_ratio_pct: '34.2',
    total_saved_usd: cacheSettings.total_saved_usd || 48.25,
    total_cache_hits: cacheSettings.total_cache_hits || 218,
    provider_distribution: providerDistribution,
  };
}

// ── White-Labeling & Provider Masking Utilities ──────────────────────────────
export function getCleanVendor(modelId) {
  if (!modelId) return 'NetRoot AI';
  const prefix = (modelId.split('/')[0] || '').toLowerCase();
  if (prefix === 'openai') return 'OpenAI';
  if (prefix === 'meta' || prefix === 'meta-llama') return 'Meta';
  if (prefix === 'google') return 'Google';
  if (prefix === 'nvidia') return 'Nvidia';
  if (prefix === 'anthropic') return 'Anthropic';
  if (prefix === 'deepseek') return 'DeepSeek';
  if (prefix === 'mistralai' || prefix === 'mistral') return 'Mistral AI';
  if (prefix === 'qwen') return 'Qwen / Alibaba';
  if (prefix === 'allam-2-7b' || prefix === 'allam') return 'ALLaM';
  if (prefix === 'liquid') return 'Liquid AI';
  if (prefix === 'fal-ai') return 'NetRoot Studio';
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

export function sanitizeUpstreamError(rawError, statusCode, modelName) {
  let msg = '';
  if (typeof rawError === 'string') {
    msg = rawError;
  } else if (rawError?.error?.message) {
    msg = rawError.error.message;
  } else if (rawError?.message) {
    msg = rawError.message;
  }

  // Model unavailable or retired (404)
  if (statusCode === 404 || msg.includes('retired') || msg.includes('not exist') || msg.includes('does not exist') || msg.includes('not found')) {
    return {
      error: {
        message: `The model '${modelName || 'selected'}' is currently unavailable or retired on NetRoot AI Gateway. Please switch to another model.`,
        type: 'invalid_request_error',
        code: 'model_unavailable',
        gateway: 'NetRoot AI Developer Gateway'
      }
    };
  }

  // Upstream rate limit (429)
  if (statusCode === 429 || msg.includes('rate-limited') || msg.includes('rate_limit') || msg.includes('quota') || msg.includes('exceeded')) {
    return {
      error: {
        message: `High traffic: The model '${modelName || 'selected'}' is temporarily rate-limited. Please retry shortly or switch to another NetRoot model.`,
        type: 'rate_limit_error',
        code: 'rate_limit_exceeded',
        gateway: 'NetRoot AI Developer Gateway'
      }
    };
  }

  // Sanitize internal provider URLs, upstream user IDs, and leaks
  const cleanMsg = msg
    .replace(/https?:\/\/[^\s)]+/gi, '')
    .replace(/openrouter(\.ai)?/gi, 'NetRoot AI')
    .replace(/api\.groq\.com/gi, 'NetRoot Gateway')
    .replace(/groq/gi, 'NetRoot High-Speed Engine')
    .replace(/user_[a-zA-Z0-9_-]+/gi, '')
    .trim() || 'An error occurred while processing your request through NetRoot AI Developer Gateway.';

  return {
    error: {
      message: cleanMsg,
      type: rawError?.error?.type || 'gateway_error',
      code: rawError?.error?.code || 'proxy_error',
      gateway: 'NetRoot AI Developer Gateway'
    }
  };
}

// ── Developer Gateway Models Listing (OpenAI Compatible) ───────────────────
export function getDeveloperGatewayModels(authHeader) {
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
  const data = loadData();
  let allowed = [];
  if (token && token.startsWith('nr-live-')) {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const matchedKey = (data.apiKeys || []).find(k => k.key_hash === hash || k.secret === token);
    if (matchedKey && Array.isArray(matchedKey.allowed_models) && matchedKey.allowed_models.length > 0) {
      allowed = matchedKey.allowed_models;
    }
  }

  let modelList = [];
  if (allowed.length > 0) {
    // Filter out retired models if user's key had old hardcoded values
    modelList = allowed.filter(m => !m.includes('minimax-m3.1-flash:free'));
    if (modelList.length === 0) {
      modelList = ['openai/gpt-oss-20b', 'nvidia/nemotron-3.5-lightning:free'];
    }
  } else {
    // Dynamically list active free models from cache + Groq fast native
    try {
      const cachePath = join(PROJECT_ROOT, 'server', 'modelsCache.json');
      if (existsSync(cachePath)) {
        const cache = JSON.parse(readFileSync(cachePath, 'utf8'));
        const freeFromCache = cache
          .filter(m => m.id && (m.id.endsWith(':free') || m.id === 'openrouter/free') && !m.id.includes('minimax-m3.1-flash'))
          .map(m => m.id);
        if (freeFromCache.length > 0) {
          modelList = Array.from(new Set(['openai/gpt-oss-20b', ...freeFromCache]));
        }
      }
    } catch (e) {
      // ignore
    }

    if (modelList.length === 0) {
      modelList = [
        'openai/gpt-oss-20b',
        'nvidia/nemotron-3.5-lightning:free',
        'google/gemma-4-26b-a4b-it:free',
        'google/gemma-4-31b-it:free',
        'openrouter/free',
      ];
    }
  }

  return {
    object: 'list',
    data: modelList.map(m => ({
      id: m,
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: 'netroot',
      permission: [],
      root: m,
      parent: null,
    }))
  };
}

// ── Developer Proxy Completion Gateway ───────────────────────────────────────
// Accepts OpenAI / OpenRouter style completions with Authorization: Bearer nr-live-...
export async function handleDeveloperGatewayChat({ req, res, body, authHeader }) {
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
  if (!token || !token.startsWith('nr-live-')) {
    return {
      status: 401,
      payload: {
        error: {
          message: 'Invalid or missing API key. Please pass your NetRoot AI API key as Bearer nr-live-...',
          type: 'invalid_request_error',
          code: 'invalid_api_key',
        },
      },
    };
  }

  const data = loadData();
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const matchedKey = (data.apiKeys || []).find(k => k.key_hash === hash || k.secret === token);

  if (!matchedKey) {
    return {
      status: 401,
      payload: {
        error: {
          message: 'Unauthorized. The provided NetRoot AI API key does not exist or has been revoked.',
          type: 'invalid_request_error',
          code: 'unauthorized',
        },
      },
    };
  }

  if (matchedKey.status !== 'active') {
    return {
      status: 403,
      payload: {
        error: {
          message: 'This NetRoot AI API key is currently disabled.',
          type: 'invalid_request_error',
          code: 'key_disabled',
        },
      },
    };
  }

  // Check key monthly limit
  if (matchedKey.monthly_limit_usd && matchedKey.current_spend_usd >= matchedKey.monthly_limit_usd) {
    return {
      status: 429,
      payload: {
        error: {
          message: `Monthly budget limit ($${matchedKey.monthly_limit_usd}) exceeded for key ${matchedKey.name}.`,
          type: 'insufficient_quota',
          code: 'quota_exceeded',
        },
      },
    };
  }

  // 1. Evaluate Workspace Intent Classifiers in strict priority order (#1 downwards)
  let targetModel = body.model || 'liquid/lfm-2.5-2.6b:free';
  let effectiveBody = { ...body };

  // Extract prompt text from last user message or prompt field
  const userMessages = (body.messages || []).filter(m => m.role === 'user');
  const lastUserPrompt = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : (body.prompt || '');
  const promptText = typeof lastUserPrompt === 'string' ? lastUserPrompt : JSON.stringify(lastUserPrompt);

  const matchedClassifier = evaluateIntentClassifiers(matchedKey.workspace_id, promptText);
  if (matchedClassifier) {
    if (matchedClassifier.action === 'block') {
      return {
        status: 403,
        payload: {
          error: {
            message: matchedClassifier.targetValue || 'Request blocked by workspace intent safety classifier rule.',
            type: 'invalid_request_error',
            code: 'intent_classifier_blocked',
            rule_id: matchedClassifier.matchedRule?.id,
            rule_name: matchedClassifier.matchedRule?.name,
          },
        },
      };
    } else if (matchedClassifier.action === 'route_model' && matchedClassifier.targetValue) {
      console.log(`[gateway-classifier] Intent matched '${matchedClassifier.matchedRule?.name}'. Overriding model from ${targetModel} to ${matchedClassifier.targetValue}`);
      targetModel = matchedClassifier.targetValue;
      effectiveBody.model = targetModel;
    } else if (matchedClassifier.action === 'inject_prompt' && matchedClassifier.targetValue) {
      effectiveBody.messages = effectiveBody.messages ? [...effectiveBody.messages] : [];
      effectiveBody.messages.unshift({
        role: 'system',
        content: matchedClassifier.targetValue,
      });
    }
  }

  // Enforce Universal Workspace Guardrails (Budget Cap, Rate Limit RPM, Blocked Providers/Models, Content Safety, PII Masking)
  const guardrailCheck = enforceWorkspaceGuardrails({
    workspaceId: matchedKey.workspace_id,
    model: targetModel,
    prompt: promptText,
    messages: effectiveBody.messages,
  });

  if (guardrailCheck.blocked) {
    return {
      status: guardrailCheck.status || 403,
      payload: {
        error: {
          message: guardrailCheck.message,
          type: 'invalid_request_error',
          code: guardrailCheck.code,
        },
      },
    };
  }

  // If PII masking occurred, use the sanitized prompt and messages
  if (guardrailCheck.maskedMessages) {
    effectiveBody.messages = guardrailCheck.maskedMessages;
  }
  if (guardrailCheck.maskedPrompt && typeof effectiveBody.prompt === 'string') {
    effectiveBody.prompt = guardrailCheck.maskedPrompt;
  }

  // Check allowed models restriction on key
  if (matchedKey.allowed_models?.length > 0 && !matchedKey.allowed_models.includes(targetModel)) {
    return {
      status: 403,
      payload: {
        error: {
          message: `Model ${targetModel} is not permitted for this API key.`,
          type: 'invalid_request_error',
          code: 'model_not_allowed',
        },
      },
    };
  }

  // Check and apply System Presets if preset_id is passed in body or header
  const requestedPresetId = effectiveBody.preset_id || req.headers['x-netroot-preset'];
  if (requestedPresetId) {
    const matchedPreset = (data.presets || []).find(p => p.id === requestedPresetId);
    if (matchedPreset) {
      effectiveBody.messages = effectiveBody.messages ? [...effectiveBody.messages] : [];
      // If messages has no existing system prompt, prepend the preset's system prompt
      const hasSystemMessage = effectiveBody.messages.some(m => m.role === 'system');
      if (!hasSystemMessage && matchedPreset.system_prompt) {
        effectiveBody.messages.unshift({
          role: 'system',
          content: matchedPreset.system_prompt
        });
      }
      if (effectiveBody.temperature === undefined && matchedPreset.temperature !== undefined) {
        effectiveBody.temperature = matchedPreset.temperature;
      }
      if (effectiveBody.max_tokens === undefined && matchedPreset.max_tokens) {
        effectiveBody.max_tokens = matchedPreset.max_tokens;
      }
    }
  }

  // Execute gateway completion with Routing Policy, Retries and Automatic Failover
  const routing = getRouting(matchedKey.workspace_id);
  const maxRetries = Math.min(5, Math.max(1, Number(routing.retry_count) || 2));
  const isStream = Boolean(effectiveBody.stream);

  // Find any configured fallback for this primary model
  const configuredFallback = (routing.fallbacks || []).find(f => {
    if (!f.primary || !f.fallback) return false;
    const prim = f.primary.toLowerCase().trim();
    const target = targetModel.toLowerCase().trim();
    return prim === target || target.endsWith(prim) || prim.endsWith(target);
  });

  // Attempt 1: Primary Model (with configured retries for transient 5xx)
  let lastAttemptResult = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    lastAttemptResult = await executeSingleGatewayAttempt({
      targetModel,
      body: effectiveBody,
      req,
      res,
      matchedKey,
      data,
      isStream,
      isFallback: false,
      originalModel: null,
    });

    if (lastAttemptResult.isStreamHandled || (lastAttemptResult.status && lastAttemptResult.status < 400)) {
      return lastAttemptResult;
    }

    // If client error (e.g. 400 Bad Request or 401 Unauthorized), do not retry
    if (lastAttemptResult.status >= 400 && lastAttemptResult.status < 500 && lastAttemptResult.status !== 429) {
      return lastAttemptResult;
    }
  }

  // Check if failover should trigger
  const status = lastAttemptResult?.status || 502;
  const is429 = status === 429;
  const is5xx = status >= 500;
  const shouldFailover = configuredFallback && (
    (is429 && routing.failover_on_429 !== false) ||
    (is5xx && routing.failover_on_5xx !== false) ||
    (configuredFallback.trigger === 'any_error')
  );

  // If failover is eligible and streaming response hasn't already sent HTTP headers
  if (shouldFailover && (!res || !res.headersSent)) {
    const fallbackModel = configuredFallback.fallback;
    console.log(`[gateway-routing] Primary model ${targetModel} failed (${status}). Failing over to fallback: ${fallbackModel}`);

    const fallbackResult = await executeSingleGatewayAttempt({
      targetModel: fallbackModel,
      body: effectiveBody,
      req,
      res,
      matchedKey,
      data,
      isStream,
      isFallback: true,
      originalModel: targetModel,
    });

    if (fallbackResult.isStreamHandled || (fallbackResult.status && fallbackResult.status < 400)) {
      return fallbackResult;
    }

    // If fallback also failed, return fallback result or primary result
    return fallbackResult;
  }

  return lastAttemptResult;
}

/**
 * Record direct chat studio / API usage into workspace metrics, logs, and activity timeseries.
 */
export function recordDirectUsageLog({ model, inputTokens, outputTokens, latencyMs, userEmail, plan, isCached = false }) {
  try {
    const data = loadData();
    const marginPct = data.profit_margin_pct || 20;
    const { baseCost, netrootProfit, billedCost } = calculateModelCost(model, inputTokens, outputTokens, marginPct);
    const totalTokens = (inputTokens || 0) + (outputTokens || 0);

    data.thisWeekUsage = data.thisWeekUsage || { spend_usd: 0, requests_count: 0, tokens_count: 0 };
    data.thisWeekUsage.spend_usd = Number((data.thisWeekUsage.spend_usd + billedCost).toFixed(5));
    data.thisWeekUsage.requests_count += 1;
    data.thisWeekUsage.tokens_count += totalTokens;
    data.thisWeekUsage.last_updated = new Date().toISOString();

    const provider = model?.includes('/') ? model.split('/')[0] : 'NetRoot AI';
    const logEntry = {
      id: `log_${crypto.randomBytes(4).toString('hex')}`,
      workspace_id: data.activeWorkspaceId || 'ws_default',
      timestamp: new Date().toISOString(),
      key_name: userEmail ? `Chat Studio (${userEmail.split('@')[0]})` : 'Chat Studio User',
      key_id: 'chat_session',
      model: model || 'openai/gpt-oss-20b',
      provider: provider,
      status: 200,
      cached_status: isCached,
      latency_ms: latencyMs || 450,
      prompt_tokens: inputTokens || 0,
      completion_tokens: outputTokens || 0,
      total_tokens: totalTokens,
      cost_usd: billedCost,
      profit_usd: netrootProfit,
      client_ip: '127.0.0.1',
    };

    data.logs = data.logs || [];
    data.logs.unshift(logEntry);
    if (data.logs.length > 500) data.logs = data.logs.slice(0, 500);

    // Update activity timeseries with standardized spend_usd and spend
    const todayStr = new Date().toISOString().slice(0, 10);
    data.activityTimeseries = data.activityTimeseries || [];
    const todayIndex = data.activityTimeseries.findIndex(d => d.date === todayStr);
    if (todayIndex !== -1) {
      data.activityTimeseries[todayIndex].requests += 1;
      data.activityTimeseries[todayIndex].tokens += totalTokens;
      const currentSpend = data.activityTimeseries[todayIndex].spend_usd ?? data.activityTimeseries[todayIndex].spend ?? 0;
      const newSpend = Number((currentSpend + billedCost).toFixed(4));
      data.activityTimeseries[todayIndex].spend_usd = newSpend;
      data.activityTimeseries[todayIndex].spend = newSpend;
    } else {
      const initialSpend = Number(billedCost.toFixed(4));
      data.activityTimeseries.push({
        date: todayStr,
        requests: 1,
        tokens: totalTokens,
        spend_usd: initialSpend,
        spend: initialSpend,
      });
      if (data.activityTimeseries.length > 7) {
        data.activityTimeseries = data.activityTimeseries.slice(-7);
      }
    }

    saveData(data);
  } catch (err) {
    console.warn('[workspaceService] recordDirectUsageLog warning:', err.message);
  }
}

// ── Team Members & RBAC ──
export function getWorkspaceMembers(workspaceId, userEmail = 'admin@netrootai.tech') {
  const data = loadData();
  const wsId = workspaceId || data.activeWorkspaceId || 'ws_default';
  data.members = data.members || [];

  // Ensure workspace has an owner
  let wsMembers = data.members.filter(m => m.workspace_id === wsId);
  if (!wsMembers.some(m => m.role === 'owner')) {
    const ownerMember = {
      id: `mem_owner_${wsId}`,
      workspace_id: wsId,
      email: userEmail,
      role: 'owner',
      status: 'active',
      created_at: new Date().toISOString(),
    };
    data.members.unshift(ownerMember);
    saveData(data);
    wsMembers = data.members.filter(m => m.workspace_id === wsId);
  }
  return wsMembers;
}

export function inviteWorkspaceMember(workspaceId, { email, role = 'developer', invitedBy = 'Owner' }) {
  if (!email || !email.includes('@')) throw new Error('A valid email address is required.');
  const data = loadData();
  const wsId = workspaceId || data.activeWorkspaceId || 'ws_default';
  data.members = data.members || [];

  const normalizedEmail = email.trim().toLowerCase();
  const existing = data.members.find(m => m.workspace_id === wsId && m.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new Error('This user is already a member of this workspace.');
  }

  const validRoles = ['admin', 'developer', 'viewer'];
  const assignedRole = validRoles.includes(role) ? role : 'developer';

  const newMember = {
    id: `mem_${crypto.randomBytes(6).toString('hex')}`,
    workspace_id: wsId,
    email: normalizedEmail,
    role: assignedRole,
    status: 'active',
    invited_by: invitedBy,
    created_at: new Date().toISOString(),
  };

  data.members.push(newMember);
  saveData(data);
  return newMember;
}

export function removeWorkspaceMember(workspaceId, memberId) {
  const data = loadData();
  const wsId = workspaceId || data.activeWorkspaceId || 'ws_default';
  data.members = data.members || [];

  const member = data.members.find(m => m.id === memberId && m.workspace_id === wsId);
  if (!member) throw new Error('Member not found.');
  if (member.role === 'owner') throw new Error('Workspace Owner cannot be removed.');

  data.members = data.members.filter(m => !(m.id === memberId && m.workspace_id === wsId));
  saveData(data);
  return { success: true };
}

export function updateWorkspaceMemberRole(workspaceId, memberId, newRole) {
  const data = loadData();
  const wsId = workspaceId || data.activeWorkspaceId || 'ws_default';
  data.members = data.members || [];

  const member = data.members.find(m => m.id === memberId && m.workspace_id === wsId);
  if (!member) throw new Error('Member not found.');
  if (member.role === 'owner') throw new Error('Owner role cannot be changed.');

  const validRoles = ['admin', 'developer', 'viewer'];
  if (!validRoles.includes(newRole)) throw new Error('Invalid role specified.');

  member.role = newRole;
  member.updated_at = new Date().toISOString();
  saveData(data);
  return member;
}

// ── Danger Zone Lifecycle Operations ──
export function resetWorkspaceConfig(workspaceId) {
  const data = loadData();
  const wsId = workspaceId || data.activeWorkspaceId || 'ws_default';

  // 1. Reset routing policy back to latency
  data.routingPolicies = (data.routingPolicies || []).filter(r => r.workspace_id !== wsId);
  data.routingPolicies.push({
    workspace_id: wsId,
    strategy: 'latency',
    retry_count: 2,
    timeout_seconds: 30,
    failover_on_429: true,
    failover_on_5xx: true,
    fallbacks: [],
    updated_at: new Date().toISOString(),
  });

  // 2. Clear custom classifiers for this workspace
  data.classifiers = (data.classifiers || []).filter(c => c.workspace_id !== wsId);

  // 3. Reset cache settings
  data.cacheSettings = (data.cacheSettings || []).filter(cs => cs.workspace_id !== wsId);

  // 4. Reset guardrails back to pristine defaults ($250 cap, 60 RPM, clean blocked lists)
  data.guardrails = {
    monthly_budget_cap_usd: 250,
    alert_threshold_pct: 80,
    rate_limit_rpm: 60,
    pii_masking_enabled: true,
    toxicity_filter_enabled: true,
    blocked_providers: [],
    disallowed_models: [],
  };

  saveData(data);
  return { success: true, message: 'Workspace configuration reset to default.' };
}

export function deleteWorkspace(workspaceId) {
  const data = loadData();
  data.workspaces = data.workspaces || [];

  const ws = data.workspaces.find(w => w.id === workspaceId);
  if (!ws) throw new Error('Workspace not found.');
  if (ws.is_default || ws.id === 'ws_default' || data.workspaces.length <= 1) {
    throw new Error('Default workspace cannot be deleted.');
  }

  // Purge workspace and all its child objects
  data.workspaces = data.workspaces.filter(w => w.id !== workspaceId);
  data.apiKeys = (data.apiKeys || []).filter(k => k.workspace_id !== workspaceId);
  data.routingPolicies = (data.routingPolicies || []).filter(r => r.workspace_id !== workspaceId);
  data.byokKeys = (data.byokKeys || []).filter(b => b.workspace_id !== workspaceId);
  data.presets = (data.presets || []).filter(p => p.workspace_id !== workspaceId);
  data.classifiers = (data.classifiers || []).filter(c => c.workspace_id !== workspaceId);
  data.files = (data.files || []).filter(f => f.workspace_id !== workspaceId);
  data.members = (data.members || []).filter(m => m.workspace_id !== workspaceId);

  // Redirect active workspace to the default workspace
  const defaultWs = data.workspaces.find(w => w.is_default) || data.workspaces[0];
  data.activeWorkspaceId = defaultWs.id;

  saveData(data);
  return {
    success: true,
    deletedId: workspaceId,
    activeWorkspaceId: data.activeWorkspaceId,
    activeWorkspace: defaultWs,
    workspaces: data.workspaces,
  };
}

