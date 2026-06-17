/**
 * @eduai/ai — OpenAI Client
 *
 * Singleton OpenAI client with:
 *  - Automatic retry logic (3 attempts, exponential back-off)
 *  - Request timeout (60 s)
 *  - Structured error handling
 *  - Usage tracking helpers
 */

import OpenAI, { APIError, APIConnectionError, RateLimitError } from 'openai';

// ─── Singleton ────────────────────────────────────────────────────────────────

let _client: OpenAI | null = null;

/**
 * Returns the shared OpenAI client instance.
 * Initialises on first call.
 */
export function getOpenAIClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env['OPENAI_API_KEY'];
    if (!apiKey) {
      throw new Error('[eduai/ai] OPENAI_API_KEY environment variable is not set.');
    }

    _client = new OpenAI({
      apiKey,
      organization: process.env['OPENAI_ORGANIZATION'] ?? undefined,
      maxRetries: 3,
      timeout: 60_000, // 60 seconds
    });
  }
  return _client;
}

// ─── Model Constants ──────────────────────────────────────────────────────────

export const OPENAI_MODELS = {
  GPT4O: 'gpt-4o',
  GPT4O_MINI: 'gpt-4o-mini',
  EMBEDDING_LARGE: 'text-embedding-3-large',
  EMBEDDING_SMALL: 'text-embedding-3-small',
  WHISPER: 'whisper-1',
  TTS: 'tts-1',
  TTS_HD: 'tts-1-hd',
} as const;

export type OpenAIModel = (typeof OPENAI_MODELS)[keyof typeof OPENAI_MODELS];

// ─── Chat Completion ──────────────────────────────────────────────────────────

export interface ChatCompletionOptions {
  model?: string;
  messages: OpenAI.ChatCompletionMessageParam[];
  temperature?: number;
  maxTokens?: number;
  stream?: false;
  responseFormat?: OpenAI.ResponseFormatJSONObject | OpenAI.ResponseFormatText;
  /** Stop sequences that halt generation. */
  stop?: string[];
  /** User identifier for OpenAI abuse detection. */
  user?: string;
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  finishReason: string | null;
  latencyMs: number;
}

/**
 * Wrapper around `openai.chat.completions.create` with structured error
 * handling and timing.
 */
export async function createChatCompletion(
  options: ChatCompletionOptions,
): Promise<ChatCompletionResult> {
  const client = getOpenAIClient();
  const start = Date.now();

  const model = options.model ?? process.env['OPENAI_MODEL'] ?? OPENAI_MODELS.GPT4O;

  try {
    const response = await client.chat.completions.create({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stop: options.stop,
      user: options.user,
      response_format: options.responseFormat,
      stream: false,
    });

    const choice = response.choices[0];
    if (!choice) {
      throw new OpenAIServiceError('No choices returned from OpenAI.', 'NO_CHOICES');
    }

    return {
      content: choice.message.content ?? '',
      model: response.model,
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
      totalTokens: response.usage?.total_tokens ?? 0,
      finishReason: choice.finish_reason,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    throw mapOpenAIError(err);
  }
}

// ─── Streaming Chat ───────────────────────────────────────────────────────────

export interface StreamChatOptions extends Omit<ChatCompletionOptions, 'stream'> {
  /** Called on each text delta. */
  onDelta: (delta: string) => void | Promise<void>;
  /** Called when the stream completes with total usage. */
  onComplete?: (usage: { promptTokens: number; completionTokens: number }) => void | Promise<void>;
}

/**
 * Streams a chat completion, calling `onDelta` for each incremental token.
 */
export async function streamChatCompletion(options: StreamChatOptions): Promise<void> {
  const client = getOpenAIClient();
  const model = options.model ?? process.env['OPENAI_MODEL'] ?? OPENAI_MODELS.GPT4O;

  try {
    const stream = await client.chat.completions.create({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stop: options.stop,
      user: options.user,
      stream: true,
    });

    let promptTokens = 0;
    let completionTokens = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        await options.onDelta(delta);
      }
      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens ?? 0;
        completionTokens = chunk.usage.completion_tokens ?? 0;
      }
    }

    await options.onComplete?.({ promptTokens, completionTokens });
  } catch (err) {
    throw mapOpenAIError(err);
  }
}

// ─── Embeddings ───────────────────────────────────────────────────────────────

export interface CreateEmbeddingsOptions {
  input: string | string[];
  model?: string;
  /** Number of dimensions for the returned vector (text-embedding-3 only). */
  dimensions?: number;
  user?: string;
}

export interface EmbeddingResult {
  embedding: number[];
  index: number;
  totalTokens: number;
}

/**
 * Creates vector embeddings for the given text(s).
 */
export async function createEmbeddings(options: CreateEmbeddingsOptions): Promise<EmbeddingResult[]> {
  const client = getOpenAIClient();
  const model =
    options.model ?? process.env['OPENAI_EMBEDDING_MODEL'] ?? OPENAI_MODELS.EMBEDDING_LARGE;

  try {
    const response = await client.embeddings.create({
      model,
      input: options.input,
      dimensions: options.dimensions,
      user: options.user,
      encoding_format: 'float',
    });

    return response.data.map((item) => ({
      embedding: item.embedding,
      index: item.index,
      totalTokens: response.usage.total_tokens,
    }));
  } catch (err) {
    throw mapOpenAIError(err);
  }
}

// ─── Audio: Speech-to-Text ────────────────────────────────────────────────────

export interface TranscribeAudioOptions {
  /** Audio file as a Blob, Buffer, or File. */
  file: File | Blob;
  fileName: string;
  language?: string;
  prompt?: string;
  /** 'json' | 'text' | 'srt' | 'vtt' | 'verbose_json' */
  responseFormat?: 'json' | 'text' | 'srt' | 'vtt' | 'verbose_json';
}

export async function transcribeAudio(
  options: TranscribeAudioOptions,
): Promise<{ text: string; language?: string; duration?: number }> {
  const client = getOpenAIClient();

  try {
    const file = new File([options.file], options.fileName);
    const response = await client.audio.transcriptions.create({
      model: OPENAI_MODELS.WHISPER,
      file,
      language: options.language,
      prompt: options.prompt,
      response_format: options.responseFormat ?? 'verbose_json',
    });

    if (typeof response === 'string') {
      return { text: response };
    }

    return {
      text: response.text,
      language: (response as unknown as Record<string, string>)['language'],
      duration: (response as unknown as Record<string, number>)['duration'],
    };
  } catch (err) {
    throw mapOpenAIError(err);
  }
}

// ─── Error Handling ───────────────────────────────────────────────────────────

export class OpenAIServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'OpenAIServiceError';
  }
}

function mapOpenAIError(err: unknown): OpenAIServiceError {
  if (err instanceof OpenAIServiceError) return err;

  if (err instanceof RateLimitError) {
    return new OpenAIServiceError(
      'OpenAI rate limit exceeded. Please try again later.',
      'RATE_LIMIT',
      429,
    );
  }

  if (err instanceof APIConnectionError) {
    return new OpenAIServiceError(
      'Could not connect to OpenAI API. Check network connectivity.',
      'CONNECTION_ERROR',
    );
  }

  if (err instanceof APIError) {
    return new OpenAIServiceError(
      err.message,
      `OPENAI_${err.code ?? 'UNKNOWN'}`,
      err.status,
    );
  }

  if (err instanceof Error) {
    return new OpenAIServiceError(err.message, 'UNKNOWN');
  }

  return new OpenAIServiceError('An unknown error occurred.', 'UNKNOWN');
}
