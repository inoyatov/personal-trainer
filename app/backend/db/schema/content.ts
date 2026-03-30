import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { lessons, classGroups } from './courses';

export const vocabularyItems = sqliteTable('vocabulary_items', {
  id: text('id').primaryKey(),
  lemma: text('lemma').notNull(),
  displayText: text('display_text').notNull(),
  article: text('article'),
  partOfSpeech: text('part_of_speech').notNull().default('noun'),
  translation: text('translation').notNull(),
  transliteration: text('transliteration'),
  tags: text('tags').notNull().default('[]'), // JSON array
  difficulty: real('difficulty').notNull().default(1.0),
  classGroupId: text('class_group_id').references(() => classGroups.id, {
    onDelete: 'set null',
  }),
});

export const sentenceItems = sqliteTable('sentence_items', {
  id: text('id').primaryKey(),
  text: text('text').notNull(),
  translation: text('translation').notNull(),
  lessonId: text('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  classGroupId: text('class_group_id').references(() => classGroups.id, {
    onDelete: 'set null',
  }),
  targetVocabularyIds: text('target_vocabulary_ids').notNull().default('[]'), // JSON array
  targetGrammarPatternIds: text('target_grammar_pattern_ids')
    .notNull()
    .default('[]'), // JSON array
  audioPath: text('audio_path'),
});

export const dialogs = sqliteTable('dialogs', {
  id: text('id').primaryKey(),
  lessonId: text('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  scenario: text('scenario').notNull().default(''),
  classGroupId: text('class_group_id').references(() => classGroups.id, {
    onDelete: 'set null',
  }),
});

export const dialogTurns = sqliteTable('dialog_turns', {
  id: text('id').primaryKey(),
  dialogId: text('dialog_id')
    .notNull()
    .references(() => dialogs.id, { onDelete: 'cascade' }),
  speaker: text('speaker').notNull(),
  text: text('text').notNull(),
  translation: text('translation').notNull().default(''),
  orderIndex: integer('order_index').notNull().default(0),
});
