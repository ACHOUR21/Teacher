'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Star, Users, BarChart2, Clock, BookOpen, Play, CheckCircle, Lock, Edit, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => api.get(`/courses/${id}`).then(r => r.data.data),
  });

  const enrollMutation = useMutation({
    mutationFn: () => api.post(`/marketplace/enroll/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['course', id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/courses/${id}`),
    onSuccess: () => router.push('/courses'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg">Course not found</p>
        <Button className="mt-4" onClick={() => router.push('/courses')}>Back to Courses</Button>
      </div>
    );
  }

  const isEnrolled = course.isEnrolled;
  const progress = course.userProgress ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to courses
      </button>

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden h-56">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-4 left-5 right-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-white/20 backdrop-blur px-2 py-0.5 rounded-full">{course.level}</span>
            {course.category && <span className="text-xs bg-white/20 backdrop-blur px-2 py-0.5 rounded-full">{course.category}</span>}
          </div>
          <h1 className="text-2xl font-bold leading-snug">{course.title}</h1>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={() => router.push(`/courses/${id}/edit`)} className="p-2 bg-white/20 backdrop-blur rounded-lg text-white hover:bg-white/30 transition-colors">
            <Edit className="h-4 w-4" />
          </button>
          <button onClick={() => { if (confirm('Delete this course?')) deleteMutation.mutate(); }} className="p-2 bg-red-500/80 backdrop-blur rounded-lg text-white hover:bg-red-600/80 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Star, label: 'Rating', value: course.rating?.toFixed(1) ?? '—', color: 'text-amber-500' },
          { icon: Users, label: 'Enrolled', value: course.enrollCount ?? 0, color: 'text-blue-500' },
          { icon: BarChart2, label: 'Level', value: course.level, color: 'text-purple-500' },
          { icon: Clock, label: 'Duration', value: course.duration ? `${course.duration}h` : '—', color: 'text-green-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <stat.icon className={cn('h-5 w-5 flex-shrink-0', stat.color)} />
            <div>
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="font-semibold text-gray-900 text-sm">{String(stat.value)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {course.description && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-3">About this course</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{course.description}</p>
            </div>
          )}

          {/* Sections */}
          {course.sections?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" /> Course Content
                <span className="ml-auto text-xs text-gray-500">{course.sections.length} sections</span>
              </h2>
              <div className="space-y-3">
                {course.sections.map((section: any, si: number) => (
                  <div key={section.id} className="border border-gray-100 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">
                        Section {si + 1}: {section.title}
                      </span>
                      <span className="text-xs text-gray-500">{section.lessons?.length ?? 0} lessons</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {(section.lessons ?? []).map((lesson: any) => (
                        <div key={lesson.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                          {isEnrolled ? (
                            lesson.completed ? (
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <Play className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            )
                          ) : (
                            <Lock className="h-4 w-4 text-gray-300 flex-shrink-0" />
                          )}
                          <span className="text-sm text-gray-700">{lesson.title}</span>
                          {lesson.duration && (
                            <span className="ml-auto text-xs text-gray-400">{lesson.duration}m</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {course.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {course.tags.map((tag: string) => (
                <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Enroll Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {course.price === 0 ? 'Free' : `$${course.price?.toFixed(2)}`}
            </div>
            {isEnrolled ? (
              <>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span><span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <Button className="w-full" onClick={() => router.push(`/courses/${id}/learn`)}>
                  {progress > 0 ? 'Continue Learning' : 'Start Course'}
                </Button>
              </>
            ) : (
              <Button
                className="w-full mt-3"
                isLoading={enrollMutation.isPending}
                onClick={() => enrollMutation.mutate()}
              >
                {course.price === 0 ? 'Enroll for Free' : `Enroll · $${course.price?.toFixed(2)}`}
              </Button>
            )}
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              {course.duration && <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-gray-400" />{course.duration} hours of content</li>}
              <li className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-gray-400" />{course.sections?.reduce((a: number, s: any) => a + (s.lessons?.length ?? 0), 0) ?? 0} lessons</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-gray-400" />Certificate of completion</li>
            </ul>
          </div>

          {/* Instructor */}
          {course.teacher && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Instructor</h3>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                  {course.teacher.user?.firstName?.[0]}{course.teacher.user?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{course.teacher.user?.firstName} {course.teacher.user?.lastName}</p>
                  <p className="text-xs text-gray-500">{course.teacher.subjects?.join(', ')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
