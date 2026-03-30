import { describe, it, expect, vi } from 'vitest';
import {
  createLessonFrontierService,
  type LessonFrontierService,
} from './lessonFrontier';

/**
 * Helpers to build mock repositories for testing.
 */

interface MockLesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  orderIndex: number;
  estimatedMinutes: number;
}

interface MockModule {
  id: string;
  courseId: string;
  title: string;
  orderIndex: number;
}

interface MockClassGroup {
  id: string;
  lessonId: string;
  type: 'vocabulary' | 'grammar' | 'dialog' | 'writing';
  title: string;
  orderIndex: number;
}

interface MockVocabItem {
  id: string;
  classGroupId: string | null;
  lemma: string;
  displayText: string;
  article: string | null;
  partOfSpeech: string;
  translation: string;
  transliteration: string | null;
  tags: string;
  difficulty: number;
}

interface MockReviewState {
  userId: string;
  entityType: string;
  entityId: string;
  currentStage: string;
}

function buildMocks(opts: {
  modules: MockModule[];
  lessons: MockLesson[];
  classGroups: MockClassGroup[];
  vocabItems: MockVocabItem[];
  reviewStates: MockReviewState[];
}) {
  const courseRepo = {
    getAllCourses: vi.fn(),
    getCourseById: vi.fn(),
    insertCourse: vi.fn(),
    updateCourse: vi.fn(),
    deleteCourse: vi.fn(),
    getModulesByCourse: vi.fn((courseId: string) =>
      opts.modules
        .filter((m) => m.courseId === courseId)
        .sort((a, b) => a.orderIndex - b.orderIndex),
    ),
    getModuleById: vi.fn((id: string) => opts.modules.find((m) => m.id === id)),
    insertModule: vi.fn(),
    deleteModule: vi.fn(),
    getLessonsByModule: vi.fn((moduleId: string) =>
      opts.lessons
        .filter((l) => l.moduleId === moduleId)
        .sort((a, b) => a.orderIndex - b.orderIndex),
    ),
    getLessonById: vi.fn((id: string) => opts.lessons.find((l) => l.id === id)),
    insertLesson: vi.fn(),
    deleteLesson: vi.fn(),
    getClassGroupsByLesson: vi.fn((lessonId: string) =>
      opts.classGroups
        .filter((cg) => cg.lessonId === lessonId)
        .sort((a, b) => a.orderIndex - b.orderIndex),
    ),
    insertClassGroup: vi.fn(),
    deleteClassGroup: vi.fn(),
  };

  const contentRepo = {
    getVocabularyByClassGroup: vi.fn((classGroupId: string) =>
      opts.vocabItems.filter((v) => v.classGroupId === classGroupId),
    ),
    getVocabularyById: vi.fn(),
    insertVocabulary: vi.fn(),
    deleteVocabulary: vi.fn(),
    getSentencesByLesson: vi.fn(),
    getSentencesByClassGroup: vi.fn(),
    getSentenceById: vi.fn(),
    insertSentence: vi.fn(),
    deleteSentence: vi.fn(),
    getDialogsByLesson: vi.fn(),
    getDialogById: vi.fn(),
    insertDialog: vi.fn(),
    deleteDialog: vi.fn(),
    getTurnsByDialog: vi.fn(),
    insertDialogTurn: vi.fn(),
    getGrammarPatternsByLesson: vi.fn(),
    getGrammarPatternById: vi.fn(),
    insertGrammarPattern: vi.fn(),
    deleteGrammarPattern: vi.fn(),
  };

  const reviewRepo = {
    getReviewState: vi.fn(
      (userId: string, entityType: string, entityId: string) =>
        opts.reviewStates.find(
          (rs) =>
            rs.userId === userId &&
            rs.entityType === entityType &&
            rs.entityId === entityId,
        ) ?? undefined,
    ),
    getDueItems: vi.fn(),
    getAllReviewStates: vi.fn(),
    upsertReviewState: vi.fn(),
    insertReviewState: vi.fn(),
    updateReviewState: vi.fn(),
    deleteReviewState: vi.fn(),
  };

  return { courseRepo, contentRepo, reviewRepo };
}

