import { lessonPackSchema } from '../../shared/schemas/lessonPack';
import type { AppDatabase } from '../db/index';
import { lessons, classGroups } from '../db/schema/courses';
import { vocabularyItems, sentenceItems, dialogs, dialogTurns } from '../db/schema/content';
import { grammarPatterns } from '../db/schema/grammar';
import { writingPrompts } from '../db/schema/writing';
import { verbs, verbConjugationSets, verbConjugationForms, lessonVerbs, sentenceVerbs } from '../db/schema/verbs';
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
    verbs: number;
    verbConjugationSets: number;
    verbConjugationForms: number;
    lessonVerbs: number;
    sentenceVerbs: number;
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

    // Upsert helper: delete existing by ID, then insert
    function upsert(table: any, idField: any, data: any) {
      const record = sanitizeRecord(data);
      if (record.id) {
        db.delete(table).where(eq(idField, record.id)).run();
      }
      db.insert(table).values(record).run();
    }

    // Upsert lesson with overridden moduleId and orderIndex
    const lessonData = sanitizeRecord({
      ...pack.lesson,
      moduleId: targetModuleId,
      orderIndex: nextOrder,
    });
    // Delete existing lesson (cascade handles children)
    db.delete(lessons).where(eq(lessons.id, pack.lesson.id)).run();
    db.insert(lessons).values(lessonData).run();
    const lessonId = pack.lesson.id;

    for (const cg of pack.classGroups) {
      upsert(classGroups, classGroups.id, { ...cg, lessonId });
      counts.classGroups++;
    }

    for (const v of pack.vocabulary) {
      upsert(vocabularyItems, vocabularyItems.id, v);
      counts.vocabulary++;
    }

    for (const s of pack.sentences) {
      upsert(sentenceItems, sentenceItems.id, { ...s, lessonId });
      counts.sentences++;
    }

    for (const d of pack.dialogs) {
      upsert(dialogs, dialogs.id, { ...d, lessonId });
      counts.dialogs++;
    }

    for (const dt of pack.dialogTurns) {
      upsert(dialogTurns, dialogTurns.id, dt);
      counts.dialogTurns++;
    }

    for (const gp of pack.grammarPatterns) {
      upsert(grammarPatterns, grammarPatterns.id, { ...gp, lessonId });
      counts.grammarPatterns++;
    }

    for (const wp of pack.writingPrompts) {
      upsert(writingPrompts, writingPrompts.id, { ...wp, lessonId });
      counts.writingPrompts++;
    }

    // Verb entities
    for (const v of pack.verbs) {
      upsert(verbs, verbs.id, v);
      counts.verbs++;
    }

    for (const vcs of pack.verbConjugationSets) {
      upsert(verbConjugationSets, verbConjugationSets.id, vcs);
      counts.verbConjugationSets++;
    }

    for (const vcf of pack.verbConjugationForms) {
      upsert(verbConjugationForms, verbConjugationForms.id, vcf as any);
      counts.verbConjugationForms++;
    }

    for (const lv of pack.lessonVerbs) {
      const rec = sanitizeRecord(lv as any);
      db.delete(lessonVerbs)
        .where(sql`lesson_id = ${rec.lessonId} AND verb_id = ${rec.verbId}`)
        .run();
      db.insert(lessonVerbs).values(rec).run();
      counts.lessonVerbs++;
    }

    for (const sv of pack.sentenceVerbs) {
      const rec = sanitizeRecord(sv as any);
      db.delete(sentenceVerbs)
        .where(sql`sentence_id = ${rec.sentenceId} AND verb_id = ${rec.verbId} AND surface_form = ${rec.surfaceForm}`)
        .run();
      db.insert(sentenceVerbs).values(rec).run();
      counts.sentenceVerbs++;
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
    verbs: 0,
    verbConjugationSets: 0,
    verbConjugationForms: 0,
    lessonVerbs: 0,
    sentenceVerbs: 0,
  };
}
