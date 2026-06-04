'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Star, BookOpen, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function TeachersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['teachers', search, page],
    queryFn: () => api.get(`/teachers?search=${search}&page=${page}&limit=20`).then(r => r.data.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.total ?? 0} teachers in your institution</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email or subject..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data?.data ?? []).map((teacher: any) => (
              <div key={teacher.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {teacher.user?.firstName?.[0]}{teacher.user?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{teacher.user?.firstName} {teacher.user?.lastName}</p>
                    <p className="text-xs text-gray-500">{teacher.school?.name ?? 'Independent'}</p>
                  </div>
                  {teacher.isVerified && (
                    <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Verified</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {(teacher.subjects ?? []).slice(0, 3).map((s: string) => (
                    <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">{s}</span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />{teacher._count?.courses ?? 0} courses
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />{teacher.rating?.toFixed(1) ?? '—'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />{teacher.yearsExperience ?? 0}y exp
                  </span>
                </div>
              </div>
            ))}
          </div>
          {!data?.data?.length && (
            <div className="text-center py-16 text-gray-400">No teachers found</div>
          )}
          {(data?.totalPages ?? 0) > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <span className="px-3 py-1.5 text-sm text-gray-600">Page {page} of {data?.totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === data?.totalPages}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
