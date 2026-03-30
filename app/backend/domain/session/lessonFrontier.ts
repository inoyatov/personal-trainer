import type { CourseRepository } from '../../db/repositories/courseRepository';
import type { ContentRepository } from '../../db/repositories/contentRepository';
import type { ReviewRepository } from '../../db/repositories/reviewRepository';
import { stageIndex } from '../scheduler/masteryStages';

/** Minimum stage index for a vocab item to count as "mastered" (>= recalled) */
const RECALLED_STAGE_INDEX = stageIndex('recalled');

/** Threshold: fraction of vocab items that must be mastered to unlock next lesson */
const UNLOCK_THRESHOLD = 0.8;

export interface LessonFrontierService {
  getCurrentFrontierLesson(userId: string, courseId: string): string | null;
  isLessonUnlocked(userId: string, lessonId: string): boolean;
  getLessonUnlockStatus(
    userId: string,
    courseId: string,
  ): Array<{ lessonId: string; unlocked: boolean }>;
}

export function createLessonFrontierService(
  courseRepo: CourseRepository,
  contentRepo: ContentRepository,
  reviewRepo: ReviewRepository,
): LessonFrontierService {
  /**
   * Get all lessons for a course in order (module order, then lesson order).
   */
  function getOrderedLessons(courseId: string) {
    const mods = courseRepo.getModulesByCourse(courseId);
    const allLessons: Array<{ id: string; moduleId: string }> = [];

    for (const mod of mods) {
      const lessonsInModule = courseRepo.getLessonsByModule(mod.id);
      for (const lesson of lessonsInModule) {
        allLessons.push(lesson);
      }
    }

    return allLessons;
  }

  /**
   * Get the fraction of vocabulary items in a lesson that are at stage >= 'recalled'.
   */
  function getLessonMasteryFraction(userId: string, lessonId: string): number {
    const classGroupsList = courseRepo.getClassGroupsByLesson(lessonId);
    const vocabClassGroups = classGroupsList.filter(
      (cg) => cg.type === 'vocabulary',
    );

    let totalVocab = 0;
    let masteredVocab = 0;

    for (const cg of vocabClassGroups) {
      const vocabItems = contentRepo.getVocabularyByClassGroup(cg.id);
      totalVocab += vocabItems.length;

      for (const item of vocabItems) {
        const reviewState = reviewRepo.getReviewState(
          userId,
          'vocabulary',
          item.id,
        );
        if (reviewState && stageIndex(reviewState.currentStage as any) >= RECALLED_STAGE_INDEX) {
          masteredVocab++;
        }
      }
    }

    if (totalVocab === 0) return 1; // No vocab means lesson is trivially mastered
    return masteredVocab / totalVocab;
  }

  return {
    getCurrentFrontierLesson(userId: string, courseId: string): string | null {
      const orderedLessons = getOrderedLessons(courseId);
      if (orderedLessons.length === 0) return null;

      for (const lesson of orderedLessons) {
        const fraction = getLessonMasteryFraction(userId, lesson.id);
        if (fraction < UNLOCK_THRESHOLD) {
          return lesson.id;
        }
      }

      // All lessons mastered — return null (no frontier)
      return null;
    },

    isLessonUnlocked(userId: string, lessonId: string): boolean {
      // Find the lesson and its course context
      const lesson = courseRepo.getLessonById(lessonId);
      if (!lesson) return false;

      const mod = courseRepo.getModuleById(lesson.moduleId);
      if (!mod) return false;

      const orderedLessons = getOrderedLessons(mod.courseId);
      const lessonIndex = orderedLessons.findIndex((l) => l.id === lessonId);

      // First lesson is always unlocked
      if (lessonIndex <= 0) return lessonIndex === 0;

      // Check if previous lesson has >= 80% mastery
      const prevLesson = orderedLessons[lessonIndex - 1];
      const fraction = getLessonMasteryFraction(userId, prevLesson.id);
      return fraction >= UNLOCK_THRESHOLD;
    },

    getLessonUnlockStatus(
      userId: string,
      courseId: string,
    ): Array<{ lessonId: string; unlocked: boolean }> {
      const orderedLessons = getOrderedLessons(courseId);
      const result: Array<{ lessonId: string; unlocked: boolean }> = [];

      for (let i = 0; i < orderedLessons.length; i++) {
        if (i === 0) {
          result.push({ lessonId: orderedLessons[i].id, unlocked: true });
        } else {
          const prevFraction = getLessonMasteryFraction(
            userId,
            orderedLessons[i - 1].id,
          );
          result.push({
            lessonId: orderedLessons[i].id,
            unlocked: prevFraction >= UNLOCK_THRESHOLD,
          });
        }
      }

      return result;
    },
  };
}
