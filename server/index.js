import { createServer } from 'node:http';
import https from 'node:https';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import * as yaml from 'js-yaml';
import { PLAN_LIMITS, canUseModel, canUseTokens, getPlanLimits, normalizeModel, normalizePlan, canUseImageGeneration, getModelImageLimit } from './planLimits.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const PORT = Number(process.env.API_PORT || process.env.PORT || 3001);
const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/responses';
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

const VISION_MODELS = new Set([
    'qwen/qwen3.8-27b',
    'qwen/qwen3.6-27b',
]);


loadEnvFile();

const AI_PROVIDER = (process.env.AI_PROVIDER || 'openai').toLowerCase();
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'NetRoot AI <noreply@netrootai.tech>';


function loadEnvFile() {
    const isProd = process.env.NODE_ENV === 'production' || process.env.IS_VPS === 'true';
    const envFile = isProd && existsSync(join(PROJECT_ROOT, '.env.production')) ? '.env.production' : '.env';
    const envPath = join(PROJECT_ROOT, envFile);
    if (!existsSync(envPath)) return;
    console.log(`[env] loading ${envFile}`);
    const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const sep = trimmed.indexOf('=');
        if (sep === -1) continue;
        const key = trimmed.slice(0, sep).trim();
        const value = trimmed.slice(sep + 1).trim().replace(/^['"]|['"]$/g, '');
        if (key && process.env[key] === undefined) process.env[key] = value;
    }
}

function sendJson(res, statusCode, payload, req) {
    const origin = req?.headers?.origin || '';
    const allowed = ['http://127.0.0.1:5173', 'http://localhost:5173', 'https://netrootai.tech', 'https://ampjiasvmmhxeqwdullc.supabase.co'];
    const corsOrigin = allowed.includes(origin) ? origin : '*';
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-email, stripe-signature',
    });
    res.end(JSON.stringify(payload));
}

// ─── Usage Store (Supabase-backed — shared across local + VPS) ────────────────────

function getSupabaseClient() {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { persistSession: false } });
}

async function getEnabledUserPlugins(userId) {
    if (!userId) return [];

    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase service client is unavailable.');
    }

    const { data, error } = await supabase
        .from('user_plugins')
        .select('plugin_id, config')
        .eq('user_id', userId)
        .eq('enabled', true);

    if (error) {
        throw error;
    }

    return data || [];
}

async function recordUsage({ inputTokens, outputTokens, cachedTokens, latencyMs, model, userEmail, plan, prompt }) {
    const sb = getSupabaseClient();
    if (!sb) {
        console.warn('[usage] Supabase client not available — check VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars');
        return;
    }
    const promptText = typeof prompt === 'string' ? prompt.trim() : String(prompt || '').trim();
    try {
        const { error } = await sb.from('usage_logs').insert({
            ts: Date.now(),
            user_email: userEmail?.toLowerCase?.() || null,
            model,
            plan: normalizePlan(plan),
            input_tokens: inputTokens || 0,
            output_tokens: outputTokens || 0,
            cached_tokens: cachedTokens || 0,
            latency_ms: latencyMs || 0,
            prompt: promptText || null,
        });
        if (error) console.error('[usage] insert failed:', error.message, error.details || '');
        else console.log('[usage] recorded:', userEmail, inputTokens + outputTokens, 'tokens');
    } catch (error) {
        console.error('[usage] insert exception:', error.message);
    }
}

async function queryUsage(whereClause = {}) {
    const sb = getSupabaseClient();
    if (!sb) return [];
    const cutoff = Date.now() - 90 * 86400000;
    let q = sb.from('usage_logs').select('*').gte('ts', cutoff).order('ts', { ascending: false }).limit(50000);
    if (whereClause.userEmail) q = q.eq('user_email', whereClause.userEmail.toLowerCase());
    if (whereClause.since) q = q.gte('ts', whereClause.since);
    const { data, error } = await q;
    if (error) { console.warn('[usage] query error:', error.message); return []; }
    return (data || []).map(r => ({
        ts: r.ts,
        userEmail: r.user_email,
        model: r.model,
        plan: r.plan,
        inputTokens: r.input_tokens,
        outputTokens: r.output_tokens,
        cachedTokens: r.cached_tokens,
        latencyMs: r.latency_ms,
        prompt: r.prompt || r.query || r.message || null,
    }));
}

function estimateRequestTokens(prompt, attachments = []) {
    const promptText = String(prompt || '').trim();
    const attachmentText = Array.isArray(attachments) ? attachments.map(a => a.name || '').join(' ') : '';
    return Math.max(300, Math.ceil((promptText.length + attachmentText.length) / 3));
}

function getTodayUserUsage(userEmail) {
    // Synchronous fallback — returns 0, actual limit check uses async path
    return 0;
}

async function getTodayUserUsageAsync(userEmail) {
    const cutoff = Date.now() - 86400000;
    const entries = await queryUsage({ userEmail, since: cutoff });
    return entries.reduce((sum, e) => sum + e.inputTokens + e.outputTokens, 0);
}

async function getCurrentMonthImageUsageAsync(userEmail, modelName) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const entries = await queryUsage({ userEmail, since: monthStart });
    return entries.filter(e => e.model === modelName).length;
}

async function getUserLifetimePptCount(sb, userId, userEmail) {
    if (!sb) return 0;
    try {
        if (userId) {
            const { data } = await sb.from('profiles').select('lifetime_ppt_count').eq('id', userId).maybeSingle();
            if (data && typeof data.lifetime_ppt_count === 'number') {
                return data.lifetime_ppt_count;
            }
        }
    } catch {}
    try {
        if (userEmail) {
            const { count } = await sb.from('usage_logs').select('id', { count: 'exact', head: true })
                .eq('user_email', String(userEmail).toLowerCase())
                .in('model', ['ppt-generator', 'ppt-studio']);
            if (typeof count === 'number') return count;
        }
    } catch {}
    return 0;
}

async function incrementUserLifetimePptCount(sb, userId, currentCount = 0) {
    if (!sb || !userId) return;
    try {
        await sb.from('profiles').update({ lifetime_ppt_count: currentCount + 1 }).eq('id', userId);
    } catch (e) {
        console.warn('[ppt] failed to increment lifetime_ppt_count:', e.message);
    }
}

const memoryDeckAiEdits = new Map();

async function getDeckAiEditsCount(sb, deckId) {
    if (!deckId) return 0;
    let count = memoryDeckAiEdits.get(String(deckId)) || 0;
    if (sb) {
        try {
            const { data } = await sb.from('user_decks').select('ai_edits_count').eq('id', deckId).maybeSingle();
            if (data && typeof data.ai_edits_count === 'number') {
                count = Math.max(count, data.ai_edits_count);
            }
        } catch {}
    }
    return count;
}

async function incrementDeckAiEditsCount(sb, deckId, currentCount = 0) {
    if (!deckId) return;
    const nextCount = currentCount + 1;
    memoryDeckAiEdits.set(String(deckId), nextCount);
    if (sb) {
        try {
            await sb.from('user_decks').update({ ai_edits_count: nextCount }).eq('id', deckId);
        } catch (e) {
            console.warn('[ppt] notice on user_decks ai_edits_count update:', e.message);
        }
    }
}

async function resolveUserPlan(req, body = {}) {
    let email = body.email || body.user?.email || body.userEmail || req.headers['x-user-email'] || '';
    const authHeader = req.headers['authorization'] || '';
    if (!email && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const sb = getSupabaseClient();
        if (sb) {
            try {
                const { data: { user: authUser } } = await sb.auth.getUser(token);
                if (authUser?.email) email = authUser.email;
            } catch {}
        }
    }
    if (!email) return { plan: 'free', email: null, lifetimePptCount: 0 };

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) return { plan: 'free', email: String(email).toLowerCase(), lifetimePptCount: 0 };

    try {
        const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
        const { data: { users } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const found = users?.find(u => u.email?.toLowerCase() === String(email).toLowerCase());
        if (!found) return { plan: 'free', email: String(email).toLowerCase(), lifetimePptCount: 0 };

        const [{ data: profile }, { data: subscription }] = await Promise.all([
            supabase.from('profiles').select('plan, free_trial_ends_at, feature_access').eq('id', found.id).single(),
            supabase.from('subscriptions').select('plan, status, current_period_end, cancel_at_period_end, interval_months').eq('user_id', found.id).maybeSingle(),
        ]);
        const summary = subscriptionSummary(subscription, profile?.plan || 'free', profile?.free_trial_ends_at);
        const lifetimePptCount = await getUserLifetimePptCount(supabase, found.id, email);
        return { plan: summary.effective_plan, email: String(email).toLowerCase(), userId: found.id, accessExpired: summary.access_expired, featureAccess: profile?.feature_access || {}, lifetimePptCount };
    } catch (err) {
        console.warn('[plan] failed to resolve user plan:', err.message);
        return { plan: 'free', email: String(email).toLowerCase(), lifetimePptCount: 0 };
    }
}

function buildTimeline(entries, days) {
    const buckets = {};
    const now = Date.now();
    const DAY = 86400000;
    const LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (const e of entries) {
        const d = Math.floor((now - e.ts) / DAY);
        buckets[d] = (buckets[d] || 0) + e.inputTokens + e.outputTokens;
    }
    return Array.from({ length: Math.min(days, 7) }, (_, i) => {
        const d = Math.min(days, 7) - 1 - i;
        return { label: LABELS[new Date(now - d * DAY).getDay()], tokens: buckets[d] || 0 };
    });
}

function handlePlanLimits(req, res) {
    sendJson(res, 200, {
        planLimits: PLAN_LIMITS,
    });
}

async function handleUsage(req, res, userEmail = null) {
    const url = new URL(req.url, 'http://127.0.0.1');
    const period = url.searchParams.get('period') || '30d';
    const days = period === '1d' ? 1 : period === '7d' ? 7 : 30;
    const label = period === '1d' ? 'Last 24 hours' : period === '7d' ? 'Last 7 days' : 'Last 30 days';
    const since = Date.now() - days * 86400000;
    const entries = await queryUsage({ since, userEmail });
    const entries30d = days === 30 ? entries : await queryUsage({ since: Date.now() - 30 * 86400000, userEmail });
    const entries24h = entries30d.filter(entry => entry.ts >= Date.now() - 86400000);

    const inputTokens = entries.reduce((s, e) => s + e.inputTokens, 0);
    const outputTokens = entries.reduce((s, e) => s + e.outputTokens, 0);
    const cachedTokens = entries.reduce((s, e) => s + e.cachedTokens, 0);
    const totalRequests = entries.length;
    const averageLatencyMs = totalRequests ? Math.round(entries.reduce((s, e) => s + e.latencyMs, 0) / totalRequests) : 0;

    const promptPrice = Number(process.env.GROQ_PROMPT_PRICE || '0.000000075');
    const completionPrice = Number(process.env.GROQ_COMPLETION_PRICE || '0.0000003');
    const cachePrice = Number(process.env.GROQ_CACHE_PRICE || '0.0000000375');
    const totalSpend = Number(((inputTokens - cachedTokens) * promptPrice + outputTokens * completionPrice + cachedTokens * cachePrice).toFixed(6));

    const modelId = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
    const MODEL_LIMITS = {
        'openai/gpt-oss-20b': { dailyLimit: 200000, contextWindow: 131072, displayName: 'GPT OSS 20B' },
        'openai/gpt-oss-120b': { dailyLimit: 200000, contextWindow: 131072, displayName: 'GPT OSS 120B' },
        'openai/gpt-oss-safeguard-20b': { dailyLimit: 200000, contextWindow: 131072, displayName: 'GPT OSS Safeguard 20B' },
        'llama-3.3-70b-versatile': { dailyLimit: 100000, contextWindow: 131072, displayName: 'Llama 3.3 70B' },
        'llama-3.1-8b-instant': { dailyLimit: 500000, contextWindow: 131072, displayName: 'Llama 3.1 8B' },
        'meta-llama/llama-4-scout-17b-16e-instruct': { dailyLimit: 500000, contextWindow: 131072, displayName: 'Llama 4 Scout 17B' },
        'meta-llama/llama-4-maverick-17b-128e-instruct': { dailyLimit: 500000, contextWindow: 131072, displayName: 'Llama 4 Maverick 17B' },
        'meta-llama/llama-prompt-guard-2-22m': { dailyLimit: 500000, contextWindow: 512, displayName: 'Llama Guard 2 22M' },
        'meta-llama/llama-prompt-guard-2-86m': { dailyLimit: 500000, contextWindow: 512, displayName: 'Llama Guard 2 86M' },
        'allam-2-7b': { dailyLimit: 500000, contextWindow: 4096, displayName: 'ALLaM 2 7B' },
        'groq/compound': { dailyLimit: null, contextWindow: 131072, displayName: 'Compound' },
        'groq/compound-mini': { dailyLimit: null, contextWindow: 131072, displayName: 'Compound Mini' },
        'black-forest-labs/FLUX.1-schnell': { dailyLimit: 100000, contextWindow: 0, displayName: 'FLUX.1 Schnell' },
        'ppt-studio': { dailyLimit: 100000, contextWindow: 131072, displayName: 'NetRoot AI PPT Studio' },
        'ppt-generator': { dailyLimit: 100000, contextWindow: 131072, displayName: 'NetRoot AI PPT Generator' },
    };
    const modelInfo = MODEL_LIMITS[modelId] || { dailyLimit: 200000, contextWindow: 131072, displayName: modelId };
    const todayEntries = entries.filter(e => e.ts >= Date.now() - 86400000);
    const tokensUsedToday = todayEntries.reduce((s, e) => s + e.inputTokens + e.outputTokens, 0);

    // Per-model token usage for today
    const perModelTokens = {};
    for (const e of todayEntries) {
        let m = e.model || modelId;
        if (m === 'ppt-generator') m = 'ppt-studio';
        perModelTokens[m] = (perModelTokens[m] || 0) + e.inputTokens + e.outputTokens;
    }

    const perModel = {};
    for (const entry of entries30d) {
        let model = entry.model || modelId;
        if (model === 'ppt-generator') model = 'ppt-studio';
        if (!perModel[model]) perModel[model] = { tokens: 0, requests: 0 };
        perModel[model].tokens += entry.inputTokens + entry.outputTokens;
        perModel[model].requests += 1;
    }

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const fluxModelId = 'black-forest-labs/FLUX.1-schnell';
    const perModelImages = { [fluxModelId]: 0 };
    for (const entry of entries30d) {
        const entryModel = String(entry.model || '').trim().toLowerCase();
        if (entryModel !== fluxModelId) continue;
        if (entry.ts < monthStart) continue;
        perModelImages[fluxModelId] += 1;
    }

    const dailyLimit = modelInfo.dailyLimit;
    const remainingTokens = dailyLimit !== null ? Math.max(0, dailyLimit - tokensUsedToday) : null;
    const usedPercent = dailyLimit !== null ? Math.min(100, Math.round((tokensUsedToday / dailyLimit) * 100)) : 0;

    sendJson(res, 200, {
        model: modelId, modelDisplayName: modelInfo.displayName, contextWindow: modelInfo.contextWindow,
        dailyTokenLimit: dailyLimit, tokensUsedToday, remainingTokens, usedPercent,
        perModelTokens,
        perModelImages,
        imageUsageThisMonth: perModelImages[fluxModelId],
        tokens24h: entries24h.reduce((sum, entry) => sum + entry.inputTokens + entry.outputTokens, 0),
        tokens30d: entries30d.reduce((sum, entry) => sum + entry.inputTokens + entry.outputTokens, 0),
        requests30d: entries30d.length,
        avgLatency30d: entries30d.length ? Math.round(entries30d.reduce((sum, entry) => sum + entry.latencyMs, 0) / entries30d.length) : 0,
        perModel,
        periodLabel: label, period, totalSpend, totalTokens: inputTokens + outputTokens,
        inputTokens, outputTokens, cachedTokens, totalRequests, averageLatencyMs,
        tokenTimeline: buildTimeline(entries, days),
    });
}

