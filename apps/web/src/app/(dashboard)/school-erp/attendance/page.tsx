'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ClipboardList, Users, BarChart3, Check, X, Clock, BookOpen } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

interface Student {
  id: string;
  studentId?: string;
  grade?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    email: string;
  };
}

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

interface SummaryRow {
  studentId: string;
  name: string;
  avatarUrl?: string | null;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  rate: number;
}

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PRESENT: { label: 'Present', color: 'text-green-700', bg: 'bg-green-100 hover:bg-green-200 border-green-200', icon: Check },
  ABSENT: { label: 'Absent', color: 'text-red-700', bg: 'bg-red-100 hover:bg-red-200 border-red-200', icon: X },
  LATE: { label: 'Late', color: 'text-amber-700', bg: 'bg-amber-100 hover:bg-amber-200 border-amber-200', icon: Clock },
  EXCUSED: { label: 'Excused', color: 'text-blue-700', bg: 'bg-blue-100 hover:bg-blue-200 border-blue-200', icon: BookOpen },
};

const STATUS_ACTIVE: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-green-500 text-white border-green-500',
  ABSENT: 'bg-red-500 text-white border-red-500',
  LATE: 'bg-amber-500 text-white border-amber-500',
  EXCUSED: 'bg-blue-500 text-white border-blue-500',
};

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function firstOfMonthStr() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split('T')[0];
}

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<'mark' | 'summary'>('mark');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [date, setDate] = useState(todayStr());
  const [summaryFrom, setSummaryFrom] = useState(firstOfMonthStr());
  const [summaryTo, setSummaryTo] = useState(todayStr());
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const qc = useQueryClient();

  // Fetch schools
  const { data: schools } = useQuery<any[]>({
    queryKey: ['attendance-schools'],
    queryFn: () =>
      api.get('/school-erp/schools').then((r) => {
        const data = r.data.data as any[];
        if (data?.length && !selectedSchoolId) setSelectedSchoolId(data[0].id);
        return data;
      }),
  });

  const schoolId = selectedSchoolId ?? (schools?.[0]?.id ?? null);

  // Fetch classes for selected school
  const { data: classes } = useQuery<any[]>({
    queryKey: ['attendance-classes', schoolId],
    queryFn: () =>
      api.get(`/school-erp/schools/${schoolId}/classes`).then((r) => {
        const data = r.data.data ?? [];
        if (data.length && !selectedClassId) setSelectedClassId(data[0].id);
        return data;
      }),
    enabled: !!schoolId,
  });

  const classId = selectedClassId ?? (classes?.[0]?.id ?? null);

  // Fetch roster for mark tab
  const { data: roster, isLoading: rosterLoading } = useQuery<Student[]>({
    queryKey: ['attendance-roster', classId],
    queryFn: () => api.get(`/attendance/class/${classId}/roster`).then((r) => r.data.data ?? r.data ?? []),
    enabled: !!classId && activeTab === 'mark',
    onSuccess: (students: Student[]) => {
      setAttendanceMap((prev) => {
        const next: Record<string, AttendanceStatus> = {};
        for (const s of students) {
          next[s.id] = prev[s.id] ?? 'PRESENT';
        }
        return next;
      });
    },
  });

  // Fetch existing attendance for this class+date to pre-populate
  useQuery({
    queryKey: ['attendance-class', classId, date],
    queryFn: () => api.get(`/attendance/class/${classId}?date=${date}`).then((r) => r.data.data ?? r.data ?? []),
    enabled: !!classId && activeTab === 'mark',
    onSuccess: (records: any[]) => {
      if (records.length > 0) {
        setAttendanceMap((prev) => {
          const next = { ...prev };
          for (const rec of records) {
            next[rec.studentId] = rec.status as AttendanceStatus;
          }
          return next;
        });
        setNoteMap((prev) => {
          const next = { ...prev };
          for (const rec of records) {
            if (rec.note) next[rec.studentId] = rec.note;
          }
          return next;
        });
      }
    },
  });

  // Fetch summary
  const { data: summary, isLoading: summaryLoading } = useQuery<SummaryRow[]>({
    queryKey: ['attendance-summary', classId, summaryFrom, summaryTo],
    queryFn: () =>
      api
        .get(`/attendance/class/${classId}/summary?from=${summaryFrom}&to=${summaryTo}`)
        .then((r) => r.data.data ?? r.data ?? []),
    enabled: !!classId && activeTab === 'summary',
  });

  // Mark attendance mutation
  const markMutation = useMutation({
    mutationFn: (records: AttendanceRecord[]) =>
      api.post('/attendance', { classId, date, records }),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      qc.invalidateQueries({ queryKey: ['attendance-class', classId, date] });
      qc.invalidateQueries({ queryKey: ['attendance-summary', classId] });
    },
  });

  const handleSave = () => {
    if (!roster) return;
    const records: AttendanceRecord[] = roster.map((s) => ({
      studentId: s.id,
      status: attendanceMap[s.id] ?? 'PRESENT',
      note: noteMap[s.id] ?? undefined,
    }));
    markMutation.mutate(records);
  };

  const setAllStatus = (status: AttendanceStatus) => {
    if (!roster) return;
    const next: Record<string, AttendanceStatus> = {};
    for (const s of roster) next[s.id] = status;
    setAttendanceMap(next);
  };

  const TABS = [
    { id: 'mark' as const, label: 'Mark Attendance', icon: ClipboardList },
    { id: 'summary' as const, label: 'Summary', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-blue-600" /> Attendance
        </h1>
        <p className="text-sm text-gray-500 mt-1">Mark and review student attendance records</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Selectors row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* School selector */}
        {schools && schools.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 shrink-0">School:</label>
            <select
              value={schoolId ?? ''}
              onChange={(e) => {
                setSelectedSchoolId(e.target.value || null);
                setSelectedClassId(null);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {schools.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Class selector */}
        {classes && classes.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 shrink-0">Class:</label>
            <select
              value={classId ?? ''}
              onChange={(e) => setSelectedClassId(e.target.value || null)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {classes.map((cls: any) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                  {cls.grade ? ` — Grade ${cls.grade}` : ''}
                  {cls.section ? ` (${cls.section})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date picker (mark tab) */}
        {activeTab === 'mark' && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 shrink-0">Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        )}

        {/* Date range (summary tab) */}
        {activeTab === 'summary' && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 shrink-0">From:</label>
              <input
                type="date"
                value={summaryFrom}
                onChange={(e) => setSummaryFrom(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 shrink-0">To:</label>
              <input
                type="date"
                value={summaryTo}
                onChange={(e) => setSummaryTo(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </>
        )}
      </div>

      {/* Mark Attendance Tab */}
      {activeTab === 'mark' && (
        <div className="space-y-4">
          {!classId ? (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
              No class selected
            </div>
          ) : (
            <>
              {/* Bulk action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-600 mr-1">Mark all:</span>
                {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((status) => {
                  const cfg = STATUS_CONFIG[status];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={status}
                      onClick={() => setAllStatus(status)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                        cfg.bg,
                        cfg.color,
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>

              {/* Roster table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {rosterLoading ? (
                  <div className="py-16 text-center text-gray-400">Loading students...</div>
                ) : !roster || roster.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-gray-300" />
                      <p className="text-gray-400 text-sm">No students in this class</p>
                    </div>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Student</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 hidden md:table-cell">
                          Note
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {roster.map((student) => {
                        const { firstName, lastName, avatarUrl } = student.user;
                        const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
                        const currentStatus = attendanceMap[student.id] ?? 'PRESENT';

                        return (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {avatarUrl ? (
                                  <img
                                    src={avatarUrl}
                                    alt={initials}
                                    className="h-8 w-8 rounded-full object-cover shrink-0"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                    {initials}
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {firstName} {lastName}
                                  </p>
                                  {student.studentId && (
                                    <p className="text-xs text-gray-400 font-mono">{student.studentId}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1 flex-wrap">
                                {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((status) => {
                                  const cfg = STATUS_CONFIG[status];
                                  const Icon = cfg.icon;
                                  const isActive = currentStatus === status;
                                  return (
                                    <button
                                      key={status}
                                      onClick={() =>
                                        setAttendanceMap((prev) => ({
                                          ...prev,
                                          [student.id]: status,
                                        }))
                                      }
                                      title={cfg.label}
                                      className={cn(
                                        'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                                        isActive ? STATUS_ACTIVE[status] : `${cfg.bg} ${cfg.color}`,
                                      )}
                                    >
                                      <Icon className="h-3 w-3" />
                                      <span className="hidden sm:inline">{cfg.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell">
                              <input
                                type="text"
                                placeholder="Optional note..."
                                value={noteMap[student.id] ?? ''}
                                onChange={(e) =>
                                  setNoteMap((prev) => ({ ...prev, [student.id]: e.target.value }))
                                }
                                className="w-full max-w-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Save button */}
              {roster && roster.length > 0 && (
                <div className="flex items-center justify-between">
                  {saved && (
                    <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                      <Check className="h-4 w-4" /> Attendance saved successfully
                    </span>
                  )}
                  {!saved && <span />}
                  <button
                    onClick={handleSave}
                    disabled={markMutation.isLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    <ClipboardList className="h-4 w-4" />
                    {markMutation.isLoading ? 'Saving...' : 'Save Attendance'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          {!classId ? (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
              No class selected
            </div>
          ) : summaryLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
              Loading summary...
            </div>
          ) : !summary || summary.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
              No attendance records found for this period
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Student</th>
                      <th className="text-center py-3 px-4 font-medium text-green-700">Present</th>
                      <th className="text-center py-3 px-4 font-medium text-red-700">Absent</th>
                      <th className="text-center py-3 px-4 font-medium text-amber-700">Late</th>
                      <th className="text-center py-3 px-4 font-medium text-blue-700">Excused</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Total</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {summary.map((row) => {
                      const initials = row.name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);
                      return (
                        <tr key={row.studentId} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {row.avatarUrl ? (
                                <img
                                  src={row.avatarUrl}
                                  alt={initials}
                                  className="h-8 w-8 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                  {initials}
                                </div>
                              )}
                              <span className="font-medium text-gray-900">{row.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                              {row.present}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                              {row.absent}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                              {row.late}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                              {row.excused}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-gray-500 text-xs">{row.total}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full',
                                    row.rate >= 90
                                      ? 'bg-green-500'
                                      : row.rate >= 75
                                      ? 'bg-amber-500'
                                      : 'bg-red-500',
                                  )}
                                  style={{ width: `${row.rate}%` }}
                                />
                              </div>
                              <span
                                className={cn(
                                  'text-xs font-semibold',
                                  row.rate >= 90
                                    ? 'text-green-700'
                                    : row.rate >= 75
                                    ? 'text-amber-700'
                                    : 'text-red-700',
                                )}
                              >
                                {row.rate}%
                              </span>
                            </div>
                          </td>
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
