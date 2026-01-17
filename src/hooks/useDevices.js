import { useQuery } from '@tanstack/react-query';
import { devicesAPI } from '../api/client';

export function useDevices() {
  return useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
        const response = await devicesAPI.getDevices();
        return response.data.results || [];
      },
  });
}