function readJson(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; if (body.length > 4 * 1024 * 1024) { req.destroy(); reject(new Error('Body too large')); } });
        req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Invalid JSON')); } });
        req.on('error', reject);
    });
}

// ─── Plugin Handlers ─────────────────────────────────────────────────────────

// Web Search — Brave API when available, DuckDuckGo fallback otherwise
async function runWebSearch(query, apiKey) {
    try {
        if (apiKey) {
            const res = await fetch(
                `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5&text_decorations=false&search_lang=en`,
                {
                    headers: {
                        Accept: 'application/json',
                        'Accept-Encoding': 'gzip',
                        'X-Subscription-Token': apiKey,
                    },
                }
            );
            const data = await res.json();
            if (!res.ok) return `Search API error: ${data.message || res.status}`;
            const results = (data.web?.results || []).slice(0, 5).map(r =>
                `Title: ${r.title}\nSnippet: ${r.description || ''}\nURL: ${r.url}`
            );
            return results.length
                ? `Live web search results for "${query}":\n\n${results.join('\n\n')}`
                : 'No results found.';
        }

        const res = await fetch(
            `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NetRootAI/1.0',
                    Accept: 'text/html,application/xhtml+xml',
                },
            }
        );
        const html = await res.text();
        if (!res.ok) return `Search failed: HTTP ${res.status}`;

        const results = [];
        const itemRegex = /<div class="result results_links[^>]*>[\s\S]*?<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
        let match;
        while ((match = itemRegex.exec(html)) !== null && results.length < 5) {
            const url = match[1];
            const title = match[2]
                .replace(/<[^>]+>/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#x27;/g, "'")
                .replace(/\s+/g, ' ')
                .trim();
            const snippet = match[3]
                .replace(/<[^>]+>/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#x27;/g, "'")
                .replace(/\s+/g, ' ')
                .trim();
            results.push(`Title: ${title}\nSnippet: ${snippet}\nURL: ${url}`);
        }

        return results.length
            ? `Live web search results for "${query}":\n\n${results.join('\n\n')}`
            : 'No results found.';
    } catch (e) { return `Search failed: ${e.message}`; }
}
async function loadPdfJs() {
    return import('pdfjs-dist/legacy/build/pdf.mjs');
}

async function extractPdfTextFromUrl(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`PDF fetch failed: HTTP ${response.status}`);

    const buffer = await response.arrayBuffer();
    const pdfjs = await loadPdfJs();
    const document = await pdfjs.getDocument({
        data: new Uint8Array(buffer),
        disableWorker: true,
    }).promise;

    const pages = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const text = textContent.items
            .map((item) => item.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
        pages.push({ pageNumber, text });
    }

    return pages;
}

async function runPdfSearch(prompt, attachments) {
    try {
        const pdfAttachments = Array.isArray(attachments)
            ? attachments.filter((a) =>
                a.url &&
                (
                    a.file_type?.toLowerCase() === 'application/pdf' ||
                    a.name?.toLowerCase().endsWith('.pdf')
                )
            )
            : [];

        if (pdfAttachments.length === 0) return null;

        const terms = Array.from(
            new Set(
                String(prompt || '')
                    .toLowerCase()
                    .split(/[^a-z0-9]+/)
                    .filter((word) => word.length >= 3)
            )
        );

        const sections = [];

        for (const attachment of pdfAttachments) {
            try {
                const pages = await extractPdfTextFromUrl(attachment.url);
                const hits = [];

                for (const page of pages) {
                    const text = page.text || '';
                    if (!text) continue;

                    if (terms.length === 0) {
                        hits.push(`Page ${page.pageNumber}: ${text.slice(0, 280)}`);
                    } else {
                        const lower = text.toLowerCase();
                        const term = terms.find((t) => lower.includes(t));
                        if (!term) continue;

                        const index = lower.indexOf(term);
                        const start = Math.max(0, index - 120);
                        const end = Math.min(text.length, index + term.length + 180);
                        const snippet = text.slice(start, end).replace(/\s+/g, ' ').trim();
                        hits.push(`Page ${page.pageNumber}: ${snippet}`);
                    }

                    if (hits.length >= 4) break;
                }

                if (hits.length > 0) {
                    sections.push(`[PDF: ${attachment.name || 'document'}]\n${hits.join('\n')}`);
                }
            } catch (error) {
                sections.push(`[PDF: ${attachment.name || 'document'} error]\n${error.message}`);
            }
        }

        return sections.length > 0
            ? `PDF.js search results for "${prompt}":\n\n${sections.join('\n\n')}`
            : 'No readable PDF content found.';
    } catch (error) {
        return `PDF search failed: ${error.message}`;
    }
}
// Image Generation — FLUX.1-schnell via HuggingFace (nscale provider)
function hfRequest(prompt, token) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            model: 'black-forest-labs/FLUX.1-schnell',
            prompt,
            num_inference_steps: 4,
            width: 1024,
            height: 1024,
        });
        const options = {
            hostname: 'router.huggingface.co',
            path: '/nscale/v1/images/generations',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
            },
            timeout: 120000,
        };
        const req = https.request(options, (hfRes) => {
            const chunks = [];
            hfRes.on('data', c => chunks.push(c));
            hfRes.on('end', () => resolve({ status: hfRes.statusCode, buffer: Buffer.concat(chunks) }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('HuggingFace request timed out')); });
        req.write(data);
        req.end();
    });
}

const AGNES_VIDEO_MODEL = 'agnes-video-2.5-flash';

async function handleImageStudio(req, res) {
    const body = await readJson(req);
    const prompt = String(body.prompt || '').trim();
    if (!prompt) { sendJson(res, 400, { error: 'Prompt is required.' }, req); return; }

    const { accessExpired, featureAccess } = await resolveUserPlan(req, body);
    if (accessExpired && !featureAccess?.['image-studio']) {
        sendJson(res, 403, { error: 'Upgrade to Pro to access Image Studio.' }, req);
        return;
    }

    const hfToken = process.env.HF_IMAGE_TOKEN || process.env.HF_TOKEN;
    if (!hfToken) { sendJson(res, 500, { error: 'HF_IMAGE_TOKEN is not configured (set it or provide the legacy HF_TOKEN).' }, req); return; }

    console.log('[image-studio] generating:', prompt.slice(0, 80));

    try {
        const { status, buffer } = await hfRequest(prompt, hfToken);
        const text = buffer.toString();
        if (status !== 200) {
            console.error('[image-studio] HF error:', status, text.slice(0, 300));
            sendJson(res, 502, { error: `Image generation failed (${status}): ${text.slice(0, 200)}` }, req);
            return;
        }
        const json = JSON.parse(text);
        const b64 = json?.data?.[0]?.b64_json;
        if (!b64) { sendJson(res, 502, { error: 'No image data in response.' }, req); return; }
        const imageUrl = `data:image/png;base64,${b64}`;
        sendJson(res, 200, { imageUrl }, req);
    } catch (e) {
        console.error('[image-studio] error:', e.message);
        sendJson(res, 500, { error: e.message }, req);
    }
}

async function handleVideoGeneration(req, res) {
    const body = await readJson(req);
    const prompt = String(body.prompt || '').trim();
    if (!prompt) { sendJson(res, 400, { error: 'Prompt is required.' }, req); return; }
    if (prompt.length > 16000) { sendJson(res, 400, { error: 'Prompt must be 16,000 characters or fewer.' }, req); return; }
    const allowedAspectRatios = new Set(['16:9', '9:16']);
    const aspectRatio = String(body.aspectRatio || '');
    if (!allowedAspectRatios.has(aspectRatio)) {
        sendJson(res, 400, { error: 'Unsupported video aspect ratio.' }, req);
        return;
    }

    const { accessExpired, featureAccess } = await resolveUserPlan(req, body);
    if (accessExpired && !featureAccess?.['image-studio']) {
        sendJson(res, 403, { error: 'Upgrade to Pro to access video generation.' }, req);
        return;
    }

    const apiKey = process.env.AGNES_API_KEY;
    if (!apiKey) { sendJson(res, 500, { error: 'AGNES_API_KEY is not configured.' }, req); return; }

    try {
        const fetchAgnes = async (url, options, operation) => {
            try {
                return await fetch(url, options);
            } catch (error) {
                const errorCode = typeof error?.cause?.code === 'string' ? ` (${error.cause.code})` : '';
                throw new Error(`Agnes ${operation} request failed${errorCode}: ${error.message}`, { cause: error });
            }
        };
        const apiBase = new URL(process.env.AGNES_BASE_URL || 'https://apihub.agnes-ai.com/v1');
        if (apiBase.protocol !== 'https:') throw new Error('AGNES_BASE_URL must use HTTPS.');
        apiBase.pathname = apiBase.pathname.replace(/\/+$/, '');

        const headers = {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        };
        const createUrl = new URL(`${apiBase.pathname}/videos`, apiBase.origin);
        const createBody = JSON.stringify({
            model: AGNES_VIDEO_MODEL,
            prompt,
            mode: 'text',
            seconds: '5',
            size: '720P',
            aspect_ratio: aspectRatio,
        });
        const maxCreateAttempts = 3;
        let task;
        for (let attempt = 0; attempt < maxCreateAttempts; attempt++) {
            const createResponse = await fetchAgnes(createUrl, {
                method: 'POST',
                headers,
                body: createBody,
                signal: AbortSignal.timeout(30_000),
            }, 'video task creation');
            const createText = await createResponse.text();
            let responseBody;
            try {
                responseBody = JSON.parse(createText);
            } catch {
                responseBody = null;
            }

            if (!createResponse.ok) {
                const providerMessage = responseBody?.error?.message
                    || responseBody?.error
                    || responseBody?.message
                    || createText.slice(0, 300);
                const message = String(providerMessage);
                const queueFull = createResponse.status === 503 && /video queue is full|queue is full/i.test(message);
                if (!queueFull || attempt === maxCreateAttempts - 1) {
                    if (queueFull) {
                        throw new Error(`Agnes video queue is still full after ${maxCreateAttempts} attempts. Please wait at least a minute before trying again. ${message}`);
                    }
                    throw new Error(`Agnes task creation failed (${createResponse.status}): ${message}`);
                }

                const retryAfter = createResponse.headers.get('retry-after');
                const retryAfterSeconds = retryAfter && /^\d+(?:\.\d+)?$/.test(retryAfter)
                    ? Number(retryAfter) * 1000
                    : retryAfter ? Date.parse(retryAfter) - Date.now() : NaN;
                const minimumRetryMs = 60_000 * (attempt + 1);
                const retryDelayMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
                    ? Math.max(minimumRetryMs, retryAfterSeconds)
                    : minimumRetryMs;
                if (retryDelayMs > 5 * 60_000) {
                    throw new Error(`Agnes video queue is full and requested a long retry delay. Please wait ${Math.ceil(retryDelayMs / 60_000)} minutes before trying again. ${message}`);
                }
                console.warn(`[video-generation] Agnes video queue is full; retrying in ${retryDelayMs}ms (attempt ${attempt + 2}/${maxCreateAttempts}).`);
                await new Promise(resolve => setTimeout(resolve, retryDelayMs));
                continue;
            }

            if (!responseBody || typeof responseBody !== 'object' || Array.isArray(responseBody)) {
                throw new Error(`Agnes task creation returned invalid JSON (${createResponse.status}).`);
            }
            task = responseBody;
            break;
        }

        const videoId = task.video_id;
        if (typeof videoId !== 'string' || !videoId) {
            throw new Error('Agnes task creation response did not include a video_id.');
        }

        const pollUrl = new URL('/agnesapi', apiBase.origin);
        pollUrl.searchParams.set('video_id', videoId);
        pollUrl.searchParams.set('model_name', AGNES_VIDEO_MODEL);
        const deadline = Date.now() + 10 * 60 * 1000;
        let result;
        while (Date.now() < deadline) {
            const remainingMs = deadline - Date.now();
            const pollResponse = await fetchAgnes(pollUrl, {
                headers: { Authorization: headers.Authorization },
                signal: AbortSignal.timeout(Math.min(30_000, remainingMs)),
            }, 'video status check');
            const pollText = await pollResponse.text();
            try {
                result = JSON.parse(pollText);
            } catch {
                throw new Error(`Agnes status check returned invalid JSON (${pollResponse.status}).`);
            }
            if (!result || typeof result !== 'object' || Array.isArray(result)) {
                throw new Error('Agnes status check returned an invalid response.');
            }
            if (!pollResponse.ok) {
                const message = result.error?.message || result.error || result.message || pollText.slice(0, 300);
                throw new Error(`Agnes status check failed (${pollResponse.status}): ${message}`);
            }

            const status = String(result.status || '').toLowerCase();
            if (status === 'completed') break;
            if (status === 'failed') {
                const message = result.error?.message || result.error || result.message || 'The provider reported a failed task.';
                throw new Error(`Agnes video generation failed: ${message}`);
            }
            if (!['queued', 'in_progress', 'pending', 'running'].includes(status)) {
                throw new Error(`Agnes returned an unexpected video task status: ${status || 'missing'}.`);
            }
            await new Promise(resolve => setTimeout(resolve, Math.min(2000, Math.max(0, deadline - Date.now()))));
        }
        if (!result || String(result.status || '').toLowerCase() !== 'completed') {
            throw new Error('Agnes video generation timed out after 10 minutes.');
        }
        if (typeof result.url !== 'string' || !result.url) {
            throw new Error('Agnes completed the task without returning a video URL.');
        }

        const videoUrl = new URL(result.url);
        if (videoUrl.protocol !== 'https:' || videoUrl.username || videoUrl.password) {
            throw new Error('Agnes returned an invalid video URL.');
        }
        const videoResponse = await fetchAgnes(
            videoUrl,
            { signal: AbortSignal.timeout(120_000) },
            'generated video download',
        );
        if (!videoResponse.ok) {
            throw new Error(`Could not download the generated video (${videoResponse.status}).`);
        }
        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
        if (!videoBuffer.length) throw new Error('Agnes returned an empty video.');

        const origin = req?.headers?.origin || '';
        const allowed = ['http://127.0.0.1:5173', 'http://localhost:5173', 'https://netrootai.tech', 'https://ampjiasvmmhxeqwdullc.supabase.co'];
        const contentType = videoResponse.headers.get('content-type') || '';
        res.writeHead(200, {
            'Content-Type': contentType.startsWith('video/') ? contentType : 'video/mp4',
            'Content-Length': videoBuffer.length,
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : '*',
        });
        res.end(videoBuffer);
    } catch (error) {
        console.error('[video-generation] Agnes AI error:', error);
        sendJson(res, 502, { error: `Video generation failed: ${error.message}` }, req);
    }
}

const PPT_ROUTES = new Set([
    '/api/generate',
    '/api/generate-outline',
    '/api/regenerate-slide',
    '/api/copilot-edit-slide',
    '/api/suggest-point',
    '/api/restyle-text',
    '/api/render',
    '/api/search-image-candidates',
    '/api/fetch-candidate-image',
]);

async function handlePptProxy(req, res) {
    const startTime = Date.now();
    const urlObj = new URL(req.url, 'http://127.0.0.1');
    const cleanPath = urlObj.pathname.replace(/^\/api\/ppt/, '/api');
    const pptServiceBase = process.env.PPT_SERVICE_BASE || 'http://127.0.0.1:8001';
    const targetUrl = `${pptServiceBase}${cleanPath}${urlObj.search}`;

    let body = {};
    if (req.method === 'POST') {
        body = await readJson(req);
    }

    const { plan, email, featureAccess, userId } = await resolveUserPlan(req, body);
    const sb = getSupabaseClient();

    // 1. Lifetime & Per-Deck Quota Check for Free Tier
    const isPro = plan === 'pro' || plan === 'enterprise';
    const hasOverride = Boolean(featureAccess?.['ppt-studio']);
    let lifetimeCount = 0;

    if (!isPro && !hasOverride) {
        lifetimeCount = await getUserLifetimePptCount(sb, userId, email);
        const isDeckCreation = cleanPath === '/api/generate' || cleanPath === '/api/generate-outline';
        if (isDeckCreation && lifetimeCount >= 2) {
            sendJson(res, 403, {
                error: 'Free lifetime limit reached (2/2 presentations). Upgrade to NetRoot AI Pro to create more presentations.',
            }, req);
            return;
        }

        const isEditAction = ['/api/regenerate-slide', '/api/copilot-edit-slide', '/api/suggest-point', '/api/restyle-text'].includes(cleanPath);
        if (isEditAction) {
            if (lifetimeCount >= 2) {
                sendJson(res, 403, {
                    error: 'Free AI editing is disabled in View-Only mode. Please upgrade to Pro for unlimited AI edits.',
                }, req);
                return;
            }
            const deckId = body.deckId || body.deck_id;
            if (deckId) {
                const edits = await getDeckAiEditsCount(sb, deckId);
                if (edits >= 5) {
                    sendJson(res, 403, {
                        error: 'Free AI edit limit reached (5/5 edits) for this presentation. Upgrade to Pro for unlimited AI edits.',
                    }, req);
                    return;
                }
            }
        }
    }

    // 2. Daily Token Limit Check for AI Generation Actions
    const isAiAction = ['/api/generate', '/api/generate-outline', '/api/regenerate-slide', '/api/copilot-edit-slide', '/api/restyle-text', '/api/suggest-point'].includes(cleanPath);

    if (isAiAction && email) {
        let estimatedTokens = 350;
        if (cleanPath === '/api/generate') {
            const count = Number(body.num_slides || 5);
            estimatedTokens = Math.max(500, count * 250);
        } else if (cleanPath === '/api/generate-outline') {
            estimatedTokens = 400;
        } else if (cleanPath === '/api/copilot-edit-slide' || cleanPath === '/api/regenerate-slide') {
            estimatedTokens = 350;
        }

        const alreadyUsedToday = await getTodayUserUsageAsync(email);
        if (!canUseTokens(plan, alreadyUsedToday, estimatedTokens)) {
            sendJson(res, 429, {
                error: `You have reached your daily token limit for the ${plan} plan. Your limits reset tomorrow.`,
            }, req);
            return;
        }
    }

    // 3. Proxy to Python ppt-service
    try {
        const fetchOptions = {
            method: req.method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (req.method === 'POST') {
            fetchOptions.body = JSON.stringify(body);
        }

        const pythonRes = await fetch(targetUrl, fetchOptions);

        // Check if response is binary (e.g. .pptx file download from /api/render)
        const contentType = pythonRes.headers.get('content-type') || '';
        if (contentType.includes('presentationml') || contentType.includes('octet-stream') || cleanPath === '/api/render') {
            const buffer = await pythonRes.arrayBuffer();
            const origin = req.headers?.origin || '';
            const allowed = ['http://127.0.0.1:5173', 'http://localhost:5173', 'https://netrootai.tech'];
            const corsOrigin = allowed.includes(origin) ? origin : '*';
            res.writeHead(pythonRes.status, {
                'Content-Type': contentType || 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'Content-Disposition': pythonRes.headers.get('content-disposition') || 'attachment; filename="presentation.pptx"',
                'Access-Control-Allow-Origin': corsOrigin,
            });
            res.end(Buffer.from(buffer));
            return;
        }

        const data = await pythonRes.json().catch(() => ({}));

        // 4. Update Lifetime and Edit Counts on Success for Free Tier
        if (pythonRes.ok && !isPro && !hasOverride) {
            if (cleanPath === '/api/generate' && userId) {
                await incrementUserLifetimePptCount(sb, userId, lifetimeCount);
            } else if (['/api/regenerate-slide', '/api/copilot-edit-slide', '/api/suggest-point', '/api/restyle-text'].includes(cleanPath)) {
                const deckId = body.deckId || body.deck_id;
                if (deckId) {
                    const edits = await getDeckAiEditsCount(sb, deckId);
                    await incrementDeckAiEditsCount(sb, deckId, edits);
                }
            }
        }

        // 4. Record Token Usage on Success
        if (pythonRes.ok && isAiAction && email) {
            let inputTokens = estimateRequestTokens(body.prompt || body.instruction || body.text || '');
            let outputTokens = 200;
            if (cleanPath === '/api/generate') {
                const slidesCount = Array.isArray(data.slides) ? data.slides.length : Number(body.num_slides || 5);
                outputTokens = slidesCount * 200;
            } else if (cleanPath === '/api/generate-outline') {
                outputTokens = 250;
            } else if (cleanPath === '/api/copilot-edit-slide' || cleanPath === '/api/regenerate-slide') {
                outputTokens = 250;
            } else if (cleanPath === '/api/restyle-text' || cleanPath === '/api/suggest-point') {
                outputTokens = 100;
            }

            await recordUsage({
                inputTokens,
                outputTokens,
                cachedTokens: 0,
                latencyMs: Date.now() - startTime,
                model: 'ppt-studio',
                userEmail: email,
                plan,
                prompt: body.prompt || body.instruction || body.text || `PPT ${cleanPath}`,
            });
            console.log(`[ppt-studio] Recorded ${inputTokens + outputTokens} tokens for ${email} (${cleanPath})`);
        }

        sendJson(res, pythonRes.status, data, req);
    } catch (err) {
        console.error('[ppt-proxy] Forward failed:', err.message);
        sendJson(res, 502, { error: `PPT service unavailable: ${err.message}` }, req);
    }
}

// ─── Natural Language Chat-to-PPT Flow (Option A) ───────────────────────────

function isPptGenerationRequest(text) {
    if (!text || typeof text !== 'string') return false;
    const t = text.toLowerCase().trim();

    // 0. Direct command shortcuts like /ppt, pptgen, ppt on...
    if (/^(?:\/ppt\b|pptgen\b|generate-ppt\b)/i.test(t)) return true;
    if (/^slides\s+on\b/i.test(t)) return true;
    if (/^make\s+(?:a\s+)?ppt\b/i.test(t)) return true;

    // 1. Negative filter: If the user is asking for suggestions, topics, ideas, or explanations, do not trigger PPT generation
    const isInformationalQuery = /(?:suggest|ideas?|topics?|list\b|recommend|what\s+is|what\s+are|how\s+to|explain)/i.test(t);
    if (isInformationalQuery) return false;

    // 2. Must contain PPT or presentation terminology
    const hasPptNoun = /(?:ppt|pptx|presentation|pitch\s*deck|slides?|powerpoint)/i.test(t);
    if (!hasPptNoun) return false;

    // 3. Must contain an explicit creation action verb
    const hasCreationVerb = /(?:create|make|generate|build|prepare|design|convert|pptgen)/i.test(t);
    if (!hasCreationVerb) return false;

    return true;
}

function extractSlideCount(text) {
    if (!text || typeof text !== 'string') return 5;

    // Strictly match digits followed by slide(s), e.g. "5 slides", "5-slide"
    // Ignores non-slide counts such as "5 to 10 topics" or "5 points"
    const m = text.match(/(\d+)\s*[-_]?\s*slides?\b/i)
           || text.match(/slides?\s*[:=]?\s*(\d+)\b/i);

    if (m) {
        const count = parseInt(m[1], 10);
        if (!isNaN(count)) return Math.max(1, Math.min(10, count));
    }
    return 5;
}

async function distillTopicFromConversation(history, userPrompt, groqApiKey) {
    if (!Array.isArray(history) || history.length === 0) {
        return userPrompt;
    }

    const relevant = history.slice(-6).filter(m => m && m.content && !m.content.startsWith('__IMAGE__') && !m.content.startsWith('__PPT_DECK__'));
    if (relevant.length === 0) return userPrompt;

    const historyText = relevant.map(m => {
        const clean = m.content.replace(/__IMAGES__.*?__IMAGES__/g, '').replace(/__PPT_DECK__.*?__PPT_DECK__/g, '').trim();
        return `${m.role === 'user' ? 'User' : 'Assistant'}: ${clean}`;
    }).join('\n\n');

    if (!groqApiKey) {
        return `${userPrompt}\n\nContext:\n${historyText.slice(-600)}`;
    }

    try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'openai/gpt-oss-20b',
                temperature: 0.2,
                max_tokens: 250,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an executive pitch deck strategist. Summarize the discussion into a concise, high-impact presentation topic with 3-4 bullet takeaways for slide generation. Return ONLY the topic and summary bullets, no intro/outro.'
                    },
                    {
                        role: 'user',
                        content: `Conversation:\n${historyText.slice(-2500)}\n\nUser request: "${userPrompt}"\n\nExecutive Topic Summary:`
                    }
                ]
            })
        });

        if (res.ok) {
            const data = await res.json();
            const text = data.choices?.[0]?.message?.content?.trim();
            if (text) {
                console.log('[ppt-flow] Distilled presentation topic:', text.slice(0, 100));
                return text;
            }
        }
    } catch (e) {
        console.warn('[ppt-flow] Groq distillation fallback:', e.message);
    }

    return `${userPrompt}\n\nContext:\n${historyText.slice(-600)}`;
}

async function handleChatToPpt({ prompt, history, userEmail, userId, res, req, requestStart, plan }) {
    try {
        const sb = getSupabaseClient();
        const isPro = plan === 'pro' || plan === 'enterprise';
        let lifetimeCount = 0;

        if (!isPro) {
            lifetimeCount = await getUserLifetimePptCount(sb, userId, userEmail);
            if (lifetimeCount >= 2) {
                const upgradeNotice = {
                    title: "NetRoot AI PPT Studio",
                    lifetimeCount,
                    maxFree: 2,
                    isLocked: true,
                    upgradeUrl: "/pricing",
                    message: "You have reached your lifetime limit of 2 free presentations. Upgrade to NetRoot AI Pro to generate unlimited presentations."
                };
                const answer = `You have reached your lifetime limit of 2 free presentations.\n\n__PPT_PRO_UPGRADE__${JSON.stringify(upgradeNotice)}__PPT_PRO_UPGRADE__`;
                sendJson(res, 200, {
                    answer,
                    pptLocked: true,
                    upgradeNotice
                }, req);
                return;
            }
        }

        const slideCount = extractSlideCount(prompt);
        const estimatedTokens = estimateRequestTokens(prompt) + slideCount * 200;
        const alreadyUsedToday = await getTodayUserUsageAsync(userEmail);
        if (!canUseTokens(plan, alreadyUsedToday, estimatedTokens)) {
            sendJson(res, 429, {
                error: `You have reached your daily token limit for the ${plan} plan. Upgrade to Pro or wait until your limit resets tomorrow.`,
            }, req);
            return;
        }

        const groqApiKey = process.env.GROQ_API_KEY;
        console.log(`[ppt-flow] Triggered natural PPT flow: ${slideCount} slides requested. User: ${userEmail || 'anon'}`);

        const distilledTopic = await distillTopicFromConversation(history, prompt, groqApiKey);
        const pptServiceBase = process.env.PPT_SERVICE_BASE || 'http://127.0.0.1:8001';

        // 1. Generate slides via PPT service
        let pptGenData;
        try {
            const genRes = await fetch(`${pptServiceBase}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: distilledTopic,
                    num_slides: slideCount,
                    theme: 'midnight'
                }),
                signal: AbortSignal.timeout(60000)
            });
            if (!genRes.ok) {
                const errText = await genRes.text();
                throw new Error(`PPT generator returned ${genRes.status}: ${errText}`);
            }
            pptGenData = await genRes.json();
        } catch (err) {
            console.error('[ppt-flow] Generation failed:', err.message);
            sendJson(res, 502, { error: `PPT Service Error: ${err.message}` }, req);
            return;
        }

        const slides = pptGenData.slides || (pptGenData.slide ? [pptGenData.slide] : []);
        const title = pptGenData.title || (slides[0]?.t ? slides[0].t.slice(0, 50) : 'AI Pitch Deck');
        const theme = pptGenData.theme || 'midnight';
        const seedColor = pptGenData.theme_seed_hex || '#0EA5E9';

        const filename = `${title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_')}.pptx`;
        const deckId = crypto.randomUUID();
        const downloadUrl = `/api/ppt/download/${encodeURIComponent(filename)}?deckId=${encodeURIComponent(deckId)}`;

        // 3. Save to Supabase user_decks if user is known
        if (sb && userId) {
            try {
                await sb.from('user_decks').insert({
                    id: deckId,
                    user_id: userId,
                    title,
                    slides,
                    theme,
                    seed_color: seedColor,
                    ai_edits_count: 0
                });
                console.log('[ppt-flow] Saved deck to Supabase user_decks:', deckId);
            } catch (dbErr) {
                console.warn('[ppt-flow] Supabase user_decks notice:', dbErr.message);
            }
        }

        if (!isPro && userId) {
            await incrementUserLifetimePptCount(sb, userId, lifetimeCount);
        }

        // 4. Record usage
        await recordUsage({
            inputTokens: estimateRequestTokens(prompt),
            outputTokens: slides.length * 150,
            cachedTokens: 0,
            latencyMs: Date.now() - requestStart,
            model: 'ppt-generator',
            userEmail,
            plan,
            prompt
        });

        const pptDeck = {
            deckId,
            title,
            slideCount: slides.length,
            slides,
            downloadUrl,
            filename,
            theme,
            seed_color: seedColor
        };

        const answer = `A **${slides.length}-slide** presentation on **"${title}"** has been generated from this discussion!\n\nYou can open and edit it directly in **NetRoot AI PPT Studio** or download the PowerPoint (.pptx) file below.\n\n__PPT_DECK__${JSON.stringify(pptDeck)}__PPT_DECK__`;

        sendJson(res, 200, { answer, pptDeck }, req);
    } catch (unhandledErr) {
        console.error('[ppt-flow] Unhandled error:', unhandledErr);
        sendJson(res, 500, { error: `Failed to create presentation: ${unhandledErr.message}` }, req);
    }
}

