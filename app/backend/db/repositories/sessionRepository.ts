import { eq } from 'drizzle-orm';
import {
  sessions,
  sessionAnswers,
  exerciseInstances,
} from '../schema';
import type { AppDatabase } from '../index';

export function createSessionRepository(db: AppDatabase) {
  return {
    // Sessions
    createSession(data: typeof sessions.$inferInsert) {
      return db.insert(sessions).values(data).returning().get();
    },

    getSessionById(id: string) {
      return db.select().from(sessions).where(eq(sessions.id, id)).get();
    },

    updateSession(id: string, data: Partial<typeof sessions.$inferInsert>) {
      return db
        .update(sessions)
        .set(data)
        .where(eq(sessions.id, id))
        .returning()
        .get();
    },

    endSession(id: string) {
      return db
        .update(sessions)
        .set({ endedAt: new Date().toISOString() })
        .where(eq(sessions.id, id))
        .returning()
        .get();
    },

    // Session Answers
    insertAnswer(data: typeof sessionAnswers.$inferInsert) {
      return db.insert(sessionAnswers).values(data).returning().get();
    },

    getAnswersBySession(sessionId: string) {
      return db
        .select()
        .from(sessionAnswers)
        .where(eq(sessionAnswers.sessionId, sessionId))
        .all();
    },

    // Exercise Instances
    createExerciseInstance(data: typeof exerciseInstances.$inferInsert) {
      return db.insert(exerciseInstances).values(data).returning().get();
    },

    getExerciseInstanceById(id: string) {
      return db
        .select()
        .from(exerciseInstances)
        .where(eq(exerciseInstances.id, id))
        .get();
    },
  };
}

export type SessionRepository = ReturnType<typeof createSessionRepository>;
