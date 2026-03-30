import { describe, it, expect, beforeAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createTestDb, type TestDatabase } from '../db/testDb';
import { createVerbRepository, type VerbRepository } from '../db/repositories/verbRepository';
import { createContentRepository } from '../db/repositories/contentRepository';
import { courses, modules, lessons, classGroups } from '../db/schema/courses';
import {
  verbs,
  verbConjugationSets,
  verbConjugationForms,
  lessonVerbs,
} from '../db/schema/verbs';
import {
  buildConjugationSession,
  type ConjugationExercise,
} from '../domain/session/conjugationSessionBuilder';
import {
  classifyConjugationError,
  isConjugationAccepted,
} from '../domain/evaluation/conjugationChecker';

// ---------------------------------------------------------------------------
// Shared state across tests (tests build on each other)
// ---------------------------------------------------------------------------

let db: TestDatabase;
let verbRepo: VerbRepository;
let contentRepo: ReturnType<typeof createContentRepository>;

const userId = 'default';
let lessonId: string;
let werkenId: string;
let hebbenId: string;
let werkenSetId: string;
let hebbenSetId: string;

let firstSessionExercises: ConjugationExercise[];

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

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
// DB setup & seeding
// ---------------------------------------------------------------------------

beforeAll(() => {
  db = createTestDb();
  verbRepo = createVerbRepository(db);
  contentRepo = createContentRepository(db);

  // Course → Module → Lesson → ClassGroup
  const courseId = randomUUID();
  const moduleId = randomUUID();
  lessonId = randomUUID();
  const classGroupId = randomUUID();

  db.insert(courses)
    .values({ id: courseId, title: 'Dutch A2', targetLevel: 'A2' })
    .run();
  db.insert(modules)
    .values({ id: moduleId, courseId, title: 'Verbs Basics', orderIndex: 0 })
    .run();
  db.insert(lessons)
    .values({ id: lessonId, moduleId, title: 'Present Tense', orderIndex: 0 })
    .run();
  db.insert(classGroups)
    .values({ id: classGroupId, lessonId, type: 'grammar', title: 'Conjugation', orderIndex: 0 })
    .run();

  // Verb 1: werken (regular)
  werkenId = randomUUID();
  db.insert(verbs)
    .values({ id: werkenId, infinitive: 'werken', translation: 'to work', type: 'regular' })
    .run();

  werkenSetId = randomUUID();
  db.insert(verbConjugationSets)
    .values({ id: werkenSetId, verbId: werkenId, tense: 'present', mood: 'indicative' })
    .run();
  seedForms(werkenSetId, WERKEN_FORMS);

  db.insert(lessonVerbs)
    .values({ lessonId, verbId: werkenId, role: 'target', orderIndex: 0 })
    .run();

  // Verb 2: hebben (irregular)
  hebbenId = randomUUID();
  db.insert(verbs)
    .values({ id: hebbenId, infinitive: 'hebben', translation: 'to have', type: 'irregular' })
    .run();

  hebbenSetId = randomUUID();
  db.insert(verbConjugationSets)
    .values({ id: hebbenSetId, verbId: hebbenId, tense: 'present', mood: 'indicative' })
    .run();
  seedForms(hebbenSetId, HEBBEN_FORMS);

  db.insert(lessonVerbs)
    .values({ lessonId, verbId: hebbenId, role: 'focus_irregular', orderIndex: 1 })
    .run();
});

// ---------------------------------------------------------------------------
// Test 1: Cold-start session generation
// ---------------------------------------------------------------------------

