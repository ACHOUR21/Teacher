'use client';
import { useQuery, useMutation, useQueryClient, } from '@tanstack/react-query';

import { api, apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
export const courseKeys = {
    all: ['courses'],
    lists: () => [...courseKeys.all, 'list'],
    list: (params) => [...courseKeys.lists(), params],
    details: () => [...courseKeys.all, 'detail'],
    detail: (id) => [...courseKeys.details(), id],
};
export function useCourses(params = {}, options) {
    return useQuery({
        queryKey: courseKeys.list(params),
        queryFn: () => api
            .get(`/courses${buildQueryString(params)}`)
            .then(r => r.data.data),
        ...options,
    });
}
export function useCourse(id, options) {
    return useQuery({
        queryKey: courseKeys.detail(id),
        queryFn: () => apiGet(`/courses/${id}`),
        enabled: !!id,
        ...options,
    });
}
export function useCreateCourse() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => apiPost('/courses', data),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: courseKeys.lists() });
        },
    });
}
export function useUpdateCourse() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => apiPatch(`/courses/${id}`, data),
        onSuccess: (_, { id }) => {
            void qc.invalidateQueries({ queryKey: courseKeys.detail(id) });
            void qc.invalidateQueries({ queryKey: courseKeys.lists() });
        },
    });
}
export function useDeleteCourse() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => apiDelete(`/courses/${id}`),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: courseKeys.lists() });
        },
    });
}
export function usePublishCourse() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => apiPatch(`/courses/${id}/publish`),
        onSuccess: (_, id) => {
            void qc.invalidateQueries({ queryKey: courseKeys.detail(id) });
            void qc.invalidateQueries({ queryKey: courseKeys.lists() });
        },
    });
}
export function useCourseEnrollments(courseId) {
    return useQuery({
        queryKey: [...courseKeys.detail(courseId), 'enrollments'],
        queryFn: () => apiGet(`/courses/${courseId}/enrollments`),
        enabled: !!courseId,
    });
}
