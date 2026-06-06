'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Building2, Users, BookOpen, Calendar, GraduationCap, Plus, ChevronRight, X, ClipboardList } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function SchoolErpPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [assignStudentId, setAssignStudentId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const qc = useQueryClient();

  const { data: schools } = useQuery<any[]>({
    queryKey: ['school-erp-schools'],
    queryFn: () => api.get('/school-erp/schools').then(r => {
      const data = r.data.data as any[];
      if (data?.length && !selectedSchoolId) setSelectedSchoolId(data[0].id);
      return data;
    }),
  });

  const schoolId = selectedSchoolId ?? (schools?.[0]?.id ?? null);

  const { data: overview } = useQuery({
    queryKey: ['school-erp-stats', schoolId],
    queryFn: () => api.get(`/school-erp/schools/${schoolId}/stats`).then(r => r.data.data),
    enabled: !!schoolId,
  });

  const { data: classes } = useQuery<any[]>({
    queryKey: ['school-classes', schoolId],
    queryFn: () => api.get(`/school-erp/schools/${schoolId}/classes`).then(r => r.data.data ?? []),
    enabled: !!schoolId && (activeSection === 'classes' || activeSection === 'timetable' || activeSection === 'roster'),
  });

  const { data: departments } = useQuery({
    queryKey: ['school-departments', schoolId],
    queryFn: () => api.get(`/school-erp/schools/${schoolId}/departments`).then(r => r.data.data ?? []),
    enabled: !!schoolId && activeSection === 'departments',
  });

  /* Resolved class for timetable/roster */
  const classId = selectedClassId ?? (classes?.[0]?.id ?? null);

  const { data: timetableData } = useQuery<any[]>({
    queryKey: ['school-timetable', classId],
    queryFn: () => api.get(`/school-erp/classes/${classId}/timetable`).then(r => r.data.data ?? []),
    enabled: !!classId && activeSection === 'timetable',
  });

  const { data: rosterData } = useQuery<any[]>({
    queryKey: ['school-roster', classId],
    queryFn: () => api.get(`/school-erp/classes/${classId}/students`).then(r => r.data.data ?? []),
    enabled: !!classId && activeSection === 'roster',
  });

  const timetable: any[] = timetableData ?? [];
  const roster: any[] = rosterData ?? [];

  const SECTIONS = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'classes', label: 'Classes', icon: GraduationCap },
    { id: 'departments', label: 'Departments', icon: BookOpen },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'roster', label: 'Class Roster', icon: ClipboardList },
  ];

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const TIME_SLOTS = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM',
  ];

  const handleAssignStudent = async () => {
    if (!assignStudentId.trim() || !classId) return;
    setAssigning(true);
    try {
      await api.post(`/school-erp/classes/${classId}/students`, { studentId: assignStudentId.trim() });
      qc.invalidateQueries({ queryKey: ['school-roster', classId] });
      setAssignStudentId('');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-600" /> School ERP
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage classes, departments, schedules and academic operations</p>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
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
              { label: 'Total Students', value: overview?.totalStudents ?? '—', icon: GraduationCap, color: 'text-blue-500 bg-blue-50' },
              { label: 'Total Teachers', value: overview?.totalTeachers ?? '—', icon: Users, color: 'text-purple-500 bg-purple-50' },
              { label: 'Classes', value: overview?.totalClasses ?? '—', icon: BookOpen, color: 'text-green-500 bg-green-50' },
              { label: 'Active Sessions', value: overview?.activeSessions ?? '—', icon: Building2, color: 'text-amber-500 bg-amber-50' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center mb-3', stat.color.split(' ')[1])}>
                  <stat.icon className={cn('h-4 w-4', stat.color.split(' ')[0])} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{String(stat.value)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
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
                    <action.icon className="h-4 w-4 text-blue-600" />
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
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Section</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Students</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!classes || (classes as any[]).length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-gray-400">No classes found</td></tr>
                ) : (classes as any[]).map((cls: any) => (
                  <tr key={cls.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{cls.name}</td>
                    <td className="py-3 px-4 text-gray-600">{cls.grade ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{cls.section ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{cls._count?.students ?? 0}</td>
                    <td className="py-3 px-4 text-gray-600">{cls.department?.name ?? '—'}</td>
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
                <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{dept._count?.classes ?? 0} classes</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timetable */}
      {activeSection === 'timetable' && (
        <div className="space-y-4">
          {/* Class selector */}
          {classes && classes.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 shrink-0">Select Class:</label>
              <select
                value={classId ?? ''}
                onChange={e => setSelectedClassId(e.target.value || null)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>{cls.name}{cls.grade ? ` — Grade ${cls.grade}` : ''}{cls.section ? ` (${cls.section})` : ''}</option>
                ))}
              </select>
            </div>
          )}

          {!classId ? (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
              No class selected
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 font-medium text-gray-600 text-left w-28">Time</th>
                      {DAYS.map(d => (
                        <th key={d} className="py-3 px-4 font-medium text-gray-600 text-center">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {TIME_SLOTS.map((time, i) => (
                      <tr key={time} className="hover:bg-gray-50">
                        <td className="py-2 px-4 text-gray-500 font-medium text-xs whitespace-nowrap">{time}</td>
                        {DAYS.map(day => {
                          const slot = timetable.find(
                            t => t.day?.toUpperCase() === day.toUpperCase() &&
                                 (t.startTime === time || t.period === i + 1 || t.timeSlot === time)
                          );
                          return (
                            <td key={day} className="py-1.5 px-2">
                              {slot ? (
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 text-center">
                                  <p className="text-xs font-semibold text-blue-800 truncate">{slot.subject ?? slot.course ?? '—'}</p>
                                  {slot.room && <p className="text-xs text-blue-600 mt-0.5">Room {slot.room}</p>}
                                  {slot.teacher && (
                                    <p className="text-xs text-blue-500 mt-0.5 truncate">
                                      {slot.teacher?.user?.firstName ?? slot.teacher?.name ?? slot.teacher}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="h-14 rounded-lg bg-gray-50 border border-dashed border-gray-200" />
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
      )}

      {/* Class Roster */}
      {activeSection === 'roster' && (
        <div className="space-y-4">
          {/* Class selector */}
          {classes && classes.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 shrink-0">Select Class:</label>
              <select
                value={classId ?? ''}
                onChange={e => setSelectedClassId(e.target.value || null)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>{cls.name}{cls.grade ? ` — Grade ${cls.grade}` : ''}{cls.section ? ` (${cls.section})` : ''}</option>
                ))}
              </select>
            </div>
          )}

          {/* Assign student */}
          {classId && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Assign Student to Class</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter Student ID..."
                  value={assignStudentId}
                  onChange={e => setAssignStudentId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAssignStudent()}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAssignStudent}
                  disabled={!assignStudentId.trim() || assigning}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  {assigning ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          )}

          {!classId ? (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
              No class selected
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Students {roster.length > 0 && <span className="text-gray-400 font-normal">({roster.length})</span>}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Student ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Grade</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">GPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {roster.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="h-8 w-8 text-gray-300" />
                            <p className="text-gray-400 text-sm">No students in this class yet</p>
                          </div>
                        </td>
                      </tr>
                    ) : roster.map((student: any) => {
                      const firstName = student.firstName ?? student.user?.firstName ?? '';
                      const lastName = student.lastName ?? student.user?.lastName ?? '';
                      const email = student.email ?? student.user?.email ?? '—';
                      const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
                      return (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                {initials || <Users className="h-4 w-4" />}
                              </div>
                              <span className="font-medium text-gray-900">{firstName} {lastName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-500 text-xs">{email}</td>
                          <td className="py-3 px-4 font-mono text-xs text-gray-600">{student.studentId ?? '—'}</td>
                          <td className="py-3 px-4 text-gray-600">{student.grade ?? '—'}</td>
                          <td className="py-3 px-4 text-gray-600">{student.gpa?.toFixed(2) ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
