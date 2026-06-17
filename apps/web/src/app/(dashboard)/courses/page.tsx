'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpen, Star, Clock, ShoppingBag, CheckCircle, Play } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type Tab = 'all' | 'in-progress' | 'completed';

interface EnrolledCourse {
  id: string;
  courseId: string;
  progressPct: number;
  completedAt: string | null;
  lastAccessedAt: string | null;
  course: {
    id: string;
    title: string;
    thumbnailUrl?: string;
    category?: string;
    level: string;
    price: number;
    rating: number;
    enrollCount?: number;
    totalLessons?: number;
    totalDuration?: number;
    teacher?: { user: { firstName: string; lastName: string } };
  };
}

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: 'bg-green-100 text-green-700',
  INTERMEDIATE: 'bg-blue-100 text-blue-700',
  ADVANCED: 'bg-orange-100 text-orange-700',
  EXPERT: 'bg-red-100 text-red-700',
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced: 'bg-orange-100 text-orange-700',
};

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3 w-3',
            i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
          )}
        />
      ))}
      <span className="ml-1 text-xs text-gray-500">{rating.toFixed(1)}</span>
    </span>
  );
}

function CourseCard({ enrollment }: { enrollment: EnrolledCourse }) {
  const { course, progressPct, completedAt, lastAccessedAt } = enrollment;
  const isComplete = !!completedAt;
  const pct = progressPct ?? 0;
  const durationH = Math.floor((course.totalDuration ?? 0) / 3600);
  const durationM = Math.floor(((course.totalDuration ?? 0) % 3600) / 60);
  const lastAccessed = lastAccessedAt ? new Date(lastAccessedAt).toLocaleDateString() : null;

  return (
    <Link
      href={`/courses/${course.id}/learn`}
      className="group block bg-card rounded-xl border border-border overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="relative h-40 bg-gradient-to-br from-blue-500 to-purple-600">
        {course.thumbnailUrl && (
          <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover" />
        )}
        <div className="absolute top-2 left-2">
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', LEVEL_COLORS[course.level] ?? 'bg-gray-100 text-gray-700')}>
            {course.level}
          </span>
        </div>
        {isComplete && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Done
          </div>
        )}
      </div>

      <div className="p-4">
        {course.category && (
          <p className="text-xs text-blue-600 font-medium mb-1">{course.category}</p>
        )}
        <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-2">
          {course.title}
        </h3>

        {course.teacher && (
          <p className="text-xs text-muted-foreground mb-2">
            {course.teacher.user.firstName} {course.teacher.user.lastName}
          </p>
        )}

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{pct}% complete</span>
            {course.totalLessons && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {course.totalLessons} lessons
              </span>
            )}
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', isComplete ? 'bg-green-500' : 'bg-primary')}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <StarRating rating={course.rating ?? 0} />
          {(durationH > 0 || durationM > 0) && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {durationH > 0 ? `${durationH}h` : ''}{durationM > 0 ? ` ${durationM}m` : ''}
            </span>
          )}
        </div>

        {lastAccessed && (
          <p className="text-xs text-muted-foreground/70 mt-1">Last accessed {lastAccessed}</p>
        )}
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="h-40 bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-4/5" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-2 bg-muted rounded-full" />
      </div>
    </div>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
];

export default function CoursesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const { data: enrollments = [], isLoading } = useQuery<EnrolledCourse[]>({
    queryKey: ['courses', 'enrolled'],
    queryFn: () => api.get('/courses/enrolled').then(r => r.data.data ?? r.data),
  });

  const filtered = enrollments.filter((e) => {
    if (activeTab === 'in-progress') {return !e.completedAt && (e.progressPct ?? 0) > 0;}
    if (activeTab === 'completed') {return !!e.completedAt;}
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? 'Loading…' : `${enrollments.length} enrolled course${enrollments.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/marketplace">
          <Button variant="outline" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Browse Marketplace
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            {tab.label}
            {!isLoading && (
              <span className={cn(
                'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                {tab.id === 'all'
                  ? enrollments.length
                  : tab.id === 'in-progress'
                  ? enrollments.filter(e => !e.completedAt && (e.progressPct ?? 0) > 0).length
                  : enrollments.filter(e => !!e.completedAt).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-2xl text-center">
          <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium text-base">
            {activeTab === 'all'
              ? "You haven't enrolled in any courses yet"
              : activeTab === 'in-progress'
              ? 'No courses in progress'
              : 'No completed courses yet'}
          </p>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            {activeTab === 'all'
              ? 'Browse our marketplace to find courses you love'
              : activeTab === 'in-progress'
              ? 'Start a course to see it here'
              : 'Keep learning to complete a course'}
          </p>
          <Link href="/marketplace">
            <Button className="gap-2">
              <Play className="h-4 w-4" />
              Browse Courses
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(enrollment => (
            <CourseCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      )}
    </div>
  );
}
