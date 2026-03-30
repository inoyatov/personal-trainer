import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, type TestDatabase } from '../../db/testDb';
import { createReviewRepository } from '../../db/repositories/reviewRepository';
import { createDashboardService } from './dashboardService';
import { randomUUID } from 'node:crypto';
import { sessions, reviewStates } from '../../db/schema';

function insertSession(
  db: TestDatabase,
  overrides: Partial<typeof sessions.$inferInsert> = {},
) {
  const data = {
    id: randomUUID(),
    userId: 'default',
    mode: 'learn' as const,
    startedAt: new Date().toISOString(),
    totalQuestions: 0,
    correctAnswers: 0,
    ...overrides,
  };
  db.insert(sessions).values(data).run();
  return data;
}

function insertReviewState(
  db: TestDatabase,
  overrides: Partial<typeof reviewStates.$inferInsert> = {},
) {
  const data = {
    id: randomUUID(),
    userId: 'default',
    entityType: 'vocabulary',
    entityId: randomUUID(),
    currentStage: 'new' as const,
    dueAt: new Date().toISOString(),
    ...overrides,
  };
  db.insert(reviewStates).values(data).run();
  return data;
}

describe('dashboardService', () => {
  let db: TestDatabase;
  let service: ReturnType<typeof createDashboardService>;

  beforeEach(() => {
    db = createTestDb();
    const reviewRepo = createReviewRepository(db);
    service = createDashboardService(db, reviewRepo);
  });

  it('returns zero stats for new user', () => {
    const stats = service.getStats();

    expect(stats.dueReviewCount).toBe(0);
    expect(stats.todaySessionCount).toBe(0);
    expect(stats.todayCorrect).toBe(0);
    expect(stats.todayTotal).toBe(0);
    expect(stats.todayAccuracy).toBe(0);
    expect(stats.totalItemsLearned).toBe(0);
    expect(stats.totalSessions).toBe(0);
    expect(stats.verbsPracticed).toBe(0);
    expect(stats.conjugationAccuracy).toBe(0);
  });

  it('returns correct dueReviewCount', () => {
    const pastDue = new Date(Date.now() - 60000).toISOString();
    insertReviewState(db, { dueAt: pastDue, currentStage: 'seen' });
    insertReviewState(db, { dueAt: pastDue, currentStage: 'recognized' });
    // Future due — should NOT count
    insertReviewState(db, {
      dueAt: new Date(Date.now() + 3600000).toISOString(),
      currentStage: 'seen',
    });

    const stats = service.getStats();
    expect(stats.dueReviewCount).toBe(2);
  });

  it('returns correct todaySessionCount and todayAccuracy', () => {
    insertSession(db, { totalQuestions: 10, correctAnswers: 8 });
    insertSession(db, { totalQuestions: 5, correctAnswers: 3 });

    const stats = service.getStats();
    expect(stats.todaySessionCount).toBe(2);
    expect(stats.todayCorrect).toBe(11);
    expect(stats.todayTotal).toBe(15);
    expect(stats.todayAccuracy).toBe(73); // 11/15 = 73.3 -> 73
  });

  it('returns correct totalItemsLearned (excludes new stage)', () => {
    insertReviewState(db, { currentStage: 'new' });
    insertReviewState(db, { currentStage: 'seen' });
    insertReviewState(db, { currentStage: 'recognized' });
    insertReviewState(db, { currentStage: 'recalled' });

    const stats = service.getStats();
    expect(stats.totalItemsLearned).toBe(3); // seen + recognized + recalled
  });

  it('getRecentSessions returns sessions with accuracy', () => {
    insertSession(db, {
      id: 's-1',
      totalQuestions: 10,
      correctAnswers: 7,
      startedAt: new Date(Date.now() - 60000).toISOString(),
    });
    insertSession(db, {
      id: 's-2',
      totalQuestions: 5,
      correctAnswers: 5,
      startedAt: new Date().toISOString(),
    });

    const recent = service.getRecentSessions();
    expect(recent).toHaveLength(2);
    // Most recent first
    expect(recent[0].id).toBe('s-2');
    expect(recent[0].accuracy).toBe(100);
    expect(recent[1].id).toBe('s-1');
    expect(recent[1].accuracy).toBe(70);
  });
});
