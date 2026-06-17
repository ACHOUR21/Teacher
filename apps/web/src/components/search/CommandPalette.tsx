'use client';

import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, FileQuestion, Users, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Suggestion {
  type: 'course' | 'exam';
  id: string;
  label: string;
}

const HREF: Record<string, (id: string) => string> = {
  course: (id) => `/courses/${id}`,
  exam: (id) => `/exams/${id}`,
};

const ICON: Record<string, React.ComponentType<any>> = {
  course: BookOpen,
  exam: FileQuestion,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') {setOpen(false);}
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const { data: suggestions = [], isLoading } = useQuery<Suggestion[]>({
    queryKey: ['cmd-suggest', query],
    queryFn: () => api.get('/search/suggest', { params: { q: query } }).then(r => r.data),
    enabled: open && query.length >= 2,
    staleTime: 10_000,
  });

  const items: Array<Suggestion | { type: 'action'; label: string; href: string }> = [
    ...suggestions,
    ...(query.trim().length >= 2
      ? [{ type: 'action' as const, label: `Search all results for "${query}"`, href: `/search?q=${encodeURIComponent(query)}` }]
      : []),
  ];

  const navigate = useCallback((href: string) => {
    setOpen(false);
    router.push(href);
  }, [router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, items.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && items[selected]) {
      const item = items[selected];
      if (item.type === 'action') {navigate(item.href);}
      else {navigate(HREF[item.type](item.id));}
    }
  };

  if (!open) {return null;}

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4" onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search className="h-5 w-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search courses, exams, people..."
            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400 text-gray-900"
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400 shrink-0" />}
          <kbd className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>

        {/* Results */}
        {items.length > 0 ? (
          <ul className="max-h-72 overflow-y-auto py-2">
            {items.map((item, i) => {
              if (item.type === 'action') {
                return (
                  <li key="action">
                    <button
                      onClick={() => navigate(item.href)}
                      className={cn('w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors', i === selected ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50')}
                    >
                      <Search className="h-4 w-4 shrink-0 text-gray-400" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                  </li>
                );
              }
              const Icon = ICON[item.type] ?? BookOpen;
              return (
                <li key={`${item.type}-${item.id}`}>
                  <button
                    onClick={() => navigate(HREF[item.type](item.id))}
                    className={cn('w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors', i === selected ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50')}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    <span className="text-xs text-gray-400 capitalize shrink-0">{item.type}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : query.length >= 2 && !isLoading ? (
          <div className="py-8 text-center text-sm text-gray-400">No results for &ldquo;{query}&rdquo;</div>
        ) : (
          <div className="px-4 py-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Quick links</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Courses', href: '/courses', icon: BookOpen },
                { label: 'Exams', href: '/exams', icon: FileQuestion },
                { label: 'AI Tools', href: '/ai-tools', icon: Search },
                { label: 'People', href: '/users', icon: Users },
              ].map(link => (
                <button key={link.href} onClick={() => navigate(link.href)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors border border-gray-100">
                  <link.icon className="h-4 w-4 text-gray-400" />
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 py-2 border-t border-gray-100 flex gap-4 text-xs text-gray-400">
          <span><kbd className="font-mono bg-gray-100 px-1 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono bg-gray-100 px-1 rounded">↵</kbd> select</span>
          <span><kbd className="font-mono bg-gray-100 px-1 rounded">⌘K</kbd> toggle</span>
        </div>
      </div>
    </div>
  );
}
