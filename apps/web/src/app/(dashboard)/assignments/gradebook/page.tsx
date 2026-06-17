'use client';

import { useQuery, useQueries } from '@tanstack/react-query';
import {
  Download,
  Search,
  BookOpen,
  Users,
  CheckCircle,
  BarChart2,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';


// ─── Types ────────────────────────────────────────────────────────────────────

interface Assignment {
  id: string;
  title: string;
  maxScore: number;
  dueDate?: string;
  _count?: { submissions: number };
}

interface Submission {
  id: string;
  studentId: string;
  content?: string;
  score: number | null;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'RETURNED' | 'LATE';
  submittedAt?: string;
  gradedAt?: string;
  student?: {
    user?: {
      firstName: string;
      lastName: string;
    };
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncate(str: string, max = 15): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function scoreColor(score: number, maxScore: number): string {
  const pct = (score / maxScore) * 100;
  if (pct >= 70) {return 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20';}
  return 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonTable() {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {Array.from({ length: 6 }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <div className="h-3 rounded bg-muted animate-pulse w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, r) => (
            <tr key={r} className="border-b border-border last:border-0">
              {Array.from({ length: 6 }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  <div className="h-3 rounded bg-muted animate-pulse" style={{ width: c === 0 ? '120px' : '60px' }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
}

function SummaryCard({ icon: Icon, label, value, iconBg, iconColor }: SummaryCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── Grade Book Page ───────────────────────────────────────────────────────────

export default function GradeBookPage() {
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');

  // ── Fetch all assignments ──────────────────────────────────────────────────
  const {
    data: assignments = [],
    isLoading: assignmentsLoading,
  } = useQuery<Assignment[]>({
    queryKey: ['assignments-teacher'],
    queryFn: () => api.get('/assignments').then((r) => r.data.data ?? []),
    enabled: user?.role !== 'STUDENT',
  });

  // ── Fetch submissions for every assignment in parallel ────────────────────
  const submissionQueries = useQueries({
    queries: assignments.map((a) => ({
      queryKey: ['subs', a.id],
      queryFn: () =>
        api.get(`/assignments/${a.id}/submissions`).then((r): Submission[] => r.data.data ?? []),
      enabled: assignments.length > 0,
    })),
  });

  const submissionsLoading = submissionQueries.some((q) => q.isLoading);
  const isLoading = assignmentsLoading || submissionsLoading;

  // ── Build studentMap: { studentName → { assignmentId → Submission } } ─────
  const studentMap = useMemo(() => {
    const map: Record<string, Record<string, Submission>> = {};
    assignments.forEach((a, idx) => {
      const subs: Submission[] = submissionQueries[idx]?.data ?? [];
      subs.forEach((sub) => {
        const name =
          sub.student?.user
            ? `${sub.student.user.firstName} ${sub.student.user.lastName}`.trim()
            : sub.studentId;
        if (!map[name]) {map[name] = {};}
        map[name][a.id] = sub;
      });
    });
    return map;
  }, [assignments, submissionQueries]);

  // ── Summary stats ─────────────────────────────────────────────────────────
  const { totalSubmissions, gradedCount, classAverage } = useMemo(() => {
    let total = 0;
    let graded = 0;
    let scoreSum = 0;
    let gradedWithScore = 0;

    assignments.forEach((a, idx) => {
      const subs: Submission[] = submissionQueries[idx]?.data ?? [];
      subs.forEach((sub) => {
        total++;
        if (sub.status === 'GRADED' || sub.status === 'RETURNED') {
          graded++;
          if (sub.score !== null && sub.score !== undefined) {
            scoreSum += (sub.score / a.maxScore) * 100;
            gradedWithScore++;
          }
        }
      });
    });

    const avg = gradedWithScore > 0 ? Math.round(scoreSum / gradedWithScore) : null;
    return { totalSubmissions: total, gradedCount: graded, classAverage: avg };
  }, [assignments, submissionQueries]);

  // ── Per-student average ───────────────────────────────────────────────────
  function getStudentAverage(subs: Record<string, Submission>): string {
    const graded = assignments.filter(
      (a) => subs[a.id]?.score !== null && subs[a.id]?.score !== undefined,
    );
    if (graded.length === 0) {return '—';}
    const avg =
      graded.reduce((sum, a) => sum + ((subs[a.id].score as number) / a.maxScore) * 100, 0) /
      graded.length;
    return `${Math.round(avg)}%`;
  }

  // ── Filtered students ─────────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    const allStudents = Object.keys(studentMap).sort();
    if (!search.trim()) {return allStudents;}
    const q = search.trim().toLowerCase();
    return allStudents.filter((name) => name.toLowerCase().includes(q));
  }, [studentMap, search]);

  // ── CSV Export ────────────────────────────────────────────────────────────
  const handleExport = () => {
    const headers = ['Student', ...assignments.map((a) => a.title), 'Average'];
    const rows = Object.entries(studentMap).map(([name, subs]) => {
      const scores = assignments.map((a) => {
        const s = subs[a.id];
        if (!s) {return '—';}
        if (s.score !== null && s.score !== undefined) {return `${s.score}/${a.maxScore}`;}
        if (s.status === 'SUBMITTED' || s.status === 'LATE') {return 'Submitted';}
        return '—';
      });
      const avg = getStudentAverage(subs);
      return [name, ...scores, avg];
    });

    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'gradebook.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  // ── Guard: students cannot view grade book ────────────────────────────────
  if (user?.role === 'STUDENT') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <BookOpen className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Grade Book is for teachers only</h2>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            You are logged in as a student. Please ask your teacher to view grades.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Grade Book</h1>
          <p className="text-sm text-muted-foreground">
            Track student performance across all assignments
          </p>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={BookOpen}
          label="Total Assignments"
          value={assignments.length}
          iconBg="bg-indigo-100 dark:bg-indigo-900/30"
          iconColor="text-indigo-600 dark:text-indigo-400"
        />
        <SummaryCard
          icon={Users}
          label="Total Submissions"
          value={totalSubmissions}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <SummaryCard
          icon={BarChart2}
          label="Class Average"
          value={classAverage !== null ? `${classAverage}%` : '—'}
          iconBg="bg-violet-100 dark:bg-violet-900/30"
          iconColor="text-violet-600 dark:text-violet-400"
        />
        <SummaryCard
          icon={CheckCircle}
          label="Graded"
          value={gradedCount}
          iconBg="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
        />
      </div>

      {/* ── Controls Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={handleExport}
          disabled={isLoading || assignments.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* ── Loading State ── */}
      {isLoading && <SkeletonTable />}

      {/* ── Empty State ── */}
      {!isLoading && assignments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-card border border-border rounded-xl">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
            <BookOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm text-center">
            No assignments yet.{' '}
            <a
              href="/assignments"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Create one from the Assignments page.
            </a>
          </p>
        </div>
      )}

      {/* ── Grade Table ── */}
      {!isLoading && assignments.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {/* Sticky student column header */}
                <th className="sticky left-0 z-20 bg-muted/40 px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap min-w-[160px]">
                  Student
                </th>
                {assignments.map((a) => (
                  <th
                    key={a.id}
                    title={a.title}
                    className="px-4 py-3 text-center font-semibold text-foreground whitespace-nowrap min-w-[110px]"
                  >
                    {truncate(a.title, 15)}
                    <span className="block text-xs font-normal text-muted-foreground">
                      /{a.maxScore}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-semibold text-foreground whitespace-nowrap min-w-[90px]">
                  Average
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={assignments.length + 2}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No students match your search.
                  </td>
                </tr>
              )}
              {filteredStudents.map((studentName) => {
                const subs = studentMap[studentName];
                const avg = getStudentAverage(subs);
                return (
                  <tr
                    key={studentName}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    {/* Sticky student name cell */}
                    <td className="sticky left-0 z-10 bg-white dark:bg-card px-4 py-3 font-medium text-foreground whitespace-nowrap border-r border-border/50">
                      {studentName}
                    </td>

                    {assignments.map((a) => {
                      const sub = subs[a.id];

                      if (!sub) {
                        return (
                          <td key={a.id} className="px-4 py-3 text-center text-muted-foreground">
                            —
                          </td>
                        );
                      }

                      if (sub.score !== null && sub.score !== undefined) {
                        return (
                          <td key={a.id} className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${scoreColor(sub.score, a.maxScore)}`}
                            >
                              {sub.score}/{a.maxScore}
                            </span>
                          </td>
                        );
                      }

                      if (sub.status === 'SUBMITTED' || sub.status === 'LATE') {
                        return (
                          <td key={a.id} className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              Submitted
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td key={a.id} className="px-4 py-3 text-center text-muted-foreground">
                          —
                        </td>
                      );
                    })}

                    {/* Average column */}
                    <td className="px-4 py-3 text-center">
                      {avg === '—' ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${
                            parseInt(avg) >= 70
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          }`}
                        >
                          {avg}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Row count footer */}
          {filteredStudents.length > 0 && (
            <div className="px-4 py-2 border-t border-border bg-muted/20 text-xs text-muted-foreground text-right">
              Showing {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
