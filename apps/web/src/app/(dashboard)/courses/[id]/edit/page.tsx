'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Video,
  FileText,
  Headphones,
  Eye,
  Save,
  X,
  Check,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';

import { api } from '@/lib/api';

const contentTypeIcon = (type: string) => {
  if (type === 'VIDEO') {return <Video className="h-3.5 w-3.5" />;}
  if (type === 'AUDIO') {return <Headphones className="h-3.5 w-3.5" />;}
  return <FileText className="h-3.5 w-3.5" />;
};

function InlineEdit({ value, onSave, className = '' }: { value: string; onSave: (v: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  if (!editing) {
    return (
      <button
        className={`text-left hover:underline focus:outline-none ${className}`}
        onClick={() => { setVal(value); setEditing(true); }}
      >
        {value}
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <input
        autoFocus
        className="border border-primary rounded px-2 py-0.5 text-sm bg-background text-foreground focus:outline-none"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { onSave(val); setEditing(false); }
          if (e.key === 'Escape') {setEditing(false);}
        }}
      />
      <button onClick={() => { onSave(val); setEditing(false); }} className="text-green-500 hover:text-green-600">
        <Check className="h-3.5 w-3.5" />
      </button>
      <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground">
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

function LessonForm({ onSave, onCancel, initial }: {
  onSave: (data: any) => void;
  onCancel: () => void;
  initial?: any;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    contentType: initial?.contentType ?? 'TEXT',
    contentUrl: initial?.contentUrl ?? '',
    duration: initial?.duration ?? '',
    position: initial?.position ?? 1,
    isPreview: initial?.isPreview ?? false,
    description: initial?.description ?? '',
  });

  return (
    <div className="border border-dashed border-primary/50 rounded-lg p-4 bg-primary/5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Title *</label>
          <input
            className="w-full border border-border rounded-md px-2.5 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Lesson title"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Content Type</label>
          <select
            className="w-full border border-border rounded-md px-2.5 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            value={form.contentType}
            onChange={e => setForm(f => ({ ...f, contentType: e.target.value }))}
          >
            {['VIDEO', 'AUDIO', 'TEXT', 'PDF', 'QUIZ', 'ASSIGNMENT'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Content URL</label>
          <input
            className="w-full border border-border rounded-md px-2.5 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            value={form.contentUrl}
            onChange={e => setForm(f => ({ ...f, contentUrl: e.target.value }))}
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Duration (seconds)</label>
          <input
            type="number"
            className="w-full border border-border rounded-md px-2.5 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            value={form.duration}
            onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
            placeholder="0"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="preview"
          checked={form.isPreview}
          onChange={e => setForm(f => ({ ...f, isPreview: e.target.checked }))}
          className="rounded"
        />
        <label htmlFor="preview" className="text-sm text-foreground">Free preview</label>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent transition-colors">Cancel</button>
        <button
          onClick={() => onSave({ ...form, duration: Number(form.duration) || 0, position: Number(form.position) || 1 })}
          disabled={!form.title.trim()}
          className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          Save Lesson
        </button>
      </div>
    </div>
  );
}

type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

interface Question {
  id: number;
  type: QuestionType;
  question: string;
  options: string[] | null;
  answer: string;
  points: number;
}

function LessonQuizBadge({ lessonId }: { lessonId: string }) {
  const { data } = useQuery<any>({
    queryKey: ['quiz-lesson', lessonId],
    queryFn: () =>
      api.get(`/quizzes/lesson/${lessonId}`).then(r => r.data.data).catch((err: any) => {
        if (err?.response?.status === 404) {return null;}
        throw err;
      }),
    retry: false,
  });

  if (!data) {return null;}
  return (
    <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded shrink-0 font-medium">
      Quiz
    </span>
  );
}

function QuizEditorModal({ lessonId, lessonTitle, onClose }: {
  lessonId: string;
  lessonTitle: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();

  const { data: existingQuiz, isLoading } = useQuery<any>({
    queryKey: ['quiz-lesson', lessonId],
    queryFn: () =>
      api.get(`/quizzes/lesson/${lessonId}`).then(r => r.data.data).catch((err: any) => {
        if (err?.response?.status === 404) {return null;}
        throw err;
      }),
    retry: false,
  });

  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timeLimit, setTimeLimit] = useState<string>('');
  const [initialized, setInitialized] = useState(false);
  const [addType, setAddType] = useState<QuestionType>('multiple_choice');

  React.useEffect(() => {
    if (!isLoading && !initialized) {
      if (existingQuiz) {
        setTitle(existingQuiz.title ?? '');
        setQuestions(
          Array.isArray(existingQuiz.questions)
            ? existingQuiz.questions.map((q: any, i: number) => ({ ...q, id: i }))
            : []
        );
        setTimeLimit(existingQuiz.timeLimit !== null && existingQuiz.timeLimit !== undefined ? String(existingQuiz.timeLimit) : '');
      }
      setInitialized(true);
    }
  }, [isLoading, existingQuiz, initialized]);

  const saveMut = useMutation({
    mutationFn: () => {
      const payload = {
        title,
        questions,
        timeLimit: timeLimit !== '' ? Number(timeLimit) : null,
      };
      if (existingQuiz?.id) {
        return api.patch(`/quizzes/${existingQuiz.id}`, payload);
      }
      return api.post('/quizzes', { lessonId, ...payload });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quiz-lesson', lessonId] });
      onClose();
    },
  });

  const addQuestion = () => {
    const newQ: Question = {
      id: Date.now(),
      type: addType,
      question: '',
      options: addType === 'multiple_choice' ? ['', '', '', ''] : null,
      answer: addType === 'true_false' ? 'True' : '',
      points: 10,
    };
    setQuestions(prev => [...prev, newQ]);
  };

  const updateQuestion = (id: number, patch: Partial<Question>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q));
  };

  const deleteQuestion = (id: number) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-foreground text-sm">
              Quiz — <span className="text-muted-foreground font-normal">{lessonTitle}</span>
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-md transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              {/* Title + time limit */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground block mb-1">Quiz Title *</label>
                  <input
                    className="w-full border border-border rounded-md px-2.5 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. End-of-lesson quiz"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Time Limit (min)</label>
                  <input
                    type="number"
                    className="w-full border border-border rounded-md px-2.5 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={timeLimit}
                    onChange={e => setTimeLimit(e.target.value)}
                    placeholder="optional"
                    min={1}
                  />
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={q.id} className="border border-border rounded-lg p-4 space-y-3 bg-muted/10">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider pt-0.5">
                        Q{idx + 1} · {q.type.replace(/_/g, ' ')}
                      </span>
                      <button
                        onClick={() => deleteQuestion(q.id)}
                        className="p-1 text-red-400 hover:text-red-600 rounded transition-colors shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Question</label>
                      <input
                        className="w-full border border-border rounded-md px-2.5 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        value={q.question}
                        onChange={e => updateQuestion(q.id, { question: e.target.value })}
                        placeholder="Enter your question"
                      />
                    </div>

                    {q.type === 'multiple_choice' && (
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground block">Options (select correct)</label>
                        {(q.options ?? ['', '', '', '']).map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`q-${q.id}-answer`}
                              checked={q.answer === opt && opt !== ''}
                              onChange={() => updateQuestion(q.id, { answer: opt })}
                              className="shrink-0"
                            />
                            <input
                              className="flex-1 border border-border rounded-md px-2.5 py-1 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              value={opt}
                              onChange={e => {
                                const newOptions = [...(q.options ?? ['', '', '', ''])];
                                newOptions[oi] = e.target.value;
                                updateQuestion(q.id, {
                                  options: newOptions,
                                  answer: q.answer === (q.options ?? [])[oi] ? e.target.value : q.answer,
                                });
                              }}
                              placeholder={`Option ${oi + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === 'true_false' && (
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Correct Answer</label>
                        <div className="flex items-center gap-4">
                          {['True', 'False'].map(val => (
                            <label key={val} className="flex items-center gap-1.5 text-sm cursor-pointer">
                              <input
                                type="radio"
                                name={`q-${q.id}-tf`}
                                checked={q.answer === val}
                                onChange={() => updateQuestion(q.id, { answer: val })}
                              />
                              {val}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {q.type === 'short_answer' && (
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Correct Answer</label>
                        <input
                          className="w-full border border-border rounded-md px-2.5 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          value={q.answer}
                          onChange={e => updateQuestion(q.id, { answer: e.target.value })}
                          placeholder="Expected answer"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground shrink-0">Points</label>
                      <input
                        type="number"
                        className="w-20 border border-border rounded-md px-2 py-1 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        value={q.points}
                        onChange={e => updateQuestion(q.id, { points: Number(e.target.value) || 0 })}
                        min={0}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add question */}
              <div className="flex items-center gap-2">
                <select
                  className="border border-border rounded-md px-2.5 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={addType}
                  onChange={e => setAddType(e.target.value as QuestionType)}
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True / False</option>
                  <option value="short_answer">Short Answer</option>
                </select>
                <button
                  onClick={addQuestion}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-dashed border-primary/60 text-primary rounded-md hover:bg-primary/5 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Question
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border shrink-0">
          <button onClick={onClose} className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent transition-colors">
            Cancel
          </button>
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending || !title.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saveMut.isPending ? 'Saving...' : existingQuiz ? 'Update Quiz' : 'Create Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CourseEditorPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [addingLesson, setAddingLesson] = useState<string | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [quizModalLessonId, setQuizModalLessonId] = useState<string | null>(null);
  const [quizModalLessonTitle, setQuizModalLessonTitle] = useState('');

  const { data: course, isLoading } = useQuery<any>({
    queryKey: ['course', courseId],
    queryFn: () => api.get(`/courses/${courseId}`).then(r => r.data.data),
  });

  const addSectionMut = useMutation({
    mutationFn: (data: any) => api.post(`/courses/${courseId}/sections`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course', courseId] });
      setAddingSection(false);
      setNewSectionTitle('');
    },
  });

  const updateSectionMut = useMutation({
    mutationFn: ({ sectionId, title }: { sectionId: string; title: string }) =>
      api.patch(`/courses/sections/${sectionId}`, { title }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['course', courseId] }),
  });

  const deleteSectionMut = useMutation({
    mutationFn: (sectionId: string) => api.delete(`/courses/sections/${sectionId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['course', courseId] }),
  });

  const addLessonMut = useMutation({
    mutationFn: ({ sectionId, data }: { sectionId: string; data: any }) =>
      api.post(`/courses/sections/${sectionId}/lessons`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course', courseId] });
      setAddingLesson(null);
    },
  });

  const _updateLessonMut = useMutation({
    mutationFn: ({ sectionId, lessonId, data }: { sectionId: string; lessonId: string; data: any }) =>
      api.patch(`/courses/sections/${sectionId}/lessons/${lessonId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['course', courseId] }),
  });

  const deleteLessonMut = useMutation({
    mutationFn: ({ sectionId, lessonId }: { sectionId: string; lessonId: string }) =>
      api.delete(`/courses/sections/${sectionId}/lessons/${lessonId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['course', courseId] }),
  });

  const publishMut = useMutation({
    mutationFn: () => api.post(`/courses/${courseId}/publish`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['course', courseId] }),
  });

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {next.delete(id);}
      else {next.add(id);}
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!course) {return <div className="p-6 text-muted-foreground">Course not found.</div>;}

  const sections: any[] = course.sections ?? [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/courses/${courseId}`} className="p-2 hover:bg-accent rounded-md transition-colors shrink-0">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{course.title}</h1>
            <p className="text-sm text-muted-foreground">Course Editor</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!course.isPublished ? (
            <button
              onClick={() => publishMut.mutate()}
              disabled={publishMut.isPending || sections.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Eye className="h-4 w-4" />
              {publishMut.isPending ? 'Publishing...' : 'Publish'}
            </button>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm font-medium rounded-md">
              <Check className="h-3.5 w-3.5" /> Published
            </span>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section, si) => {
          const expanded = expandedSections.has(section.id);
          return (
            <div key={section.id} className="bg-card border border-border rounded-lg overflow-hidden">
              {/* Section header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/30">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
                <button onClick={() => toggleSection(section.id)} className="flex items-center gap-2 flex-1 min-w-0">
                  {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">
                    Section {si + 1}
                  </span>
                  <InlineEdit
                    value={section.title}
                    onSave={title => updateSectionMut.mutate({ sectionId: section.id, title })}
                    className="font-semibold text-foreground text-sm"
                  />
                </button>
                <span className="text-xs text-muted-foreground shrink-0">{section.lessons?.length ?? 0} lessons</span>
                <button
                  onClick={() => {
                    if (confirm(`Delete section "${section.title}" and all its lessons?`)) {
                      deleteSectionMut.mutate(section.id);
                    }
                  }}
                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Lessons */}
              {expanded && (
                <div className="divide-y divide-border">
                  {(section.lessons ?? []).map((lesson: any, li: number) => (
                    <div key={lesson.id} className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/20 transition-colors">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab shrink-0" />
                      <span className="text-xs text-muted-foreground w-5 shrink-0">{li + 1}</span>
                      <span className={`shrink-0 ${lesson.contentType === 'VIDEO' ? 'text-blue-500' : lesson.contentType === 'AUDIO' ? 'text-purple-500' : 'text-muted-foreground'}`}>
                        {contentTypeIcon(lesson.contentType)}
                      </span>
                      <span className="flex-1 text-sm text-foreground truncate">{lesson.title}</span>
                      <LessonQuizBadge lessonId={lesson.id} />
                      {lesson.isPreview && (
                        <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded shrink-0">Preview</span>
                      )}
                      {lesson.duration > 0 && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')}
                        </span>
                      )}
                      <button
                        onClick={() => { setQuizModalLessonId(lesson.id); setQuizModalLessonTitle(lesson.title); }}
                        className="p-1 text-primary hover:text-primary/80 hover:bg-primary/10 rounded transition-colors shrink-0"
                        title="Edit quiz"
                      >
                        <BookOpen className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteLessonMut.mutate({ sectionId: section.id, lessonId: lesson.id })}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add lesson form or button */}
                  {addingLesson === section.id ? (
                    <div className="p-4">
                      <LessonForm
                        initial={{ position: (section.lessons?.length ?? 0) + 1 }}
                        onSave={data => addLessonMut.mutate({ sectionId: section.id, data })}
                        onCancel={() => setAddingLesson(null)}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingLesson(section.id)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Lesson
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add section */}
        {addingSection ? (
          <div className="bg-card border border-dashed border-primary/50 rounded-lg p-4 flex items-center gap-3">
            <input
              autoFocus
              className="flex-1 border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Section title"
              value={newSectionTitle}
              onChange={e => setNewSectionTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newSectionTitle.trim()) {
                  addSectionMut.mutate({ title: newSectionTitle, position: sections.length + 1 });
                }
                if (e.key === 'Escape') {setAddingSection(false);}
              }}
            />
            <button
              onClick={() => addSectionMut.mutate({ title: newSectionTitle, position: sections.length + 1 })}
              disabled={!newSectionTitle.trim() || addSectionMut.isPending}
              className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Add
            </button>
            <button onClick={() => setAddingSection(false)} className="p-2 hover:bg-accent rounded-md transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingSection(true)}
            className="w-full flex items-center justify-center gap-2 py-4 border border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" /> Add Section
          </button>
        )}
      </div>

      {sections.length === 0 && !addingSection && (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">Add at least one section with lessons to publish this course.</p>
        </div>
      )}

      {quizModalLessonId && (
        <QuizEditorModal
          lessonId={quizModalLessonId}
          lessonTitle={quizModalLessonTitle}
          onClose={() => setQuizModalLessonId(null)}
        />
      )}
    </div>
  );
}