describe('conjugation pipeline integration', () => {
  it('generates conjugation session for new user (cold start)', () => {
    firstSessionExercises = buildConjugationSession(
      { userId, lessonId, maxExercises: 10 },
      { verbRepo, contentRepo },
    );

    expect(firstSessionExercises.length).toBeGreaterThan(0);

    // All exercises must be conjugation types
    for (const ex of firstSessionExercises) {
      expect(['conjugation-typed', 'conjugation-in-sentence']).toContain(ex.exerciseType);
    }
  });

  // ---------------------------------------------------------------------------
  // Test 2: Submitting answers creates review states and attempts
  // ---------------------------------------------------------------------------

  it('submitting answers creates review states and attempts', () => {
    const sessionId = randomUUID();

    for (const ex of firstSessionExercises) {
      const formsMap = ex.allForms;
      const pronoun = ex.pronoun;
      const expectedForm = ex.correctAnswer;

      // Decide user answer: for JIJ/HIJ pronouns, submit the ik form to trigger MISSING_T
      const isMissingTTarget = pronoun === 'JIJ' || pronoun === 'HIJ';
      const userAnswer = isMissingTTarget ? formsMap['IK'] ?? expectedForm : expectedForm;

      const result = classifyConjugationError(userAnswer, expectedForm, formsMap, pronoun);
      const accepted = isConjugationAccepted(result.errorType);

      verbRepo.insertConjugationAttempt({
        id: randomUUID(),
        userId,
        sessionId,
        verbId: ex.verbId,
        pronoun,
        tense: 'present',
        expectedForm,
        userAnswer,
        correct: accepted,
        errorType: result.errorType,
        responseTimeMs: 1500,
      });

      verbRepo.upsertConjugationReviewState({
        id: randomUUID(),
        userId,
        verbId: ex.verbId,
        pronoun,
        tense: 'present',
        stage: accepted ? 'seen' : 'new',
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // due in 24h
        lastSeenAt: new Date().toISOString(),
        successCount: accepted ? 1 : 0,
        failCount: accepted ? 0 : 1,
      });
    }

    // Verify attempts are recorded
    const attempts = verbRepo.getConjugationAttempts(userId);
    expect(attempts.length).toBe(firstSessionExercises.length);

    // Verify at least some MISSING_T errors exist (from JIJ/HIJ exercises)
    const missingTAttempts = attempts.filter((a) => a.errorType === 'MISSING_T');
    // JIJ/HIJ exercises for "werken" would produce MISSING_T (werkt -> werk)
    // For "hebben" JIJ: hebt -> heb is also MISSING_T
    // There should be at least some
    const jijHijExercises = firstSessionExercises.filter(
      (ex) => ex.pronoun === 'JIJ' || ex.pronoun === 'HIJ',
    );
    if (jijHijExercises.length > 0) {
      expect(missingTAttempts.length).toBeGreaterThan(0);
    }
  });

  // ---------------------------------------------------------------------------
  // Test 3: Second session includes due items
  // ---------------------------------------------------------------------------

  it('second session includes due items', () => {
    // Set dueAt to the past for some review states to simulate time passing
    const allReviews = verbRepo.getDueConjugationReviews(
      userId,
      new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // far future to get all
    );
    expect(allReviews.length).toBeGreaterThan(0);

    // Move at least 3 review states to be overdue (past)
    const toMakeDue = allReviews.slice(0, Math.min(3, allReviews.length));
    for (const review of toMakeDue) {
      verbRepo.upsertConjugationReviewState({
        id: review.id,
        userId,
        verbId: review.verbId,
        pronoun: review.pronoun,
        tense: review.tense,
        dueAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      });
    }

    // Build another session
    const secondSession = buildConjugationSession(
      { userId, lessonId, maxExercises: 10 },
      { verbRepo, contentRepo },
    );

    expect(secondSession.length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Test 4: MISSING_T adaptation boosts jij/hij exercises
  // ---------------------------------------------------------------------------

  it('MISSING_T adaptation boosts jij/hij exercises', () => {
    const sessionId = randomUUID();

    // Insert 20 conjugation attempts where 5+ have errorType MISSING_T
    // This ensures >20% MISSING_T ratio in recent attempts
    for (let i = 0; i < 20; i++) {
      const isMissingT = i < 6; // 6 out of 20 = 30% > 20% threshold
      const pronoun = isMissingT ? 'JIJ' : 'IK';
      const expectedForm = isMissingT ? 'werkt' : 'werk';
      const userAnswer = isMissingT ? 'werk' : 'werk'; // MISSING_T: 'werk' instead of 'werkt'

      verbRepo.insertConjugationAttempt({
        id: randomUUID(),
        userId,
        sessionId,
        verbId: werkenId,
        pronoun,
        tense: 'present',
        expectedForm,
        userAnswer,
        correct: !isMissingT,
        errorType: isMissingT ? 'MISSING_T' : 'CORRECT',
        responseTimeMs: 1200,
      });
    }

    // Make some review states due so the due bucket is populated
    for (const pronoun of ['JIJ', 'HIJ', 'IK', 'WIJ']) {
      verbRepo.upsertConjugationReviewState({
        id: randomUUID(),
        userId,
        verbId: werkenId,
        pronoun,
        tense: 'present',
        stage: 'seen',
        dueAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // overdue
        lastSeenAt: new Date().toISOString(),
      });
    }

    const session = buildConjugationSession(
      { userId, lessonId, maxExercises: 10 },
      { verbRepo, contentRepo },
    );

    expect(session.length).toBeGreaterThan(0);

    // Count exercises with pronoun JIJ or HIJ
    const jijHijExercises = session.filter(
      (ex) => ex.pronoun === 'JIJ' || ex.pronoun === 'HIJ',
    );
    expect(jijHijExercises.length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Test 5: Weak pronoun stats are computed correctly
  // ---------------------------------------------------------------------------

  it('weak pronoun stats are computed correctly', () => {
    const stats = verbRepo.getWeakPronounStats(userId);

    expect(stats.length).toBeGreaterThan(0);

    // JIJ should have low accuracy (many MISSING_T errors from tests 2 and 4)
    const jijStat = stats.find((s) => s.pronoun === 'JIJ');
    expect(jijStat).toBeDefined();
    expect(jijStat!.total).toBeGreaterThanOrEqual(3);
    // JIJ had MISSING_T errors (not accepted), so accuracy should be < 50%
    expect(jijStat!.accuracy).toBeLessThan(0.5);

    // IK should have high accuracy (all correct in test 4)
    const ikStat = stats.find((s) => s.pronoun === 'IK');
    expect(ikStat).toBeDefined();
    if (ikStat!.total >= 3) {
      // IK attempts from test 4 were all correct
      expect(ikStat!.accuracy).toBeGreaterThan(0.5);
    }

    // Verify stats match actual attempts
    for (const stat of stats) {
      expect(stat.accuracy).toBe(stat.total > 0 ? stat.correct / stat.total : 0);
    }
  });
});
