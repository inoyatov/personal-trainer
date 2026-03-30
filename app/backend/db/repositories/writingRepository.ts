import { eq } from 'drizzle-orm';
import {
  writingPrompts,
  writingSubmissions,
  lessonProgress,
} from '../schema';
import type { AppDatabase } from '../index';

export function createWritingRepository(db: AppDatabase) {
  return {
    // Writing Prompts
    getPromptsByLesson(lessonId: string) {
      return db
        .select()
        .from(writingPrompts)
        .where(eq(writingPrompts.lessonId, lessonId))
        .all();
    },

    getPromptById(id: string) {
      return db
        .select()
        .from(writingPrompts)
        .where(eq(writingPrompts.id, id))
        .get();
    },

    insertPrompt(data: typeof writingPrompts.$inferInsert) {
      return db.insert(writingPrompts).values(data).returning().get();
    },

    deletePrompt(id: string) {
      return db
        .delete(writingPrompts)
        .where(eq(writingPrompts.id, id))
        .run();
    },

    // Writing Submissions
    getSubmissionsByUser(userId: string) {
      return db
        .select()
        .from(writingSubmissions)
        .where(eq(writingSubmissions.userId, userId))
        .all();
    },

    getSubmissionsByPrompt(promptId: string) {
      return db
        .select()
        .from(writingSubmissions)
        .where(eq(writingSubmissions.promptId, promptId))
        .all();
    },

    insertSubmission(data: typeof writingSubmissions.$inferInsert) {
      return db.insert(writingSubmissions).values(data).returning().get();
    },

    // Lesson Progress
    getLessonProgress(userId: string, lessonId: string) {
      return db
        .select()
        .from(lessonProgress)
        .where(
          eq(lessonProgress.userId, userId),
        )
        .all()
        .filter((p) => p.lessonId === lessonId)[0];
    },

    getAllLessonProgress(userId: string) {
      return db
        .select()
        .from(lessonProgress)
        .where(eq(lessonProgress.userId, userId))
        .all();
    },

    upsertLessonProgress(data: typeof lessonProgress.$inferInsert) {
      const existing = db
        .select()
        .from(lessonProgress)
        .where(eq(lessonProgress.id, data.id))
        .get();

      if (existing) {
        return db
          .update(lessonProgress)
          .set(data)
          .where(eq(lessonProgress.id, data.id))
          .returning()
          .get();
      }

      return db.insert(lessonProgress).values(data).returning().get();
    },
  };
}

export type WritingRepository = ReturnType<typeof createWritingRepository>;
