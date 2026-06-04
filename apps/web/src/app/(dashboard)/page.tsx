'use client';

import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Users, BookOpen, Video, DollarSign, TrendingUp, Award } from 'lucide-react';
import { api } from '@/lib/api';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { data: overview } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get('/analytics/overview').then(r => r.data.data),
  });

  const { data: userGrowth } = useQuery({
    queryKey: ['analytics', 'user-growth'],
    queryFn: () => api.get('/analytics/user-growth?days=30').then(r => r.data.data),
  });

  const { data: topCourses } = useQuery({
    queryKey: ['analytics', 'courses'],
    queryFn: () => api.get('/analytics/courses').then(r => r.data.data),
  });

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
