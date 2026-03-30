import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useDueItems(userId?: string) {
  return useQuery({
    queryKey: ['dueItems', userId],
    queryFn: () => api.review.getDueItems(userId),
  });
}

export function useAllReviewStates(userId?: string) {
  return useQuery({
    queryKey: ['reviewStates', userId],
    queryFn: () => api.review.getAllStates(userId),
  });
}