async function handlePptDownload(req, res) {
    const pptServiceBase = process.env.PPT_SERVICE_BASE || 'http://127.0.0.1:8001';
    const targetUrl = `${pptServiceBase}${req.url}`;
    try {
        const response = await fetch(targetUrl);
        if (!response.ok) {
            sendJson(res, response.status, { error: 'PPT download failed' }, req);
            return;
        }
        const headers = {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'Content-Disposition': response.headers.get('content-disposition') || 'attachment; filename="presentation.pptx"',
            'Access-Control-Allow-Origin': '*',
        };
        const buffer = Buffer.from(await response.arrayBuffer());
        res.writeHead(response.status, headers);
        res.end(buffer);
    } catch (e) {
        sendJson(res, 502, { error: `Download proxy error: ${e.message}` }, req);
    }
}

// Image Generation — DALL-E 3
async function runImageGen(prompt, openaiKey) {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', response_format: 'url' }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'DALL-E request failed');
    return data.data?.[0]?.url || null;
}

function tokenizeExpression(expr) {
    const tokens = [];
    const input = expr.replace(/\s+/g, '');
    let i = 0;

    while (i < input.length) {
        const char = input[i];

        if (/\d|\./.test(char)) {
            const start = i;
            i += 1;
            while (i < input.length && /[\d.]/.test(input[i])) i += 1;
            tokens.push({ type: 'number', value: Number(input.slice(start, i)) });
            continue;
        }

        if ('+-*/^()'.includes(char)) {
            tokens.push({ type: 'op', value: char });
            i += 1;
            continue;
        }

        return null;
    }

    return tokens;
}

