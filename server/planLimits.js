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

const PLAN_LIMITS = {
    free: {
        dailyTokenLimit: 10000,
        allowedModels: ['openai/gpt-oss-20b', 'allam-2-7b', 'qwen/qwen3.8-27b'],
        allowedPlugins: ['web-search', 'calculator', 'pdf-search', 'ppt-generator'],
    },
    pro: {
        dailyTokenLimit: 100000,
        allowedModels: ['openai/gpt-oss-20b', 'allam-2-7b', 'qwen/qwen3.8-27b', 'groq/compound-mini', 'openai/gpt-oss-120b', 'black-forest-labs/FLUX.1-schnell'],
        allowedPlugins: ['web-search', 'calculator', 'pdf-search', 'json-transformer', 'arxiv', 'code-runner', 'github', 'notion', 'ppt-generator'],
    },
    enterprise: {
        dailyTokenLimit: null,
        allowedModels: ['openai/gpt-oss-20b', 'allam-2-7b', 'qwen/qwen3.8-27b', 'groq/compound-mini', 'openai/gpt-oss-120b', 'black-forest-labs/FLUX.1-schnell'],
        allowedPlugins: ['web-search', 'calculator', 'pdf-search', 'json-transformer', 'arxiv', 'code-runner', 'github', 'notion', 'jira', 'slack', 'linear', 'ppt-generator'],
    },
};

function normalizePlan(plan) {
    const p = String(plan || '').toLowerCase().trim();
    if (p === 'pro') return 'pro';
    if (p === 'enterprise') return 'enterprise';
    return 'free';
}

function normalizeModel(model) {
    return MODEL_ALIASES[model] || model;
}

function getPlanLimits(plan) {
    return PLAN_LIMITS[normalizePlan(plan)] || PLAN_LIMITS.free;
}

function canUseModel(plan, model) {
    const limits = getPlanLimits(plan);
    const normalizedModel = normalizeModel(model);
    return limits.allowedModels.includes(normalizedModel);
}

function getModelImageLimit(plan, model) {
    const normalizedPlan = normalizePlan(plan);
    const normalizedModel = normalizeModel(model);
    const limits = MODEL_IMAGE_LIMITS[normalizedModel];
    if (!limits) return 0;
    return limits[normalizedPlan] ?? 0;
}

function canUseImageGeneration(plan, model, usedImagesToday = 0) {
    const limit = getModelImageLimit(plan, model);
    if (limit <= 0) return false;
    return usedImagesToday < limit;
}

function canUseTokens(plan, usedTokens, requestedTokens = 0) {
    const limits = getPlanLimits(plan);
    return usedTokens + requestedTokens <= limits.dailyTokenLimit;
}

export { PLAN_LIMITS, normalizePlan, normalizeModel, getPlanLimits, canUseModel, getModelImageLimit, canUseImageGeneration, canUseTokens };
