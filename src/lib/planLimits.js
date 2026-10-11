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
        dailyTokenLimit: 10000,
        allowedModels: ['openai/gpt-oss-20b', 'allam-2-7b', 'qwen/qwen3.8-27b'],
        allowedPlugins: ['web-search', 'calculator', 'pdf-search', 'ppt-generator'],
    },
    pro: {
        dailyTokenLimit: 100000,
        allowedModels: ['openai/gpt-oss-20b', 'allam-2-7b', 'qwen/qwen3.8-27b', 'groq/compound-mini', 'openai/gpt-oss-120b', 'black-forest-labs/FLUX.1-schnell'],
        allowedPlugins: ['web-search', 'calculator', 'pdf-search', 'arxiv', 'code-runner', 'github', 'notion', 'ppt-generator'],
    },
    enterprise: {
        dailyTokenLimit: null,
        allowedModels: ['openai/gpt-oss-20b', 'allam-2-7b', 'qwen/qwen3.8-27b', 'groq/compound-mini', 'openai/gpt-oss-120b', 'black-forest-labs/FLUX.1-schnell'],
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
                allowedPlugins: DEFAULT_PLAN_LIMITS[key]?.allowedPlugins ?? data.planLimits[key].allowedPlugins,
            };
        }
        return merged;
    } catch {
        return DEFAULT_PLAN_LIMITS;
    }
}

export { DEFAULT_PLAN_LIMITS, normalizePlan, normalizeModel, getModelImageLimit, fetchPlanLimits };
