'use client';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, CheckCircle, Calendar, TrendingUp } from 'lucide-react';
import { RadialBarChart, RadialBar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, } from 'recharts';

import { ChartSkeleton } from '@/components/analytics/ChartSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api';
const COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2'];
// Build an array of the last N days as ISO date strings
function buildDateGrid(days) {
    const grid = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        grid.push(d.toISOString().split('T')[0]);
    }
    return grid;
}
export default function StudentAnalyticsPage() {
    const { data: overview, isLoading: overviewLoading, isError: overviewError, refetch } = useQuery({
        queryKey: ['analytics', 'student', 'overview'],
        queryFn: () => api.get('/analytics/student/overview').then(r => r.data.data),
    });
    const { data: performance, isLoading: perfLoading } = useQuery({
        queryKey: ['analytics', 'student', 'performance'],
        queryFn: () => api.get('/analytics/student/performance').then(r => r.data.data),
    });
    const { data: activity, isLoading: activityLoading } = useQuery({
        queryKey: ['analytics', 'student', 'activity'],
        queryFn: () => api.get('/analytics/student/activity').then(r => r.data.data),
    });
    const dateGrid = buildDateGrid(90);
    const activityMap = {};
    (activity ?? []).forEach((a) => {
        activityMap[a.date] = a.count;
    });
    const maxActivity = Math.max(1, ...Object.values(activityMap));
    // Radial chart data
    const completionPct = overview
        ? overview.enrolledCourses > 0
            ? Math.round((overview.completedCourses / overview.enrolledCourses) * 100)
            : 0
        : 0;
    const radialData = [
        { name: 'Completion', value: completionPct, fill: '#2563EB' },
    ];
    // Recent activity timeline: last 5 days with activity
    const recentDays = [...dateGrid]
        .reverse()
        .filter(d => activityMap[d] > 0)
        .slice(0, 5);
    return (<div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Learning Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Track your progress and study habits</p>
      </div>

      {/* Overview KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
            { label: 'Enrolled Courses', value: overview?.enrolledCourses ?? 0, icon: BookOpen, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
            { label: 'Completed', value: overview?.completedCourses ?? 0, icon: CheckCircle, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
            { label: 'Avg Progress', value: `${(overview?.avgProgress ?? 0).toFixed(1)}%`, icon: TrendingUp, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
            { label: 'Study Days', value: overview?.studyDays ?? 0, icon: Calendar, iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
        ].map(({ label, value, icon: Icon, iconBg, iconColor }) => (<Card key={label}>
            <CardContent className="pt-5">
              {overviewLoading ? (<div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"/>
                  <div className="h-7 bg-gray-200 rounded w-1/2"/>
                </div>) : overviewError ? (<div className="text-xs text-red-500">
                  Error
                  <button onClick={() => refetch()} className="ml-2 underline">Retry</button>
                </div>) : (<div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                    <Icon className={`h-5 w-5 ${iconColor}`}/>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                </div>)}
            </CardContent>
          </Card>))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Radial Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Course Completion</CardTitle>
          </CardHeader>
          <CardContent>
            {overviewLoading ? (<ChartSkeleton height={220}/>) : (<div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={radialData} startAngle={180} endAngle={0}>
                    <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#f3f4f6' }}>
                      {radialData.map((entry, i) => (<Cell key={i} fill={entry.fill}/>))}
                    </RadialBar>
                    <Tooltip formatter={(v) => [`${v}%`, 'Completion']}/>
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="text-center -mt-6">
                  <p className="text-3xl font-bold text-gray-900">{completionPct}%</p>
                  <p className="text-sm text-gray-500">
                    {overview?.completedCourses ?? 0} of {overview?.enrolledCourses ?? 0} courses completed
                  </p>
                </div>
              </div>)}
          </CardContent>
        </Card>

        {/* Performance by Subject */}
        <Card>
          <CardHeader>
            <CardTitle>Progress by Subject</CardTitle>
          </CardHeader>
          <CardContent>
            {perfLoading ? (<ChartSkeleton height={220}/>) : (performance ?? []).length === 0 ? (<p className="text-sm text-gray-400 text-center py-16">No subject data yet</p>) : (<ResponsiveContainer width="100%" height={220}>
                <BarChart data={performance ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`}/>
                  <YAxis dataKey="subject" type="category" tick={{ fontSize: 10 }} width={100} tickFormatter={(t) => t.length > 14 ? t.slice(0, 14) + '...' : t}/>
                  <Tooltip formatter={(v) => [`${v}%`, 'Avg Progress']}/>
                  <Bar dataKey="avgScore" name="Avg Progress" radius={[0, 4, 4, 0]}>
                    {(performance ?? []).map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]}/>))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>)}
          </CardContent>
        </Card>
      </div>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Study Activity (Last 90 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (<ChartSkeleton height={120}/>) : (<>
              <p className="text-xs text-gray-500 mb-3">Each square represents one day — darker green means more activity</p>
              <div className="overflow-x-auto">
                <div className="flex flex-wrap gap-1" style={{ maxWidth: '100%' }}>
                  {dateGrid.map((date) => {
                const count = activityMap[date] ?? 0;
                const intensity = count / maxActivity;
                let bg = 'bg-gray-100';
                if (count > 0) {
                    if (intensity < 0.25)
                        {bg = 'bg-green-200';}
                    else if (intensity < 0.5)
                        {bg = 'bg-green-400';}
                    else if (intensity < 0.75)
                        {bg = 'bg-green-500';}
                    else
                        {bg = 'bg-green-700';}
                }
                return (<div key={date} title={`${date}: ${count} session${count !== 1 ? 's' : ''}`} className={`w-4 h-4 rounded-sm ${bg} flex-shrink-0 cursor-default`}/>);
            })}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                <span>Less</span>
                {['bg-gray-100', 'bg-green-200', 'bg-green-400', 'bg-green-500', 'bg-green-700'].map((cls, i) => (<div key={i} className={`w-4 h-4 rounded-sm ${cls}`}/>))}
                <span>More</span>
              </div>
            </>)}
        </CardContent>
      </Card>

      {/* Recent Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (<div className="animate-pulse space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-12 bg-gray-100 rounded"/>))}
            </div>) : recentDays.length === 0 ? (<p className="text-sm text-gray-400 text-center py-6">No recent activity</p>) : (<div className="space-y-3">
              {recentDays.map((date) => {
                const count = activityMap[date] ?? 0;
                return (<div key={date} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-blue-600"/>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{date}</p>
                      <p className="text-xs text-gray-500">
                        {count} learning session{count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Active
                      </span>
                    </div>
                  </div>);
            })}
            </div>)}
        </CardContent>
      </Card>
    </div>);
}
