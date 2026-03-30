import { eq } from 'drizzle-orm';
import {
  vocabularyItems,
  sentenceItems,
  dialogs,
  dialogTurns,
  grammarPatterns,
} from '../schema';
import type { AppDatabase } from '../index';

export function createContentRepository(db: AppDatabase) {
  return {
    // Vocabulary
    getVocabularyByClassGroup(classGroupId: string) {
      return db
        .select()
        .from(vocabularyItems)
        .where(eq(vocabularyItems.classGroupId, classGroupId))
        .all();
    },

    getVocabularyById(id: string) {
      return db
        .select()
        .from(vocabularyItems)
        .where(eq(vocabularyItems.id, id))
        .get();
    },

    insertVocabulary(data: typeof vocabularyItems.$inferInsert) {
      return db.insert(vocabularyItems).values(data).returning().get();
    },

    deleteVocabulary(id: string) {
      return db
        .delete(vocabularyItems)
        .where(eq(vocabularyItems.id, id))
        .run();
    },

    // Sentences
    getSentencesByLesson(lessonId: string) {
      return db
        .select()
        .from(sentenceItems)
        .where(eq(sentenceItems.lessonId, lessonId))
        .all();
    },

    getSentencesByClassGroup(classGroupId: string) {
      return db
        .select()
        .from(sentenceItems)
        .where(eq(sentenceItems.classGroupId, classGroupId))
        .all();
    },

    getSentenceById(id: string) {
      return db
        .select()
        .from(sentenceItems)
        .where(eq(sentenceItems.id, id))
        .get();
    },

    insertSentence(data: typeof sentenceItems.$inferInsert) {
      return db.insert(sentenceItems).values(data).returning().get();
    },

    deleteSentence(id: string) {
      return db
        .delete(sentenceItems)
        .where(eq(sentenceItems.id, id))
        .run();
    },

    // Dialogs
    getDialogsByLesson(lessonId: string) {
      return db
        .select()
        .from(dialogs)
        .where(eq(dialogs.lessonId, lessonId))
        .all();
    },

    getDialogById(id: string) {
      return db.select().from(dialogs).where(eq(dialogs.id, id)).get();
    },

    insertDialog(data: typeof dialogs.$inferInsert) {
      return db.insert(dialogs).values(data).returning().get();
    },

    deleteDialog(id: string) {
      return db.delete(dialogs).where(eq(dialogs.id, id)).run();
    },

    // Dialog Turns
    getTurnsByDialog(dialogId: string) {
      return db
        .select()
        .from(dialogTurns)
        .where(eq(dialogTurns.dialogId, dialogId))
        .orderBy(dialogTurns.orderIndex)
        .all();
    },

    getDialogTurnById(id: string) {
      return db.select().from(dialogTurns).where(eq(dialogTurns.id, id)).get();
    },

    insertDialogTurn(data: typeof dialogTurns.$inferInsert) {
      return db.insert(dialogTurns).values(data).returning().get();
    },

    // Grammar Patterns
    getGrammarPatternsByLesson(lessonId: string) {
      return db
        .select()
        .from(grammarPatterns)
        .where(eq(grammarPatterns.lessonId, lessonId))
        .all();
    },

    getGrammarPatternById(id: string) {
      return db
        .select()
        .from(grammarPatterns)
        .where(eq(grammarPatterns.id, id))
        .get();
    },

    insertGrammarPattern(data: typeof grammarPatterns.$inferInsert) {
      return db.insert(grammarPatterns).values(data).returning().get();
    },

    deleteGrammarPattern(id: string) {
      return db
        .delete(grammarPatterns)
        .where(eq(grammarPatterns.id, id))
        .run();
    },
  };
}

export type ContentRepository = ReturnType<typeof createContentRepository>;