function makeVocabItem(id: string, classGroupId: string): MockVocabItem {
  return {
    id,
    classGroupId,
    lemma: id,
    displayText: id,
    article: null,
    partOfSpeech: 'noun',
    translation: id,
    transliteration: null,
    tags: '[]',
    difficulty: 1.0,
  };
}

describe('lessonFrontierService', () => {
  describe('first lesson is always unlocked', () => {
    it('should return true for the first lesson', () => {
      const { courseRepo, contentRepo, reviewRepo } = buildMocks({
        modules: [{ id: 'm1', courseId: 'c1', title: 'M1', orderIndex: 0 }],
        lessons: [
          {
            id: 'l1',
            moduleId: 'm1',
            title: 'L1',
            description: '',
            orderIndex: 0,
            estimatedMinutes: 15,
          },
        ],
        classGroups: [],
        vocabItems: [],
        reviewStates: [],
      });

      const service = createLessonFrontierService(
        courseRepo as any,
        contentRepo as any,
        reviewRepo as any,
      );

      expect(service.isLessonUnlocked('user1', 'l1')).toBe(true);
    });
  });

  describe('second lesson unlocked when first has >=80% vocab mastered', () => {
    it('should unlock second lesson when 80% of first lesson vocab is recalled', () => {
      // 5 vocab items, 4 at 'recalled' = 80%
      const vocabItems = Array.from({ length: 5 }, (_, i) =>
        makeVocabItem(`v${i}`, 'cg1'),
      );

      const reviewStates: MockReviewState[] = vocabItems
        .slice(0, 4)
        .map((v) => ({
          userId: 'user1',
          entityType: 'vocabulary',
          entityId: v.id,
          currentStage: 'recalled',
        }));

      const { courseRepo, contentRepo, reviewRepo } = buildMocks({
        modules: [{ id: 'm1', courseId: 'c1', title: 'M1', orderIndex: 0 }],
        lessons: [
          {
            id: 'l1',
            moduleId: 'm1',
            title: 'L1',
            description: '',
            orderIndex: 0,
            estimatedMinutes: 15,
          },
          {
            id: 'l2',
            moduleId: 'm1',
            title: 'L2',
            description: '',
            orderIndex: 1,
            estimatedMinutes: 15,
          },
        ],
        classGroups: [
          {
            id: 'cg1',
            lessonId: 'l1',
            type: 'vocabulary',
            title: 'Vocab',
            orderIndex: 0,
          },
        ],
        vocabItems,
        reviewStates,
      });

      const service = createLessonFrontierService(
        courseRepo as any,
        contentRepo as any,
        reviewRepo as any,
      );

      expect(service.isLessonUnlocked('user1', 'l2')).toBe(true);
    });
  });

  describe('second lesson locked when first has <80% mastered', () => {
    it('should keep second lesson locked when only 60% mastered', () => {
      // 5 vocab items, 3 at 'recalled' = 60%
      const vocabItems = Array.from({ length: 5 }, (_, i) =>
        makeVocabItem(`v${i}`, 'cg1'),
      );

      const reviewStates: MockReviewState[] = vocabItems
        .slice(0, 3)
        .map((v) => ({
          userId: 'user1',
          entityType: 'vocabulary',
          entityId: v.id,
          currentStage: 'recalled',
        }));

      const { courseRepo, contentRepo, reviewRepo } = buildMocks({
        modules: [{ id: 'm1', courseId: 'c1', title: 'M1', orderIndex: 0 }],
        lessons: [
          {
            id: 'l1',
            moduleId: 'm1',
            title: 'L1',
            description: '',
            orderIndex: 0,
            estimatedMinutes: 15,
          },
          {
            id: 'l2',
            moduleId: 'm1',
            title: 'L2',
            description: '',
            orderIndex: 1,
            estimatedMinutes: 15,
          },
        ],
        classGroups: [
          {
            id: 'cg1',
            lessonId: 'l1',
            type: 'vocabulary',
            title: 'Vocab',
            orderIndex: 0,
          },
        ],
        vocabItems,
        reviewStates,
      });

      const service = createLessonFrontierService(
        courseRepo as any,
        contentRepo as any,
        reviewRepo as any,
      );

      expect(service.isLessonUnlocked('user1', 'l2')).toBe(false);
    });
  });

  describe('empty course returns null frontier', () => {
    it('should return null for a course with no lessons', () => {
      const { courseRepo, contentRepo, reviewRepo } = buildMocks({
        modules: [],
        lessons: [],
        classGroups: [],
        vocabItems: [],
        reviewStates: [],
      });

      const service = createLessonFrontierService(
        courseRepo as any,
        contentRepo as any,
        reviewRepo as any,
      );

      expect(service.getCurrentFrontierLesson('user1', 'c1')).toBeNull();
    });
  });

  describe('course with single lesson', () => {
    it('should return the lesson as frontier when not mastered', () => {
      const vocabItems = Array.from({ length: 5 }, (_, i) =>
        makeVocabItem(`v${i}`, 'cg1'),
      );

      const { courseRepo, contentRepo, reviewRepo } = buildMocks({
        modules: [{ id: 'm1', courseId: 'c1', title: 'M1', orderIndex: 0 }],
        lessons: [
          {
            id: 'l1',
            moduleId: 'm1',
            title: 'L1',
            description: '',
            orderIndex: 0,
            estimatedMinutes: 15,
          },
        ],
        classGroups: [
          {
            id: 'cg1',
            lessonId: 'l1',
            type: 'vocabulary',
            title: 'Vocab',
            orderIndex: 0,
          },
        ],
        vocabItems,
        reviewStates: [],
      });

      const service = createLessonFrontierService(
        courseRepo as any,
        contentRepo as any,
        reviewRepo as any,
      );

      expect(service.getCurrentFrontierLesson('user1', 'c1')).toBe('l1');
      expect(service.isLessonUnlocked('user1', 'l1')).toBe(true);
    });

    it('should return null frontier when single lesson is fully mastered', () => {
      const vocabItems = Array.from({ length: 5 }, (_, i) =>
        makeVocabItem(`v${i}`, 'cg1'),
      );

      const reviewStates: MockReviewState[] = vocabItems.map((v) => ({
        userId: 'user1',
        entityType: 'vocabulary',
        entityId: v.id,
        currentStage: 'stable',
      }));

      const { courseRepo, contentRepo, reviewRepo } = buildMocks({
        modules: [{ id: 'm1', courseId: 'c1', title: 'M1', orderIndex: 0 }],
        lessons: [
          {
            id: 'l1',
            moduleId: 'm1',
            title: 'L1',
            description: '',
            orderIndex: 0,
            estimatedMinutes: 15,
          },
        ],
        classGroups: [
          {
            id: 'cg1',
            lessonId: 'l1',
            type: 'vocabulary',
            title: 'Vocab',
            orderIndex: 0,
          },
        ],
        vocabItems,
        reviewStates,
      });

      const service = createLessonFrontierService(
        courseRepo as any,
        contentRepo as any,
        reviewRepo as any,
      );

      expect(service.getCurrentFrontierLesson('user1', 'c1')).toBeNull();
    });
  });

  describe('getLessonUnlockStatus', () => {
    it('should return unlock status for all lessons in a course', () => {
      const vocabItemsL1 = Array.from({ length: 5 }, (_, i) =>
        makeVocabItem(`v${i}`, 'cg1'),
      );
      const vocabItemsL2 = Array.from({ length: 5 }, (_, i) =>
        makeVocabItem(`w${i}`, 'cg2'),
      );

      // 4 of 5 mastered in lesson 1 = 80% -> lesson 2 unlocked
      // 0 of 5 mastered in lesson 2 = 0% -> lesson 3 locked
      const reviewStates: MockReviewState[] = vocabItemsL1
        .slice(0, 4)
        .map((v) => ({
          userId: 'user1',
          entityType: 'vocabulary',
          entityId: v.id,
          currentStage: 'recalled',
        }));

      const { courseRepo, contentRepo, reviewRepo } = buildMocks({
        modules: [{ id: 'm1', courseId: 'c1', title: 'M1', orderIndex: 0 }],
        lessons: [
          {
            id: 'l1',
            moduleId: 'm1',
            title: 'L1',
            description: '',
            orderIndex: 0,
            estimatedMinutes: 15,
          },
          {
            id: 'l2',
            moduleId: 'm1',
            title: 'L2',
            description: '',
            orderIndex: 1,
            estimatedMinutes: 15,
          },
          {
            id: 'l3',
            moduleId: 'm1',
            title: 'L3',
            description: '',
            orderIndex: 2,
            estimatedMinutes: 15,
          },
        ],
        classGroups: [
          {
            id: 'cg1',
            lessonId: 'l1',
            type: 'vocabulary',
            title: 'Vocab',
            orderIndex: 0,
          },
          {
            id: 'cg2',
            lessonId: 'l2',
            type: 'vocabulary',
            title: 'Vocab',
            orderIndex: 0,
          },
        ],
        vocabItems: [...vocabItemsL1, ...vocabItemsL2],
        reviewStates,
      });

      const service = createLessonFrontierService(
        courseRepo as any,
        contentRepo as any,
        reviewRepo as any,
      );

      const status = service.getLessonUnlockStatus('user1', 'c1');
      expect(status).toEqual([
        { lessonId: 'l1', unlocked: true },
        { lessonId: 'l2', unlocked: true },
        { lessonId: 'l3', unlocked: false }, // l2 has 0% mastered vocab
      ]);
    });
  });

  describe('stages >= recalled count as mastered', () => {
    it('should count stable and automated stages as mastered', () => {
      const vocabItems = Array.from({ length: 5 }, (_, i) =>
        makeVocabItem(`v${i}`, 'cg1'),
      );

      // Mix of recalled, stable, automated = all count
      const reviewStates: MockReviewState[] = [
        {
          userId: 'user1',
          entityType: 'vocabulary',
          entityId: 'v0',
          currentStage: 'recalled',
        },
        {
          userId: 'user1',
          entityType: 'vocabulary',
          entityId: 'v1',
          currentStage: 'stable',
        },
        {
          userId: 'user1',
          entityType: 'vocabulary',
          entityId: 'v2',
          currentStage: 'automated',
        },
        {
          userId: 'user1',
          entityType: 'vocabulary',
          entityId: 'v3',
          currentStage: 'recalled',
        },
      ];

      const { courseRepo, contentRepo, reviewRepo } = buildMocks({
        modules: [{ id: 'm1', courseId: 'c1', title: 'M1', orderIndex: 0 }],
        lessons: [
          {
            id: 'l1',
            moduleId: 'm1',
            title: 'L1',
            description: '',
            orderIndex: 0,
            estimatedMinutes: 15,
          },
          {
            id: 'l2',
            moduleId: 'm1',
            title: 'L2',
            description: '',
            orderIndex: 1,
            estimatedMinutes: 15,
          },
        ],
        classGroups: [
          {
            id: 'cg1',
            lessonId: 'l1',
            type: 'vocabulary',
            title: 'Vocab',
            orderIndex: 0,
          },
        ],
        vocabItems,
        reviewStates,
      });

      const service = createLessonFrontierService(
        courseRepo as any,
        contentRepo as any,
        reviewRepo as any,
      );

      // 4/5 = 80% -> unlocked
      expect(service.isLessonUnlocked('user1', 'l2')).toBe(true);
    });
  });
});
