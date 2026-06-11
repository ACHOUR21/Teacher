'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Zap, DollarSign, TrendingUp, ChevronLeft, Activity,
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';

import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';


const MODEL_COLORS = ['#6366f1', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'];

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'from-blue-500 to-blue-600',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

interface AiUsageData {
  summary: {
    totalCostToday: number;
    totalCostMonth: number;
    totalCostAllTime: number;
    totalRequestsToday: number;
  };
  topConsumers: Array<{
    tenantId: string;
    tenantName: string;
    plan: string;
    tokensToday: number;
    costToday: number;
    tokensMonth: number;
    costMonth: number;
  }>;
  modelBreakdown: Array<{
    model: string;
    requests: number;
    costToday: number;
    pct: number;
  }>;
}

export default function AiUsagePage() {
  const user = useAuthStore(s => s.user);

  const { data, isLoading } = useQuery<AiUsageData>({
    queryKey: ['sa-ai-usage'],
    queryFn: () => api.get('/super-admin/ai-usage').then(r => r.data.data),
  });

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const { summary, topConsumers, modelBreakdown } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/super-admin" className="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">AI Usage Analytics</h1>
          <p className="text-sm text-muted-foreground">Cost and usage breakdown across all tenants</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={DollarSign}
          label="AI Cost Today"
          value={`$${summary.totalCostToday.toFixed(2)}`}
          color="from-violet-500 to-violet-600"
        />
        <KpiCard
          icon={TrendingUp}
          label="AI Cost This Month"
          value={`$${summary.totalCostMonth.toFixed(2)}`}
          color="from-blue-500 to-blue-600"
        />
        <KpiCard
          icon={DollarSign}
          label="All-Time AI Cost"
          value={`$${summary.totalCostAllTime.toFixed(2)}`}
          color="from-green-500 to-emerald-600"
        />
        <KpiCard
          icon={Activity}
          label="Requests Today"
          value={summary.totalRequestsToday.toLocaleString()}
          color="from-amber-500 to-orange-500"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Cost by tenant bar chart */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Cost by Tenant (Today)</h3>
          {topConsumers.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topConsumers} margin={{ top: 0, right: 10, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="tenantName"
                  tick={{ fontSize: 10 }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `$${v.toFixed(3)}`} />
                <Tooltip formatter={(v: number) => [`$${v.toFixed(4)}`, 'Cost']} />
                <Bar dataKey="costToday" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">No usage data available</p>
          )}
        </div>

        {/* Model breakdown pie chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">By Model (Today)</h3>
          {modelBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={modelBreakdown} dataKey="requests" nameKey="model" cx="50%" cy="50%" outerRadius={65}>
                    {modelBreakdown.map((_, i) => (
                      <Cell key={i} fill={MODEL_COLORS[i % MODEL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {modelBreakdown.map((m, i) => (
                  <div key={m.model} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: MODEL_COLORS[i % MODEL_COLORS.length] }} />
                      <span className="truncate max-w-[120px]">{m.model}</span>
                    </span>
                    <span className="font-medium text-foreground">{m.pct}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data</p>
          )}
        </div>
      </div>

      {/* Top 10 API consumers table */}
      <div className="bg-card border border-border rounded-xl">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Top API Consumers</h3>
          <span className="text-xs text-muted-foreground">Today's usage</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                {['#', 'Tenant', 'Plan', 'Tokens Today', 'Cost Today', 'Tokens This Month', 'Cost This Month'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topConsumers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">No usage data</td>
                </tr>
              )}
              {topConsumers.map((t, i) => (
                <tr key={t.tenantId} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground font-medium">#{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{t.tenantName}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{t.plan.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-foreground">{t.tokensToday.toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-violet-600 dark:text-violet-400">
                    ${t.costToday.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-foreground">{t.tokensMonth.toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-violet-600 dark:text-violet-400">
                    ${t.costMonth.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