function evaluateExpression(expr) {
    const tokens = tokenizeExpression(expr);
    if (!tokens || tokens.length === 0) return null;

    const output = [];
    const operators = [];
    const precedence = { u: 4, '^': 3, '*': 2, '/': 2, '+': 1, '-': 1 };
    const rightAssociative = new Set(['^', 'u']);

    const popOperator = () => {
        const op = operators.pop();
        if (op === 'u') {
            const value = output.pop();
            output.push(-value);
            return;
        }
        const right = output.pop();
        const left = output.pop();
        if (left === undefined || right === undefined) throw new Error('Invalid expression');
        switch (op) {
            case '+': output.push(left + right); break;
            case '-': output.push(left - right); break;
            case '*': output.push(left * right); break;
            case '/': output.push(left / right); break;
            case '^': output.push(left ** right); break;
            default: throw new Error(`Unsupported operator: ${op}`);
        }
    };

    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];

        if (token.type === 'number') {
            output.push(token.value);
            continue;
        }

        const value = token.value;
        if (value === '(') {
            operators.push(value);
            continue;
        }
        if (value === ')') {
            while (operators.length && operators[operators.length - 1] !== '(') popOperator();
            if (!operators.length) throw new Error('Mismatched parentheses');
            operators.pop();
            continue;
        }

        const unary = value === '-' && (
            index === 0 ||
            (tokens[index - 1].type === 'op' && tokens[index - 1].value !== ')')
        );
        const currentOp = unary ? 'u' : value;

        while (operators.length) {
            const top = operators[operators.length - 1];
            if (top === '(') break;
            const shouldPop =
                precedence[top] > precedence[currentOp] ||
                (precedence[top] === precedence[currentOp] && !rightAssociative.has(currentOp));
            if (!shouldPop) break;
            popOperator();
        }

        operators.push(currentOp);
    }

    while (operators.length) {
        const op = operators[operators.length - 1];
        if (op === '(') throw new Error('Mismatched parentheses');
        popOperator();
    }

    if (output.length !== 1) throw new Error('Invalid expression');
    return output[0];
}

function extractMathExpression(prompt) {
    const matches = prompt.match(/(?:^|[^0-9A-Za-z_])(-?\d[\d\s.+\-*/^()]*\d|-?\d)/g);
    if (!matches || matches.length === 0) return null;
    return matches[matches.length - 1].trim();
}

// Calculator — safe expression evaluator
function runCalculator(expr) {
    try {
        const result = evaluateExpression(expr);
        return result === null || Number.isNaN(result) ? 'Invalid expression' : String(result);
    } catch (e) { return `Error: ${e.message}`; }
}

function extractStructuredData(prompt) {
    const fenced = String(prompt || '').match(/```(?:json|yaml|yml)?\s*\n?([\s\S]*?)```/i);
    if (fenced) return fenced[1].trim();

    const text = String(prompt || '').trim();
    const starts = ['{', '['].map(marker => text.indexOf(marker)).filter(index => index >= 0);
    return starts.length ? text.slice(Math.min(...starts)).trim() : text;
}

function runJsonTransformer(prompt) {
    const request = String(prompt || '').toLowerCase();
    const source = extractStructuredData(prompt);
    let value;

    try {
        try {
            value = JSON.parse(source);
        } catch {
            value = yaml.load(source);
        }
    } catch (error) {
        return `JSON/YAML validation failed: ${error.message}`;
    }

    if (request.includes('valid')) {
        return `Valid JSON/YAML input.\n\nParsed value:\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
    }
    if (request.includes('yaml') || request.includes('yml')) {
        return `YAML output:\n\`\`\`yaml\n${yaml.dump(value, { noRefs: true, lineWidth: -1 })}\`\`\``;
    }
    if (request.includes('minif')) {
        return `Minified JSON:\n\`\`\`json\n${JSON.stringify(value)}\n\`\`\``;
    }
    return `Pretty JSON:\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
}

// arXiv — free public API
async function runArxiv(query) {
    try {
        const res = await fetch(`https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&max_results=3`);
        const xml = await res.text();
        const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => m[1]);
        return entries.map(e => {
            const title = (e.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.trim();
            const summary = (e.match(/<summary>([\s\S]*?)<\/summary>/) || [])[1]?.trim().slice(0, 300);
            return `Title: ${title}\nAbstract: ${summary}`;
        }).join('\n\n') || null;
    } catch { return null; }
}

// Code Runner — sandboxed Node.js vm
function runCodeRunner(code) {
    try {
        const logs = [];
        const sandbox = {
            console: { log: (...a) => logs.push(a.map(String).join(' ')), error: (...a) => logs.push('ERR: ' + a.join(' ')) },
            Math, JSON, Array, Object, String, Number, Boolean, Date,
        };
        vm.createContext(sandbox);
        vm.runInContext(code, sandbox, { timeout: 3000 });
        return logs.join('\n') || '(no output)';
    } catch (e) { return `Runtime error: ${e.message}`; }
}

// GitHub
async function runGitHub(query, token) {
    try {
        const headers = { 'User-Agent': 'netrootai', Accept: 'application/vnd.github+json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=3`, { headers });
        const data = await res.json();
        return (data.items || []).map(r => `${r.full_name}: ${r.description || 'No description'} (⭐ ${r.stargazers_count})`).join('\n') || null;
    } catch { return null; }
}

