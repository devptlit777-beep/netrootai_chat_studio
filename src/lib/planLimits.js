const MODEL_ALIASES = {
    'qwen/qwen3.6-27b': 'qwen/qwen3.8-27b',
};

const MODEL_IMAGE_LIMITS = {
    'black-forest-labs/FLUX.1-schnell': {
        free: 0,
        pro: 10,
        enterprise: 10,
    },
};

const DEFAULT_PLAN_LIMITS = {
    free: {
        dailyTokenLimit: 50000,
        allowedModels: ['openai/gpt-oss-20b', 'allam-2-7b', 'qwen/qwen3.8-27b', 'ppt-studio'],
        allowedPlugins: ['web-search', 'calculator', 'pdf-search'],
    },
    pro: {
        dailyTokenLimit: 200000,
        allowedModels: ['openai/gpt-oss-20b', 'allam-2-7b', 'qwen/qwen3.8-27b', 'groq/compound-mini', 'openai/gpt-oss-120b', 'black-forest-labs/FLUX.1-schnell', 'ppt-studio'],
        allowedPlugins: ['web-search', 'calculator', 'pdf-search', 'arxiv', 'code-runner', 'github', 'notion', 'ppt-generator'],
    },
    enterprise: {
        dailyTokenLimit: null,
        allowedModels: ['openai/gpt-oss-20b', 'allam-2-7b', 'qwen/qwen3.8-27b', 'groq/compound-mini', 'openai/gpt-oss-120b', 'black-forest-labs/FLUX.1-schnell', 'ppt-studio'],
        allowedPlugins: ['web-search', 'calculator', 'pdf-search', 'arxiv', 'code-runner', 'github', 'notion', 'jira', 'slack', 'linear', 'ppt-generator'],
    },
};

function normalizePlan(plan) {
    if (plan === 'pro') return 'pro';
    if (plan === 'enterprise') return 'enterprise';
    return 'free';
}

function normalizeModel(model) {
    return MODEL_ALIASES[model] || model;
}

function getModelImageLimit(plan, model) {
    const normalizedPlan = normalizePlan(plan);
    const normalizedModel = normalizeModel(model);
    const limits = MODEL_IMAGE_LIMITS[normalizedModel];
    if (!limits) return 0;
    return limits[normalizedPlan] ?? 0;
}

async function fetchPlanLimits() {
    try {
        const res = await fetch('/api/plan-limits');
        if (!res.ok) throw new Error('Failed to load plan limits');
        const data = await res.json();
        const merged = { ...DEFAULT_PLAN_LIMITS };
        for (const key of Object.keys(data.planLimits || {})) {
            merged[key] = {
                ...DEFAULT_PLAN_LIMITS[key],
                ...data.planLimits[key],
                allowedModels: DEFAULT_PLAN_LIMITS[key]?.allowedModels ?? data.planLimits[key].allowedModels,
                allowedPlugins: DEFAULT_PLAN_LIMITS[key]?.allowedPlugins ?? data.planLimits[key].allowedPlugins,
            };
        }
        return merged;
    } catch {
        return DEFAULT_PLAN_LIMITS;
    }
}

function canUseModel(plan, model, cachedModels = []) {
    const normPlan = normalizePlan(plan);
    const normalizedModel = normalizeModel(model);
    const limits = DEFAULT_PLAN_LIMITS[normPlan] || DEFAULT_PLAN_LIMITS.free;
    if (limits.allowedModels.includes(normalizedModel)) return true;
    if (normalizedModel.endsWith(':free') || normalizedModel.includes(':free')) {
        return true;
    }
    // Catalog models verified as 100% free with zero token pricing
    if (normPlan === 'free' && Array.isArray(cachedModels) && cachedModels.length > 0) {
        const found = cachedModels.find(m => m.id === normalizedModel || m.id?.toLowerCase() === normalizedModel?.toLowerCase());
        if (found && (found.is_free || (found.calculated_pricing?.prompt === 0 && found.calculated_pricing?.completion === 0))) {
            return true;
        }
    }
    // Pro and Enterprise have access to all 470+ frontier and open-source models
    if (normPlan === 'pro' || normPlan === 'enterprise') {
        return true;
    }
    return false;
}

export { DEFAULT_PLAN_LIMITS, normalizePlan, normalizeModel, getModelImageLimit, fetchPlanLimits, canUseModel };
