import { eq, inArray, desc, and, isNotNull, like } from 'drizzle-orm';
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
        .set({ endedAt: new Date().toISOString(), status: 'completed' })
        .where(eq(sessions.id, id))
        .returning()
        .get();
    },

    abandonSession(id: string) {
      return db
        .update(sessions)
        .set({ endedAt: new Date().toISOString(), status: 'abandoned' })
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

    getRecentAnswersForEntities(entityIds: string[], limit: number) {
      if (entityIds.length === 0) return {};

      // Join sessionAnswers with exerciseInstances to get sourceEntityId,
      // then group by entityId and take the last `limit` answers per entity.
      const rows = db
        .select({
          entityId: exerciseInstances.sourceEntityId,
          isCorrect: sessionAnswers.isCorrect,
          createdAt: sessionAnswers.createdAt,
        })
        .from(sessionAnswers)
        .innerJoin(
          exerciseInstances,
          eq(sessionAnswers.exerciseInstanceId, exerciseInstances.id),
        )
        .where(inArray(exerciseInstances.sourceEntityId, entityIds))
        .orderBy(desc(sessionAnswers.createdAt))
        .all();

      // Group by entityId and take the last `limit` per entity
      const grouped: Record<
        string,
        { isCorrect: boolean; createdAt: string }[]
      > = {};
      for (const row of rows) {
        const arr = (grouped[row.entityId] ??= []);
        if (arr.length < limit) {
          arr.push({ isCorrect: row.isCorrect, createdAt: row.createdAt });
        }
      }
      return grouped;
    },

    getCompletedSessionCount(userId: string, courseId: string): number {
      const rows = db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.userId, userId),
            isNotNull(sessions.endedAt),
            like(sessions.sourceScope, `%"courseId":"${courseId}"%`),
          ),
        )
        .all();
      return rows.length;
    },
  };
}

export type SessionRepository = ReturnType<typeof createSessionRepository>;
