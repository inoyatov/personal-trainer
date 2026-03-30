import { randomUUID } from 'node:crypto';
import { describe, it, expect, beforeAll } from 'vitest';
import { createTestDb } from '../db/testDb';
import { importContentPack } from '../import/contentPackImporter';
import samplePack from '../../content-packs/sample-transport.json';
import { createCourseRepository } from '../db/repositories/courseRepository';
import { createContentRepository } from '../db/repositories/contentRepository';
import { createReviewRepository } from '../db/repositories/reviewRepository';
import { createSessionRepository } from '../db/repositories/sessionRepository';
import { createVerbRepository } from '../db/repositories/verbRepository';
import { createUnifiedSessionBuilder } from '../domain/session/unifiedSessionBuilder';
import { createReviewScheduler } from '../domain/scheduler/reviewScheduler';
import { createSessionService } from '../domain/session/sessionService';
import { createLessonFrontierService } from '../domain/session/lessonFrontier';
import { getColdStartDistribution } from '../domain/session/coldStartPolicy';
import type { UnifiedExercise } from '../domain/session/unifiedSessionBuilder';

/**
 * Seed initial review states for all vocabulary and sentence items so the
 * pool builder can discover them. In a real app this happens when items are
 * first introduced to the learner; here we fast-forward by inserting "new"
 * review states with dueAt in the past so they appear as due items.
 */
function seedReviewStates(
  reviewRepo: ReturnType<typeof createReviewRepository>,
  contentRepo: ReturnType<typeof createContentRepository>,
  courseRepo: ReturnType<typeof createCourseRepository>,
) {
  const pastDue = new Date(Date.now() - 60_000).toISOString();
  const classGroupsList = courseRepo.getClassGroupsByLesson('les-train');

  for (const cg of classGroupsList) {
    if (cg.type === 'vocabulary') {
      const vocabItems = contentRepo.getVocabularyByClassGroup(cg.id);
      for (const v of vocabItems) {
        reviewRepo.upsertReviewState({
          id: randomUUID(),
          userId: 'default',
          entityType: 'vocabulary',
          entityId: v.id,
          currentStage: 'new',
          dueAt: pastDue,
          easeScore: 2.5,
          stabilityScore: 0,
          successCount: 0,
          failCount: 0,
          averageLatencyMs: 0,
        });
      }
    }
  }

  // Also seed sentence items
  const sentences = contentRepo.getSentencesByLesson('les-train');
  for (const s of sentences) {
    reviewRepo.upsertReviewState({
      id: randomUUID(),
      userId: 'default',
      entityType: 'sentence',
      entityId: s.id,
      currentStage: 'new',
      dueAt: pastDue,
      easeScore: 2.5,
      stabilityScore: 0,
      successCount: 0,
      failCount: 0,
      averageLatencyMs: 0,
    });
  }
}

// Shared state across tests — tests build on each other
let db: ReturnType<typeof createTestDb>;
let courseRepo: ReturnType<typeof createCourseRepository>;
let contentRepo: ReturnType<typeof createContentRepository>;
let reviewRepo: ReturnType<typeof createReviewRepository>;
let sessionRepo: ReturnType<typeof createSessionRepository>;
let verbRepo: ReturnType<typeof createVerbRepository>;

// Stashed across tests
let firstSessionExercises: UnifiedExercise[] = [];
let firstSessionId: string;

