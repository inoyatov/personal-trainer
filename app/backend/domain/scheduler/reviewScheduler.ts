import { randomUUID } from 'node:crypto';
import type { MasteryStage } from '../../../shared/types';
import type { ReviewRepository } from '../../db/repositories/reviewRepository';
import { upgradeStage, downgradeStage } from './masteryStages';
import { calculateInterval, type AnswerQuality } from './intervalCalculator';

export interface ReviewUpdateInput {
  userId: string;
  entityType: string;
  entityId: string;
  answer: AnswerQuality;
}

export interface ReviewUpdateResult {
  previousStage: MasteryStage;
  newStage: MasteryStage;
  dueAt: string;
  intervalMinutes: number;
  easeScore: number;
}

export function createReviewScheduler(reviewRepo: ReviewRepository) {
  return {
    /**
     * Process an answer and update the review state for the entity.
     * Creates a new review state if none exists.
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

      // Calculate new stage
      let newStage: MasteryStage;
      if (input.answer.isCorrect) {
        newStage = upgradeStage(currentStage);
      } else {
        newStage = downgradeStage(currentStage);
      }

      // Calculate interval
      const intervalResult = calculateInterval(
        newStage,
        currentEase,
        input.answer,
      );

      // Update running average latency
      const newAvgLatency =
        totalAnswers > 0
          ? (previousLatency * totalAnswers + input.answer.responseTimeMs) /
            (totalAnswers + 1)
          : input.answer.responseTimeMs;

      // Upsert review state
      const data = {
        id: existing?.id ?? randomUUID(),
        userId: input.userId,
        entityType: input.entityType,
        entityId: input.entityId,
        currentStage: newStage,
        easeScore: intervalResult.easeScore,
        dueAt: intervalResult.dueAt,
        lastSeenAt: new Date().toISOString(),
        successCount: input.answer.isCorrect ? successCount + 1 : successCount,
        failCount: input.answer.isCorrect ? failCount : failCount + 1,
        averageLatencyMs: Math.round(newAvgLatency),
        stabilityScore: calculateStability(
          input.answer.isCorrect ? successCount + 1 : successCount,
          input.answer.isCorrect ? failCount : failCount + 1,
        ),
      };

      reviewRepo.upsertReviewState(data);

      return {
        previousStage: currentStage,
        newStage,
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

/**
 * Simple stability score: ratio of successes to total attempts.
 * Ranges from 0 (all failures) to 1 (all successes).
 */
function calculateStability(
  successCount: number,
  failCount: number,
): number {
  const total = successCount + failCount;
  if (total === 0) return 0;
  return Math.round((successCount / total) * 100) / 100;
}

export type ReviewScheduler = ReturnType<typeof createReviewScheduler>;
