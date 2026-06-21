'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Building2, Search, CheckCircle, XCircle, Edit2, Trash2, LogIn, Eye, ChevronLeft, ChevronRight, } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
const PLAN_COLORS = {
    FREE_TRIAL: '#94a3b8',
    STARTER: '#3b82f6',
    PROFESSIONAL: '#8b5cf6',
    BUSINESS: '#f59e0b',
    ENTERPRISE: '#10b981',
    LIFETIME: '#ec4899',
};
const PLAN_LABELS = {
    FREE_TRIAL: 'Free Trial',
    STARTER: 'Starter',
    PROFESSIONAL: 'Professional',
    BUSINESS: 'Business',
    ENTERPRISE: 'Enterprise',
    LIFETIME: 'Lifetime',
};
const PLANS = Object.keys(PLAN_LABELS);
function PlanBadge({ plan }) {
    const color = PLAN_COLORS[plan] ?? '#94a3b8';
    return (<span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: color + '22', color }}>
      {PLAN_LABELS[plan] ?? plan}
    </span>);
}
function StatusBadge({ active }) {
    return active ? (<span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
      <CheckCircle className="h-3 w-3"/> Active
    </span>) : (<span className="flex items-center gap-1 text-xs font-medium text-red-500">
      <XCircle className="h-3 w-3"/> Suspended
    </span>);
}
function ConfirmModal({ title, description, onConfirm, onCancel, danger = false, }) {
    return (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-xl">
        <div className="p-5">
          <h3 className="font-semibold text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button onClick={onCancel} className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm rounded-md transition-colors ${danger ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}>
            Confirm
          </button>
        </div>
      </div>
    </div>);
}
export default function TenantsManagementPage() {
    const user = useAuthStore(s => s.user);
    const router = useRouter();
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [searchQ, setSearchQ] = useState('');
    const [planFilter, setPlanFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [editingTenant, setEditingTenant] = useState(null);
    const [editPlan, setEditPlan] = useState('');
    const [confirmAction, setConfirmAction] = useState(null);
    const { data, isLoading } = useQuery({
        queryKey: ['sa-tenants-page', page, searchQ, planFilter, statusFilter],
        queryFn: () => api.get('/super-admin/tenants', {
            params: {
                page,
                limit: 50,
                search: searchQ || undefined,
                plan: planFilter || undefined,
                status: statusFilter || undefined,
            },
        }).then(r => r.data.data),
    });
    const statusMut = useMutation({
        mutationFn: ({ id, isActive }) => api.put(`/super-admin/tenants/${id}/status`, { isActive }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['sa-tenants-page'] });
            setConfirmAction(null);
        },
    });
    const planMut = useMutation({
        mutationFn: ({ id, plan }) => api.put(`/super-admin/tenants/${id}/plan`, { plan }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['sa-tenants-page'] });
            setEditingTenant(null);
        },
    });
    const deleteMut = useMutation({
        mutationFn: (id) => api.delete(`/super-admin/tenants/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['sa-tenants-page'] });
            setConfirmAction(null);
        },
    });
    const impersonateMut = useMutation({
        mutationFn: (id) => api.post(`/super-admin/tenants/${id}/impersonate`).then(r => r.data.data),
        onSuccess: (data) => {
            // Store impersonation token and navigate to tenant dashboard
            if (typeof window !== 'undefined' && data?.accessToken) {
                sessionStorage.setItem('impersonation_token', data.accessToken);
                sessionStorage.setItem('impersonation_user', JSON.stringify(data.user));
            }
            router.push('/');
        },
    });
    if (user?.role !== 'SUPER_ADMIN') {
        return (<div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground">Super Admin privileges required.</p>
      </div>);
    }
    const handleSearch = () => { setSearchQ(search); setPage(1); };
    return (<div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/super-admin" className="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4"/>
          </Link>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white"/>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Tenant Management</h1>
            <p className="text-sm text-muted-foreground">
              {data ? `${data.total} tenants total` : 'Loading...'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
          <input className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Search by name, slug, or domain..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') {
        handleSearch();
    } }}/>
        </div>

        <select className="border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground" value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1); }}>
          <option value="">All Plans</option>
          {PLANS.map(p => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
        </select>

        <select className="border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>

        <button onClick={handleSearch} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
          Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {['Tenant', 'Plan', 'Users', 'Status', 'Created', 'Actions'].map(h => (<th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {h}
                </th>))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (<tr>
                <td colSpan={6} className="text-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"/>
                </td>
              </tr>)}
            {!isLoading && data?.items?.map((t) => (<tr key={t.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.slug}</p>
                </td>
                <td className="px-4 py-3"><PlanBadge plan={t.plan}/></td>
                <td className="px-4 py-3 text-muted-foreground">
                  {t._count?.users ?? 0}
                </td>
                <td className="px-4 py-3"><StatusBadge active={t.isActive}/></td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {format(new Date(t.createdAt), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link href={`/super-admin/tenants/${t.id}`} className="p-1.5 hover:bg-accent rounded transition-colors text-muted-foreground hover:text-foreground" title="View details">
                      <Eye className="h-3.5 w-3.5"/>
                    </Link>

                    <button onClick={() => { setEditingTenant(t); setEditPlan(t.plan); }} className="p-1.5 hover:bg-accent rounded transition-colors text-muted-foreground hover:text-foreground" title="Edit plan">
                      <Edit2 className="h-3.5 w-3.5"/>
                    </button>

                    <button onClick={() => setConfirmAction({
                type: t.isActive ? 'suspend' : 'activate',
                tenant: t,
            })} className={`p-1.5 hover:bg-accent rounded transition-colors ${t.isActive ? 'text-amber-500' : 'text-green-500'}`} title={t.isActive ? 'Suspend tenant' : 'Activate tenant'}>
                      {t.isActive ? <XCircle className="h-3.5 w-3.5"/> : <CheckCircle className="h-3.5 w-3.5"/>}
                    </button>

                    <button onClick={() => impersonateMut.mutate(t.id)} disabled={impersonateMut.isPending} className="p-1.5 hover:bg-accent rounded transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50" title="Impersonate tenant admin">
                      <LogIn className="h-3.5 w-3.5"/>
                    </button>

                    <button onClick={() => setConfirmAction({ type: 'delete', tenant: t })} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-red-400 hover:text-red-600" title="Delete tenant">
                      <Trash2 className="h-3.5 w-3.5"/>
                    </button>
                  </div>
                </td>
              </tr>))}
            {!isLoading && !data?.items?.length && (<tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">No tenants found</td>
              </tr>)}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (<div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{data.total} tenants total</p>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 border border-border rounded-md disabled:opacity-40 hover:bg-accent transition-colors">
              <ChevronLeft className="h-4 w-4"/>
            </button>
            <span className="text-sm text-muted-foreground">{page} / {data.totalPages}</span>
            <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 border border-border rounded-md disabled:opacity-40 hover:bg-accent transition-colors">
              <ChevronRight className="h-4 w-4"/>
            </button>
          </div>
        </div>)}

      {/* Edit Plan Modal */}
      {editingTenant && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Change Plan — {editingTenant.name}</h3>
              <button onClick={() => setEditingTenant(null)} className="text-muted-foreground hover:text-foreground">
                &times;
              </button>
            </div>
            <div className="p-4">
              <label className="text-xs text-muted-foreground block mb-1">Subscription Plan</label>
              <select className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground" value={editPlan} onChange={e => setEditPlan(e.target.value)}>
                {PLANS.map(p => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button onClick={() => setEditingTenant(null)} className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors">
                Cancel
              </button>
              <button onClick={() => planMut.mutate({ id: editingTenant.id, plan: editPlan })} disabled={planMut.isPending} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50">
                {planMut.isPending ? 'Saving...' : 'Save Plan'}
              </button>
            </div>
          </div>
        </div>)}

      {/* Confirm Action Modal */}
      {confirmAction && (<ConfirmModal title={confirmAction.type === 'delete'
                ? `Delete "${confirmAction.tenant.name}"?`
                : confirmAction.type === 'suspend'
                    ? `Suspend "${confirmAction.tenant.name}"?`
                    : `Activate "${confirmAction.tenant.name}"?`} description={confirmAction.type === 'delete'
                ? 'This will permanently delete the tenant and ALL its data. This action cannot be undone.'
                : confirmAction.type === 'suspend'
                    ? 'Users in this tenant will not be able to log in until reactivated.'
                    : 'This will re-enable access for all users in this tenant.'} danger={confirmAction.type === 'delete'} onCancel={() => setConfirmAction(null)} onConfirm={() => {
                if (confirmAction.type === 'delete') {
                    deleteMut.mutate(confirmAction.tenant.id);
                }
                else {
                    statusMut.mutate({
                        id: confirmAction.tenant.id,
                        isActive: confirmAction.type === 'activate',
                    });
                }
            }}/>)}
    </div>);
}
