'use client';

import { useQuery } from '@tanstack/react-query';
import {
  GraduationCap, Users, BookOpen, Building2, Calendar, ChevronRight, Plus,
} from 'lucide-react';
import Link from 'next/link';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface DashboardStats {
  departmentCount: number;
  facultyCount: number;
  enrolledStudents: number;
  activeSemesterName: string | null;
}

interface Department {
  id: string;
  name: string;
  code: string;
  headFacultyId?: string | null;
  _count: { faculty: number; courses: number };
}

export default function UniversityPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['university-dashboard-stats'],
    queryFn: () => api.get('/university/dashboard').then((r) => r.data.data ?? r.data),
  });

  const { data: departments, isLoading: deptsLoading } = useQuery<Department[]>({
    queryKey: ['university-departments'],
    queryFn: () =>
      api.get('/university/departments').then((r) => r.data.data ?? r.data ?? []),
  });

  const kpis = [
    {
      label: 'Departments',
      value: stats?.departmentCount ?? '—',
      icon: Building2,
      color: 'bg-indigo-50 text-indigo-600',
      link: '/university/departments',
    },
    {
      label: 'Faculty Members',
      value: stats?.facultyCount ?? '—',
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
      link: '/university/departments',
    },
    {
      label: 'Enrolled Students',
      value: stats?.enrolledStudents ?? '—',
      icon: GraduationCap,
      color: 'bg-green-50 text-green-600',
      link: '/university',
    },
    {
      label: 'Active Semester',
      value: stats?.activeSemesterName ?? '—',
      icon: Calendar,
      color: 'bg-amber-50 text-amber-600',
      link: '/university',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-indigo-600" />
            University ERP
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage departments, faculty, courses, semesters, and student enrollment
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
          >
            <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center mb-3', kpi.color)}>
              <kpi.icon className="h-4.5 w-4.5" />
            </div>
            {statsLoading ? (
              <div className="h-7 w-16 bg-gray-100 rounded animate-pulse mb-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{String(kpi.value)}</p>
            )}
            <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: 'Manage Departments',
              description: 'View and create university departments',
              icon: Building2,
              href: '/university/departments',
              color: 'bg-indigo-50',
              iconColor: 'text-indigo-600',
            },
            {
              label: 'Faculty Directory',
              description: 'Browse faculty members by department',
              icon: Users,
              href: '/university/departments',
              color: 'bg-purple-50',
              iconColor: 'text-purple-600',
            },
            {
              label: 'View Courses',
              description: 'Browse all university courses',
              icon: BookOpen,
              href: '/university',
              color: 'bg-blue-50',
              iconColor: 'text-blue-600',
            },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0', action.color)}>
                <action.icon className={cn('h-4 w-4', action.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{action.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{action.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Department Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Departments</h3>
          <Link
            href="/university/departments"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Department
          </Link>
        </div>

        {deptsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="h-4 w-32 bg-gray-100 rounded mb-2" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : !departments || departments.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 py-14 text-center">
            <Building2 className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">No departments yet</p>
            <Link
              href="/university/departments"
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Create First Department
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {dept.code}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">{dept.name}</h4>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {dept._count?.faculty ?? 0} faculty
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {dept._count?.courses ?? 0} courses
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
