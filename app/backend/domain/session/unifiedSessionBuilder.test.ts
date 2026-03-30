import { describe, it, expect, vi } from 'vitest';
import { createUnifiedSessionBuilder, type UnifiedSessionBuilderDeps } from './unifiedSessionBuilder';
import type { ScoredItem } from '../scheduler/scoringEngine';

function makeMockDeps(overrides: Partial<UnifiedSessionBuilderDeps> = {}): UnifiedSessionBuilderDeps {
  return {
    courseRepo: {
      getModulesByCourse: vi.fn().mockReturnValue([
        { id: 'mod-1', courseId: 'course-1', title: 'M1', orderIndex: 0 },
      ]),
      getLessonsByModule: vi.fn().mockReturnValue([
        { id: 'lesson-1', moduleId: 'mod-1', title: 'L1', orderIndex: 0 },
      ]),
      getClassGroupsByLesson: vi.fn().mockReturnValue([
        { id: 'cg-1', lessonId: 'lesson-1', type: 'vocabulary', title: 'Vocab', orderIndex: 0 },
      ]),
      getLessonById: vi.fn().mockReturnValue({ id: 'lesson-1', moduleId: 'mod-1' }),
      getModuleById: vi.fn().mockReturnValue({ id: 'mod-1', courseId: 'course-1' }),
      getAllCourses: vi.fn().mockReturnValue([]),
      getCourseById: vi.fn(),
      insertCourse: vi.fn(),
      updateCourse: vi.fn(),
      deleteCourse: vi.fn(),
      insertModule: vi.fn(),
      deleteModule: vi.fn(),
      insertLesson: vi.fn(),
      deleteLesson: vi.fn(),
      insertClassGroup: vi.fn(),
      deleteClassGroup: vi.fn(),
    } as any,
    contentRepo: {
      getVocabularyByClassGroup: vi.fn().mockReturnValue([
        { id: 'v-1', lemma: 'huis', displayText: 'huis', translation: 'house', classGroupId: 'cg-1', partOfSpeech: 'noun' },
        { id: 'v-2', lemma: 'straat', displayText: 'straat', translation: 'street', classGroupId: 'cg-1', partOfSpeech: 'noun' },
        { id: 'v-3', lemma: 'stad', displayText: 'stad', translation: 'city', classGroupId: 'cg-1', partOfSpeech: 'noun' },
        { id: 'v-4', lemma: 'land', displayText: 'land', translation: 'country', classGroupId: 'cg-1', partOfSpeech: 'noun' },
      ]),
      getVocabularyById: vi.fn().mockImplementation((id: string) => {
        const map: Record<string, any> = {
          'v-1': { id: 'v-1', lemma: 'huis', displayText: 'huis', translation: 'house', classGroupId: 'cg-1' },
          'v-2': { id: 'v-2', lemma: 'straat', displayText: 'straat', translation: 'street', classGroupId: 'cg-1' },
        };
        return map[id] ?? null;
      }),
      getSentenceById: vi.fn().mockReturnValue({
        id: 's-1', text: 'Het huis is groot', translation: 'The house is big',
      }),
      getDialogById: vi.fn().mockReturnValue({
        id: 'd-1', lessonId: 'lesson-1', title: 'At the store', scenario: 'shopping',
      }),
      getTurnsByDialog: vi.fn().mockReturnValue([
        { id: 'dt-1', dialogId: 'd-1', speaker: 'A', text: 'Goedemorgen', translation: 'Good morning', orderIndex: 0 },
        { id: 'dt-2', dialogId: 'd-1', speaker: 'B', text: 'Hallo', translation: 'Hello', orderIndex: 1 },
      ]),
      getSentencesByLesson: vi.fn().mockReturnValue([]),
      getDialogsByLesson: vi.fn().mockReturnValue([]),
    } as any,
    reviewRepo: {
      getDueItems: vi.fn().mockReturnValue([
        { entityId: 'v-1', entityType: 'vocabulary', currentStage: 'recognized', dueAt: '2026-03-29T00:00:00Z', lastSeenAt: '2026-03-28T00:00:00Z', failCount: 2 },
        { entityId: 'v-2', entityType: 'vocabulary', currentStage: 'new', dueAt: '2026-03-29T00:00:00Z', lastSeenAt: null, failCount: 0 },
        { entityId: 's-1', entityType: 'sentence', currentStage: 'seen', dueAt: '2026-03-29T00:00:00Z', lastSeenAt: '2026-03-28T12:00:00Z', failCount: 1 },
      ]),
      getWeakItems: vi.fn().mockReturnValue([]),
      getRecentErrorItems: vi.fn().mockReturnValue([]),
      getLowestMasteryItems: vi.fn().mockReturnValue([]),
      getReviewState: vi.fn().mockReturnValue(null),
      getAllReviewStates: vi.fn().mockReturnValue([]),
    } as any,
    sessionRepo: {
      getCompletedSessionCount: vi.fn().mockReturnValue(0),
      getRecentAnswersForEntities: vi.fn().mockReturnValue({}),
    } as any,
    verbRepo: {
      getVerbById: vi.fn().mockReturnValue({
        id: 'verb-1', infinitive: 'werken', translation: 'to work',
      }),
      getAllFormsMap: vi.fn().mockReturnValue({
        IK: 'werk', JIJ: 'werkt', HIJ: 'werkt', WIJ: 'werken',
      }),
    } as any,
    ...overrides,
  };
}

