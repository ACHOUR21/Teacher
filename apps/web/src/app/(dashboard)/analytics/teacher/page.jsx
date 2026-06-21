'use client';
import { useQuery } from '@tanstack/react-query';
import { Users, BookOpen, TrendingUp, DollarSign, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, } from 'recharts';

import { ChartSkeleton } from '@/components/analytics/ChartSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api';
const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export default function TeacherAnalyticsPage() {
    const [sortKey, setSortKey] = useState('students');
    const [sortDir, setSortDir] = useState('desc');
    const { data: overview, isLoading: overviewLoading, isError: overviewError, refetch: refetchOverview } = useQuery({
        queryKey: ['analytics', 'teacher', 'overview'],
        queryFn: () => api.get('/analytics/teacher/overview').then(r => r.data.data),
    });
    const { data: trend, isLoading: trendLoading } = useQuery({
        queryKey: ['analytics', 'teacher', 'enrollment-trend'],
        queryFn: () => api.get('/analytics/teacher/enrollment-trend?days=30').then(r => r.data.data),
    });
    const { data: courses, isLoading: coursesLoading, isError: coursesError, refetch: refetchCourses } = useQuery({
        queryKey: ['analytics', 'teacher', 'courses'],
        queryFn: () => api.get('/analytics/teacher/courses').then(r => r.data.data),
    });
    const { data: topStudents, isLoading: studentsLoading } = useQuery({
        queryKey: ['analytics', 'teacher', 'top-students'],
        queryFn: () => api.get('/analytics/teacher/top-students').then(r => r.data.data),
    });
    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        }
        else {
            setSortKey(key);
            setSortDir('desc');
        }
    };
    const sortedCourses = [...(courses ?? [])].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (typeof av === 'string') {
            return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        }
        return sortDir === 'asc' ? av - bv : bv - av;
    });
    const kpis = [
        {
            label: 'Total Students',
            value: overviewLoading ? null : (overview?.totalStudents ?? 0).toLocaleString(),
            icon: Users,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
        },
        {
            label: 'Active Courses',
            value: overviewLoading ? null : (overview?.totalCourses ?? 0).toLocaleString(),
            icon: BookOpen,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
        },
        {
            label: 'Avg Completion Rate',
            value: overviewLoading ? null : `${(overview?.avgCompletionRate ?? 0).toFixed(1)}%`,
            icon: TrendingUp,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
        },
        {
            label: 'Monthly Revenue',
            value: overviewLoading ? null : fmt.format(overview?.monthlyRevenue ?? 0),
            icon: DollarSign,
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
        },
    ];
    const SortIcon = ({ col }) => {
        if (sortKey !== col)
            {return <ArrowUpDown className="h-3.5 w-3.5 text-gray-400"/>;}
        return sortDir === 'asc'
            ? <ArrowUp className="h-3.5 w-3.5 text-blue-600"/>
            : <ArrowDown className="h-3.5 w-3.5 text-blue-600"/>;
    };
    return (<div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Teacher Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Your course performance and student insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, iconBg, iconColor }) => (<Card key={label}>
            <CardContent className="pt-5">
              {overviewLoading ? (<div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"/>
                  <div className="h-7 bg-gray-200 rounded w-1/2"/>
                </div>) : overviewError ? (<div className="text-xs text-red-500">
                  Failed to load
                  <button onClick={() => refetchOverview()} className="ml-2 underline">Retry</button>
                </div>) : (<div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                    <Icon className={`h-5 w-5 ${iconColor}`}/>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                </div>)}
            </CardContent>
          </Card>))}
      </div>

      {/* Enrollment Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Enrollment Activity (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {trendLoading ? (<ChartSkeleton height={240}/>) : (<ResponsiveContainer width="100%" height={240}>
              <LineChart data={trend ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d?.slice(5) ?? d}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip labelFormatter={(l) => `Date: ${l}`} formatter={(v) => [v, 'Active Students']}/>
                <Line type="monotone" dataKey="count" name="Active Students" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}/>
              </LineChart>
            </ResponsiveContainer>)}
          {!trendLoading && (!trend || trend.length === 0) && (<p className="text-sm text-gray-400 text-center py-8">No enrollment activity in the last 30 days</p>)}
        </CardContent>
      </Card>

      {/* Course Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Course Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {coursesLoading ? (<div className="animate-pulse space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-10 bg-gray-100 rounded"/>))}
            </div>) : coursesError ? (<div className="py-8 text-center">
              <p className="text-sm text-red-500 mb-2">Failed to load course data</p>
              <button onClick={() => refetchCourses()} className="text-sm text-blue-600 underline">
                Retry
              </button>
            </div>) : (<div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {[
                { key: 'title', label: 'Course Name' },
                { key: 'students', label: 'Students' },
                { key: 'completionRate', label: 'Completion %' },
                { key: 'avgScore', label: 'Avg Score' },
                { key: 'revenue', label: 'Revenue' },
            ].map(({ key, label }) => (<th key={key} className="text-left py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort(key)}>
                        <span className="flex items-center gap-1">
                          {label}
                          <SortIcon col={key}/>
                        </span>
                      </th>))}
                  </tr>
                </thead>
                <tbody>
                  {sortedCourses.map((c) => (<tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900 truncate max-w-xs">{c.title}</p>
                      </td>
                      <td className="py-3 px-4 font-medium">{(c.students ?? 0).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-16">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${c.completionRate ?? 0}%` }}/>
                          </div>
                          <span className="text-xs text-gray-600">{c.completionRate ?? 0}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${(c.avgScore ?? 0) >= 80 ? 'text-green-600' : (c.avgScore ?? 0) >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {c.avgScore ?? 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">{fmt.format(c.revenue ?? 0)}</td>
                    </tr>))}
                  {!sortedCourses.length && (<tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        No course data yet
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>)}
        </CardContent>
      </Card>

      {/* Top Students */}
      <Card>
        <CardHeader>
          <CardTitle>Top Students by Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {studentsLoading ? (<div className="animate-pulse space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (<div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gray-200"/>
                  <div className="flex-1 h-4 bg-gray-200 rounded"/>
                  <div className="h-4 w-12 bg-gray-200 rounded"/>
                </div>))}
            </div>) : (<div className="space-y-3">
              {(topStudents ?? []).slice(0, 5).map((s, i) => (<div key={i} className="flex items-center gap-3">
                  {s.avatar ? (<img src={s.avatar} alt={s.name} className="h-9 w-9 rounded-full object-cover"/>) : (<div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                      {s.name?.charAt(0) ?? '?'}
                    </div>)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${s.progress ?? 0}%` }}/>
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-right">{s.progress ?? 0}%</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-400 w-5 text-right flex-shrink-0">
                    #{i + 1}
                  </span>
                </div>))}
              {!topStudents?.length && (<p className="text-sm text-gray-400 text-center py-4">No student data yet</p>)}
            </div>)}
        </CardContent>
      </Card>
    </div>);
}
