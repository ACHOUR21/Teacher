'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Building2, Users, BookOpen, TrendingUp, ChevronLeft,
  CheckCircle, XCircle, AlertTriangle, Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';


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

function StatCard({
  icon: Icon,
  label,
  value,
  color = 'from-blue-500 to-blue-600',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function ConfirmModal({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  danger = false,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-xl">
        <div className="flex items-center gap-2 p-5 border-b border-border">
          {danger && <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />}
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <div className="p-5">
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button onClick={onCancel} className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${danger ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore(s => s.user);
  const router = useRouter();
  const qc = useQueryClient();
  const [confirmModal, setConfirmModal] = useState<'suspend' | 'activate' | 'delete' | null>(null);

  const { data, isLoading, error } = useQuery<Record<string, unknown>>({
    queryKey: ['sa-tenant-detail', id],
    queryFn: () => api.get(`/super-admin/tenants/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

  const statusMut = useMutation({
    mutationFn: (isActive: boolean) => api.put(`/super-admin/tenants/${id}/status`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-tenant-detail', id] });
      setConfirmModal(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/super-admin/tenants/${id}`),
    onSuccess: () => {
      router.push('/super-admin/tenants');
    },
  });

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground">Tenant not found.</p>
        <Link href="/super-admin/tenants" className="text-sm text-primary hover:underline">Back to Tenants</Link>
      </div>
    );
  }

  const subscription = data.subscription as Record<string, unknown> | null;
  const count = data._count as Record<string, number>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/super-admin/tenants" className="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{data.name as string}</h1>
          <p className="text-sm text-muted-foreground">{data.slug as string}</p>
        </div>
        <div className="ml-auto">
          {(data.isActive as boolean) ? (
            <span className="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" /> Active
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm font-medium text-red-500">
              <XCircle className="h-4 w-4" /> Suspended
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={count?.users ?? 0} color="from-blue-500 to-blue-600" />
        <StatCard icon={Users} label="Active Users" value={data.activeUserCount as number ?? 0} color="from-violet-500 to-violet-600" />
        <StatCard icon={BookOpen} label="Courses" value={data.courseCount as number ?? 0} color="from-amber-500 to-orange-500" />
        <StatCard icon={TrendingUp} label="Revenue" value={`$${((data.totalRevenue as number) ?? 0).toLocaleString()}`} color="from-green-500 to-emerald-600" />
      </div>

      {/* Tenant Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info card */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Tenant Information</h3>
          <dl className="space-y-2">
            {[
              { label: 'Name', value: data.name as string },
              { label: 'Slug', value: data.slug as string },
              { label: 'Type', value: String(data.type ?? '').toLowerCase() },
              { label: 'Domain', value: (data.domain as string) || '—' },
              {
                label: 'Plan',
                value: (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: (PLAN_COLORS[data.plan as string] ?? '#94a3b8') + '22',
                      color: PLAN_COLORS[data.plan as string] ?? '#94a3b8',
                    }}
                  >
                    {PLAN_LABELS[data.plan as string] ?? data.plan as string}
                  </span>
                ),
              },
              {
                label: 'Created',
                value: format(new Date(data.createdAt as string), 'PPP'),
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground">{value}</span>
              </div>
            ))}
          </dl>
        </div>

        {/* Subscription */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Subscription</h3>
          {subscription ? (
            <dl className="space-y-2">
              {[
                { label: 'Status', value: subscription.status as string },
                {
                  label: 'Next Billing',
                  value: subscription.currentPeriodEnd
                    ? format(new Date(subscription.currentPeriodEnd as string), 'PPP')
                    : '—',
                },
                { label: 'Enrollments', value: data.enrollmentCount as number ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{value}</span>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">No subscription on record</p>
          )}

          {/* Next billing date indicator */}
          {Boolean(subscription?.currentPeriodEnd) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
              <Calendar className="h-3.5 w-3.5" />
              Renews {format(new Date(subscription!.currentPeriodEnd as string), 'MMM d, yyyy')}
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card border border-red-200 dark:border-red-900/40 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h3 className="font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {(data.isActive as boolean) ? (
            <button
              onClick={() => setConfirmModal('suspend')}
              className="px-4 py-2 text-sm border border-amber-400 text-amber-600 dark:text-amber-400 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
            >
              Suspend Tenant
            </button>
          ) : (
            <button
              onClick={() => setConfirmModal('activate')}
              className="px-4 py-2 text-sm border border-green-400 text-green-600 dark:text-green-400 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              Reactivate Tenant
            </button>
          )}
          <button
            onClick={() => setConfirmModal('delete')}
            className="px-4 py-2 text-sm border border-red-400 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Delete Tenant &amp; All Data
          </button>
        </div>
      </div>

      {/* Confirm Modals */}
      {confirmModal === 'suspend' && (
        <ConfirmModal
          title="Suspend Tenant"
          description={`Suspending "${data.name as string}" will prevent all users from logging in. You can reactivate at any time.`}
          confirmLabel="Suspend"
          onConfirm={() => statusMut.mutate(false)}
          onCancel={() => setConfirmModal(null)}
        />
      )}
      {confirmModal === 'activate' && (
        <ConfirmModal
          title="Reactivate Tenant"
          description={`This will restore access for all users in "${data.name as string}".`}
          confirmLabel="Activate"
          onConfirm={() => statusMut.mutate(true)}
          onCancel={() => setConfirmModal(null)}
        />
      )}
      {confirmModal === 'delete' && (
        <ConfirmModal
          title="Delete Tenant"
          description={`This will permanently delete "${data.name as string}" and ALL associated users, courses, and data. This action cannot be undone.`}
          confirmLabel="Delete Permanently"
          onConfirm={() => deleteMut.mutate()}
          onCancel={() => setConfirmModal(null)}
          danger
        />
      )}
    </div>
  );
}
