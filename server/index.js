import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { PLAN_LIMITS, canUseModel, canUseTokens, getPlanLimits, normalizePlan } from './planLimits.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const PORT = Number(process.env.API_PORT || process.env.PORT || 3001);
const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/responses';
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

const VISION_MODELS = new Set([
    'qwen/qwen3.6-27b',
]);


loadEnvFile();

const AI_PROVIDER = (process.env.AI_PROVIDER || 'openai').toLowerCase();


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

function sendJson(res, statusCode, payload) {
    const origin = res.req?.headers?.origin || '';
    const allowed = ['http://127.0.0.1:5173', 'http://localhost:5173', 'https://netrootai.tech', 'https://ampjiasvmmhxeqwdullc.supabase.co'];
    const corsOrigin = allowed.includes(origin) ? origin : '*';
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(JSON.stringify(payload));
}

// ─── Usage Store ─────────────────────────────────────────────────────────────

const USAGE_FILE = join(PROJECT_ROOT, 'server', 'usage-data.json');

function loadUsageStore() {
    try { if (existsSync(USAGE_FILE)) return JSON.parse(readFileSync(USAGE_FILE, 'utf8')); }
    catch { /* ignore */ }
    return [];
}

function saveUsageStore() {
    try {
        const cutoff = Date.now() - 90 * 86400000;
        writeFileSync(USAGE_FILE, JSON.stringify(usageStore.filter(e => e.ts >= cutoff)));
    } catch { /* ignore */ }
}

const usageStore = loadUsageStore();

function recordUsage({ inputTokens, outputTokens, cachedTokens, latencyMs, model, userEmail, plan }) {
    usageStore.push({
        ts: Date.now(),
        inputTokens,
        outputTokens,
        cachedTokens,
        latencyMs,
        model,
        userEmail: userEmail?.toLowerCase?.() || null,
        plan: normalizePlan(plan),
    });
    saveUsageStore();
}

function estimateRequestTokens(prompt, attachments = []) {
    const promptText = String(prompt || '').trim();
    const attachmentText = Array.isArray(attachments) ? attachments.map(a => a.name || '').join(' ') : '';
    return Math.max(300, Math.ceil((promptText.length + attachmentText.length) / 3));
}

function getTodayUserUsage(userEmail) {
    const cutoff = Date.now() - 86400000;
    return usageStore
        .filter(entry => entry.ts >= cutoff && entry.userEmail && entry.userEmail === String(userEmail).toLowerCase())
        .reduce((sum, entry) => sum + (entry.inputTokens || 0) + (entry.outputTokens || 0), 0);
}

