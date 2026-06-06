'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import {
  Shield, Building2, Users, TrendingUp, DollarSign,
  Activity, ChevronDown, Search, MoreHorizontal,
  CheckCircle, XCircle, AlertCircle, Zap, RefreshCw,
  LogIn, Trash2, Edit2, X, Check,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';

const PLAN_COLORS: Record<string, string> = {
  FREE_TRIAL: '#94a3b8',
  STARTER: '#3b82f6',
  PROFESSIONAL: '#8b5cf6',
  BUSINESS: '#f59e0b',
  ENTERPRISE: '#10b981',
  LIFETIME: '#ec4899',
};

const PLAN_LABELS: Record<string, string> = {
  FREE_TRIAL: 'Free Trial',
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  BUSINESS: 'Business',
  ENTERPRISE: 'Enterprise',
  LIFETIME: 'Lifetime',
};

function PlanBadge({ plan }: { plan: string }) {
  const color = PLAN_COLORS[plan] ?? '#94a3b8';
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: color + '22', color }}>
      {PLAN_LABELS[plan] ?? plan}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
      <CheckCircle className="h-3 w-3" /> Active
    </span>
  ) : (
    <span className="flex items-center gap-1 text-xs font-medium text-red-500">
      <XCircle className="h-3 w-3" /> Suspended
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color = 'text-primary' }: any) {
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

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ['sa-overview'],
    queryFn: () => api.get('/super-admin/overview').then(r => r.data.data),
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!data) return null;

  const { stats, recentTenants, planBreakdown, userGrowthChart } = data;

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Building2} label="Total Tenants" value={stats.totalTenants}
          sub={`${stats.activeTenants} active`} color="from-blue-500 to-blue-600" />
        <KpiCard icon={Users} label="Total Users" value={stats.totalUsers.toLocaleString()}
          sub={`${stats.activeUsers.toLocaleString()} active`} color="from-violet-500 to-violet-600" />
        <KpiCard icon={TrendingUp} label="Courses" value={stats.totalCourses}
          sub={`${stats.publishedCourses} published`} color="from-amber-500 to-orange-500" />
        <KpiCard icon={DollarSign} label="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`}
          sub={`${stats.totalEnrollments.toLocaleString()} enrollments`} color="from-green-500 to-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User growth chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">User Growth (30 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={userGrowthChart}>
              <defs>
                <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="users" stroke="#6366f1" fill="url(#ug)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Plan breakdown pie */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Tenants by Plan</h3>
          {planBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={planBreakdown} dataKey="count" nameKey="plan" cx="50%" cy="50%" outerRadius={65}>
                    {planBreakdown.map((entry: any) => (
                      <Cell key={entry.plan} fill={PLAN_COLORS[entry.plan] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, PLAN_LABELS[n as string] ?? n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {planBreakdown.map((p: any) => (
                  <div key={p.plan} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: PLAN_COLORS[p.plan] }} />
                      {PLAN_LABELS[p.plan] ?? p.plan}
                    </span>
                    <span className="font-medium text-foreground">{p.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-sm text-muted-foreground text-center py-8">No tenants yet</p>}
        </div>
      </div>

      {/* Recent tenants */}
      <div className="bg-card border border-border rounded-xl">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Recent Tenants</h3>
        </div>
        <div className="divide-y divide-border">
          {recentTenants.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
              <div>
                <p className="font-medium text-sm text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.slug} · {t._count.users} users</p>
              </div>
              <div className="flex items-center gap-3">
                <PlanBadge plan={t.plan} />
                <StatusBadge active={t.isActive} />
                <span className="text-xs text-muted-foreground">{format(new Date(t.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </div>
          ))}
          {recentTenants.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No tenants yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tenants Tab ──────────────────────────────────────────────────────────────
function TenantsTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [editPlan, setEditPlan] = useState('');

  const { data, isLoading } = useQuery<any>({
    queryKey: ['sa-tenants', page, q],
    queryFn: () => api.get('/super-admin/tenants', { params: { page, limit: 15, search: q || undefined } }).then(r => r.data.data),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...dto }: any) => api.patch(`/super-admin/tenants/${id}`, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-tenants'] }); qc.invalidateQueries({ queryKey: ['sa-overview'] }); setEditingTenant(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/super-admin/tenants/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-tenants'] }); qc.invalidateQueries({ queryKey: ['sa-overview'] }); },
  });

  const PLANS = ['FREE_TRIAL', 'STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE', 'LIFETIME'];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search tenants..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setQ(search); setPage(1); } }}
          />
        </div>
        <button onClick={() => { setQ(search); setPage(1); }}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
          Search
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {['Tenant', 'Type', 'Plan', 'Users', 'Status', 'Created', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr><td colSpan={7} className="text-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" /></td></tr>
            )}
            {!isLoading && data?.items?.map((t: any) => (
              <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.slug}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground capitalize">{t.type.toLowerCase()}</td>
                <td className="px-4 py-3"><PlanBadge plan={t.plan} /></td>
                <td className="px-4 py-3 text-muted-foreground">{t._count.users}</td>
                <td className="px-4 py-3"><StatusBadge active={t.isActive} /></td>
                <td className="px-4 py-3 text-muted-foreground">{format(new Date(t.createdAt), 'MMM d, yyyy')}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingTenant(t); setEditPlan(t.plan); }}
                      className="p-1.5 hover:bg-accent rounded transition-colors text-muted-foreground hover:text-foreground"
                      title="Edit plan"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => updateMut.mutate({ id: t.id, isActive: !t.isActive })}
                      className={`p-1.5 hover:bg-accent rounded transition-colors ${t.isActive ? 'text-amber-500' : 'text-green-500'}`}
                      title={t.isActive ? 'Suspend' : 'Activate'}
                    >
                      {t.isActive ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete tenant "${t.name}" and ALL its data?`)) deleteMut.mutate(t.id); }}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-red-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && !data?.items?.length && (
              <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No tenants found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{data.total} tenants total</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-sm border border-border rounded-md disabled:opacity-40 hover:bg-accent transition-colors">← Prev</button>
            <span className="px-3 py-1.5 text-sm text-muted-foreground">{page} / {data.totalPages}</span>
            <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-sm border border-border rounded-md disabled:opacity-40 hover:bg-accent transition-colors">Next →</button>
          </div>
        </div>
      )}

      {/* Edit plan modal */}
      {editingTenant && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Edit — {editingTenant.name}</h3>
              <button onClick={() => setEditingTenant(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Subscription Plan</label>
                <select
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={editPlan}
                  onChange={e => setEditPlan(e.target.value)}
                >
                  {PLANS.map(p => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button onClick={() => setEditingTenant(null)} className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors">Cancel</button>
              <button
                onClick={() => updateMut.mutate({ id: editingTenant.id, plan: editPlan })}
                disabled={updateMut.isPending}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {updateMut.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [impersonateResult, setImpersonateResult] = useState<any>(null);

  const { data, isLoading } = useQuery<any>({
    queryKey: ['sa-users', page, q, roleFilter],
    queryFn: () => api.get('/super-admin/users', {
      params: { page, limit: 15, search: q || undefined, role: roleFilter || undefined }
    }).then(r => r.data.data),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...dto }: any) => api.patch(`/super-admin/users/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa-users'] }),
  });

  const impersonateMut = useMutation({
    mutationFn: (userId: string) => api.post(`/super-admin/impersonate/${userId}`).then(r => r.data.data),
    onSuccess: (data) => setImpersonateResult(data),
  });

  const ROLES = ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN', 'UNIVERSITY_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      ADMIN: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      SCHOOL_ADMIN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      TEACHER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      STUDENT: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      PARENT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[role] ?? 'bg-muted text-muted-foreground'}`}>{role.replace('_', ' ')}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setQ(search); setPage(1); } }}
          />
        </div>
        <select
          className="border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>
        <button onClick={() => { setQ(search); setPage(1); }}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
          Search
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {['User', 'Role', 'Tenant', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr><td colSpan={6} className="text-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" /></td></tr>
            )}
            {!isLoading && data?.items?.map((u: any) => (
              <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-4 py-3">{roleBadge(u.role)}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{u.tenant?.name ?? '—'}</td>
                <td className="px-4 py-3"><StatusBadge active={u.isActive} /></td>
                <td className="px-4 py-3 text-muted-foreground">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateMut.mutate({ id: u.id, isActive: !u.isActive })}
                      className={`p-1.5 hover:bg-accent rounded transition-colors ${u.isActive ? 'text-amber-500' : 'text-green-500'}`}
                      title={u.isActive ? 'Suspend user' : 'Activate user'}
                    >
                      {u.isActive ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => impersonateMut.mutate(u.id)}
                      className="p-1.5 hover:bg-accent rounded transition-colors text-muted-foreground hover:text-foreground"
                      title="Impersonate user"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && !data?.items?.length && (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{data.total} users total</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-sm border border-border rounded-md disabled:opacity-40 hover:bg-accent transition-colors">← Prev</button>
            <span className="px-3 py-1.5 text-sm text-muted-foreground">{page} / {data.totalPages}</span>
            <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-sm border border-border rounded-md disabled:opacity-40 hover:bg-accent transition-colors">Next →</button>
          </div>
        </div>
      )}

      {/* Impersonate result modal */}
      {impersonateResult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <LogIn className="h-4 w-4 text-amber-500" /> Impersonation Token
              </h3>
              <button onClick={() => setImpersonateResult(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Impersonating <strong>{impersonateResult.user?.firstName} {impersonateResult.user?.lastName}</strong> ({impersonateResult.user?.email}).
                Token expires in 1 hour.
              </p>
              <div className="bg-muted rounded-md p-3">
                <p className="text-xs font-mono break-all text-foreground">{impersonateResult.accessToken}</p>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(impersonateResult.accessToken); }}
                className="w-full py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors"
              >
                Copy Token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Billing Tab ──────────────────────────────────────────────────────────────
function BillingTab() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ['sa-billing'],
    queryFn: () => api.get('/super-admin/billing').then(r => r.data.data),
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!data) return null;

  const { totalRevenue, totalInvoices, planRevenue, subscriptionStats, recentInvoices } = data;

  const subStatusColor: Record<string, string> = {
    ACTIVE: 'text-green-600',
    TRIALING: 'text-blue-500',
    PAST_DUE: 'text-amber-500',
    CANCELLED: 'text-muted-foreground',
    INACTIVE: 'text-red-500',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={DollarSign} label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`}
          color="from-green-500 to-emerald-600" />
        <KpiCard icon={Activity} label="Paid Invoices" value={totalInvoices}
          color="from-blue-500 to-blue-600" />
        <KpiCard icon={Zap} label="Active Plans"
          value={planRevenue.reduce((sum: number, p: any) => sum + p.count, 0)}
          color="from-violet-500 to-violet-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan distribution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Active Subscriptions by Plan</h3>
          <div className="space-y-2">
            {planRevenue.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No active subscriptions</p>}
            {planRevenue.map((p: any) => (
              <div key={p.plan} className="flex items-center gap-3">
                <span className="w-28 text-xs text-muted-foreground">{PLAN_LABELS[p.plan] ?? p.plan}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(4, (p.count / Math.max(...planRevenue.map((x: any) => x.count))) * 100)}%`,
                      background: PLAN_COLORS[p.plan] ?? '#94a3b8',
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-foreground w-8 text-right">{p.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription health */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Subscription Health</h3>
          <div className="space-y-3">
            {subscriptionStats.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No subscriptions</p>}
            {subscriptionStats.map((s: any) => (
              <div key={s.status} className="flex items-center justify-between">
                <span className={`text-sm font-medium ${subStatusColor[s.status] ?? 'text-foreground'}`}>{s.status}</span>
                <span className="font-bold text-foreground">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="bg-card border border-border rounded-xl">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Recent Paid Invoices</h3>
        </div>
        <div className="divide-y divide-border">
          {recentInvoices.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No invoices yet</p>}
          {recentInvoices.map((inv: any) => (
            <div key={inv.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{inv.subscription?.tenant?.name ?? '—'}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(inv.issuedAt), 'MMM d, yyyy')}</p>
              </div>
              <div className="flex items-center gap-3">
                <PlanBadge plan={inv.subscription?.plan ?? 'STARTER'} />
                <span className="font-semibold text-green-600">${Number(inv.amount).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'tenants', label: 'Tenants', icon: Building2 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'billing', label: 'Billing', icon: DollarSign },
];

export default function SuperAdminPage() {
  const user = useAuthStore(s => s.user);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: health } = useQuery<any>({
    queryKey: ['sa-health'],
    queryFn: () => api.get('/super-admin/health').then(r => r.data.data),
    refetchInterval: 60000,
  });

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Shield className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground">Super Admin privileges required.</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Go Back</button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Super Admin</h1>
            <p className="text-sm text-muted-foreground">Platform-wide management console</p>
          </div>
        </div>
        {health && (
          <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${health.database === 'healthy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${health.database === 'healthy' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            DB {health.database}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'tenants' && <TenantsTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'billing' && <BillingTab />}
    </div>
  );
}
