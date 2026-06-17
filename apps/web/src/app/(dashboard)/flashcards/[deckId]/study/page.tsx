'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, Loader2, RotateCcw } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Card {
  id: string;
  front: string;
  back: string;
  hint?: string;
  order: number;
}

interface StudyStats {
  total: number;
  learned: number;
  due: number;
  new: number;
}

const RATING_LABELS = [
  { value: 0, label: 'Blackout', color: 'bg-red-500 hover:bg-red-600 text-white' },
  { value: 2, label: 'Hard', color: 'bg-orange-500 hover:bg-orange-600 text-white' },
  { value: 3, label: 'Good', color: 'bg-blue-500 hover:bg-blue-600 text-white' },
  { value: 5, label: 'Easy', color: 'bg-green-500 hover:bg-green-600 text-white' },
];

export default function StudySessionPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const deckId = params.deckId as string;

  const [isFlipped, setIsFlipped] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const { data: cards = [], isLoading } = useQuery<Card[]>({
    queryKey: ['due-cards', deckId],
    queryFn: () => api.get(`/flashcards/decks/${deckId}/due`).then(r => r.data),
  });

  const { data: stats } = useQuery<StudyStats>({
    queryKey: ['deck-stats', deckId],
    queryFn: () => api.get(`/flashcards/decks/${deckId}/stats`).then(r => r.data),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ cardId, rating }: { cardId: string; rating: number }) =>
      api.post(`/flashcards/cards/${cardId}/review`, { rating }),
    onSuccess: () => {
      setReviewed(r => r + 1);
      setIsFlipped(false);
      if (currentIdx + 1 >= cards.length) {
        setDone(true);
        queryClient.invalidateQueries({ queryKey: ['due-cards', deckId] });
        queryClient.invalidateQueries({ queryKey: ['deck-stats', deckId] });
      } else {
        setCurrentIdx(i => i + 1);
      }
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (done || cards.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <CheckCircle className="h-14 w-14 text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold text-foreground">Session Complete!</h2>
        <p className="text-muted-foreground">{done ? `You reviewed ${reviewed} card${reviewed !== 1 ? 's' : ''}.` : 'No cards due for review today.'}</p>
        {stats && (
          <div className="grid grid-cols-3 gap-4 mt-4 text-center">
            <div className="bg-card border border-border rounded-xl p-3">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3">
              <p className="text-2xl font-bold text-green-600">{stats.learned}</p>
              <p className="text-xs text-muted-foreground">Learned</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3">
              <p className="text-2xl font-bold text-orange-500">{stats.due}</p>
              <p className="text-xs text-muted-foreground">Due</p>
            </div>
          </div>
        )}
        <Button onClick={() => router.push('/flashcards')} className="w-full">
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Decks
        </Button>
      </div>
    );
  }

  const card = cards[currentIdx];

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/flashcards')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="w-full bg-muted rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full transition-all"
              style={{ width: `${(currentIdx / cards.length) * 100}%` }} />
          </div>
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">{currentIdx + 1} / {cards.length}</span>
      </div>

      {/* Card */}
      <button
        onClick={() => setIsFlipped(f => !f)}
        className="w-full min-h-[240px] border-2 border-primary/20 hover:border-primary/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-card transition-all cursor-pointer shadow-sm hover:shadow-md">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {isFlipped ? 'Answer' : 'Question'} — tap to flip
        </span>
        <p className={cn('text-lg font-medium text-foreground text-center leading-relaxed', isFlipped ? 'text-primary' : '')}>
          {isFlipped ? card.back : card.front}
        </p>
        {!isFlipped && card.hint && (
          <p className="text-xs text-muted-foreground italic mt-2">Hint: {card.hint}</p>
        )}
      </button>

      {/* Rating buttons — only show after flipping */}
      {isFlipped ? (
        <div>
          <p className="text-xs text-center text-muted-foreground mb-3">How well did you know this?</p>
          <div className="grid grid-cols-4 gap-2">
            {RATING_LABELS.map(r => (
              <button key={r.value}
                onClick={() => reviewMutation.mutate({ cardId: card.id, rating: r.value })}
                disabled={reviewMutation.isPending}
                className={cn('py-2.5 rounded-xl text-sm font-medium transition-colors', r.color)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setIsFlipped(true)}>
            Show Answer
          </Button>
          <Button variant="outline" onClick={() => setCurrentIdx(i => (i + 1) % cards.length)}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
