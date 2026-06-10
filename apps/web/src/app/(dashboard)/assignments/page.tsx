'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isPast } from 'date-fns';
import {
  ClipboardList,
  Plus,
  Clock,
  CheckCircle,
  FileText,
  Star,
  Users,
  X,
} from 'lucide-react';
import React, { useState } from 'react';

import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';


function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Not Started', className: 'bg-muted text-muted-foreground' },
    SUBMITTED: { label: 'Submitted', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    GRADED: { label: 'Graded', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    RETURNED: { label: 'Returned', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    LATE: { label: 'Late', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };
  const s = map[status] ?? { label: status, className: 'bg-muted text-muted-foreground' };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.className}`}>
      {s.label}
    </span>
  );
}

function StudentAssignments() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');

  const { data: assignments = [], isLoading } = useQuery<any[]>({
    queryKey: ['assignments-my'],
    queryFn: () => api.get('/assignments/my').then(r => r.data.data ?? []),
  });

  const submitMut = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      api.post(`/assignments/${id}/submit`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments-my'] });
      setSubmitting(false);
      setContent('');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const pending = assignments.filter(a => !a.submissions?.length || a.submissions[0]?.status === 'PENDING');
  const submitted = assignments.filter(a => a.submissions?.length && a.submissions[0]?.status !== 'PENDING');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total', value: assignments.length, icon: ClipboardList, color: 'text-primary' },
          { label: 'Pending', value: pending.length, icon: Clock, color: 'text-amber-500' },
          { label: 'Completed', value: submitted.length, icon: CheckCircle, color: 'text-green-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <stat.icon className={`h-8 w-8 ${stat.color}`} />
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Pending</h2>
          <div className="space-y-3">
            {pending.map(a => {
              const overdue = a.dueDate && isPast(new Date(a.dueDate));
              return (
                <div key={a.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{a.title}</p>
                      {a.description && <p className="text-sm text-muted-foreground line-clamp-1">{a.description}</p>}
                      {a.dueDate && (
                        <p className={`text-xs mt-1 ${overdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                          Due {format(new Date(a.dueDate), 'MMM d, yyyy')}
                          {overdue && ' (Overdue)'}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelected(a); setSubmitting(true); }}
                    className="shrink-0 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Submit
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {submitted.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Submitted</h2>
          <div className="space-y-3">
            {submitted.map(a => {
              const sub = a.submissions?.[0];
              return (
                <div key={a.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{a.title}</p>
                      {sub?.submittedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Submitted {format(new Date(sub.submittedAt), 'MMM d, yyyy')}
                        </p>
                      )}
                      {sub?.score !== null && sub?.score !== undefined && (
                        <p className="text-xs text-green-600 mt-0.5">
                          Score: {sub.score}/{a.maxScore}
                        </p>
                      )}
                    </div>
                  </div>
                  {sub && statusBadge(sub.status)}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {assignments.length === 0 && (
        <div className="text-center py-16">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No assignments yet.</p>
        </div>
      )}

      {/* Submit modal */}
      {submitting && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">{selected.title}</h3>
              <button onClick={() => setSubmitting(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="p-4 space-y-3">
              {selected.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}
              <textarea
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground h-32 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Write your answer here..."
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button onClick={() => setSubmitting(false)} className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors">Cancel</button>
              <button
                onClick={() => submitMut.mutate({ id: selected.id, content })}
                disabled={submitMut.isPending || !content.trim()}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitMut.isPending ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TeacherAssignments() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [viewSubmissions, setViewSubmissions] = useState<any>(null);
  const [gradingSubmission, setGradingSubmission] = useState<any>(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', maxScore: '100' });

  const { data: assignments = [], isLoading } = useQuery<any[]>({
    queryKey: ['assignments-teacher'],
    queryFn: () => api.get('/assignments').then(r => r.data.data ?? []),
  });

  const { data: submissions = [], isLoading: subLoading } = useQuery<any[]>({
    queryKey: ['assignment-submissions', viewSubmissions?.id],
    queryFn: () => api.get(`/assignments/${viewSubmissions.id}/submissions`).then(r => r.data.data ?? []),
    enabled: !!viewSubmissions,
  });

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/assignments', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assignments-teacher'] }); setCreating(false); setForm({ title: '', description: '', dueDate: '', maxScore: '100' }); },
  });

  const gradeMut = useMutation({
    mutationFn: ({ id, score, feedback }: { id: string; score: number; feedback: string }) =>
      api.patch(`/assignments/submissions/${id}/grade`, { score, feedback }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignment-submissions', viewSubmissions?.id] });
      setGradingSubmission(null);
      setScore('');
      setFeedback('');
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/assignments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments-teacher'] }),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Assignment
        </button>
      </div>

      <div className="space-y-3">
        {assignments.map(a => (
          <div key={a.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{a.title}</p>
                {a.description && <p className="text-sm text-muted-foreground line-clamp-1">{a.description}</p>}
                <div className="flex items-center gap-3 mt-1">
                  {a.dueDate && <span className="text-xs text-muted-foreground">Due {format(new Date(a.dueDate), 'MMM d, yyyy')}</span>}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" /> {a._count?.submissions ?? 0} submissions
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3" /> Max: {a.maxScore}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setViewSubmissions(a)}
                className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent transition-colors"
              >
                Submissions
              </button>
              <button
                onClick={() => deleteMut.mutate(a.id)}
                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {assignments.length === 0 && (
          <div className="text-center py-16">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No assignments yet. Create one to get started.</p>
          </div>
        )}
      </div>

      {/* Create modal */}
      {creating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">New Assignment</h3>
              <button onClick={() => setCreating(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="p-4 space-y-3">
              <input
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Title *"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
              <textarea
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground h-20 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Description (optional)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Due Date</label>
                  <input
                    type="datetime-local"
                    className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Max Score</label>
                  <input
                    type="number"
                    className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.maxScore}
                    onChange={e => setForm(f => ({ ...f, maxScore: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button onClick={() => setCreating(false)} className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors">Cancel</button>
              <button
                onClick={() => createMut.mutate({ ...form, maxScore: Number(form.maxScore) || 100 })}
                disabled={createMut.isPending || !form.title.trim()}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {createMut.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submissions modal */}
      {viewSubmissions && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Submissions — {viewSubmissions.title}</h3>
              <button onClick={() => setViewSubmissions(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {subLoading && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>}
              {!subLoading && submissions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No submissions yet.</p>
              )}
              {submissions.map((sub: any) => (
                <div key={sub.id} className="border border-border rounded-lg p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {sub.student?.user?.firstName} {sub.student?.user?.lastName}
                    </p>
                    {sub.content && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{sub.content}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      {statusBadge(sub.status)}
                      {sub.score !== null && sub.score !== undefined && (
                        <span className="text-xs text-green-600">{sub.score}/{viewSubmissions.maxScore}</span>
                      )}
                    </div>
                  </div>
                  {sub.status === 'SUBMITTED' || sub.status === 'LATE' ? (
                    <button
                      onClick={() => { setGradingSubmission(sub); setScore(''); setFeedback(''); }}
                      className="shrink-0 px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Grade
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grade modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Grade Submission</h3>
              <button onClick={() => setGradingSubmission(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Score (max {viewSubmissions?.maxScore})</label>
                <input
                  type="number"
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={score}
                  onChange={e => setScore(e.target.value)}
                  min="0"
                  max={viewSubmissions?.maxScore}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Feedback (optional)</label>
                <textarea
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground h-20 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button onClick={() => setGradingSubmission(null)} className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors">Cancel</button>
              <button
                onClick={() => gradeMut.mutate({ id: gradingSubmission.id, score: Number(score), feedback })}
                disabled={gradeMut.isPending || score === ''}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {gradeMut.isPending ? 'Saving...' : 'Save Grade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AssignmentsPage() {
  const user = useAuthStore(s => s.user);
  const isStudent = user?.role === 'STUDENT';
  const isTeacher = user?.role === 'TEACHER';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <ClipboardList className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assignments</h1>
          <p className="text-sm text-muted-foreground">
            {isStudent ? 'View and submit your assignments' : 'Manage and grade assignments'}
          </p>
        </div>
      </div>

      {isStudent && <StudentAssignments />}
      {isTeacher && <TeacherAssignments />}
      {!isStudent && !isTeacher && <TeacherAssignments />}
    </div>
  );
}
