/**
 * @eduai/ai — Public API
 *
 * Exports all AI client utilities, RAG pipeline functions,
 * and education-domain system prompts.
 */

// ─── OpenAI ───────────────────────────────────────────────────────────────────
export {
  getOpenAIClient,
  createChatCompletion,
  streamChatCompletion,
  createEmbeddings,
  transcribeAudio,
  OpenAIServiceError,
  OPENAI_MODELS,
} from './openai.js';
export type {
  ChatCompletionOptions,
  ChatCompletionResult,
  StreamChatOptions,
  CreateEmbeddingsOptions,
  EmbeddingResult,
  TranscribeAudioOptions,
  OpenAIModel,
} from './openai.js';

// ─── Anthropic ────────────────────────────────────────────────────────────────
export {
  getAnthropicClient,
  createAnthropicMessage,
  streamAnthropicMessage,
  createAnthropicThinkingMessage,
  extractToolUseBlocks,
  AnthropicServiceError,
  ANTHROPIC_MODELS,
} from './anthropic.js';
export type {
  AnthropicChatOptions,
  AnthropicCompletionResult,
  AnthropicStreamOptions,
  AnthropicThinkingOptions,
  AnthropicModel,
} from './anthropic.js';

// ─── RAG ──────────────────────────────────────────────────────────────────────
export {
  chunkText,
  embedChunks,
  cosineSimilarity,
  assembleRagContext,
  InMemoryVectorStore,
} from './rag.js';
export type {
  ChunkOptions,
  TextChunk,
  EmbeddedChunk,
  ChunkMetadata,
  SimilaritySearchResult,
  VectorStoreQuery,
  VectorStore,
  RagContext,
} from './rag.js';

// ─── Education Prompts ────────────────────────────────────────────────────────
export {
  getSystemPrompt,
  aiTutorSystemPrompt,
  aiHomeworkAssistantSystemPrompt,
  aiExamGeneratorSystemPrompt,
  aiLessonGeneratorSystemPrompt,
  aiCurriculumGeneratorSystemPrompt,
  aiFlashcardsSystemPrompt,
  aiMindMapSystemPrompt,
  aiResearchAssistantSystemPrompt,
  aiTranslatorSystemPrompt,
  aiSpeechToTextSystemPrompt,
  aiTextToSpeechSystemPrompt,
  aiRecommendationSystemPrompt,
  aiCareerAdvisorSystemPrompt,
  aiPerformancePredictionSystemPrompt,
  aiDropoutPredictionSystemPrompt,
  aiContentModerationSystemPrompt,
  aiPlagiarismDetectionSystemPrompt,
} from './prompts/education.js';
export type { PromptContext } from './prompts/education.js';
