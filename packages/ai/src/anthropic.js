/**
 * @eduai/ai — Anthropic Claude Client
 *
 * Singleton Anthropic client with:
 *  - Automatic retry (3 attempts)
 *  - 90-second timeout (Claude often produces long completions)
 *  - Structured error mapping
 *  - Streaming support
 */
import Anthropic, { APIConnectionError, APIError, RateLimitError, } from '@anthropic-ai/sdk';
// ─── Singleton ────────────────────────────────────────────────────────────────
let _client = null;
/**
 * Returns the shared Anthropic client instance.
 * Initialises lazily on first call.
 */
export function getAnthropicClient() {
    if (!_client) {
        const apiKey = process.env['ANTHROPIC_API_KEY'];
        if (!apiKey) {
            throw new Error('[eduai/ai] ANTHROPIC_API_KEY environment variable is not set.');
        }
        _client = new Anthropic({
            apiKey,
            maxRetries: 3,
            timeout: 90_000, // 90 seconds
        });
    }
    return _client;
}
// ─── Model Constants ──────────────────────────────────────────────────────────
export const ANTHROPIC_MODELS = {
    CLAUDE_SONNET: 'claude-sonnet-4-6',
    CLAUDE_HAIKU: 'claude-haiku-4-5',
    /** Use this for long-context tasks (200k token window). */
    CLAUDE_SONNET_LONG: 'claude-sonnet-4-6',
};
/**
 * Creates a single-turn message with Claude.
 */
export async function createAnthropicMessage(options) {
    const client = getAnthropicClient();
    const start = Date.now();
    const model = options.model ?? process.env['ANTHROPIC_MODEL'] ?? ANTHROPIC_MODELS.CLAUDE_SONNET;
    const maxTokens = options.maxTokens ?? 8192;
    try {
        const response = await client.messages.create({
            model,
            system: options.system,
            messages: options.messages,
            max_tokens: maxTokens,
            temperature: options.temperature ?? 0.7,
            stop_sequences: options.stopSequences,
            metadata: options.userId ? { user_id: options.userId } : undefined,
        });
        const textBlock = response.content.find((b) => b.type === 'text');
        return {
            content: textBlock?.text ?? '',
            blocks: response.content,
            model: response.model,
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            totalTokens: response.usage.input_tokens + response.usage.output_tokens,
            stopReason: response.stop_reason,
            latencyMs: Date.now() - start,
        };
    }
    catch (err) {
        throw mapAnthropicError(err);
    }
}
/**
 * Streams a Claude response, calling `onDelta` for each incremental token.
 */
export async function streamAnthropicMessage(options) {
    const client = getAnthropicClient();
    const model = options.model ?? process.env['ANTHROPIC_MODEL'] ?? ANTHROPIC_MODELS.CLAUDE_SONNET;
    try {
        const stream = client.messages.stream({
            model,
            system: options.system,
            messages: options.messages,
            max_tokens: options.maxTokens ?? 8192,
            temperature: options.temperature ?? 0.7,
            stop_sequences: options.stopSequences,
            metadata: options.userId ? { user_id: options.userId } : undefined,
        });
        for await (const event of stream) {
            if (event.type === 'content_block_delta' &&
                event.delta.type === 'text_delta') {
                await options.onDelta(event.delta.text);
            }
        }
        const finalMessage = await stream.finalMessage();
        await options.onComplete?.({
            inputTokens: finalMessage.usage.input_tokens,
            outputTokens: finalMessage.usage.output_tokens,
        });
    }
    catch (err) {
        throw mapAnthropicError(err);
    }
}
// ─── Tool-use helper ──────────────────────────────────────────────────────────
/**
 * Extracts any tool-use blocks from the response content.
 */
export function extractToolUseBlocks(blocks) {
    return blocks.filter((b) => b.type === 'tool_use');
}
/**
 * Creates a message with Claude's extended thinking enabled.
 * Useful for math, logic puzzles, and complex curriculum planning.
 */
export async function createAnthropicThinkingMessage(options) {
    const client = getAnthropicClient();
    const start = Date.now();
    const model = options.model ?? ANTHROPIC_MODELS.CLAUDE_SONNET;
    const budget = options.thinkingBudgetTokens;
    // maxTokens must exceed the thinking budget
    const maxTokens = Math.max(options.maxTokens ?? 16_000, budget + 1024);
    try {
        const response = await client.messages.create({
            model,
            system: options.system,
            messages: options.messages,
            max_tokens: maxTokens,
            temperature: 1, // required for extended thinking
            thinking: {
                type: 'enabled',
                budget_tokens: budget,
            },
        });
        const textBlock = response.content.find((b) => b.type === 'text');
        const thinkingBlock = response.content.find((b) => b.type === 'thinking');
        return {
            content: textBlock?.text ?? '',
            thinkingContent: thinkingBlock?.thinking ?? '',
            blocks: response.content,
            model: response.model,
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            totalTokens: response.usage.input_tokens + response.usage.output_tokens,
            stopReason: response.stop_reason,
            latencyMs: Date.now() - start,
        };
    }
    catch (err) {
        throw mapAnthropicError(err);
    }
}
// ─── Error Handling ───────────────────────────────────────────────────────────
export class AnthropicServiceError extends Error {
    constructor(message, code, statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'AnthropicServiceError';
    }
}
function mapAnthropicError(err) {
    if (err instanceof AnthropicServiceError)
        {return err;}
    if (err instanceof RateLimitError) {
        return new AnthropicServiceError('Anthropic rate limit exceeded. Please try again later.', 'RATE_LIMIT', 429);
    }
    if (err instanceof APIConnectionError) {
        return new AnthropicServiceError('Could not connect to Anthropic API. Check network connectivity.', 'CONNECTION_ERROR');
    }
    if (err instanceof APIError) {
        return new AnthropicServiceError(err.message, `ANTHROPIC_${String(err.status ?? 'UNKNOWN')}`, err.status);
    }
    if (err instanceof Error) {
        return new AnthropicServiceError(err.message, 'UNKNOWN');
    }
    return new AnthropicServiceError('An unknown error occurred.', 'UNKNOWN');
}
