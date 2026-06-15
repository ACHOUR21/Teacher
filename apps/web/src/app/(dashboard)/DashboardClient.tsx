'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Users, BookOpen, Video, DollarSign, Link2, Copy, Check, Play, CheckCircle, Target, Trophy, Rocket, ChevronRight, X, Activity, Bell, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';


/** Icon helper keyed on notification type */
function NotifIcon({ type }: { type: string }) {
  switch (type) {
    case 'success': return <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />;
    case 'warning': return <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />;
    case 'error': return <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />;
    default: return <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />;
  }
}

/** Real-time activity feed powered by the WebSocket notifications store */
function ActivityFeed() {
  const notifications = useUIStore((s) => s.notifications);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Live Activity
          {notifications.length > 0 && (
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              {notifications.length} event{notifications.length !== 1 ? 's' : ''}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Events will appear here in real time
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-thin pr-1">
            {notifications.slice(0, 8).map((n) => (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-3 text-sm rounded-lg p-2 transition-colors',
                  !n.read && 'bg-primary/5'
                )}
              >
                <NotifIcon type={n.type} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-xs truncate">{n.title}</p>
                  <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        {notifications.length > 0 && (
          <div className="pt-3 border-t border-border mt-3">
            <Link
              href="/dashboard/notifications"
              className="text-xs text-primary hover:underline"
            >
              View all notifications
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SetupBanner() {
  const { isAdmin } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const { data: onboarding } = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: () => api.get('/tenants/me/onboarding').then(r => r.data.data),
    enabled: isAdmin,
  });

  if (!isAdmin || dismissed || !onboarding || onboarding.completed) {return null;}

  const done = (onboarding.completedSteps?.length ?? 0);
  const total = 3;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl px-5 py-4 flex items-center gap-4 text-white shadow-sm">
      <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
        <Rocket className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Complete your school setup — {done}/{total} steps done</p>
        <div className="mt-1.5 h-1.5 bg-white/30 rounded-full overflow-hidden w-48">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <Link
        href="/onboarding"
        className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors shrink-0"
      >
        Continue <ChevronRight className="h-3.5 w-3.5" />
      </Link>
      <button onClick={() => setDismissed(true)} className="p-1 hover:bg-white/20 rounded transition-colors">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function InviteCard() {
  const user = useAuthStore((s) => s.user);
  const [copied, setCopied] = useState(false);

  if (!user?.tenantSlug) {return null;}

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
            <p className="text-sm font-semibold text-foreground">Student invite link</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{joinUrl}</p>
          </div>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-muted hover:bg-accent transition-colors shrink-0"
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
  if (isStudent || isParent) {return null;}
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

  const upcoming = (sessions?.data ?? []).filter((s: { status: string }) => s.status === 'SCHEDULED').slice(0, 3);

  return (
    <div className="space-y-6">
      <SetupBanner />
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Here's how your courses are performing</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'My Courses', value: stats?.coursesCount ?? '—', icon: BookOpen, color: 'text-blue-500 bg-blue-50' },
          { label: 'Total Students', value: stats?.studentsCount ?? '—', icon: Users, color: 'text-purple-500 bg-purple-50' },
          { label: 'Avg Rating', value: stats?.avgRating ? stats.avgRating.toFixed(1) : '—', icon: DollarSign, color: 'text-amber-500 bg-amber-50' },
          { label: 'Completions', value: stats?.completionsCount ?? '—', icon: Video, color: 'text-green-500 bg-green-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-card rounded-xl border border-border p-5">
            <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center mb-3', stat.color.split(' ')[1])}>
              <stat.icon className={cn('h-4 w-4', stat.color.split(' ')[0])} />
            </div>
            <p className="text-2xl font-bold text-foreground">{String(stat.value)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              My Courses
              <Link href="/courses" className="text-xs text-primary font-normal hover:underline">View all</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!profile?.courses?.length ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No published courses yet.{' '}
                <Link href="/courses/new" className="text-primary hover:underline">Create one</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {profile.courses.map((c: { id: string; thumbnailUrl?: string; title: string; enrollCount?: number; rating?: number }) => (
                  <Link key={c.id} href={`/courses/${c.id}`} className="flex items-center gap-3 hover:bg-accent p-2 rounded-lg transition-colors">
                    <div className="h-10 w-14 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 overflow-hidden">
                      {c.thumbnailUrl && <img src={c.thumbnailUrl} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.enrollCount ?? 0} students · ★ {c.rating?.toFixed(1) ?? '—'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Upcoming Sessions
              <Link href="/live" className="text-xs text-primary font-normal hover:underline">View all</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!upcoming.length ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No upcoming sessions.{' '}
                <Link href="/live" className="text-primary hover:underline">Schedule one</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((s: { id: string; title: string; scheduledAt: string }) => (
                  <div key={s.id} className="flex items-center gap-3 p-2">
                    <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Video className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(s.scheduledAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ActivityFeed />
    </div>
  );
}

function StudentDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: progress, isLoading } = useQuery({
    queryKey: ['student-me-progress'],
    queryFn: () => api.get('/students/me/progress').then(r => r.data.data as { id: string; completedAt?: string; courseId: string; course?: { title: string; thumbnailUrl?: string }; progressPct?: number }[]),
  });

  const { data: performance } = useQuery({
    queryKey: ['student-me-performance'],
    queryFn: () => api.get('/students/me/performance').then(r => r.data.data),
  });

  const inProgress = (progress ?? []).filter((p) => !p.completedAt).slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Pick up where you left off</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Enrolled', value: performance?.totalCourses ?? '—', icon: BookOpen, color: 'text-blue-500 bg-blue-50' },
          { label: 'Completed', value: performance?.completedCourses ?? '—', icon: CheckCircle, color: 'text-green-500 bg-green-50' },
          { label: 'Completion Rate', value: performance?.completionRate !== null && performance?.completionRate !== undefined ? `${performance.completionRate}%` : '—', icon: Target, color: 'text-purple-500 bg-purple-50' },
          { label: 'Points', value: performance?.points ?? '—', icon: Trophy, color: 'text-amber-500 bg-amber-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-card rounded-xl border border-border p-5">
            <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center mb-3', stat.color.split(' ')[1])}>
              <stat.icon className={cn('h-4 w-4', stat.color.split(' ')[0])} />
            </div>
            <p className="text-2xl font-bold text-foreground">{String(stat.value)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
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
              {[1, 2].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : inProgress.length === 0 ? (
            <div className="bg-card rounded-xl border border-border py-10 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No courses in progress</p>
              <Link href="/marketplace" className="mt-2 inline-block text-sm text-primary hover:underline">Browse courses</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {inProgress.map((p) => (
                <Link
                  key={p.id}
                  href={`/courses/${p.courseId}/learn`}
                  className="flex items-center gap-4 bg-card rounded-xl border border-border p-4 hover:shadow-sm hover:border-primary/30 transition-all"
                >
                  <div className="h-14 w-20 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 overflow-hidden">
                    {p.course?.thumbnailUrl && (
                      <img src={p.course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{p.course?.title}</p>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{p.progressPct ?? 0}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${p.progressPct ?? 0}%` }} />
                      </div>
                    </div>
                  </div>
                  <Play className="h-4 w-4 text-primary flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5">
              <h3 className="font-semibold text-foreground text-sm mb-4">Quick Links</h3>
              <div className="space-y-2">
                {[
                  { label: 'Browse Marketplace', href: '/marketplace', icon: BookOpen },
                  { label: 'Ask AI Tutor', href: '/ai-tutor', icon: Video },
                  { label: 'My Certificates', href: '/certificates', icon: CheckCircle },
                ].map(link => (
                  <Link key={link.href} href={link.href} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors">
                    <link.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{link.label}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ActivityFeed />
    </div>
  );
}

export default function DashboardClient() {
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

  if (isStudent) {return <StudentDashboard />;}
  if (isTeacher) {return <TeacherDashboard />;}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back. Here's what's happening today.</p>
      </div>

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
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} />
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

      <Card>
        <CardHeader>
          <CardTitle>Popular Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Course</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Enrollments</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Rating</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Completions</th>
                </tr>
              </thead>
              <tbody>
                {(topCourses ?? []).map((course: { id: string; title: string; enrollCount?: number; rating?: number; _count?: { progress?: number } }, i: number) => (
                  <tr key={course.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-xs w-5">{i + 1}</span>
                        <span className="font-medium text-foreground truncate max-w-[200px]">{course.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-foreground">{course.enrollCount ?? 0}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span>{course.rating?.toFixed(1) ?? '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-foreground">{course._count?.progress ?? 0}</td>
                  </tr>
                ))}
                {!topCourses?.length && (
                  <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No courses yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ActivityFeed />
    </div>
  );
}
