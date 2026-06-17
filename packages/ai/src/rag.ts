/**
 * @eduai/ai — RAG (Retrieval-Augmented Generation) Utilities
 *
 * Provides:
 *  - Text chunking with configurable overlap
 *  - Embedding creation via OpenAI
 *  - Cosine similarity calculation
 *  - Abstract similarity search interface for pluggable vector stores
 *  - Context assembly for RAG prompts
 */

import { createEmbeddings } from './openai.js';

// ─── Text Chunking ────────────────────────────────────────────────────────────

export interface ChunkOptions {
  /** Target number of characters per chunk. */
  chunkSize?: number;
  /** Number of overlapping characters between consecutive chunks. */
  overlapSize?: number;
  /** Separator strategy. Defaults to recursive splitting. */
  separators?: string[];
}

export interface TextChunk {
  text: string;
  index: number;
  /** Character offset of the chunk start in the original document. */
  startOffset: number;
  /** Character offset of the chunk end. */
  endOffset: number;
  /** Estimated token count (characters / 4). */
  estimatedTokens: number;
}

/**
 * Splits `text` into overlapping chunks using a recursive separator strategy
 * similar to LangChain's RecursiveCharacterTextSplitter.
 *
 * @param text       Source document text.
 * @param options    Chunking configuration.
 * @returns          Array of text chunks with position metadata.
 */
export function chunkText(text: string, options: ChunkOptions = {}): TextChunk[] {
  const chunkSize = options.chunkSize ?? 1500;
  const overlapSize = options.overlapSize ?? 200;
  const separators = options.separators ?? ['\n\n', '\n', '. ', ' ', ''];

  const rawChunks = recursiveSplit(text, separators, chunkSize);
  const chunks: TextChunk[] = [];

  let offset = 0;
  let index = 0;

  // Merge very short splits and apply overlap
  const merged = mergeChunks(rawChunks, chunkSize, overlapSize);

  for (const chunk of merged) {
    const startOffset = text.indexOf(chunk, offset);
    const safeStart = startOffset === -1 ? offset : startOffset;
    const endOffset = safeStart + chunk.length;

    chunks.push({
      text: chunk,
      index: index++,
      startOffset: safeStart,
      endOffset,
      estimatedTokens: Math.ceil(chunk.length / 4),
    });

    offset = Math.max(0, endOffset - overlapSize);
  }

  return chunks;
}

function recursiveSplit(text: string, separators: string[], chunkSize: number): string[] {
  if (text.length <= chunkSize) return [text];

  const [separator, ...remainingSeparators] = separators;

  if (separator === undefined || separator === '') {
    // Final fallback: hard split by character count
    const parts: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      parts.push(text.slice(i, i + chunkSize));
    }
    return parts;
  }

  const splits = text.split(separator).filter(Boolean);

  const result: string[] = [];
  for (const split of splits) {
    if (split.length <= chunkSize) {
      result.push(split);
    } else {
      result.push(...recursiveSplit(split, remainingSeparators, chunkSize));
    }
  }
  return result;
}

