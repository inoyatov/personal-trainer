import { randomUUID } from 'node:crypto';
import type { SessionRepository } from '../../db/repositories/sessionRepository';
import type { ReviewScheduler } from '../scheduler/reviewScheduler';
import type { SessionMode } from '../../../shared/types';

export interface CreateSessionInput {
  mode: SessionMode;
  lessonId?: string;
  moduleId?: string;
  courseId?: string;
}

export interface SubmitAnswerInput {
  sessionId: string;
  exerciseInstanceId: string;
  exerciseType?: string;
  /** The source content entity type (vocabulary, sentence, dialog, etc.) */
  sourceEntityType?: string;
  /** The source content entity ID */
  sourceEntityId?: string;
  userAnswer: string;
  isCorrect: boolean;
  responseTimeMs: number;
  hintUsed: boolean;
}

export interface SessionStats {
  sessionId: string;
  mode: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageResponseTimeMs: number;
  startedAt: string;
  endedAt: string | null;
  durationMs: number;
}

export function createSessionService(
  sessionRepo: SessionRepository,
  reviewScheduler?: ReviewScheduler,
) {
  return {
    startSession(input: CreateSessionInput) {
      const id = randomUUID();
      const sourceScope = JSON.stringify({
        lessonId: input.lessonId,
        moduleId: input.moduleId,
        courseId: input.courseId,
      });

      return sessionRepo.createSession({
        id,
        mode: input.mode,
        sourceScope,
      });
    },

    submitAnswer(input: SubmitAnswerInput) {
      const answerId = randomUUID();

      const answer = sessionRepo.insertAnswer({
        id: answerId,
        sessionId: input.sessionId,
        exerciseInstanceId: input.exerciseInstanceId,
        userAnswer: input.userAnswer,
        isCorrect: input.isCorrect,
        responseTimeMs: input.responseTimeMs,
        hintUsed: input.hintUsed,
      });

      // Update session tallies
      const session = sessionRepo.getSessionById(input.sessionId);
      if (session) {
        sessionRepo.updateSession(input.sessionId, {
          totalQuestions: session.totalQuestions + 1,
          correctAnswers:
            session.correctAnswers + (input.isCorrect ? 1 : 0),
        });
      }

      // Update review state via scheduler
      if (reviewScheduler && input.sourceEntityId) {
        reviewScheduler.processAnswer({
          userId: session?.userId ?? 'default',
          entityType: input.sourceEntityType ?? 'sentence',
          entityId: input.sourceEntityId,
          exerciseType: input.exerciseType ?? 'multiple-choice-gap-fill',
          answer: {
            isCorrect: input.isCorrect,
            responseTimeMs: input.responseTimeMs,
            hintUsed: input.hintUsed,
          },
        });
      }

      return answer;
    },

    endSession(sessionId: string) {
      return sessionRepo.endSession(sessionId);
    },

    abandonSession(sessionId: string) {
      return sessionRepo.abandonSession(sessionId);
    },

    getSessionStats(sessionId: string): SessionStats | null {
      const session = sessionRepo.getSessionById(sessionId);
      if (!session) return null;

      const answers = sessionRepo.getAnswersBySession(sessionId);
      const totalResponseTime = answers.reduce(
        (sum, a) => sum + a.responseTimeMs,
        0,
      );
      const avgResponseTime =
        answers.length > 0 ? totalResponseTime / answers.length : 0;

      const startedAt = new Date(session.startedAt).getTime();
      const endedAt = session.endedAt
        ? new Date(session.endedAt).getTime()
        : Date.now();

      return {
        sessionId: session.id,
        mode: session.mode,
        totalQuestions: session.totalQuestions,
        correctAnswers: session.correctAnswers,
        accuracy:
          session.totalQuestions > 0
            ? session.correctAnswers / session.totalQuestions
            : 0,
        averageResponseTimeMs: Math.round(avgResponseTime),
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        durationMs: endedAt - startedAt,
      };
    },

    getSessionAnswers(sessionId: string) {
      return sessionRepo.getAnswersBySession(sessionId);
    },
  };
}

export type SessionService = ReturnType<typeof createSessionService>;
