import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { lessons } from './courses';
import { classGroups } from './courses';
import { sentenceItems } from './content';

// --- Core verb tables ---

export const verbs = sqliteTable('verbs', {
  id: text('id').primaryKey(),
  infinitive: text('infinitive').notNull(),
  translation: text('translation').notNull(),
  type: text('type', { enum: ['regular', 'irregular'] }).notNull().default('regular'),
  isSeparable: integer('is_separable', { mode: 'boolean' }).notNull().default(false),
  usageNotes: text('usage_notes'),
  difficulty: real('difficulty').notNull().default(1.0),
  lessonId: text('lesson_id').references(() => lessons.id, { onDelete: 'set null' }),
  classGroupId: text('class_group_id').references(() => classGroups.id, { onDelete: 'set null' }),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const verbConjugationSets = sqliteTable('verb_conjugation_sets', {
  id: text('id').primaryKey(),
  verbId: text('verb_id')
    .notNull()
    .references(() => verbs.id, { onDelete: 'cascade' }),
  tense: text('tense').notNull().default('present'),
  mood: text('mood').notNull().default('indicative'),
  notes: text('notes'),
});

export const verbConjugationForms = sqliteTable('verb_conjugation_forms', {
  id: text('id').primaryKey(),
  conjugationSetId: text('conjugation_set_id')
    .notNull()
    .references(() => verbConjugationSets.id, { onDelete: 'cascade' }),
  pronoun: text('pronoun', {
    enum: ['IK', 'JIJ', 'U', 'HIJ', 'ZIJ_SG', 'HET', 'WIJ', 'JULLIE', 'ZIJ_PL'],
  }).notNull(),
  form: text('form').notNull(),
  alternateFormsJson: text('alternate_forms_json'),
  isPreferred: integer('is_preferred', { mode: 'boolean' }).notNull().default(true),
});

// --- Lesson & sentence linking ---

export const lessonVerbs = sqliteTable('lesson_verbs', {
  lessonId: text('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  verbId: text('verb_id')
    .notNull()
    .references(() => verbs.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['target', 'supporting', 'focus_irregular'] }).notNull(),
  orderIndex: integer('order_index').notNull().default(0),
});

export const sentenceVerbs = sqliteTable('sentence_verbs', {
  sentenceId: text('sentence_id')
    .notNull()
    .references(() => sentenceItems.id, { onDelete: 'cascade' }),
  verbId: text('verb_id')
    .notNull()
    .references(() => verbs.id, { onDelete: 'cascade' }),
  conjugationFormId: text('conjugation_form_id').references(() => verbConjugationForms.id, {
    onDelete: 'set null',
  }),
  surfaceForm: text('surface_form').notNull(),
  isFinite: integer('is_finite', { mode: 'boolean' }).notNull().default(true),
});

// --- Conjugation progress tracking ---

export const conjugationReviewStates = sqliteTable('conjugation_review_states', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default('default'),
  verbId: text('verb_id')
    .notNull()
    .references(() => verbs.id, { onDelete: 'cascade' }),
  pronoun: text('pronoun').notNull(),
  tense: text('tense').notNull().default('present'),
  stage: text('stage', {
    enum: ['new', 'seen', 'recognized', 'recalled', 'stable', 'automated'],
  })
    .notNull()
    .default('new'),
  easeScore: real('ease_score').notNull().default(2.5),
  stabilityScore: real('stability_score').notNull().default(0),
  successCount: integer('success_count').notNull().default(0),
  failCount: integer('fail_count').notNull().default(0),
  averageLatencyMs: real('average_latency_ms').notNull().default(0),
  dueAt: text('due_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  lastSeenAt: text('last_seen_at'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const conjugationAttempts = sqliteTable('conjugation_attempts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default('default'),
  sessionId: text('session_id'),
  verbId: text('verb_id')
    .notNull()
    .references(() => verbs.id, { onDelete: 'cascade' }),
  pronoun: text('pronoun').notNull(),
  tense: text('tense').notNull().default('present'),
  expectedForm: text('expected_form').notNull(),
  userAnswer: text('user_answer').notNull(),
  correct: integer('correct', { mode: 'boolean' }).notNull(),
  errorType: text('error_type', {
    enum: ['CORRECT', 'TYPO', 'MISSING_T', 'WRONG_PRONOUN_FORM', 'WRONG'],
  }).notNull(),
  responseTimeMs: integer('response_time_ms').notNull().default(0),
  confidence: integer('confidence'),
  hintUsed: integer('hint_used', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
