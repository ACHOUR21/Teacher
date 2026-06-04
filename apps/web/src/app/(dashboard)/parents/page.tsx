'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, BookOpen, BarChart2, Search, ChevronRight, TrendingUp, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function ParentsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['parents', search, page],
    queryFn: () => api.get('/parents', { params: { search: search || undefined, page, limit: 20 } }).then(r => r.data.data),
  });

  const { data: childProgress } = useQuery({
    queryKey: ['parent-children', selected?.id],
    queryFn: () => api.get(`/parents/${selected?.id}/children`).then(r => r.data.data),
    enabled: !!selected,
  });

  const parents: any[] = data?.data ?? [];

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
                  {parent.user?.firstName?.[0]}{parent.user?.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {parent.user?.firstName} {parent.user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{parent.user?.email}</p>
                </div>
                <div className="text-xs text-gray-400">
                  {parent._count?.children ?? 0} child{parent._count?.children !== 1 ? 'ren' : ''}
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
                    {selected.user?.firstName?.[0]}{selected.user?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {selected.user?.firstName} {selected.user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{selected.user?.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Member since {new Date(selected.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Children Progress */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" /> Children's Progress
                </h3>
                {!childProgress ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : childProgress.length === 0 ? (
                  <p className="text-sm text-gray-400">No children linked yet</p>
                ) : (
                  <div className="space-y-3">
                    {childProgress.map((child: any) => (
                      <ChildCard key={child.id} child={child} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChildCard({ child }: { child: any }) {
  const avgProgress = child.courseProgress?.length
    ? Math.round(child.courseProgress.reduce((a: number, c: any) => a + (c.progressPercent ?? 0), 0) / child.courseProgress.length)
    : 0;

  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
          {child.user?.firstName?.[0]}{child.user?.lastName?.[0]}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{child.user?.firstName} {child.user?.lastName}</p>
          <p className="text-xs text-gray-500">{child.grade ? `Grade ${child.grade}` : 'Student'}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {avgProgress >= 70 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : avgProgress < 40 ? (
            <AlertCircle className="h-4 w-4 text-red-400" />
          ) : (
            <BarChart2 className="h-4 w-4 text-amber-400" />
          )}
          <span className={cn(
            'text-sm font-semibold',
            avgProgress >= 70 ? 'text-green-600' : avgProgress < 40 ? 'text-red-500' : 'text-amber-600',
          )}>
            {avgProgress}% avg
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {(child.courseProgress ?? []).slice(0, 3).map((cp: any) => (
          <div key={cp.id}>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span className="truncate max-w-[200px]">{cp.course?.title}</span>
              <span>{cp.progressPercent}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', cp.progressPercent >= 70 ? 'bg-green-500' : 'bg-blue-500')}
                style={{ width: `${cp.progressPercent}%` }}
              />
            </div>
          </div>
        ))}
        {(child.courseProgress?.length ?? 0) > 3 && (
          <p className="text-xs text-gray-400">+{child.courseProgress.length - 3} more courses</p>
        )}
      </div>
    </div>
  );
}
