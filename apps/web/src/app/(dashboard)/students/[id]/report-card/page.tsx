'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import {
  ArrowLeft,
  Printer,
  Award,
  BookOpen,
  Star,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  School,
  GraduationCap,
  BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportCardStudent {
  id: string;
  studentId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  grade: string | null;
  class: string | null;
  school: string | null;
  gpa: number | null;
}

interface ReportCardSummary {
  avgScore: number | null;
  attendanceRate: number | null;
  completedCourses: number;
  inProgressCourses: number;
  certificatesEarned: number;
  totalPoints: number;
  quizzesTaken: number;
  quizPassRate: number | null;
}

interface AssignmentEntry {
  title: string;
  score: number | null;
  maxScore: number;
  percentage: number;
  gradedAt: string | null;
  feedback: string | null;
}

interface CourseEntry {
  title: string;
  category: string | null;
  progress: number;
  completed: boolean;
  completedAt: string | null;
}

interface CertificateEntry {
  name: string | null;
  course: string | null;
  issuedAt: string;
  verifyCode: string | null;
}

interface QuizEntry {
  quiz: string;
  score: number;
  passed: boolean;
  date: string;
}

interface AttendanceSummary {
  rate: number | null;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

interface ReportCard {
  student: ReportCardStudent;
  summary: ReportCardSummary;
  assignments: AssignmentEntry[];
  courses: CourseEntry[];
  certificates: CertificateEntry[];
  quizAttempts: QuizEntry[];
  attendance: AttendanceSummary;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gradeLetter(pct: number): string {
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
}

function gradeColor(pct: number): string {
  if (pct >= 90) return 'text-green-600';
  if (pct >= 80) return 'text-blue-600';
  if (pct >= 70) return 'text-yellow-600';
  if (pct >= 60) return 'text-orange-600';
  return 'text-red-600';
}

function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-start gap-4">
      <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0', color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={cn(
          'h-full rounded-full transition-all',
          clamped >= 100
            ? 'bg-green-500'
            : clamped >= 70
            ? 'bg-blue-500'
            : clamped >= 40
            ? 'bg-yellow-400'
            : 'bg-red-400',
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

// ─── Attendance Pill ──────────────────────────────────────────────────────────

function AttendancePill({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className={cn('rounded-xl px-4 py-3 flex flex-col items-center gap-1', color)}>
      <span className="text-xl font-bold">{count}</span>
      <span className="text-xs font-medium opacity-80">{label}</span>
      <span className="text-xs opacity-60">{pct}%</span>
    </div>
  );
}

// ─── Section Heading ──────────────────────────────────────────────────────────

function SectionHeading({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-5 w-5 text-blue-600" />
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentReportCardPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery<ReportCard>({
    queryKey: ['report-card', id],
    queryFn: () => apiGet<ReportCard>(`/students/${id}/report-card`),
    enabled: !!id,
  });

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-40 bg-gray-100 rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
          ))}
        </div>
        <div className="h-60 bg-gray-100 rounded-2xl" />
        <div className="h-60 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <p className="text-gray-700 font-medium">Failed to load report card</p>
        <Link
          href="/students"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Students
        </Link>
      </div>
    );
  }

  const { student, summary, assignments, courses, certificates, quizAttempts, attendance } = data;
  const initials =
    `${student.firstName?.[0] ?? ''}${student.lastName?.[0] ?? ''}`.toUpperCase() || '?';

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print-page { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Top nav */}
        <div className="flex items-center justify-between no-print">
          <Link
            href={`/students`}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Students
          </Link>
          <button
            onClick={() => window.print()}
            className="no-print flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print Report Card
          </button>
        </div>

        {/* Header / Student Info */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print-page">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium uppercase tracking-widest">
                  Official Student Report Card
                </p>
                <p className="text-white text-xs mt-1 opacity-70">Generated: {today}</p>
              </div>
              {student.school && (
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-white/80 text-sm justify-end">
                    <School className="h-4 w-4" />
                    {student.school}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-8 py-6 flex items-center gap-6">
            {/* Avatar */}
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-lg">
              {student.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={student.avatarUrl}
                  alt={initials}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">
                {student.firstName} {student.lastName}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">{student.email}</p>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
                {student.studentId && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <User className="h-3.5 w-3.5" />
                    <span className="font-mono">{student.studentId}</span>
                  </div>
                )}
                {(student.grade || student.class) && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {[student.class, student.grade].filter(Boolean).join(' · ')}
                  </div>
                )}
                {student.gpa != null && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Star className="h-3.5 w-3.5" />
                    GPA: <span className="font-semibold text-gray-900">{student.gpa}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard
            label="Assignment Avg"
            value={summary.avgScore != null ? `${summary.avgScore}%` : 'N/A'}
            sub={
              summary.avgScore != null
                ? `Grade: ${gradeLetter(summary.avgScore)}`
                : 'No graded work'
            }
            icon={BarChart2}
            color="bg-blue-500"
          />
          <SummaryCard
            label="Attendance Rate"
            value={summary.attendanceRate != null ? `${summary.attendanceRate}%` : 'N/A'}
            sub={`${attendance.present} days present`}
            icon={CheckCircle}
            color={
              (summary.attendanceRate ?? 0) >= 80
                ? 'bg-green-500'
                : (summary.attendanceRate ?? 0) >= 60
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }
          />
          <SummaryCard
            label="Courses Completed"
            value={String(summary.completedCourses)}
            sub={`${summary.inProgressCourses} in progress`}
            icon={BookOpen}
            color="bg-indigo-500"
          />
          <SummaryCard
            label="Points Earned"
            value={summary.totalPoints.toLocaleString()}
            sub={`${summary.certificatesEarned} certificate${summary.certificatesEarned !== 1 ? 's' : ''}`}
            icon={Award}
            color="bg-purple-500"
          />
        </div>

        {/* Courses Progress */}
        {courses.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 print-page">
            <SectionHeading icon={BookOpen} title="Course Progress" />
            <div className="space-y-3">
              {courses.map((course, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                      {course.category && (
                        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                          {course.category}
                        </span>
                      )}
                      {course.completed && (
                        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Completed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <ProgressBar value={course.progress ?? 0} />
                      <span className="text-xs font-medium text-gray-500 w-10 text-right shrink-0">
                        {course.progress ?? 0}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assignment Grades */}
        {assignments.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print-page">
            <div className="px-6 pt-6 pb-4">
              <SectionHeading icon={TrendingUp} title="Assignment Grades" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Assignment', 'Score', 'Percentage', 'Grade', 'Graded On'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {assignments.map((a, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{a.title}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {a.score ?? '—'} / {a.maxScore}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                a.percentage >= 90
                                  ? 'bg-green-500'
                                  : a.percentage >= 70
                                  ? 'bg-blue-500'
                                  : a.percentage >= 60
                                  ? 'bg-yellow-400'
                                  : 'bg-red-400',
                              )}
                              style={{ width: `${a.percentage}%` }}
                            />
                          </div>
                          <span className="text-gray-600">{a.percentage}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold',
                            a.percentage >= 90
                              ? 'bg-green-100 text-green-700'
                              : a.percentage >= 80
                              ? 'bg-blue-100 text-blue-700'
                              : a.percentage >= 70
                              ? 'bg-yellow-100 text-yellow-700'
                              : a.percentage >= 60
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700',
                          )}
                        >
                          {gradeLetter(a.percentage)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(a.gradedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quiz Performance */}
        {quizAttempts.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 print-page">
            <SectionHeading icon={Star} title="Quiz Performance" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {quizAttempts.map((q, i) => (
                <div
                  key={i}
                  className={cn(
                    'rounded-xl border p-4 flex items-start gap-3',
                    q.passed ? 'border-green-200 bg-green-50' : 'border-red-100 bg-red-50',
                  )}
                >
                  <div
                    className={cn(
                      'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
                      q.passed ? 'bg-green-500' : 'bg-red-400',
                    )}
                  >
                    {q.passed ? (
                      <CheckCircle className="h-4 w-4 text-white" />
                    ) : (
                      <XCircle className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{q.quiz}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={cn(
                          'text-lg font-bold',
                          q.passed ? 'text-green-700' : 'text-red-600',
                        )}
                      >
                        {q.score}%
                      </span>
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          q.passed
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600',
                        )}
                      >
                        {q.passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(q.date)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quiz summary bar */}
            {summary.quizzesTaken > 0 && summary.quizPassRate != null && (
              <div className="mt-4 flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span>Quiz Pass Rate</span>
                    <span className="font-semibold text-gray-900">{summary.quizPassRate}%</span>
                  </div>
                  <ProgressBar value={summary.quizPassRate} />
                </div>
                <div className="text-right text-xs text-gray-400 shrink-0">
                  <p>{summary.quizzesTaken} quizzes taken</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Attendance */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 print-page">
          <SectionHeading icon={Calendar} title="Attendance" />

          <div className="flex items-center gap-6 flex-wrap">
            {/* Rate */}
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  'text-5xl font-bold',
                  (attendance.rate ?? 0) >= 80
                    ? 'text-green-600'
                    : (attendance.rate ?? 0) >= 60
                    ? 'text-yellow-600'
                    : 'text-red-600',
                )}
              >
                {attendance.rate != null ? `${attendance.rate}%` : 'N/A'}
              </span>
              <span className="text-xs text-gray-400">Attendance Rate</span>
              <span className="text-xs text-gray-400">(last 90 days)</span>
            </div>

            {/* Separator */}
            <div className="h-16 w-px bg-gray-200 hidden sm:block" />

            {/* Pills */}
            <div className="flex flex-wrap gap-3">
              <AttendancePill
                label="Present"
                count={attendance.present}
                total={attendance.total}
                color="bg-green-50 text-green-700"
              />
              <AttendancePill
                label="Absent"
                count={attendance.absent}
                total={attendance.total}
                color="bg-red-50 text-red-600"
              />
              <AttendancePill
                label="Late"
                count={attendance.late}
                total={attendance.total}
                color="bg-yellow-50 text-yellow-700"
              />
              <AttendancePill
                label="Excused"
                count={attendance.excused}
                total={attendance.total}
                color="bg-gray-100 text-gray-600"
              />
            </div>

            {/* Total */}
            <div className="ml-auto text-right text-xs text-gray-400">
              <div className="flex items-center gap-1.5 justify-end">
                <Clock className="h-3.5 w-3.5" />
                {attendance.total} days recorded
              </div>
            </div>
          </div>
        </div>

        {/* Certificates */}
        {certificates.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 print-page">
            <SectionHeading icon={Award} title="Certificates Earned" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {certificates.map((cert, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl border border-yellow-100 bg-gradient-to-r from-yellow-50 to-amber-50"
                >
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shrink-0">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {cert.name ?? cert.course ?? 'Certificate'}
                    </p>
                    {cert.course && cert.name && (
                      <p className="text-xs text-gray-500 truncate">{cert.course}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      Issued: {formatDate(cert.issuedAt)}
                    </p>
                  </div>
                  {cert.verifyCode && (
                    <span className="text-xs font-mono text-amber-600 bg-amber-100 px-2 py-0.5 rounded shrink-0">
                      {cert.verifyCode}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 py-4 no-print">
          Report generated on {today} &bull; EduAI Platform
        </div>
      </div>
    </>
  );
}
