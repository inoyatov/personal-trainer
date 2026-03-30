import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../testDb';
import { createCourseRepository } from './courseRepository';
import { createWritingRepository } from './writingRepository';
import type { WritingRepository } from './writingRepository';

describe('writingRepository', () => {
  let repo: WritingRepository;

  beforeEach(() => {
    const db = createTestDb();
    const courseRepo = createCourseRepository(db);
    repo = createWritingRepository(db);

    courseRepo.insertCourse({
      id: 'c1',
      title: 'Dutch A2',
      targetLevel: 'A2',
    });
    courseRepo.insertModule({
      id: 'm1',
      courseId: 'c1',
      title: 'Daily Life',
      orderIndex: 0,
    });
    courseRepo.insertLesson({
      id: 'l1',
      moduleId: 'm1',
      title: 'Doctor Appointment',
      orderIndex: 0,
    });
  });

  describe('writing prompts', () => {
    it('should insert and retrieve prompts by lesson', () => {
      repo.insertPrompt({
        id: 'wp1',
        lessonId: 'l1',
        promptText:
          'Write a short message to your teacher. Say that you are sick.',
        expectedKeywords: JSON.stringify(['ziek', 'niet', 'komen']),
      });

      const prompts = repo.getPromptsByLesson('l1');
      expect(prompts).toHaveLength(1);
      expect(prompts[0].promptText).toContain('sick');
    });
  });

  describe('writing submissions', () => {
    beforeEach(() => {
      repo.insertPrompt({
        id: 'wp1',
        lessonId: 'l1',
        promptText: 'Write about your day.',
      });
    });

    it('should insert and retrieve submissions', () => {
      repo.insertSubmission({
        id: 'ws1',
        promptId: 'wp1',
        userId: 'default',
        text: 'Ik ben vandaag ziek. Ik kan niet komen.',
        score: 0.8,
        feedbackJson: JSON.stringify({ keywords: ['ziek', 'komen'] }),
      });

      const submissions = repo.getSubmissionsByUser('default');
      expect(submissions).toHaveLength(1);
      expect(submissions[0].score).toBe(0.8);
    });
  });

  describe('lesson progress', () => {
    it('should upsert lesson progress', () => {
      repo.upsertLessonProgress({
        id: 'lp1',
        userId: 'default',
        lessonId: 'l1',
        vocabularyMastered: 5,
        vocabularyTotal: 10,
      });

      const progress = repo.getLessonProgress('default', 'l1');
      expect(progress).toBeDefined();
      expect(progress!.vocabularyMastered).toBe(5);

      // Update
      repo.upsertLessonProgress({
        id: 'lp1',
        userId: 'default',
        lessonId: 'l1',
        vocabularyMastered: 8,
        vocabularyTotal: 10,
      });

      const updated = repo.getLessonProgress('default', 'l1');
      expect(updated!.vocabularyMastered).toBe(8);
    });
  });
});
