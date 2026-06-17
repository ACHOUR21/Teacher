'use client';

import { useQuery } from '@tanstack/react-query';
import { GraduationCap, BookOpen, Award, ChevronLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface TranscriptEnrollment {
  id: string;
  status: string;
  grade: number | null;
  letterGrade: string | null;
  enrolledAt: string;
  course: {
    id: string;
    title: string;
    credits: number;
  };
  semester: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
}

interface Transcript {
  student: {
    id: string;
    studentId: string | null;
    gpa: number | null;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl?: string | null;
    };
  };
  enrollments: TranscriptEnrollment[];
  cumulativeGpa: number;
  totalCredits: number;
  totalCourses: number;
}

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-green-100 text-green-700',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-orange-100 text-orange-700',
  F: 'bg-red-100 text-red-700',
};

function gpaToColor(gpa: number): string {
  if (gpa >= 3.5) return 'text-green-600';
  if (gpa >= 3.0) return 'text-blue-600';
  if (gpa >= 2.0) return 'text-yellow-600';
  return 'text-red-600';
}

export default function TranscriptPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);

  const { data: transcript, isLoading, error } = useQuery<Transcript>({
    queryKey: ['university-transcript', studentId],
    queryFn: () =>
      api.get(`/university/transcript/${studentId}`).then((r) => r.data.data ?? r.data),
    enabled: !!studentId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/university" className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="h-6 w-48 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-100" />
            <div className="space-y-2">
              <div className="h-5 w-40 bg-gray-100 rounded" />
              <div className="h-4 w-32 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
          <div className="h-48" />
        </div>
      </div>
    );
  }

  if (error || !transcript) {
    return (
      <div className="space-y-4">
        <Link
          href="/university"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to University
        </Link>
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 text-red-400" />
          <p className="font-medium text-gray-900">Transcript Not Found</p>
          <p className="text-sm text-gray-500 mt-1">
            No transcript found for student ID: <span className="font-mono">{studentId}</span>
          </p>
        </div>
      </div>
    );
  }

  const { student, enrollments, cumulativeGpa, totalCredits, totalCourses } = transcript;
  const initials = `${student.user.firstName[0] ?? ''}${student.user.lastName[0] ?? ''}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/university"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 w-fit"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to University
      </Link>

      {/* Student header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {student.user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={student.user.avatarUrl}
              alt={student.user.firstName}
              className="h-16 w-16 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              {student.user.firstName} {student.user.lastName}
            </h2>
            <p className="text-sm text-gray-500">{student.user.email}</p>
            {student.studentId && (
              <p className="text-xs text-gray-400 mt-0.5 font-mono">
                Student ID: {student.studentId}
              </p>
            )}
          </div>
          {/* GPA summary */}
          <div className="flex gap-6 sm:ml-auto">
            <div className="text-center">
              <p className={cn('text-3xl font-bold', gpaToColor(cumulativeGpa))}>
                {cumulativeGpa.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Cumulative GPA</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{totalCredits}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Credits</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{totalCourses}</p>
              <p className="text-xs text-gray-500 mt-0.5">Courses</p>
            </div>
          </div>
        </div>
      </div>

      {/* GPA Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg">
          <Award className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-medium text-gray-700">
            Cumulative GPA:{' '}
            <span className={cn('font-bold', gpaToColor(cumulativeGpa))}>
              {cumulativeGpa.toFixed(2)} / 4.00
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg">
          <BookOpen className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">
            {totalCredits} credits completed
          </span>
        </div>
      </div>

      {/* Transcript table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">
            Academic Transcript
          </h3>
          <span className="ml-auto text-xs text-gray-400">
            {totalCourses} completed course{totalCourses !== 1 ? 's' : ''}
          </span>
        </div>

        {enrollments.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">No completed courses found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3.5 px-5 font-medium text-gray-600">Course</th>
                  <th className="text-left py-3.5 px-5 font-medium text-gray-600">Semester</th>
                  <th className="text-center py-3.5 px-5 font-medium text-gray-600">Credits</th>
                  <th className="text-center py-3.5 px-5 font-medium text-gray-600">Score</th>
                  <th className="text-center py-3.5 px-5 font-medium text-gray-600">Grade</th>
                  <th className="text-left py-3.5 px-5 font-medium text-gray-600">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="py-3.5 px-5">
                      <p className="font-medium text-gray-900">{enrollment.course.title}</p>
                    </td>
                    <td className="py-3.5 px-5 text-gray-600">
                      {enrollment.semester.name}
                    </td>
                    <td className="py-3.5 px-5 text-center text-gray-600">
                      {enrollment.course.credits}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      {enrollment.grade !== null && enrollment.grade !== undefined ? (
                        <span className="font-medium text-gray-900">
                          {enrollment.grade.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      {enrollment.letterGrade ? (
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
                            GRADE_COLORS[enrollment.letterGrade] ?? 'bg-gray-100 text-gray-600',
                          )}
                        >
                          {enrollment.letterGrade}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-gray-500 text-xs">
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-400 text-center">
        This transcript shows only COMPLETED course enrollments. GPA is calculated on a 4.0 scale:
        A (90+) = 4.0, B (80-89) = 3.0, C (70-79) = 2.0, D (60-69) = 1.0, F (&lt;60) = 0.0
      </p>
    </div>
  );
}
