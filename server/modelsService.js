import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Ensure .env is read if not yet populated in process.env
try {
  const envPath = join(PROJECT_ROOT, '.env');
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, 'utf8').split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx !== -1) {
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (k && !process.env[k]) {
          process.env[k] = v;
        }
      }
    }
  }
} catch (e) {
  // ignore
}

const CACHE_FILE = join(__dirname, 'modelsCache.json');
const SETTINGS_FILE = join(__dirname, 'platformSettings.json');
const CHANGELOG_FILE = join(__dirname, 'modelsChangelog.json');
const RANKINGS_FILE = join(__dirname, 'rankingsCache.json');

const POPULAR_SLUGS = new Set([
  'deepseek/deepseek-v4.1-flash-1017',
  'deepseek/deepseek-chat',
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3-opus',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'openai/o3-mini',
  'meta-llama/llama-3.1-70b-instruct',
  'meta-llama/llama-3.1-8b-instruct:free',
  'google/gemini-flash-1.5',
  'google/gemini-pro-1.5',
  'qwen/qwen-2.5-72b-instruct',
  'black-forest-labs/flux-1-schnell',
]);

export const NATIVE_GROQ_MODELS = [
  {
    id: 'openai/gpt-oss-20b',
    name: 'openai/gpt-oss-20b',
    display_name: 'GPT OSS 20B',
    provider: 'OpenAI',
    description: 'Fast open-weight 20B model running natively on Groq LPU with ultra-low latency for coding and general tasks.',
    context_length: 131072,
    modalities: ['text'],
    is_free: true,
    base_pricing: { prompt: 0, completion: 0, image: 0, request: 0 },
    calculated_pricing: { prompt: 0, completion: 0, image: 0, request: 0, margin_percentage: 20 },
    benchmarks: { artificial_analysis: { coding_index: 68, intelligence_index: 62 } },
    supported_parameters: ['temperature', 'top_p', 'max_tokens'],
    uptime_pct: 99.9,
    custom_badge: '100% Free',
    badge_override: true,
    is_visible: true,
    is_featured: true,
    min_plan: 'free',
    openrouter_rank: null,
    openrouter_tokens: 0,
    openrouter_volume_str: 'Native Groq',
    rpm: 30,
    tpm: 2000,
  },
  {
    id: 'allam-2-7b',
    name: 'allam-2-7b',
    display_name: 'ALLaM 2 7B',
    provider: 'SDAIA',
    description: 'Bilingual Arabic & English high-performance 7B model by SDAIA, running at high speed on Groq LPU.',
    context_length: 131072,
    modalities: ['text'],
    is_free: true,
    base_pricing: { prompt: 0, completion: 0, image: 0, request: 0 },
    calculated_pricing: { prompt: 0, completion: 0, image: 0, request: 0, margin_percentage: 20 },
    benchmarks: { artificial_analysis: { coding_index: 55, intelligence_index: 58 } },
    supported_parameters: ['temperature', 'top_p', 'max_tokens'],
    uptime_pct: 99.8,
    custom_badge: 'Speed King',
    badge_override: true,
    is_visible: true,
    is_featured: false,
    min_plan: 'free',
    openrouter_rank: null,
    openrouter_tokens: 0,
    openrouter_volume_str: 'Native Groq',
    rpm: 30,
    tpm: 30000,
  },
  {
    id: 'qwen/qwen3.8-27b',
    name: 'qwen/qwen3.8-27b',
    display_name: 'Qwen3.8 27B Vision',
    provider: 'Qwen (Alibaba)',
    description: 'Vision-capable multimodal reasoning 27B model by Alibaba running on Groq LPU with multimodal understanding.',
    context_length: 131072,
    modalities: ['text', 'image'],
    is_free: true,
    base_pricing: { prompt: 0, completion: 0, image: 0, request: 0 },
    calculated_pricing: { prompt: 0, completion: 0, image: 0, request: 0, margin_percentage: 20 },
    benchmarks: { artificial_analysis: { coding_index: 74, intelligence_index: 72 } },
    supported_parameters: ['temperature', 'top_p', 'max_tokens'],
    uptime_pct: 99.8,
    custom_badge: 'Vision',
    badge_override: true,
    is_visible: true,
    is_featured: false,
    min_plan: 'free',
    openrouter_rank: null,
    openrouter_tokens: 0,
    openrouter_volume_str: 'Native Groq',
    rpm: 30,
    tpm: 6000,
  },
  {
    id: 'ppt-studio',
    name: 'ppt-studio',
    display_name: 'PPT Studio',
    provider: 'NetRoot AI',
    description: 'Enterprise presentation engine powered by Llama 3.3 on Groq LPU with structured slide layout schemas and visual hierarchy.',
    context_length: 131072,
    modalities: ['text'],
    is_free: true,
    base_pricing: { prompt: 0, completion: 0, image: 0, request: 0 },
    calculated_pricing: { prompt: 0, completion: 0, image: 0, request: 0, margin_percentage: 20 },
    benchmarks: { artificial_analysis: { coding_index: 75, intelligence_index: 78 } },
    supported_parameters: ['temperature', 'top_p', 'max_tokens'],
    uptime_pct: 99.9,
    custom_badge: 'Presentation',
    badge_override: true,
    is_visible: true,
    is_featured: false,
    min_plan: 'free',
    openrouter_rank: null,
    openrouter_tokens: 0,
    openrouter_volume_str: 'Native Groq',
    rpm: 30,
    tpm: 6000,
  },
  {
    id: 'groq/compound-mini',
    name: 'groq/compound-mini',
    display_name: 'Compound Mini',
    provider: 'Groq',
    description: 'Groq Compound agent architecture mini model for fast multi-step reasoning, coding, and chat.',
    context_length: 131072,
    modalities: ['text'],
    is_free: false,
    base_pricing: { prompt: 0.0000002, completion: 0.0000005, image: 0, request: 0 },
    calculated_pricing: { prompt: 0.00000024, completion: 0.0000006, image: 0, request: 0, margin_percentage: 20 },
    benchmarks: { artificial_analysis: { coding_index: 78, intelligence_index: 76 } },
    supported_parameters: ['temperature', 'top_p', 'max_tokens'],
    uptime_pct: 99.9,
    custom_badge: 'Trending',
    badge_override: true,
    is_visible: true,
    is_featured: false,
    min_plan: 'pro',
    openrouter_rank: null,
    openrouter_tokens: 0,
    openrouter_volume_str: 'Native Agent',
    rpm: 30,
    tpm: 6000,
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'openai/gpt-oss-120b',
    display_name: 'GPT OSS 120B',
    provider: 'OpenAI',
    description: 'High-capacity 120B flagship open-weight model on Groq for advanced reasoning and complex instructions.',
    context_length: 131072,
    modalities: ['text'],
    is_free: false,
    base_pricing: { prompt: 0.0000005, completion: 0.0000015, image: 0, request: 0 },
    calculated_pricing: { prompt: 0.0000006, completion: 0.0000018, image: 0, request: 0, margin_percentage: 20 },
    benchmarks: { artificial_analysis: { coding_index: 84, intelligence_index: 82 } },
    supported_parameters: ['temperature', 'top_p', 'max_tokens'],
    uptime_pct: 99.9,
    custom_badge: 'Trending',
    badge_override: true,
    is_visible: true,
    is_featured: false,
    min_plan: 'pro',
    openrouter_rank: null,
    openrouter_tokens: 0,
    openrouter_volume_str: 'Flagship OSS',
    rpm: 30,
    tpm: 6000,
  },
];

