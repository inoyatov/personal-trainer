import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../db/testDb';
import { createReviewRepository } from '../../db/repositories/reviewRepository';
import { createReviewScheduler, type ReviewScheduler } from './reviewScheduler';

describe('reviewScheduler', () => {
  let scheduler: ReviewScheduler;

  beforeEach(() => {
    const db = createTestDb();
    const reviewRepo = createReviewRepository(db);
    scheduler = createReviewScheduler(reviewRepo);
  });

  it('should create new review state on first answer', () => {
    const result = scheduler.processAnswer({
      userId: 'default',
      entityType: 'sentence',
      entityId: 's-1',
      exerciseType: 'multiple-choice-gap-fill',
      answer: { isCorrect: true, responseTimeMs: 1500, hintUsed: false },
    });

    expect(result.previousStage).toBe('new');
    expect(result.newStage).toBe('seen'); // totalCorrect=1, recognition bumped
    expect(result.recognitionMastery).toBeCloseTo(0.12, 2); // MC → recognition +0.12
    expect(result.recallMastery).toBe(0);
    expect(result.transferMastery).toBe(0);
    expect(result.learningStep).toBe('RECOGNITION'); // advanced from EXPOSURE
  });

  it('should update recognition mastery for MC exercises', () => {
    // Multiple correct MC answers
    scheduler.processAnswer({
      userId: 'default', entityType: 'sentence', entityId: 's-1',
      exerciseType: 'multiple-choice-gap-fill',
      answer: { isCorrect: true, responseTimeMs: 1000, hintUsed: false },
    });
    scheduler.processAnswer({
      userId: 'default', entityType: 'sentence', entityId: 's-1',
      exerciseType: 'multiple-choice-gap-fill',
      answer: { isCorrect: true, responseTimeMs: 1000, hintUsed: false },
    });
    scheduler.processAnswer({
      userId: 'default', entityType: 'sentence', entityId: 's-1',
      exerciseType: 'multiple-choice-gap-fill',
      answer: { isCorrect: true, responseTimeMs: 1000, hintUsed: false },
    });

    const state = scheduler.getState('default', 'sentence', 's-1');
    expect(state!.recognitionMastery).toBeCloseTo(0.36, 2); // 3 * 0.12
    expect(state!.recallMastery).toBe(0); // untouched
  });

  it('should update recall mastery for typed exercises', () => {
    // First need some recognition mastery via MC
    scheduler.processAnswer({
      userId: 'default', entityType: 'sentence', entityId: 's-1',
      exerciseType: 'multiple-choice-gap-fill',
      answer: { isCorrect: true, responseTimeMs: 1000, hintUsed: false },
    });

    // Now typed exercise
    scheduler.processAnswer({
      userId: 'default', entityType: 'sentence', entityId: 's-1',
      exerciseType: 'typed-gap-fill',
      answer: { isCorrect: true, responseTimeMs: 2000, hintUsed: false },
    });

    const state = scheduler.getState('default', 'sentence', 's-1');
    expect(state!.recallMastery).toBeCloseTo(0.12, 2);
  });

  it('should update transfer mastery for dialog exercises', () => {
    scheduler.processAnswer({
      userId: 'default', entityType: 'sentence', entityId: 's-1',
      exerciseType: 'dialog-completion',
      answer: { isCorrect: true, responseTimeMs: 2000, hintUsed: false },
    });

    const state = scheduler.getState('default', 'sentence', 's-1');
    expect(state!.transferMastery).toBeCloseTo(0.12, 2);
  });

  it('should advance stage based on mastery thresholds', () => {
    // Build recognition to 0.48 (4 * 0.12)
    for (let i = 0; i < 4; i++) {
      scheduler.processAnswer({
        userId: 'default', entityType: 'vocab', entityId: 'v-1',
        exerciseType: 'multiple-choice-gap-fill',
        answer: { isCorrect: true, responseTimeMs: 1000, hintUsed: false },
      });
    }

    const state = scheduler.getState('default', 'vocab', 'v-1');
    expect(state!.recognitionMastery).toBeCloseTo(0.48, 2);
    expect(state!.currentStage).toBe('recognized'); // recognition >= 0.4
  });

  it('should reduce mastery on incorrect answer', () => {
    // Build some mastery
    scheduler.processAnswer({
      userId: 'default', entityType: 'sentence', entityId: 's-1',
      exerciseType: 'multiple-choice-gap-fill',
      answer: { isCorrect: true, responseTimeMs: 1000, hintUsed: false },
    });
    scheduler.processAnswer({
      userId: 'default', entityType: 'sentence', entityId: 's-1',
      exerciseType: 'multiple-choice-gap-fill',
      answer: { isCorrect: true, responseTimeMs: 1000, hintUsed: false },
    });

    // Fail
    const result = scheduler.processAnswer({
      userId: 'default', entityType: 'sentence', entityId: 's-1',
      exerciseType: 'multiple-choice-gap-fill',
      answer: { isCorrect: false, responseTimeMs: 5000, hintUsed: false },
    });

    // 0.12 + 0.12 - 0.08 = 0.16
    expect(result.recognitionMastery).toBeCloseTo(0.16, 2);
  });

  it('should track learning step progression', () => {
    const r1 = scheduler.processAnswer({
      userId: 'default', entityType: 'sentence', entityId: 's-1',
      exerciseType: 'multiple-choice-gap-fill',
      answer: { isCorrect: true, responseTimeMs: 1000, hintUsed: false },
    });
    expect(r1.learningStep).toBe('RECOGNITION'); // EXPOSURE → RECOGNITION

    const r2 = scheduler.processAnswer({
      userId: 'default', entityType: 'sentence', entityId: 's-1',
      exerciseType: 'typed-gap-fill',
      answer: { isCorrect: true, responseTimeMs: 2000, hintUsed: false },
    });
    expect(r2.learningStep).toBe('CONTROLLED_RECALL');

    const r3 = scheduler.processAnswer({
      userId: 'default', entityType: 'sentence', entityId: 's-1',
      exerciseType: 'typed-gap-fill',
      answer: { isCorrect: false, responseTimeMs: 5000, hintUsed: false },
    });
    expect(r3.learningStep).toBe('RECOGNITION'); // falls back
  });

  it('should give less mastery boost with hint', () => {
    scheduler.processAnswer({
      userId: 'default', entityType: 'sentence', entityId: 's-1',
      exerciseType: 'multiple-choice-gap-fill',
      answer: { isCorrect: true, responseTimeMs: 1000, hintUsed: true },
    });

    const state = scheduler.getState('default', 'sentence', 's-1');
    expect(state!.recognitionMastery).toBeCloseTo(0.05, 2); // +0.05 with hint vs +0.12 without
  });

  it('should track consecutive correct/incorrect', () => {
    scheduler.processAnswer({
      userId: 'default', entityType: 'sentence', entityId: 's-1',
      exerciseType: 'multiple-choice-gap-fill',
      answer: { isCorrect: true, responseTimeMs: 1000, hintUsed: false },
    });
    scheduler.processAnswer({
      userId: 'default', entityType: 'sentence', entityId: 's-1',
      exerciseType: 'multiple-choice-gap-fill',
      answer: { isCorrect: true, responseTimeMs: 1000, hintUsed: false },
    });

    let state = scheduler.getState('default', 'sentence', 's-1');
    expect(state!.consecutiveCorrect).toBe(2);
    expect(state!.consecutiveIncorrect).toBe(0);

    scheduler.processAnswer({
      userId: 'default', entityType: 'sentence', entityId: 's-1',
      exerciseType: 'multiple-choice-gap-fill',
      answer: { isCorrect: false, responseTimeMs: 5000, hintUsed: false },
    });

    state = scheduler.getState('default', 'sentence', 's-1');
    expect(state!.consecutiveCorrect).toBe(0);
    expect(state!.consecutiveIncorrect).toBe(1);
  });

  it('should handle multiple entities independently', () => {
    scheduler.processAnswer({
      userId: 'default', entityType: 'sentence', entityId: 's-1',
      exerciseType: 'multiple-choice-gap-fill',
      answer: { isCorrect: true, responseTimeMs: 1000, hintUsed: false },
    });
    scheduler.processAnswer({
      userId: 'default', entityType: 'vocabulary', entityId: 'v-1',
      exerciseType: 'typed-gap-fill',
      answer: { isCorrect: false, responseTimeMs: 5000, hintUsed: false },
    });

    const s1 = scheduler.getState('default', 'sentence', 's-1');
    const v1 = scheduler.getState('default', 'vocabulary', 'v-1');

    expect(s1!.recognitionMastery).toBeCloseTo(0.12, 2);
    expect(v1!.recallMastery).toBe(0); // incorrect = -0.08, clamped to 0
  });
});
