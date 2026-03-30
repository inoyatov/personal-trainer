import { randomUUID } from 'node:crypto';
import type { MasteryStage } from '../../../shared/types';
import type { ReviewRepository } from '../../db/repositories/reviewRepository';
import { computeStageFromMastery, stageIndex } from './masteryStages';
import { calculateInterval, type AnswerQuality } from './intervalCalculator';
import { dimensionForExercise, computeMasteryDelta, applyMasteryDelta } from './masteryDimensions';
import { nextLearningStep, type LearningStep } from './learningSteps';
import { shouldHoldStageAdvancement } from './confidenceModifiers';

export interface ReviewUpdateInput {
  userId: string;
  entityType: string;
  entityId: string;
  exerciseType: string;
  answer: AnswerQuality;
}

export interface ReviewUpdateResult {
  previousStage: MasteryStage;
  newStage: MasteryStage;
  learningStep: LearningStep;
  recognitionMastery: number;
  recallMastery: number;
  transferMastery: number;
  dueAt: string;
  intervalMinutes: number;
  easeScore: number;
}

export function createReviewScheduler(reviewRepo: ReviewRepository) {
  return {
    /**
     * Process an answer and update the review state for the entity.
     * Now tracks multi-dimensional mastery and learning steps.
     */
    processAnswer(input: ReviewUpdateInput): ReviewUpdateResult {
      const existing = reviewRepo.getReviewState(
        input.userId,
        input.entityType,
        input.entityId,
      );

      const currentStage: MasteryStage = existing
        ? (existing.currentStage as MasteryStage)
        : 'new';
      const currentEase = existing ? existing.easeScore : 2.5;
      const successCount = existing ? existing.successCount : 0;
      const failCount = existing ? existing.failCount : 0;
      const previousLatency = existing ? existing.averageLatencyMs : 0;
      const totalAnswers = successCount + failCount;

      // Current mastery values
      let recognitionMastery = (existing as any)?.recognitionMastery ?? 0;
      let recallMastery = (existing as any)?.recallMastery ?? 0;
      let transferMastery = (existing as any)?.transferMastery ?? 0;
      const currentLearningStep: LearningStep =
        ((existing as any)?.learningStep as LearningStep) ?? 'EXPOSURE';
      const currentConsecutiveCorrect = (existing as any)?.consecutiveCorrect ?? 0;
      const currentConsecutiveIncorrect = (existing as any)?.consecutiveIncorrect ?? 0;

      // 1. Update the relevant mastery dimension
      const dimension = dimensionForExercise(input.exerciseType);
      const masteryDelta = computeMasteryDelta(
        input.answer.isCorrect,
        input.answer.hintUsed,
      );

      if (dimension === 'recognitionMastery') {
        recognitionMastery = applyMasteryDelta(recognitionMastery, masteryDelta);
      } else if (dimension === 'recallMastery') {
        recallMastery = applyMasteryDelta(recallMastery, masteryDelta);
      } else {
        transferMastery = applyMasteryDelta(transferMastery, masteryDelta);
      }

      // 2. Update consecutive counts
      const newConsecutiveCorrect = input.answer.isCorrect
        ? currentConsecutiveCorrect + 1
        : 0;
      const newConsecutiveIncorrect = input.answer.isCorrect
        ? 0
        : currentConsecutiveIncorrect + 1;

      // 3. Compute new stage from mastery thresholds
      const newSuccessCount = input.answer.isCorrect ? successCount + 1 : successCount;
      const confidence = input.answer.confidence ?? 1;
      let newStage = computeStageFromMastery({
        recognitionMastery,
        recallMastery,
        transferMastery,
        totalCorrect: newSuccessCount,
        consecutiveIncorrect: newConsecutiveIncorrect,
      });

      // Hold stage if low confidence correct answer (memory unstable)
      if (
        shouldHoldStageAdvancement(confidence as 0 | 1 | 2, input.answer.isCorrect) &&
        stageIndex(newStage) > stageIndex(currentStage)
      ) {
        newStage = currentStage;
      }

      // 4. Advance learning step
      const newLearningStep = nextLearningStep(
        currentLearningStep,
        input.answer.isCorrect,
      );

      // 5. Calculate interval (using existing 4-path algorithm)
      const intervalResult = calculateInterval(
        newStage,
        currentEase,
        input.answer,
      );

      // 6. Update running average latency
      const newAvgLatency =
        totalAnswers > 0
          ? (previousLatency * totalAnswers + input.answer.responseTimeMs) /
            (totalAnswers + 1)
          : input.answer.responseTimeMs;

      // 7. Upsert review state
      const data = {
        id: existing?.id ?? randomUUID(),
        userId: input.userId,
        entityType: input.entityType,
        entityId: input.entityId,
        currentStage: newStage,
        easeScore: intervalResult.easeScore,
        dueAt: intervalResult.dueAt,
        lastSeenAt: new Date().toISOString(),
        successCount: newSuccessCount,
        failCount: input.answer.isCorrect ? failCount : failCount + 1,
        averageLatencyMs: Math.round(newAvgLatency),
        stabilityScore: calculateStability(
          newSuccessCount,
          input.answer.isCorrect ? failCount : failCount + 1,
        ),
        // v2 columns
        learningStep: newLearningStep,
        recognitionMastery,
        recallMastery,
        transferMastery,
        consecutiveCorrect: newConsecutiveCorrect,
        consecutiveIncorrect: newConsecutiveIncorrect,
      };

      reviewRepo.upsertReviewState(data);

      return {
        previousStage: currentStage,
        newStage,
        learningStep: newLearningStep,
        recognitionMastery,
        recallMastery,
        transferMastery,
        dueAt: intervalResult.dueAt,
        intervalMinutes: intervalResult.intervalMinutes,
        easeScore: intervalResult.easeScore,
      };
    },

    /** Get all items due for review */
    getDueItems(userId: string) {
      return reviewRepo.getDueItems(userId);
    },

    /** Get review state for a specific entity */
    getState(userId: string, entityType: string, entityId: string) {
      return reviewRepo.getReviewState(userId, entityType, entityId);
    },
  };
}

function calculateStability(successCount: number, failCount: number): number {
  const total = successCount + failCount;
  if (total === 0) return 0;
  return Math.round((successCount / total) * 100) / 100;
}

export type ReviewScheduler = ReturnType<typeof createReviewScheduler>;
