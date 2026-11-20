import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WALLET_CACHE_FILE = join(__dirname, 'walletData.json');

// Local fallback store if Supabase table is pending migration or offline
function loadLocalWalletData() {
  try {
    if (existsSync(WALLET_CACHE_FILE)) {
      return JSON.parse(readFileSync(WALLET_CACHE_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('[walletService] Error reading walletData.json:', e.message);
  }
  return { balances: {}, transactions: [] };
}

function saveLocalWalletData(data) {
  try {
    writeFileSync(WALLET_CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn('[walletService] Error saving walletData.json:', e.message);
  }
}

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function isModelFree(modelId) {
  if (!modelId) return true;
  const id = String(modelId).toLowerCase();
  if (id.endsWith(':free') || id.includes(':free')) return true;
  const freeList = [
    'openai/gpt-oss-20b',
    'allam-2-7b',
    'qwen/qwen3.8-27b',
    'ppt-studio',
    'fal-ai/flux/schnell',
    'black-forest-labs/flux.1-schnell',
    'fal-ai/f5-tts',
    'fal-ai/whisper',
    'fal-ai/cogvideox-5b',
  ];
  return freeList.some(f => id === f || id.includes(f));
}

// Auth email to userId cache with 60-second TTL
let authUsersCache = null;
let authUsersCacheTime = 0;
const stripeCreditLocks = new Map();

export async function getUserIdByEmail(sb, cleanEmail) {
  if (!sb || !cleanEmail) return null;
  const now = Date.now();
  if (!authUsersCache || now - authUsersCacheTime > 60_000) {
    try {
      const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (!error && data?.users) {
        authUsersCache = new Map();
        for (const u of data.users) {
          if (u.email) {
            authUsersCache.set(u.email.toLowerCase(), u.id);
          }
        }
        authUsersCacheTime = now;
      }
    } catch (e) {
      console.warn('[walletService] listUsers warning:', e.message);
    }
  }
  return authUsersCache?.get(cleanEmail) || null;
}

/**
 * Get the current wallet balance for a user.
 */
export async function getUserWallet(email, userId = null) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  let resolvedUserId = userId;

  const sb = getSupabase();
  if (sb) {
    try {
      if (!resolvedUserId && cleanEmail) {
        resolvedUserId = await getUserIdByEmail(sb, cleanEmail);
      }

      if (resolvedUserId) {
        const { data, error } = await sb
          .from('profiles')
          .select('id, wallet_balance')
          .eq('id', resolvedUserId)
          .maybeSingle();

        if (!error && data && data.wallet_balance !== undefined && data.wallet_balance !== null) {
          return {
            userId: data.id,
            email: cleanEmail,
            balance: Number(data.wallet_balance) || 0,
          };
        }
      }
    } catch (err) {
      console.warn('[walletService] Supabase getUserWallet warning:', err.message);
    }
  }

  // Local fallback
  const local = loadLocalWalletData();
  const bal = Number(local.balances?.[cleanEmail] ?? 0);
  return { userId: resolvedUserId, email: cleanEmail, balance: bal };
}

/**
 * Credit user wallet (e.g. from Stripe payment or admin topup).
 */
export async function creditUserWallet(email, amount, options = {}) {
  const { stripeSessionId } = options;
  if (!stripeSessionId) {
    return creditUserWalletInternal(email, amount, options);
  }

  const previous = stripeCreditLocks.get(stripeSessionId) || Promise.resolve();
  let release;
  const lock = new Promise(resolve => { release = resolve; });
  stripeCreditLocks.set(stripeSessionId, lock);
  await previous;

  try {
    return await creditUserWalletInternal(email, amount, options);
  } finally {
    if (stripeCreditLocks.get(stripeSessionId) === lock) {
      stripeCreditLocks.delete(stripeSessionId);
    }
    release();
  }
}

async function creditUserWalletInternal(email, amount, { userId = null, stripeSessionId = null, note = 'Stripe Top-Up' } = {}) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const addAmount = Number(amount);
  if ((!cleanEmail && !userId) || isNaN(addAmount) || addAmount <= 0) {
    throw new Error('Valid email or userId and positive amount are required.');
  }

  const sb = getSupabase();
  if (stripeSessionId && sb) {
    const current = await getUserWallet(cleanEmail, userId);
    const targetUserId = current.userId || userId;
    if (!targetUserId) {
      throw new Error(`[walletService] Cannot resolve a Supabase user for Stripe session ${stripeSessionId}.`);
    }

    const { data, error } = await sb.rpc('credit_wallet_once', {
      p_user_id: targetUserId,
      p_user_email: cleanEmail,
      p_amount: addAmount,
      p_stripe_session_id: stripeSessionId,
      p_note: note,
    });
    if (error) {
      throw new Error(`[walletService] Atomic wallet credit failed: ${error.message}`);
    }
    if (!data || data.success !== true || !Number.isFinite(Number(data.balance))) {
      throw new Error('[walletService] Atomic wallet credit returned an invalid result.');
    }

    const localCheck = loadLocalWalletData();
    localCheck.balances = localCheck.balances || {};
    if (cleanEmail) localCheck.balances[cleanEmail] = Number(data.balance);
    if (!data.duplicate) {
      localCheck.transactions = localCheck.transactions || [];
      localCheck.transactions.unshift({
        id: `tx_${crypto.randomBytes(4).toString('hex')}`,
        user_id: targetUserId,
        user_email: cleanEmail,
        type: 'deposit',
        amount: addAmount,
        balance_after: Number(data.balance),
        stripe_session_id: stripeSessionId,
        metadata: { note },
        created_at: new Date().toISOString(),
      });
      if (localCheck.transactions.length > 500) localCheck.transactions = localCheck.transactions.slice(0, 500);
    }
    saveLocalWalletData(localCheck);
    return { success: true, balance: Number(data.balance), duplicate: Boolean(data.duplicate) };
  }

  // Supabase-less deployments use the local store; the per-session queue above
  // serializes concurrent webhook and return-page deliveries in this process.
  if (stripeSessionId) {
    const localCheck = loadLocalWalletData();
    const isAlreadyCredited = (localCheck.transactions || []).some(
      t => t.stripe_session_id === stripeSessionId
    );
    if (isAlreadyCredited) {
      console.log(`[walletService] Session ${stripeSessionId} already credited locally. Skipping duplicate.`);
      const current = await getUserWallet(cleanEmail, userId);
      return { success: true, balance: current.balance, duplicate: true };
    }
  }

  const current = await getUserWallet(cleanEmail, userId);
  const targetUserId = current.userId || userId;
  const newBalance = Number((current.balance + addAmount).toFixed(5));

  let recordedInDb = false;

  if (sb && targetUserId) {
    try {
      const { error: updateErr } = await sb
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', targetUserId);

      if (!updateErr) {
        recordedInDb = true;
        const { error: txErr } = await sb.from('wallet_transactions').insert({
          user_id: targetUserId,
          user_email: cleanEmail,
          type: 'deposit',
          amount: addAmount,
          balance_after: newBalance,
          stripe_session_id: stripeSessionId,
          metadata: { note },
        });
        if (txErr) console.warn('[walletService] transaction insert warning:', txErr.message);
      } else {
        console.warn('[walletService] Supabase credit update error:', updateErr.message);
      }
    } catch (err) {
      console.warn('[walletService] Supabase credit error:', err.message);
    }
  }

  // Always mirror to local store as safety net
  const local = loadLocalWalletData();
  local.balances = local.balances || {};
  if (cleanEmail) local.balances[cleanEmail] = newBalance;
  local.transactions = local.transactions || [];
  local.transactions.unshift({
    id: `tx_${crypto.randomBytes(4).toString('hex')}`,
    user_id: targetUserId,
    user_email: cleanEmail,
    type: 'deposit',
    amount: addAmount,
    balance_after: newBalance,
    stripe_session_id: stripeSessionId,
    metadata: { note },
    created_at: new Date().toISOString(),
  });
  if (local.transactions.length > 500) local.transactions = local.transactions.slice(0, 500);
  saveLocalWalletData(local);

  console.log(`[walletService] Credited ${cleanEmail || targetUserId} +$${addAmount}. New Balance: $${newBalance}`);
  return { success: true, balance: newBalance };
}

/**
 * Deduct billed cost from user wallet for paid model usage.
 */
export async function deductUserWallet({
  email,
  userId = null,
  model,
  promptTokens = 0,
  completionTokens = 0,
  billedCost = 0,
  baseCost = 0,
  profitUsd = 0,
}) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const deductAmount = Number(billedCost);
  if ((!cleanEmail && !userId) || isNaN(deductAmount) || deductAmount <= 0) {
    return { success: true, deducted: 0 };
  }

  const current = await getUserWallet(cleanEmail, userId);
  const targetUserId = current.userId || userId;
  const newBalance = Number(Math.max(0, current.balance - deductAmount).toFixed(5));

  const sb = getSupabase();
  if (sb && targetUserId) {
    try {
      const { error: updateErr } = await sb
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', targetUserId);

      if (!updateErr) {
        const { error: txErr } = await sb.from('wallet_transactions').insert({
          user_id: targetUserId,
          user_email: cleanEmail,
          type: 'usage_debit',
          amount: -deductAmount,
          balance_after: newBalance,
          model,
          tokens_total: (promptTokens || 0) + (completionTokens || 0),
          base_cost: Number(baseCost.toFixed(5)),
          profit_usd: Number(profitUsd.toFixed(5)),
          metadata: {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
          },
        });
        if (txErr) console.warn('[walletService] usage transaction warning:', txErr.message);
        console.log(`[walletService] Deducted $${deductAmount.toFixed(5)} from ${cleanEmail || targetUserId} for ${model}. Remaining: $${newBalance}`);
      } else {
        console.warn('[walletService] Supabase deduct update error:', updateErr.message);
      }
    } catch (err) {
      console.warn('[walletService] Supabase deduct error:', err.message);
    }
  }

  // Mirror to local store
  const local = loadLocalWalletData();
  local.balances = local.balances || {};
  if (cleanEmail) local.balances[cleanEmail] = newBalance;
  local.transactions = local.transactions || [];
  local.transactions.unshift({
    id: `tx_${crypto.randomBytes(4).toString('hex')}`,
    user_id: targetUserId,
    user_email: cleanEmail,
    type: 'usage_debit',
    amount: -deductAmount,
    balance_after: newBalance,
    model,
    tokens_total: (promptTokens || 0) + (completionTokens || 0),
    base_cost: Number(baseCost.toFixed(5)),
    profit_usd: Number(profitUsd.toFixed(5)),
    created_at: new Date().toISOString(),
  });
  if (local.transactions.length > 500) local.transactions = local.transactions.slice(0, 500);
  saveLocalWalletData(local);

  return { success: true, balance: newBalance, deducted: deductAmount };
}

/**
 * Get recent transactions for a user.
 */
export async function getUserWalletTransactions(email, limit = 50) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) return [];

  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('wallet_transactions')
        .select('*')
        .ilike('user_email', cleanEmail)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('[walletService] query transactions error:', err.message);
    }
  }

  // Fallback to local
  const local = loadLocalWalletData();
  return (local.transactions || [])
    .filter(t => t.user_email?.toLowerCase() === cleanEmail)
    .slice(0, limit);
}

