import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const reviewStates = sqliteTable('review_states', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default('default'),
  entityType: text('entity_type').notNull(), // 'vocabulary' | 'sentence' | 'grammar_pattern'
  entityId: text('entity_id').notNull(),
  stabilityScore: real('stability_score').notNull().default(0),
  easeScore: real('ease_score').notNull().default(2.5),
  dueAt: text('due_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  lastSeenAt: text('last_seen_at'),
  successCount: integer('success_count').notNull().default(0),
  failCount: integer('fail_count').notNull().default(0),
  averageLatencyMs: real('average_latency_ms').notNull().default(0),
  currentStage: text('current_stage', {
    enum: ['new', 'seen', 'recognized', 'recalled', 'stable', 'automated'],
  })
    .notNull()
    .default('new'),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default('default'),
  startedAt: text('started_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  endedAt: text('ended_at'),
  mode: text('mode', {
    enum: ['learn', 'practice', 'review', 'exam-simulation', 'writing-lab'],
  }).notNull(),
  sourceScope: text('source_scope').notNull().default('{}'), // JSON: { lessonId?, moduleId?, courseId? }
  totalQuestions: integer('total_questions').notNull().default(0),
  correctAnswers: integer('correct_answers').notNull().default(0),
});

export const sessionAnswers = sqliteTable('session_answers', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  exerciseInstanceId: text('exercise_instance_id').notNull(),
  userAnswer: text('user_answer').notNull(),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
  responseTimeMs: integer('response_time_ms').notNull().default(0),
  hintUsed: integer('hint_used', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
