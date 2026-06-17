'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';

import { api, apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';

export interface Student {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  grade?: string;
  classId?: string;
  className?: string;
  tenantId: string;
  status: 'active' | 'inactive' | 'suspended';
  enrolledCourses: number;
  completedCourses: number;
  averageProgress: number;
  lastActiveAt?: string;
  parentId?: string;
  parentName?: string;
  createdAt: string;
}

export interface StudentsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  classId?: string;
  grade?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedStudents {
  data: Student[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  email: string;
  grade?: string;
  classId?: string;
  parentId?: string;
  password?: string;
}

export interface UpdateStudentInput extends Partial<CreateStudentInput> {
  status?: 'active' | 'inactive' | 'suspended';
}

export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (params: StudentsParams) => [...studentKeys.lists(), params] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
};

export function useStudents(
  params: StudentsParams = {},
  options?: Partial<UseQueryOptions<PaginatedStudents>>
) {
  return useQuery<PaginatedStudents>({
    queryKey: studentKeys.list(params),
    queryFn: () =>
      api
        .get(`/students${buildQueryString(params as Record<string, string | number | boolean | undefined | null>)}`)
        .then(r => r.data.data as PaginatedStudents),
    ...options,
  });
}

export function useStudent(
  id: string,
  options?: Partial<UseQueryOptions<Student>>
) {
  return useQuery<Student>({
    queryKey: studentKeys.detail(id),
    queryFn: () => apiGet<Student>(`/students/${id}`),
    enabled: !!id,
    ...options,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStudentInput) =>
      apiPost<Student>('/students', data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudentInput }) =>
      apiPatch<Student>(`/students/${id}`, data),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: studentKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/students/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}

export function useStudentProgress(studentId: string) {
  return useQuery({
    queryKey: [...studentKeys.detail(studentId), 'progress'],
    queryFn: () =>
      apiGet<{
        enrollments: Array<{
          courseId: string;
          courseTitle: string;
          progress: number;
          lastAccessedAt: string;
          completedAt?: string;
        }>;
        totalStudyTime: number;
        weeklyStudyTime: number;
        streak: number;
      }>(`/students/${studentId}/progress`),
    enabled: !!studentId,
  });
}
