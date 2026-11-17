
const FULL_MODEL_PROFILES = {
  'anthropic/claude-sonnet-4.5':
    "Claude Sonnet 4.5 is Anthropic’s most advanced Sonnet model to date, engineered for high-precision autonomous agents, complex software engineering, and multi-step reasoning workflows. It delivers state-of-the-art performance on industry benchmarks including SWE-bench Verified, HumanEval, and GPQA Diamond. Featuring a massive 1,000,000 token context window, Sonnet 4.5 can effortlessly analyze entire code repositories, comprehensive financial reports, and multi-document corpuses with pinpoint recall and superior instruction-following accuracy.",

  'anthropic/claude-3.5-sonnet':
    "Claude 3.5 Sonnet raises the industry standard for reasoning and coding. Operating at twice the speed of Claude 3 Opus, it excels at complex coding, multimodal visual processing, and multi-turn technical dialogue. With a 200,000 token context window and native tool use capabilities, Sonnet 3.5 is ideal for production software development, data extraction, and visual document reasoning.",

  'anthropic/claude-3-opus':
    "Claude 3 Opus is Anthropic’s most powerful foundation model for highly complex cognitive tasks. It demonstrates frontier-level performance on undergraduate-level knowledge, graduate-level reasoning, and deep mathematical analysis. Featuring a 200,000 token context window and nuanced ethical alignment, Opus excels at synthesis of complex scientific research, legal contract analysis, and sophisticated creative writing.",

  'openai/gpt-4o':
    "GPT-4o ('omni') is OpenAI’s flagship multimodal foundation model, natively accepting and reasoning over any combination of text, images, and documents with extreme speed. It delivers GPT-4 Turbo-level intelligence while being 50% more affordable and twice as fast. Featuring a 128,000 token context window, native support for JSON schema structured outputs, and parallel tool calling, GPT-4o is the gold standard for real-time customer applications and multimodal intelligence.",

  'openai/gpt-4o-mini':
    "GPT-4o mini is OpenAI’s most cost-efficient small model, delivering superior intelligence over GPT-3.5 Turbo at a fraction of the cost. With a 128,000 token context window and support for multimodal vision inputs, structured JSON outputs, and function calling, GPT-4o mini is optimized for high-volume enterprise tasks, automated chat agents, and lightweight reasoning.",

  'openai/o3-mini':
    "o3-mini is OpenAI’s advanced reasoning model optimized for science, mathematics, and high-precision coding. Featuring flexible reasoning effort controls (low, medium, high), o3-mini delivers breakthrough benchmark scores at exceptionally low token costs, making deep chain-of-thought problem solving accessible at scale.",

  'deepseek/deepseek-v4.1-flash-1017':
    "DeepSeek V4.1 Flash 1017 is a high-speed, sparse Mixture-of-Experts (MoE) foundation model served under the deepseek-flash API. With an ultra-long 1,000,000 token context window and industry-leading cost efficiency, it provides exceptional inference throughput for real-time chat, automated code completion, and document analysis with negligible latency.",

  'deepseek/deepseek-chat':
    "DeepSeek-V3 is a strong open-weight Mixture-of-Experts (MoE) language model with 671B total parameters and 37B active per token. Trained on 14.8 trillion tokens, DeepSeek excels in mathematical problem solving, multilingual comprehension, and code synthesis, rivaling top closed-source frontier models at significantly lower token costs.",

  'meta-llama/llama-3.1-70b-instruct':
    "Llama 3.1 70B Instruct from Meta AI is a premier open-weight model delivering frontier-class capabilities in reasoning, mathematics, multilingual translation, and code generation. Optimized with a 128,000 token context window and fine-tuned for high-precision tool calling, it represents one of the most versatile and cost-effective enterprise AI models available.",

  'meta-llama/llama-3.1-8b-instruct:free':
    "Llama 3.1 8B Instruct (Free Tier) offers 100% free, high-speed access to Meta's lightweight generative model. With a 128,000 token context window, it is perfectly suited for developer experimentation, prototyping, text summarization, and lightweight chat applications without requiring API credit balances.",

  'google/gemini-flash-1.5':
    "Gemini 1.5 Flash is Google’s lightweight, ultra-fast multimodal model built for high frequency, low-latency tasks. It features a groundbreaking 1,000,000 token context window, enabling native processing of massive audio, video, image, and text inputs with industry-leading efficiency and low cost per query.",

  'google/gemini-pro-1.5':
    "Gemini 1.5 Pro is Google’s flagship mid-size multimodal model, optimized for complex cross-modal reasoning across text, code, audio, and video. Equipped with a 2,000,000 token context window, it can ingest and query millions of words or hours of multimedia in a single prompt with high-fidelity needle-in-a-haystack retrieval.",

  'black-forest-labs/flux-1-schnell':
    "FLUX.1 [schnell] is a cutting-edge 12-billion parameter rectified flow transformer model developed by Black Forest Labs. Built for ultra-fast, high-detail image synthesis from text prompts, FLUX.1 generates photorealistic visuals with precise typography adherence in just 1 to 4 diffusion steps.",

  'qwen/qwen-2.5-72b-instruct':
    "Qwen 2.5 72B Instruct by Alibaba Cloud is an open-weight flagship LLM demonstrating exceptional code synthesis, mathematical reasoning, and multi-language fluency. With a 128,000 token context window and state-of-the-art instruction following, it stands as one of the world's most capable open-source reasoning models.",

  'openai/gpt-oss-20b':
    "GPT OSS 20B is a high-speed open-weight model engineered for rapid code assistance, mathematical workflows, and lightweight cognitive reasoning. Running natively on Groq LPUs with a 131,072 token context window, it delivers ultra-low latency inference with deterministic precision and zero token cost on NetRoot AI.",

  'allam-2-7b':
    "ALLaM 2 7B is a premier bilingual foundation model developed by the Saudi Data and AI Authority (SDAIA). Specially optimized for high-speed Arabic and English reasoning, multilingual dialogue, and localization tasks, it operates with a 131,072 token context window powered by Groq LPU acceleration.",

  'qwen/qwen3.8-27b':
    "Qwen3.8 27B Vision is a versatile multimodal reasoning model created by Alibaba Cloud. Featuring native vision-language comprehension alongside advanced code and textual logic, it processes image inspection and long-context documents across a 131,072 token window with Groq acceleration.",

  'groq/compound-mini':
    "Compound Mini is Groq’s agentic architecture model built for low-latency multi-step reasoning, autonomous tool selection, and high-throughput query pipelines. Equipped with a 131,072 token context length, it accelerates reasoning agents at breakthrough speeds.",

  'openai/gpt-oss-120b':
    "GPT OSS 120B is a high-capacity open-weight flagship model designed for demanding multi-step reasoning, complex software engineering, and large-scale synthesis. Hosted on Groq LPU infrastructure with 131,072 token context window, it delivers enterprise-grade reasoning with lightning-fast throughput.",
};

