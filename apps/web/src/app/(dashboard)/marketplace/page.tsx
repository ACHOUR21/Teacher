'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Star, Users, ShoppingCart, Filter, BookOpen } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const CATEGORIES = ['All', 'Mathematics', 'Science', 'Technology', 'Language', 'History', 'Arts', 'Business'];
const LEVELS = ['All', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const [sort, setSort] = useState('popular');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['marketplace', search, category, level, sort, page],
    queryFn: () => api.get('/marketplace/courses', {
      params: {
        search: search || undefined,
        category: category !== 'All' ? category : undefined,
        level: level !== 'All' ? level : undefined,
        sortBy: sort,
        page,
        limit: 12,
      },
    }).then(r => r.data.data),
  });

  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => api.post(`/marketplace/courses/${courseId}/purchase`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketplace'] }),
  });

  const courses: any[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Course Marketplace</h1>
        <p className="text-sm text-gray-500 mt-1">
          {data?.total ?? 0} courses from educators worldwide
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses, topics, instructors..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => { setCategory(c); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                category === c
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select
            value={level}
            onChange={e => { setLevel(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {LEVELS.map(l => <option key={l} value={l}>{l === 'All' ? 'All Levels' : l}</option>)}
          </select>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="ml-auto flex items-center gap-1 text-xs text-gray-500">
            <Filter className="h-3.5 w-3.5" />
            {data?.total ?? 0} results
          </div>
        </div>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No courses found</p>
          <p className="text-sm text-gray-400 mt-1">Try different filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {courses.map((course: any) => (
              <MarketplaceCourseCard
                key={course.id}
                course={course}
                onEnroll={() => enrollMutation.mutate(course.id)}
                enrolling={enrollMutation.isPending}
              />
            ))}
          </div>
          {(data?.totalPages ?? 1) > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {page} of {data?.totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === data?.totalPages}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MarketplaceCourseCard({ course, onEnroll, enrolling }: {
  course: any;
  onEnroll: () => void;
  enrolling: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
      {/* Thumbnail */}
      <div className="h-36 relative overflow-hidden">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-white/60" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className="bg-white/90 backdrop-blur text-xs font-medium px-2 py-0.5 rounded-full text-gray-700">
            {course.level}
          </span>
        </div>
        {course.price === 0 && (
          <div className="absolute top-2 right-2">
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">FREE</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-2">
          {course.title}
        </h3>

        {/* Instructor */}
        {course.teacher?.user && (
          <p className="text-xs text-gray-500 mb-2 truncate">
            {course.teacher.user.firstName} {course.teacher.user.lastName}
          </p>
        )}

        {/* Rating & Enrolled */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            <span className="text-xs font-medium text-gray-700">{course.rating?.toFixed(1) ?? '—'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Users className="h-3.5 w-3.5" />
            {course.enrollCount ?? 0}
          </div>
        </div>

        {/* Price + Enroll */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-900">
            {course.price === 0 ? 'Free' : `$${course.price?.toFixed(2)}`}
          </span>
          <button
            onClick={onEnroll}
            disabled={course.isEnrolled || enrolling}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              course.isEnrolled
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'bg-blue-600 text-white hover:bg-blue-700',
            )}
          >
            {course.isEnrolled ? 'Enrolled' : (
              <><ShoppingCart className="h-3 w-3" /> Enroll</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
