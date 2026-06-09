'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Layers, Trash2, Loader2, Play, Plus, Globe, Lock, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Deck {
  id: string;
  title: string;
  subject?: string;
  topic?: string;
  isPublic: boolean;
  createdAt: string;
  lastStudiedAt?: string | null;
  creator: { firstName: string; lastName: string };
  _count: { cards: number };
}

const SUBJECT_COLORS: Record<string, string> = {
  mathematics: 'bg-blue-500',
  math: 'bg-blue-500',
  science: 'bg-green-500',
  biology: 'bg-emerald-500',
  chemistry: 'bg-teal-500',
  physics: 'bg-cyan-500',
  history: 'bg-amber-500',
  geography: 'bg-orange-500',
  english: 'bg-purple-500',
  language: 'bg-violet-500',
  technology: 'bg-indigo-500',
  'computer science': 'bg-sky-500',
  art: 'bg-pink-500',
  music: 'bg-rose-500',
  'physical education': 'bg-lime-500',
};

function getSubjectColor(subject?: string, topic?: string): string {
  const key = (subject ?? topic ?? '').toLowerCase();
  for (const [k, v] of Object.entries(SUBJECT_COLORS)) {
    if (key.includes(k)) return v;
  }
  return 'bg-gray-400';
}

function DeckSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
      <div className="h-2 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="flex gap-4 mt-2">
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-16" />
        </div>
        <div className="h-8 bg-gray-200 rounded mt-4" />
      </div>
    </div>
  );
}

export default function FlashcardsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: decks = [], isLoading } = useQuery<Deck[]>({
    queryKey: ['flashcard-decks'],
    queryFn: () => api.get('/flashcards/decks').then(r => r.data.data ?? r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (deckId: string) => api.delete(`/flashcards/decks/${deckId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Flashcard Decks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? 'Loading…' : `${decks.length} deck${decks.length !== 1 ? 's' : ''} · AI-powered spaced repetition`}
          </p>
        </div>
        <Button onClick={() => router.push('/ai-tools?tab=flashcards')}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Deck
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <DeckSkeleton key={i} />)}
        </div>
      ) : decks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-2xl text-center">
          <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-medium text-foreground">No flashcard decks yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Generate a deck with the AI Flashcard Generator and save it here.
          </p>
          <Button onClick={() => router.push('/ai-tools?tab=flashcards')} className="gap-2">
            <Plus className="h-4 w-4" />
            Generate Your First Deck
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map(deck => {
            const accentColor = getSubjectColor(deck.subject, deck.topic);
            const lastStudied = deck.lastStudiedAt
              ? new Date(deck.lastStudiedAt).toLocaleDateString()
              : null;
            const created = new Date(deck.createdAt).toLocaleDateString();

            return (
              <div
                key={deck.id}
                className="bg-card border border-border rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                {/* Color accent strip */}
                <div className={cn('h-2 w-full', accentColor)} />

                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div>
                    <h3 className="font-semibold text-foreground leading-snug">{deck.title}</h3>
                    {(deck.subject || deck.topic) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[deck.subject, deck.topic].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      {deck._count.cards} card{deck._count.cards !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      {deck.isPublic
                        ? <><Globe className="h-3.5 w-3.5 text-green-500" />Public</>
                        : <><Lock className="h-3.5 w-3.5" />Private</>}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {lastStudied
                      ? <span>Last studied <span className="font-medium text-foreground">{lastStudied}</span></span>
                      : <span>Created {created} · Not studied yet</span>
                    }
                  </div>

                  <p className="text-xs text-muted-foreground">
                    by {deck.creator.firstName} {deck.creator.lastName}
                  </p>

                  <div className="flex gap-2 mt-auto pt-3 border-t border-border">
                    <Link href={`/flashcards/${deck.id}/study`} className="flex-1">
                      <Button size="sm" className="w-full gap-1.5">
                        <Play className="h-3.5 w-3.5" />
                        Study Now
                      </Button>
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm('Delete this deck? This cannot be undone.')) {
                          deleteMutation.mutate(deck.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10 disabled:opacity-50"
                      title="Delete deck"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