function mergeChunks(parts: string[], chunkSize: number, overlapSize: number): string[] {
  const chunks: string[] = [];
  let current = '';

  for (const part of parts) {
    if (current.length + part.length + 1 <= chunkSize) {
      current = current ? `${current} ${part}` : part;
    } else {
      if (current) chunks.push(current);
      // Start new chunk with overlap from the end of the previous chunk
      const overlap = current.slice(-overlapSize);
      current = overlap ? `${overlap} ${part}` : part;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

// ─── Embeddings ───────────────────────────────────────────────────────────────

export interface EmbeddedChunk extends TextChunk {
  embedding: number[];
  /** The document / source ID this chunk belongs to. */
  documentId: string;
  /** Human-readable metadata for citation and retrieval display. */
  metadata?: ChunkMetadata;
}

export interface ChunkMetadata {
  sourceTitle?: string;
  sourceUrl?: string;
  author?: string;
  publishedAt?: string;
  courseId?: string;
  lessonId?: string;
  pageNumber?: number;
}

/**
 * Embeds an array of text chunks using OpenAI's embedding model.
 * Processes in batches of 100 to respect the API limits.
 */
export async function embedChunks(
  chunks: TextChunk[],
  documentId: string,
  metadata?: ChunkMetadata,
): Promise<EmbeddedChunk[]> {
  const BATCH_SIZE = 100;
  const embeddedChunks: EmbeddedChunk[] = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map((c) => c.text);

    const results = await createEmbeddings({ input: texts, dimensions: 3072 });

    for (let j = 0; j < batch.length; j++) {
      const embResult = results[j];
      const chunk = batch[j];
      if (!embResult || !chunk) continue;

      embeddedChunks.push({
        ...chunk,
        embedding: embResult.embedding,
        documentId,
        metadata,
      });
    }
  }

  return embeddedChunks;
}

// ─── Similarity ───────────────────────────────────────────────────────────────

/**
 * Computes cosine similarity between two equal-length vectors.
 * Returns a value in [-1, 1] where 1 = identical direction.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dotProduct += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

// ─── Vector Store Interface ───────────────────────────────────────────────────

export interface SimilaritySearchResult {
  chunk: EmbeddedChunk;
  score: number;
}

export interface VectorStoreQuery {
  /** The query text. Will be embedded before searching. */
  query: string;
  /** Pre-computed query embedding (skips embedding step). */
  queryEmbedding?: number[];
  /** Maximum number of results to return. */
  topK?: number;
  /** Minimum cosine similarity score (0–1). */
  minScore?: number;
  /** Restrict results to a specific document. */
  documentId?: string;
  /** Restrict results to a specific tenant. */
  tenantId?: string;
  /** Restrict results to chunks belonging to a specific course. */
  courseId?: string;
}

/**
 * Abstract interface that all vector store adapters must implement.
 * Concrete implementations exist for Qdrant, Pinecone, and in-memory stores.
 */
export interface VectorStore {
  /**
   * Upserts embedded chunks into the vector store.
   * @param chunks  Chunks with embedding vectors.
   * @param tenantId  Namespace / collection owner.
   */
  upsert(chunks: EmbeddedChunk[], tenantId: string): Promise<void>;

  /**
   * Searches for the most semantically similar chunks.
   */
  search(query: VectorStoreQuery): Promise<SimilaritySearchResult[]>;

  /**
   * Deletes all chunks belonging to a document.
   */
  deleteDocument(documentId: string, tenantId: string): Promise<void>;

  /**
   * Deletes all vectors for a tenant (e.g., on account deletion).
   */
  deleteTenant(tenantId: string): Promise<void>;
}

// ─── In-Memory Vector Store (for tests / development) ─────────────────────────

/**
 * Simple in-memory vector store backed by brute-force cosine similarity.
 * Not suitable for production — use Qdrant or Pinecone in real deployments.
 */
export class InMemoryVectorStore implements VectorStore {
  private readonly store = new Map<string, EmbeddedChunk[]>();

  async upsert(chunks: EmbeddedChunk[], tenantId: string): Promise<void> {
    const key = tenantId;
    const existing = this.store.get(key) ?? [];

    // Replace any existing chunks with the same documentId
    const filtered = existing.filter(
      (c) => !chunks.some((nc) => nc.documentId === c.documentId && nc.index === c.index),
    );

    this.store.set(key, [...filtered, ...chunks]);
  }

  async search(query: VectorStoreQuery): Promise<SimilaritySearchResult[]> {
    const tenantId = query.tenantId ?? '__global__';
    const candidates = this.store.get(tenantId) ?? [];
    const topK = query.topK ?? 5;
    const minScore = query.minScore ?? 0.7;

    let queryEmbedding = query.queryEmbedding;
    if (!queryEmbedding) {
      const results = await createEmbeddings({ input: query.query, dimensions: 3072 });
      queryEmbedding = results[0]?.embedding ?? [];
    }

    const scored: SimilaritySearchResult[] = candidates
      .filter((c) => !query.documentId || c.documentId === query.documentId)
      .filter((c) => !query.courseId || c.metadata?.courseId === query.courseId)
      .map((chunk) => ({
        chunk,
        score: cosineSimilarity(queryEmbedding as number[], chunk.embedding),
      }))
      .filter((r) => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored;
  }

  async deleteDocument(documentId: string, tenantId: string): Promise<void> {
    const existing = this.store.get(tenantId) ?? [];
    this.store.set(
      tenantId,
      existing.filter((c) => c.documentId !== documentId),
    );
  }

  async deleteTenant(tenantId: string): Promise<void> {
    this.store.delete(tenantId);
  }
}

// ─── RAG Context Assembly ─────────────────────────────────────────────────────

export interface RagContext {
  /** Assembled context string to inject into the system/user prompt. */
  context: string;
  /** The retrieved chunks in score order. */
  sources: SimilaritySearchResult[];
  /** Total estimated tokens in the context block. */
  estimatedTokens: number;
}

/**
 * Retrieves relevant chunks and assembles a formatted context block
 * suitable for injection into a RAG prompt.
 *
 * @param store    Configured vector store.
 * @param query    Search parameters.
 * @param maxTokens  Cap on context tokens (default 3000).
 */
export async function assembleRagContext(
  store: VectorStore,
  query: VectorStoreQuery,
  maxTokens = 3000,
): Promise<RagContext> {
  const results = await store.search(query);

  let context = '';
  let estimatedTokens = 0;
  const included: SimilaritySearchResult[] = [];

  for (const result of results) {
    const chunkTokens = result.chunk.estimatedTokens;
    if (estimatedTokens + chunkTokens > maxTokens) break;

    const sourceLabel = result.chunk.metadata?.sourceTitle
      ? `[Source: ${result.chunk.metadata.sourceTitle}]`
      : `[Document: ${result.chunk.documentId}, Chunk: ${result.chunk.index}]`;

    context += `\n\n${sourceLabel}\n${result.chunk.text}`;
    estimatedTokens += chunkTokens;
    included.push(result);
  }

  return {
    context: context.trim(),
    sources: included,
    estimatedTokens,
  };
}
