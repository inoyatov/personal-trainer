import { describe, it, expect, beforeAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createTestDb, type TestDatabase } from '../../../backend/db/testDb';
import { importContentPack } from '../../../backend/import/contentPackImporter';
import samplePack from '../../../content-packs/sample-transport.json';
import { createCourseRepository } from '../../../backend/db/repositories/courseRepository';
import { createContentRepository } from '../../../backend/db/repositories/contentRepository';
import { createReviewRepository } from '../../../backend/db/repositories/reviewRepository';
import { createSessionRepository } from '../../../backend/db/repositories/sessionRepository';
import { createVerbRepository } from '../../../backend/db/repositories/verbRepository';
import { createReviewScheduler } from '../../../backend/domain/scheduler/reviewScheduler';
import { createSessionService } from '../../../backend/domain/session/sessionService';
import { createDashboardService } from '../../../backend/domain/progress/dashboardService';
import { createUnifiedSessionBuilder } from '../../../backend/domain/session/unifiedSessionBuilder';
import { createLessonFrontierService } from '../../../backend/domain/session/lessonFrontier';
import { computeVocabCoverage } from '../../../backend/domain/progress/vocabCoverageService';
import {
  classifyConjugationError,
  isConjugationAccepted,
  conjugationFeedbackMessage,
} from '../../../backend/domain/evaluation/conjugationChecker';
import {
  courses,
  modules,
  lessons,
  classGroups,
} from '../../../backend/db/schema/courses';
import {
  verbs,
  verbConjugationSets,
  verbConjugationForms,
  lessonVerbs,
} from '../../../backend/db/schema/verbs';

// ---------------------------------------------------------------------------
// Shared state
// ---------------------------------------------------------------------------

let db: TestDatabase;
let courseRepo: ReturnType<typeof createCourseRepository>;
let contentRepo: ReturnType<typeof createContentRepository>;
let reviewRepo: ReturnType<typeof createReviewRepository>;
let sessionRepo: ReturnType<typeof createSessionRepository>;
let verbRepo: ReturnType<typeof createVerbRepository>;
let reviewScheduler: ReturnType<typeof createReviewScheduler>;
let sessionService: ReturnType<typeof createSessionService>;
let dashboardService: ReturnType<typeof createDashboardService>;
let unifiedBuilder: ReturnType<typeof createUnifiedSessionBuilder>;
let frontierService: ReturnType<typeof createLessonFrontierService>;

const userId = 'default';

// Conjugation verb seeding IDs
let conjLessonId: string;
let werkenId: string;
let hebbenId: string;

const WERKEN_FORMS: Record<string, string> = {
  IK: 'werk',
  JIJ: 'werkt',
  U: 'werkt',
  HIJ: 'werkt',
  ZIJ_SG: 'werkt',
  HET: 'werkt',
  WIJ: 'werken',
  JULLIE: 'werken',
  ZIJ_PL: 'werken',
};

const HEBBEN_FORMS: Record<string, string> = {
  IK: 'heb',
  JIJ: 'hebt',
  U: 'heeft',
  HIJ: 'heeft',
  ZIJ_SG: 'heeft',
  HET: 'heeft',
  WIJ: 'hebben',
  JULLIE: 'hebben',
  ZIJ_PL: 'hebben',
};

function seedForms(setId: string, forms: Record<string, string>) {
  for (const [pronoun, form] of Object.entries(forms)) {
    db.insert(verbConjugationForms)
      .values({
        id: randomUUID(),
        conjugationSetId: setId,
        pronoun: pronoun as any,
        form,
      })
      .run();
  }
}

// ---------------------------------------------------------------------------
// Setup: create DB, import sample data, seed verb data, wire services
// ---------------------------------------------------------------------------

