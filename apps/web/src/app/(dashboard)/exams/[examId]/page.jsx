'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
export default function ExamTakingPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.examId;
    const [attemptId, setAttemptId] = useState(null);
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);
    const [currentQ, setCurrentQ] = useState(0);
    const { data: exam, isLoading } = useQuery({
        queryKey: ['exam', examId],
        queryFn: () => api.get(`/exams/${examId}`).then(r => r.data),
    });
    const startMutation = useMutation({
        mutationFn: () => api.post(`/exams/${examId}/attempts`).then(r => r.data),
        onSuccess: (data) => setAttemptId(data.attempt.id),
    });
    const submitMutation = useMutation({
        mutationFn: () => api.post(`/exams/attempts/${attemptId}/submit`, { answers }).then(r => r.data),
        onSuccess: async () => {
            const res = await api.get(`/exams/attempts/${attemptId}/result`);
            setResult(res.data);
        },
    });
    if (isLoading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div>;
    }
    if (!exam) {
        return null;
    }
    // Show results screen
    if (result) {
        const pct = Math.round((result.score / result.maxScore) * 100);
        const passed = pct >= 60;
        return (<div className="max-w-2xl mx-auto space-y-6">
        <button onClick={() => router.push('/exams')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4"/>Back to Library
        </button>
        <div className={cn('border rounded-2xl p-8 text-center', passed ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50')}>
          {passed ? <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3"/> : <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3"/>}
          <h2 className="text-2xl font-bold text-foreground">{pct}%</h2>
          <p className="text-muted-foreground mt-1">{result.score} / {result.maxScore} points · {passed ? 'Passed' : 'Failed'}</p>
        </div>
        <div className="space-y-3">
          {result.exam.questions.map((q) => {
                const given = result.answers[q.id] ?? '';
                const correct = q.correctAnswer;
                const isCorrect = given.trim().toLowerCase() === correct.trim().toLowerCase();
                return (<div key={q.id} className={cn('border rounded-xl p-4', isCorrect ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50')}>
                <div className="flex items-start gap-2">
                  {isCorrect ? <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0"/> : <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0"/>}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{q.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">Your answer: <span className="font-medium">{given || '—'}</span></p>
                    {!isCorrect && <p className="text-xs text-green-700 mt-0.5">Correct: <span className="font-medium">{correct}</span></p>}
                    {q.explanation && <p className="text-xs text-muted-foreground mt-1 italic">{q.explanation}</p>}
                  </div>
                </div>
              </div>);
            })}
        </div>
      </div>);
    }
    // Start screen
    if (!attemptId) {
        return (<div className="max-w-lg mx-auto space-y-6 py-8">
        <button onClick={() => router.push('/exams')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4"/>Back
        </button>
        <div className="border border-border rounded-2xl p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
          <p className="text-muted-foreground">{exam.subject}{exam.topic ? ` · ${exam.topic}` : ''}</p>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <span>{exam.questions.length} questions</span>
            {exam.timeLimit && <span className="flex items-center gap-1"><Clock className="h-4 w-4"/>{exam.timeLimit} min</span>}
          </div>
          <Button className="w-full" onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
            {startMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
            Start Exam
          </Button>
        </div>
      </div>);
    }
    // Taking exam
    const question = exam.questions[currentQ];
    const answered = Object.keys(answers).length;
    return (<div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Question {currentQ + 1} of {exam.questions.length}</span>
        <span className="text-sm text-muted-foreground">{answered} answered</span>
      </div>

      <div className="w-full bg-muted rounded-full h-1.5">
        <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${((currentQ + 1) / exam.questions.length) * 100}%` }}/>
      </div>

      <div className="border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-start gap-3">
          <span className="text-xs font-bold bg-primary/10 text-primary rounded px-2 py-1 shrink-0">{currentQ + 1}</span>
          <p className="text-base font-medium text-foreground leading-relaxed">{question.question}</p>
          <span className="ml-auto text-xs text-muted-foreground shrink-0">{question.points}pt</span>
        </div>

        {question.type === 'multiple_choice' && question.options ? (<div className="space-y-2">
            {question.options.map((opt, oi) => (<button key={oi} onClick={() => setAnswers(prev => ({ ...prev, [question.id]: opt }))} className={cn('w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors', answers[question.id] === opt ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border hover:bg-accent')}>
                <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
              </button>))}
          </div>) : question.type === 'true_false' ? (<div className="flex gap-3">
            {['True', 'False'].map(opt => (<button key={opt} onClick={() => setAnswers(prev => ({ ...prev, [question.id]: opt.toLowerCase() }))} className={cn('flex-1 py-3 rounded-xl border text-sm font-medium transition-colors', answers[question.id] === opt.toLowerCase() ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-accent')}>
                {opt}
              </button>))}
          </div>) : (<textarea value={answers[question.id] ?? ''} onChange={e => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))} placeholder="Type your answer..." rows={4} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"/>)}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setCurrentQ(i => i - 1)} disabled={currentQ === 0}>Previous</Button>
        {currentQ < exam.questions.length - 1 ? (<Button className="flex-1" onClick={() => setCurrentQ(i => i + 1)}>Next</Button>) : (<Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => { if (confirm('Submit exam? You cannot change your answers.')) {
            submitMutation.mutate();
        } }} disabled={submitMutation.isPending}>
            {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
            Submit Exam
          </Button>)}
      </div>
    </div>);
}
