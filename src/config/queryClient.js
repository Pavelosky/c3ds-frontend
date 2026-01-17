import { QueryClient } from '@tanstack/react-query';

// Configure React Query client with sensible defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes before considering it stale
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Don't retry failed requests in development to surface errors quickly
      retry: import.meta.env.DEV ? false : 3,
      // Refetch on window focus to keep data fresh
      refetchOnWindowFocus: true,
    },
    mutations: {
      // Show errors in development, handle gracefully in production
      retry: false,
    },
  },
});