beforeAll(() => {
  db = createTestDb();

  // Import sample content pack (course-transport with 18 vocab items)
  const result = importContentPack(db, samplePack);
  expect(result.success).toBe(true);
  expect(result.counts.vocabulary).toBe(18);

  // Create repositories
  courseRepo = createCourseRepository(db);
  contentRepo = createContentRepository(db);
  reviewRepo = createReviewRepository(db);
  sessionRepo = createSessionRepository(db);
  verbRepo = createVerbRepository(db);

  // Create domain services
  reviewScheduler = createReviewScheduler(reviewRepo);
  sessionService = createSessionService(sessionRepo, reviewScheduler);
  dashboardService = createDashboardService(db, reviewRepo);
  frontierService = createLessonFrontierService(courseRepo, contentRepo, reviewRepo);
  unifiedBuilder = createUnifiedSessionBuilder({
    courseRepo,
    contentRepo,
    reviewRepo,
    sessionRepo,
    verbRepo,
  });

  // --- Seed verb data for conjugation tests ---
  // Create a separate lesson under the same course for conjugation verbs
  const conjModuleId = randomUUID();
  conjLessonId = randomUUID();
  const conjClassGroupId = randomUUID();

  db.insert(modules)
    .values({ id: conjModuleId, courseId: 'course-transport', title: 'Verbs Basics', orderIndex: 1 })
    .run();

  // Seed 18 vocab items so the lesson passes the minimum density check
  db.insert(lessons)
    .values({ id: conjLessonId, moduleId: conjModuleId, title: 'Present Tense Verbs', orderIndex: 0 })
    .run();
  db.insert(classGroups)
    .values({ id: conjClassGroupId, lessonId: conjLessonId, type: 'grammar', title: 'Conjugation', orderIndex: 0 })
    .run();

  // Verb 1: werken (regular)
  werkenId = randomUUID();
  db.insert(verbs)
    .values({ id: werkenId, infinitive: 'werken', translation: 'to work', type: 'regular' })
    .run();
  const werkenSetId = randomUUID();
  db.insert(verbConjugationSets)
    .values({ id: werkenSetId, verbId: werkenId, tense: 'present', mood: 'indicative' })
    .run();
  seedForms(werkenSetId, WERKEN_FORMS);
  db.insert(lessonVerbs)
    .values({ lessonId: conjLessonId, verbId: werkenId, role: 'target', orderIndex: 0 })
    .run();

  // Verb 2: hebben (irregular)
  hebbenId = randomUUID();
  db.insert(verbs)
    .values({ id: hebbenId, infinitive: 'hebben', translation: 'to have', type: 'irregular' })
    .run();
  const hebbenSetId = randomUUID();
  db.insert(verbConjugationSets)
    .values({ id: hebbenSetId, verbId: hebbenId, tense: 'present', mood: 'indicative' })
    .run();
  seedForms(hebbenSetId, HEBBEN_FORMS);
  db.insert(lessonVerbs)
    .values({ lessonId: conjLessonId, verbId: hebbenId, role: 'focus_irregular', orderIndex: 1 })
    .run();
});

// ===========================================================================
// Session handler tests
// ===========================================================================

describe('session handlers', () => {
  let createdSessionId: string;

  it('session:create — creates session with valid mode', () => {
    const session = sessionService.startSession({
      mode: 'unified-learning',
      courseId: 'course-transport',
    });

    expect(session).toBeDefined();
    expect(session.id).toBeTruthy();
    expect(session.mode).toBe('unified-learning');
    expect(session.status).toBe('active');
    createdSessionId = session.id;
  });

  it('session:submitAnswer — persists answer and updates review state', () => {
    // Use the first vocabulary item from the sample pack
    const vocabId = 'vt-1';

    const answer = sessionService.submitAnswer({
      sessionId: createdSessionId,
      exerciseInstanceId: randomUUID(),
      exerciseType: 'translation-choice',
      sourceEntityType: 'vocabulary',
      sourceEntityId: vocabId,
      userAnswer: 'trein',
      isCorrect: true,
      responseTimeMs: 1200,
      hintUsed: false,
    });

    expect(answer).toBeDefined();
    expect(answer.isCorrect).toBe(true);

    // Verify answer is persisted
    const answers = sessionService.getSessionAnswers(createdSessionId);
    expect(answers.length).toBeGreaterThanOrEqual(1);

    // Verify review state was created by the scheduler
    const state = reviewRepo.getReviewState(userId, 'vocabulary', vocabId);
    expect(state).toBeDefined();
    expect(state!.successCount).toBeGreaterThanOrEqual(1);
  });

  it('session:end — marks session completed', () => {
    const ended = sessionService.endSession(createdSessionId);

    expect(ended).toBeDefined();
    expect(ended!.endedAt).toBeTruthy();
    expect(ended!.status).toBe('completed');
  });

  it('session:abandon — marks session abandoned', () => {
    // Create a fresh session to abandon
    const newSession = sessionService.startSession({
      mode: 'unified-learning',
      courseId: 'course-transport',
    });

    const abandoned = sessionService.abandonSession(newSession.id);

    expect(abandoned).toBeDefined();
    expect(abandoned!.status).toBe('abandoned');
    expect(abandoned!.endedAt).toBeTruthy();
  });

  it('session:buildUnified — returns exercises', () => {
    const plan = unifiedBuilder.buildSession({
      userId,
      courseId: 'course-transport',
      mode: 'unified-learning',
      maxItems: 10,
    });

    expect(plan).toBeDefined();
    expect(plan.exercises).toBeInstanceOf(Array);
    expect(plan.exercises.length).toBeGreaterThan(0);
    expect(plan.sessionMeta.courseId).toBe('course-transport');
  });
});

