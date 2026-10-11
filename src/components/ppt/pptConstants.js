// NetRoot AI Slide Studio - Constants & Domain Utilities

export const PPT_API_BASE = import.meta.env.VITE_PPT_API_URL || 'http://127.0.0.1:8001';

export const THEME_OPTIONS = [
  { id: 'auto', label: 'Auto (AI Dynamic)', icon: '✨', seed: '#0EA5E9' },
  { id: 'midnight', label: 'NetRoot Dark', icon: '🌙', seed: '#0EA5E9' },
  { id: 'blush', label: 'Baby Pink / Blush', icon: '🌸', seed: '#F472B6' },
  { id: 'amber', label: 'Solar Gold / Amber', icon: '☀️', seed: '#F59E0B' },
  { id: 'crimson', label: 'Royal Crimson', icon: '🔴', seed: '#EF4444' },
  { id: 'clean', label: 'Minimalist Clean', icon: '☀️', seed: '#2563EB' },
  { id: 'aurora', label: 'Cyber Aurora', icon: '🌌', seed: '#A855F7' },
  { id: 'emerald', label: 'Warm Luxury', icon: '🍷', seed: '#10B981' },
];

export const THEME_SEEDS = {
  midnight: '#0EA5E9',
  blush: '#F472B6',
  rose: '#F472B6',
  amber: '#F59E0B',
  crimson: '#EF4444',
  clean: '#2563EB',
  aurora: '#A855F7',
  emerald: '#10B981',
};

export const LAYOUT_LABELS = {
  hero: 'Hero Cover',
  stats: 'KPI Bento',
  timeline: 'Roadmap Flow',
  chart_slide: 'Interactive Chart',
  '2col': '2-Column Split',
  '3col': '3-Column Pillars',
  title_image_right: 'Split Visual',
  flowchart: 'System Architecture',
  statement: 'Vision Thesis',
  title_content: 'Strategic Bento',
};

export function stripMarkdown(val) {
  if (typeof val === 'string') {
    return val.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/\*\*/g, '').replace(/\*/g, '').trim();
  }
  if (Array.isArray(val)) {
    return val.map(stripMarkdown);
  }
  if (val && typeof val === 'object') {
    const res = {};
    for (const [k, v] of Object.entries(val)) {
      res[k] = stripMarkdown(v);
    }
    return res;
  }
  return val;
}

export function getSemanticIcon(str) {
  const lower = String(str || '').toLowerCase();
  if (lower.includes('speed') || lower.includes('fast') || lower.includes('latency') || lower.includes('lpu')) return '⚡';
  if (lower.includes('ai') || lower.includes('model') || lower.includes('llm') || lower.includes('neural')) return '🧠';
  if (lower.includes('security') || lower.includes('guard') || lower.includes('safe') || lower.includes('protect')) return '🛡️';
  if (lower.includes('growth') || lower.includes('scale') || lower.includes('market') || lower.includes('roi')) return '📈';
  if (lower.includes('cloud') || lower.includes('server') || lower.includes('infra') || lower.includes('network')) return '☁️';
  if (lower.includes('data') || lower.includes('stream') || lower.includes('analytic') || lower.includes('vector')) return '📊';
  if (lower.includes('team') || lower.includes('collaborat') || lower.includes('people') || lower.includes('user')) return '👥';
  if (lower.includes('automation') || lower.includes('autonomous') || lower.includes('workflow') || lower.includes('pipeline')) return '⚙️';
  if (lower.includes('global') || lower.includes('world') || lower.includes('region')) return '🌐';
  if (lower.includes('cost') || lower.includes('efficiency') || lower.includes('saving') || lower.includes('capital')) return '💎';
  return '•';
}

export function createBlankSlide(idx = 1) {
  return {
    l: 'title_content',
    t: `Key Strategic Insight #${idx}`,
    c: [
      'Operational Insight: Structured architectural framework delivering high SLA standards.',
      'Strategic Pillar: Autonomous execution layer scaling enterprise productivity.',
    ],
    theme: 'midnight',
    theme_mode: 'light_canvas',
    seed_color: '#0EA5E9',
  };
}
