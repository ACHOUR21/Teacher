'use client';
import { useQuery } from '@tanstack/react-query';
import { Building2, Users, Activity, DollarSign, Zap, TrendingUp } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, } from 'recharts';

import { ChartSkeleton } from '@/components/analytics/ChartSkeleton';
import { ExportButton } from '@/components/analytics/ExportButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api';
const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#DB2777', '#65A30D'];
const PLAN_COLORS = {
    FREE: '#6B7280',
    STARTER: '#3B82F6',
    PROFESSIONAL: '#8B5CF6',
    BUSINESS: '#10B981',
    ENTERPRISE: '#F59E0B',
    LIFETIME: '#EF4444',
};
export default function AdminAnalyticsPage() {
    const { data: platform, isLoading: platformLoading, isError: platformError, refetch: refetchPlatform } = useQuery({
        queryKey: ['analytics', 'admin', 'platform'],
        queryFn: () => api.get('/analytics/admin/platform').then(r => r.data.data),
    });
    const { data: revenue, isLoading: revenueLoading } = useQuery({
        queryKey: ['analytics', 'revenue'],
        queryFn: () => api.get('/analytics/revenue?months=12').then(r => r.data.data),
    });
    const { data: topTenants, isLoading: tenantsLoading } = useQuery({
        queryKey: ['analytics', 'admin', 'top-tenants'],
        queryFn: () => api.get('/analytics/admin/top-tenants').then(r => r.data.data),
    });
    const { data: aiUsage, isLoading: aiLoading } = useQuery({
        queryKey: ['analytics', 'ai-usage'],
        queryFn: () => api.get('/analytics/ai-usage').then(r => r.data.data),
    });
    const { data: cohort, isLoading: cohortLoading } = useQuery({
        queryKey: ['analytics', 'admin', 'cohort'],
        queryFn: () => api.get('/analytics/admin/cohort').then(r => r.data.data),
    });
    const kpis = [
        {
            label: 'Total Tenants',
            value: platformLoading ? null : (platform?.totalTenants ?? 0).toLocaleString(),
            icon: Building2,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            sub: 'Active tenants',
        },
        {
            label: 'Total Users',
            value: platformLoading ? null : (platform?.totalUsers ?? 0).toLocaleString(),
            icon: Users,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
            sub: 'All active users',
        },
        {
            label: 'Monthly Active Users',
            value: platformLoading ? null : (platform?.mau ?? 0).toLocaleString(),
            icon: Activity,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            sub: 'Last 30 days',
        },
        {
            label: 'MRR',
            value: platformLoading ? null : fmt.format(platform?.mrr ?? 0),
            icon: DollarSign,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
            sub: platform?.mrrGrowth != null
                ? `${platform.mrrGrowth >= 0 ? '+' : ''}${platform.mrrGrowth}% vs last period`
                : '',
        },
        {
            label: 'AI Cost Today',
            value: platformLoading ? null : fmt.format(platform?.aiCostToday ?? 0),
            icon: Zap,
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
            sub: 'API costs since midnight',
        },
        {
            label: 'MRR Growth',
            value: platformLoading ? null : `${platform?.mrrGrowth != null ? (platform.mrrGrowth >= 0 ? '+' : '') + platform.mrrGrowth : '0'}%`,
            icon: TrendingUp,
            iconBg: 'bg-pink-100',
            iconColor: 'text-pink-600',
            sub: 'vs previous 30 days',
        },
    ];
    return (<div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Platform-wide performance and business intelligence</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map(({ label, value, icon: Icon, iconBg, iconColor, sub }) => (<Card key={label}>
            <CardContent className="pt-5">
              {platformLoading ? (<div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"/>
                  <div className="h-7 bg-gray-200 rounded w-1/2"/>
                  <div className="h-3 bg-gray-100 rounded w-full"/>
                </div>) : platformError ? (<div className="text-xs text-red-500">
                  Failed to load
                  <button onClick={() => refetchPlatform()} className="ml-2 underline">Retry</button>
                </div>) : (<div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                    <Icon className={`h-5 w-5 ${iconColor}`}/>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold text-gray-900">{value}</p>
                    <p className="text-xs font-medium text-gray-600">{label}</p>
                    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                  </div>
                </div>)}
            </CardContent>
          </Card>))}
      </div>

      {/* Revenue Area Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Monthly Recurring Revenue (12 Months)</CardTitle>
            <ExportButton data={revenue ?? []} filename="mrr-12-months" label="Export"/>
          </div>
        </CardHeader>
        <CardContent>
          {revenueLoading ? (<ChartSkeleton height={260}/>) : (<ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenue ?? []}>
                <defs>
                  <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="month" tick={{ fontSize: 11 }}/>
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}/>
                <Tooltip labelFormatter={(l) => `Month: ${l}`} formatter={(v) => [fmt.format(v), 'Revenue']}/>
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2563EB" fill="url(#adminRevGrad)" strokeWidth={2.5}/>
              </AreaChart>
            </ResponsiveContainer>)}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Tenants Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top Tenants</CardTitle>
              <ExportButton data={topTenants ?? []} filename="top-tenants" label="Export"/>
            </div>
          </CardHeader>
          <CardContent>
            {tenantsLoading ? (<div className="animate-pulse space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-10 bg-gray-100 rounded"/>))}
              </div>) : (<div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Tenant</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Plan</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-500">Users</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-500">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(topTenants ?? []).map((t, i) => (<tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                            <span className="font-medium text-gray-900 truncate max-w-[120px]">{t.name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{
                    backgroundColor: `${PLAN_COLORS[t.plan] ?? '#6B7280'}20`,
                    color: PLAN_COLORS[t.plan] ?? '#6B7280',
                }}>
                            {t.plan}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">{(t.users ?? 0).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-medium">{fmt.format(t.revenue ?? 0)}</td>
                      </tr>))}
                    {!topTenants?.length && (<tr>
                        <td colSpan={4} className="py-6 text-center text-gray-400 text-sm">
                          No tenant data yet
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>)}
          </CardContent>
        </Card>

        {/* AI Usage Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>AI Module Usage Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {aiLoading ? (<ChartSkeleton height={260}/>) : (aiUsage ?? []).length === 0 ? (<p className="text-sm text-gray-400 text-center py-16">No AI usage data yet</p>) : (<ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={aiUsage ?? []} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="_count.id" nameKey="module" label={({ module }) => typeof module === 'string'
                ? module.replace(/_/g, ' ').slice(0, 10)
                : ''} labelLine={false}>
                    {(aiUsage ?? []).map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]}/>))}
                  </Pie>
                  <Tooltip formatter={(v, name) => [
                `${Number(v).toLocaleString()} requests`,
                typeof name === 'string' ? name.replace(/_/g, ' ') : name,
            ]}/>
                  <Legend formatter={(value) => typeof value === 'string'
                ? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                : value} wrapperStyle={{ fontSize: 11 }}/>
                </PieChart>
              </ResponsiveContainer>)}
          </CardContent>
        </Card>
      </div>

      {/* Cohort Retention Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cohort Retention Analysis</CardTitle>
            <ExportButton data={cohort ?? []} filename="cohort-retention" label="Export"/>
          </div>
        </CardHeader>
        <CardContent>
          {cohortLoading ? (<div className="animate-pulse space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-12 bg-gray-100 rounded"/>))}
            </div>) : (<div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Cohort</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Size</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Day 1</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Day 7</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Day 30</th>
                  </tr>
                </thead>
                <tbody>
                  {(cohort ?? []).map((c) => (<tr key={c.week} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{c.week}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{(c.size ?? 0).toLocaleString()}</td>
                      {[c.day1, c.day7, c.day30].map((pct, i) => (<td key={i} className="py-3 px-4 text-right">
                          <span className="inline-block min-w-[48px] text-center px-2 py-0.5 rounded-md text-xs font-semibold" style={{
                        backgroundColor: pct >= 70 ? '#dcfce7' : pct >= 40 ? '#fef9c3' : '#fee2e2',
                        color: pct >= 70 ? '#166534' : pct >= 40 ? '#854d0e' : '#991b1b',
                    }}>
                            {pct}%
                          </span>
                        </td>))}
                    </tr>))}
                  {!cohort?.length && (<tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        No cohort data available
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>)}
        </CardContent>
      </Card>
    </div>);
}
