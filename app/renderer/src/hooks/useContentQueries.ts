import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: () => api.content.getCourses(),
  });
}

export function useModules(courseId: string | undefined) {
  return useQuery({
    queryKey: ['modules', courseId],
    queryFn: () => api.content.getModules(courseId!),
    enabled: !!courseId,
  });
}

export function useLessons(moduleId: string | undefined) {
  return useQuery({
    queryKey: ['lessons', moduleId],
    queryFn: () => api.content.getLessons(moduleId!),
    enabled: !!moduleId,
  });
}

export function useLessonContent(lessonId: string | undefined) {
  return useQuery({
    queryKey: ['lessonContent', lessonId],
    queryFn: () => api.content.getLessonContent(lessonId!),
    enabled: !!lessonId,
  });
}

export function useVocabulary(classGroupId: string | undefined) {
  return useQuery({
    queryKey: ['vocabulary', classGroupId],
    queryFn: () => api.content.getVocabulary(classGroupId!),
    enabled: !!classGroupId,
  });
}

export function useSentences(lessonId: string | undefined) {
  return useQuery({
    queryKey: ['sentences', lessonId],
    queryFn: () => api.content.getSentences(lessonId!),
    enabled: !!lessonId,
  });
}

export function useDialogs(lessonId: string | undefined) {
  return useQuery({
    queryKey: ['dialogs', lessonId],
    queryFn: () => api.content.getDialogs(lessonId!),
    enabled: !!lessonId,
  });
}

export function useDialogTurns(dialogId: string | undefined) {
  return useQuery({
    queryKey: ['dialogTurns', dialogId],
    queryFn: () => api.content.getDialogTurns(dialogId!),
    enabled: !!dialogId,
  });
}

export function useGrammarPatterns(lessonId: string | undefined) {
  return useQuery({
    queryKey: ['grammarPatterns', lessonId],
    queryFn: () => api.content.getGrammarPatterns(lessonId!),
    enabled: !!lessonId,
  });
}