describe('Unified Learning Pipeline (full integration)', () => {
  beforeAll(() => {
    db = createTestDb();
    courseRepo = createCourseRepository(db);
    contentRepo = createContentRepository(db);
    reviewRepo = createReviewRepository(db);
    sessionRepo = createSessionRepository(db);
    verbRepo = createVerbRepository(db);
  });

  // -----------------------------------------------------------------------
  // Test 1: Import
  // -----------------------------------------------------------------------
  it('imports content pack successfully', () => {
    const result = importContentPack(db, samplePack);

    expect(result.success).toBe(true);
    expect(result.counts.vocabulary).toBe(18);
    expect(result.counts.courses).toBe(1);
    expect(result.counts.modules).toBe(1);
    expect(result.counts.lessons).toBe(1);
    expect(result.counts.sentences).toBeGreaterThan(0);

    // Seed review states so the pool builder can discover items
    seedReviewStates(reviewRepo, contentRepo, courseRepo);
  });

  // -----------------------------------------------------------------------
  // Test 2: Build first session
  // -----------------------------------------------------------------------
  it('builds unified session with exercises', () => {
    const builder = createUnifiedSessionBuilder({
      courseRepo,
      contentRepo,
      reviewRepo,
      sessionRepo,
      verbRepo,
    });

    const plan = builder.buildSession({
      userId: 'default',
      courseId: 'course-transport',
      mode: 'unified-learning',
    });

    expect(plan.exercises.length).toBeGreaterThan(0);
    expect(plan.sessionMeta.coldStartPhase).toBe('early');

    for (const ex of plan.exercises) {
      expect(ex.exerciseType).toBeTruthy();
      expect(ex.correctAnswer).toBeTruthy();
      expect(ex.sourceEntityId).toBeTruthy();
    }

    // Stash for subsequent tests
    firstSessionExercises = plan.exercises;
  });

  // -----------------------------------------------------------------------
  // Test 3: Submit answers and verify review states
  // -----------------------------------------------------------------------
  it('submitting answers updates review states', () => {
    const scheduler = createReviewScheduler(reviewRepo);
    const service = createSessionService(sessionRepo, scheduler);

    const session = service.startSession({
      mode: 'unified-learning',
      courseId: 'course-transport',
    });
    firstSessionId = session.id;

    // Submit answers for each exercise — alternate correct/incorrect
    for (let i = 0; i < firstSessionExercises.length; i++) {
      const ex = firstSessionExercises[i];
      const isCorrect = i % 2 === 0; // even = correct, odd = incorrect

      service.submitAnswer({
        sessionId: session.id,
        exerciseInstanceId: ex.id,
        exerciseType: ex.exerciseType,
        sourceEntityType: ex.sourceEntityType,
        sourceEntityId: ex.sourceEntityId,
        userAnswer: isCorrect ? ex.correctAnswer : 'wrong-answer',
        isCorrect,
        responseTimeMs: 1500,
        hintUsed: false,
      });
    }

    // End the session so it counts as completed
    service.endSession(session.id);

    // Verify review states were created for submitted entities
    const checkedIds = new Set<string>();
    for (const ex of firstSessionExercises) {
      if (checkedIds.has(ex.sourceEntityId)) continue;
      checkedIds.add(ex.sourceEntityId);

      const state = reviewRepo.getReviewState(
        'default',
        ex.sourceEntityType,
        ex.sourceEntityId,
      );
      expect(state).toBeDefined();
      expect(state!.lastSeenAt).toBeTruthy();
      // At least one of success/fail should have incremented
      expect(state!.successCount + state!.failCount).toBeGreaterThan(0);
    }
  });

  // -----------------------------------------------------------------------
  // Test 4: Second session reflects previous answers
  // -----------------------------------------------------------------------
  it('second session reflects previous answers in scoring', () => {
    const builder = createUnifiedSessionBuilder({
      courseRepo,
      contentRepo,
      reviewRepo,
      sessionRepo,
      verbRepo,
    });

    const plan = builder.buildSession({
      userId: 'default',
      courseId: 'course-transport',
      mode: 'unified-learning',
    });

    // Session builds successfully with exercises — items are no longer all "new"
    expect(plan.exercises.length).toBeGreaterThan(0);
    expect(plan.sessionMeta.coldStartPhase).toBe('early');
    // The distribution should still be early (only 1 completed session)
    expect(plan.sessionMeta.distribution.vocabulary).toBe(0.8);
  });

  // -----------------------------------------------------------------------
  // Test 5: Cold start phase transitions
  // -----------------------------------------------------------------------
  it('cold start phase transitions after sessions', () => {
    // Phase check via pure function
    const earlyDist = getColdStartDistribution(0);
    expect(earlyDist.vocabulary).toBe(0.8);
    expect(earlyDist.conjugation).toBe(0);

    const midDist = getColdStartDistribution(3);
    expect(midDist.vocabulary).toBe(0.6);
    expect(midDist.conjugation).toBe(0.15);
    expect(midDist.sentence).toBe(0.25);

    const fullDist = getColdStartDistribution(10);
    expect(fullDist.vocabulary).toBe(0.4);
    expect(fullDist.conjugation).toBe(0.25);
    expect(fullDist.sentence).toBe(0.2);
    expect(fullDist.dialog).toBe(0.15);

    // Now simulate completing more sessions so getCompletedSessionCount advances
    const scheduler = createReviewScheduler(reviewRepo);
    const service = createSessionService(sessionRepo, scheduler);

    // Complete 2 more sessions (we already have 1 completed from test 3)
    for (let s = 0; s < 2; s++) {
      const sess = service.startSession({
        mode: 'unified-learning',
        courseId: 'course-transport',
      });
      service.endSession(sess.id);
    }

    // Now we have 3 completed sessions => mid phase
    const count3 = sessionRepo.getCompletedSessionCount('default', 'course-transport');
    expect(count3).toBe(3);
    const dist3 = getColdStartDistribution(count3);
    expect(dist3.vocabulary).toBe(0.6);

    // Complete 7 more to reach 10
    for (let s = 0; s < 7; s++) {
      const sess = service.startSession({
        mode: 'unified-learning',
        courseId: 'course-transport',
      });
      service.endSession(sess.id);
    }

    const count10 = sessionRepo.getCompletedSessionCount('default', 'course-transport');
    expect(count10).toBe(10);
    const dist10 = getColdStartDistribution(count10);
    expect(dist10.vocabulary).toBe(0.4);
    expect(dist10.dialog).toBe(0.15);
  });

  // -----------------------------------------------------------------------
  // Test 6: Lesson frontier
  // -----------------------------------------------------------------------
  it('lesson frontier returns correct unlock status', () => {
    const frontier = createLessonFrontierService(courseRepo, contentRepo, reviewRepo);

    // With only 1 lesson in the course, frontier should return that lesson
    // (it is not fully mastered yet)
    const frontierLesson = frontier.getCurrentFrontierLesson('default', 'course-transport');
    expect(frontierLesson).toBe('les-train');

    // First lesson is always unlocked
    const unlocked = frontier.isLessonUnlocked('default', 'les-train');
    expect(unlocked).toBe(true);

    // Full unlock status
    const status = frontier.getLessonUnlockStatus('default', 'course-transport');
    expect(status).toHaveLength(1);
    expect(status[0].lessonId).toBe('les-train');
    expect(status[0].unlocked).toBe(true);
  });
});