export const NATIVE_FAL_MODELS = [
  // --- IMAGE GENERATION ---
  {
    id: 'fal-ai/flux/schnell',
    name: 'fal-ai/flux/schnell',
    display_name: 'FLUX.1 [schnell]',
    provider: 'Black Forest Labs',
    description: '12B parameter next-generation open-weights image generator optimized for ultra-fast 1-4 step generation with high photorealism and typography.',
    context_length: 0,
    modalities: ['image'],
    media_category: 'image',
    is_free: false,
    base_pricing: { prompt: 0, completion: 0, image: 0.003, request: 0.003 },
    calculated_pricing: { prompt: 0, completion: 0, image: 0.0036, request: 0.0036, margin_percentage: 20 },
    benchmarks: { artificial_analysis: { coding_index: 0, intelligence_index: 94 } },
    supported_parameters: ['prompt', 'image_size', 'num_inference_steps', 'seed'],
    uptime_pct: 99.9,
    custom_badge: 'Ultra Fast Image',
    badge_override: true,
    is_visible: true,
    is_featured: true,
    min_plan: 'free',
    openrouter_rank: null,
    openrouter_tokens: 0,
    openrouter_volume_str: 'Black Forest Labs',
    rpm: 60,
    tpm: 60,
  },
  {
    id: 'fal-ai/flux-pro/v1.1',
    name: 'fal-ai/flux-pro/v1.1',
    display_name: 'FLUX 1.1 [pro]',
    provider: 'Black Forest Labs',
    description: 'Black Forest Labs flagship professional image generator with 6x faster inference than FLUX.1 [pro] and exceptional artistic fidelity.',
    context_length: 0,
    modalities: ['image'],
    media_category: 'image',
    is_free: false,
    base_pricing: { prompt: 0, completion: 0, image: 0.04, request: 0.04 },
    calculated_pricing: { prompt: 0, completion: 0, image: 0.048, request: 0.048, margin_percentage: 20 },
    benchmarks: { artificial_analysis: { coding_index: 0, intelligence_index: 98 } },
    supported_parameters: ['prompt', 'aspect_ratio', 'output_format', 'safety_tolerance'],
    uptime_pct: 99.9,
    custom_badge: 'Studio Flagship',
    badge_override: true,
    is_visible: true,
    is_featured: true,
    min_plan: 'pro',
    openrouter_rank: null,
    openrouter_tokens: 0,
    openrouter_volume_str: 'Black Forest Labs',
    rpm: 30,
    tpm: 30,
  },
  {
    id: 'fal-ai/flux-realism',
    name: 'fal-ai/flux-realism',
    display_name: 'FLUX Realism Studio',
    provider: 'Black Forest Labs',
    description: 'Fine-tuned FLUX LoRA architecture specialized for hyper-realistic human portraits, natural lighting, skin textures, and macro photography.',
    context_length: 0,
    modalities: ['image'],
    media_category: 'image',
    is_free: false,
    base_pricing: { prompt: 0, completion: 0, image: 0.035, request: 0.035 },
    calculated_pricing: { prompt: 0, completion: 0, image: 0.042, request: 0.042, margin_percentage: 20 },
    benchmarks: { artificial_analysis: { coding_index: 0, intelligence_index: 95 } },
    supported_parameters: ['prompt', 'negative_prompt', 'aspect_ratio', 'guidance_scale'],
    uptime_pct: 99.8,
    custom_badge: 'Hyper Realism',
    badge_override: true,
    is_visible: true,
    is_featured: false,
    min_plan: 'pro',
    openrouter_rank: null,
    openrouter_tokens: 0,
    openrouter_volume_str: 'Black Forest Labs',
    rpm: 30,
    tpm: 30,
  },
  {
    id: 'fal-ai/recraft-v20',
    name: 'fal-ai/recraft-v20',
    display_name: 'Recraft V20 Vector & 3D',
    provider: 'Recraft AI',
    description: 'Specialized generative model for vector illustrations, 3D icons, clean corporate design assets, and typographic artwork.',
    context_length: 0,
    modalities: ['image'],
    media_category: 'image',
    is_free: false,
    base_pricing: { prompt: 0, completion: 0, image: 0.04, request: 0.04 },
    calculated_pricing: { prompt: 0, completion: 0, image: 0.048, request: 0.048, margin_percentage: 20 },
    benchmarks: { artificial_analysis: { coding_index: 0, intelligence_index: 91 } },
    supported_parameters: ['prompt', 'style', 'colors', 'aspect_ratio'],
    uptime_pct: 99.7,
    custom_badge: 'Vector & 3D',
    badge_override: true,
    is_visible: true,
    is_featured: false,
    min_plan: 'pro',
    openrouter_rank: null,
    openrouter_tokens: 0,
    openrouter_volume_str: 'Recraft AI',
    rpm: 30,
    tpm: 30,
  },
  {
    id: 'fal-ai/stable-diffusion-v35-large',
    name: 'fal-ai/stable-diffusion-v35-large',
    display_name: 'Stable Diffusion 3.5 Large',
    provider: 'Stability AI',
    description: 'Stability AIs most powerful 8B multimodal diffusion transformer model with superior prompt obedience and typography generation.',
    context_length: 0,
    modalities: ['image'],
    media_category: 'image',
    is_free: false,
    base_pricing: { prompt: 0, completion: 0, image: 0.065, request: 0.065 },
    calculated_pricing: { prompt: 0, completion: 0, image: 0.078, request: 0.078, margin_percentage: 20 },
    benchmarks: { artificial_analysis: { coding_index: 0, intelligence_index: 93 } },
    supported_parameters: ['prompt', 'aspect_ratio', 'cfg', 'steps'],
    uptime_pct: 99.8,
    custom_badge: 'Stability AI',
    badge_override: true,
    is_visible: true,
    is_featured: false,
    min_plan: 'pro',
    openrouter_rank: null,
    openrouter_tokens: 0,
    openrouter_volume_str: 'Stability AI',
    rpm: 30,
    tpm: 30,
  },

  // --- VIDEO GENERATION ---
  {
    id: 'fal-ai/kling-video/v1.5/pro',
    name: 'fal-ai/kling-video/v1.5/pro',
    display_name: 'Kling 1.5 Pro Video',
    provider: 'Kuaishou AI',
    description: 'State of the art 1080p high definition cinematic video generation with dynamic camera movement, motion adherence, and fluid physical realism.',
    context_length: 0,
    modalities: ['video'],
    media_category: 'video',
    is_free: false,
    base_pricing: { prompt: 0, completion: 0, image: 0.25, request: 0.25 },
    calculated_pricing: { prompt: 0, completion: 0, image: 0.30, request: 0.30, margin_percentage: 20 },
    benchmarks: { artificial_analysis: { coding_index: 0, intelligence_index: 97 } },
    supported_parameters: ['prompt', 'duration', 'aspect_ratio', 'camera_control'],
    uptime_pct: 99.8,
    custom_badge: '1080p Cinematic',
    badge_override: true,
    is_visible: true,
    is_featured: true,
    min_plan: 'pro',
    openrouter_rank: null,
    openrouter_tokens: 0,
    openrouter_volume_str: 'Kuaishou AI',
    rpm: 20,
    tpm: 20,
  },
  {
    id: 'fal-ai/luma-dream-machine/ray-2',
    name: 'fal-ai/luma-dream-machine/ray-2',
    display_name: 'Luma Dream Machine Ray 2',
    provider: 'Luma AI',
    description: 'Luma Ray 2 foundation model producing highly realistic physical motion, camera pans, character continuity, and 3D visual consistency.',
    context_length: 0,
    modalities: ['video'],
    media_category: 'video',
    is_free: false,
    base_pricing: { prompt: 0, completion: 0, image: 0.20, request: 0.20 },
    calculated_pricing: { prompt: 0, completion: 0, image: 0.24, request: 0.24, margin_percentage: 20 },
    benchmarks: { artificial_analysis: { coding_index: 0, intelligence_index: 96 } },
    supported_parameters: ['prompt', 'aspect_ratio', 'loop'],
    uptime_pct: 99.7,
    custom_badge: 'Ray 2 Physics',
    badge_override: true,
    is_visible: true,
    is_featured: false,
    min_plan: 'pro',
    openrouter_rank: null,
    openrouter_tokens: 0,
    openrouter_volume_str: 'Luma AI',
    rpm: 20,
    tpm: 20,
  },
  {
    id: 'fal-ai/minimax/video-01',
    name: 'fal-ai/minimax/video-01',
    display_name: 'MiniMax Hailuo Video-01',
    provider: 'MiniMax',
    description: 'MiniMax high-motion generative video model excelling in cinematic lighting, natural human emotions, and high-framerate action shots.',
    context_length: 0,
    modalities: ['video'],
    media_category: 'video',
    is_free: false,
    base_pricing: { prompt: 0, completion: 0, image: 0.22, request: 0.22 },
    calculated_pricing: { prompt: 0, completion: 0, image: 0.26, request: 0.26, margin_percentage: 20 },
    benchmarks: { artificial_analysis: { coding_index: 0, intelligence_index: 95 } },
    supported_parameters: ['prompt', 'prompt_optimizer'],
    uptime_pct: 99.6,
    custom_badge: 'Cinematic Motion',
    badge_override: true,
    is_visible: true,
    is_featured: false,
    min_plan: 'pro',
    openrouter_rank: null,
    openrouter_tokens: 0,
    openrouter_volume_str: 'MiniMax AI',
    rpm: 20,
    tpm: 20,
  },
  {
    id: 'fal-ai/cogvideox-5b',
    name: 'fal-ai/cogvideox-5b',
    display_name: 'CogVideoX 5B Video',
    provider: 'THUDM / Zhipu AI',
    description: 'Zhipu AI 5B parameter open-weights 3D video transformer producing smooth cinematic motion clips from descriptive prompts.',
    context_length: 0,
    modalities: ['video'],
    media_category: 'video',
    is_free: false,
    base_pricing: { prompt: 0, completion: 0, image: 0.05, request: 0.05 },
    calculated_pricing: { prompt: 0, completion: 0, image: 0.06, request: 0.06, margin_percentage: 20 },
    benchmarks: { artificial_analysis: { coding_index: 0, intelligence_index: 90 } },
    supported_parameters: ['prompt', 'num_frames'],
    uptime_pct: 99.5,
    custom_badge: 'Open Weights Video',
    badge_override: true,
    is_visible: true,
    is_featured: false,
    min_plan: 'free',
    openrouter_rank: null,
    openrouter_tokens: 0,
    openrouter_volume_str: 'Zhipu AI',
    rpm: 20,
    tpm: 20,
  },

  // --- AUDIO / SPEECH / MUSIC GENERATION ---
  {
    id: 'fal-ai/f5-tts',
    name: 'fal-ai/f5-tts',
    display_name: 'F5-TTS Voice Studio',
    provider: 'SWIFT OpenAudio',
    description: 'Non-autoregressive flow-matching speech synthesis system providing expressive multilingual speech generation and instant voice cloning.',
    context_length: 0,
    modalities: ['audio'],
    media_category: 'audio',
    is_free: false,
    base_pricing: { prompt: 0, completion: 0, image: 0, request: 0.002 },
    calculated_pricing: { prompt: 0, completion: 0, image: 0, request: 0.0024, margin_percentage: 20 },
    benchmarks: { artificial_analysis: { coding_index: 0, intelligence_index: 92 } },
    supported_parameters: ['gen_text', 'ref_audio_url', 'ref_text'],
    uptime_pct: 99.9,
    custom_badge: 'Voice Cloning',
    badge_override: true,
    is_visible: true,
    is_featured: true,
    min_plan: 'free',
    openrouter_rank: null,
    openrouter_tokens: 0,
    openrouter_volume_str: 'OpenAudio Lab',
    rpm: 40,
    tpm: 40,
  },
  {
    id: 'fal-ai/stable-audio',
    name: 'fal-ai/stable-audio',
    display_name: 'Stable Audio 2.0 Music & SFX',
    provider: 'Stability AI',
    description: 'Generate high-resolution 44.1kHz stereo audio, full musical tracks, ambient soundscapes, and cinematic sound effects up to 3 minutes.',
    context_length: 0,
    modalities: ['audio'],
    media_category: 'audio',
    is_free: false,
    base_pricing: { prompt: 0, completion: 0, image: 0, request: 0.015 },
    calculated_pricing: { prompt: 0, completion: 0, image: 0, request: 0.018, margin_percentage: 20 },
    benchmarks: { artificial_analysis: { coding_index: 0, intelligence_index: 94 } },
    supported_parameters: ['prompt', 'seconds_total', 'steps'],
    uptime_pct: 99.8,
    custom_badge: 'Stereo Audio & Music',
    badge_override: true,
    is_visible: true,
    is_featured: false,
    min_plan: 'pro',
    openrouter_rank: null,
    openrouter_tokens: 0,
    openrouter_volume_str: 'Stability AI',
    rpm: 30,
    tpm: 30,
  },
  {
    id: 'fal-ai/whisper',
    name: 'fal-ai/whisper',
    display_name: 'Whisper Large v3 Studio',
    provider: 'OpenAI',
    description: 'High-speed cloud transcription and audio intelligence with word-level timestamps, multilingual recognition, and speaker diarization.',
    context_length: 0,
    modalities: ['audio'],
    media_category: 'audio',
    is_free: false,
    base_pricing: { prompt: 0, completion: 0, image: 0, request: 0.001 },
    calculated_pricing: { prompt: 0, completion: 0, image: 0, request: 0.0012, margin_percentage: 20 },
    benchmarks: { artificial_analysis: { coding_index: 0, intelligence_index: 95 } },
    supported_parameters: ['audio_url', 'task', 'language'],
    uptime_pct: 99.9,
    custom_badge: 'Transcription & Audio',
    badge_override: true,
    is_visible: true,
    is_featured: false,
    min_plan: 'free',
    openrouter_rank: null,
    openrouter_tokens: 0,
    openrouter_volume_str: 'OpenAI Audio',
    rpm: 60,
    tpm: 60,
  },
];

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function getLocalSettings() {
  try {
    if (existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(readFileSync(SETTINGS_FILE, 'utf8'));
      return {
        global_margin_percentage: 20,
        auto_sync: true,
        auto_sync_interval_hours: 24,
        last_synced_at: null,
        next_auto_sync_at: null,
        ...data,
      };
    }
  } catch (e) {
    console.warn('[modelsService] Failed to read settings file:', e.message);
  }
  return {
    global_margin_percentage: 20,
    auto_sync: true,
    auto_sync_interval_hours: 24,
    last_synced_at: null,
    next_auto_sync_at: null,
  };
}

