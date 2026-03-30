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
      answer: { isCorrect: true, responseTimeMs: 1500, hintUsed: false },
    });

    expect(result.previousStage).toBe('new');
    expect(result.newStage).toBe('seen'); // upgraded from new
    expect(result.intervalMinutes).toBeGreaterThan(0);
    expect(result.dueAt).toBeTruthy();

    // Verify it was persisted
    const state = scheduler.getState('default', 'sentence', 's-1');
    expect(state).toBeDefined();
    expect(state!.currentStage).toBe('seen');
    expect(state!.successCount).toBe(1);
    expect(state!.failCount).toBe(0);
  });

  it('should upgrade stage on consecutive correct answers', () => {
    // Answer 1: new -> seen
    scheduler.processAnswer({
      userId: 'default',
      entityType: 'sentence',
      entityId: 's-1',
      answer: { isCorrect: true, responseTimeMs: 1000, hintUsed: false },
    });

    // Answer 2: seen -> recognized
    const result2 = scheduler.processAnswer({
      userId: 'default',
      entityType: 'sentence',
      entityId: 's-1',
      answer: { isCorrect: true, responseTimeMs: 1000, hintUsed: false },
    });

    expect(result2.previousStage).toBe('seen');
    expect(result2.newStage).toBe('recognized');

    // Answer 3: recognized -> recalled
    const result3 = scheduler.processAnswer({
      userId: 'default',
      entityType: 'sentence',
      entityId: 's-1',
      answer: { isCorrect: true, responseTimeMs: 1500, hintUsed: false },
    });

    expect(result3.newStage).toBe('recalled');
  });

  it('should downgrade stage on incorrect answer', () => {
    // Build up to recognized
    scheduler.processAnswer({
      userId: 'default',
      entityType: 'sentence',
      entityId: 's-1',
      answer: { isCorrect: true, responseTimeMs: 1000, hintUsed: false },
    });
    scheduler.processAnswer({
      userId: 'default',
      entityType: 'sentence',
      entityId: 's-1',
      answer: { isCorrect: true, responseTimeMs: 1000, hintUsed: false },
    });

    // Now fail: recognized -> seen
    const result = scheduler.processAnswer({
      userId: 'default',
      entityType: 'sentence',
      entityId: 's-1',
      answer: { isCorrect: false, responseTimeMs: 5000, hintUsed: false },
    });

    expect(result.previousStage).toBe('recognized');
    expect(result.newStage).toBe('seen');

    const state = scheduler.getState('default', 'sentence', 's-1');
    expect(state!.failCount).toBe(1);
    expect(state!.successCount).toBe(2);
  });

  it('should track stability score', () => {
    // 2 correct, 1 incorrect = 2/3 stability
    scheduler.processAnswer({
      userId: 'default',
      entityType: 'sentence',
      entityId: 's-1',
      answer: { isCorrect: true, responseTimeMs: 1000, hintUsed: false },
    });
    scheduler.processAnswer({
      userId: 'default',
      entityType: 'sentence',
      entityId: 's-1',
      answer: { isCorrect: true, responseTimeMs: 1000, hintUsed: false },
    });
    scheduler.processAnswer({
      userId: 'default',
      entityType: 'sentence',
      entityId: 's-1',
      answer: { isCorrect: false, responseTimeMs: 5000, hintUsed: false },
    });

    const state = scheduler.getState('default', 'sentence', 's-1');
    expect(state!.stabilityScore).toBeCloseTo(0.67, 1);
  });

  it('should track average latency', () => {
    scheduler.processAnswer({
      userId: 'default',
      entityType: 'sentence',
      entityId: 's-1',
      answer: { isCorrect: true, responseTimeMs: 1000, hintUsed: false },
    });
    scheduler.processAnswer({
      userId: 'default',
      entityType: 'sentence',
      entityId: 's-1',
      answer: { isCorrect: true, responseTimeMs: 3000, hintUsed: false },
    });

    const state = scheduler.getState('default', 'sentence', 's-1');
    expect(state!.averageLatencyMs).toBe(2000);
  });

  it('should return due items', () => {
    // Process answer — this creates a review state with a future due date
    scheduler.processAnswer({
      userId: 'default',
      entityType: 'sentence',
      entityId: 's-1',
      answer: { isCorrect: true, responseTimeMs: 1000, hintUsed: false },
    });

    // Items with future due dates should NOT be in due list
    const dueNow = scheduler.getDueItems('default');
    expect(dueNow).toHaveLength(0);
  });

  it('should handle multiple entities independently', () => {
    scheduler.processAnswer({
      userId: 'default',
      entityType: 'sentence',
      entityId: 's-1',
      answer: { isCorrect: true, responseTimeMs: 1000, hintUsed: false },
    });
    scheduler.processAnswer({
      userId: 'default',
      entityType: 'vocabulary',
      entityId: 'v-1',
      answer: { isCorrect: false, responseTimeMs: 5000, hintUsed: false },
    });

    const s1 = scheduler.getState('default', 'sentence', 's-1');
    const v1 = scheduler.getState('default', 'vocabulary', 'v-1');

    expect(s1!.currentStage).toBe('seen');
    expect(s1!.successCount).toBe(1);
    expect(v1!.currentStage).toBe('seen'); // downgrade from new -> seen (min)
    expect(v1!.failCount).toBe(1);
  });
});
