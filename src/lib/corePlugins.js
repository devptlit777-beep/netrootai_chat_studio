import { supabase } from './supabase';

const CORE_PLUGINS = [
  { plugin_id: 'web-search', enabled: true, config: {} },
  { plugin_id: 'calculator', enabled: true, config: {} },
  { plugin_id: 'pdf-search', enabled: true, config: {} },
  { plugin_id: 'json-transformer', enabled: true, config: {} },
  { plugin_id: 'code-runner', enabled: true, config: {} },
  { plugin_id: 'arxiv', enabled: true, config: {} },

];

const _running = new Set();
const _done = new Set();

export async function ensureCorePlugins(userId) {
  if (!userId || _running.has(userId) || _done.has(userId)) return;
  _running.add(userId);
  try {
    const rows = CORE_PLUGINS.map(p => ({ user_id: userId, ...p }));
    await supabase
      .from('user_plugins')
      .upsert(rows, { onConflict: 'user_id,plugin_id', ignoreDuplicates: true });
    _done.add(userId);
  } finally {
    _running.delete(userId);
  }
}
