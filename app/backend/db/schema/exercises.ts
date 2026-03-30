import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';

export const exerciseTemplates = sqliteTable('exercise_templates', {
  id: text('id').primaryKey(),
  type: text('type', {
    enum: [
      'multiple-choice-gap-fill',
      'typed-gap-fill',
      'dialog-completion',
      'word-order',
      'guided-writing',
      'translation-choice',
      'sentence-transformation',
      'dictation-recall',
      'grammar-drill',
    ],
  }).notNull(),
  generationRules: text('generation_rules').notNull().default('{}'), // JSON
  evaluationRules: text('evaluation_rules').notNull().default('{}'), // JSON
  difficultyWeight: real('difficulty_weight').notNull().default(1.0),
});

export const exerciseInstances = sqliteTable('exercise_instances', {
  id: text('id').primaryKey(),
  templateId: text('template_id').references(() => exerciseTemplates.id, {
    onDelete: 'set null',
  }),
  sourceEntityType: text('source_entity_type').notNull(), // 'sentence' | 'vocabulary' | 'dialog_turn'
  sourceEntityId: text('source_entity_id').notNull(),
  exerciseType: text('exercise_type').notNull(),
  renderedPrompt: text('rendered_prompt').notNull(),
  correctAnswer: text('correct_answer').notNull(),
  distractors: text('distractors').notNull().default('[]'), // JSON array
  metadata: text('metadata').notNull().default('{}'), // JSON
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
