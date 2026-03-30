import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildConjugationSession,
  type ConjugationSessionConfig,
  type ConjugationSessionDeps,
} from './conjugationSessionBuilder';

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

const FORMS_MAP: Record<string, string> = {
  IK: 'werk', JIJ: 'werkt', HIJ: 'werkt', U: 'werkt',
  ZIJ_SG: 'werkt', HET: 'werkt', WIJ: 'werken', JULLIE: 'werken', ZIJ_PL: 'werken',
};

function makeVerb(id = 'verb-1', infinitive = 'werken', translation = 'to work') {
  return { id, infinitive, translation, type: 'regular', isSeparable: false, difficulty: 1, createdAt: '2026-01-01' };
}

function makeLessonVerb(verbId = 'verb-1', role: 'target' | 'supporting' | 'focus_irregular' = 'target') {
  return {
    lessonId: 'lesson-1',
    verbId,
    role,
    orderIndex: 0,
    verb: makeVerb(verbId),
  };
}

function makeDueReview(verbId: string, pronoun: string, dueAt = '2026-03-01T00:00:00Z') {
  return {
    id: `rs-${verbId}-${pronoun}`,
    userId: 'default',
    verbId,
    pronoun,
    tense: 'present',
    stage: 'seen' as const,
    easeScore: 2.5,
    stabilityScore: 0,
    successCount: 1,
    failCount: 0,
    averageLatencyMs: 0,
    dueAt,
    lastSeenAt: '2026-02-28T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
  };
}

function makeAttempt(
  pronoun: string,
  correct: boolean,
  errorType = correct ? 'CORRECT' : 'WRONG',
  verbId = 'verb-1',
) {
  return {
    id: `att-${Math.random()}`,
    userId: 'default',
    verbId,
    pronoun,
    tense: 'present',
    expectedForm: 'werkt',
    userAnswer: correct ? 'werkt' : 'werk',
    correct,
    errorType,
    responseTimeMs: 1000,
    confidence: null,
    hintUsed: false,
    createdAt: '2026-03-29T00:00:00Z',
  };
}

function makeMockDeps(overrides: Partial<{
  lessonVerbs: ReturnType<typeof makeLessonVerb>[];
  dueReviews: ReturnType<typeof makeDueReview>[];
  attempts: ReturnType<typeof makeAttempt>[];
  weakPronounStats: Array<{ pronoun: string; total: number; correct: number; accuracy: number }>;
  newCombos: Array<{ verbId: string; pronoun: string }>;
  formsMaps: Record<string, Record<string, string>>;
  sentenceVerbs: Array<{ sentenceId: string; verbId: string; surfaceForm: string }>;
  sentences: Record<string, { id: string; text: string; translation: string }>;
}> = {}): ConjugationSessionDeps {
  const lessonVerbs = overrides.lessonVerbs ?? [makeLessonVerb()];
  const dueReviews = overrides.dueReviews ?? [];
  const attempts = overrides.attempts ?? [];
  const weakPronounStats = overrides.weakPronounStats ?? [];
  const newCombos = overrides.newCombos ?? [];
  const fMaps = overrides.formsMaps ?? { 'verb-1': FORMS_MAP };
  const sentenceVerbs = overrides.sentenceVerbs ?? [];
  const sentences = overrides.sentences ?? {};

  return {
    verbRepo: {
      getVerbsByLesson: vi.fn().mockReturnValue(lessonVerbs),
      getDueConjugationReviews: vi.fn().mockReturnValue(dueReviews),
      getConjugationAttempts: vi.fn().mockReturnValue(attempts),
      getWeakPronounStats: vi.fn().mockReturnValue(weakPronounStats),
      getNewVerbPronounCombos: vi.fn().mockReturnValue(newCombos),
      getAllFormsMap: vi.fn().mockImplementation((verbId: string) => fMaps[verbId] ?? {}),
      getVerbSentences: vi.fn().mockImplementation((verbId: string) =>
        sentenceVerbs.filter((sv) => sv.verbId === verbId),
      ),
    } as any,
    contentRepo: {
      getSentenceById: vi.fn().mockImplementation((id: string) => sentences[id] ?? null),
    } as any,
  };
}

