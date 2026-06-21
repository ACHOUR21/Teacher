'use client';
import { GraduationCap, BookOpen, TrendingUp, Flame, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
export function ChildCard({ child, isSelected, onClick }) {
    const initials = `${child.firstName?.[0] ?? ''}${child.lastName?.[0] ?? ''}`.toUpperCase();
    return (<button onClick={onClick} className={cn('w-full text-left rounded-2xl border p-5 transition-all group', isSelected
            ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
            : 'border-gray-200 bg-white hover:shadow-md hover:border-gray-300')}>
      {/* Avatar + name */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {child.avatarUrl ? (<img src={child.avatarUrl} alt={`${child.firstName} ${child.lastName}`} className="h-12 w-12 rounded-full object-cover flex-shrink-0"/>) : (<div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
              {initials}
            </div>)}
          <div>
            <p className="font-semibold text-gray-900">
              {child.firstName} {child.lastName}
            </p>
            {child.grade && (<p className="text-xs text-gray-500">Grade {child.grade}</p>)}
          </div>
        </div>
        <ChevronRight className={cn('h-5 w-5 transition-colors flex-shrink-0', isSelected ? 'text-blue-500' : 'text-gray-300 group-hover:text-gray-500')}/>
      </div>

      {/* School */}
      {child.school && (<p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5 truncate">
          <GraduationCap className="h-3.5 w-3.5 flex-shrink-0"/>
          {child.school}
        </p>)}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatMini icon={<BookOpen className="h-3.5 w-3.5"/>} label="Courses" value={String(child.activeCourses)} color="blue"/>
        <StatMini icon={<TrendingUp className="h-3.5 w-3.5"/>} label="Avg Progress" value={`${child.completionRate}%`} color="purple"/>
        <StatMini icon={<Flame className="h-3.5 w-3.5"/>} label="Streak" value={child.currentStreak > 0 ? `${child.currentStreak}d` : '—'} color="orange"/>
      </div>
    </button>);
}
function StatMini({ icon, label, value, color, }) {
    const colorMap = {
        blue: 'bg-blue-50 text-blue-700',
        purple: 'bg-purple-50 text-purple-700',
        orange: 'bg-orange-50 text-orange-700',
        green: 'bg-green-50 text-green-700',
    };
    return (<div className={cn('rounded-lg px-2.5 py-2 text-center', colorMap[color])}>
      <div className="flex justify-center mb-0.5">{icon}</div>
      <p className="text-sm font-bold leading-tight">{value}</p>
      <p className="text-xs opacity-70 leading-tight">{label}</p>
    </div>);
}
