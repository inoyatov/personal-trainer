import { describe, it, expect, vi } from 'vitest';
import { computeVocabCoverage, computeTotalVocabCoverage } from './vocabCoverageService';
import type { CourseRepository } from '../../db/repositories/courseRepository';
import type { ContentRepository } from '../../db/repositories/contentRepository';
import type { ReviewRepository } from '../../db/repositories/reviewRepository';

function makeCourseRepo(overrides: Partial<CourseRepository> = {}): CourseRepository {
  return {
    getAllCourses: vi.fn().mockReturnValue([]),
    getCourseById: vi.fn(),
    insertCourse: vi.fn(),
    updateCourse: vi.fn(),
    deleteCourse: vi.fn(),
    getModulesByCourse: vi.fn().mockReturnValue([]),
    getLessonsByModule: vi.fn().mockReturnValue([]),
    getClassGroupsByLesson: vi.fn().mockReturnValue([]),
    getLessonById: vi.fn(),
    getModuleById: vi.fn(),
    insertModule: vi.fn(),
    deleteModule: vi.fn(),
    insertLesson: vi.fn(),
    deleteLesson: vi.fn(),
    insertClassGroup: vi.fn(),
    deleteClassGroup: vi.fn(),
    ...overrides,
  } as any;
}

function makeContentRepo(overrides: Partial<ContentRepository> = {}): ContentRepository {
  return {
    getVocabularyByClassGroup: vi.fn().mockReturnValue([]),
    getVocabularyById: vi.fn(),
    getSentenceById: vi.fn(),
    getDialogById: vi.fn(),
    getTurnsByDialog: vi.fn().mockReturnValue([]),
    getSentencesByLesson: vi.fn().mockReturnValue([]),
    getDialogsByLesson: vi.fn().mockReturnValue([]),
    ...overrides,
  } as any;
}

function makeReviewRepo(overrides: Partial<ReviewRepository> = {}): ReviewRepository {
  return {
    getReviewState: vi.fn().mockReturnValue(null),
    getDueItems: vi.fn().mockReturnValue([]),
    getWeakItems: vi.fn().mockReturnValue([]),
    getRecentErrorItems: vi.fn().mockReturnValue([]),
    getLowestMasteryItems: vi.fn().mockReturnValue([]),
    getAllReviewStates: vi.fn().mockReturnValue([]),
    ...overrides,
  } as any;
}

