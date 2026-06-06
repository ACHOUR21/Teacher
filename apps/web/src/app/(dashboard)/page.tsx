'use client';

import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Users, BookOpen, Video, DollarSign, Link2, Copy, Check, Play, CheckCircle, Target, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import Link from 'next/link';

function InviteCard() {
  const user = useAuthStore((s) => s.user);
  const [copied, setCopied] = useState(false);

  if (!user?.tenantSlug) return null;

  const joinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${user.tenantSlug}`;

  const copy = () => {
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
            <Link2 className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Student invite link</p>
            <p className="text-xs text-gray-500 truncate mt-0.5">{joinUrl}</p>
          </div>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function InviteCardWrapper() {
  const { isStudent, isParent } = useAuth();
  if (isStudent || isParent) return null;
  return <InviteCard />;
}

function TeacherDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: profile } = useQuery({
    queryKey: ['teacher-me'],
    queryFn: () => api.get('/teachers/me').then(r => r.data.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['teacher-me-stats'],
    queryFn: () => api.get('/teachers/me/stats').then(r => r.data.data),
  });

  const { data: sessions } = useQuery({
    queryKey: ['live-sessions'],
    queryFn: () => api.get('/live/sessions').then(r => r.data.data),
  });

  const upcoming = (sessions?.data ?? []).filter((s: any) => s.status === 'SCHEDULED').slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-sm text-gray-500 mt-1">Here's how your courses are performing</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'My Courses', value: stats?.coursesCount ?? '—', icon: BookOpen, color: 'text-blue-500 bg-blue-50' },
          { label: 'Total Students', value: stats?.studentsCount ?? '—', icon: Users, color: 'text-purple-500 bg-purple-50' },
          { label: 'Avg Rating', value: stats?.avgRating ? stats.avgRating.toFixed(1) : '—', icon: DollarSign, color: 'text-amber-500 bg-amber-50' },
          { label: 'Completions', value: stats?.completionsCount ?? '—', icon: Video, color: 'text-green-500 bg-green-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center mb-3', stat.color.split(' ')[1])}>
              <stat.icon className={cn('h-4 w-4', stat.color.split(' ')[0])} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{String(stat.value)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent courses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              My Courses
              <Link href="/courses" className="text-xs text-blue-600 font-normal hover:underline">View all</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!profile?.courses?.length ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                No published courses yet.{' '}
                <Link href="/courses/new" className="text-blue-600 hover:underline">Create one</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {profile.courses.map((c: any) => (
                  <Link key={c.id} href={`/courses/${c.id}`} className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className="h-10 w-14 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 overflow-hidden">
                      {c.thumbnailUrl && <img src={c.thumbnailUrl} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                      <p className="text-xs text-gray-500">{c.enrollCount ?? 0} students · ★ {c.rating?.toFixed(1) ?? '—'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Upcoming Sessions
              <Link href="/live" className="text-xs text-blue-600 font-normal hover:underline">View all</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!upcoming.length ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                No upcoming sessions.{' '}
                <Link href="/live" className="text-blue-600 hover:underline">Schedule one</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3 p-2">
                    <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Video className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{s.title}</p>
                      <p className="text-xs text-gray-500">{new Date(s.scheduledAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StudentDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: progress, isLoading } = useQuery({
    queryKey: ['student-me-progress'],
    queryFn: () => api.get('/students/me/progress').then(r => r.data.data as any[]),
  });

  const { data: performance } = useQuery({
    queryKey: ['student-me-performance'],
    queryFn: () => api.get('/students/me/performance').then(r => r.data.data),
  });

  const inProgress = (progress ?? []).filter((p: any) => !p.completedAt).slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-sm text-gray-500 mt-1">Pick up where you left off</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Enrolled', value: performance?.totalCourses ?? '—', icon: BookOpen, color: 'text-blue-500 bg-blue-50' },
          { label: 'Completed', value: performance?.completedCourses ?? '—', icon: CheckCircle, color: 'text-green-500 bg-green-50' },
          { label: 'Completion Rate', value: performance?.completionRate != null ? `${performance.completionRate}%` : '—', icon: Target, color: 'text-purple-500 bg-purple-50' },
          { label: 'Points', value: performance?.points ?? '—', icon: Trophy, color: 'text-amber-500 bg-amber-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center mb-3', stat.color.split(' ')[1])}>
              <stat.icon className={cn('h-4 w-4', stat.color.split(' ')[0])} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{String(stat.value)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Play className="h-4 w-4 text-blue-500" /> Continue Learning
            </h2>
            <Link href="/my-learning" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : inProgress.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 py-10 text-center">
              <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No courses in progress</p>
              <Link href="/marketplace" className="mt-2 inline-block text-sm text-blue-600 hover:underline">Browse courses</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {inProgress.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/courses/${p.courseId}/learn`}
                  className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm hover:border-blue-200 transition-all"
                >
                  <div className="h-14 w-20 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 overflow-hidden">
                    {p.course?.thumbnailUrl && (
                      <img src={p.course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{p.course?.title}</p>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{p.progressPct ?? 0}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.progressPct ?? 0}%` }} />
                      </div>
                    </div>
                  </div>
                  <Play className="h-4 w-4 text-blue-500 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Quick Links</h3>
              <div className="space-y-2">
                {[
                  { label: 'Browse Marketplace', href: '/marketplace', icon: BookOpen },
                  { label: 'Ask AI Tutor', href: '/ai-tutor', icon: Video },
                  { label: 'My Certificates', href: '/certificates', icon: CheckCircle },
                ].map(link => (
                  <Link key={link.href} href={link.href} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <link.icon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{link.label}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { isStudent, isTeacher } = useAuth();

  const { data: overview } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get('/analytics/overview').then(r => r.data.data),
    enabled: !isStudent && !isTeacher,
  });

  const { data: userGrowth } = useQuery({
    queryKey: ['analytics', 'user-growth'],
    queryFn: () => api.get('/analytics/user-growth?days=30').then(r => r.data.data),
    enabled: !isStudent && !isTeacher,
  });

  const { data: topCourses } = useQuery({
    queryKey: ['analytics', 'courses'],
    queryFn: () => api.get('/analytics/courses').then(r => r.data.data),
    enabled: !isStudent && !isTeacher,
  });

  if (isStudent) return <StudentDashboard />;
  if (isTeacher) return <TeacherDashboard />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back. Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={overview?.totalUsers?.toLocaleString() ?? '—'}
          icon={Users}
          trend={{ value: 12.5, direction: 'up' }}
          color="blue"
        />
        <StatsCard
          title="Active Courses"
          value={overview?.totalCourses?.toLocaleString() ?? '—'}
          icon={BookOpen}
          trend={{ value: 4.1, direction: 'up' }}
          color="purple"
        />
        <StatsCard
          title="Live Sessions"
          value={overview?.activeSessions?.toString() ?? '0'}
          icon={Video}
          color="green"
        />
        <StatsCard
          title="Monthly Revenue"
          value={overview?.totalRevenue ? `$${Number(overview.totalRevenue).toLocaleString()}` : '—'}
          icon={DollarSign}
          trend={{ value: 8.3, direction: 'up' }}
          color="orange"
        />
      </div>

      <InviteCardWrapper />

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={userGrowth ?? []}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#2563EB" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Courses by Enrollment</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topCourses?.slice(0, 6) ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="title" type="category" tick={{ fontSize: 10 }} width={100} />
                <Tooltip />
                <Bar dataKey="enrollCount" fill="#7C3AED" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Course</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Enrollments</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Rating</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Completions</th>
                </tr>
              </thead>
              <tbody>
                {(topCourses ?? []).map((course: any, i: number) => (
                  <tr key={course.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-xs w-5">{i + 1}</span>
                        <span className="font-medium text-gray-900 truncate max-w-[200px]">{course.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{course.enrollCount ?? 0}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span>{course.rating?.toFixed(1) ?? '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{course._count?.progress ?? 0}</td>
                  </tr>
                ))}
                {!topCourses?.length && (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-400">No courses yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
