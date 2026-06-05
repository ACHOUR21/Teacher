'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { CourseCard } from '@/components/courses/CourseCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

const LEVELS = ['All', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
const CATEGORIES = ['All', 'Mathematics', 'Science', 'History', 'Language', 'Technology', 'Arts'];

export default function CoursesPage() {
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('All');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const { isAdmin, isTeacher } = useAuth();

  const { data, isLoading } = useCourses({ search, level: level === 'All' ? undefined : level, category: category === 'All' ? undefined : category, page, limit: 12 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.total ?? 0} courses available</p>
        </div>
        {(isAdmin || isTeacher) && (
          <Link href="/courses/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>Create Course</Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={level}
          onChange={e => { setLevel(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-60 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {data?.data?.map((course: any) => <CourseCard key={course.id} course={course} />)}
          </div>
          {!data?.data?.length && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg font-medium">No courses found</p>
              <p className="text-sm mt-1">Try adjusting your filters or create a new course</p>
            </div>
          )}

          {/* Pagination */}
          {(data?.totalPages ?? 0) > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {data?.totalPages}</span>
              <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={page === data?.totalPages}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
