import { useQuery } from '@tanstack/react-query';
import { messagesApi } from '../api/messagesApi';

/**
 * React Query hook for fetching device messages.
 *
 * @param {Object} filters - Filter parameters for messages
 * @param {string} filters.message_type - Filter by message type ("alert", "heartbeat", or null for all)
 * @param {string} filters.time_window - Time window filter ("1h", "24h", "7d", "all")
 * @param {number} filters.limit - Number of messages to return (default: 50)
 *
 * @returns {Object} React Query result with data, isLoading, error, and refetch
 *
 * Features:
 * - Automatic refetching every 10 seconds
 * - Keeps previous data while refetching (prevents UI flickering)
 * - Cache key includes filters for separate caching per filter combination
 *
 * Example usage:
 * const { data: messages, isLoading, error } = useMessages({
 *   message_type: 'alert',
 *   time_window: '24h',
 *   limit: 50
 * });
 */
export function useMessages(filters = {}) {
  return useQuery({
    queryKey: ['messages', filters],
    queryFn: () => messagesApi.getMessages(filters),
    refetchInterval: 10000, // Refetch every 10 seconds for near-real-time updates
    staleTime: 5000, // Consider data stale after 5 seconds
    keepPreviousData: true, // Prevent UI flicker during refetch
  });
}