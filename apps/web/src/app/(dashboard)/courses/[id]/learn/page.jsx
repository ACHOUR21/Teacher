'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, Circle, BookOpen, Video, FileText, Play, Volume2 } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef } from 'react';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
function VideoPlayer({ url, onEnded }) {
    const videoRef = useRef(null);
    return (<div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
      <video ref={videoRef} src={url} controls className="w-full h-full" onEnded={onEnded}>
        Your browser does not support HTML5 video.
      </video>
    </div>);
}
function QuizLesson({ lesson, courseId: _courseId, onPassed, }) {
    const _qc = useQueryClient();
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);
    const { data: quiz, isLoading, isError, error } = useQuery({
        queryKey: ['quiz', 'lesson', lesson.id],
        queryFn: async () => {
            try {
                const r = await api.get(`/quizzes/lesson/${lesson.id}`);
                return (r.data?.data ?? r.data);
            }
            catch (err) {
                const e = err;
                if (e?.response?.status === 404) {
                    return null;
                }
                throw err;
            }
        },
        retry: false,
    });
    const submitMutation = useMutation({
        mutationFn: (payload) => api.post(`/quizzes/${quiz.id}/attempt`, payload).then(r => r.data?.data ?? r.data),
        onSuccess: (data) => {
            setResult(data);
            if (data.passed && onPassed) {
                onPassed();
            }
        },
    });
    const handleRetake = () => {
        setAnswers({});
        setResult(null);
    };
    const handleSubmit = () => {
        if (!quiz) {
            return;
        }
        const payload = quiz.questions.map(q => ({
            questionId: q.id,
            answer: answers[q.id] ?? '',
        }));
        submitMutation.mutate({ answers: payload });
    };
    if (isLoading) {
        return (<div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        {[1, 2, 3].map(i => (<div key={i} className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"/>
            <div className="h-3 bg-gray-100 rounded w-1/2"/>
          </div>))}
      </div>);
    }
    if (isError) {
        return (<div className="bg-white rounded-lg border border-red-200 p-6 text-red-500 text-sm">
        Failed to load quiz: {(error)?.message ?? 'Unknown error'}
      </div>);
    }
    if (!quiz) {
        return (<div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <BookOpen className="h-10 w-10 mx-auto mb-3 text-gray-300"/>
        <p className="text-gray-400 text-sm">No quiz attached to this lesson yet.</p>
      </div>);
    }
    // Results screen
    if (result) {
        const pct = Math.round(result.score);
        return (<div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className={cn('inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold', result.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
            {result.passed ? <CheckCircle className="h-4 w-4"/> : <Circle className="h-4 w-4"/>}
            {result.passed ? 'Passed' : 'Failed'}
          </div>
          <p className="text-4xl font-bold text-gray-900">{pct}%</p>
          <p className="text-sm text-gray-500">
            {result.correctCount} / {result.totalQuestions} correct &middot; passing score {quiz.passingScore}%
          </p>
        </div>

        <div className="space-y-4">
          {quiz.questions.map((q, qi) => {
                const ans = result.answers.find(a => a.questionId === q.id);
                const isCorrect = ans?.correct ?? false;
                return (<div key={q.id} className={cn('rounded-lg border p-4 text-sm', isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50')}>
                <p className="font-medium text-gray-800 mb-2">
                  {qi + 1}. {q.question}
                </p>
                <p className={cn('text-xs', isCorrect ? 'text-green-700' : 'text-red-600')}>
                  Your answer: <span className="font-medium">{ans?.givenAnswer || '(no answer)'}</span>
                </p>
                {!isCorrect && ans?.correctAnswer && (<p className="text-xs text-green-700 mt-0.5">
                    Correct answer: <span className="font-medium">{ans.correctAnswer}</span>
                  </p>)}
              </div>);
            })}
        </div>

        <button onClick={handleRetake} className="w-full py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Retake Quiz
        </button>
      </div>);
    }
    // Quiz taking screen — all questions at once
    return (<div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">{quiz.title}</h2>
        <span className="text-xs text-gray-400">{quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-6">
        {quiz.questions.map((q, qi) => (<div key={q.id} className="space-y-3">
            <p className="text-sm font-medium text-gray-800">
              {qi + 1}. {q.question}
            </p>

            {q.type === 'SHORT_ANSWER' ? (<textarea rows={3} value={answers[q.id] ?? ''} onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} placeholder="Type your answer here..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"/>) : q.type === 'TRUE_FALSE' ? (<div className="flex gap-4">
                {['True', 'False'].map(opt => (<label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="radio" name={`q-${q.id}`} value={opt} checked={answers[q.id] === opt} onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))} className="accent-blue-600"/>
                    {opt}
                  </label>))}
              </div>) : (
            // MULTIPLE_CHOICE
            <div className="space-y-2">
                {(q.options ?? []).map(opt => (<label key={opt.id} className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-700 hover:text-gray-900">
                    <input type="radio" name={`q-${q.id}`} value={opt.id} checked={answers[q.id] === opt.id} onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))} className="accent-blue-600"/>
                    {opt.text}
                  </label>))}
              </div>)}
          </div>))}
      </div>

      <button onClick={handleSubmit} disabled={submitMutation.isPending} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
        {submitMutation.isPending ? (<>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Submitting…
          </>) : ('Submit Quiz')}
      </button>
    </div>);
}
function LessonIcon({ type }) {
    if (type === 'VIDEO') {
        return <Video className="h-3.5 w-3.5 text-blue-500"/>;
    }
    if (type === 'QUIZ') {
        return <BookOpen className="h-3.5 w-3.5 text-purple-500"/>;
    }
    return <FileText className="h-3.5 w-3.5 text-gray-400"/>;
}
export default function LearnPage() {
    const { id: courseId } = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const qc = useQueryClient();
    const { data: course, isLoading } = useQuery({
        queryKey: ['course', courseId],
        queryFn: () => api.get(`/courses/${courseId}`).then(r => r.data.data),
    });
    const allLessons = course?.sections?.flatMap(s => s.lessons) ?? [];
    const initialLessonId = searchParams.get('lesson') ?? allLessons[0]?.id ?? '';
    const [currentLessonId, setCurrentLessonId] = useState(initialLessonId);
    const currentLesson = allLessons.find(l => l.id === currentLessonId) ?? allLessons[0];
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
    const completeMutation = useMutation({
        mutationFn: (lessonId) => api.put(`/courses/${courseId}/progress/${lessonId}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['course', courseId] }),
    });
    const goToLesson = (lesson) => {
        setCurrentLessonId(lesson.id);
        window.history.replaceState(null, '', `?lesson=${lesson.id}`);
    };
    const goNext = () => {
        const next = allLessons[currentIndex + 1];
        if (next) {
            goToLesson(next);
        }
    };
    const goPrev = () => {
        const prev = allLessons[currentIndex - 1];
        if (prev) {
            goToLesson(prev);
        }
    };
    if (isLoading) {
        return (<div className="flex items-center justify-center h-96">
        <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>);
    }
    if (!course) {
        return (<div className="text-center py-20 text-gray-500">
        Course not found.
        <button onClick={() => router.push('/courses')} className="block mx-auto mt-4 text-primary underline">
          Back to courses
        </button>
      </div>);
    }
    const completedCount = allLessons.filter(l => l.completed).length;
    const progressPct = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;
    return (<div className="flex gap-6 h-[calc(100vh-5rem)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <button onClick={() => router.push(`/courses/${courseId}`)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-3">
            <ArrowLeft className="h-4 w-4"/> Back to overview
          </button>
          <h2 className="text-sm font-semibold text-gray-900 line-clamp-2">{course.title}</h2>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{completedCount}/{allLessons.length} lessons</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progressPct}%` }}/>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {course.sections?.map((section, si) => (<div key={section.id}>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-2 py-1.5">
                {si + 1}. {section.title}
              </p>
              {(section.lessons ?? []).map((lesson) => (<button key={lesson.id} onClick={() => goToLesson(lesson)} className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors', currentLesson?.id === lesson.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50')}>
                  {lesson.completed ? (<CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0"/>) : (<LessonIcon type={lesson.contentType}/>)}
                  <span className="truncate">{lesson.title}</span>
                  {lesson.duration && (<span className="ml-auto text-[10px] text-gray-400 shrink-0">{lesson.duration}m</span>)}
                </button>))}
            </div>))}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Lesson header */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">{currentLesson?.title}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{currentIndex + 1} / {allLessons.length}</span>
            </div>
          </div>

          {/* Content */}
          {currentLesson?.contentType === 'VIDEO' && currentLesson.contentUrl ? (<VideoPlayer url={currentLesson.contentUrl} onEnded={() => {
                if (!currentLesson.completed) {
                    completeMutation.mutate(currentLesson.id);
                }
            }}/>) : currentLesson?.contentType === 'VIDEO' && !currentLesson.contentUrl ? (<div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ aspectRatio: '16/9' }}>
              <div className="text-center text-gray-400">
                <Volume2 className="h-12 w-12 mx-auto mb-3 opacity-30"/>
                <p className="text-sm">No video uploaded for this lesson yet.</p>
              </div>
            </div>) : currentLesson?.contentType === 'QUIZ' ? (<QuizLesson lesson={currentLesson} courseId={courseId} onPassed={() => {
                if (!currentLesson.completed) {
                    completeMutation.mutate(currentLesson.id);
                }
            }}/>) : (<div className="bg-white rounded-lg border border-gray-200 p-6 min-h-48">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <FileText className="h-4 w-4"/>
                <span>{currentLesson?.contentType ?? 'Lesson'} content</span>
              </div>
              {currentLesson?.contentUrl ? (<a href={currentLesson.contentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                  <Play className="h-4 w-4"/> Open content
                </a>) : (<p className="text-gray-400 text-sm">Content not yet available.</p>)}
            </div>)}

          {/* Mark complete + navigation */}
          <div className="flex items-center justify-between pt-2">
            <button disabled={currentIndex === 0} onClick={goPrev} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors">
              <ChevronLeft className="h-4 w-4"/> Previous
            </button>

            <button disabled={currentLesson?.completed || completeMutation.isPending} onClick={() => completeMutation.mutate(currentLesson.id)} className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors', currentLesson?.completed
            ? 'bg-green-100 text-green-700 cursor-default'
            : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50')}>
              {currentLesson?.completed ? (<><CheckCircle className="h-4 w-4"/> Completed</>) : completeMutation.isPending ? (<><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg> Marking…</>) : (<><Circle className="h-4 w-4"/> Mark as complete</>)}
            </button>

            <button disabled={currentIndex === allLessons.length - 1} onClick={goNext} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors">
              Next <ChevronRight className="h-4 w-4"/>
            </button>
          </div>
        </div>
      </main>
    </div>);
}
