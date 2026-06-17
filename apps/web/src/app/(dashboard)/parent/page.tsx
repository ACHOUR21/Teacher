'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  BookOpen,
  TrendingUp,
  CalendarCheck,
  Flame,
  MessageSquare,
  Clock,
  ClipboardList,
  Bell,
  ChevronRight,
  Plus,
  X,
} from 'lucide-react';
import { useState } from 'react';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

import { ChildCard, type ChildSummary } from './components/ChildCard';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChildOverview {
  child: ChildSummary;
  courses: { courseId: string; title: string; progress: number; lastAccessedAt: string | null }[];
  recentGrades: { assignmentTitle: string; score: number; maxScore: number; gradedAt: string }[];
  weeklyStudyMinutes: number;
  attendanceRate: number;
  aiUsageSessions: number;
}

interface UpcomingEvent {
  type: 'LIVE_SESSION' | 'ASSIGNMENT_DUE';
  title: string;
  scheduledAt: string;
  courseTitle?: string;
}

interface Activity {
  label: string;
  description: string;
  time: string;
  color: string;
  icon: React.ReactNode;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ParentDashboardPage() {
  const [selectedChildUserId, setSelectedChildUserId] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const { data: childrenData, isLoading: loadingChildren, refetch: refetchChildren } = useQuery({
    queryKey: ['parent-portal-children'],
    queryFn: () => api.get('/parents/children').then(r => r.data),
  });

  const children: ChildSummary[] = Array.isArray(childrenData) ? childrenData : [];
  const selectedChild = children.find(c => c.userId === selectedChildUserId) ?? children[0] ?? null;

  const { data: overviewData, isLoading: loadingOverview } = useQuery({
    queryKey: ['parent-portal-overview', selectedChild?.userId],
    queryFn: () =>
      api.get(`/parents/children/${selectedChild!.userId}/overview`).then(r => r.data),
    enabled: !!selectedChild,
  });

  const { data: eventsData } = useQuery({
    queryKey: ['parent-portal-events', selectedChild?.userId],
    queryFn: () =>
      api.get(`/parents/children/${selectedChild!.userId}/events`).then(r => r.data),
    enabled: !!selectedChild,
  });

  const overview: ChildOverview | null = overviewData ?? null;
  const events: UpcomingEvent[] = Array.isArray(eventsData) ? eventsData : [];

  if (loadingChildren) {
    return (
      <div className="space-y-6">
        <PageHeader onLinkChild={() => setShowLinkModal(true)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader onLinkChild={() => setShowLinkModal(true)} />
        <EmptyState onLinkChild={() => setShowLinkModal(true)} />
        {showLinkModal && (
          <LinkChildModal
            onClose={() => setShowLinkModal(false)}
            onLinked={() => { setShowLinkModal(false); void refetchChildren(); }}
          />
        )}
      </div>
    );
  }

  // Build activity feed from overview data
  const activities: Activity[] = [];
  if (overview) {
    for (const grade of (overview.recentGrades ?? []).slice(0, 3)) {
      const pct = Math.round((grade.score / grade.maxScore) * 100);
      activities.push({
        label: 'Assignment graded',
        description: `${grade.assignmentTitle} — ${grade.score}/${grade.maxScore} (${pct}%)`,
        time: new Date(grade.gradedAt).toLocaleDateString(),
        color: 'bg-purple-100 text-purple-600',
        icon: <ClipboardList className="h-4 w-4" />,
      });
    }
    for (const course of (overview.courses ?? []).slice(0, 2)) {
      activities.push({
        label: 'Course progress',
        description: `${course.title} — ${course.progress}% complete`,
        time: course.lastAccessedAt ? new Date(course.lastAccessedAt).toLocaleDateString() : '',
        color: 'bg-blue-100 text-blue-600',
        icon: <BookOpen className="h-4 w-4" />,
      });
    }
    activities.sort((a, b) => (b.time > a.time ? 1 : -1));
  }

  return (
    <div className="space-y-6">
      <PageHeader onLinkChild={() => setShowLinkModal(true)} />

      {/* Child selector */}
      {children.length > 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {children.map(child => (
            <ChildCard
              key={child.userId}
              child={child}
              isSelected={child.userId === (selectedChild?.userId ?? null)}
              onClick={() => setSelectedChildUserId(child.userId)}
            />
          ))}
        </div>
      )}

      {children.length === 1 && selectedChild && (
        <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-5">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {selectedChild.firstName[0]}{selectedChild.lastName[0]}
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{selectedChild.firstName} {selectedChild.lastName}</p>
            {selectedChild.grade && <p className="text-sm text-gray-500">Grade {selectedChild.grade}{selectedChild.school ? ` · ${selectedChild.school}` : ''}</p>}
          </div>
        </div>
      )}

      {/* Stat cards */}
      {selectedChild && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active Courses"
            value={loadingOverview ? '…' : String(overview?.child?.activeCourses ?? selectedChild.activeCourses)}
            icon={<BookOpen className="h-5 w-5" />}
            color="blue"
          />
          <StatCard
            label="Avg Progress"
            value={loadingOverview ? '…' : `${overview?.child?.completionRate ?? selectedChild.completionRate}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            color="purple"
          />
          <StatCard
            label="Attendance Rate"
            value={loadingOverview ? '…' : overview ? `${overview.attendanceRate}%` : '—'}
            icon={<CalendarCheck className="h-5 w-5" />}
            color="green"
          />
          <StatCard
            label="Study Streak"
            value={loadingOverview ? '…' : selectedChild.currentStreak > 0 ? `${selectedChild.currentStreak}d` : '—'}
            icon={<Flame className="h-5 w-5" />}
            color="orange"
          />
        </div>
      )}

      {/* Main content: Activity feed + Upcoming sidebar */}
      {selectedChild && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent activity */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-500" /> Recent Activity
            </h2>
            {loadingOverview ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No recent activity found.</p>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 5).map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className={cn('p-2 rounded-lg flex-shrink-0', a.color)}>{a.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{a.label}</p>
                      <p className="text-xs text-gray-500 truncate">{a.description}</p>
                    </div>
                    {a.time && (
                      <span className="text-xs text-gray-400 flex-shrink-0">{a.time}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming events sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-500" /> Upcoming
              </h2>
              {events.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No upcoming events.</p>
              ) : (
                <div className="space-y-3">
                  {events.slice(0, 3).map((ev, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={cn(
                        'p-1.5 rounded-lg flex-shrink-0',
                        ev.type === 'LIVE_SESSION' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600',
                      )}>
                        {ev.type === 'LIVE_SESSION'
                          ? <BookOpen className="h-3.5 w-3.5" />
                          : <ClipboardList className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{ev.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(ev.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick action */}
            <QuickMessageButton childName={`${selectedChild.firstName} ${selectedChild.lastName}`} />
          </div>
        </div>
      )}

      {/* Link child modal */}
      {showLinkModal && (
        <LinkChildModal
          onClose={() => setShowLinkModal(false)}
          onLinked={() => { setShowLinkModal(false); void refetchChildren(); }}
        />
      )}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function PageHeader({ onLinkChild }: { onLinkChild: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Parent Portal</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor your children's academic progress</p>
      </div>
      <button
        onClick={onLinkChild}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
      >
        <Plus className="h-4 w-4" /> Link Child
      </button>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'green' | 'orange';
}) {
  const colorMap = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   val: 'text-blue-900' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', val: 'text-purple-900' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  val: 'text-green-900' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', val: 'text-orange-900' },
  };
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={cn('inline-flex p-2 rounded-lg mb-3', c.bg)}>
        <span className={c.icon}>{icon}</span>
      </div>
      <p className={cn('text-2xl font-bold', c.val)}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

// ─── Quick message button ─────────────────────────────────────────────────────

function QuickMessageButton({ childName }: { childName: string }) {
  const [open, setOpen] = useState(false);
  const [teacherId, setTeacherId] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/parents/teachers/${teacherId}/message`, {
        subject: `Message regarding ${childName}`,
        message,
      }),
    onSuccess: () => { setSent(true); setTeacherId(''); setMessage(''); },
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <MessageSquare className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">Message Teacher</p>
            <p className="text-xs text-gray-500">Send a direct message</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
      </button>
    );
  }

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
        <p className="text-green-700 font-medium text-sm">Message sent!</p>
        <button onClick={() => { setSent(false); setOpen(false); }} className="text-xs text-green-600 underline mt-2">Done</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
      <p className="text-sm font-semibold text-gray-900">Message a Teacher</p>
      <input
        value={teacherId}
        onChange={e => setTeacherId(e.target.value)}
        placeholder="Teacher User ID"
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        rows={3}
        placeholder={`Message about ${childName}...`}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={() => mutation.mutate()}
          disabled={!teacherId.trim() || !message.trim() || mutation.isPending}
          className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending ? 'Sending…' : 'Send'}
        </button>
        <button onClick={() => setOpen(false)} className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onLinkChild }: { onLinkChild: () => void }) {
  return (
    <div className="text-center py-20">
      <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
        <BookOpen className="h-8 w-8 text-blue-400" />
      </div>
      <p className="text-gray-700 font-semibold text-lg">No children linked yet</p>
      <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto mb-6">
        Link your child's student account to monitor their academic progress.
      </p>
      <button
        onClick={onLinkChild}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
      >
        <Plus className="h-4 w-4" /> Link a Child
      </button>
    </div>
  );
}

// ─── Link child modal ─────────────────────────────────────────────────────────

function LinkChildModal({ onClose, onLinked }: { onClose: () => void; onLinked: () => void }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.post('/parents/link-child', { childEmail: email }),
    onSuccess: onLinked,
    onError: (err: any) => {
      setError(err?.message ?? 'Failed to link child. Please check the email and try again.');
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Link a Child</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Enter your child's student email address. They must already have a student account in the same organization.
        </p>
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError(''); }}
          placeholder="student@school.edu"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
        />
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={() => mutation.mutate()}
            disabled={!email.trim() || mutation.isPending}
            className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? 'Linking…' : 'Link Child'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