/**
 * Returns complete, unabridged description for any model.
 * If the model has a known full profile, returns it.
 * Otherwise, if description ends with ellipsis (...), expands it with technical specifications.
 */
export function getFullModelDescription(model) {
  if (!model) return '';

  // Match by exact ID or normalized key
  const id = model.id || '';
  const cleanId = id.replace(/:free$/, '');
  if (FULL_MODEL_PROFILES[id]) return FULL_MODEL_PROFILES[id];
  if (FULL_MODEL_PROFILES[cleanId]) return FULL_MODEL_PROFILES[cleanId];

  // Specific slug match (longer keys first to prevent gpt-4o stealing gpt-4o-mini)
  const sortedProfileKeys = Object.keys(FULL_MODEL_PROFILES).sort((a, b) => b.length - a.length);
  const idSlug = cleanId.includes('/') ? cleanId.split('/')[1] : cleanId;

  for (const key of sortedProfileKeys) {
    const keySlug = key.includes('/') ? key.split('/')[1] : key;
    if (cleanId === key || idSlug === keySlug) {
      return FULL_MODEL_PROFILES[key];
    }
    const escapedSlug = keySlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const boundaryRegex = new RegExp(`(^|[/:])${escapedSlug}($|[:])`, 'i');
    if (boundaryRegex.test(cleanId)) {
      return FULL_MODEL_PROFILES[key];
    }
  }

  const rawDesc = (model.description || '').trim();

  // If description ends with ellipsis or is cut short, cleanly resolve and expand
  if (rawDesc.endsWith('...') || rawDesc.endsWith('…') || rawDesc.length < 80) {
    const cleanBase = rawDesc.replace(/\s*\.{3,}$/, '').replace(/…$/, '');
    const contextStr = model.context_length
      ? `${Math.round(model.context_length / 1000)}k tokens`
      : 'standard context';
    const modalStr = (model.modalities || ['text']).join(', ');
    const priceStr = model.is_free
      ? '100% free tier access'
      : `$${((model.calculated_pricing?.prompt || 0) * 1000000).toFixed(2)} / 1M prompt tokens`;

    if (cleanBase.length > 20) {
      return `${cleanBase}. Developed by ${model.provider || 'leading AI laboratories'}, this model features an enterprise ${contextStr} context window supporting ${modalStr} processing. Fully integrated into Netroot AI with high-reliability uptime and competitive rates at ${priceStr}.`;
    }
    return `${model.display_name || model.name} is a high-performance generative AI model from ${model.provider || 'AI Labs'}. Equipped with a ${contextStr} context window supporting ${modalStr} modalities, it is optimized for low-latency reasoning and scalable API execution on Netroot AI (${priceStr}).`;
  }

  return rawDesc;
}