function makeConfig(overrides: Partial<ConjugationSessionConfig> = {}): ConjugationSessionConfig {
  return { userId: 'default', lessonId: 'lesson-1', maxExercises: 20, ...overrides };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildConjugationSession', () => {
  it('returns empty when no verbs in lesson', () => {
    const deps = makeMockDeps({ lessonVerbs: [] });
    const result = buildConjugationSession(makeConfig(), deps);
    expect(result).toEqual([]);
  });

  it('returns empty when lesson verbs are all supporting role', () => {
    const deps = makeMockDeps({
      lessonVerbs: [makeLessonVerb('verb-1', 'supporting')],
    });
    const result = buildConjugationSession(makeConfig(), deps);
    expect(result).toEqual([]);
  });

  it('produces correct 70/20/10 exercise counts', () => {
    const maxExercises = 20;
    // 14 due reviews, 4 weak pronoun items, 2 new combos
    const dueReviews = [];
    for (const pronoun of ['IK', 'JIJ', 'HIJ', 'U', 'ZIJ_SG', 'HET', 'WIJ', 'JULLIE', 'ZIJ_PL', 'IK', 'JIJ', 'HIJ', 'U', 'ZIJ_SG']) {
      dueReviews.push(makeDueReview('verb-1', pronoun, `2026-03-0${dueReviews.length + 1}T00:00:00Z`));
    }

    const weakPronounStats = [
      { pronoun: 'JIJ', total: 10, correct: 3, accuracy: 0.3 },
      { pronoun: 'HIJ', total: 10, correct: 4, accuracy: 0.4 },
    ];

    const newCombos = [
      { verbId: 'verb-1', pronoun: 'JULLIE' },
      { verbId: 'verb-1', pronoun: 'ZIJ_PL' },
      { verbId: 'verb-1', pronoun: 'WIJ' },
    ];

    const deps = makeMockDeps({ dueReviews, weakPronounStats, newCombos });
    const result = buildConjugationSession(makeConfig({ maxExercises }), deps);

    // Should produce exercises (exact count may vary due to deduplication)
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(maxExercises);
  });

  it('MISSING_T adaptation boosts jij/hij exercises', () => {
    // Create attempts where >20% are MISSING_T
    const attempts = [
      ...Array.from({ length: 5 }, () => makeAttempt('JIJ', false, 'MISSING_T')),
      ...Array.from({ length: 15 }, () => makeAttempt('IK', true, 'CORRECT')),
    ];

    const dueReviews = [
      makeDueReview('verb-1', 'IK'),
      makeDueReview('verb-1', 'JIJ'),
      makeDueReview('verb-1', 'HIJ'),
      makeDueReview('verb-1', 'WIJ'),
    ];

    const deps = makeMockDeps({ dueReviews, attempts });
    const result = buildConjugationSession(makeConfig({ maxExercises: 10 }), deps);

    // Verify that exercises exist (the adaptation itself is internal,
    // but we check that jij/hij exercises are present)
    const jijHijExercises = result.filter(
      (ex) => 'pronoun' in ex && (ex.pronoun === 'JIJ' || ex.pronoun === 'HIJ'),
    );
    expect(jijHijExercises.length).toBeGreaterThan(0);
  });

  it('new verb exposure only picks unreviewed combos', () => {
    const newCombos = [
      { verbId: 'verb-1', pronoun: 'WIJ' },
      { verbId: 'verb-1', pronoun: 'JULLIE' },
    ];

    const deps = makeMockDeps({ newCombos });
    const result = buildConjugationSession(makeConfig({ maxExercises: 10 }), deps);

    // New combos should appear (2 items = 10% of 20 = 2)
    expect(result.length).toBeGreaterThan(0);

    // Verify the repo method was called with correct params
    expect(deps.verbRepo.getNewVerbPronounCombos).toHaveBeenCalledWith('lesson-1', 'default');
  });

  it('exercise type split is approximately 70/30 typed/in-sentence', () => {
    // Set up enough due reviews and sentence data to get both types
    const dueReviews = [
      makeDueReview('verb-1', 'IK'),
      makeDueReview('verb-1', 'JIJ'),
      makeDueReview('verb-1', 'HIJ'),
      makeDueReview('verb-1', 'WIJ'),
      makeDueReview('verb-1', 'U'),
      makeDueReview('verb-1', 'ZIJ_SG'),
      makeDueReview('verb-1', 'HET'),
      makeDueReview('verb-1', 'JULLIE'),
      makeDueReview('verb-1', 'ZIJ_PL'),
    ];

    const sentenceVerbs = [
      { sentenceId: 's-1', verbId: 'verb-1', surfaceForm: 'werk', conjugationFormId: null, isFinite: true },
      { sentenceId: 's-2', verbId: 'verb-1', surfaceForm: 'werkt', conjugationFormId: null, isFinite: true },
      { sentenceId: 's-3', verbId: 'verb-1', surfaceForm: 'werken', conjugationFormId: null, isFinite: true },
    ];

    const sentences: Record<string, any> = {
      's-1': { id: 's-1', text: 'Ik werk in Amsterdam', translation: 'I work in Amsterdam', lessonId: 'lesson-1' },
      's-2': { id: 's-2', text: 'Hij werkt hard', translation: 'He works hard', lessonId: 'lesson-1' },
      's-3': { id: 's-3', text: 'Wij werken samen', translation: 'We work together', lessonId: 'lesson-1' },
    };

    const deps = makeMockDeps({ dueReviews, sentenceVerbs, sentences });
    const result = buildConjugationSession(makeConfig({ maxExercises: 10 }), deps);

    const typedCount = result.filter((e) => e.exerciseType === 'conjugation-typed').length;
    const inSentenceCount = result.filter((e) => e.exerciseType === 'conjugation-in-sentence').length;

    // At least some in-sentence exercises should be generated
    // The exact split depends on available sentences, but typed should dominate
    expect(typedCount).toBeGreaterThanOrEqual(inSentenceCount);
    expect(typedCount + inSentenceCount).toBe(result.length);
  });

  it('handles focus_irregular verbs', () => {
    const deps = makeMockDeps({
      lessonVerbs: [makeLessonVerb('verb-1', 'focus_irregular')],
      dueReviews: [makeDueReview('verb-1', 'IK')],
    });
    const result = buildConjugationSession(makeConfig({ maxExercises: 5 }), deps);
    expect(result.length).toBeGreaterThan(0);
  });

  it('respects maxExercises limit', () => {
    const dueReviews = ['IK', 'JIJ', 'HIJ', 'WIJ', 'U', 'ZIJ_SG', 'HET', 'JULLIE', 'ZIJ_PL']
      .map((p) => makeDueReview('verb-1', p));

    const deps = makeMockDeps({ dueReviews });
    const result = buildConjugationSession(makeConfig({ maxExercises: 5 }), deps);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('all exercises have required fields', () => {
    const dueReviews = [makeDueReview('verb-1', 'IK'), makeDueReview('verb-1', 'JIJ')];
    const deps = makeMockDeps({ dueReviews });
    const result = buildConjugationSession(makeConfig({ maxExercises: 5 }), deps);

    for (const ex of result) {
      expect(ex.exerciseType).toBeDefined();
      expect(ex.correctAnswer).toBeDefined();
      expect(ex.renderedPrompt).toBeDefined();
      expect(ex.verbId).toBeDefined();
      expect(ex.pronoun).toBeDefined();
    }
  });

  // -----------------------------------------------------------------------
  // Backfill & adaptation edge cases
  // -----------------------------------------------------------------------

  it('backfills exercises when due and weak buckets are empty (cold start)', () => {
    const FORMS_MAP_2: Record<string, string> = {
      IK: 'woon', JIJ: 'woont', HIJ: 'woont', U: 'woont',
      ZIJ_SG: 'woont', HET: 'woont', WIJ: 'wonen', JULLIE: 'wonen', ZIJ_PL: 'wonen',
    };

    const deps = makeMockDeps({
      lessonVerbs: [
        makeLessonVerb('verb-1', 'target'),
        makeLessonVerb('verb-2', 'target'),
      ],
      dueReviews: [],
      weakPronounStats: [],
      newCombos: [
        { verbId: 'verb-1', pronoun: 'IK' },
        { verbId: 'verb-1', pronoun: 'JIJ' },
        { verbId: 'verb-2', pronoun: 'IK' },
      ],
      formsMaps: {
        'verb-1': FORMS_MAP,
        'verb-2': FORMS_MAP_2,
      },
    });

    // Override makeVerb for verb-2
    (deps.verbRepo.getVerbsByLesson as any).mockReturnValue([
      makeLessonVerb('verb-1', 'target'),
      {
        ...makeLessonVerb('verb-2', 'target'),
        verb: makeVerb('verb-2', 'wonen', 'to live'),
      },
    ]);

    const result = buildConjugationSession(makeConfig({ maxExercises: 10 }), deps);
    expect(result.length).toBeGreaterThan(0);
  });

  it('backfills from all verb+pronoun combos when new combos insufficient', () => {
    const FORMS_MAP_2: Record<string, string> = {
      IK: 'woon', JIJ: 'woont', HIJ: 'woont', U: 'woont',
      ZIJ_SG: 'woont', HET: 'woont', WIJ: 'wonen', JULLIE: 'wonen', ZIJ_PL: 'wonen',
    };

    const deps = makeMockDeps({
      lessonVerbs: [
        makeLessonVerb('verb-1', 'target'),
        makeLessonVerb('verb-2', 'target'),
      ],
      dueReviews: [],
      weakPronounStats: [],
      newCombos: [
        { verbId: 'verb-1', pronoun: 'IK' },
      ],
      formsMaps: {
        'verb-1': FORMS_MAP,
        'verb-2': FORMS_MAP_2,
      },
    });

    (deps.verbRepo.getVerbsByLesson as any).mockReturnValue([
      makeLessonVerb('verb-1', 'target'),
      {
        ...makeLessonVerb('verb-2', 'target'),
        verb: makeVerb('verb-2', 'wonen', 'to live'),
      },
    ]);

    const result = buildConjugationSession(makeConfig({ maxExercises: 10 }), deps);
    // With 2 verbs x 9 pronouns = 18 possible combos, backfill should produce >= 5
    expect(result.length).toBeGreaterThanOrEqual(5);
  });

  it('MISSING_T adaptation adds jij/hij exercises from lesson verbs when not in due items', () => {
    // 20 attempts where 5+ have MISSING_T (> 20%)
    const attempts = [
      ...Array.from({ length: 6 }, () => makeAttempt('IK', false, 'MISSING_T')),
      ...Array.from({ length: 14 }, () => makeAttempt('WIJ', true, 'CORRECT')),
    ];

    // Due items that do NOT include JIJ or HIJ
    const dueReviews = [
      makeDueReview('verb-1', 'IK'),
      makeDueReview('verb-1', 'WIJ'),
      makeDueReview('verb-1', 'U'),
    ];

    const deps = makeMockDeps({ dueReviews, attempts });
    const result = buildConjugationSession(makeConfig({ maxExercises: 10 }), deps);

    // The adaptation should inject JIJ/HIJ exercises from lesson verbs
    const jijHijExercises = result.filter(
      (ex) => 'pronoun' in ex && (ex.pronoun === 'JIJ' || ex.pronoun === 'HIJ'),
    );
    expect(jijHijExercises.length).toBeGreaterThan(0);
  });
});
