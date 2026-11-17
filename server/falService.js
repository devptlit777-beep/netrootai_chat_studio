/**
 * Fal.ai Cloud Generative Media Service
 * Handles synchronous and queued inference for Image, Video, and Audio models.
 */

export async function runFalGeneration({ modelId, prompt, options = {}, falKey }) {
  const activeKey = falKey || process.env.FAL_KEY;
  if (!activeKey) {
    throw new Error('fal.ai API key is not configured. Please set FAL_KEY in your environment.');
  }

  const cleanPrompt = String(prompt || '').trim();
  if (!cleanPrompt) {
    throw new Error('A descriptive text prompt is required.');
  }

  // Ensure model slug format
  const targetModel = modelId.startsWith('fal-ai/') ? modelId : `fal-ai/${modelId}`;

  // Build model-specific input payload
  let payload = { prompt: cleanPrompt };

  const isVideo = targetModel.includes('kling') || targetModel.includes('luma') || targetModel.includes('video') || targetModel.includes('cogvideo');
  const isAudio = targetModel.includes('tts') || targetModel.includes('f5') || targetModel.includes('audio') || targetModel.includes('whisper');
  const isImage = !isVideo && !isAudio;

  if (isImage) {
    // Map aspect ratio into fal.ai image_size parameter if needed
    let imageSize = 'landscape_16_9';
    const ar = options.aspectRatio || options.aspect_ratio;
    if (ar === '1:1' || ar === 'square') imageSize = 'square_hd';
    else if (ar === '9:16' || ar === 'portrait') imageSize = 'portrait_16_9';
    else if (ar === '4:3') imageSize = 'landscape_4_3';
    else if (ar === '3:4') imageSize = 'portrait_4_3';
    else if (ar) imageSize = ar;

    payload = {
      prompt: cleanPrompt,
      image_size: imageSize,
      num_inference_steps: Number(options.steps) || (targetModel.includes('schnell') ? 4 : 28),
      guidance_scale: Number(options.guidance_scale) || 3.5,
      enable_safety_checker: false,
      ...options,
    };
  } else if (isVideo) {
    payload = {
      prompt: cleanPrompt,
      aspect_ratio: options.aspectRatio || options.aspect_ratio || '16:9',
      duration: String(options.duration || '5'),
      ...options,
    };
  } else if (isAudio) {
    if (targetModel.includes('tts') || targetModel.includes('f5')) {
      payload = {
        gen_text: cleanPrompt,
        ref_text: options.ref_text || '',
        ref_audio_url: options.ref_audio_url || undefined,
        ...options,
      };
    } else {
      payload = {
        prompt: cleanPrompt,
        seconds_total: Number(options.duration) || 30,
        ...options,
      };
    }
  }

  const headers = {
    Authorization: `Key ${activeKey}`,
    'Content-Type': 'application/json',
  };

  // Determine whether to use fast sync endpoint or queue
  const isDirectSync = targetModel.includes('schnell');
  const endpoint = isDirectSync
    ? `https://fal.run/${targetModel}`
    : `https://queue.fal.run/${targetModel}`;

  console.log(`[falService] Submitting request to ${endpoint} with prompt: "${cleanPrompt.slice(0, 60)}..."`);

  const initialRes = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const initialJson = await initialRes.json();

  if (!initialRes.ok) {
    const errMsg = initialJson?.detail || initialJson?.message || initialJson?.error || `Fal API error (${initialRes.status})`;
    console.error('[falService] API Error:', errMsg);
    throw new Error(typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg);
  }

  // 1. Direct synchronous result
  if (initialJson.images || initialJson.video || initialJson.audio_url || initialJson.audio) {
    return extractMediaResult(targetModel, initialJson, cleanPrompt);
  }

  // 2. Queue polling
  const requestId = initialJson.request_id;
  if (!requestId) {
    return extractMediaResult(targetModel, initialJson, cleanPrompt);
  }

  console.log(`[falService] Queued request ID: ${requestId}. Polling for completion...`);

  const statusUrl = initialJson.status_url || `https://queue.fal.run/${targetModel}/requests/${requestId}/status`;
  const responseUrl = initialJson.response_url || `https://queue.fal.run/${targetModel}/requests/${requestId}`;

  const maxAttempts = 75; // 75 * 1.5s = ~112s
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise(r => setTimeout(r, 1500));

    const pollRes = await fetch(statusUrl, { headers });
    if (!pollRes.ok) continue;

    const statusJson = await pollRes.json();
    if (statusJson.status === 'COMPLETED') {
      console.log(`[falService] Queue job ${requestId} completed! Fetching final output...`);
      const finalRes = await fetch(responseUrl, { headers });
      const finalJson = await finalRes.json();
      return extractMediaResult(targetModel, finalJson, cleanPrompt);
    }

    if (statusJson.status === 'FAILED') {
      const failReason = statusJson.error || statusJson.logs?.[0]?.message || 'Fal queue job failed';
      throw new Error(failReason);
    }
  }

  throw new Error('Fal media generation timed out while waiting in queue.');
}

function extractMediaResult(modelId, data, prompt) {
  // Image result
  if (Array.isArray(data.images) && data.images.length > 0) {
    const img = data.images[0];
    return {
      success: true,
      mediaType: 'image',
      url: img.url,
      width: img.width,
      height: img.height,
      prompt,
      modelId,
    };
  }

  // Video result
  if (data.video && (data.video.url || typeof data.video === 'string')) {
    const videoUrl = typeof data.video === 'string' ? data.video : data.video.url;
    return {
      success: true,
      mediaType: 'video',
      url: videoUrl,
      duration: data.video?.duration,
      prompt,
      modelId,
    };
  }

  // Audio / Speech result
  if (data.audio_url && (data.audio_url.url || typeof data.audio_url === 'string')) {
    const audioUrl = typeof data.audio_url === 'string' ? data.audio_url : data.audio_url.url;
    return {
      success: true,
      mediaType: 'audio',
      url: audioUrl,
      prompt,
      modelId,
    };
  }
  if (data.audio && (data.audio.url || typeof data.audio === 'string')) {
    const audioUrl = typeof data.audio === 'string' ? data.audio : data.audio.url;
    return {
      success: true,
      mediaType: 'audio',
      url: audioUrl,
      prompt,
      modelId,
    };
  }

  return {
    success: true,
    data,
    prompt,
    modelId,
  };
}

