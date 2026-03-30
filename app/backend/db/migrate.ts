import { sql } from 'drizzle-orm';
import type { AppDatabase } from './index';

/**
 * Run all migrations to create/update the database schema.
 * Uses Drizzle's push approach for simplicity in v1.
 * For production, switch to drizzle-kit generated migrations.
 */
export function runMigrations(db: AppDatabase) {
  db.run(sql`CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    target_level TEXT NOT NULL,
    language_code TEXT NOT NULL DEFAULT 'nl',
    version TEXT NOT NULL DEFAULT '1.0',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS modules (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    order_index INTEGER NOT NULL DEFAULT 0,
    estimated_minutes INTEGER NOT NULL DEFAULT 15
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS class_groups (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK(type IN ('vocabulary', 'grammar', 'dialog', 'writing')),
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS vocabulary_items (
    id TEXT PRIMARY KEY,
    lemma TEXT NOT NULL,
    display_text TEXT NOT NULL,
    article TEXT,
    part_of_speech TEXT NOT NULL DEFAULT 'noun',
    translation TEXT NOT NULL,
    transliteration TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    difficulty REAL NOT NULL DEFAULT 1.0,
    class_group_id TEXT REFERENCES class_groups(id) ON DELETE SET NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS sentence_items (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    translation TEXT NOT NULL,
    lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    class_group_id TEXT REFERENCES class_groups(id) ON DELETE SET NULL,
    target_vocabulary_ids TEXT NOT NULL DEFAULT '[]',
    target_grammar_pattern_ids TEXT NOT NULL DEFAULT '[]',
    audio_path TEXT
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS dialogs (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    scenario TEXT NOT NULL DEFAULT '',
    class_group_id TEXT REFERENCES class_groups(id) ON DELETE SET NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS dialog_turns (
    id TEXT PRIMARY KEY,
    dialog_id TEXT NOT NULL REFERENCES dialogs(id) ON DELETE CASCADE,
    speaker TEXT NOT NULL,
    text TEXT NOT NULL,
    translation TEXT NOT NULL DEFAULT '',
    order_index INTEGER NOT NULL DEFAULT 0
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS grammar_patterns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    explanation_markdown TEXT NOT NULL DEFAULT '',
    examples TEXT NOT NULL DEFAULT '[]',
    lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS exercise_templates (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    generation_rules TEXT NOT NULL DEFAULT '{}',
    evaluation_rules TEXT NOT NULL DEFAULT '{}',
    difficulty_weight REAL NOT NULL DEFAULT 1.0
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS exercise_instances (
    id TEXT PRIMARY KEY,
    template_id TEXT REFERENCES exercise_templates(id) ON DELETE SET NULL,
    source_entity_type TEXT NOT NULL,
    source_entity_id TEXT NOT NULL,
    exercise_type TEXT NOT NULL,
    rendered_prompt TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    distractors TEXT NOT NULL DEFAULT '[]',
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS review_states (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default',
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    stability_score REAL NOT NULL DEFAULT 0,
    ease_score REAL NOT NULL DEFAULT 2.5,
    due_at TEXT NOT NULL,
    last_seen_at TEXT,
    success_count INTEGER NOT NULL DEFAULT 0,
    fail_count INTEGER NOT NULL DEFAULT 0,
    average_latency_ms REAL NOT NULL DEFAULT 0,
    current_stage TEXT NOT NULL DEFAULT 'new' CHECK(current_stage IN ('new', 'seen', 'recognized', 'recalled', 'stable', 'automated'))
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default',
    started_at TEXT NOT NULL,
    ended_at TEXT,
    mode TEXT NOT NULL CHECK(mode IN ('learn', 'practice', 'review', 'exam-simulation', 'writing-lab')),
    source_scope TEXT NOT NULL DEFAULT '{}',
    total_questions INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS session_answers (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    exercise_instance_id TEXT NOT NULL,
    user_answer TEXT NOT NULL,
    is_correct INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL DEFAULT 0,
    hint_used INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS writing_prompts (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    target_patterns TEXT NOT NULL DEFAULT '[]',
    expected_keywords TEXT NOT NULL DEFAULT '[]',
    difficulty REAL NOT NULL DEFAULT 1.0
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS writing_submissions (
    id TEXT PRIMARY KEY,
    prompt_id TEXT NOT NULL REFERENCES writing_prompts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL DEFAULT 'default',
    text TEXT NOT NULL,
    score REAL,
    feedback_json TEXT NOT NULL DEFAULT '{}',
    submitted_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS lesson_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default',
    lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed_at TEXT,
    vocabulary_mastered INTEGER NOT NULL DEFAULT 0,
    vocabulary_total INTEGER NOT NULL DEFAULT 0,
    writing_attempted INTEGER NOT NULL DEFAULT 0,
    grammar_score REAL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS sentence_vocabulary (
    sentence_id TEXT NOT NULL REFERENCES sentence_items(id) ON DELETE CASCADE,
    vocabulary_id TEXT NOT NULL REFERENCES vocabulary_items(id) ON DELETE CASCADE
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS sentence_grammar_pattern (
    sentence_id TEXT NOT NULL REFERENCES sentence_items(id) ON DELETE CASCADE,
    grammar_pattern_id TEXT NOT NULL REFERENCES grammar_patterns(id) ON DELETE CASCADE
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS item_tags (
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    tag TEXT NOT NULL
  )`);

  // Indexes
  db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_review_states_user_due ON review_states(user_id, due_at)`,
  );
  db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_session_answers_session ON session_answers(session_id)`,
  );
  db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_lessons_module_order ON lessons(module_id, order_index)`,
  );
  db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_class_groups_lesson_order ON class_groups(lesson_id, order_index)`,
  );
  db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_sentence_vocabulary_vocab ON sentence_vocabulary(vocabulary_id)`,
  );
  db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_writing_submissions_user ON writing_submissions(user_id, submitted_at)`,
  );
  db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id)`,
  );
  db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_vocabulary_class_group ON vocabulary_items(class_group_id)`,
  );
  db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_sentence_items_lesson ON sentence_items(lesson_id)`,
  );
  db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_dialogs_lesson ON dialogs(lesson_id)`,
  );
}
