import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ALERTS_FILE = join(__dirname, 'systemAlerts.json');

// Memory store backed by systemAlerts.json
let alerts = [];

function loadAlerts() {
  try {
    if (existsSync(ALERTS_FILE)) {
      alerts = JSON.parse(readFileSync(ALERTS_FILE, 'utf-8'));
    } else {
      alerts = [];
      saveAlerts();
    }
  } catch (err) {
    console.error('[alertsService] failed to load alerts:', err);
    alerts = [];
  }
}

function saveAlerts() {
  try {
    writeFileSync(ALERTS_FILE, JSON.stringify(alerts.slice(0, 500), null, 2), 'utf-8');
  } catch (err) {
    console.error('[alertsService] failed to save alerts:', err);
  }
}

loadAlerts();

// SSE listeners for zero-delay instant push notifications to active Admin browser sessions
const sseClients = new Set();

export function registerSSEClient(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.write('\n');

  sseClients.add(res);

  // Send initial ping
  res.write(`event: connected\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);

  res.on('close', () => {
    sseClients.delete(res);
  });
}

export function broadcastAlert(alert) {
  const payload = `data: ${JSON.stringify(alert)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

/**
 * Record a new system alert (model error, 429 rate limit, 402 low credits, etc.)
 * Saves to memory + disk and pushes instantly via SSE to active Admin screens.
 */
export async function recordSystemAlert(supabase, {
  type = 'OPENROUTER_ERROR',
  severity = 'HIGH',
  statusCode = null,
  model = null,
  userEmail = null,
  message = '',
  metadata = {},
}) {
  const alert = {
    id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    severity,
    status_code: statusCode,
    model,
    user_email: userEmail,
    message,
    metadata,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  // 1. Add to local store (most recent first)
  alerts.unshift(alert);
  if (alerts.length > 500) alerts = alerts.slice(0, 500);
  saveAlerts();

  // 2. Try inserting into Supabase if table exists (gracefully skips if table not yet run in SQL)
  if (supabase) {
    try {
      await supabase.from('system_alerts').insert([alert]).catch(() => {});
    } catch {
      // Supabase table optional fallback
    }
  }

  // 3. Broadcast real-time SSE event to all connected admin tabs immediately
  broadcastAlert(alert);

  console.warn(`[systemAlert] ${severity} [${type} - ${statusCode || 'ERR'}] model: ${model || 'N/A'} | msg: ${message.slice(0, 90)}`);
  return alert;
}

export function getSystemAlerts({ limit = 50, unreadOnly = false } = {}) {
  let filtered = alerts;
  if (unreadOnly) {
    filtered = filtered.filter(a => !a.is_read);
  }
  return filtered.slice(0, limit);
}

export function markAlertAsRead(alertId) {
  if (alertId === 'all') {
    alerts.forEach(a => { a.is_read = true; });
  } else {
    const found = alerts.find(a => a.id === alertId);
    if (found) found.is_read = true;
  }
  saveAlerts();
  return { success: true };
}

export function getAlertsSummary() {
  const unreadCount = alerts.filter(a => !a.is_read).length;
  const recentCritical = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').slice(0, 5);
  return {
    total: alerts.length,
    unreadCount,
    recentCritical,
  };
}
