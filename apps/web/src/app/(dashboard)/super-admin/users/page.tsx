'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Users, Search, CheckCircle, XCircle, LogIn,
  Trash2, ChevronLeft, ChevronRight, Shield,
} from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';


const ROLES = ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN', 'UNIVERSITY_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] as const;
type Role = typeof ROLES[number];

const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ADMIN: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  SCHOOL_ADMIN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  UNIVERSITY_ADMIN: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  TEACHER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  STUDENT: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PARENT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

function RoleBadge({ role }: { role: string }) {
  const color = ROLE_COLORS[role as Role] ?? 'bg-muted text-muted-foreground';
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      {role.replace(/_/g, ' ')}
    </span>
  );
}

interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  tenantId: string;
  tenant?: { name: string; slug: string } | null;
}

export default function UsersManagementPage() {
  const user = useAuthStore(s => s.user);
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [changeRoleModal, setChangeRoleModal] = useState<{ user: UserRow; newRole: string } | null>(null);
  const [impersonateResult, setImpersonateResult] = useState<{ accessToken: string; user: Record<string, unknown> } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);

  const { data, isLoading } = useQuery<{
    items: UserRow[];
    total: number;
    totalPages: number;
  }>({
    queryKey: ['sa-users-page', page, searchQ, roleFilter, statusFilter],
    queryFn: () => api.get('/super-admin/users', {
      params: {
        page,
        limit: 50,
        search: searchQ || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      },
    }).then(r => r.data.data),
  });

  const roleMut = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.put(`/super-admin/users/${id}/role`, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-users-page'] });
      setChangeRoleModal(null);
    },
  });

  const toggleActiveMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/super-admin/users/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa-users-page'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/super-admin/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-users-page'] });
      setConfirmDelete(null);
    },
  });

  const impersonateMut = useMutation({
    mutationFn: (userId: string) => api.post(`/super-admin/impersonate/${userId}`).then(r => r.data.data),
    onSuccess: (data) => setImpersonateResult(data),
  });

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Shield className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
      </div>
    );
  }

  const handleSearch = () => { setSearchQ(search); setPage(1); };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/super-admin" className="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
          <Users className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total} users across all tenants` : 'Loading...'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search by email or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { handleSearch(); } }}
          />
        </div>

        <select
          className="border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
        </select>

        <select
          className="border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button
          onClick={handleSearch}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {['User', 'Role', 'Tenant', 'Last Login', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                </td>
              </tr>
            )}
            {!isLoading && data?.items?.map((u) => (
              <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{u.tenant?.name ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {u.lastLoginAt ? format(new Date(u.lastLoginAt), 'MMM d, yyyy') : '—'}
                </td>
                <td className="px-4 py-3">
                  {u.isActive ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                      <CheckCircle className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                      <XCircle className="h-3 w-3" /> Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {/* Change Role */}
                    <button
                      onClick={() => setChangeRoleModal({ user: u, newRole: u.role })}
                      className="p-1.5 hover:bg-accent rounded transition-colors text-muted-foreground hover:text-foreground text-xs font-medium"
                      title="Change role"
                    >
                      Role
                    </button>

                    {/* Toggle active */}
                    <button
                      onClick={() => toggleActiveMut.mutate({ id: u.id, isActive: !u.isActive })}
                      className={`p-1.5 hover:bg-accent rounded transition-colors ${u.isActive ? 'text-amber-500' : 'text-green-500'}`}
                      title={u.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {u.isActive ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                    </button>

                    {/* Impersonate */}
                    <button
                      onClick={() => impersonateMut.mutate(u.id)}
                      disabled={impersonateMut.isPending}
                      className="p-1.5 hover:bg-accent rounded transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                      title="Impersonate user"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                    </button>

                    {/* Delete (GDPR) */}
                    <button
                      onClick={() => setConfirmDelete(u)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-red-400 hover:text-red-600"
                      title="Delete user (GDPR)"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && !data?.items?.length && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{data.total} users total</p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 border border-border rounded-md disabled:opacity-40 hover:bg-accent transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-muted-foreground">{page} / {data.totalPages}</span>
            <button
              disabled={page === data.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 border border-border rounded-md disabled:opacity-40 hover:bg-accent transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {changeRoleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Change Role</h3>
              <button onClick={() => setChangeRoleModal(null)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Changing role for <strong>{changeRoleModal.user.firstName} {changeRoleModal.user.lastName}</strong>
              </p>
              <select
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
                value={changeRoleModal.newRole}
                onChange={e => setChangeRoleModal(prev => prev ? { ...prev, newRole: e.target.value } : null)}
              >
                {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button onClick={() => setChangeRoleModal(null)} className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors">
                Cancel
              </button>
              <button
                onClick={() => roleMut.mutate({ id: changeRoleModal.user.id, role: changeRoleModal.newRole })}
                disabled={roleMut.isPending}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {roleMut.isPending ? 'Saving...' : 'Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-xl">
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold text-foreground">Delete User</h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-muted-foreground">
                Permanently delete <strong>{confirmDelete.email}</strong>? This action is irreversible and will remove all personal data (GDPR compliance).
              </p>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors">
                Cancel
              </button>
              <button
                onClick={() => deleteMut.mutate(confirmDelete.id)}
                disabled={deleteMut.isPending}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {deleteMut.isPending ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Impersonation result modal */}
      {impersonateResult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <LogIn className="h-4 w-4 text-amber-500" /> Impersonation Token
              </h3>
              <button onClick={() => setImpersonateResult(null)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Token valid for 1 hour. Copy and use as Bearer token.
              </p>
              <div className="bg-muted rounded-md p-3">
                <p className="text-xs font-mono break-all text-foreground">{impersonateResult.accessToken}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(impersonateResult.accessToken)}
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
