import { contentPackSchema, type ContentPack } from '../../shared/schemas/contentPack';
import type { AppDatabase } from '../db/index';
import {
  courses, modules, lessons, classGroups,
} from '../db/schema/courses';
import { vocabularyItems, sentenceItems, dialogs, dialogTurns } from '../db/schema/content';
import { grammarPatterns } from '../db/schema/grammar';
import { writingPrompts } from '../db/schema/writing';
import { verbs, verbConjugationSets, verbConjugationForms, lessonVerbs, sentenceVerbs } from '../db/schema/verbs';
import { sql, eq } from 'drizzle-orm';

export interface ImportResult {
  success: boolean;
  counts: {
    courses: number;
    modules: number;
    lessons: number;
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

/**
 * Sanitize a string to prevent XSS / injection.
 * Strips HTML tags and trims whitespace.
 */
function sanitize(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .trim();
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
 * Import a content pack into the database.
 * Validates with Zod, sanitizes strings, inserts transactionally.
 */
export function importContentPack(
  db: AppDatabase,
  rawData: unknown,
): ImportResult {
  const errors: string[] = [];

  // Validate
  const parseResult = contentPackSchema.safeParse(rawData);
  if (!parseResult.success) {
    const zodErrors = parseResult.error.issues.map(
      (i) => `${i.path.join('.')}: ${i.message}`,
    );
    return {
      success: false,
      counts: emptyCounts(),
      errors: zodErrors,
    };
  }

  const pack = parseResult.data;
  const counts = emptyCounts();

  try {
    // Use a transaction for atomicity
    db.run(sql`BEGIN TRANSACTION`);

    // Upsert helper: delete existing by ID, then insert
    function upsert(table: any, idField: any, data: any) {
      const record = sanitizeRecord(data);
      if (record.id) {
        db.delete(table).where(eq(idField, record.id)).run();
      }
      db.insert(table).values(record).run();
    }

    // Insert in dependency order (upsert: replaces existing on re-import)
    for (const c of pack.courses) {
      upsert(courses, courses.id, c);
      counts.courses++;
    }

    for (const m of pack.modules) {
      upsert(modules, modules.id, m);
      counts.modules++;
    }

    for (const l of pack.lessons) {
      upsert(lessons, lessons.id, l);
      counts.lessons++;
    }

    for (const cg of pack.classGroups) {
      upsert(classGroups, classGroups.id, cg);
      counts.classGroups++;
    }

    for (const v of pack.vocabulary) {
      upsert(vocabularyItems, vocabularyItems.id, v);
      counts.vocabulary++;
    }

    for (const s of pack.sentences) {
      upsert(sentenceItems, sentenceItems.id, s);
      counts.sentences++;
    }

    for (const d of pack.dialogs) {
      upsert(dialogs, dialogs.id, d);
      counts.dialogs++;
    }

    for (const dt of pack.dialogTurns) {
      upsert(dialogTurns, dialogTurns.id, dt);
      counts.dialogTurns++;
    }

    for (const gp of pack.grammarPatterns) {
      upsert(grammarPatterns, grammarPatterns.id, gp);
      counts.grammarPatterns++;
    }

    for (const wp of pack.writingPrompts) {
      upsert(writingPrompts, writingPrompts.id, wp);
      counts.writingPrompts++;
    }

    // Verb entities (must come after lessons/sentences for FK order)
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

    // lessonVerbs and sentenceVerbs have composite keys — delete by lesson/sentence + verb
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

    return { success: true, counts, errors: [] };
  } catch (err: any) {
    try {
      db.run(sql`ROLLBACK`);
    } catch {
      // rollback may fail if transaction wasn't started
    }
    return {
      success: false,
      counts: emptyCounts(),
      errors: [err.message ?? 'Unknown import error'],
    };
  }
}

function emptyCounts(): ImportResult['counts'] {
  return {
    courses: 0,
    modules: 0,
    lessons: 0,
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
