import { eq, and, lte, gt, inArray, desc, asc, sql } from 'drizzle-orm';
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

    getWeakItems(userId: string) {
      return db
        .select()
        .from(reviewStates)
        .where(
          and(
            eq(reviewStates.userId, userId),
            inArray(reviewStates.currentStage, ['new', 'seen', 'recognized']),
            gt(reviewStates.failCount, 0),
          ),
        )
        .all();
    },

    getRecentErrorItems(userId: string, limit: number) {
      return db
        .select()
        .from(reviewStates)
        .where(
          and(
            eq(reviewStates.userId, userId),
            gt(reviewStates.failCount, 0),
          ),
        )
        .orderBy(desc(reviewStates.lastSeenAt))
        .limit(limit)
        .all();
    },

    getLowestMasteryItems(userId: string, limit: number) {
      const stageOrder = sql`CASE ${reviewStates.currentStage}
        WHEN 'new' THEN 0
        WHEN 'seen' THEN 1
        WHEN 'recognized' THEN 2
        WHEN 'recalled' THEN 3
        WHEN 'stable' THEN 4
        WHEN 'automated' THEN 5
        ELSE 6
      END`;

      return db
        .select()
        .from(reviewStates)
        .where(eq(reviewStates.userId, userId))
        .orderBy(stageOrder, desc(reviewStates.failCount))
        .limit(limit)
        .all();
    },
  };
}

export type ReviewRepository = ReturnType<typeof createReviewRepository>;
