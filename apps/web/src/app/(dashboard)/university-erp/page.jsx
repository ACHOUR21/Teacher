'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, BookOpen, Users, Building2, Award, Plus, X, ChevronDown, ChevronRight, Search, TrendingUp, FileText, } from 'lucide-react';
import { useState } from 'react';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const DEGREE_COLORS = {
    BSc: 'bg-blue-100 text-blue-700',
    MSc: 'bg-purple-100 text-purple-700',
    PhD: 'bg-red-100 text-red-700',
    BA: 'bg-green-100 text-green-700',
    MBA: 'bg-amber-100 text-amber-700',
    BACHELOR: 'bg-blue-100 text-blue-700',
    MASTER: 'bg-purple-100 text-purple-700',
    DIPLOMA: 'bg-teal-100 text-teal-700',
    CERTIFICATE: 'bg-orange-100 text-orange-700',
};
const STATUS_COLORS = {
    ACTIVE: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-blue-100 text-blue-700',
    SUSPENDED: 'bg-amber-100 text-amber-700',
    WITHDRAWN: 'bg-red-100 text-red-700',
};
const SECTIONS = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'faculties', label: 'Faculties', icon: GraduationCap },
    { id: 'programs', label: 'Programs', icon: BookOpen },
    { id: 'enrollments', label: 'Enrollments', icon: Users },
    { id: 'academic-records', label: 'Academic Records', icon: FileText },
];
// ---------------------------------------------------------------------------
// Modal component
// ---------------------------------------------------------------------------
function Modal({ open, onClose, title, children }) {
    if (!open) {
        return null;
    }
    return (<div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5"/></button>
        </div>
        {children}
      </div>
    </div>);
}
// ---------------------------------------------------------------------------
// Enrollment stats slide-out
// ---------------------------------------------------------------------------
function EnrollmentStatsPanel({ programId, programName, onClose }) {
    const { data: stats } = useQuery({
        queryKey: ['program-enrollment-stats', programId],
        queryFn: () => api.get(`/university-erp/programs/${programId}/stats`).then(r => r.data.data),
        enabled: !!programId,
    });
    const total = stats?.total ?? 0;
    const items = [
        { label: 'Active', value: stats?.active ?? 0, color: 'bg-green-500' },
        { label: 'Completed', value: stats?.completed ?? 0, color: 'bg-blue-500' },
        { label: 'Suspended', value: stats?.suspended ?? 0, color: 'bg-amber-500' },
        { label: 'Withdrawn', value: stats?.withdrawn ?? 0, color: 'bg-red-500' },
    ];
    return (<div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose}/>
      <div className="relative bg-white w-full max-w-sm shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">Enrollment Stats</h3>
            <p className="text-xs text-gray-500 mt-0.5">{programName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5"/></button>
        </div>
        <div className="p-5 space-y-5">
          <p className="text-3xl font-bold text-gray-900">{total} <span className="text-sm font-normal text-gray-500">total enrollments</span></p>
          {/* Simple bar chart */}
          <div className="space-y-3">
            {items.map(item => (<div key={item.label}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', item.color)} style={{ width: total > 0 ? `${(item.value / total) * 100}%` : '0%' }}/>
                </div>
              </div>))}
          </div>
          {/* Simple pie visual */}
          {total > 0 && (<div className="flex flex-wrap gap-2 pt-2">
              {items.filter(i => i.value > 0).map(item => (<span key={item.label} className={cn('px-3 py-1 rounded-full text-xs font-medium', STATUS_COLORS[item.label.toUpperCase()] ?? 'bg-gray-100 text-gray-600')}>
                  {Math.round((item.value / total) * 100)}% {item.label}
                </span>))}
            </div>)}
        </div>
      </div>
    </div>);
}
// ---------------------------------------------------------------------------
// Faculty card (expandable)
// ---------------------------------------------------------------------------
function FacultyCard({ faculty, universityId: _universityId, onAddDepartment, onDeleteFaculty, }) {
    const [expanded, setExpanded] = useState(false);
    const { data: departments } = useQuery({
        queryKey: ['uni-departments', faculty.id],
        queryFn: () => api.get(`/university-erp/faculties/${faculty.id}/departments`).then(r => r.data.data ?? []),
        enabled: expanded,
    });
    return (<div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="h-6 w-6 text-purple-600"/>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{faculty.name}</h3>
            {faculty.code && <p className="text-xs text-gray-500 mt-0.5">{faculty.code}</p>}
            <p className="text-xs text-gray-500 mt-1">{faculty._count?.departments ?? 0} departments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onDeleteFaculty(faculty.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1" title="Delete faculty">
            <X className="h-4 w-4"/>
          </button>
          <button onClick={() => setExpanded(v => !v)} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            {expanded ? <ChevronDown className="h-4 w-4"/> : <ChevronRight className="h-4 w-4"/>}
          </button>
        </div>
      </div>

      {expanded && (<div className="mt-4 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Departments</p>
            <button onClick={() => onAddDepartment(faculty.id)} className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium">
              <Plus className="h-3.5 w-3.5"/> Add Department
            </button>
          </div>
          {!departments || departments.length === 0 ? (<p className="text-xs text-gray-400 py-2">No departments yet</p>) : (<div className="space-y-2">
              {departments.map(dept => (<div key={dept.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{dept.name}</p>
                    {dept.code && <p className="text-xs text-gray-500">{dept.code}</p>}
                  </div>
                  <span className="text-xs text-gray-400">{dept._count?.programs ?? 0} programs</span>
                </div>))}
            </div>)}
        </div>)}
    </div>);
}
// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function UniversityErpPage() {
    const [activeSection, setActiveSection] = useState('overview');
    const [selectedUniversityId, setSelectedUniversityId] = useState(null);
    const qc = useQueryClient();
    // Modal states
    const [showAddFaculty, setShowAddFaculty] = useState(false);
    const [showAddDeptForFacultyId, setShowAddDeptForFacultyId] = useState(null);
    const [showAddProgram, setShowAddProgram] = useState(false);
    const [showEnrollStudent, setShowEnrollStudent] = useState(false);
    const [statsProgramId, setStatsProgramId] = useState(null);
    const [statsProgramName, setStatsProgramName] = useState('');
    // Form state
    const [facultyForm, setFacultyForm] = useState({ name: '', code: '' });
    const [deptForm, setDeptForm] = useState({ name: '', code: '' });
    const [programForm, setProgramForm] = useState({ name: '', code: '', degree: 'BSc', durationYears: 4, departmentId: '' });
    const [enrollForm, setEnrollForm] = useState({ studentId: '', programId: '' });
    // Enrollments filter state
    const [enrollFilterProgram, setEnrollFilterProgram] = useState('');
    const [enrollFilterStatus, setEnrollFilterStatus] = useState('ALL');
    const [enrollPage, setEnrollPage] = useState(1);
    const ENROLL_PAGE_SIZE = 10;
    // Academic records search
    const [studentSearch, setStudentSearch] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [selectedStudentUniversityId, setSelectedStudentUniversityId] = useState(null);
    // ---------------------------------------------------------------------------
    // Queries
    // ---------------------------------------------------------------------------
    const { data: universities } = useQuery({
        queryKey: ['university-erp-universities'],
        queryFn: () => api.get('/university-erp/universities').then(r => {
            const data = r.data.data;
            if (data?.length && !selectedUniversityId) {
                setSelectedUniversityId(data[0].id);
            }
            return data;
        }),
    });
    const universityId = selectedUniversityId ?? (universities?.[0]?.id ?? null);
    const { data: univDetail } = useQuery({
        queryKey: ['university-detail', universityId],
        queryFn: () => api.get(`/university-erp/universities/${universityId}`).then(r => r.data.data),
        enabled: !!universityId && activeSection === 'overview',
    });
    const { data: faculties } = useQuery({
        queryKey: ['university-faculties', universityId],
        queryFn: () => api.get(`/university-erp/universities/${universityId}/faculties`).then(r => r.data.data ?? []),
        enabled: !!universityId && activeSection === 'faculties',
    });
    const { data: programs } = useQuery({
        queryKey: ['university-programs', universityId],
        queryFn: () => api.get(`/university-erp/universities/${universityId}/programs`).then(r => r.data.data ?? []),
        enabled: !!universityId && (activeSection === 'programs' || activeSection === 'enrollments'),
    });
    // For enrollments tab — fetch per-program or all
    const enrollProgramId = enrollFilterProgram || null;
    const { data: allEnrollments } = useQuery({
        queryKey: ['university-enrollments', enrollProgramId],
        queryFn: () => api.get(`/university-erp/programs/${enrollProgramId}/enrollments`).then(r => r.data.data ?? []),
        enabled: !!enrollProgramId && activeSection === 'enrollments',
    });
    const { data: academicRecord } = useQuery({
        queryKey: ['student-academic-record', selectedStudentId, selectedStudentUniversityId],
        queryFn: () => api.get(`/university-erp/students/${selectedStudentId}/academic-record?universityId=${selectedStudentUniversityId}`).then(r => r.data.data),
        enabled: !!selectedStudentId && !!selectedStudentUniversityId && activeSection === 'academic-records',
    });
    // ---------------------------------------------------------------------------
    // Mutations
    // ---------------------------------------------------------------------------
    const addFacultyMutation = useMutation({
        mutationFn: (data) => api.post(`/university-erp/universities/${universityId}/faculties`, data).then(r => r.data.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['university-faculties', universityId] });
            qc.invalidateQueries({ queryKey: ['university-erp-universities'] });
            setShowAddFaculty(false);
            setFacultyForm({ name: '', code: '' });
        },
    });
    const deleteFacultyMutation = useMutation({
        mutationFn: (id) => api.delete(`/university-erp/faculties/${id}`).then(r => r.data.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['university-faculties', universityId] });
            qc.invalidateQueries({ queryKey: ['university-erp-universities'] });
        },
    });
    const addDeptMutation = useMutation({
        mutationFn: ({ facultyId, data }) => api.post(`/university-erp/faculties/${facultyId}/departments`, data).then(r => r.data.data),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['uni-departments', vars.facultyId] });
            setShowAddDeptForFacultyId(null);
            setDeptForm({ name: '', code: '' });
        },
    });
    const addProgramMutation = useMutation({
        mutationFn: (data) => api.post(`/university-erp/universities/${universityId}/programs`, {
            ...data,
            durationYears: Number(data.durationYears),
            departmentId: data.departmentId || undefined,
        }).then(r => r.data.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['university-programs', universityId] });
            setShowAddProgram(false);
            setProgramForm({ name: '', code: '', degree: 'BSc', durationYears: 4, departmentId: '' });
        },
    });
    const enrollStudentMutation = useMutation({
        mutationFn: (data) => api.post(`/university-erp/programs/${data.programId}/enroll`, { studentId: data.studentId }).then(r => r.data.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['university-enrollments', enrollForm.programId] });
            setShowEnrollStudent(false);
            setEnrollForm({ studentId: '', programId: '' });
        },
    });
    const updateEnrollStatusMutation = useMutation({
        mutationFn: ({ id, status }) => api.patch(`/university-erp/enrollments/${id}/status`, { status }).then(r => r.data.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['university-enrollments', enrollProgramId] });
        },
    });
    // ---------------------------------------------------------------------------
    // Computed
    // ---------------------------------------------------------------------------
    const totalFaculties = univDetail?._count?.faculties ?? universities?.reduce((s, u) => s + (u._count?.faculties ?? 0), 0) ?? 0;
    const totalPrograms = univDetail?._count?.programs ?? universities?.reduce((s, u) => s + (u._count?.programs ?? 0), 0) ?? 0;
    const totalEnrollments = univDetail?.enrollmentsCount ?? 0;
    const activeStudents = univDetail?.activeStudents ?? 0;
    const filteredEnrollments = (allEnrollments ?? []).filter(e => {
        if (enrollFilterStatus !== 'ALL' && e.status !== enrollFilterStatus) {
            return false;
        }
        return true;
    });
    const pagedEnrollments = filteredEnrollments.slice((enrollPage - 1) * ENROLL_PAGE_SIZE, enrollPage * ENROLL_PAGE_SIZE);
    const totalPages = Math.max(1, Math.ceil(filteredEnrollments.length / ENROLL_PAGE_SIZE));
    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-purple-600"/> University ERP
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage faculties, academic programs, and student enrollment</p>
        </div>
        {(universities?.length ?? 0) > 1 && (<select value={universityId ?? ''} onChange={e => setSelectedUniversityId(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400">
            {universities?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>)}
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
        {SECTIONS.map(s => (<button key={s.id} onClick={() => setActiveSection(s.id)} className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors', activeSection === s.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700')}>
            <s.icon className="h-4 w-4"/> {s.label}
          </button>))}
      </div>

      {/* ================================================================ */}
      {/* OVERVIEW TAB */}
      {/* ================================================================ */}
      {activeSection === 'overview' && (<div className="space-y-5">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
                { label: 'Total Faculties', value: totalFaculties, icon: GraduationCap, color: 'text-purple-500 bg-purple-50' },
                { label: 'Total Programs', value: totalPrograms, icon: BookOpen, color: 'text-blue-500 bg-blue-50' },
                { label: 'Total Enrollments', value: totalEnrollments, icon: Users, color: 'text-green-500 bg-green-50' },
                { label: 'Active Students', value: activeStudents, icon: Award, color: 'text-amber-500 bg-amber-50' },
            ].map(stat => (<div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center mb-3', stat.color.split(' ')[1])}>
                  <stat.icon className={cn('h-4.5 w-4.5', stat.color.split(' ')[0])}/>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value || '—'}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>))}
          </div>

          {/* Quick navigation */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Navigation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'View Faculties', icon: GraduationCap, section: 'faculties' },
                { label: 'Manage Programs', icon: BookOpen, section: 'programs' },
                { label: 'Enrollments', icon: Users, section: 'enrollments' },
                { label: 'Academic Records', icon: FileText, section: 'academic-records' },
            ].map(action => (<button key={action.label} onClick={() => setActiveSection(action.section)} className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <action.icon className="h-4 w-4 text-purple-600"/>
                  </div>
                  <span className="text-sm font-medium text-gray-700 flex-1 text-left">{action.label}</span>
                  <ChevronRight className="h-4 w-4 text-gray-300"/>
                </button>))}
            </div>
          </div>

          {/* Universities list / selector */}
          {(universities?.length ?? 0) > 0 && (<div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Universities</h3>
              <div className="space-y-3">
                {universities?.map(uni => (<button key={uni.id} onClick={() => setSelectedUniversityId(uni.id)} className={cn('w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left', universityId === uni.id ? 'border-purple-300 bg-purple-50' : 'border-gray-100 hover:bg-gray-50')}>
                    <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-purple-600"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{uni.name}</p>
                      {uni.code && <p className="text-xs text-gray-500">{uni.code}</p>}
                    </div>
                    <div className="text-xs text-gray-400 flex gap-3 flex-shrink-0">
                      <span>{uni._count?.faculties ?? 0} faculties</span>
                      <span>{uni._count?.programs ?? 0} programs</span>
                    </div>
                  </button>))}
              </div>
            </div>)}
        </div>)}

      {/* ================================================================ */}
      {/* FACULTIES TAB */}
      {/* ================================================================ */}
      {activeSection === 'faculties' && (<div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddFaculty(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
              <Plus className="h-4 w-4"/> Add Faculty
            </button>
          </div>
          {(!faculties || faculties.length === 0) ? (<div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
              <GraduationCap className="h-10 w-10 mx-auto mb-3 text-gray-300"/>
              No faculties configured yet
            </div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {faculties.map(faculty => (<FacultyCard key={faculty.id} faculty={faculty} universityId={universityId ?? ''} onAddDepartment={(fid) => setShowAddDeptForFacultyId(fid)} onDeleteFaculty={(id) => deleteFacultyMutation.mutate(id)}/>))}
            </div>)}
        </div>)}

      {/* ================================================================ */}
      {/* PROGRAMS TAB */}
      {/* ================================================================ */}
      {activeSection === 'programs' && (<div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddProgram(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
              <Plus className="h-4 w-4"/> Add Program
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3.5 px-4 font-medium text-gray-600">Program</th>
                  <th className="text-left py-3.5 px-4 font-medium text-gray-600">Degree</th>
                  <th className="text-left py-3.5 px-4 font-medium text-gray-600">Duration</th>
                  <th className="text-left py-3.5 px-4 font-medium text-gray-600">Faculty / Dept</th>
                  <th className="text-left py-3.5 px-4 font-medium text-gray-600">Enrollments</th>
                  <th className="text-left py-3.5 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(!programs || programs.length === 0) ? (<tr><td colSpan={6} className="py-12 text-center text-gray-400">No programs found</td></tr>) : programs.map(prog => (<tr key={prog.id} className="hover:bg-gray-50">
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-gray-900">{prog.name}</p>
                      {prog.code && <p className="text-xs text-gray-500 mt-0.5">{prog.code}</p>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', DEGREE_COLORS[prog.degree] ?? 'bg-gray-100 text-gray-600')}>
                        {prog.degree}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">{prog.durationYears ? `${prog.durationYears}y` : '—'}</td>
                    <td className="py-3.5 px-4 text-gray-600">{prog.department?.name ?? '—'}</td>
                    <td className="py-3.5 px-4 text-gray-600">{prog._count?.enrollments ?? 0}</td>
                    <td className="py-3.5 px-4">
                      <button onClick={() => { setStatsProgramId(prog.id); setStatsProgramName(prog.name); }} className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium">
                        <TrendingUp className="h-3.5 w-3.5"/> View Enrollments
                      </button>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>)}

      {/* ================================================================ */}
      {/* ENROLLMENTS TAB */}
      {/* ================================================================ */}
      {activeSection === 'enrollments' && (<div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select value={enrollFilterProgram} onChange={e => { setEnrollFilterProgram(e.target.value); setEnrollPage(1); }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400">
              <option value="">Select Program</option>
              {programs?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={enrollFilterStatus} onChange={e => { setEnrollFilterStatus(e.target.value); setEnrollPage(1); }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400">
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
            <div className="ml-auto">
              <button onClick={() => setShowEnrollStudent(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                <Plus className="h-4 w-4"/> Enroll Student
              </button>
            </div>
          </div>

          {!enrollFilterProgram ? (<div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
              <Users className="h-10 w-10 mx-auto mb-3 text-gray-300"/>
              Select a program to view enrollments
            </div>) : (<>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3.5 px-4 font-medium text-gray-600">Student</th>
                      <th className="text-left py-3.5 px-4 font-medium text-gray-600">Email</th>
                      <th className="text-left py-3.5 px-4 font-medium text-gray-600">Program</th>
                      <th className="text-left py-3.5 px-4 font-medium text-gray-600">Enrolled</th>
                      <th className="text-left py-3.5 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3.5 px-4 font-medium text-gray-600">GPA</th>
                      <th className="text-left py-3.5 px-4 font-medium text-gray-600">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pagedEnrollments.length === 0 ? (<tr><td colSpan={7} className="py-12 text-center text-gray-400">No enrollments found</td></tr>) : pagedEnrollments.map(enroll => {
                    const first = enroll.student?.user?.firstName ?? '';
                    const last = enroll.student?.user?.lastName ?? '';
                    const email = enroll.student?.user?.email ?? '—';
                    const initials = `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
                    return (<tr key={enroll.id} className="hover:bg-gray-50">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                {initials || <Users className="h-4 w-4"/>}
                              </div>
                              <span className="font-medium text-gray-900">{first} {last}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-gray-500 text-xs">{email}</td>
                          <td className="py-3.5 px-4 text-gray-600">{enroll.program?.name ?? '—'}</td>
                          <td className="py-3.5 px-4 text-gray-500 text-xs">{enroll.startedAt ? new Date(enroll.startedAt).toLocaleDateString() : '—'}</td>
                          <td className="py-3.5 px-4">
                            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', STATUS_COLORS[enroll.status] ?? 'bg-gray-100 text-gray-600')}>
                              {enroll.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-600">{enroll.student?.gpa?.toFixed(2) ?? '—'}</td>
                          <td className="py-3.5 px-4">
                            <select value={enroll.status} onChange={e => updateEnrollStatusMutation.mutate({ id: enroll.id, status: e.target.value })} className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-300">
                              <option value="ACTIVE">Active</option>
                              <option value="COMPLETED">Completed</option>
                              <option value="SUSPENDED">Suspended</option>
                              <option value="WITHDRAWN">Withdrawn</option>
                            </select>
                          </td>
                        </tr>);
                })}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (<div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Showing {Math.min((enrollPage - 1) * ENROLL_PAGE_SIZE + 1, filteredEnrollments.length)}–{Math.min(enrollPage * ENROLL_PAGE_SIZE, filteredEnrollments.length)} of {filteredEnrollments.length}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setEnrollPage(p => Math.max(1, p - 1))} disabled={enrollPage === 1} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none">
                      Prev
                    </button>
                    <button onClick={() => setEnrollPage(p => Math.min(totalPages, p + 1))} disabled={enrollPage === totalPages} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none">
                      Next
                    </button>
                  </div>
                </div>)}
            </>)}
        </div>)}

      {/* ================================================================ */}
      {/* ACADEMIC RECORDS TAB */}
      {/* ================================================================ */}
      {activeSection === 'academic-records' && (<div className="space-y-5">
          {/* Search */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Find Student</h3>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                <input type="text" placeholder="Enter student ID..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"/>
              </div>
              <button onClick={() => {
                setSelectedStudentId(studentSearch.trim() || null);
                setSelectedStudentUniversityId(universityId);
            }} disabled={!studentSearch.trim()} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-40 disabled:pointer-events-none transition-colors">
                Search
              </button>
            </div>
          </div>

          {/* Academic record */}
          {selectedStudentId && (academicRecord ? (<div className="space-y-4">
                {/* Student header */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {(academicRecord.user.firstName[0] ?? '') + (academicRecord.user.lastName[0] ?? '')}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{academicRecord.user.firstName} {academicRecord.user.lastName}</p>
                    <p className="text-sm text-gray-500">{academicRecord.user.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Student ID: {academicRecord.id}</p>
                  </div>
                  {academicRecord.gpa !== undefined && academicRecord.gpa !== null && (<div className="ml-auto text-right">
                      <p className="text-3xl font-bold text-purple-600">{(academicRecord.gpa).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Overall GPA</p>
                    </div>)}
                </div>

                {/* Enrollments */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-gray-900">Program Enrollments</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{academicRecord.enrollments?.length ?? 0} enrollment(s)</p>
                  </div>
                  {(!academicRecord.enrollments || academicRecord.enrollments.length === 0) ? (<div className="py-10 text-center text-gray-400 text-sm">No enrollments found for this university</div>) : (<table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-5 font-medium text-gray-600">Program</th>
                          <th className="text-left py-3 px-5 font-medium text-gray-600">Degree</th>
                          <th className="text-left py-3 px-5 font-medium text-gray-600">Duration</th>
                          <th className="text-left py-3 px-5 font-medium text-gray-600">Enrolled</th>
                          <th className="text-left py-3 px-5 font-medium text-gray-600">Completed</th>
                          <th className="text-left py-3 px-5 font-medium text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {academicRecord.enrollments.map(enroll => (<tr key={enroll.id} className="hover:bg-gray-50">
                            <td className="py-3.5 px-5">
                              <p className="font-medium text-gray-900">{enroll.program.name}</p>
                              {enroll.program.code && <p className="text-xs text-gray-500">{enroll.program.code}</p>}
                            </td>
                            <td className="py-3.5 px-5">
                              <span className={cn('px-2 py-1 rounded-full text-xs font-medium', DEGREE_COLORS[enroll.program.degree] ?? 'bg-gray-100 text-gray-600')}>
                                {enroll.program.degree}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-gray-600">{enroll.program.durationYears}y</td>
                            <td className="py-3.5 px-5 text-gray-500 text-xs">{enroll.startedAt ? new Date(enroll.startedAt).toLocaleDateString() : '—'}</td>
                            <td className="py-3.5 px-5 text-gray-500 text-xs">{enroll.completedAt ? new Date(enroll.completedAt).toLocaleDateString() : '—'}</td>
                            <td className="py-3.5 px-5">
                              <span className={cn('px-2 py-1 rounded-full text-xs font-medium', STATUS_COLORS[enroll.status] ?? 'bg-gray-100 text-gray-600')}>
                                {enroll.status}
                              </span>
                            </td>
                          </tr>))}
                      </tbody>
                    </table>)}
                </div>
              </div>) : (<div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400">
                Loading academic record...
              </div>))}
        </div>)}

      {/* ================================================================ */}
      {/* MODALS */}
      {/* ================================================================ */}

      {/* Add Faculty */}
      <Modal open={showAddFaculty} onClose={() => setShowAddFaculty(false)} title="Add Faculty">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Faculty Name <span className="text-red-500">*</span></label>
            <input type="text" value={facultyForm.name} onChange={e => setFacultyForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Faculty of Engineering" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Code (optional)</label>
            <input type="text" value={facultyForm.code} onChange={e => setFacultyForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. ENG" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"/>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAddFaculty(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            <button onClick={() => addFacultyMutation.mutate({ name: facultyForm.name, code: facultyForm.code || undefined })} disabled={!facultyForm.name.trim() || addFacultyMutation.isPending} className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:pointer-events-none transition-colors">
              {addFacultyMutation.isPending ? 'Adding...' : 'Add Faculty'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Department */}
      <Modal open={!!showAddDeptForFacultyId} onClose={() => setShowAddDeptForFacultyId(null)} title="Add Department">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Department Name <span className="text-red-500">*</span></label>
            <input type="text" value={deptForm.name} onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Computer Science" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Code (optional)</label>
            <input type="text" value={deptForm.code} onChange={e => setDeptForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. CS" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"/>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAddDeptForFacultyId(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            <button onClick={() => showAddDeptForFacultyId && addDeptMutation.mutate({ facultyId: showAddDeptForFacultyId, data: { name: deptForm.name, code: deptForm.code || undefined } })} disabled={!deptForm.name.trim() || addDeptMutation.isPending} className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:pointer-events-none transition-colors">
              {addDeptMutation.isPending ? 'Adding...' : 'Add Department'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Program */}
      <Modal open={showAddProgram} onClose={() => setShowAddProgram(false)} title="Add Academic Program">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Program Name <span className="text-red-500">*</span></label>
            <input type="text" value={programForm.name} onChange={e => setProgramForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Bachelor of Computer Science" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Code (optional)</label>
              <input type="text" value={programForm.code} onChange={e => setProgramForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. BCS" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Degree <span className="text-red-500">*</span></label>
              <select value={programForm.degree} onChange={e => setProgramForm(f => ({ ...f, degree: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400">
                <option value="BSc">BSc</option>
                <option value="MSc">MSc</option>
                <option value="PhD">PhD</option>
                <option value="BA">BA</option>
                <option value="MBA">MBA</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Duration (years) <span className="text-red-500">*</span></label>
              <select value={programForm.durationYears} onChange={e => setProgramForm(f => ({ ...f, durationYears: Number(e.target.value) }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400">
                {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y}>{y} year{y > 1 ? 's' : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Department (optional)</label>
              <input type="text" value={programForm.departmentId} onChange={e => setProgramForm(f => ({ ...f, departmentId: e.target.value }))} placeholder="Department ID" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"/>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAddProgram(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            <button onClick={() => addProgramMutation.mutate(programForm)} disabled={!programForm.name.trim() || addProgramMutation.isPending} className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:pointer-events-none transition-colors">
              {addProgramMutation.isPending ? 'Adding...' : 'Add Program'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Enroll Student */}
      <Modal open={showEnrollStudent} onClose={() => setShowEnrollStudent(false)} title="Enroll Student">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Student ID <span className="text-red-500">*</span></label>
            <input type="text" value={enrollForm.studentId} onChange={e => setEnrollForm(f => ({ ...f, studentId: e.target.value }))} placeholder="Enter student ID" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Program <span className="text-red-500">*</span></label>
            <select value={enrollForm.programId} onChange={e => setEnrollForm(f => ({ ...f, programId: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400">
              <option value="">Select Program</option>
              {programs?.map(p => <option key={p.id} value={p.id}>{p.name} ({p.degree})</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowEnrollStudent(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            <button onClick={() => enrollStudentMutation.mutate({ studentId: enrollForm.studentId, programId: enrollForm.programId })} disabled={!enrollForm.studentId.trim() || !enrollForm.programId || enrollStudentMutation.isPending} className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:pointer-events-none transition-colors">
              {enrollStudentMutation.isPending ? 'Enrolling...' : 'Enroll Student'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Enrollment Stats slide-out */}
      {statsProgramId && (<EnrollmentStatsPanel programId={statsProgramId} programName={statsProgramName} onClose={() => { setStatsProgramId(null); setStatsProgramName(''); }}/>)}
    </div>);
}
