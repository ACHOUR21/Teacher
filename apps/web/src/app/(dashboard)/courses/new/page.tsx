'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Plus, Trash2, ArrowLeft, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { VideoUpload } from '@/components/ui/VideoUpload';
import { cn } from '@/lib/utils';

const lessonSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['VIDEO', 'ARTICLE', 'QUIZ']),
  duration: z.number().optional(),
  contentUrl: z.string().optional(),
});

const sectionSchema = z.object({
  title: z.string().min(1),
  lessons: z.array(lessonSchema).default([]),
});

const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  price: z.number().min(0).default(0),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  category: z.string().min(1, 'Select a category'),
  tags: z.string().optional(),
  language: z.string().default('English'),
  sections: z.array(sectionSchema).default([]),
});

type CourseFormData = z.infer<typeof courseSchema>;

const CATEGORIES = ['Mathematics', 'Science', 'History', 'Language', 'Technology', 'Arts', 'Business', 'Music', 'Sports', 'Other'];

export default function NewCoursePage() {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<number[]>([0]);

  const { register, control, handleSubmit, formState: { errors } } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: { level: 'BEGINNER', price: 0, language: 'English', sections: [] },
  });

  const { fields: sections, append: appendSection, remove: removeSection } = useFieldArray({ control, name: 'sections' });

  const createMutation = useMutation({
    mutationFn: (data: CourseFormData) => api.post('/courses', {
      ...data,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }),
    onSuccess: (res) => router.push(`/courses/${res.data.data.id}`),
  });

  const toggleSection = (i: number) => {
    setExpandedSections(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
          <p className="text-sm text-gray-500">Build your course structure and content</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Course Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
            <input
              {...register('title')}
              placeholder="e.g. Introduction to Machine Learning"
              className={cn('w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500', errors.title ? 'border-red-300' : 'border-gray-200')}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="What will students learn in this course?"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Level *</label>
              <select {...register('level')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                {['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
              <select {...register('category')} className={cn('w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white', errors.category ? 'border-red-300' : 'border-gray-200')}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  {...register('price', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Set 0 for free course</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Language</label>
              <input {...register('language')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
            <input
              {...register('tags')}
              placeholder="react, javascript, web (comma separated)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Curriculum */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Curriculum</h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => {
                appendSection({ title: `Section ${sections.length + 1}`, lessons: [] });
                setExpandedSections(prev => [...prev, sections.length]);
              }}
            >
              Add Section
            </Button>
          </div>

          {sections.length === 0 && (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-sm">No sections yet</p>
              <p className="text-xs mt-1">Add sections to organize your course content</p>
            </div>
          )}

          <div className="space-y-3">
            {sections.map((section, si) => (
              <SectionEditor
                key={section.id}
                sectionIndex={si}
                control={control}
                register={register}
                isExpanded={expandedSections.includes(si)}
                onToggle={() => toggleSection(si)}
                onRemove={() => removeSection(si)}
              />
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" loading={createMutation.isPending}>
            Create Course
          </Button>
        </div>
      </form>
    </div>
  );
}

function SectionEditor({ sectionIndex, control, register, isExpanded, onToggle, onRemove }: {
  sectionIndex: number;
  control: any;
  register: any;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const { fields: lessons, append, remove } = useFieldArray({ control, name: `sections.${sectionIndex}.lessons` });

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
        <GripVertical className="h-4 w-4 text-gray-300 cursor-grab flex-shrink-0" />
        <input
          {...register(`sections.${sectionIndex}.title`)}
          placeholder="Section title"
          className="flex-1 bg-transparent text-sm font-medium text-gray-800 focus:outline-none placeholder-gray-400"
          onClick={e => e.stopPropagation()}
        />
        <span className="text-xs text-gray-400">{lessons.length} lessons</span>
        <button type="button" onClick={onToggle} className="p-1 rounded hover:bg-gray-200 transition-colors">
          {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
        </button>
        <button type="button" onClick={onRemove} className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 py-3 space-y-3">
          {lessons.map((lesson, li) => {
            const lessonType = (lesson as any).type;
            return (
              <div key={lesson.id} className="space-y-1.5 group">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-gray-200 group-hover:text-gray-400 cursor-grab flex-shrink-0" />
                  <input
                    {...register(`sections.${sectionIndex}.lessons.${li}.title`)}
                    placeholder="Lesson title"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    {...register(`sections.${sectionIndex}.lessons.${li}.type`)}
                    className="px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="VIDEO">Video</option>
                    <option value="ARTICLE">Article</option>
                    <option value="QUIZ">Quiz</option>
                  </select>
                  <input
                    {...register(`sections.${sectionIndex}.lessons.${li}.duration`, { valueAsNumber: true })}
                    type="number"
                    min="1"
                    placeholder="min"
                    className="w-16 px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  />
                  <button type="button" onClick={() => remove(li)} className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 text-red-400 transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {lessonType === 'VIDEO' && (
                  <div className="ml-6">
                    <Controller
                      name={`sections.${sectionIndex}.lessons.${li}.contentUrl`}
                      control={control}
                      render={({ field }) => (
                        <VideoUpload
                          value={field.value}
                          onChange={field.onChange}
                          folder="lessons"
                        />
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => append({ title: '', type: 'VIDEO', contentUrl: '' })}
            className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Add Lesson
          </button>
        </div>
      )}
    </div>
  );
}
