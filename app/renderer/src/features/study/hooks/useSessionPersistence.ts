import { useRef, useCallback } from 'react';
import { api } from '../../../lib/api';

let answerCounter = 0;

function generateId(): string {
  answerCounter++;
  return `${Date.now()}-${answerCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Hook that manages session persistence via IPC.
 * Creates a session on start, submits answers, and ends session.
 */
export function useSessionPersistence() {
  const sessionIdRef = useRef<string | null>(null);

  const startPersistedSession = useCallback(
    async (mode: string, lessonId?: string) => {
      try {
        const sourceScope = lessonId
          ? JSON.stringify({ lessonId })
          : undefined;
        const session = await api.session.create({ mode, sourceScope });
        sessionIdRef.current = session.id;
        return session.id;
      } catch (err) {
        console.error('Failed to create session:', err);
        return null;
      }
    },
    [],
  );

  const persistAnswer = useCallback(
    async (
      exerciseInstanceId: string,
      userAnswer: string,
      isCorrect: boolean,
      responseTimeMs: number,
      hintUsed: boolean,
    ) => {
      if (!sessionIdRef.current) return;

      try {
        await api.session.submitAnswer({
          id: generateId(),
          sessionId: sessionIdRef.current,
          exerciseInstanceId,
          userAnswer,
          isCorrect,
          responseTimeMs,
          hintUsed,
        });
      } catch (err) {
        console.error('Failed to persist answer:', err);
      }
    },
    [],
  );

  const endPersistedSession = useCallback(async () => {
    if (!sessionIdRef.current) return null;

    try {
      const ended = await api.session.end(sessionIdRef.current);
      const stats = await api.session.getStats(sessionIdRef.current);
      return stats;
    } catch (err) {
      console.error('Failed to end session:', err);
      return null;
    }
  }, []);

  return {
    sessionId: sessionIdRef,
    startPersistedSession,
    persistAnswer,
    endPersistedSession,
  };
}
