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
/**
 * Splits `text` into overlapping chunks using a recursive separator strategy
 * similar to LangChain's RecursiveCharacterTextSplitter.
 *
 * @param text       Source document text.
 * @param options    Chunking configuration.
 * @returns          Array of text chunks with position metadata.
 */
export function chunkText(text, options = {}) {
    const chunkSize = options.chunkSize ?? 1500;
    const overlapSize = options.overlapSize ?? 200;
    const separators = options.separators ?? ['\n\n', '\n', '. ', ' ', ''];
    const rawChunks = recursiveSplit(text, separators, chunkSize);
    const chunks = [];
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
function recursiveSplit(text, separators, chunkSize) {
    if (text.length <= chunkSize)
        {return [text];}
    const [separator, ...remainingSeparators] = separators;
    if (separator === undefined || separator === '') {
        // Final fallback: hard split by character count
        const parts = [];
        for (let i = 0; i < text.length; i += chunkSize) {
            parts.push(text.slice(i, i + chunkSize));
        }
        return parts;
    }
    const splits = text.split(separator).filter(Boolean);
    const result = [];
    for (const split of splits) {
        if (split.length <= chunkSize) {
            result.push(split);
        }
        else {
            result.push(...recursiveSplit(split, remainingSeparators, chunkSize));
        }
    }
    return result;
}
function mergeChunks(parts, chunkSize, overlapSize) {
    const chunks = [];
    let current = '';
    for (const part of parts) {
        if (current.length + part.length + 1 <= chunkSize) {
            current = current ? `${current} ${part}` : part;
        }
        else {
            if (current)
                {chunks.push(current);}
            // Start new chunk with overlap from the end of the previous chunk
            const overlap = current.slice(-overlapSize);
            current = overlap ? `${overlap} ${part}` : part;
        }
    }
    if (current)
        {chunks.push(current);}
    return chunks;
}
/**
 * Embeds an array of text chunks using OpenAI's embedding model.
 * Processes in batches of 100 to respect the API limits.
 */
export async function embedChunks(chunks, documentId, metadata) {
    const BATCH_SIZE = 100;
    const embeddedChunks = [];
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const texts = batch.map((c) => c.text);
        const results = await createEmbeddings({ input: texts, dimensions: 3072 });
        for (let j = 0; j < batch.length; j++) {
            const embResult = results[j];
            const chunk = batch[j];
            if (!embResult || !chunk)
                {continue;}
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
export function cosineSimilarity(a, b) {
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
    if (denominator === 0)
        {return 0;}
    return dotProduct / denominator;
}
// ─── In-Memory Vector Store (for tests / development) ─────────────────────────
/**
 * Simple in-memory vector store backed by brute-force cosine similarity.
 * Not suitable for production — use Qdrant or Pinecone in real deployments.
 */
export class InMemoryVectorStore {
    store = new Map();
    async upsert(chunks, tenantId) {
        const key = tenantId;
        const existing = this.store.get(key) ?? [];
        // Replace any existing chunks with the same documentId
        const filtered = existing.filter((c) => !chunks.some((nc) => nc.documentId === c.documentId && nc.index === c.index));
        this.store.set(key, [...filtered, ...chunks]);
    }
    async search(query) {
        const tenantId = query.tenantId ?? '__global__';
        const candidates = this.store.get(tenantId) ?? [];
        const topK = query.topK ?? 5;
        const minScore = query.minScore ?? 0.7;
        let queryEmbedding = query.queryEmbedding;
        if (!queryEmbedding) {
            const results = await createEmbeddings({ input: query.query, dimensions: 3072 });
            queryEmbedding = results[0]?.embedding ?? [];
        }
        const scored = candidates
            .filter((c) => !query.documentId || c.documentId === query.documentId)
            .filter((c) => !query.courseId || c.metadata?.courseId === query.courseId)
            .map((chunk) => ({
            chunk,
            score: cosineSimilarity(queryEmbedding, chunk.embedding),
        }))
            .filter((r) => r.score >= minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
        return scored;
    }
    async deleteDocument(documentId, tenantId) {
        const existing = this.store.get(tenantId) ?? [];
        this.store.set(tenantId, existing.filter((c) => c.documentId !== documentId));
    }
    async deleteTenant(tenantId) {
        this.store.delete(tenantId);
    }
}
/**
 * Retrieves relevant chunks and assembles a formatted context block
 * suitable for injection into a RAG prompt.
 *
 * @param store    Configured vector store.
 * @param query    Search parameters.
 * @param maxTokens  Cap on context tokens (default 3000).
 */
export async function assembleRagContext(store, query, maxTokens = 3000) {
    const results = await store.search(query);
    let context = '';
    let estimatedTokens = 0;
    const included = [];
    for (const result of results) {
        const chunkTokens = result.chunk.estimatedTokens;
        if (estimatedTokens + chunkTokens > maxTokens)
            {break;}
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
