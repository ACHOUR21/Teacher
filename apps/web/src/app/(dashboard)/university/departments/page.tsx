'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Users, BookOpen, Plus, X, AlertCircle } from 'lucide-react';
import { useState } from 'react';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Department {
  id: string;
  name: string;
  code: string;
  headFacultyId?: string | null;
  createdAt: string;
  _count: { faculty: number; courses: number };
}

interface FacultyMember {
  id: string;
  title: string;
  specializations: string[];
  user: { id: string; firstName: string; lastName: string; email: string; avatarUrl?: string | null };
  department?: { id: string; name: string; code: string } | null;
}

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function DepartmentsPage() {
  const qc = useQueryClient();
  const [showAddDept, setShowAddDept] = useState(false);
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [activeTab, setActiveTab] = useState<'departments' | 'faculty'>('departments');
  const [filterDeptId, setFilterDeptId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [deptForm, setDeptForm] = useState({ name: '', code: '' });
  const [facultyForm, setFacultyForm] = useState({
    userId: '',
    departmentId: '',
    title: 'Lecturer',
    specializations: '',
  });

  const { data: departments, isLoading: deptsLoading } = useQuery<Department[]>({
    queryKey: ['university-departments'],
    queryFn: () =>
      api.get('/university/departments').then((r) => r.data.data ?? r.data ?? []),
  });

  const { data: faculty, isLoading: facultyLoading } = useQuery<FacultyMember[]>({
    queryKey: ['university-faculty', filterDeptId],
    queryFn: () =>
      api
        .get('/university/faculty', {
          params: filterDeptId ? { departmentId: filterDeptId } : {},
        })
        .then((r) => r.data.data ?? r.data ?? []),
  });

  const createDeptMutation = useMutation({
    mutationFn: (data: { name: string; code: string }) =>
      api.post('/university/departments', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['university-departments'] });
      qc.invalidateQueries({ queryKey: ['university-dashboard-stats'] });
      setShowAddDept(false);
      setDeptForm({ name: '', code: '' });
      setError(null);
    },
    onError: (err: unknown) => {
      const message =
        (err as { message?: string })?.message ?? 'Failed to create department';
      setError(message);
    },
  });

  const createFacultyMutation = useMutation({
    mutationFn: (data: {
      userId: string;
      departmentId?: string;
      title: string;
      specializations: string[];
    }) => api.post('/university/faculty', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['university-faculty'] });
      qc.invalidateQueries({ queryKey: ['university-dashboard-stats'] });
      setShowAddFaculty(false);
      setFacultyForm({ userId: '', departmentId: '', title: 'Lecturer', specializations: '' });
      setError(null);
    },
    onError: (err: unknown) => {
      const message =
        (err as { message?: string })?.message ?? 'Failed to add faculty member';
      setError(message);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-indigo-600" />
            Departments &amp; Faculty
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage university departments and faculty members
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'departments' && (
            <button
              onClick={() => { setShowAddDept(true); setError(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Department
            </button>
          )}
          {activeTab === 'faculty' && (
            <button
              onClick={() => { setShowAddFaculty(true); setError(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Faculty
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['departments', 'faculty'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors',
              activeTab === tab
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {tab === 'departments' ? (
              <Building2 className="h-4 w-4" />
            ) : (
              <Users className="h-4 w-4" />
            )}
            {tab}
          </button>
        ))}
      </div>

      {/* ─── Departments Tab ─── */}
      {activeTab === 'departments' && (
        <>
          {deptsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                  <div className="h-4 w-24 bg-gray-100 rounded mb-3" />
                  <div className="h-3 w-16 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : !departments || departments.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
              <Building2 className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm">No departments created yet</p>
              <button
                onClick={() => { setShowAddDept(true); setError(null); }}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Create First Department
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3.5 px-4 font-medium text-gray-600">Department</th>
                    <th className="text-left py-3.5 px-4 font-medium text-gray-600">Code</th>
                    <th className="text-left py-3.5 px-4 font-medium text-gray-600">Faculty Count</th>
                    <th className="text-left py-3.5 px-4 font-medium text-gray-600">Course Count</th>
                    <th className="text-left py-3.5 px-4 font-medium text-gray-600">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-gray-50">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-4 w-4 text-indigo-600" />
                          </div>
                          <span className="font-medium text-gray-900">{dept.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {dept.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <Users className="h-3.5 w-3.5 text-purple-500" />
                          {dept._count?.faculty ?? 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                          {dept._count?.courses ?? 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 text-xs">
                        {new Date(dept.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ─── Faculty Tab ─── */}
      {activeTab === 'faculty' && (
        <div className="space-y-4">
          {/* Filter by department */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 shrink-0">
              Filter by Department:
            </label>
            <select
              value={filterDeptId}
              onChange={(e) => setFilterDeptId(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">All Departments</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {facultyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse flex items-center gap-4"
                >
                  <div className="h-10 w-10 rounded-full bg-gray-100" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 bg-gray-100 rounded" />
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : !faculty || faculty.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
              <Users className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm">No faculty members yet</p>
              <button
                onClick={() => { setShowAddFaculty(true); setError(null); }}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Faculty Member
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3.5 px-4 font-medium text-gray-600">Faculty Member</th>
                    <th className="text-left py-3.5 px-4 font-medium text-gray-600">Email</th>
                    <th className="text-left py-3.5 px-4 font-medium text-gray-600">Title</th>
                    <th className="text-left py-3.5 px-4 font-medium text-gray-600">Department</th>
                    <th className="text-left py-3.5 px-4 font-medium text-gray-600">Specializations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {faculty.map((member) => {
                    const initials = `${member.user.firstName[0] ?? ''}${member.user.lastName[0] ?? ''}`.toUpperCase();
                    return (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                              {initials}
                            </div>
                            <span className="font-medium text-gray-900">
                              {member.user.firstName} {member.user.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 text-xs">
                          {member.user.email}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1 rounded-full">
                            {member.title}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {member.department?.name ?? '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {member.specializations?.length > 0 ? (
                              member.specializations.map((s) => (
                                <span
                                  key={s}
                                  className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded"
                                >
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Add Department Modal ─── */}
      <Modal open={showAddDept} onClose={() => setShowAddDept(false)} title="Add Department">
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={deptForm.name}
              onChange={(e) => setDeptForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Computer Science"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={deptForm.code}
              onChange={(e) => setDeptForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="e.g. CS"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowAddDept(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => createDeptMutation.mutate({ name: deptForm.name, code: deptForm.code })}
              disabled={!deptForm.name.trim() || !deptForm.code.trim() || createDeptMutation.isPending}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              {createDeptMutation.isPending ? 'Creating...' : 'Create Department'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Add Faculty Modal ─── */}
      <Modal open={showAddFaculty} onClose={() => setShowAddFaculty(false)} title="Add Faculty Member">
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              User ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={facultyForm.userId}
              onChange={(e) => setFacultyForm((f) => ({ ...f, userId: e.target.value }))}
              placeholder="Enter user ID"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
            <select
              value={facultyForm.title}
              onChange={(e) => setFacultyForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {['Lecturer', 'Senior Lecturer', 'Assistant Professor', 'Associate Professor', 'Professor', 'Adjunct Professor'].map(
                (t) => <option key={t} value={t}>{t}</option>,
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
            <select
              value={facultyForm.departmentId}
              onChange={(e) => setFacultyForm((f) => ({ ...f, departmentId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">No department</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Specializations
            </label>
            <input
              type="text"
              value={facultyForm.specializations}
              onChange={(e) => setFacultyForm((f) => ({ ...f, specializations: e.target.value }))}
              placeholder="e.g. Machine Learning, Data Science (comma-separated)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowAddFaculty(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                createFacultyMutation.mutate({
                  userId: facultyForm.userId.trim(),
                  title: facultyForm.title,
                  departmentId: facultyForm.departmentId || undefined,
                  specializations: facultyForm.specializations
                    ? facultyForm.specializations.split(',').map((s) => s.trim()).filter(Boolean)
                    : [],
                })
              }
              disabled={!facultyForm.userId.trim() || createFacultyMutation.isPending}
              className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              {createFacultyMutation.isPending ? 'Adding...' : 'Add Faculty Member'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