describe('computeVocabCoverage', () => {
  it('returns zero stats when course has no modules', () => {
    const courseRepo = makeCourseRepo({
      getModulesByCourse: vi.fn().mockReturnValue([]),
    });
    const contentRepo = makeContentRepo();
    const reviewRepo = makeReviewRepo();

    const result = computeVocabCoverage('course-1', 'user-1', courseRepo, contentRepo, reviewRepo);

    expect(result).toEqual({
      totalWords: 0,
      wordsLearned: 0,
      wordsMastered: 0,
      targetWords: 0,
      progressPercent: 0,
    });
  });

  it('counts total words from vocab class groups', () => {
    const vocabItems = Array.from({ length: 10 }, (_, i) => ({
      id: `v-${i}`,
      lemma: `word${i}`,
      displayText: `word${i}`,
      translation: `trans${i}`,
      classGroupId: 'cg-1',
    }));

    const courseRepo = makeCourseRepo({
      getModulesByCourse: vi.fn().mockReturnValue([{ id: 'mod-1', courseId: 'course-1' }]),
      getLessonsByModule: vi.fn().mockReturnValue([{ id: 'lesson-1', moduleId: 'mod-1' }]),
      getClassGroupsByLesson: vi.fn().mockReturnValue([
        { id: 'cg-1', lessonId: 'lesson-1', type: 'vocabulary' },
      ]),
    });
    const contentRepo = makeContentRepo({
      getVocabularyByClassGroup: vi.fn().mockReturnValue(vocabItems),
    });
    const reviewRepo = makeReviewRepo();

    const result = computeVocabCoverage('course-1', 'user-1', courseRepo, contentRepo, reviewRepo);

    expect(result.totalWords).toBe(10);
    expect(result.wordsLearned).toBe(0);
  });

  it('counts learned words at stage >= seen', () => {
    const vocabItems = [
      { id: 'v-1', lemma: 'a' },
      { id: 'v-2', lemma: 'b' },
      { id: 'v-3', lemma: 'c' },
      { id: 'v-4', lemma: 'd' },
    ];

    const courseRepo = makeCourseRepo({
      getModulesByCourse: vi.fn().mockReturnValue([{ id: 'mod-1' }]),
      getLessonsByModule: vi.fn().mockReturnValue([{ id: 'lesson-1' }]),
      getClassGroupsByLesson: vi.fn().mockReturnValue([{ id: 'cg-1', type: 'vocabulary' }]),
    });
    const contentRepo = makeContentRepo({
      getVocabularyByClassGroup: vi.fn().mockReturnValue(vocabItems),
    });
    const reviewRepo = makeReviewRepo({
      getReviewState: vi.fn().mockImplementation((_userId: string, _type: string, entityId: string) => {
        const stages: Record<string, string> = {
          'v-1': 'seen',
          'v-2': 'recognized',
          'v-3': 'recalled',
          // v-4 has no review state
        };
        const stage = stages[entityId];
        return stage ? { currentStage: stage } : null;
      }),
    });

    const result = computeVocabCoverage('course-1', 'user-1', courseRepo, contentRepo, reviewRepo);

    expect(result.wordsLearned).toBe(3);
  });

  it('counts mastered words at stage >= recalled', () => {
    const vocabItems = [
      { id: 'v-1', lemma: 'a' },
      { id: 'v-2', lemma: 'b' },
      { id: 'v-3', lemma: 'c' },
      { id: 'v-4', lemma: 'd' },
      { id: 'v-5', lemma: 'e' },
    ];

    const courseRepo = makeCourseRepo({
      getModulesByCourse: vi.fn().mockReturnValue([{ id: 'mod-1' }]),
      getLessonsByModule: vi.fn().mockReturnValue([{ id: 'lesson-1' }]),
      getClassGroupsByLesson: vi.fn().mockReturnValue([{ id: 'cg-1', type: 'vocabulary' }]),
    });
    const contentRepo = makeContentRepo({
      getVocabularyByClassGroup: vi.fn().mockReturnValue(vocabItems),
    });
    const reviewRepo = makeReviewRepo({
      getReviewState: vi.fn().mockImplementation((_userId: string, _type: string, entityId: string) => {
        const stages: Record<string, string> = {
          'v-1': 'seen',        // learned, not mastered
          'v-2': 'recalled',    // mastered
          'v-3': 'stable',      // mastered
          'v-4': 'automated',   // mastered
          // v-5 has no review state
        };
        const stage = stages[entityId];
        return stage ? { currentStage: stage } : null;
      }),
    });

    const result = computeVocabCoverage('course-1', 'user-1', courseRepo, contentRepo, reviewRepo);

    expect(result.wordsMastered).toBe(3);
  });

  it('calculates progressPercent as wordsLearned/totalWords', () => {
    const vocabItems = Array.from({ length: 10 }, (_, i) => ({ id: `v-${i}`, lemma: `w${i}` }));

    const courseRepo = makeCourseRepo({
      getModulesByCourse: vi.fn().mockReturnValue([{ id: 'mod-1' }]),
      getLessonsByModule: vi.fn().mockReturnValue([{ id: 'lesson-1' }]),
      getClassGroupsByLesson: vi.fn().mockReturnValue([{ id: 'cg-1', type: 'vocabulary' }]),
    });
    const contentRepo = makeContentRepo({
      getVocabularyByClassGroup: vi.fn().mockReturnValue(vocabItems),
    });
    // Make 5 of 10 items learned
    const reviewRepo = makeReviewRepo({
      getReviewState: vi.fn().mockImplementation((_userId: string, _type: string, entityId: string) => {
        const idx = parseInt(entityId.split('-')[1], 10);
        return idx < 5 ? { currentStage: 'seen' } : null;
      }),
    });

    const result = computeVocabCoverage('course-1', 'user-1', courseRepo, contentRepo, reviewRepo);

    expect(result.progressPercent).toBe(50);
  });

  it('skips non-vocabulary class groups', () => {
    const courseRepo = makeCourseRepo({
      getModulesByCourse: vi.fn().mockReturnValue([{ id: 'mod-1' }]),
      getLessonsByModule: vi.fn().mockReturnValue([{ id: 'lesson-1' }]),
      getClassGroupsByLesson: vi.fn().mockReturnValue([
        { id: 'cg-dialog', lessonId: 'lesson-1', type: 'dialog' },
        { id: 'cg-grammar', lessonId: 'lesson-1', type: 'grammar' },
        { id: 'cg-vocab', lessonId: 'lesson-1', type: 'vocabulary' },
      ]),
    });
    const contentRepo = makeContentRepo({
      getVocabularyByClassGroup: vi.fn().mockImplementation((groupId: string) => {
        if (groupId === 'cg-vocab') return [{ id: 'v-1', lemma: 'huis' }];
        return [{ id: 'should-not-count', lemma: 'nope' }];
      }),
    });
    const reviewRepo = makeReviewRepo();

    const result = computeVocabCoverage('course-1', 'user-1', courseRepo, contentRepo, reviewRepo);

    expect(result.totalWords).toBe(1);
    expect(contentRepo.getVocabularyByClassGroup).toHaveBeenCalledTimes(1);
    expect(contentRepo.getVocabularyByClassGroup).toHaveBeenCalledWith('cg-vocab');
  });
});

