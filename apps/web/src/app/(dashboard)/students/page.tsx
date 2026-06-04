'use client';

import { useState } from 'react';
import { Search, Plus, MoreHorizontal } from 'lucide-react';
import { useStudents } from '@/hooks/useStudents';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useStudents({ search, page, limit: 20 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.total ?? 0} total students</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>Add Student</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3.5 px-4 font-medium text-gray-600">Student</th>
                <th className="text-left py-3.5 px-4 font-medium text-gray-600">Grade</th>
                <th className="text-left py-3.5 px-4 font-medium text-gray-600">Courses</th>
                <th className="text-left py-3.5 px-4 font-medium text-gray-600">Status</th>
                <th className="text-left py-3.5 px-4 font-medium text-gray-600">Joined</th>
                <th className="py-3.5 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="py-4 px-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))}
              {!isLoading && (data?.data ?? []).map((student: any) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                        {student.user?.firstName?.[0]}{student.user?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.user?.firstName} {student.user?.lastName}</p>
                        <p className="text-xs text-gray-500">{student.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">{student.grade ?? '—'}</td>
                  <td className="py-3.5 px-4 text-gray-600">{student.courseProgress?.length ?? 0}</td>
                  <td className="py-3.5 px-4">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', student.user?.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {student.user?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 text-xs">{new Date(student.createdAt).toLocaleDateString()}</td>
                  <td className="py-3.5 px-4">
                    <button className="p-1 rounded hover:bg-gray-100"><MoreHorizontal className="h-4 w-4 text-gray-400" /></button>
                  </td>
                </tr>
              ))}
              {!isLoading && !data?.data?.length && (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">No students found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {(data?.totalPages ?? 0) > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100 bg-gray-50">
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
