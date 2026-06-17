'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Star, Users, BookOpen, Sparkles, TrendingUp, Zap, AlertTriangle } from 'lucide-react';

import { api, type ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

interface CourseRecommendation {
  courseId: string;
  title: string;
  description: string;
  score: number;
  reason: string;
  category?: string;
  instructorName?: string;
  rating?: number;
  enrollmentCount?: number;
}

interface PersonalizedFeed {
  recommendations: CourseRecommendation[];
  trending: CourseRecommendation[];
  newCourses: CourseRecommendation[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Mathematics: 'from-blue-500 to-indigo-600',
  Science: 'from-green-500 to-teal-600',
  Technology: 'from-purple-500 to-violet-600',
  Language: 'from-yellow-500 to-orange-500',
  History: 'from-amber-500 to-brown-600',
  Arts: 'from-pink-500 to-rose-600',
  Business: 'from-cyan-500 to-blue-600',
  Default: 'from-slate-500 to-gray-600',
};

function getCategoryGradient(category?: string): string {
  return CATEGORY_COLORS[category ?? ''] ?? CATEGORY_COLORS['Default'];
}

function StarRating({ rating }: { rating?: number }) {
  const value = rating ?? 0;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-3 w-3',
            star <= Math.round(value)
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300 fill-gray-300',
          )}
        />
      ))}
      <span className="text-xs text-gray-500 ml-1">{value.toFixed(1)}</span>
    </div>
  );
}

function CourseCard({ course }: { course: CourseRecommendation }) {
  return (
    <div className="flex-shrink-0 w-64 bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Cover image / color fallback */}
      <div
        className={cn(
          'h-32 bg-gradient-to-br flex items-center justify-center',
          getCategoryGradient(course.category),
        )}
      >
        <BookOpen className="h-10 w-10 text-white opacity-80" />
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-snug">
          {course.title}
        </h3>

        {/* Reason (italic, small) */}
        <p className="text-xs text-blue-600 italic line-clamp-2">{course.reason}</p>

        {course.instructorName && (
          <p className="text-xs text-gray-500">{course.instructorName}</p>
        )}

        <StarRating rating={course.rating} />

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Users className="h-3 w-3" />
          <span>{(course.enrollmentCount ?? 0).toLocaleString()} enrolled</span>
        </div>

        {course.category && (
          <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {course.category}
          </span>
        )}

        <button className="w-full mt-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
          Enroll
        </button>
      </div>
    </div>
  );
}

function CourseCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-64 bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-32 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-3 bg-gray-100 rounded w-4/6" />
        <div className="h-3 bg-gray-100 rounded w-3/6" />
        <div className="h-3 bg-gray-200 rounded w-2/6" />
        <div className="h-8 bg-gray-200 rounded-lg w-full" />
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  courses: CourseRecommendation[];
  isLoading: boolean;
}

function Section({ title, icon, courses, isLoading }: SectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {!isLoading && (
          <span className="text-sm text-gray-400">({courses.length})</span>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {isLoading
          ? [0, 1, 2].map((i) => <CourseCardSkeleton key={i} />)
          : courses.length > 0
          ? courses.map((course) => (
              <CourseCard key={course.courseId} course={course} />
            ))
          : (
            <p className="text-sm text-gray-400 py-4">No courses available right now.</p>
          )}
      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  const qc = useQueryClient();

  const { data, isLoading, isFetching, isError, error } = useQuery<PersonalizedFeed>({
    queryKey: ['recommendations', 'feed'],
    queryFn: () =>
      api.get('/ai/recommendations/feed').then((r) => r.data.data as PersonalizedFeed),
    retry: 1,
  });

  const handleRefresh = () => {
    void qc.invalidateQueries({ queryKey: ['recommendations'] });
  };

  const recommendations = data?.recommendations ?? [];
  const trending = data?.trending ?? [];
  const newCourses = data?.newCourses ?? [];

  const apiErr = error as ApiError | null;
  const isKeyMissing =
    apiErr?.statusCode === 500 ||
    apiErr?.statusCode === 0 ||
    (apiErr?.message ?? '').toLowerCase().includes('api key') ||
    (apiErr?.message ?? '').toLowerCase().includes('placeholder');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recommendations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Personalized courses curated just for you
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          Refresh Recommendations
        </button>
      </div>

      {/* Error Banner */}
      {isError && (
        <div className={cn(
          'border rounded-lg p-4 flex items-start gap-3',
          isKeyMissing ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200',
        )}>
          <AlertTriangle className={cn('h-5 w-5 shrink-0 mt-0.5', isKeyMissing ? 'text-amber-500' : 'text-red-500')} />
          <div>
            <p className={cn('font-medium text-sm', isKeyMissing ? 'text-amber-800' : 'text-red-800')}>
              {isKeyMissing ? 'AI recommendations unavailable' : 'Failed to load recommendations'}
            </p>
            <p className={cn('text-xs mt-1', isKeyMissing ? 'text-amber-600' : 'text-red-600')}>
              {isKeyMissing
                ? 'Add ANTHROPIC_API_KEY and OPENAI_API_KEY to the backend .env file to enable personalized recommendations.'
                : (apiErr?.message ?? 'An unexpected error occurred. Please try again.')}
            </p>
          </div>
        </div>
      )}

      {/* Three sections */}
      <Section
        title="Recommended for You"
        icon={<Sparkles className="h-4 w-4 text-blue-600" />}
        courses={recommendations}
        isLoading={isLoading}
      />

      <Section
        title="Trending Now"
        icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
        courses={trending}
        isLoading={isLoading}
      />

      <Section
        title="New Courses"
        icon={<Zap className="h-4 w-4 text-blue-600" />}
        courses={newCourses}
        isLoading={isLoading}
      />
    </div>
  );
}
