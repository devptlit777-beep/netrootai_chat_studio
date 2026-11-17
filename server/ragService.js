import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import mammoth from 'mammoth';
import AdmZip from 'adm-zip';
import { generateEmbedding, cosineSimilarity } from './embeddingService.js';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RAG_DATA_FILE = join(__dirname, 'ragData.json');

// Initialize local JSON storage for vector document chunks
function loadRagStore() {
  try {
    if (!existsSync(RAG_DATA_FILE)) {
      const initial = { documents: [], chunks: [] };
      writeFileSync(RAG_DATA_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = readFileSync(RAG_DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.documents)) parsed.documents = [];
    if (!Array.isArray(parsed.chunks)) parsed.chunks = [];
    return parsed;
  } catch (err) {
    console.warn('[rag] Error reading ragData.json, initializing empty:', err.message);
    return { documents: [], chunks: [] };
  }
}

function saveRagStore(data) {
  try {
    const tempPath = `${RAG_DATA_FILE}.tmp`;
    writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    writeFileSync(RAG_DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[rag] Failed to persist ragData.json:', err);
  }
}

/**
 * Extracts plain text from various file formats (PDF, DOCX, PPTX, TXT, CSV, Code).
 */
export async function extractTextFromFile({ buffer, fileName = '', mimeType = '' }) {
  const ext = (fileName.split('.').pop() || '').toLowerCase();

  // 1. Plain text / Markdown / CSV / Code / JSON
  if (['txt', 'md', 'markdown', 'csv', 'json', 'yaml', 'yml', 'js', 'jsx', 'ts', 'tsx', 'py', 'html', 'css', 'sql'].includes(ext) ||
      mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'text/csv') {
    const text = buffer.toString('utf-8');
    return {
      text,
      fileType: ext || 'text',
      sections: [{ title: 'Document Content', text, metadata: {} }],
    };
  }

  // 2. Microsoft Word (.docx)
  if (ext === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value || '';
      return {
        text,
        fileType: 'docx',
        sections: [{ title: 'Word Document', text, metadata: {} }],
      };
    } catch (err) {
      console.error('[rag] Mammoth docx extraction error:', err);
      throw new Error(`Failed to parse Word (.docx) document: ${err.message}`);
    }
  }

  // 3. Microsoft PowerPoint (.pptx)
  if (ext === 'pptx' || mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    try {
      const zip = new AdmZip(buffer);
      const zipEntries = zip.getEntries();
      const slideEntries = zipEntries
        .filter(entry => entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml'))
        .sort((a, b) => {
          const numA = parseInt((a.entryName.match(/\d+/) || [0])[0], 10);
          const numB = parseInt((b.entryName.match(/\d+/) || [0])[0], 10);
          return numA - numB;
        });

      let fullText = '';
      const sections = [];

      for (let i = 0; i < slideEntries.length; i++) {
        const entry = slideEntries[i];
        const xml = zip.readAsText(entry);
        // Extract all <a:t>...</a:t> text tags from slide XML
        const textMatches = xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || [];
        const slideText = textMatches
          .map(tag => tag.replace(/<[^>]+>/g, '').trim())
          .filter(Boolean)
          .join(' ');

        if (slideText) {
          const slideNum = i + 1;
          const slideHeader = `Slide ${slideNum}: ${slideText}\n\n`;
          fullText += slideHeader;
          sections.push({
            title: `Slide ${slideNum}`,
            text: slideText,
            metadata: { slide: slideNum },
          });
        }
      }

      return {
        text: fullText || 'No text extracted from presentation slides.',
        fileType: 'pptx',
        sections: sections.length > 0 ? sections : [{ title: 'Presentation', text: fullText, metadata: {} }],
      };
    } catch (err) {
      console.error('[rag] PPTX extraction error:', err);
      throw new Error(`Failed to parse PowerPoint presentation: ${err.message}`);
    }
  }

  // 4. Adobe PDF (.pdf)
  if (ext === 'pdf' || mimeType === 'application/pdf') {
    try {
      const pdfModule = require('pdf-parse');
      // If constructor exists
      if (pdfModule.PDFParse) {
        const parser = new pdfModule.PDFParse(buffer);
        if (typeof parser.load === 'function') await parser.load();
        if (typeof parser.getText === 'function') {
          const result = await parser.getText();
          const text = typeof result === 'string' ? result : (result?.text || '');
          return {
            text,
            fileType: 'pdf',
            sections: [{ title: 'PDF Content', text, metadata: {} }],
          };
        }
      } else if (typeof pdfModule === 'function') {
        const data = await pdfModule(buffer);
        return {
          text: data.text || '',
          fileType: 'pdf',
          sections: [{ title: 'PDF Content', text: data.text || '', metadata: { numpages: data.numpages } }],
        };
      }

      // Fallback text extraction from raw PDF streams
      const rawString = buffer.toString('binary');
      const textChunks = [];
      const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
      let match;
      while ((match = streamRegex.exec(rawString)) !== null) {
        const streamData = match[1];
        const clean = streamData.replace(/[^\x20-\x7E\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
        if (clean.length > 40) textChunks.push(clean);
      }

      const extracted = textChunks.join('\n\n');
      return {
        text: extracted || buffer.toString('utf-8').replace(/[^\x20-\x7E\r\n\t]/g, ' '),
        fileType: 'pdf',
        sections: [{ title: 'PDF Document', text: extracted, metadata: {} }],
      };
    } catch (err) {
      console.warn('[rag] PDF parse warning, attempting buffer string extraction:', err.message);
      const text = buffer.toString('utf-8').replace(/[^\x20-\x7E\r\n\t]/g, ' ');
      return {
        text,
        fileType: 'pdf',
        sections: [{ title: 'PDF Document', text, metadata: {} }],
      };
    }
  }

  // Default fallback
  const text = buffer.toString('utf-8');
  return {
    text,
    fileType: ext || 'unknown',
    sections: [{ title: 'File Content', text, metadata: {} }],
  };
}

/**
 * Splits extracted text into overlapping semantic chunks for embedding.
 */
export function chunkText(fullText, metadata = {}, options = {}) {
  const chunkSize = options.chunkSize || 500;
  const chunkOverlap = options.chunkOverlap || 60;

  if (!fullText || typeof fullText !== 'string') return [];

  const clean = fullText.replace(/\r\n/g, '\n').trim();
  const paragraphs = clean.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    const p = para.trim();
    if (!p) continue;

    if ((currentChunk.length + p.length + 1) <= chunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + p;
    } else {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }

      // If a single paragraph is longer than chunkSize, split it by sentences
      if (p.length > chunkSize) {
        const sentences = p.split(/(?<=[.?!])\s+/);
        let subChunk = '';
        for (const s of sentences) {
          if ((subChunk.length + s.length + 1) <= chunkSize) {
            subChunk += (subChunk ? ' ' : '') + s;
          } else {
            if (subChunk.trim()) chunks.push(subChunk.trim());
            subChunk = s;
          }
        }
        currentChunk = subChunk;
      } else {
        // Keep overlap from end of previous chunk if possible
        const overlapSlice = currentChunk.slice(-chunkOverlap);
        currentChunk = (overlapSlice ? overlapSlice + ' ' : '') + p;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // Map to structured chunk objects with indices and metadata
  return chunks.map((chunk, idx) => ({
    chunkIndex: idx + 1,
    content: chunk,
    metadata: {
      ...metadata,
      length: chunk.length,
    },
  }));
}

/**
 * Indexes a document: extracts text, chunks it, generates local embeddings, and persists.
 */
export async function indexDocument({
  buffer,
  fileName,
  mimeType,
  userId = 'anonymous',
  workspaceId = 'default',
  threadId = null,
}) {
  const docId = `doc_${crypto.randomUUID().slice(0, 12)}`;
  console.log(`[rag] Processing document: "${fileName}" (${buffer?.length || 0} bytes) for thread: ${threadId || 'general'}`);

  const { text, fileType, sections } = await extractTextFromFile({ buffer, fileName, mimeType });

  if (!text || text.trim().length === 0) {
    throw new Error(`No extractable text found in file "${fileName}".`);
  }

  // Chunk text
  const rawChunks = [];
  if (sections && sections.length > 1) {
    // Multi-section document (e.g. slides or pages)
    sections.forEach((sec, sIdx) => {
      const secChunks = chunkText(sec.text, { ...sec.metadata, section: sec.title }, { chunkSize: 500, chunkOverlap: 50 });
      rawChunks.push(...secChunks);
    });
  } else {
    rawChunks.push(...chunkText(text, { fileName }, { chunkSize: 500, chunkOverlap: 60 }));
  }

  console.log(`[rag] Created ${rawChunks.length} text chunks for "${fileName}". Generating 384-d local embeddings...`);
  const startEmbed = Date.now();

  const store = loadRagStore();
  const chunkRecords = [];

  for (let i = 0; i < rawChunks.length; i++) {
    const item = rawChunks[i];
    const embedding = await generateEmbedding(item.content);

    chunkRecords.push({
      id: `chk_${docId}_${i + 1}`,
      documentId: docId,
      chunkIndex: i + 1,
      content: item.content,
      embedding,
      metadata: {
        ...item.metadata,
        fileName,
        fileType,
      },
    });
  }

  console.log(`[rag] Generated ${chunkRecords.length} embeddings in ${Date.now() - startEmbed}ms!`);

  const docRecord = {
    id: docId,
    userId,
    workspaceId,
    threadId,
    fileName,
    fileSize: buffer.length,
    fileType,
    mimeType,
    totalChunks: chunkRecords.length,
    status: 'ready',
    createdAt: new Date().toISOString(),
  };

  store.documents.push(docRecord);
  store.chunks.push(...chunkRecords);
  saveRagStore(store);

  return docRecord;
}

/**
 * Performs cosine similarity search across indexed document chunks.
 */
export async function searchRelevantChunks({
  query,
  userId = null,
  workspaceId = null,
  threadId = null,
  documentId = null,
  limit = 2,
  threshold = 0.40,
}) {
  if (!query || typeof query !== 'string' || !query.trim()) return [];

  const store = loadRagStore();
  if (store.chunks.length === 0) return [];

  // Filter chunks by thread / user / document scope
  let candidateChunks = store.chunks;

  if (documentId) {
    candidateChunks = candidateChunks.filter(c => c.documentId === documentId);
  } else if (threadId) {
    const threadDocIds = new Set(
      store.documents.filter(d => d.threadId === threadId || !d.threadId).map(d => d.id)
    );
    candidateChunks = candidateChunks.filter(c => {
      // Chat memory must match threadId exactly to prevent cross-chat mixing
      if (c.metadata?.fileType === 'chat-memory') {
        return c.metadata.threadId === threadId;
      }
      return threadDocIds.has(c.documentId);
    });
  } else {
    // When no threadId is passed, exclude all per-thread chat memories
    candidateChunks = candidateChunks.filter(c => c.metadata?.fileType !== 'chat-memory');
  }

  if (candidateChunks.length === 0) return [];

  // Generate query embedding
  const queryVec = await generateEmbedding(query);

  const scored = candidateChunks.map(chunk => {
    const similarity = cosineSimilarity(queryVec, chunk.embedding);
    return {
      chunkId: chunk.id,
      documentId: chunk.documentId,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      metadata: chunk.metadata,
      similarity,
    };
  });

  // Sort by highest cosine similarity
  scored.sort((a, b) => b.similarity - a.similarity);

  const relevant = scored.filter(s => s.similarity >= threshold).slice(0, limit);
  return relevant;
}

/**
 * Formats retrieved chunks into a clean, token-efficient context block for the LLM.
 */
export function formatRAGPromptContext(chunks = []) {
  if (!chunks || chunks.length === 0) return '';

  const docChunks = chunks.filter(c => c.metadata?.fileType !== 'chat-memory');
  const chatChunks = chunks.filter(c => c.metadata?.fileType === 'chat-memory');

  const parts = [];

  if (chatChunks.length > 0) {
    const memoryItems = chatChunks.map((c, i) => `[RECALLED TOPIC ${i + 1}]:\n${c.content}`).join('\n\n');
    parts.push(`[RECALLED CONVERSATION MEMORY]\nThe following context was recalled from earlier in this thread:\n${memoryItems}\n[END OF RECALLED CONVERSATION MEMORY]`);
  }

  if (docChunks.length > 0) {
    const excerpts = docChunks.map((c, i) => {
      const srcName = c.metadata?.fileName || 'Uploaded Document';
      const slideInfo = c.metadata?.slide ? ` (Slide ${c.metadata.slide})` : '';
      const pageInfo = c.metadata?.page ? ` (Page ${c.metadata.page})` : '';
      return `[EXCERPT ${i + 1} from "${srcName}"${slideInfo}${pageInfo} (Relevance: ${(c.similarity * 100).toFixed(0)}%)]:\n${c.content}`;
    }).join('\n\n');
    parts.push(`[DOCUMENT KNOWLEDGE CONTEXT]\nThe following excerpts from attached documents were dynamically matched:\n${excerpts}\n[END OF DOCUMENT KNOWLEDGE CONTEXT]`);
  }

  return parts.join('\n\n');
}

/**
 * Automatically indexes a completed conversation exchange into Vector DB memory for this specific thread.
 */
export async function indexChatMessage({
  threadId,
  userId = null,
  workspaceId = null,
  userPrompt,
  aiAnswer,
}) {
  if (!threadId || !userPrompt || !aiAnswer) return null;
  const cleanPrompt = String(userPrompt).trim();
  const cleanAnswer = String(aiAnswer).trim();

  // Don't index very short greetings or error responses
  if (cleanPrompt.length < 4 || cleanAnswer.length < 10) return null;
  if (/^(hello|hi|hey|thanks|thank you|ok|okay)[\s!.?]*$/i.test(cleanPrompt)) return null;
  if (cleanAnswer.includes('No response') || cleanAnswer.includes('error occurred') || cleanAnswer.includes('temporarily unavailable')) return null;

  try {
    const content = `User: ${cleanPrompt}\nAssistant: ${cleanAnswer.slice(0, 300)}`;
    const embedding = await generateEmbedding(content);

    const store = loadRagStore();
    const docId = `doc_chat_${threadId}`;

    let docRecord = store.documents.find(d => d.id === docId);
    if (!docRecord) {
      docRecord = {
        id: docId,
        userId: userId || 'anonymous',
        workspaceId: workspaceId || 'default',
        threadId,
        fileName: 'Conversation Memory',
        fileSize: 0,
        fileType: 'chat-memory',
        mimeType: 'text/chat-memory',
        totalChunks: 0,
        status: 'ready',
        createdAt: new Date().toISOString(),
      };
      store.documents.push(docRecord);
    }

    const chunkRecord = {
      id: `chk_chat_${threadId}_${Date.now()}`,
      documentId: docId,
      chunkIndex: (docRecord.totalChunks || 0) + 1,
      content,
      embedding,
      metadata: {
        fileType: 'chat-memory',
        fileName: 'Conversation Memory',
        threadId,
        timestamp: new Date().toISOString(),
      },
    };

    docRecord.totalChunks = (docRecord.totalChunks || 0) + 1;
    store.chunks.push(chunkRecord);
    saveRagStore(store);

    // Also persist to Supabase document_chunks if available
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const sbUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (sbUrl && sbKey) {
        const sb = createClient(sbUrl, sbKey);
        let { data: existingDoc } = await sb
          .from('knowledge_documents')
          .select('id')
          .eq('thread_id', threadId)
          .eq('file_type', 'chat-memory')
          .maybeSingle();

        let targetDocId = existingDoc?.id;
        if (!targetDocId) {
          const { data: newDoc } = await sb
            .from('knowledge_documents')
            .insert({
              thread_id: threadId,
              file_name: 'Conversation Memory',
              file_type: 'chat-memory',
              status: 'ready',
            })
            .select('id')
            .maybeSingle();
          targetDocId = newDoc?.id;
        }

        if (targetDocId) {
          await sb.from('document_chunks').insert({
            document_id: targetDocId,
            chunk_index: docRecord.totalChunks,
            content,
            embedding,
            metadata: { thread_id: threadId, fileType: 'chat-memory' },
          });
        }
      }
    } catch (sbErr) {
      // Local file store already persisted; Supabase sync error is non-blocking
    }

    return chunkRecord;
  } catch (err) {
    console.warn('[rag] Failed to index chat message:', err.message);
    return null;
  }
}

/**
 * Lists documents matching filter parameters.
 */
export function listDocuments({ userId = null, workspaceId = null, threadId = null } = {}) {
  const store = loadRagStore();
  let docs = store.documents;

  if (threadId) {
    docs = docs.filter(d => d.threadId === threadId || !d.threadId);
  }
  if (userId) {
    docs = docs.filter(d => d.userId === userId || d.userId === 'anonymous');
  }

  return docs.map(d => ({
    id: d.id,
    fileName: d.fileName,
    fileSize: d.fileSize,
    fileType: d.fileType,
    mimeType: d.mimeType,
    totalChunks: d.totalChunks,
    threadId: d.threadId,
    createdAt: d.createdAt,
    status: d.status,
  }));
}

/**
 * Deletes a document and all its embedded chunks.
 */
export function deleteDocument(documentId) {
  const store = loadRagStore();
  const initialDocCount = store.documents.length;
  store.documents = store.documents.filter(d => d.id !== documentId);
  store.chunks = store.chunks.filter(c => c.documentId !== documentId);
  saveRagStore(store);
  return store.documents.length < initialDocCount;
}

