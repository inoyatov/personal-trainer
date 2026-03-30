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

export function useVocabCoverage(courseId: string | undefined) {
  return useQuery({
    queryKey: ['vocabCoverage', courseId],
    queryFn: () => api.progress.getVocabCoverage(courseId!),
    enabled: !!courseId,
  });
}

export function useTotalVocabCoverage() {
  return useQuery({
    queryKey: ['totalVocabCoverage'],
    queryFn: () => api.progress.getTotalVocabCoverage(),
  });
}

export function useLessonUnlockStatus(courseId: string | undefined) {
  return useQuery({
    queryKey: ['lessonUnlockStatus', courseId],
    queryFn: () => api.progress.getLessonUnlockStatus(courseId!),
    enabled: !!courseId,
  });
}
