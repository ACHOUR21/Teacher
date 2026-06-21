'use client';
import { useState, useCallback, useRef } from 'react';
export function useAgentStream({ getToken, baseUrl = '' }) {
    const [messages, setMessages] = useState([]);
    const [phase, setPhase] = useState('idle');
    const [sessionId, setSessionId] = useState(null);
    const [error, setError] = useState(null);
    const abortRef = useRef(null);
    // Accumulate tool calls for the current assistant turn
    const pendingToolCallsRef = useRef([]);
    const send = useCallback(async (agentType, message) => {
        if (phase === 'thinking' || phase === 'tool_calling' || phase === 'responding') {
            return;
        }
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
            const updateLastAssistant = (updater) => {
                setMessages(prev => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last?.role === 'assistant') {
                        next[next.length - 1] = updater(last);
                    }
                    return next;
                });
            };
            let streamDone = false;
            while (!streamDone) {
                const { done, value } = await reader.read();
                if (done) {
                    streamDone = true;
                    break;
                }
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';
                for (const line of lines) {
                    if (!line.startsWith('data: ')) {
                        continue;
                    }
                    let event;
                    try {
                        event = JSON.parse(line.slice(6));
                    }
                    catch {
                        continue;
                    }
                    switch (event.type) {
                        case 'status':
                            setPhase(event.phase);
                            break;
                        case 'delta':
                            updateLastAssistant(msg => ({
                                ...msg,
                                content: msg.content + event.text,
                            }));
                            break;
                        case 'tool_call': {
                            const tc = {
                                id: event.id,
                                name: event.name,
                                input: event.input,
                            };
                            pendingToolCallsRef.current.push(tc);
                            updateLastAssistant(msg => ({
                                ...msg,
                                toolCalls: [...(msg.toolCalls ?? []), tc],
                            }));
                            break;
                        }
                        case 'tool_result': {
                            const id = event.id;
                            const output = event.output;
                            pendingToolCallsRef.current = pendingToolCallsRef.current.map(tc => tc.id === id ? { ...tc, output } : tc);
                            updateLastAssistant(msg => ({
                                ...msg,
                                toolCalls: (msg.toolCalls ?? []).map(tc => tc.id === id ? { ...tc, output } : tc),
                            }));
                            break;
                        }
                        case 'done':
                            setSessionId(event.sessionId);
                            setPhase('done');
                            // Reset to idle quickly so next send is allowed
                            setTimeout(() => setPhase('idle'), 100);
                            break;
                        case 'error':
                            setError(event.message);
                            setPhase('error');
                            break;
                    }
                }
            }
        }
        catch (err) {
            if (err?.name !== 'AbortError') {
                setError(err?.message ?? 'Stream failed');
                setPhase('error');
            }
            else {
                setPhase('idle');
            }
        }
        finally {
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
