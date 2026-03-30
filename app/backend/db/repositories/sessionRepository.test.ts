import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../testDb';
import { createSessionRepository } from './sessionRepository';
import type { SessionRepository } from './sessionRepository';

describe('sessionRepository', () => {
  let repo: SessionRepository;

  beforeEach(() => {
    const db = createTestDb();
    repo = createSessionRepository(db);
  });

  describe('sessions', () => {
    it('should create and retrieve a session', () => {
      const session = repo.createSession({
        id: 'sess1',
        userId: 'default',
        mode: 'learn',
        sourceScope: JSON.stringify({ lessonId: 'l1' }),
      });

      expect(session.id).toBe('sess1');
      expect(session.mode).toBe('learn');
      expect(session.endedAt).toBeNull();

      const fetched = repo.getSessionById('sess1');
      expect(fetched).toBeDefined();
    });

    it('should end a session', () => {
      repo.createSession({
        id: 'sess1',
        userId: 'default',
        mode: 'review',
      });

      const ended = repo.endSession('sess1');
      expect(ended!.endedAt).toBeTruthy();
    });

    it('should update session stats', () => {
      repo.createSession({
        id: 'sess1',
        userId: 'default',
        mode: 'learn',
      });

      const updated = repo.updateSession('sess1', {
        totalQuestions: 10,
        correctAnswers: 8,
      });
      expect(updated!.totalQuestions).toBe(10);
      expect(updated!.correctAnswers).toBe(8);
    });
  });

  describe('session answers', () => {
    beforeEach(() => {
      repo.createSession({
        id: 'sess1',
        userId: 'default',
        mode: 'learn',
      });
    });

    it('should insert and retrieve answers', () => {
      repo.insertAnswer({
        id: 'a1',
        sessionId: 'sess1',
        exerciseInstanceId: 'ex1',
        userAnswer: 'dokter',
        isCorrect: true,
        responseTimeMs: 1500,
        hintUsed: false,
      });
      repo.insertAnswer({
        id: 'a2',
        sessionId: 'sess1',
        exerciseInstanceId: 'ex2',
        userAnswer: 'appel',
        isCorrect: false,
        responseTimeMs: 3000,
        hintUsed: true,
      });

      const answers = repo.getAnswersBySession('sess1');
      expect(answers).toHaveLength(2);
      expect(answers[0].isCorrect).toBe(true);
      expect(answers[1].hintUsed).toBe(true);
    });
  });

  describe('exercise instances', () => {
    it('should create and retrieve exercise instances', () => {
      const instance = repo.createExerciseInstance({
        id: 'ei1',
        sourceEntityType: 'sentence',
        sourceEntityId: 's1',
        exerciseType: 'multiple-choice-gap-fill',
        renderedPrompt: 'Ik ga morgen naar de ____.',
        correctAnswer: 'dokter',
        distractors: JSON.stringify(['school', 'appel', 'regen']),
      });

      expect(instance.id).toBe('ei1');

      const fetched = repo.getExerciseInstanceById('ei1');
      expect(fetched).toBeDefined();
      expect(fetched!.correctAnswer).toBe('dokter');
    });
  });
});
