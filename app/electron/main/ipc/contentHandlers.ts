import { ipcMain } from 'electron';
import { Channels } from '../../../shared/contracts/channels';
import {
  getModulesRequest,
  getLessonsRequest,
  getLessonContentRequest,
  getVocabularyRequest,
  getSentencesRequest,
  getDialogsRequest,
  getDialogTurnsRequest,
  getGrammarPatternsRequest,
} from '../../../shared/contracts/schemas';
import type { CourseRepository } from '../../../backend/db/repositories/courseRepository';
import type { ContentRepository } from '../../../backend/db/repositories/contentRepository';

export function registerContentHandlers(
  courseRepo: CourseRepository,
  contentRepo: ContentRepository,
) {
  ipcMain.handle(Channels.CONTENT_GET_COURSES, () => {
    return courseRepo.getAllCourses();
  });

  ipcMain.handle(Channels.CONTENT_GET_MODULES, (_event, data: unknown) => {
    const { courseId } = getModulesRequest.parse(data);
    return courseRepo.getModulesByCourse(courseId);
  });

  ipcMain.handle(Channels.CONTENT_GET_LESSONS, (_event, data: unknown) => {
    const { moduleId } = getLessonsRequest.parse(data);
    return courseRepo.getLessonsByModule(moduleId);
  });

  ipcMain.handle(
    Channels.CONTENT_GET_LESSON_CONTENT,
    (_event, data: unknown) => {
      const { lessonId } = getLessonContentRequest.parse(data);
      const lesson = courseRepo.getLessonById(lessonId);
      const classGroups = courseRepo.getClassGroupsByLesson(lessonId);
      const sentences = contentRepo.getSentencesByLesson(lessonId);
      const dialogs = contentRepo.getDialogsByLesson(lessonId);
      const grammarPatterns = contentRepo.getGrammarPatternsByLesson(lessonId);
      return { lesson, classGroups, sentences, dialogs, grammarPatterns };
    },
  );

  ipcMain.handle(Channels.CONTENT_GET_VOCABULARY, (_event, data: unknown) => {
    const { classGroupId } = getVocabularyRequest.parse(data);
    return contentRepo.getVocabularyByClassGroup(classGroupId);
  });

  ipcMain.handle(Channels.CONTENT_GET_SENTENCES, (_event, data: unknown) => {
    const { lessonId } = getSentencesRequest.parse(data);
    return contentRepo.getSentencesByLesson(lessonId);
  });

  ipcMain.handle(Channels.CONTENT_GET_DIALOGS, (_event, data: unknown) => {
    const { lessonId } = getDialogsRequest.parse(data);
    return contentRepo.getDialogsByLesson(lessonId);
  });

  ipcMain.handle(
    Channels.CONTENT_GET_DIALOG_TURNS,
    (_event, data: unknown) => {
      const { dialogId } = getDialogTurnsRequest.parse(data);
      return contentRepo.getTurnsByDialog(dialogId);
    },
  );

  ipcMain.handle(
    Channels.CONTENT_GET_GRAMMAR_PATTERNS,
    (_event, data: unknown) => {
      const { lessonId } = getGrammarPatternsRequest.parse(data);
      return contentRepo.getGrammarPatternsByLesson(lessonId);
    },
  );

  ipcMain.handle(Channels.CONTENT_DELETE_COURSE, (_event, data: unknown) => {
    const { courseId } = (data as any);
    courseRepo.deleteCourse(courseId);
    return { success: true };
  });

  ipcMain.handle(Channels.CONTENT_DELETE_MODULE, (_event, data: unknown) => {
    const { moduleId } = (data as any);
    courseRepo.deleteModule(moduleId);
    return { success: true };
  });

  ipcMain.handle(Channels.CONTENT_DELETE_LESSON, (_event, data: unknown) => {
    const { lessonId } = (data as any);
    courseRepo.deleteLesson(lessonId);
    return { success: true };
  });
}