/**
 * Get platform-wide financial aggregates and per-user metrics for admin.
 */
export async function getPlatformFinancialMetrics() {
  const local = loadLocalWalletData();
  let allTx = local.transactions || [];

  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5000);
      if (!error && data && data.length > 0) {
        allTx = data;
      }
    } catch (err) {
      console.warn('[walletService] getPlatformFinancialMetrics sb error:', err.message);
    }
  }

  let totalDeposits = 0;
  let totalBaseCost = 0;
  let totalProfit = 0;
  let totalBilled = 0;
  const perUser = {};

  for (const tx of allTx) {
    const email = String(tx.user_email || '').trim().toLowerCase();
    if (!email) continue;
    if (!perUser[email]) {
      perUser[email] = {
        total_deposited: 0,
        total_base_cost: 0,
        total_profit: 0,
        total_billed: 0,
        tx_count: 0,
      };
    }

    perUser[email].tx_count += 1;
    const amt = Number(tx.amount || 0);

    if (tx.type === 'deposit') {
      const depAmt = amt > 0 ? amt : 0;
      totalDeposits += depAmt;
      perUser[email].total_deposited += depAmt;
    } else if (tx.type === 'usage_debit') {
      const billed = Math.abs(amt);
      const base = Number(tx.base_cost || 0);
      const profit = Number(tx.profit_usd || (billed - base));

      totalBilled += billed;
      totalBaseCost += base;
      totalProfit += profit;

      perUser[email].total_billed += billed;
      perUser[email].total_base_cost += base;
      perUser[email].total_profit += profit;
    }
  }

  // Calculate wallet reserves across profiles and local balances
  let totalWalletReserves = 0;
  const userBalancesMap = {};

  if (sb) {
    try {
      const [{ data: profiles }, { data: authData }] = await Promise.all([
        sb.from('profiles').select('id, wallet_balance'),
        sb.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      ]);
      const idToEmail = new Map();
      for (const u of authData?.users || []) {
        if (u.id && u.email) idToEmail.set(u.id, u.email.toLowerCase());
      }
      for (const p of profiles || []) {
        const bal = Number(p.wallet_balance || 0);
        const e = idToEmail.get(p.id);
        if (e) {
          userBalancesMap[e] = bal;
          if (!perUser[e]) {
            perUser[e] = { total_deposited: 0, total_base_cost: 0, total_profit: 0, total_billed: 0, tx_count: 0 };
          }
          perUser[e].wallet_balance = bal;
        }
      }
    } catch (err) {
      console.warn('[walletService] getPlatformFinancialMetrics profiles error:', err.message);
    }
  }

  // Overlay local balances
  for (const [e, bal] of Object.entries(local.balances || {})) {
    const numBal = Number(bal || 0);
    const cleanE = String(e || '').toLowerCase();
    userBalancesMap[cleanE] = Math.max(userBalancesMap[cleanE] || 0, numBal);
    if (!perUser[cleanE]) {
      perUser[cleanE] = { total_deposited: 0, total_base_cost: 0, total_profit: 0, total_billed: 0, tx_count: 0 };
    }
    perUser[cleanE].wallet_balance = userBalancesMap[cleanE];
  }

  totalWalletReserves = Object.values(userBalancesMap).reduce((acc, b) => acc + (b > 0 ? b : 0), 0);

  return {
    totalDeposits: Number(totalDeposits.toFixed(2)),
    totalBaseCost: Number(totalBaseCost.toFixed(4)),
    totalProfit: Number(totalProfit.toFixed(4)),
    totalBilled: Number(totalBilled.toFixed(4)),
    totalWalletReserves: Number(totalWalletReserves.toFixed(2)),
    perUser,
  };
}


/**
 * Get all transactions across platform for Admin Transactions view.
 */
export async function getAllPlatformTransactions(limit = 200) {
  const local = loadLocalWalletData();
  let allTx = local.transactions || [];

  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (!error && data && data.length > 0) {
        // Merge Supabase transactions with local ones without duplication
        const seen = new Set(data.map(d => d.stripe_session_id || d.id));
        const extraLocal = allTx.filter(t => !seen.has(t.stripe_session_id || t.id));
        allTx = [...data, ...extraLocal];
      }
    } catch (err) {
      console.warn('[walletService] getAllPlatformTransactions sb warning:', err.message);
    }
  }

  return allTx.slice(0, limit);
}
