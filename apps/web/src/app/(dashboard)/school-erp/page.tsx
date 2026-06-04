'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Building2, Users, BookOpen, Calendar, GraduationCap, Plus, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function SchoolErpPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const qc = useQueryClient();

  const { data: overview } = useQuery({
    queryKey: ['school-erp-overview'],
    queryFn: () => api.get('/school-erp/overview').then(r => r.data.data),
  });

  const { data: classes } = useQuery({
    queryKey: ['school-classes'],
    queryFn: () => api.get('/school-erp/classes').then(r => r.data.data?.data ?? []),
    enabled: activeSection === 'classes',
  });

  const { data: departments } = useQuery({
    queryKey: ['school-departments'],
    queryFn: () => api.get('/school-erp/departments').then(r => r.data.data?.data ?? []),
    enabled: activeSection === 'departments',
  });

  const { data: timetable } = useQuery({
    queryKey: ['school-timetable'],
    queryFn: () => api.get('/school-erp/timetable').then(r => r.data.data ?? []),
    enabled: activeSection === 'timetable',
  });

  const SECTIONS = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'classes', label: 'Classes', icon: GraduationCap },
    { id: 'departments', label: 'Departments', icon: BookOpen },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
  ];

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-600" /> School ERP
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage classes, departments, schedules and academic operations</p>
      </div>

      {/* Section Tabs */}
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
            <s.icon className="h-4 w-4" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeSection === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Students', value: overview?.studentCount ?? '—', icon: GraduationCap, color: 'text-blue-500 bg-blue-50' },
              { label: 'Total Teachers', value: overview?.teacherCount ?? '—', icon: Users, color: 'text-purple-500 bg-purple-50' },
              { label: 'Classes', value: overview?.classCount ?? '—', icon: BookOpen, color: 'text-green-500 bg-green-50' },
              { label: 'Departments', value: overview?.departmentCount ?? '—', icon: Building2, color: 'text-amber-500 bg-amber-50' },
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

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Add New Class', icon: Plus, onClick: () => setActiveSection('classes') },
                { label: 'Manage Departments', icon: Building2, onClick: () => setActiveSection('departments') },
                { label: 'View Timetable', icon: Calendar, onClick: () => setActiveSection('timetable') },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <action.icon className="h-4.5 w-4.5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{action.label}</span>
                  <ChevronRight className="h-4 w-4 text-gray-300 ml-auto" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Classes */}
      {activeSection === 'classes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              <Plus className="h-4 w-4" /> New Class
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Class Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Grade</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Students</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Teacher</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!classes || (classes as any[]).length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-gray-400">No classes found</td></tr>
                ) : (classes as any[]).map((cls: any) => (
                  <tr key={cls.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{cls.name}</td>
                    <td className="py-3 px-4 text-gray-600">{cls.grade ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{cls._count?.students ?? 0}</td>
                    <td className="py-3 px-4 text-gray-600">{cls.teacher?.user?.firstName} {cls.teacher?.user?.lastName}</td>
                    <td className="py-3 px-4 text-gray-600">{cls.room ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Departments */}
      {activeSection === 'departments' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(!departments || (departments as any[]).length === 0) && (
            <div className="col-span-3 text-center py-12 text-gray-400">No departments configured</div>
          )}
          {(departments as any[])?.map((dept: any) => (
            <div key={dept.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{dept.name}</p>
                  {dept.code && <p className="text-xs text-gray-500">{dept.code}</p>}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{dept._count?.teachers ?? 0} teachers</span>
                <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{dept._count?.students ?? 0} students</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timetable */}
      {activeSection === 'timetable' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 font-medium text-gray-600 text-left w-24">Period</th>
                  {DAYS.map(d => (
                    <th key={d} className="py-3 px-4 font-medium text-gray-600 text-center">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {Array.from({ length: 8 }, (_, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-500 font-medium text-xs">Period {i + 1}</td>
                    {DAYS.map(day => {
                      const slot = (timetable as any[])?.find(t => t.day === day.toUpperCase() && t.period === i + 1);
                      return (
                        <td key={day} className="py-2 px-3">
                          {slot ? (
                            <div className="bg-blue-50 rounded-lg p-2 text-center">
                              <p className="text-xs font-medium text-blue-800">{slot.subject}</p>
                              <p className="text-xs text-blue-600">{slot.teacher?.user?.firstName}</p>
                            </div>
                          ) : (
                            <div className="h-12 rounded-lg bg-gray-50 border border-dashed border-gray-200" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
