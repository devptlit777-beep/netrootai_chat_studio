const PLAN_LIMITS = {
    free: {
        dailyTokenLimit: 10000,
        allowedModels: ['openai/gpt-oss-20b', 'llama-3.1-8b-instant', 'qwen/qwen3.6-27b'],
    },
    pro: {
        dailyTokenLimit: 50000,
        allowedModels: ['openai/gpt-oss-20b', 'llama-3.1-8b-instant', 'qwen/qwen3.6-27b', 'llama-3.3-70b-versatile', 'openai/gpt-oss-120b'],
    },
};

function normalizePlan(plan) {
    if (plan === 'pro') return 'pro';
    if (plan === 'enterprise') return 'pro';
    return 'free';
}

function getPlanLimits(plan) {
    return PLAN_LIMITS[normalizePlan(plan)] || PLAN_LIMITS.free;
}

function canUseModel(plan, model) {
    const limits = getPlanLimits(plan);
    return limits.allowedModels.includes(model);
}

function canUseTokens(plan, usedTokens, requestedTokens = 0) {
    const limits = getPlanLimits(plan);
    return usedTokens + requestedTokens <= limits.dailyTokenLimit;
}

export { PLAN_LIMITS, normalizePlan, getPlanLimits, canUseModel, canUseTokens };
