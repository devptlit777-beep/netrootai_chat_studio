import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CACHE_FILE = join(__dirname, 'modelsCache.json');

function isModelFreeInCache(modelId) {
    try {
        if (existsSync(CACHE_FILE)) {
            const cache = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
            const found = cache.find(m => m.id === modelId || m.id?.toLowerCase() === modelId?.toLowerCase());
            if (found && (found.is_free || (found.calculated_pricing?.prompt === 0 && found.calculated_pricing?.completion === 0))) {
                return true;
            }
        }
    } catch {
        // Fallback
    }
    return false;
}

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
        dailyTokenLimit: 50000,
        allowedModels: ['openai/gpt-oss-20b', 'allam-2-7b', 'qwen/qwen3.8-27b', 'ppt-studio'],
        allowedPlugins: ['web-search', 'calculator', 'pdf-search'],
    },
    pro: {
        dailyTokenLimit: 200000,
        allowedModels: ['openai/gpt-oss-20b', 'allam-2-7b', 'qwen/qwen3.8-27b', 'groq/compound-mini', 'openai/gpt-oss-120b', 'black-forest-labs/FLUX.1-schnell', 'ppt-studio'],
        allowedPlugins: ['web-search', 'calculator', 'pdf-search', 'json-transformer', 'arxiv', 'code-runner', 'github', 'notion', 'ppt-generator'],
    },
    enterprise: {
        dailyTokenLimit: null,
        allowedModels: ['openai/gpt-oss-20b', 'allam-2-7b', 'qwen/qwen3.8-27b', 'groq/compound-mini', 'openai/gpt-oss-120b', 'black-forest-labs/FLUX.1-schnell', 'ppt-studio'],
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
    if (limits.allowedModels.includes(normalizedModel)) return true;
    const normPlan = normalizePlan(plan);
    // Any model marked with :free is allowed on free plan
    if (normalizedModel.endsWith(':free') || normalizedModel.includes(':free')) {
        return true;
    }
    // Catalog models verified as 100% free with zero token pricing
    if (normPlan === 'free' && isModelFreeInCache(normalizedModel)) {
        return true;
    }
    // Pro and Enterprise have access to all 470+ frontier and open-source models
    if (normPlan === 'pro' || normPlan === 'enterprise') {
        return true;
    }
    return false;
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
