'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function ParentsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['parents', search, page],
    queryFn: () => api.get('/users', { params: { search: search || undefined, page, limit: 20, role: 'PARENT' } }).then(r => r.data.data),
  });

  const parents: any[] = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parent Portal</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.total ?? 0} registered parents</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parents List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">Parents</p>
          </div>
          <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gray-100 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-100 rounded w-32 animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded w-24 animate-pulse" />
                </div>
              </div>
            ))}
            {!isLoading && parents.map(parent => (
              <button
                key={parent.id}
                onClick={() => setSelected(parent)}
                className={cn(
                  'w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left',
                  selected?.id === parent.id && 'bg-blue-50',
                )}
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {parent.firstName?.[0]}{parent.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {parent.firstName} {parent.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{parent.email}</p>
                </div>
                <div className={cn('text-xs px-1.5 py-0.5 rounded-full', parent.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                  {parent.isActive ? 'Active' : 'Inactive'}
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </button>
            ))}
            {!isLoading && parents.length === 0 && (
              <div className="py-12 text-center text-gray-400 text-sm">No parents found</div>
            )}
          </div>
          {(data?.totalPages ?? 1) > 1 && (
            <div className="p-3 border-t flex justify-between gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="text-xs px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50">
                Previous
              </button>
              <span className="text-xs text-gray-500 self-center">Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page === data?.totalPages}
                className="text-xs px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50">
                Next
              </button>
            </div>
          )}
        </div>

        {/* Parent Detail Panel */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-white rounded-xl border border-gray-200 h-full flex items-center justify-center py-20">
              <div className="text-center">
                <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Select a parent to view details</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Parent Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                    {selected.firstName?.[0]}{selected.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {selected.firstName} {selected.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{selected.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Member since {new Date(selected.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" /> Account Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className={cn('font-medium', selected.isActive ? 'text-green-600' : 'text-gray-400')}>
                      {selected.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email verified</span>
                    <span className="font-medium">{selected.emailVerified ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last login</span>
                    <span className="font-medium">{selected.lastLoginAt ? new Date(selected.lastLoginAt).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

