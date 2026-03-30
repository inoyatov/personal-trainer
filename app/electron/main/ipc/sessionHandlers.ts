import { ipcMain } from 'electron';
import { Channels } from '../../../shared/contracts/channels';
import {
  createSessionRequest,
  getSessionRequest,
  submitAnswerRequest,
  endSessionRequest,
  getSessionAnswersRequest,
  createExerciseInstanceRequest,
  getExerciseInstanceRequest,
  buildUnifiedSessionRequest,
  abandonSessionRequest,
} from '../../../shared/contracts/schemas';
import type { SessionRepository } from '../../../backend/db/repositories/sessionRepository';
import type { ReviewScheduler } from '../../../backend/domain/scheduler/reviewScheduler';
import {
  createSessionService,
  type SessionService,
} from '../../../backend/domain/session/sessionService';
import type { UnifiedSessionBuilder } from '../../../backend/domain/session/unifiedSessionBuilder';

export function registerSessionHandlers(
  sessionRepo: SessionRepository,
  reviewScheduler?: ReviewScheduler,
  unifiedBuilder?: UnifiedSessionBuilder,
) {
  const sessionService = createSessionService(sessionRepo, reviewScheduler);

  ipcMain.handle(Channels.SESSION_CREATE, (_event, data: unknown) => {
    const parsed = createSessionRequest.parse(data);
    return sessionService.startSession({
      mode: parsed.mode,
      lessonId: parsed.sourceScope
        ? JSON.parse(parsed.sourceScope).lessonId
        : undefined,
    });
  });

  ipcMain.handle(Channels.SESSION_GET, (_event, data: unknown) => {
    const { sessionId } = getSessionRequest.parse(data);
    return sessionRepo.getSessionById(sessionId);
  });

  ipcMain.handle(Channels.SESSION_SUBMIT_ANSWER, (_event, data: unknown) => {
    const parsed = submitAnswerRequest.parse(data);
    return sessionService.submitAnswer({
      sessionId: parsed.sessionId,
      exerciseInstanceId: parsed.exerciseInstanceId,
      exerciseType: (parsed as any).exerciseType,
      sourceEntityType: (parsed as any).sourceEntityType,
      sourceEntityId: (parsed as any).sourceEntityId,
      userAnswer: parsed.userAnswer,
      isCorrect: parsed.isCorrect,
      responseTimeMs: parsed.responseTimeMs,
      hintUsed: parsed.hintUsed,
    });
  });

  ipcMain.handle(Channels.SESSION_END, (_event, data: unknown) => {
    const { sessionId } = endSessionRequest.parse(data);
    return sessionService.endSession(sessionId);
  });

  ipcMain.handle(Channels.SESSION_ABANDON, (_event, data: unknown) => {
    const { sessionId } = abandonSessionRequest.parse(data);
    return sessionService.abandonSession(sessionId);
  });

  ipcMain.handle(Channels.SESSION_GET_ANSWERS, (_event, data: unknown) => {
    const { sessionId } = getSessionAnswersRequest.parse(data);
    return sessionService.getSessionAnswers(sessionId);
  });

  ipcMain.handle(Channels.SESSION_GET_STATS, (_event, data: unknown) => {
    const { sessionId } = getSessionRequest.parse(data);
    return sessionService.getSessionStats(sessionId);
  });

  ipcMain.handle(
    Channels.EXERCISE_CREATE_INSTANCE,
    (_event, data: unknown) => {
      const parsed = createExerciseInstanceRequest.parse(data);
      return sessionRepo.createExerciseInstance(parsed);
    },
  );

  ipcMain.handle(
    Channels.EXERCISE_GET_INSTANCE,
    (_event, data: unknown) => {
      const { instanceId } = getExerciseInstanceRequest.parse(data);
      return sessionRepo.getExerciseInstanceById(instanceId);
    },
  );

  ipcMain.handle(
    Channels.SESSION_BUILD_UNIFIED,
    (_event, data: unknown) => {
      const parsed = buildUnifiedSessionRequest.parse(data);
      if (!unifiedBuilder) {
        throw new Error('Unified session builder not available');
      }
      return unifiedBuilder.buildSession({
        userId: parsed.userId,
        courseId: parsed.courseId,
        mode: parsed.mode,
        maxItems: parsed.maxItems,
      });
    },
  );
}
