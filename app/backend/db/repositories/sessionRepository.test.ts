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

  describe('abandonSession', () => {
    it('should set status to abandoned and endedAt', () => {
      repo.createSession({
        id: 'sess-abandon',
        userId: 'default',
        mode: 'learn',
        startedAt: new Date().toISOString(),
      });

      const abandoned = repo.abandonSession('sess-abandon');
      expect(abandoned!.status).toBe('abandoned');
      expect(abandoned!.endedAt).toBeTruthy();

      const fetched = repo.getSessionById('sess-abandon');
      expect(fetched!.status).toBe('abandoned');
      expect(fetched!.endedAt).toBeTruthy();
    });
  });

  describe('getCompletedSessionCount', () => {
    it('should count completed sessions for user+course', () => {
      const scope = JSON.stringify({ courseId: 'course1' });

      repo.createSession({
        id: 'sess-c1',
        userId: 'default',
        mode: 'learn',
        sourceScope: scope,
        startedAt: new Date().toISOString(),
      });
      repo.createSession({
        id: 'sess-c2',
        userId: 'default',
        mode: 'learn',
        sourceScope: scope,
        startedAt: new Date().toISOString(),
      });
      repo.createSession({
        id: 'sess-c3',
        userId: 'default',
        mode: 'learn',
        sourceScope: scope,
        startedAt: new Date().toISOString(),
      });

      // Complete 2 sessions
      repo.endSession('sess-c1');
      repo.endSession('sess-c2');
      // sess-c3 stays active

      const count = repo.getCompletedSessionCount('default', 'course1');
      expect(count).toBe(2);
    });
  });

  describe('getRecentAnswersForEntities', () => {
    it('should return grouped answers', () => {
      repo.createSession({
        id: 'sess-ans',
        userId: 'default',
        mode: 'learn',
        startedAt: new Date().toISOString(),
      });

      // Create exercise instances with different sourceEntityIds
      repo.createExerciseInstance({
        id: 'ei-a',
        sourceEntityType: 'sentence',
        sourceEntityId: 'entity1',
        exerciseType: 'typed-gap-fill',
        renderedPrompt: 'prompt1',
        correctAnswer: 'ans1',
      });
      repo.createExerciseInstance({
        id: 'ei-b',
        sourceEntityType: 'sentence',
        sourceEntityId: 'entity1',
        exerciseType: 'typed-gap-fill',
        renderedPrompt: 'prompt2',
        correctAnswer: 'ans2',
      });
      repo.createExerciseInstance({
        id: 'ei-c',
        sourceEntityType: 'sentence',
        sourceEntityId: 'entity2',
        exerciseType: 'typed-gap-fill',
        renderedPrompt: 'prompt3',
        correctAnswer: 'ans3',
      });

      // Insert answers
      repo.insertAnswer({
        id: 'ans1',
        sessionId: 'sess-ans',
        exerciseInstanceId: 'ei-a',
        userAnswer: 'ans1',
        isCorrect: true,
        responseTimeMs: 1000,
        hintUsed: false,
      });
      repo.insertAnswer({
        id: 'ans2',
        sessionId: 'sess-ans',
        exerciseInstanceId: 'ei-b',
        userAnswer: 'wrong',
        isCorrect: false,
        responseTimeMs: 2000,
        hintUsed: false,
      });
      repo.insertAnswer({
        id: 'ans3',
        sessionId: 'sess-ans',
        exerciseInstanceId: 'ei-c',
        userAnswer: 'ans3',
        isCorrect: true,
        responseTimeMs: 1500,
        hintUsed: false,
      });

      const grouped = repo.getRecentAnswersForEntities(
        ['entity1', 'entity2'],
        10,
      );
      expect(grouped['entity1']).toHaveLength(2);
      expect(grouped['entity2']).toHaveLength(1);
      expect(grouped['entity2'][0].isCorrect).toBe(true);
    });

    it('should return empty object for empty array', () => {
      const result = repo.getRecentAnswersForEntities([], 10);
      expect(result).toEqual({});
    });
  });
});
