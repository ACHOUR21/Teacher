'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Users, BookOpen, ClipboardList, BarChart2, MessageSquare, Bell, ArrowLeft, GraduationCap, TrendingUp, Clock, CheckCircle, AlertCircle, Send, ChevronRight, ShieldAlert, Award, TrendingUp as Progress, } from 'lucide-react';
import { useState } from 'react';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ParentsPage() {
    const [selectedChild, setSelectedChild] = useState(null);
    const { data, isLoading } = useQuery({
        queryKey: ['parents-my-children'],
        queryFn: () => api.get('/parents/my-children').then(r => r.data.data),
    });
    const children = data ?? [];
    if (isLoading) {
        return (<div className="space-y-6">
        <PageHeader />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse"/>))}
        </div>
      </div>);
    }
    if (selectedChild) {
        return (<ChildDetailView child={selectedChild} onBack={() => setSelectedChild(null)}/>);
    }
    return (<div className="space-y-6">
      <PageHeader />

      {children.length === 0 ? (<NoChildrenState />) : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {children.map(child => (<ChildCard key={child.id} child={child} onClick={() => setSelectedChild(child)}/>))}
        </div>)}
    </div>);
}
function PageHeader() {
    return (<div>
      <h1 className="text-2xl font-bold text-gray-900">Parent Portal</h1>
      <p className="text-sm text-gray-500 mt-1">Monitor your children's academic progress</p>
    </div>);
}
// ─── Child Card ───────────────────────────────────────────────────────────────
function ChildCard({ child, onClick }) {
    const initials = `${child.firstName?.[0] ?? ''}${child.lastName?.[0] ?? ''}`;
    const lastActive = child.lastActive
        ? format(new Date(child.lastActive), 'MMM d, yyyy')
        : 'Never';
    return (<button onClick={onClick} className="w-full text-left bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {child.firstName} {child.lastName}
            </p>
            {child.grade && (<p className="text-xs text-gray-500">{child.grade}</p>)}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 transition-colors"/>
      </div>

      {child.school && (<p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
          <GraduationCap className="h-3.5 w-3.5"/> {child.school}
        </p>)}

      <div className="grid grid-cols-2 gap-3">
        <StatPill label="GPA" value={child.gpa !== null && child.gpa !== undefined ? child.gpa.toFixed(2) : '—'} color="blue"/>
        <StatPill label="Courses" value={String(child.coursesEnrolled ?? 0)} color="purple"/>
      </div>

      <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5"/> Last active {lastActive}
      </p>
    </button>);
}
function StatPill({ label, value, color }) {
    const colorMap = {
        blue: 'bg-blue-50 text-blue-700',
        purple: 'bg-purple-50 text-purple-700',
        green: 'bg-green-50 text-green-700',
        orange: 'bg-orange-50 text-orange-700',
    };
    return (<div className={cn('rounded-lg px-3 py-2', colorMap[color])}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>);
}
// ─── No Children State ────────────────────────────────────────────────────────
function NoChildrenState() {
    return (<div className="text-center py-24">
      <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
        <Users className="h-8 w-8 text-blue-400"/>
      </div>
      <p className="text-gray-700 font-medium text-lg">No children linked to your account yet</p>
      <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
        Contact your school admin to link your children to your parent account.
      </p>
    </div>);
}
function ChildDetailView({ child, onBack }) {
    const [activeTab, setActiveTab] = useState('courses');
    const studentId = child.studentId ?? child.id;
    const { data: statsData } = useQuery({
        queryKey: ['child-stats', studentId],
        queryFn: () => api.get(`/students/${studentId}/stats`).then(r => r.data.data).catch(() => null),
    });
    const stats = statsData ?? {
        gpa: child.gpa ?? null,
        coursesEnrolled: child.coursesEnrolled ?? null,
        assignmentsPending: null,
        attendancePercent: null,
    };
    const TABS = [
        { key: 'courses', label: 'Active Courses', icon: <BookOpen className="h-4 w-4"/> },
        { key: 'assignments', label: 'Assignments', icon: <ClipboardList className="h-4 w-4"/> },
        { key: 'grades', label: 'Grades', icon: <BarChart2 className="h-4 w-4"/> },
        { key: 'messages', label: 'Messages', icon: <MessageSquare className="h-4 w-4"/> },
        { key: 'notifications', label: 'Alerts', icon: <Bell className="h-4 w-4"/> },
    ];
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600"/>
        </button>
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
            {child.firstName?.[0]}{child.lastName?.[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {child.firstName} {child.lastName}
            </h1>
            {child.grade && (<p className="text-sm text-gray-500">{child.grade}{child.school ? ` — ${child.school}` : ''}</p>)}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="GPA" value={stats.gpa !== null && stats.gpa !== undefined ? stats.gpa.toFixed(2) : '—'} icon={<TrendingUp className="h-5 w-5"/>} color="blue"/>
        <StatCard label="Courses Enrolled" value={stats.coursesEnrolled !== null && stats.coursesEnrolled !== undefined ? String(stats.coursesEnrolled) : '—'} icon={<BookOpen className="h-5 w-5"/>} color="purple"/>
        <StatCard label="Assignments Pending" value={stats.assignmentsPending !== null && stats.assignmentsPending !== undefined ? String(stats.assignmentsPending) : '—'} icon={<ClipboardList className="h-5 w-5"/>} color="orange"/>
        <StatCard label="Attendance" value={stats.attendancePercent !== null && stats.attendancePercent !== undefined ? `${stats.attendancePercent}%` : '—'} icon={<CheckCircle className="h-5 w-5"/>} color="green"/>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {TABS.map(tab => (<button key={tab.key} onClick={() => setActiveTab(tab.key)} className={cn('flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors', activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')}>
              {tab.icon} {tab.label}
            </button>))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'courses' && <CoursesTab studentId={studentId}/>}
        {activeTab === 'assignments' && <AssignmentsTab studentId={studentId}/>}
        {activeTab === 'grades' && <GradesTab studentId={studentId}/>}
        {activeTab === 'messages' && <MessagesTab childName={`${child.firstName} ${child.lastName}`}/>}
        {activeTab === 'notifications' && <NotificationsTab />}
      </div>
    </div>);
}
function StatCard({ label, value, icon, color, }) {
    const colorMap = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', val: 'text-blue-900' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', val: 'text-purple-900' },
        green: { bg: 'bg-green-50', text: 'text-green-600', val: 'text-green-900' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-600', val: 'text-orange-900' },
    };
    const c = colorMap[color];
    return (<div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={cn('inline-flex p-2 rounded-lg mb-3', c.bg)}>
        <span className={c.text}>{icon}</span>
      </div>
      <p className={cn('text-2xl font-bold', c.val)}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>);
}
// ─── Courses Tab ──────────────────────────────────────────────────────────────
function CoursesTab({ studentId }) {
    const { data, isLoading } = useQuery({
        queryKey: ['child-courses', studentId],
        queryFn: () => api.get(`/students/${studentId}/courses`).then(r => r.data.data),
    });
    const courses = data ?? [];
    if (isLoading) {
        return <LoadingSkeleton rows={4}/>;
    }
    if (courses.length === 0) {
        return (<EmptyTabState icon={<BookOpen className="h-8 w-8 text-gray-300"/>} message="No active courses"/>);
    }
    return (<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {courses.map(course => (<div key={course.id} className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-5 w-5 text-white"/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{course.title}</p>
              {course.instructor && (<p className="text-xs text-gray-500">{course.instructor}</p>)}
            </div>
            <span className="text-sm font-semibold text-blue-600">{course.progress ?? 0}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${course.progress ?? 0}%` }}/>
          </div>
        </div>))}
    </div>);
}
// ─── Assignments Tab ──────────────────────────────────────────────────────────
function AssignmentsTab({ studentId }) {
    const { data, isLoading } = useQuery({
        queryKey: ['child-assignments', studentId],
        queryFn: () => api.get('/assignments/my', { params: { studentId } }).then(r => r.data.data),
    });
    const assignments = data ?? [];
    if (isLoading) {
        return <LoadingSkeleton rows={5}/>;
    }
    if (assignments.length === 0) {
        return (<EmptyTabState icon={<ClipboardList className="h-8 w-8 text-gray-300"/>} message="No assignments found"/>);
    }
    return (<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Assignment', 'Course', 'Due Date', 'Grade', 'Status'].map(h => (<th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                {h}
              </th>))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {assignments.map(a => {
            const dueDate = a.dueDate ? format(new Date(a.dueDate), 'MMM d, yyyy') : '—';
            const isPast = a.dueDate ? new Date(a.dueDate) < new Date() : false;
            return (<tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{a.title}</td>
                <td className="px-4 py-3 text-gray-500">{a.course?.title ?? '—'}</td>
                <td className={cn('px-4 py-3 text-xs', isPast && !a.grade ? 'text-red-500 font-medium' : 'text-gray-500')}>
                  {dueDate}
                  {isPast && !a.grade && (<AlertCircle className="inline h-3.5 w-3.5 ml-1"/>)}
                </td>
                <td className="px-4 py-3">
                  {a.grade !== null && a.grade !== undefined ? (<span className={cn('font-semibold', a.grade >= 90 ? 'text-green-600' : a.grade >= 70 ? 'text-yellow-600' : 'text-red-600')}>
                      {a.grade}%
                    </span>) : '—'}
                </td>
                <td className="px-4 py-3">
                  <AssignmentStatusBadge status={a.status}/>
                </td>
              </tr>);
        })}
        </tbody>
      </table>
    </div>);
}
function AssignmentStatusBadge({ status }) {
    const map = {
        submitted: 'bg-blue-100 text-blue-700',
        graded: 'bg-green-100 text-green-700',
        pending: 'bg-yellow-100 text-yellow-700',
        late: 'bg-red-100 text-red-700',
        missing: 'bg-red-100 text-red-700',
    };
    const s = (status ?? 'pending').toLowerCase();
    return (<span className={cn('inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize', map[s] ?? 'bg-gray-100 text-gray-600')}>
      {s}
    </span>);
}
// ─── Grades Tab ───────────────────────────────────────────────────────────────
function GradesTab({ studentId }) {
    const { data, isLoading } = useQuery({
        queryKey: ['child-grades', studentId],
        queryFn: () => api.get(`/students/${studentId}/courses`).then(r => r.data.data),
    });
    const rows = (data ?? [])
        .filter((c) => c.progress >= 100)
        .map((c) => ({
        courseTitle: c.title,
        grade: 'Completed',
        completedAt: undefined,
    }));
    if (isLoading) {
        return <LoadingSkeleton rows={4}/>;
    }
    if (rows.length === 0) {
        return (<EmptyTabState icon={<BarChart2 className="h-8 w-8 text-gray-300"/>} message="No completed courses yet"/>);
    }
    return (<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Course', 'Grade', 'Completed'].map(h => (<th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                {h}
              </th>))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row, i) => (<tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{row.courseTitle}</td>
              <td className="px-4 py-3">
                <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                  {row.grade}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">
                {row.completedAt ? format(new Date(row.completedAt), 'MMM d, yyyy') : '—'}
              </td>
            </tr>))}
        </tbody>
      </table>
    </div>);
}
// ─── Messages Tab ─────────────────────────────────────────────────────────────
function MessagesTab({ childName }) {
    const [recipientId, setRecipientId] = useState('');
    const [message, setMessage] = useState('');
    const [sent, setSent] = useState(false);
    const mutation = useMutation({
        mutationFn: () => api.post('/messages', { recipientId, content: message, subject: `Message about ${childName}` }).then(r => r.data),
        onSuccess: () => {
            setSent(true);
            setMessage('');
            setRecipientId('');
        },
    });
    if (sent) {
        return (<div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="h-14 w-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-7 w-7 text-green-500"/>
        </div>
        <p className="font-semibold text-gray-900">Message sent!</p>
        <p className="text-sm text-gray-500 mt-1 mb-4">Your message has been delivered to the teacher.</p>
        <button onClick={() => setSent(false)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Send another message
        </button>
      </div>);
    }
    return (<div className="bg-white rounded-xl border border-gray-200 p-6 max-w-xl">
      <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-blue-500"/> Message a Teacher
      </h3>
      <p className="text-sm text-gray-500 mb-5">Send a message to {childName}'s teacher</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Teacher ID / Recipient</label>
          <input value={recipientId} onChange={e => setRecipientId(e.target.value)} placeholder="Enter teacher user ID..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} placeholder={`Write your message about ${childName}...`} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
        </div>

        {mutation.isError && (<p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            Failed to send message. Please try again.
          </p>)}

        <button onClick={() => mutation.mutate()} disabled={!recipientId.trim() || !message.trim() || mutation.isPending} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <Send className="h-4 w-4"/>
          {mutation.isPending ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </div>);
}
// ─── Notifications Tab ────────────────────────────────────────────────────────
const NOTIF_ICONS = {
    GRADE: <Award className="h-4 w-4 text-purple-500"/>,
    ABSENCE: <ShieldAlert className="h-4 w-4 text-red-500"/>,
    PROGRESS: <Progress className="h-4 w-4 text-blue-500"/>,
    DUE_REMINDER: <Clock className="h-4 w-4 text-amber-500"/>,
};
function NotificationsTab() {
    const { data, isLoading } = useQuery({
        queryKey: ['parent-notifications'],
        queryFn: () => api.get('/notifications?limit=40').then(r => r.data.data),
    });
    const notifications = (data?.data ?? data ?? []);
    const markRead = useMutation({
        mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    });
    if (isLoading) {
        return <LoadingSkeleton rows={5}/>;
    }
    if (!notifications.length) {
        return (<EmptyTabState icon={<Bell className="h-8 w-8 text-gray-300"/>} message="No notifications yet. You'll be notified about grades, absences, and progress milestones."/>);
    }
    return (<div className="space-y-2">
      {notifications.map(n => {
            const type = n.data?.type ?? 'IN_APP';
            const icon = NOTIF_ICONS[type] ?? <Bell className="h-4 w-4 text-gray-400"/>;
            return (<div key={n.id} onClick={() => !n.isRead && markRead.mutate(n.id)} className={cn('flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer', n.isRead
                    ? 'bg-white border-gray-100 text-gray-500'
                    : 'bg-blue-50 border-blue-200')}>
            <div className="mt-0.5 flex-shrink-0">{icon}</div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium', n.isRead ? 'text-gray-700' : 'text-gray-900')}>
                {n.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
              <p className="text-xs text-gray-400 mt-1">
                {format(new Date(n.createdAt), 'MMM d, yyyy · h:mm a')}
              </p>
            </div>
            {!n.isRead && (<div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"/>)}
          </div>);
        })}
    </div>);
}
// ─── Shared Helpers ───────────────────────────────────────────────────────────
function LoadingSkeleton({ rows }) {
    return (<div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (<div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse"/>))}
    </div>);
}
function EmptyTabState({ icon, message }) {
    return (<div className="text-center py-16">
      <div className="flex justify-center mb-3">{icon}</div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>);
}
