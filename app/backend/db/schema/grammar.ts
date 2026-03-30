import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { lessons } from './courses';

export const grammarPatterns = sqliteTable('grammar_patterns', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  explanationMarkdown: text('explanation_markdown').notNull().default(''),
  examples: text('examples').notNull().default('[]'), // JSON array
  lessonId: text('lesson_id').references(() => lessons.id, {
    onDelete: 'set null',
  }),
});
