'use client';

import { useQuery } from '@tanstack/react-query';
import { Search, Star, BookOpen, Users, Plus, X, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

/* ─── Types ─── */
interface Teacher {
  id: string;
  user: { firstName: string; lastName: string; email: string; avatarUrl?: string };
  subjects: string[];
  bio?: string;
  rating?: number;
  yearsExperience?: number;
  isVerified?: boolean;
  status?: string;
  _count: { courses: number };
  createdAt: string;
}

interface PaginatedTeachers {
  data: Teacher[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ─── Invite Modal ─── */
function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('TEACHER');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {return;}
    setSending(true);
    try {
      await api.post('/teachers/invite', { email: email.trim(), role });
      setSent(true);
      setTimeout(onClose, 1500);
    } catch {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Invite Teacher</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {sent ? (
            <div className="text-center py-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-medium text-gray-900">Invitation sent!</p>
              <p className="text-sm text-gray-500 mt-1">{email}</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  placeholder="teacher@school.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="TEACHER">Teacher</option>
                  <option value="HEAD_TEACHER">Head Teacher</option>
                  <option value="DEPARTMENT_HEAD">Department Head</option>
                </select>
              </div>
              <p className="text-xs text-gray-500">The teacher will receive an email with instructions to join your institution.</p>
            </>
          )}
        </div>
        {!sent && (
          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSend} loading={sending} disabled={!email.trim()}>
              Send Invitation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Teacher Details Modal ─── */
function TeacherDetailsModal({ teacher, onClose }: { teacher: Teacher; onClose: () => void }) {
  const initials = `${teacher.user.firstName?.[0] ?? ''}${teacher.user.lastName?.[0] ?? ''}`.toUpperCase();
  const isActive = !teacher.status || teacher.status === 'active' || teacher.status === 'ACTIVE';

  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ['teacher-courses', teacher.id],
    queryFn: () => api.get(`/teachers/${teacher.id}/courses`).then(r => r.data.data ?? []),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Teacher Profile</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-gray-900 truncate">{teacher.user.firstName} {teacher.user.lastName}</p>
              <p className="text-sm text-gray-500 truncate">{teacher.user.email}</p>
              <span className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1',
                isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              )}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Courses</p>
              <p className="text-lg font-bold text-gray-900">{teacher._count.courses}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Rating</p>
              <p className="text-lg font-bold text-gray-900 flex items-center justify-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {teacher.rating?.toFixed(1) ?? '—'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Experience</p>
              <p className="text-lg font-bold text-gray-900">{teacher.yearsExperience ?? '—'}<span className="text-xs font-normal text-gray-500">y</span></p>
            </div>
          </div>

          {/* Subjects */}
          {teacher.subjects?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Subjects</p>
              <div className="flex flex-wrap gap-1.5">
                {teacher.subjects.map(s => (
                  <span key={s} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {teacher.bio && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1.5">Bio</p>
              <p className="text-sm text-gray-600 leading-relaxed">{teacher.bio}</p>
            </div>
          )}

          {/* Courses list */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Courses</p>
            {loadingCourses ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (courses as any[])?.length > 0 ? (
              <div className="space-y-2">
                {(courses as any[]).map((course: any) => (
                  <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <BookOpen className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{course.title}</span>
                    </div>
                    {course.enrolledCount !== undefined && (
                      <span className="text-xs text-gray-500 shrink-0 ml-2 flex items-center gap-1">
                        <Users className="h-3 w-3" />{course.enrolledCount}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No courses assigned yet.</p>
            )}
          </div>

          {/* Join date */}
          <p className="text-xs text-gray-400">
            Member since {new Date(teacher.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Teacher Card ─── */
function TeacherCard({ teacher, onClick }: { teacher: Teacher; onClick: () => void }) {
  const initials = `${teacher.user.firstName?.[0] ?? ''}${teacher.user.lastName?.[0] ?? ''}`.toUpperCase();
  const isActive = !teacher.status || teacher.status === 'active' || teacher.status === 'ACTIVE';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{teacher.user.firstName} {teacher.user.lastName}</p>
          <p className="text-xs text-gray-500 truncate">{teacher.user.email}</p>
        </div>
        <span className={cn(
          'shrink-0 px-2 py-0.5 rounded-full text-xs font-medium',
          isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        )}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Subjects */}
      <div className="flex flex-wrap gap-1 mb-4 min-h-[22px]">
        {(teacher.subjects ?? []).slice(0, 3).map((s: string) => (
          <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">{s}</span>
        ))}
        {(teacher.subjects ?? []).length > 3 && (
          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">+{teacher.subjects.length - 3}</span>
        )}
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" />{teacher._count?.courses ?? 0} courses
        </span>
        <span className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />{teacher.rating?.toFixed(1) ?? '—'}
        </span>
        {teacher.yearsExperience !== undefined && (
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />{teacher.yearsExperience}y exp
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function TeachersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showInvite, setShowInvite] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  const { data, isLoading } = useQuery<PaginatedTeachers>({
    queryKey: ['teachers', search, page],
    queryFn: () => api.get(`/teachers?search=${encodeURIComponent(search)}&page=${page}&limit=20`).then(r => r.data.data),
  });

  const teachers: Teacher[] = data?.data ?? [];

  /* ─── Stats ─── */
  const { data: stats } = useQuery({
    queryKey: ['teachers-stats'],
    queryFn: () => api.get('/teachers/stats').then(r => r.data.data),
  });

  const statItems = [
    { label: 'Total Teachers', value: stats?.total ?? data?.total ?? '—', icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active This Month', value: stats?.activeThisMonth ?? '—', icon: Users, color: 'text-green-600 bg-green-50' },
    { label: 'Total Courses Taught', value: stats?.totalCoursesTaught ?? '—', icon: BookOpen, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.total ?? 0} teachers in your institution</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowInvite(true)}>
          Invite Teacher
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statItems.map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', stat.color.split(' ')[1])}>
              <stat.icon className={cn('h-5 w-5', stat.color.split(' ')[0])} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{String(stat.value)}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email or subject..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : teachers.length === 0 ? (
        <div className="text-center py-16">
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No teachers found</p>
          {search && <p className="text-sm text-gray-400 mt-1">Try adjusting your search terms</p>}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map(teacher => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                onClick={() => setSelectedTeacher(teacher)}
              />
            ))}
          </div>

          {/* Pagination */}
          {(data?.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Page {page} of {data?.totalPages} &bull; {data?.total} teachers
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                >
                  Previous
                </Button>
                <span className="px-3 py-1.5 text-sm text-gray-600 font-medium">
                  {page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === data?.totalPages}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Invite Modal */}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}

      {/* Details Modal */}
      {selectedTeacher && (
        <TeacherDetailsModal
          teacher={selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
        />
      )}
    </div>
  );
}
