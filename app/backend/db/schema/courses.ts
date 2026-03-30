import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const courses = sqliteTable('courses', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  targetLevel: text('target_level').notNull(),
  languageCode: text('language_code').notNull().default('nl'),
  version: text('version').notNull().default('1.0'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const modules = sqliteTable('modules', {
  id: text('id').primaryKey(),
  courseId: text('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  orderIndex: integer('order_index').notNull().default(0),
});

export const lessons = sqliteTable('lessons', {
  id: text('id').primaryKey(),
  moduleId: text('module_id')
    .notNull()
    .references(() => modules.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  orderIndex: integer('order_index').notNull().default(0),
  estimatedMinutes: integer('estimated_minutes').notNull().default(15),
});

export const classGroups = sqliteTable('class_groups', {
  id: text('id').primaryKey(),
  lessonId: text('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: ['vocabulary', 'grammar', 'dialog', 'writing'],
  }).notNull(),
  title: text('title').notNull(),
  orderIndex: integer('order_index').notNull().default(0),
});
