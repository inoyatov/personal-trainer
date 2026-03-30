import { lessonPackSchema } from '../../shared/schemas/lessonPack';
import type { AppDatabase } from '../db/index';
import { lessons, classGroups } from '../db/schema/courses';
import { vocabularyItems, sentenceItems, dialogs, dialogTurns } from '../db/schema/content';
import { grammarPatterns } from '../db/schema/grammar';
import { writingPrompts } from '../db/schema/writing';
import { sql, eq } from 'drizzle-orm';

export interface LessonImportResult {
  success: boolean;
  lessonId: string | null;
  counts: {
    classGroups: number;
    vocabulary: number;
    sentences: number;
    dialogs: number;
    dialogTurns: number;
    grammarPatterns: number;
    writingPrompts: number;
  };
  errors: string[];
}

function sanitize(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

function sanitizeRecord<T extends Record<string, unknown>>(record: T): T {
  const result = { ...record };
  for (const key of Object.keys(result)) {
    if (typeof result[key] === 'string') {
      (result as any)[key] = sanitize(result[key] as string);
    }
  }
  return result;
}

/**
 * Import a lesson pack into a specific module.
 * Overrides the lesson's moduleId and adjusts orderIndex.
 */
export function importLesson(
  db: AppDatabase,
  rawData: unknown,
  targetModuleId: string,
): LessonImportResult {
  const parseResult = lessonPackSchema.safeParse(rawData);
  if (!parseResult.success) {
    return {
      success: false,
      lessonId: null,
      counts: emptyCounts(),
      errors: parseResult.error.issues.map(
        (i) => `${i.path.join('.')}: ${i.message}`,
      ),
    };
  }

  const pack = parseResult.data;
  const counts = emptyCounts();

  try {
    db.run(sql`BEGIN TRANSACTION`);

    // Find the next orderIndex for lessons in this module
    const existingLessons = db
      .select()
      .from(lessons)
      .where(eq(lessons.moduleId, targetModuleId))
      .all();
    const nextOrder =
      existingLessons.length > 0
        ? Math.max(...existingLessons.map((l) => l.orderIndex)) + 1
        : 0;

    // Insert lesson with overridden moduleId and orderIndex
    const lessonData = sanitizeRecord({
      ...pack.lesson,
      moduleId: targetModuleId,
      orderIndex: nextOrder,
    });
    db.insert(lessons).values(lessonData).run();
    const lessonId = pack.lesson.id;

    for (const cg of pack.classGroups) {
      db.insert(classGroups)
        .values(sanitizeRecord({ ...cg, lessonId }))
        .run();
      counts.classGroups++;
    }

    for (const v of pack.vocabulary) {
      db.insert(vocabularyItems).values(sanitizeRecord(v)).run();
      counts.vocabulary++;
    }

    for (const s of pack.sentences) {
      db.insert(sentenceItems)
        .values(sanitizeRecord({ ...s, lessonId }))
        .run();
      counts.sentences++;
    }

    for (const d of pack.dialogs) {
      db.insert(dialogs)
        .values(sanitizeRecord({ ...d, lessonId }))
        .run();
      counts.dialogs++;
    }

    for (const dt of pack.dialogTurns) {
      db.insert(dialogTurns).values(sanitizeRecord(dt)).run();
      counts.dialogTurns++;
    }

    for (const gp of pack.grammarPatterns) {
      db.insert(grammarPatterns)
        .values(sanitizeRecord({ ...gp, lessonId }))
        .run();
      counts.grammarPatterns++;
    }

    for (const wp of pack.writingPrompts) {
      db.insert(writingPrompts)
        .values(sanitizeRecord({ ...wp, lessonId }))
        .run();
      counts.writingPrompts++;
    }

    db.run(sql`COMMIT`);

    return { success: true, lessonId, counts, errors: [] };
  } catch (err: any) {
    try {
      db.run(sql`ROLLBACK`);
    } catch {}
    return {
      success: false,
      lessonId: null,
      counts: emptyCounts(),
      errors: [err.message ?? 'Unknown import error'],
    };
  }
}

function emptyCounts(): LessonImportResult['counts'] {
  return {
    classGroups: 0,
    vocabulary: 0,
    sentences: 0,
    dialogs: 0,
    dialogTurns: 0,
    grammarPatterns: 0,
    writingPrompts: 0,
  };
}