// Notion
async function runNotion(query, token) {
    try {
        const res = await fetch('https://api.notion.com/v1/search', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, page_size: 3 }),
        });
        const data = await res.json();
        return (data.results || []).map(p => `- ${p.properties?.title?.title?.[0]?.plain_text || p.object}`).join('\n') || null;
    } catch { return null; }
}

// Jira
async function runJira(query, domain, email, token) {
    try {
        const auth = Buffer.from(`${email}:${token}`).toString('base64');
        const jql = encodeURIComponent(`text ~ "${query}" ORDER BY updated DESC`);
        const res = await fetch(`https://${domain}/rest/api/3/search?jql=${jql}&maxResults=3`, {
            headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
        });
        const data = await res.json();
        return (data.issues || []).map(i => `[${i.key}] ${i.fields.summary} (${i.fields.status.name})`).join('\n') || null;
    } catch { return null; }
}

// Slack
async function runSlack(query, token) {
    try {
        const res = await fetch(`https://slack.com/api/search.messages?query=${encodeURIComponent(query)}&count=3`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        return (data.messages?.matches || []).map(m => `#${m.channel?.name}: ${m.text?.slice(0, 200)}`).join('\n') || null;
    } catch { return null; }
}

// Linear
async function runLinear(query, token) {
    try {
        const gql = JSON.stringify({ query: `{ issueSearch(term: "${query}", first: 3) { nodes { title state { name } url } } }` });
        const res = await fetch('https://api.linear.app/graphql', {
            method: 'POST',
            headers: { Authorization: token, 'Content-Type': 'application/json' },
            body: gql,
        });
        const data = await res.json();
        return (data.data?.issueSearch?.nodes || []).map(i => `${i.title} [${i.state?.name}] ${i.url}`).join('\n') || null;
    } catch { return null; }
}

// Orchestrator
async function resolvePlugins(prompt, plugins, attachments) {
    if (!Array.isArray(plugins) || plugins.length === 0) return { pluginContext: '', imageUrl: null };

    const parts = [];
    let imageUrl = null;

    for (const p of plugins) {
        const cfg = p.config || {};

        if (p.plugin_id === 'image-gen') {
            if (!cfg.openai_key) continue;
            try { imageUrl = await runImageGen(prompt, cfg.openai_key); }
            catch (e) { parts.push(`[image-gen error]\n${e.message}`); }
            continue;
        }


        let result = null;

        if (p.plugin_id === 'web-search') {
            const apiKey = cfg.api_key || process.env.BRAVE_SEARCH_API_KEY || process.env.BRAVE_API_KEY || '';
            result = await runWebSearch(prompt, apiKey);
        } else if (p.plugin_id === 'pdf-search') {
            result = await runPdfSearch(prompt, attachments);
        } else if (p.plugin_id === 'calculator') {
            const match = extractMathExpression(prompt);
            if (match) result = `Calculator result: ${runCalculator(match)}`;
        } else if (p.plugin_id === 'json-transformer') {
            result = runJsonTransformer(prompt);
        } else if (p.plugin_id === 'arxiv') {
            result = await runArxiv(prompt);
        } else if (p.plugin_id === 'code-runner') {
            const codeMatch = prompt.match(/```(?:js|javascript)?\n([\s\S]*?)```/);
            if (codeMatch) result = `Code output:\n${runCodeRunner(codeMatch[1])}`;
        } else if (p.plugin_id === 'github' && cfg.token) {
            result = await runGitHub(prompt, cfg.token);
        } else if (p.plugin_id === 'notion' && cfg.token) {
            result = await runNotion(prompt, cfg.token);
        } else if (p.plugin_id === 'jira' && cfg.domain && cfg.email && cfg.token) {
            result = await runJira(prompt, cfg.domain, cfg.email, cfg.token);
        } else if (p.plugin_id === 'slack' && cfg.token) {
            result = await runSlack(prompt, cfg.token);
        } else if (p.plugin_id === 'linear' && cfg.token) {
            result = await runLinear(prompt, cfg.token);
        }

        if (result) parts.push(`[${p.plugin_id} results]\n${result}`);
    }

    const pluginContext = parts.length
        ? `\n\nPlugin context (use this data to answer — do NOT say you lack real-time access):\n${parts.join('\n\n')}`
        : '';

    return { pluginContext, imageUrl };
}

// ─────────────────────────────────────────────────────────────────────────────

function buildInput({ prompt, attachments, history, pluginContext }) {
    const previousMessages = Array.isArray(history)
        ? history.slice(-8).map(msg => `${msg.role}: ${msg.content}`).join('\n\n')
        : '';
    const attachmentText = Array.isArray(attachments) && attachments.length > 0
        ? `\n\nAttachments:\n${attachments.map(f => `- ${f.name} (${f.file_type || 'file'}): ${f.url || 'uploaded'}`).join('\n')}`
        : '';
    const userPrompt = prompt || (attachmentText ? 'Describe the attached file(s).' : '');
    return [
        'You are Netroot AI assistant. Answer the user clearly and directly.',
        'Use short paragraphs and numbered steps when useful.',
        pluginContext ? 'IMPORTANT: Plugin data is provided below. You MUST use it to answer. Never say you lack real-time access when plugin results are present.' : '',
        previousMessages ? `Conversation so far:\n${previousMessages}` : '',
        `User prompt:\n${userPrompt}${attachmentText}${pluginContext || ''}`,
    ].filter(Boolean).join('\n\n');
}

function extractAnswer(data) {
    if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
    const textParts = data.output
        ?.flatMap(item => item.content || [])
        ?.filter(part => part.type === 'output_text' || part.type === 'text')
        ?.map(part => part.text)
        ?.filter(Boolean);
    return textParts?.join('\n').trim() || 'No response.';
}

async function handleChat(req, res) {
    const body = await readJson(req);
    const prompt = String(body.prompt || body.query || body.message || body.content || '').trim();

    if (!prompt && (!Array.isArray(body.attachments) || body.attachments.length === 0)) {
        sendJson(res, 400, { error: 'Prompt is required.' });
        return;
    }

    const { plan, email, userId } = await resolveUserPlan(req, body);
    const requestStart = Date.now();

    let enabledPlugins;
    try {
        enabledPlugins = await getEnabledUserPlugins(userId);
    } catch (error) {
        console.error('[chat] failed to load enabled plugins:', error.message);
        sendJson(res, 503, { error: 'Unable to verify plugin settings. Please try again.' }, req);
        return;
    }

    const planLimits = getPlanLimits(plan);
    const allowedPlugins = new Set(planLimits.allowedPlugins || []);
    const permittedPlugins = enabledPlugins.filter(plugin => allowedPlugins.has(plugin.plugin_id));

    // Intercept Natural Language Chat-to-PPT generation intent (Option A)
    if (isPptGenerationRequest(prompt) && permittedPlugins.some(plugin => plugin.plugin_id === 'ppt-generator')) {
        await handleChatToPpt({
            prompt,
            history: body.history,
            userEmail: email,
            userId,
            res,
            req,
            requestStart,
            plan,
        });
        return;
    }

    const selectedModel = normalizeModel(body.model || process.env.GROQ_MODEL || process.env.OPENAI_MODEL || 'openai/gpt-oss-20b');

    console.log('[chat] plan:', plan, '| model:', selectedModel, '| canUse:', canUseModel(plan, selectedModel), '| allowedModels:', JSON.stringify(getPlanLimits(plan).allowedModels));
    if (!canUseModel(plan, selectedModel)) {
        sendJson(res, 403, {
            error: `The model ${selectedModel} is not available on the ${plan} plan. Upgrade to Pro to access more models.`,
        });
        return;
    }

    if (selectedModel === 'black-forest-labs/FLUX.1-schnell') {
        const imageLimit = getModelImageLimit(plan, selectedModel);
        const usedImagesThisMonth = email ? await getCurrentMonthImageUsageAsync(email, selectedModel) : 0;
        if (!canUseImageGeneration(plan, selectedModel, usedImagesThisMonth)) {
            sendJson(res, 429, {
                error: `You have reached your monthly image limit for the ${plan} plan. Pro/Enterprise users can generate up to ${imageLimit} images per month.`,
            });
            return;
        }

        const hfToken = process.env.HF_IMAGE_TOKEN || process.env.HF_TOKEN;
        if (!hfToken) { sendJson(res, 500, { error: 'HF_IMAGE_TOKEN is not configured (set it or provide the legacy HF_TOKEN).' }); return; }
        try {
            const { status, buffer } = await hfRequest(prompt, hfToken);
            const data = JSON.parse(buffer.toString());
            const b64 = data?.data?.[0]?.b64_json;
            if (status !== 200 || !b64) {
                sendJson(res, 502, { error: `Image generation failed (${status}).` });
                return;
            }
            await recordUsage({
                inputTokens: estimateRequestTokens(prompt),
                outputTokens: 0,
                cachedTokens: 0,
                latencyMs: Date.now() - requestStart,
                model: selectedModel,
                userEmail: email,
                plan,
                prompt,
            });
            sendJson(res, 200, { answer: `Generated image for: ${prompt}`, imageUrl: `data:image/png;base64,${b64}` });
        } catch (error) {
            sendJson(res, 500, { error: `Image generation failed: ${error.message}` });
        }
        return;
    }

    const estimatedTokens = estimateRequestTokens(prompt, body.attachments);
    const alreadyUsedToday = await getTodayUserUsageAsync(email);
    if (!canUseTokens(plan, alreadyUsedToday, estimatedTokens)) {
        sendJson(res, 429, {
            error: `You have reached your daily token limit for the ${plan} plan. Upgrade to Pro for ${planLimits.dailyTokenLimit} daily tokens.`,
        });
        return;
    }

    const { pluginContext, imageUrl } = await resolvePlugins(prompt, permittedPlugins, body.attachments);

    if (imageUrl) {
        sendJson(res, 200, { answer: `Here is your generated image for: *${prompt}*`, imageUrl });
        return;
    }

    const builtPrompt = buildInput({ ...body, pluginContext });

    if (AI_PROVIDER === 'google') {
        const googleApiKey = process.env.GOOGLE_API_KEY;
        if (!googleApiKey) { sendJson(res, 500, { error: 'GOOGLE_API_KEY is missing.' }); return; }
        const googleModel = process.env.GOOGLE_MODEL || 'text-bison-001';
        const googleResponse = await fetch(
            `${GOOGLE_AI_BASE_URL}/${encodeURIComponent(googleModel)}:generate?key=${encodeURIComponent(googleApiKey)}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: { text: builtPrompt }, temperature: Number(process.env.GOOGLE_TEMPERATURE ?? 0.2), maxOutputTokens: Number(process.env.GOOGLE_MAX_OUTPUT_TOKENS ?? 1024) }) }
        );
        const data = await googleResponse.json().catch(() => ({}));
        if (!googleResponse.ok) { sendJson(res, googleResponse.status, { error: data.error?.message || 'Google AI failed.' }); return; }
        if (data.usageMetadata) {
            recordUsage({
                inputTokens: data.usageMetadata.promptTokenCount || 0,
                outputTokens: data.usageMetadata.candidatesTokenCount || 0,
                cachedTokens: data.usageMetadata.cachedContentTokenCount || 0,
                latencyMs: Date.now() - requestStart,
                model: googleModel,
                userEmail: email,
                plan,
                prompt,
            });
        }
        sendJson(res, 200, { answer: data?.candidates?.[0]?.content || 'Empty response.' });
        return;
    }

    if (AI_PROVIDER === 'groq') {
        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) { sendJson(res, 500, { error: 'GROQ_API_KEY is missing.' }); return; }
        const groqModel = selectedModel;
        const groqStart = Date.now();

        const imageAttachments = Array.isArray(body.attachments)
            ? body.attachments.filter(a => a.file_type?.startsWith('image/') && a.url)
            : [];

        console.log('[chat] model:', groqModel, '| images:', imageAttachments.length, '| prompt:', body.prompt?.slice(0, 80));

        // Non-vision models cannot process images — use chat completions with text only
        if (imageAttachments.length > 0 && !VISION_MODELS.has(groqModel)) {
            const textPrompt = body.prompt?.trim() || 'Describe the attached image.';
            const groqResponse = await fetch(GROQ_CHAT_URL, {
                method: 'POST',
                headers: { Authorization: `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: groqModel,
                    messages: [{ role: 'user', content: `${textPrompt}\n\n(Image attached: ${imageAttachments.map(a => a.url).join(', ')})` }],
                }),
            });
            const data = await groqResponse.json().catch(() => ({}));
            console.log('[chat] non-vision response status:', groqResponse.status, '| data:', JSON.stringify(data).slice(0, 200));
            if (!groqResponse.ok) { sendJson(res, groqResponse.status, { error: data.error?.message || 'Groq request failed.' }); return; }
            const answer = data.choices?.[0]?.message?.content || 'No response.';
            if (data.usage) recordUsage({ inputTokens: data.usage.prompt_tokens || 0, outputTokens: data.usage.completion_tokens || 0, cachedTokens: 0, latencyMs: Date.now() - groqStart, model: groqModel, userEmail: email, plan, prompt });
            sendJson(res, 200, { answer });
            return;
        }

        // Vision models — send image as base64 data URL
        if (VISION_MODELS.has(groqModel) && imageAttachments.length > 0) {
            const userContent = [
                { type: 'text', text: body.prompt?.trim() || 'Describe this image in detail.' },
            ];
            for (const a of imageAttachments) {
                try {
                    let dataUrl = a.url;
                    // If it's not already a data URL, fetch and convert
                    if (!dataUrl.startsWith('data:')) {
                        const imgRes = await fetch(a.url);
                        if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
                        const buffer = await imgRes.arrayBuffer();
                        const base64 = Buffer.from(buffer).toString('base64');
                        dataUrl = `data:${a.file_type || 'image/jpeg'};base64,${base64}`;
                    }
                    userContent.push({ type: 'image_url', image_url: { url: dataUrl } });
                } catch (e) {
                    console.log('[chat] failed to load image:', e.message);
                }
            }
            const groqResponse = await fetch(GROQ_CHAT_URL, {
                method: 'POST',
                headers: { Authorization: `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: groqModel, messages: [{ role: 'user', content: userContent }] }),
            });
            const data = await groqResponse.json().catch(() => ({}));
            console.log('[chat] vision response status:', groqResponse.status, '| data:', JSON.stringify(data).slice(0, 200));
            if (!groqResponse.ok) { sendJson(res, groqResponse.status, { error: data.error?.message || 'Groq vision request failed.' }); return; }
            const answer = data.choices?.[0]?.message?.content || 'No response.';
            if (data.usage) recordUsage({ inputTokens: data.usage.prompt_tokens || 0, outputTokens: data.usage.completion_tokens || 0, cachedTokens: 0, latencyMs: Date.now() - groqStart, model: groqModel, userEmail: email, plan, prompt });
            sendJson(res, 200, { answer });
            return;
        }

        // Text-only path
        const groqResponse = await fetch(GROQ_CHAT_URL, {
            method: 'POST',
            headers: { Authorization: `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: groqModel, messages: [{ role: 'user', content: builtPrompt }] }),
        });
        const data = await groqResponse.json().catch(() => ({}));
        console.log('[chat] text response status:', groqResponse.status, '| data:', JSON.stringify(data).slice(0, 200));
        if (!groqResponse.ok) { sendJson(res, groqResponse.status, { error: data.error?.message || 'Groq request failed.' }); return; }
        if (data.usage) {
            recordUsage({
                inputTokens: data.usage.input_tokens || data.usage.prompt_tokens || 0,
                outputTokens: data.usage.output_tokens || data.usage.completion_tokens || 0,
                cachedTokens: data.usage.input_tokens_details?.cached_tokens || 0,
                latencyMs: Date.now() - groqStart,
                model: groqModel,
                userEmail: email,
                plan,
                prompt,
            });
        }
        const answer = data.choices?.[0]?.message?.content || 'No response.';
        sendJson(res, 200, { answer });
        return;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) { sendJson(res, 500, { error: 'OPENAI_API_KEY is missing.' }); return; }
    const openaiResponse = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4.1', input: builtPrompt }),
    });
    const data = await openaiResponse.json().catch(() => ({}));
    if (!openaiResponse.ok) { sendJson(res, openaiResponse.status, { error: data.error?.message || 'OpenAI request failed.' }); return; }
    if (data.usage) {
        recordUsage({
            inputTokens: data.usage.input_tokens || data.usage.prompt_tokens || 0,
            outputTokens: data.usage.output_tokens || data.usage.completion_tokens || 0,
            cachedTokens: data.usage.input_tokens_details?.cached_tokens || 0,
            latencyMs: Date.now() - requestStart,
            model: process.env.OPENAI_MODEL || 'gpt-4.1',
            userEmail: email,
            plan,
            prompt,
        });
    }
    sendJson(res, 200, { answer: extractAnswer(data) });
}

