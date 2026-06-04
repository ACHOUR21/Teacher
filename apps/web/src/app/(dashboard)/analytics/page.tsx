'use client';

import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2'];

export default function AnalyticsPage() {
  const { data: overview } = useQuery({ queryKey: ['analytics', 'overview'], queryFn: () => api.get('/analytics/overview').then(r => r.data.data) });
  const { data: userGrowth } = useQuery({ queryKey: ['analytics', 'user-growth', 30], queryFn: () => api.get('/analytics/user-growth?days=30').then(r => r.data.data) });
  const { data: revenue } = useQuery({ queryKey: ['analytics', 'revenue'], queryFn: () => api.get('/analytics/revenue?months=6').then(r => r.data.data) });
  const { data: aiUsage } = useQuery({ queryKey: ['analytics', 'ai-usage'], queryFn: () => api.get('/analytics/ai-usage').then(r => r.data.data) });
  const { data: studentActivity } = useQuery({ queryKey: ['analytics', 'student-activity'], queryFn: () => api.get('/analytics/student-activity?days=7').then(r => r.data.data) });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Platform performance and insights</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Students (7d)', value: studentActivity?.activeStudents ?? 0 },
          { label: 'Course Completions (7d)', value: studentActivity?.completions ?? 0 },
          { label: 'Assignments Submitted (7d)', value: studentActivity?.submissions ?? 0 },
          { label: 'AI Requests', value: aiUsage?.reduce((s: number, u: any) => s + u._count.id, 0) ?? 0 },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* User Growth */}
        <Card>
          <CardHeader><CardTitle>User Growth (30 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={userGrowth ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardHeader><CardTitle>Revenue (6 months)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenue ?? []}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v: number) => [`$${v.toFixed(0)}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#7C3AED" fill="url(#revGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI Module Usage */}
        <Card>
          <CardHeader><CardTitle>AI Feature Usage</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={aiUsage ?? []} cx="50%" cy="50%" outerRadius={80} dataKey="_count.id" nameKey="module" label={({ module }: any) => module?.replace('_', ' ')}>
                  {(aiUsage ?? []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [v, 'Requests']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI Token Usage by Module */}
        <Card>
          <CardHeader><CardTitle>AI Token Consumption</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={aiUsage?.slice(0, 6) ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <YAxis dataKey="module" type="category" tick={{ fontSize: 9 }} width={120} />
                <Tooltip formatter={(v: number) => [v.toLocaleString(), 'Tokens']} />
                <Bar dataKey="_sum.tokens" fill="#059669" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