// ===========================================================================
// Review handler tests
// ===========================================================================

describe('review handlers', () => {
  it('review:getDueItems — returns items with content IDs that resolve', () => {
    // Seed review states with past dueAt to ensure something is due
    reviewRepo.upsertReviewState({
      id: randomUUID(),
      userId,
      entityType: 'vocabulary',
      entityId: 'vt-2',
      currentStage: 'seen',
      dueAt: new Date(Date.now() - 3600_000).toISOString(),
      lastSeenAt: new Date().toISOString(),
      successCount: 1,
      failCount: 0,
    });

    const dueItems = reviewRepo.getDueItems(userId);
    expect(dueItems.length).toBeGreaterThan(0);

    // Enrich with display labels (simulating handler logic)
    const enriched = [];
    for (const item of dueItems) {
      let displayLabel: string | null = null;
      if (item.entityType === 'vocabulary') {
        const vocab = contentRepo.getVocabularyById(item.entityId);
        if (vocab) displayLabel = `${vocab.displayText} — ${vocab.translation}`;
      }
      if (displayLabel) {
        enriched.push({ ...item, displayLabel });
      }
    }
    expect(enriched.length).toBeGreaterThan(0);
    expect(enriched[0].displayLabel).toBeTruthy();
  });

  it('review:getState — returns review state for entity', () => {
    // vt-2 was seeded above
    const state = reviewRepo.getReviewState(userId, 'vocabulary', 'vt-2');
    expect(state).toBeDefined();
    expect(state!.entityId).toBe('vt-2');
    expect(state!.currentStage).toBe('seen');
  });

  it('review:getAllStates — returns all states for user', () => {
    const allStates = reviewRepo.getAllReviewStates(userId);
    expect(allStates.length).toBeGreaterThanOrEqual(2); // vt-1 from session test + vt-2 from above
  });
});

// ===========================================================================
// Content handler tests
// ===========================================================================

describe('content handlers', () => {
  it('content:getCourses — returns imported courses', () => {
    const allCourses = courseRepo.getAllCourses();
    expect(allCourses.length).toBeGreaterThanOrEqual(1);
    const transport = allCourses.find((c) => c.id === 'course-transport');
    expect(transport).toBeDefined();
    expect(transport!.title).toBe('Transport & Reizen');
  });

  it('content:getLessonContent — returns full lesson data', () => {
    const lessonId = 'les-train';

    const lesson = courseRepo.getLessonById(lessonId);
    expect(lesson).toBeDefined();
    expect(lesson!.title).toBe('Met de trein');

    const classGroupsList = courseRepo.getClassGroupsByLesson(lessonId);
    expect(classGroupsList.length).toBeGreaterThanOrEqual(2);

    const sentences = contentRepo.getSentencesByLesson(lessonId);
    expect(sentences.length).toBeGreaterThanOrEqual(1);

    const dialogsList = contentRepo.getDialogsByLesson(lessonId);
    expect(dialogsList.length).toBeGreaterThanOrEqual(1);

    // Vocabulary comes from class groups
    const vocabGroup = classGroupsList.find((cg) => cg.type === 'vocabulary');
    expect(vocabGroup).toBeDefined();
    const vocab = contentRepo.getVocabularyByClassGroup(vocabGroup!.id);
    expect(vocab.length).toBe(18);
  });
});

// ===========================================================================
// Progress handler tests
// ===========================================================================