async function handleGetPlan(req, res) {
    const url = new URL(req.url, 'http://127.0.0.1');
    const email = url.searchParams.get('email');
    if (!email) { sendJson(res, 400, { error: 'email is required.' }); return; }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) { sendJson(res, 200, { plan: 'free' }); return; }

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const { data: { users } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const found = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!found) { sendJson(res, 200, { plan: 'free' }); return; }

    const [{ data: profile }, { data: subscription }] = await Promise.all([
        supabase.from('profiles').select('plan, free_trial_ends_at, feature_access').eq('id', found.id).single(),
        supabase.from('subscriptions').select('plan, status, current_period_end, cancel_at_period_end, interval_months').eq('user_id', found.id).maybeSingle(),
    ]);
    const summary = subscriptionSummary(subscription, profile?.plan || 'free', profile?.free_trial_ends_at);
    // Enforce expiry even if a Stripe webhook was delayed.
    if (profile?.plan !== summary.effective_plan) {
        await supabase.from('profiles').upsert({ id: found.id, plan: summary.effective_plan }, { onConflict: 'id' });
    }
    const lifetimePptCount = await getUserLifetimePptCount(supabase, found.id, email);
    sendJson(res, 200, { ...summary, plan: summary.effective_plan, feature_access: profile?.feature_access || {}, lifetime_ppt_count: lifetimePptCount });
}

async function handlePptQuota(req, res) {
    const { plan, email, userId } = await resolveUserPlan(req);
    const sb = getSupabaseClient();
    const isPro = plan === 'pro' || plan === 'enterprise';
    const lifetimePptCount = await getUserLifetimePptCount(sb, userId, email);
    const freeLimitReached = !isPro && lifetimePptCount >= 2;
    sendJson(res, 200, {
        plan,
        isPro,
        lifetimePptCount,
        maxFreePpt: 2,
        maxDeckAiEdits: 5,
        freeLimitReached,
    }, req);
}

// ─── Stripe ──────────────────────────────────────────────────────────────────

const IS_VPS = process.env.NODE_ENV === 'production' || process.env.IS_VPS === 'true';
const STRIPE_WEBHOOK_URL = IS_VPS
    ? 'https://netrootai.tech/api/stripe/webhook'
    : 'https://ampjiasvmmhxeqwdullc.supabase.co/functions/v1/stripe-webhook';

function toIsoFromStripeTimestamp(timestamp) {
    return Number.isFinite(timestamp) ? new Date(timestamp * 1000).toISOString() : null;
}

function subscriptionSummary(subscription, fallbackPlan = 'free', freeTrialEndsAt = null) {
    const plan = normalizePlan(subscription?.plan || fallbackPlan);
    const periodEnd = subscription?.current_period_end || null;
    const expired = Boolean(periodEnd && new Date(periodEnd).getTime() <= Date.now());
    const paidPlan = plan !== 'free';
    const active = paidPlan && !expired && ['active', 'trialing', 'past_due'].includes(subscription?.status || 'active');

    const freeTrialExpired = !paidPlan && Boolean(freeTrialEndsAt && new Date(freeTrialEndsAt).getTime() <= Date.now());
    return {
        plan,
        effective_plan: active ? plan : 'free',
        plan_status: active || (!paidPlan && !freeTrialExpired) ? 'active' : 'expired',
        current_period_end: paidPlan ? periodEnd : freeTrialEndsAt,
        auto_renew: Boolean(active && !subscription?.cancel_at_period_end),
        subscription_status: subscription?.status || (paidPlan ? 'expired' : 'free'),
        interval_months: subscription?.interval_months || 1,
        access_expired: !active && (paidPlan || freeTrialExpired),
    };
}

function stripeSubscriptionData(subscription) {
    const periodEnd = subscription?.current_period_end || subscription?.items?.data?.[0]?.current_period_end;
    return {
        status: subscription?.status || 'active',
        current_period_end: toIsoFromStripeTimestamp(periodEnd),
        cancel_at_period_end: Boolean(subscription?.cancel_at_period_end),
        interval_months: subscription?.items?.data?.[0]?.price?.recurring?.interval_count || 1,
    };
}

async function applyCheckoutRenewalPreference(stripe, subscription, autoRenew) {
    if (autoRenew || !subscription) return subscription;
    const subscriptionId = typeof subscription === 'string' ? subscription : subscription.id;
    return stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
}

async function handleCreateCheckout(req, res) {
    const { email, plan, months: requestedMonths, autoRenew: requestedAutoRenew } = await readJson(req);
    if (!email || !plan) { sendJson(res, 400, { error: 'email and plan are required.' }); return; }
    const months = Number(requestedMonths || 1);
    if (!Number.isInteger(months) || months < 1 || months > 12) { sendJson(res, 400, { error: 'Choose a plan duration from 1 to 12 months.' }); return; }
    const autoRenew = requestedAutoRenew !== false;

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) { sendJson(res, 500, { error: 'Stripe not configured.' }); return; }

    const stripe = new Stripe(stripeKey);
    const origin = req.headers?.origin || (IS_VPS ? 'https://netrootai.tech' : 'http://localhost:5173');

    const lineItems = [{
        price_data: {
            currency: 'usd',
            product_data: { name: `NetRoot AI ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan (${months} month${months === 1 ? '' : 's'})` },
            unit_amount: plan === 'pro' ? 1900 * months : 0,
            recurring: { interval: 'month', interval_count: months },
        },
        quantity: 1,
    }];

    if (plan === 'free') {
        sendJson(res, 400, { error: 'Cannot create checkout for Free plan.' });
        return;
    }

    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: email,
        line_items: lineItems,
        success_url: `${origin}/checkout/success?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing`,
        metadata: { email, plan, months: String(months), auto_renew: String(autoRenew) },
    });

    sendJson(res, 200, { url: session.url });
}

