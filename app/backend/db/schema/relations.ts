import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { vocabularyItems, sentenceItems } from './content';
import { grammarPatterns } from './grammar';

export const sentenceVocabulary = sqliteTable('sentence_vocabulary', {
  sentenceId: text('sentence_id')
    .notNull()
    .references(() => sentenceItems.id, { onDelete: 'cascade' }),
  vocabularyId: text('vocabulary_id')
    .notNull()
    .references(() => vocabularyItems.id, { onDelete: 'cascade' }),
});

export const sentenceGrammarPattern = sqliteTable('sentence_grammar_pattern', {
  sentenceId: text('sentence_id')
    .notNull()
    .references(() => sentenceItems.id, { onDelete: 'cascade' }),
  grammarPatternId: text('grammar_pattern_id')
    .notNull()
    .references(() => grammarPatterns.id, { onDelete: 'cascade' }),
});

export const itemTags = sqliteTable('item_tags', {
  entityType: text('entity_type').notNull(), // 'vocabulary' | 'sentence' | 'lesson'
  entityId: text('entity_id').notNull(),
  tag: text('tag').notNull(),
});