describe('unifiedSessionBuilder', () => {
  it('builds a session with exercises from the item pool', () => {
    const deps = makeMockDeps();
    const builder = createUnifiedSessionBuilder(deps);
    const plan = builder.buildSession({
      userId: 'default',
      courseId: 'course-1',
      mode: 'unified-learning',
      maxItems: 10,
    });

    expect(plan.exercises.length).toBeGreaterThan(0);
    expect(plan.sessionMeta.mode).toBe('unified-learning');
    expect(plan.sessionMeta.courseId).toBe('course-1');
  });

  it('returns cold start phase based on session count', () => {
    const deps = makeMockDeps();
    const builder = createUnifiedSessionBuilder(deps);

    // Session count = 0 → early
    const plan = builder.buildSession({
      userId: 'default',
      courseId: 'course-1',
      mode: 'unified-learning',
    });
    expect(plan.sessionMeta.coldStartPhase).toBe('early');
  });

  it('returns mid phase for session count 3-9', () => {
    const deps = makeMockDeps({
      sessionRepo: {
        getCompletedSessionCount: vi.fn().mockReturnValue(5),
        getRecentAnswersForEntities: vi.fn().mockReturnValue({}),
      } as any,
    });
    const builder = createUnifiedSessionBuilder(deps);
    const plan = builder.buildSession({
      userId: 'default',
      courseId: 'course-1',
      mode: 'unified-learning',
    });
    expect(plan.sessionMeta.coldStartPhase).toBe('mid');
  });

  it('returns full phase for session count 10+', () => {
    const deps = makeMockDeps({
      sessionRepo: {
        getCompletedSessionCount: vi.fn().mockReturnValue(15),
        getRecentAnswersForEntities: vi.fn().mockReturnValue({}),
      } as any,
    });
    const builder = createUnifiedSessionBuilder(deps);
    const plan = builder.buildSession({
      userId: 'default',
      courseId: 'course-1',
      mode: 'unified-learning',
    });
    expect(plan.sessionMeta.coldStartPhase).toBe('full');
  });

  it('applies adaptation when recent answers show struggling', () => {
    const deps = makeMockDeps();
    const builder = createUnifiedSessionBuilder(deps);
    const plan = builder.buildSession({
      userId: 'default',
      courseId: 'course-1',
      mode: 'unified-learning',
      recentAnswers: Array(10).fill({ isCorrect: false, responseTimeMs: 5000 }),
    });
    expect(plan.sessionMeta.adaptationApplied).toBe(true);
  });

  it('returns empty exercises when pool is empty', () => {
    const deps = makeMockDeps({
      reviewRepo: {
        getDueItems: vi.fn().mockReturnValue([]),
        getWeakItems: vi.fn().mockReturnValue([]),
        getRecentErrorItems: vi.fn().mockReturnValue([]),
        getLowestMasteryItems: vi.fn().mockReturnValue([]),
        getReviewState: vi.fn().mockReturnValue(null),
        getAllReviewStates: vi.fn().mockReturnValue([]),
      } as any,
    });
    const builder = createUnifiedSessionBuilder(deps);
    const plan = builder.buildSession({
      userId: 'default',
      courseId: 'course-1',
      mode: 'unified-learning',
    });
    expect(plan.exercises).toHaveLength(0);
  });

  it('generates vocabulary exercises with correct types', () => {
    const deps = makeMockDeps();
    const builder = createUnifiedSessionBuilder(deps);
    const plan = builder.buildSession({
      userId: 'default',
      courseId: 'course-1',
      mode: 'unified-learning',
    });

    const vocabExercises = plan.exercises.filter(
      (e) => e.sourceEntityType === 'vocabulary',
    );
    expect(vocabExercises.length).toBeGreaterThan(0);
    for (const ex of vocabExercises) {
      expect(['translation-choice', 'typed-gap-fill']).toContain(ex.exerciseType);
    }
  });

  it('generates sentence exercises', () => {
    const deps = makeMockDeps();
    const builder = createUnifiedSessionBuilder(deps);
    const plan = builder.buildSession({
      userId: 'default',
      courseId: 'course-1',
      mode: 'unified-learning',
    });

    const sentenceExercises = plan.exercises.filter(
      (e) => e.sourceEntityType === 'sentence',
    );
    expect(sentenceExercises.length).toBeGreaterThan(0);
  });

  it('each exercise has a unique id', () => {
    const deps = makeMockDeps();
    const builder = createUnifiedSessionBuilder(deps);
    const plan = builder.buildSession({
      userId: 'default',
      courseId: 'course-1',
      mode: 'unified-learning',
    });

    const ids = plan.exercises.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // -----------------------------------------------------------------------
  // Direct exercise generator tests
  // -----------------------------------------------------------------------

  function makeScoredItem(overrides: Partial<ScoredItem> = {}): ScoredItem {
    return {
      entityId: 'v-1',
      entityType: 'vocabulary',
      isNew: false,
      dueAt: '2026-03-29T00:00:00Z',
      lastSeenAt: '2026-03-28T00:00:00Z',
      errorsLast10: 0,
      score: 0.5,
      components: { dueScore: 0.5, errorScore: 0, recencyScore: 0, typeBoost: 0 },
      ...overrides,
    };
  }

  it('generateConjugationExercise returns exercise for verb:pronoun entityId', () => {
    const deps = makeMockDeps({
      verbRepo: {
        getVerbById: vi.fn().mockReturnValue({
          id: 'verb-1', infinitive: 'werken', translation: 'to work',
        }),
        getAllFormsMap: vi.fn().mockReturnValue({
          IK: 'werk', JIJ: 'werkt', HIJ: 'werkt', WIJ: 'werken',
        }),
      } as any,
    });
    const builder = createUnifiedSessionBuilder(deps);
    const item = makeScoredItem({
      entityId: 'verb-1:IK',
      entityType: 'conjugation',
    });
    const exercise = builder.generateExerciseForItem(item, 0);

    expect(exercise).not.toBeNull();
    expect(exercise!.exerciseType).toBe('conjugation-typed');
    expect(exercise!.sourceEntityType).toBe('conjugation');
    expect(exercise!.sourceEntityId).toBe('verb-1:IK');
    expect(exercise!.correctAnswer).toBe('werk');
  });

  it('generateConjugationExercise returns null for missing verb', () => {
    const deps = makeMockDeps({
      verbRepo: {
        getVerbById: vi.fn().mockReturnValue(null),
        getAllFormsMap: vi.fn().mockReturnValue({}),
      } as any,
    });
    const builder = createUnifiedSessionBuilder(deps);
    const item = makeScoredItem({
      entityId: 'verb-missing:IK',
      entityType: 'conjugation',
    });
    const exercise = builder.generateExerciseForItem(item, 0);
    expect(exercise).toBeNull();
  });

  it('generateDialogExercise returns dialog-completion exercise', () => {
    const deps = makeMockDeps({
      contentRepo: {
        getDialogById: vi.fn().mockReturnValue({
          id: 'd-1', lessonId: 'lesson-1', title: 'At the store', scenario: 'shopping',
        }),
        getTurnsByDialog: vi.fn().mockReturnValue([
          { id: 'dt-1', dialogId: 'd-1', speaker: 'A', text: 'Goedemorgen', translation: 'Good morning', orderIndex: 0 },
          { id: 'dt-2', dialogId: 'd-1', speaker: 'B', text: 'Hallo', translation: 'Hello', orderIndex: 1 },
        ]),
        getVocabularyById: vi.fn().mockReturnValue(null),
        getVocabularyByClassGroup: vi.fn().mockReturnValue([]),
        getSentenceById: vi.fn().mockReturnValue(null),
        getSentencesByLesson: vi.fn().mockReturnValue([]),
        getDialogsByLesson: vi.fn().mockReturnValue([]),
      } as any,
    });
    const builder = createUnifiedSessionBuilder(deps);
    const item = makeScoredItem({
      entityId: 'd-1',
      entityType: 'dialog',
    });
    const exercise = builder.generateExerciseForItem(item, 0);

    expect(exercise).not.toBeNull();
    expect(exercise!.exerciseType).toBe('dialog-completion');
    expect(exercise!.sourceEntityType).toBe('dialog');
  });

  it('generateDialogExercise returns null when no turns', () => {
    const deps = makeMockDeps({
      contentRepo: {
        getDialogById: vi.fn().mockReturnValue({
          id: 'd-1', lessonId: 'lesson-1', title: 'At the store', scenario: 'shopping',
        }),
        getTurnsByDialog: vi.fn().mockReturnValue([]),
        getVocabularyById: vi.fn().mockReturnValue(null),
        getVocabularyByClassGroup: vi.fn().mockReturnValue([]),
        getSentenceById: vi.fn().mockReturnValue(null),
        getSentencesByLesson: vi.fn().mockReturnValue([]),
        getDialogsByLesson: vi.fn().mockReturnValue([]),
      } as any,
    });
    const builder = createUnifiedSessionBuilder(deps);
    const item = makeScoredItem({
      entityId: 'd-1',
      entityType: 'dialog',
    });
    const exercise = builder.generateExerciseForItem(item, 0);
    expect(exercise).toBeNull();
  });

  it('generateVocabExercise falls back to typed when insufficient distractors', () => {
    const singleVocab = { id: 'v-1', lemma: 'huis', displayText: 'huis', translation: 'house', classGroupId: 'cg-1' };
    const deps = makeMockDeps({
      contentRepo: {
        getVocabularyById: vi.fn().mockReturnValue(singleVocab),
        getVocabularyByClassGroup: vi.fn().mockReturnValue([singleVocab]),
        getSentenceById: vi.fn().mockReturnValue(null),
        getDialogById: vi.fn().mockReturnValue(null),
        getTurnsByDialog: vi.fn().mockReturnValue([]),
        getSentencesByLesson: vi.fn().mockReturnValue([]),
        getDialogsByLesson: vi.fn().mockReturnValue([]),
      } as any,
    });
    const builder = createUnifiedSessionBuilder(deps);
    const item = makeScoredItem({
      entityId: 'v-1',
      entityType: 'vocabulary',
      isNew: true,
    });
    const exercise = builder.generateExerciseForItem(item, 0);

    expect(exercise).not.toBeNull();
    expect(exercise!.exerciseType).toBe('typed-gap-fill');
  });

  it('generateSentenceExercise returns null for missing sentence', () => {
    const deps = makeMockDeps({
      contentRepo: {
        getSentenceById: vi.fn().mockReturnValue(null),
        getVocabularyById: vi.fn().mockReturnValue(null),
        getVocabularyByClassGroup: vi.fn().mockReturnValue([]),
        getDialogById: vi.fn().mockReturnValue(null),
        getTurnsByDialog: vi.fn().mockReturnValue([]),
        getSentencesByLesson: vi.fn().mockReturnValue([]),
        getDialogsByLesson: vi.fn().mockReturnValue([]),
      } as any,
    });
    const builder = createUnifiedSessionBuilder(deps);
    const item = makeScoredItem({
      entityId: 's-missing',
      entityType: 'sentence',
    });
    const exercise = builder.generateExerciseForItem(item, 0);
    expect(exercise).toBeNull();
  });
});
