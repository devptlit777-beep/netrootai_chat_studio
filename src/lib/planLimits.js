const DEFAULT_PLAN_LIMITS = {
    free: {
        dailyTokenLimit: 10000,
        allowedModels: ['openai/gpt-oss-20b', 'llama-3.1-8b-instant', 'qwen/qwen3.6-27b'],
    },
    pro: {
        dailyTokenLimit: 100000,
        allowedModels: ['openai/gpt-oss-20b', 'llama-3.1-8b-instant', 'qwen/qwen3.6-27b', 'llama-3.3-70b-versatile', 'openai/gpt-oss-120b'],
    },
    enterprise: {
        dailyTokenLimit: null,
        allowedModels: ['openai/gpt-oss-20b', 'llama-3.1-8b-instant', 'qwen/qwen3.6-27b', 'llama-3.3-70b-versatile', 'openai/gpt-oss-120b'],
    },
};

function normalizePlan(plan) {
    if (plan === 'pro') return 'pro';
    if (plan === 'enterprise') return 'enterprise';
    return 'free';
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
            };
        }
        return merged;
    } catch {
        return DEFAULT_PLAN_LIMITS;
    }
}

export { DEFAULT_PLAN_LIMITS, normalizePlan, fetchPlanLimits };
