import axios from 'axios';
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
    timeout: 30_000,
});
// Store for the auth state — imported lazily to avoid circular dependencies
let getAccessToken = null;
let getTenantId = null;
let clearAuth = null;
let refreshTokenFn = null;
export function initApiInterceptors(tokenGetter, authClearer, tokenRefresher, tenantIdGetter) {
    getAccessToken = tokenGetter;
    clearAuth = authClearer;
    refreshTokenFn = tokenRefresher;
    getTenantId = tenantIdGetter ?? null;
}
// Request interceptor — attach Bearer token and X-Tenant-ID
api.interceptors.request.use((config) => {
    const token = getAccessToken?.();
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    const tenantId = getTenantId?.();
    if (tenantId && config.headers) {
        config.headers['X-Tenant-ID'] = tenantId;
    }
    return config;
}, (error) => Promise.reject(error));
// Flag to avoid infinite refresh loops
let isRefreshing = false;
let refreshQueue = [];
function processQueue(error, token = null) {
    refreshQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        }
        else if (token) {
            promise.resolve(token);
        }
    });
    refreshQueue = [];
}
// Response interceptor — handle 401 with token refresh
api.interceptors.response.use((response) => response, async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                refreshQueue.push({ resolve, reject });
            })
                .then((token) => {
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${String(token)}`;
                }
                return api(originalRequest);
            })
                .catch((err) => Promise.reject(err));
        }
        originalRequest._retry = true;
        isRefreshing = true;
        try {
            if (!refreshTokenFn) {
                throw new Error('No refresh function');
            }
            const newToken = await refreshTokenFn();
            processQueue(null, newToken);
            if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return api(originalRequest);
        }
        catch (refreshError) {
            processQueue(refreshError, null);
            clearAuth?.();
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
            return Promise.reject(refreshError);
        }
        finally {
            isRefreshing = false;
        }
    }
    // Normalize error shape
    const normalized = normalizeError(error);
    return Promise.reject(normalized);
});
function normalizeError(error) {
    if (error.response) {
        const data = error.response.data;
        return {
            message: data?.message ||
                data?.error ||
                `Request failed with status ${error.response.status}`,
            statusCode: error.response.status,
            errors: data?.errors,
        };
    }
    if (error.request) {
        return {
            message: 'Network error — please check your connection',
            statusCode: 0,
        };
    }
    return {
        message: error.message || 'An unexpected error occurred',
        statusCode: 0,
    };
}
// Typed API helpers
export const apiGet = (url, config) => api.get(url, config).then((res) => res.data);
export const apiPost = (url, data, config) => api.post(url, data, config).then((res) => res.data);
export const apiPut = (url, data, config) => api.put(url, data, config).then((res) => res.data);
export const apiPatch = (url, data, config) => api.patch(url, data, config).then((res) => res.data);
export const apiDelete = (url, config) => api.delete(url, config).then((res) => res.data);
export default api;
