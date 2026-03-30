import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../db/testDb';
import { createCourseRepository } from '../../db/repositories/courseRepository';
import { createContentRepository } from '../../db/repositories/contentRepository';
import { createReviewRepository } from '../../db/repositories/reviewRepository';
import { createWritingRepository } from '../../db/repositories/writingRepository';
import { createLessonCompletionService } from './lessonCompletion';

describe('lessonCompletion', () => {
  let service: ReturnType<typeof createLessonCompletionService>;
  let reviewRepo: ReturnType<typeof createReviewRepository>;
  let writingRepo: ReturnType<typeof createWritingRepository>;

  beforeEach(() => {
    const db = createTestDb();
    const courseRepo = createCourseRepository(db);
    const contentRepo = createContentRepository(db);
    reviewRepo = createReviewRepository(db);
    writingRepo = createWritingRepository(db);
    service = createLessonCompletionService(courseRepo, contentRepo, reviewRepo, writingRepo);

    // Set up test data
    courseRepo.insertCourse({ id: 'c1', title: 'Test', targetLevel: 'A2' });
    courseRepo.insertModule({ id: 'm1', courseId: 'c1', title: 'Mod', orderIndex: 0 });
    courseRepo.insertLesson({ id: 'l1', moduleId: 'm1', title: 'Lesson', orderIndex: 0 });
    courseRepo.insertClassGroup({ id: 'cg1', lessonId: 'l1', type: 'vocabulary', title: 'Vocab', orderIndex: 0 });

    contentRepo.insertVocabulary({ id: 'v1', lemma: 'huis', displayText: 'het huis', partOfSpeech: 'noun', translation: 'house', classGroupId: 'cg1' });
    contentRepo.insertVocabulary({ id: 'v2', lemma: 'tuin', displayText: 'de tuin', partOfSpeech: 'noun', translation: 'garden', classGroupId: 'cg1' });

    contentRepo.insertSentence({ id: 's1', text: 'Het huis is groot.', translation: 'The house is big.', lessonId: 'l1', classGroupId: 'cg1' });
  });

  it('should return 0% for a fresh lesson', () => {
    const status = service.getLessonCompletion('l1');
    expect(status.isComplete).toBe(false);
    expect(status.vocabularyTotal).toBe(2);
    expect(status.vocabularyMastered).toBe(0);
    expect(status.overallPercent).toBe(0);
  });

  it('should count mastered vocabulary', () => {
    reviewRepo.insertReviewState({
      id: 'rs1', userId: 'default', entityType: 'vocabulary', entityId: 'v1',
      currentStage: 'recognized', dueAt: new Date().toISOString(),
    });

    const status = service.getLessonCompletion('l1');
    expect(status.vocabularyMastered).toBe(1);
    expect(status.vocabularyPercent).toBe(50);
  });

  it('should not count "seen" as mastered', () => {
    reviewRepo.insertReviewState({
      id: 'rs1', userId: 'default', entityType: 'vocabulary', entityId: 'v1',
      currentStage: 'seen', dueAt: new Date().toISOString(),
    });

    const status = service.getLessonCompletion('l1');
    expect(status.vocabularyMastered).toBe(0);
  });

  it('should mark complete when 80%+ mastered and writing done', () => {
    // Master both vocab items
    reviewRepo.insertReviewState({
      id: 'rs1', userId: 'default', entityType: 'vocabulary', entityId: 'v1',
      currentStage: 'recalled', dueAt: new Date().toISOString(),
    });
    reviewRepo.insertReviewState({
      id: 'rs2', userId: 'default', entityType: 'vocabulary', entityId: 'v2',
      currentStage: 'recognized', dueAt: new Date().toISOString(),
    });
    // Master sentence
    reviewRepo.insertReviewState({
      id: 'rs3', userId: 'default', entityType: 'sentence', entityId: 's1',
      currentStage: 'recognized', dueAt: new Date().toISOString(),
    });

    const status = service.getLessonCompletion('l1');
    expect(status.vocabularyPercent).toBe(100);
    expect(status.sentencesPercent).toBe(100);
    expect(status.isComplete).toBe(true);
  });

  it('should require writing when prompts exist', () => {
    writingRepo.insertPrompt({
      id: 'wp1', lessonId: 'l1', promptText: 'Write about your house.',
    });

    // Master everything
    reviewRepo.insertReviewState({
      id: 'rs1', userId: 'default', entityType: 'vocabulary', entityId: 'v1',
      currentStage: 'recalled', dueAt: new Date().toISOString(),
    });
    reviewRepo.insertReviewState({
      id: 'rs2', userId: 'default', entityType: 'vocabulary', entityId: 'v2',
      currentStage: 'recalled', dueAt: new Date().toISOString(),
    });
    reviewRepo.insertReviewState({
      id: 'rs3', userId: 'default', entityType: 'sentence', entityId: 's1',
      currentStage: 'recalled', dueAt: new Date().toISOString(),
    });

    // Without writing
    let status = service.getLessonCompletion('l1');
    expect(status.writingAttempted).toBe(false);
    expect(status.isComplete).toBe(false);

    // With writing
    writingRepo.insertSubmission({
      id: 'ws1', promptId: 'wp1', userId: 'default', text: 'Mijn huis is groot.',
    });

    status = service.getLessonCompletion('l1');
    expect(status.writingAttempted).toBe(true);
    expect(status.isComplete).toBe(true);
  });
});