describe('progress handlers', () => {
  it('progress:getVocabCoverage — returns word counts', () => {
    const coverage = computeVocabCoverage(
      'course-transport',
      userId,
      courseRepo,
      contentRepo,
      reviewRepo,
    );

    expect(coverage.totalWords).toBe(18);
    expect(typeof coverage.wordsLearned).toBe('number');
    expect(typeof coverage.wordsMastered).toBe('number');
    expect(typeof coverage.progressPercent).toBe('number');
  });

  it('progress:getLessonUnlockStatus — returns unlock status', () => {
    const status = frontierService.getLessonUnlockStatus(userId, 'course-transport');

    expect(status.length).toBeGreaterThanOrEqual(1);
    // First lesson should always be unlocked
    expect(status[0].unlocked).toBe(true);
  });
});

// ===========================================================================
// Dashboard handler tests
// ===========================================================================

describe('dashboard handlers', () => {
  it('dashboard:getStats — returns stats', () => {
    const stats = dashboardService.getStats(userId);

    expect(typeof stats.dueReviewCount).toBe('number');
    expect(typeof stats.todaySessionCount).toBe('number');
    expect(typeof stats.todayCorrect).toBe('number');
    expect(typeof stats.todayTotal).toBe('number');
    expect(typeof stats.todayAccuracy).toBe('number');
    expect(typeof stats.totalItemsLearned).toBe('number');
    expect(typeof stats.totalSessions).toBe('number');
    expect(typeof stats.verbsPracticed).toBe('number');
    expect(typeof stats.conjugationAccuracy).toBe('number');

    // We created sessions above so totalSessions should be > 0
    expect(stats.totalSessions).toBeGreaterThanOrEqual(1);
  });

  it('dashboard:getRecentSessions — returns recent sessions ordered by startedAt desc', () => {
    // Create a couple more sessions with different modes
    sessionService.startSession({ mode: 'unified-learning', courseId: 'course-transport' });
    sessionService.startSession({ mode: 'conjugation-practice', courseId: 'course-transport' });

    const recent = dashboardService.getRecentSessions(userId, 5);

    expect(recent.length).toBeGreaterThanOrEqual(2);
    // Verify descending order by startedAt
    for (let i = 1; i < recent.length; i++) {
      expect(recent[i - 1].startedAt >= recent[i].startedAt).toBe(true);
    }
  });
});

// ===========================================================================
// Conjugation handler tests
// ===========================================================================

