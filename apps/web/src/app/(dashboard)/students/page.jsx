'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, MoreHorizontal, X, Mail, User, BookOpen, Calendar, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { useStudents, studentKeys } from '@/hooks/useStudents';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
/* ─── Invite Modal ─── */
function InviteModal({ onClose }) {
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const handleSend = async () => {
        if (!email.trim()) {
            return;
        }
        setSending(true);
        try {
            await api.post('/students/invite', { email: email.trim() });
            setSent(true);
            setTimeout(onClose, 1500);
        }
        catch {
            setSending(false);
        }
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-popover rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Invite Student</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5"/>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {sent ? (<div className="text-center py-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Mail className="h-6 w-6 text-green-600"/>
              </div>
              <p className="font-medium text-foreground">Invitation sent!</p>
              <p className="text-sm text-muted-foreground mt-1">{email}</p>
            </div>) : (<>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
                <input type="email" placeholder="student@school.edu" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} className="w-full px-3 py-2.5 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent" autoFocus/>
              </div>
              <p className="text-xs text-muted-foreground">The student will receive an email with instructions to join your institution.</p>
            </>)}
        </div>
        {!sent && (<div className="flex justify-end gap-3 px-6 py-4 bg-muted/50 border-t border-border">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSend} loading={sending} disabled={!email.trim()}>
              Send Invitation
            </Button>
          </div>)}
      </div>
    </div>);
}
/* ─── Profile Drawer ─── */
function ProfileDrawer({ student, onClose }) {
    const initials = `${student.firstName?.[0] ?? ''}${student.lastName?.[0] ?? ''}`.toUpperCase();
    return (<div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      {/* Drawer */}
      <div className="w-full max-w-sm bg-popover shadow-2xl overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Student Profile</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5"/>
          </button>
        </div>
        <div className="px-6 py-6 space-y-6">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
              {initials || <User className="h-7 w-7"/>}
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{student.firstName} {student.lastName}</p>
              <p className="text-sm text-muted-foreground">{student.email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
            { label: 'Grade', value: student.grade ?? 'N/A', icon: GraduationCapIcon },
            { label: 'GPA', value: student.gpa ?? 'N/A', icon: BookOpen },
            { label: 'Courses', value: student.enrolledCourses ?? student._count?.enrollments ?? 0, icon: BookOpen },
            { label: 'Status', value: student.status === 'active' ? 'Active' : 'Inactive', icon: User },
        ].map(item => (<div key={item.label} className="bg-muted rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className="font-semibold text-foreground text-sm">{String(item.value)}</p>
              </div>))}
          </div>

          {/* Join date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4"/>
            <span>Joined {new Date(student.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          {/* Student ID */}
          {student.studentId && (<div className="bg-primary/10 rounded-xl p-3">
              <p className="text-xs text-primary font-medium mb-0.5">Student ID</p>
              <p className="text-sm font-mono text-primary">{student.studentId}</p>
            </div>)}
        </div>
      </div>
    </div>);
}
/* tiny inline icon component to avoid importing twice */
function GraduationCapIcon({ className }) {
    return (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422A12.083 12.083 0 0121 12c0 3.866-4.037 7-9 7S3 15.866 3 12a12.083 12.083 0 012.84-1.422L12 14z"/>
    </svg>);
}
/* ─── Action Menu ─── */
function ActionMenu({ student, onViewProfile, onClose, }) {
    const router = useRouter();
    const qc = useQueryClient();
    const remove = useMutation({
        mutationFn: () => api.delete(`/students/${student.id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: studentKeys.lists() });
            onClose();
        },
    });
    return (<div className="absolute right-10 top-2 z-30 bg-popover border border-border rounded-xl shadow-xl py-1 w-44 animate-in fade-in slide-in-from-top-1">
      <button onClick={() => { onViewProfile(); onClose(); }} className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-accent flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground"/> View Profile
      </button>
      <button onClick={() => { router.push(`/students/${student.id}/report-card`); onClose(); }} className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-accent flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground"/> Report Card
      </button>
      <button onClick={() => { router.push(`/messages?studentId=${student.id}`); onClose(); }} className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-accent flex items-center gap-2">
        <Mail className="h-4 w-4 text-muted-foreground"/> Send Message
      </button>
      <div className="my-1 border-t border-border"/>
      <button onClick={() => { if (confirm('Remove this student?')) {
        remove.mutate();
    } }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
        <X className="h-4 w-4"/> Remove
      </button>
    </div>);
}
/* ─── Page ─── */
export default function StudentsPage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [showInvite, setShowInvite] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const { data, isLoading } = useStudents({ search, page, limit: 20 });
    const students = data?.data ?? [];
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground mt-1">{data?.total ?? 0} total students</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4"/>} onClick={() => setShowInvite(true)}>
          Invite Student
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
        <input type="text" placeholder="Search by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2.5 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"/>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-3.5 px-4 font-medium text-muted-foreground">Student</th>
                <th className="text-left py-3.5 px-4 font-medium text-muted-foreground">Grade</th>
                <th className="text-left py-3.5 px-4 font-medium text-muted-foreground">Courses</th>
                <th className="text-left py-3.5 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3.5 px-4 font-medium text-muted-foreground">Joined</th>
                <th className="py-3.5 px-4 w-12"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {/* Skeleton rows */}
              {isLoading && Array.from({ length: 5 }).map((_, i) => (<tr key={i}>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0"/>
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-28 bg-muted rounded animate-pulse"/>
                        <div className="h-3 w-36 bg-muted rounded animate-pulse"/>
                      </div>
                    </div>
                  </td>
                  {Array.from({ length: 4 }).map((_, j) => (<td key={j} className="py-4 px-4"><div className="h-4 w-16 bg-muted rounded animate-pulse"/></td>))}
                  <td className="py-4 px-4"><div className="h-6 w-6 bg-muted rounded animate-pulse"/></td>
                </tr>))}

              {/* Data rows */}
              {!isLoading && students.map((student) => {
            const initials = `${student.firstName?.[0] ?? ''}${student.lastName?.[0] ?? ''}`.toUpperCase();
            const isActive = student.status === 'active';
            const coursesCount = student.enrolledCourses ?? student._count?.enrollments ?? 0;
            return (<tr key={student.id} className="hover:bg-muted/30 relative">
                    {/* Student */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                          {initials || <User className="h-4 w-4"/>}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{student.firstName} {student.lastName}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Grade */}
                    <td className="py-3.5 px-4 text-foreground">{student.grade ?? '—'}</td>
                    {/* Courses */}
                    <td className="py-3.5 px-4 text-foreground">{coursesCount}</td>
                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {/* Join date */}
                    <td className="py-3.5 px-4 text-muted-foreground text-xs">
                      {new Date(student.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    {/* Actions */}
                    <td className="py-3.5 px-4 relative">
                      <button onClick={() => setOpenMenuId(openMenuId === student.id ? null : student.id)} className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <MoreHorizontal className="h-4 w-4"/>
                      </button>
                      {openMenuId === student.id && (<ActionMenu student={student} onViewProfile={() => setSelectedStudent(student)} onClose={() => setOpenMenuId(null)}/>)}
                    </td>
                  </tr>);
        })}

              {/* Empty state */}
              {!isLoading && students.length === 0 && (<tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Search className="h-5 w-5 text-muted-foreground"/>
                      </div>
                      <p className="text-foreground font-medium">No students found</p>
                      {search
                ? <p className="text-sm text-muted-foreground">Try adjusting your search terms</p>
                : (<div className="flex flex-col items-center gap-3 mt-1">
                            <p className="text-sm text-muted-foreground max-w-xs">Invite your first student to get started</p>
                            <Button leftIcon={<Plus className="h-4 w-4"/>} onClick={() => setShowInvite(true)}>
                              Invite Student
                            </Button>
                          </div>)}
                    </div>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(data?.totalPages ?? 0) > 1 && (<div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Page {page} of {data?.totalPages} &bull; {data?.total} students
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page === data?.totalPages}>
                Next
              </Button>
            </div>
          </div>)}
      </div>

      {/* Click-outside to close menu */}
      {openMenuId && (<div className="fixed inset-0 z-20" onClick={() => setOpenMenuId(null)}/>)}

      {/* Invite Modal */}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)}/>}

      {/* Profile Drawer */}
      {selectedStudent && (<ProfileDrawer student={selectedStudent} onClose={() => setSelectedStudent(null)}/>)}
    </div>);
}