async function resolveUserPlan(req, body = {}) {
    const email = body.email || body.user?.email || body.userEmail || req.headers['x-user-email'] || '';
    if (!email) return { plan: 'free', email: null };

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) return { plan: 'free', email: String(email).toLowerCase() };

    try {
        const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
        const { data: { users } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const found = users?.find(u => u.email?.toLowerCase() === String(email).toLowerCase());
        if (!found) return { plan: 'free', email: String(email).toLowerCase() };

        const { data } = await supabase.from('profiles').select('plan').eq('id', found.id).single();
        return { plan: normalizePlan(data?.plan || 'free'), email: String(email).toLowerCase() };
    } catch (err) {
        console.warn('[plan] failed to resolve user plan:', err.message);
        return { plan: 'free', email: String(email).toLowerCase() };
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

function handleUsage(req, res) {
    const url = new URL(req.url, 'http://127.0.0.1');
    const period = url.searchParams.get('period') || '30d';
    const days = period === '1d' ? 1 : period === '7d' ? 7 : 30;
    const label = period === '1d' ? 'Last 24 hours' : period === '7d' ? 'Last 7 days' : 'Last 30 days';
    const entries = usageStore.filter(e => e.ts >= Date.now() - days * 86400000);

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
    };
    const modelInfo = MODEL_LIMITS[modelId] || { dailyLimit: 200000, contextWindow: 131072, displayName: modelId };
    const todayEntries = usageStore.filter(e => e.ts >= Date.now() - 86400000);
    const tokensUsedToday = todayEntries.reduce((s, e) => s + e.inputTokens + e.outputTokens, 0);

    // Per-model token usage for today
    const perModelTokens = {};
    for (const e of todayEntries) {
        const m = e.model || modelId;
        perModelTokens[m] = (perModelTokens[m] || 0) + e.inputTokens + e.outputTokens;
    }

    const dailyLimit = modelInfo.dailyLimit;
    const remainingTokens = dailyLimit !== null ? Math.max(0, dailyLimit - tokensUsedToday) : null;
    const usedPercent = dailyLimit !== null ? Math.min(100, Math.round((tokensUsedToday / dailyLimit) * 100)) : 0;

    sendJson(res, 200, {
        model: modelId, modelDisplayName: modelInfo.displayName, contextWindow: modelInfo.contextWindow,
        dailyTokenLimit: dailyLimit, tokensUsedToday, remainingTokens, usedPercent,
        perModelTokens,
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
    const prompt = String(body.prompt || '').trim();

    if (!prompt && (!Array.isArray(body.attachments) || body.attachments.length === 0)) {
        sendJson(res, 400, { error: 'Prompt is required.' });
        return;
    }

    const { plan, email } = await resolveUserPlan(req, body);
    const planLimits = getPlanLimits(plan);
    const selectedModel = body.model || process.env.GROQ_MODEL || process.env.OPENAI_MODEL || 'openai/gpt-oss-20b';
    const requestStart = Date.now();

    console.log('[chat] plan:', plan, '| model:', selectedModel, '| canUse:', canUseModel(plan, selectedModel), '| allowedModels:', JSON.stringify(getPlanLimits(plan).allowedModels));
    if (!canUseModel(plan, selectedModel)) {
        sendJson(res, 403, {
            error: `The model ${selectedModel} is not available on the ${plan} plan. Upgrade to Pro to access more models.`,
        });
        return;
    }

    const estimatedTokens = estimateRequestTokens(prompt, body.attachments);
    const alreadyUsedToday = getTodayUserUsage(email);
    if (!canUseTokens(plan, alreadyUsedToday, estimatedTokens)) {
        sendJson(res, 429, {
            error: `You have reached your daily token limit for the ${plan} plan. Upgrade to Pro for ${planLimits.dailyTokenLimit} daily tokens.`,
        });
        return;
    }

    const { pluginContext, imageUrl } = await resolvePlugins(prompt, body.plugins, body.attachments);

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
            if (data.usage) recordUsage({ inputTokens: data.usage.prompt_tokens || 0, outputTokens: data.usage.completion_tokens || 0, cachedTokens: 0, latencyMs: Date.now() - groqStart, model: groqModel, userEmail: email, plan });
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
            if (data.usage) recordUsage({ inputTokens: data.usage.prompt_tokens || 0, outputTokens: data.usage.completion_tokens || 0, cachedTokens: 0, latencyMs: Date.now() - groqStart, model: groqModel, userEmail: email, plan });
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

    const { data } = await supabase.from('profiles').select('plan').eq('id', found.id).single();
    sendJson(res, 200, { plan: data?.plan || 'free' });
}

// ─── Stripe ──────────────────────────────────────────────────────────────────

const IS_VPS = process.env.NODE_ENV === 'production' || process.env.IS_VPS === 'true';
const STRIPE_WEBHOOK_URL = IS_VPS
    ? 'https://netrootai.tech/api/stripe/webhook'
    : 'https://ampjiasvmmhxeqwdullc.supabase.co/functions/v1/stripe-webhook';

async function handleCreateCheckout(req, res) {
    const { email, plan } = await readJson(req);
    if (!email || !plan) { sendJson(res, 400, { error: 'email and plan are required.' }); return; }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) { sendJson(res, 500, { error: 'Stripe not configured.' }); return; }

    const stripe = new Stripe(stripeKey);
    const origin = req.headers?.origin || (IS_VPS ? 'https://netrootai.tech' : 'http://localhost:5173');

    const lineItems = [{
        price_data: {
            currency: 'usd',
            product_data: { name: `NetRoot AI ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan` },
            unit_amount: plan === 'pro' ? 1900 : 0,
            recurring: { interval: 'month' },
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
        metadata: { email, plan },
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
            .select('stripe_subscription_id, stripe_customer_id, stripe_session_id')
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
    if (stripeKey && subscription?.stripe_subscription_id) {
        try {
            const stripe = new Stripe(stripeKey);
            await stripe.subscriptions.del(subscription.stripe_subscription_id);
        } catch (err) {
            console.warn(`[stripe] cancel-subscription failed for ${email}: ${err.message}`);
        }
    }

    const { error: profileErr } = await supabase.from('profiles')
        .upsert({ id: found.id, plan: 'free' }, { onConflict: 'id' });
    if (profileErr) { sendJson(res, 500, { error: profileErr.message }); return; }

    try {
        await supabase.from('subscriptions').upsert({
            user_id: found.id,
            email: email.toLowerCase(),
            plan: 'free',
            stripe_customer_id: subscription?.stripe_customer_id || null,
            stripe_subscription_id: null,
            stripe_session_id: null,
            status: 'cancelled',
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    } catch (e) {
        console.error('[stripe] cancel-subscription update failed:', e.message);
    }

    sendJson(res, 200, { plan: 'free' });
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
            status: 'active',
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
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
        } catch (e) { console.error('[stripe] subscription upsert error:', e.message); }

        console.log(`[stripe] ${email} → plan=${plan}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const email = session.metadata?.email || session.customer_email;
        const plan = session.metadata?.plan || 'pro';
        await applyPlanToUser(email, plan, {
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            stripe_session_id: session.id,
            status: 'active',
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
                status: 'active',
                current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
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
        from: 'NetRoot AI <onboarding@resend.dev>',
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
    if (req.method === 'OPTIONS') { sendJson(res, 204, {}); return; }
    if (req.method === 'GET' && req.url === '/api/plan-limits') {
        try { handlePlanLimits(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
        return;
    }
    if (req.method === 'GET' && req.url.startsWith('/api/usage')) {
        try { await handleUsage(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
        return;
    }
    if (req.method === 'POST' && req.url === '/api/chat') {
        try { await handleChat(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
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
    if (req.method === 'POST' && req.url === '/api/send-email') {
        try { await handleSendEmail(req, res); } catch (e) { sendJson(res, 500, { error: e.message }); }
        return;
    }
    sendJson(res, 404, { error: 'Not found.' });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`API server running at http://127.0.0.1:${PORT}`);
});
