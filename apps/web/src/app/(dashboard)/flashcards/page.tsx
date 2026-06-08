'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Layers, Trash2, Loader2, Play, Plus, Globe, Lock } from 'lucide-react';
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
  creator: { firstName: string; lastName: string };
  _count: { cards: number };
}

export default function FlashcardsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: decks = [], isLoading } = useQuery<Deck[]>({
    queryKey: ['flashcard-decks'],
    queryFn: () => api.get('/flashcards/decks').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (deckId: string) => api.delete(`/flashcards/decks/${deckId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Flashcard Decks</h1>
          <p className="text-sm text-muted-foreground mt-1">Study with AI-generated spaced repetition cards</p>
        </div>
        <Button onClick={() => router.push('/ai-tools?tab=flashcards')}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Deck
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : decks.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
          <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No flashcard decks yet</p>
          <p className="text-sm text-muted-foreground mt-1">Generate a deck with the AI Flashcard Generator and save it here.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map(deck => (
            <div key={deck.id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div>
                <h3 className="font-semibold text-foreground">{deck.title}</h3>
                {(deck.subject || deck.topic) && (
                  <p className="text-xs text-muted-foreground mt-0.5">{[deck.subject, deck.topic].filter(Boolean).join(' · ')}</p>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" />{deck._count.cards} cards</span>
                <span className="flex items-center gap-1">
                  {deck.isPublic ? <><Globe className="h-3.5 w-3.5 text-green-500" />Public</> : <><Lock className="h-3.5 w-3.5" />Private</>}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">by {deck.creator.firstName} {deck.creator.lastName}</p>

              <div className="flex gap-2 mt-auto pt-2 border-t border-border">
                <Link href={`/flashcards/${deck.id}/study`} className="flex-1">
                  <Button size="sm" className="w-full gap-1.5">
                    <Play className="h-3.5 w-3.5" />Study
                  </Button>
                </Link>
                <button
                  onClick={() => { if (confirm('Delete this deck?')) deleteMutation.mutate(deck.id); }}
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
