import test from 'node:test';
import assert from 'node:assert/strict';
import { getPlanLimits, canUseModel, canUseTokens, getModelImageLimit, canUseImageGeneration } from './planLimits.js';

test('free plan allows only two models and a smaller token budget', () => {
    const freeLimits = getPlanLimits('free');
    assert.equal(freeLimits.dailyTokenLimit, 10000);
    assert.deepEqual(freeLimits.allowedModels, ['openai/gpt-oss-20b', 'allam-2-7b', 'qwen/qwen3.8-27b']);
    assert.equal(canUseModel('free', 'openai/gpt-oss-20b'), true);
    assert.equal(canUseModel('free', 'qwen/qwen3.6-27b'), true);
    assert.equal(canUseModel('free', 'groq/compound-mini'), false);
    assert.equal(canUseTokens('free', 9999, 1), true);
    assert.equal(canUseTokens('free', 10000, 1), false);
});

test('pro plan allows four models and a larger token budget', () => {
    const proLimits = getPlanLimits('pro');
    assert.equal(proLimits.dailyTokenLimit, 100000);
    assert.deepEqual(proLimits.allowedModels, ['openai/gpt-oss-20b', 'allam-2-7b', 'qwen/qwen3.8-27b', 'groq/compound-mini', 'openai/gpt-oss-120b', 'black-forest-labs/FLUX.1-schnell']);
    assert.equal(canUseModel('pro', 'openai/gpt-oss-120b'), true);
    assert.equal(canUseTokens('pro', 99999, 1), true);
    assert.equal(canUseTokens('pro', 100000, 1), false);
});

test('FLUX image generation is capped at 10 per month for Pro users', () => {
    assert.equal(getModelImageLimit('free', 'black-forest-labs/FLUX.1-schnell'), 0);
    assert.equal(getModelImageLimit('pro', 'black-forest-labs/FLUX.1-schnell'), 10);
    assert.equal(getModelImageLimit('enterprise', 'black-forest-labs/FLUX.1-schnell'), 10);
    assert.equal(canUseImageGeneration('pro', 'black-forest-labs/FLUX.1-schnell', 9), true);
    assert.equal(canUseImageGeneration('pro', 'black-forest-labs/FLUX.1-schnell', 10), false);
});
