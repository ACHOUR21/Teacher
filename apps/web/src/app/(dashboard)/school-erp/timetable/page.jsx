'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Plus, X, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
const DAYS = [
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7..20
const DAY_COLORS = {
    1: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    2: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
    3: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    4: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
    5: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200' },
};
function formatHour(h) {
    const ampm = h < 12 ? 'AM' : 'PM';
    const display = h <= 12 ? h : h - 12;
    return `${display}:00 ${ampm}`;
}
function AddEntryModal({ classId, onClose, onSaved }) {
    const [dayOfWeek, setDayOfWeek] = useState(1);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [room, setRoom] = useState('');
    const [teacherId, setTeacherId] = useState('');
    const [error, setError] = useState('');
    const mutation = useMutation({
        mutationFn: (dto) => api.post(`/school-erp/classes/${classId}/timetable`, dto).then((r) => r.data),
        onSuccess: () => {
            onSaved();
            onClose();
        },
        onError: (err) => {
            setError(err?.message || 'Failed to add entry');
        },
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (startTime >= endTime) {
            setError('End time must be after start time');
            return;
        }
        mutation.mutate({
            dayOfWeek,
            startTime,
            endTime,
            ...(room.trim() && { room: room.trim() }),
            ...(teacherId.trim() && { teacherId: teacherId.trim() }),
        });
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Add Timetable Entry</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5"/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
            <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {DAYS.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
            <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. Room 101" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teacher ID (optional)</label>
            <input type="text" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} placeholder="Teacher UUID" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>

          {error && (<p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>)}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none">
              {mutation.isPending ? 'Adding...' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>);
}
// Skeleton for the grid while loading
function GridSkeleton() {
    return (<div className="animate-pulse">
      <div className="grid grid-cols-6 gap-px bg-gray-200 rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="bg-gray-50 p-3"/>
        {DAYS.map((d) => (<div key={d.value} className="bg-gray-50 p-3">
            <div className="h-4 w-16 bg-gray-200 rounded"/>
          </div>))}
        {/* Body rows */}
        {HOURS.slice(0, 8).map((h) => (<>
            <div key={`t-${h}`} className="bg-white p-2">
              <div className="h-3 w-12 bg-gray-100 rounded"/>
            </div>
            {DAYS.map((d) => (<div key={`c-${h}-${d.value}`} className="bg-white p-1 min-h-[60px]"/>))}
          </>))}
      </div>
    </div>);
}
export default function TimetablePage() {
    const qc = useQueryClient();
    const [selectedSchoolId, setSelectedSchoolId] = useState(null);
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    // Fetch schools
    const { data: schools } = useQuery({
        queryKey: ['timetable-schools'],
        queryFn: () => api.get('/school-erp/schools').then((r) => {
            const d = r.data;
            return Array.isArray(d) ? d : d?.data ?? [];
        }),
    });
    useEffect(() => {
        if (schools?.length && !selectedSchoolId) {
            setSelectedSchoolId(schools[0].id);
        }
    }, [schools, selectedSchoolId]);
    const schoolId = selectedSchoolId ?? schools?.[0]?.id ?? null;
    // Fetch classes for selected school
    const { data: classes } = useQuery({
        queryKey: ['timetable-classes', schoolId],
        queryFn: () => api.get(`/school-erp/schools/${schoolId}/classes`).then((r) => {
            const d = r.data;
            return Array.isArray(d) ? d : d?.data ?? [];
        }),
        enabled: !!schoolId,
    });
    useEffect(() => {
        if (classes?.length && !selectedClassId) {
            setSelectedClassId(classes[0].id);
        }
    }, [classes, selectedClassId]);
    const classId = selectedClassId ?? classes?.[0]?.id ?? null;
    // Fetch timetable entries
    const { data: entries, isLoading } = useQuery({
        queryKey: ['timetable', classId],
        queryFn: () => api.get(`/school-erp/classes/${classId}/timetable`).then((r) => {
            const d = r.data;
            return Array.isArray(d) ? d : d?.data ?? [];
        }),
        enabled: !!classId,
    });
    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/school-erp/timetable/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['timetable', classId] });
        },
    });
    const handleSaved = () => {
        qc.invalidateQueries({ queryKey: ['timetable', classId] });
    };
    // Helper: entries for a specific (day, hour) cell
    const getEntriesForCell = (day, hour) => {
        if (!entries) {
            return [];
        }
        return entries.filter((e) => {
            if (e.dayOfWeek !== day) {
                return false;
            }
            const startH = parseInt(e.startTime.split(':')[0], 10);
            const endH = parseInt(e.endTime.split(':')[0], 10);
            return startH <= hour && endH > hour;
        });
    };
    const selectedClass = classes?.find((c) => c.id === classId);
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-blue-600"/> Weekly Timetable
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage class schedules across the week</p>
        </div>
        {classId && (<button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4"/>
            Add Entry
          </button>)}
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap gap-3 items-center">
        {schools && schools.length > 1 && (<div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 shrink-0">School:</label>
            <select value={schoolId ?? ''} onChange={(e) => {
                setSelectedSchoolId(e.target.value || null);
                setSelectedClassId(null);
            }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {schools.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>)}

        {classes && classes.length > 0 && (<div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 shrink-0">Class:</label>
            <select value={classId ?? ''} onChange={(e) => setSelectedClassId(e.target.value || null)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {classes.map((cls) => (<option key={cls.id} value={cls.id}>
                  {cls.name}
                  {cls.grade ? ` — Grade ${cls.grade}` : ''}
                  {cls.section ? ` (${cls.section})` : ''}
                </option>))}
            </select>
          </div>)}

        {selectedClass && (<span className="ml-auto text-sm text-gray-500">
            Showing timetable for <span className="font-medium text-gray-700">{selectedClass.name}</span>
          </span>)}
      </div>

      {/* Main content */}
      {!classId ? (<div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
          <CalendarDays className="h-10 w-10 text-gray-300 mx-auto mb-3"/>
          <p className="text-gray-400 text-sm">Select a class to view timetable</p>
        </div>) : isLoading ? (<GridSkeleton />) : (<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-20 py-3 px-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <Clock className="h-3.5 w-3.5 inline mr-1"/>Time
                  </th>
                  {DAYS.map((d) => {
                const colors = DAY_COLORS[d.value];
                return (<th key={d.value} className={cn('py-3 px-2 text-center text-xs font-semibold uppercase tracking-wide', colors.text)}>
                        {d.label}
                      </th>);
            })}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour) => (<tr key={hour} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    {/* Time label */}
                    <td className="py-2 px-3 text-xs text-gray-400 font-medium whitespace-nowrap align-top pt-3">
                      {formatHour(hour)}
                    </td>
                    {/* Day cells */}
                    {DAYS.map((d) => {
                    const cellEntries = getEntriesForCell(d.value, hour);
                    const colors = DAY_COLORS[d.value];
                    return (<td key={d.value} className="py-1.5 px-1.5 align-top min-w-[120px] min-h-[56px]">
                          <div className="flex flex-col gap-1">
                            {cellEntries.map((entry) => (<div key={entry.id} className={cn('relative group rounded-lg border px-2 py-1.5 text-xs leading-snug', colors.bg, colors.text, colors.border)}>
                                {/* Delete button */}
                                <button onClick={() => deleteMutation.mutate(entry.id)} disabled={deleteMutation.isPending} className={cn('absolute top-1 right-1 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity', 'hover:bg-white/60', colors.text)} title="Remove entry">
                                  <X className="h-3 w-3"/>
                                </button>

                                {/* Entry label — show room or times */}
                                <p className="font-medium pr-4 truncate">
                                  {entry.room ?? `${entry.startTime}–${entry.endTime}`}
                                </p>
                                <p className="opacity-70 text-[10px] mt-0.5">
                                  {entry.startTime} – {entry.endTime}
                                </p>
                                {entry.room && entry.startTime && (<p className="opacity-60 text-[10px]">Room: {entry.room}</p>)}
                              </div>))}
                          </div>
                        </td>);
                })}
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>)}

      {/* Add Entry Modal */}
      {showModal && classId && (<AddEntryModal classId={classId} onClose={() => setShowModal(false)} onSaved={handleSaved}/>)}
    </div>);
}
