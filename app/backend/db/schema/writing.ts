import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { lessons } from './courses';

export const writingPrompts = sqliteTable('writing_prompts', {
  id: text('id').primaryKey(),
  lessonId: text('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  promptText: text('prompt_text').notNull(),
  targetPatterns: text('target_patterns').notNull().default('[]'), // JSON array
  expectedKeywords: text('expected_keywords').notNull().default('[]'), // JSON array
  difficulty: real('difficulty').notNull().default(1.0),
});

export const writingSubmissions = sqliteTable('writing_submissions', {
  id: text('id').primaryKey(),
  promptId: text('prompt_id')
    .notNull()
    .references(() => writingPrompts.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().default('default'),
  text: text('text').notNull(),
  score: real('score'),
  feedbackJson: text('feedback_json').notNull().default('{}'), // JSON
  submittedAt: text('submitted_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const lessonProgress = sqliteTable('lesson_progress', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default('default'),
  lessonId: text('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  completedAt: text('completed_at'),
  vocabularyMastered: integer('vocabulary_mastered').notNull().default(0),
  vocabularyTotal: integer('vocabulary_total').notNull().default(0),
  writingAttempted: integer('writing_attempted', { mode: 'boolean' })
    .notNull()
    .default(false),
  grammarScore: real('grammar_score'),
});
