import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../api/client';

/**
 * React Query hook for fetching dashboard statistics.
 *
 * @returns {Object} React Query result with stats data, isLoading, error
 *
 * Features:
 * - Automatic refetching every 30 seconds
 * - Keeps previous data while refetching (prevents UI flickering)
 *
 * Example usage:
 * const { data: stats, isLoading, error } = useStats();
 * // stats.active_devices, stats.alerts_last_2h
 */
export function useStats() {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await dashboardAPI.getStats();
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
    keepPreviousData: true, // Prevent UI flicker during refetch
  });
}
