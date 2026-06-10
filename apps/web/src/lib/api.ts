import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30_000,
});

// Store for the auth state — imported lazily to avoid circular dependencies
let getAccessToken: (() => string | null) | null = null;
let clearAuth: (() => void) | null = null;
let refreshTokenFn: (() => Promise<string>) | null = null;

export function initApiInterceptors(
  tokenGetter: () => string | null,
  authClearer: () => void,
  tokenRefresher: () => Promise<string>
) {
  getAccessToken = tokenGetter;
  clearAuth = authClearer;
  refreshTokenFn = tokenRefresher;
}

// Request interceptor — attach Bearer token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken?.();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Flag to avoid infinite refresh loops
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  refreshQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  refreshQueue = [];
}

// Response interceptor — handle 401 with token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

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
        if (!refreshTokenFn) {throw new Error('No refresh function');}
        const newToken = await refreshTokenFn();
        processQueue(null, newToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth?.();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Normalize error shape
    const normalized = normalizeError(error);
    return Promise.reject(normalized);
  }
);

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

function normalizeError(error: AxiosError): ApiError {
  if (error.response) {
    const data = error.response.data as Record<string, unknown>;
    return {
      message:
        (data?.message as string) ||
        (data?.error as string) ||
        `Request failed with status ${error.response.status}`,
      statusCode: error.response.status,
      errors: data?.errors as Record<string, string[]> | undefined,
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
export const apiGet = <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> =>
  api.get<T>(url, config).then((res) => res.data);

export const apiPost = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> =>
  api.post<T>(url, data, config).then((res) => res.data);

export const apiPut = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> =>
  api.put<T>(url, data, config).then((res) => res.data);

export const apiPatch = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> =>
  api.patch<T>(url, data, config).then((res) => res.data);

export const apiDelete = <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> =>
  api.delete<T>(url, config).then((res) => res.data);

export default api;
