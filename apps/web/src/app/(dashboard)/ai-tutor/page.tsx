'use client';

import { useMutation } from '@tanstack/react-query';
import { Send, Plus, Bot, User, AlertTriangle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { api, type ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Literature', 'Computer Science', 'Economics'];

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (message: string) =>
      api.post('/ai/tutor/chat', { message, subject, conversationId }).then(r => r.data.data),
    onSuccess: (data) => {
      if (!conversationId) {setConversationId(data.conversationId);}
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    },
    onError: (error: ApiError) => {
      const isKeyMissing =
        error?.statusCode === 500 ||
        error?.statusCode === 0 ||
        (error?.message ?? '').toLowerCase().includes('api key') ||
        (error?.message ?? '').toLowerCase().includes('placeholder');
      const errorMessage = isKeyMissing
        ? 'AI Tutor is unavailable — ANTHROPIC_API_KEY is not configured in the backend.'
        : (error?.message ?? 'An unexpected error occurred. Please try again.');
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errorMessage}` }]);
    },
  });

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || sendMutation.isPending) {return;}
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    sendMutation.mutate(msg);
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(undefined);
    setInput('');
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-100 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-100">
          <Button onClick={handleNewChat} className="w-full" variant="outline" leftIcon={<Plus className="h-4 w-4" />}>
            New Chat
          </Button>
        </div>
        <div className="p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Subject</p>
          <div className="space-y-1">
            {SUBJECTS.map(s => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className={cn('w-full text-left px-3 py-2 rounded-lg text-sm transition-colors', subject === s ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100')}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">AI Tutor</p>
              <p className="text-xs text-gray-500">{subject}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Your AI Tutor is ready</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">Ask me anything about {subject}. I'll explain step by step.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div className={cn('max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              )}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              )}
            </div>
          ))}

          {sendMutation.isPending && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={`Ask about ${subject}...`}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              disabled={sendMutation.isPending}
            />
            <Button onClick={handleSend} disabled={!input.trim() || sendMutation.isPending} className="rounded-xl px-4">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
