'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, BookOpen, Users, Building2, Award, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function UniversityErpPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(null);

  const { data: universities } = useQuery({
    queryKey: ['university-erp-universities'],
    queryFn: () => api.get('/university-erp/universities').then(r => {
      const data = r.data.data as any[];
      if (data?.length && !selectedUniversityId) setSelectedUniversityId(data[0].id);
      return data;
    }),
  });

  const universityId = selectedUniversityId ?? (universities?.[0]?.id ?? null);

  const { data: faculties } = useQuery({
    queryKey: ['university-faculties', universityId],
    queryFn: () => api.get(`/university-erp/universities/${universityId}/faculties`).then(r => r.data.data ?? []),
    enabled: !!universityId && activeSection === 'faculties',
  });

  const { data: programs } = useQuery({
    queryKey: ['university-programs', universityId],
    queryFn: () => api.get(`/university-erp/universities/${universityId}/programs`).then(r => r.data.data ?? []),
    enabled: !!universityId && activeSection === 'programs',
  });

  const SECTIONS = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'faculties', label: 'Faculties', icon: GraduationCap },
    { id: 'programs', label: 'Programs', icon: BookOpen },
  ];

  const DEGREE_COLORS: Record<string, string> = {
    BACHELOR: 'bg-blue-100 text-blue-700',
    MASTER: 'bg-purple-100 text-purple-700',
    PHD: 'bg-red-100 text-red-700',
    DIPLOMA: 'bg-green-100 text-green-700',
    CERTIFICATE: 'bg-amber-100 text-amber-700',
  };

  const totalFaculties = (universities as any[])?.reduce((sum: number, u: any) => sum + (u._count?.faculties ?? 0), 0) ?? 0;
  const totalPrograms = (universities as any[])?.reduce((sum: number, u: any) => sum + (u._count?.programs ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-purple-600" /> University ERP
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage faculties, academic programs, and student enrollment</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeSection === s.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            <s.icon className="h-4 w-4" /> {s.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeSection === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Universities', value: (universities as any[])?.length ?? '—', icon: Building2, color: 'text-blue-500 bg-blue-50' },
              { label: 'Faculties', value: totalFaculties || '—', icon: GraduationCap, color: 'text-purple-500 bg-purple-50' },
              { label: 'Programs', value: totalPrograms || '—', icon: BookOpen, color: 'text-green-500 bg-green-50' },
              { label: 'Degrees Awarded', value: '—', icon: Award, color: 'text-amber-500 bg-amber-50' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center mb-3', stat.color.split(' ')[1])}>
                  <stat.icon className={cn('h-4.5 w-4.5', stat.color.split(' ')[0])} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{String(stat.value)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Navigation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'View Faculties', icon: GraduationCap, section: 'faculties' },
                { label: 'Manage Programs', icon: BookOpen, section: 'programs' },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={() => setActiveSection(action.section)}
                  className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center">
                    <action.icon className="h-4.5 w-4.5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{action.label}</span>
                  <ChevronRight className="h-4 w-4 text-gray-300 ml-auto" />
                </button>
              ))}
            </div>
          </div>

          {/* Universities list */}
          {(universities as any[])?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Universities</h3>
              <div className="space-y-3">
                {(universities as any[]).map((uni: any) => (
                  <button
                    key={uni.id}
                    onClick={() => setSelectedUniversityId(uni.id)}
                    className={cn(
                      'w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left',
                      universityId === uni.id ? 'border-purple-300 bg-purple-50' : 'border-gray-100 hover:bg-gray-50',
                    )}
                  >
                    <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{uni.name}</p>
                      {uni.code && <p className="text-xs text-gray-500">{uni.code}</p>}
                    </div>
                    <div className="text-xs text-gray-500 flex gap-3">
                      <span>{uni._count?.faculties ?? 0} faculties</span>
                      <span>{uni._count?.programs ?? 0} programs</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Faculties */}
      {activeSection === 'faculties' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(!faculties || (faculties as any[]).length === 0) && (
            <div className="col-span-3 text-center py-12 text-gray-400">No faculties configured</div>
          )}
          {(faculties as any[])?.map((faculty: any) => (
            <div key={faculty.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
                <GraduationCap className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">{faculty.name}</h3>
              {faculty.code && <p className="text-xs text-gray-500 mt-1">{faculty.code}</p>}
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                <span>{faculty._count?.departments ?? 0} departments</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Programs */}
      {activeSection === 'programs' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3.5 px-4 font-medium text-gray-600">Program</th>
                <th className="text-left py-3.5 px-4 font-medium text-gray-600">Degree</th>
                <th className="text-left py-3.5 px-4 font-medium text-gray-600">Duration</th>
                <th className="text-left py-3.5 px-4 font-medium text-gray-600">Enrollments</th>
                <th className="text-left py-3.5 px-4 font-medium text-gray-600">Department</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(!programs || (programs as any[]).length === 0) ? (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400">No programs found</td></tr>
              ) : (programs as any[]).map((prog: any) => (
                <tr key={prog.id} className="hover:bg-gray-50">
                  <td className="py-3.5 px-4 font-medium text-gray-900">{prog.name}</td>
                  <td className="py-3.5 px-4">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', DEGREE_COLORS[prog.degree] ?? 'bg-gray-100 text-gray-600')}>
                      {prog.degree}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">{prog.durationYears ? `${prog.durationYears}y` : '—'}</td>
                  <td className="py-3.5 px-4 text-gray-600">{prog._count?.enrollments ?? 0}</td>
                  <td className="py-3.5 px-4 text-gray-600">{prog.department?.name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
