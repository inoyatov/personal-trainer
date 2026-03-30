import type { ReviewRepository } from '../../db/repositories/reviewRepository';
import type { WritingRepository } from '../../db/repositories/writingRepository';
import type { ContentRepository } from '../../db/repositories/contentRepository';
import type { CourseRepository } from '../../db/repositories/courseRepository';

export interface LessonCompletionStatus {
  lessonId: string;
  isComplete: boolean;
  vocabularyTotal: number;
  vocabularyMastered: number;
  vocabularyPercent: number;
  sentencesTotal: number;
  sentencesMastered: number;
  sentencesPercent: number;
  writingAttempted: boolean;
  overallPercent: number;
}

const MASTERY_THRESHOLD_STAGE = 'recognized'; // minimum stage to count as "mastered"
const COMPLETION_PERCENT = 80;

const STAGE_ORDER = ['new', 'seen', 'recognized', 'recalled', 'stable', 'automated'];

function isAtLeastStage(current: string, threshold: string): boolean {
  return STAGE_ORDER.indexOf(current) >= STAGE_ORDER.indexOf(threshold);
}

export function createLessonCompletionService(
  courseRepo: CourseRepository,
  contentRepo: ContentRepository,
  reviewRepo: ReviewRepository,
  writingRepo: WritingRepository,
) {
  return {
    getLessonCompletion(
      lessonId: string,
      userId = 'default',
    ): LessonCompletionStatus {
      // Get vocabulary for this lesson's vocab class groups
      const classGroups = courseRepo.getClassGroupsByLesson(lessonId);
      const vocabGroups = classGroups.filter((cg) => cg.type === 'vocabulary');

      let vocabularyTotal = 0;
      let vocabularyMastered = 0;

      for (const cg of vocabGroups) {
        const vocabItems = contentRepo.getVocabularyByClassGroup(cg.id);
        for (const item of vocabItems) {
          vocabularyTotal++;
          const state = reviewRepo.getReviewState(
            userId,
            'vocabulary',
            item.id,
          );
          if (state && isAtLeastStage(state.currentStage, MASTERY_THRESHOLD_STAGE)) {
            vocabularyMastered++;
          }
        }
      }

      // Get sentences
      const sentences = contentRepo.getSentencesByLesson(lessonId);
      let sentencesTotal = sentences.length;
      let sentencesMastered = 0;

      for (const sent of sentences) {
        const state = reviewRepo.getReviewState(userId, 'sentence', sent.id);
        if (state && isAtLeastStage(state.currentStage, MASTERY_THRESHOLD_STAGE)) {
          sentencesMastered++;
        }
      }

      // Check writing
      const prompts = writingRepo.getPromptsByLesson(lessonId);
      let writingAttempted = false;
      if (prompts.length > 0) {
        for (const prompt of prompts) {
          const submissions = writingRepo.getSubmissionsByPrompt(prompt.id);
          if (submissions.length > 0) {
            writingAttempted = true;
            break;
          }
        }
      } else {
        // No writing prompts = writing not required
        writingAttempted = true;
      }

      const vocabPercent =
        vocabularyTotal > 0
          ? Math.round((vocabularyMastered / vocabularyTotal) * 100)
          : 100;
      const sentPercent =
        sentencesTotal > 0
          ? Math.round((sentencesMastered / sentencesTotal) * 100)
          : 100;

      // Overall: average of vocab and sentence percent
      const overallPercent = Math.round((vocabPercent + sentPercent) / 2);

      const isComplete =
        overallPercent >= COMPLETION_PERCENT && writingAttempted;

      return {
        lessonId,
        isComplete,
        vocabularyTotal,
        vocabularyMastered,
        vocabularyPercent: vocabPercent,
        sentencesTotal,
        sentencesMastered,
        sentencesPercent: sentPercent,
        writingAttempted,
        overallPercent,
      };
    },
  };
}

export type LessonCompletionService = ReturnType<typeof createLessonCompletionService>;