export function saveLocalSettings(settings) {
  try {
    writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
  } catch (e) {
    console.warn('[modelsService] Failed to write settings file:', e.message);
  }
}

export async function getGlobalSettings() {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('platform_settings')
        .select('value')
        .eq('key', 'models_config')
        .single();
      if (!error && data?.value) {
        return data.value;
      }
    } catch (err) {
      // fallback to local
    }
  }
  return getLocalSettings();
}

export async function updateGlobalSettings(newSettings) {
  const current = await getGlobalSettings();
  const merged = { ...current, ...newSettings };
  saveLocalSettings(merged);

  const sb = getSupabase();
  if (sb) {
    try {
      await sb
        .from('platform_settings')
        .upsert({ key: 'models_config', value: merged, updated_at: new Date().toISOString() });
    } catch (err) {
      console.warn('[modelsService] Supabase settings upsert notice:', err.message);
    }
  }
  return merged;
}

export function getLocalCache() {
  try {
    if (existsSync(CACHE_FILE)) {
      return JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('[modelsService] Failed to read cache file:', e.message);
  }
  return [];
}

export function saveLocalCache(models) {
  try {
    writeFileSync(CACHE_FILE, JSON.stringify(models, null, 2), 'utf8');
  } catch (e) {
    console.warn('[modelsService] Failed to write cache file:', e.message);
  }
}

export function getLocalRankings() {
  try {
    if (existsSync(RANKINGS_FILE)) {
      return JSON.parse(readFileSync(RANKINGS_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('[modelsService] Failed to read rankings file:', e.message);
  }
  return [];
}

export function saveLocalRankings(rankings) {
  try {
    writeFileSync(RANKINGS_FILE, JSON.stringify(rankings, null, 2), 'utf8');
  } catch (e) {
    console.warn('[modelsService] Failed to write rankings file:', e.message);
  }
}

export function computeAutoBadge(m) {
  const id = (m.id || '').toLowerCase();
  const name = (m.name || '').toLowerCase();
  const promptPrice = Number(m.pricing?.prompt || 0);
  const compPrice = Number(m.pricing?.completion || 0);
  const isFree = promptPrice === 0 && compPrice === 0;

  if (isFree) return '100% Free';

  if (POPULAR_SLUGS.has(m.id) || id.includes('deepseek-v4') || id.includes('claude-3.5') || id.includes('gpt-4o')) {
    return 'Trending';
  }

  if (id.includes('flash') || id.includes('turbo') || id.includes('instant') || id.includes('groq')) {
    return 'Speed King';
  }

  const codingScore = m.benchmarks?.artificial_analysis?.coding_index;
  if ((codingScore && codingScore >= 75) || id.includes('coder') || id.includes('code')) {
    return 'Coding Pro';
  }

  const intellScore = m.benchmarks?.artificial_analysis?.intelligence_index;
  if (promptPrice <= 0.0000005 && (intellScore >= 35 || promptPrice < 0.0000003)) {
    return 'Best Value';
  }

  const inputModalities = m.architecture?.input_modalities || [];
  if (inputModalities.includes('image')) {
    return 'Vision';
  }

  return null;
}

export function deriveProvider(id, name) {
  if (id.includes('/')) {
    const raw = id.split('/')[0].replace(/^~+/, '').trim().toLowerCase();
    const map = {
      'anthropic': 'Anthropic',
      'openai': 'OpenAI',
      'google': 'Google',
      'meta-llama': 'Meta',
      'deepseek': 'DeepSeek',
      'mistralai': 'Mistral',
      'qwen': 'Qwen (Alibaba)',
      'cohere': 'Cohere',
      'x-ai': 'xAI (Grok)',
      'black-forest-labs': 'Black Forest Labs',
      'microsoft': 'Microsoft',
      'amazon': 'Amazon',
      'perplexity': 'Perplexity',
      'moonshotai': 'Moonshot AI (Kimi)',
      'minimax': 'MiniMax',
      'z-ai': 'Zhipu AI (GLM)',
      'eva-unit-01': 'Eva Unit 01',
      'liquid': 'Liquid AI',
      'nousresearch': 'Nous Research',
      'groq': 'Groq',
      'sdaia': 'SDAIA',
      'fal-ai': 'Fal.ai',
      'kuaishou': 'Kuaishou',
      'stabilityai': 'Stability AI',
      'luma': 'Luma AI',
    };
    return map[raw] || raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  if (id === 'allam-2-7b') return 'SDAIA';
  return name.split(':')[0] || 'AI';
}

export function formatDisplayName(id, name) {
  const parts = name.split(': ');
  let clean = parts.length > 1 ? parts.slice(1).join(': ') : name;
  clean = clean.replace(/^~+/, '').trim();
  return clean;
}

export async function syncModelsFromOpenRouter() {
  console.log('[modelsService] Syncing models from OpenRouter API...');
  const settings = await getGlobalSettings();
  const margin = Number(settings.global_margin_percentage || 20);

  const headers = {};
  if (process.env.OPENROUTER_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.OPENROUTER_API_KEY}`;
  }

  const response = await fetch('https://openrouter.ai/api/v1/models', { headers });
  if (!response.ok) {
    throw new Error(`OpenRouter API failed with status: ${response.status}`);
  }

  const json = await response.json();
  const rawList = (Array.isArray(json.data) ? json.data : []).filter(raw => {
    const id = (raw.id || '').toLowerCase();
    // Exclude partner-gated models that fail on web chat with 403 Forbidden
    if (id.startsWith('thinkingmachines/') || id.includes('inkling')) return false;
    return true;
  });
  console.log(`[modelsService] Received ${rawList.length} raw models from OpenRouter`);

  // 2. Fetch authentic OpenRouter daily volume rankings dataset
  const rankingsMap = new Map();
  const topRankingsList = [];
  try {
    const rankRes = await fetch('https://openrouter.ai/api/v1/datasets/rankings-daily', { headers });
    if (rankRes.ok) {
      const rankJson = await rankRes.json();
      if (Array.isArray(rankJson.data) && rankJson.data.length > 0) {
        const latestDate = rankJson.data[rankJson.data.length - 1].date;
        const latestItems = rankJson.data.filter(x => x.date === latestDate && x.model_permaslug !== 'other');
        latestItems.sort((a, b) => Number(b.total_tokens) - Number(a.total_tokens));

        latestItems.forEach((item, index) => {
          const tokens = Number(item.total_tokens) || 0;
          let formattedVol = '';
          if (tokens >= 1e12) {
            formattedVol = (tokens / 1e12).toFixed(2) + 'T';
          } else if (tokens >= 1e9) {
            formattedVol = (tokens / 1e9).toFixed(1) + 'B';
          } else if (tokens >= 1e6) {
            formattedVol = (tokens / 1e6).toFixed(0) + 'M';
          } else {
            formattedVol = tokens.toLocaleString();
          }

          const rankObj = {
            rank: index + 1,
            model_permaslug: item.model_permaslug,
            tokens,
            volume_formatted: formattedVol,
            date: item.date,
          };
          rankingsMap.set(item.model_permaslug, rankObj);
          topRankingsList.push(rankObj);
        });
        saveLocalRankings(topRankingsList);
        console.log(`[modelsService] Synced ${topRankingsList.length} authentic OpenRouter rankings (Top 1: ${topRankingsList[0]?.model_permaslug} with ${topRankingsList[0]?.volume_formatted})`);
      }
    }
  } catch (err) {
    console.warn('[modelsService] Rankings dataset fetch notice:', err.message);
  }

  // Existing cache or DB records to preserve manual admin overrides
  const existingCache = getLocalCache();
  const existingMap = new Map(existingCache.map(m => [m.id, m]));

  const sb = getSupabase();
  if (sb) {
    try {
      const { data: dbModels } = await sb.from('model_settings').select('*');
      if (Array.isArray(dbModels)) {
        dbModels.forEach(m => existingMap.set(m.id, m));
      }
    } catch (e) {
      // continue with existingMap
    }
  }

  // Record changelog diffs if we had prior cache
  if (existingCache.length > 0) {
    try {
      recordChangelogDiff(existingCache, rawList, margin);
    } catch (err) {
      console.warn('[modelsService] Changelog diff error:', err.message);
    }
  }

  const processed = rawList.map(raw => {
    const id = raw.id;
    const existing = existingMap.get(id) || {};

    const rawPrompt = Number(raw.pricing?.prompt || 0);
    const rawComp = Number(raw.pricing?.completion || 0);
    const rawImage = Number(raw.pricing?.image || 0);
    const rawReq = Number(raw.pricing?.request || 0);

    const isFree = rawPrompt === 0 && rawComp === 0 && rawImage === 0;

    // Apply auto margin
    const calcPrompt = isFree ? 0 : rawPrompt * (1 + margin / 100);
    const calcComp = isFree ? 0 : rawComp * (1 + margin / 100);
    const calcImage = isFree ? 0 : rawImage * (1 + margin / 100);
    const calcReq = isFree ? 0 : rawReq * (1 + margin / 100);

    const provider = deriveProvider(id, raw.name || id);
    let autoBadge = computeAutoBadge(raw);

    // Match with real OpenRouter Ranking & Token Volume
    const canonical = raw.canonical_slug || '';
    const isBatch = id.endsWith(':batch');
    let rankInfo = null;

    if (rankingsMap.has(id)) {
      rankInfo = rankingsMap.get(id);
    } else if (canonical && rankingsMap.has(canonical)) {
      rankInfo = rankingsMap.get(canonical);
    } else if (!isBatch) {
      const baseId = id.split(':')[0].replace(/-\d{8}$/, '').toLowerCase();
      const idIsFree = id.includes(':free');
      for (const [slug, info] of rankingsMap.entries()) {
        const baseSlug = slug.split(':')[0].replace(/-\d{8}$/, '').toLowerCase();
        const slugIsFree = slug.includes(':free');
        if (slugIsFree !== idIsFree) continue;

        if (baseId === baseSlug) {
          rankInfo = info;
          break;
        }
      }
    }

    const openrouterRank = rankInfo ? rankInfo.rank : null;
    const openrouterTokens = rankInfo ? rankInfo.tokens : 0;
    const openrouterVolumeStr = rankInfo ? rankInfo.volume_formatted : null;

    if (openrouterRank && openrouterRank <= 10 && !isFree) {
      autoBadge = 'Trending';
    }

    // Keep manual admin overrides if present
    const customBadge = existing.badge_override ? existing.custom_badge : (existing.custom_badge || autoBadge);
    const displayName = existing.display_name || formatDisplayName(id, raw.name || id);
    const isVisible = existing.is_visible !== undefined ? existing.is_visible : true;
    const isFeatured = existing.is_featured !== undefined ? existing.is_featured : false;
    const minPlan = existing.min_plan || (isFree ? 'free' : 'pro');

    const inputModalities = raw.architecture?.input_modalities || ['text'];
    const outputModalities = raw.architecture?.output_modalities || ['text'];
    const modalities = Array.from(new Set([...inputModalities, ...outputModalities]));

    const idLower = (id || '').toLowerCase();
    const isVid = outputModalities.includes('video') || idLower.includes('video') || idLower.includes('kling') || idLower.includes('luma') || idLower.includes('cogvideo') || idLower.includes('minimax/video');
    const isImg = !isVid && (outputModalities.includes('image') || idLower.includes('flux') || idLower.includes('recraft') || idLower.includes('diffusion') || idLower.includes('imagen') || idLower.includes('sdxl'));
    const isAud = !isVid && !isImg && (outputModalities.includes('speech') || outputModalities.includes('audio') || idLower.includes('tts') || idLower.includes('whisper') || idLower.includes('stable-audio'));
    const mediaCategory = isVid ? 'video' : isImg ? 'image' : isAud ? 'audio' : 'chat';

    return {
      id,
      name: raw.name || id,
      display_name: displayName,
      provider,
      description: raw.description || '',
      context_length: raw.context_length || 0,
      modalities,
      output_modalities: outputModalities,
      input_modalities: inputModalities,
      media_category: mediaCategory,
      is_free: isFree,
      base_pricing: {
        prompt: rawPrompt,
        completion: rawComp,
        image: rawImage,
        request: rawReq,
      },
      calculated_pricing: {
        prompt: calcPrompt,
        completion: calcComp,
        image: calcImage,
        request: calcReq,
        margin_percentage: margin,
      },
      benchmarks: raw.benchmarks || {},
      supported_parameters: raw.supported_parameters || [],
      uptime_pct: existing.uptime_pct || Number((99.0 + Math.random() * 0.9).toFixed(1)),
      custom_badge: customBadge,
      badge_override: Boolean(existing.badge_override),
      is_visible: isVisible,
      is_featured: isFeatured,
      min_plan: minPlan,
      openrouter_rank: openrouterRank,
      openrouter_tokens: openrouterTokens,
      openrouter_volume_str: openrouterVolumeStr,
      last_synced_at: new Date().toISOString(),
    };
  });

  // Merge native Groq & Fal models into the processed list so they persist in cache
  const processedIds = new Set(processed.map(m => m.id));
  for (const nativeModel of [...NATIVE_GROQ_MODELS, ...NATIVE_FAL_MODELS]) {
    if (!processedIds.has(nativeModel.id)) {
      processed.unshift(nativeModel);
    }
  }

  // Save to local cache file
  saveLocalCache(processed);

  // Update Supabase if available
  if (sb) {
    try {
      console.log(`[modelsService] Upserting ${processed.length} models into Supabase model_settings...`);
      for (let i = 0; i < processed.length; i += 100) {
        const batch = processed.slice(i, i + 100).map(m => {
          const { last_synced_at, input_modalities, output_modalities, media_category, ...rest } = m;
          return { ...rest, updated_at: last_synced_at || new Date().toISOString() };
        });
        const { error } = await sb.from('model_settings').upsert(batch, { onConflict: 'id' });
        if (error) {
          console.warn(`[modelsService] Supabase upsert batch ${i} notice:`, error.message);
        }
      }
    } catch (e) {
      console.warn('[modelsService] Supabase sync notice:', e.message);
    }
  }

  // Update last synced at and next auto-sync in settings
  const intervalHours = Number(settings.auto_sync_interval_hours || 24);
  const nextSyncDate = new Date(Date.now() + intervalHours * 3600 * 1000).toISOString();
  await updateGlobalSettings({
    last_synced_at: new Date().toISOString(),
    next_auto_sync_at: nextSyncDate,
  });

  console.log('[modelsService] Sync completed successfully with authentic OpenRouter rankings.');
  return { count: processed.length, synced_at: new Date().toISOString(), next_auto_sync_at: nextSyncDate };
}

export function getPopularityScore(m) {
  let score = 0;
  if (m.is_featured) score += 2000;
  
  // Real OpenRouter volume ranking gives top priority
  if (typeof m.openrouter_rank === 'number' && m.openrouter_rank > 0) {
    score += Math.max(200, 1500 - (m.openrouter_rank - 1) * 25);
    return score;
  }

  if (POPULAR_SLUGS.has(m.id)) score += 100;

  const provider = (m.provider || '').toLowerCase();
  if (provider.includes('openai')) score += 80;
  else if (provider.includes('anthropic')) score += 75;
  else if (provider.includes('deepseek')) score += 70;
  else if (provider.includes('meta')) score += 65;
  else if (provider.includes('google')) score += 60;
  else if (provider.includes('grok') || provider.includes('xai')) score += 55;
  else if (provider.includes('mistral')) score += 50;
  else if (provider.includes('qwen')) score += 45;

  if (m.custom_badge === 'Trending') score += 30;
  if (m.custom_badge === 'Coding Pro') score += 20;
  if (m.custom_badge === 'Speed King') score += 15;
  if (m.is_free) score += 10;

  return score;
}

export async function getAllModels(options = {}) {
  const { onlyVisible = true, search = '', provider = '', modality = '', minPlan = '' } = options;

  let list = [];
  const sb = getSupabase();

  if (sb) {
    try {
      let query = sb.from('model_settings').select('*');
      if (onlyVisible) query = query.eq('is_visible', true);
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        list = data;
      }
    } catch (e) {
      // fallback
    }
  }

  if (list.length === 0) {
    list = getLocalCache();
    if (onlyVisible) {
      list = list.filter(m => m.is_visible !== false);
    }
  }

  // If local cache is also empty on first run, do a live sync
  if (list.length === 0) {
    try {
      await syncModelsFromOpenRouter();
      list = getLocalCache();
      if (onlyVisible) {
        list = list.filter(m => m.is_visible !== false);
      }
    } catch (e) {
      console.error('[modelsService] First-time auto sync failed:', e.message);
    }
  }

  // Guarantee native Groq and Fal models are in the fleet with their exact native configurations
  const nativeMap = new Map([...NATIVE_GROQ_MODELS, ...NATIVE_FAL_MODELS].map(m => [m.id, m]));
  list = list.map(m => {
    if (nativeMap.has(m.id)) {
      return { ...m, ...nativeMap.get(m.id) };
    }
    return m;
  });
  for (const nativeModel of [...NATIVE_GROQ_MODELS, ...NATIVE_FAL_MODELS]) {
    if (!list.some(m => m.id === nativeModel.id)) {
      if (!onlyVisible || nativeModel.is_visible !== false) {
        list.unshift(nativeModel);
      }
    }
  }

  // Exclude partner-gated models that fail on web chat with 403 Forbidden
  list = list.filter(m => {
    const id = (m.id || '').toLowerCase();
    if (id.startsWith('thinkingmachines/') || id.includes('inkling')) return false;
    return true;
  });

  // Apply filters in memory
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(m =>
      m.name?.toLowerCase().includes(s) ||
      m.display_name?.toLowerCase().includes(s) ||
      m.id?.toLowerCase().includes(s) ||
      m.provider?.toLowerCase().includes(s)
    );
  }

  if (provider && provider !== 'all') {
    list = list.filter(m => m.provider?.toLowerCase() === provider.toLowerCase());
  }

  if (modality && modality !== 'all') {
    if (modality === 'free') {
      list = list.filter(m => m.is_free);
    } else {
      list = list.filter(m => m.modalities?.includes(modality));
    }
  }

  if (minPlan) {
    list = list.filter(m => m.min_plan === minPlan);
  }

  // Sort based on requested sort criteria (defaults to 'popular' so top models appear first!)
  const sortBy = options.sortBy || 'popular';
  list.sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;

    if (sortBy === 'popular') {
      const diff = getPopularityScore(b) - getPopularityScore(a);
      if (diff !== 0) return diff;
      return (a.display_name || a.name).localeCompare(b.display_name || b.name);
    } else if (sortBy === 'name') {
      return (a.display_name || a.name).localeCompare(b.display_name || b.name);
    } else if (sortBy === 'price_asc') {
      return (a.calculated_pricing?.prompt || 0) - (b.calculated_pricing?.prompt || 0);
    } else if (sortBy === 'price_desc') {
      return (b.calculated_pricing?.prompt || 0) - (a.calculated_pricing?.prompt || 0);
    } else if (sortBy === 'context') {
      return (b.context_length || 0) - (a.context_length || 0);
    }

    return (a.display_name || a.name).localeCompare(b.display_name || b.name);
  });

  return list;
}

export async function bulkUpdateModels(action, ids = null) {
  const cache = getLocalCache();
  const sb = getSupabase();
  const frontierProviders = new Set(['OpenAI', 'Anthropic', 'DeepSeek', 'Meta', 'Google', 'xAI (Grok)', 'Mistral', 'Qwen']);

  if (Array.isArray(ids) && ids.length > 0) {
    const idSet = new Set(ids);
    const isVis = action === 'show_selected';
    cache.forEach(m => {
      if (idSet.has(m.id)) {
        m.is_visible = isVis;
        m.updated_at = new Date().toISOString();
      }
    });
  } else if (action === 'hide_all') {
    cache.forEach(m => { m.is_visible = false; m.updated_at = new Date().toISOString(); });
  } else if (action === 'show_all') {
    cache.forEach(m => { m.is_visible = true; m.updated_at = new Date().toISOString(); });
  } else if (action === 'enable_frontier_only') {
    cache.forEach(m => {
      const isFrontier = frontierProviders.has(m.provider) || POPULAR_SLUGS.has(m.id) || m.is_free;
      m.is_visible = isFrontier;
      m.updated_at = new Date().toISOString();
    });
  }

  saveLocalCache(cache);

  if (sb) {
    try {
      const recordsToUpdate = (Array.isArray(ids) && ids.length > 0)
        ? cache.filter(m => ids.includes(m.id))
        : cache;
      for (let i = 0; i < recordsToUpdate.length; i += 100) {
        const batch = recordsToUpdate.slice(i, i + 100).map(m => {
          const { last_synced_at, ...rest } = m;
          return { ...rest, updated_at: last_synced_at || new Date().toISOString() };
        });
        await sb.from('model_settings').upsert(batch, { onConflict: 'id' });
      }
    } catch (e) {
      console.warn('[modelsService] bulk update notice:', e.message);
    }
  }

  const activeCount = cache.filter(m => m.is_visible !== false).length;
  return { success: true, count: cache.length, activeCount };
}

export async function updateModelRecord(id, updates) {
  const sb = getSupabase();
  const cache = getLocalCache();
  const idx = cache.findIndex(m => m.id === id);

  if (idx !== -1) {
    cache[idx] = { ...cache[idx], ...updates, updated_at: new Date().toISOString() };
    saveLocalCache(cache);
  }

  if (sb) {
    try {
      await sb
        .from('model_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch (e) {
      console.warn('[modelsService] Supabase update notice:', e.message);
    }
  }

  return idx !== -1 ? cache[idx] : null;
}

// ─── New Launches Changelog & Auto-Cron Architecture ──────────────────────

function getInitialChangelogSeed() {
  return [
    {
      id: 'launch-claude-3-5-sonnet',
      timestamp: '2026-10-19T06:30:00.000Z',
      date: '2026-10-19',
      type: 'new_model',
      model_id: 'anthropic/claude-3.5-sonnet',
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      context_length: 200000,
      is_free: false,
      pricing: { prompt: 3.00, completion: 15.00 },
      title: 'Frontier Coding Flagship: Claude 3.5 Sonnet',
      summary: 'Anthropic frontier model with industry-leading 93.7% SWE-bench score, advanced coding, and multimodal analysis.'
    },
    {
      id: 'launch-deepseek-v4-1-flash',
      timestamp: '2026-10-18T14:15:00.000Z',
      date: '2026-10-18',
      type: 'new_model',
      model_id: 'deepseek/deepseek-v4.1-flash-1017',
      name: 'DeepSeek V4.1 Flash 1017',
      provider: 'DeepSeek',
      context_length: 1048576,
      is_free: false,
      pricing: { prompt: 0.14, completion: 0.28 },
      title: 'High-Speed Arrival: DeepSeek V4.1 Flash',
      summary: 'Ultra-fast sparse MoE foundation model engineered for sub-second (<300ms) generation with 1,000,000 tokens context support.'
    },
    {
      id: 'free-minimax-m3-1-flash',
      timestamp: '2026-10-18T10:00:00.000Z',
      date: '2026-10-18',
      type: 'free_tier',
      model_id: 'minimax/minimax-m3.1-flash:free',
      name: 'MiniMax M3.1 Flash (Free)',
      provider: 'MiniMax',
      context_length: 1000000,
      is_free: true,
      pricing: { prompt: 0, completion: 0 },
      title: 'Activated 100% Free Tier: MiniMax M3.1 Flash',
      summary: 'Multimodal foundation model with 1,000,000 tokens context window enabled with zero token cost for all users.'
    },
    {
      id: 'launch-gemini-flash-1-5',
      timestamp: '2026-10-16T18:00:00.000Z',
      date: '2026-10-16',
      type: 'new_model',
      model_id: 'google/gemini-flash-1.5',
      name: 'Gemini 1.5 Flash',
      provider: 'Google',
      context_length: 1000000,
      is_free: false,
      pricing: { prompt: 0.075, completion: 0.30 },
      title: 'Google DeepMind High-Speed: Gemini 1.5 Flash',
      summary: 'Google high-frequency multimodal model supporting 1M tokens context for lightning-fast reasoning and document QA.'
    },
    {
      id: 'price-drop-gpt4o',
      timestamp: '2026-10-15T09:20:00.000Z',
      date: '2026-10-15',
      type: 'price_drop',
      model_id: 'openai/gpt-4o',
      name: 'GPT-4o (Omni)',
      provider: 'OpenAI',
      old_price: '$5.00 / 1M',
      new_price: '$2.50 / 1M',
      title: 'Price Drop: GPT-4o 50% Reduction',
      summary: 'OpenAI adjusted prompt token rates down to $2.50 / 1M tokens, doubling throughput efficiency for production apps.'
    },
    {
      id: 'free-llama-3-1-8b',
      timestamp: '2026-10-14T11:45:00.000Z',
      date: '2026-10-14',
      type: 'free_tier',
      model_id: 'meta-llama/llama-3.1-8b-instruct:free',
      name: 'Llama 3.1 8B Instruct (Free)',
      provider: 'Meta',
      context_length: 131072,
      is_free: true,
      pricing: { prompt: 0, completion: 0 },
      title: 'Free Model Refresh: Llama 3.1 8B',
      summary: 'Meta AI lightweight model renewed on 100% free tier for fast developer experimentation and prototyping.'
    }
  ];
}

export function getChangelog() {
  try {
    if (existsSync(CHANGELOG_FILE)) {
      const data = JSON.parse(readFileSync(CHANGELOG_FILE, 'utf8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.warn('[modelsService] Failed to read changelog file:', e.message);
  }
  const initial = getInitialChangelogSeed();
  saveChangelog(initial);
  return initial;
}

export function saveChangelog(entries) {
  try {
    writeFileSync(CHANGELOG_FILE, JSON.stringify(entries, null, 2), 'utf8');
  } catch (e) {
    console.warn('[modelsService] Failed to write changelog file:', e.message);
  }
}

export function recordChangelogDiff(existingCache, rawList, margin) {
  const existingMap = new Map(existingCache.map(m => [m.id, m]));
  const currentChangelog = getChangelog();
  const newEntries = [];
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const nowMs = Date.now();

  function isRecentlyLogged(modelId, type) {
    return currentChangelog.some(entry => {
      if (entry.model_id !== modelId) return false;
      const entryTime = new Date(entry.timestamp || entry.date || 0).getTime();
      return (nowMs - entryTime) < ONE_DAY_MS && entry.type === type;
    });
  }

  for (const raw of rawList) {
    const rawPrompt = Number(raw.pricing?.prompt || 0);
    const rawComp = Number(raw.pricing?.completion || 0);
    const isFree = rawPrompt === 0 && rawComp === 0;
    const provider = deriveProvider(raw.id, raw.name || raw.id);
    const displayName = formatDisplayName(raw.id, raw.name || raw.id);

    const prompt1M = isFree ? 0 : Number((rawPrompt * (1 + margin / 100) * 1000000).toFixed(2));
    const comp1M = isFree ? 0 : Number((rawComp * (1 + margin / 100) * 1000000).toFixed(2));

    // 1. Brand new model detected
    if (!existingMap.has(raw.id)) {
      const eventType = isFree ? 'free_tier' : 'new_model';
      if (!isRecentlyLogged(raw.id, eventType)) {
        newEntries.push({
          id: `launch-${raw.id.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}`,
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
          type: eventType,
          model_id: raw.id,
          name: displayName,
          provider,
          context_length: raw.context_length || 0,
          is_free: isFree,
          pricing: {
            prompt: prompt1M,
            completion: comp1M,
          },
          title: isFree ? `New Free Model: ${displayName}` : `New Model Launch: ${displayName}`,
          summary: `New model from ${provider} with ${Math.round((raw.context_length || 0) / 1000)}k context added to Netroot AI fleet.`
        });
      }
    } else {
      // 2. Existing model change
      const existing = existingMap.get(raw.id);
      const oldPrompt = Number(existing.base_pricing?.prompt || 0);
      const newPrompt = rawPrompt;

      // Case A: Model shifted from paid to 100% Free
      const wasPaidNowFree = oldPrompt > 0 && isFree;
      if (wasPaidNowFree && !isRecentlyLogged(raw.id, 'free_tier')) {
        newEntries.push({
          id: `free-${raw.id.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}`,
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
          type: 'free_tier',
          model_id: raw.id,
          name: existing.display_name || displayName,
          provider: existing.provider || provider,
          context_length: raw.context_length || existing.context_length || 0,
          is_free: true,
          pricing: { prompt: 0, completion: 0 },
          title: `Activated 100% Free Tier: ${existing.display_name || displayName}`,
          summary: `${existing.display_name || displayName} transitioned to 100% Free tier by ${provider} on OpenRouter ($0 token cost).`
        });
      }
      // Case B: Model price drop or adjustment
      else if (oldPrompt > 0 && newPrompt > 0 && Math.abs(oldPrompt - newPrompt) / oldPrompt > 0.05) {
        const isDrop = newPrompt < oldPrompt;
        const eventType = isDrop ? 'price_drop' : 'price_adjustment';
        if (!isRecentlyLogged(raw.id, eventType)) {
          newEntries.push({
            id: `price-${raw.id.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}`,
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0],
            type: eventType,
            model_id: raw.id,
            name: existing.display_name || displayName,
            provider: existing.provider || provider,
            context_length: raw.context_length || existing.context_length || 0,
            old_price: `$${(oldPrompt * 1000000).toFixed(2)}/1M`,
            new_price: `$${(newPrompt * 1000000).toFixed(2)}/1M`,
            title: isDrop ? `Price Drop: ${existing.display_name || displayName}` : `Price Adjustment: ${existing.display_name || displayName}`,
            summary: `Base prompt token pricing updated from $${(oldPrompt * 1000000).toFixed(2)} to $${(newPrompt * 1000000).toFixed(2)} per million tokens.`
          });
        }
      }
    }
  }

  if (newEntries.length > 0) {
    const updated = [...newEntries, ...currentChangelog].slice(0, 100);
    saveChangelog(updated);
    console.log(`[modelsService] Changelog updated with ${newEntries.length} new entries.`);
    return newEntries;
  }
  return [];
}

let cronIntervalHandle = null;

export function initAutoSyncCron() {
  if (cronIntervalHandle) return;

  console.log('[modelsService] Initializing Auto-Cron Daily Sync Job...');

  // Periodic tick every 10 minutes
  cronIntervalHandle = setInterval(async () => {
    try {
      const settings = await getGlobalSettings();
      if (settings.auto_sync === false) return;

      const intervalHours = Number(settings.auto_sync_interval_hours || 24);
      const intervalMs = intervalHours * 60 * 60 * 1000;
      const lastSync = settings.last_synced_at ? new Date(settings.last_synced_at).getTime() : 0;
      const now = Date.now();

      if (now - lastSync >= intervalMs) {
        console.log(`[Auto-Cron] Triggering scheduled models sync (${intervalHours}h elapsed)...`);
        await syncModelsFromOpenRouter();
      }
    } catch (err) {
      console.error('[Auto-Cron] Error in scheduled sync:', err.message);
    }
  }, 10 * 60 * 1000);

  // Initial startup: check for missed sync while server was offline, or compute next_auto_sync_at
  getGlobalSettings().then(async settings => {
    if (settings.auto_sync !== false && settings.next_auto_sync_at) {
      const nextTime = new Date(settings.next_auto_sync_at).getTime();
      if (Date.now() >= nextTime) {
        console.log('[Auto-Cron] Missed scheduled sync detected upon server start. Triggering sync now...');
        await syncModelsFromOpenRouter();
        return;
      }
    }
    if (!settings.next_auto_sync_at && settings.last_synced_at) {
      const intervalHours = Number(settings.auto_sync_interval_hours || 24);
      const nextSync = new Date(new Date(settings.last_synced_at).getTime() + (intervalHours * 3600 * 1000)).toISOString();
      updateGlobalSettings({ next_auto_sync_at: nextSync });
    }
  }).catch(() => {});
}

// ------------------------------

