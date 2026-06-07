'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Plus,
  Pencil,
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

const contentTypeIcon = (type: string) => {
  if (type === 'VIDEO') return <Video className="h-3.5 w-3.5" />;
  if (type === 'AUDIO') return <Headphones className="h-3.5 w-3.5" />;
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
          if (e.key === 'Escape') setEditing(false);
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

export default function CourseEditorPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [addingLesson, setAddingLesson] = useState<string | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

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
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['course', courseId] });
      setAddingLesson(null);
    },
  });

  const updateLessonMut = useMutation({
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

  if (!course) return <div className="p-6 text-muted-foreground">Course not found.</div>;

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
                      {lesson.isPreview && (
                        <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded shrink-0">Preview</span>
                      )}
                      {lesson.duration > 0 && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')}
                        </span>
                      )}
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
                if (e.key === 'Escape') setAddingSection(false);
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
    </div>
  );
}
