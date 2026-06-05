'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, Circle,
  BookOpen, Video, FileText, Play, Volume2
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Lesson {
  id: string;
  title: string;
  contentType: string;
  contentUrl?: string;
  duration?: number;
  completed?: boolean;
}

interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  sections: Section[];
}

function VideoPlayer({ url, onEnded }: { url: string; onEnded?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
      <video
        ref={videoRef}
        src={url}
        controls
        className="w-full h-full"
        onEnded={onEnded}
      >
        Your browser does not support HTML5 video.
      </video>
    </div>
  );
}

function LessonIcon({ type }: { type: string }) {
  if (type === 'VIDEO') return <Video className="h-3.5 w-3.5 text-blue-500" />;
  if (type === 'QUIZ') return <BookOpen className="h-3.5 w-3.5 text-purple-500" />;
  return <FileText className="h-3.5 w-3.5 text-gray-400" />;
}

export default function LearnPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: course, isLoading } = useQuery<Course>({
    queryKey: ['course', courseId],
    queryFn: () => api.get(`/courses/${courseId}`).then(r => r.data.data),
  });

  const allLessons = course?.sections?.flatMap(s => s.lessons) ?? [];
  const initialLessonId = searchParams.get('lesson') ?? allLessons[0]?.id ?? '';
  const [currentLessonId, setCurrentLessonId] = useState<string>(initialLessonId);

  const currentLesson = allLessons.find(l => l.id === currentLessonId) ?? allLessons[0];
  const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);

  const completeMutation = useMutation({
    mutationFn: (lessonId: string) =>
      api.put(`/courses/${courseId}/progress/${lessonId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['course', courseId] }),
  });

  const goToLesson = (lesson: Lesson) => {
    setCurrentLessonId(lesson.id);
    window.history.replaceState(null, '', `?lesson=${lesson.id}`);
  };

  const goNext = () => {
    const next = allLessons[currentIndex + 1];
    if (next) goToLesson(next);
  };

  const goPrev = () => {
    const prev = allLessons[currentIndex - 1];
    if (prev) goToLesson(prev);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20 text-gray-500">
        Course not found.
        <button onClick={() => router.push('/courses')} className="block mx-auto mt-4 text-primary underline">
          Back to courses
        </button>
      </div>
    );
  }

  const completedCount = allLessons.filter(l => l.completed).length;
  const progressPct = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;

  return (
    <div className="flex gap-6 h-[calc(100vh-5rem)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={() => router.push(`/courses/${courseId}`)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-3"
          >
            <ArrowLeft className="h-4 w-4" /> Back to overview
          </button>
          <h2 className="text-sm font-semibold text-gray-900 line-clamp-2">{course.title}</h2>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{completedCount}/{allLessons.length} lessons</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {course.sections?.map((section, si) => (
            <div key={section.id}>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-2 py-1.5">
                {si + 1}. {section.title}
              </p>
              {(section.lessons ?? []).map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => goToLesson(lesson)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors',
                    currentLesson?.id === lesson.id
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {lesson.completed ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  ) : (
                    <LessonIcon type={lesson.contentType} />
                  )}
                  <span className="truncate">{lesson.title}</span>
                  {lesson.duration && (
                    <span className="ml-auto text-[10px] text-gray-400 shrink-0">{lesson.duration}m</span>
                  )}
                </button>
              ))}
            </div>
          ))}
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
          {currentLesson?.contentType === 'VIDEO' && currentLesson.contentUrl ? (
            <VideoPlayer
              url={currentLesson.contentUrl}
              onEnded={() => {
                if (!currentLesson.completed) {
                  completeMutation.mutate(currentLesson.id);
                }
              }}
            />
          ) : currentLesson?.contentType === 'VIDEO' && !currentLesson.contentUrl ? (
            <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ aspectRatio: '16/9' }}>
              <div className="text-center text-gray-400">
                <Volume2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No video uploaded for this lesson yet.</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6 min-h-48">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <FileText className="h-4 w-4" />
                <span>{currentLesson?.contentType ?? 'Lesson'} content</span>
              </div>
              {currentLesson?.contentUrl ? (
                <a
                  href={currentLesson.contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Play className="h-4 w-4" /> Open content
                </a>
              ) : (
                <p className="text-gray-400 text-sm">Content not yet available.</p>
              )}
            </div>
          )}

          {/* Mark complete + navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              disabled={currentIndex === 0}
              onClick={goPrev}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>

            <button
              disabled={currentLesson?.completed || completeMutation.isPending}
              onClick={() => completeMutation.mutate(currentLesson!.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                currentLesson?.completed
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
              )}
            >
              {currentLesson?.completed ? (
                <><CheckCircle className="h-4 w-4" /> Completed</>
              ) : completeMutation.isPending ? (
                <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg> Marking…</>
              ) : (
                <><Circle className="h-4 w-4" /> Mark as complete</>
              )}
            </button>

            <button
              disabled={currentIndex === allLessons.length - 1}
              onClick={goNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
