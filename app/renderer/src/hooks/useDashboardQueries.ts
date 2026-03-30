import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => api.dashboard.getStats(),
    refetchInterval: 30000, // refresh every 30s
  });
}

export function useRecentSessions() {
  return useQuery({
    queryKey: ['recentSessions'],
    queryFn: () => api.dashboard.getRecentSessions(),
    refetchInterval: 30000,
  });
}
