'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileQuestion, Clock, Users, Trash2, Globe, Lock, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
const DIFFICULTY_COLOR = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
};
export default function ExamsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState('all');
    const { data: exams = [], isLoading } = useQuery({
        queryKey: ['exams', filter],
        queryFn: () => {
            const params = new URLSearchParams();
            if (filter === 'mine') {
                params.set('mine', 'true');
            }
            if (filter === 'published') {
                params.set('published', 'true');
            }
            return api.get(`/exams?${params.toString()}`).then(r => r.data);
        },
    });
    const publishMutation = useMutation({
        mutationFn: (examId) => api.post(`/exams/${examId}/publish`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exams'] }),
    });
    const deleteMutation = useMutation({
        mutationFn: (examId) => api.delete(`/exams/${examId}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exams'] }),
    });
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exam Library</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-generated exams saved for your students</p>
        </div>
        <Button onClick={() => router.push('/ai-tools?tab=exam')}>
          <Plus className="h-4 w-4 mr-2"/>
          Generate Exam
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'mine', 'published'].map(f => (<button key={f} onClick={() => setFilter(f)} className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize', filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent')}>
            {f}
          </button>))}
      </div>

      {isLoading ? (<div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>
        </div>) : exams.length === 0 ? (<div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
          <FileQuestion className="h-10 w-10 text-muted-foreground mx-auto mb-3"/>
          <p className="text-muted-foreground font-medium">No exams yet</p>
          <p className="text-sm text-muted-foreground mt-1">Generate one with the AI Exam Generator and save it here.</p>
        </div>) : (<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map(exam => (<div key={exam.id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{exam.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{exam.subject}{exam.topic ? ` · ${exam.topic}` : ''}</p>
                </div>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0', DIFFICULTY_COLOR[exam.difficulty] ?? 'bg-muted text-muted-foreground')}>
                  {exam.difficulty}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><FileQuestion className="h-3.5 w-3.5"/>{exam._count.questions} questions</span>
                {exam.timeLimit && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5"/>{exam.timeLimit} min</span>}
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5"/>{exam._count.attempts} attempts</span>
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {exam.isPublished ? (<span className="flex items-center gap-1 text-green-600"><Globe className="h-3.5 w-3.5"/>Published</span>) : (<span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5"/>Draft</span>)}
                <span className="ml-auto">by {exam.creator.firstName} {exam.creator.lastName}</span>
              </div>

              <div className="flex gap-2 mt-auto pt-2 border-t border-border">
                <Link href={`/exams/${exam.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">View</Button>
                </Link>
                {!exam.isPublished && (<Button size="sm" className="flex-1" onClick={() => publishMutation.mutate(exam.id)} disabled={publishMutation.isPending}>
                    {publishMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin"/> : 'Publish'}
                  </Button>)}
                <button onClick={() => { if (confirm('Delete this exam?')) {
                deleteMutation.mutate(exam.id);
            } }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4"/>
                </button>
              </div>
            </div>))}
        </div>)}
    </div>);
}
