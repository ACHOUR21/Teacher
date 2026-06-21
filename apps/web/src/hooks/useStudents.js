'use client';
import { useQuery, useMutation, useQueryClient, } from '@tanstack/react-query';

import { api, apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
export const studentKeys = {
    all: ['students'],
    lists: () => [...studentKeys.all, 'list'],
    list: (params) => [...studentKeys.lists(), params],
    details: () => [...studentKeys.all, 'detail'],
    detail: (id) => [...studentKeys.details(), id],
};
export function useStudents(params = {}, options) {
    return useQuery({
        queryKey: studentKeys.list(params),
        queryFn: () => api
            .get(`/students${buildQueryString(params)}`)
            .then(r => r.data.data),
        ...options,
    });
}
export function useStudent(id, options) {
    return useQuery({
        queryKey: studentKeys.detail(id),
        queryFn: () => apiGet(`/students/${id}`),
        enabled: !!id,
        ...options,
    });
}
export function useCreateStudent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => apiPost('/students', data),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: studentKeys.lists() });
        },
    });
}
export function useUpdateStudent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => apiPatch(`/students/${id}`, data),
        onSuccess: (_, { id }) => {
            void qc.invalidateQueries({ queryKey: studentKeys.detail(id) });
            void qc.invalidateQueries({ queryKey: studentKeys.lists() });
        },
    });
}
export function useDeleteStudent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => apiDelete(`/students/${id}`),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: studentKeys.lists() });
        },
    });
}
export function useStudentProgress(studentId) {
    return useQuery({
        queryKey: [...studentKeys.detail(studentId), 'progress'],
        queryFn: () => apiGet(`/students/${studentId}/progress`),
        enabled: !!studentId,
    });
}
