import { QueryClient } from '@tanstack/react-query';
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            retry: (failureCount, error) => {
                // Don't retry on 4xx errors (except 429 rate limit)
                const status = error?.statusCode;
                if (status && status >= 400 && status < 500 && status !== 429) {
                    return false;
                }
                return failureCount < 3;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: false,
        },
    },
});
