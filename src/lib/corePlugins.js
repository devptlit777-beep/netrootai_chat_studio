import { plugin } from 'postcss';
import { supabase } from './supabase';

const CORE_PLUGINS = [
  { plugin_id: 'web-search', enabled: true, config: {} },
  { plugin_id: 'calculator', enabled: true, config: {} },
  { plugin_id: 'pdf-search', enabled: true, config: {} },
  //{ plugin_id: 'image-describe', enabled: true, config: {} }
];

export async function ensureCorePlugins(userId) {
  if (!userId) return;

  for (const plugin of CORE_PLUGINS) {
    const payload = { user_id: userId, ...plugin };
    const { data, error } = await supabase
      .from('user_plugins')
      .select('plugin_id')
      .eq('user_id', userId)
      .eq('plugin_id', plugin.plugin_id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      await supabase
        .from('user_plugins')
        .update(payload)
        .eq('user_id', userId)
        .eq('plugin_id', plugin.plugin_id);
    } else {
      await supabase.from('user_plugins').insert(payload);
    }
  }
}
