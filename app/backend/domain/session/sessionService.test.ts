import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../db/testDb';
import { createSessionRepository } from '../../db/repositories/sessionRepository';
import { createSessionService, type SessionService } from './sessionService';

describe('sessionService', () => {
  let service: SessionService;

  beforeEach(() => {
    const db = createTestDb();
    const repo = createSessionRepository(db);
    service = createSessionService(repo);
  });

  it('should start a session with generated ID', () => {
    const session = service.startSession({ mode: 'learn', lessonId: 'l1' });

    expect(session.id).toBeTruthy();
    expect(session.mode).toBe('learn');
    expect(session.endedAt).toBeNull();
    expect(session.totalQuestions).toBe(0);
    expect(session.correctAnswers).toBe(0);

    const scope = JSON.parse(session.sourceScope);
    expect(scope.lessonId).toBe('l1');
  });

  it('should submit answers and update tallies', () => {
    const session = service.startSession({ mode: 'learn' });

    service.submitAnswer({
      sessionId: session.id,
      exerciseInstanceId: 'ex1',
      userAnswer: 'dokter',
      isCorrect: true,
      responseTimeMs: 1200,
      hintUsed: false,
    });

    service.submitAnswer({
      sessionId: session.id,
      exerciseInstanceId: 'ex2',
      userAnswer: 'appel',
      isCorrect: false,
      responseTimeMs: 3500,
      hintUsed: true,
    });

    service.submitAnswer({
      sessionId: session.id,
      exerciseInstanceId: 'ex3',
      userAnswer: 'school',
      isCorrect: true,
      responseTimeMs: 2000,
      hintUsed: false,
    });

    const stats = service.getSessionStats(session.id);
    expect(stats).not.toBeNull();
    expect(stats!.totalQuestions).toBe(3);
    expect(stats!.correctAnswers).toBe(2);
    expect(stats!.accuracy).toBeCloseTo(2 / 3, 2);
    expect(stats!.averageResponseTimeMs).toBeCloseTo(
      (1200 + 3500 + 2000) / 3,
      0,
    );
  });

  it('should end a session and record timestamp', () => {
    const session = service.startSession({ mode: 'review' });

    service.submitAnswer({
      sessionId: session.id,
      exerciseInstanceId: 'ex1',
      userAnswer: 'huis',
      isCorrect: true,
      responseTimeMs: 800,
      hintUsed: false,
    });

    const ended = service.endSession(session.id);
    expect(ended!.endedAt).toBeTruthy();
  });

  it('should calculate duration in stats', () => {
    const session = service.startSession({ mode: 'learn' });

    service.submitAnswer({
      sessionId: session.id,
      exerciseInstanceId: 'ex1',
      userAnswer: 'dokter',
      isCorrect: true,
      responseTimeMs: 1000,
      hintUsed: false,
    });

    service.endSession(session.id);
    const stats = service.getSessionStats(session.id);

    expect(stats).not.toBeNull();
    expect(stats!.durationMs).toBeGreaterThanOrEqual(0);
    expect(stats!.endedAt).toBeTruthy();
  });

  it('should return answers for a session', () => {
    const session = service.startSession({ mode: 'learn' });

    service.submitAnswer({
      sessionId: session.id,
      exerciseInstanceId: 'ex1',
      userAnswer: 'dokter',
      isCorrect: true,
      responseTimeMs: 1000,
      hintUsed: false,
    });
    service.submitAnswer({
      sessionId: session.id,
      exerciseInstanceId: 'ex2',
      userAnswer: 'school',
      isCorrect: true,
      responseTimeMs: 1500,
      hintUsed: false,
    });

    const answers = service.getSessionAnswers(session.id);
    expect(answers).toHaveLength(2);
    expect(answers[0].userAnswer).toBe('dokter');
    expect(answers[1].userAnswer).toBe('school');
  });

  it('should return null stats for nonexistent session', () => {
    const stats = service.getSessionStats('nonexistent');
    expect(stats).toBeNull();
  });

  it('should handle session with no answers', () => {
    const session = service.startSession({ mode: 'practice' });
    service.endSession(session.id);

    const stats = service.getSessionStats(session.id);
    expect(stats!.totalQuestions).toBe(0);
    expect(stats!.correctAnswers).toBe(0);
    expect(stats!.accuracy).toBe(0);
    expect(stats!.averageResponseTimeMs).toBe(0);
  });
});
