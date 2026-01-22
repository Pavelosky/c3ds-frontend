import { devicesAPI } from '../api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { participantDevicesAPI } from '../api/client';

export function useDevices() {
  return useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
        const response = await devicesAPI.getDevices();
        return response.data.results || [];
      },
  });
}

/**
 * Hook to fetch the current user's devices.
 * Returns paginated results from /api/v1/devices/participant/
 */
export function useMyDevices() {
  return useQuery({
    queryKey: ['myDevices'],
    queryFn: async () => {
      const response = await participantDevicesAPI.getMyDevices();
      return response.data.results || [];
    },
  });
}