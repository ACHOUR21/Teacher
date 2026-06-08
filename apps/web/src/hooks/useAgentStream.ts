'use client';

import { useState, useCallback, useRef } from 'react';

// ─── Event types (mirror backend AgentEventType) ─────────────────────────────

export type AgentPhase = 'idle' | 'thinking' | 'tool_calling' | 'responding' | 'done' | 'error';

export interface ToolCallEvent {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
}

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCallEvent[];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseAgentStreamOptions {
  getToken: () => string | null;
  baseUrl?: string;
}

export function useAgentStream({ getToken, baseUrl = '' }: UseAgentStreamOptions) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [phase, setPhase] = useState<AgentPhase>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  // Accumulate tool calls for the current assistant turn
  const pendingToolCallsRef = useRef<ToolCallEvent[]>([]);

  const send = useCallback(async (agentType: string, message: string) => {
    if (phase === 'thinking' || phase === 'tool_calling' || phase === 'responding') return;

    // Append user message immediately
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setPhase('thinking');
    setError(null);
    pendingToolCallsRef.current = [];

    const controller = new AbortController();
    abortRef.current = controller;

    // Start a new assistant message placeholder
    setMessages(prev => [...prev, { role: 'assistant', content: '', toolCalls: [] }]);

    try {
      const token = getToken();
      const res = await fetch(`${baseUrl}/ai/agents/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ agentType, message, sessionId }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const updateLastAssistant = (updater: (prev: AgentMessage) => AgentMessage) => {
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === 'assistant') {
            next[next.length - 1] = updater(last);
          }
          return next;
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let event: Record<string, unknown>;
          try {
            event = JSON.parse(line.slice(6));
          } catch {
            continue;
          }

          switch (event.type) {
            case 'status':
              setPhase(event.phase as AgentPhase);
              break;

            case 'delta':
              updateLastAssistant(msg => ({
                ...msg,
                content: msg.content + (event.text as string),
              }));
              break;

            case 'tool_call': {
              const tc: ToolCallEvent = {
                id: event.id as string,
                name: event.name as string,
                input: event.input as Record<string, unknown>,
              };
              pendingToolCallsRef.current.push(tc);
              updateLastAssistant(msg => ({
                ...msg,
                toolCalls: [...(msg.toolCalls ?? []), tc],
              }));
              break;
            }

            case 'tool_result': {
              const id = event.id as string;
              const output = event.output as string;
              pendingToolCallsRef.current = pendingToolCallsRef.current.map(tc =>
                tc.id === id ? { ...tc, output } : tc,
              );
              updateLastAssistant(msg => ({
                ...msg,
                toolCalls: (msg.toolCalls ?? []).map(tc =>
                  tc.id === id ? { ...tc, output } : tc,
                ),
              }));
              break;
            }

            case 'done':
              setSessionId(event.sessionId as string);
              setPhase('done');
              // Reset to idle quickly so next send is allowed
              setTimeout(() => setPhase('idle'), 100);
              break;

            case 'error':
              setError(event.message as string);
              setPhase('error');
              break;
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        setError((err as Error)?.message ?? 'Stream failed');
        setPhase('error');
      } else {
        setPhase('idle');
      }
    } finally {
      abortRef.current = null;
    }
  }, [phase, sessionId, getToken, baseUrl]);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setPhase('idle');
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setSessionId(null);
    setPhase('idle');
    setError(null);
  }, []);

  return { messages, phase, sessionId, error, send, abort, reset };
}