const MODEL_SUMMARIES = {
  'anthropic/claude-sonnet-4.5':
    "Anthropic's premier frontier model, engineered for high-precision autonomous agents, complex software engineering, and multi-step reasoning.",
  'anthropic/claude-3.5-sonnet':
    "Industry-leading model for reasoning and coding, operating at 2x the speed of Opus with exceptional visual comprehension.",
  'anthropic/claude-3-opus':
    "Frontier cognitive model excels at deep mathematical analysis, legal research, and scientific synthesis across complex inputs.",
  'openai/gpt-4o':
    "OpenAI's flagship multimodal foundation model, natively processing text, vision, and documents with high-speed intelligence.",
  'openai/gpt-4o-mini':
    "Cost-efficient small model delivering superior intelligence over GPT-3.5 Turbo at a fraction of the cost.",
  'openai/o3-mini':
    "Advanced reasoning model with flexible thinking controls, delivering breakthrough math and coding benchmarks.",
  'openai/o3':
    "OpenAI's most capable next-generation reasoning model, setting new records in competitive programming and complex STEM benchmarks.",
  'deepseek/deepseek-v4.1-flash-1017':
    "High-speed sparse MoE foundation model optimized for ultra-low latency, real-time chatbots, and sub-second generation.",
  'deepseek/deepseek-chat':
    "Open-weight 671B MoE language model delivering top-tier reasoning, code synthesis, and low inference costs.",
  'google/gemini-2.5-pro':
    "Google's state-of-the-art multimodal model with massive 2M context, native reasoning, and rich audio/video understanding.",
  'google/gemini-flash-1.5':
    "Google's lightweight multimodal model built for high-speed frequency tasks with 1M context capacity.",
  'meta-llama/llama-3.1-70b-instruct':
    "Meta's enterprise open-weight model with 128k context, excelling at code generation, reasoning, and multilingual dialogue.",
  'meta-llama/llama-3.1-8b-instruct:free':
    "Meta's lightweight generative model offering 100% free access for fast prototyping, summarization, and chat.",
};

/**
 * Returns a complete, unabridged single or two-sentence summary that never truncates or cuts mid-sentence.
 */
export function getModelSummary(model) {
  if (!model) return '';
  const id = model.id || '';
  const cleanId = id.replace(/:free$/, '');
  if (MODEL_SUMMARIES[id]) return MODEL_SUMMARIES[id];
  if (MODEL_SUMMARIES[cleanId]) return MODEL_SUMMARIES[cleanId];

  const sortedSummaryKeys = Object.keys(MODEL_SUMMARIES).sort((a, b) => b.length - a.length);
  const idSlug = cleanId.includes('/') ? cleanId.split('/')[1] : cleanId;

  for (const key of sortedSummaryKeys) {
    const keySlug = key.includes('/') ? key.split('/')[1] : key;
    if (cleanId === key || idSlug === keySlug) {
      return MODEL_SUMMARIES[key];
    }
    const escapedSlug = keySlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const boundaryRegex = new RegExp(`(^|[/:])${escapedSlug}($|[:])`, 'i');
    if (boundaryRegex.test(cleanId)) {
      return MODEL_SUMMARIES[key];
    }
  }

  // Extract first 1 or 2 complete sentences from full description
  const full = getFullModelDescription(model);
  const sentences = full.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length > 0) {
    if (sentences[0].length >= 70) {
      return sentences[0].trim();
    }
    if (sentences.length > 1 && (sentences[0].length + sentences[1].length) <= 180) {
      return `${sentences[0].trim()} ${sentences[1].trim()}`;
    }
    return sentences[0].trim();
  }

  const clean = full.replace(/\s*\.{3,}$/, '').trim();
  return clean.endsWith('.') ? clean : `${clean}.`;
}