describe('computeTotalVocabCoverage', () => {
  it('aggregates across multiple courses', () => {
    const courseRepo = makeCourseRepo({
      getAllCourses: vi.fn().mockReturnValue([
        { id: 'course-1' },
        { id: 'course-2' },
      ]),
      getModulesByCourse: vi.fn().mockImplementation((courseId: string) => [
        { id: `mod-${courseId}` },
      ]),
      getLessonsByModule: vi.fn().mockImplementation((modId: string) => [
        { id: `lesson-${modId}` },
      ]),
      getClassGroupsByLesson: vi.fn().mockImplementation((lessonId: string) => [
        { id: `cg-${lessonId}`, type: 'vocabulary' },
      ]),
    });
    const contentRepo = makeContentRepo({
      getVocabularyByClassGroup: vi.fn().mockImplementation((groupId: string) => {
        if (groupId === 'cg-lesson-mod-course-1') {
          return [
            { id: 'v-1', lemma: 'huis' },
            { id: 'v-2', lemma: 'straat' },
          ];
        }
        if (groupId === 'cg-lesson-mod-course-2') {
          return [
            { id: 'v-3', lemma: 'stad' },
          ];
        }
        return [];
      }),
    });
    const reviewRepo = makeReviewRepo({
      getReviewState: vi.fn().mockImplementation((_userId: string, _type: string, entityId: string) => {
        if (entityId === 'v-1') return { currentStage: 'seen' };
        if (entityId === 'v-3') return { currentStage: 'recalled' };
        return null;
      }),
    });

    const result = computeTotalVocabCoverage('user-1', courseRepo, contentRepo, reviewRepo);

    expect(result.totalWords).toBe(3);
    expect(result.wordsLearned).toBe(2);
    expect(result.wordsMastered).toBe(1);
  });

  it('deduplicates vocab items by ID', () => {
    const courseRepo = makeCourseRepo({
      getAllCourses: vi.fn().mockReturnValue([
        { id: 'course-1' },
        { id: 'course-2' },
      ]),
      getModulesByCourse: vi.fn().mockImplementation((courseId: string) => [
        { id: `mod-${courseId}` },
      ]),
      getLessonsByModule: vi.fn().mockImplementation((modId: string) => [
        { id: `lesson-${modId}` },
      ]),
      getClassGroupsByLesson: vi.fn().mockImplementation((lessonId: string) => [
        { id: `cg-${lessonId}`, type: 'vocabulary' },
      ]),
    });
    // Both courses contain v-shared
    const contentRepo = makeContentRepo({
      getVocabularyByClassGroup: vi.fn().mockImplementation((groupId: string) => {
        if (groupId === 'cg-lesson-mod-course-1') {
          return [
            { id: 'v-shared', lemma: 'huis' },
            { id: 'v-unique-1', lemma: 'straat' },
          ];
        }
        if (groupId === 'cg-lesson-mod-course-2') {
          return [
            { id: 'v-shared', lemma: 'huis' },
            { id: 'v-unique-2', lemma: 'stad' },
          ];
        }
        return [];
      }),
    });
    const reviewRepo = makeReviewRepo();

    const result = computeTotalVocabCoverage('user-1', courseRepo, contentRepo, reviewRepo);

    // v-shared counted once + v-unique-1 + v-unique-2 = 3
    expect(result.totalWords).toBe(3);
  });
});
