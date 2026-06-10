'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Send, Sparkles, ChevronRight, Square } from 'lucide-react';
import { useEffect, useRef , useState } from 'react';

import { AgentToolCallCard } from '@/components/ai/AgentToolCallCard';
import { useAgentStream, type AgentMessage } from '@/hooks/useAgentStream';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Agent {
  type: string;
  name: string;
  description: string;
  icon: string;
}

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

function getStoredToken() {
  if (typeof window === 'undefined') {return null;}
  return localStorage.getItem('accessToken');
}

// ─── Phase indicator ──────────────────────────────────────────────────────────

const PHASE_LABELS: Record<string, string> = {
  thinking:     'Thinking…',
  tool_calling: 'Using tools…',
  responding:   'Responding…',
};

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, agentIcon }: { msg: AgentMessage; agentIcon: string }) {
  if (msg.role === 'user') {
    return (
      <div className="flex items-end gap-3 justify-end">
        <div className="max-w-[70%] rounded-2xl rounded-br-sm px-4 py-3 bg-blue-600 text-white">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-3 justify-start">
      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg flex-shrink-0">
        {agentIcon}
      </div>
      <div className="max-w-[75%] space-y-2">
        {/* Tool calls rendered above the text */}
        {(msg.toolCalls ?? []).map(tc => (
          <AgentToolCallCard key={tc.id} toolCall={tc} />
        ))}
        {msg.content && (
          <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-white border border-gray-200 shadow-sm">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-900">{msg.content}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AiAgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['ai-agents'],
    queryFn: () => api.get('/ai/agents').then(r => r.data.data as Agent[]),
  });

  const { messages, phase, error, send, abort, reset } = useAgentStream({
    getToken: getStoredToken,
    baseUrl: API_BASE,
  });

  const isStreaming = phase === 'thinking' || phase === 'tool_calling' || phase === 'responding';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, phase]);

  const handleSend = () => {
    if (!draft.trim() || isStreaming || !selectedAgent) {return;}
    const msg = draft.trim();
    setDraft('');
    send(selectedAgent.type, msg);
  };

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    reset();
  };

  // ── Agent selection screen ──────────────────────────────────────────────────

  if (!selectedAgent) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" /> AI Agents Platform
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Specialized AI agents with real-time tool-use and streaming responses
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map(agent => (
              <button
                key={agent.type}
                onClick={() => handleSelectAgent(agent)}
                className="group bg-white rounded-2xl border border-gray-200 p-6 text-left hover:border-purple-300 hover:shadow-md transition-all"
              >
                <div className="text-3xl mb-3">{agent.icon}</div>
                <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                  {agent.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{agent.description}</p>
                <div className="mt-4 flex items-center gap-1 text-xs text-purple-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Start chatting <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Chat screen ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-64px-48px)] -mx-6 -mt-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => { setSelectedAgent(null); reset(); }}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </button>
        <span className="text-2xl">{selectedAgent.icon}</span>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{selectedAgent.name}</p>
          <p className="text-xs text-gray-500">{selectedAgent.description}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isStreaming ? (
            <>
              <span className="text-xs text-purple-600 font-medium">
                {PHASE_LABELS[phase] ?? 'Working…'}
              </span>
              <button
                onClick={abort}
                title="Stop"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </button>
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <span className="text-xs text-gray-500">Ready</span>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-4">{selectedAgent.icon}</div>
            <h3 className="font-semibold text-gray-800 text-lg">{selectedAgent.name}</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-sm leading-relaxed">
              {selectedAgent.description}
            </p>
            <p className="text-xs text-gray-400 mt-4">How can I help you today?</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} agentIcon={selectedAgent.icon} />
        ))}

        {/* Thinking indicator when phase is thinking but no delta yet */}
        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex items-end gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg">
              {selectedAgent.icon}
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(j => (
                  <div
                    key={j}
                    className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: `${j * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <div className={cn(
            'flex-1 flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border transition-all',
            isStreaming ? 'border-gray-200 opacity-60' : 'border-gray-200 focus-within:border-purple-300 focus-within:ring-2 focus-within:ring-purple-100',
          )}>
            <input
              type="text"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={isStreaming}
              placeholder={isStreaming ? PHASE_LABELS[phase] : `Ask your ${selectedAgent.name}…`}
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none disabled:cursor-not-allowed"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!draft.trim() || isStreaming}
            className={cn(
              'px-4 py-3 rounded-2xl font-medium text-sm transition-all flex items-center gap-2',
              draft.trim() && !isStreaming
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed',
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
