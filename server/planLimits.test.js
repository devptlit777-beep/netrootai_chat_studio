import test from 'node:test';
import assert from 'node:assert/strict';
import { getPlanLimits, canUseModel, canUseTokens } from './planLimits.js';

test('free plan allows only two models and a smaller token budget', () => {
    const freeLimits = getPlanLimits('free');
    assert.equal(freeLimits.dailyTokenLimit, 10000);
    assert.deepEqual(freeLimits.allowedModels, ['openai/gpt-oss-20b', 'llama-3.1-8b-instant', 'qwen/qwen3.6-27b']);
    assert.equal(canUseModel('free', 'openai/gpt-oss-20b'), true);
    assert.equal(canUseModel('free', 'llama-3.3-70b-versatile'), false);
    assert.equal(canUseTokens('free', 9999, 1000), true);
    assert.equal(canUseTokens('free', 10000, 1), false);
});

test('pro plan allows four models and a larger token budget', () => {
    const proLimits = getPlanLimits('pro');
    assert.equal(proLimits.dailyTokenLimit, 50000);
    assert.deepEqual(proLimits.allowedModels, ['openai/gpt-oss-20b', 'llama-3.1-8b-instant', 'qwen/qwen3.6-27b', 'llama-3.3-70b-versatile', 'openai/gpt-oss-120b']);
    assert.equal(canUseModel('pro', 'openai/gpt-oss-120b'), true);
    assert.equal(canUseTokens('pro', 49999, 2), true);
    assert.equal(canUseTokens('pro', 50000, 1), false);
});
