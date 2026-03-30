import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useLessonProgress(lessonId: string | undefined, userId?: string) {
  return useQuery({
    queryKey: ['lessonProgress', lessonId, userId],
    queryFn: () => api.progress.getLesson(lessonId!, userId),
    enabled: !!lessonId,
  });
}

export function useAllProgress(userId?: string) {
  return useQuery({
    queryKey: ['allProgress', userId],
    queryFn: () => api.progress.getAll(userId),
  });
}
