import type { CourseRepository } from '../../db/repositories/courseRepository';
import type { ContentRepository } from '../../db/repositories/contentRepository';
import type { ReviewRepository } from '../../db/repositories/reviewRepository';

export interface VocabCoverageStats {
  totalWords: number;
  wordsLearned: number;
  wordsMastered: number;
  targetWords: number;
  progressPercent: number;
}

const A2_TARGET_WORDS = 1500;

const LEARNED_STAGES = new Set(['seen', 'recognized', 'recalled', 'stable', 'automated']);
const MASTERED_STAGES = new Set(['recalled', 'stable', 'automated']);

export function computeVocabCoverage(
  courseId: string,
  userId: string,
  courseRepo: CourseRepository,
  contentRepo: ContentRepository,
  reviewRepo: ReviewRepository,
): VocabCoverageStats {
  const modules = courseRepo.getModulesByCourse(courseId);

  const vocabItemIds = new Set<string>();

  for (const mod of modules) {
    const lessons = courseRepo.getLessonsByModule(mod.id);
    for (const lesson of lessons) {
      const classGroups = courseRepo.getClassGroupsByLesson(lesson.id);
      const vocabGroups = classGroups.filter((cg: any) => cg.type === 'vocabulary');
      for (const group of vocabGroups) {
        const vocabItems = contentRepo.getVocabularyByClassGroup(group.id);
        for (const item of vocabItems) {
          vocabItemIds.add(item.id);
        }
      }
    }
  }

  const totalWords = vocabItemIds.size;
  let wordsLearned = 0;
  let wordsMastered = 0;

  for (const vocabId of vocabItemIds) {
    const reviewState = reviewRepo.getReviewState(userId, 'vocabulary', vocabId);
    if (reviewState) {
      if (LEARNED_STAGES.has(reviewState.currentStage)) {
        wordsLearned++;
      }
      if (MASTERED_STAGES.has(reviewState.currentStage)) {
        wordsMastered++;
      }
    }
  }

  const progressPercent = totalWords > 0
    ? Math.round((wordsLearned / totalWords) * 100)
    : 0;

  return {
    totalWords,
    wordsLearned,
    wordsMastered,
    targetWords: totalWords,
    progressPercent,
  };
}

/**
 * Compute vocabulary coverage across ALL courses.
 */
export function computeTotalVocabCoverage(
  userId: string,
  courseRepo: CourseRepository,
  contentRepo: ContentRepository,
  reviewRepo: ReviewRepository,
): VocabCoverageStats {
  const allCourses = courseRepo.getAllCourses();

  let totalWords = 0;
  let wordsLearned = 0;
  let wordsMastered = 0;
  const seenIds = new Set<string>();

  for (const course of allCourses) {
    const modules = courseRepo.getModulesByCourse(course.id);
    for (const mod of modules) {
      const lessons = courseRepo.getLessonsByModule(mod.id);
      for (const lesson of lessons) {
        const classGroups = courseRepo.getClassGroupsByLesson(lesson.id);
        const vocabGroups = classGroups.filter((cg: any) => cg.type === 'vocabulary');
        for (const group of vocabGroups) {
          const vocabItems = contentRepo.getVocabularyByClassGroup(group.id);
          for (const item of vocabItems) {
            if (seenIds.has(item.id)) continue;
            seenIds.add(item.id);
            totalWords++;
            const reviewState = reviewRepo.getReviewState(userId, 'vocabulary', item.id);
            if (reviewState) {
              if (LEARNED_STAGES.has(reviewState.currentStage)) wordsLearned++;
              if (MASTERED_STAGES.has(reviewState.currentStage)) wordsMastered++;
            }
          }
        }
      }
    }
  }

  const progressPercent = totalWords > 0
    ? Math.round((wordsLearned / totalWords) * 100)
    : 0;

  return {
    totalWords,
    wordsLearned,
    wordsMastered,
    targetWords: totalWords,
    progressPercent,
  };
}