async function handleCancelSubscription(req, res) {
    const { email } = await readJson(req);
    if (!email) { sendJson(res, 400, { error: 'email is required.' }); return; }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) { sendJson(res, 500, { error: 'Supabase not configured.' }); return; }

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    let found;
    if (typeof supabase.auth.admin.getUserByEmail === 'function') {
        const { data, error: getUserErr } = await supabase.auth.admin.getUserByEmail(email);
        if (getUserErr) { sendJson(res, 500, { error: getUserErr.message }); return; }
        found = data;
    } else {
        const { data: listData, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listErr) { sendJson(res, 500, { error: listErr.message }); return; }
        found = listData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    }

    if (!found) { sendJson(res, 404, { error: 'User not found.' }); return; }

    let subscription = null;
    try {
        const { data, error: subErr } = await supabase.from('subscriptions')
            .select('stripe_subscription_id, stripe_customer_id, stripe_session_id, current_period_end')
            .eq('user_id', found.id)
            .single();
        if (subErr && subErr.code !== 'PGRST116') {
            console.warn('[stripe] subscription lookup warning:', subErr.message);
        } else {
            subscription = data || null;
        }
    } catch (err) {
        console.warn('[stripe] subscription lookup failed:', err.message);
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const scheduledCancellation = Boolean(subscription?.stripe_subscription_id);
    let stripePeriodEnd = subscription?.current_period_end || null;
    if (stripeKey && subscription?.stripe_subscription_id) {
        try {
            const stripe = new Stripe(stripeKey);
            const updatedSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, { cancel_at_period_end: true });
            stripePeriodEnd = toIsoFromStripeTimestamp(updatedSubscription.current_period_end) || stripePeriodEnd;
        } catch (err) {
            console.warn(`[stripe] cancel-subscription failed for ${email}: ${err.message}`);
        }
    }

    if (!scheduledCancellation) {
        const { error: profileErr } = await supabase.from('profiles')
            .upsert({ id: found.id, plan: 'free' }, { onConflict: 'id' });
        if (profileErr) { sendJson(res, 500, { error: profileErr.message }); return; }
    }

    try {
        await supabase.from('subscriptions').upsert({
            user_id: found.id,
            email: email.toLowerCase(),
            plan: scheduledCancellation ? 'pro' : 'free',
            stripe_customer_id: subscription?.stripe_customer_id || null,
            stripe_subscription_id: scheduledCancellation ? subscription.stripe_subscription_id : null,
            stripe_session_id: scheduledCancellation ? subscription?.stripe_session_id || null : null,
            status: scheduledCancellation ? 'active' : 'cancelled',
            current_period_end: scheduledCancellation ? stripePeriodEnd : null,
            cancel_at_period_end: scheduledCancellation,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    } catch (e) {
        console.error('[stripe] cancel-subscription update failed:', e.message);
    }

    sendJson(res, 200, { plan: scheduledCancellation ? 'pro' : 'free', cancel_at_period_end: scheduledCancellation, current_period_end: scheduledCancellation ? stripePeriodEnd : null });
}

// Called from the success page — verifies the session directly with Stripe
// and upgrades the plan without needing a webhook
async function handleVerifySession(req, res) {
    const { session_id } = await readJson(req);
    if (!session_id) { sendJson(res, 400, { error: 'session_id is required.' }); return; }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) { sendJson(res, 500, { error: 'Stripe not configured.' }); return; }

    const stripe = new Stripe(stripeKey);

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (!session || session.payment_status !== 'paid') {
        sendJson(res, 400, { error: 'Payment not completed.' }); return;
    }

    const email = session.metadata?.email || session.customer_email;
    const plan = session.metadata?.plan || 'pro';

    if (!email) { sendJson(res, 400, { error: 'No email found in session.' }); return; }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) { sendJson(res, 500, { error: 'Supabase not configured.' }); return; }

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const { data: { users } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const found = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!found) { sendJson(res, 404, { error: 'User not found.' }); return; }

    let stripeSubscription = typeof session.subscription === 'string'
        ? await stripe.subscriptions.retrieve(session.subscription)
        : session.subscription;
    stripeSubscription = await applyCheckoutRenewalPreference(stripe, stripeSubscription, session.metadata?.auto_renew !== 'false');

    // upsert profile plan
    const { error: profileErr } = await supabase.from('profiles')
        .upsert({ id: found.id, plan }, { onConflict: 'id' });
    if (profileErr) { sendJson(res, 500, { error: profileErr.message }); return; }

    // upsert subscription record (best-effort)
    try {
        await supabase.from('subscriptions').upsert({
            user_id: found.id,
            email: email.toLowerCase(),
            plan,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            stripe_session_id: session.id,
            ...stripeSubscriptionData(stripeSubscription),
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    } catch { /* best-effort */ }

    console.log(`[stripe] verified session ${session_id} → ${email} upgraded to ${plan}`);
    sendJson(res, 200, { plan });
}

async function handleStripeWebhook(req, res) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeKey || !webhookSecret) { sendJson(res, 500, { error: 'Stripe not configured.' }); return; }

    const stripe = new Stripe(stripeKey);

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks);
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
        console.error('[stripe] webhook signature failed:', err.message);
        sendJson(res, 400, { error: `Webhook error: ${err.message}` });
        return;
    }

    console.log('[stripe] event:', event.type);

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = supabaseUrl && serviceRoleKey
        ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
        : null;

    // Helper: find user by email and upsert their plan + subscription record
    async function applyPlanToUser(email, plan, subData = {}) {
        if (!supabase || !email) return;
        const { data: { users } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const found = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (!found) {
            console.warn(`[stripe] user not found for email: ${email}`);
            return;
        }
        // upsert so new users without a profile row still get updated
        const { error: profileErr } = await supabase.from('profiles')
            .upsert({ id: found.id, plan }, { onConflict: 'id' });
        if (profileErr) console.error('[stripe] profile upsert error:', profileErr.message);

        // upsert subscription record
        try {
            await supabase.from('subscriptions').upsert({
                user_id: found.id,
                email: email.toLowerCase(),
                plan,
                stripe_customer_id: subData.stripe_customer_id || null,
                stripe_subscription_id: subData.stripe_subscription_id || null,
                stripe_session_id: subData.stripe_session_id || null,
                status: subData.status || 'active',
                current_period_end: subData.current_period_end || null,
                cancel_at_period_end: Boolean(subData.cancel_at_period_end),
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
        } catch (e) { console.error('[stripe] subscription upsert error:', e.message); }

        console.log(`[stripe] ${email} → plan=${plan}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const email = session.metadata?.email || session.customer_email;
        const plan = session.metadata?.plan || 'pro';
        let subscription = typeof session.subscription === 'string'
            ? await stripe.subscriptions.retrieve(session.subscription)
            : session.subscription;
        subscription = await applyCheckoutRenewalPreference(stripe, subscription, session.metadata?.auto_renew !== 'false');
        await applyPlanToUser(email, plan, {
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            stripe_session_id: session.id,
            ...stripeSubscriptionData(subscription),
        });
    }

    if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object;
        const email = invoice.customer_email;
        const subId = invoice.subscription;
        if (email && subId) {
            const stripeSdk = new Stripe(stripeKey);
            const sub = await stripeSdk.subscriptions.retrieve(subId);
            await applyPlanToUser(email, 'pro', {
                stripe_customer_id: invoice.customer,
                stripe_subscription_id: subId,
                ...stripeSubscriptionData(sub),
            });
        }
    }

    if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.paused') {
        const sub = event.data.object;
        const stripeSdk = new Stripe(stripeKey);
        const customer = await stripeSdk.customers.retrieve(sub.customer);
        const email = customer.email;
        await applyPlanToUser(email, 'free', {
            stripe_customer_id: sub.customer,
            stripe_subscription_id: sub.id,
            status: 'cancelled',
            current_period_end: toIsoFromStripeTimestamp(sub.current_period_end),
            cancel_at_period_end: true,
        });
    }

    sendJson(res, 200, { received: true });
}

async function handleUpgradePlan(req, res) {
    const { email, cardNumber, expiry, cvc } = await readJson(req);
    if (!email) { sendJson(res, 400, { error: 'email is required.' }); return; }
    if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
        sendJson(res, 400, { error: 'Invalid card number.' }); return;
    }
    if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
        sendJson(res, 400, { error: 'Invalid expiry (MM/YY).' }); return;
    }
    if (!cvc || !/^\d{3,4}$/.test(cvc)) {
        sendJson(res, 400, { error: 'Invalid CVC.' }); return;
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        sendJson(res, 500, { error: 'Supabase credentials missing.' }); return;
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    // Fetch user id directly from auth.users using admin API
    const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) { sendJson(res, 500, { error: listErr.message }); return; }

    const found = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!found) { sendJson(res, 404, { error: 'User not found.' }); return; }

    const { error: updateErr } = await supabase.from('profiles').update({ plan: 'pro' }).eq('id', found.id);
    if (updateErr) { sendJson(res, 500, { error: updateErr.message }); return; }

    sendJson(res, 200, { plan: 'pro' });
}

async function handleAdminUserDetail(req, res) {
    const url = new URL(req.url, 'http://127.0.0.1');
    const email = url.searchParams.get('email')?.toLowerCase();
    if (!email) { sendJson(res, 400, { error: 'email is required.' }); return; }

    const now = Date.now();
    const DAY = 86400000;

    const supabase = getSupabaseClient();
    let subscription = null;
    let profile = null;
    if (supabase) {
        const { data: { users } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const user = users?.find(candidate => candidate.email?.toLowerCase() === email);
        if (user) {
            const [{ data: subscriptionData }, { data: profileData }] = await Promise.all([
                supabase.from('subscriptions').select('plan, status, current_period_end, cancel_at_period_end, interval_months').eq('user_id', user.id).maybeSingle(),
                supabase.from('profiles').select('plan, free_trial_ends_at, feature_access').eq('id', user.id).maybeSingle(),
            ]);
            subscription = subscriptionData;
            profile = profileData;
        }
    }

    const [entries24h, entries7d, entries30d] = await Promise.all([
        queryUsage({ userEmail: email, since: now - DAY }),
        queryUsage({ userEmail: email, since: now - 7 * DAY }),
        queryUsage({ userEmail: email, since: now - 30 * DAY }),
    ]);

    const sum = arr => arr.reduce((s, e) => s + e.inputTokens + e.outputTokens, 0);

    const perModel = {};
    for (const e of entries30d) {
        const m = e.model || 'unknown';
        if (!perModel[m]) perModel[m] = { tokens: 0, requests: 0 };
        perModel[m].tokens += e.inputTokens + e.outputTokens;
        perModel[m].requests += 1;
    }

    // Recent queries with throughput & latency (last 30d, max 100)
    const queries = entries30d.slice(0, 100).map(e => ({
        ts: e.ts,
        prompt: e.prompt ? e.prompt.slice(0, 200) : null,
        model: e.model,
        inputTokens: e.inputTokens,
        outputTokens: e.outputTokens,
        totalTokens: e.inputTokens + e.outputTokens,
        latencyMs: e.latencyMs,
        // throughput = output tokens per second
        throughput: e.latencyMs > 0 ? Math.round((e.outputTokens / e.latencyMs) * 1000) : 0,
    }));

    sendJson(res, 200, {
        subscription: subscriptionSummary(subscription, profile?.plan || 'free', profile?.free_trial_ends_at),
        feature_access: profile?.feature_access || {},
        tokens24h: sum(entries24h),
        tokens7d: sum(entries7d),
        tokens30d: sum(entries30d),
        requests24h: entries24h.length,
        requests30d: entries30d.length,
        avgLatencyMs: entries30d.length ? Math.round(entries30d.reduce((s, e) => s + e.latencyMs, 0) / entries30d.length) : 0,
        avgThroughput: entries30d.length ? Math.round(entries30d.reduce((s, e) => s + (e.latencyMs > 0 ? (e.outputTokens / e.latencyMs) * 1000 : 0), 0) / entries30d.length) : 0,
        perModel,
        timeline: buildTimeline(entries7d, 7),
        queries,
    });
}

async function handleAdminFeatureAccess(req, res) {
    const { email, feature, enabled } = await readJson(req);
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !feature || typeof enabled !== 'boolean') {
        sendJson(res, 400, { error: 'email, feature, and enabled are required.' });
        return;
    }

    const allowedFeatures = new Set(['threads', 'files', 'plugins', 'image-studio', 'ppt-studio', 'settings', 'project-settings']);
    if (!allowedFeatures.has(feature)) { sendJson(res, 400, { error: 'Unsupported feature.' }); return; }

    const supabase = getSupabaseClient();
    if (!supabase) { sendJson(res, 500, { error: 'Supabase not configured.' }); return; }
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) { sendJson(res, 500, { error: usersError.message }); return; }
    const user = users?.find(candidate => candidate.email?.toLowerCase() === normalizedEmail);
    if (!user) { sendJson(res, 404, { error: 'User not found.' }); return; }

    const { data: profile, error: profileError } = await supabase.from('profiles').select('feature_access').eq('id', user.id).maybeSingle();
    if (profileError) { sendJson(res, 500, { error: profileError.message }); return; }
    const featureAccess = { ...(profile?.feature_access || {}), [feature]: enabled };
    const { error: updateError } = await supabase.from('profiles').update({ feature_access: featureAccess }).eq('id', user.id);
    if (updateError) { sendJson(res, 500, { error: updateError.message }); return; }
    sendJson(res, 200, { feature_access: featureAccess });
}

async function handleAdminReactivateUser(req, res) {
    const { email } = await readJson(req);
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) { sendJson(res, 400, { error: 'email is required.' }); return; }

    const supabase = getSupabaseClient();
    if (!supabase) { sendJson(res, 500, { error: 'Supabase not configured.' }); return; }

    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) { sendJson(res, 500, { error: usersError.message }); return; }
    const user = users?.find(candidate => candidate.email?.toLowerCase() === normalizedEmail);
    if (!user) { sendJson(res, 404, { error: 'User not found.' }); return; }

    const { data: subscription, error: subscriptionError } = await supabase.from('subscriptions')
        .select('plan, status, current_period_end, cancel_at_period_end, interval_months, stripe_customer_id, stripe_subscription_id, stripe_session_id')
        .eq('user_id', user.id)
        .maybeSingle();
    if (subscriptionError) { sendJson(res, 500, { error: subscriptionError.message }); return; }

    const { data: profile, error: profileError } = await supabase.from('profiles')
        .select('plan, free_trial_ends_at')
        .eq('id', user.id)
        .maybeSingle();
    if (profileError) { sendJson(res, 500, { error: profileError.message }); return; }

    const currentSummary = subscriptionSummary(subscription, profile?.plan || 'free', profile?.free_trial_ends_at);
    if (!currentSummary.access_expired) {
        sendJson(res, 400, { error: 'This user does not have an expired plan.' });
        return;
    }

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    const { error: updateSubscriptionError } = await supabase.from('subscriptions').upsert({
        user_id: user.id,
        email: normalizedEmail,
        plan: 'free',
        status: 'active',
        current_period_end: null,
        cancel_at_period_end: false,
        interval_months: 1,
        stripe_customer_id: subscription?.stripe_customer_id || null,
        stripe_subscription_id: subscription?.stripe_subscription_id || null,
        stripe_session_id: subscription?.stripe_session_id || null,
        updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (updateSubscriptionError) { sendJson(res, 500, { error: updateSubscriptionError.message }); return; }

    const { error: updateProfileError } = await supabase.from('profiles')
        .upsert({ id: user.id, plan: 'free', free_trial_ends_at: periodEnd.toISOString() }, { onConflict: 'id' });
    if (updateProfileError) { sendJson(res, 500, { error: updateProfileError.message }); return; }

    sendJson(res, 200, {
        plan: 'free',
        current_period_end: periodEnd.toISOString(),
        plan_status: 'active',
        auto_renew: false,
        interval_months: 1,
        access_expired: false,
    });
}

async function handleMyUsage(req, res) {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    const supabase = getSupabaseClient();
    if (!token || !supabase) { sendJson(res, 401, { error: 'Sign in to view your usage.' }); return; }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user?.email) { sendJson(res, 401, { error: 'Your session is no longer valid.' }); return; }
    await handleUsage(req, res, user.email);
}

async function handleAdminUsers(req, res) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) { sendJson(res, 500, { error: 'Supabase not configured.' }); return; }

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    // Get all auth users
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

    // Get all profiles and subscription state for plan administration.
    const { data: profiles } = await supabase.from('profiles').select('id, plan, full_name, free_trial_ends_at');
    const { data: subscriptions } = await supabase.from('subscriptions')
        .select('user_id, plan, status, current_period_end, cancel_at_period_end, interval_months, stripe_subscription_id');
    const hydratedSubscriptions = await hydrateSubscriptionEndDates(supabase, subscriptions || []);
    const profileMap = {};
    for (const p of profiles || []) profileMap[p.id] = p;
    const subscriptionMap = {};
    for (const subscription of hydratedSubscriptions) subscriptionMap[subscription.user_id] = subscription;

    // Get per-user token usage from last 30 days
    const since30d = Date.now() - 30 * 86400000;
    const allEntries = await queryUsage({ since: since30d });
    const perUserTokens = {};
    for (const entry of allEntries) {
        if (!entry.userEmail) continue;
        perUserTokens[entry.userEmail] = (perUserTokens[entry.userEmail] || 0) + entry.inputTokens + entry.outputTokens;
    }

    const users = (authUsers || []).map(u => ({
        id: u.id,
        email: u.email,
        full_name: profileMap[u.id]?.full_name || u.user_metadata?.full_name || null,
        ...subscriptionSummary(subscriptionMap[u.id], profileMap[u.id]?.plan || 'free', profileMap[u.id]?.free_trial_ends_at),
        tokens: perUserTokens[u.email?.toLowerCase()] || 0,
        created_at: u.created_at,
    }));

    sendJson(res, 200, { users });
}

async function hydrateSubscriptionEndDates(supabase, subscriptions) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) return subscriptions;

    const stripe = new Stripe(stripeKey);
    return Promise.all(subscriptions.map(async subscription => {
        if (subscription.current_period_end || !subscription.stripe_subscription_id) return subscription;
        try {
            const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
            const updates = stripeSubscriptionData(stripeSubscription);
            if (!updates.current_period_end) return subscription;
            const { error } = await supabase.from('subscriptions')
                .update(updates)
                .eq('user_id', subscription.user_id);
            if (error) console.warn(`[admin] failed to save period end for ${subscription.email || subscription.user_id}: ${error.message}`);
            return { ...subscription, ...updates };
        } catch (error) {
            console.warn(`[admin] failed to retrieve Stripe subscription ${subscription.stripe_subscription_id}: ${error.message}`);
            return subscription;
        }
    }));
}

async function sendTransactionalEmail(email, subject, html) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) { console.warn('[email] RESEND_API_KEY not set'); return { success: false, error: 'RESEND_API_KEY not configured.' }; }
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: email,
        subject,
        html,
    });
    if (error) console.error('[email] resend error:', error);
    else console.log(`[email] sent "${subject}" to ${email}`);
    return error ? { success: false, error: error.message } : { success: true };
}

function emailLayout(content) {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0e0e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e0e;padding:40px 20px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden">
        <tr><td style="padding:32px 40px 24px;border-bottom:1px solid #1f1f1f">
          <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff">NetRoot AI</p>
        </td></tr>
        ${content}
        <tr><td style="padding:20px 40px;border-top:1px solid #1f1f1f">
          <p style="margin:0;font-size:12px;color:#4b5563">&copy; ${new Date().getFullYear()} NetRoot AI. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function handleSendWelcome(req, res) {
    const { email, full_name } = await readJson(req);
    if (!email) { sendJson(res, 400, { error: 'email is required.' }); return; }
    const name = full_name ? full_name.split(' ')[0] : 'there';
    const html = emailLayout(`
        <tr><td style="padding:32px 40px">
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#ffffff">Welcome to NetRoot AI, ${name}! 🎉</h1>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#9ca3af">Your free account is ready. Here's what you get:</p>
          <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;line-height:2;color:#9ca3af">
            <li>AI-powered chat with multiple models</li>
            <li>Daily token allowance</li>
            <li>Plugin integrations</li>
            <li>Image Studio access</li>
          </ul>
          <a href="https://netrootai.tech/dashboard" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px">Start Chatting</a>
          <p style="margin:28px 0 0;font-size:12px;color:#4b5563">Upgrade to Pro anytime for 10× token limits and all premium features.</p>
        </td></tr>`);
    await sendTransactionalEmail(email, 'Welcome to NetRoot AI! 🚀', html);
    sendJson(res, 200, { success: true });
}

async function handleSendProUpgrade(req, res) {
    const { email, full_name } = await readJson(req);
    if (!email) { sendJson(res, 400, { error: 'email is required.' }); return; }
    const name = full_name ? full_name.split(' ')[0] : 'there';
    const html = emailLayout(`
        <tr><td style="padding:32px 40px">
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#ffffff">You're now on Pro, ${name}! ⚡</h1>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#9ca3af">Your NetRoot AI Pro plan is now active. Here's what's unlocked:</p>
          <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;line-height:2;color:#9ca3af">
            <li>10× daily token limits</li>
            <li>Access to all premium AI models</li>
            <li>All plugins unlocked</li>
            <li>Priority support</li>
          </ul>
          <a href="https://netrootai.tech/dashboard" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#6366f1);color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px">Go to Dashboard</a>
          <p style="margin:28px 0 0;font-size:12px;color:#4b5563">Thank you for supporting NetRoot AI. Your subscription renews monthly.</p>
        </td></tr>`);
    await sendTransactionalEmail(email, 'Welcome to NetRoot AI Pro! ⚡', html);
    sendJson(res, 200, { success: true });
}

async function handleSendExpiredPlanEmail(req, res) {
    const { email } = await readJson(req);
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) { sendJson(res, 400, { error: 'email is required.' }); return; }

    const supabase = getSupabaseClient();
    if (!supabase) { sendJson(res, 500, { error: 'Supabase not configured.' }); return; }

    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) { sendJson(res, 500, { error: usersError.message }); return; }
    const user = users?.find(candidate => candidate.email?.toLowerCase() === normalizedEmail);
    if (!user) { sendJson(res, 404, { error: 'User not found.' }); return; }

    const [{ data: subscription }, { data: profile }] = await Promise.all([
        supabase.from('subscriptions').select('plan, status, current_period_end, cancel_at_period_end, interval_months').eq('user_id', user.id).maybeSingle(),
        supabase.from('profiles').select('plan, free_trial_ends_at, full_name').eq('id', user.id).maybeSingle(),
    ]);
    const summary = subscriptionSummary(subscription, profile?.plan || 'free', profile?.free_trial_ends_at);
    if (!summary.access_expired) {
        sendJson(res, 409, { error: 'This user does not currently have an expired plan.' });
        return;
    }

    const name = profile?.full_name?.split(' ')[0] || 'there';
    const endDate = summary.current_period_end ? new Date(summary.current_period_end).toLocaleDateString() : 'recently';
    const html = emailLayout(`
        <tr><td style="padding:32px 40px">
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#ffffff">Your NetRoot AI plan has expired, ${name}</h1>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#9ca3af">Your ${summary.plan} plan ended on ${endDate}. Your account is still available on the Free plan.</p>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#9ca3af">Upgrade again to restore higher token limits, premium models, and all premium features.</p>
          <a href="https://netrootai.tech/pricing" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px">View Plans</a>
        </td></tr>`);
    const result = await sendTransactionalEmail(normalizedEmail, 'Your NetRoot AI plan has expired', html);
    if (!result.success) { sendJson(res, 500, { error: result.error }); return; }
    sendJson(res, 200, { success: true });
}

async function handleSendEmail(req, res) {
    const body = await readJson(req);
    const { email, confirmation_url, type } = body;

    if (!email) { sendJson(res, 400, { error: 'email is required.' }); return; }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) { sendJson(res, 500, { error: 'RESEND_API_KEY not configured.' }); return; }

    const isReset = !type || type === 'recovery';
    const subject = isReset ? 'Reset your NetRoot AI password' : 'Confirm your NetRoot AI email';
    const actionUrl = confirmation_url || '#';
    const actionLabel = isReset ? 'Reset Password' : 'Confirm Email';
    const bodyText = isReset
        ? 'You requested a password reset for your NetRoot AI account. Click the button below to set a new password. This link expires in 1 hour.'
        : 'Please confirm your email address to activate your NetRoot AI account.';

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0e0e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e0e;padding:40px 20px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden">
        <tr><td style="padding:32px 40px 24px;border-bottom:1px solid #1f1f1f">
          <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff">NetRoot AI</p>
        </td></tr>
        <tr><td style="padding:32px 40px">
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#ffffff">${subject}</h1>
          <p style="margin:0 0 28px;font-size:14px;line-height:1.6;color:#9ca3af">${bodyText}</p>
          <a href="${actionUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px">${actionLabel}</a>
          <p style="margin:28px 0 0;font-size:12px;color:#4b5563">If you didn't request this, you can safely ignore this email.</p>
          <p style="margin:8px 0 0;font-size:12px;color:#374151">Or copy this link: <a href="${actionUrl}" style="color:#3b82f6;word-break:break-all">${actionUrl}</a></p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #1f1f1f">
          <p style="margin:0;font-size:12px;color:#4b5563">&copy; ${new Date().getFullYear()} NetRoot AI. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: email,
        subject,
        html,
    });

    if (error) {
        console.error('[email] resend error:', error);
        sendJson(res, 500, { error: error.message });
        return;
    }

    console.log(`[email] sent ${type || 'recovery'} to ${email}`);
    sendJson(res, 200, { success: true });
}

const server = createServer(async (req, res) => {
    if (req.method === 'OPTIONS') { sendJson(res, 204, {}, req); return; }
    if (req.method === 'GET' && req.url === '/api/plan-limits') {
        try { handlePlanLimits(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
        return;
    }
    if (req.method === 'GET' && req.url.startsWith('/api/usage')) {
        try { await handleUsage(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
        return;
    }
    if (req.method === 'GET' && req.url.startsWith('/api/my-usage')) {
        try { await handleMyUsage(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
        return;
    }
    if (req.method === 'POST' && req.url === '/api/chat') {
        try { await handleChat(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
        return;
    }
    if (req.method === 'GET' && req.url.startsWith('/api/ppt/quota')) {
        try { await handlePptQuota(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
        return;
    }
    if (req.method === 'GET' && req.url.startsWith('/api/get-plan')) {
        try { await handleGetPlan(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
        return;
    }
    if (req.method === 'POST' && req.url === '/api/upgrade-plan') {
        try { await handleUpgradePlan(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
        return;
    }
    if (req.method === 'POST' && req.url === '/api/create-checkout') {
        try { await handleCreateCheckout(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
        return;
    }
    if (req.method === 'POST' && req.url === '/api/cancel-subscription') {
        try { await handleCancelSubscription(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
        return;
    }
    if (req.method === 'POST' && req.url === '/api/verify-session') {
        try { await handleVerifySession(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
        return;
    }
    if (req.method === 'POST' && req.url === '/api/stripe/webhook') {
        try { await handleStripeWebhook(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
        return;
    }
    if (req.method === 'GET' && req.url === '/api/admin/users') {
        try { await handleAdminUsers(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
        return;
    }
    if (req.method === 'GET' && req.url.startsWith('/api/admin/user-detail')) {
        try { await handleAdminUserDetail(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
        return;
    }
    if (req.method === 'POST' && req.url === '/api/admin/feature-access') {
        try { await handleAdminFeatureAccess(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
        return;
    }
    if (req.method === 'POST' && req.url === '/api/admin/reactivate-user') {
        try { await handleAdminReactivateUser(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
        return;
    }
    if (req.method === 'POST' && req.url === '/api/send-email') {
        try { await handleSendEmail(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
        return;
    }
    if (req.method === 'POST' && req.url === '/api/send-welcome') {
        try { await handleSendWelcome(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
        return;
    }
    if (req.method === 'POST' && req.url === '/api/send-pro-upgrade') {
        try { await handleSendProUpgrade(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
        return;
    }
    if (req.method === 'POST' && req.url === '/api/admin/send-expired-plan-email') {
        try { await handleSendExpiredPlanEmail(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
        return;
    }
    if (req.method === 'POST' && req.url === '/api/image-studio') {
        try { await handleImageStudio(req, res); } catch (e) { console.error('[image-studio]', e); sendJson(res, 500, { error: e.message }, req); }
        return;
    }
    if (req.method === 'POST' && req.url === '/api/video-generation') {
        try { await handleVideoGeneration(req, res); } catch (e) { console.error('[video-generation]', e); sendJson(res, 500, { error: e.message }, req); }
        return;
    }
    const parsedReqUrl = new URL(req.url, 'http://127.0.0.1');
    if (PPT_ROUTES.has(parsedReqUrl.pathname) || req.url.startsWith('/api/ppt/')) {
        try { await handlePptProxy(req, res); } catch (e) { console.error('[ppt-proxy]', e); sendJson(res, 500, { error: e.message }, req); }
        return;
    }
    if (req.method === 'POST' && req.url === '/api/generate-ppt') {
        try { await handlePptProxy(req, res); } catch (e) { console.error('[ppt-generation]', e); sendJson(res, 500, { error: e.message }, req); }
        return;
    }
    if (req.method === 'GET' && req.url.startsWith('/api/download/')) {
        try { await handlePptDownload(req, res); } catch (e) { sendJson(res, 500, { error: e.message }, req); }
        return;
    }
    sendJson(res, 404, { error: 'Not found.' });
});

const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`API server running at http://${HOST}:${PORT}`);
    console.log(`[env] VITE_SUPABASE_URL: ${process.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING'}`);
    console.log(`[env] SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'}`);
    console.log(`[env] AI_PROVIDER: ${process.env.AI_PROVIDER || 'not set'}`);
    console.log(`[env] IS_VPS: ${process.env.IS_VPS || 'not set'}`);
    console.log(`[bind] Listening on ${HOST}:${PORT}`);
});
