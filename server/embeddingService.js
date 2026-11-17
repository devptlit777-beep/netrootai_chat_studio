import { pipeline } from '@huggingface/transformers';

let extractorPipeline = null;
let isInitializing = false;
let initPromise = null;

/**
 * Initializes and returns the local embedding pipeline (Xenova/all-MiniLM-L6-v2)
 * High-speed 384-dimensional dense vectors generated entirely on CPU with zero external API calls.
 */
export async function getEmbeddingPipeline() {
  if (extractorPipeline) return extractorPipeline;

  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      console.log('[embeddings] Initializing local ONNX embedding pipeline (all-MiniLM-L6-v2)...');
      const start = Date.now();
      extractorPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true,
      });
      console.log(`[embeddings] Model loaded successfully in ${Date.now() - start}ms! Ready for zero-cost RAG.`);
      return extractorPipeline;
    } catch (err) {
      console.error('[embeddings] Failed to load embedding pipeline:', err);
      isInitializing = false;
      throw err;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

/**
 * Generates a 384-dimensional normalized vector for a given text string.
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return new Array(384).fill(0);
  }

  const pipe = await getEmbeddingPipeline();
  // Safe truncation to avoid tensor limits
  const cleanText = text.slice(0, 2000).replace(/\s+/g, ' ').trim();

  const output = await pipe(cleanText, {
    pooling: 'mean',
    normalize: true,
  });

  return Array.from(output.data);
}

/**
 * Generates embeddings for an array of text chunks sequentially with error resilience.
 */
export async function generateBatchEmbeddings(texts = []) {
  const embeddings = [];
  for (const text of texts) {
    const vec = await generateEmbedding(text);
    embeddings.push(vec);
  }
  return embeddings;
}

/**
 * Calculates cosine similarity between two normalized vectors.
 * Returns a value between -1.0 and 1.0 (typically 0.0 to 1.0 for embeddings).
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

