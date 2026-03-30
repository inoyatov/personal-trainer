import { eq, and, lte } from 'drizzle-orm';
import { reviewStates } from '../schema';
import type { AppDatabase } from '../index';

export function createReviewRepository(db: AppDatabase) {
  return {
    getReviewState(userId: string, entityType: string, entityId: string) {
      return db
        .select()
        .from(reviewStates)
        .where(
          and(
            eq(reviewStates.userId, userId),
            eq(reviewStates.entityType, entityType),
            eq(reviewStates.entityId, entityId),
          ),
        )
        .get();
    },

    getDueItems(userId: string, dueBeforeIso?: string) {
      const dueBefore = dueBeforeIso ?? new Date().toISOString();
      return db
        .select()
        .from(reviewStates)
        .where(
          and(
            eq(reviewStates.userId, userId),
            lte(reviewStates.dueAt, dueBefore),
          ),
        )
        .all();
    },

    getAllReviewStates(userId: string) {
      return db
        .select()
        .from(reviewStates)
        .where(eq(reviewStates.userId, userId))
        .all();
    },

    upsertReviewState(data: typeof reviewStates.$inferInsert) {
      // Try to find existing
      const existing = db
        .select()
        .from(reviewStates)
        .where(
          and(
            eq(reviewStates.userId, data.userId ?? 'default'),
            eq(reviewStates.entityType, data.entityType),
            eq(reviewStates.entityId, data.entityId),
          ),
        )
        .get();

      if (existing) {
        return db
          .update(reviewStates)
          .set(data)
          .where(eq(reviewStates.id, existing.id))
          .returning()
          .get();
      }

      return db.insert(reviewStates).values(data).returning().get();
    },

    insertReviewState(data: typeof reviewStates.$inferInsert) {
      return db.insert(reviewStates).values(data).returning().get();
    },

    updateReviewState(
      id: string,
      data: Partial<typeof reviewStates.$inferInsert>,
    ) {
      return db
        .update(reviewStates)
        .set(data)
        .where(eq(reviewStates.id, id))
        .returning()
        .get();
    },

    deleteReviewState(id: string) {
      return db
        .delete(reviewStates)
        .where(eq(reviewStates.id, id))
        .run();
    },
  };
}

export type ReviewRepository = ReturnType<typeof createReviewRepository>;
