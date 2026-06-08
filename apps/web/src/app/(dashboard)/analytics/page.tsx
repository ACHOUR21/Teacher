'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Users, BookOpen, TrendingUp, DollarSign, Zap, Activity, Star, Award } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { ChartTooltip } from '@/components/analytics/ChartTooltip';
import { ChartSkeleton } from '@/components/analytics/ChartSkeleton';
import { SparklineCard } from '@/components/analytics/SparklineCard';
import { ExportButton } from '@/components/analytics/ExportButton';

const COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#DB2777', '#65A30D'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
type Tab = 'overview' | 'courses' | 'students' | 'revenue' | 'ai';

const TABS: { id: Tab; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'revenue', label: 'Revenue', icon: DollarSign },
  { id: 'ai', label: 'AI Usage', icon: Zap },
];

const RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [range, setRange] = useState(30);

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get('/analytics/overview').then(r => r.data.data),
  });
  const { data: userGrowth, isLoading: growthLoading } = useQuery({
    queryKey: ['analytics', 'user-growth', range],
    queryFn: () => api.get(`/analytics/user-growth?days=${range}`).then(r => r.data.data),
  });
  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: () => api.get('/analytics/revenue?months=12').then(r => r.data.data),
  });
  const { data: aiUsage, isLoading: aiLoading } = useQuery({
    queryKey: ['analytics', 'ai-usage'],
    queryFn: () => api.get('/analytics/ai-usage').then(r => r.data.data),
  });
  const { data: studentActivity } = useQuery({
    queryKey: ['analytics', 'student-activity', range],
    queryFn: () => api.get(`/analytics/student-activity?days=${range}`).then(r => r.data.data),
  });
  const { data: topCourses, isLoading: coursesLoading } = useQuery({
    queryKey: ['analytics', 'top-courses'],
    queryFn: () => api.get('/analytics/top-courses').then(r => r.data.data),
  });
  const { data: engagement } = useQuery({
    queryKey: ['analytics', 'engagement'],
    queryFn: () => api.get('/analytics/engagement').then(r => r.data.data),
  });

  const totalAiRequests = (aiUsage ?? []).reduce((s: number, u: any) => s + (u._count?.id ?? 0), 0);
  const totalAiCost = (aiUsage ?? []).reduce((s: number, u: any) => s + Number(u._sum?.cost ?? 0), 0);

  const heatmapMax = Math.max(1, ...(engagement ?? []).map((e: any) => e.count));
  const heatmapByKey: Record<string, number> = {};
  (engagement ?? []).forEach((e: any) => { heatmapByKey[`${e.day}-${e.hour}`] = e.count; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Platform performance and insights</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {RANGES.map(r => (
            <button
              key={r.days}
              onClick={() => setRange(r.days)}
              className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                range === r.days ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Strip — SparklineCards with inline mini charts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SparklineCard
          title="Total Users"
          value={overview?.totalUsers ?? 0}
          change="+12% vs last period"
          trend="up"
          sparkData={(userGrowth ?? []).map((d: any) => ({ value: d.count ?? 0 }))}
          sparkColor="#2563EB"
          icon={<Users className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-100"
          loading={overviewLoading}
        />
        <SparklineCard
          title="Published Courses"
          value={overview?.totalCourses ?? 0}
          change="+4% vs last period"
          trend="up"
          sparkColor="#7C3AED"
          icon={<BookOpen className="h-5 w-5 text-purple-600" />}
          iconBg="bg-purple-100"
          loading={overviewLoading}
        />
        <SparklineCard
          title="Total Revenue"
          value={`$${Number(overview?.totalRevenue ?? 0).toFixed(0)}`}
          change="+8% vs last period"
          trend="up"
          sparkData={(revenue ?? []).map((d: any) => ({ value: d.revenue ?? 0 }))}
          sparkColor="#059669"
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
          iconBg="bg-green-100"
          loading={overviewLoading || revenueLoading}
        />
        <SparklineCard
          title="AI Requests"
          value={totalAiRequests}
          change="+23% vs last period"
          trend="up"
          sparkColor="#D97706"
          icon={<Zap className="h-5 w-5 text-orange-600" />}
          iconBg="bg-orange-100"
          loading={aiLoading}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn('flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                tab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>User Growth</CardTitle>
                <ExportButton
                  data={userGrowth ?? []}
                  filename="user-growth"
                  label="Export"
                />
              </div>
            </CardHeader>
            <CardContent>
              {growthLoading ? <ChartSkeleton height={220} /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={userGrowth ?? []}>
                    <defs>
                      <linearGradient id="ugGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d?.slice(5) ?? d} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip content={<ChartTooltip labelFormatter={d => `Date: ${d}`} valueFormatter={v => String(v)} />} />
                    <Area type="monotone" dataKey="count" name="New Users" stroke="#2563EB" fill="url(#ugGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Student Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { label: 'Active Students', value: studentActivity?.activeStudents ?? 0 },
                  { label: 'Completions', value: studentActivity?.completions ?? 0 },
                  { label: 'Submissions', value: studentActivity?.submissions ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-900">{value.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Revenue Trend</CardTitle>
                <ExportButton data={revenue ?? []} filename="revenue" label="Export" />
              </div>
            </CardHeader>
            <CardContent>
              {revenueLoading ? <ChartSkeleton height={220} /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revenue ?? []}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      content={<ChartTooltip
                        valueFormatter={v => `$${Number(v).toLocaleString()}`}
                      />}
                    />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#7C3AED" fill="url(#revGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>AI Feature Distribution</CardTitle></CardHeader>
            <CardContent>
              {aiLoading ? <ChartSkeleton height={220} /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={aiUsage ?? []}
                      cx="50%" cy="50%"
                      outerRadius={75}
                      innerRadius={40}
                      dataKey="_count.id"
                      nameKey="module"
                      label={({ module }: any) => module?.replace(/_/g, ' ')?.slice(0, 8)}
                    >
                      {(aiUsage ?? []).map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip valueFormatter={v => `${v} requests`} />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Courses Tab */}
      {tab === 'courses' && (
        <div className="space-y-5">
          {/* ComposedChart: enrollments (bar) + completion rate (line) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Enrollment vs Completion Rate</CardTitle>
                <ExportButton
                  data={(topCourses ?? []).map((c: any) => ({
                    title: c.title,
                    enrollments: c.enrollCount,
                    completionRate: c.completionRate,
                  }))}
                  filename="enrollment-vs-completion"
                  label="Export"
                />
              </div>
            </CardHeader>
            <CardContent>
              {coursesLoading ? <ChartSkeleton height={260} /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={(topCourses ?? []).slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="title"
                      tick={{ fontSize: 9 }}
                      tickFormatter={(t: string) => t.length > 12 ? t.slice(0, 12) + '…' : t}
                    />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} orientation="left" />
                    <YAxis
                      yAxisId="right"
                      tick={{ fontSize: 10 }}
                      orientation="right"
                      tickFormatter={v => `${v}%`}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      content={<ChartTooltip
                        valueFormatter={(v, name) =>
                          name === 'Completion %' ? `${v}%` : String(v)
                        }
                      />}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="left" dataKey="enrollCount" name="Enrollments" fill="#2563EB" radius={[3, 3, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="completionRate" name="Completion %" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Top Courses by Enrollment</CardTitle>
                <ExportButton data={topCourses ?? []} filename="top-courses" label="Export" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">#</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Course</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Enrollments</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Completions</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Rate</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(topCourses ?? []).map((c: any, i: number) => (
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-400 font-medium">{i + 1}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900 truncate max-w-xs">{c.title}</p>
                            <p className="text-xs text-gray-400">{c.category}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">{(c.enrollCount ?? 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-gray-600">{(c.completions ?? 0).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-16">
                              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${c.completionRate ?? 0}%` }} />
                            </div>
                            <span className="text-xs text-gray-600">{c.completionRate ?? 0}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1 text-yellow-600 font-medium">
                            <Star className="h-3.5 w-3.5 fill-current" />{Number(c.rating ?? 0).toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!topCourses?.length && (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-400">No course data yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader><CardTitle>Enrollment by Course (Top 8)</CardTitle></CardHeader>
              <CardContent>
                {coursesLoading ? <ChartSkeleton height={260} /> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={(topCourses ?? []).slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="title" type="category" tick={{ fontSize: 9 }} width={130}
                        tickFormatter={(t: string) => t.length > 18 ? t.slice(0, 18) + '…' : t} />
                      <Tooltip content={<ChartTooltip valueFormatter={v => `${v} students`} />} />
                      <Bar dataKey="enrollCount" name="Enrollments" fill="#2563EB" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Completion Rate by Course</CardTitle></CardHeader>
              <CardContent>
                {coursesLoading ? <ChartSkeleton height={260} /> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={(topCourses ?? []).slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                      <YAxis dataKey="title" type="category" tick={{ fontSize: 9 }} width={130}
                        tickFormatter={(t: string) => t.length > 18 ? t.slice(0, 18) + '…' : t} />
                      <Tooltip content={<ChartTooltip valueFormatter={v => `${v}%`} />} />
                      <Bar dataKey="completionRate" name="Completion Rate" fill="#059669" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Students Tab */}
      {tab === 'students' && (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Heatmap (Last 28 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500 mb-4">Activity intensity by day of week and hour of day</p>
              <div className="overflow-x-auto">
                <div className="min-w-max">
                  <div className="flex gap-1 mb-1 pl-10">
                    {Array.from({ length: 24 }, (_, h) => (
                      <div key={h} className="w-6 text-center text-xs text-gray-400">
                        {h % 6 === 0 ? `${h}h` : ''}
                      </div>
                    ))}
                  </div>
                  {DAYS.map((day, d) => (
                    <div key={day} className="flex items-center gap-1 mb-1">
                      <div className="w-8 text-right text-xs text-gray-400 mr-1">{day}</div>
                      {Array.from({ length: 24 }, (_, h) => {
                        const count = heatmapByKey[`${d}-${h}`] ?? 0;
                        const intensity = count / heatmapMax;
                        return (
                          <div
                            key={h}
                            title={`${day} ${h}:00 — ${count} activities`}
                            className="w-6 h-6 rounded-sm transition-colors"
                            style={{
                              backgroundColor: count === 0
                                ? '#f3f4f6'
                                : `rgba(37,99,235,${Math.max(0.1, intensity)})`,
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
                <span>Less</span>
                {[0.1, 0.3, 0.5, 0.7, 1].map(i => (
                  <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: `rgba(37,99,235,${i})` }} />
                ))}
                <span>More</span>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader><CardTitle>New Students (last {range} days)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={userGrowth ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d?.slice(5) ?? d} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Activity Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-2">
                {[
                  { label: 'Active Students', value: studentActivity?.activeStudents ?? 0, icon: Users, color: 'blue' },
                  { label: 'Course Completions', value: studentActivity?.completions ?? 0, icon: Award, color: 'green' },
                  { label: 'Assignments Submitted', value: studentActivity?.submissions ?? 0, icon: TrendingUp, color: 'purple' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      color === 'blue' ? 'bg-blue-100' : color === 'green' ? 'bg-green-100' : 'bg-purple-100'
                    )}>
                      <Icon className={cn('h-5 w-5', color === 'blue' ? 'text-blue-600' : color === 'green' ? 'text-green-600' : 'text-purple-600')} />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{value.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{label} (last {range}d)</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {tab === 'revenue' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Total Revenue', value: `$${Number(overview?.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign },
              { label: 'Monthly (Latest)', value: `$${Number((revenue ?? []).slice(-1)[0]?.revenue ?? 0).toLocaleString()}`, icon: TrendingUp },
              { label: 'Avg Monthly', value: `$${revenue?.length ? Math.round(revenue.reduce((s: number, r: any) => s + r.revenue, 0) / revenue.length).toLocaleString() : 0}`, icon: Activity },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{value}</p>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Monthly Revenue (12 months)</CardTitle>
                <ExportButton data={revenue ?? []} filename="monthly-revenue" label="Export" />
              </div>
            </CardHeader>
            <CardContent>
              {revenueLoading ? <ChartSkeleton height={300} /> : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenue ?? []}>
                    <defs>
                      <linearGradient id="r2Grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      content={<ChartTooltip valueFormatter={v => `$${Number(v).toLocaleString()}`} />}
                    />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#059669" fill="url(#r2Grad)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Tab */}
      {tab === 'ai' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Total Requests', value: totalAiRequests.toLocaleString() },
              { label: 'Total Cost', value: `$${totalAiCost.toFixed(2)}` },
              { label: 'Avg Cost/Request', value: totalAiRequests > 0 ? `$${(totalAiCost / totalAiRequests).toFixed(4)}` : '$0' },
            ].map(({ label, value }) => (
              <Card key={label}>
                <CardContent className="pt-5">
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Requests by Module</CardTitle>
                  <ExportButton data={aiUsage ?? []} filename="ai-requests" label="Export" />
                </div>
              </CardHeader>
              <CardContent>
                {aiLoading ? <ChartSkeleton height={280} /> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={(aiUsage ?? []).slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="module" type="category" tick={{ fontSize: 10 }} width={140}
                        tickFormatter={(m: string) => m.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} />
                      <Tooltip content={<ChartTooltip valueFormatter={v => `${Number(v).toLocaleString()} req`} />} />
                      <Bar dataKey="_count.id" name="Requests" fill="#7C3AED" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Token Consumption by Module</CardTitle></CardHeader>
              <CardContent>
                {aiLoading ? <ChartSkeleton height={280} /> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={(aiUsage ?? []).slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                      <YAxis dataKey="module" type="category" tick={{ fontSize: 10 }} width={140}
                        tickFormatter={(m: string) => m.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} />
                      <Tooltip content={<ChartTooltip valueFormatter={v => `${Number(v).toLocaleString()} tokens`} />} />
                      <Bar dataKey="_sum.tokens" name="Tokens" fill="#059669" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Cost Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(aiUsage ?? []).map((u: any, i: number) => {
                    const cost = Number(u._sum?.cost ?? 0);
                    const pct = totalAiCost > 0 ? (cost / totalAiCost) * 100 : 0;
                    return (
                      <div key={u.module} className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-700 truncate">
                              {u.module.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                            </p>
                            <span className="text-sm text-gray-500 flex-shrink-0 ml-2">${cost.toFixed(3)}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 w-10 text-right flex-shrink-0">{pct.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                  {!aiUsage?.length && <p className="text-sm text-gray-400 py-4 text-center">No AI usage data yet</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