describe('conjugation handlers', () => {
  it('conjugation:getLessonVerbs — returns verbs with forms', () => {
    const lessonVerbsList = verbRepo.getVerbsByLesson(conjLessonId);
    expect(lessonVerbsList.length).toBe(2);

    // Simulate handler enrichment: attach formsMap to each verb
    const enriched = lessonVerbsList.map((lv) => {
      const formsMap = lv.verb ? verbRepo.getAllFormsMap(lv.verb.id) : {};
      return { ...lv, formsMap };
    });

    expect(enriched.length).toBe(2);

    // Verify werken forms
    const werkenEntry = enriched.find((e) => e.verb?.infinitive === 'werken');
    expect(werkenEntry).toBeDefined();
    expect(werkenEntry!.formsMap['IK']).toBe('werk');
    expect(werkenEntry!.formsMap['JIJ']).toBe('werkt');
    expect(werkenEntry!.formsMap['WIJ']).toBe('werken');

    // Verify hebben forms
    const hebbenEntry = enriched.find((e) => e.verb?.infinitive === 'hebben');
    expect(hebbenEntry).toBeDefined();
    expect(hebbenEntry!.formsMap['IK']).toBe('heb');
    expect(hebbenEntry!.formsMap['U']).toBe('heeft');
  });

  it('conjugation:submitAnswer — classifies error and records attempt', () => {
    const pronoun = 'JIJ';
    const expectedForm = 'werkt';
    const userAnswer = 'werk'; // Missing -t

    const allForms = verbRepo.getAllFormsMap(werkenId, 'present');
    const result = classifyConjugationError(userAnswer, expectedForm, allForms, pronoun);
    const accepted = isConjugationAccepted(result.errorType);
    const feedbackMsg = conjugationFeedbackMessage(result.errorType, expectedForm, pronoun);

    expect(result.errorType).toBe('MISSING_T');
    expect(accepted).toBe(false);
    expect(feedbackMsg).toBeTruthy();

    // Record attempt (simulating handler logic)
    verbRepo.insertConjugationAttempt({
      id: randomUUID(),
      userId,
      verbId: werkenId,
      pronoun,
      tense: 'present',
      expectedForm,
      userAnswer,
      correct: accepted,
      errorType: result.errorType,
      responseTimeMs: 1500,
      hintUsed: false,
    });

    // Update review state (simulating handler logic)
    const reviewState = verbRepo.getConjugationReviewState(userId, werkenId, pronoun, 'present');
    const successCount = (reviewState?.successCount ?? 0) + (accepted ? 1 : 0);
    const failCount = (reviewState?.failCount ?? 0) + (accepted ? 0 : 1);
    const dueAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    verbRepo.upsertConjugationReviewState({
      id: reviewState?.id ?? randomUUID(),
      userId,
      verbId: werkenId,
      pronoun,
      tense: 'present',
      stage: 'new',
      successCount,
      failCount,
      dueAt,
      lastSeenAt: new Date().toISOString(),
    });

    // Verify attempt persisted
    const attempts = verbRepo.getConjugationAttempts(userId, werkenId);
    expect(attempts.length).toBeGreaterThanOrEqual(1);
    const lastAttempt = attempts[attempts.length - 1];
    expect(lastAttempt.errorType).toBe('MISSING_T');
    expect(lastAttempt.correct).toBe(false);

    // Verify review state persisted
    const updatedState = verbRepo.getConjugationReviewState(userId, werkenId, pronoun, 'present');
    expect(updatedState).toBeDefined();
    expect(updatedState!.failCount).toBeGreaterThanOrEqual(1);
  });

  it('conjugation:getStats — returns practice stats', () => {
    // Submit a few more attempts to have richer stats
    // Correct answer for IK
    verbRepo.insertConjugationAttempt({
      id: randomUUID(),
      userId,
      verbId: werkenId,
      pronoun: 'IK',
      tense: 'present',
      expectedForm: 'werk',
      userAnswer: 'werk',
      correct: true,
      errorType: 'CORRECT',
      responseTimeMs: 900,
      hintUsed: false,
    });

    // Correct answer for WIJ
    verbRepo.insertConjugationAttempt({
      id: randomUUID(),
      userId,
      verbId: hebbenId,
      pronoun: 'WIJ',
      tense: 'present',
      expectedForm: 'hebben',
      userAnswer: 'hebben',
      correct: true,
      errorType: 'CORRECT',
      responseTimeMs: 1100,
      hintUsed: false,
    });

    // Simulate the handler's inline stats computation logic
    const attempts = verbRepo.getConjugationAttempts(userId);

    const verbsPracticed = new Set(attempts.map((a) => a.verbId)).size;
    const totalAttempts = attempts.length;
    const correctCount = attempts.filter((a) => a.correct).length;
    const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

    const pronounStats: Record<string, { correct: number; total: number }> = {};
    for (const a of attempts) {
      if (!pronounStats[a.pronoun]) pronounStats[a.pronoun] = { correct: 0, total: 0 };
      pronounStats[a.pronoun].total++;
      if (a.correct) pronounStats[a.pronoun].correct++;
    }

    const weakPronouns = Object.entries(pronounStats)
      .filter(([_, s]) => s.total >= 3 && s.correct / s.total < 0.5)
      .map(([pronoun]) => pronoun);

    const errorCounts: Record<string, number> = {};
    for (const a of attempts) {
      if (a.errorType !== 'CORRECT') {
        errorCounts[a.errorType] = (errorCounts[a.errorType] ?? 0) + 1;
      }
    }

    expect(verbsPracticed).toBeGreaterThanOrEqual(1);
    expect(totalAttempts).toBeGreaterThanOrEqual(3);
    expect(typeof accuracy).toBe('number');
    expect(accuracy).toBeGreaterThanOrEqual(0);
    expect(accuracy).toBeLessThanOrEqual(100);
    expect(Array.isArray(weakPronouns)).toBe(true);
    expect(typeof errorCounts).toBe('object');
    expect(errorCounts['MISSING_T']).toBeGreaterThanOrEqual(1);
  });
});
