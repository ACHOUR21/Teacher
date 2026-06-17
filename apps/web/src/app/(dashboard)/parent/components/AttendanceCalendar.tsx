'use client';

import {
  getDaysInMonth,
  startOfMonth,
  getDay,
  format,
  isSameDay,
} from 'date-fns';

import { cn } from '@/lib/utils';

export interface AttendanceRecord {
  date: string | Date;
  status: string;
  note?: string | null;
  className: string;
}

interface AttendanceCalendarProps {
  month: Date;
  records: AttendanceRecord[];
  onMonthChange?: (month: Date) => void;
}

const STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-green-500',
  ABSENT:  'bg-red-500',
  LATE:    'bg-yellow-500',
  EXCUSED: 'bg-blue-500',
};

const STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Present',
  ABSENT:  'Absent',
  LATE:    'Late',
  EXCUSED: 'Excused',
};

export function AttendanceCalendar({ month, records, onMonthChange }: AttendanceCalendarProps) {
  const daysInMonth = getDaysInMonth(month);
  const firstDayOfWeek = getDay(startOfMonth(month)); // 0=Sun, 1=Mon...

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function getRecordForDay(day: number): AttendanceRecord | undefined {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    return records.find(r => isSameDay(new Date(r.date), date));
  }

  function prevMonth() {
    const d = new Date(month);
    d.setMonth(d.getMonth() - 1);
    onMonthChange?.(d);
  }

  function nextMonth() {
    const d = new Date(month);
    d.setMonth(d.getMonth() + 1);
    onMonthChange?.(d);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-gray-900">{format(month, 'MMMM yyyy')}</h3>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            aria-label="Previous month"
          >
            &#8249;
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            aria-label="Next month"
          >
            &#8250;
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const record = getRecordForDay(day);
          const dotColor = record ? (STATUS_COLORS[record.status] ?? 'bg-gray-300') : '';
          const isToday =
            new Date().getFullYear() === month.getFullYear() &&
            new Date().getMonth() === month.getMonth() &&
            new Date().getDate() === day;

          return (
            <div
              key={day}
              title={record ? `${STATUS_LABELS[record.status] ?? record.status} — ${record.className}${record.note ? ` (${record.note})` : ''}` : undefined}
              className={cn(
                'flex flex-col items-center justify-center h-10 rounded-lg text-sm',
                isToday && 'ring-2 ring-blue-400',
                record ? 'cursor-default' : 'text-gray-400',
              )}
            >
              <span className={cn('font-medium', isToday ? 'text-blue-600' : record ? 'text-gray-800' : 'text-gray-400')}>
                {day}
              </span>
              {dotColor && (
                <span className={cn('h-1.5 w-1.5 rounded-full mt-0.5', dotColor)} />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-gray-100">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-full', STATUS_COLORS[key])} />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
