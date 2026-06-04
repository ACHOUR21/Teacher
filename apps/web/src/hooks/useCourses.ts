'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';

export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'archived';
  price: number;
  currency: string;
  teacherId: string;
  teacherName: string;
  teacherAvatar?: string;
  tenantId: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  enrollmentCount: number;
  completionRate: number;
  totalLessons: number;
  totalDuration: number; // seconds
  sections: CourseSection[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseSection {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  duration?: number;
  order: number;
  isPreview: boolean;
  isCompleted?: boolean;
  videoUrl?: string;
  content?: string;
}

export interface CoursesParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  level?: string;
  status?: string;
  teacherId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedCourses {
  data: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCourseInput {
  title: string;
  description: string;
  shortDescription?: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  currency?: string;
  tags?: string[];
  thumbnailUrl?: string;
}

export interface UpdateCourseInput extends Partial<CreateCourseInput> {
  status?: 'draft' | 'published' | 'archived';
}

export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (params: CoursesParams) => [...courseKeys.lists(), params] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
};

export function useCourses(
  params: CoursesParams = {},
  options?: Partial<UseQueryOptions<PaginatedCourses>>
) {
  return useQuery<PaginatedCourses>({
    queryKey: courseKeys.list(params),
    queryFn: () =>
      apiGet<PaginatedCourses>(`/courses${buildQueryString(params as Record<string, string | number | boolean | undefined | null>)}`),
    ...options,
  });
}

export function useCourse(
  id: string,
  options?: Partial<UseQueryOptions<Course>>
) {
  return useQuery<Course>({
    queryKey: courseKeys.detail(id),
    queryFn: () => apiGet<Course>(`/courses/${id}`),
    enabled: !!id,
    ...options,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCourseInput) =>
      apiPost<Course>('/courses', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCourseInput }) =>
      apiPatch<Course>(`/courses/${id}`, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: courseKeys.detail(id) });
      qc.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/courses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
}

export function usePublishCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPatch<Course>(`/courses/${id}/publish`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: courseKeys.detail(id) });
      qc.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
}

export function useCourseEnrollments(courseId: string) {
  return useQuery({
    queryKey: [...courseKeys.detail(courseId), 'enrollments'],
    queryFn: () =>
      apiGet<{
        data: Array<{
          id: string;
          studentId: string;
          studentName: string;
          studentEmail: string;
          studentAvatar?: string;
          progress: number;
          enrolledAt: string;
          lastAccessedAt?: string;
          completedAt?: string;
        }>;
        total: number;
      }>(`/courses/${courseId}/enrollments`),
    enabled: !!courseId,
  });
}
