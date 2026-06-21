'use client';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Clock, Trophy, Target, CheckCircle, Play, BarChart2, Star } from 'lucide-react';
import Link from 'next/link';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
export default function MyLearningPage() {
    const { data: progress, isLoading: progressLoading } = useQuery({
        queryKey: ['student-me-progress'],
        queryFn: () => api.get('/students/me/progress').then(r => r.data.data),
    });
    const { data: performance } = useQuery({
        queryKey: ['student-me-performance'],
        queryFn: () => api.get('/students/me/performance').then(r => r.data.data),
    });
    const inProgress = (progress ?? []).filter((p) => !p.completedAt);
    const completed = (progress ?? []).filter((p) => !!p.completedAt);
    return (<div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Learning</h1>
        <p className="text-sm text-gray-500 mt-1">Track your progress and continue where you left off</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
            { label: 'Enrolled', value: performance?.totalCourses ?? '—', icon: BookOpen, color: 'text-blue-500 bg-blue-50' },
            { label: 'Completed', value: performance?.completedCourses ?? '—', icon: CheckCircle, color: 'text-green-500 bg-green-50' },
            { label: 'Completion Rate', value: performance?.completionRate !== null && performance?.completionRate !== undefined ? `${performance.completionRate}%` : '—', icon: Target, color: 'text-purple-500 bg-purple-50' },
            { label: 'Points', value: performance?.points ?? '—', icon: Trophy, color: 'text-amber-500 bg-amber-50' },
        ].map(stat => (<div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center mb-3', stat.color.split(' ')[1])}>
              <stat.icon className={cn('h-4 w-4', stat.color.split(' ')[0])}/>
            </div>
            <p className="text-2xl font-bold text-gray-900">{String(stat.value)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>))}
      </div>

      {/* In progress */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Play className="h-4 w-4 text-blue-500"/> Continue Learning
        </h2>
        {progressLoading ? (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse"/>))}
          </div>) : inProgress.length === 0 ? (<div className="bg-white rounded-xl border border-gray-200 py-10 text-center">
            <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3"/>
            <p className="text-gray-500 text-sm">No courses in progress</p>
            <Link href="/marketplace" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
              Browse courses
            </Link>
          </div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgress.map((p) => (<CourseProgressCard key={p.id} progress={p}/>))}
          </div>)}
      </div>

      {/* Completed */}
      {completed.length > 0 && (<div>
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500"/> Completed Courses
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completed.map((p) => (<CourseProgressCard key={p.id} progress={p}/>))}
          </div>
        </div>)}

      {/* Performance details */}
      {performance && (<div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-purple-500"/> Performance Summary
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-gray-500">Avg Score</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {performance.avgScore > 0 ? `${performance.avgScore.toFixed(1)}%` : '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Pending Assignments</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{performance.pendingAssignments}</p>
            </div>
            <div>
              <p className="text-gray-500">Level</p>
              <p className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-400"/> {performance.level}
              </p>
            </div>
          </div>
        </div>)}
    </div>);
}
function CourseProgressCard({ progress }) {
    const pct = progress.progressPct ?? 0;
    const isComplete = !!progress.completedAt;
    const lastAccessed = progress.lastAccessedAt
        ? new Date(progress.lastAccessedAt).toLocaleDateString()
        : null;
    return (<Link href={`/courses/${progress.courseId}/learn`} className="block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all">
      {/* Thumbnail */}
      <div className="relative h-32 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
        {progress.course?.thumbnailUrl && (<img src={progress.course.thumbnailUrl} alt={progress.course.title} className="w-full h-full object-cover"/>)}
        {isComplete && (<div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle className="h-3 w-3"/> Done
          </div>)}
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-3">
          {progress.course?.title ?? 'Course'}
        </h3>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{pct}% complete</span>
            {progress.course?.totalLessons && (<span className="flex items-center gap-1">
                <Clock className="h-3 w-3"/>
                {progress.course.totalLessons} lessons
              </span>)}
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', isComplete ? 'bg-green-500' : 'bg-blue-500')} style={{ width: `${pct}%` }}/>
          </div>
        </div>

        {lastAccessed && (<p className="text-xs text-gray-400">Last accessed {lastAccessed}</p>)}
      </div>
    </Link>);
}
