'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, MoreHorizontal, Shield, ShieldCheck, ShieldOff } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const ROLES = ['All', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'UNIVERSITY_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  SCHOOL_ADMIN: 'bg-purple-100 text-purple-700',
  UNIVERSITY_ADMIN: 'bg-indigo-100 text-indigo-700',
  TEACHER: 'bg-blue-100 text-blue-700',
  STUDENT: 'bg-green-100 text-green-700',
  PARENT: 'bg-orange-100 text-orange-700',
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('All');
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, role, page],
    queryFn: () => api.get('/users', {
      params: { search: search || undefined, role: role !== 'All' ? role : undefined, page, limit: 25 },
    }).then(r => r.data.data),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/users/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, newRole }: { id: string; newRole: string }) =>
      api.post(`/users/${id}/roles`, { role: newRole }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setOpenMenu(null); },
  });

  const users: any[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.total ?? 0} total users</p>
        </div>
        <Button leftIcon={<UserPlus className="h-4 w-4" />}>Invite User</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={role}
          onChange={e => { setRole(e.target.value); setPage(1); }}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {ROLES.map(r => <option key={r} value={r}>{r === 'All' ? 'All Roles' : r.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3.5 px-4 font-medium text-gray-600">User</th>
                <th className="text-left py-3.5 px-4 font-medium text-gray-600">Role</th>
                <th className="text-left py-3.5 px-4 font-medium text-gray-600">MFA</th>
                <th className="text-left py-3.5 px-4 font-medium text-gray-600">Status</th>
                <th className="text-left py-3.5 px-4 font-medium text-gray-600">Joined</th>
                <th className="py-3.5 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="py-4 px-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
              {!isLoading && users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600')}>
                      {user.role?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {user.isMfaEnabled ? (
                      <ShieldCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <ShieldOff className="h-4 w-4 text-gray-300" />
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => toggleActiveMutation.mutate({ id: user.id, isActive: !user.isActive })}
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium transition-colors',
                        user.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200',
                      )}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </button>
                    {openMenu === user.id && (
                      <div className="absolute right-4 top-10 z-10 bg-white border border-gray-200 rounded-xl shadow-lg w-44 py-1 text-sm">
                        <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase">Change Role</p>
                        {['TEACHER', 'STUDENT', 'SCHOOL_ADMIN'].map(r => (
                          <button
                            key={r}
                            onClick={() => changeRoleMutation.mutate({ id: user.id, newRole: r })}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Shield className="h-3.5 w-3.5 text-gray-400" />
                            {r.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {(data?.totalPages ?? 1) > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
            <p className="text-xs text-gray-500">Page {page} of {data?.totalPages}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page === data?.totalPages}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
